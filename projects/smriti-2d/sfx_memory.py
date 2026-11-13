# sfx_memory.py: themed SFX palette for smriti-2d (childhood / memory / brain). No generic whoosh/pop set.
# Music-box tines in D minor pentatonic, polaroid shutter, tape-stop for erased memories, synapse sparks,
# heartbeat, reverse-reverb swells (only at big section changes), wall crumble, soft nostalgic pad bed.
# Usage: python3 sfx_memory.py <beats.js> <out.wav> <duration_s>
import re, sys, wave
import numpy as np

SR = 44100
DUR = float(sys.argv[3])
rng = np.random.default_rng(5150)
t_ = lambda d: np.arange(int(d * SR)) / SR
SCALE = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0]  # D minor pentatonic (D F G A C ...)

def onepole(x, k):
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s += k * (v - s); y[i] = s
    return y
def lowpass(x, fc):  # FFT brick-ish lowpass with soft knee
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / fc) ** 4); return np.fft.irfft(X, len(x))
def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) / (1 + (f / hi) ** 4); return np.fft.irfft(X, len(x))
def fconv(a, b):
    n = len(a) + len(b) - 1; N = 1 << (n - 1).bit_length(); return np.fft.irfft(np.fft.rfft(a, N) * np.fft.rfft(b, N), N)[:n]
def make_ir(d, bright):
    n = rng.standard_normal(int(d * SR)) * np.exp(-np.linspace(0, 7, int(d * SR))); return lowpass(n, bright) * 0.08
IR_L, IR_R = make_ir(2.2, 5000), make_ir(2.2, 5000)
def verb(x, wet=0.35):  # stereo: returns (n,2)
    L = fconv(x, IR_L); R = fconv(x, IR_R); out = np.zeros((len(L), 2)); out[:len(x), 0] += x * (1 - wet); out[:len(x), 1] += x * (1 - wet)
    out[:, 0] += L * wet * 3; out[:, 1] += R * wet * 3; return out
def dec(n, k): return np.exp(-np.linspace(0, k, n))

def tine(f, d=1.6):  # music-box tine: inharmonic partials, fast attack, bright ping that dies quickly
    t = t_(d); x = np.sin(2 * np.pi * f * t) * dec(len(t), 6) + 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * dec(len(t), 14) + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * dec(len(t), 30)
    x[:40] *= np.linspace(0, 1, 40); return x
def box(v):  # one note walking the scale (melodic over the video)
    return verb(tine(SCALE[[0, 2, 4, 3, 5, 4, 6, 7, 5, 8, 4, 2][v % 12]]) * 0.5, 0.45)
def chord(v):  # three-note music-box chord (reveals)
    root = [0, 3, 1, 4][v % 4]; x = sum(tine(SCALE[min(8, root + i * 2)], 2.2) for i in range(3)) / 2.2
    return verb(x * 0.6, 0.5)
def shutter(v):  # polaroid: mirror slap, shutter, motor whirr of the print coming out
    d = 0.9; x = np.zeros(len(t_(d)))
    for at, a in [(0.0, 1.0), (0.045 + 0.01 * (v % 3), 0.7)]:
        s = int(at * SR); n = 900; x[s:s + n] += bandpass(rng.standard_normal(n), 1500, 7000) * dec(n, 9) * a
    s = int(0.16 * SR); n = int(0.5 * SR); tt = t_(0.5); motor = np.sign(np.sin(2 * np.pi * (180 + 30 * (v % 4)) * tt)) * 0.08 + bandpass(rng.standard_normal(n), 800, 3000) * 0.15
    x[s:s + n] += motor * np.minimum(1, np.minimum(tt * 30, (0.5 - tt) * 20)); return verb(x * 0.8, 0.18)
def tapestop(v):  # music-box phrase that slows and sinks: a memory fading out
    d = 1.3; t = t_(d); rate = np.maximum(0.0, 1 - (t / d) ** 1.4); ph = np.cumsum(rate) / SR
    f = SCALE[[4, 3, 5][v % 3]]; x = (np.sin(2 * np.pi * f * ph) + 0.4 * np.sin(2 * np.pi * f * 1.5 * ph) + 0.25 * np.sin(2 * np.pi * f * 3.98 * ph)) * (0.3 + 0.7 * rate)
    x = lowpass(x * dec(len(t), 2.5), 3500); return verb(x * 0.45, 0.4)
