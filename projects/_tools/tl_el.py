def trumpet_e(d=1.2, f=420):
    tt = t_(d); fq = f * (1 + 0.25 * np.sin(np.pi * tt / d)) + 15 * np.sin(2 * np.pi * 8 * tt); ph = 2 * np.pi * np.cumsum(fq) / SR
    x = sum(np.sin(m * ph) * a for m, a in [(1, 1), (2, 0.8), (3, 0.6), (4, 0.4), (5, 0.25)]) + bp(noise(d), 800, 3000) * 0.3
    return norm(lp(x, 4000) * env(len(tt), 0.05, 0.4), 0.7)

def stomp(d=0.35):
    tt = t_(d); return norm(np.sin(2 * np.pi * 45 * tt) * np.exp(-tt * 14) + lp(noise(d), 300, 2) * np.exp(-tt * 20) * 0.5, 0.7)

def rumbleE(d=1.4, f=28):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt)) * env(len(tt), 0.2, 0.5), 0.6)

# ---- timeline
for n, a in enumerate([0.2, 0.75, 1.3, 1.85]): put(a, f'stomp{n % 2}', stomp(0.35), -12)
put(2.1, 'trumpet', trumpet_e(1.2, 420), -11)
put(3.8, 'bubble', popup(480, 0.18), -14)
put(4.4, 'grow', inflate(0.6), -12)
for n in range(10): put(7.4 + n * 0.72, f'walk{n % 2}', stomp(0.35), -16)
put(9.2, 'memory', shimmer(1.0), -14)
put(10.8, 'years', clockrun(1.6, 8), -16)
put(12.6, 'water', splash(1.0), -13)
put(14.2, 'drink', glug(0.6), -12)
put(15.0, 'rumble', rumbleE(1.6, 30), -12)
put(17.6, 'happy', trumpet_e(0.9, 520), -12)
put(17.8, 'love', chime(1.0, 1046.5), -14)
