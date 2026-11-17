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
    x = sweep_bp(noise(d), 300 if up else 2400, 2400 if up else 300, q=0.9)
    return norm(x * env(len(x), d * 0.55, d * 0.45, 1.6), 0.8)

def gush(d=1.8):  # water rushing through the tube
    x = noise(d)
    body = lp(x, 900) * 1.0 + bp(noise(d), 1500, 5000) * 0.35
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
    x = sweep_bp(noise(d), 200, 1600, q=1.6) + bp(noise(d), 2000, 6000) * 0.2 * (tt / d)
    return norm(x * (0.2 + (tt / d) ** 1.4) * env(len(tt), 0.05, 0.3), 0.8)

def pulse(d=1.4):  # pressure fronts meeting: soft whomp + glassy shimmer
    tt = t_(d)
    whomp = np.sin(2 * np.pi * np.cumsum(70 * (1 + 0.8 * np.exp(-tt * 8))) / SR) * np.exp(-tt * 3.5)
    shim = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(1318, 3), (1975, 4), (2637, 5)]) * 0.18
    return norm(lp(whomp, 400) + shim, 0.7)

def glide(d=1.2):  # rings travelling in
    tt = t_(d); f = 260 + 300 * (tt / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(noise(d), 500, 1500) * 0.15
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


# ---------------- timeline ----------------
bed = np.zeros(int((DUR + 1) * SR))
palette = {}
def put(at, name, x, gain_db=0.0):
    palette.setdefault(name, x)
    s = int(at * SR); g = 10 ** (gain_db / 20)
    n = min(len(x), len(bed) - s)
    bed[s:s + n] += x[:n] * g

CUTS = [1.8, 3.6, 6.25, 11.6, 16.0, 17.6, 20.6, 25.5, 28.2]
for i, c in enumerate(CUTS):
    put(c - 0.32, 'whoosh', whoosh(0.5, up=i % 2 == 0), -9)

put(0.0, 'splashloop', splashloop(1.95), -14)                    # exit pouring, outside
put(1.75, 'gush', gush(1.9), -8)                                  # flood rushes in
put(1.95, 'thud', thud(0.5, 70), -12)
for k in range(5):                                                # panic squeaks, one per stroke
    put(3.75 + k * 0.9 * 0.5 + (k % 2) * 0.12, 'squeak', squeak(0.2, 1500 + 120 * (k % 3), 1100), -13)
put(6.45, 'longslide', longslide(2.3), -10)                       # slips back down
put(8.95, 'thud', thud(0.7, 48), -8)                              # "the secret" dip
put(9.1, 'pad', pad(2.6), -15)                                    # calm
put(11.6, 'underwater', underwater(4.4), -14)
for k in range(9): put(11.9 + k * 0.45 + rng.uniform(0, 0.2), 'bubble', bubble(), -12)
put(16.0, 'riser', riser(1.6), -11)                               # water keeps rising
for k in range(3): put(17.6 + k * 1.25 + 0.05, 'stroke', stroke(0.55), -9)
put(17.6, 'underwater2', underwater(3.0), -17)
put(20.75, 'thud2', thud(0.5, 85), -10)                           # jammed against the bend
put(22.2, 'creak', creak(0.8), -12)                               # brace
put(23.4, 'fillroar', fillroar(1.8), -9)                          # slide fills
put(25.3, 'underwater3', underwater(2.9), -14)
for k in range(2): put(25.5 + k * 0.35, 'glide', glide(1.2 - k * 0.35), -12)
put(26.65, 'pulse', pulse(1.4), -7)                               # pressure equalizes
put(27.55, 'whoosh_push', whoosh(0.7, up=True), -9)               # push off
put(28.2, 'splashloop2', splashloop(1.0), -16)
put(29.1, 'bigsplash', bigsplash(1.6), -5)                        # out into the pool
put(29.6, 'lapping', lapping(1.3), -16)
put(30.0, 'sting', sting(0.9), -12)

bed = bed[:int(DUR * SR)]
bed *= env(len(bed), 0.02, 0.25, 1)
os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
for n, x in palette.items():
    wavfile.write(os.path.join(HERE, 'sfx', f'sfx_flood-slide_{n}.wav'), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(HERE, 'audio', 'sfx_bed.wav'), SR, (np.clip(bed, -1, 1) * 32767).astype(np.int16))
print('palette', len(palette), 'sounds; bed peak', round(float(np.max(np.abs(bed))), 3))
