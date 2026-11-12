# sfx.py: synthesized SFX palette (no stock sounds). Usage: python3 sfx.py <story.js> <out.wav> <duration_s> [seed]
# Kinds: whoosh pop tick slam hiss type bad good fizz rise snip plop curdle pour drop gurgle.
# Per video: pass a NEW seed and tweak the generator params/theme so no two videos sound the same.
# First palette (anaros-dudh): kitchen/body theme: liquid plops,
# fizz, gurgles, soft glassy pops, enzyme snips). Reads cue list from anaros.js and writes sfx_anaros.wav.
import re, sys, wave
import numpy as np

SR = 44100
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 86.0
rng = np.random.default_rng(int(sys.argv[4]) if len(sys.argv) > 4 else 1109)


def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.2):
    e = np.ones(n); A = max(1, int(a * SR)); e[:A] = np.linspace(0, 1, A)
    R = min(n, int(r * SR)); e[-R:] *= np.exp(-np.linspace(0, 6, R)); return e
def lp(x, k):  # one-pole lowpass, k in (0,1)
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s += k * (v - s); y[i] = s
    return y
def bp_noise(d, lo, hi):
    n = rng.standard_normal(int(d * SR)); return lp(n, hi) - lp(n, lo)
def sweep(d, f0, f1, curve=1.0):
    t = t_(d); f = f0 + (f1 - f0) * (t / d) ** curve; return np.sin(2 * np.pi * np.cumsum(f) / SR)

def whoosh(v):
    d = [0.55, 0.7, 0.5, 0.8][v % 4]; n = len(t_(d)); x = rng.standard_normal(n)
    out = np.zeros(n); s = 0.0; k0, k1 = [(0.02, 0.35), (0.04, 0.25), (0.015, 0.4), (0.03, 0.2)][v % 4]
    for i in range(n):  # moving lowpass sweep
        k = k0 + (k1 - k0) * np.sin(np.pi * i / n); s += k * (x[i] - s); out[i] = s
    return out * np.sin(np.pi * np.arange(n) / n) ** 1.5 * 1.6
def pop(v):
    d = 0.16; t = t_(d); f = [880, 1040, 760, 1180][v % 4]
    return (np.sin(2 * np.pi * f * t * (1 - 0.35 * t / d)) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t)) * env(len(t), 0.002, 0.15) * 0.55
def tick(v):
    d = 0.06; t = t_(d); f = [2400, 2900, 2100][v % 3]
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) * 0.35
def slam(v):
    d = 0.9; t = t_(d)
    sub = sweep(d, [95, 80, 110][v % 3], 38, 0.5) * np.exp(-t * 5.5)
    crack = bp_noise(d, 0.05, 0.6) * np.exp(-t * 28)
    body = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 12) * 0.3
    return (sub * 1.1 + crack * 0.9 + body) * 0.9
def hiss(v):
    d = 1.6; n = len(t_(d)); x = bp_noise(d, 0.2, 0.9)
    bub = np.zeros(n)
    for _ in range(14):
        s = int(rng.uniform(0, d - 0.08) * SR); tt = t_(0.07); f = rng.uniform(500, 1400)
        bub[s:s + len(tt)] += np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * tt / 0.07)) / SR) * np.exp(-tt * 40) * 0.5
    return (x * 0.25 + bub) * env(n, 0.15, 0.6) * 0.7
def type_(v):
    d = 2.2; n = len(t_(d)); out = np.zeros(n); t0 = 0
    while t0 < d - 0.05:
        tt = t_(0.03); c = bp_noise(0.03, 0.3, 0.95) * np.exp(-tt * 160); s = int(t0 * SR); out[s:s + len(c)] += c * rng.uniform(0.3, 0.6)
        t0 += rng.uniform(0.06, 0.11)
    return out * 0.6
