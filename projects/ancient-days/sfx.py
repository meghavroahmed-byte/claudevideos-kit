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
DUR = 35.4
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(10000)


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


# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

put(0.25, 'card_in', popup(400, 0.25), -12)
for k, at in enumerate([3.51, 4.26, 5.41]):                          # job / office / money badges pop up
    put(at, f'badge{k}', popup(480 + 90 * k, 0.2), -11)
    put(at + 0.3, f'no{k}', slash(0.22), -11)                          # ...and get a red "no" line
put(6.0, 'badges_out', whoosh(0.5, up=False), -18)
put(6.6, 'spear_rock', knock(380, 0.25), -15)                        # spear leans on the rock
put(6.98, 'sit', step(0.2, 70), -11)                                 # sits down on the rock
put(7.5, 'stretch', lp(whoosh(0.6, up=True), 700), -20)
put(9.03, 'nope', stamp_hit(0.6), -8)                                # NOPE!
put(9.25, 'spring', whoosh(0.4, up=True), -15)                       # jumps up, grabs the spear
for k in range(8): put(9.42 + k * 0.27, f'run{k}', step(0.14, 85 + (k % 2) * 15), -13)   # running through grass
put(11.4, 'card_hunt', tick(0.12, 1600), -12)
put(11.62, 'gallop', hooves(1.4, 11, 3), -12); put(11.68, 'gallop2', hooves(1.3, 10, 4), -15)
put(11.84, 'throw', spear_fly(0.45), -10)
put(12.3, 'thunk', thunk(0.35), -10)
put(12.52, 'card_gather', tick(0.12, 1500), -13)
put(12.62, 'leaves1', rustle(0.45, 1), -13); put(12.95, 'basket1', plop(0.25, 210), -12)
put(13.18, 'leaves2', rustle(0.4, 2), -14); put(13.5, 'basket2', plop(0.25, 240), -12)
put(13.5, 'river', stream(2.8), -17)                                 # river only while we're at it
put(13.84, 'card_fish', tick(0.12, 1700), -13)
put(13.86, 'splash', splash(1.0), -9)
put(14.05, 'fishflap', flap(0.8), -14)
put(14.59, 'card_water', tick(0.12, 1550), -13)
put(15.2, 'dip', glug(0.6), -11)
put(15.6, 'clean', chime(1.0, 1318.5), -13)
put(16.2, 'to_camp', whoosh(0.6, up=True), -18)
put(16.87, 'card_shelter', tick(0.12, 1600), -13)
for k in range(8): put(16.9 + k * 0.055, f'pole{k}', knock(300 + 25 * k, 0.15), -17)   # poles go up
put(17.02, 'hammer1', knock(260, 0.2), -12); put(17.72, 'hammer2', knock(250, 0.2), -12)
put(17.35, 'cover', flap_cloth(0.5), -12)                            # hide cover pulled on
put(17.89, 'card_tools', tick(0.12, 1650), -13)
for k, at in enumerate([17.95, 18.22, 18.48]): put(at, f'knap{k}', clink(0.18), -11)  # flint knapping
put(18.65, 'axe_done', chime(0.8, 1046.5), -15)
put(18.83, 'card_food', tick(0.12, 1550), -13)
put(18.8, 'fire', crackle(1.7), -13); put(18.87, 'flare', fireup(0.9), -12)
put(20.09, 'card_protect', tick(0.12, 1500), -13)
put(19.9, 'paws_in', paws(1.0, 9, 6), -17)
put(20.85, 'growl1', growl(1.2, 62), -10); put(21.05, 'growl2', growl(0.9, 75), -13)   # wolves snarl
put(21.6, 'torch', fireup(0.8), -8)                                  # torch thrust
put(21.85, 'paws_out', paws(0.8, 15, 7), -14)                        # wolves run off
put(22.6, 'to_farm', whoosh(0.8, up=True), -18)
put(23.04, 'card_farm', tick(0.12, 1600), -13)
put(23.05, 'till', lp(whoosh(1.1, up=True), 800), -18)              # soil rolls out
for k, at in enumerate([23.275, 24.025, 24.775]): put(at, f'hoe{k}', dig(0.3), -11)
put(24.88, 'grow', grow(1.1), -10)                                   # crops shoot up
put(24.91, 'card_crops', tick(0.12, 1700), -13)
put(25.95, 'card_stock', tick(0.12, 1500), -13)
for k in range(7): put(26.05 + k * 0.09, f'animal{k}', popup(330 + 40 * k, 0.16), -14)
put(26.35, 'hooves_pen', paws(0.7, 10, 8), -18)
put(27.0, 'rise', whoosh(1.4, up=True), -15)                         # camera cranes up over the village
put(27.21, 'card_village', tick(0.12, 1600), -13)
for k, d in enumerate(sorted([7.52, 4.61, 1.22, 2.66, 6.52, 8.16, 7.82, 3.64, 7.66, 6.86, 6.88, 10.98, 9.49, 10.4])):
    put(27.15 + d * 0.08 + 0.3, f'house{k}', thatch(0.4, 85 + 6 * k), -15)   # homes rise one by one
put(29.6, 'swoop', whoosh(1.3, up=False), -14)                       # dive down to him
put(29.79, 'surprise', popup(620, 0.3), -14)
for k, at in enumerate([30.575, 31.29, 31.67, 32.05, 32.43, 32.81, 33.19]): put(at, f'chop{k}', chop(0.4), -10 if k == 0 else -12)
put(31.1, 'timelapse', riser(2.2), -13)                              # the day races by
for k in range(12): put(31.13 + k * 0.185, f'clock{k}', tick(0.06, 2200 - 40 * k), -19)
put(33.36, 'ftj', stamp_hit(0.6, 60), -8); put(33.4, 'sting', sting(1.6), -11)

bed = lp(bed, 5000, 4)  # no hiss on top
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.01, 0.3, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_ancient-days_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
