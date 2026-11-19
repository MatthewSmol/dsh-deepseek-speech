# DeepSeek speech for DSH

[English](#english) | [Русский](#русский)

## English

A DSH plugin and MCP service for Telegram voice messages, DeepSeek ASR, Edge TTS and DeepSeek TTS.

- Incoming Telegram voice/audio → ffmpeg/ffprobe → DeepSeek ASR → text in the agent prompt.
- Assistant replies → Edge TTS (primary, Russian/English) → OGG/Opus → Telegram voice note, when the prompt asks for it or **Always reply with voice** is enabled.
- DeepSeek TTS is the automatic fallback if Edge fails.
- A sidebar panel shows duration, characters, estimated tokens, cost, latency, quality and provider.
- The settings page uses Tailwind CSS utilities scoped to `.dss-root` with DSH theme variables.
- An MCP Streamable HTTP server exposes the same speech service to DSH and external MCP clients.

Repository: <https://github.com/MatthewSmol/dsh-deepseek-speech>

### Features

- Telegram voice transcription through `/dsh-voice/transcribe`.
- Local ffmpeg conversion and chunking for long audio.
- Edge TTS primary: `ru-RU-DmitryNeural`, `ru-RU-SvetlanaNeural`, `en-US-GuyNeural`, `en-US-AriaNeural`.
- Automatic RU/EN language selection, with a manual override.
- DeepSeek TTS fallback.
- MCP tools: `transcribe_audio`, `synthesize_speech`, `speech_status`, `speech_stats`, `list_voices`.
- Dependency checks for ffmpeg, ffprobe, libopus and Edge/MCP packages.
- No API key, bot token or audio bytes are written to the repository.

### Requirements

- DSH Web with a managed profile and the Telegram messenger gateway.
- Node.js 24+.
- `ffmpeg` and `ffprobe` with `libopus`.
- `@goodandready/dsh-voice` must be removed: this plugin owns `/dsh-voice/transcribe`. Remove its stale profile row and restart DSH.
- DeepSeek API key for ASR and DeepSeek TTS fallback. Edge TTS does not need a key.
- Network access to `speech.platform.bing.com` for Edge TTS.

### Install

#### Web UI

1. Open **Plugins** in the DSH sidebar.
2. Select **Add plugin** → **Install a third-party plugin**.
3. Enter the Git URL `https://github.com/MatthewSmol/dsh-deepseek-speech.git` or an absolute path to a local clone.
4. Select **Install**, then **Enable now**.
5. Restart DSH if prompted, or if the ASR route reports a conflict.

#### Local clone

```bash
git clone https://github.com/MatthewSmol/dsh-deepseek-speech.git
cd dsh-deepseek-speech
pnpm install
```

Then install the directory from **Plugins → Add plugin → Install a third-party plugin**. `pnpm install` is required because Edge TTS and MCP are npm dependencies.

#### Through the DSH agent

Use `plugin_manager` with action `install_bundle`, target the Git URL or absolute directory path. Review `application` and `warnings`; restart if `restart-required`.

### Configure in DSH

1. Open **Settings → DeepSeek speech**.
2. Paste the DeepSeek API key and select **Save**. It is stored in DSH credentials as `DEEPSEEK_API_KEY`; the browser only sees configured/not configured.
3. Check **Dependencies**: ffmpeg, ffprobe, libopus, Edge package, MCP SDK. Missing ffmpeg can be installed with **Install ffmpeg globally** when passwordless sudo is available.
4. Choose a voice:
   - **Клеопатра** — RU `ru-RU-SvetlanaNeural`, EN `en-US-AriaNeural`;
   - **Македонский** — RU `ru-RU-DmitryNeural`, EN `en-US-GuyNeural`.
5. Choose **Edge language**: Auto, Russian, or English.
6. Choose **OGG/Opus quality**: 64, 96, 128, 160, 192, 256 kbps, or Dynamic VBR.
7. Keep **Edge TTS (primary)** enabled unless you want DeepSeek TTS directly.
8. Check the MCP card: endpoint `/deepseek-speech/mcp`, server name `deepseek_speech`, tools listed.
9. Check **Telegram ASR route**: `active` means ready. A `conflict` means another plugin owns the route; remove `dsh-voice` and restart DSH.
10. Send a voice message and a prompt such as “reply with voice”.

The Telegram gateway must already be configured with its bot token. This plugin does not read or copy that token.

### Voice replies

Voice is used only when:

- the prompt explicitly asks for it: “ответь голосом”, “озвучь ответ”, “прочитай вслух”, “reply with voice”, “send voice”, “read aloud”;
- **or** **Always reply with voice** is enabled.

Negative instructions suppress voice: “не озвучивай”, “без голоса”, “только текстом”, “text only”, “don’t speak”, “no voice”.

Only sessions whose id starts with `msgw-` are spoken. The voice note goes to the Telegram home `default` (private chat). Web sessions are not spoken automatically.

Edge TTS is an unofficial Microsoft Read Aloud endpoint:

- free and keyless;
- no SLA;
- may return 403 at any time;
- sends the reply text to Microsoft;
- falls back to DeepSeek TTS on failure.

DeepSeek TTS officially supports a limited language set; Russian is not official, so DeepSeek fallback for Russian may sound imperfect. Edge supports Russian and English voices.

### ASR

The gateway sends base64 audio and MIME type to `/dsh-voice/transcribe`.

1. ffprobe measures the audio.
2. ffmpeg converts it to 16 kHz mono PCM WAV.
3. Audio longer than 110 seconds is split into chunks below DeepSeek’s 120-second limit.
4. DeepSeek ASR transcribes each chunk.
5. Text chunks are joined and added to the agent prompt.

The default maximum is 600 seconds per message; `asrMaxDurationSeconds` and `asrChunkSeconds` can be changed in the bundle config.

### Edge TTS and quality

Edge source is 96 kbps MP3 (48 kbps fallback), converted locally to OGG/Opus. The final OGG quality is selected in settings; a higher final bitrate does not restore detail absent from the Edge source.

| Setting | Encoding |
| --- | --- |
| 64–256 kbps | CBR, libopus, mono 48 kHz |
| Dynamic VBR | VBR target 256 kbps, libopus, mono 48 kHz |

Telegram may re-encode voice notes during delivery; the setting controls the source OGG sent by the plugin.

### MCP service

The plugin exposes MCP Streamable HTTP at:

```text
http://127.0.0.1:3080/deepseek-speech/mcp
```

Server name in DSH: `deepseek_speech`. Tools appear as:

```text
mcp__deepseek_speech__transcribe_audio
mcp__deepseek_speech__synthesize_speech
mcp__deepseek_speech__speech_status
mcp__deepseek_speech__speech_stats
mcp__deepseek_speech__list_voices
```

The bundle adds a DSH MCP client row pointing at this endpoint. The endpoint is loopback-only; do not expose it to a LAN. `synthesize_speech` writes OGG to `$DSH_HOME/deepseek-speech/out/`; set `sendToTelegram: true` to deliver it immediately.

### Statistics

The panel shows ASR/TTS counts, audio duration, characters, estimated tokens, cost, latency, provider, language, quality, chunks, preview and errors.

DeepSeek does not return token usage for ASR/TTS. ASR is billed by audio seconds, TTS by characters. Token figures are a text estimate, not billing data. Edge TTS cost is zero. Defaults: ASR $0.058/hour, DeepSeek TTS $0.225/10,000 characters.

History/settings are stored in `$DSH_HOME/deepseek-speech/`, outside the repository, mode 0600. Audio bytes are not stored there, except explicitly synthesized MCP files under `out/`.

### Security and privacy

- The DeepSeek key is stored only through DSH credentials as `DEEPSEEK_API_KEY`.
- The browser never receives the key back.
- No secrets are written to the repository.
- The MCP endpoint and ASR route are loopback-only.
- Edge TTS sends reply text to Microsoft’s unofficial Read Aloud endpoint.
- `scripts/check-secrets.sh` scans the repository without printing matched values.

### Troubleshooting

| Problem | Fix |
| --- | --- |
| ASR route `conflict` | Remove `dsh-voice`, clean its profile row, restart DSH. |
| 401 from DeepSeek | Replace the API key in settings. |
| Edge 403/timeout | DeepSeek fallback should run; disable Edge TTS if it persists. |
| Edge package missing | Run `pnpm install` in the plugin directory and restart DSH. |
| MCP SDK missing | Run `pnpm install`; check the MCP card. |
| MCP tools absent | Restart DSH; confirm `http://127.0.0.1:3080/deepseek-speech/mcp` responds. |
| ffmpeg missing | Install ffmpeg globally or use the shown sudo command. |
| Russian DeepSeek voice sounds wrong | Use Edge for Russian, or text. |
| Voice note is re-encoded | Telegram may transcode voice; the setting applies to the source OGG. |

### TypeScript source and development

The authoritative source is TypeScript under `src/`; it has bilingual EN/RU comments. The runtime loads generated files from `dist/` and the compatibility entries `index.js`/`client.js`.

```bash
pnpm install
pnpm build       # Tailwind CSS + tsc host/client + compatibility entries
pnpm check       # type-check without emitting
pnpm test        # builds, then runs node:test
bash scripts/check-secrets.sh
```

- `src/index.ts` — plugin entry, stores, routes, voice listener.
- `src/lib/*.ts` — DeepSeek, Edge TTS, ffmpeg, ASR/TTS orchestration, MCP, storage, routing.
- `src/client.ts` — DSH Web sidebar/settings client (plain browser script; no imports/exports).
- `dist/` — generated JavaScript and `client.css` committed for DSH Git installs.
- `client.js`/`index.js` — generated compatibility entries for DSH's cached loader; do not edit by hand.

---

<a id="русский"></a>
## Русский

DSH-плагин и MCP-сервис для голосовых Telegram, DeepSeek ASR, Edge TTS и DeepSeek TTS.

- Входящее голосовое/аудио Telegram → ffmpeg/ffprobe → DeepSeek ASR → текст в промпте агента.
- Ответы ассистента → Edge TTS (основной, русский/английский) → OGG/Opus → голосовое Telegram, если это попросили в промпте или включена галочка **«Всегда отвечать голосом»**.
- DeepSeek TTS — автоматический fallback при сбое Edge.
- Панель в сайдбаре показывает длительность, символы, оценку токенов, стоимость, задержку, качество и провайдера.
- Страница настроек оформлена Tailwind CSS; утилиты ограничены `.dss-root` и используют переменные темы DSH.
- MCP Streamable HTTP сервер отдаёт тот же сервис DSH и внешним MCP-клиентам.

Репозиторий: <https://github.com/MatthewSmol/dsh-deepseek-speech>

### Возможности

- Распознавание голосовых Telegram через `/dsh-voice/transcribe`.
- Локальная конвертация ffmpeg и нарезка длинного аудио.
- Edge TTS основной: `ru-RU-DmitryNeural`, `ru-RU-SvetlanaNeural`, `en-US-GuyNeural`, `en-US-AriaNeural`.
- Автоопределение RU/EN с ручным выбором.
- DeepSeek TTS fallback.
- MCP tools: `transcribe_audio`, `synthesize_speech`, `speech_status`, `speech_stats`, `list_voices`.
- Проверка ffmpeg, ffprobe, libopus, Edge и MCP-пакетов.
- API key, bot token и аудио не пишутся в репозиторий.

### Требования

- DSH Web с управляемым профилем и Telegram messenger gateway.
- Node.js 24+.
- `ffmpeg` и `ffprobe` с `libopus`.
- `@goodandready/dsh-voice` должен быть удалён: плагин занимает `/dsh-voice/transcribe`. Удалите его строку из профиля и перезапустите DSH.
- DeepSeek API key для ASR и DeepSeek TTS fallback. Edge TTS ключ не нужен.
- Сеть до `speech.platform.bing.com` для Edge TTS.

### Установка

#### Web UI

1. Откройте **Plugins** в сайдбаре DSH.
2. Выберите **Add plugin** → **Install a third-party plugin**.
3. Укажите Git URL `https://github.com/MatthewSmol/dsh-deepseek-speech.git` или абсолютный путь к локальному клону.
4. Нажмите **Install**, затем **Enable now**.
5. Перезапустите DSH, если попросит или если маршрут ASR показывает конфликт.

#### Локальный клон

```bash
git clone https://github.com/MatthewSmol/dsh-deepseek-speech.git
cd dsh-deepseek-speech
pnpm install
```

Затем установите каталог через **Plugins → Add plugin → Install a third-party plugin**. `pnpm install` обязателен: Edge TTS и MCP — npm-зависимости.

#### Через агента DSH

`plugin_manager` → `install_bundle`, target — Git URL или абсолютный путь. Проверьте `application` и `warnings`; при `restart-required` перезапустите DSH.

### Настройка в DSH

1. Откройте **Settings → DeepSeek speech**.
2. Вставьте DeepSeek API key и нажмите **Save**. Он хранится в DSH credentials как `DEEPSEEK_API_KEY`; браузер видит только «настроен/не настроен».
3. Проверьте **Dependencies**: ffmpeg, ffprobe, libopus, Edge, MCP SDK. Если ffmpeg нет, доступна кнопка **Install ffmpeg globally** при наличии passwordless sudo.
4. Выберите голос:
   - **Клеопатра** — RU `ru-RU-SvetlanaNeural`, EN `en-US-AriaNeural`;
   - **Македонский** — RU `ru-RU-DmitryNeural`, EN `en-US-GuyNeural`.
5. Выберите **Edge language**: Auto, Русский или English.
6. Выберите **качество OGG/Opus**: 64, 96, 128, 160, 192, 256 кбит или Dynamic VBR.
7. Оставьте **Edge TTS (primary)** включённым, если не нужен сразу DeepSeek TTS.
8. Проверьте карточку MCP: endpoint `/deepseek-speech/mcp`, server name `deepseek_speech`, список tools.
9. Проверьте **Telegram ASR route**: `active` — готово. `conflict` — маршрут занят; удалите `dsh-voice` и перезапустите DSH.
10. Отправьте голосовое и промпт вроде «ответь голосом».

Telegram gateway должен быть уже настроен со своим bot token. Плагин не читает и не копирует его.

### Голосовые ответы

Голос используется только если:

- в промпте явно попросили: «ответь голосом», «озвучь ответ», «прочитай вслух», «reply with voice», «send voice», «read aloud»;
- **или** включена галочка **«Всегда отвечать голосом»**.

Отрицания подавляют озвучку: «не озвучивай», «без голоса», «только текстом», «text only», «don’t speak», «no voice».

Озвучиваются только сессии с id, начинающимся на `msgw-`. Голос уходит в Telegram home `default` (личка). Веб-сессии автоматически не озвучиваются.

Edge TTS — неофициальный Microsoft Read Aloud endpoint:

- бесплатный, без ключа;
- без SLA;
- может вернуть 403 в любой момент;
- отправляет текст ответа в Microsoft;
- при сбое переключается на DeepSeek TTS.

DeepSeek TTS официально поддерживает ограниченный набор языков; русский не официальный, поэтому fallback на русском может звучать неидеально. Edge поддерживает русские и английские голоса.

### ASR

Gateway отправляет base64-аудио и MIME в `/dsh-voice/transcribe`.

1. ffprobe измеряет аудио.
2. ffmpeg конвертирует в 16 kHz mono PCM WAV.
3. Аудио длиннее 110 секунд режется на чанки ниже лимита DeepSeek 120 секунд.
4. DeepSeek ASR распознаёт каждый чанк.
5. Тексты склеиваются и попадают в промпт агента.

Лимит по умолчанию — 600 секунд на сообщение; `asrMaxDurationSeconds` и `asrChunkSeconds` меняются в конфиге bundle.

### Edge TTS и качество

Источник Edge — MP3 96 кбит (fallback 48), затем локальная конвертация в OGG/Opus. Финальное качество выбирается в настройках; высокий финальный битрейт не восстанавливает детали, которых нет в источнике.

| Настройка | Кодирование |
| --- | --- |
| 64–256 кбит | CBR, libopus, mono 48 kHz |
| Dynamic VBR | VBR target 256 кбит, libopus, mono 48 kHz |

Telegram может перекодировать voice-note при доставке; настройка задаёт исходный OGG.

### MCP-сервис

MCP Streamable HTTP:

```text
http://127.0.0.1:3080/deepseek-speech/mcp
```

Server name в DSH: `deepseek_speech`. Инструменты:

```text
mcp__deepseek_speech__transcribe_audio
mcp__deepseek_speech__synthesize_speech
mcp__deepseek_speech__speech_status
mcp__deepseek_speech__speech_stats
mcp__deepseek_speech__list_voices
```

Bundle добавляет DSH MCP client row на этот endpoint. Endpoint доступен только с loopback; не публикуйте его в LAN. `synthesize_speech` сохраняет OGG в `$DSH_HOME/deepseek-speech/out/`; `sendToTelegram: true` сразу отправляет голос.

### Статистика

Панель показывает количество ASR/TTS, длительность, символы, оценку токенов, стоимость, задержку, провайдера, язык, качество, чанки, превью и ошибки.

DeepSeek не возвращает token usage для ASR/TTS. ASR тарифицируется по секундам, TTS по символам. Токены — оценка, не биллинг. Edge TTS бесплатен. По умолчанию: ASR $0.058/час, DeepSeek TTS $0.225/10 000 символов.

История и настройки — в `$DSH_HOME/deepseek-speech/`, вне репозитория, права 0600. Аудио там не хранится, кроме явно синтезированных MCP-файлов в `out/`.

### Безопасность и приватность

- DeepSeek key хранится только в DSH credentials как `DEEPSEEK_API_KEY`.
- Браузер никогда не получает ключ обратно.
- Секреты не пишутся в репозиторий.
- MCP endpoint и ASR route доступны только с loopback.
- Edge TTS отправляет текст в неофициальный Microsoft Read Aloud endpoint.
- `scripts/check-secrets.sh` сканирует репозиторий, не печатая значения.

### Troubleshooting

| Проблема | Решение |
| --- | --- |
| ASR route `conflict` | Удалите `dsh-voice`, очистите строку профиля, перезапустите DSH. |
| 401 от DeepSeek | Замените API key в настройках. |
| Edge 403/timeout | Должен сработать DeepSeek fallback; при постоянной ошибке отключите Edge. |
| Пакет Edge отсутствует | Выполните `pnpm install` в каталоге плагина и перезапустите DSH. |
| MCP SDK отсутствует | `pnpm install`; проверьте карточку MCP. |
| MCP tools не появились | Перезапустите DSH; проверьте ответ `http://127.0.0.1:3080/deepseek-speech/mcp`. |
| Нет ffmpeg | Установите глобально или выполните показанную sudo-команду. |
| Русский DeepSeek-голос плохой | Используйте Edge для русского или текст. |
| Telegram перекодировал voice | Это нормально; настройка задаёт исходный OGG. |

### Исходники TypeScript и разработка

Основной код — TypeScript в `src/` с подробными комментариями на английском и русском. Runtime загружает сгенерированные файлы из `dist/`, а также compatibility-точки `index.js`/`client.js`.

```bash
pnpm install
pnpm build       # Tailwind CSS + tsc host/client + compatibility-точки
pnpm check       # проверка типов без записи
pnpm test        # сборка и запуск node:test
bash scripts/check-secrets.sh
```

- `src/index.ts` — вход плагина, хранилища, маршруты, слушатель голоса.
- `src/lib/*.ts` — DeepSeek, Edge TTS, ffmpeg, оркестрация ASR/TTS, MCP, хранение, маршрутизация.
- `src/client.ts` — клиент сайдбара/настроек DSH Web (обычный браузерный скрипт без import/export).
- `dist/` — сгенерированный JavaScript и `client.css`, закоммичены для Git-установки DSH.
- `client.js`/`index.js` — сгенерированные compatibility-точки для кэшированного загрузчика DSH; вручную не редактировать.
