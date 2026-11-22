#!/bin/bash
# remix.sh proj : re-mix audio of an existing <proj>.mp4 with the louder master (video copied)
P=$1; cd /home/user/claudevideos-kit/projects/$P || exit 1
ffmpeg -v error -y -i $P.mp4 -i audio/vo.wav -i audio/sfx_bed.wav -i audio/bgm.wav -filter_complex "[1:a]asplit=3[vo][sc][sc2];[2:a]volume=11dB[s0];[s0][sc]sidechaincompress=threshold=0.05:ratio=2:attack=20:release=300:makeup=1[sd];[3:a]volume=-6dB[b0];[b0][sc2]sidechaincompress=threshold=0.03:ratio=3:attack=30:release=500:makeup=1[bd];[vo][sd][bd]amix=inputs=3:duration=first:normalize=0,apad,volume=7.5dB,alimiter=limit=0.8:attack=3:release=60:level=disabled[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest loud.mp4 && mv loud.mp4 $P.mp4 && echo LOUD $P
