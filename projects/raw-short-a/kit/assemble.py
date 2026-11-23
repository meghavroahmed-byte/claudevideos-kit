# assemble.py: 3D render + natural face pieces (original room background) joined with smooth 0.3 s zoom transitions,
# + RAW voice (plain gain) + ducked SFX bed -> final + phone preview.
# Usage: python3 assemble.py <video3d.mp4> <cut_face.mov> <voice.wav> <sfx.wav> <dur> <faces "a-b,c-d,e-f"> <out_base> [voice_gain_db]
import sys, subprocess
v3d, face, voice, sfx, dur, faces, out = sys.argv[1:8]; vg = sys.argv[8] if len(sys.argv) > 8 else '9.3dB'
dur = float(dur); T = 0.3; h = T / 2
W = [tuple(map(float, w.split('-'))) for w in faces.split(',')]
pieces = []; cur = 0.0
for a, b in W:
    if a > cur + 0.01: pieces.append(('3d', cur, a))
    pieces.append(('face', a, b)); cur = b
if cur < dur - 0.01: pieces.append(('3d', cur, dur))
# extend each piece by h on inner edges so xfade overlaps sit centred on the boundaries
ext = []
for i, (k, a, b) in enumerate(pieces):
    a2 = a - h if i > 0 else a; b2 = b + h if i < len(pieces) - 1 else b; ext.append((k, max(0, a2), min(dur, b2)))
fc = []; inputs = ['-i', v3d, '-i', face, '-i', voice, '-i', sfx]
for i, (k, a, b) in enumerate(ext):
    src = 0 if k == '3d' else 1; d = b - a
    z = '' if k == '3d' else f",scale=w='1080*(1+0.035*t/{d:.3f})':h='1920*(1+0.035*t/{d:.3f})':eval=frame,crop=1080:1920"
    fc.append(f"[{src}:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS,fps=30{z},format=yuv420p,setsar=1[p{i}]")
last = 'p0'; acc = ext[0][2] - ext[0][1]
for i in range(1, len(ext)):
    off = acc - T; fc.append(f"[{last}][p{i}]xfade=transition=zoomin:duration={T}:offset={off:.3f}[x{i}]"); last = f'x{i}'; acc = off + (ext[i][2] - ext[i][1])
fc.append(f"[2:a]volume={vg},aformat=channel_layouts=stereo,asplit=2[vo][sc];[3:a]volume=2.0dB[sf];[sf][sc]sidechaincompress=threshold=0.05:ratio=2:attack=20:release=250[sfd];[vo][sfd]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.8:level=false[a]")
cmd = ['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', ';'.join(fc), '-map', f'[{last}]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', f'{dur:.3f}', out + '.mp4']
subprocess.run(cmd, check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out + '.mp4', '-vf', 'scale=720:-2', '-c:v', 'libx264', '-crf', '26', '-c:a', 'aac', '-b:a', '128k', out + '-preview.mp4'], check=True)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', out + '.mp4', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print([l.strip() for l in r.splitlines() if l.strip().startswith(('I:', 'Peak:'))][-2:], 'acc', round(acc, 3))
