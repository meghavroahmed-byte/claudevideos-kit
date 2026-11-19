---
name: ElevenLabs voice (Megh Yt english)
description: How to generate the user's voiceover with ElevenLabs from this cloud session
type: reference
---
- API key is saved as a network secret for api.elevenlabs.io (proxy injects it). Send header `xi-api-key: proxy-injected`; never ask for or print the key.
- User's cloned voice: "Megh Yt english", voice_id `DDBVyamqcjlSuvNUZLUH` (category cloned).
- TTS: POST https://api.elevenlabs.io/v1/text-to-speech/DDBVyamqcjlSuvNUZLUH?output_format=mp3_44100_192, JSON {"text": ..., "model_id": "eleven_v4", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0, "use_speaker_boost": true, "speed": 1.0}} — these match the user's own uploads (file names "ivc_s50_sim75_v4").
- Plan: Creator, 131,000 credits/month; ~1 credit per character, a ~35 s short is ~450-550 credits. Finalize the script before generating (user is credit-conscious). Check usage: GET /v1/user/subscription.
- The user also uses Cartesia ("megh yt english", see Cartesia notes) and sometimes uploads ElevenLabs mp3s directly. Never filter/process the voice.
