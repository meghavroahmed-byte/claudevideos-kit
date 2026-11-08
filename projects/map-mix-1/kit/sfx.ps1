# Fresh SFX palette for map-mix-1 (synthesized; nothing reused)
$ff = 'C:\Users\avroa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'
$o = 'D:\ClaudeVideos\projects\map-mix-1\sfx'
New-Item -ItemType Directory -Force $o | Out-Null
function G($name, $src, $af) { & $ff -v error -y -f lavfi -i $src -af "$af,aformat=sample_rates=44100:channel_layouts=stereo" "$o\sfx_mapmix1_$name.wav" }
# --- airy whooshes (4 variants: noise colour, length, filter, asymmetry) ---
G 'whoosh1' 'anoisesrc=d=0.75:c=pink:a=0.9' "highpass=f=300,lowpass=f=5200,volume='if(lt(t,0.5),pow(t/0.5,2.2),pow(1-(t-0.5)/0.25,1.5))':eval=frame,flanger=delay=2:depth=6:speed=1.4,stereotools=balance_out=-0.2,volume=1.6"
G 'whoosh2' 'anoisesrc=d=0.6:c=white:a=0.7' "bandpass=f=1800:width_type=o:w=2.2,volume='sin(PI*t/0.6)^2.5':eval=frame,aphaser=type=t:speed=2,stereotools=balance_out=0.25,volume=2.2"
G 'whoosh3' 'anoisesrc=d=0.9:c=brown:a=1' "highpass=f=120,lowpass=f=2400,volume='if(lt(t,0.62),pow(t/0.62,3),pow(1-(t-0.62)/0.28,2))':eval=frame,chorus=0.6:0.9:40:0.4:0.3:2,volume=2.6"
G 'whoosh4' 'anoisesrc=d=0.5:c=blue:a=0.5' "highpass=f=900,lowpass=f=9000,volume='sin(PI*t/0.5)^3':eval=frame,flanger=delay=4:depth=8:speed=3,stereotools=balance_out=-0.3,volume=1.4"
# --- paper slide / map rustle (3) ---
G 'paper1' 'anoisesrc=d=0.55:c=white:a=0.6' "bandpass=f=3800:width_type=o:w=1.6,volume='sin(PI*t/0.55)*(0.55+0.45*sin(2*PI*31*t)*sin(2*PI*7*t))':eval=frame,volume=2.2"
G 'paper2' 'anoisesrc=d=0.8:c=pink:a=0.7' "bandpass=f=2600:width_type=o:w=2,volume='pow(sin(PI*t/0.8),1.5)*(0.6+0.4*sin(2*PI*23*t+1))':eval=frame,stereotools=balance_out=0.2,volume=2.4"
G 'paper3' 'anoisesrc=d=0.4:c=white:a=0.5:seed=7' "highpass=f=2000,lowpass=f=7000,volume='exp(-6*t)*(0.5+0.5*sin(2*PI*47*t))':eval=frame,volume=2.6"
# --- soft chime pops (4 pitches; shimmer echo) ---
G 'pop1' "aevalsrc='0.6*sin(2*PI*(880-120*t)*t)*exp(-14*t)+0.25*sin(2*PI*1760*t)*exp(-22*t)':d=0.45" "aecho=0.8:0.6:60|110:0.25|0.15,volume=1.4"
G 'pop2' "aevalsrc='0.6*sin(2*PI*(1174.7-150*t)*t)*exp(-16*t)+0.2*sin(2*PI*2349*t)*exp(-26*t)':d=0.4" "aecho=0.8:0.6:45|90:0.25|0.12,stereotools=balance_out=0.3,volume=1.3"
G 'pop3' "aevalsrc='0.65*sin(2*PI*(659.3-80*t)*t)*exp(-12*t)+0.3*sin(2*PI*1318.5*t)*exp(-20*t)':d=0.5" "aecho=0.8:0.55:70|130:0.22|0.12,stereotools=balance_out=-0.3,volume=1.4"
G 'pop4' "aevalsrc='0.55*sin(2*PI*(987.8-100*t)*t)*exp(-18*t)+0.25*sin(2*PI*1975.5*t)*exp(-30*t)+0.15*sin(2*PI*2963*t)*exp(-40*t)':d=0.35" "aecho=0.8:0.6:30|75:0.3|0.15,volume=1.3"
# --- impacts: heartbeat thumps & deep booms (3) ---
G 'thump1' "aevalsrc='0.9*sin(2*PI*(62-30*t)*t)*exp(-9*t)+0.7*sin(2*PI*(58-28*(t-0.22))*(t-0.22))*exp(-10*(t-0.22))*gte(t,0.22)':d=0.9" "lowpass=f=300,volume=2.0"
G 'thump2' "aevalsrc='1.0*sin(2*PI*(48-20*t)*t)*exp(-4*t)+0.3*(random(0)*2-1)*exp(-40*t)':d=1.6" "lowpass=f=900,aecho=0.8:0.5:120:0.2,volume=2.0"
G 'thump3' "aevalsrc='0.9*sin(2*PI*(75-45*t)*t)*exp(-7*t)+0.25*(random(1)*2-1)*exp(-60*t)':d=1.0" "lowpass=f=1400,volume=2.0"
# --- counter ticks (2) ---
G 'tick1' "aevalsrc='0.5*sin(2*PI*3200*t)*exp(-120*t)+0.3*sin(2*PI*1600*t)*exp(-90*t)':d=0.08" "volume=1.2"
G 'tick2' "aevalsrc='0.5*sin(2*PI*2400*t)*exp(-140*t)+0.25*(random(3)*2-1)*exp(-200*t)':d=0.07" "highpass=f=800,volume=1.2"
# --- shimmer risers (2) ---
G 'riser1' "aevalsrc='0.35*sin(2*PI*(220*t+220*t*t))*pow(t/1.6,2)+0.2*sin(2*PI*(440*t+440*t*t))*pow(t/1.6,3)':d=1.6" "aecho=0.8:0.7:80|160:0.3|0.2,volume=1.6"
G 'riser2' 'anoisesrc=d=1.4:c=pink:a=0.6' "bandpass=f=2500:width_type=o:w=3,volume='pow(t/1.4,3)':eval=frame,flanger=delay=1:depth=5:speed=0.8,volume=2.2"
# --- dreamy pad bed (full length, A minor add9 with slow movement) ---
& $ff -v error -y -f lavfi -i "aevalsrc='0.10*sin(2*PI*110*t)*(0.7+0.3*sin(2*PI*0.07*t))+0.07*sin(2*PI*164.8*t+sin(2*PI*0.11*t))+0.06*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.05*t+1))+0.045*sin(2*PI*261.6*t)*(0.5+0.5*sin(2*PI*0.09*t+2))+0.035*sin(2*PI*329.6*t)*(0.5+0.5*sin(2*PI*0.13*t))+0.03*sin(2*PI*493.9*t)*(0.4+0.6*sin(2*PI*0.04*t+3))':d=520" -af "lowpass=f=1800,aecho=0.8:0.6:400|700:0.3|0.2,aformat=sample_rates=44100:channel_layouts=stereo,stereotools=mlev=1:slev=1.4" "$o\sfx_mapmix1_bed.wav"
Get-ChildItem $o | % { "{0} {1}" -f $_.Name, $_.Length }
