def gust(d=2.0):
    tt = t_(d); return norm(lp(noise(d), 260, 4) * np.sin(np.pi * tt / d) ** 2, 0.5)

def teeth(d=1.5, rate=16, seed=2):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int((k / rate + r.uniform(0, 0.01)) * SR); u = t_(0.012); b = np.sin(2 * np.pi * r.uniform(2200, 2800) * u) * np.exp(-u * 500); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out * env(len(out), 0.05, 0.2), 0.3)

def yowl(d=0.9):
    tt = t_(d); f = 520 + 260 * np.sin(np.pi * tt / d) + 18 * np.sin(2 * np.pi * 7 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    return norm(lp(x, 2600) * env(len(tt), 0.08, 0.3), 0.6)

def scarystab(d=1.4):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) for f in (73.4, 77.8, 110, 116.5, 155.6)) / 5
    return norm(x * np.exp(-tt * 2.2) * env(len(tt), 0.005, 0.3), 0.85)

def tune(d=3.0):
    out = np.zeros(int(d * SR)); notes = [523, 659, 784, 659, 698, 880, 784, 659, 587, 523]
    for i, f in enumerate(notes):
        s = int(i * 0.28 * SR); x = marimba(f, 0.6); n = min(len(x), len(out) - s)
        if n > 0: out[s:s + n] += x[:n]
    return norm(out, 0.55)

def puff(d=0.7):
    tt = t_(d); return norm(lp(noise(d), 700, 4) * env(len(tt), 0.05, 0.5) + np.sin(2 * np.pi * np.cumsum(90 + 120 * tt / d) / SR) * env(len(tt), 0.02, 0.4) * 0.4, 0.55)

# ---- timeline
put(0.0, 'gust', gust(2.6), -14)
put(0.3, 'teeth', teeth(1.6), -16)
put(2.5, 'zoomin', whoosh(0.5), -15)
put(6.5, 'tighten', strain(0.6, 75), -12)
put(8.1, 'hairup', boing(0.6, 300), -13)
for i, a in enumerate([10.85, 10.95, 11.05, 11.18, 11.3]): put(a, f'bump{i}', pop(0.18, 260 + 40 * i), -12)
put(12.5, 'pan1', whoosh(0.6), -17)
put(14.8, 'furpuff', puff(0.8), -10)
put(16.0, 'warm', shimmer(1.2), -15)
put(17.5, 'pan2', whoosh(0.6), -17)
put(18.9, 'yowl', yowl(0.9), -11)
put(18.9, 'catpuff', puff(0.5), -12)
put(20.9, 'screen', whoosh(0.4), -16)
put(21.45, 'scary', scarystab(1.4), -9)
put(21.5, 'bumps2', pop(0.18, 300), -13)
put(22.6, 'song', tune(3.0), -13)
put(23.85, 'bumps3', pop(0.18, 340), -13)
put(24.1, 'stamp', stamp_hit(0.6, 85), -10)
