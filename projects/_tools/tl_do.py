def trumpet(d=0.9, f=330):
    tt = t_(d); fq = f * (1 + 0.15 * np.sin(np.pi * tt / d)) + 8 * np.sin(2 * np.pi * 6 * tt)
    ph = 2 * np.pi * np.cumsum(fq) / SR; x = sum(np.sin(m * ph) * a for m, a in [(1, 1), (2, 0.7), (3, 0.5), (4, 0.3), (5, 0.2)])
    return norm(lp(x, 3000) * env(len(tt), 0.05, 0.3), 0.6)

def groan(d=1.6, f=48):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.1 * np.sin(2 * np.pi * 0.8 * tt))) / SR) + 0.4 * np.sin(2 * np.pi * f * 2.03 * tt)
    return norm(lp(x * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)), 400) * env(len(tt), 0.3, 0.6), 0.7)

def darkdrop(d=2.0):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(220 * (1 - 0.7 * tt / d)) / SR) * env(len(tt), 0.1, 0.8) * 0.6 + np.sin(2 * np.pi * 55 * tt) * env(len(tt), 0.4, 0.8) * 0.4, 0.55)

# ---- timeline
put(0.3, 'splashin', splash(1.0), -12)
put(0.8, 'bubbles', bubbling(2.0, 8), -16)
put(3.9, 'squeeze', groan(1.8, 52), -11)
put(8.5, 'darkness', darkdrop(2.2), -12)
put(10.9, 'shiver', chatter(1.6, 16), -15)
put(14.5, 'glow1', chime(1.0, 1046.5), -15)
put(15.0, 'glow2', chime(1.0, 1318.5), -16)
put(15.6, 'glow3', chime(1.2, 1568.0), -16)
put(17.8, 'deeper', groan(1.6, 40), -12)
put(19.9, 'trumpet', trumpet(0.9, 330), -12)
put(20.4, 'press', strain(0.7, 65), -12)
put(22.0, 'descend', darkdrop(1.4), -15)
put(23.25, 'land', thunk(0.35), -9)
put(23.3, 'dust', rustle(0.6, 3), -15)
put(25.22, 'crunch', crunch(0.4), -8)
put(25.25, 'splat', squelch(0.4, 80), -8)
put(25.45, 'stamp', stamp_hit(0.6, 80), -10)
