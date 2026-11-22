def handletug(d=0.5, seed=1):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(3):
        s = int(k * 0.15 * SR); u = t_(0.08); b = np.sin(2 * np.pi * r.uniform(300, 420) * u) * np.exp(-u * 50); out[s:s + len(b)] += b[:len(out) - s]
    return norm(lp(out, 2500), 0.55)

def decomp(d=3.0):
    tt = t_(d); x = lp(noise(d), 1200, 2) * np.exp(-tt * 0.8) + np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 3) * 0.6
    return norm(x * env(len(tt), 0.005, 0.8), 0.85)

def chimeding(d=1.0):
    tt = t_(d); return norm((np.sin(2 * np.pi * 880 * tt) * (tt < 0.4) + np.sin(2 * np.pi * 659 * tt) * (tt >= 0.4)) * np.exp(-((tt % 0.4)) * 4) * env(len(tt), 0.005, 0.2), 0.4)

# ---- timeline
put(0.0, 'cabinding', chimeding(0.9), -16)
put(0.4, 'tug1', handletug(0.5, 1), -12)
put(1.5, 'tug2', handletug(0.5, 2), -12)
put(2.6, 'tug3', handletug(0.5, 3), -12)
put(3.7, 'cant', stamp_hit(0.6, 80), -10)
put(6.0, 'press', whoosh(0.8, False), -14)
for n in range(7): put(8.75 + n * 0.09, f'car{n}', popup(500 + 40 * n, 0.12), -16)
put(10.4, 'bubble', popup(520, 0.18), -14)
put(12.9, 'seal', thunk(0.35), -12)
put(16.2, 'decomp', decomp(3.0), -8)
put(16.3, 'glass', crack(0.5) if 'crack' in dir() else snap(0.3), -11)
put(19.9, 'masks', clunk(0.5), -12)
put(21.0, 'timer', clockticks(2.3, 9), -15)
put(23.6, 'maskon', strap(0.25), -12)
put(24.8, 'first', stamp_hit(0.6, 85), -10)
