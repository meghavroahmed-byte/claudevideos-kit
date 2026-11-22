def icecrack(d=0.6, seed=3):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(9):
        s = int(r.uniform(0, 0.25) * SR); u = t_(0.05); b = np.sin(2 * np.pi * r.uniform(2400, 4200) * u) * np.exp(-u * 90); out[s:s + len(b)] += b[:len(out) - s]
    tt = t_(d); out += np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 9) * 0.3
    return norm(lp(out, 4800), 0.7)

def chomp(d=0.35):
    tt = t_(d); x = lp(noise(d), 900, 4) * np.exp(-tt * 18) + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt * 25) * 0.6
    return norm(x, 0.7)

def shrinkdn(d=0.8):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(700 * (1 - 0.6 * tt / d)) / SR) * env(len(tt), 0.02, 0.2) * 0.6, 0.5)

def throb(d=2.0, rate=2.6, f=55):
    tt = t_(d); beats = np.maximum(0, np.sin(2 * np.pi * rate * tt)) ** 6
    return norm(np.sin(2 * np.pi * f * tt) * beats * env(len(tt), 0.1, 0.3), 0.7)

# ---- timeline
put(0.0, 'hook_crack', icecrack(0.6, 2), -12)
put(2.35, 'chomp', chomp(0.35), -9)
put(2.5, 'crunch', crunch(0.4) if 'crunch' in dir() else chomp(0.3), -14)
put(4.8, 'stab', icecrack(0.7, 5), -8)
put(4.8, 'stab_low', stamp_hit(0.5, 60), -14)
put(7.35, 'bubble', popup(520, 0.18), -14)
put(7.6, 'cold', freeze(1.2), -14)
put(12.0, 'shrink', shrinkdn(0.8), -12)
put(13.6, 'swell', inflate(0.6), -11)
put(14.2, 'pulse', throb(2.2, 2.6), -12)
put(17.5, 'nerve', zap(0.25), -11)
put(18.2, 'nerve2', zap(0.2), -13)
put(19.4, 'pain', throb(3.6, 3.0, 70), -12)
put(19.4, 'painstab', icecrack(0.5, 9), -14)
put(22.7, 'tongue', squelch(0.4, 120), -13)
put(23.5, 'warm', shimmer(1.2), -14)
put(25.6, 'relief', exhale(1.0), -13)
put(25.7, 'stamp', stamp_hit(0.6, 85), -10)
