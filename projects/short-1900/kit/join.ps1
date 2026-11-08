# Join the 3 render parts, mix voice + SFX + tense drone bed, mux into the final short.
$ErrorActionPreference = 'Stop'
$o = "D:\ClaudeVideos\projects\short-1900\out"
$tmp = "D:\ClaudeVideos\projects\short-1900\temp"
"file 'p_A.mp4'`nfile 'p_B.mp4'`nfile 'p_C.mp4'" | Out-File -Encoding ascii "$o\concat.txt"
Push-Location $o
ffmpeg -loglevel error -y -f concat -safe 0 -i concat.txt -c copy p_silent.mp4
Pop-Location
$cuts = @(); $pops = @(); $booms = @()
foreach ($p in 'A', 'B', 'C') { $j = Get-Content "$o\p_$p.mp4.json" -Raw | ConvertFrom-Json; $cuts += $j.cuts; $pops += $j.pops; $booms += $j.booms }
$cuts = $cuts | Sort-Object -Unique; $pops = $pops | Sort-Object -Unique; $booms = @($booms | Sort-Object -Unique)
$pp = @(); $last = -9; foreach ($x in $pops) { if ($x - $last -gt 0.25) { $pp += $x; $last = $x } }; $pops = $pp
"cuts=$($cuts.Count) pops=$($pops.Count) booms=$($booms.Count)"
$dur = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp\cut.mov")
ffmpeg -loglevel error -y -i "$tmp\cut.mov" -vn -ac 1 -ar 48000 "$tmp\voice.wav"
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.8:r=48000" -af "highpass=f=300,lowpass=f=5000,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.35,volume=0.28" "$tmp\whoosh.wav"
ffmpeg -loglevel error -y -f lavfi -i "sine=f=660:d=0.12:r=48000" -f lavfi -i "sine=f=990:d=0.12:r=48000" -filter_complex "[0][1]amix=2,afade=t=out:st=0.02:d=0.1,volume=0.3" "$tmp\pop.wav"
# deep boom: low sine sweep + filtered noise rumble
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=0.9*sin(2*PI*(38+50*exp(-4*t))*t)*exp(-1.1*t):d=3.5:s=48000" -f lavfi -i "anoisesrc=d=3.5:c=brown:a=0.9:r=48000" -filter_complex "[1]lowpass=f=260,afade=t=out:st=0.2:d=3.2[n];[0][n]amix=2:normalize=0,volume=1.6,alimiter=limit=0.95" "$tmp\boom.wav"
# tense drone bed: two low sines with slow tremolo + soft brown noise
$fo = [math]::Round($dur - 1.5, 2)
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc=(0.5*sin(2*PI*55*t)+0.35*sin(2*PI*82.41*t)+0.2*sin(2*PI*110.3*t))*(0.75+0.25*sin(2*PI*0.18*t)):d=$([math]::Ceiling($dur)+1):s=48000" -f lavfi -i "anoisesrc=d=$([math]::Ceiling($dur)+1):c=brown:a=0.5:r=48000" -filter_complex "[1]lowpass=f=500,volume=0.5[n];[0][n]amix=2:normalize=0,lowpass=f=900,volume=0.05,afade=t=in:d=1.5,afade=t=out:st=$($fo):d=1.5" "$tmp\bed.wav"
$fc = "[0:a]loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[v];"
$fc += "[1:a]asplit=$($cuts.Count)" + ((0..($cuts.Count - 1) | % { "[w$_]" }) -join '') + ";"
$fc += "[2:a]asplit=$($pops.Count)" + ((0..($pops.Count - 1) | % { "[p$_]" }) -join '') + ";"
$fc += "[4:a]asplit=$($booms.Count)" + ((0..($booms.Count - 1) | % { "[b$_]" }) -join '') + ";"
$lbl = @()
for ($i = 0; $i -lt $cuts.Count; $i++) { $ms = [int]([math]::Max([double]0, [double]$cuts[$i] - 0.2) * 1000); $fc += "[w$i]adelay=$ms[wd$i];"; $lbl += "[wd$i]" }
for ($i = 0; $i -lt $pops.Count; $i++) { $ms = [int]([double]$pops[$i] * 1000); $fc += "[p$i]adelay=$ms[pd$i];"; $lbl += "[pd$i]" }
for ($i = 0; $i -lt $booms.Count; $i++) { $ms = [int]([double]$booms[$i] * 1000); $fc += "[b$i]adelay=$ms[bd$i];"; $lbl += "[bd$i]" }
$fc += ($lbl -join '') + "amix=inputs=$($lbl.Count):normalize=0[sfx];"
$fc += "[v][sfx][3:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.85:level=false[a]"
ffmpeg -loglevel error -y -i "$tmp\voice.wav" -i "$tmp\whoosh.wav" -i "$tmp\pop.wav" -i "$tmp\bed.wav" -i "$tmp\boom.wav" -filter_complex $fc -map "[a]" -ar 48000 "$tmp\mix.wav"
ffmpeg -loglevel error -y -i "$o\p_silent.mp4" -i "$tmp\mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$o\short_1900.mp4"
$ErrorActionPreference = 'Continue'; cmd /c "ffmpeg -hide_banner -i `"$o\short_1900.mp4`" -af ebur128=peak=true -f null - 2>&1" | Select-String "^\s+(I|Peak):" | Select-Object -Last 2
ffprobe -v error -show_entries format=duration -of csv=p=0 "$o\short_1900.mp4"
