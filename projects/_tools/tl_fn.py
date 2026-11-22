def keys_s(d=1.6, rate=14, seed=2):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int((k / rate + r.uniform(0, 0.02)) * SR); u = t_(0.03); b = (np.sin(2 * np.pi * r.uniform(1800, 2600) * u) + lp(r.standard_normal(len(u)), 5000) * 0.5) * np.exp(-u * 160); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.4)

def scratch_s(d=0.9):
    tt = t_(d); return norm(bp(noise(d), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) ** 2, 0.3)

def growtone(d=2.4, f0=300, f1=700):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * tt / d) / SR) * env(len(tt), 0.1, 0.2) * 0.5, 0.35)

# ---- timeline
put(0.5, 'raceF', growtone(2.4, 300, 650), -15)
put(0.5, 'raceT', growtone(2.4, 200, 330), -17)
put(3.45, 'bubble', popup(520, 0.18), -14)
put(4.7, 'fingergrow', growtone(1.6, 400, 800), -14)
put(8.3, 'toegrow', growtone(1.0, 300, 420), -14)
put(9.95, 'bubble2', popup(560, 0.18), -14)
put(10.8, 'root', shimmer(0.7), -15)
put(13.5, 'blood', heartbeat(0.5, 52), -13)
put(14.1, 'blood2', heartbeat(0.5, 52), -14)
put(15.3, 'heart', heartbeat(0.5, 55), -12)
put(15.9, 'heart2', heartbeat(0.5, 55), -13)
put(16.5, 'heart3', heartbeat(0.5, 55), -14)
put(17.2, 'laptop', popup(420, 0.15), -15)
put(18.9, 'tap', keys_s(0.6, 8), -13)
put(19.55, 'type', keys_s(0.7, 16, 4), -13)
put(20.3, 'scratch', scratch_s(0.9), -13)
put(22.0, 'race2F', growtone(2.6, 300, 900), -14)
put(22.0, 'race2T', growtone(2.6, 200, 360), -17)
put(24.6, 'stamp', stamp_hit(0.6, 85), -10)