def dissolve(v):  # high grains drifting down and thinning out (photo turning to dust)
    d = 1.4; n = len(t_(d)); x = np.zeros(n)
    for i in range(70):
        at = (i / 70) ** 1.3 * d * 0.85; s = int(at * SR); f = 5200 * (1 - 0.6 * i / 70) * (0.85 + 0.3 * rng.random()); m = 1400
        if s + m < n: x[s:s + m] += np.sin(2 * np.pi * f * t_(m / SR)) * dec(m, 12) * (1 - i / 70) * (0.5 + rng.random() * 0.5)
    x += bandpass(rng.standard_normal(n), 3000, 9000) * dec(n, 5) * 0.05; return verb(x * 0.35, 0.55)
def synapse(v):  # electric crackle + glassy ping (neuron firing)
    d = 0.7; n = len(t_(d)); x = np.zeros(n); c = rng.standard_normal(1600) * (rng.random(1600) > 0.85); x[:1600] += bandpass(c, 2000, 12000) * dec(1600, 8) * 0.9
    f = [1760, 2093, 2349, 2637, 1975][v % 5]; x += np.sin(2 * np.pi * f * t_(d)) * dec(n, 10) * 0.35 + np.sin(2 * np.pi * f * 2.01 * t_(d)) * dec(n, 18) * 0.1
    return verb(x * 0.4, 0.4)
def heart(v):  # lub-dub, deep and soft
    d = 1.0; n = len(t_(d)); x = np.zeros(n)
    for at, a in [(0.0, 1.0), (0.28, 0.7)]:
        s = int(at * SR); m = int(0.25 * SR); tt = t_(0.25); x[s:s + m] += np.sin(2 * np.pi * (62 - 25 * tt / 0.25) * tt) * dec(m, 9) * a
    return verb(lowpass(x, 300) * 0.9, 0.15)
def swell(v):  # reverse reverb of a music-box chord: rises INTO the cue time (placed before it)
    x = chord(v + 1)[:, 0]; x = x[: int(1.6 * SR)][::-1] * np.linspace(0, 1, int(1.6 * SR)) ** 2; return verb(x * 0.7, 0.2)
def impact(v):  # cinematic low hit: sub drop + soft body + long tail, not a generic boom
    d = 2.2; t = t_(d); n = len(t); f = 70 - 38 * (1 - np.exp(-t * 3)); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * dec(n, 4)
    body = lowpass(rng.standard_normal(n), 900) * dec(n, 14) * 0.6; tick = tine(SCALE[0] / 2, d) * 0.3
    return verb((sub * 1.1 + body + tick) * 0.75, 0.3)
def thud(v):  # muted wooden knock (stamps, X marks)
    d = 0.4; t = t_(d); n = len(t); x = np.sin(2 * np.pi * (180 + 20 * (v % 3)) * t) * dec(n, 22) + bandpass(rng.standard_normal(n), 300, 2500) * dec(n, 40) * 0.5
    return verb(x * 0.55, 0.2)
def crumble(v):  # plaster cracking + debris pattering
    d = 1.8; n = len(t_(d)); x = np.zeros(n)
    for i in range(60):
        s = int(rng.random() ** 1.5 * (n - 3000)); m = int(300 + rng.random() * 1500); x[s:s + m] += bandpass(rng.standard_normal(m), 400 + rng.random() * 1500, 5000) * dec(m, 10) * (0.3 + rng.random())
    x[:2000] += bandpass(rng.standard_normal(2000), 1000, 8000) * dec(2000, 5) * 1.5; return verb(x * 0.35, 0.25)
def glitch(v):  # stuttered, bit-crushed music-box note (digital memory error)
    base = tine(SCALE[[6, 3, 7][v % 3]], 0.6); seg_ = base[:2200]; x = np.concatenate([seg_ * (0.9 ** i) for i in range(7)])
    x = np.round(x * 10) / 10; x = np.repeat(x[::4], 4)[: len(x)]; return verb(x * 0.4, 0.2)
def beep(v):  # camcorder REC beep
    d = 0.35; t = t_(d); x = np.sin(2 * np.pi * 2730 * t) * (t < 0.12) * 0.25 + np.sin(2 * np.pi * 2730 * t) * ((t > 0.17) & (t < 0.29)) * 0.25; return verb(x, 0.15)
def powerdown(v):  # three falling blips (battery dying)
    x = np.concatenate([np.sin(2 * np.pi * f * t_(0.12)) * dec(len(t_(0.12)), 4) for f in (880, 660, 440)] + [np.zeros(2000)]); return verb(x * 0.3, 0.3)
