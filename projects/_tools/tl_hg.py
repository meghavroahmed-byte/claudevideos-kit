def combstroke(d=0.35):
    tt = t_(d); return norm(bp(noise(d), 2000, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 70 * tt))) * np.sin(np.pi * tt / d), 0.3)

def snip(d=0.2):
    tt = t_(d); return norm(np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt * 60) + lp(noise(d), 5000) * np.exp(-tt * 90) * 0.5, 0.5)

def divide_s(d=1.6, rate=6):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int(k / rate * SR); u = t_(0.08); b = np.sin(2 * np.pi * (600 + 80 * (k % 4)) * u) * np.exp(-u * 40); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.35)

def growup(d=1.6):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(250 + 450 * tt / d) / SR) * env(len(tt), 0.1, 0.2) * 0.5, 0.4)

# ---- timeline
put(0.2, 'grow', growup(1.2), -14)
for n, a in enumerate([0.3, 0.8, 1.3]): put(a, f'comb{n}', combstroke(0.35), -14)
put(1.8, 'snip', snip(0.2), -11)
put(2.0, 'snip2', snip(0.2), -12)
put(2.1, 'bubble', popup(520, 0.18), -14)
put(4.4, 'pocket', shimmer(0.7), -15)
put(7.9, 'divide', divide_s(1.8, 6), -14)
put(9.8, 'push', growup(1.6), -15)
put(12.6, 'harden', crunch(0.4), -14)
put(16.0, 'ruler', popup(620, 0.18), -14)
put(18.4, 'years', clockrun(2.0, 6), -16)
put(21.1, 'fallout', whoosh(0.5, False), -14)
put(22.2, 'newone', plink(0.2, 1300), -13)
for n, a in enumerate([23.9, 24.5, 25.1, 25.7]): put(a, f'comb2{n}', combstroke(0.35), -15)
put(25.0, 'count', clockrun(1.6, 18), -16)
