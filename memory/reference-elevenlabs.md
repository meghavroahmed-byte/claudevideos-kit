---
name: ElevenLabs voice (Megh Yt english)
description: How to generate the user's voiceover with ElevenLabs from this cloud session
type: reference
---
- API key is saved as a network secret for api.elevenlabs.io (proxy injects it). Send header `xi-api-key: proxy-injected`; never ask for or print the key.
- User's cloned voice: "Megh Yt english", voice_id `DDBVyamqcjlSuvNUZLUH` (category cloned).
- TTS: POST https://api.elevenlabs.io/v1/text-to-speech/DDBVyamqcjlSuvNUZLUH?output_format=pcm_44100 (or mp3_44100_192), JSON {"text": ..., "model_id": "eleven_multilingual_v2"}.
- The user also uses Cartesia ("megh yt english", see Cartesia notes) and sometimes uploads ElevenLabs mp3s directly. Never filter/process the voice.
