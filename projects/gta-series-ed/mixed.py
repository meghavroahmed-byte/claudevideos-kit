# mixdoc.py: documentary sound design for the cut GTA video, from this video's own ElevenLabs palette.
# Every on-screen event gets a sound (with small pitch/gain variation so repeats differ) + two music beds.
# Usage: python3 mixdoc.py <sfx_dir> <anchors.json> <cuts.json|-> <out.wav> <dur>
import sys, json, wave, numpy as np
D, ancF, cutsF, out, dur = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
SR = 48000; A = json.load(open(ancF)); rng = np.random.default_rng(7311)
def load(n):
    w = wave.open(f'{D}/{n}.wav'); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).astype(np.float32) / 32768; return x
CACHE = {}
def snd(n):
    if n not in CACHE: CACHE[n] = load(n)
    return CACHE[n]
def pitch(x, r):  # simple resample pitch shift (r>1 higher)
    if abs(r - 1) < 1e-3: return x
    idx = np.arange(0, len(x) - 1, r); i0 = idx.astype(int); f = (idx - i0)[:, None]; return x[i0] * (1 - f) + x[i0 + 1] * f
N = int((dur + 4) * SR); L = np.zeros((N, 2), np.float32)
def put(t, n, db=0, var=True, maxlen=None, fade=0.03):
    x = snd(n)
    if var: x = pitch(x, 1 + rng.uniform(-0.05, 0.05))
    if maxlen: x = x[:int(maxlen * SR)].copy(); fl = int(fade * SR * 3); x[-fl:] *= np.linspace(1, 0, fl)[:, None]
    x = x * (10 ** (db / 20)); s = int(max(0, t) * SR); e = min(N, s + len(x)); L[s:e] += x[:e - s]
a = A
TR = {'slide': 'paper_slide', 'flip': 'page_flip', 'tear': 'paper_tear', 'jolt': 'jolt'}
BEATS = [(2.9, 'slide'), (4.2, 'jolt'), (6.2, 'flip'), (8.6, 'tear'), (11.3, 'slide'), (15.9, 'flip'), (20.0, 'jolt'), (25.9, 'tear'), (35.2, 'slide'), (39.4, 'flip'), (41.6, 'jolt'), (44.3, 'slide'), (50.4, 'tear'), (56.9, 'flip'), (59.8, 'jolt')]
C = [(0.05, 'drop_paper', -10), (0.4, 'sticky', -9)]
for t, tr in BEATS: C.append((t - 0.04, TR[tr], -6))
C += [(3.0, 'marker_short', -9), (3.25, 'marker_short', -9), (3.2, 'pencil', -12), (3.9, 'marker', -9),
 (4.25, 'drop_paper', -8), (4.3, 'polaroid', -8), (4.45, 'tape', -11), (4.4, 'tv_static', -12), (4.8, 'stamp', -6), (5.0, 'typewriter', -11), (5.9, 'type_ding', -11),
 (6.25, 'drop_paper', -8), (6.3, 'tape', -12), (6.55, 'drop_paper', -8), (6.6, 'tape', -12), (7.0, 'marker_short', -9),
 (8.65, 'folder', -8)] + [(9.0 + i * 0.16, 'marker_short', -14) for i in range(6)] + [(a['nohisab'] + 0.5, 'stamp', -5), (9.1, 'typewriter', -12),
 (11.35, 'drop_paper', -8), (11.7, 'drop_paper', -8), (12.1, 'marker', -9), (12.5, 'typewriter', -12), (12.7, 'pencil', -11), (13.4, 'boing', -10),
 (15.95, 'drop_paper', -8), (16.1, 'polaroid', -8), (16.25, 'tape', -11), (a['r3'], 'marker', -10), (a['r3'] + 0.1, 'stamp', -5), (a['r3'] + 0.25, 'cash_reg', -10),
 (20.05, 'polaroid', -8), (20.2, 'tape', -11), (20.3, 'city_vice', -11), (a['emo'], 'marker', -9), (a['emo'] + 0.2, 'pencil', -11), (a['r_vc'] + 0.1, 'stamp', -5),
 (25.95, 'polaroid', -8), (26.1, 'tape', -11), (a['cj'], 'marker', -10), (a['cj'] + 0.05, 'sticky', -9), (a['r_sa'] - 0.3, 'receipt', -8), (a['r_sa'] + 0.3, 'cash_reg', -9), (a['r_sa'] + 0.8, 'tear_off', -10),
 (35.25, 'drop_paper', -7), (a['r4'] + 0.1, 'stamp', -5), (a['r4'] + 0.5, 'marker', -9),
 (39.5, 'typewriter', -11), (40.3, 'type_ding', -10), (a['g5'], 'stamp', -7), (40.45, 'marker_short', -9),
 (42.0, 'sticky', -9),
 (44.35, 'polaroid', -9), (44.5, 'tape', -11)] + [(44.7 + i * 0.25, 'marker_short', -12) for i in range(4)] + [(a['r5'] - 0.2, 'paper_slide', -10), (a['r5'] + 0.15, 'cheer_small', -12), (a['r5'] + 0.2, 'stamp', -5), (a['r5'] + 0.6, 'marker', -10),
 (50.45, 'polaroid', -8), (50.6, 'tape', -11), (50.7, 'city_vice', -12), (a['r6'] - 1.0, 'drop_paper', -8), (a['r6'] - 0.2, 'receipt', -8), (a['r6'] + 0.4, 'cash_reg', -8), (a['r6'] + 1.0, 'tear_off', -10), (a['nak'], 'pencil', -10),
 (56.95, 'sticky', -8), (57.7, 'typewriter', -11), (58.1, 'marker', -10), (58.5, 'marker_short', -10),
 (60.2, 'sticky', -9), (62.5, 'drop_paper', -13)]
for t, n, db in C: put(t, n, db, maxlen=3.5)
# a whoosh on every camera cut not already covered
if cutsF != '-':
    used = [t for t, _, _ in C]
    for i, c in enumerate(json.load(open(cutsF))):
        if min(abs(c - u) for u in used) > 0.25: put(c - 0.05, ['whoosh1', 'whip', 'glitch'][i % 3], -10)
# music beds (looped with crossfade), tension until the reasons, then the neon/tech bed
def bed(name, t0, t1, db):
    x = snd(name); xf = int(1.5 * SR); s = int(t0 * SR); end = int(t1 * SR); pos = s; first = True
    while pos < end:
        seg = x.copy(); seg[:xf] *= np.linspace(0, 1, xf)[:, None]; seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
        e = min(end, pos + len(seg)); L[pos:e] += seg[:e - pos] * (10 ** (db / 20)); pos += len(seg) - xf
bed('bed_editorial', 0.0, 40.6, -22); bed('bed_build', 39.4, dur, -22)
L = L[:int(dur * SR)]; pk = np.abs(L).max(); L = L / max(1.0, pk / 0.95)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(L, -1, 1) * 32767).astype('<i2').tobytes())
print('cues', len(C), 'peak', round(float(pk), 2))
