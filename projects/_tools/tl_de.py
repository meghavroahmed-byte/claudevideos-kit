def heatwave_s(d=2.0):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(300 + 40 * np.sin(2 * np.pi * 3 * tt)) / SR) * 0.4 + np.sin(2 * np.pi * np.cumsum(452 + 50 * np.sin(2 * np.pi * 2.3 * tt)) / SR) * 0.3
    return norm(x * env(len(tt), 0.5, 0.7), 0.3)

def crickets(d=2.0, seed=2):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * 3)):
        s = int(r.uniform(0, d - 0.2) * SR); u = t_(0.12); b = np.sin(2 * np.pi * 4200 * u) * (np.sin(2 * np.pi * 60 * u) > 0) * np.exp(-u * 10); out[s:s + len(b)] += b[:len(out) - s] * 0.5
    return norm(lp(out, 5000), 0.2)

# ---- timeline
put(0.0, 'sandsteps', crunch_steps(2.2, 2.4), -16)
put(3.2, 'thermo', riser(1.8), -15)
put(4.8, 'heat', heatwave_s(2.4), -16)
put(5.9, 'eggfall', whoosh(0.3), -16)
put(6.25, 'crack', crack(0.5) if 'crack' in dir() else snap(0.25), -10)
put(6.35, 'sizzle', sizzle_low(2.4) if 'sizzle_low' in dir() else fizz(2.4), -12)
put(8.3, 'sweat', plink(0.2, 1500), -15)
put(8.7, 'sweat2', plink(0.2, 1300), -16)
put(9.2, 'bottle', popup(520, 0.18), -14)
put(10.0, 'drain', glug(0.6), -12)
put(11.0, 'drain2', glug(0.6), -13)
put(14.0, 'noon', stamp_hit(0.6, 80), -10)
put(14.6, 'walkshade', crunch_steps(1.3, 2.4), -16)
put(16.6, 'nightfall', dream(1.6) if 'dream' in dir() else shimmer(1.4), -15)
put(17.0, 'crickets', crickets(1.6), -18)
put(17.0, 'nightwalk', crunch_steps(1.6, 2.2), -17)
put(18.5, 'sunrise', chime(1.0, 784), -16)
put(20.5, 'mirage', shimmer(1.4), -13)
put(20.6, 'run', crunch_steps(1.4, 4.0), -15)
put(22.05, 'poof', whoosh(0.5, False), -13)
put(22.3, 'ray', sweep_tone(1.6) if 'sweep_tone' in dir() else riser(1.4), -16)
