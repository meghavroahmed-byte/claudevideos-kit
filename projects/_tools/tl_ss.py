def summer(d=2.2):
    out = np.zeros(int(d * SR)); notes = [523, 659, 784, 880]
    for i, f in enumerate(notes):
        s = int(i * 0.45 * SR); x = marimba(f, 0.8); n = min(len(x), len(out) - s)
        if n > 0: out[s:s + n] += x[:n]
    return norm(out, 0.4)

def focusbeam(d=1.4):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(300 + 900 * (tt / d) ** 2) / SR) * env(len(tt), 0.1, 0.2) * 0.5, 0.4)

def blurtone(d=3.5):
    tt = t_(d); return norm(lp(np.sin(2 * np.pi * 220 * tt) + np.sin(2 * np.pi * 223 * tt), 600) * env(len(tt), 0.8, 1.0) * 0.5, 0.35)

def eclipse(d=2.4):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) for f in (110, 164.8, 220)) / 3
    return norm(x * env(len(tt), 0.8, 0.8), 0.5)

# ---- timeline
put(0.0, 'summer', summer(2.2), -16)
put(2.3, 'bubble', popup(520, 0.18), -14)
put(4.9, 'focus', focusbeam(1.4), -13)
put(7.0, 'burn', sizzle_low(1.6) if 'sizzle_low' in dir() else fizz(1.4), -12)
put(11.0, 'nopain', bonk(0.4), -13)
put(15.1, 'hours', clockrun(1.2, 10), -15)
put(16.6, 'blur', blurtone(4.0), -14)
put(21.4, 'cover', whoosh(0.4), -15)
put(22.4, 'eclipse', eclipse(2.6), -12)
put(23.6, 'dont', stamp_hit(0.6, 80), -10)
