def quake(d=15.0):
    tt = t_(d); x = lp(noise(d), 90, 4) * 1.0 + np.sin(2 * np.pi * 32 * tt) * 0.4 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt))
    return norm(x * env(len(tt), 0.3, 1.0), 0.7)

def rattle(d=3.0, seed=2):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * 30)):
        s = int(r.uniform(0, d - 0.05) * SR); u = t_(0.03); b = np.sin(2 * np.pi * r.uniform(1500, 3500) * u) * np.exp(-u * 150) * r.uniform(0.3, 1); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out * env(len(out), 0.3, 0.5), 0.3)

def glassbreak(d=1.4, seed=5):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(40):
        s = int(r.uniform(0, 0.8) ** 2 * SR); u = t_(0.08); b = np.sin(2 * np.pi * r.uniform(2500, 6000) * u) * np.exp(-u * 50) * r.uniform(0.3, 1); out[s:s + len(b)] += b[:len(out) - s]
    tt = t_(d); out += lp(noise(d), 5000) * np.exp(-tt * 12) * 0.8
    return norm(out, 0.8)

def bookthud(d=0.3):
    tt = t_(d); return norm(np.sin(2 * np.pi * 120 * tt) * np.exp(-tt * 25) + lp(noise(d), 800) * np.exp(-tt * 30) * 0.5, 0.5)

# ---- timeline
put(0.0, 'quake', quake(15.0), -9)
put(0.0, 'rattle', rattle(14.0, 2), -16)
for n, a in enumerate([0.9, 1.6, 2.4, 3.1, 3.9, 4.6, 5.2]): put(a, f'book{n % 3}', bookthud(0.3), -12)
put(2.6, 'nope', bonk(0.4), -12)
put(4.9, 'crack', crack(0.5) if 'crack' in dir() else snap(0.3), -12)
put(5.35, 'glass', glassbreak(1.4), -8)
put(9.0, 'drop', thunk(0.35), -12)
put(10.3, 'crawl', rustle(1.4, 3), -15)
put(12.9, 'grip', strap(0.25), -12)
put(14.6, 'settle', powerdown(0.9), -15)
for n, a in enumerate([16.4, 17.1, 18.4]): put(a, f'warn{n}', popup(380 + 60 * n, 0.18), -12)
for n, a in enumerate([19.96, 20.62, 21.24]): put(a, f'word{n}', stamp_hit(0.4, 90 + 10 * n), -13)
put(22.6, 'safe', chime(1.2, 1046.5), -12)
