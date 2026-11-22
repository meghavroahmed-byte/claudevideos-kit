def sip(d=0.6):
    tt = t_(d); return norm(bp(noise(d), 600, 2500) * np.sin(np.pi * tt / d) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * tt)), 0.35)

def dock(d=0.18, f=520):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) + 0.4 * np.sin(2 * np.pi * f * 1.5 * tt) * np.exp(-tt * 40), 0.5)

def buzzawake(d=1.6):
    tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(300 + 500 * tt / d) / SR) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * tt)))
    return norm(lp(x, 2500) * env(len(tt), 0.05, 0.3), 0.4)

def slump(d=1.2):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(400 * np.exp(-tt * 2.2)) / SR) * env(len(tt), 0.02, 0.4) * 0.6, 0.5)

# ---- timeline
put(0.1, 'sip', sip(0.8), -12)
put(0.9, 'jolt', zap(0.25), -13)
put(2.45, 'bubble', popup(520, 0.18), -14)
for n, a in enumerate([2.8, 3.4, 4.0, 4.6, 5.2]): put(a, f'aden{n}', plink(0.15, 900 + 60 * n), -17)
put(5.5, 'dockA', dock(0.2, 420), -14)
put(6.9, 'yawn', exhale(1.0), -13)
put(8.45, 'sip2', sip(0.8), -12)
put(10.3, 'dockC', dock(0.2, 680), -12)
put(10.6, 'dockC2', dock(0.2, 760), -13)
put(13.3, 'blocked', bonk(0.4), -12)
put(15.35, 'awake', buzzawake(1.6), -13)
put(17.4, 'wearoff', powerdown(0.9), -13)
put(19.5, 'flood', bubbling(1.2, 18), -14)
put(21.0, 'slump', slump(1.2), -11)
put(21.2, 'thud', thunk(0.35), -9)
put(21.3, 'stamp', stamp_hit(0.6, 80), -10)
