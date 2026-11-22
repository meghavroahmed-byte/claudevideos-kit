#!/bin/bash
# foreground queue runner: renders missing mp4s from queue.txt until ~100 min elapsed, then exits
S=/tmp/claude-0/-home-user-claudevideos-kit/cba16358-b567-5e19-aa9b-520cf3bfb949/scratchpad; T0=$(date +%s)
while [ $(( $(date +%s) - T0 )) -lt 6000 ]; do
  next=""; while read -r p d; do [ -z "$p" ] && continue; [ -f /home/user/claudevideos-kit/projects/$p/$p.mp4 ] || { next="$p $d"; break; }; done < $S/queue.txt
  [ -z "$next" ] && { echo "queue empty"; exit 0; }
  echo "$(date) start $next" | tee -a $S/queue.log; $S/render.sh $next >> $S/queue.log 2>&1; echo "$(date) done $next" | tee -a $S/queue.log; rm -f /home/user/claudevideos-kit/projects/${next%% *}/p?.mp4 /home/user/claudevideos-kit/projects/${next%% *}/silent.mp4
done
echo "time slice over"
