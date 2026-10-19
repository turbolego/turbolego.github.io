const BASE = 'https://mobiwinqa.bmsystem.se/PlogNorge/Home';
const TILE_OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_GEO = 'https://maps.gebo.io/geoserver/geonorge/wms?service=WMS&request=GetMap&layers=tilgjengelighet&format=image/png&transparent=true';
const STATUS_EL = document.getElementById('status');
const LOG_EL = document.getElementById('log');
const GROUP_SELECT = document.getElementById('groupSelect');
const ENABLE_BTN = document.getElementById('enableNotif');
const CLEAR_BTN = document.getElementById('clearArea');

const map = L.map('map', { zoomControl:true }).setView([59.91,10.75], 9);
window.map = map;
L.tileLayer(TILE_OSM, { maxZoom:19, attribution:'© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
// L.tileLayer(TILE_GEO, { maxZoom:17, attribution:'Geonorge' }).addTo(map); // Temporarily disabled due to service unavailability

const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: {
    polygon: {
      shapeOptions: { color: '#facc15', weight: 3 },
      showArea: true,
      allowIntersection: false,
      drawError: { color: '#e1e100', message: '<strong>Error:</strong> shape edges cannot cross!'
      }
    },
    polyline: false,
    rectangle: { shapeOptions: { color: '#facc15', weight: 3 }},
    circle: false,
    marker: false,
    circlemarker: false
  }
});
map.addControl(drawControl);
// Inject black glyph icons into the draw toolbar buttons, the same way Leaflet renders
// the zoom +/- (a real aria-hidden <span> with text inside the anchor). CSS pseudo-elements
// on the button's sr-only inner span are clipped, so DOM text is the reliable approach.
const DRAW_GLYPHS = {
  'leaflet-draw-draw-polygon': '◼',
  'leaflet-draw-draw-rectangle': '▭',
  'leaflet-draw-edit-edit': '✏',
  'leaflet-draw-edit-remove': '✕'
};
function injectDrawIcons(){
  document.querySelectorAll('.leaflet-draw-toolbar a').forEach(a => {
    if(a.querySelector('.draw-glyph')) return;
    let glyph = null;
    for(const cls in DRAW_GLYPHS){
      if(a.classList.contains(cls)){ glyph = DRAW_GLYPHS[cls]; break; }
    }
    if(!glyph) return;
    const s = document.createElement('span');
    s.className = 'draw-glyph';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = glyph;
    a.appendChild(s);
  });
}
// Control buttons are created when the control is added; retry a few times in case the
// toolbar is built slightly after addControl() returns.
injectDrawIcons();
setTimeout(injectDrawIcons, 200);
setTimeout(injectDrawIcons, 1000);
map.on(L.Draw.Event.DRAWSTART, e => { drawnItems.clearLayers(); });
map.on(L.Draw.Event.CREATED, e => {
  drawnItems.addLayer(e.layer);
  saveArea();
  log('Area selected');
  updateStatus();
});
map.on(L.Draw.Event.EDITED, e => { saveArea(); log('Area edited'); });
map.on(L.Draw.Event.DELETED, e => { saveArea(); log('Area deleted'); });

let currentGroupId = null;
let pollInterval = 5;
let pollTimer = null;
let lastVisitsHash = '';

function log(msg){ LOG_EL.textContent = new Date().toISOString()+' '+msg+'\n'+LOG_EL.textContent; }
function updateStatus(s){ STATUS_EL.textContent = s ?? STATUS_EL.textContent; }

async function api(path, opts={}) {
  // Use r.jina.ai proxy for GET to bypass CORS; POST needs real endpoint with cookies
  let url = BASE+path;
  if ((opts.method||'GET').toUpperCase()==='GET') {
    url = 'https://r.jina.ai/http://mobiwinqa.bmsystem.se' + path.replace(/^\/PlogNorge/, '');
  }
  const res = await fetch(url, {
    credentials:'include',
    headers: { 'Accept':'application/json, text/javascript, */*; q=0.01', 'Content-Type':'application/json', 'X-Requested-With':'XMLHttpRequest', ...(opts.headers||{}) } ,
    ...opts
  });
  const txt = await res.text();
  // r.jina.ai wraps output with markdown header, strip it
  const cleaned = txt.replace(/^Title:.*\n\nURL Source:.*\n\nMarkdown Content:\n?/, '');
  try { return JSON.parse(cleaned); } catch { return cleaned; }
}

async function loadGroups(){
  try {
    const data = await api('/GetStatusGroups');
    if(!Array.isArray(data)) throw new Error('Unexpected');
    GROUP_SELECT.innerHTML = '<option value="">Select group...</option>';
    data.forEach(g => {
      const o = document.createElement('option');
      o.value = g.Id ?? g.id;
      o.textContent = g.Name ?? g.name ?? String(g.Id);
      GROUP_SELECT.appendChild(o);
    });
    log('Loaded '+data.length+' groups');
  } catch(e){ 
    log('Groups error: '+e); 
    GROUP_SELECT.innerHTML = '<option value="64">64 - Bærum (fallback)</option>';
  }
}
GROUP_SELECT.onchange = e => { currentGroupId = e.target.value; localStorage.setItem('groupId', currentGroupId); startPolling(); log('Group '+currentGroupId); };

async function loadPollInterval(){
  try { pollInterval = Number(await api('/GetStatusGroupsPollIntervalMinutes'))||5; log('Poll interval '+pollInterval+' min'); } catch(e){}
}

