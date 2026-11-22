def floaty(d=7.0):
    tt = t_(d); out = np.zeros(len(tt))
    for f, ph in [(392, 0), (494, 1.5), (587, 3.0)]: out += np.sin(2 * np.pi * f * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * tt + ph))
    return norm(lp(out, 1500) * env(len(tt), 1.2, 1.5), 0.3)

def radiobeep(d=0.35):
    tt = t_(d); x = np.sin(2 * np.pi * 1500 * tt) * (tt < 0.12) + np.sin(2 * np.pi * 1100 * tt) * (tt > 0.18) * (tt < 0.3)
    return norm(x * env(len(tt), 0.005, 0.02), 0.35)

# ---- timeline
put(0.2, 'radio', radiobeep(0.35), -15)
put(2.3, 'twin_in', shimmer(0.7), -16)
put(4.3, 'twin_jump', whoosh(0.3), -15)
put(4.98, 'twin_land', thunk(0.3), -14)
put(7.3, 'arrows', popup(420, 0.18), -14)
put(8.4, 'divide', popup(620, 0.18), -13)
put(10.7, 'crouch', strain(0.4, 80), -15)
put(11.0, 'launch', whoosh(0.9), -11)
put(11.3, 'float', floaty(7.0), -14)
for n, a in enumerate([11.25, 11.6, 12.15, 12.9]): put(a, f'mark{n}', tick(0.1, 1300 + 200 * n), -14)
put(13.0, 'hoop', ding(1.0), -14)
put(16.4, 'watch', clockticks(0.9, 8), -16)
put(18.58, 'land', thunk(0.4), -9)
put(18.6, 'dust', rustle(0.6, 2), -14)
for n, (a, b) in enumerate([[19.6, 20.5], [20.75, 21.65], [21.9, 22.8]]):
    put(a, f'hop{n}', boing(0.5, 180 + 30 * n), -12)
    put(b, f'hopland{n}', thunk(0.25), -15)
