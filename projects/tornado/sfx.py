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
DUR = 28.0
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(5959)


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
    r = np.random.default_rng(5959); out = np.zeros(int(d * SR))
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

def rainfall(d, rate=90, seed=3):  # rain: many tiny low-passed taps (no hiss)
    r = np.random.default_rng(seed); out = lp(noise(d), 250, 4) * 0.15
    for _ in range(int(d * rate)):
        s = int(r.uniform(0, d) * SR); u = t_(0.012); b = np.sin(2 * np.pi * r.uniform(600, 1500) * u) * np.exp(-u * 350) * r.uniform(0.2, 0.7)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 3200) * env(len(out), 0.4, 0.3), 0.45)

def thunder(d=2.5, seed=4):
    r = np.random.default_rng(seed); tt = t_(d); x = lp(noise(d), 160, 4) * (np.exp(-tt * 1.2) + 0.5 * np.exp(-np.abs(tt - 0.3) * 5))
    return norm(x * env(len(tt), 0.01, 0.6), 0.8)

def crack(d=0.9):  # the strike: sharp low-passed snap + boom
    tt = t_(d); x = lp(noise(d), 2500) * np.exp(-tt * 40) + np.sin(2 * np.pi * np.cumsum(55 * (1 + 2 * np.exp(-tt * 15))) / SR) * np.exp(-tt * 3) + lp(noise(d), 200, 4) * np.exp(-tt * 2.5) * 0.8
    return norm(x, 1.0)

def freeze(d=1.2):  # time stops: low falling tone + ringing
    tt = t_(d); f = 400 * (0.25 ** (tt / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.01, 0.5) + shimmer(d) * 0.4
    return norm(lp(x, 2000), 0.6)

def buzz(d, f=60):  # electric hum while the current runs (low, buzzy, low-passed)
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * f * tt)) * 0.4 + np.sin(2 * np.pi * f * 2 * tt) * 0.3
    x *= 0.7 + 0.3 * (np.random.default_rng(5959).random(len(tt)) > 0.97)
    return norm(lp(x, 900, 4) * env(len(tt), 0.2, 0.4), 0.5)

def zap(d=0.2):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * np.cumsum(900 * (1 - 0.6 * tt / d)) / SR)) * np.exp(-tt * 20)
    return norm(lp(x, 2500), 0.45)

def pop(d=0.25, f=220):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * np.exp(-tt * 40))) / SR) * np.exp(-tt * 18) + lp(noise(d), 1200) * np.exp(-tt * 60) * 0.5, 0.7)

def resume(d=0.6):
    tt = t_(d); f = 120 * (4 ** (tt / d)); return norm(lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.05, 0.1), 1200), 0.55)

def flop(d=0.5):
    tt = t_(d); x = lp(noise(d), 500, 4) * np.exp(-tt * 9) + np.sin(2 * np.pi * np.cumsum(70 * (1 + np.exp(-tt * 20))) / SR) * np.exp(-tt * 8) * 0.7
    return norm(x, 0.7)

def squelch(d=0.4, f=90):  # foot into wet sand
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt * 15))) / SR) * np.exp(-tt * 9) + lp(noise(d), 600, 4) * np.exp(-tt * 12) * 0.5
    return norm(x, 0.7)

def suck(d=0.6):  # sinking: low sucking glug
    tt = t_(d); f = 140 * (0.5 ** (tt / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) + lp(noise(d), 300, 4) * np.sin(np.pi * tt / d) * 0.5
    return norm(x, 0.65)

def strain(d=0.5, f=75):
    tt = t_(d); pulses = (np.sin(2 * np.pi * 24 * tt) > 0.9).astype(float)
    x = bp(lp(pulses, 1400) + 0.05 * noise(d), 80, 900) * env(len(tt), 0.08, 0.2) + np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * 0.6
    return norm(x, 0.6)

def heavy(d=0.8):  # car weight: deep "clunk" + low drone
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(50 * (1 + np.exp(-tt * 20))) / SR) * np.exp(-tt * 3) + lp(noise(d), 200, 4) * np.exp(-tt * 6) * 0.6
    return norm(x, 0.85)

def seep(d=2.4):  # water trickling in (low bubbly)
    return norm(lp(stream(d, rate=25, fmin=200, fmax=700, seed=11), 1500) * env(int(d * SR), 0.4, 0.6), 0.55)

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


def surf(d, seed=2):  # gentle waves on the beach (low wash, no hiss)
    tt = t_(d); x = lp(noise(d), 350, 4) * (0.4 + 0.6 * np.sin(2 * np.pi * 0.25 * tt) ** 2)
    return norm(x * env(len(tt), 0.5, 0.6), 0.5)