async function loadStaticMapData() {
  try {
    const res = await fetch('data/static-roads.geojson');
    const data = await res.json();
    const layer = L.geoJSON(data, {
      style: f => {
        const color = f.properties?.color || '#94a3b8';
        const type = f.properties?.type || '';
        let weight = 4;
        if (type === 'notVisited') weight = 3;
        else if (type === 'visitedRecently') weight = 5;
        else if (type === 'maintenance') weight = 4;
        return { color, weight };
      }
    }).addTo(map);
    window.__staticDataLoaded = true;
    return layer;
  } catch(e) { log('Static map data error: '+e); return null; }
}

async function loadDynamicMapData() {
  if(!currentGroupId) return;
  try {
    const visits = await api('/GetVisits', { method:'POST', body: JSON.stringify({ Date: new Date().toISOString(), StatusGroupId: Number(currentGroupId) }) });
    if(!visits) return;
    renderVisits(visits);
  } catch(e) { log('Dynamic map data error: '+e); }
}

function pointInPolygon(pt, poly){
  const [x,y]=pt; let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i], [xj,yj]=poly[j];
    const intersect = ((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi);
    if(intersect) inside=!inside;
  }
  return inside;
}
function getAreaPolygons(){
  const layers = drawnItems.getLayers();
  if(!layers.length) return [];
  const geom = layers[0].toGeoJSON().geometry;
  if(geom.type==='Polygon') return [geom.coordinates[0].map(c=>[c[1],c[0]])];
  if(geom.type==='MultiPolygon') return geom.coordinates.map(p=>p[0].map(c=>[c[1],c[0]]));
  return [];
}

function renderVisits(visits){
  // clear old
  map.eachLayer(l => { if(l.options && l.options.isVisit) map.removeLayer(l); });
  if(!Array.isArray(visits)) return;
  visits.forEach(v => {
    const pts = v.Points ?? v.points ?? v.Tracks ?? [];
    if(!Array.isArray(pts)) return;
    const latlngs = pts.map(p => [p.Lat??p.lat, p.Lon??p.lon??p.lng]);
    if(latlngs.length<2) return;
    const poly = L.polyline(latlngs, { color:'#22c55e', weight:3 }).addTo(map);
    poly.options.isVisit = true;
    // mark if inside area
    const polys = getAreaPolygons();
    if(polys.length){ const inside = latlngs.some(ll => polys.some(p=>pointInPolygon(ll,p))); if(inside){ poly.setStyle({color:'#facc15', weight:5}); } }
  });
}

async function checkStatus(){
  if(!currentGroupId) return;
  await loadDynamicMapData();
  const visits = await api('/GetVisits', { method:'POST', body: JSON.stringify({ Date: new Date().toISOString(), StatusGroupId: Number(currentGroupId) }) });
  if(!visits) return;
  const hash = JSON.stringify(visits);
  if(hash!==lastVisitsHash){
    lastVisitsHash = hash;
    if(Notification.permission==='granted'){
      const polys = getAreaPolygons();
      const relevant = polys.length ? 'in selected area' : '';
      new Notification('PlogeKart update', { body: 'Snowplow status changed for group '+currentGroupId+' '+relevant });
    }
    log('Visits updated');
  }
  // Detect color change inside drawn area
  if(getAreaPolygons().length){
    const colorChanges = detectColorChanges(visits);
    if(colorChanges.length){
      if(Notification.permission==='granted'){
        new Notification('PlogeKart color change', { body: colorChanges.length+' road segment(s) changed color inside area for group '+currentGroupId });
      }
      log('Color changes inside area: '+colorChanges.length);
    }
  }
}

let lastColorSnapshot = {};
function detectColorChanges(visits){
  const polys = getAreaPolygons();
  if(!polys.length) return [];
  const changes = [];
  const mov = visits.MaintenanceObjectVisits || [];
  for(const item of mov){
    const wkt = item.Wkt || '';
    const color = item.Color || '';
    const id = item.Id;
    if(lastColorSnapshot[id] && lastColorSnapshot[id] !== color){
      changes.push({id, from:lastColorSnapshot[id], to:color});
    }
    lastColorSnapshot[id] = color;
  }
  return changes;
}

function startPolling(){
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(checkStatus, pollInterval*60*1000);
  checkStatus();
}

ENABLE_BTN.onclick = async () => {
  if(Notification.permission==='default'){
    await Notification.requestPermission();
  }
  log('Notifications permission: '+Notification.permission);
};
CLEAR_BTN.onclick = () => { drawnItems.clearLayers(); localStorage.removeItem('area'); log('Area cleared'); };

function saveArea(){
  const layers = drawnItems.getLayers();
  if(!layers.length){ localStorage.removeItem('area'); return; }
  const gj = layers[0].toGeoJSON();
  localStorage.setItem('area', JSON.stringify(gj));
  localStorage.setItem('areaTimestamp', Date.now().toString());
}
function loadArea(){
  const a = localStorage.getItem('area');
  if(!a) return;
  try{ const gj = JSON.parse(a); L.geoJSON(gj).eachLayer(l=>drawnItems.addLayer(l)); }catch(e){}
}

document.addEventListener('DOMContentLoaded', async () => {
  loadArea();
  await loadPollInterval();
  await loadGroups();
  const saved = localStorage.getItem('groupId');
  if(saved){ GROUP_SELECT.value = saved; currentGroupId = saved; }
  await loadStaticMapData();
  startPolling();
  updateStatus('Ready');
  // PWA
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(e=>log('SW error '+e)); }

  // Settings modal
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeBtn = settingsModal.querySelector('.close');
  if(settingsBtn && settingsModal && closeBtn){
    settingsBtn.onclick = () => { settingsModal.style.display = 'block'; };
    closeBtn.onclick = () => { settingsModal.style.display = 'none'; };
    window.onclick = e => { if(e.target === settingsModal) settingsModal.style.display = 'none'; };
  }
});