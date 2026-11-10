# align.py: line timings for a voiceover from its script, without whisper.
# Splits the script into clauses (at ! ? । , ; : and newlines), finds speech segments with ffmpeg
# silencedetect, then a DP assigns consecutive clauses to each segment so that
# (chars / speaking-rate) matches each segment's length. Works well for clean TTS / studio voice.
# Usage: python3 align.py voice.wav script.txt lines.json [noise_db=-35] [min_sil=0.25]
# Output: [[start, end, "text"], ...] and a printed table. Check the cost: < ~15 is a good fit.
import re, sys, json, subprocess, functools

wav, script, out = sys.argv[1:4]
noise = sys.argv[4] if len(sys.argv) > 4 else '-35'
dmin = sys.argv[5] if len(sys.argv) > 5 else '0.25'
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
txt = open(script, encoding='utf-8').read()
cl = [c.strip() for c in re.split(r'(?<=[!?।,;:])\s+|\n', txt) if c.strip()]
log = subprocess.run(['ffmpeg', '-i', wav, '-af', f'silencedetect=noise={noise}dB:d={dmin}', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
# speech = gaps between silences (handles leading silence or not)
segs, cur = [], 0.0
for s, e in zip(st, en):
    if s - cur > 0.05: segs.append((cur, s))
    cur = e
if dur - cur > 0.05: segs.append((cur, dur))
L = lambda c: len(re.sub(r'\s', '', c))
rate = sum(map(L, cl)) / sum(b - a for a, b in segs)
n, m = len(cl), len(segs)
if m > n: print(f'WARNING: {m} speech segments > {n} clauses; raise min_sil or noise threshold')

@functools.lru_cache(None)
def f(i, j):
    if i == n and j == m: return (0.0, ())
    if i == n or j == m: return (1e9, ())
    best, acc = (1e9, ()), 0
    for k in range(i, n):
        acc += L(cl[k]); r = f(k + 1, j + 1); c = (acc / rate - (segs[j][1] - segs[j][0])) ** 2 + r[0]
        if c < best[0]: best = (c, ((i, k),) + r[1])
    return best

sys.setrecursionlimit(10000)
cost, asg = f(0, 0)
res = []
for (i, k), (a, b) in zip(asg, segs):
    s = ' '.join(cl[i:k + 1]); res.append([round(a, 2), round(b, 2), s])
    print(f'{a:6.2f}-{b:6.2f} ({b - a:4.1f}s) | {s}')
print(f'clauses {n}  segments {m}  cost {cost:.1f}  duration {dur:.2f}s')
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
