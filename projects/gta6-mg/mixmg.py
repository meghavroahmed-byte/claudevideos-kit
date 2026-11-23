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
TR = {'zoom': 'whoosh2', 'bars': 'whoosh1', 'whip': 'whip', 'circle': 'whoosh1', 'glitch': 'glitch', 'flash': 'impact'}
BEATS = [(2.6, 'zoom'), (4.0, 'bars'), (6.6, 'whip'), (8.6, 'circle'), (11.0, 'zoom'), (14.6, 'bars'), (20.5, 'whip'), (23.0, 'glitch'), (29.6, 'flash'), (33.6, 'zoom'), (35.9, 'whip'), (38.4, 'bars'), (41.5, 'circle'), (49.8, 'zoom'), (56.6, 'bars'), (65.6, 'whip'), (67.6, 'glitch'), (69.8, 'zoom'), (72.4, 'zoom')]
C = [(0.0, 'boom', -5), (0.95, 'pop', -9), (1.0, 'impact', -12)]
for t, tr in BEATS: C.append((t - 0.06, TR[tr], -7))
C += [
 # title card
 (2.7, 'scan', -11), (2.75, 'glitch', -9), (3.1, 'pop', -8), (3.15, 'ding', -14),
 # money footage window + counter
 (4.05, 'shutter', -10), (4.4, 'typing_ui', -12), (4.45, 'bundle', -9), (5.0, 'scan', -13), (5.9, 'register', -9),
 # cash stacks + rain
 (6.65, 'billflut', -10)] + [(6.7 + i * 0.25, 'bundle', -10 - i) for i in range(5)] + [(6.8, 'scan', -12), (a['taka'], 'impact', -6), (a['taka'] + 0.05, 'register', -8), (a['dubai'] - 0.3, 'pop', -12),
 # Burj footage + tower line-art + slam
 (8.65, 'shutter', -10), (9.0, 'scan', -12), (a['burj'], 'impact', -6), (a['burj'] + 0.1, 'whoosh1', -12),
 # illustrated Dubai, tower rising
 (11.1, 'build', -9), (11.2, 'pop', -12), (11.4, 'riser', -12), (13.3, 'pop', -9),
 # chart
 (14.7, 'scan', -12), (15.2, 'pop', -13), (15.5, 'pop', -13), (15.8, 'pop', -13), (a['b1'], 'riser', -14), (a['b1'] + 0.5, 'ding', -11), (a['b2'], 'riser', -14), (a['b2'] + 0.5, 'ding', -11), (a['b3'], 'riser', -12), (a['b3'] + 0.5, 'register', -8), (a['b3'] + 0.35, 'impact', -9),
 # counting cash footage
 (20.55, 'shutter', -10), (20.7, 'bundle', -11), (a['b3'] + 0.05, 'typing_ui', -13),
 # comparison
 (23.3, 'pop', -9), (23.4, 'scan', -12), (23.45, 'riser', -14), (26.0, 'shutter', -11), (26.1, 'build', -13), (27.0, 'riser', -12), (a['dami'] - 0.6, 'pop', -10), (a['dami'], 'boom', -6), (a['dami'] + 0.05, 'impact', -8),
 # question
 (29.7, 'whoosh2', -11), (29.9, 'scan', -12), (30.1, 'pop', -12), (30.3, 'pop', -12), (a['etotaka'] - 0.3, 'glitch', -8), (a['etotaka'], 'wrong', -12),
 # face mid
 (34.0, 'pop', -12), (34.6, 'laugh_sting', -16),
 # programmers + people grid
 (35.95, 'shutter', -10), (36.3, 'keys', -12), (a['devs'] - 0.2, 'billflut', -18), (a['devs'], 'impact', -8)] + [(a['devs'] + i * 0.08, 'pop', -18 - (i % 3)) for i in range(12)] + [
 # studio + years timeline
 (38.5, 'keys', -11)] + [(a['years'] + i * 0.2, 'tick', -12) for i in range(8)] + [(a['years'], 'whoosh1', -12),
 # five reasons
 (a['open'], 'pop', -9), (a['open'] + 0.2, 'ding', -12), (a['open'] + 0.3, 'car', -12), (a['chars'], 'pop', -9), (a['chars'] + 0.2, 'ding', -12), (a['chars'] + 0.1, 'neon', -13),
 (a['mocap'], 'pop', -9), (a['mocap'] + 0.2, 'ding', -12), (a['mocap'] + 0.1, 'scan', -10), (45.3 + 0.5, 'shutter', -13), (46.35, 'shutter', -11), (a['voice'], 'pop', -9), (a['voice'] + 0.2, 'ding', -12),
 (a['tech'], 'pop', -9), (a['tech'] + 0.2, 'ding', -12), (a['tech'] + 0.15, 'scan', -10), (a['tech'] + 0.4, 'riser', -13),
 # network globe
 (49.9, 'scan', -10), (50.4, 'sparkle', -13), (50.2, 'pop', -12), (a['gameNoi'], 'whip', -9), (a['virtual'] - 0.3, 'riser', -11), (a['virtual'], 'impact', -6), (a['virtual'] + 0.1, 'sparkle', -9),
 # release day
 (56.7, 'tick', -11), (a['rel'], 'riser', -14), (60.0, 'shutter', -11), (62.0, 'pop', -12), (a['inc'] - 0.4, 'riser', -9), (a['inc'], 'register', -5), (a['inc'] + 0.05, 'boom', -6), (a['inc'] + 0.15, 'coins', -8), (a['inc'] + 0.3, 'billflut', -9), (a['inc'] + 0.9, 'billflut', -12),
 # gaming / poll / phone
 (65.65, 'shutter', -10), (65.9, 'keys', -14), (a['play'], 'pop', -9), (67.9, 'pop', -9), (68.3, 'pop', -9), (68.4, 'typing_ui', -14), (a['foinni'], 'laugh_sting', -9), (a['foinni'] + 0.02, 'impact', -11),
 (69.85, 'pop', -10), (70.1, 'ding', -12), (72.0, 'pop', -10),
 # face end
 (73.0, 'pop', -12), (74.4, 'impact', -13)]
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
bed('bed_tension', 0.0, 36.6, -21); bed('bed_tech', 35.4, dur, -21)
L = L[:int(dur * SR)]; pk = np.abs(L).max(); L = L / max(1.0, pk / 0.95)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(L, -1, 1) * 32767).astype('<i2').tobytes())
print('cues', len(C), 'peak', round(float(pk), 2))
