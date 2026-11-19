import { createApp } from 'vue'
import { SpeechApp } from './vue/SpeechApp'
import { en, ru } from './locales'
import { legacyCss } from './vue/styles'
import tailwindCss from '../dist/client.css?inline'

/**
 * EN: DSH client entry. DSH's slot host is React, so this file only provides a
 * tiny mount/unmount bridge and the sidebar icons; every screen is Vue 3.
 * RU: Вход клиента DSH. Slot-хост DSH — React, поэтому здесь только мини-мост
 * mount/unmount и иконки сайдбара; все экраны — Vue 3.
 */
;(window as any).__ModuleLoader__.load({
  id: '@local/dsh-deepseek-speech',
  factory(require: (id: string) => any) {
    const React: any = require('react')
    const NS = 'deepseek-speech'
    const PANEL_ID = 'deepseek-speech'

    /**
     * EN: Mounts the Vue app inside a React slot. The Vue app owns all state
     * and rendering; the bridge only creates/destroys the app.
     * RU: Монтирует Vue-приложение внутри React-слота. Всё состояние и рендер
     * принадлежат Vue; мост только создаёт/уничтожает приложение.
     */
    function VueSlot(props: any) {
      const host = React.useRef(null)
      const tRef = React.useRef(props.t)
      tRef.current = props.t
      React.useEffect(() => {
        const app = createApp(SpeechApp, {
          t: (key: string) => (tRef.current ? tRef.current(key) : key),
          surface: props.surface || 'main',
        })
        app.mount(host.current)
        return () => app.unmount()
      }, [props.surface])
      return React.createElement('div', { ref: host })
    }

    function Icon({ size = 18, active = false }: { size?: number; active?: boolean }) {
      return React.createElement('svg', {
        viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': true,
        style: { display: 'block', color: active ? 'var(--dsw-alias-brand-primary)' : 'currentColor' },
      },
      React.createElement('rect', { x: 4, y: 4, width: 56, height: 56, rx: 16, fill: 'currentColor', opacity: 0.1 }),
      React.createElement('path', { d: 'M16 22a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H29l-8 7v-7a6 6 0 0 1-5-6Z', fill: 'currentColor' }),
      React.createElement('g', { fill: 'var(--dsw-alias-bg-base)' },
        React.createElement('rect', { x: 22, y: 24, width: 3, height: 8, rx: 1.5 }),
        React.createElement('rect', { x: 28, y: 21, width: 3, height: 14, rx: 1.5 }),
        React.createElement('rect', { x: 34, y: 23, width: 3, height: 10, rx: 1.5 }),
        React.createElement('rect', { x: 40, y: 25, width: 3, height: 6, rx: 1.5 }),
      ))
    }

    function apply(ctx: any) {
      // EN: Tailwind is inlined at build time, so it works even if the CSS route
      // is unavailable. Both styles are scoped to .dss-root.
      // RU: Tailwind встроен на этапе сборки, поэтому работает даже без CSS-маршрута.
      // Оба стиля ограничены .dss-root.
      ctx.effect(() => {
        if (typeof document === 'undefined') return () => {}
        const style = document.createElement('style')
        style.textContent = `${tailwindCss}\n${legacyCss}`
        style.setAttribute('data-deepseek-speech-styles', '')
        document.head.appendChild(style)
        return () => style.remove()
      }, 'deepseek-speech: styles')
      ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'deepseek-speech: dictionaries')
      const t = ctx.locale.bind(NS)

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({ t }),
      }, (props: any) => React.createElement(VueSlot, { ...props, t: props.t || t, surface: 'main' })))

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        label: () => t('nav'),
        locale: NS,
      }, (owner: any = {}) => React.createElement(Icon, { size: owner.size || 16, active: owner.active })))

      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: PANEL_ID,
        order: 50,
        label: () => t('nav'),
        locale: NS,
        inject: () => ({ t }),
      }, (props: any) => React.createElement(VueSlot, { ...props, t: props.t || t, surface: 'settings' })))

      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon',
        id: PANEL_ID,
        locale: NS,
      }, (owner: any = {}) => React.createElement(Icon, { size: owner.size || 16, active: owner.active })))
    }

    return { apply, inject: ['slots', 'locale'] }
  },
})
