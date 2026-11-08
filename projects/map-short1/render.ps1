# map-short1 full render: 3 parts in parallel, concat, SFX mix, mux, phone preview.
$ErrorActionPreference = 'Continue'
$k = "D:\ClaudeVideos\projects\map-short1\kit"; $o = "D:\ClaudeVideos\projects\map-short1\out"; New-Item -ItemType Directory -Force $o | Out-Null
$NF = [int][math]::Round(69.97 * 30); $parts = 3; $per = [math]::Ceiling($NF / $parts)
$run = @(); Push-Location $k
for ($i = 0; $i -lt $parts; $i++) { $s = $i * $per; $n = [math]::Min($per, $NF - $s); if (Test-Path "$o\p$i.mp4.json") { "skip $i"; continue }
  $run += Start-Process node -ArgumentList "run.js", "video", "map3d.html", "$o\p$i.mp4", $n, 30, $s -NoNewWindow -PassThru -RedirectStandardOutput "$o\p$i.log" -RedirectStandardError "$o\p$i.err"; Start-Sleep 3 }
$run | Wait-Process; Pop-Location; "render done $(Get-Date -Format HH:mm)"
(0..($parts - 1) | % { "file 'p$_.mp4'" }) -join "`n" | Out-File -Encoding ascii "$o\concat.txt"
Push-Location $o; ffmpeg -v error -y -f concat -safe 0 -i concat.txt -c copy silent.mp4; Pop-Location
node D:\ClaudeVideos\projects\map-short1\mix.js (0..($parts - 1) | % { "$o\p$_.mp4.json" })
$t = "D:\ClaudeVideos\projects\map-short1\temp"; $sf = "D:\ClaudeVideos\projects\map-short1\sfx"
ffmpeg -v error -y -i "$t\vo_orig.wav" -i "$t\sfx_track.wav" -i "$sf\sfx_map1_bed.wav" -filter_complex "[0:a]volume=6dB,aresample=48000,aformat=channel_layouts=stereo[v];[1:a]volume=0.5[s];[2:a]volume=0.2[b];[v][s][b]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.98:attack=1:release=30:level=false[a]" -map "[a]" -ar 48000 "$t\mix.wav"
$final = "D:\ClaudeVideos\renders\Chile Keno Eto Lomba (map short v2 3D).mp4"
ffmpeg -v error -y -i "$o\silent.mp4" -i "$t\mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$final"
cmd /c "ffmpeg -hide_banner -i `"$final`" -af ebur128=peak=true -f null - 2>&1" | Select-String "^\s+(I|Peak):" | Select-Object -Last 2
ffprobe -v error -show_entries format=duration -of csv=p=0 "$final"
ffmpeg -v error -y -i "$final" -vf "scale=720:1280" -c:v libx264 -preset medium -b:v 2200k -maxrate 3000k -bufsize 4000k -c:a aac -b:a 96k -movflags +faststart "D:\ClaudeVideos\renders\chile_map_short_v2_phone.mp4"
Get-Item "$final", "D:\ClaudeVideos\renders\chile_map_short_v2_phone.mp4" | Select Name, Length
"all done $(Get-Date -Format HH:mm)"
