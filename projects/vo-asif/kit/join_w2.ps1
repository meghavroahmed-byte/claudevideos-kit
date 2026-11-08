# Join the three winter-video parts, merge SFX meta, mix with voice, set loudness
$ErrorActionPreference = 'Stop'
"file 'w2_A.mp4'`nfile 'w2_B.mp4'`nfile 'w2_C.mp4'" | Set-Content out/concat_w2.txt -Encoding ascii
ffmpeg -loglevel error -y -f concat -safe 0 -i out/concat_w2.txt -c copy -movflags +faststart out/w2_silent.mp4
$parts = 'A', 'B', 'C' | ForEach-Object { Get-Content "out/w2_$_.mp4.json" -Raw | ConvertFrom-Json }
$pops = @($parts | ForEach-Object { $_.pops } | Sort-Object -Unique)
@{ cuts = $parts[0].cuts; pops = $pops } | ConvertTo-Json -Compress | Set-Content out/w2_silent.mp4.json -Encoding ascii
powershell -ExecutionPolicy Bypass -File mix_long.ps1 -video out/w2_silent.mp4 -voice vo_w.wav -out out/w2_mix.mp4 -dur 1052
ffmpeg -loglevel error -y -i out/w2_mix.mp4 -c:v copy -af "volume=1.6dB,alimiter=limit=0.82:level=false" -c:a aac -b:a 192k -movflags +faststart out/w2_final.mp4
$r = cmd /c "ffmpeg -hide_banner -i out/w2_final.mp4 -af ebur128=peak=true -f null - 2>&1"
($r | Select-String "^\s+I:") | Select-Object -Last 1
($r | Select-String "^\s+Peak:") | Select-Object -Last 1
ffprobe -v error -show_entries format=duration,size -of csv=p=0 out/w2_final.mp4

