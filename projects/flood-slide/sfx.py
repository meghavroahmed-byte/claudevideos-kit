#!/usr/bin/env python3
"""Synthesizes this video's own SFX palette (sfx/sfx_flood-slide_*.wav) and the timed SFX bed (audio/sfx_bed.wav).

    python sfx.py            # needs numpy + scipy
Every sound here is generated from noise and oscillators: no stock or reused files.
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 30.92
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(1117)


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
    """band-pass whose centre moves from f0 to f1 (block-wise)"""
    out = np.zeros_like(x); n = len(x); b = n // steps + 1
    for i in range(steps):
        f = f0 * (f1 / f0) ** (i / (steps - 1))
        seg = slice(i * b, min(n, (i + 1) * b + 2048))
        y = bp(x[seg], f * (1 - q / 2), f * (1 + q / 2))
        w = np.ones(len(y)); ov = min(2048, len(y))
        if i: w[:ov] = np.linspace(0, 1, ov)
        out[seg] += y * w
    return out


# ---------------- palette ----------------
def whoosh(d=0.55, up=True):
    x = lp(sweep_bp(noise(d), 150 if up else 900, 900 if up else 150, q=0.9), 1100, 4)
    return norm(x * env(len(x), d * 0.55, d * 0.45, 1.6), 0.8)

def gush(d=1.8):  # water rushing through the tube
    x = noise(d)
    body = lp(x, 650, 4) * 1.0 + bp(noise(d), 1200, 2600) * 0.06
    flut = 1 + 0.35 * np.sin(2 * np.pi * 7.3 * t_(d)) * np.sin(2 * np.pi * 1.1 * t_(d))
    return norm(body * flut * env(len(x), 0.25, 0.5, 1.5), 0.9)

def splashloop(d=2.0):  # water pouring out of the exit
    x = bp(noise(d), 400, 6000) * (0.6 + 0.4 * np.abs(lp(noise(d), 12)) * 4)
    return norm(x * env(len(x), 0.1, 0.3), 0.6)

def squeak(d=0.22, f0=1500, f1=1150):  # wet skin on plastic
    tt = t_(d); f = np.linspace(f0, f1, len(tt)) * (1 + 0.04 * np.sin(2 * np.pi * 38 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    x *= 0.6 + 0.4 * (np.abs(np.sin(2 * np.pi * 60 * tt)))
    return norm(x * env(len(tt), 0.02, 0.08), 0.5)

def marimba(f, d=0.6):  # soft wooden mallet note
    tt = t_(d)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) + 0.25 * np.sin(2 * np.pi * f * 3.9 * tt) * np.exp(-tt * 22) + 0.1 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt * 45)
    return x * env(len(tt), 0.003, 0.05)


def slip_run(d=2.2):  # descending marimba run (E minor pentatonic, speeding up) + soft water swish
    out = np.zeros(int(d * SR))
    notes = [659.3, 587.3, 493.9, 440.0, 392.0, 329.6, 293.7, 246.9, 220.0, 164.8]
    t = 0.0
    for i, f in enumerate(notes):
        n = marimba(f, 0.7)
        s0 = int(t * SR); m = min(len(n), len(out) - s0)
        if m > 0: out[s0:s0 + m] += n[:m] * (0.75 + 0.25 * i / len(notes))
        t += 0.24 * (0.86 ** i)
    sw = lp(bp(noise(d), 200, 1200), 900, 4) * env(len(out), 0.3, 0.8) * 0.25
    return norm(out + sw, 0.7)


def slide_rub(d=2.0):  # skin sliding on wet plastic: low, unpitched rub
    tt = t_(d)
    x = lp(bp(noise(d), 120, 900), 700, 4) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * tt) ** 2)
    return norm(x * env(len(tt), 0.2, 0.5), 0.6)


def longslide(d=2.0):  # body slipping back down the wall
    tt = t_(d); f = 900 * (0.55 ** (tt / d))
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.06 * np.sin(2 * np.pi * 23 * tt))) / SR
    s = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * 0.35
    rub = bp(noise(d), 700, 3500) * 0.5
    return norm((s + rub) * env(len(tt), 0.15, 0.4), 0.6)

def thud(d=0.6, f=55):
    tt = t_(d); ph = 2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-tt * 30))) / SR
    x = np.sin(ph) * np.exp(-tt * 7) + lp(noise(d), 300) * np.exp(-tt * 25) * 0.6
    return norm(x, 0.9)

def pad(d=2.6):  # calm, soft low chord
    tt = t_(d)
    x = sum(np.sin(2 * np.pi * f * tt + p) * a for f, a, p in [(110, 1, 0), (164.8, 0.6, 1), (220.5, 0.4, 2), (329.6, 0.15, 3)])
    x *= 1 + 0.1 * np.sin(2 * np.pi * 0.7 * tt)
    return norm(x * env(len(tt), 0.8, 1.0), 0.45)

def underwater(d=4.4):
    x = lp(noise(d), 380, 4) * (1 + 0.5 * np.sin(2 * np.pi * 0.6 * t_(d)))
    return norm(x * env(len(x), 0.2, 0.4), 0.55)

def bubble(d=0.09, f0=None):
    f0 = f0 or rng.uniform(500, 1100); tt = t_(d)
    f = f0 * (1 + 2.2 * tt / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45)
    return norm(x, 0.35)

def riser(d=1.6):
    tt = t_(d)
    x = sweep_bp(noise(d), 150, 1800, q=0.7) * (tt / d) ** 1.5
    x += np.sin(2 * np.pi * np.cumsum(60 + 80 * (tt / d)) / SR) * 0.4 * (tt / d)
    return norm(x * env(len(tt), 0.05, 0.15), 0.7)

def stroke(d=0.5):  # hand pushing water along the tube
    x = sweep_bp(noise(d), 1200, 380, q=0.8)
    return norm(lp(x, 2500) * env(len(x), 0.12, 0.3, 1.3), 0.6)

def creak(d=0.7):  # strain / jammed
    tt = t_(d); pulses = (np.sin(2 * np.pi * 34 * tt) > 0.92).astype(float)
    x = bp(lp(pulses, 4000) + 0.05 * noise(d), 180, 1400)
    return norm(x * env(len(tt), 0.08, 0.2), 0.45)

def fillroar(d=1.8):
    tt = t_(d)
    x = lp(sweep_bp(noise(d), 120, 700, q=1.6), 900, 4)
    return norm(x * (0.2 + (tt / d) ** 1.4) * env(len(tt), 0.05, 0.3), 0.8)

def pulse(d=1.4):  # pressure fronts meeting: soft whomp + glassy shimmer
    tt = t_(d)
    whomp = np.sin(2 * np.pi * np.cumsum(70 * (1 + 0.8 * np.exp(-tt * 8))) / SR) * np.exp(-tt * 3.5)
    shim = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(1318, 3), (1975, 4), (2637, 5)]) * 0.18
    return norm(lp(whomp, 400) + shim, 0.7)

def glide(d=1.2):  # rings travelling in
    tt = t_(d); f = 260 + 300 * (tt / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4
    return norm(x * env(len(tt), 0.4, 0.1), 0.4)

def bigsplash(d=1.6):
    tt = t_(d)
    hit = lp(noise(d), 1800) * np.exp(-tt * 9)
    spray_ = bp(noise(d), 1500, 9000) * np.exp(-tt * 3.2) * 0.6
    low = np.sin(2 * np.pi * np.cumsum(90 * (1 + np.exp(-tt * 20))) / SR) * np.exp(-tt * 6) * 0.7
    x = hit + spray_ + low
    for k in range(18):
        s = int(rng.uniform(0.15, 1.3) * SR); b = bubble(0.06, rng.uniform(600, 1500)) * 0.4
        x[s:s + len(b)] += b[:len(x) - s]
    return norm(x * env(len(tt), 0.003, 0.4), 1.0)

def lapping(d=2.6):
    tt = t_(d)
    x = bp(noise(d), 250, 1600) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * tt) ** 2)
    return norm(x * env(len(tt), 0.5, 0.6), 0.35)

def sting(d=1.4):  # bright resolve at "safety"
    tt = t_(d)
    x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(523.3, 1), (659.3, 0.7), (784, 0.6), (1046.5, 0.3)])
    return norm(x * np.exp(-tt * 2.2) * env(len(tt), 0.01, 0.2), 0.45)


def breath(d=0.6, inhale=True, pitch=1.0):  # gasp / breath, filtered noise with a vowel-ish formant
    tt = t_(d); x = noise(d)
    f = (1100 if inhale else 800) * pitch
    y = bp(x, f * 0.7, f * 1.6) + 0.4 * bp(x, 2500 * pitch, 4200 * pitch)
    sh = (tt / d) ** 0.6 * np.exp(-tt * (2.5 if inhale else 4)) if inhale else np.exp(-tt * 4)
    return norm(y * sh * env(len(tt), 0.04, 0.12), 0.5)

def slap(d=0.18, f=240):  # palm / knee hitting the wet plastic wall
    tt = t_(d)
    x = bp(noise(d), 600, 3500) * np.exp(-tt * 60) + np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) * 0.6
    return norm(x, 0.7)

def drip(d=0.15):
    tt = t_(d); f = rng.uniform(1400, 2400) * (1 + 1.5 * tt / d)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40), 0.3)


def stream(d, rate=45, fmin=380, fmax=1500, seed=3):  # babbling water: many tiny resonant bubbles
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    n = int(d * rate)
    for _ in range(n):
        t0 = r.uniform(0, d); f0 = np.exp(r.uniform(np.log(fmin), np.log(fmax)))
        dur = r.uniform(0.02, 0.06); tt = t_(dur)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.9 * tt / dur)) / SR) * np.exp(-tt / (dur * 0.3)) * r.uniform(0.3, 1)
        s0 = int(t0 * SR); m = min(len(b), len(out) - s0); out[s0:s0 + m] += b[:m]
    body = lp(noise(d), 300, 4) * 0.25                     # soft low wash underneath
    return lp(out, 3500) + body


def deep(d, seed=5):  # submerged: slow, low bubbles, no hiss
    r = np.random.default_rng(seed)
    out = lp(noise(d), 160, 4) * 0.35
    for _ in range(int(d * 0.7)):
        t0 = r.uniform(0, d); f0 = r.uniform(180, 420); dur = r.uniform(0.06, 0.12); tt = t_(dur)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * tt / dur)) / SR) * np.exp(-tt / (dur * 0.35)) * r.uniform(0.4, 1)
        s0 = int(t0 * SR); m = min(len(b), len(out) - s0); out[s0:s0 + m] += b[:m]
    return norm(out * env(len(out), 0.3, 0.4), 0.5)


# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

# one continuous take: no cut whooshes; sounds follow the action
put(0.0, 'gush', gush(2.0), -12)                                   # flood rushes in behind him
put(0.0, 'thud', thud(0.5, 70), -12)                              # startle on frame one (hook)
put(1.95, 'whip_out', whoosh(0.8, up=False), -14)                  # whip back to reveal the slide
put(3.25, 'whip_in', whoosh(0.85, up=True), -14)                   # rush back in
# removed (hiss): put(3.5, 'roll', whoosh(0.45, up=True), -14)                      # rolls onto his front
# (pitched squeaks removed: user said they sounded like a bird, 'eu eu eu')
put(6.45, 'slip_run', slip_run(2.3), -11)                         # slips back down: soft descending marimba run
# removed (hiss): put(8.95, 'roll2', whoosh(0.5, up=False), -14)                    # rolls back over
put(9.1, 'pad', pad(2.6), -15)                                    # calm
put(11.6, 'underwater', deep(4.4, 5), -20)
for k in range(4): put(13.2 + k * 0.35 + rng.uniform(0, 0.1), 'bubble', bubble(), -14)   # a few bubbles as he lifts into the air pocket
put(16.0, 'riser', riser(1.6), -11)                               # water keeps rising
for k in range(3): put(17.6 + k * 1.25 + 0.05, 'stroke', stroke(0.55), -9)
put(17.6, 'underwater2', deep(3.0, 6), -23)
put(20.65, 'thud2', thud(0.5, 85), -10)                           # bumps into the bend
put(22.2, 'creak', creak(0.8), -12)                               # brace
put(23.4, 'fillroar', fillroar(1.8), -9)                          # slide fills
put(25.3, 'underwater3', deep(2.9, 7), -20)
for k in range(2): put(25.5 + k * 0.35, 'glide', glide(1.2 - k * 0.35), -12)
put(26.65, 'pulse', pulse(1.4), -7)                               # pressure equalizes
put(27.4, 'whoosh_push', whoosh(1.2, up=True), -9)                # pushes off, speeds down
put(28.3, 'jet', splashloop(1.2), -14)                            # water flushes out of the exit
put(29.17, 'bigsplash', bigsplash(1.6), -5)                       # into the pool
put(29.7, 'lapping', lapping(1.2), -16)
put(30.0, 'sting', sting(0.9), -12)

# continuous water in the tube: follows the water level (louder as it rises / fills)
def waterbed(d):
    tt = t_(d)
    slosh = bp(noise(d), 250, 1800) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.9 * tt) * np.sin(2 * np.pi * 0.37 * tt + 1))
    trick = bp(noise(d), 2500, 7000) * 0.25 * np.abs(lp(noise(d), 6)) * 6
    return slosh + trick
wb = stream(28.6)
lv = np.interp(t_(28.6), [0, 0.2, 1.4, 2.2, 15.8, 16.2, 17.3, 17.8, 23.2, 23.6, 25.0, 25.6, 28.6], [0.8, 0.8, 0.6, 0.0, 0.0, 0.55, 0.55, 0.0, 0.0, 0.85, 0.85, 0.0, 0.0])  # only where the water does something
put(0.0, 'waterbed', norm(wb, 0.5) * lv, -20)

# every remaining on-screen event gets its own sound
# removed (sounded like hiss): for k in range(4): put(0.25 + k * 0.42, f'pant{k}', breath(0.32, inhale=k % 2 == 0, pitch=1.1 + 0.05 * k), -15)   # panic breathing in the hook
for k in range(5): put(3.98 + k * 0.45 + (k % 2) * 0.12, f'slap{k}', slap(0.16, 200 + 30 * k), -14)            # palms slapping the wall while climbing
# (foot scrape thumps during the slip removed: user found them annoying)
# removed (hiss): put(9.5, 'calm_in', breath(1.0, inhale=True, pitch=0.8), -17)                     # slow calm breath in
# removed (hiss): put(10.6, 'calm_out', breath(1.0, inhale=False, pitch=0.8), -17)                  # and out
# removed (hiss): put(13.15, 'gasp', breath(0.6, inhale=True, pitch=1.0), -11)                      # head back, gulps air from the pocket
# removed (hiss): put(14.4, 'breath2', breath(0.5, inhale=True, pitch=0.95), -15)
# removed (hiss): put(16.75, 'cam_out', whoosh(0.55, up=False), -15)                                # camera pulls wide as water rises
for k in range(3): put(17.7 + k * 1.25, f'push{k}', slap(0.14, 260 + 25 * k), -16)   # palms push off the tube walls
# removed (hiss): put(21.3, 'cam_in', whoosh(0.5, up=True), -15)                                    # camera pushes in on the jam
put(22.3, 'brace_l', slap(0.2, 180), -11); put(22.42, 'brace_r', slap(0.2, 210), -12)   # hands hit the walls
put(22.6, 'knees', slap(0.22, 120), -12)                                          # knees jam against the tube
# removed (hiss): put(23.0, 'strain', breath(0.9, inhale=False, pitch=0.9), -16)                    # straining breath
put(25.15, 'full', thud(0.6, 60), -14)                                            # tube fills completely
# removed (hiss): put(28.4, 'cam_out2', whoosh(0.7, up=False), -14)                                 # camera follows him out
put(28.95, 'flyout', whoosh(0.45, up=True), -11)                                  # he shoots out of the exit
for k in range(6): put(29.6 + k * 0.2 + rng.uniform(0, 0.1), f'drip{k}', drip(), -16)   # falling droplets after the splash
# removed (hiss): put(30.2, 'relief', breath(0.9, inhale=False, pitch=0.85), -15)                   # relieved breath while floating

bed = lp(bed, 5000, 4)  # no hiss on top
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.02, 0.25, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_flood-slide_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
