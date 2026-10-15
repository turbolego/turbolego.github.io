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
L.tileLayer(TILE_GEO, { maxZoom:17, attribution:'Geonorge' }).addTo(map);

const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({ edit:{ featureGroup: drawnItems }, draw:{ polygon:true, polyline:false, rectangle:true, circle:false, marker:false, circlemarker:false }});
map.addControl(drawControl);
map.on(L.Draw.Event.CREATED, e => { drawnItems.clearLayers(); drawnItems.addLayer(e.layer); saveArea(); log('Area selected'); updateStatus(); });

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
    GROUP_SELECT.innerHTML = '';
    data.forEach(g => {
      const o = document.createElement('option');
      o.value = g.Id ?? g.id;
      o.textContent = g.Name ?? g.name ?? String(g.Id);
      GROUP_SELECT.appendChild(o);
    });
    log('Loaded '+data.length+' groups');
  } catch(e){ log('Groups error: '+e); }
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
  localStorage.setItem('area', JSON.stringify(layers[0].toGeoJSON()));
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
});