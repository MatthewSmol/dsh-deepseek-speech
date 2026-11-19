window.__ModuleLoader__.load({
    id: '@local/dsh-deepseek-speech',
    factory(require) {
        const React = require('react');
        const h = React.createElement;
        const NS = 'deepseek-speech';
        const PANEL_ID = 'deepseek-speech';
        /**
         * EN: Tailwind design tokens for the settings page. The classes are scoped
         * by the CSS build (`important: '.dss-root'`) and use DSH theme variables.
         * RU: Tailwind-токены дизайна страницы настроек. Классы ограничены CSS-сборкой
         * (`important: '.dss-root'`) и используют переменные темы DSH.
         */
        const TW = {
            card: 'dss-rounded-2xl dss-border dss-border-[var(--dsw-alias-border-l2)] dss-bg-[var(--dsw-alias-bg-layer-1)] dss-p-5 dss-shadow-sm dss-space-y-3',
            title: 'dss-text-sm dss-font-semibold dss-leading-5 dss-text-[var(--dsw-alias-label-primary)]',
            hint: 'dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-label-secondary)]',
            label: 'dss-block dss-text-xs dss-font-medium dss-leading-5 dss-text-[var(--dsw-alias-label-secondary)]',
            input: 'dss-w-full dss-rounded-lg dss-border dss-border-[var(--dsw-alias-border-l2)] dss-bg-[var(--dsw-alias-bg-layer-2)] dss-px-3 dss-py-2 dss-text-sm dss-text-[var(--dsw-alias-label-primary)] dss-outline-none focus:dss-ring-2 focus:dss-ring-[var(--dsw-alias-brand-primary)]',
            select: 'dss-w-full dss-rounded-lg dss-border dss-border-[var(--dsw-alias-border-l2)] dss-bg-[var(--dsw-alias-bg-layer-2)] dss-px-3 dss-py-2 dss-text-sm dss-text-[var(--dsw-alias-label-primary)] dss-outline-none focus:dss-ring-2 focus:dss-ring-[var(--dsw-alias-brand-primary)]',
            button: 'dss-inline-flex dss-items-center dss-justify-center dss-rounded-lg dss-px-3 dss-py-2 dss-text-xs dss-font-medium dss-leading-5 dss-transition disabled:dss-cursor-not-allowed disabled:dss-opacity-50',
            primary: 'dss-bg-[var(--dsw-alias-brand-primary)] dss-text-[var(--dsw-alias-bg-base)] hover:dss-opacity-90',
            secondary: 'dss-border dss-border-[var(--dsw-alias-border-l2)] dss-bg-[var(--dsw-alias-bg-layer-2)] dss-text-[var(--dsw-alias-label-primary)] hover:dss-bg-[var(--dsw-alias-bg-layer-3)]',
            check: 'dss-flex dss-items-start dss-gap-2.5 dss-rounded-lg dss-border dss-border-[var(--dsw-alias-border-l2)] dss-bg-[var(--dsw-alias-bg-layer-2)] dss-p-3',
            checkbox: 'dss-mt-0.5 dss-h-4 dss-w-4 dss-shrink-0 dss-accent-[var(--dsw-alias-brand-primary)]',
        };
        const en = {
            nav: 'DeepSeek speech',
            title: 'DeepSeek speech',
            subtitle: 'Telegram voice transcription and spoken replies powered by DeepSeek ASR and TTS.',
            history: 'History',
            settings: 'Settings',
            refresh: 'Refresh',
            loading: 'Loading…',
            empty: 'No speech requests yet.',
            asr: 'ASR',
            tts: 'TTS',
            all: 'All',
            voiceReplies: 'Voice replies',
            time: 'Time',
            source: 'Source',
            duration: 'Duration',
            chars: 'Chars',
            tokens: '≈ tokens',
            cost: 'Cost',
            latency: 'Latency',
            kind: 'Kind',
            quality: 'Quality',
            status: 'Status',
            recognized: 'Recognized',
            synthesized: 'Synthesized',
            totalAudio: 'Audio total',
            avgLatency: 'Avg latency',
            successRate: 'Success',
            requests: 'requests',
            sourceTelegram: 'Telegram',
            sourceDictation: 'Dictation',
            sourceReply: 'Voice reply',
            sourcePreview: 'Preview',
            ok: 'OK',
            error: 'Error',
            skipped: 'Skipped',
            apiKey: 'DeepSeek API key',
            apiKeyHint: 'Stored in DSH credentials, never written to the repository or returned to the browser.',
            configured: 'Configured',
            notConfigured: 'Not configured',
            keySource: 'source',
            save: 'Save',
            delete: 'Delete',
            saveSettings: 'Save settings',
            saved: 'Settings saved',
            alwaysVoice: 'Always reply with voice',
            alwaysVoiceHint: 'When off, voice is used only when the prompt explicitly asks for it.',
            voice: 'Voice',
            voiceStella: 'Клеопатра',
            voiceTide: 'Македонский',
            qualityLabel: 'OGG/Opus quality',
            maxChars: 'Max spoken characters',
            telegramHome: 'Telegram home',
            dependencies: 'Dependencies',
            ffmpeg: 'ffmpeg',
            ffprobe: 'ffprobe',
            libopus: 'libopus',
            found: 'found',
            missing: 'missing',
            check: 'Check again',
            install: 'Install ffmpeg globally',
            installing: 'Installing…',
            rootRequired: 'Root is required',
            rootHint: 'Passwordless sudo is unavailable. Run this command in a terminal:',
            copy: 'Copy command',
            copied: 'Copied',
            route: 'Telegram ASR route',
            routeActive: 'active',
            routeConflict: 'conflict',
            routeInactive: 'inactive',
            routeHint: 'The gateway calls /dsh-voice/transcribe. If it is occupied, remove dsh-voice and restart DSH.',
            russianWarning: 'DeepSeek TTS does not officially support Russian. Russian text is sent as-is by your choice; pronunciation may be imperfect.',
            clearHistory: 'Clear history',
            confirmClear: 'Delete all speech history?',
            confirmDeleteKey: 'Remove the stored DeepSeek API key?',
            edgePrimary: 'Edge TTS (primary, free, unofficial)',
            edgeHint: 'Edge uses Microsoft Read Aloud: no key, no SLA, may return 403. DeepSeek TTS is the automatic fallback.',
            edgeLanguage: 'Edge language',
            edgeAuto: 'Auto (RU/EN)',
            edgeRu: 'Russian',
            edgeEn: 'English',
            edgeAvailable: 'Edge TTS available',
            edgeMissing: 'Edge TTS package missing',
            mcpService: 'MCP service',
            mcpEndpoint: 'MCP endpoint',
            mcpTools: 'Tools',
            mcpReady: 'MCP SDK available',
            mcpMissing: 'MCP SDK missing',
            provider: 'Provider',
            edge: 'Edge',
            deepseek: 'DeepSeek',
            copyEndpoint: 'Copy endpoint',
            fallback: 'fallback',
            sourceMcp: 'MCP',
            sourceMcpTelegram: 'MCP → Telegram',
            testVoice: 'Play a sample',
            playing: 'Playing sample…',
            sample: 'Hello. This is a DeepSeek speech test.',
            tokensNote: 'Token figures are estimates: DeepSeek bills ASR by audio seconds and TTS by characters. No API token usage is returned.',
            ratesNote: 'Costs use the configured limited-time rates: ASR $0.058/hour, TTS $0.225/10k characters.',
            historyNote: 'History is stored outside the repository in DSH_HOME/deepseek-speech. Audio bytes are never stored.',
            preview: 'Preview',
            noError: 'No API key is configured.',
            clear: 'Clear',
            close: 'Close',
            dynamic: 'Dynamic VBR',
            bitrate: 'bitrate',
            chunks: 'chunks',
            settingsUnavailable: 'Settings are unavailable until the host route is ready.',
            refreshFailed: 'Refresh failed',
            operationFailed: 'Operation failed',
        };
        const ru = {
            nav: 'DeepSeek речь',
            title: 'DeepSeek речь',
            subtitle: 'Распознавание голосовых Telegram и голосовые ответы через DeepSeek ASR/TTS.',
            history: 'История',
            settings: 'Настройки',
            refresh: 'Обновить',
            loading: 'Загрузка…',
            empty: 'Запросов пока нет.',
            asr: 'ASR',
            tts: 'TTS',
            all: 'Все',
            voiceReplies: 'Голосовые ответы',
            time: 'Время',
            source: 'Источник',
            duration: 'Длительность',
            chars: 'Символы',
            tokens: '≈ токены',
            cost: 'Стоимость',
            latency: 'Задержка',
            kind: 'Тип',
            quality: 'Качество',
            status: 'Статус',
            recognized: 'Распознано',
            synthesized: 'Синтезировано',
            totalAudio: 'Всего аудио',
            avgLatency: 'Средняя задержка',
            successRate: 'Успешно',
            requests: 'запросов',
            sourceTelegram: 'Telegram',
            sourceDictation: 'Диктовка',
            sourceReply: 'Голосовой ответ',
            sourcePreview: 'Пример',
            ok: 'OK',
            error: 'Ошибка',
            skipped: 'Пропущено',
            apiKey: 'DeepSeek API key',
            apiKeyHint: 'Хранится в DSH credentials; никогда не пишется в репозиторий и не возвращается в браузер.',
            configured: 'Настроен',
            notConfigured: 'Не настроен',
            keySource: 'источник',
            save: 'Сохранить',
            delete: 'Удалить',
            saveSettings: 'Сохранить настройки',
            saved: 'Настройки сохранены',
            alwaysVoice: 'Всегда отвечать голосом',
            alwaysVoiceHint: 'Если выключено, голос используется только по прямой просьбе в промпте.',
            voice: 'Голос',
            voiceStella: 'Клеопатра',
            voiceTide: 'Македонский',
            qualityLabel: 'Качество OGG/Opus',
            maxChars: 'Максимум символов для озвучки',
            telegramHome: 'Telegram home',
            dependencies: 'Зависимости',
            ffmpeg: 'ffmpeg',
            ffprobe: 'ffprobe',
            libopus: 'libopus',
            found: 'найден',
            missing: 'не найден',
            check: 'Проверить снова',
            install: 'Установить ffmpeg глобально',
            installing: 'Установка…',
            rootRequired: 'Нужен root',
            rootHint: 'Passwordless sudo недоступен. Выполните команду в терминале:',
            copy: 'Скопировать команду',
            copied: 'Скопировано',
            route: 'Маршрут ASR для Telegram',
            routeActive: 'активен',
            routeConflict: 'конфликт',
            routeInactive: 'неактивен',
            routeHint: 'Gateway вызывает /dsh-voice/transcribe. Если маршрут занят, удалите dsh-voice и перезапустите DSH.',
            russianWarning: 'DeepSeek TTS официально не поддерживает русский. По вашему выбору русский текст отправляется как есть; произношение может быть неидеальным.',
            clearHistory: 'Очистить историю',
            confirmClear: 'Удалить всю историю речи?',
            confirmDeleteKey: 'Удалить сохранённый DeepSeek API key?',
            edgePrimary: 'Edge TTS (основной, бесплатный, неофициальный)',
            edgeHint: 'Edge использует Microsoft Read Aloud: без ключа и SLA, возможен 403. DeepSeek TTS — автоматический fallback.',
            edgeLanguage: 'Язык Edge',
            edgeAuto: 'Авто (RU/EN)',
            edgeRu: 'Русский',
            edgeEn: 'English',
            edgeAvailable: 'Edge TTS доступен',
            edgeMissing: 'Пакет Edge TTS не установлен',
            mcpService: 'MCP-сервис',
            mcpEndpoint: 'MCP endpoint',
            mcpTools: 'Инструменты',
            mcpReady: 'MCP SDK доступен',
            mcpMissing: 'MCP SDK не установлен',
            provider: 'Провайдер',
            edge: 'Edge',
            deepseek: 'DeepSeek',
            copyEndpoint: 'Скопировать endpoint',
            fallback: 'fallback',
            sourceMcp: 'MCP',
            sourceMcpTelegram: 'MCP → Telegram',
            testVoice: 'Прослушать пример',
            playing: 'Проигрывание примера…',
            sample: 'Привет. Это проверка DeepSeek речи.',
            tokensNote: 'Токены — оценка: DeepSeek тарифицирует ASR по секундам аудио, TTS по символам. API не возвращает token usage.',
            ratesNote: 'Стоимость по текущим льготным тарифам: ASR $0.058/час, TTS $0.225/10k символов.',
            historyNote: 'История хранится вне репозитория в DSH_HOME/deepseek-speech. Аудио не сохраняется.',
            preview: 'Превью',
            noError: 'API key не настроен.',
            clear: 'Очистить',
            close: 'Закрыть',
            dynamic: 'Динамическое VBR',
            bitrate: 'битрейт',
            chunks: 'чанков',
            settingsUnavailable: 'Настройки недоступны, пока host-маршрут не готов.',
            refreshFailed: 'Ошибка обновления',
            operationFailed: 'Ошибка операции',
        };
        const CSS = `
      .dss-root { box-sizing: border-box; height: 100%; overflow: auto; padding: 24px 28px 60px; color: var(--dsw-alias-label-primary); font: inherit; }
      .dss-wrap { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
      .dss-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .dss-title { margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; }
      .dss-sub { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; max-width: 720px; }
      .dss-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .dss-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .dss-tab { border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; cursor: pointer; padding: 9px 12px; border-bottom: 2px solid transparent; }
      .dss-tab[data-active=true] { color: var(--dsw-alias-label-primary); border-bottom-color: var(--dsw-alias-brand-primary); }
      .dss-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
      .dss-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 12px 14px; min-width: 0; }
      .dss-card-label { color: var(--dsw-alias-label-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
      .dss-card-value { margin-top: 4px; font-size: 18px; line-height: 24px; font-variant-numeric: tabular-nums; }
      .dss-card-note { color: var(--dsw-alias-label-secondary); font-size: 11px; margin-top: 2px; }
      .dss-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
      .dss-filters { display: flex; gap: 4px; }
      .dss-btn { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 7px; min-height: 30px; padding: 4px 11px; font: inherit; font-size: 12.5px; cursor: pointer; }
      .dss-btn:hover { background: var(--dsw-alias-bg-layer-2); }
      .dss-btn:disabled { opacity: .55; cursor: default; }
      .dss-btn[data-kind=primary] { background: var(--dsw-alias-brand-primary); border-color: transparent; color: var(--dsw-alias-bg-base); }
      .dss-btn[data-kind=danger] { color: var(--dsw-alias-state-error-primary); }
      .dss-btn[data-kind=small] { min-height: 24px; padding: 2px 8px; font-size: 11.5px; }
      .dss-input, .dss-select { box-sizing: border-box; width: 100%; min-height: 34px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 5px 9px; font: inherit; font-size: 13px; }
      .dss-input:focus, .dss-select:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 0; }
      .dss-field { display: flex; flex-direction: column; gap: 5px; margin: 0 0 14px; }
      .dss-field > label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .dss-hint { color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 17px; }
      .dss-row { display: grid; grid-template-columns: 90px 1fr auto; gap: 10px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .dss-row:last-child { border-bottom: 0; }
      .dss-badge { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; padding: 1px 7px; font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .dss-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); flex: none; }
      .dss-dot[data-tone=ok] { background: var(--dsw-alias-state-success-primary); }
      .dss-dot[data-tone=error] { background: var(--dsw-alias-state-error-primary); }
      .dss-dot[data-tone=warn] { background: var(--dsw-alias-state-warn-primary); }
      .dss-history { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; overflow: hidden; background: var(--dsw-alias-bg-layer-1); }
      .dss-hist-head, .dss-hist-row { display: grid; grid-template-columns: 132px 70px 120px 82px 76px 74px 70px 76px 1fr; gap: 8px; align-items: center; padding: 8px 12px; font-size: 11.5px; }
      .dss-hist-head { color: var(--dsw-alias-label-secondary); border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
      .dss-hist-row { border-bottom: 1px solid var(--dsw-alias-border-l1); font-variant-numeric: tabular-nums; }
      .dss-hist-row:last-child { border-bottom: 0; }
      .dss-mono { font-family: var(--ds-font-family-code); }
      .dss-cell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dss-preview { grid-column: 1 / -1; color: var(--dsw-alias-label-secondary); font-size: 11.5px; white-space: normal; overflow-wrap: anywhere; padding-top: 2px; }
      .dss-empty { padding: 28px 16px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 13px; }
      .dss-card-section { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 16px; }
      .dss-card-section h3 { margin: 0 0 4px; font-size: 14px; line-height: 20px; }
      .dss-card-section p { margin: 0 0 12px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
      .dss-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .dss-inline > .dss-input { flex: 1 1 260px; width: auto; }
      .dss-check { display: flex; align-items: flex-start; gap: 9px; cursor: pointer; }
      .dss-check input { margin-top: 3px; accent-color: var(--dsw-alias-brand-primary); }
      .dss-check span { display: flex; flex-direction: column; gap: 2px; }
      .dss-check strong { font-size: 13px; font-weight: 500; }
      .dss-warn { color: var(--dsw-alias-state-warn-primary); font-size: 12px; line-height: 18px; }
      .dss-err { color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; overflow-wrap: anywhere; }
      .dss-ok { color: var(--dsw-alias-state-success-primary); font-size: 12px; line-height: 18px; }
      .dss-pre { margin: 8px 0 0; padding: 8px 10px; border-radius: 7px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-family: var(--ds-font-family-code); font-size: 11.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
      .dss-foot { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }
      .dss-grow { flex: 1 1 auto; }
      @media (max-width: 860px) {
        .dss-hist-head { display: none; }
        .dss-hist-row { grid-template-columns: 1fr 1fr; gap: 4px 10px; padding: 10px 12px; }
        .dss-hist-row .dss-cell::before { content: attr(data-label); color: var(--dsw-alias-label-secondary); display: inline; margin-right: 5px; }
        .dss-preview { grid-column: 1 / -1; }
      }
    `;
        // Small JSON client. / Небольшой JSON-клиент для host-роутов плагина.
        function api(path, options = {}) {
            const init = { ...(options || {}) };
            init.headers = { 'content-type': 'application/json', ...(init.headers || {}) };
            return fetch(path, init).then(async (res) => {
                let data = {};
                try {
                    data = await res.json();
                }
                catch { /* no body / нет тела */ }
                if (!res.ok || data?.ok === false) {
                    const err = new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
                    err.data = data;
                    err.status = res.status;
                    throw err;
                }
                return data;
            });
        }
        function fmtDuration(ms) {
            const n = Number(ms) || 0;
            if (!n)
                return '—';
            if (n < 60000)
                return `${(n / 1000).toFixed(1)}s`;
            const total = Math.round(n / 1000);
            const m = Math.floor(total / 60);
            const s = total % 60;
            return `${m}:${String(s).padStart(2, '0')}`;
        }
        function fmtUsd(value) {
            const n = Number(value) || 0;
            if (!n)
                return '$0';
            if (n < 0.00001)
                return '<$0.00001';
            return `$${n.toFixed(5)}`;
        }
        function fmtDate(value) {
            try {
                return new Date(Number(value)).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            }
            catch {
                return '—';
            }
        }
        function qualityText(value, tt) {
            if (value === 'dynamic')
                return tt('dynamic');
            return `${value || '64'} kbps`;
        }
        function sourceText(source, tt) {
            if (source === 'telegram')
                return tt('sourceTelegram');
            if (source === 'dictation')
                return tt('sourceDictation');
            if (source === 'telegram-reply')
                return tt('sourceReply');
            if (source === 'preview')
                return tt('sourcePreview');
            if (source === 'mcp')
                return tt('sourceMcp');
            if (source === 'mcp-telegram')
                return tt('sourceMcpTelegram');
            return source || '—';
        }
        function providerText(entry, tt) {
            if (entry.kind !== 'tts')
                return '—';
            const name = entry.provider === 'edge' ? tt('edge') : (entry.provider === 'deepseek' ? tt('deepseek') : '—');
            const lang = entry.language ? ` ${entry.language.toUpperCase()}` : '';
            const quality = qualityText(entry.quality, tt);
            const failed = entry.fallbackFrom ? ` (${tt('fallback')})` : '';
            return `${name}${lang} · ${quality}${failed}`;
        }
        function Icon({ size = 18, active = false }) {
            return h('svg', {
                viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': true,
                style: { display: 'block', color: active ? 'var(--dsw-alias-brand-primary)' : 'currentColor' },
            }, h('rect', { x: 4, y: 4, width: 56, height: 56, rx: 16, fill: 'currentColor', opacity: 0.1 }), h('path', { d: 'M16 22a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H29l-8 7v-7a6 6 0 0 1-5-6Z', fill: 'currentColor' }), h('g', { fill: 'var(--dsw-alias-bg-base)' }, h('rect', { x: 22, y: 24, width: 3, height: 8, rx: 1.5 }), h('rect', { x: 28, y: 21, width: 3, height: 14, rx: 1.5 }), h('rect', { x: 34, y: 23, width: 3, height: 10, rx: 1.5 }), h('rect', { x: 40, y: 25, width: 3, height: 6, rx: 1.5 })));
        }
        /**
         * EN: Small presentational card used by the sidebar stats block.
         * RU: Небольшая карточка для блока статистики в сайдбаре.
         */
        function StatCard({ label, value, note }) {
            return h('div', { className: 'dss-card' }, h('div', { className: 'dss-card-label' }, label), h('div', { className: 'dss-card-value' }, value), note ? h('div', { className: 'dss-card-note' }, note) : null);
        }
        /**
         * EN: Label/hint wrapper for settings controls.
         * RU: Обёртка label/hint для контролов настроек.
         */
        function Field({ label, hint, children }) {
            return h('div', { className: 'dss-space-y-1.5' }, h('label', { className: TW.label }, label), children, hint ? h('div', { className: TW.hint }, hint) : null);
        }
        function App(props) {
            const surface = props.surface || 'main';
            const t = props.t || ((key) => key);
            const [status, setStatus] = React.useState(null);
            const [history, setHistory] = React.useState(null);
            const [tab, setTab] = React.useState(surface === 'settings' ? 'settings' : 'history');
            const [filter, setFilter] = React.useState('all');
            const [error, setError] = React.useState('');
            const [notice, setNotice] = React.useState('');
            const [busy, setBusy] = React.useState('');
            const [keyDraft, setKeyDraft] = React.useState('');
            const [form, setForm] = React.useState(null);
            const [installInfo, setInstallInfo] = React.useState(null);
            const load = React.useCallback(async () => {
                try {
                    const [nextStatus, nextHistory] = await Promise.all([
                        api('/deepseek-speech/status', { method: 'GET' }),
                        api('/deepseek-speech/history?limit=100', { method: 'GET' }),
                    ]);
                    setStatus(nextStatus);
                    setHistory(nextHistory);
                    setError('');
                }
                catch (err) {
                    setError(err.message || t('refreshFailed'));
                }
            }, [t]);
            // EN: Poll the host so key/deps/route/history stay fresh.
            // RU: Опрашиваем host, чтобы ключ/зависимости/маршрут/история были свежими.
            React.useEffect(() => {
                let alive = true;
                const run = () => { if (alive)
                    load(); };
                run();
                const timer = setInterval(run, 3000);
                return () => { alive = false; clearInterval(timer); };
            }, [load]);
            React.useEffect(() => {
                if (status?.settings && form === null)
                    setForm(status.settings);
            }, [status, form]);
            const run = async (name, fn) => {
                setBusy(name);
                setError('');
                setNotice('');
                try {
                    await fn();
                }
                catch (err) {
                    setError(err?.message || t('operationFailed'));
                    if (err?.data)
                        setInstallInfo(err.data);
                }
                finally {
                    setBusy('');
                }
            };
            const saveKey = () => run('key', async () => {
                if (!keyDraft.trim())
                    throw new Error(t('apiKeyHint'));
                await api('/deepseek-speech/key', { method: 'POST', body: JSON.stringify({ apiKey: keyDraft }) });
                setKeyDraft('');
                setNotice(t('saved'));
                await load();
            });
            const deleteKey = () => {
                if (!window.confirm(t('confirmDeleteKey')))
                    return;
                return run('key', async () => {
                    await api('/deepseek-speech/key', { method: 'DELETE' });
                    setNotice(t('saved'));
                    await load();
                });
            };
            // EN: Save only the form; the host validates/clamps every field.
            // RU: Сохраняем только форму; host валидирует и ограничивает каждое поле.
            const saveForm = () => run('settings', async () => {
                if (!form)
                    return;
                const data = await api('/deepseek-speech/settings', { method: 'POST', body: JSON.stringify(form) });
                setForm(data.settings);
                setNotice(t('saved'));
                await load();
            });
            const checkDeps = () => run('check', async () => {
                const data = await api('/deepseek-speech/tools/check', { method: 'POST' });
                setNotice(data.deps?.ok ? t('found') : t('missing'));
                await load();
            });
            const installFfmpeg = () => run('install', async () => {
                setInstallInfo(null);
                try {
                    const data = await api('/deepseek-speech/tools/install', { method: 'POST' });
                    setNotice(t('ok'));
                    await load();
                }
                catch (err) {
                    if (err?.data)
                        setInstallInfo(err.data);
                    throw err;
                }
            });
            const clearHistory = () => {
                if (!window.confirm(t('confirmClear')))
                    return;
                return run('clear', async () => {
                    await api('/deepseek-speech/history/clear', { method: 'POST' });
                    await load();
                });
            };
            const testVoice = () => run('test', async () => {
                const data = await api('/deepseek-speech/tts/preview', {
                    method: 'POST',
                    body: JSON.stringify({
                        text: t('sample'),
                        voiceId: form?.voiceId || status?.settings?.voiceId || 'stella',
                        ttsQuality: form?.ttsQuality || status?.settings?.ttsQuality || '64',
                        edgeEnabled: form?.edgeEnabled,
                        edgeLanguage: form?.edgeLanguage,
                    }),
                });
                const binary = atob(data.audioBase64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1)
                    bytes[i] = binary.charCodeAt(i);
                const url = URL.createObjectURL(new Blob([bytes], { type: data.mime || 'audio/ogg' }));
                try {
                    const audio = new Audio(url);
                    await audio.play();
                }
                catch {
                    /* autoplay may be blocked; the file is still valid */
                }
                setTimeout(() => URL.revokeObjectURL(url), 60000);
                setNotice(`${t('playing')} ${fmtDuration(data.durationMs)}`);
            });
            const copyCommand = async (command) => {
                try {
                    await navigator.clipboard.writeText(command);
                    setNotice(t('copied'));
                }
                catch {
                    setNotice(command);
                }
            };
            // EN: Filtering is client-side; history is already bounded by the host.
            // RU: Фильтрация на клиенте; история уже ограничена host-ом.
            const entries = (history?.entries || []).filter((entry) => filter === 'all' || entry.kind === filter);
            const totals = history?.totals || status?.totals || {};
            const deps = status?.deps;
            const route = status?.route;
            const keyState = status?.key;
            const settings = form || status?.settings || {};
            const edge = status?.edge;
            const mcp = status?.mcp;
            const header = h('div', { className: 'dss-head' }, h('div', null, h('h1', { className: 'dss-title' }, t('title')), h('p', { className: 'dss-sub' }, t('subtitle'))), h('div', { className: 'dss-actions' }, h('button', { className: 'dss-btn', type: 'button', onClick: () => load(), disabled: Boolean(busy) }, t('refresh'))));
            const tabs = surface === 'main' ? h('div', { className: 'dss-tabs' }, h('button', { className: 'dss-tab', type: 'button', 'data-active': tab === 'history', onClick: () => setTab('history') }, t('history')), h('button', { className: 'dss-tab', type: 'button', 'data-active': tab === 'settings', onClick: () => setTab('settings') }, t('settings'))) : null;
            const cards = h('div', { className: 'dss-grid' }, h(StatCard, { label: t('recognized'), value: totals.asrCount || 0, note: `${totals.count || 0} ${t('requests')}` }), h(StatCard, { label: t('synthesized'), value: totals.ttsCount || 0 }), h(StatCard, { label: t('totalAudio'), value: fmtDuration(totals.audioDurationMs) }), h(StatCard, { label: t('tokens'), value: totals.tokensEstimate || 0 }), h(StatCard, { label: t('cost'), value: fmtUsd(totals.costUsd) }), h(StatCard, { label: t('avgLatency'), value: totals.avgLatencyMs ? `${totals.avgLatencyMs} ms` : '—' }), h(StatCard, { label: t('successRate'), value: `${totals.successRate || 0}%` }));
            const historyView = h('div', null, h('div', { className: 'dss-toolbar' }, h('div', { className: 'dss-filters' }, ['all', 'asr', 'tts'].map((value) => h('button', {
                key: value,
                className: 'dss-btn',
                type: 'button',
                'data-kind': filter === value ? 'primary' : 'small',
                onClick: () => setFilter(value),
            }, t(value)))), h('button', { className: 'dss-btn', type: 'button', onClick: clearHistory, disabled: Boolean(busy) }, t('clearHistory'))), h('div', { className: 'dss-history' }, h('div', { className: 'dss-hist-head' }, h('span', null, t('time')), h('span', null, t('source')), h('span', null, t('kind')), h('span', null, t('duration')), h('span', null, t('chars')), h('span', null, t('tokens')), h('span', null, t('latency')), h('span', null, t('quality')), h('span', null, t('status'))), entries.length === 0
                ? h('div', { className: 'dss-empty' }, t('empty'))
                : entries.map((entry) => h('div', { className: 'dss-hist-row', key: entry.id }, h('span', { className: 'dss-cell', 'data-label': t('time') }, fmtDate(entry.at)), h('span', { className: 'dss-cell', 'data-label': t('source') }, sourceText(entry.source, t)), h('span', { className: 'dss-cell', 'data-label': t('kind') }, entry.kind.toUpperCase()), h('span', { className: 'dss-cell', 'data-label': t('duration') }, fmtDuration(entry.audioDurationMs)), h('span', { className: 'dss-cell', 'data-label': t('chars') }, entry.textChars || 0), h('span', { className: 'dss-cell', 'data-label': t('tokens') }, entry.tokensEstimate || 0), h('span', { className: 'dss-cell', 'data-label': t('latency') }, `${entry.latencyMs || 0} ms`), h('span', { className: 'dss-cell', 'data-label': t('quality') }, providerText(entry, t)), h('span', { className: 'dss-cell', 'data-label': t('status') }, h('span', { className: 'dss-badge' }, h('span', { className: 'dss-dot', 'data-tone': entry.status === 'ok' ? 'ok' : (entry.status === 'error' ? 'error' : 'warn') }), entry.status === 'ok' ? t('ok') : (entry.status === 'error' ? t('error') : t('skipped')))), entry.preview || entry.error
                    ? h('div', { className: 'dss-preview' }, entry.error ? `${t('error')}: ${entry.error}` : entry.preview)
                    : null))), h('div', { className: 'dss-foot' }, t('tokensNote')), h('div', { className: 'dss-foot' }, t('ratesNote')), h('div', { className: 'dss-foot' }, t('historyNote')));
            const keySection = h('div', { className: TW.card }, h('h2', { className: TW.title }, t('apiKey')), h('p', { className: TW.hint }, t('apiKeyHint')), h('div', { className: 'dss-flex dss-flex-col dss-gap-2 sm:dss-flex-row' }, h('input', {
                className: TW.input,
                type: 'password',
                autoComplete: 'off',
                spellCheck: false,
                placeholder: keyState?.configured ? `•••••••• (${t('configured')})` : 'sk-…',
                value: keyDraft,
                onChange: (e) => setKeyDraft(e.target.value),
            }), h('div', { className: 'dss-flex dss-flex-wrap dss-gap-2' }, h('button', { className: `${TW.button} ${TW.primary}`, type: 'button', onClick: saveKey, disabled: Boolean(busy) }, t('save')), keyState?.configured ? h('button', { className: `${TW.button} ${TW.secondary}`, type: 'button', onClick: deleteKey, disabled: Boolean(busy) }, t('delete')) : null)), h('div', { className: keyState?.configured ? 'dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-state-success-primary)]' : 'dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-state-warn-primary)]' }, keyState?.configured ? `${t('configured')}${keyState.source ? ` · ${t('keySource')}: ${keyState.source}` : ''}` : t('notConfigured')));
            const depsSection = h('div', { className: TW.card }, h('h2', { className: TW.title }, t('dependencies')), h('p', { className: TW.hint }, 'ffmpeg / ffprobe / libopus'), deps
                ? h('div', { className: 'dss-space-y-2' }, h('div', { className: 'dss-row' }, h('span', { className: 'dss-cell' }, t('ffmpeg')), h('span', { className: 'dss-cell dss-mono' }, deps.ffmpeg?.found ? `${deps.ffmpeg.path} · ${deps.ffmpeg.version || ''}` : t('missing')), h('span', { className: 'dss-badge' }, h('span', { className: 'dss-dot', 'data-tone': deps.ffmpeg?.found ? 'ok' : 'error' }), deps.ffmpeg?.found ? t('found') : t('missing'))), h('div', { className: 'dss-row' }, h('span', { className: 'dss-cell' }, t('ffprobe')), h('span', { className: 'dss-cell dss-mono' }, deps.ffprobe?.found ? `${deps.ffprobe.path} · ${deps.ffprobe.version || ''}` : t('missing')), h('span', { className: 'dss-badge' }, h('span', { className: 'dss-dot', 'data-tone': deps.ffprobe?.found ? 'ok' : 'error' }), deps.ffprobe?.found ? t('found') : t('missing'))), h('div', { className: 'dss-row' }, h('span', { className: 'dss-cell' }, t('libopus')), h('span', { className: 'dss-cell' }, deps.libopus ? t('found') : t('missing')), h('span', { className: 'dss-badge' }, h('span', { className: 'dss-dot', 'data-tone': deps.libopus ? 'ok' : 'error' }), deps.libopus ? t('found') : t('missing'))))
                : h('div', { className: 'dss-hint' }, t('loading')), h('div', { className: 'dss-flex dss-flex-wrap dss-gap-2 dss-pt-1' }, h('button', { className: `${TW.button} ${TW.secondary}`, type: 'button', onClick: checkDeps, disabled: Boolean(busy) }, t('check')), !deps?.ok ? h('button', { className: `${TW.button} ${TW.primary}`, type: 'button', onClick: installFfmpeg, disabled: Boolean(busy) }, busy === 'install' ? t('installing') : t('install')) : null), installInfo?.code === 'root-required'
                ? h('div', null, h('div', { className: 'dss-warn', style: { marginTop: '10px' } }, `${t('rootRequired')}. ${t('rootHint')}`), h('pre', { className: 'dss-pre' }, installInfo.command || 'sudo apt-get update && sudo apt-get install -y ffmpeg'), h('button', { className: 'dss-btn', type: 'button', onClick: () => copyCommand(installInfo.command || 'sudo apt-get update && sudo apt-get install -y ffmpeg') }, t('copy')))
                : null);
            const routeSection = h('div', { className: TW.card }, h('h2', { className: TW.title }, t('route')), h('p', { className: TW.hint }, t('routeHint')), h('div', { className: 'dss-flex dss-items-center dss-gap-2 dss-text-xs dss-text-[var(--dsw-alias-label-primary)]' }, h('span', { className: 'dss-dot', 'data-tone': route?.active ? 'ok' : (route?.conflict ? 'error' : 'warn') }), h('span', null, route?.active ? t('routeActive') : (route?.conflict ? t('routeConflict') : t('routeInactive')))), route?.conflict ? h('div', { className: 'dss-err', style: { marginTop: '6px' } }, route.conflict) : null);
            // EN: Settings combines key, Edge, MCP, dependencies and route health.
            // RU: Настройки объединяют ключ, Edge, MCP, зависимости и состояние маршрута.
            const settingsView = h('div', { className: 'dss-grid dss-gap-4' }, keySection, h('div', { className: TW.card }, h('h2', { className: TW.title }, t('settings')), h(Field, { label: t('voice') }, h('select', {
                className: TW.select, value: settings.voiceId || 'stella',
                onChange: (e) => setForm({ ...settings, voiceId: e.target.value }),
            }, h('option', { value: 'stella' }, t('voiceStella')), h('option', { value: 'tide' }, t('voiceTide')))), h(Field, { label: t('qualityLabel') }, h('select', {
                className: TW.select, value: settings.ttsQuality || '64',
                onChange: (e) => setForm({ ...settings, ttsQuality: e.target.value }),
            }, ['64', '96', '128', '160', '192', '256', 'dynamic'].map((value) => h('option', { key: value, value }, qualityText(value, t))))), h(Field, { label: t('edgeLanguage') }, h('select', {
                className: TW.select, value: settings.edgeLanguage || 'auto',
                onChange: (e) => setForm({ ...settings, edgeLanguage: e.target.value }),
            }, h('option', { value: 'auto' }, t('edgeAuto')), h('option', { value: 'ru' }, t('edgeRu')), h('option', { value: 'en' }, t('edgeEn')))), h('label', { className: TW.check }, h('input', {
                className: TW.checkbox, type: 'checkbox', checked: settings.edgeEnabled !== false,
                onChange: (e) => setForm({ ...settings, edgeEnabled: e.target.checked }),
            }), h('span', { className: 'dss-space-y-0.5' }, h('strong', { className: 'dss-block dss-text-xs dss-font-medium dss-text-[var(--dsw-alias-label-primary)]' }, t('edgePrimary')), h('span', { className: TW.hint }, t('edgeHint')))), h('div', { className: TW.hint }, 'Клеопатра: ru-RU-SvetlanaNeural / en-US-AriaNeural · Македонский: ru-RU-DmitryNeural / en-US-GuyNeural'), h(Field, { label: t('maxChars') }, h('input', {
                className: TW.input, type: 'number', min: 100, max: 9000,
                value: settings.ttsMaxChars || 4000,
                onChange: (e) => setForm({ ...settings, ttsMaxChars: Number(e.target.value) || 4000 }),
            })), h(Field, { label: t('telegramHome'), hint: 'default' }, h('input', {
                className: TW.input, type: 'text',
                value: settings.telegramHome || 'default',
                onChange: (e) => setForm({ ...settings, telegramHome: e.target.value }),
            })), h('label', { className: TW.check }, h('input', {
                className: TW.checkbox, type: 'checkbox', checked: Boolean(settings.alwaysVoice),
                onChange: (e) => setForm({ ...settings, alwaysVoice: e.target.checked }),
            }), h('span', { className: 'dss-space-y-0.5' }, h('strong', { className: 'dss-block dss-text-xs dss-font-medium dss-text-[var(--dsw-alias-label-primary)]' }, t('alwaysVoice')), h('span', { className: TW.hint }, t('alwaysVoiceHint')))), h('div', { className: 'dss-rounded-lg dss-border dss-border-[var(--dsw-alias-state-warn-primary)] dss-bg-[var(--dsw-alias-bg-layer-2)] dss-p-3 dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-state-warn-primary)]' }, t('russianWarning')), h('div', { className: 'dss-flex dss-flex-wrap dss-gap-2 dss-pt-1' }, h('button', { className: `${TW.button} ${TW.primary}`, type: 'button', onClick: saveForm, disabled: Boolean(busy) }, t('saveSettings')), h('button', { className: `${TW.button} ${TW.secondary}`, type: 'button', onClick: testVoice, disabled: Boolean(busy) }, busy === 'test' ? t('playing') : t('testVoice')))), h('div', { className: TW.card }, h('h2', { className: TW.title }, 'Edge TTS'), h('div', { className: 'dss-flex dss-items-center dss-gap-2 dss-text-xs dss-text-[var(--dsw-alias-label-primary)]' }, h('span', { className: 'dss-dot', 'data-tone': edge?.available ? 'ok' : 'error' }), h('span', null, edge?.available ? t('edgeAvailable') : t('edgeMissing'))), edge?.error ? h('div', { className: 'dss-err', style: { marginTop: '6px' } }, edge.error) : null), h('div', { className: TW.card }, h('h2', { className: TW.title }, t('mcpService')), h('p', { className: TW.hint }, t('mcpEndpoint')), h('div', { className: 'dss-inline' }, h('code', { className: 'dss-rounded-md dss-bg-[var(--dsw-alias-bg-layer-2)] dss-px-2 dss-py-1 dss-font-mono dss-text-[11px] dss-text-[var(--dsw-alias-label-primary)]' }, 'http://127.0.0.1:3080/deepseek-speech/mcp'), h('button', { className: `${TW.button} ${TW.secondary}`, type: 'button', onClick: () => copyCommand('http://127.0.0.1:3080/deepseek-speech/mcp') }, t('copyEndpoint'))), h('div', { className: 'dss-flex dss-items-center dss-gap-2 dss-text-xs dss-text-[var(--dsw-alias-label-primary)]' }, h('span', { className: 'dss-dot', 'data-tone': mcp?.available ? 'ok' : 'error' }), h('span', null, mcp?.available ? t('mcpReady') : t('mcpMissing'))), mcp?.error ? h('div', { className: 'dss-err', style: { marginTop: '6px' } }, mcp.error) : null, h('div', { className: 'dss-hint', style: { marginTop: '8px' } }, `${t('mcpTools')}: transcribe_audio, synthesize_speech, speech_status, speech_stats, list_voices`)), depsSection, routeSection);
            return h('div', { className: 'dss-root' }, h('style', null, CSS), h('div', { className: 'dss-wrap' }, header, error ? h('div', { className: 'dss-err' }, error) : null, notice ? h('div', { className: 'dss-ok' }, notice) : null, tabs, (surface === 'main' && tab === 'history') ? h(React.Fragment, null, cards, historyView) : null, (surface === 'settings' || (surface === 'main' && tab === 'settings')) ? settingsView : null));
        }
        function apply(ctx) {
            // EN: Load the compiled Tailwind utilities once; they are scoped to .dss-root.
            // RU: Один раз подключаем собранные Tailwind-утилиты; они ограничены .dss-root.
            if (typeof document !== 'undefined' && !document.querySelector('link[data-deepseek-speech-css]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/deepseek-speech/client.css';
                link.setAttribute('data-deepseek-speech-css', '');
                document.head.appendChild(link);
            }
            ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'deepseek-speech: dictionaries');
            const t = ctx.locale.bind(NS);
            ctx.slots.inject('main', () => ctx.slots.register({
                name: 'main',
                key: PANEL_ID,
                locale: NS,
                inject: () => ({ t }),
            }, (props) => h(App, { ...props, t: props.t || t, surface: 'main' })));
            ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
                name: 'sidebar.panellist',
                id: PANEL_ID,
                order: 20,
                label: () => t('nav'),
                locale: NS,
            }, (owner = {}) => h(Icon, { size: owner.size || 16, active: owner.active })));
            ctx.slots.inject('settings.section', () => ctx.slots.register({
                name: 'settings.section',
                id: PANEL_ID,
                order: 50,
                label: () => t('nav'),
                locale: NS,
                inject: () => ({ t }),
            }, (props) => h(App, { ...props, t: props.t || t, surface: 'settings' })));
            ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
                name: 'settings.section.icon',
                id: PANEL_ID,
                locale: NS,
            }, (owner = {}) => h(Icon, { size: owner.size || 16, active: owner.active })));
        }
        return { apply, inject: ['slots', 'locale'] };
    },
});