def roar(d, f0=60):  # the tsunami: deep rolling roar
    tt = t_(d); x = lp(noise(d), 220, 4) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * tt)) + np.sin(2 * np.pi * f0 * tt) * 0.25
    return norm(x * env(len(tt), 0.8, 0.8), 0.75)

def jetpass(d=3.0):  # jet flyby: rising/falling low whoosh + engine tone
    tt = t_(d); f = 160 * (1 + 0.25 * np.tanh((d / 2 - tt) * 2)); x = lp(sweep_bp(noise(d), 300, 900, q=1.2), 1500, 4) * np.sin(np.pi * tt / d) ** 2 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2 * np.sin(np.pi * tt / d) ** 2
    return norm(x, 0.7)

def crash(d=2.0):  # wave breaking on the town
    tt = t_(d); x = lp(noise(d), 1500, 4) * np.exp(-tt * 1.5) + np.sin(2 * np.pi * np.cumsum(45 * (1 + np.exp(-tt * 10))) / SR) * np.exp(-tt * 2) * 0.8
    return norm(x * env(len(tt), 0.01, 0.6), 0.95)

def clank(d=0.4, f=180):  # car bumping in the water
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, k in [(1, 14), (2.6, 22), (4.1, 35)])
    return norm(x, 0.6)

def stairs(d=8.0, rate=3.2):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); b = clank(0.15, 260 + 20 * (k % 3)) * 0.6 + step(0.15, 100) * 0.6; out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.6)

def lap(d, seed=3):  # water lapping the raft (low, gentle)
    tt = t_(d); x = lp(noise(d), 300, 4) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.45 * tt) ** 2)
    return norm(x * env(len(tt), 0.4, 0.4), 0.45)

def dayding(d=0.9, f=784):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) * a for m, a, k in [(1, 1, 3), (1.5, 0.5, 4), (2, 0.3, 5)])
    return norm(x * env(len(tt), 0.005, 0.2), 0.45)

def sizzle_sun(d=1.4):  # heat: low shimmering swell
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt * (1 + 0.006 * np.sin(2 * np.pi * 6 * tt))) * a for f, a in [(220, 0.4), (330, 0.3), (440, 0.15)])
    return norm(x * env(len(tt), 0.3, 0.4), 0.35)

def horn(d=1.6, f=110):  # ship horn
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * a for m, a in [(1, 1), (2, 0.5), (3, 0.3), (4, 0.15)])
    return norm(lp(x, 900) * env(len(tt), 0.08, 0.3), 0.7)

def plink(d=0.2, f=1300):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30), 0.4)

def chewing(d=1.4, rate=6.5):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.08); b = lp(noise(0.08), 900, 4) * np.exp(-u * 40) * 0.6 + np.sin(2 * np.pi * 140 * u) * np.exp(-u * 50) * 0.3
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

def inflate(d=0.6):
    tt = t_(d); f = 200 * (2 ** (tt / d)); return norm(lp(np.sin(2 * np.pi * np.cumsum(f) / SR), 1200) * env(len(tt), 0.05, 0.05) * 0.6, 0.45)

def bubblepop(d=0.2):
    tt = t_(d); return norm(lp(noise(d), 2500) * np.exp(-tt * 60) + np.sin(2 * np.pi * 500 * tt) * np.exp(-tt * 40) * 0.5, 0.7)

def swallow(d=0.5):
    tt = t_(d); f = 260 * (0.45 ** (tt / d)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) + lp(noise(d), 400) * np.sin(np.pi * tt / d) * 0.3, 0.6)

def xray(d=0.9):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(440, 0.5), (660, 0.4), (880, 0.3)]) * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * tt))
    return norm(x * env(len(tt), 0.2, 0.3), 0.4)

def slide(d=4.0):  # gum gliding through the intestines (soft wobbly low tone)
    tt = t_(d); f = 180 + 40 * np.sin(2 * np.pi * 1.3 * tt); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + lp(noise(d), 300, 4) * 0.4
    return norm(x * env(len(tt), 0.3, 0.5), 0.45)

def alarmlow(d=1.2):
    tt = t_(d); x = np.sin(2 * np.pi * 330 * tt) * ((tt % 0.4) < 0.2); return norm(lp(x, 1200) * env(len(tt), 0.01, 0.1), 0.45)

