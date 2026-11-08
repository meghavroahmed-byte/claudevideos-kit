# join rendered parts + mix voice (original, only loudness-normalised), SFX track and pad bed
$ff = 'C:\Users\avroa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'
$p = 'D:\ClaudeVideos\projects\map-mix-1'; Set-Location "$p\kit"
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
node mixsfx.js
if (-not $env:SKIP_ASSEMBLE) { node assemble.js; if ($LASTEXITCODE -ne 0) { throw 'assemble failed' } }
# voice: two-pass loudnorm to -14 LUFS (no other processing of the voice)
$m = & $ff -hide_banner -i "$p\voice\vo_orig.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | Out-String
$j = [regex]::Match($m, '\{[^{}]*"input_i"[^{}]*\}').Value | ConvertFrom-Json
$ln = "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$($j.input_i):measured_TP=$($j.input_tp):measured_LRA=$($j.input_lra):measured_thresh=$($j.input_thresh):offset=$($j.target_offset):linear=true"
& $ff -v error -y -i "$p\temp\video_only.mp4" -i "$p\voice\vo_orig.wav" -i "$p\temp\sfx_track.wav" -i "$p\sfx\sfx_mapmix1_bed.wav" -filter_complex "[1:a]$ln,aformat=channel_layouts=stereo[v];[2:a]volume=0.42[s];[3:a]volume=0.22,afade=t=in:d=2,afade=t=out:st=505:d=3.5[bd];[v][s][bd]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.85:level=false[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -t 508.56 -movflags +faststart "$p\out\final.mp4"
& $ff -hide_banner -i "$p\out\final.mp4" -af ebur128=peak=true -f null - 2>&1 | Select-String 'I:|Peak:' | Select -Last 2
