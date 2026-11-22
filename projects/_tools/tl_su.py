def lick(d=0.25):
    tt = t_(d); return norm(bp(noise(d), 800, 3000) * np.sin(np.pi * tt / d) ** 2, 0.4)

def chomp2(d=0.25):
    tt = t_(d); return norm(lp(noise(d), 1200, 2) * np.exp(-tt * 25) + np.sin(2 * np.pi * 160 * tt) * np.exp(-tt * 30) * 0.5, 0.6)

def rise_up(d=1.8):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(300 + 600 * tt / d) / SR) * env(len(tt), 0.1, 0.2) * 0.6, 0.45)

def fall_down(d=2.4):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(900 - 700 * tt / d) / SR) * env(len(tt), 0.1, 0.3) * 0.6, 0.45)

def munchers(d=1.6, seed=3):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * 8)):
        s = int(r.uniform(0, d - 0.1) * SR); u = t_(0.06); b = np.sin(2 * np.pi * r.uniform(500, 900) * u) * np.exp(-u * 60); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.4)

# ---- timeline
for n, a in enumerate([0.3, 0.9, 1.5, 2.1]): put(a, f'lick{n}', lick(0.25) if n % 2 else chomp2(0.25), -12)
put(0.0, 'cubes', tinkle(2.4, 4), -17)
put(2.95, 'bubble', popup(520, 0.18), -14)
put(3.0, 'rush', stream(2.0, 30), -16)
put(6.6, 'insulin', bubblepop(0.2), -12)
put(7.3, 'gobble', munchers(1.0), -14)
put(8.6, 'graph', rise_up(1.0), -15)
put(9.0, 'energy', zap(0.25), -12)
put(9.2, 'hyper', boing(0.6, 300), -14)
put(11.2, 'drop', fall_down(3.6), -13)
put(15.3, 'crash', slump_s(1.2) if 'slump_s' in dir() else powerdown(0.9), -11)
put(15.4, 'stamp', stamp_hit(0.6, 80), -10)
put(16.9, 'tummy', tummy(0.9), -12)
put(20.4, 'inflate', inflate(0.6), -11)
put(22.4, 'tooth', popup(520, 0.18), -14)
put(22.6, 'germs', munchers(1.8, 5), -13)