def spit(d=0.35):
    tt = t_(d); return norm(lp(noise(d), 1800) * np.exp(-tt * 25) + np.sin(2 * np.pi * np.cumsum(500 * (1 - 0.5 * tt / d)) / SR) * np.exp(-tt * 20) * 0.4, 0.6)

def binthud(d=0.4):
    tt = t_(d); return norm(np.sin(2 * np.pi * 120 * tt) * np.exp(-tt * 15) + np.sin(2 * np.pi * 380 * tt) * np.exp(-tt * 25) * 0.4, 0.7)

def giggle(d=0.6, f=520, seed=1):  # cartoon "ha" syllables: short tonal bursts (low-passed, not squeaky)
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); n = 4
    for k in range(n):
        s = int(k / n * d * SR); u = t_(0.11); ff = f * (1 + 0.05 * r.standard_normal())
        b = (np.sin(2 * np.pi * ff * u) + 0.5 * np.sin(4 * np.pi * ff * u) + 0.25 * np.sin(6 * np.pi * ff * u)) * np.sin(np.pi * u / 0.11) ** 2
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 1500), 0.35)

def wiggle(d, rate=14, seed=2):  # fingers on fabric: soft brushes
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.05); b = lp(bp(noise(0.05), 300, 1800), 1800) * np.sin(np.pi * u / 0.05) * r.uniform(0.4, 1)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(out * env(len(out), 0.1, 0.2), 0.45)

def question(d=0.5):
    tt = t_(d); f = 400 * (1.5 ** (tt / d)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.02, 0.15), 0.4)

def predict(d=1.2):  # predicted path: soft rising arpeggio
    tt = t_(d); out = np.zeros(len(tt))
    for k, f in enumerate([523.3, 659.3, 784, 1046.5]):
        s0 = int(k * 0.12 * SR); u = tt[:len(tt) - s0]; out[s0:] += np.sin(2 * np.pi * f * u) * np.exp(-u * 5) * 0.6
    return norm(out * env(len(tt), 0.01, 0.3), 0.4)

def deflate(d=1.4):
    tt = t_(d); f = 500 * (0.3 ** (tt / d)); return norm(lp(np.sin(2 * np.pi * np.cumsum(f) / SR), 1200) * env(len(tt), 0.05, 0.3), 0.5)

def heave(d, rate=1.6):  # team hauling: rhythmic low grunts (tonal, low) + rope creak
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.25); b = (np.sin(2 * np.pi * 110 * u) + 0.4 * np.sin(2 * np.pi * 220 * u)) * np.sin(np.pi * u / 0.25) ** 2 * 0.5
        b += bp(lp((np.sin(2 * np.pi * 30 * u) > 0.92).astype(float), 1200), 150, 900) * 0.6
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 1200), 0.55)

def scrape(d):  # sled scraping on sand
    tt = t_(d); return norm(lp(bp(noise(d), 120, 900), 900, 4) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.6 * tt) ** 2) * env(len(tt), 0.3, 0.4), 0.5)

def rooster(d=0.9):  # sunrise: soft horn-like rising call (low-passed, not a squeak)
    tt = t_(d); f = 330 * (1 + 0.5 * np.sin(np.pi * tt / d)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return norm(lp(x, 1400) * env(len(tt), 0.1, 0.3), 0.4)

def pour(d=2.6):
    return norm(lp(stream(d, rate=50, fmin=300, fmax=900, seed=8), 1600) * env(int(d * SR), 0.2, 0.4), 0.5)

def cheer(d=1.6):  # crowd "hey!" (low tonal swell)
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt * (1 + 0.02 * np.sin(2 * np.pi * (3 + i) * tt))) for i, f in enumerate([180, 220, 260, 300])) * np.sin(np.pi * tt / d) ** 0.5
    return norm(lp(x, 1200) * env(len(tt), 0.05, 0.6), 0.5)

def clank(d=0.35, f=420, seed=1):  # armour plate clank (metallic, low-passed)
    r = np.random.default_rng(seed); tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k) for m, k in [(1, 12), (2.76, 18), (5.4, 30), (8.9, 45)])
    return norm(lp(x + lp(noise(d), 2500) * np.exp(-tt * 80) * 0.4, 4500), 0.6)

def strap(d=0.25):
    tt = t_(d); return norm(lp(bp(noise(d), 300, 2000), 2500) * np.exp(-tt * 18) + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 60) * 0.3, 0.5)

def clockrun(d=2.0, rate=10):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); b = tick(0.05, 2000); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

def swordclash(d=0.6):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(1250, 6), (1830, 8), (2650, 11)]) + lp(noise(d), 3500) * np.exp(-tt * 60) * 0.5
    return norm(lp(x, 4500), 0.6)

