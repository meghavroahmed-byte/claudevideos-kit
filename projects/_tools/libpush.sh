#!/bin/bash
cd /home/user/claudevideos-kit
push() { for i in 1 2 3 4 5; do git push -q -u origin claude/optimistic-goodall-0o8wf5 && return 0; sleep $((i*10)); done; echo PUSHFAIL; }
commit() { git commit -qm "Asset library: $1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XSP5Y18NWNSUFEgPGrBPj6" && push && echo "pushed $1"; }
git add projects/_assets/hdri && commit "Poly Haven HDRIs (2k)"
git add projects/_assets/tex && commit "Poly Haven textures (1k)"
batch=(); size=0
for d in projects/_assets/*/; do
  n=$(basename $d); case $n in hdri|tex|sf|people) continue;; esac
  git add "$d"; s=$(du -sm "$d" | cut -f1); size=$((size+s))
  if [ $size -gt 350 ]; then commit "Poly Haven models (to $n)"; size=0; fi
done
git add projects/_assets && commit "Poly Haven models (rest)"
