def blinkclick(d=0.08, f=1900):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90), 0.35)

def wiper(d=1.4):
    tt = t_(d); return norm(bp(noise(d), 600, 2200) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / d * 2 - 1.5)) ** 2 + np.sin(2 * np.pi * 120 * tt) * 0.15 * env(len(tt), 0.1, 0.1), 0.35)

# ---- timeline
BLS = []
tt0 = 0.25
while tt0 < 25.6:
    BLS.append(tt0); tt0 += 0.45 if tt0 < 2.4 else (1.25 + ((len(BLS) * 7) % 5) * 0.12 if tt0 < 19.8 else 3.4)
for n, b in enumerate(BLS): put(b, f'blink{n % 4}', blinkclick(0.08, 1700 + 120 * (n % 4)), -17 if 2.4 < b < 19.8 else -15)
put(2.6, 'tick', clockticks(1.6, 15), -17)
put(4.5, 'count', clockrun(2.0, 18), -15)
put(7.7, 'stopwatch', tick(0.12, 1500), -14)
put(10.6, 'add', riser(1.8), -15)
put(15.0, 'dust', tinkle(0.8, 5), -17)
put(16.9, 'wiper', wiper(1.4), -12)
put(17.2, 'tears', drip(0.4) if 'drip' in dir() else plink(0.2, 1200), -14)
put(19.6, 'turn', whoosh(0.4), -16)
put(20.4, 'typing', typing(2.6, 9), -17)
put(22.6, 'dry', sizzle_low(0.9) if 'sizzle_low' in dir() else fizz(0.8), -16)
put(23.6, 'stamp', stamp_hit(0.6, 80), -10)
