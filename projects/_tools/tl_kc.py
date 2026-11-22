def knuck(d=0.5, seed=1, n=5):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(n):
        s = int((k * 0.045 + r.uniform(0, 0.01)) * SR); u = t_(0.03); b = (np.sin(2 * np.pi * r.uniform(900, 1600) * u) + lp(np.random.default_rng(k).standard_normal(len(u)), 3000) * 0.6) * np.exp(-u * 160); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 5000), 0.85)

def gloop(d=0.6):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * 3 * tt)) / SR) * env(len(tt), 0.05, 0.3) * 0.7, 0.45)

def gaugefall(d=1.0):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(900 * (1 - 0.65 * tt / d)) / SR) * env(len(tt), 0.02, 0.2), 0.4)

# ---- timeline
put(0.15, 'stretch', strain(0.6, 80), -15)
put(1.12, 'crack', knuck(0.5, 1, 6), -7)
put(2.65, 'bubble', popup(520, 0.18), -14)
put(3.5, 'capsule', shimmer(0.7), -16)
put(5.4, 'fluid', gloop(0.8), -13)
put(7.5, 'pull', strain(0.8, 70), -13)
put(10.8, 'pressure', gaugefall(1.1), -13)
put(14.3, 'gas', bubblepop(0.2), -11)
put(16.93, 'pop', knuck(0.35, 4, 3), -6)
put(19.6, 'myth', stamp_hit(0.6, 80), -10)
put(20.8, 'walk', step(0.14, 90), -15)
put(21.2, 'walk2', step(0.14, 95), -15)
put(21.6, 'walk3', step(0.14, 90), -15)
put(22.3, 'doccrack', knuck(0.4, 7, 4), -11)
put(23.0, 'doccrack2', knuck(0.4, 8, 4), -13)
put(22.8, 'count', clockrun(0.9, 18), -16)
put(24.6, 'fine', chime(1.0, 1318.5), -13)
