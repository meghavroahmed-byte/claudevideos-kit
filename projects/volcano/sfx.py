#!/usr/bin/env python3
"""Synthesizes this video's own SFX palette (sfx/sfx_ancient-days_*.wav) and the timed SFX bed (audio/sfx_bed.wav).

    python sfx.py            # needs numpy + scipy
Every sound here is generated from noise and oscillators: no stock or reused files.
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 27.6
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(1000)


def t_(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def norm(x, peak=1.0): return x / (np.max(np.abs(x)) + 1e-9) * peak
def env(n, a, r, shape=2.0):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai) ** shape
    e[-ri:] *= np.linspace(1, 0, ri) ** shape
    return e
def sweep_bp(x, f0, f1, q=0.6, steps=40):
    out = np.zeros_like(x); n = len(x); b = n // steps + 1
    for i in range(steps):
        f = f0 * (f1 / f0) ** (i / (steps - 1))
        seg = slice(i * b, min(n, (i + 1) * b + 2048))
        y = bp(x[seg], f * (1 - q / 2), f * (1 + q / 2))
        w = np.ones(len(y)); ov = min(2048, len(y))
        if i: w[:ov] = np.linspace(0, 1, ov)
        out[seg] += y * w
    return out


# ---------------- palette (stone age) ----------------
def whoosh(d=0.55, up=True):
    x = lp(sweep_bp(noise(d), 150 if up else 900, 900 if up else 150, q=0.9), 1100, 4)
    return norm(x * env(len(x), d * 0.55, d * 0.45, 1.6), 0.8)

def popup(f=520, d=0.18):  # glass card / badge blip
    tt = t_(d); ff = f * (1 + 0.8 * tt / d)
    return norm(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tt * 18) * env(len(tt), 0.004, 0.05), 0.5)

def tick(d=0.12, f=1600):  # wooden tick (card word changes, clock)
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 70) + 0.5 * np.sin(2 * np.pi * f * 0.5 * tt) * np.exp(-tt * 40)
    return norm(x, 0.6)

def slash(d=0.22):  # red "no" line draws across a badge: short dark swipe + low knock
    tt = t_(d); x = lp(sweep_bp(noise(d), 1400, 300, q=0.8), 2200) * env(len(tt), 0.02, 0.12)
    x += np.sin(2 * np.pi * np.cumsum(180 * (1 - 0.4 * tt / d)) / SR) * np.exp(-tt * 25) * 0.6
    return norm(x, 0.6)

def stamp_hit(d=0.6, f=70):  # big stamp lands: low thump + paper-ish slap
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-tt * 25))) / SR) * np.exp(-tt * 7)
    x += lp(noise(d), 1500) * np.exp(-tt * 40) * 0.7
    return norm(x, 0.9)

def knock(f=320, d=0.2):  # wood on wood / stone on wood
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) * a for m, a, k in [(1, 1, 30), (2.7, 0.4, 55), (5.1, 0.15, 90)])
    x += lp(noise(d), 2000) * np.exp(-tt * 120) * 0.3
    return norm(x, 0.7)

def clink(d=0.18):  # flint on flint: bright, dry click (low-passed, no hiss)
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(2300, 70), (3400, 90), (1250, 50)])
    x += bp(noise(d), 1500, 4000) * np.exp(-tt * 150) * 0.5
    return norm(x, 0.6)

def step(d=0.14, f=90):  # bare foot on grass: soft low pat
    tt = t_(d); x = lp(noise(d), 600, 4) * np.exp(-tt * 45) + np.sin(2 * np.pi * f * tt) * np.exp(-tt * 40) * 0.6
    return norm(x, 0.6)

def hooves(d=1.5, rate=11, seed=3):  # galloping deer: clusters of three soft hoof pats
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d - 0.1:
        for k in range(3):
            h = step(0.08, r.uniform(110, 150)) * r.uniform(0.6, 1)
            s0 = int((t0 + k * 0.045) * SR); m = min(len(h), len(out) - s0); out[s0:s0 + m] += h[:m] if m > 0 else 0
        t0 += 3.0 / rate * r.uniform(0.9, 1.1)
    return norm(out * env(len(out), 0.02, 0.5), 0.7)

def spear_fly(d=0.45):  # spear through the air: tight whoosh
    tt = t_(d); x = lp(sweep_bp(noise(d), 300, 1200, q=0.5), 1800, 4)
    return norm(x * env(len(tt), d * 0.5, d * 0.45, 1.4), 0.7)

def thunk(d=0.35):  # spear sticks in the ground
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(140 * (1 + np.exp(-tt * 40))) / SR) * np.exp(-tt * 16)
    x += np.sin(2 * np.pi * 420 * tt) * np.exp(-tt * 9) * 0.25 * np.sin(2 * np.pi * 18 * tt)   # shaft wobble
    x += lp(noise(d), 900) * np.exp(-tt * 50) * 0.5
    return norm(x, 0.8)

def rustle(d=0.45, seed=1):  # leaves: soft crackly band (low-passed)
    r = np.random.default_rng(seed); x = lp(bp(noise(d), 700, 3500), 3500) * (0.4 + 0.6 * np.abs(lp(r.standard_normal(int(d * SR)), 25)) * 5)
    return norm(x * env(len(x), 0.06, 0.2), 0.45)

def plop(d=0.25, f=210):  # fruit drops into a basket
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt * 30))) / SR) * np.exp(-tt * 22)
    x += knock(520, d) * 0.35
    return norm(x, 0.7)

def splash(d=1.0):  # spear into the river
    tt = t_(d); x = lp(noise(d), 2400) * np.exp(-tt * 10) + lp(bp(noise(d), 500, 2500), 3000) * np.exp(-tt * 4) * 0.5
    for _ in range(10):
        s = int(rng.uniform(0.1, 0.7) * SR); dur = 0.05; u = t_(dur); f0 = rng.uniform(500, 1100)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + u / dur)) / SR) * np.exp(-u * 60) * 0.35
        x[s:s + len(b)] += b[:len(x) - s]
    return norm(x * env(len(tt), 0.003, 0.3), 0.85)

def flap(d=0.8, rate=12):  # fish wriggling on the spear: wet little slaps (low-passed)
    tt = t_(d); out = np.zeros(len(tt))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.05); b = lp(noise(0.05), 1800) * np.exp(-u * 70)
        out[s:s + len(b)] += b[:len(out) - s] * (1 - k / (d * rate)) ** 0.5
    return norm(out, 0.5)

def stream(d, rate=40, fmin=380, fmax=1400, seed=3):  # river babble: tiny resonant bubbles + low wash
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(int(d * rate)):
        t0 = r.uniform(0, d); f0 = np.exp(r.uniform(np.log(fmin), np.log(fmax))); dur = r.uniform(0.02, 0.06); tt = t_(dur)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.9 * tt / dur)) / SR) * np.exp(-tt / (dur * 0.3)) * r.uniform(0.3, 1)
        s0 = int(t0 * SR); m = min(len(b), len(out) - s0); out[s0:s0 + m] += b[:m]
    return norm((lp(out, 3200) + lp(noise(d), 300, 4) * 0.25) * env(int(d * SR), 0.5, 0.6), 0.5)

def glug(d=0.6):  # gourd filling
    tt = t_(d); out = np.zeros(len(tt))
    for k, f in enumerate([300, 340, 390, 450]):
        s = int(k * 0.11 * SR); u = t_(0.1); b = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * u / 0.1)) / SR) * np.exp(-u * 30)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(out + lp(noise(d), 500) * 0.15 * env(len(tt), 0.05, 0.3), 0.6)

def chime(d=1.0, base=1318.5):  # clean water / finished tool sparkle
    tt = t_(d); x = np.zeros(len(tt))
    for k, f in enumerate([base, base * 1.26, base * 1.5]):
        s0 = int(k * 0.07 * SR); u = tt[: len(tt) - s0]
        x[s0:] += np.sin(2 * np.pi * f * u) * np.exp(-u * 5) * 0.7
    return norm(x * env(len(tt), 0.005, 0.25), 0.4)

def flap_cloth(d=0.5):  # hide cover pulled over the poles
    tt = t_(d); x = lp(bp(noise(d), 200, 1500), 1600) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * tt))) * env(len(tt), 0.08, 0.25)
    return norm(x, 0.6)

def crackle(d, rate=24, seed=9):  # campfire: pops and a low roar (no hiss)
    r = np.random.default_rng(seed); out = lp(noise(d), 220, 4) * 0.6
    for _ in range(int(d * rate)):
        s = int(r.uniform(0, d) * SR); u = t_(0.012); b = bp(noise(0.012), 900, 3000) * np.exp(-u * 500) * r.uniform(0.3, 1.2)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 3500) * env(len(out), 0.3, 0.5), 0.6)

def fireup(d=0.9):  # flames flare
    tt = t_(d); x = lp(sweep_bp(noise(d), 120, 700, q=1.4), 900, 4) * env(len(tt), 0.12, 0.6, 1.3)
    return norm(x, 0.8)

def growl(d=1.4, f=62):  # wolf snarl: low throaty rumble, amplitude-flutter
    tt = t_(d); car = lp(noise(d), 500, 4) + np.sin(2 * np.pi * f * tt) * 0.7 + np.sin(2 * np.pi * f * 2.01 * tt) * 0.3
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 27 * tt) * (0.7 + 0.3 * np.sin(2 * np.pi * 1.7 * tt))
    return norm(bp(car * am, 60, 900) * env(len(tt), 0.25, 0.35), 0.75)

def paws(d=0.9, rate=14, seed=6):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        h = step(0.06, r.uniform(140, 190)) * r.uniform(0.4, 0.9); s0 = int(k / rate * SR); m = min(len(h), len(out) - s0); out[s0:s0 + m] += h[:m]
    return norm(out * env(len(out), 0.02, 0.3), 0.6)

def dig(d=0.3):  # stone hoe into soil
    tt = t_(d); x = lp(noise(d), 700, 4) * np.exp(-tt * 18) + np.sin(2 * np.pi * 75 * tt) * np.exp(-tt * 25) * 0.6
    return norm(x, 0.7)

def grow(d=1.1):  # crops shoot up: soft rising swell + light rustle
    tt = t_(d); f = 180 + 420 * (tt / d) ** 1.5
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 * (tt / d) + rustle(d, 4) * 0.5
    return norm(x * env(len(tt), 0.2, 0.25), 0.55)

def thatch(d=0.4, f=95):  # a house settles: dull wooden thump + straw
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.5 * np.exp(-tt * 20))) / SR) * np.exp(-tt * 12)
    x += lp(bp(noise(d), 400, 2500), 2500) * np.exp(-tt * 14) * 0.3
    return norm(x, 0.7)

def chop(d=0.4):  # stone axe into the log
    tt = t_(d); x = knock(230, d) * 0.8 + lp(noise(d), 1400) * np.exp(-tt * 35) * 0.6
    x += np.sin(2 * np.pi * np.cumsum(110 * (1 + np.exp(-tt * 30))) / SR) * np.exp(-tt * 14) * 0.5
    return norm(x, 0.8)

def riser(d=2.2):  # time racing by
    tt = t_(d); x = sweep_bp(noise(d), 150, 1500, q=0.6) * (tt / d) ** 1.2
    x += np.sin(2 * np.pi * np.cumsum(80 + 120 * (tt / d)) / SR) * 0.35 * (tt / d)
    return norm(lp(x, 2500) * env(len(tt), 0.1, 0.15), 0.6)

def sting(d=1.6):  # warm resolve on "full-time job"
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(392, 1), (493.9, 0.7), (587.3, 0.6), (784, 0.3)])
    return norm(x * np.exp(-tt * 1.8) * env(len(tt), 0.01, 0.3), 0.45)


# ---------------- anaconda palette ----------------
def slither(d=1.2, seed=2):  # scales dragging over ground: low rub, no hiss
    r = np.random.default_rng(seed); tt = t_(d)
    x = lp(bp(noise(d), 90, 700), 650, 4) * (0.6 + 0.4 * np.abs(lp(r.standard_normal(len(tt)), 6)) * 6)
    return norm(x * env(len(tt), 0.25, 0.35), 0.6)

def strain(d=0.7, f=70):  # coil squeezes: creaky low stretch + muffled thump
    tt = t_(d); pulses = (np.sin(2 * np.pi * 26 * tt) > 0.9).astype(float)
    x = bp(lp(pulses, 1500) + 0.05 * noise(d), 90, 900) * env(len(tt), 0.1, 0.25)
    x += np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt * 15))) / SR) * np.exp(-tt * 8) * 0.8
    return norm(x, 0.7)

def heartbeat(d=0.5, f=50):
    tt = t_(d); y = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 18)
    s0 = int(0.15 * SR); y[s0:] += np.sin(2 * np.pi * f * tt[:len(tt) - s0]) * np.exp(-tt[:len(tt) - s0] * 18) * 0.7
    return norm(lp(y, 200), 0.8)

def powerdown(d=0.9):
    tt = t_(d); ff = 300 * (0.4 ** (tt / d)); x = np.sin(2 * np.pi * np.cumsum(ff) / SR)
    return norm(lp(x, 800) * np.exp(-tt * 2.5) * env(len(tt), 0.01, 0.2), 0.5)

def gulp(d=0.45, f=85):  # wet low swallow
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.sin(np.pi * tt / d))) / SR) * np.sin(np.pi * tt / d) ** 2
    x += lp(noise(d), 400, 4) * np.sin(np.pi * tt / d) ** 2 * 0.4
    return norm(x, 0.7)

def jawcreak(d=1.1):
    tt = t_(d); pulses = (np.sin(2 * np.pi * (14 + 10 * tt / d) * tt) > 0.94).astype(float)
    return norm(bp(lp(pulses, 1800), 120, 1200) * env(len(tt), 0.2, 0.3), 0.55)

def bubbling(d=4.5, rate=6, seed=4):  # acid: slow low pops
    r = np.random.default_rng(seed); out = lp(noise(d), 120, 4) * 0.25
    for _ in range(int(d * rate)):
        t0 = r.uniform(0, d); f0 = r.uniform(160, 380); du = r.uniform(0.06, 0.12); u = t_(du)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.8 * u / du)) / SR) * np.exp(-u / (du * 0.35)) * r.uniform(0.4, 1)
        s0 = int(t0 * SR); m = min(len(b), len(out) - s0); out[s0:s0 + m] += b[:m]
    return norm(out * env(len(out), 0.4, 0.5), 0.55)

def shimmer(d=1.0):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) * a for f, a, k in [(659.3, 1, 2.5), (987.8, 0.6, 3), (1318.5, 0.35, 4)])
    return norm(x * env(len(tt), 0.15, 0.3), 0.4)

def rewind(d=0.85):  # tape rewind: fast low warble rising (low-passed)
    tt = t_(d); f = 120 + 900 * (tt / d) ** 1.5; x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5
    x = lp(x, 1400, 4) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * tt)) + lp(sweep_bp(noise(d), 200, 1500, q=0.6), 1800) * 0.5
    return norm(x * env(len(tt), 0.05, 0.12), 0.6)

def snap(d=0.25):  # jaws snap shut on the shoulder
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(380, 45), (900, 70), (1500, 90)]) + lp(noise(d), 1500) * np.exp(-tt * 80) * 0.6
    return norm(x, 0.8)

def typing(d=2.8, rate=9, seed=3):  # keyboard clicks (soft, low-passed)
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(int(d * rate)):
        s = int(r.uniform(0, d) * SR); u = t_(0.03); b = (bp(noise(0.03), 900, 3500) * np.exp(-u * 160) + np.sin(2 * np.pi * r.uniform(500, 700) * u) * np.exp(-u * 120) * 0.5) * r.uniform(0.5, 1)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 4000) * env(len(out), 0.1, 0.3), 0.5)

def clockticks(d=0.9, n=8):
    out = np.zeros(int(d * SR))
    for k in range(n):
        s = int(k / n * d * SR); b = tick(0.06, 2000 + 60 * k); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.6)

def wobble(d=1.2):  # woozy pitch-bending low tone for "drunk"
    tt = t_(d); f = 220 * (1 + 0.12 * np.sin(2 * np.pi * 1.6 * tt)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return norm(lp(x, 900) * env(len(tt), 0.2, 0.4), 0.45)

def bonk(d=0.4):  # ball off the head
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(330 * (1 - 0.35 * tt / d)) / SR) * np.exp(-tt * 12) + lp(noise(d), 1200) * np.exp(-tt * 60) * 0.5
    return norm(x, 0.7)

def bounce(d=0.15, f=160):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) + lp(noise(d), 800) * np.exp(-tt * 80) * 0.3, 0.5)

def thunder(d=1.4):
    tt = t_(d); x = lp(noise(d), 180, 4) * (np.exp(-tt * 2.5) + 0.6 * np.exp(-np.abs(tt - 0.25) * 8))
    return norm(x * env(len(tt), 0.01, 0.4), 0.8)

def rain(d=1.4):
    r = np.random.default_rng(12); out = np.zeros(int(d * SR))
    for _ in range(int(d * 60)):
        s = int(r.uniform(0, d) * SR); u = t_(0.01); b = np.sin(2 * np.pi * r.uniform(900, 1800) * u) * np.exp(-u * 400) * r.uniform(0.2, 0.6)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 3000) * env(len(out), 0.2, 0.4), 0.4)

def blackout(d=0.6):  # brain switches off: falling "power-down" + soft thump
    tt = t_(d); f = 260 * (0.3 ** (tt / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3)
    return norm(lp(x, 700) + np.sin(2 * np.pi * 45 * tt) * np.exp(-tt * 10) * 0.6, 0.6)

def wakeup(d=0.5):
    tt = t_(d); f = 160 * (2.2 ** (tt / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.02, 0.15)
    return norm(lp(x, 900), 0.5)

def dream(d=2.4):  # hallucination shimmer pad
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt * (1 + 0.01 * np.sin(2 * np.pi * 0.7 * tt + k))) * a for k, (f, a) in enumerate([(392, 1), (466.2, 0.6), (587.3, 0.5), (932.3, 0.25)]))
    return norm(x * env(len(tt), 0.5, 0.8) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * tt)), 0.35)

def flop(d=0.5):  # body onto mattress
    tt = t_(d); x = lp(noise(d), 500, 4) * np.exp(-tt * 9) + np.sin(2 * np.pi * np.cumsum(70 * (1 + np.exp(-tt * 20))) / SR) * np.exp(-tt * 8) * 0.7
    return norm(x, 0.7)

def click(d=0.08):
    tt = t_(d); return norm(np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 200) + lp(noise(d), 2500) * np.exp(-tt * 300) * 0.5, 0.5)

def wash(d=1.6):  # cleaning wave
    tt = t_(d); x = lp(sweep_bp(noise(d), 200, 900, q=0.9), 1200, 4) * env(len(tt), 0.4, 0.6) + shimmer(d) * 0.4
    return norm(x, 0.55)

def hum(d, f=55):  # station interior hum (only inside the airlock)
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * a for m, a in [(1, 1), (2, 0.4), (3, 0.2)])
    return norm(lp(x, 400) * env(len(tt), 0.3, 0.6), 0.4)

def depress(d=1.0):  # air vents out of the airlock: low rush that drains to silence
    tt = t_(d); x = lp(sweep_bp(noise(d), 700, 120, q=1.0), 900, 4) * np.exp(-tt * 2.2)
    return norm(x * env(len(tt), 0.03, 0.3), 0.8)

def balloon(d=0.6, f0=140, f1=420):  # inflating (rubbery rising tone)
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * tt))
    return norm(lp(x, 1500) * env(len(tt), 0.05, 0.1), 0.5)

def kaboom(d=1.4):
    tt = t_(d); x = lp(noise(d), 600, 4) * np.exp(-tt * 3) + np.sin(2 * np.pi * np.cumsum(50 * (1 + 2 * np.exp(-tt * 12))) / SR) * np.exp(-tt * 3) * 0.8
    return norm(x * env(len(tt), 0.003, 0.4), 0.95)

def exhale(d=1.0):  # air leaving the lungs (soft, low-passed, no hiss)
    tt = t_(d); x = lp(bp(noise(d), 150, 1200), 1200, 4) * np.exp(-tt * 2.5) * env(len(tt), 0.04, 0.3)
    return norm(x, 0.6)

def fizz(d=1.6, rate=40, seed=7):  # boiling: tiny low-passed pops
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(int(d * rate)):
        s = int(r.uniform(0, d) * SR); u = t_(0.02); b = np.sin(2 * np.pi * r.uniform(700, 1500) * u) * np.exp(-u * 250) * r.uniform(0.3, 1)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 3500) * env(len(out), 0.2, 0.3), 0.5)

def heart(d=0.5, f=48):
    tt = t_(d); y = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 18); s0 = int(0.15 * SR); y[s0:] += np.sin(2 * np.pi * f * tt[:len(tt) - s0]) * np.exp(-tt[:len(tt) - s0] * 18) * 0.7
    return norm(lp(y, 200), 0.8)

def alarm(d=0.5):  # soft O2 warning blip (low, not shrill)
    tt = t_(d); x = np.sin(2 * np.pi * 520 * tt) * ((tt % 0.25) < 0.12)
    return norm(lp(x, 1500) * env(len(tt), 0.01, 0.05), 0.4)

def jet(d=0.9):  # rescuer's thruster puffs
    tt = t_(d); x = lp(noise(d), 500, 4) * (np.sin(2 * np.pi * 3.5 * tt) > 0.2) 
    return norm(lp(x, 500) * env(len(tt), 0.05, 0.2), 0.5)

def clunk(d=0.5):  # hatch / airlock re-pressurize thunk
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(90, 10), (180, 16), (420, 30)])
    return norm(x + lp(noise(d), 600) * np.exp(-tt * 30) * 0.4, 0.8)

def repress(d=1.0):  # air rushing back in
    tt = t_(d); return norm(lp(sweep_bp(noise(d), 150, 600, q=1.0), 800, 4) * env(len(tt), 0.3, 0.4), 0.6)

def gasp(d=0.5):  # comic intake (tonal, low): rising vowel-ish tone, not breath noise
    tt = t_(d); f = 180 * (1.6 ** (tt / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return norm(lp(x, 1000) * env(len(tt), 0.05, 0.15), 0.4)

def marimba(f, d=0.6):
    tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) + 0.25 * np.sin(2 * np.pi * f * 3.9 * tt) * np.exp(-tt * 22) + 0.1 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt * 45)
    return x * env(len(tt), 0.003, 0.05)

def slip_run(d=1.8):  # descending marimba run for the slip
    out = np.zeros(int(d * SR)); t0 = 0.0
    for i, f in enumerate([659.3, 587.3, 493.9, 440.0, 392.0, 329.6, 293.7, 246.9]):
        n = marimba(f, 0.7); s0 = int(t0 * SR); m = min(len(n), len(out) - s0)
        if m > 0: out[s0:s0 + m] += n[:m] * (0.75 + 0.25 * i / 8)
        t0 += 0.16 * (0.88 ** i)
    return norm(out, 0.7)

def rumble(d=3.0):  # volcano rumble (deep, slow)
    tt = t_(d); x = lp(noise(d), 90, 4) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt)) + np.sin(2 * np.pi * 38 * tt) * 0.3
    return norm(x * env(len(tt), 0.6, 0.8), 0.7)

def blorp(d=0.6, f=70):  # lava bubble pop (thick, low)
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * tt / d)) / SR) * np.exp(-tt * 7) + lp(noise(d), 300, 4) * np.exp(-tt * 12) * 0.4
    return norm(x, 0.7)

def sizzle_low(d=1.0):  # rock lands on lava: low thump + crackle (no hiss)
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(60 * (1 + np.exp(-tt * 20))) / SR) * np.exp(-tt * 6)
    x += crackle(d, 30, 5) * 0.5
    return norm(x, 0.85)

def whoomph(d=0.8):  # clothes catch fire
    tt = t_(d); x = lp(sweep_bp(noise(d), 150, 900, q=1.2), 1100, 4) * env(len(tt), 0.04, 0.5, 1.3)
    return norm(x, 0.8)

def heatwave(d=2.5):  # rising heat: slow low swell + shimmering partials
    tt = t_(d); x = lp(noise(d), 200, 4) * (tt / d) + sum(np.sin(2 * np.pi * f * tt * (1 + 0.004 * np.sin(2 * np.pi * 5 * tt))) * a for f, a in [(220, 0.3), (330, 0.2)]) * (tt / d)
    return norm(x * env(len(tt), 0.3, 0.3), 0.55)

def cough(d=0.3, f=180):  # cartoon cough: short tonal bark (low)
    tt = t_(d); x = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 16) + lp(noise(d), 700) * np.exp(-tt * 25) * 0.4
    return norm(lp(x, 1200), 0.55)

def footsteps_suit(d=0.9):
    out = np.zeros(int(d * SR))
    for k in range(3):
        s = int(k * 0.3 * SR); b = step(0.18, 80) + clink(0.18) * 0.15; out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.6)

# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

put(0.0, 'rumble', rumble(3.0), -15)
put(0.2, 'card_in', popup(400, 0.25), -12)
put(0.15, 'selfie', click(0.08), -14)
put(1.15, 'slip', slip_run(1.8), -9)
put(1.3, 'fall', whoosh(1.4, up=False), -12)
put(3.05, 'slowmo', powerdown(0.9), -13)
put(4.3, 'blorp1', blorp(0.6, 65), -14)
put(5.3, 'rock_fall', lp(sweep_bp(noise(0.85), 1200, 250, q=0.7), 1600) * env(int(0.85 * SR), 0.3, 0.05), -12)
put(6.15, 'rock_land', sizzle_low(1.0), -8)
put(6.0, 'chart', popup(520, 0.2), -13)
put(8.43, 'card_mud', tick(0.12, 1600), -13)
put(9.6, 'blorp2', blorp(0.6, 75), -14)
put(11.9, 'thermo', popup(460, 0.2), -13)
for k in range(10): put(12.0 + k * 0.19, f'deg{k}', tick(0.06, 1400 + 80 * k), -17)
put(12.4, 'heat', heatwave(3.5), -11)
put(14.04, 'card_heat', tick(0.12, 1500), -13)
put(17.62, 'ignite', whoomph(0.8), -8)
put(17.8, 'burn', crackle(4.5, 20, 13), -14)
put(18.75, 'gas', lp(sweep_bp(noise(1.6), 120, 500, q=1.0), 700, 4) * env(int(1.6 * SR), 0.4, 0.6), -13)
put(19.15, 'cough1', cough(0.3, 170), -11); put(19.6, 'cough2', cough(0.3, 160), -12); put(20.2, 'cough3', cough(0.3, 150), -13)
put(20.3, 'o2', popup(480, 0.2), -13); put(20.75, 'no_o2', slash(0.22), -10)
put(22.4, 'fly_up', whoosh(1.5, up=True), -12)
put(24.4, 'suit_shine', chime(0.9, 1318.5), -14)
put(25.9, 'step_back', footsteps_suit(0.9), -12)
put(26.0, 'safe', stamp_hit(0.6, 80), -9); put(26.05, 'ok', chime(1.0, 1046.5), -12)

bed = lp(bed, 5000, 4)
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.01, 0.3, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_volcano_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
