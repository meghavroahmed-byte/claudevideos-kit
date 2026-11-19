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
DUR = 32.0
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(8080)


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

# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

put(0.2, 'card_in', popup(400, 0.25), -12)
put(0.75, 'emerge', splash(1.0), -10)
put(0.9, 'rise', slither(1.5, 1), -14)
put(2.9, 'turn', lp(whoosh(0.35, up=True), 900), -17)
put(4.4, 'lunge', whoosh(0.35, up=True), -11)
put(4.7, 'snap', snap(0.25), -9)
put(4.72, 'fang', popup(460, 0.2), -13); put(5.22, 'no_bite', slash(0.22), -10)
put(6.0, 'wrap', slither(1.4, 2), -10)
for k, b in enumerate([7.5, 8.6, 10.0, 10.9]): put(b, f'squeeze{k}', strain(0.7, 66 + 4 * k), -9 + k * 0.5)
put(11.15, 'heart_pop', popup(380, 0.2), -14)
for k, b in enumerate([11.45, 12.07, 12.8]): put(b, f'beat{k}', heartbeat(0.5, 50), -8 - 4 * k)
put(12.6, 'fade', powerdown(0.9), -13)
put(13.55, 'collapse', thunk(0.35), -10)
put(13.6, 'unwind', slither(1.0, 3), -15)
put(13.85, 'jaws', jawcreak(1.1), -11)
for k, b in enumerate([15.8, 16.5, 17.2, 17.9, 18.55]): put(b, f'gulp{k}', gulp(0.45, 80 + 6 * k), -10)
put(15.6, 'pull', slither(3.0, 5), -16)
put(19.1, 'xray', shimmer(1.0), -12)
put(20.0, 'o2', popup(520, 0.2), -12); put(20.4, 'no_air', slash(0.22), -10)
put(21.1, 'acid', bubbling(4.8), -12)
for k in range(4): put(24.35 + k * 0.38, f'week{k}', tick(0.12, 1500 + 100 * k), -15)
put(26.17, 'rewind', rewind(0.85), -9)
put(27.4, 'card_luck', popup(440, 0.2), -13)
put(27.1, 'slide_in', slither(1.2, 6), -15)
put(28.3, 'jaws2', jawcreak(0.9), -12)
for k in range(3): put(29.4 + k * 0.42, f'push{k}', strain(0.4, 80), -14)
put(29.5, 'bars', popup(600, 0.2), -13)
put(30.5, 'too_wide', stamp_hit(0.6), -8)
put(31.0, 'leave', slither(1.0, 7), -14)

bed = lp(bed, 5000, 4)
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.01, 0.3, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_anaconda_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
