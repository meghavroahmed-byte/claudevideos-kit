# Builds SFX and mixes with the normalized voiceover, then muxes with the silent video
param([string]$video = "out/story_silent.mp4", [string]$out = "out/final.mp4")
$ErrorActionPreference = 'Stop'
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=0.7:c=pink:a=0.8:r=44100" -af "highpass=f=300,lowpass=f=4500,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.4,volume=0.35" out/whoosh.wav
ffmpeg -loglevel error -y -f lavfi -i "sine=f=660:d=0.12:r=44100" -f lavfi -i "sine=f=990:d=0.12:r=44100" -filter_complex "[0][1]amix=2,afade=t=out:st=0.02:d=0.1,volume=0.5" out/pop.wav
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=66:c=brown:a=0.5:r=44100" -af "lowpass=f=500,volume=0.05" out/bed.wav

$cuts = @(4.25, 7.0, 9.3, 14.6, 21.0, 24.3, 28.1, 35.4, 41.6, 46.7, 51.7, 54.75, 60.43, 62.2)
$pops = @(1.8, 3.3, 4.3, 5.0, 7.2, 9.55, 10.95, 12.05, 14.75, 16.9, 19.3, 21.4, 24.85, 25.85, 26.75, 28.25, 30.75, 33.1, 35.55, 38.7, 41.7, 42.9, 44.55, 45.5, 48.4, 53.85, 54.15, 55.1, 58.6, 61.0, 62.25, 63.0)
$fc = "[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[v];"
$fc += "[1:a]asplit=$($cuts.Count)" + (($cuts | ForEach-Object -Begin { $i = 0 } -Process { "[w$i]"; $i++ }) -join '') + ";"
$fc += "[2:a]asplit=$($pops.Count)" + (($pops | ForEach-Object -Begin { $i = 0 } -Process { "[p$i]"; $i++ }) -join '') + ";"
$lbl = @()
for ($i = 0; $i -lt $cuts.Count; $i++) { $ms = [int](($cuts[$i] - 0.25) * 1000); $fc += "[w$i]adelay=$ms|$ms[wd$i];"; $lbl += "[wd$i]" }
for ($i = 0; $i -lt $pops.Count; $i++) { $ms = [int]($pops[$i] * 1000); $fc += "[p$i]adelay=$ms|$ms[pd$i];"; $lbl += "[pd$i]" }
$fc += ($lbl -join '') + "amix=inputs=$($lbl.Count):normalize=0[sfx];"
$fc += "[v][sfx][3:a]amix=inputs=3:normalize=0:duration=first,apad=pad_dur=1.2,alimiter=limit=0.95[a]"
ffmpeg -loglevel error -y -i vo.wav -i out/whoosh.wav -i out/pop.wav -i out/bed.wav -filter_complex $fc -map "[a]" -t 65 -ar 48000 out/mix.wav
ffmpeg -loglevel error -y -i $video -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $out
ffmpeg -hide_banner -i $out -af ebur128 -f null - 2>&1 | Select-String "^\s+I:" | Select-Object -Last 1
