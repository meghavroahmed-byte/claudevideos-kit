def lubdub(d=0.6, f=50):
    tt = t_(d); out = np.zeros(len(tt))
    for off, a, ff in [(0, 1.0, f), (0.16, 0.7, f * 1.15)]:
        s = int(off * SR); u = t_(0.14); b = np.sin(2 * np.pi * ff * u) * np.exp(-u * 26) * a; out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 300), 0.8)

def crowd_s(d=2.0, seed=3):
    return norm(bp(np.random.default_rng(seed).standard_normal(int(d * SR)), 300, 1400) * env(int(d * SR), 0.4, 0.6), 0.25)

# ---- timeline
tb = 0.0
n = 0
while tb < 25.0:
    put(tb, f'beat{n % 3}', lubdub(0.6, 48 + (n % 3) * 2), -11 if tb < 3.2 else -15)
    tb += 1 / 1.17; n += 1
put(0.0, 'crowd', crowd_s(2.4), -20)
put(3.1, 'jogsteps', crunch_steps(6.4, 4.0), -17)
put(3.7, 'count1', clockrun(1.2, 18), -16)
put(5.8, 'count2', clockrun(2.0, 22), -16)
put(10.2, 'oldself', shimmer(0.8), -15)
put(11.6, 'count3', clockrun(2.0, 26), -15)
put(13.6, 'billion', ding(1.2), -13)
put(16.2, 'vessels', riser(4.4), -16)
put(18.0, 'count4', clockrun(1.8, 20), -16)
put(21.0, 'globe', popup(480, 0.18), -13)
put(21.6, 'wrap', whoosh(1.2), -14)
put(23.0, 'twice', chime(1.0, 1046.5), -13)
