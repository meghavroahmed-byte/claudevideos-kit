# Mix long voiceover + SFX (from render meta json) and mux with silent video
param([string]$video = "out/long_silent.mp4", [string]$voice = "vo_long.wav", [string]$out = "out/long_final.mp4", [double]$dur = 534)
$ErrorActionPreference = 'Stop'
$meta = Get-Content "$video.json" -Raw | ConvertFrom-Json
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=0.7:c=pink:a=0.8:r=44100" -af "highpass=f=300,lowpass=f=4500,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.4,volume=0.22" out/whoosh_l.wav
ffmpeg -loglevel error -y -f lavfi -i "sine=f=660:d=0.12:r=44100" -f lavfi -i "sine=f=990:d=0.12:r=44100" -filter_complex "[0][1]amix=2,afade=t=out:st=0.02:d=0.1,volume=0.32" out/pop_l.wav
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=d=$($dur + 1):c=brown:a=0.5:r=44100" -af "lowpass=f=500,volume=0.04" out/bed_l.wav
# de-duplicate pops that are too close together
$pops = @(); $last = -10; foreach ($p in ($meta.pops | Sort-Object)) { if ($p - $last -ge 0.25 -and $p -gt 0.3) { $pops += $p; $last = $p } }
$cuts = $meta.cuts
function Build-Track($wav, $times, $lead, $outFile) {
  $fc = "[0:a]asplit=$($times.Count)" + ((0..($times.Count - 1) | ForEach-Object { "[s$_]" }) -join '') + ";"
  $lbl = ""
  for ($i = 0; $i -lt $times.Count; $i++) { $ms = [int][math]::Max(0, ($times[$i] - $lead) * 1000); $fc += "[s$i]adelay=$ms|$ms[d$i];"; $lbl += "[d$i]" }
  $fc += $lbl + "amix=inputs=$($times.Count):normalize=0"
  [IO.File]::WriteAllText("$PWD\out\fc.txt", $fc)
  ffmpeg -loglevel error -y -i $wav -/filter_complex out/fc.txt -t $dur -ar 44100 $outFile
}
Build-Track out/whoosh_l.wav $cuts 0.25 out/trk_whoosh.wav
Build-Track out/pop_l.wav $pops 0.0 out/trk_pop.wav
ffmpeg -loglevel error -y -i $voice -i out/trk_whoosh.wav -i out/trk_pop.wav -i out/bed_l.wav -filter_complex "[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[v];[v][1:a][2:a][3:a]amix=inputs=4:normalize=0:duration=longest,alimiter=limit=0.95[a]" -map "[a]" -t $dur -ar 48000 out/mix_long.wav
ffmpeg -loglevel error -y -i $video -i out/mix_long.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $out
"cuts=$($cuts.Count) pops=$($pops.Count)"

