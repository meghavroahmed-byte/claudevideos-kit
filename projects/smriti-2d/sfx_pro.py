# sfx_pro.py: SFX track for smriti-2d from real recorded Mixkit sounds (mixkit/n/<id>.wav, 44.1k stereo).
# Whoosh-free: reverse swells/risers only at 4 section changes, aligned so their peak lands on the cut.
# Usage: python3 sfx_pro.py <out.wav> <duration_s>
import sys, wave
import numpy as np

SR = 44100
def load(i):
    with wave.open(f'mixkit/n/{i}.wav') as w: return np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2) / 32768.0

# (time, mixkit id, peak level, options) options: dur = max seconds (faded), peak = align the loudest point to time, off = skip seconds
SHUT, POPS, CHIME = [1438, 1440, 1431], [871, 3083, 3062], [3108, 3109, 2820]
CUES = [
    (0.0, 700, 0.45, dict(dur=4.0)), (0.1, 490, 0.6, {}), (0.3, 3108, 0.5, {}), (2.0, 3083, 0.35, {}),
    (4.11, 1438, 0.6, {}), (4.3, 563, 0.55, {}), (4.5, 1061, 0.4, {}), (4.85, 1061, 0.35, {}), (5.2, 1061, 0.4, {}), (5.6, 3109, 0.4, {}),
    (6.8, 1440, 0.6, {}), *[(6.9 + i * 0.12, POPS[i % 3], 0.32, {}) for i in range(5)],
    (7.3, 3012, 0.55, {}), (7.9, 2352, 0.4, dict(dur=2.0)), (8.9, 788, 0.8, dict(dur=3.0)),
    (10.0, 1431, 0.55, {}), (10.2, 431, 0.45, {}), (11.0, 2820, 0.4, {}), (12.6, 2353, 0.45, {}), (13.0, 1022, 0.55, {}),
    (15.6, 2939, 0.45, {}), (17.51, 2951, 0.5, {}), (17.6, 2868, 0.3, {}), (18.0, 1369, 0.5, {}),
    (18.97, 784, 0.6, dict(peak=True, dur=1.2)), (19.1, 2589, 0.4, dict(dur=2.0)), (19.5, 1088, 0.5, {}), (19.9, 2900, 0.75, dict(dur=3.0)),
    (21.49, 1438, 0.55, {}), (21.6, 2868, 0.28, {}), *[(22.0 + i * 0.7, POPS[i % 3], 0.3, {}) for i in range(5)],
    (25.34, 1021, 0.6, {}), (25.9, 2352, 0.4, dict(dur=1.5)), (26.6, 1369, 0.55, {}), (26.8, 2353, 0.35, {}), (27.4, 677, 0.7, dict(dur=2.0)),
    (29.33, 2675, 0.55, dict(peak=True, dur=0.8)), (29.4, 498, 0.6, {}),
    (30.11, 1440, 0.5, {}), *[(30.4 + i * 0.45, CHIME[i], 0.4, {}) for i in range(3)],
    (32.07, 490, 0.5, {}), (32.5, 658, 0.45, {}),
    *[(34.6 + i * 0.28, [2598, 1455, 2595][i % 3], 0.35, {}) for i in range(6)], (36.3, 2589, 0.4, dict(dur=2.0)),
    (38.68, 790, 0.5, dict(peak=True, dur=0.6)), (39.0, 3109, 0.35, {}), (39.75, 759, 0.75, {}), (39.8, 3208, 0.6, {}),
    (41.58, 172, 0.5, {}), (42.4, 1369, 0.5, {}),
    (43.84, 788, 0.8, dict(dur=3.0)), (44.1, 497, 0.5, dict(dur=3.0)), *[(44.3 + i * 0.3, [2598, 1455, 2595][i], 0.35, {}) for i in range(3)],
    *[(45.0 + i * 0.4, [2352, 2353, 2352][i], 0.35, dict(dur=1.5)) for i in range(3)],
    (48.16, 3012, 0.55, {}), (48.6, 2352, 0.35, dict(dur=1.2)),
    (49.44, 1431, 0.5, {}), (49.6, 3108, 0.4, {}), (51.0, 2820, 0.4, {}),
    (54.15, 2946, 0.5, {}), *[(54.95 + i * 0.15, 1369, 0.4, {}) for i in range(3)],
    (55.71, 1438, 0.5, {}), *[(56.2 + i * 0.6, POPS[i], 0.3, {}) for i in range(3)], (57.9, 563, 0.6, {}),
    (59.35, 1445, 0.45, dict(peak=True, dur=0.8)), (60.0, 3108, 0.45, {}),
    (63.65, 1329, 0.55, dict(dur=2.7)), (63.8, 1335, 0.4, dict(dur=2.5)), (64.9, 2900, 0.75, dict(dur=3.0)),
    (66.33, 1440, 0.45, {}), (66.4, 700, 0.45, dict(off=4.0, dur=4.6)),
    (70.0, 1393, 0.4, dict(dur=1.5)), (70.3, 3109, 0.4, {}),
]

def main(out, dur):
    L = np.zeros((int(dur * SR) + 12 * SR, 2)); cache = {}
    for t, i, lvl, o in CUES:
        x = cache.setdefault(i, load(i)); x = x[int(o.get('off', 0) * SR):]
        pk = int(np.argmax(np.abs(x).max(1))); start = t - (pk / SR if o.get('peak') else 0)
        if o.get('peak'): x = x[:pk + int(o.get('dur', 0.5) * SR)]  # keep the rise plus a short tail after the hit
        elif 'dur' in o: x = x[:int(o['dur'] * SR)]
        x = x * (lvl / max(1e-6, np.abs(x).max())); f = min(len(x), int(0.25 * SR)); x[-f:] *= np.linspace(1, 0, f)[:, None]
        s = max(0, int(start * SR)); x = x[s - int(start * SR):]; L[s:s + len(x)] += x
    L = np.tanh(L[:int(dur * SR)] * 1.1) / np.tanh(1.1)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(L, -1, 1) * 32767).astype('<i2').tobytes())
    print('cues', len(CUES), 'unique sounds', len(cache))

assert all(0 <= c[0] < 72 for c in CUES)
main(sys.argv[1], float(sys.argv[2]))
