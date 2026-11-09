#!/usr/bin/env bash
# render.sh: parallel render of a Neon Tech page, then join.
# Usage (from the project folder): bash ../neon-tech-short/kit/tools/render.sh page.html <seconds> [workers=3] [fps=30]
# Writes parts/p*.mp4 and parts/video.mp4 (silent). ~0.7 s/frame per worker on the cloud box (software WebGL).
set -euo pipefail
PAGE=$1; SEC=$2; WK=${3:-3}; FPS=${4:-30}
TOT=$(python3 -c "import math;print(math.ceil($SEC*$FPS))"); PER=$(( (TOT + WK - 1) / WK ))
mkdir -p parts; rm -f parts/p*.mp4 parts/p*.json parts/list.txt
for i in $(seq 0 $((WK-1))); do
  S=$((i*PER)); N=$PER; [ $((S+N)) -gt $TOT ] && N=$((TOT-S))
  node run.js video "$PAGE" parts/p$i.mp4 $N $FPS $S > parts/l$i.txt 2>&1 &
  echo "file 'p$i.mp4'" >> parts/list.txt
done
wait
ffmpeg -v error -y -f concat -safe 0 -i parts/list.txt -c copy parts/video.mp4
echo "done: parts/video.mp4 ($TOT frames)"
