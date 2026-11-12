#!/usr/bin/env bash
# Renders the Blender hero shots one after another (resumable), then encodes a preview mp4 per shot.
cd "$(dirname "$0")"
PY=/home/user/ext/bpyenv/bin/python
for SH in brain wall hippo; do
  echo "$(date +%T) start $SH" >> out/runner.log
  $PY smriti_bl.py -- $SH out/$SH 12 50 >> out/$SH.log 2>&1
  ffmpeg -v error -y -framerate 30 -i out/$SH/%04d.png -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -crf 18 -pix_fmt yuv420p out/$SH.mp4
  echo "$(date +%T) done $SH $(ls out/$SH | wc -l) frames" >> out/runner.log
done
echo "$(date +%T) ALL DONE" >> out/runner.log
