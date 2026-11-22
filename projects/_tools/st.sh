#!/bin/bash
# usage: st.sh name t1,t2,...  (10 times -> 2x5 grid)
S=/tmp/claude-0/-home-user-claudevideos-kit/cba16358-b567-5e19-aa9b-520cf3bfb949/scratchpad/st_${P:-ancient-days}_$1
rm -rf $S; cd /home/user/claudevideos-kit/projects/${P:-ancient-days}
GL=swiftshader timeout 900 node render.mjs stills $2 $S 2>&1 | grep -v "^still" | head -20
cd $S; n=$(ls t_*.png | wc -l)
args=""; f=""; i=0; for x in $(ls t_*.png | sort -t_ -k2 -n); do args="$args -i $x"; f="$f[$i]scale=216:384,drawtext=text='${x:2:-4}':x=6:y=6:fontsize=16:fontcolor=yellow[s$i];"; i=$((i+1)); done
h=$(( (n+1)/2 )); r1=""; r2=""; for j in $(seq 0 $((h-1))); do r1="$r1[s$j]"; done; for j in $(seq $h $((n-1))); do r2="$r2[s$j]"; done
if [ $n -le 2 ]; then ffmpeg -v error -y $args -filter_complex "${f}[s0][s1]hstack=2" grid.png && echo $S/grid.png; exit 0; fi; if [ $((n-h)) -lt $h ]; then f="$f color=black:216x384:d=1[pad];"; r2="$r2[pad]"; fi
ffmpeg -v error -y $args -filter_complex "$f${r1}hstack=$h[a];${r2}hstack=$h[b];[a][b]vstack" grid.png && echo $S/grid.png
