#!/bin/bash
# usage: render.sh project duration
P=$1; D=$2; cd /home/user/claudevideos-kit/projects/$P
a=$(python3 -c "print(round($D/3,2))"); b=$(python3 -c "print(round(2*$D/3,2))")
rm -f p1.mp4 p2.mp4 p3.mp4
(GL=swiftshader node render.mjs video p1.mp4 30 0 $a > r1.log 2>&1 & GL=swiftshader node render.mjs video p2.mp4 30 $a $b > r2.log 2>&1 & GL=swiftshader node render.mjs video p3.mp4 30 $b $D > r3.log 2>&1 & wait)
printf "file 'p1.mp4'\nfile 'p2.mp4'\nfile 'p3.mp4'\n" > l.txt; ffmpeg -y -v error -f concat -i l.txt -c copy silent.mp4
ffprobe -v error -show_entries format=duration:stream=nb_frames -of compact silent.mp4
if [ -f audio/bgm.wav ]; then ffmpeg -v error -y -i silent.mp4 -i audio/vo.wav -i audio/sfx_bed.wav -i audio/bgm.wav -filter_complex "[1:a]asplit=3[vo][sc][sc2];[2:a]volume=-2dB[s0];[s0][sc]sidechaincompress=threshold=0.02:ratio=6:attack=10:release=350:makeup=1[sd];[3:a]volume=-6dB[b0];[b0][sc2]sidechaincompress=threshold=0.03:ratio=3:attack=30:release=500:makeup=1[bd];[vo][sd][bd]amix=inputs=3:duration=first:normalize=0,apad,volume=7.5dB,alimiter=limit=0.8:attack=3:release=60:level=disabled[a]" -map 0:v -map "[a]" -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest $P.mp4; else ffmpeg -v error -y -i silent.mp4 -i audio/vo.wav -i audio/sfx_bed.wav -filter_complex "[1:a]asplit=2[vo][sc];[2:a]volume=-2dB[s0];[s0][sc]sidechaincompress=threshold=0.02:ratio=6:attack=10:release=350:makeup=1[sd];[vo][sd]amix=inputs=2:duration=first:normalize=0,apad,alimiter=limit=0.95:level=disabled[a]" -map 0:v -map "[a]" -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest $P.mp4 ; fi && echo MIXED $P
grep -il pageerror r*.log; true
