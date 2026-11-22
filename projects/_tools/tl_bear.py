def bearroar(d=1.4, f=85):
    tt = t_(d); fq = f * (1 + 0.3 * np.sin(np.pi * tt / d)); ph = 2 * np.pi * np.cumsum(fq) / SR
    x = (np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.4 * np.sin(3 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * tt)) + lp(noise(d), 900, 2) * 0.6
    return norm(lp(x, 1600) * env(len(tt), 0.08, 0.5), 0.8)

def sniff(d=0.8):
    out = np.zeros(int(d * SR))
    for k in range(4):
        s = int(k * 0.18 * SR); u = t_(0.1); b = bp(np.random.default_rng(k).standard_normal(len(u)), 500, 1800) * np.sin(np.pi * u / 0.1); out[s:s + len(b)] += b[:len(out) - s]
    return norm(out, 0.4)

def lowhum(d=1.3):
    tt = t_(d); return norm(np.sin(2 * np.pi * 110 * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 4 * tt)) * env(len(tt), 0.1, 0.3), 0.3)

# ---- timeline
put(0.0, 'steps', crunch_steps(1.4, 3.0), -16)
put(1.2, 'grunt', growl(0.9, 70), -12)
put(3.3, 'stamp_run', stamp_hit(0.6, 80), -10)
put(4.6, 'ghostrun', paws(2.4, 10), -14)
put(5.0, 'chase', hooves(2.2, 9), -15)
put(7.9, 'calm', chime(1.0, 659.3), -16)
put(9.0, 'lowvoice', lowhum(1.3), -16)
put(10.4, 'backsteps', crunch_steps(1.8, 1.8), -16)
put(13.4, 'roar', bearroar(1.4, 85), -9)
put(13.7, 'charge', hooves(0.8, 12), -12)
put(14.8, 'flop', flop(0.5), -11)
put(15.0, 'stamp_dead', stamp_hit(0.6, 80), -11)
put(15.7, 'sniff', sniff(0.9), -13)
put(17.2, 'leave', crunch_steps(1.6, 2.4), -16)
put(18.5, 'blackbear', growl(0.8, 75), -13)
put(19.9, 'stamp_fight', stamp_hit(0.6, 80), -10)
put(20.8, 'big', whoosh(0.5), -14)
put(22.25, 'shout_fx', riser(0.6) if 'riser' in dir() else whoosh(0.4), -16)
put(23.4, 'flee', paws(1.4, 14), -14)
