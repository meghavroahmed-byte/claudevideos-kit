# Unique SFX palette for vo-asif ("lost humans"): breathy bone-flute wind whooshes, knapped-stone clicks,
# frame-drum hits, cave-echo risers, and an ancient drone bed. All synthesized; nothing reused.
$ErrorActionPreference = 'Continue'
$d = "D:\ClaudeVideos\projects\vo-asif\sfx"; New-Item -ItemType Directory -Force $d | Out-Null
function G($args2) { & ffmpeg -v error -y @args2 }
# --- whooshes: brown/pink noise through moving bandpass, stereo pan sweep
$wh = @(
  @{c = 'brown'; f0 = 300; f1 = 1400; dur = 0.7; q = 1.2 },
  @{c = 'pink'; f0 = 1800; f1 = 500; dur = 0.6; q = 1.6 },
  @{c = 'brown'; f0 = 600; f1 = 2400; dur = 0.55; q = 2.0 },
  @{c = 'pink'; f0 = 900; f1 = 300; dur = 0.8; q = 1.0 })
$i = 1; foreach ($w in $wh) {
  $L = $w.dur; $pn = @("c0=0.9*c0|c1=0.45*c0","c0=0.45*c0|c1=0.9*c0")[$i % 2]
  G @('-f', 'lavfi', '-i', "anoisesrc=d=$($L):c=$($w.c):a=0.9:r=48000", '-af', "volume='sin(PI*t/$L)^2':eval=frame,bandpass=f=$([int](($w.f0+$w.f1)/2)):w=$([int]([math]::Abs($w.f1-$w.f0))),highpass=f=120,pan=stereo|$pn,adelay=0|9,volume=1.1", "$d\sfx_vo-asif_whoosh$i.wav")
  if (-not (Test-Path "$d\sfx_vo-asif_whoosh$i.wav")) { G @('-f', 'lavfi', '-i', "anoisesrc=d=$($L):c=$($w.c):a=0.9:r=48000", '-af', "bandpass=f=$([int](($w.f0+$w.f1)/2)):w=$([int]([math]::Abs($w.f1-$w.f0))),afade=t=in:d=$($L*0.45),afade=t=out:st=$($L*0.45):d=$($L*0.55),aformat=channel_layouts=stereo,volume=0.9", "$d\sfx_vo-asif_whoosh$i.wav") }
  $i++ }
# --- stone clicks (knapping): noise transient + resonant ping
$cl = @(@{p = 1850; p2 = 2900 }, @{p = 1320; p2 = 2150 }, @{p = 2400; p2 = 3600 }, @{p = 980; p2 = 1700 })
$i = 1; foreach ($c in $cl) {
  G @('-f', 'lavfi', '-i', "aevalsrc='0.5*sin(2*PI*$($c.p)*t)*exp(-38*t)+0.3*sin(2*PI*$($c.p2)*t)*exp(-55*t)':d=0.25:s=48000", '-f', 'lavfi', '-i', 'anoisesrc=d=0.25:c=white:a=0.8:r=48000', '-filter_complex', "[1]highpass=f=2500,volume='exp(-90*t)':eval=frame[n];[0][n]amix=2:normalize=0,aformat=channel_layouts=stereo,volume=0.55", "$d\sfx_vo-asif_click$i.wav")
  $i++ }
# --- frame-drum hits with cave echo
$dr = @(@{f0 = 120; f1 = 48; e = 'aecho=0.8:0.5:120|260:0.35|0.2' }, @{f0 = 95; f1 = 40; e = 'aecho=0.8:0.55:180|400:0.4|0.22' }, @{f0 = 140; f1 = 55; e = 'aecho=0.8:0.5:90|210:0.3|0.18' })
$i = 1; foreach ($x in $dr) {
  G @('-f', 'lavfi', '-i', "aevalsrc='0.95*sin(2*PI*($($x.f1)*t+($($x.f0)-$($x.f1))/9*(1-exp(-9*t))))*exp(-3.2*t)':d=2.6:s=48000", '-f', 'lavfi', '-i', 'anoisesrc=d=2.6:c=brown:a=0.9:r=48000', '-filter_complex', "[1]lowpass=f=400,volume='exp(-14*t)':eval=frame[n];[0][n]amix=2:normalize=0,$($x.e),aformat=channel_layouts=stereo,alimiter=limit=0.9,volume=1.2", "$d\sfx_vo-asif_drum$i.wav")
  $i++ }
# --- riser (reversed cave swell) for chapter cards
G @('-f', 'lavfi', '-i', 'anoisesrc=d=1.6:c=pink:a=0.8:r=48000', '-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*(110*t+60*t*t))':d=1.6:s=48000", '-filter_complex', "[0]bandpass=f=900:w=1400[n];[n][1]amix=2:normalize=0,volume='(t/1.6)^2.5':eval=frame,aecho=0.7:0.4:60:0.3,aformat=channel_layouts=stereo,volume=0.9", "$d\sfx_vo-asif_riser.wav")
# --- shimmer (for DNA / discovery reveals): detuned high sines with slow decay
G @('-f', 'lavfi', '-i', "aevalsrc='0.12*(sin(2*PI*1568*t)+sin(2*PI*1975*t)+sin(2*PI*2349*t)+sin(2*PI*1571*t))*exp(-2.2*t)*(1-exp(-40*t))':d=1.8:s=48000", '-af', 'aecho=0.8:0.6:140|300:0.35|0.2,aformat=channel_layouts=stereo', "$d\sfx_vo-asif_shimmer.wav")
# --- drone bed: ancient low pad (A1/E2/A2 with slow beating) + breathy wind, full length
$dur = 1143
G @('-f', 'lavfi', '-i', "aevalsrc='(0.32*sin(2*PI*55*t)+0.22*sin(2*PI*55.4*t)+0.2*sin(2*PI*82.41*t)+0.12*sin(2*PI*110.3*t)+0.06*sin(2*PI*164.8*t))*(0.75+0.25*sin(2*PI*0.07*t))':d=$($dur):s=48000", '-f', 'lavfi', '-i', "anoisesrc=d=$($dur):c=brown:a=0.9:r=48000", '-filter_complex', "[0]lowpass=f=700,volume=0.08[p];[1]bandpass=f=500:w=600,volume='0.025+0.02*sin(2*PI*0.05*t)':eval=frame[w];[p][w]amix=2:normalize=0,aformat=channel_layouts=stereo,afade=t=in:d=3,afade=t=out:st=$($dur-4):d=4", "$d\sfx_vo-asif_bed.wav")
Get-ChildItem $d | Select Name, Length
