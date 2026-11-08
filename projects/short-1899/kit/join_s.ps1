# Join the 3 render parts, mix voice + SFX + wind bed, mux into the final short.
$ErrorActionPreference = 'Stop'
$o = "D:\ClaudeVideos\projects\short-1899\out"
$tmp = "D:\ClaudeVideos\projects\short-1899\temp"
"file 'p_A.mp4'`nfile 'p_B.mp4'`nfile 'p_C.mp4'" | Out-File -Encoding ascii "$o\concat.txt"
Push-Location $o
ffmpeg -loglevel error -y -f concat -safe 0 -i concat.txt -c copy p_silent.mp4
Pop-Location
# cut and pop times collected from all parts
$cuts = @(); $pops = @()
foreach ($p in 'A', 'B', 'C') { $j = Get-Content "$o\p_$p.mp4.json" -Raw | ConvertFrom-Json; $cuts += $j.cuts; $pops += $j.pops }
$cuts = $cuts | Sort-Object -Unique; $pops = $pops | Sort-Object -Unique
# drop pops too close together
$pp = @(); $last = -9; foreach ($x in $pops) { if ($x - $last -gt 0.25) { $pp += $x; $last = $x } }; $pops = $pp
"cuts=$($cuts.Count) pops=$($pops.Count)"
ffmpeg -loglevel error -y -i "$tmp\cut.mov" -vn -ac 1 -ar 48000 "$tmp\voice.wav"
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.8:r=48000" -af "highpass=f=300,lowpass=f=5000,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.35,volume=0.30" "$tmp\whoosh.wav"
ffmpeg -loglevel error -y -f lavfi -i "sine=f=660:d=0.12:r=48000" -f lavfi -i "sine=f=990:d=0.12:r=48000" -filter_complex "[0][1]amix=2,afade=t=out:st=0.02:d=0.1,volume=0.35" "$tmp\pop.wav"
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=52:c=brown:a=0.5:r=48000" -af "lowpass=f=600,volume=0.06,afade=t=in:d=1.5,afade=t=out:st=49.5:d=1.5" "$tmp\bed.wav"
$fc = "[0:a]loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[v];"
$fc += "[1:a]asplit=$($cuts.Count)" + ((0..($cuts.Count - 1) | % { "[w$_]" }) -join '') + ";"
$fc += "[2:a]asplit=$($pops.Count)" + ((0..($pops.Count - 1) | % { "[p$_]" }) -join '') + ";"
$lbl = @()
for ($i = 0; $i -lt $cuts.Count; $i++) { $ms = [int]([math]::Max(0, $cuts[$i] - 0.2) * 1000); $fc += "[w$i]adelay=$ms[wd$i];"; $lbl += "[wd$i]" }
for ($i = 0; $i -lt $pops.Count; $i++) { $ms = [int]($pops[$i] * 1000); $fc += "[p$i]adelay=$ms[pd$i];"; $lbl += "[pd$i]" }
$fc += ($lbl -join '') + "amix=inputs=$($lbl.Count):normalize=0[sfx];"
$fc += "[v][sfx][3:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.93[a]"
ffmpeg -loglevel error -y -i "$tmp\voice.wav" -i "$tmp\whoosh.wav" -i "$tmp\pop.wav" -i "$tmp\bed.wav" -filter_complex $fc -map "[a]" -ar 48000 "$tmp\mix.wav"
ffmpeg -loglevel error -y -i "$o\p_silent.mp4" -i "$tmp\mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$o\short_v2.mp4"
$ErrorActionPreference = 'Continue'; cmd /c "ffmpeg -hide_banner -i `"$o\short_v2.mp4`" -af ebur128=peak=true -f null - 2>&1" | Select-String "^\s+(I|Peak):" | Select-Object -Last 2 # -af ebur128=peak=true -f null - 2>&1 | Select-String "^\s+(I|Peak):" | Select-Object -Last 2
ffprobe -v error -show_entries format=duration -of csv=p=0 "$o\short_v2.mp4"