def bad(v):
    d = 0.5; t = t_(d); return (np.sign(np.sin(2 * np.pi * 150 * t)) * 0.3 + np.sin(2 * np.pi * 157 * t) * 0.5) * env(len(t), 0.01, 0.35) * lp(np.ones(len(t)), 0.5) * 0.45
def good(v):
    out = np.zeros(int(0.9 * SR)); notes = [[659, 880, 1319], [587, 784, 1175], [698, 932, 1397]][v % 3]
    for i, f in enumerate(notes):
        t = t_(0.6); s = int(i * 0.07 * SR)
        tone = np.sin(2 * np.pi * f * t + 1.5 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8)) * np.exp(-t * 6)
        out[s:s + len(t)] += tone * 0.3
    return out
def fizz(v):
    d = 1.4; n = len(t_(d)); out = bp_noise(d, 0.4, 0.98) * 0.15
    for _ in range(30):
        s = int(rng.uniform(0, d - 0.03) * SR); tt = t_(0.02); out[s:s + len(tt)] += np.sin(2 * np.pi * rng.uniform(2500, 5000) * tt) * np.exp(-tt * 200) * 0.4
    return out * env(n, 0.1, 0.5)
def rise(v):
    d = 1.2; t = t_(d); return sweep(d, 300, 900, 1.6) * (t / d) * env(len(t), 0.01, 0.15) * 0.25
def snip(v):
    d = 0.12; t = t_(d); return (bp_noise(d, 0.3, 0.95) * np.exp(-t * 60) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 90) * 0.4) * 0.7
def plop(v):
    d = 0.3; t = t_(d); f0 = [260, 320, 220, 290][v % 4]
    return sweep(d, f0, f0 * 3.2, 0.6) * np.exp(-t * 16) * 0.7
def curdle(v):
    d = 2.6; n = len(t_(d)); out = np.zeros(n)
    for _ in range(24):
        s = int(rng.uniform(0, d - 0.2) * SR); f0 = rng.uniform(140, 300); tt = t_(0.18)
        out[s:s + len(tt)] += sweep(0.18, f0, f0 * 2.4, 0.7) * np.exp(-tt * 22) * 0.35
    return out + lp(rng.standard_normal(n), 0.02) * 0.4 * env(n, 0.3, 0.8)
def pour(v):
    d = 3.0; n = len(t_(d)); x = bp_noise(d, 0.05, 0.4)
    wob = 1 + 0.4 * np.sin(2 * np.pi * 9 * t_(d)) * np.sin(2 * np.pi * 1.3 * t_(d))
    return x * wob * env(n, 0.2, 0.8) * 0.5
def drop(v):
    d = 1.0; t = t_(d); return sweep(d, 900, 120, 0.4) * np.exp(-t * 3) * 0.35
def gurgle(v):
    d = 3.5; n = len(t_(d)); out = np.zeros(n)
    for _ in range(26):
        s = int(rng.uniform(0, d - 0.3) * SR); f0 = rng.uniform(70, 160); tt = t_(0.28)
        out[s:s + len(tt)] += sweep(0.28, f0, f0 * 1.8, 1.2) * np.exp(-tt * 9) * 0.5
    return lp(out, 0.15) * 2.2


# ---- added for smriti (memory/brain theme) ----
def sparkle(v):
    d = 1.2; n = len(t_(d)); out = np.zeros(n)
    for i in range(10):
        s = int(i * 0.07 * SR); tt = t_(0.5); f = 1400 * 2 ** (rng.integers(0, 12) / 12)
        out[s:s + len(tt)] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * 0.18
    return out
def erase(v):
    d = 0.7; t = t_(d); x = bp_noise(d, 0.08, 0.5)
    return (x * np.sin(np.pi * t / d) ** 2 + sweep(d, 900, 220, 0.8) * np.exp(-t * 4) * 0.25) * 0.6
def shatter(v):
    d = 1.2; t = t_(d); n = len(t); out = bp_noise(d, 0.3, 0.98) * np.exp(-t * 9) * 0.6
    for _ in range(18):
        s = int(rng.uniform(0, 0.5) * SR); tt = t_(0.25); f = rng.uniform(2500, 6500)
        out[s:s + len(tt)] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) * 0.25
    return out
