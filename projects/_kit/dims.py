# dims.py name...: approximate bounding box (metres) of Poly Haven gltf models (applies node translation/scale, ignores rotation)
import json, sys, os
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_assets')
for n in sys.argv[1:]:
    g = json.load(open(f'{A}/{n}/{n}.gltf')); lo = [1e9] * 3; hi = [-1e9] * 3
    def walk(i, T=(0, 0, 0), S=(1, 1, 1)):
        nd = g['nodes'][i]; s = nd.get('scale', [1, 1, 1]); t = nd.get('translation', [0, 0, 0])
        T2 = [T[k] + t[k] * S[k] for k in range(3)]; S2 = [S[k] * s[k] for k in range(3)]
        if 'mesh' in nd:
            for p in g['meshes'][nd['mesh']]['primitives']:
                a = g['accessors'][p['attributes']['POSITION']]
                for k in range(3): lo[k] = min(lo[k], T2[k] + a['min'][k] * S2[k]); hi[k] = max(hi[k], T2[k] + a['max'][k] * S2[k])
        for c in nd.get('children', []): walk(c, T2, S2)
    for r in g['scenes'][0]['nodes']: walk(r)
    print(f"{n}: x {lo[0]:.2f}..{hi[0]:.2f}  y {lo[1]:.2f}..{hi[1]:.2f}  z {lo[2]:.2f}..{hi[2]:.2f}")
