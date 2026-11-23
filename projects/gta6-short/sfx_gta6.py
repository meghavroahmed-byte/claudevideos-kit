# sfx_gta6.py: NEW synthesized SFX palette for the GTA-6 money short (no stock sounds, nothing reused).
# Theme: money / city / studio. Kinds: chaching coins swoosh boom tick keys rise glitch shutter sparkle pop whoosh2 bass
# plus a soft warm music bed (pad + muted pluck pulse) under the voice.
# Usage: python3 sfx_gta6.py cues.json out.wav duration seed
import json, sys, wave
import numpy as np
SR = 48000
cues = json.load(open(sys.argv[1])); DUR = float(sys.argv[3]); rng = np.random.default_rng(int(sys.argv[4]))
def t_(d): return np.arange(int(d * SR)) / SR
def ex(t, k): return np.exp(-t * k)
def fade(x, a=0.004, r=0.05):
    n = len(x); A = max(1, int(a * SR)); R = max(1, min(n, int(r * SR))); e = np.ones(n); e[:A] = np.linspace(0, 1, A); e[-R:] *= np.linspace(1, 0, R); return x * e
def fft_bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def bell(f, d, k=5, inh=(1, 2.76, 5.4, 8.93), amps=(1, .5, .25, .12)):
    t = t_(d); return sum(a * np.sin(2 * np.pi * f * h * t) * ex(t, k * (1 + i * 0.8)) for i, (h, a) in enumerate(zip(inh, amps)))
def verb(x, mix=0.25, length=1.2, damp=3.0):
    ir = noise(length) * ex(t_(length), damp); ir = fft_bp(ir, 200, 7000); ir /= np.abs(ir).sum() ** 0.5 * 8
    n = len(x) + len(ir) - 1; y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x) + int(length * SR)]; out = np.zeros(len(y)); out[:len(x)] += x; return out + y * mix

def chaching(v):  # register: mechanical clack + drawer roll + two bright bells
    d = 1.3; out = np.zeros(int(d * SR)); t = t_(0.05)
    out[:len(t)] += fft_bp(noise(0.05), 800, 6000) * ex(t, 90) * 0.8
    roll = fft_bp(noise(0.25), 300, 2500) * np.sin(np.pi * t_(0.25) / 0.25) * 0.25; s = int(0.05 * SR); out[s:s + len(roll)] += roll
    f0 = [2093, 2349, 1976][v % 3]
    for i, f in enumerate([f0, f0 * 1.26]):
        b = bell(f, 0.9, 4.5) * 0.35; s = int((0.2 + i * 0.12) * SR); out[s:s + len(b)] += b[:len(out) - s]
    return verb(out, 0.2)
def coins(v):  # little cascade of metallic clinks
    d = 1.0; out = np.zeros(int(d * SR))
    for i in range(int(rng.integers(7, 12))):
        f = rng.uniform(3000, 6500); s = int((rng.uniform(0, 0.6) ** 1.6) * SR); b = bell(f, 0.25, 22, (1, 1.47, 2.09), (1, .6, .3)) * rng.uniform(0.15, 0.35)
        out[s:s + len(b)] += b[:len(out) - s]
    return verb(out, 0.15, 0.6)
def swoosh(v):  # airy doppler swoosh
    d = [0.6, 0.75, 0.5][v % 3]; n = int(d * SR); x = noise(d); env = np.sin(np.pi * np.arange(n) / n) ** 2
    X = np.fft.rfft(x * env); f = np.fft.rfftfreq(n, 1 / SR); c = [1800, 1300, 2400][v % 3]; X *= np.exp(-((f - c) / (c * 0.9)) ** 2); y = np.fft.irfft(X, n)
    pan_t = np.linspace(-1, 1, n); return y / (np.abs(y).max() + 1e-9) * 0.6, pan_t