def clock(v):  # soft wooden clock tick
    d = 0.15; t = t_(d); x = bandpass(rng.standard_normal(len(t)), 1500, 4000) * dec(len(t), 40) + np.sin(2 * np.pi * (1200 + 300 * (v % 2)) * t) * dec(len(t), 50) * 0.4; return verb(x * 0.45, 0.15)
def rewind(v):  # tape rewind chatter, pitch rising (world flips)
    d = 0.9; t = t_(d); f = 300 + 2500 * (t / d) ** 2; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 40 * t))) * 0.25
    return verb(lowpass(x, 4000) * np.minimum(1, (d - t) * 8), 0.2)
def burn(v):  # fire crackle bed rising (memories burning)
    d = 2.6; n = len(t_(d)); x = lowpass(rng.standard_normal(n), 700) * 0.25 * np.linspace(0.2, 1, n)
    for i in range(140): s = int(rng.random() * (n - 400)); x[s:s + 400] += bandpass(rng.standard_normal(400), 1500, 9000) * dec(400, 12) * rng.random() * 1.2
    return verb(x * 0.4 * np.minimum(1, (d - t_(d)) * 3), 0.3)
def type_(v):  # soft phone keyboard taps
    x = np.zeros(int(1.1 * SR))
    for i in range(9): s = int((i * 0.1 + rng.random() * 0.03) * SR); x[s:s + 600] += bandpass(rng.standard_normal(600), 2000, 8000) * dec(600, 15) * 0.4
    return verb(x, 0.15)

KIND = dict(box=box, chord=chord, shutter=shutter, tapestop=tapestop, dissolve=dissolve, synapse=synapse, heart=heart, swell=swell,
            impact=impact, thud=thud, crumble=crumble, glitch=glitch, beep=beep, powerdown=powerdown, clock=clock, rewind=rewind, burn=burn, type=type_)
PRE = dict(swell=1.6)
# peak level per kind (sounds are normalised first: reverb tails of tonal sounds otherwise blow up)
LEVEL = dict(box=0.32, chord=0.42, shutter=0.4, tapestop=0.42, dissolve=0.32, synapse=0.32, heart=0.6, swell=0.45, impact=0.85,
             thud=0.42, crumble=0.5, glitch=0.32, beep=0.18, powerdown=0.28, clock=0.22, rewind=0.32, burn=0.42, type=0.22)  # these sounds peak at the cue time, so they start earlier

def pad(d):  # very quiet nostalgic bed: detuned D-minor drone + tape hiss, slow breathing
    t = t_(d); x = np.zeros(len(t))
    for f, a in [(73.42, 1), (110.0, 0.7), (146.83, 0.6), (174.61, 0.35), (220.0, 0.3)]:
        for det in (-0.4, 0.4): x += a * np.sin(2 * np.pi * (f + det) * t + rng.random() * 6)
    x = lowpass(x, 900) * (0.75 + 0.25 * np.sin(2 * np.pi * t / 9)); x /= np.abs(x).max()
    hiss = bandpass(rng.standard_normal(len(t)), 2000, 9000) * 0.02
    fade = np.minimum(1, np.minimum(t / 2, (d - t) / 1.5)); return (x * 0.07 + hiss) * fade

src = open(sys.argv[1], encoding='utf-8').read()
cues = re.findall(r"\[([\d.]+),\s*'(\w+)'\]", src[src.index('window.SFXEV'):])
L = np.zeros((int(DUR * SR) + 4 * SR, 2)); count = {}
p = pad(DUR); L[:len(p), 0] += p; L[:len(p), 1] += p * 0.97
for ts, k in cues:
    v = count.get(k, 0); count[k] = v + 1
    x = KIND[k](v); x = x / np.abs(x).max() * LEVEL[k]; pan = [0.0, -0.2, 0.2, -0.1, 0.1][v % 5]
    s = max(0, int((float(ts) - PRE.get(k, 0)) * SR)); e = min(len(L), s + len(x))
    L[s:e, 0] += x[:e - s, 0] * (1 - pan); L[s:e, 1] += x[:e - s, 1] * (1 + pan)
L = L[:int(DUR * SR)]; L = np.tanh(L * 1.1) * 0.7
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((L * 32767).astype('<i2').tobytes())
print('cues', len(cues), dict(count))
