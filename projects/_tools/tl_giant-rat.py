def ratsqueak(d=0.35, f=3200):
    tt = t_(d); fq = f * (1 + 0.25 * np.sin(2 * np.pi * 9 * tt)) * (1 + 0.3 * tt / d); ph = 2 * np.pi * np.cumsum(fq) / SR
    return norm((np.sin(ph) + 0.3 * np.sin(2 * ph)) * env(len(tt), 0.02, 0.12), 0.35)

def gnaw(d=1.0, rate=11, f=2600):
    out = np.zeros(int(d * SR)); rng = np.random.default_rng(int(f))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.05); b = bp(rng.standard_normal(len(u)), f * 0.6, f * 1.6) * np.exp(-u * 70); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.5)

def xray_on(d=0.6):
    tt = t_(d); return norm(np.sin(2 * np.pi * (400 + 900 * tt / d) * tt) * env(len(tt), 0.05, 0.3) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * tt)), 0.3)

# ---- timeline
put(0.0, 'alley', city(3.0), -22)
put(0.3, 'gasp', gasp(0.6), -12)
put(0.5, 'squeak1', ratsqueak(0.4, 2400), -10)
put(2.6, 'xray', xray_on(0.6), -12)
put(3.6, 'grow', growtone(1.2), -16)
put(8.4, 'scurry', paws(0.9, 16), -12)
put(9.55, 'wood', crunchwood(0.5), -7)
put(9.7, 'gnaw1', gnaw(0.4, 12, 1800), -12)
put(10.1, 'plastic', gnaw(0.6, 14, 3600), -9)
put(10.95, 'concrete', crack(0.9), -8)
put(11.1, 'grind', gnaw(1.2, 9, 1200), -12)
put(12.8, 'scurry2', paws(1.8, 15, 9), -12)
put(14.9, 'gnaw3', gnaw(0.7, 13, 2400), -11)
put(15.55, 'door', metalcrash(1.0), -6)
put(15.7, 'tear', metalgroan(0.9, 90), -11)
put(17.2, 'fall', whoosh(1.1, False), -11)
put(18.4, 'land', thud(0.4, 90), -8)
put(18.6, 'squeak2', ratsqueak(0.3, 3800), -12)
put(18.9, 'runoff', paws(1.0, 20, 3), -14)
put(20.5, 'ghost', shimmer(1.2), -12)
put(20.7, 'swell', riser(1.2), -15)
put(21.9, 'xray2', xray_on(0.5), -13)
put(22.5, 'crack', crack(0.7), -9)
put(22.6, 'slump', slump(1.0), -9)
put(24.7, 'tummy', lowhum(1.2), -14)
put(25.1, 'shrink', shrinkdown(1.2), -14)
put(26.8, 'weak', ratsqueak(0.6, 1600), -14)
