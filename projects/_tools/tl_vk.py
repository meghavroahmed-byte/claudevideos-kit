def oarstroke(d=0.5):
    tt = t_(d); return norm(lp(noise(d), 700, 2) * np.sin(np.pi * tt / d) ** 2 * 0.7 + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 12) * 0.3, 0.45)

def drum(d=0.3, f=70):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt * (1 + 0.5 * np.exp(-tt * 30))) * np.exp(-tt * 14), 0.8)

def wavecrash(d=1.2):
    tt = t_(d); return norm(lp(noise(d), 900, 2) * env(len(tt), 0.08, 0.8), 0.5)

# ---- timeline
for n in range(9):
    put(0.0 + n * 2.62 / 2.4 * 2 / 2, f'oar{n % 3}', oarstroke(0.5), -15)
for n in range(8): put(6.0 + n * 0.655, f'drum{n % 2}', drum(0.3, 70 if n % 2 else 62), -13)
put(2.9, 'no1', bonk(0.4), -14)
put(3.8, 'no2', bonk(0.4), -14)
put(4.7, 'no3', bonk(0.4), -14)
put(8.4, 'night', powerdown(0.9), -15)
put(9.6, 'rain', rainfall(2.6, 90), -14)
put(10.8, 'wave', wavecrash(1.2), -12)
put(12.6, 'chew', chewing(1.4, 6), -13)
put(15.85, 'breadcrack', crunch(0.4), -9)
put(17.7, 'bucket', clunk(0.5), -12)
put(19.4, 'splash', splash(1.0), -11)
put(20.9, 'map', popup(480, 0.18), -14)
put(21.0, 'sail', whoosh(1.4), -15)
put(23.6, 'horn', horn(1.6, 110), -13)
