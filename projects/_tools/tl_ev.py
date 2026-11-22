def gust2(d=2.6):
    tt = t_(d); return norm(bp(noise(d), 300, 1800) * (0.5 + 0.5 * np.sin(np.pi * tt / d)) ** 2, 0.45)

def pound(d=4.4, rate=2.6):
    tt = t_(d); out = np.zeros(len(tt))
    for k in range(int(d * rate)):
        for off, a in [(0, 1.0), (0.13, 0.65)]:
            s = int((k / rate + off) * SR); u = t_(0.13); b = np.sin(2 * np.pi * 52 * u) * np.exp(-u * 24) * a; out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.75)

def gasps(d=2.0, rate=2.5):
    tt = t_(d); return norm(bp(noise(d), 500, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * tt)) ** 4, 0.4)

def frostcrack(d=1.0, seed=4):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(8):
        s = int(r.uniform(0, d - 0.1) * SR); u = t_(0.04); b = np.sin(2 * np.pi * r.uniform(2500, 4500) * u) * np.exp(-u * 90); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

def hiss_valve(d=0.8):
    tt = t_(d); return norm(bp(noise(d), 3000, 7000) * env(len(tt), 0.05, 0.4) * 0.6, 0.3)

# ---- timeline
put(0.0, 'wind1', gust2(2.6), -14)
put(0.2, 'crunch', crunch_steps(2.0, 2.4), -15)
put(3.5, 'bubble', popup(480, 0.18), -14)
put(4.7, 'drop', fall_tone(1.0) if 'fall_tone' in dir() else powerdown(0.9), -14)
put(7.9, 'pound', pound(4.6, 2.6), -11)
put(10.6, 'steps', crunch_steps(2.0, 1.6), -15)
put(11.0, 'gasp', gasps(2.2, 2.4), -12)
put(13.1, 'bubble2', popup(520, 0.18), -14)
put(14.6, 'swell', inflate(0.6), -12)
put(16.4, 'frost', frostcrack(1.6, 4), -12)
put(17.0, 'wind2', gust2(2.4), -15)
put(21.1, 'zone', stamp_hit(0.6, 70), -9)
put(22.6, 'valve', hiss_valve(0.8), -14)
put(23.4, 'breath', inhale(1.4), -14)
