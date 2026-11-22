def ney(d=2.4):
    out = np.zeros(int(d * SR)); notes = [294, 311, 370, 392, 440, 392]
    for i, f in enumerate(notes):
        s = int(i * 0.38 * SR); tt = t_(0.5); x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * env(len(tt), 0.05, 0.2) + lp(np.random.default_rng(i).standard_normal(len(tt)), 2000) * 0.08; n = min(len(x), len(out) - s)
        if n > 0: out[s:s + n] += x[:n]
    return norm(out, 0.4)

def scrape_s(d=0.6):
    tt = t_(d); return norm(bp(noise(d), 1500, 4500) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt)) ** 2, 0.35)

def saltpour(d=2.2):
    return norm(bp(np.random.default_rng(5).standard_normal(int(d * SR)), 2500, 8000) * env(int(d * SR), 0.2, 0.5) * 0.6, 0.3)

# ---- timeline
put(0.0, 'ney', ney(2.4), -15)
put(3.9, 'hook1', scrape_s(0.6), -12)
put(4.9, 'hook2', scrape_s(0.6), -12)
put(6.0, 'squelch', squelch(0.4, 90), -12)
for n in range(4): put(7.6 + n * 0.15, f'jar{n}', popup(420 + 60 * n, 0.15), -14)
for n in range(4): put(9.3 + n * 0.3, f'plop{n}', plop(0.25, 200 + 30 * n), -13)
put(11.6, 'heart', heartbeat(0.5, 52), -12)
put(12.2, 'heart2', heartbeat(0.5, 52), -13)
put(13.4, 'salt', saltpour(2.4), -12)
put(14.9, 'days', clockrun(1.6, 14), -16)
put(18.2, 'wrap', rustle(3.0, 4), -12)
put(21.6, 'done', chime(1.2, 784), -13)
put(22.7, 'days2', clockrun(1.2, 14), -16)
