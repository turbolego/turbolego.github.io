const BASE = 'https://mobiwinqa.bmsystem.se/PlogNorge/Home';
const TILE = 'https://maps.bmsystem.se/osm/standard';
const STATUS_EL = document.getElementById('status');
const LOG_EL = document.getElementById('log');
const GROUP_SELECT = document.getElementById('groupSelect');
const ENABLE_BTN = document.getElementById('enableNotif');
const CLEAR_BTN = document.getElementById('clearArea');

const map = L.map('map', { zoomControl:true }).setView([59.91,10.75], 9);
L.tileLayer(TILE+'/{z}/{x}/{y}.png', { maxZoom:19, attribution:'© BM System' }).addTo(map);

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
  const res = await fetch(BASE+path, {
    credentials:'include',
    headers: { 'Accept':'application/json, text/javascript, */*; q=0.01', 'Content-Type':'application/json', 'X-Requested-With':'XMLHttpRequest', ...(opts.headers||{}) },
    ...opts
  });
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
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

async function fetchVisits(){
  if(!currentGroupId) return null;
  const payload = { Date: new Date().toISOString(), StatusGroupId: Number(currentGroupId) };
  const data = await api('/GetVisits', { method:'POST', body: JSON.stringify(payload) });
  return data;
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
  const visits = await fetchVisits();
  if(!visits) return;
  renderVisits(visits);
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
  startPolling();
  updateStatus('Ready');
  // PWA
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(e=>log('SW error '+e)); }
});
