# contact sheet of stills: .\sheet.ps1 "0.5,3,5.5" out.jpg [cols]
param([string]$times, [string]$out, [int]$cols = 4)
$ff = 'C:\Users\avroa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'
$tmp = 'D:\ClaudeVideos\projects\map-mix-1\temp\sheet'; if (Test-Path $tmp) { Remove-Item 'D:\ClaudeVideos\projects\map-mix-1\temp\sheet' -Recurse -Force }; New-Item -ItemType Directory $tmp | Out-Null
$i = 0; foreach ($t in $times.Split(',')) { Copy-Item "D:\ClaudeVideos\projects\map-mix-1\temp\s_$t.jpg" ("$tmp\{0:D3}.jpg" -f $i); $i++ }
$rows = [math]::Ceiling($i / $cols)
& $ff -v error -y -i "$tmp\%03d.jpg" -vf "scale=640:-1,drawtext=text='%{n}':x=10:y=10:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.5,tile=${cols}x${rows}:padding=4" -frames:v 1 $out
