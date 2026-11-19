import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * EN: Vue 3 root for both the main panel and the settings page. DSH's slot
 * host is React, so `client.ts` contains only a tiny mount/unmount bridge;
 * all UI/state below is Vue.
 * RU: Vue 3-корень основной панели и страницы настроек. Slot-хост DSH —
 * React, поэтому в `client.ts` только мини-мост mount/unmount; весь UI и
 * состояние ниже — Vue.
 */
export const SpeechApp = defineComponent({
  name: 'SpeechApp',
  props: {
    t: { type: Function, required: true },
    surface: { type: String, default: 'main' },
  },
  setup(props) {
    const t = (key: string) => (props.t as (key: string) => string)(key)
    const surface = computed(() => props.surface || 'main')
    const status = ref<any>(null)
    const history = ref<any>(null)
    const form = ref<any>(null)
    const tab = ref(surface.value === 'settings' ? 'settings' : 'history')
    const filter = ref('all')
    const error = ref('')
    const notice = ref('')
    const busy = ref('')
    const keyDraft = ref('')
    const installInfo = ref<any>(null)
    let pollTimer: ReturnType<typeof setInterval> | null = null

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
    }

    const settings = computed(() => form.value || status.value?.settings || {})
    const deps = computed(() => status.value?.deps)
    const route = computed(() => status.value?.route)
    const keyState = computed(() => status.value?.key)
    const edge = computed(() => status.value?.edge)
    const mcp = computed(() => status.value?.mcp)
    const totals = computed(() => history.value?.totals || status.value?.totals || {})
    const entries = computed(() => (history.value?.entries || []).filter((entry: any) => filter.value === 'all' || entry.kind === filter.value))

    async function api(path: string, options: any = {}): Promise<any> {
      const init: any = { ...(options || {}) }
      init.headers = { 'content-type': 'application/json', ...(init.headers || {}) }
      const res = await fetch(path, init)
      let data: any = {}
      try { data = await res.json() } catch { /* no body / нет тела */ }
      if (!res.ok || data?.ok === false) {
        const err: any = new Error(data?.error?.message || data?.message || `HTTP ${res.status}`)
        err.data = data
        err.status = res.status
        throw err
      }
      return data
    }

    async function load() {
      try {
        const [a, b] = await Promise.all([
          api('/deepseek-speech/status', { method: 'GET' }),
          api('/deepseek-speech/history?limit=100', { method: 'GET' }),
        ])
        status.value = a
        history.value = b
        error.value = ''
      } catch (err: any) {
        error.value = err?.message || t('refreshFailed')
      }
    }

    async function run(name: string, fn: () => Promise<void>) {
      busy.value = name
      error.value = ''
      notice.value = ''
      try { await fn() } catch (err: any) {
        error.value = err?.message || t('operationFailed')
        if (err?.data) installInfo.value = err.data
      } finally { busy.value = '' }
    }

    const saveKey = () => run('key', async () => {
      if (!keyDraft.value.trim()) throw new Error(t('apiKeyHint'))
      await api('/deepseek-speech/key', { method: 'POST', body: JSON.stringify({ apiKey: keyDraft.value }) })
      keyDraft.value = ''
      notice.value = t('saved')
      await load()
    })

    const deleteKey = () => {
      if (!window.confirm(t('confirmDeleteKey'))) return
      return run('key', async () => {
        await api('/deepseek-speech/key', { method: 'DELETE' })
        notice.value = t('saved')
        await load()
      })
    }

    function setSetting(key: string, value: any) {
      form.value = { ...(form.value || status.value?.settings || {}), [key]: value }
    }

    const saveForm = () => run('settings', async () => {
      const data = await api('/deepseek-speech/settings', { method: 'POST', body: JSON.stringify(form.value) })
      form.value = data.settings
      notice.value = t('saved')
      await load()
    })

    const checkDeps = () => run('check', async () => {
      const data = await api('/deepseek-speech/tools/check', { method: 'POST' })
      notice.value = data.deps?.ok ? t('found') : t('missing')
      await load()
    })

    const installFfmpeg = () => run('install', async () => {
      installInfo.value = null
      try {
        const data = await api('/deepseek-speech/tools/install', { method: 'POST' })
        notice.value = t('ok')
        await load()
      } catch (err: any) {
        if (err?.data) installInfo.value = err.data
        throw err
      }
    })

    const clearHistory = () => {
      if (!window.confirm(t('confirmClear'))) return
      return run('clear', async () => {
        await api('/deepseek-speech/history/clear', { method: 'POST' })
        await load()
      })
    }

    const testVoice = () => run('test', async () => {
      const s = settings.value
      const data = await api('/deepseek-speech/tts/preview', {
        method: 'POST',
        body: JSON.stringify({
          text: t('sample'),
          voiceId: s.voiceId || 'stella',
          ttsQuality: s.ttsQuality || '64',
          edgeEnabled: s.edgeEnabled,
          edgeLanguage: s.edgeLanguage,
        }),
      })
      const binary = atob(data.audioBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
      const url = URL.createObjectURL(new Blob([bytes], { type: data.mime || 'audio/ogg' }))
      try { await new Audio(url).play() } catch { /* autoplay may be blocked */ }
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      notice.value = `${t('playing')} ${fmtDuration(data.durationMs)}`
    })

    async function copyCommand(command: string) {
      try {
        await navigator.clipboard.writeText(command)
        notice.value = t('copied')
      } catch {
        notice.value = command
      }
    }

    function fmtDuration(ms: any) {
      const n = Number(ms) || 0
      if (!n) return '—'
      if (n < 60000) return `${(n / 1000).toFixed(1)}s`
      const total = Math.round(n / 1000)
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
    }
    function fmtDate(value: any) {
      try { return new Date(Number(value)).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
    }
    function fmtCost(value: any) {
      const n = Number(value) || 0
      if (!n) return '$0'
      return n < 0.00001 ? '<$0.00001' : `$${n.toFixed(5)}`
    }
    function qualityText(value: any) {
      return value === 'dynamic' ? t('dynamic') : `${value || '64'} kbps`
    }
    function sourceText(source: any) {
      if (source === 'telegram') return t('sourceTelegram')
      if (source === 'dictation') return t('sourceDictation')
      if (source === 'telegram-reply') return t('sourceReply')
      if (source === 'preview') return t('sourcePreview')
      if (source === 'mcp') return t('sourceMcp')
      if (source === 'mcp-telegram') return t('sourceMcpTelegram')
      return source || '—'
    }
    function providerText(entry: any) {
      if (entry.kind !== 'tts') return '—'
      const name = entry.provider === 'edge' ? t('edge') : (entry.provider === 'deepseek' ? t('deepseek') : '—')
      const lang = entry.language ? ` ${String(entry.language).toUpperCase()}` : ''
      const failed = entry.fallbackFrom ? ` (${t('fallback')})` : ''
      return `${name}${lang} · ${qualityText(entry.quality)}${failed}`
    }

    onMounted(() => {
      load()
      pollTimer = setInterval(load, 3000)
    })
    onBeforeUnmount(() => {
      if (pollTimer) clearInterval(pollTimer)
    })
    watch(status, (value) => {
      if (value?.settings && form.value === null) form.value = { ...value.settings }
    }, { immediate: true })

    return {
      t, surface, status, history, form, tab, filter, error, notice, busy, keyDraft, installInfo,
      settings, deps, route, keyState, edge, mcp, totals, entries, TW,
      load, saveKey, deleteKey, setSetting, saveForm, checkDeps, installFfmpeg, clearHistory,
      testVoice, copyCommand, fmtDuration, fmtDate, fmtCost, qualityText, sourceText, providerText,
    }
  },
  template: `
    <div class="dss-root">
      <div class="dss-wrap">
        <div class="dss-head">
          <div>
            <h1 class="dss-title">{{ t('title') }}</h1>
            <p class="dss-sub">{{ t('subtitle') }}</p>
          </div>
          <div class="dss-actions">
            <button class="dss-btn" type="button" :disabled="!!busy" @click="load">{{ t('refresh') }}</button>
          </div>
        </div>

        <div v-if="error" class="dss-err">{{ error }}</div>
        <div v-if="notice" class="dss-ok">{{ notice }}</div>

        <div v-if="surface === 'main'" class="dss-tabs">
          <button class="dss-tab" type="button" :data-active="tab === 'history'" @click="tab = 'history'">{{ t('history') }}</button>
          <button class="dss-tab" type="button" :data-active="tab === 'settings'" @click="tab = 'settings'">{{ t('settings') }}</button>
        </div>

        <template v-if="surface === 'main' && tab === 'history'">
          <div class="dss-grid">
            <div class="dss-card"><div class="dss-card-label">{{ t('recognized') }}</div><div class="dss-card-value">{{ totals.asrCount || 0 }}</div><div class="dss-card-note">{{ totals.count || 0 }} {{ t('requests') }}</div></div>
            <div class="dss-card"><div class="dss-card-label">{{ t('synthesized') }}</div><div class="dss-card-value">{{ totals.ttsCount || 0 }}</div></div>
            <div class="dss-card"><div class="dss-card-label">{{ t('totalAudio') }}</div><div class="dss-card-value">{{ fmtDuration(totals.audioDurationMs) }}</div></div>
            <div class="dss-card"><div class="dss-card-label">{{ t('tokens') }}</div><div class="dss-card-value">{{ totals.tokensEstimate || 0 }}</div></div>
            <div class="dss-card"><div class="dss-card-label">{{ t('cost') }}</div><div class="dss-card-value">{{ fmtCost(totals.costUsd) }}</div></div>
            <div class="dss-card"><div class="dss-card-label">{{ t('avgLatency') }}</div><div class="dss-card-value">{{ totals.avgLatencyMs ? totals.avgLatencyMs + ' ms' : '—' }}</div></div>
            <div class="dss-card"><div class="dss-card-label">{{ t('successRate') }}</div><div class="dss-card-value">{{ totals.successRate || 0 }}%</div></div>
          </div>

          <div class="dss-toolbar">
            <div class="dss-filters">
              <button v-for="value in ['all', 'asr', 'tts']" :key="value" class="dss-btn" type="button" :data-kind="filter === value ? 'primary' : 'small'" @click="filter = value">{{ t(value) }}</button>
            </div>
            <button class="dss-btn" type="button" :disabled="!!busy" @click="clearHistory">{{ t('clearHistory') }}</button>
          </div>

          <div class="dss-history">
            <div class="dss-hist-head">
              <span>{{ t('time') }}</span><span>{{ t('source') }}</span><span>{{ t('kind') }}</span><span>{{ t('duration') }}</span><span>{{ t('chars') }}</span><span>{{ t('tokens') }}</span><span>{{ t('latency') }}</span><span>{{ t('quality') }}</span><span>{{ t('status') }}</span>
            </div>
            <div v-if="entries.length === 0" class="dss-empty">{{ t('empty') }}</div>
            <div v-for="entry in entries" :key="entry.id" class="dss-hist-row">
              <span class="dss-cell" :data-label="t('time')">{{ fmtDate(entry.at) }}</span>
              <span class="dss-cell" :data-label="t('source')">{{ sourceText(entry.source) }}</span>
              <span class="dss-cell" :data-label="t('kind')">{{ String(entry.kind).toUpperCase() }}</span>
              <span class="dss-cell" :data-label="t('duration')">{{ fmtDuration(entry.audioDurationMs) }}</span>
              <span class="dss-cell" :data-label="t('chars')">{{ entry.textChars || 0 }}</span>
              <span class="dss-cell" :data-label="t('tokens')">{{ entry.tokensEstimate || 0 }}</span>
              <span class="dss-cell" :data-label="t('latency')">{{ entry.latencyMs || 0 }} ms</span>
              <span class="dss-cell" :data-label="t('quality')">{{ providerText(entry) }}</span>
              <span class="dss-cell" :data-label="t('status')">
                <span class="dss-badge"><span class="dss-dot" :data-tone="entry.status === 'ok' ? 'ok' : (entry.status === 'error' ? 'error' : 'warn')"></span>{{ entry.status === 'ok' ? t('ok') : (entry.status === 'error' ? t('error') : t('skipped')) }}</span>
              </span>
              <div v-if="entry.preview || entry.error" class="dss-preview">{{ entry.error ? t('error') + ': ' + entry.error : entry.preview }}</div>
            </div>
          </div>
          <div class="dss-foot">{{ t('tokensNote') }}</div>
          <div class="dss-foot">{{ t('ratesNote') }}</div>
          <div class="dss-foot">{{ t('historyNote') }}</div>
        </template>

        <div v-if="surface === 'settings' || (surface === 'main' && tab === 'settings')" class="dss-grid dss-gap-4">
          <div :class="TW.card">
            <h2 :class="TW.title">{{ t('apiKey') }}</h2>
            <p :class="TW.hint">{{ t('apiKeyHint') }}</p>
            <div class="dss-flex dss-flex-col dss-gap-2 sm:dss-flex-row">
              <input v-model="keyDraft" :class="TW.input" type="password" autocomplete="off" spellcheck="false" :placeholder="keyState?.configured ? '•••••••• (' + t('configured') + ')' : 'sk-…'" />
              <div class="dss-flex dss-flex-wrap dss-gap-2">
                <button :class="TW.button + ' ' + TW.primary" type="button" :disabled="!!busy" @click="saveKey">{{ t('save') }}</button>
                <button v-if="keyState?.configured" :class="TW.button + ' ' + TW.secondary" type="button" :disabled="!!busy" @click="deleteKey">{{ t('delete') }}</button>
              </div>
            </div>
            <div :class="keyState?.configured ? 'dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-state-success-primary)]' : 'dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-state-warn-primary)]'">
              {{ keyState?.configured ? t('configured') + (keyState.source ? ' · ' + t('keySource') + ': ' + keyState.source : '') : t('notConfigured') }}
            </div>
          </div>

          <div :class="TW.card">
            <h2 :class="TW.title">{{ t('settings') }}</h2>
            <div class="dss-space-y-1.5">
              <label :class="TW.label">{{ t('voice') }}</label>
              <select :class="TW.select" :value="settings.voiceId || 'stella'" @change="setSetting('voiceId', $event.target.value)">
                <option value="stella">{{ t('voiceStella') }}</option>
                <option value="tide">{{ t('voiceTide') }}</option>
              </select>
            </div>
            <div class="dss-space-y-1.5">
              <label :class="TW.label">{{ t('qualityLabel') }}</label>
              <select :class="TW.select" :value="settings.ttsQuality || '64'" @change="setSetting('ttsQuality', $event.target.value)">
                <option v-for="value in ['64', '96', '128', '160', '192', '256', 'dynamic']" :key="value" :value="value">{{ qualityText(value) }}</option>
              </select>
            </div>
            <div class="dss-space-y-1.5">
              <label :class="TW.label">{{ t('edgeLanguage') }}</label>
              <select :class="TW.select" :value="settings.edgeLanguage || 'auto'" @change="setSetting('edgeLanguage', $event.target.value)">
                <option value="auto">{{ t('edgeAuto') }}</option>
                <option value="ru">{{ t('edgeRu') }}</option>
                <option value="en">{{ t('edgeEn') }}</option>
              </select>
            </div>
            <label :class="TW.check">
              <input :class="TW.checkbox" type="checkbox" :checked="settings.edgeEnabled !== false" @change="setSetting('edgeEnabled', $event.target.checked)" />
              <span class="dss-space-y-0.5">
                <strong class="dss-block dss-text-xs dss-font-medium dss-text-[var(--dsw-alias-label-primary)]">{{ t('edgePrimary') }}</strong>
                <span :class="TW.hint">{{ t('edgeHint') }}</span>
              </span>
            </label>
            <div :class="TW.hint">Клеопатра: ru-RU-SvetlanaNeural / en-US-AriaNeural · Македонский: ru-RU-DmitryNeural / en-US-GuyNeural</div>
            <div class="dss-space-y-1.5">
              <label :class="TW.label">{{ t('maxChars') }}</label>
              <input :class="TW.input" type="number" min="100" max="9000" :value="settings.ttsMaxChars || 4000" @change="setSetting('ttsMaxChars', Number($event.target.value) || 4000)" />
            </div>
            <div class="dss-space-y-1.5">
              <label :class="TW.label">{{ t('telegramHome') }}</label>
              <input :class="TW.input" type="text" :value="settings.telegramHome || 'default'" @change="setSetting('telegramHome', $event.target.value)" />
              <div :class="TW.hint">default</div>
            </div>
            <label :class="TW.check">
              <input :class="TW.checkbox" type="checkbox" :checked="!!settings.alwaysVoice" @change="setSetting('alwaysVoice', $event.target.checked)" />
              <span class="dss-space-y-0.5">
                <strong class="dss-block dss-text-xs dss-font-medium dss-text-[var(--dsw-alias-label-primary)]">{{ t('alwaysVoice') }}</strong>
                <span :class="TW.hint">{{ t('alwaysVoiceHint') }}</span>
              </span>
            </label>
            <div class="dss-rounded-lg dss-border dss-border-[var(--dsw-alias-state-warn-primary)] dss-bg-[var(--dsw-alias-bg-layer-2)] dss-p-3 dss-text-xs dss-leading-5 dss-text-[var(--dsw-alias-state-warn-primary)]">{{ t('russianWarning') }}</div>
            <div class="dss-flex dss-flex-wrap dss-gap-2 dss-pt-1">
              <button :class="TW.button + ' ' + TW.primary" type="button" :disabled="!!busy" @click="saveForm">{{ t('saveSettings') }}</button>
              <button :class="TW.button + ' ' + TW.secondary" type="button" :disabled="!!busy" @click="testVoice">{{ busy === 'test' ? t('playing') : t('testVoice') }}</button>
            </div>
          </div>

          <div :class="TW.card">
            <h2 :class="TW.title">Edge TTS</h2>
            <div class="dss-flex dss-items-center dss-gap-2 dss-text-xs dss-text-[var(--dsw-alias-label-primary)]">
              <span class="dss-dot" :data-tone="edge?.available ? 'ok' : 'error'"></span>
              <span>{{ edge?.available ? t('edgeAvailable') : t('edgeMissing') }}</span>
            </div>
            <div v-if="edge?.error" class="dss-err">{{ edge.error }}</div>
          </div>

          <div :class="TW.card">
            <h2 :class="TW.title">{{ t('mcpService') }}</h2>
            <p :class="TW.hint">{{ t('mcpEndpoint') }}</p>
            <div class="dss-inline">
              <code class="dss-rounded-md dss-bg-[var(--dsw-alias-bg-layer-2)] dss-px-2 dss-py-1 dss-font-mono dss-text-[11px] dss-text-[var(--dsw-alias-label-primary)]">http://127.0.0.1:3080/deepseek-speech/mcp</code>
              <button :class="TW.button + ' ' + TW.secondary" type="button" @click="copyCommand('http://127.0.0.1:3080/deepseek-speech/mcp')">{{ t('copyEndpoint') }}</button>
            </div>
            <div class="dss-flex dss-items-center dss-gap-2 dss-text-xs dss-text-[var(--dsw-alias-label-primary)]">
              <span class="dss-dot" :data-tone="mcp?.available ? 'ok' : 'error'"></span>
              <span>{{ mcp?.available ? t('mcpReady') : t('mcpMissing') }}</span>
            </div>
            <div v-if="mcp?.error" class="dss-err">{{ mcp.error }}</div>
            <div :class="TW.hint">{{ t('mcpTools') }}: transcribe_audio, synthesize_speech, speech_status, speech_stats, list_voices</div>
          </div>

          <div :class="TW.card">
            <h2 :class="TW.title">{{ t('dependencies') }}</h2>
            <p :class="TW.hint">ffmpeg / ffprobe / libopus</p>
            <div v-if="deps" class="dss-space-y-2">
              <div class="dss-row">
                <span class="dss-cell">{{ t('ffmpeg') }}</span>
                <span class="dss-cell dss-mono">{{ deps.ffmpeg?.found ? deps.ffmpeg.path + ' · ' + (deps.ffmpeg.version || '') : t('missing') }}</span>
                <span class="dss-badge"><span class="dss-dot" :data-tone="deps.ffmpeg?.found ? 'ok' : 'error'"></span>{{ deps.ffmpeg?.found ? t('found') : t('missing') }}</span>
              </div>
              <div class="dss-row">
                <span class="dss-cell">{{ t('ffprobe') }}</span>
                <span class="dss-cell dss-mono">{{ deps.ffprobe?.found ? deps.ffprobe.path + ' · ' + (deps.ffprobe.version || '') : t('missing') }}</span>
                <span class="dss-badge"><span class="dss-dot" :data-tone="deps.ffprobe?.found ? 'ok' : 'error'"></span>{{ deps.ffprobe?.found ? t('found') : t('missing') }}</span>
              </div>
              <div class="dss-row">
                <span class="dss-cell">{{ t('libopus') }}</span>
                <span class="dss-cell">{{ deps.libopus ? t('found') : t('missing') }}</span>
                <span class="dss-badge"><span class="dss-dot" :data-tone="deps.libopus ? 'ok' : 'error'"></span>{{ deps.libopus ? t('found') : t('missing') }}</span>
              </div>
            </div>
            <div v-else :class="TW.hint">{{ t('loading') }}</div>
            <div class="dss-flex dss-flex-wrap dss-gap-2 dss-pt-1">
              <button :class="TW.button + ' ' + TW.secondary" type="button" :disabled="!!busy" @click="checkDeps">{{ t('check') }}</button>
              <button v-if="!deps?.ok" :class="TW.button + ' ' + TW.primary" type="button" :disabled="!!busy" @click="installFfmpeg">{{ busy === 'install' ? t('installing') : t('install') }}</button>
            </div>
            <div v-if="installInfo?.code === 'root-required'">
              <div class="dss-warn" style="margin-top: 10px">{{ t('rootRequired') }}. {{ t('rootHint') }}</div>
              <pre class="dss-pre">{{ installInfo.command || 'sudo apt-get update && sudo apt-get install -y ffmpeg' }}</pre>
              <button class="dss-btn" type="button" @click="copyCommand(installInfo.command || 'sudo apt-get update && sudo apt-get install -y ffmpeg')">{{ t('copy') }}</button>
            </div>
          </div>

          <div :class="TW.card">
            <h2 :class="TW.title">{{ t('route') }}</h2>
            <p :class="TW.hint">{{ t('routeHint') }}</p>
            <div class="dss-flex dss-items-center dss-gap-2 dss-text-xs dss-text-[var(--dsw-alias-label-primary)]">
              <span class="dss-dot" :data-tone="route?.active ? 'ok' : (route?.conflict ? 'error' : 'warn')"></span>
              <span>{{ route?.active ? t('routeActive') : (route?.conflict ? t('routeConflict') : t('routeInactive')) }}</span>
            </div>
            <div v-if="route?.conflict" class="dss-err">{{ route.conflict }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
