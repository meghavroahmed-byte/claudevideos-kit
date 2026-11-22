# getph.py name [name...]  -> downloads Poly Haven models (gltf 1k) / hdris (2k hdr, prefix hdri:) / textures (tex:) into projects/_assets
import sys, os, json, urllib.request
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_assets')
H = {'User-Agent': 'asset-fetch/1.0'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120).read()
def save(p, u):
    if os.path.exists(p): return
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(get(u))
for n in sys.argv[1:]:
    try:
        if n.startswith('hdri:'):
            n = n[5:]; f = json.loads(get(f'https://api.polyhaven.com/files/{n}'))
            save(f'{A}/hdri/{n}.hdr', f['hdri']['2k']['hdr']['url'])
        elif n.startswith('tex:'):
            n = n[4:]; f = json.loads(get(f'https://api.polyhaven.com/files/{n}'))
            for k, key in (('diff', 'Diffuse'), ('nor', 'nor_gl'), ('rough', 'Rough')):
                if key in f: save(f'{A}/tex/{n}_{k}.jpg', f[key]['1k']['jpg']['url'])
        else:
            if os.path.exists(f'{A}/{n}/{n}.gltf'): continue
            f = json.loads(get(f'https://api.polyhaven.com/files/{n}'))['gltf']['1k']['gltf']
            save(f'{A}/{n}/{n}.gltf', f['url'])
            for rel, inc in f.get('include', {}).items(): save(f'{A}/{n}/{rel}', inc['url'])
        print('ok', n)
    except Exception as e: print('FAIL', n, e)
