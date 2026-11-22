def creak_s(d=0.8, f=180):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.3 * np.sin(2 * np.pi * 6 * tt))) / SR) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 30 * tt)))
    return norm(lp(x, 1500) * env(len(tt), 0.05, 0.3), 0.4)

def ramhit(d=0.8):
    tt = t_(d); x = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 8) + lp(noise(d), 1200, 2) * np.exp(-tt * 15) * 0.8 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 12) * 0.4
    return norm(x, 0.95)

def rumble_c(d=2.0):
    tt = t_(d); return norm((lp(noise(d), 160, 4) + np.sin(2 * np.pi * 40 * tt) * 0.4) * env(len(tt), 0.05, 1.0), 0.8)

def horn_s(d=1.2, f=220):
    tt = t_(d); ph = 2 * np.pi * f * tt; x = sum(np.sin(m * ph) * a for m, a in [(1, 1), (2, 0.6), (3, 0.35), (4, 0.2)])
    return norm(lp(x, 2000) * env(len(tt), 0.08, 0.3), 0.55)

# ---- timeline
put(0.0, 'trebswing', whoosh(0.6), -12)
put(2.25, 'boulderhit0', kaboom(1.4), -12)
put(2.4, 'horn', horn_s(1.3, 196), -13)
put(2.6, 'march', crunch_steps(3.2, 4.4), -16)
put(4.7, 'noX', bonk(0.4), -13)
put(6.4, 'daynight', clockrun(4.0, 6), -16)
put(9.0, 'stomach', tummy(0.9), -13)
put(11.8, 'ramroll', creak_s(1.8, 160), -13)
put(13.98, 'ramhit', ramhit(0.8), -7)
put(14.1, 'splinter', crunch(0.4), -12)
put(16.7, 'trebcreak', creak_s(0.6, 220), -13)
put(17.05, 'release', whoosh(0.8), -11)
put(18.38, 'wallhit', kaboom(1.4), -8)
put(19.6, 'dig', dig(0.3), -12)
put(20.2, 'dig2', dig(0.3), -12)
put(20.8, 'dig3', dig(0.3), -13)
put(22.45, 'collapse', rumble_c(2.0), -8)
put(22.6, 'debris', crunch(0.4), -11)
put(23.0, 'cheer', cheer(1.4), -14)
