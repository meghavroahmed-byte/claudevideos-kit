#!/bin/bash
# slowly works through sfpending.txt ("uid name" per line), one download attempt every 10 min
S=/tmp/claude-0/-home-user-claudevideos-kit/cba16358-b567-5e19-aa9b-520cf3bfb949/scratchpad; R=/home/user/claudevideos-kit/projects
while true; do
  line=$(while read u n; do [ -f $R/_assets/sf/$n.glb ] || { echo "$u $n"; break; }; done < $S/sfpending.txt)
  [ -z "$line" ] && { sleep 120; continue; }
  set -- $line; echo "$(date +%T) try $2" >> $S/sfqueue.log
  (cd $R && timeout 600 python3 _kit/getsf.py get $1 $2 >> $S/sfqueue.log 2>&1)
  [ -f $R/_assets/sf/$2.glb ] && echo "$(date +%T) GOT $2" >> $S/sfqueue.log || sleep 600
done
