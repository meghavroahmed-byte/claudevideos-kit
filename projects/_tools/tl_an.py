def antsteps(d=5.6, rate=14, seed=2):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        s = int((k / rate + r.uniform(0, 0.01)) * SR); u = t_(0.015); b = np.sin(2 * np.pi * r.uniform(3500, 5000) * u) * np.exp(-u * 300); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.2)

def heave2(d=1.4):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(90 + 60 * tt / d) / SR) * env(len(tt), 0.2, 0.3) * 0.6 + lp(noise(d), 300, 2) * 0.3 * env(len(tt), 0.2, 0.3), 0.5)

def metalgroan(d=1.2, f=70):
    tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f * (1 + 0.3 * np.sin(2 * np.pi * 3 * tt))) / SR) * env(len(tt), 0.1, 0.5) + bp(noise(d), 300, 1200) * 0.3 * env(len(tt), 0.1, 0.5), 0.6)

# ---- timeline
put(0.0, 'antsteps', antsteps(5.8), -16)
put(3.8, 'count', clockrun(1.4, 20), -16)
put(7.4, 'crouch', strain(0.6, 75), -13)
put(8.0, 'heave', heave2(1.4), -11)
put(8.6, 'carcreak', metalgroan(1.2, 80), -13)
put(9.4, 'ding', ding(1.2), -14)
put(11.4, 'setdown', thunk(0.35), -11)
put(15.6, 'appear', shimmer(0.8), -15)
put(16.4, 'grow', riser(4.2), -15)
put(17.4, 'bars', popup(480, 0.18), -14)
put(19.0, 'strain', metalgroan(2.8, 60), -14)
put(21.95, 'crunch', crunch(0.4), -7)
put(22.0, 'thud', kaboom(1.4), -9)
