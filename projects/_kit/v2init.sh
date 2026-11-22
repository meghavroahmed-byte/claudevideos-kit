#!/bin/bash
# v2init.sh <proj>: convert a project to style v2 (keeps voice/sfx/bgm; old shots.js -> shots_v1.js)
P=$1; R=/home/user/claudevideos-kit/projects; cd $R/$P || exit 1
[ -f src/shots_v1.js ] || cp src/shots.js src/shots_v1.js
cp $R/giant-rat/index.html index.html; cp $R/giant-rat/src/main.js src/main.js
[ -L assets ] || { rm -rf assets; ln -s ../_assets assets; }
ln -sf ../../_kit/real.js src/real.js
python3 $R/_kit/mkcaps.py $P
