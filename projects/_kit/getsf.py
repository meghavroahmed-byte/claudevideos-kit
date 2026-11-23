# getsf.py search "<query>" [animated]      -> list candidates (CC0 / CC-BY only, downloadable)
# getsf.py get <uid> <name>                 -> download glb to _assets/sf/<name>.glb, record credit in _assets/sf/CREDITS.json
import sys, os, json, urllib.request, urllib.parse
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_assets', 'sf')
H = {'Authorization': 'Token proxy-injected', 'User-Agent': 'asset-fetch/1.0'}
OK = {'CC Attribution', 'CC0 Public Domain', 'Free Standard'}
import time, urllib.error
def get(u, auth=True):
    for i in range(8):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=H if auth else {'User-Agent': 'asset-fetch/1.0'}), timeout=300).read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < 7: time.sleep(20 * (i + 1)); continue
            raise
if sys.argv[1] == 'search':
    q = {'type': 'models', 'q': sys.argv[2], 'downloadable': 'true', 'count': 24, 'sort_by': '-likeCount'}
    if len(sys.argv) > 3 and sys.argv[3] == 'animated': q['animated'] = 'true'
    d = json.loads(get('https://api.sketchfab.com/v3/search?' + urllib.parse.urlencode(q), False))
    for m in d['results']:
        lic = (m.get('license') or {}).get('label', '')
        if lic in OK: print(m['uid'], f"{m['faceCount']:>7}f anim{m.get('animationCount', 0):>2} {m['likeCount']:>5}♥ {lic[:14]:14} {m['name'][:50]} — {m['user']['username']}")
else:
    uid, name = sys.argv[2], sys.argv[3]; os.makedirs(A, exist_ok=True)
    info = json.loads(get(f'https://api.sketchfab.com/v3/models/{uid}', False))
    lic = (info.get('license') or {}).get('label', '')
    assert lic in OK, f'license not allowed: {lic}'
    d = json.loads(get(f'https://api.sketchfab.com/v3/models/{uid}/download'))
    open(f'{A}/{name}.glb', 'wb').write(get(d['glb']['url'], False))
    cf = f'{A}/CREDITS.json'; c = json.load(open(cf)) if os.path.exists(cf) else {}
    c[name] = {'uid': uid, 'title': info['name'], 'author': info['user']['displayName'] or info['user']['username'], 'license': lic, 'url': info['viewerUrl']}
    json.dump(c, open(cf, 'w'), indent=1); print('ok', name, os.path.getsize(f'{A}/{name}.glb') // 1024, 'KB', lic, info['user']['username'])
