# Unique SFX palette for map-short1 ("Chile — why so long"): crisp paper swishes, marker squeaks,
# wooden map-pin plunks, mountain thud, war boom, ocean swell, brass-bell ding, plucked explorer bed.
# All synthesized here; nothing reused from earlier projects.
$ErrorActionPreference = 'Continue'
$d = "D:\ClaudeVideos\projects\map-short1\sfx"; New-Item -ItemType Directory -Force $d | Out-Null
function G($a) { & ffmpeg -v error -y @a }
$n = 'sfx_map1_'
# paper swishes (white noise, high band, fast swell)
$sw = @(@{f = 3600; w = 3000; L = 0.38; pan = 'c0=1.0*c0|c1=0.5*c0' }, @{f = 2600; w = 2200; L = 0.45; pan = 'c0=0.5*c0|c1=1.0*c0' }, @{f = 4800; w = 3500; L = 0.32; pan = 'c0=0.8*c0|c1=0.8*c0' })
$i = 1; foreach ($s in $sw) { G @('-f', 'lavfi', '-i', "anoisesrc=d=$($s.L):c=white:a=0.8:r=48000", '-af', "bandpass=f=$($s.f):w=$($s.w),volume='sin(PI*pow(t/$($s.L),0.6))^3':eval=frame,pan=stereo|$($s.pan),volume=1.3", "$d\$($n)swish$i.wav"); $i++ }
# marker squeak (for arrows / measure lines)
$mk = @(@{f = 2900; tr = 38; L = 0.55 }, @{f = 2300; tr = 52; L = 0.45 })
$i = 1; foreach ($m in $mk) { G @('-f', 'lavfi', '-i', "anoisesrc=d=$($m.L):c=pink:a=0.8:r=48000", '-af', "bandpass=f=$($m.f):w=500,volume='(0.55+0.45*sin(2*PI*$($m.tr)*t))*min(1,t*20)*min(1,($($m.L)-t)*12)':eval=frame,aformat=channel_layouts=stereo,volume=0.9", "$d\$($n)marker$i.wav"); $i++ }
# wooden pin plunks (labels / dots) - pitched woodblock + glide
$pl = @(660, 520, 820, 440)
$i = 1; foreach ($p in $pl) { G @('-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*($p*t-$($p*0.35)*t*t*3))*exp(-30*t)+0.25*sin(2*PI*$($p*2.76)*t)*exp(-60*t)':d=0.3:s=48000", '-af', 'aformat=channel_layouts=stereo,volume=0.75', "$d\$($n)plunk$i.wav"); $i++ }
# mountain wall thud
G @('-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*(38*t+40/6*(1-exp(-6*t))))*exp(-4*t)':d=1.8:s=48000", '-f', 'lavfi', '-i', 'anoisesrc=d=1.8:c=brown:a=0.9:r=48000', '-filter_complex', "[1]lowpass=f=300,volume='exp(-10*t)':eval=frame[x];[0][x]amix=2:normalize=0,aecho=0.8:0.5:70|160:0.3|0.15,aformat=channel_layouts=stereo,alimiter=limit=0.9", "$d\$($n)thud.wav")
# war boom (cannon-ish)
G @('-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*(30*t+70/4*(1-exp(-4*t))))*exp(-2.5*t)':d=2.5:s=48000", '-f', 'lavfi', '-i', 'anoisesrc=d=2.5:c=white:a=0.9:r=48000', '-filter_complex', "[1]lowpass=f=1800,volume='0.8*exp(-7*t)':eval=frame[x];[0][x]amix=2:normalize=0,aecho=0.8:0.6:220|480:0.35|0.2,aformat=channel_layouts=stereo,alimiter=limit=0.9", "$d\$($n)boom.wav")
# ocean swell
G @('-f', 'lavfi', '-i', 'anoisesrc=d=2.4:c=pink:a=0.8:r=48000', '-af', "lowpass=f=1400,highpass=f=150,volume='sin(PI*t/2.4)^2':eval=frame,pan=stereo|c0=0.9*c0|c1=0.6*c0,volume=0.9", "$d\$($n)wave.wav")
# brass bell ding (magnifier / comment)
G @('-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*1244*t)*exp(-3*t)+0.18*sin(2*PI*2490*t)*exp(-5*t)+0.12*sin(2*PI*3110*t)*exp(-7*t)':d=1.4:s=48000", '-af', 'aecho=0.8:0.5:90:0.25,aformat=channel_layouts=stereo', "$d\$($n)ding.wav")
# whip (hard cuts)
G @('-f', 'lavfi', '-i', 'anoisesrc=d=0.3:c=white:a=0.9:r=48000', '-af', "highpass=f=900,volume='pow(t/0.3,2)*exp(-4*(t/0.3-1)*(t/0.3-1))*1.6':eval=frame,aformat=channel_layouts=stereo", "$d\$($n)whip.wav")
# explorer bed: plucked pentatonic ostinato over a soft drone, 72 s
$L = 72
$semi = "(0*eq(mod(floor(t/0.3),8),0)+3*eq(mod(floor(t/0.3),8),1)+7*eq(mod(floor(t/0.3),8),2)+10*eq(mod(floor(t/0.3),8),3)+12*eq(mod(floor(t/0.3),8),4)+10*eq(mod(floor(t/0.3),8),5)+7*eq(mod(floor(t/0.3),8),6)+3*eq(mod(floor(t/0.3),8),7))"
$root = "(0*eq(mod(floor(t/4.8),4),0)-4*eq(mod(floor(t/4.8),4),1)-2*eq(mod(floor(t/4.8),4),2)-5*eq(mod(floor(t/4.8),4),3))"
$expr = "0.22*sin(2*PI*293.66*pow(2,($semi+$root)/12)*t)*exp(-11*mod(t,0.3))+0.14*sin(2*PI*73.42*pow(2,$root/12)*t)*(0.8+0.2*sin(2*PI*0.2*t))"
G @('-f', 'lavfi', '-i', "aevalsrc='$expr':d=$($L):s=48000", '-af', "lowpass=f=2400,aecho=0.8:0.4:300:0.25,aformat=channel_layouts=stereo,afade=t=in:d=1.5,afade=t=out:st=$($L-3):d=3,volume=0.5", "$d\$($n)bed.wav")
Get-ChildItem $d | Select Name, Length
