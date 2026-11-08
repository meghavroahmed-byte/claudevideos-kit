# Full render: 6 parts, 3 at a time, then concat + mix + mux.
$ErrorActionPreference = 'Continue'
$k = "D:\ClaudeVideos\projects\vo-asif\kit"; $o = "D:\ClaudeVideos\projects\vo-asif\out"; New-Item -ItemType Directory -Force $o | Out-Null
$NF = 34229; $parts = 6; $per = [math]::Ceiling($NF / $parts)
$queue = 0..($parts - 1) | % { $s = $_ * $per; $n = [math]::Min($per, $NF - $s); @{ i = $_; s = $s; n = $n } }
$running = @()
Push-Location $k
foreach ($q in $queue) {
  if ((Test-Path "$o\p$($q.i).mp4.json")) { "skip part $($q.i)"; continue }
  while (($running | ? { -not $_.HasExited }).Count -ge 3) { Start-Sleep 20 }
  "start part $($q.i) frames $($q.s)+$($q.n) at $(Get-Date -Format HH:mm)"
  $running += Start-Process node -ArgumentList "run.js", "video", "hum.html", "$o\p$($q.i).mp4", $q.n, 30, $q.s -NoNewWindow -PassThru -RedirectStandardOutput "$o\p$($q.i).log" -RedirectStandardError "$o\p$($q.i).err"
  Start-Sleep 5
}
$running | Wait-Process
Pop-Location
"render done $(Get-Date -Format HH:mm)"
(0..($parts - 1) | % { "file 'p$_.mp4'" }) -join "`n" | Out-File -Encoding ascii "$o\concat.txt"
Push-Location $o; ffmpeg -v error -y -f concat -safe 0 -i concat.txt -c copy silent.mp4; Pop-Location
$js = 0..($parts - 1) | % { "$o\p$_.mp4.json" }
node D:\ClaudeVideos\projects\vo-asif\mix.js @js
$t = "D:\ClaudeVideos\projects\vo-asif\temp"; $sf = "D:\ClaudeVideos\projects\vo-asif\sfx"
ffmpeg -v error -y -i "$t\vo_orig.wav" -i "$t\sfx_track.wav" -i "$sf\sfx_vo-asif_bed.wav" -filter_complex "[0:a]highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-14.5:TP=-2:LRA=9,aresample=48000,aformat=channel_layouts=stereo[v];[1:a]volume=0.9[s];[2:a]volume=0.9[b];[v][s][b]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.85:level=false[a]" -map "[a]" -ar 48000 "$t\mix.wav"
$final = "D:\ClaudeVideos\renders\Haray Jawa Manush Projati (vo-asif v2).mp4"
ffmpeg -v error -y -i "$o\silent.mp4" -i "$t\mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$final"
cmd /c "ffmpeg -hide_banner -i `"$final`" -af ebur128=peak=true -f null - 2>&1" | Select-String "^\s+(I|Peak):" | Select-Object -Last 2
ffprobe -v error -show_entries format=duration -of csv=p=0 "$final"
ffmpeg -v error -y -i "$final" -vf "scale=960:540" -c:v libx264 -preset medium -b:v 120k -maxrate 180k -bufsize 400k -c:a aac -b:a 48k -ac 1 -movflags +faststart "D:\ClaudeVideos\renders\vo-asif_v2_phone.mp4"
Get-Item "$final", "D:\ClaudeVideos\renders\vo-asif_v2_phone.mp4" | Select Name, Length
"all done $(Get-Date -Format HH:mm)"
