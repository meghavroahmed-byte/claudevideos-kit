# sfx_dv.py: SFX track for the déjà vu long video from real recorded Mixkit sounds (../smriti-2d/mixkit/n/<id>.wav).
# Cues come from the render meta (parts/p*.mp4.json: cuts, pops, beats) plus story moments found in lines.json.
# Rules from the user: no whoosh spam, no generic "tok tok": chapter = reverse swell into a hit, normal cuts = soft
# rotating UI tones, element pops sparse and quiet, and themed real sounds at story moments.
# Usage: python3 sfx_dv.py <out.wav> <duration_s>
import glob, json, sys, wave
import numpy as np

SR = 44100
LIB = '../smriti-2d/mixkit/n'
def load(i):
    with wave.open(f'{LIB}/{i}.wav') as w: return np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2) / 32768.0

meta = {'cuts': set(), 'pops': set(), 'beats': []}
for f in sorted(glob.glob('parts/[pq]*.mp4.json')):
    m = json.load(open(f)); meta['cuts'] |= set(m['cuts']); meta['pops'] |= set(m['pops']); meta['beats'] = m['beats'] or meta['beats']
beats = {round(b[0], 2): b for b in meta['beats']}
lines = json.load(open('lines.json'))
def at(s):  # start time of the first clause containing s
    for a, e, t in lines:
        if s in t: return a
    raise SystemExit('anchor not found: ' + s)

RISE, HIT = [786, 2673, 2671, 2669], [563, 677, 2900, 565]
CUT, GLITCH, POP = [2568, 3124, 2573, 2577, 3005], [2946, 1031, 1034, 2595], [2357, 2356, 2364, 1120, 2354]
cues = []  # (time, id, level, opts)
n = {'r': 0, 'c': 0, 'g': 0, 'p': 0}
for c in sorted(meta['cuts']):
    b = beats.get(round(c, 2)); tpl, tr = (b[1], b[2]) if b else ('', '')
    if tpl == 'chapter': cues += [(c, RISE[n['r'] % 4], 0.5, dict(peak=True, dur=0.4)), (c, HIT[n['r'] % 4], 0.6, dict(dur=2.5))]; n['r'] += 1
    elif tr == 'glitch': cues.append((c, GLITCH[n['g'] % 4], 0.4, {})); n['g'] += 1
    elif tr == 'flash': cues.append((c, HIT[n['r'] % 4], 0.65, dict(dur=2.5)))
    else: cues.append((c, CUT[n['c'] % 5], 0.22, {})); n['c'] += 1
last = -9
for p in sorted(meta['pops']):  # sparse: one pop per 3 s, never on top of a cut
    if p - last < 3 or any(abs(p - c) < 0.5 for c in meta['cuts']): continue
    cues.append((p, POP[n['p'] % 5], 0.16, {})); n['p'] += 1; last = p
STORY = [('নতুন জায়গায়', 490, 0.55, {}), ('আগেও দেখেছেন', 1087, 0.45, dict(dur=3.0)), ('ম্যাট্রিক্স', 1022, 0.45, {}),
         ('খিঁচুনি শুরু', 497, 0.45, dict(dur=3.0)), ('হালকা বিদ্যুৎ', 2598, 0.4, {}), ('সুইচ টিপলেন', 2585, 0.5, {}), ('সুইচ টিপলেন', 2601, 0.35, dict(off=0.3, dur=1.5)),
         ('নোটিফিকেশন', 2354, 0.4, {}), ('ভেতরে কিছুই', 2569, 0.4, {}), ('ভার্চুয়াল রিয়ালিটির', 2669, 0.4, {}), ('এটাই দেজা ভ্যু', 1086, 0.4, dict(dur=2.5)),
         ('ফ্লু-তে আক্রান্ত', 2221, 0.4, {}), ('দুটো ওষুধ', 1124, 0.4, {}), ('এফএমআরআই', 905, 0.3, dict(dur=2.5)), ('সম্পূর্ণ উল্টো', 2900, 0.6, dict(dur=2.5)),
         ('পত্রিকা অফিসের', 1097, 0.4, dict(dur=2.0)), ('তথ্যটা তো ভুল', 2998, 0.5, {}), ('বারবার লিখতে', 2367, 0.4, {}), ('ইগ নোবেল', 476, 0.4, dict(dur=3.5)),
         ('কমেন্ট করে', 2357, 0.35, {}), ('ঠিকঠাক কাজ', 3108, 0.45, {})]
cues += [(at(a), i, l, o) for a, i, l, o in STORY]

def main(out, dur):
    L = np.zeros((int(dur * SR) + 12 * SR, 2)); cache = {}
    for t, i, lvl, o in cues:
        x = cache.setdefault(i, load(i)); x = x[int(o.get('off', 0) * SR):]
        pk = int(np.argmax(np.abs(x).max(1))); start = t - (pk / SR if o.get('peak') else 0)
        if o.get('peak'): x = x[:pk + int(o.get('dur', 0.5) * SR)]
        elif 'dur' in o: x = x[:int(o['dur'] * SR)]
        x = x * (lvl / max(1e-6, np.abs(x).max())); f = min(len(x), int(0.25 * SR)); x[-f:] *= np.linspace(1, 0, f)[:, None]
        s = max(0, int(start * SR)); x = x[s - int(start * SR):]; L[s:s + len(x)] += x
    L = np.tanh(L[:int(dur * SR)] * 1.1) / np.tanh(1.1)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(L, -1, 1) * 32767).astype('<i2').tobytes())
    print('cues', len(cues), 'unique', len(cache), dict(n))

assert meta['cuts'], 'render meta missing (parts/p*.mp4.json)'
main(sys.argv[1], float(sys.argv[2]))
