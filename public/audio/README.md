Pre-recorded announcement clips live in this folder.

Required structure:

- `en/male/token_number.mp3`
- `en/male/please_go.mp3`
- `en/male/1.mp3` through `en/male/100.mp3`
- Repeat the same layout for `female/`
- Repeat the same language layout for `ta`, `hi`, `te`, `kn`, and `ml`

The frontend announcement player builds sequences in this order:

1. `/audio/{language}/{gender}/token_number.mp3`
2. `/audio/{language}/{gender}/{token}.mp3`
3. `/audio/{language}/{gender}/please_go.mp3`

Safe playback behavior:

- Missing file -> logs `console.warn("Missing audio file: ...")`
- Queue continues to the next file
- No crash if language folder, gender folder, or file is missing
- Optional backend TTS fallback exists in code but is disabled by default

Language folder mapping:

- `english` -> `en`
- `tamil` -> `ta`
- `hindi` -> `hi`
- `telugu` -> `te`
- `kannada` -> `kn`
- `malayalam` -> `ml`

If any file is missing or fails to load, the player skips it and continues with the next file in the sequence.
