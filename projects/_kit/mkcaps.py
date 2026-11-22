# mkcaps.py <proj>: one-word captions from script.txt words, timed by aligning to audio/vo.words.json (handles respelled spoken.txt)
import json, re, sys, difflib, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', sys.argv[1])
W = json.load(open(f'{P}/audio/vo.words.json'))
S = open(f'{P}/script.txt').read().split()
norm = lambda w: re.sub(r"[^a-z0-9]", '', w.lower())
a = [norm(x) for x in S]; b = [norm(x['w']) for x in W]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
st = [None] * len(S)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1): st[i1 + k] = W[j1 + k]['s']
    elif j2 > j1:  # replaced: spread script words over the spoken span
        s0, s1 = W[j1]['s'], W[j2 - 1]['e']
        for k in range(i2 - i1): st[i1 + k] = round(s0 + (s1 - s0) * k / max(1, i2 - i1), 2)
for i in range(len(st)):  # fill gaps
    if st[i] is None: st[i] = st[i - 1] + 0.15 if i else 0.0
end = round(W[-1]['e'] + 0.35, 2)
out = 'export const CAPTIONS = [\n' + ',\n'.join(f'  [{t}, {json.dumps(w.upper().rstrip('.,;:'))}]' for t, w in zip(st, S)) + f'\n];\nexport const CAP_END = {end};\n'
open(f'{P}/src/caps.js', 'w').write(out); print('caps', len(S), 'end', end)
