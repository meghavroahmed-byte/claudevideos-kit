import json, urllib.request, concurrent.futures as cf
H={'User-Agent':'asset-fetch/1.0'}
d=json.load(open('ph_models.json'))
def sz(n):
    try:
        f=json.loads(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{n}',headers=H),timeout=60).read())['gltf']['1k']['gltf']
        return n, f['size']+sum(v['size'] for v in f.get('include',{}).values())
    except Exception as e: return n, -1
with cf.ThreadPoolExecutor(16) as ex: r=dict(ex.map(sz, d))
json.dump(r, open('ph_sizes.json','w'))
v=[x for x in r.values() if x>0]; print(len(v), sum(v)/1e9, 'GB', sorted(v)[-5:])
