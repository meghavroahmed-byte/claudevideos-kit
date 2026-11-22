#!/bin/bash
# render daemon: reads queue.txt lines "project duration"; renders any whose mp4 is missing. Runs forever.
S=/tmp/claude-0/-home-user-claudevideos-kit/cba16358-b567-5e19-aa9b-520cf3bfb949/scratchpad
while true; do
  while pgrep -f "render.mjs video p" >/dev/null || pgrep -f "scratchpad/render.sh" >/dev/null; do sleep 20; done
  next=""
  while read -r p d; do [ -z "$p" ] && continue; [ -f /home/user/claudevideos-kit/projects/$p/$p.mp4 ] || { next="$p $d"; break; }; done < $S/queue.txt
  if [ -n "$next" ]; then echo "$(date) start $next" >> $S/queue.log; $S/render.sh $next >> $S/queue.log 2>&1; echo "$(date) done $next" >> $S/queue.log; rm -f /home/user/claudevideos-kit/projects/${next%% *}/p?.mp4; else sleep 60; fi
done
