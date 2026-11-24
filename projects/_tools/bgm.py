# bgm.py <proj> <dur> : writes projects/<proj>/audio/bgm.wav - a soft, looping, mood-matched instrumental bed (unique per video)
import sys, os, zlib, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 44100
P, DUR = sys.argv[1], float(sys.argv[2])
MOOD = {  # style per video
 'no-sleep':'night','space-suit':'space','volcano':'tension','lightning':'tension','quicksand':'adventure','tsunami':'tension','lost-at-sea':'ocean',
 'swallow-gum':'playful','tickle':'playful','no-water':'desert','pyramid-worker':'ancient','knight-toilet':'medieval','ancient-teeth':'ancient','gladiator':'epic',
 'hippo':'safari','giant-mosquito':'playful','chameleon':'jungle','doppelganger':'mystery','elevator-fall':'tension','coldest-place':'ice','bee-sting':'playful',
 'hiccups':'playful','sneeze':'playful','goosebumps':'mystery','yawn':'night','brain-freeze':'playful','knuckle-crack':'lofi','deep-ocean':'ocean','black-hole':'space',
 'moon-jump':'space','shark':'tension','bear':'adventure','avalanche':'tension','desert-lost':'desert','plane-door':'lofi','ice-lake':'ice','caffeine':'lofi','sugar':'playful',
 'phone-sleep':'night','hair-growth':'lofi','fingernails':'lofi','ears-pop':'lofi','eye-blink':'lofi','heart-beats':'adventure','castle-siege':'epic','viking-ship':'epic',
 'samurai-armor':'asian','mummy':'ancient','caveman-fire':'tribal','medieval-doctor':'medieval','ant-strength':'playful','octopus':'ocean','elephant-memory':'safari',
 'cheetah':'adventure','everest':'ice','earthquake':'tension','tornado':'tension','sun-stare':'mystery','giant-rat':'tension','duck-float':'playful','baby-memory':'mystery'}[P]
ST = { # bpm range, scale, wave, pad, drums
 'night':(70,'minor',1,1,0),'space':(64,'lydian',3,1,0),'tension':(92,'phrygian',2,1,2),'adventure':(108,'major',2,0,1),'ocean':(68,'dorian',1,1,0),'playful':(116,'major',0,0,1),
 'desert':(84,'hijaz',2,1,3),'ancient':(88,'hijaz',2,1,3),'medieval':(96,'dorian',2,0,3),'epic':(96,'minor',2,1,2),'safari':(104,'mixolydian',0,0,3),'jungle':(100,'pent',0,0,3),
 'mystery':(76,'minor',3,1,0),'ice':(66,'lydian',3,1,0),'lofi':(82,'major7',1,1,4),'asian':(80,'pent',2,1,0),'tribal':(98,'pent',2,0,3)}[MOOD]
SC = {'major':[0,2,4,5,7,9,11],'minor':[0,2,3,5,7,8,10],'dorian':[0,2,3,5,7,9,10],'phrygian':[0,1,3,5,7,8,10],'lydian':[0,2,4,6,7,9,11],'mixolydian':[0,2,4,5,7,9,10],
      'hijaz':[0,1,4,5,7,8,10],'pent':[0,2,4,7,9,12,14],'major7':[0,2,4,5,7,9,11]}[ST[1]]
