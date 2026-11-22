import sys,wave,json,re
from pocketsphinx import Decoder
raw=open(sys.argv[2]).read().split()
d=Decoder(samprate=16000)
words=[]
for t in raw:
    for p in re.sub(r"[^\w'\-]","",t).lower().split('-'): words.append(p)
missing=[w for w in words if not d.lookup_word(w)]
print('missing',missing)
d.set_align_text(' '.join(words))
w=wave.open(sys.argv[1],'rb');d.start_utt();d.process_raw(w.readframes(w.getnframes()),full_utt=True);d.end_utt()
segs=[s for s in d.seg() if s.word not in('<s>','</s>','<sil>','(NULL)')]
print(len(segs),len(words))
fr=0.01
out=[];i=0
for t in raw:
    n=len(re.sub(r"[^\w'\-]","",t).split('-'))
    g=segs[i:i+n];i+=n
    out.append({'w':t,'s':round(g[0].start_frame*fr,2),'e':round((g[-1].end_frame+1)*fr,2)})
json.dump(out,open(sys.argv[3],'w'))
for o in out: print(o['s'],o['e'],o['w'])
