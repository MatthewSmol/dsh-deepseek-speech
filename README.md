# DeepSeek speech for DSH

[English](#english) | [Русский](#русский)

## English

DeepSeek speech connects Telegram voice messages to the DeepSeek ASR/TTS APIs inside [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

- Incoming Telegram voice/audio → `ffmpeg`/`ffprobe` → DeepSeek ASR → text in the agent prompt.
- Assistant replies → DeepSeek TTS → OGG/Opus → Telegram voice note, but only when the prompt asks for it or **Always reply with voice** is enabled.
- A sidebar panel shows duration, characters, estimated tokens, cost, latency, quality and history.
- The DeepSeek API key lives in DSH credentials, not in this repository.

Repository: <https://github.com/MatthewSmol/dsh-deepseek-speech>

### Features

- Telegram voice transcription through the gateway's `/dsh-voice/transcribe` route.
- Long audio is split into ~110-second chunks before DeepSeek ASR.
- Any Telegram audio format is converted locally with `ffmpeg`; duration comes from `ffprobe`.
- TTS quality from 64 to 256 kbps CBR, or Dynamic VBR.
- Prompt triggers and an explicit “always voice” checkbox; no automatic voice just because the input was voice.
- Bilingual settings/history UI (English and Russian).
- Dependency check for `ffmpeg`, `ffprobe` and `libopus`, with a global-install action when they are missing.
- No API key, bot token or audio bytes are written to the repository.

### Requirements

- DSH Web with a managed profile and the Telegram messenger gateway.
- Node.js 24+ (the DSH runtime).
- `ffmpeg` and `ffprobe` with `libopus`.
- `@goodandready/dsh-voice` **must be removed**: this plugin owns `/dsh-voice/transcribe`. Remove the stale `dsh-voice` row from the profile if it remains, then restart DSH.
- A DeepSeek API key with access to the ASR/TTS tools.

### Install

#### Web UI (recommended)

1. Open **Plugins** in the DSH sidebar.
2. Select **Add plugin** → **Install a third-party plugin**.
3. Enter one of:
   - `https://github.com/MatthewSmol/dsh-deepseek-speech.git`
   - the absolute path to a local clone.
4. Select **Install**.
5. When installation completes, select **Enable now**.
6. Restart DSH if it asks for a restart, or if the ASR route reports a conflict.

#### Local clone

```bash
git clone https://github.com/MatthewSmol/dsh-deepseek-speech.git
```

Then use **Plugins → Add plugin → Install a third-party plugin** and enter the absolute path to the cloned directory. Enable the bundle and restart DSH if requested.

#### Through the DSH agent

The agent can install the bundle with the `plugin_manager` tool:

- action: `install_bundle`
- target: the Git URL or an absolute local directory
- review `application` and `warnings`
- restart DSH when the result says `restart-required`

Profile changes are persistent and require approval.

### Configure in DSH

1. Open **Settings → DeepSeek speech** (or the **DeepSeek speech** sidebar panel → **Settings**).
2. Paste the DeepSeek API key into **DeepSeek API key** and select **Save**.
   - The value is stored through DSH credentials as `DEEPSEEK_API_KEY`.
   - The browser receives only “configured / not configured”; the value is never returned.
3. Check **Dependencies**:
   - `ffmpeg`, `ffprobe`, `libopus` should be green.
   - If something is missing, select **Install ffmpeg globally**. The host runs `sudo -n apt-get update && sudo -n apt-get install -y ffmpeg`. It never asks for or accepts a sudo password.
   - If passwordless sudo is unavailable, the panel shows the exact command to run manually:
     ```bash
     sudo apt-get update && sudo apt-get install -y ffmpeg
     ```
4. Choose a voice: **Клеопатра** (API id `stella`) or **Македонский** (API id `tide`).
5. Choose **OGG/Opus quality**: 64, 96, 128, 160, 192, 256 kbps, or **Dynamic VBR**.
6. Keep **Always reply with voice** off unless every assistant reply should be spoken.
7. Check **Telegram ASR route**:
   - `active` — ready.
   - `conflict` — another plugin owns `/dsh-voice/transcribe`; remove `@goodandready/dsh-voice`, clean its profile row, restart DSH.
8. Send a voice message to the bot. The transcript should arrive in the agent prompt and appear in the panel history.
9. Send a prompt such as “reply with voice” to test a spoken reply.

The Telegram gateway must already be configured with its bot token. This plugin does not read or copy the bot token.

### Voice replies

Voice is used only when:

- the user prompt explicitly asks for it, for example:
  - “ответь голосом”
  - “озвучь ответ”
  - “прочитай вслух”
  - “reply with voice”
  - “send voice”
  - “read aloud”
- **or** **Always reply with voice** is enabled.

Negative instructions suppress voice:

- “не озвучивай”
- “без голоса”
- “только текстом”
- “text only”
- “don’t speak”
- “no voice”

The plugin listens only to sessions whose id starts with `msgw-`. It sends the voice note to the Telegram home `default` (the private chat configured in the gateway). Web sessions are not spoken automatically.

DeepSeek TTS officially supports `zh`, `yue`, `en`, `ja`, `ko`, `ms`, `ar`, `id`, `th`, `vi`. Russian is not official; Russian text is sent as-is by the user's choice and may sound imperfect.

### ASR behavior

The gateway sends base64 audio and MIME type to `/dsh-voice/transcribe`.

1. Audio is validated and measured with `ffprobe`.
2. It is converted to 16 kHz mono PCM WAV.
3. Audio longer than 110 seconds is split into chunks (each below DeepSeek's 120-second limit).
4. Each chunk is sent to DeepSeek ASR.
5. The transcript chunks are joined and returned to the gateway, which adds them to the agent prompt.

Default limit: 600 seconds per message. You can change `asrMaxDurationSeconds` and `asrChunkSeconds` in the bundle config.

### Quality

The selected OGG/Opus quality applies to the file this plugin sends to Telegram. Telegram may re-encode voice notes during delivery, so the delivered quality can differ.

| Setting | Encoder |
| --- | --- |
| 64–256 kbps | CBR, `libopus`, mono 48 kHz |
| Dynamic VBR | VBR target 256 kbps, `libopus`, mono 48 kHz |

### Statistics

The panel shows:

- ASR and TTS request counts.
- Total and per-request audio duration.
- Text characters and estimated tokens.
- Estimated cost using the configured rates.
- Latency and success rate.
- Quality, chunk count, transcript preview and errors.

DeepSeek does not return token usage for ASR/TTS. ASR is billed by audio seconds and TTS by characters. Token figures are a text estimate, not billing data. Defaults are the limited-time rates: ASR $0.058/hour, TTS $0.225/10,000 characters.

History and settings are stored in:

```text
$DSH_HOME/deepseek-speech/
```

They are outside the repository, mode 0600, and audio bytes are never stored.

### Security

- The DeepSeek key is written only through `ctx.credentials` as `DEEPSEEK_API_KEY`.
- The browser never receives the key back.
- History contains a short text preview, never the audio.
- The plugin never reads or copies the Telegram bot token.
- No `.env`, key files, history, tokens or credentials belong in Git. `.gitignore` excludes the common cases.
- `scripts/check-secrets.sh` scans the repository and never prints a matched value.

### Troubleshooting

| Problem | Fix |
| --- | --- |
| ASR route `conflict` | Remove `@goodandready/dsh-voice`, remove its stale profile row, restart DSH. |
| 401 from DeepSeek | Replace the API key in settings. |
| `ffmpeg`/`ffprobe` missing | Use **Install ffmpeg globally**, or run the shown `sudo apt-get` command. |
| Install says `root-required` | The DSH process has no passwordless sudo. Run the command manually as root. |
| Voice reply is silent | Check that the prompt asks for voice or the checkbox is on; check the panel error row; check the Telegram home. |
| Russian voice sounds wrong | DeepSeek TTS does not officially support Russian. Use text or a supported language. |
| Audio is too long | The default cap is 600 seconds; adjust `asrMaxDurationSeconds` in the bundle config. |
| Telegram voice note is re-encoded | Telegram may transcode voice; the setting controls the source OGG/Opus file. |

### Development

```bash
node --check index.js
node --check client.js
node --check lib/*.js
node --test test/*.test.mjs
bash scripts/check-secrets.sh
```

The plugin is plain ESM, has no build step, and is installed into a DSH profile as a local bundle.

---

<a id="русский"></a>
## Русский

DeepSeek речь связывает голосовые сообщения Telegram с API DeepSeek ASR/TTS внутри [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

- Входящее голосовое/аудио Telegram → `ffmpeg`/`ffprobe` → DeepSeek ASR → текст в промпте агента.
- Ответы ассистента → DeepSeek TTS → OGG/Opus → голосовое сообщение Telegram, но только если это попросили в промпте или включена галочка **«Всегда отвечать голосом»**.
- Панель в сайдбаре показывает длительность, символы, оценку токенов, стоимость, задержку, качество и историю.
- DeepSeek API key хранится в DSH credentials, а не в этом репозитории.

Репозиторий: <https://github.com/MatthewSmol/dsh-deepseek-speech>

### Возможности

- Распознавание голосовых Telegram через маршрут gateway `/dsh-voice/transcribe`.
- Длинное аудио режется на чанки примерно по 110 секунд перед DeepSeek ASR.
- Любой формат аудио Telegram конвертируется локально через `ffmpeg`; длительность определяется `ffprobe`.
- Качество TTS от 64 до 256 кбит CBR или Dynamic VBR.
- Триггеры в промпте и явная галочка «Всегда отвечать голосом»; автоматической озвучки только из-за голосового ввода нет.
- Двуязычные настройки и история (английский и русский).
- Проверка `ffmpeg`, `ffprobe`, `libopus` и кнопка глобальной установки, если их нет.
- API key, bot token и аудио не пишутся в репозиторий.

### Требования

- DSH Web с управляемым профилем и Telegram messenger gateway.
- Node.js 24+ (runtime DSH).
- `ffmpeg` и `ffprobe` с `libopus`.
- `@goodandready/dsh-voice` **должен быть удалён**: этот плагин занимает `/dsh-voice/transcribe`. Удалите также оставшуюся строку `dsh-voice` из профиля и перезапустите DSH.
- DeepSeek API key с доступом к ASR/TTS.

### Установка

#### Через Web UI (рекомендуется)

1. Откройте **Plugins** в сайдбаре DSH.
2. Выберите **Add plugin** → **Install a third-party plugin**.
3. Укажите одно из:
   - `https://github.com/MatthewSmol/dsh-deepseek-speech.git`
   - абсолютный путь к локальному клону.
4. Нажмите **Install**.
5. После установки нажмите **Enable now**.
6. Перезапустите DSH, если он попросил, или если маршрут ASR показывает конфликт.

#### Локальный клон

```bash
git clone https://github.com/MatthewSmol/dsh-deepseek-speech.git
```

Затем **Plugins → Add plugin → Install a third-party plugin** и укажите абсолютный путь к каталогу. Включите bundle и перезапустите DSH, если потребуется.

#### Через агента DSH

Агент может установить bundle инструментом `plugin_manager`:

- action: `install_bundle`
- target: Git URL или абсолютный локальный каталог
- проверьте `application` и `warnings`
- перезапустите DSH, если результат `restart-required`

Изменения профиля сохраняются и требуют подтверждения.

### Настройка в DSH

1. Откройте **Settings → DeepSeek speech** (или панель **DeepSeek speech** в сайдбаре → **Settings**).
2. Вставьте DeepSeek API key в поле **DeepSeek API key** и нажмите **Save**.
   - Значение сохраняется через DSH credentials как `DEEPSEEK_API_KEY`.
   - Браузер получает только «настроен / не настроен»; значение никогда не возвращается.
3. Проверьте **Dependencies**:
   - `ffmpeg`, `ffprobe`, `libopus` должны быть зелёными.
   - Если чего-то нет, нажмите **Install ffmpeg globally**. Host выполнит `sudo -n apt-get update && sudo -n apt-get install -y ffmpeg`. Пароль sudo не запрашивается и не принимается.
   - Если passwordless sudo недоступен, панель покажет точную команду:
     ```bash
     sudo apt-get update && sudo apt-get install -y ffmpeg
     ```
4. Выберите голос: **Клеопатра** (API id `stella`) или **Македонский** (API id `tide`).
5. Выберите **качество OGG/Opus**: 64, 96, 128, 160, 192, 256 кбит или **Dynamic VBR**.
6. Оставьте **«Всегда отвечать голосом»** выключенной, если не нужно озвучивать каждый ответ.
7. Проверьте **Telegram ASR route**:
   - `active` — готово.
   - `conflict` — маршрут `/dsh-voice/transcribe` занят; удалите `@goodandready/dsh-voice`, очистите строку в профиле и перезапустите DSH.
8. Отправьте голосовое боту. Текст должен попасть в промпт агента и появиться в истории панели.
9. Отправьте промпт «ответь голосом», чтобы проверить голосовой ответ.

Telegram gateway должен быть уже настроен со своим bot token. Этот плагин не читает и не копирует bot token.

### Голосовые ответы

Голос используется только если:

- в промпте явно попросили:
  - «ответь голосом»
  - «озвучь ответ»
  - «прочитай вслух»
  - «reply with voice»
  - «send voice»
  - «read aloud»
- **или** включена галочка **«Всегда отвечать голосом»**.

Отрицательные указания подавляют озвучку:

- «не озвучивай»
- «без голоса»
- «только текстом»
- «text only»
- «don’t speak»
- «no voice»

Плагин слушает только сессии с id, начинающимся на `msgw-`. Голосовое сообщение отправляется в Telegram home `default` (личка, настроенная в gateway). Веб-сессии автоматически не озвучиваются.

DeepSeek TTS официально поддерживает `zh`, `yue`, `en`, `ja`, `ko`, `ms`, `ar`, `id`, `th`, `vi`. Русский не официальный; по выбору пользователя русский текст отправляется как есть и может звучать неидеально.

### Как работает ASR

Gateway отправляет base64-аудио и MIME в `/dsh-voice/transcribe`.

1. Аудио проверяется и измеряется через `ffprobe`.
2. Конвертируется в 16 kHz mono PCM WAV.
3. Аудио длиннее 110 секунд режется на чанки (каждый ниже лимита DeepSeek 120 секунд).
4. Каждый чанк отправляется в DeepSeek ASR.
5. Тексты склеиваются и возвращаются gateway, который добавляет их в промпт агента.

Лимит по умолчанию: 600 секунд на сообщение. `asrMaxDurationSeconds` и `asrChunkSeconds` можно изменить в конфиге bundle.

### Качество

Выбранное качество OGG/Opus применяется к файлу, который плагин отправляет в Telegram. Telegram может перекодировать voice-note при доставке, поэтому итоговое качество может отличаться.

| Настройка | Кодирование |
| --- | --- |
| 64–256 кбит | CBR, `libopus`, mono 48 kHz |
| Dynamic VBR | VBR с целевыми 256 кбит, `libopus`, mono 48 kHz |

### Статистика

Панель показывает:

- количество запросов ASR и TTS;
- суммарную и индивидуальную длительность аудио;
- символы и оценку токенов;
- оценку стоимости по настроенным тарифам;
- задержку и success rate;
- качество, число чанков, превью текста и ошибки.

DeepSeek не возвращает token usage для ASR/TTS. ASR тарифицируется по секундам аудио, TTS — по символам. Токены — оценка по тексту, а не биллинг. По умолчанию взяты льготные тарифы: ASR $0.058/час, TTS $0.225/10 000 символов.

История и настройки хранятся в:

```text
$DSH_HOME/deepseek-speech/
```

Они вне репозитория, с правами 0600; аудио не сохраняется.

### Безопасность

- DeepSeek key записывается только через `ctx.credentials` как `DEEPSEEK_API_KEY`.
- Браузер никогда не получает ключ обратно.
- История содержит короткое текстовое превью, но не аудио.
- Плагин не читает и не копирует Telegram bot token.
- `.env`, ключи, история, токены и credentials не должны попадать в Git. `.gitignore` закрывает типовые случаи.
- `scripts/check-secrets.sh` сканирует репозиторий и не печатает найденные значения.

### Troubleshooting

| Проблема | Решение |
| --- | --- |
| ASR route `conflict` | Удалите `@goodandready/dsh-voice`, удалите его строку из профиля, перезапустите DSH. |
| 401 от DeepSeek | Замените API key в настройках. |
| Нет `ffmpeg`/`ffprobe` | Нажмите **Install ffmpeg globally** или выполните показанную команду `sudo apt-get`. |
| Установка пишет `root-required` | У процесса DSH нет passwordless sudo. Выполните команду вручную от root. |
| Голосовой ответ не приходит | Проверьте, что в промпте есть просьба или включена галочка; посмотрите ошибку в истории; проверьте Telegram home. |
| Русский голос звучит плохо | DeepSeek TTS официально не поддерживает русский. Используйте текст или поддерживаемый язык. |
| Аудио слишком длинное | Лимит по умолчанию 600 секунд; измените `asrMaxDurationSeconds` в конфиге bundle. |
| Telegram перекодировал voice | Telegram может перекодировать voice-note; настройка задаёт качество исходного OGG/Opus. |

### Разработка

```bash
node --check index.js
node --check client.js
node --check lib/*.js
node --test test/*.test.mjs
bash scripts/check-secrets.sh
```

Плагин — обычный ESM без сборки; устанавливается в профиль DSH как локальный bundle.
