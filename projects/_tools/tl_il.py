def icecrk(d=0.7, seed=4):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(10):
        s = int(r.uniform(0, d - 0.1) * SR); u = t_(0.05); b = np.sin(2 * np.pi * r.uniform(1800, 3800) * u) * np.exp(-u * 70) + lp(r.standard_normal(len(u)), 3000) * np.exp(-u * 120) * 0.4; out[s:s + len(b)] += b[:len(out) - s]
    tt = t_(d); out += np.sin(2 * np.pi * np.cumsum(900 * (1 - 0.6 * tt / d)) / SR) * np.exp(-tt * 6) * 0.25
    return norm(out, 0.7)

def heartfast_s(d=1.8, rate=3.0):
    tt = t_(d); out = np.zeros(len(tt))
    for k in range(int(d * rate)):
        for off, a in [(0, 1), (0.12, 0.6)]:
            s = int((k / rate + off) * SR); u = t_(0.12); b = np.sin(2 * np.pi * 55 * u) * np.exp(-u * 30) * a; out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.7)

def breath_slow(d=2.6):
    tt = t_(d); x = bp(noise(d), 300, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * tt - 1.5)) ** 2
    return norm(x * env(len(tt), 0.2, 0.4), 0.35)

def iceslide(d=1.6):
    tt = t_(d); return norm(bp(noise(d), 1500, 4500) * env(len(tt), 0.15, 0.3) * 0.6, 0.3)

# ---- timeline
put(0.0, 'steps', crunch_steps(1.5, 2.6), -16)
put(0.9, 'crack', icecrk(0.7, 4), -9)
put(1.55, 'plunge', splash(1.0), -8)
put(2.0, 'slosh', slosh(1.4) if 'slosh' in dir() else splash(0.6), -16)
put(5.05, 'gasp', gasp(0.5), -11)
put(5.9, 'heart', heartfast_s(1.8, 3.0), -11)
put(8.5, 'breathe', breath_slow(2.6), -14)
put(9.8, 'timer', clockticks(1.4, 8), -16)
put(11.6, 'arrow', popup(480, 0.18), -14)
put(15.0, 'strong', chime(1.0, 784), -15)
put(16.7, 'armsonice', thunk(0.3), -13)
put(17.9, 'kick', splash(1.0), -15)
put(19.4, 'slideout', iceslide(1.6), -12)
put(21.6, 'roll', iceslide(2.0), -14)
put(21.6, 'rollstamp', stamp_hit(0.6, 80), -11)
put(24.5, 'standup', whoosh(0.4), -15)
put(25.0, 'safe', chime(1.2, 1046.5), -13)
