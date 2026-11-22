def lute(d=2.6):
    out = np.zeros(int(d * SR)); notes = [220, 262, 294, 262, 330, 294, 262]
    for i, f in enumerate(notes):
        s = int(i * 0.34 * SR); tt = t_(0.7); x = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * 2 * f * tt) + 0.25 * np.sin(2 * np.pi * 3 * f * tt)) * np.exp(-tt * 6); n = min(len(x), len(out) - s)
        if n > 0: out[s:s + n] += x[:n]
    return norm(out, 0.4)

def drillgrind(d=1.6):
    tt = t_(d); x = bp(noise(d), 800, 3500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 18 * tt))) + np.sin(2 * np.pi * np.cumsum(300 + 80 * np.sin(2 * np.pi * 9 * tt)) / SR) * 0.3
    return norm(x * env(len(tt), 0.1, 0.2), 0.45)

def ominous(d=2.4):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) for f in (55, 58.3, 82.4)) / 3
    return norm(x * env(len(tt), 0.4, 0.8), 0.6)

# ---- timeline
put(0.0, 'lute', lute(2.6), -15)
put(0.2, 'steps', step(0.14, 90), -15)
put(0.8, 'steps2', step(0.14, 95), -15)
put(1.4, 'steps3', step(0.14, 90), -15)
put(3.3, 'fever', heartbeat(0.5, 60), -14)
put(4.6, 'knife', slash(0.22), -12)
put(5.4, 'drip', drip(0.4) if 'drip' in dir() else plink(0.2, 900), -13)
put(6.4, 'drip2', drip(0.4) if 'drip' in dir() else plink(0.2, 900), -14)
for n in range(4): put(9.6 + n * 0.25, f'leech{n}', squelch(0.4, 110 + 15 * n), -13)
put(12.4, 'gasp', gasp(0.5), -11)
put(13.6, 'drill', drillgrind(1.6), -10)
put(14.4, 'bonk', bonk(0.4), -11)
put(16.6, 'mask', ominous(2.6), -11)
put(19.0, 'herbs', rustle(0.6, 5), -14)
put(20.4, 'stink', wobble(1.2), -15)
