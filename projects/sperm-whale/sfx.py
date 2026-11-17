#!/usr/bin/env python3
"""Synthesizes this video's own SFX palette (sfx/sfx_sperm-whale_*.wav) and the timed SFX bed (audio/sfx_bed.wav).

    python sfx.py            # needs numpy + scipy
Every sound here is generated from noise and oscillators: no stock or reused files.
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 27.14
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(2026)


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



# ---------------- sperm-whale palette ----------------
def whale_moan(d=2.2, f0=95):  # low, slow whale call
    tt = t_(d); f = f0 * (1 + 0.25 * np.sin(np.pi * tt / d)) * (1 + 0.01 * np.sin(2 * np.pi * 5 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3.01 * ph)
    return norm(lp(x, 900) * env(len(tt), 0.5, 0.8, 1.5), 0.7)

def boom(d=1.6, f=42):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt * 6))) / SR) * np.exp(-tt * 2.2)
    return norm(lp(x + lp(noise(d), 120) * np.exp(-tt * 5) * 0.4, 300), 0.9)

def suction(d=0.8):  # water swirling into the mouth, dark
    tt = t_(d); x = lp(sweep_bp(noise(d), 500, 120, q=1.2), 700, 4)
    return norm(x * env(len(tt), 0.35, 0.15, 1.4), 0.8)

def clack(d=0.25):  # teeth/jaw knock
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(420, 40), (980, 60), (1610, 80)])
    return norm(x, 0.7)

def squelch(d=0.35, f=75):  # throat squeeze pulse: low thump + wet low body
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.5 * np.exp(-tt * 18))) / SR) * np.exp(-tt * 9)
    x += lp(noise(d), 350, 4) * np.exp(-tt * 14) * 0.5
    return norm(x * env(len(tt), 0.01, 0.08), 0.7)

def shimmer(d=1.0):  # x-ray reveal
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) * a for f, a, k in [(659.3, 1, 2.5), (987.8, 0.6, 3), (1318.5, 0.35, 4)])
    return norm(x * env(len(tt), 0.15, 0.3), 0.4)

def acidpour(d=1.7):  # liquid filling the chamber: dark, low
    return norm(lp(stream(d, rate=30, fmin=200, fmax=700, seed=9), 1200) * env(int(d * SR), 0.3, 0.5), 0.6)

def pops(d=4.6, rate=7, seed=11):  # sparse soft fizz pops (no hiss)
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for _ in range(int(d * rate)):
        t0 = r.uniform(0, d); f0 = r.uniform(600, 1300); dur = 0.03; tt = t_(dur)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * tt / dur)) / SR) * np.exp(-tt / 0.008) * r.uniform(0.3, 1)
        s0 = int(t0 * SR); m = min(len(b), len(out) - s0); out[s0:s0 + m] += b[:m]
    return norm(out * env(len(out), 0.4, 0.6), 0.4)

def dread(d=3.2):  # low minor swell while the acid works
    tt = t_(d)
    x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(55, 1), (65.4, 0.6), (82.4, 0.4), (110, 0.2)])
    x *= 1 + 0.15 * np.sin(2 * np.pi * 0.5 * tt)
    return norm(lp(x, 500) * env(len(tt), 1.2, 0.8, 1.3), 0.6)

def hope(d=1.4):  # soft note on "Yet"
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(392, 1), (493.9, 0.6), (587.3, 0.5)])
    return norm(x * np.exp(-tt * 2) * env(len(tt), 0.03, 0.3), 0.4)

def heartbeat(d=0.6, f=48):
    tt = t_(d)
    def thump(at, a):
        y = np.zeros(len(tt)); s0 = int(at * SR); u = tt[: len(tt) - s0]
        y[s0:] = np.sin(2 * np.pi * f * u) * np.exp(-u * 18) * a; return y
    return norm(lp(thump(0, 1) + thump(0.16, 0.7), 200), 0.8)

def glass(f=1318.5, d=0.6):  # O2 token note
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 5) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 9)
    return norm(x * env(len(tt), 0.005, 0.1), 0.4)

def blipdown(f=1046.5, d=0.35):  # O2 token blinks out: short falling glass note
    tt = t_(d); ff = f * (1 - 0.35 * tt / d)
    x = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tt * 9)
    return norm(x, 0.4)


# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

put(0.0, 'boom', boom(1.6), -8)                                   # hook: deep hit
put(0.15, 'moan', whale_moan(2.0, 92), -12)                        # the whale looming behind him
for k, at in enumerate([0.35, 0.95, 1.6]): put(at, f'airbub{k}', bubble(0.09, 500 + 150 * k), -15)   # his air escaping
put(1.42, 'whip_out', whoosh(0.8, up=False), -13)                  # whip back: whole whale
put(2.25, 'suction', suction(0.75), -9)                            # water sucked into the mouth
put(2.82, 'jaw', boom(0.9, 60), -7); put(2.84, 'clack', clack(), -12)   # jaw slams shut
put(3.2, 'dive_in', whoosh(0.9, up=True), -13)                     # camera dives into the whale
put(3.35, 'xray', shimmer(1.0), -15)                               # skin turns x-ray
for k in range(5): put(4.25 + k * 0.5, f'squeeze{k}', squelch(0.35, 70 + 6 * (k % 3)), -10)          # tight squeezes down the throat
for k in range(5): put(6.8 + k * 0.32, f'push{k}', squelch(0.3, 82 + 5 * (k % 2)), -11)              # pushed faster through the esophagus
put(8.6, 'drop', slip_run(1.4), -11)                               # drops: soft descending run
put(9.85, 'land', boom(0.7, 70), -10); put(9.9, 'splash', lp(bigsplash(1.6), 1500)[:int(0.9 * SR)] * env(int(0.9 * SR), 0.003, 0.3), -14)   # lands in the acid
put(11.5, 'acidpour', acidpour(1.8), -12)                          # chamber floods with acid
put(12.4, 'fizz', pops(4.6), -12)                                  # acid fizzing on skin (sparse pops)
put(13.3, 'dread', dread(3.4), -12)                                # dissolving
put(17.15, 'hope', hope(1.4), -14)                                 # "Yet"
for k in range(9):                                                 # heartbeat: slows, then stops
    put(17.6 + sum(0.85 + 0.12 * j for j in range(k)), f'hb{k}', heartbeat(0.6, 48), -10 - k * 0.6)
put(21.65, 'o2_in', glass(1318.5, 0.8), -15)                       # O2 tokens appear
for i in range(6): put(22.6 + i * 0.5, f'o2_out{i}', blipdown(1046.5 * (0.94 ** i)), -14)   # each one blinks out
put(25.3, 'pull_out', whoosh(1.2, up=False), -13)                  # camera pulls out of the whale
put(25.8, 'moan_end', whale_moan(1.4, 80), -13)

bed = lp(bed, 5000, 4)  # no hiss on top
bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.01, 0.3, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_sperm-whale_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
