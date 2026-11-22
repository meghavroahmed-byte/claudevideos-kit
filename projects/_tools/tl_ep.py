def engine(d=6.0, f=70):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 1.5 * tt) * 0.25 + lp(noise(d), 300, 4) * 0.6
    return norm(x * env(len(tt), 1.2, 1.5), 0.5)

def muffle(d=2.0):
    tt = t_(d); return norm(lp(noise(d), 180, 4) * env(len(tt), 0.5, 0.6), 0.4)

def gulp2(d=0.4, f=110):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-tt * 10))) / SR) * np.exp(-tt * 9), 0.6)

def earpop(d=0.25):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(500 * np.exp(-tt * 14) + 120) / SR) * np.exp(-tt * 18), 0.9)

def clear_ring(d=1.6):
    tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(784, 1), (1175, 0.6), (1568, 0.4)]) * np.exp(-tt * 2.5) * env(len(tt), 0.01, 0.3), 0.4)

# ---- timeline
put(0.0, 'chime', chime(0.9, 880), -16)
put(2.6, 'bubble', popup(520, 0.18), -14)
put(6.0, 'engine', engine(6.5, 72), -14)
put(7.6, 'pressure', fall_tone(1.4) if 'fall_tone' in dir() else powerdown(0.9), -13)
put(12.6, 'bulge', inflate(0.6), -11)
put(12.9, 'muffle', muffle(2.4), -16)
put(15.3, 'tube', shimmer(0.8), -14)
put(18.65, 'swallow', gulp2(0.4, 110), -10)
put(19.4, 'yawn', exhale(1.2), -13)
put(20.6, 'airflow', whoosh(0.8, False), -15)
put(22.28, 'pop', earpop(0.25), -6)
put(24.6, 'clear', clear_ring(1.6), -13)
