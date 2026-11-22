def stoneclack(d=0.2, f=1800):
    tt = t_(d); return norm((np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 1.7 * tt)) * np.exp(-tt * 70) + lp(noise(d), 6000) * np.exp(-tt * 120) * 0.6, 0.7)

def drillrub(d=6.8):
    tt = t_(d); x = bp(noise(d), 300, 1600) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 2.4 * tt))) * (0.6 + 0.4 * tt / d)
    return norm(x * env(len(tt), 0.2, 0.3), 0.4)

def blow_s(d=1.8):
    tt = t_(d); return norm(bp(noise(d), 200, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.1 * tt - 1.5)) ** 2, 0.35)

def ignite(d=2.0):
    tt = t_(d); x = lp(noise(d), 1500, 2) * env(len(tt), 0.05, 1.2) * 0.6 + lp(noise(d), 200, 4) * env(len(tt), 0.02, 0.8)
    return norm(x, 0.8)

# ---- timeline
put(0.0, 'night', crickets(2.0) if 'crickets' in dir() else chime(0.6, 300), -20)
for n, s in enumerate([0.5, 1.2, 1.9, 3.95, 4.35, 7.3, 8.9, 9.3, 9.7]): put(s - 0.01, f'clack{n % 3}', stoneclack(0.2, 1700 + 200 * (n % 3)), -10)
for n, s in enumerate([3.95, 7.3, 9.3]): put(s, f'spark{n}', tinkle(0.6, n + 2), -16)
put(5.3, 'label1', popup(520, 0.15), -15)
put(7.0, 'label2', popup(420, 0.15), -15)
put(11.0, 'drill', drillrub(6.8), -12)
put(15.5, 'smoke', whoosh(0.8, False), -17)
put(16.9, 'ember', crackle(1.4, 16), -14)
put(18.4, 'drop', rustle(0.6, 2), -14)
put(20.2, 'blow', blow_s(1.8), -12)
put(22.15, 'ignite', ignite(2.0), -8)
put(22.3, 'crackle', crackle(1.6, 30), -12)
put(22.5, 'cheer', cheer(1.4), -14)
