# mksfx.py <proj> <dur> <seed> <timeline_file>  -> writes projects/<proj>/sfx.py with all needed palette funcs pulled from other projects
import ast, sys, glob, re, os
proj, dur, seed, tlf = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
P = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
base = open(f'{P}/hiccups/sfx.py').read()
head = base[:base.index("# ---------------- timeline ----------------")]
head = re.sub(r"DUR = [0-9.]+", f"DUR = {dur}", head); head = re.sub(r"default_rng\(\d+\)", f"default_rng({seed})", head)
tl = open(tlf).read()
extra = tl.split('# ---- timeline')[0] if '# ---- timeline' in tl else ''
body = tl.split('# ---- timeline')[1] if '# ---- timeline' in tl else tl
defs = {}
for f in sorted(glob.glob(f'{P}/*/sfx.py')):
    if f.endswith(f'/{proj}/sfx.py'): continue
    src = open(f).read()
    try: tree = ast.parse(src)
    except Exception: continue
    for n in tree.body:
        if isinstance(n, ast.FunctionDef) and n.name not in defs: defs[n.name] = ast.get_source_segment(src, n)
have = set(re.findall(r"^def (\w+)", head + extra, re.M)) | {"put"}
need = []
def scan(code):
    for name in set(re.findall(r"\b(\w+)\(", code)):
        if name in defs and name not in have and name not in need:
            need.append(name); scan(defs[name])
scan(extra + body)
out = head + "\n".join(defs[n] for n in need) + "\n" + extra + "\n# ---------------- timeline ----------------\n" + '''bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g
''' + body + f'''
bed = lp(bed, 5000, 4)
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.01, 0.3, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_{proj}_{{n}}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
'''
open(f'{P}/{proj}/sfx.py', 'w').write(out); print('pulled', need)
