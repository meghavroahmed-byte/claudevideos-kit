import sys,json
from faster_whisper import WhisperModel
m=WhisperModel("small.en",device="cpu",compute_type="int8")
segs,_=m.transcribe(sys.argv[1],word_timestamps=True,beam_size=5)
W=[]
for s in segs:
    print(f"[{s.start:.2f}-{s.end:.2f}] {s.text}")
    for w in s.words: W.append({"w":w.word.strip(),"s":round(w.start,2),"e":round(w.end,2)})
json.dump(W,open(sys.argv[2],"w"),indent=0)
