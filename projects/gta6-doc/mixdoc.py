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
C = [(0.0, 'boom', -4), (2.55, 'whoosh2', -6), (2.7, 'impact', -8), (3.0, 'scan', -10), (3.25, 'coins', -12),
     (4.0, 'whip', -6), (4.2, 'billflut', -10), (4.35, 'bundle', -6), (5.0, 'bundle', -8), (4.45, 'sparkle', -12), (5.8, 'coins', -10), (a['taka'], 'register', -5),
     (a['dubai'] - 0.3, 'riser', -10), (a['dubai'], 'whoosh2', -6), (a['dubai'] + 0.3, 'build', -8), (a['burj'], 'impact', -5), (10.55, 'whoosh1', -8), (12.9, 'whip', -6), (13.0, 'impact', -10),
     (14.0, 'whoosh2', -6), (a['b1'], 'pop', -6), (a['b1'] + 0.05, 'bundle', -9), (a['b2'], 'pop', -6), (a['b2'] + 0.05, 'bundle', -8), (a['b3'], 'impact', -5), (a['b3'] + 0.1, 'register', -7),
     (a['cmp'], 'scan', -9), (a['cmp'] + 0.2, 'typing_ui', -12), (a['dami'] - 0.2, 'pop', -8), (a['dami'], 'boom', -5),
     (29.6, 'glitch', -6), (29.8, 'neon', -10), (a['etotaka'], 'riser', -9), (33.55, 'whoosh1', -8), (35.9, 'whoosh2', -6),
     (a['devs'], 'keys', -9), (a['devs'] + 0.1, 'pop', -8), (a['years'], 'tick', -10), (a['years'] + 0.2, 'shutter', -12),
     (a['open'] - 0.2, 'whoosh2', -6), (a['open'], 'car', -9), (a['chars'] - 0.15, 'whip', -7), (a['chars'], 'scan', -9), (a['mocap'], 'shutter', -7), (a['mocap'] + 0.4, 'shutter', -10), (a['voice'], 'pop', -7), (a['tech'], 'glitch', -7), (a['tech'] + 0.25, 'sparkle', -9),
     (49.8, 'whoosh2', -6), (a['gameNoi'], 'impact', -7), (a['virtual'] - 0.4, 'riser', -10), (a['virtual'], 'sparkle', -7), (a['virtual'] + 0.1, 'scan', -9),
     (56.6, 'whoosh2', -6), (a['rel'], 'tick', -9), (a['h24'] - 0.6, 'riser', -8), (a['inc'], 'register', -4), (a['inc'] + 0.05, 'boom', -6), (a['inc'] + 0.2, 'coins', -7), (a['inc'] + 0.4, 'billflut', -9),
     (65.55, 'whoosh1', -8), (67.8, 'whip', -6), (68.15, 'pop', -7), (68.55, 'pop', -7), (a['foinni'], 'laugh_sting', -8), (a['yt'], 'ding', -8), (72.35, 'whoosh1', -8), (74.3, 'impact', -12)]
for t, n, db in C: put(t, n, db, maxlen=3.5)
# checklist ticks + ring/ding accents
for k in ['open', 'chars', 'mocap', 'voice', 'tech']: put(a[k] + 0.15, 'ding', -15)
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
