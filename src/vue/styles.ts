/**
 * EN: Legacy scoped CSS for the stats panel/history; Tailwind handles settings.
 * RU: Старый scoped CSS для статистики/истории; настройки оформляет Tailwind.
 */
export const legacyCss = `
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
`
