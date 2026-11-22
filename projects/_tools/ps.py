import sys,wave
from pocketsphinx import Decoder
d=Decoder(samprate=16000)
w=wave.open(sys.argv[1],'rb');d.start_utt();d.process_raw(w.readframes(w.getnframes()),full_utt=True);d.end_utt()
print(d.hyp().hypstr if d.hyp() else '')
