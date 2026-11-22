def hyawn(d=2.0, f=230):  # human yawn: rising then falling "aaah" with breath
    tt = t_(d); fq = f * (1 + 0.35 * np.sin(np.pi * np.clip(tt / d * 1.3, 0, 1))) * (1 - 0.3 * tt / d)
    ph = 2 * np.pi * np.cumsum(fq) / SR; x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph) + 0.15 * np.sin(4 * ph)
    x = lp(x, 1400) * 0.8 + lp(bp(noise(d), 300, 1200), 1200) * 0.25
    return norm(x * env(len(tt), 0.25, 0.6), 0.6)

def fanwhirr(d=1.4):
    tt = t_(d); x = np.sin(2 * np.pi * 95 * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * tt)) + 0.3 * np.sin(2 * np.pi * 190 * tt)
    return norm(lp(x, 600) * env(len(tt), 0.2, 0.4), 0.4)

# ---- timeline
put(0.0, 'yawn_hook', hyawn(1.8, 240), -12)
put(2.6, 'yawn_big', hyawn(3.6, 210), -11)
put(5.4, 'airgulp', inhale(1.6), -11)
put(7.9, 'bubble', popup(520, 0.18), -13)
put(8.9, 'coolwave', shimmer(1.4), -15)
put(10.6, 'fan', fanwhirr(1.4), -13)
put(14.0, 'seeing', chime(0.8, 1046.5), -16)
put(15.9, 'yawn_friend', hyawn(2.3, 180), -11)
put(18.3, 'copy', shimmer(0.9), -16)
put(19.2, 'yawn_mom', hyawn(1.9, 300), -14)
put(19.9, 'yawn_dad', hyawn(1.9, 150), -14)
put(20.5, 'yawn_kid', hyawn(1.7, 380), -15)
put(21.6, 'phone', click(0.08), -12)
put(24.1, 'yawn_all1', hyawn(2.0, 220), -13)
put(24.2, 'yawn_all2', hyawn(1.9, 170), -15)
put(24.3, 'yawn_all3', hyawn(1.8, 330), -16)
put(24.8, 'stamp', stamp_hit(0.6, 85), -10)
