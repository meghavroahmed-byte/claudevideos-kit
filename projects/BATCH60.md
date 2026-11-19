# 60-short batch (~30 s each, Zack-D-style one take, MR. CLOUD hero, ElevenLabs voice)

Rules: NO top glass info card (user forbade it 2026-11-19); one continuous take; hook = the situation in a wide/medium shot; full body always in frame; visuals match the words literally;
fresh synthesized SFX for every event (no hiss, no bird squeaks, marimba run for slips, no all-video beds); voice untouched;
MR. CLOUD chest print (Righteous, ~38% white). Voice: ElevenLabs "Megh Yt english" eleven_v4, stability 0.5, similarity 0.75.

Pipeline (for future check-ins): scripts in scratchpad (tts.sh <proj> = ElevenLabs+align; st.sh = still grids with P=<proj>; render.sh <proj> <dur>).
Render: run scratchpad/queue2.sh as a run_in_background task (time-sliced ~100 min; detached daemons die when the idle container is reclaimed). It renders any project in scratchpad/queue.txt whose <proj>.mp4 is missing. Deliver finished mp4s (SendUserFile), then mark x.

Status: [x] delivered · [r] rendering · [b] built · [ ] to do

| # | Project | Topic | Status |
|---|---------|-------|--------|
| 1 | toilet-paper | What did people use before toilet paper? | x |
| 2 | anaconda | What if you got swallowed by an anaconda? | r |
| 3 | no-sleep | What happens if you stop sleeping? | b |
| 4 | space-suit | Space without a spacesuit | r |
| 5 | volcano | What if you fell into a volcano? | b |
| 6 | lightning | What happens when you get struck by lightning? | b |
| 7 | quicksand | What if you got stuck in quicksand? | b |
| 8 | tsunami | Could you outrun a tsunami? | b |
| 9 | lost-at-sea | What if you were lost at sea for 3 days? | b |
| 10 | swallow-gum | What happens if you swallow gum? | b |
| 11 | tickle | Why can't you tickle yourself? | b |
| 12 | no-water | How long can you survive without water? | b |
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
| 32 | moon-jump | How high could you jump on the Moon? | |
| 33 | shark | What to do if a shark attacks | |
| 34 | bear | What to do if you meet a bear | |
| 35 | avalanche | How to survive an avalanche | |
| 36 | desert-lost | What if you got lost in the desert? | |
| 37 | plane-door | What if you opened a plane door mid-flight? | |
| 38 | ice-lake | What if you fell through a frozen lake? | |
| 39 | caffeine | What does coffee do to your brain? | |
| 40 | sugar | What happens when you eat too much sugar? | |
| 41 | phone-sleep | Why phones at night ruin your sleep | |
| 42 | hair-growth | Why does hair grow? | |
| 43 | fingernails | Why do fingernails grow faster than toenails? | |
| 44 | ears-pop | Why do your ears pop on a plane? | |
| 45 | eye-blink | How many times do you blink in a day? | |
| 46 | heart-beats | How many times does your heart beat in a lifetime? | |
| 47 | castle-siege | How did people attack a castle? | |
| 48 | viking-ship | Life on a Viking ship | |
| 49 | samurai-armor | Could samurai armor stop a sword? | |
| 50 | mummy | How were mummies made? | |
| 51 | caveman-fire | How did cavemen make fire? | |
| 52 | medieval-doctor | Visiting a doctor in the Middle Ages | |
| 53 | ant-strength | What if you were as strong as an ant? | |
| 54 | octopus | Why octopuses are so smart | |
| 55 | elephant-memory | Do elephants really never forget? | |
| 56 | cheetah | Could you outrun a cheetah? | |
| 57 | everest | What happens to your body on Everest? | |
| 58 | earthquake | What to do in an earthquake | |
| 59 | tornado | What if you got caught in a tornado? | |
| 60 | sun-stare | What if you stared at the Sun? | |
