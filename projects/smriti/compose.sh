#!/usr/bin/env bash
# compose.sh: hybrid cut. three.js render (parts/video.mp4) with Blender hero shots spliced in at their frame ranges,
# hippo shot (bl/out/hippo) dropped: its camera ends up inside the brain; three.js version reads better.
# Blender frames upscaled + soft bloom, UI-only overlay (bl/out/ui_<shot>) on top, then voice + SFX mix.
set -euo pipefail
cd "$(dirname "$0")"
B=bl/out
BLOOM="split[a][b];[b]scale=270:480,gblur=sigma=6,scale=1080:1920[g];[a][g]blend=all_mode=screen:all_opacity=0.35"
shot() { # name -> filter label; Blender frames + bloom + UI overlay
  echo "[$1:v]scale=1080:1920:flags=lanczos,format=rgb24,$BLOOM,format=rgba[$2b];[$2b][$3:v]overlay=format=auto,format=yuv420p,setsar=1[$2]"
}
seg() { echo "[0:v]trim=start_frame=$1:end_frame=$2,setpts=PTS-STARTPTS,setsar=1[$3]"; }
ffmpeg -v error -y -i parts/video.mp4 \
  -framerate 30 -i $B/brain/%04d.png -framerate 30 -i $B/ui_brain/%04d.png \
  -filter_complex "$(seg 0 569 s0);$(shot 1 br 2);$(seg 761 2132 s1);[s0][br][s1]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p parts/hybrid.mp4
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 parts/hybrid.mp4
bash ../neon-tech-short/kit/tools/mix.sh parts/hybrid.mp4 voice.wav sfx_smriti.wav ../../renders/smriti-final
