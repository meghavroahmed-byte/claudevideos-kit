# Join the two rendered halves, merge SFX meta, mix audio with the full voice
$ErrorActionPreference = 'Stop'
"file 'full_A.mp4'`nfile 'full_B.mp4'" | Set-Content out/concat.txt -Encoding ascii
ffmpeg -loglevel error -y -f concat -safe 0 -i out/concat.txt -c copy -movflags +faststart out/full_silent.mp4
$a = Get-Content out/full_A.mp4.json -Raw | ConvertFrom-Json
$b = Get-Content out/full_B.mp4.json -Raw | ConvertFrom-Json
$pops = @($a.pops + $b.pops | Sort-Object -Unique)
@{ cuts = $a.cuts; pops = $pops } | ConvertTo-Json -Compress | Set-Content out/full_silent.mp4.json -Encoding ascii
powershell -ExecutionPolicy Bypass -File mix_long.ps1 -video out/full_silent.mp4 -voice vo_full.wav -out out/full_final.mp4 -dur 1101.5
ffprobe -v error -show_entries format=duration,size -of csv=p=0 out/full_final.mp4
