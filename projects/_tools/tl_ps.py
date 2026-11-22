def lampclick(d=0.15):
    tt = t_(d); return norm(np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 120) + lp(noise(d), 4000) * np.exp(-tt * 200) * 0.5, 0.5)

def notif(d=0.5):
    tt = t_(d); return norm(np.sin(2 * np.pi * 1568 * tt) * np.exp(-tt * 10) * (tt < 0.15) + np.sin(2 * np.pi * 2093 * tt) * np.exp(-(tt - 0.15) * 10) * (tt >= 0.15), 0.35)

def lullaby(d=2.4):
    out = np.zeros(int(d * SR)); notes = [659, 523, 587, 392]
    for i, f in enumerate(notes):
        s = int(i * 0.55 * SR); x = marimba(f, 0.8); n = min(len(x), len(out) - s)
        if n > 0: out[s:s + n] += x[:n]
    return norm(out, 0.4)

def sheets(d=1.0, seed=2):
    return norm(bp(np.random.default_rng(seed).standard_normal(int(d * SR)), 300, 2500) * env(int(d * SR), 0.2, 0.4) * 0.5, 0.3)

# ---- timeline
put(0.2, 'notif', notif(0.5), -14)
put(1.4, 'scroll', typing(1.2, 6), -18)
put(2.9, 'lampoff', lampclick(0.15), -11)
put(4.2, 'bubble', popup(520, 0.18), -14)
put(5.6, 'melatonin', lullaby(2.4), -15)
put(7.3, 'yawn', exhale(1.0), -14)
put(10.2, 'phoneon', notif(0.5), -12)
put(11.2, 'bluelight', shimmer(1.0), -13)
put(12.8, 'sun', chime(1.0, 1046.5), -15)
put(16.8, 'block', bonk(0.4), -12)
put(19.2, 'clock', clockrun(2.6, 14), -14)
put(19.4, 'toss', sheets(1.0, 2), -15)
put(20.6, 'toss2', sheets(1.0, 3), -15)
put(22.3, 'putdown', thunk(0.3), -12)
put(22.6, 'stamp', stamp_hit(0.6, 80), -10)
put(23.6, 'sleep', lullaby(2.0), -16)
