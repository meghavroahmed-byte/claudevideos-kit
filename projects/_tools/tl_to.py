def roarwind(d=22.0):
    tt = t_(d); x = lp(noise(d), 260, 4) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * tt)) + bp(noise(d), 600, 1600) * 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.3 * tt))
    return norm(x * env(len(tt), 1.0, 1.5), 0.6)

def whistle(d=3.0, f=900):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f + 200 * np.sin(2 * np.pi * 0.8 * tt)) / SR) * env(len(tt), 0.3, 0.5) * 0.4 + bp(noise(d), 1500, 4000) * 0.4 * env(len(tt), 0.3, 0.5), 0.45)

def metalcrash(d=1.0):
    tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in [(320, 6), (510, 8), (870, 10)]) + lp(noise(d), 3000) * np.exp(-tt * 14), 0.8)

def zips(d=6.0, seed=4):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * 3)):
        s = int(r.uniform(0, d - 0.4) * SR); u = t_(0.35); f = r.uniform(500, 1200); b = bp(r.standard_normal(len(u)), f, f * 2.2) * np.sin(np.pi * u / 0.35) ** 2; out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

# ---- timeline
put(0.0, 'roar', roarwind(22.0), -11)
put(3.6, 'count', clockrun(2.6, 18), -16)
put(7.2, 'carlift', metalcrash(1.0), -12)
put(7.6, 'carwhoosh', whoosh(1.2), -13)
put(9.2, 'roof', crack(0.6) if 'crack' in dir() else crunch(0.4), -10)
put(10.8, 'debris', zips(6.4, 4), -12)
put(13.2, 'w1', popup(420, 0.15), -15)
put(13.8, 'glass', tinkle(0.8, 3), -14)
put(14.5, 'metal', clank(0.4, 420) if 'clank' in dir() else tick(0.12, 900), -13)
put(15.2, 'run', crunch_steps(3.2, 4.5), -15)
put(19.7, 'dive', flop(0.5), -11)
put(22.4, 'tunnelwind', whistle(5.6, 800), -11)
put(23.3, 'nope', bonk(0.4), -12)