def tummy(d=0.9):  # stomach rumble (low gurgle)
    tt = t_(d); f = 70 + 30 * np.sin(2 * np.pi * 3 * tt); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt)) + lp(noise(d), 200, 4) * 0.4
    return norm(x * env(len(tt), 0.1, 0.3), 0.6)

def trombone(d=1.4):  # comic "wah-wah" (low brassy fall)
    tt = t_(d); out = np.zeros(len(tt))
    for k, f0 in enumerate([233, 220, 207, 185]):
        s = int(k * 0.3 * SR); u = t_(0.5 if k < 3 else 0.6); f = f0 * (1 - 0.03 * u / u[-1]) * (1 + 0.02 * np.sin(2 * np.pi * 6 * u)); b = sum(np.sin(2 * np.pi * np.cumsum(f * m) / SR) * a for m, a in [(1, 1), (2, 0.5), (3, 0.3)]) * env(len(u), 0.03, 0.15)
        out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 1500), 0.5)

def hum(d, f=60):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * a for m, a in [(1, 1), (2, 0.4), (3, 0.2)]); return norm(lp(x, 400) * env(len(tt), 0.3, 0.5), 0.4)

def twang(d=0.9, f=110):  # steel cable snapping
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * np.exp(-tt * 10))) / SR) * np.exp(-tt * 5) + lp(noise(d), 3000) * np.exp(-tt * 60) * 0.7
    return norm(lp(x, 4000), 0.85)

def screech(d=1.2):  # brake shoes biting the rail (low-passed metal grind, not shrill)
    tt = t_(d); x = bp(noise(d), 500, 2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt)) + np.sin(2 * np.pi * 420 * tt) * 0.3
    return norm(lp(x, 2600) * env(len(tt), 0.02, 0.4), 0.7)

def drop(d=1.0):
    tt = t_(d); return norm(lp(sweep_bp(noise(d), 800, 200, q=0.8), 1200) * env(len(tt), 0.3, 0.1), 0.7)

def boing(d=0.9, f=90):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.5 * np.sin(2 * np.pi * 8 * tt) * np.exp(-tt * 4))) / SR) * np.exp(-tt * 3)
    return norm(lp(x, 900), 0.7)

def ding(d=1.2):
    tt = t_(d); return norm((np.sin(2 * np.pi * 1318.5 * tt) + 0.5 * np.sin(2 * np.pi * 1046.5 * tt)) * np.exp(-tt * 3) * env(len(tt), 0.005, 0.3), 0.45)

def wind(d):  # icy wind: slow low swells (no hiss)
    tt = t_(d); x = lp(bp(noise(d), 80, 600), 500, 4) * (0.4 + 0.6 * np.sin(2 * np.pi * 0.18 * tt) ** 2)
    return norm(x * env(len(tt), 0.8, 1.0), 0.55)

def tinkle(d=1.6, seed=3):  # ice crystals
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(int(d * 14)):
        s = int(r.uniform(0, d) * SR); u = t_(0.15); f = r.uniform(1800, 3200); b = np.sin(2 * np.pi * f * u) * np.exp(-u * 30) * r.uniform(0.2, 0.6); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 4200) * env(len(out), 0.1, 0.4), 0.4)

def chatter(d=3.0, rate=14):  # teeth chattering: tiny clicks
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.02); b = np.sin(2 * np.pi * 1500 * u) * np.exp(-u * 300); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 3000) * env(len(out), 0.2, 0.3), 0.4)

def crunch_steps(d, rate=2.6):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.15); b = lp(bp(noise(0.15), 400, 2500), 2800) * np.exp(-u * 25); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

def doorshut(d=0.5):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(80 * (1 + np.exp(-tt * 20))) / SR) * np.exp(-tt * 10) + lp(noise(d), 800) * np.exp(-tt * 30) * 0.5, 0.8)

def buzz(d, f=210, k=1.0):  # bee buzz: low-passed buzzy tone with flutter (not a squeak)
    tt = t_(d); fq = f * (1 + 0.03 * np.sin(2 * np.pi * 5 * tt)); x = np.sign(np.sin(2 * np.pi * np.cumsum(fq) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(fq * 2) / SR) * 0.2
    return norm(lp(x, 1100, 4) * (0.7 + 0.3 * np.sin(2 * np.pi * 13 * tt)) * env(len(tt), 0.2, 0.3), 0.5 * k)

def poke(d=0.25):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(500 * (1 - 0.5 * tt / d)) / SR) * np.exp(-tt * 25) + lp(noise(d), 2000) * np.exp(-tt * 70) * 0.4, 0.65)

