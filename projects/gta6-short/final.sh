#!/usr/bin/env bash
# final.sh: 3D render + 3 face-cam composites (fade in/out) + RAW voice (plain gain only) + SFX/BGM bed (ducked, ~6 dB under) -> final + phone preview
# Usage: bash final.sh <workdir with comp1..3, cut voice> <out_base>
set -euo pipefail
WD=$1; OUT=$2
VG=${VG:-9.7dB}; SG=${SG:-2.0dB}
F1=0; F2=52.15; F3=82.15
ffmpeg -v error -y -i parts/video.mp4 \
  -framerate 30 -i "$WD/comp1/%03d.png" -framerate 30 -i "$WD/comp2/%03d.png" -framerate 30 -i "$WD/comp3/%03d.png" \
  -i "$WD/voice.wav" -i sfx_gta6.wav -filter_complex "
  [1:v]format=yuva420p,fade=t=out:st=1.92:d=0.12:alpha=1,setpts=PTS+$F1/TB[f1];
  [2:v]format=yuva420p,fade=t=in:st=0:d=0.12:alpha=1,fade=t=out:st=1.95:d=0.12:alpha=1,setpts=PTS+$F2/TB[f2];
  [3:v]format=yuva420p,fade=t=in:st=0:d=0.12:alpha=1,setpts=PTS+$F3/TB[f3];
  [0:v][f1]overlay=eof_action=pass[v1];[v1][f2]overlay=eof_action=pass[v2];[v2][f3]overlay=eof_action=pass,format=yuv420p[v];
  [4:a]volume=$VG,aformat=channel_layouts=stereo,asplit=2[vo][sc];
  [5:a]volume=$SG[sf];[sf][sc]sidechaincompress=threshold=0.05:ratio=2:attack=20:release=250[sfd];
  [vo][sfd]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.8:level=false[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t 84.25 "$OUT.mp4"
ffmpeg -v error -y -i "$OUT.mp4" -vf scale=720:-2 -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k "$OUT-preview.mp4"
ffmpeg -hide_banner -i "$OUT.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
ls -la "$OUT.mp4" "$OUT-preview.mp4"
