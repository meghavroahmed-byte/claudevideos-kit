# mixpro.py: curated, non-fatiguing sound design.
# Fewer, meaningful cues (hook, reveals, transitions, footage, character beats), each softened (low-pass, short fades),
# no identical repeats (pitch/gain variation + alternating variants), music beds with crossfades.
# Usage: python3 -I mixpro.py <cues.json> <out.wav>
# cues.json: {"dur": 74.9, "sfx": [dirs...], "beds": [[name, t0, t1, db], ...], "cues": [[t, name|[names], db], ...]}
import sys, json, wave, os, numpy as np
cfg = json.load(open(sys.argv[1])); out = sys.argv[2]; SR = 48000; dur = cfg['dur']; rng = np.random.default_rng(4242)
def find(n):
    for d in cfg['sfx']:
        p = os.path.join(d, n + '.wav')
        if os.path.exists(p): return p
    raise SystemExit('missing sfx ' + n)
CACHE = {}
def snd(n):
    if n not in CACHE:
        w = wave.open(find(n)); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        a = np.abs(x).max(axis=1); nz = np.where(a > 0.01)[0]  # trim leading silence so cues land on the beat
        if len(nz): x = x[max(0, nz[0] - 48):]
        CACHE[n] = x
    return CACHE[n]
try:
    from scipy.signal import lfilter
    def lowpass(x, fc):
        a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x, axis=0).astype(np.float32)
except Exception:
    def lowpass(x, fc):  # FFT 2nd-order-like roll-off (no scipy)
        n = len(x); X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(n, 1 / SR); X *= (1 / (1 + (f / fc) ** 4))[:, None]; return np.fft.irfft(X, n, axis=0).astype(np.float32)
def pitch(x, r):
    if abs(r - 1) < 1e-3: return x
    idx = np.arange(0, len(x) - 1, r); i0 = idx.astype(int); f = (idx - i0)[:, None]; return x[i0] * (1 - f) + x[i0 + 1] * f
N = int((dur + 4) * SR); L = np.zeros((N, 2), np.float32); last = {}
for c in cfg['cues']:
    t, n, db = c[0], c[1], c[2]; lp = c[3] if len(c) > 3 else 9000; maxlen = c[4] if len(c) > 4 else 2.5
    if isinstance(n, list): k = last.get(tuple(n), -1) + 1; last[tuple(n)] = k; n = n[k % len(n)]
    x = pitch(snd(n), 1 + rng.uniform(-0.04, 0.04)) * (10 ** ((db + rng.uniform(-1, 1)) / 20))
    x = x[:int(maxlen * SR)].copy(); fl = min(len(x) // 3, int(0.12 * SR)); x[-fl:] *= np.linspace(1, 0, fl)[:, None]; fi = min(96, len(x) // 4); x[:fi] *= np.linspace(0, 1, fi)[:, None]
    if lp: x = lowpass(x, lp)
    s = int(max(0, t) * SR); e = min(N, s + len(x)); L[s:e] += x[:e - s]
for name, t0, t1, db in cfg.get('beds', []):
    x = lowpass(snd(name), 12000); xf = int(2.0 * SR); s = int(t0 * SR); end = int(t1 * SR); pos = s
    while pos < end:
        seg = x.copy(); seg[:xf] *= np.linspace(0, 1, xf)[:, None]; seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
        e = min(end, pos + len(seg)); L[pos:e] += seg[:e - pos] * (10 ** (db / 20)); pos += len(seg) - xf
    fo = int(1.2 * SR); L[max(s, end - fo):end] *= 1  # beds end with their own crossfade tail
L = L[:int(dur * SR)]; pk = np.abs(L).max(); L = L / max(1.0, pk / 0.9)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(L, -1, 1) * 32767).astype('<i2').tobytes())
print('cues', len(cfg['cues']), 'peak', round(float(pk), 2))
