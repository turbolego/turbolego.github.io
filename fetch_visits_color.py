import json
import re
import requests

url = 'https://mobiwinqa.bmsystem.se/PlogNorge/Home/GetVisits'
headers = {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'content-type': 'application/json; charset=UTF-8',
    'origin': 'https://mobiwinqa.bmsystem.se',
    'referer': 'https://mobiwinqa.bmsystem.se/PlogNorge/baerum?groupId=64',
    'sec-ch-ua': '"Google Chrome";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15.7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
    'cookie': '.AspNetCore.Antiforgery.JVOPeRJG2w4=CfDJ8BwmujhEe3NIgqHmU80dK4W7_xs3qkOzMnrjdCb7Y8ofEvIhGZtS6piSzO4p-QSouUuaigYtWeU4B1Qt8QzLX_x-1avPTfb_uSFZUzyHBej4EzvvaBaEkXoRuSYeI2CMxYgIzexFc99k7q0bP5oTlHg; ARRAffinity=2933deadc33526b4602e5c75c92c42c7d86a069396ec9b6a768185d0be5ef77e; cwr_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNmNmNjBmNS03ZmY5LTRhMGUtOTVkNC1jZjYxZjNlZjY5NjMiLCJpYXQiOjE3OTIwNTUyOTMsImluc3RhbmNlIjoiYmFlcnVtIiwic3lzdGVtSWQiOiIyIiwibG9jYWxlIjoibm8tTk8iLCJuYmYiOjE3OTIwNTUyOTMsImV4cCI6MTc5MjA1ODg5MywiaXNzIjoiQ3VzdG9tZXJXZWIiLCJhdWQiOiJDdXN0b21lcldlYiJ9.Lt_qfIGYAU_F7Np32IKhJhhV5cd9TdH-_pPUzLR9jA0',
    'dnt': '1',
    'priority': 'u=1, i'
}
data = '{"Date":"2026-10-15T09:08:14.691Z","StatusGroupId":64}'
resp = requests.post(url, headers=headers, data=data, verify=False)
resp.raise_for_status()
result = resp.json()

def parse_wkt_linestring(wkt):
    match = re.search(r'LINESTRING\s*\((.*)\)', wkt, re.IGNORECASE)
    if not match:
        return []
    inner = match.group(1).strip()
    parts = [p.strip() for p in inner.split(',')]
    coords = []
    for p in parts:
        if not p:
            continue
        xy = p.split()
        if len(xy) >= 2:
            try:
                x = float(xy[0])
                y = float(xy[1])
                coords.append([x, y])
            except:
                pass
    return coords

features = []
# NotVisitedRoadLinks – we don't have Color, use red
for item in result.get('NotVisitedRoadLinks', []):
    coords = [[p['Lng'], p['Lat']] for p in item['Coordinates']]
    features.append({
        "type": "Feature",
        "properties": {"type": "notVisited", "color": "#ff3300"},
        "geometry": {"type": "LineString", "coordinates": coords}
    })
# VisitedRoadLinksModel – not present
for item in result.get('VisitedRoadLinksModel', []):
    coords = [[p['Lng'], p['Lat']] for p in item['Coordinates']]
    features.append({
        "type": "Feature",
        "properties": {"type": "visited", "color": "#22c55e"},
        "geometry": {"type": "LineString", "coordinates": coords}
    })
# RecentlyVisitedRoadLinks – not present
for item in result.get('RecentlyVisitedRoadLinks', []):
    coords = [[p['Lng'], p['Lat']] for p in item['Coordinates']]
    features.append({
        "type": "Feature",
        "properties": {"type": "visitedRecently", "color": "#3b82f6"},
        "geometry": {"type": "LineString", "coordinates": coords}
    })
# MaintenanceObjectVisits – use Color from API
for item in result.get('MaintenanceObjectVisits', []):
    wkt = item.get('Wkt','')
    coords = parse_wkt_linestring(wkt)
    if coords:
        color = item.get('Color', '#22c55e')
        # infer type from color to keep styling consistent
        # #ff3300 -> red, #22c55e -> green, #3b82f6 -> blue
        # We'll just pass color through
        features.append({
            "type": "Feature",
            "properties": {"color": color, "type": "maintenance"},
            "geometry": {"type": "LineString", "coordinates": coords}
        })

geojson = {"type": "FeatureCollection", "features": features}
with open('data/static-roads.geojson', 'w') as f:
    json.dump(geojson, f, indent=2)
print(f'Written {len(features)} features')
# Count colors
from collections import Counter
cnt = Counter(f['properties'].get('color') for f in features)
print('Color counts:', cnt)
