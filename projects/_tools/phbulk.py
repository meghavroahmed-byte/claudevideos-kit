import json, sys, subprocess, concurrent.futures as cf
r=json.load(open('ph_sizes.json'))
names=[n for n,x in r.items() if 0<x<25e6 or n in ('island_tree_01','island_tree_02','island_tree_03','fir_sapling_medium')]
G='/home/user/claudevideos-kit/projects/_kit/getph.py'
chunks=[names[i::12] for i in range(12)]
def run(c): return subprocess.run(['python3',G,*c],capture_output=True,text=True).stdout
with cf.ThreadPoolExecutor(12) as ex:
    for out in ex.map(run, chunks): print(out.count('ok '), 'ok', [l for l in out.splitlines() if l.startswith('FAIL')])
