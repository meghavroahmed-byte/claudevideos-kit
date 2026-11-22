def blub(d=0.25, f=300):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * tt / d)) / SR) * np.exp(-tt * 14), 0.5)

def squish(d=1.2):
    tt = t_(d); return norm(bp(noise(d), 300, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * tt)) * env(len(tt), 0.1, 0.3) + np.sin(2 * np.pi * np.cumsum(200 - 100 * tt / d) / SR) * 0.3 * env(len(tt), 0.1, 0.3), 0.45)

def morph(d=0.8):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(900 * np.exp(-tt * 3)) / SR) * env(len(tt), 0.01, 0.4) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * tt)), 0.45)

# ---- timeline
put(0.0, 'bubbles', bubbling(2.4, 5), -17)
put(3.4, 'nine', popup(520, 0.18), -13)
put(4.9, 'brain1', chime(0.8, 659.3), -14)
for n in range(8): put(6.3 + n * 0.17, f'brain{n}', plink(0.2, 1000 + 80 * n), -15)
put(9.0, 'wiggle', wiggle(3.6, 10) if 'wiggle' in dir() else rustle(2.0, 2), -16)
put(13.6, 'twist', creak(0.8) if 'creak' in dir() else strain(0.6, 90), -13)
put(14.4, 'pop', blub(0.25, 400), -11)
put(16.6, 'squeeze', squish(1.4), -12)
put(18.6, 'swim', whoosh(0.6), -15)
put(21.2, 'camo', morph(0.8), -11)
put(22.6, 'gone', shimmer(1.0), -15)
