#!/bin/bash
# renders projects listed in v2queue.txt (one per line) that lack .v2done; waits for any other video render to finish first
S=/tmp/claude-0/-home-user-claudevideos-kit/cba16358-b567-5e19-aa9b-520cf3bfb949/scratchpad; R=/home/user/claudevideos-kit/projects
while true; do
  next=""; for p in $(cat $S/v2queue.txt); do [ -f $R/$p/.v2done ] || { next=$p; break; }; done
  [ -z "$next" ] && { sleep 60; continue; }
  while pgrep -f "render.mjs video" >/dev/null; do sleep 30; done
  d=$(grep -oP "DURATION = \K[0-9.]+" $R/$next/src/shots.js)
  echo "$(date +%T) render $next $d" >> $S/v2run.log
  $S/render.sh $next $d >> $S/v2run.log 2>&1 && [ -f $R/$next/$next.mp4 ] && [ $R/$next/$next.mp4 -nt $R/$next/src/shots.js ] && touch $R/$next/.v2done && echo "$(date +%T) DONE $next" >> $S/v2run.log
  [ -f $R/$next/.v2done ] || { echo "$(date +%T) FAIL $next" >> $S/v2run.log; sleep 120; }
done