def rip(d=0.4):
    tt = t_(d); return norm(lp(bp(noise(d), 400, 2500), 3000) * np.exp(-tt * 12) * (0.6 + 0.4 * np.sin(2 * np.pi * 40 * tt)), 0.6)

def pump(d=5.0, rate=1.4):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.3); b = np.sin(2 * np.pi * 70 * u) * np.exp(-u * 12); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 300), 0.6)

def flick(d=0.3):
    tt = t_(d); return norm(lp(noise(d), 2200) * np.exp(-tt * 35) + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 40) * 0.3, 0.55)

def hicsnd(d=0.35, f=260):  # the "hic": quick rising tonal blip + glottal click (low-passed)
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * tt / d)) / SR) * np.exp(-tt * 18) + lp(noise(d), 1500) * np.exp(-tt * 120) * 0.6
    return norm(lp(x, 2200), 0.6)

def munch(d=1.4, rate=5):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.15); b = lp(bp(noise(0.15), 300, 2000), 2200) * np.exp(-u * 20); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.55)

def canopen(d=0.4):
    tt = t_(d); return norm(np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 60) + lp(noise(d), 1500) * np.exp(-tt * 8) * 0.4, 0.6)

def fizz(d=1.4, rate=40, seed=7):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(int(d * rate)):
        s = int(r.uniform(0, d) * SR); u = t_(0.02); b = np.sin(2 * np.pi * r.uniform(700, 1500) * u) * np.exp(-u * 250) * r.uniform(0.3, 1); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 3500) * env(len(out), 0.2, 0.3), 0.5)

def giggle(d=0.6, f=520, seed=1):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(4):
        s = int(k / 4 * d * SR); u = t_(0.11); ff = f * (1 + 0.05 * r.standard_normal()); b = (np.sin(2 * np.pi * ff * u) + 0.5 * np.sin(4 * np.pi * ff * u)) * np.sin(np.pi * u / 0.11) ** 2; out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 1500), 0.35)

def crunch(d=0.3):
    tt = t_(d); r = np.random.default_rng(3); out = np.zeros(len(tt))
    for k in range(10):
        s = int(r.uniform(0, d * 0.6) * SR); u = t_(0.02); b = bp(noise(0.02), 800, 3500) * np.exp(-u * 200); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 4000), 0.55)
def roarwind(d=22.0):
    tt = t_(d); x = lp(noise(d), 260, 4) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * tt)) + bp(noise(d), 600, 1600) * 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.3 * tt))
    return norm(x * env(len(tt), 1.0, 1.5), 0.6)

def whistle(d=3.0, f=900):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f + 200 * np.sin(2 * np.pi * 0.8 * tt)) / SR) * env(len(tt), 0.3, 0.5) * 0.4 + bp(noise(d), 1500, 4000) * 0.4 * env(len(tt), 0.3, 0.5), 0.45)

def metalcrash(d=1.0):
    tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(320, 6), (510, 8), (870, 10)]) + lp(noise(d), 3000) * np.exp(-tt * 14), 0.8)

def zips(d=6.0, seed=4):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * 3)):
        s = int(r.uniform(0, d - 0.4) * SR); u = t_(0.35); f = r.uniform(500, 1200); b = bp(r.standard_normal(len(u)), f, f * 2.2) * np.sin(np.pi * u / 0.35) ** 2; out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)


# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

put(0.0, 'roar', roarwind(22.0), -11)
put(3.6, 'count', clockrun(2.6, 18), -16)
put(7.2, 'carlift', metalcrash(1.0), -12)
put(7.6, 'carwhoosh', whoosh(1.2), -13)
put(9.2, 'roof', crack(0.6) if 'crack' in dir() else crunch(0.4), -10)
put(10.8, 'debris', zips(6.4, 4), -12)
put(13.2, 'w1', popup(420, 0.15), -15)
put(13.8, 'glass', tinkle(0.8, 3), -14)
put(14.5, 'metal', clank(0.4, 420) if 'clank' in dir() else tick(0.12, 900), -13)
put(15.2, 'run', crunch_steps(3.2, 4.5), -15)
put(19.7, 'dive', flop(0.5), -11)
put(22.4, 'tunnelwind', whistle(5.6, 800), -11)
put(23.3, 'nope', bonk(0.4), -12)

bed = lp(bed, 5000, 4)
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.01, 0.3, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_tornado_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