seed = zlib.crc32(P.encode()); r = np.random.default_rng(seed)
bpm = ST[0] + int(r.integers(-6, 7)); beat = 60 / bpm; root = 45 + int(r.integers(0, 10))  # MIDI A2..F#3
f = lambda m: 440 * 2 ** ((m - 69) / 12)
n = int((DUR + 1) * SR); t = np.arange(n) / SR; out = np.zeros(n)
def env(L, a, d): e = np.ones(L); A = max(1, int(a * SR)); D = max(1, int(d * SR)); e[:A] = np.linspace(0, 1, A); e[-D:] *= np.linspace(1, 0, D); return e
def tone(fr, L, kind):
    tt = np.arange(L) / SR
    if kind == 0: return (np.sin(2*np.pi*fr*tt) + 0.25*np.sin(2*np.pi*fr*3.9*tt)*np.exp(-tt*20)) * np.exp(-tt*6)          # marimba
    if kind == 1: return (np.sin(2*np.pi*fr*tt) + 0.3*np.sin(2*np.pi*fr*2*tt) + 0.1*np.sin(2*np.pi*fr*3*tt)) * np.exp(-tt*2.2)  # e-piano
    if kind == 2: x = sum(np.sin(2*np.pi*fr*k*tt)/k for k in range(1,7)); return x * np.exp(-tt*5)                         # pluck
    return np.sin(2*np.pi*fr*tt + 0.6*np.sin(2*np.pi*fr*2.01*tt)) * np.exp(-tt*1.4)                                        # bell/glass
def add(at, x, g):
    s = int(at * SR); m = min(len(x), n - s)
    if m > 0: out[s:s+m] += x[:m] * g
deg = lambda d, o=0: root + SC[d % len(SC)] + 12 * (d // len(SC)) + 12 * o
prog = [[0,3,4,3],[0,5,3,4],[0,4,5,3],[0,6,5,4],[0,2,3,4]][int(r.integers(0,5))]
bar = 4 * beat; nb = int(DUR / bar) + 2
motif = [int(x) for x in r.integers(0, 7, 8)]; rhythm = r.random(8) < 0.6
for b in range(nb):
    c = prog[b % 4]; t0 = b * bar
    # pad chord
    if ST[3]:
        L = int(bar * SR) + int(0.4 * SR); tt = np.arange(L) / SR
        for d in (c, c + 2, c + 4):
            fr = f(deg(d)); x = sum(np.sin(2*np.pi*fr*(1 + dt)*tt) for dt in (-0.003, 0, 0.003)) / 3
            add(t0, x * env(L, 0.6, 0.6), 0.10)
    # bass
    for k in range(2):
        L = int(beat * 1.8 * SR); add(t0 + k * 2 * beat, tone(f(deg(c, -1)), L, 1) * env(L, 0.01, 0.2), 0.22)
    # melody / arp
    for k in range(8):
        if not rhythm[k] and b % 2 == 0: continue
        d = c + [0,2,4,7][motif[k] % 4] if b % 4 != 3 else c + motif[k]
        L = int(beat * 1.2 * SR); add(t0 + k * beat / 2, tone(f(deg(d, 1)), L, ST[2]) * env(L, 0.005, 0.15), 0.12)
    # drums
    dk = ST[4]
    for k in range(4 if dk else 0):
        at = t0 + k * beat; L = int(0.25 * SR); tt = np.arange(L) / SR
        if dk in (1, 2, 4) and k % 2 == 0: add(at, np.sin(2*np.pi*55*tt*(1+np.exp(-tt*30)))*np.exp(-tt*14), 0.35 if dk != 4 else 0.25)
        if dk == 3: add(at, np.sin(2*np.pi*(120 if k % 2 else 90)*tt)*np.exp(-tt*16), 0.3)
        if dk == 2 and k % 2 == 1: add(at, np.sin(2*np.pi*70*tt)*np.exp(-tt*10), 0.25)
        if dk in (1, 4): hl = int(0.05 * SR); hh = np.random.default_rng(b*4+k).standard_normal(hl) * np.exp(-np.arange(hl)/SR*80); add(at + beat/2, hh, 0.05)
out = sosfilt(butter(2, 6000, 'low', fs=SR, output='sos'), out)
out = out[:int(DUR * SR)]; out *= env(len(out), 1.2, 1.5)
out = out / (np.sqrt(np.mean(out**2)) + 1e-9) * 0.05   # fixed RMS -> very soft after mix gain
out = np.clip(out, -0.9, 0.9)
wavfile.write(f'/home/user/claudevideos-kit/projects/{P}/audio/bgm.wav', SR, (out * 32767).astype(np.int16))
print(P, MOOD, bpm, 'bpm root', root)