def boom(v):  # cinematic sub hit + noise crack + long tail
    d = 2.2; t = t_(d); f = 55 + 25 * ex(t, 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * ex(t, 2.2); crack = fft_bp(noise(d), 1500, 9000) * ex(t, 35) * 0.5
    return verb((sub * 1.0 + crack) * 0.8, 0.3, 1.8, 2.0)
def tick(v):  # clock tick-tock (alternating pitch)
    t = t_(0.08); f = 1900 if v % 2 else 1500; return (np.sin(2 * np.pi * f * t) * ex(t, 90) + fft_bp(noise(0.08), 2000, 8000) * ex(t, 160) * 0.3) * 0.5
def keys(v):  # mechanical keyboard burst
    d = 1.6; out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d - 0.05:
        c = fft_bp(noise(0.035), 1200, 7000) * ex(t_(0.035), 140) * rng.uniform(0.25, 0.5); s = int(t0 * SR); out[s:s + len(c)] += c; t0 += rng.uniform(0.055, 0.12)
    return out * 0.8
def rise(v):  # tension riser
    d = 1.6; t = t_(d); f = 220 * (1 + 3 * (t / d) ** 2); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (s * 0.25 + fft_bp(noise(d), 2000, 9000) * 0.15) * (t / d) ** 2
def glitch(v):  # digital stutter
    d = 0.35; out = np.zeros(int(d * SR)); seg = int(0.025 * SR); base = np.sign(np.sin(2 * np.pi * rng.uniform(300, 900) * t_(0.025))) * 0.3
    for i in range(0, len(out) - seg, seg):
        if rng.random() > 0.35: out[i:i + seg] = base * rng.uniform(0.3, 1) + fft_bp(noise(0.025), 3000, 10000)[:seg] * 0.2
    return out * 0.6
def shutter(v):  # camera shutter
    out = np.zeros(int(0.25 * SR)); a = fft_bp(noise(0.03), 1500, 9000) * ex(t_(0.03), 120); out[:len(a)] += a; s = int(0.09 * SR); out[s:s + len(a)] += a * 0.7; return out * 0.9
def sparkle(v):  # gold shimmer
    d = 1.2; out = np.zeros(int(d * SR))
    for i in range(16):
        f = rng.uniform(4000, 9000); s = int(rng.uniform(0, 0.8) * SR); b = bell(f, 0.3, 14, (1, 2.0), (1, .3)) * 0.12; out[s:s + len(b)] += b[:len(out) - s]
    return verb(out, 0.3, 0.8)
def pop(v):  # soft UI pop (water-drop like)
    d = 0.14; t = t_(d); f0 = [700, 820, 600, 940][v % 4]; f = f0 * (1 + 1.2 * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * ex(t, 30) * 0.5
def whoosh2(v):  # transition whoosh (darker, with sub swell)
    y, pan = swoosh(v + 1); n = len(y); t = np.arange(n) / SR; sub = np.sin(2 * np.pi * 70 * t) * np.sin(np.pi * t / t[-1]) ** 2 * 0.3; return (y * 0.8 + sub), pan
def bass(v):  # short bass drop for numbers
    d = 0.7; t = t_(d); f = 90 * ex(t, 3) + 40; return np.sin(2 * np.pi * np.cumsum(f) / SR) * ex(t, 4) * 0.8
KIND = dict(chaching=chaching, coins=coins, swoosh=swoosh, boom=boom, tick=tick, keys=keys, rise=rise, glitch=glitch, shutter=shutter, sparkle=sparkle, pop=pop, whoosh2=whoosh2, bass=bass)
GAIN = dict(chaching=0.55, coins=0.45, swoosh=0.5, boom=0.75, tick=0.35, keys=0.4, rise=0.45, glitch=0.4, shutter=0.5, sparkle=0.4, pop=0.45, whoosh2=0.55, bass=0.55)

N = int(DUR * SR) + SR * 3; L = np.zeros((N, 2)); cnt = {}
for ts, k in cues:
    v = cnt.get(k, 0); cnt[k] = v + 1; r = KIND[k](v)
    if isinstance(r, tuple): x, pan = r
    else: x, pan = r, np.full(len(r), [0, -0.3, 0.3, -0.15, 0.15][v % 5])
    x = fade(x) * GAIN[k]; s = int(ts * SR); e = min(N, s + len(x)); x = x[:e - s]; pan = pan[:e - s]
    L[s:e, 0] += x * np.sqrt((1 - pan) / 2) * 1.41; L[s:e, 1] += x * np.sqrt((1 + pan) / 2) * 1.41
# soft music bed: warm pad chords + muted pluck on 8ths (92 bpm), very low under voice
bpm = 92; beat = 60 / bpm; t = np.arange(int(DUR * SR)) / SR
chords = [[110, 164.8, 220, 277.2], [98, 146.8, 196, 246.9], [87.3, 130.8, 174.6, 220], [98, 146.8, 196, 246.9]]
pad = np.zeros(len(t)); bar = beat * 4
for i, ch in enumerate(chords * int(DUR / (bar * 4) + 2)):
    s = int(i * bar * SR); e = min(len(t), int((i + 1) * bar * SR) + int(0.5 * SR))
    if s >= len(t): break
    tt = np.arange(e - s) / SR; env = np.minimum(1, tt / 0.6) * np.minimum(1, (bar + 0.5 - tt) / 0.6).clip(0)
    for f in ch: pad[s:e] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt)) * env * 0.05
pl = np.zeros(len(t)); k = 0
while k * beat / 2 < DUR:
    s = int(k * beat / 2 * SR); ch = chords[int(k / 8) % 4]; f = ch[[2, 3, 2, 1][k % 4]] * 2; tt = t_(0.25); n = min(len(tt), len(t) - s)
    pl[s:s + n] += (np.sin(2 * np.pi * f * tt) * ex(tt, 18))[:n] * (0.06 if k % 2 == 0 else 0.035); k += 1
bed = pad + pl
L[:len(t), 0] += bed; L[:len(t), 1] += np.roll(bed, int(0.012 * SR))
L = L[:int(DUR * SR)]; L = np.tanh(L * 0.95) * 0.7
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((L * 32767).astype('<i2').tobytes())
print('cues', len(cues), cnt)
