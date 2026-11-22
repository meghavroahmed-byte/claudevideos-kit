def rumble_ev(d=2.4, f=38):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.5 * tt) + lp(noise(d), 120, 4) * 0.8
    return norm(x * env(len(tt), 0.6, 1.0), 0.6)

def stretchy(d=2.0):
    tt = t_(d); f = 120 * (1 + 2.5 * (tt / d) ** 1.5); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * tt))
    return norm(lp(x, 1800) * env(len(tt), 0.2, 0.3), 0.5)

def slowdown(d=2.2):
    tt = t_(d); f = 600 * np.exp(-tt * 1.2); ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) + 0.3 * np.sin(2 * ph)
    return norm(x * env(len(tt), 0.05, 0.6), 0.5)

def beep2(d=0.5):
    tt = t_(d); x = np.sin(2 * np.pi * 1200 * tt) * ((tt % 0.25) < 0.1)
    return norm(x * env(len(tt), 0.01, 0.05), 0.35)

def plunge(d=3.0):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(180 * (1 - 0.8 * tt / d)) / SR) + lp(noise(d), 300, 4) * 0.5
    return norm(x * env(len(tt), 0.4, 1.0), 0.6)

# ---- timeline
put(0.0, 'rumble', rumble_ev(2.6), -13)
put(3.5, 'pull', whoosh(0.8, False), -13)
put(5.4, 'arrow_big', thunk(0.35), -14)
put(6.2, 'arrow_small', tick(0.1, 1300), -16)
put(7.3, 'stretch', stretchy(3.0), -12)
put(9.95, 'spaghetti', boing(0.6, 220), -13)
put(12.6, 'stamp', stamp_hit(0.6, 85), -10)
put(14.4, 'radio', beep2(0.5), -15)
put(16.5, 'slowdown', slowdown(2.2), -12)
put(18.8, 'redfade', powerdown(0.9), -15)
put(20.6, 'resume', resume(0.6), -14)
put(21.6, 'plunge', plunge(3.0), -11)
put(25.3, 'mystery', chime(1.6, 659.3), -14)