def rec(v):
    out = np.zeros(int(0.45 * SR)); tt = t_(0.02); out[:len(tt)] += bp_noise(0.02, 0.2, 0.9) * 0.8
    b = t_(0.18); s = int(0.12 * SR); out[s:s + len(b)] += np.sin(2 * np.pi * 1760 * b) * env(len(b), 0.005, 0.05) * 0.35
    return out
def zap(v):
    d = 0.35; t = t_(d); f = [600, 820, 700, 950][v % 4]
    return np.sin(2 * np.pi * f * t + 6 * np.sin(2 * np.pi * 37 * t)) * np.exp(-t * 11) * 0.35
def rumble(v):
    d = 2.2; t = t_(d); n = len(t)
    out = lp(rng.standard_normal(n), 0.015) * 6 * np.exp(-t * 1.6)
    for _ in range(9):
        s = int(rng.uniform(0, 1.4) * SR); tt = t_(0.3); out[s:s + len(tt)] += sweep(0.3, 120, 50, 0.5) * np.exp(-tt * 14) * 0.6
    return out * 0.7
def build(v):
    d = 2.0; n = len(t_(d)); out = np.zeros(n)
    for i in range(12):
        s = int(i * 0.15 * SR); tt = t_(0.12); f = 300 + i * 40
        out[s:s + len(tt)] += (np.sin(2 * np.pi * f * tt) + bp_noise(0.12, 0.1, 0.5) * 0.4) * np.exp(-tt * 35) * 0.4
    return out
def burn(v):
    d = 4.0; t = t_(d); n = len(t); x = bp_noise(d, 0.02, 0.3) * 0.5
    cr = np.zeros(n)
    for _ in range(60):
        s = int(rng.uniform(0, d - 0.02) * SR); tt = t_(0.01); cr[s:s + len(tt)] += rng.uniform(-1, 1) * np.exp(-tt * 400)
    return (x + cr * 0.5) * np.sin(np.pi * t / d) * 0.6

KIND = dict(whoosh=whoosh, pop=pop, tick=tick, slam=slam, hiss=hiss, type=type_, bad=bad, good=good, fizz=fizz,
            rise=rise, snip=snip, plop=plop, curdle=curdle, pour=pour, drop=drop, gurgle=gurgle,
            sparkle=sparkle, erase=erase, shatter=shatter, rec=rec, zap=zap, rumble=rumble, build=build, burn=burn)
GAIN = dict(whoosh=0.55, pop=0.5, tick=0.45, slam=0.9, hiss=0.6, type=0.45, bad=0.55, good=0.6, fizz=0.5,
            rise=0.5, snip=0.6, plop=0.7, curdle=0.6, pour=0.5, drop=0.5, gurgle=0.7,
            sparkle=0.6, erase=0.6, shatter=0.7, rec=0.6, zap=0.5, rumble=0.9, build=0.6, burn=0.5)

src = open(sys.argv[1], encoding='utf-8').read()
cues = re.findall(r"\[([\d.]+),\s*'(\w+)'\]", src[src.index('window.SFXEV'):])
L = np.zeros((int(DUR * SR) + SR, 2)); count = {}
for ts, k in cues:
    v = count.get(k, 0); count[k] = v + 1
    x = KIND[k](v) * GAIN[k]
    pan = [0.0, -0.25, 0.25, -0.12, 0.12][v % 5]
    s = int(float(ts) * SR); e = min(len(L), s + len(x))
    L[s:e, 0] += x[:e - s] * (1 - pan); L[s:e, 1] += x[:e - s] * (1 + pan)
L = L[:int(DUR * SR)]
L = np.tanh(L * 0.9) * 0.6
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((L * 32767).astype('<i2').tobytes())
print('cues', len(cues), dict(count))
