#!/usr/bin/env bash
# mix.sh: voice (UNFILTERED, never processed) + SFX under it -> final mp4 + phone preview (<30 MB).
# Usage: bash mix.sh parts/video.mp4 voice.wav sfx.wav out_basename [sfx_gain=0.32]
set -euo pipefail
VID=$1; VO=$2; SFX=$3; OUT=$4; G=${5:-0.32}
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VO")
# mono voice -> copy to both channels at full level (aformat's default upmix drops it by 3 dB)
CH=$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 "$VO")
UP=$([ "$CH" = 1 ] && echo "pan=stereo|c0=c0|c1=c0" || echo "aformat=channel_layouts=stereo")
ffmpeg -v error -y -i "$VID" -i "$VO" -i "$SFX" -filter_complex \
  "[2:a]volume=$G[s];[1:a]$UP[v];[v][s]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t "$DUR" "$OUT.mp4"
ffmpeg -v error -y -i "$OUT.mp4" -vf scale=720:-2 -c:v libx264 -crf 25 -preset medium -c:a aac -b:a 128k "$OUT-preview.mp4"
ls -la "$OUT.mp4" "$OUT-preview.mp4"
