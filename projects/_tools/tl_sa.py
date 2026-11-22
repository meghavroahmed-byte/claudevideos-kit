def metalclang(d=0.9, f=1250):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * m * tt) * a * np.exp(-tt * (6 + m * 2)) for m, a in [(1, 1), (1.51, 0.6), (2.27, 0.4), (3.1, 0.25)]) + lp(noise(d), 5000) * np.exp(-tt * 60) * 0.5
    return norm(x, 0.85)

def platetick(d=0.06, f=2200):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 120), 0.3)

def koto(d=2.4):
    out = np.zeros(int(d * SR)); notes = [440, 523, 587, 659, 784, 659]
    for i, f in enumerate(notes):
        s = int(i * 0.35 * SR); tt = t_(1.0); x = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 4); n = min(len(x), len(out) - s)
        if n > 0: out[s:s + n] += x[:n]
    return norm(out, 0.45)

# ---- timeline
put(0.75, 'swing1', slash(0.22), -11)
put(1.18, 'clang1', metalclang(0.9, 1250), -7)
put(2.7, 'koto', koto(2.4), -15)
for n in range(16): put(3.5 + n * 0.23, f'plate{n % 4}', platetick(0.06, 1900 + 150 * (n % 4)), -15)
put(7.1, 'lace', rustle(0.9, 3), -14)
put(11.5, 'runsteps', crunch_steps(1.8, 5.5), -15)
put(13.7, 'swish1', slash(0.22), -13)
put(14.3, 'swish2', slash(0.22), -13)
put(14.9, 'swish3', slash(0.22), -13)
put(16.95, 'swing2', slash(0.22), -10)
put(17.38, 'clang2', metalclang(1.1, 1100), -6)
for n, a in enumerate([22.2, 23.0, 24.0]): put(a, f'target{n}', popup(520 + 120 * n, 0.18), -13)
