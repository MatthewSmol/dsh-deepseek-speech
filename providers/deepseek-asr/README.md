# DeepSeek ASR provider for DSH Voice input

This host-only plugin registers a cloud `DeepSeek ASR` provider in the built-in
experimental **Voice input** bundle. It uses the existing `DEEPSEEK_API_KEY`
from DSH credentials and never exposes the key to the browser.

## Languages

The provider advertises `auto`, `ru`, and `en`, so the built-in Voice input
language selector shows **Russian**. DeepSeek ASR detects the spoken language
automatically; the selection is a UI hint because the current API has no
separate language field.

## Install

Build the provider, then install this folder with the DSH plugin manager:

```bash
npm run build   # Vite, minified ESM
plugin_manager install_bundle target=/home/main/TelegramBot/plugins/dsh-deepseek-speech/providers/deepseek-asr
```

Then enable **Plugins → More → Experimental plugins → Voice input**, open its
details, choose **DeepSeek ASR** and **Русский**, and record a prompt.

## Notes

- No SenseVoice model download is used for this provider.
- The provider receives canonical 16 kHz mono PCM16 WAV audio from Voice input.
- Audio is limited to 8 MiB / 600 seconds.
- Disabling the Voice input toggle removes the microphone and the capability.
