# 60-short batch (~30 s each, Zack-D-style one take, MR. CLOUD hero, ElevenLabs voice)

Rules: NO top glass info card, NO dark translucent HUD panels, NO stamp() text over the face (except #1-2 as delivered) (user forbade 2026-11-19); one continuous take; hook = the situation in a wide/medium shot; full body always in frame; visuals match the words literally;
fresh synthesized SFX for every event (no hiss, no bird squeaks, marimba run for slips, no all-video beds); voice untouched;
MR. CLOUD chest print (Righteous, ~38% white). Voice: ElevenLabs "Megh Yt english" eleven_v4, stability 0.5, similarity 0.75.

Pipeline (for future check-ins): scripts in scratchpad (tts.sh <proj> = ElevenLabs+align; st.sh = still grids with P=<proj>; render.sh <proj> <dur>).
Render: run scratchpad/queue2.sh as a run_in_background task (time-sliced ~100 min; detached daemons die when the idle container is reclaimed). It renders any project in scratchpad/queue.txt whose <proj>.mp4 is missing. Deliver finished mp4s (SendUserFile), then mark x.

Note: #1-3 were delivered with the old dark-backed stamps; re-render them at the end of the queue (rename mp4) and re-deliver.

SOUND (user, 2026-11-22): #3-60 louder master + soft unique BGM per video (bgm.py); #1-2 untouched.
DELIVERY (user, 2026-11-22): do NOT send piecemeal. When ALL 60 are rendered, send them serially #1..#60, one file per message, each captioned with its number + title (file named "NN - Title.mp4").

STYLE v2 (user, 2026-11-22, after the giant-rat sample): REBUILD #3-60 in the REALISTIC style of projects/giant-rat:
Poly Haven HDRI world (GroundedSkybox + env light) and real Poly Haven models/textures; realistic rigged 3D human (Ready Player Me avatar
retargeted from Xbot Mixamo clips, see giant-rat/src/shots.js) with MR. CLOUD print; ONE-WORD big bold captions (caps.js from vo.words.json);
small plain outlined labels on objects (no box); X-ray circle on the body where it fits; ghost/hologram version of the creature where it fits.
HUMANS MUST NOT LOOK TINY next to animals - keep the person large and readable in frame. Reuse each project's existing voice/script.
ASSETS: projects/_assets (shared; each v2 project's assets -> ../_assets symlink). Poly Haven via _kit/getph.py; Sketchfab via _kit/getsf.py (token saved on env; CC0/CC-BY only, credits in _assets/sf/CREDITS.json -> give the user credit lines per video). Kit: _kit/real.js, _kit/v2init.sh <proj>, _kit/mkcaps.py, _kit/dims.py.
Old-style renders of #3-60 are obsolete. New per-project status: [v] v2 built · [R] v2 rendered.

LIBRARY CLEANUP (todo): sfbulk auto-picks are often WRONG (e.g. swordfish=Cowboy Bebop ship, piranha=FNAF toy, dolphin=shark, crab=platformer pack, car_sedan=city, moon=attic). Review every _assets/sf model thumbnail (Sketchfab API thumbnails) and delete/replace mismatches; prefer realistic picks. Sketchfab rate-limits downloads (429) for long stretches: fetch only what a video needs, slowly.

V2 STATUS (2026-11-23): all 58 v2 scenes built; rendering via _tools/v2run.sh + v2queue.txt (projects/<proj>/.v2done marks rendered).

FINAL STEP (user, 2026-11-22): after all 60 are delivered, write a RECOVERY SKILL (e.g. .claude/skills/realistic-shorts/SKILL.md, committed) so that a fresh Claude on a new computer can restore everything from this repo alone: where the asset library lives (projects/_assets: Poly Haven + Sketchfab + people, credits), the v2 pipeline (kit, tools, render/mix, captions, sfx, bgm), the user's rules (no face stamps, no glass card, voice untouched, loud master + soft BGM, delivery format), and how to regenerate voice (ElevenLabs settings) and fetch more assets.

Status: [x] delivered · [r] rendering · [b] built · [ ] to do

| # | Project | Topic | Status |
|---|---------|-------|--------|
| 1 | toilet-paper | What did people use before toilet paper? | x |
| 2 | anaconda | What if you got swallowed by an anaconda? | x |
| 3 | no-sleep | What happens if you stop sleeping? | x |
| 4 | space-suit | Space without a spacesuit | x |
| 5 | volcano | What if you fell into a volcano? | x |
| 6 | lightning | What happens when you get struck by lightning? | x |
| 7 | quicksand | What if you got stuck in quicksand? | x |
| 8 | tsunami | Could you outrun a tsunami? | x |
| 9 | lost-at-sea | What if you were lost at sea for 3 days? | x |
| 10 | swallow-gum | What happens if you swallow gum? | x |
| 11 | tickle | Why can't you tickle yourself? | x |
| 12 | no-water | How long can you survive without water? | x |
| 13 | pyramid-worker | A day in the life of a pyramid worker | b |
| 14 | knight-toilet | How did knights go to the toilet in armor? | b |
| 15 | ancient-teeth | How did people brush their teeth 5,000 years ago? | b |
| 16 | gladiator | Life of a Roman gladiator | b |
| 17 | hippo | Why you should never pet a hippo | b |
| 18 | giant-mosquito | What if a mosquito was human-sized? | b |
| 19 | chameleon | How a chameleon really changes color | b |
| 20 | doppelganger | How many people look exactly like you? | b |
| 21 | elevator-fall | What if your elevator cable snapped? | b |
| 22 | coldest-place | What if you stood in -90°C Antarctica? | b |
| 23 | bee-sting | What happens when a bee stings you? | b |
| 24 | hiccups | Why do we get hiccups? | b |
| 25 | sneeze | What happens when you sneeze? | b |
| 26 | goosebumps | Why do we get goosebumps? | b |
| 27 | yawn | Why are yawns contagious? | b |
| 28 | brain-freeze | What is brain freeze? | b |
| 29 | knuckle-crack | What happens when you crack your knuckles? | b |
| 30 | deep-ocean | What if you dove to the bottom of the ocean? | b |
| 31 | black-hole | What if you fell into a black hole? | b |
| 32 | moon-jump | How high could you jump on the Moon? | b |
| 33 | shark | What to do if a shark attacks | b |
| 34 | bear | What to do if you meet a bear | b |
| 35 | avalanche | How to survive an avalanche | b |
| 36 | desert-lost | What if you got lost in the desert? | b |
| 37 | plane-door | What if you opened a plane door mid-flight? | b |
| 38 | ice-lake | What if you fell through a frozen lake? | b |
| 39 | caffeine | What does coffee do to your brain? | b |
| 40 | sugar | What happens when you eat too much sugar? | b |
| 41 | phone-sleep | Why phones at night ruin your sleep | b |
| 42 | hair-growth | Why does hair grow? | b |
| 43 | fingernails | Why do fingernails grow faster than toenails? | b |
| 44 | ears-pop | Why do your ears pop on a plane? | b |
| 45 | eye-blink | How many times do you blink in a day? | b |
| 46 | heart-beats | How many times does your heart beat in a lifetime? | b |
| 47 | castle-siege | How did people attack a castle? | b |
| 48 | viking-ship | Life on a Viking ship | b |
| 49 | samurai-armor | Could samurai armor stop a sword? | b |
| 50 | mummy | How were mummies made? | b |
| 51 | caveman-fire | How did cavemen make fire? | b |
| 52 | medieval-doctor | Visiting a doctor in the Middle Ages | b |
| 53 | ant-strength | What if you were as strong as an ant? | b |
| 54 | octopus | Why octopuses are so smart | b |
| 55 | elephant-memory | Do elephants really never forget? | b |
| 56 | cheetah | Could you outrun a cheetah? | b |
| 57 | everest | What happens to your body on Everest? | b |
| 58 | earthquake | What to do in an earthquake | b |
| 59 | tornado | What if you got caught in a tornado? | b |
| 60 | sun-stare | What if you stared at the Sun? | b |

DONE (2026-11-24): all 60 delivered (#1-2 original, #3-60 v2 realistic). Delivery manifests: _tools/deliver.tsv, _tools/captions.txt. Recovery skill: .claude/skills/realistic-shorts/SKILL.md.
