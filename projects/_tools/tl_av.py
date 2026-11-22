def avroar(d=5.0):
    tt = t_(d); x = lp(noise(d), 220, 4) + 0.4 * lp(noise(d), 900, 2) * (tt / d)
    return norm(x * (tt / d) ** 1.5 * env(len(tt), 0.05, 0.2), 0.75)

def snowrush(d=5.5):
    tt = t_(d); return norm(lp(noise(d), 500, 4) * env(len(tt), 0.2, 1.0) * (0.7 + 0.3 * np.sin(2 * np.pi * 1.3 * tt)), 0.5)

def setcrack(d=0.8, seed=3):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(7):
        s = int(r.uniform(0, 0.5) * SR); u = t_(0.06); b = lp(r.standard_normal(len(u)), 2500) * np.exp(-u * 80); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.6)

def bark(d=0.3, f=420):
    tt = t_(d); fq = f * (1 + 0.4 * np.exp(-tt * 20)); ph = 2 * np.pi * np.cumsum(fq) / SR
    return norm(lp((np.sin(ph) + 0.6 * np.sin(2 * ph)) * np.exp(-tt * 12), 2400) * env(len(tt), 0.005, 0.05), 0.7)

# ---- timeline
put(0.0, 'rumble', avroar(7.3), -11)
put(4.4, 'speed', clockrun(2.0, 14), -17)
put(7.25, 'impact', kaboom(1.4), -8)
put(7.5, 'rush', snowrush(5.5), -14)
put(8.5, 'swim', stamp_hit(0.6, 80), -11)
for n, a in enumerate([9.6, 10.6, 11.6]): put(a, f'stroke{n}', whoosh(0.4), -16)
put(14.1, 'armup', whoosh(0.5), -14)
put(16.4, 'cup', flop(0.4), -16)
put(18.4, 'pocket', shimmer(0.8), -15)
put(20.3, 'settle', setcrack(0.8), -11)
put(21.0, 'hard', thunk(0.4), -12)
put(23.4, 'dogrun', paws(1.6, 12), -14)
put(25.1, 'bark1', bark(0.3, 420), -10)
put(25.45, 'bark2', bark(0.3, 450), -11)
put(25.5, 'found', chime(1.0, 1046.5), -13)
