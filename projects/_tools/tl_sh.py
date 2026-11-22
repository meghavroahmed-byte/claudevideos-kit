def lowpulse(d=2.4, rate=2.2, f=60):  # menacing two-note pulse (event only)
    tt = t_(d); x = np.zeros(len(tt))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.3); fr = f if k % 2 == 0 else f * 1.06; b = np.sin(2 * np.pi * fr * u) * np.exp(-u * 6); x[s:s + len(b)] += b[:len(x) - s]
    return norm(lp(x, 400), 0.7)

def thrash(d=3.0, seed=4):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * 9)):
        s = int(r.uniform(0, d - 0.2) * SR); u = t_(0.15); b = lp(r.standard_normal(len(u)), 1500, 2) * np.exp(-u * 25); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out * env(len(out), 0.1, 0.4), 0.6)

def punchhit(d=0.4):
    tt = t_(d); x = np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 18) + lp(noise(d), 2000, 2) * np.exp(-tt * 40) * 0.6
    return norm(x, 0.9)

# ---- timeline
put(0.0, 'menace', lowpulse(2.4, 2.2, 55), -12)
put(1.0, 'bubbles', bubbling(1.6, 6), -18)
put(4.3, 'thrash', thrash(3.0), -12)
put(4.5, 'nosplash', stamp_hit(0.6, 80), -11)
put(6.0, 'prey', heartbeat(0.5, 50), -14)
put(6.6, 'prey2', heartbeat(0.5, 50), -14)
put(8.0, 'eyes', shimmer(0.7), -16)
put(9.6, 'swimback', whoosh(0.8, False), -17)
put(12.9, 'charge', lowpulse(1.2, 5, 62), -11)
put(13.0, 'rush', whoosh(1.0), -12)
put(14.02, 'punch', punchhit(0.4), -6)
for n, a in enumerate([14.75, 15.55, 16.25]): put(a, f'target{n}', popup(500 + 120 * n, 0.18), -13)
put(17.4, 'swimoff', whoosh(1.2, False), -14)
put(19.0, 'relax', chime(1.2, 784), -15)
put(20.65, 'thunder', thunder(1.4), -12)
put(22.2, 'small', plink(0.2, 1500), -14)
