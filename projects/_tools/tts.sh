#!/bin/bash
# tts.sh project  -> audio/vo.mp3, vo.wav, vo16.wav, words json (needs audio/spoken.txt)
P=$1; cd /home/user/claudevideos-kit/projects/$P; S=/tmp/claude-0/-home-user-claudevideos-kit/cba16358-b567-5e19-aa9b-520cf3bfb949/scratchpad
python3 -c "import json;print(json.dumps({'text':open('script.txt').read().replace('\n',' ').strip(),'model_id':'eleven_v4','voice_settings':{'stability':0.5,'similarity_boost':0.75,'style':0.0,'use_speaker_boost':True,'speed':1.0}}))" > $S/req_$P.json
[ -f audio/vo.mp3 ] && [ "$2" != force ] && echo "vo.mp3 exists, not regenerating" || curl -sS -o audio/vo.mp3 -w "tts %{http_code}\n" "https://api.elevenlabs.io/v1/text-to-speech/DDBVyamqcjlSuvNUZLUH?output_format=mp3_44100_192" -H "xi-api-key: proxy-injected" -H "Content-Type: application/json" --data @$S/req_$P.json
ffmpeg -v error -y -i audio/vo.mp3 -c:a pcm_s16le audio/vo.wav; ffmpeg -v error -y -i audio/vo.mp3 -ar 16000 -ac 1 audio/vo16.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 audio/vo.mp3
$S/wv/bin/python $S/al2.py audio/vo16.wav audio/spoken.txt audio/vo.words.json 2>&1 | grep -i "missing\|error" | head -3
python3 -c "import json;w=json.load(open('audio/vo.words.json'));print(' '.join(f\"{x['s']}:{x['w']}\" for x in w))"
