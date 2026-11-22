def footrun(d, rate, seed=1, f=90):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int((k / rate + r.uniform(0, 0.01)) * SR); u = t_(0.08); b = (np.sin(2 * np.pi * f * u) * 0.6 + lp(r.standard_normal(len(u)), 1500) * 0.5) * np.exp(-u * 40); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

def pant(d=3.0, rate=4):
    tt = t_(d); return norm(bp(noise(d), 400, 2200) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * tt)) ** 3, 0.4)

def windrush(d=4.0):
    tt = t_(d); return norm(lp(noise(d), 800, 2) * env(len(tt), 0.5, 0.8) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * tt)), 0.4)

# ---- timeline
put(0.0, 'herofeet', footrun(17.0, 3.5, 1, 110), -16)
put(0.0, 'catfeet', footrun(14.0, 5.0, 2, 70), -15)
put(0.6, 'growl', growl(0.9, 75), -12)
put(3.4, 'wind', windrush(4.0), -14)
put(4.0, 'speed', riser(3.0), -15)
put(9.4, 'you', popup(420, 0.15), -14)
put(12.9, 'timer', clockticks(3.8, 20), -16)
put(14.8, 'overheat', sizzle_low(2.0) if 'sizzle_low' in dir() else fizz(1.6), -14)
put(15.0, 'pant', pant(3.6, 4), -12)
put(17.0, 'flop', flop(0.5), -11)
put(18.0, 'pant2', pant(4.0, 2.5), -16)
put(21.3, 'luck', stamp_hit(0.6, 85), -10)
