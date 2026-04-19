// ========== TYCOON UI (v2) ==========
// Phase 1D: Minimum viable tycoon UI — overlays the clicker view when activated.
// Consists of: Top bar (cash + calendar + speed), Projects panel, Design modal,
// MC Decision modal, Launch celebration toast.
// Phase 1F will strip the underlying clicker UI so this is the only UI.
(function(){
  'use strict';

  // ---------- Styles (injected once) ----------
  const STYLES = `
.tycoon-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: #0d1117; color: #c9d1d9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: flex; flex-direction: column;
}
.tycoon-topbar {
  display: flex; align-items: center; gap: 24px; padding: 10px 18px;
  background: #161b22; border-bottom: 1px solid #30363d; min-height: 48px;
}
.tycoon-topbar .t-stat { display: flex; flex-direction: column; align-items: flex-start; }
.tycoon-topbar .t-stat-val { font-weight: 700; font-size: 1rem; color: #f0f6fc; }
.tycoon-topbar .t-stat-lbl { font-size: 0.65rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
.tycoon-topbar .t-cal { color: #79c0ff; font-size: 1.1rem; font-weight: 700; }
.tycoon-topbar .t-cal-progress {
  margin-top: 4px; width: 140px; height: 4px;
  background: #21262d; border-radius: 2px; overflow: hidden;
}
.tycoon-topbar .t-cal-progress-fill {
  height: 100%; width: 0%;
  background: linear-gradient(90deg, #1f6feb, #58a6ff);
  border-radius: 2px;
}

/* Bankruptcy countdown — only shown when S.bankruptcy.negativeWeeks > 0 */
.tycoon-topbar .t-bankrupt {
  display: flex; flex-direction: column; align-items: flex-start;
  padding: 4px 10px; background: rgba(248, 81, 73, 0.12);
  border: 1px solid rgba(248, 81, 73, 0.5); border-radius: 4px;
  animation: tBankruptPulse 1.8s ease-in-out infinite;
}
.tycoon-topbar .t-bankrupt-lbl {
  color: #f85149; font-size: 0.65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.tycoon-topbar .t-bankrupt-val {
  color: #ff7b72; font-size: 0.9rem; font-weight: 700;
}
.tycoon-topbar .t-bankrupt-bar {
  margin-top: 3px; width: 110px; height: 4px;
  background: #21262d; border-radius: 2px; overflow: hidden;
}
.tycoon-topbar .t-bankrupt-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #da3633, #f85149);
  border-radius: 2px; transition: width 0.4s ease-out;
}
@keyframes tBankruptPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.35); }
  50% { box-shadow: 0 0 8px 2px rgba(248, 81, 73, 0.5); }
}
.tycoon-topbar .t-speed { margin-left: auto; display: flex; gap: 4px; }
.tycoon-topbar .t-speed button {
  background: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 6px 10px;
  font-family: inherit; font-weight: 700; cursor: pointer; border-radius: 4px; min-width: 36px;
}
.tycoon-topbar .t-speed button:hover { background: #30363d; border-color: #484f58; }
.tycoon-topbar .t-speed button.active { background: #1f6feb; border-color: #1f6feb; color: white; }
.tycoon-topbar .t-exit {
  background: transparent; border: 1px solid #30363d; color: #8b949e;
  padding: 6px 10px; border-radius: 4px; cursor: pointer; font-family: inherit;
}
/* Save & Quit: benign action, use neutral accent on hover (not the red
   "danger" color the old Exit button had — nothing is being destroyed). */
.tycoon-topbar .t-exit:hover { color: #7ee787; border-color: #2ea043; background: rgba(46,160,67,0.08); }
.tycoon-topbar .t-options-btn {
  background: transparent; border: 1px solid #30363d; color: #c9d1d9;
  padding: 4px 10px; margin-left: 4px; border-radius: 4px; cursor: pointer;
  font-family: inherit; font-size: 0.95rem; line-height: 1;
}
.tycoon-topbar .t-options-btn:hover { background: #30363d; border-color: #484f58; }

.t-opt-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid #21262d;
}
.t-opt-row:last-child { border-bottom: none; }
.t-opt-label { flex: 1; color: #c9d1d9; font-size: 0.85rem; }
.t-opt-label .t-opt-sub { display: block; color: #8b949e; font-size: 0.7rem; margin-top: 2px; }
.t-opt-toggle {
  background: #21262d; color: #c9d1d9; border: 1px solid #30363d;
  padding: 5px 14px; border-radius: 4px; cursor: pointer; font-family: inherit;
  font-size: 0.8rem; font-weight: 600; min-width: 64px;
}
.t-opt-toggle.on { background: #238636; border-color: #238636; color: white; }
.t-opt-toggle:hover { background: #30363d; }
.t-opt-toggle.on:hover { background: #2ea043; }

.tycoon-main { flex: 1; display: flex; padding: 18px; gap: 18px; overflow: hidden; }
.tycoon-panel {
  flex: 1; background: #161b22; border: 1px solid #30363d; border-radius: 6px;
  padding: 16px; overflow-y: auto;
}
.tycoon-panel h2 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: #8b949e; font-weight: 600; margin-bottom: 12px; }

.t-founder { padding: 12px; background: #0d1117; border: 1px solid #30363d; border-radius: 4px; }
.t-founder .t-f-name { font-weight: 700; color: #f0f6fc; font-size: 1rem; }
.t-founder .t-f-role { color: #8b949e; font-size: 0.75rem; margin-top: 2px; }
.t-founder .t-f-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; font-size: 0.75rem; }
.t-founder .t-stat-box { background: #161b22; border: 1px solid #21262d; padding: 6px 8px; border-radius: 3px; }
.t-founder .t-stat-box .v { color: #f0f6fc; font-weight: 700; font-size: 0.9rem; }
.t-founder .t-stat-box .l { color: #8b949e; font-size: 0.6rem; text-transform: uppercase; }

.t-projects-list { display: flex; flex-direction: column; gap: 10px; }
.t-proj-card {
  padding: 12px; background: #0d1117; border: 1px solid #30363d; border-radius: 4px;
  cursor: pointer; transition: border-color 0.15s;
}
.t-proj-card:hover { border-color: #58a6ff; }
.t-proj-card.shipped { opacity: 0.85; }
.t-proj-card.t-proj-clickable { cursor: pointer; }
.t-proj-card.t-proj-clickable:hover { opacity: 1; border-color: #79c0ff; }

/* Shipped-project detail modal (sales graph + breakdown) */
.t-pd-section { margin-top: 16px; }
.t-pd-section h3 {
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: #8b949e; margin-bottom: 8px; font-weight: 700;
}
.t-pd-stat-row { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.85rem; color: #c9d1d9; }
.t-pd-stat-row .k { color: #8b949e; margin-right: 4px; }
.t-pd-stat-row .v { color: #f0f6fc; font-weight: 700; }
.t-pd-scores { color: #79c0ff; font-size: 0.95rem; font-weight: 700; }
.t-pd-scores .lbl {
  color: #f0883e; font-size: 0.75rem; padding: 2px 8px; margin-left: 8px;
  background: rgba(240, 136, 62, 0.12); border: 1px solid rgba(240, 136, 62, 0.4);
  border-radius: 3px; vertical-align: middle;
}
.t-pd-awards { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.t-pd-award {
  padding: 3px 8px; font-size: 0.75rem;
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 3px; color: #f1e05a;
}
.t-pd-breakdown { font-size: 0.8rem; color: #8b949e; line-height: 1.6; }
.t-pd-breakdown .mul { color: #7ee787; }
.t-pd-breakdown .neg { color: #ff7b72; }
.t-pd-review {
  padding: 8px 12px; margin-bottom: 6px;
  background: #0d1117; border-left: 3px solid #30363d; border-radius: 3px;
  font-size: 0.8rem; font-style: italic; color: #c9d1d9;
}
.t-pd-review .src { display: block; font-style: normal; color: #8b949e; font-size: 0.7rem; margin-top: 4px; }

/* SVG graph */
.t-pd-graph-wrap { position: relative; background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 8px; }
.t-pd-graph { display: block; width: 100%; height: 220px; }
.t-pd-graph-bar { fill: #1f6feb; opacity: 0.8; }
.t-pd-graph-bar.projected { fill: #1f6feb; opacity: 0.25; }
.t-pd-graph-cum { fill: none; stroke: #7ee787; stroke-width: 2; }
.t-pd-graph-cum.projected { stroke-dasharray: 4 3; opacity: 0.7; }
.t-pd-graph-breakeven { stroke: #f85149; stroke-width: 1; stroke-dasharray: 3 2; fill: none; }
.t-pd-graph-axis { stroke: #30363d; stroke-width: 1; }
.t-pd-graph-label { fill: #8b949e; font-size: 9px; font-family: inherit; }
.t-pd-graph-label.axis-title { fill: #c9d1d9; font-weight: 700; font-size: 10px; }
.t-pd-tooltip {
  position: absolute; pointer-events: none;
  background: #161b22; border: 1px solid #30363d; border-radius: 4px;
  padding: 6px 10px; font-size: 0.75rem; color: #c9d1d9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  white-space: nowrap; transition: opacity 0.15s;
}
.t-pd-tooltip .wk { color: #79c0ff; font-weight: 700; }
.t-pd-tooltip .wkly { color: #1f6feb; }
.t-pd-tooltip .cum { color: #7ee787; }
.t-pd-tooltip .proj-tag { color: #8b949e; font-style: italic; }
.t-pd-legend {
  display: flex; gap: 16px; margin-top: 6px; font-size: 0.7rem; color: #8b949e;
  justify-content: center; flex-wrap: wrap;
}
.t-pd-legend .swatch { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border-radius: 2px; vertical-align: middle; }
.t-pd-legend .sw-bar { background: #1f6feb; }
.t-pd-legend .sw-cum { background: #7ee787; }
.t-pd-legend .sw-proj { background: #1f6feb; opacity: 0.3; }
.t-pd-legend .sw-breakeven { background: #f85149; }
.t-proj-card .t-proj-name { font-weight: 700; color: #f0f6fc; }
.t-proj-card .t-proj-meta { color: #8b949e; font-size: 0.75rem; margin-top: 2px; }
.t-proj-card .t-proj-phase { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #79c0ff; margin-top: 6px; font-weight: 600; }
.t-proj-card .t-proj-phase.design { color: #f0883e; }
.t-proj-card .t-proj-phase.development { color: #58a6ff; }
.t-proj-card .t-proj-phase.polish { color: #bc8cff; }
.t-proj-card .t-proj-phase.launched { color: #7ee787; }
.t-proj-card .t-progbar { height: 4px; background: #21262d; border-radius: 2px; margin-top: 6px; overflow: hidden; }
.t-proj-card .t-progbar-fill { height: 100%; background: #1f6feb; transition: width 0.3s; }
.t-proj-card .t-proj-qual { display: flex; gap: 8px; margin-top: 6px; font-size: 0.7rem; color: #8b949e; }
.t-proj-card .t-proj-qual span { display: inline-flex; gap: 3px; }
.t-proj-card .t-proj-qual .v { color: #f0f6fc; font-weight: 700; }
.t-proj-card .t-proj-critic { color: #7ee787; font-weight: 700; font-size: 1.1rem; }

.t-btn {
  background: #238636; color: white; border: none; padding: 8px 14px; border-radius: 4px;
  font-family: inherit; font-weight: 600; cursor: pointer; font-size: 0.85rem;
}
.t-btn:hover { background: #2ea043; }
.t-btn.secondary { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; }
.t-btn.secondary:hover { background: #30363d; }
.t-btn.t-teams-idle {
  background: rgba(240, 136, 62, 0.12);
  border-color: rgba(240, 136, 62, 0.5);
  color: #f0883e;
}
.t-btn.t-teams-idle:hover { background: rgba(240, 136, 62, 0.22); border-color: #f0883e; }
.t-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.t-modal-ov {
  position: fixed; inset: 0; background: rgba(1,4,9,0.8); z-index: 200;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.t-modal {
  background: #161b22; border: 1px solid #30363d; border-radius: 8px;
  padding: 24px; max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.t-modal h2 { color: #f0f6fc; margin-bottom: 16px; font-size: 1.2rem; }
.t-modal label { display: block; color: #c9d1d9; margin-top: 12px; font-size: 0.85rem; }
.t-modal input, .t-modal select {
  width: 100%; margin-top: 4px; padding: 8px 10px; background: #0d1117; color: #c9d1d9;
  border: 1px solid #30363d; border-radius: 4px; font-family: inherit; font-size: 0.9rem;
}
.t-modal .t-modal-actions { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }

.t-feat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 6px; }
.t-feat-card {
  padding: 8px 10px; background: #0d1117; border: 1px solid #30363d; border-radius: 4px;
  cursor: pointer; transition: all 0.15s;
}
.t-feat-card:hover { border-color: #58a6ff; }
.t-feat-card.picked { background: #0c2d4e; border-color: #1f6feb; }
.t-feat-card.disabled { opacity: 0.4; cursor: not-allowed; }
.t-feat-card .n { font-weight: 600; color: #f0f6fc; font-size: 0.85rem; }
.t-feat-card .m { color: #8b949e; font-size: 0.7rem; margin-top: 2px; }
.t-feat-card .c { color: #f0883e; font-size: 0.7rem; float: right; font-weight: 700; }
.t-scope-points { color: #8b949e; font-size: 0.8rem; margin-top: 4px; }
.t-scope-points .v { color: #f0f6fc; font-weight: 700; }

.t-mc-answer {
  display: block; width: 100%; text-align: left; margin: 8px 0;
  padding: 12px 14px; background: #0d1117; border: 1px solid #30363d;
  border-radius: 4px; cursor: pointer; font-family: inherit; color: #c9d1d9;
}
.t-mc-answer:hover:not(:disabled) { border-color: #58a6ff; background: #0c2d4e; }
.t-mc-answer:disabled { opacity: 0.45; cursor: not-allowed; }
.t-mc-answer .effects { display: block; font-size: 0.7rem; color: #8b949e; margin-top: 4px; }
.t-mc-answer .lock { display: block; font-size: 0.7rem; color: #f0883e; margin-top: 4px; }

.t-toast-stack { position: fixed; top: 60px; right: 20px; z-index: 300; display: flex; flex-direction: column; gap: 8px; }
.t-toast {
  background: #161b22; border: 1px solid #30363d; border-left: 3px solid #7ee787;
  padding: 12px 16px; border-radius: 4px; color: #c9d1d9; font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: t-toast-in 0.3s ease-out;
  max-width: 320px;
}
@keyframes t-toast-in { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }

.t-empty { color: #8b949e; font-style: italic; padding: 20px; text-align: center; }

.t-contract-card {
  padding: 12px; background: #0d1117; border: 1px solid #30363d; border-radius: 4px;
  border-left: 3px solid #f0883e;
}
.t-contract-card .t-c-hdr { display: flex; justify-content: space-between; align-items: center; }
.t-contract-card .t-c-client { font-weight: 700; color: #f0f6fc; font-size: 0.9rem; }
.t-contract-card .t-c-pay { color: #7ee787; font-weight: 700; font-size: 0.95rem; }
.t-contract-card .t-c-proj { color: #c9d1d9; margin-top: 2px; font-size: 0.85rem; }
.t-contract-card .t-c-spec { color: #8b949e; font-size: 0.7rem; margin-top: 4px; line-height: 1.4; }
.t-contract-card .t-c-deadline { color: #f0883e; font-size: 0.7rem; margin-top: 4px; }
.t-contract-card .t-c-expires { color: #8b949e; font-size: 0.65rem; font-style: italic; margin-top: 2px; }
.t-contract-card .t-c-actions { display: flex; gap: 8px; margin-top: 10px; }
.t-contract-card .t-c-actions button { flex: 1; padding: 6px 10px; font-size: 0.8rem; }

.t-finance-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #21262d; }
.t-finance-row .lbl { color: #8b949e; }
.t-finance-row .val { color: #f0f6fc; font-weight: 700; font-variant-numeric: tabular-nums; }
.t-finance-row.positive .val { color: #7ee787; }
.t-finance-row.negative .val { color: #f85149; }

.t-candidate-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.t-candidate-card {
  padding: 12px; background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
  display: flex; flex-direction: column; gap: 6px;
}
.t-candidate-card .c-top { display: flex; justify-content: space-between; align-items: baseline; }
.t-candidate-card .c-name { font-weight: 700; color: #f0f6fc; font-size: 0.95rem; }
.t-candidate-card .c-tier { color: #79c0ff; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
.t-candidate-card .c-salary { color: #f0883e; font-weight: 700; font-size: 0.9rem; }
.t-candidate-card .c-meta { color: #8b949e; font-size: 0.72rem; }
.t-candidate-card .c-trait { color: #c9d1d9; font-size: 0.75rem; font-style: italic; }
.t-candidate-card .c-trait .hidden { color: #6e7681; }
.t-candidate-card .c-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; font-size: 0.7rem; margin-top: 4px; }
.t-candidate-card .c-stats .s { background: #161b22; border: 1px solid #21262d; padding: 4px 6px; border-radius: 3px; text-align: center; }
.t-candidate-card .c-stats .s.hidden { color: #484f58; font-style: italic; }
.t-candidate-card .c-stats .s .v { color: #f0f6fc; font-weight: 700; display: block; }
.t-candidate-card .c-stats .s .l { color: #8b949e; font-size: 0.6rem; text-transform: uppercase; }
.t-candidate-card .c-actions { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
.t-candidate-card .c-actions button {
  flex: 1; min-width: 0; padding: 5px 8px; font-size: 0.7rem;
}
.t-candidate-card.interviewed { border-color: #58a6ff; }

.t-employee-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #0d1117; border: 1px solid #21262d;
  border-radius: 4px; margin-bottom: 6px;
}
.t-employee-row .e-info { flex: 1; min-width: 0; }
.t-employee-row .e-name { font-weight: 700; color: #f0f6fc; font-size: 0.9rem; }
.t-employee-row .e-meta { color: #8b949e; font-size: 0.72rem; }
.t-employee-row .e-stats { color: #c9d1d9; font-size: 0.72rem; margin-top: 3px; font-variant-numeric: tabular-nums; }
.t-employee-row .e-salary { color: #f0883e; font-weight: 700; font-size: 0.85rem; text-align: right; }
.t-employee-row .e-morale-bar {
  width: 60px; height: 4px; background: #21262d; border-radius: 2px; margin-top: 2px;
  overflow: hidden;
}
.t-employee-row .e-morale-fill { height: 100%; background: #7ee787; transition: width 0.3s; }

.t-era-band { margin-top: 14px; margin-bottom: 6px; color: #8957e5; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
.t-era-band:first-child { margin-top: 0; }
.t-research-row {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  padding: 8px 10px; background: #0d1117; border: 1px solid #21262d;
  border-radius: 4px; margin-bottom: 4px;
}
.t-research-row.completed { border-color: #238636; opacity: 0.75; }
.t-research-row.inprogress { border-color: #1f6feb; background: #0c2d4e; }
.t-research-row.locked { opacity: 0.5; }
.t-research-row .r-name { font-weight: 600; color: #f0f6fc; font-size: 0.85rem; }
.t-research-row .r-meta { color: #8b949e; font-size: 0.7rem; margin-top: 2px; }
.t-research-row .r-prog { font-size: 0.7rem; color: #58a6ff; font-variant-numeric: tabular-nums; }
.t-research-row button { padding: 4px 10px; font-size: 0.7rem; }
.t-research-row.completed .r-status { color: #7ee787; font-size: 0.75rem; font-weight: 600; }
.t-research-row.locked .r-status { color: #f0883e; font-size: 0.7rem; }
`;

  function injectStyles() {
    if (document.getElementById('tycoon-ui-styles')) return;
    const s = document.createElement('style');
    s.id = 'tycoon-ui-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ---------- DOM creation helpers ----------
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className' || k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'disabled' && v) el.disabled = true;
        else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  function fmtMoney(n) {
    if (n == null) return '$0';
    if (Math.abs(n) >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n/1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }

  function getRootEl() { return document.getElementById('tycoon-overlay'); }

  // ---------- Top bar ----------
  function renderTopBar() {
    const topbar = h('div', { className: 't-topbar tycoon-topbar' });
    const eraLabel = window.tycoonEra ? window.tycoonEra.formatDateLine(S.calendar) : '';
    const cal = h('div', { className: 't-cal' },
      window.tycoonTime.formatCalendar(S.calendar),
      eraLabel ? h('div', { style:{fontSize:'0.65rem', color:'#8957e5', fontWeight:'600', marginTop:'2px'} }, eraLabel) : null,
      h('div', { className: 't-cal-progress', title: 'Time to next week tick' },
        // Width is driven by the rAF loop in _startCalProgressLoop — starts at 0%
        h('div', { className: 't-cal-progress-fill' })
      )
    );
    const cash = h('div', { className: 't-stat' },
      h('div', { className: 't-stat-val' }, fmtMoney(S.cash)),
      h('div', { className: 't-stat-lbl' }, 'Cash')
    );
    const revenue = h('div', { className: 't-stat' },
      h('div', { className: 't-stat-val' }, fmtMoney(S.tRevenue)),
      h('div', { className: 't-stat-lbl' }, 'Lifetime Rev')
    );
    const shipped = h('div', { className: 't-stat' },
      h('div', { className: 't-stat-val' }, String(S.projects?.shipped?.length || 0)),
      h('div', { className: 't-stat-lbl' }, 'Shipped')
    );

    // Bankruptcy countdown — only when cash has been negative for 1+ weeks
    const negWeeks = S.bankruptcy?.negativeWeeks || 0;
    const bkTotal = window.tycoonFinance?.BANKRUPTCY_WEEKS || 4;
    const bankruptBlock = (!S.bankruptcy?.triggered && negWeeks > 0)
      ? h('div', {
          className: 't-bankrupt',
          title: negWeeks + ' of ' + bkTotal + ' consecutive negative-cash weeks \u2014 studio closes at ' + bkTotal + '. Recover cash above $0 to reset the counter.'
        },
          h('div', { className: 't-bankrupt-lbl' }, '\u{1F480} Bankruptcy in'),
          h('div', { className: 't-bankrupt-val' }, (bkTotal - negWeeks) + ' week' + ((bkTotal - negWeeks) === 1 ? '' : 's')),
          h('div', { className: 't-bankrupt-bar' },
            h('div', { className: 't-bankrupt-bar-fill', style: { width: (Math.min(100, (negWeeks / bkTotal) * 100)) + '%' } })
          )
        )
      : null;

    const speedBtns = h('div', { className: 't-speed' });
    const speeds = [{ s: 0, lbl: 'Pause' }, { s: 1, lbl: '1×' }, { s: 2, lbl: '2×' }, { s: 4, lbl: '4×' }, { s: 8, lbl: '8×' }];
    for (const sp of speeds) {
      const btn = h('button', {
        className: S.speed === sp.s ? 'active' : '',
        onclick: () => { window.tycoonTime.setSpeed(sp.s); refreshTopBar(); }
      }, sp.lbl);
      speedBtns.appendChild(btn);
    }

    const optionsBtn = h('button', {
      className: 't-options-btn',
      title: 'Options',
      'aria-label': 'Options',
      onclick: () => openOptionsModal()
    }, '\u2699\uFE0F');

    const exitBtn = h('button', {
      className: 't-exit',
      title: 'Persist current career to this slot and return to the slot screen',
      onclick: () => {
        // Explicit save before exit — previously we relied on the
        // markDirty autosave debounce, but a user hitting exit right
        // after a state change (hire, research tick, etc.) could lose
        // a few seconds of progress before the debounce fired.
        try { if (typeof save === 'function') save(); } catch (e) { console.error('[save-and-quit] save failed:', e); }
        tycoonUI.exit();
      }
    }, '\uD83D\uDCBE Save & Quit');

    topbar.append(cal, cash, revenue, shipped);
    if (bankruptBlock) topbar.append(bankruptBlock);
    topbar.append(speedBtns, optionsBtn, exitBtn);
    return topbar;
  }

  function refreshTopBar() {
    const root = getRootEl();
    if (!root) return;
    const old = root.querySelector('.t-topbar');
    if (old) { const fresh = renderTopBar(); old.replaceWith(fresh); }
  }

  // ---------- Options modal (Phase 6C) ----------
  function openOptionsModal() {
    const existing = document.getElementById('_t_options_modal');
    if (existing) { existing.remove(); return; }
    const hintsState = window.tycoonHints?.state?.() || { disabled: false, shown: [], total: 0 };

    const tipsBtn = h('button', {
      className: 't-opt-toggle' + (hintsState.disabled ? '' : ' on'),
      onclick: () => {
        if (!window.tycoonHints) return;
        if (S.hintsDisabled) window.tycoonHints.enable();
        else window.tycoonHints.disable();
        const ov = document.getElementById('_t_options_modal');
        if (ov) { ov.remove(); openOptionsModal(); }
      }
    }, hintsState.disabled ? 'Off' : 'On');

    const resetTipsBtn = h('button', {
      className: 't-opt-toggle',
      onclick: () => {
        if (!window.tycoonHints) return;
        window.tycoonHints.reset();
        if (typeof log === 'function') log('\u{1F4A1} Tips reset \u2014 will show again as you play.');
        const ov = document.getElementById('_t_options_modal');
        if (ov) { ov.remove(); openOptionsModal(); }
      }
    }, 'Reset');

    const ov = h('div', { className: 't-modal-ov', id: '_t_options_modal',
      onclick: (e) => { if (e.target.id === '_t_options_modal') ov.remove(); }
    },
      h('div', { className: 't-modal', style: { maxWidth: '460px' } },
        h('h2', null, '\u2699\uFE0F Options'),
        h('div', { className: 't-opt-row' },
          h('div', { className: 't-opt-label' },
            'Contextual tips',
            h('span', { className: 't-opt-sub' },
              hintsState.shown.length + '/' + hintsState.total + ' tips seen this career'
            )
          ),
          tipsBtn
        ),
        h('div', { className: 't-opt-row' },
          h('div', { className: 't-opt-label' },
            'Reset tip history',
            h('span', { className: 't-opt-sub' }, 'Clear seen tips so they can fire again.')
          ),
          resetTipsBtn
        ),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn secondary', onclick: () => ov.remove() }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  // ---------- Founder card ----------
  function renderFounderCard() {
    const f = S.founder;
    if (!f) return h('div', { className: 't-empty' }, 'No founder yet.');
    const statBox = (label, val) => h('div', { className: 't-stat-box' },
      h('div', { className: 'v' }, String(val)),
      h('div', { className: 'l' }, label)
    );
    return h('div', { className: 't-founder' },
      h('div', { className: 't-f-name' }, f.name),
      h('div', { className: 't-f-role' },
        (f.specialty || 'coder') + ' · tier ' + (f.tier || 1) +
        ' · age ' + f.age + ' · morale ' + f.morale +
        (f.traits?.length ? ' · ' + f.traits.join(', ') : '')),
      h('div', { className: 't-f-stats' },
        statBox('Design', f.stats.design),
        statBox('Tech', f.stats.tech),
        statBox('Speed', f.stats.speed),
        statBox('Polish', f.stats.polish)
      )
    );
  }

  // ---------- Employee row ----------
  function renderEmployeeRow(emp) {
    const s = emp.stats;
    const moralePct = Math.max(0, Math.min(100, emp.morale || 70));
    return h('div', { className: 't-employee-row' },
      h('div', { className: 'e-info' },
        h('div', { className: 'e-name' }, emp.name),
        h('div', { className: 'e-meta' }, emp.tierName + ' · ' + emp.specialty +
          (emp.traits?.length ? ' · ' + emp.traits[0] : '')),
        h('div', { className: 'e-stats' },
          'D ' + s.design + ' · T ' + s.tech + ' · S ' + s.speed + ' · P ' + s.polish),
        h('div', { className: 'e-morale-bar' },
          h('div', { className: 'e-morale-fill', style: { width: moralePct + '%' } }))
      ),
      h('div', null,
        h('div', { className: 'e-salary' }, fmtMoney(emp.salary) + '/yr')
      )
    );
  }

  // ---------- Project card ----------
  function renderProjectCard(proj, isShipped) {
    const progEl = (() => {
      if (isShipped) return null;
      const elapsed = window.tycoonProjects.absoluteWeek() - proj.phaseStartedAtWeek;
      const pct = Math.min(100, Math.max(0, (elapsed / proj.phaseWeeksRequired) * 100));
      return h('div', { className: 't-progbar' },
        h('div', { className: 't-progbar-fill', style: { width: pct + '%' } })
      );
    })();

    const qRow = h('div', { className: 't-proj-qual' },
      h('span', null, 'T ', h('span', { className: 'v' }, String(Math.round(proj.quality.tech)))),
      h('span', null, 'D ', h('span', { className: 'v' }, String(Math.round(proj.quality.design)))),
      h('span', null, 'P ', h('span', { className: 'v' }, String(Math.round(proj.quality.polish))))
    );

    // v10.1: show both critic and user scores, with auto-label when they
    // diverge noticeably. Also surface sales tail if this project is still
    // earning post-launch.
    let criticEl = null;
    if (isShipped && proj.criticScore) {
      const bits = ['Critic ' + proj.criticScore + '/100'];
      if (typeof proj.userScore === 'number') {
        bits.push('Users ' + proj.userScore + '/100');
      }
      // Auto-label
      if (typeof proj.userScore === 'number') {
        const delta = proj.userScore - proj.criticScore;
        if (delta >= 10) bits.push('— cult hit');
        else if (delta <= -10) bits.push('— reviewer favorite');
      }
      let line = bits.slice(0, 2).join(' / ') + (bits[2] ? ' ' + bits[2] : '');
      if (proj.launchSales) line += ' · ' + fmtMoney(proj.launchSales);
      if (proj.tailSales) line += ' (+' + fmtMoney(proj.tailSales) + ' tail)';
      criticEl = h('div', { className: 't-proj-critic' }, line);
    }

    const typeDef = window.PROJECT_TYPES[proj.type];
    const platDef = proj.platform ? window.tycoonPlatforms?.PLATFORM_BY_ID?.[proj.platform] : null;
    // Own-IP shipped projects open the detail/graph modal on click.
    // Contracts are non-clickable (no tail, no meaningful sales graph).
    const isClickable = isShipped && !proj.isContract;
    const cardProps = {
      className: 't-proj-card ' + (isShipped ? 'shipped' : '') + (isClickable ? ' t-proj-clickable' : '')
    };
    if (isClickable) {
      cardProps.onclick = () => openShippedProjectModal(proj.id);
      cardProps.title = 'Click for sales breakdown + reviews';
    }
    return h('div', cardProps,
      h('div', { className: 't-proj-name' },
        (typeDef?.icon || '') + ' ' + proj.name),
      h('div', { className: 't-proj-meta' },
        (typeDef?.label || proj.type) + ' · ' +
        (window.PROJECT_SCOPES[proj.scope]?.label || proj.scope) + ' scope' +
        (platDef ? ' · ' + platDef.icon + ' ' + platDef.name : '') +
        (proj.isContract ? ' · contract' : ' · own IP')),
      h('div', { className: 't-proj-phase ' + proj.phase }, proj.phase),
      progEl,
      qRow,
      criticEl
    );
  }

  // ---------- Marketing channels modal (Phase 4E) ----------
  function openMarketingModal(projId) {
    closeMarketingModal();
    const proj = window.tycoonProjects.find(projId);
    if (!proj) return;
    const selected = new Set(proj.marketingChannels || []);
    const available = window.tycoonMarketing?.availableChannels?.(S.calendar?.year) || [];

    // Auto-pause game while player decides
    const prevPaused = S.paused;
    S.paused = true;
    refreshTopBar();

    function render() {
      const totalCost = window.tycoonMarketing.totalCost([...selected]);
      const affordable = (S.cash || 0) >= totalCost;
      const tempProj = { ...proj, marketingChannels: [...selected] };
      const mult = window.tycoonMarketing.computeMarketingMultiplier(tempProj);

      const ov = h('div', { className: 't-modal-ov', id: '_t_marketing_modal' },
        h('div', { className: 't-modal', style: { maxWidth: '620px' } },
          h('h2', null, '📣 Marketing — ' + proj.name),
          h('div', { style: { color:'#8b949e', fontSize:'0.8rem', marginBottom:'12px' } },
            'Polish phase: pick channels to boost launch sales. ' +
            'Synergy bonuses apply for matched combos.'),

          // Channel list
          h('div', null, ...available.map(ch => {
            const picked = selected.has(ch.id);
            const eff = ch.effectiveness[proj.type] || ch.effectiveness.all || 1;
            const effPct = Math.round((eff - 1) * 100);
            const effLabel = effPct > 0 ? '+' + effPct + '%' : (effPct < 0 ? effPct + '%' : '—');
            return h('div', {
              className: 't-feat-card' + (picked ? ' picked' : ''),
              onclick: () => {
                if (picked) selected.delete(ch.id);
                else selected.add(ch.id);
                document.getElementById('_t_marketing_modal')?.remove();
                render();
              }
            },
              h('div', { className: 'n' },
                ch.icon + ' ' + ch.name,
                h('span', { className: 'c' }, fmtMoney(ch.cost) + ' · ' + effLabel)),
              h('div', { className: 'm' }, ch.desc)
            );
          })),

          // Summary
          h('div', { style: { marginTop:'16px', padding:'10px', background:'#0d1117', border:'1px solid #30363d', borderRadius:'4px' } },
            h('div', { style:{ color:'#c9d1d9', fontSize:'0.85rem', fontWeight:'700' } },
              selected.size + ' channel' + (selected.size===1?'':'s') + ' · Total cost ' + fmtMoney(totalCost) + ' · Sales multiplier ×' + mult.mult.toFixed(2)),
            mult.synergies.length > 0 && h('div', { style:{ color:'#f0883e', fontSize:'0.72rem', marginTop:'4px' } },
              '⚡ Synergies: ' + mult.synergies.map(s => s.label + ' (+' + Math.round((s.mult-1)*100) + '%)').join(', ')),
            !affordable && h('div', { style:{ color:'#f85149', fontSize:'0.72rem', marginTop:'4px' } },
              '⚠ Not enough cash. Need ' + fmtMoney(totalCost - (S.cash || 0)) + ' more.')
          ),

          h('div', { className: 't-modal-actions' },
            h('button', { className: 't-btn secondary', onclick: () => {
              // Cancel — keep no channels
              S.paused = prevPaused;
              refreshTopBar();
              closeMarketingModal();
            }}, 'Skip (no marketing)'),
            h('button', { className: 't-btn',
              disabled: !affordable ? 'disabled' : null,
              onclick: () => {
                if (!affordable) return;
                // Charge + store
                S.cash -= totalCost;
                S.tExpenses = (S.tExpenses || 0) + totalCost;
                proj.marketingChannels = [...selected];
                proj.marketingSpend = totalCost;
                markDirty();
                S.paused = prevPaused;
                refreshTopBar();
                closeMarketingModal();
                pushToast('Marketing locked: ' + selected.size + ' channel' + (selected.size===1?'':'s') + ' · ' + fmtMoney(totalCost));
              }
            }, selected.size === 0 ? 'Confirm (no marketing)' : 'Confirm — ' + fmtMoney(totalCost))
          )
        )
      );
      document.body.appendChild(ov);
    }
    render();
  }

  function closeMarketingModal() {
    const ov = document.getElementById('_t_marketing_modal');
    if (ov) ov.remove();
  }

  // ---------- Market panel modal (Phase 4B) ----------
  function openMarketModal() {
    closeMarketModal();
    const activeRivals = (S.rivals || []).filter(r => r.status === 'active');
    const upcoming = window.tycoonRivals?.upcomingRivalReleases?.(8) || [];
    const heat = window.tycoonMarket?.state?.() || {};
    const recentReleases = (S.rivalShippedTitles || []).slice(-6).reverse();

    const ov = h('div', { className: 't-modal-ov', id: '_t_market_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '720px' } },
        h('h2', null, '📊 Market & Rivals'),

        // ----- Genre Heat -----
        h('div', { style:{ marginBottom: '16px' } },
          h('div', { className: 't-era-band', style: { marginTop: 0 } }, 'Genre Heat'),
          h('div', null, ...window.tycoonMarket.TRACKED_TYPES
            .filter(t => window.isProjectTypeAvailable ? window.isProjectTypeAvailable(t) : true)
            .map(type => {
              const typeDef = window.PROJECT_TYPES[type];
              const h_ = heat[type] || { icons:'🔥', trend:'→', heat:0 };
              return h('div', { className: 't-finance-row' },
                h('span', { className: 'lbl' }, (typeDef?.icon || '') + ' ' + (typeDef?.label || type)),
                h('span', { className: 'val' }, h_.icons + ' ' + h_.trend)
              );
            })
          )
        ),

        // ----- Platform Health -----
        window.tycoonPlatforms && h('div', { style:{ marginBottom: '16px' } },
          h('div', { className: 't-era-band' }, 'Platform Health'),
          h('div', null, ...window.tycoonPlatforms.PLATFORMS
            .filter(p => window.tycoonPlatforms.getPhase(p) !== null)
            .map(p => {
              const phase = window.tycoonPlatforms.getPhase(p);
              const phaseLbl = window.tycoonPlatforms.phaseLabel(p);
              const mult = window.tycoonPlatforms.phaseMultiplier(p);
              const color = phase === 'dead' ? '#f85149' : phase === 'decline' ? '#f0883e' :
                            phase === 'peak' ? '#7ee787' : '#c9d1d9';
              return h('div', { className: 't-finance-row' },
                h('span', { className: 'lbl' }, p.icon + ' ' + p.name +
                  (p.royaltyCut > 0 ? ' (' + Math.round(p.royaltyCut*100) + '% cut)' : '')),
                h('span', { style:{ color, fontWeight:'700', fontVariantNumeric:'tabular-nums' } },
                  phaseLbl + ' (×' + mult.toFixed(1) + ')')
              );
            })
          )
        ),

        // ----- Active Rivals -----
        h('div', { style:{ marginBottom: '16px' } },
          h('div', { className: 't-era-band' }, 'Active Rivals (' + activeRivals.length + ')'),
          h('div', null, ...activeRivals.map(renderRivalRow))
        ),

        // ----- Subsidiaries (Phase 5D) -----
        window.tycoonSubsidiaries && h('div', { style:{ marginBottom: '16px' } },
          h('div', { className: 't-era-band' }, 'Your Subsidiaries (' + (S.subsidiaries?.length || 0) + ')'),
          renderSubsidiariesSection()
        ),

        // ----- Upcoming rival releases -----
        upcoming.length > 0 && h('div', { style:{ marginBottom: '16px' } },
          h('div', { className: 't-era-band' }, 'Upcoming Rival Releases'),
          h('div', null, ...upcoming.map(r =>
            h('div', { className: 't-finance-row' },
              h('span', { className: 'lbl' }, r.rivalIcon + ' ' + r.rivalName + ' — ' + r.title),
              h('span', { className: 'val' }, 'in ' + r.weeksUntil + 'wk')
            )
          ))
        ),

        // ----- Recent releases (player + rival context) -----
        recentReleases.length > 0 && h('div', { style:{ marginBottom: '8px' } },
          h('div', { className: 't-era-band' }, 'Recent Rival Releases'),
          h('div', null, ...recentReleases.map(r =>
            h('div', { className: 't-finance-row' },
              h('span', { className: 'lbl' }, r.rivalIcon + ' ' + r.title + ' · ' + r.year),
              h('span', { className: 'val' }, 'critic ' + r.critic)
            )
          ))
        ),

        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: closeMarketModal }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function closeMarketModal() {
    const ov = document.getElementById('_t_market_modal');
    if (ov) ov.remove();
  }

  function renderRivalRow(rival) {
    const tierLbl = 'T' + rival.tier;
    const revLbl = fmtMoney(rival.revenue);
    const trajArrow = rival.trajectory > 0.05 ? '↗' : rival.trajectory < -0.05 ? '↘' : '→';
    const trajColor = rival.trajectory > 0.05 ? '#7ee787' : rival.trajectory < -0.05 ? '#f85149' : '#8b949e';
    const researching = rival.inProgress ?
      ' · 🔬 ' + (window.tycoonResearch?.NODE_BY_ID?.[rival.inProgress.nodeId]?.name || '?') : '';
    const nextRelease = rival.nextProject ?
      ' · 🚀 ' + rival.nextProject.name + ' (' + Math.max(0, rival.nextProject.releaseAtWeek - (window.tycoonProjects?.absoluteWeek?.() || 0)) + 'wk)' : '';
    // Phase 4I: acquisition button
    const canAcq = window.tycoonRivals?.canAcquire?.(rival.id);
    const cost = window.tycoonRivals?.acquisitionCost?.(rival.id);
    const acqBtn = canAcq?.ok ?
      h('button', { className: 't-btn secondary', style:{padding:'4px 8px',fontSize:'0.7rem', marginTop:'6px'},
        onclick: () => {
          if (!confirm('Acquire ' + rival.name + ' for ' + fmtMoney(cost) + '?')) return;
          const r = window.tycoonRivals.acquire(rival.id);
          if (!r.ok) { pushToast(r.error); return; }
          pushToast('💼 Acquired ' + r.rivalName + ' — +' + r.fameGain + ' Fame, ex-engineers available');
          rerenderMarketModal();
          refreshTopBar();
          refreshMain();
        }
      }, '💼 Acquire ' + fmtMoney(cost)) :
      (cost != null ? h('div', { style:{color:'#8b949e', fontSize:'0.7rem', marginTop:'4px'} },
        '💼 Acquisition: ' + fmtMoney(cost) + (canAcq?.reason ? ' (' + canAcq.reason + ')' : '')) : null);

    return h('div', { style:{
      padding: '10px 12px', background:'#0d1117', border:'1px solid #21262d',
      borderRadius:'4px', marginBottom:'6px'
    } },
      h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'baseline'} },
        h('div', { style:{ fontWeight:'700', color:'#f0f6fc', fontSize:'0.85rem' } },
          rival.icon + ' ' + rival.name),
        h('div', { style:{color: trajColor, fontSize:'0.85rem', fontWeight:'700'} },
          tierLbl + ' ' + revLbl + '/yr ' + trajArrow)
      ),
      h('div', { style:{ color:'#8b949e', fontSize:'0.72rem', marginTop:'2px' } },
        'Focus: ' + (rival.focus || []).join(', ') +
        ' · ' + (rival.shippedCount || 0) + ' shipped' +
        ' · quality ~' + rival.quality +
        researching + nextRelease),
      acqBtn
    );
  }

  function rerenderMarketModal() {
    if (document.getElementById('_t_market_modal')) {
      closeMarketModal();
      openMarketModal();
    }
  }

  function renderSubsidiariesSection() {
    const subs = S.subsidiaries || [];
    const canCreate = window.tycoonSubsidiaries?.canCreate?.();
    const cost = window.tycoonSubsidiaries?.creationCost?.() || 0;

    const rows = subs.map(s => {
      const nextStr = s.nextProject ?
        ' · 🚀 ' + s.nextProject.name + ' (' + Math.max(0, s.nextProject.releaseAtWeek - (window.tycoonProjects?.absoluteWeek?.() || 0)) + 'wk)' : '';
      return h('div', { style:{padding:'10px 12px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px', marginBottom:'6px'} },
        h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'baseline'} },
          h('div', { style:{fontWeight:'700', color:'#f0f6fc', fontSize:'0.85rem'} },
            '🏭 ' + s.name),
          h('div', { style:{color:'#8b949e', fontSize:'0.72rem'} },
            s.focus + ' · ' + s.shippedCount + ' shipped')
        ),
        h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginTop:'2px'} },
          'Quality ~' + s.quality + ' · $' + s.monthlyCost.toLocaleString() + '/mo upkeep' + nextStr)
      );
    });

    // Create button
    const createRow = canCreate?.ok ?
      h('div', { style:{padding:'8px 10px', background:'#0c2d4e', border:'1px solid #1f6feb', borderRadius:'4px', marginTop:'6px'} },
        h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center'} },
          h('div', null,
            h('div', { style:{color:'#f0f6fc', fontWeight:'700'} }, '+ Spin up new subsidiary'),
            h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginTop:'2px'} },
              'Cost: ' + fmtMoney(cost) + ' · $200K/mo upkeep · auto-ships every 18-24 weeks')
          ),
          h('button', { className: 't-btn', onclick: () => {
            const name = prompt('Subsidiary name:', 'Acme Studios ' + ((S.subsidiaries?.length || 0) + 1));
            if (!name) return;
            const availTypes = Object.keys(window.PROJECT_TYPES || {}).filter(t => window.isProjectTypeAvailable?.(t));
            const focus = prompt('Focus genre (' + availTypes.join(', ') + '):', availTypes[0] || 'game');
            if (!focus) return;
            const r = window.tycoonSubsidiaries.create(name, focus);
            if (!r.ok) { pushToast(r.error); return; }
            pushToast('🏭 Subsidiary created: ' + r.sub.name);
            rerenderMarketModal();
            refreshTopBar();
          }}, 'Create')
        )
      ) :
      h('div', { style:{padding:'8px 10px', color:'#8b949e', fontSize:'0.75rem', marginTop:'6px', fontStyle:'italic'} },
        '🔒 Subsidiary creation locked: ' + (canCreate?.reason || 'unknown'));

    return h('div', null, subs.length === 0 ? null : h('div', null, ...rows), createRow);
  }

  // ---------- Teams modal (Phase 3F) ----------
  function openTeamsModal() {
    closeTeamsModal();
    const active = S.projects?.active || [];
    const bench = window.tycoonTeams?.getBench?.() || [];

    const renderEngineerPill = (eng, projId) => {
      const label = (eng.isFounder ? '👑 ' : '') + eng.name +
        ' · ' + (eng.tierName || 'T?') + ' ' + (eng.specialty || '');
      const id = eng.isFounder ? 'founder' : eng.id;
      return h('div', { style: { display:'flex', alignItems:'center', gap:'8px', padding:'6px 8px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px', marginBottom:'4px', fontSize:'0.8rem' } },
        h('span', { style: { flex:1, color:'#c9d1d9' } }, label),
        projId ?
          h('button', { className: 't-btn secondary', style: { padding:'3px 8px', fontSize:'0.7rem' }, onclick: () => {
            window.tycoonTeams.unassign(id);
            rerenderTeamsModal();
          }}, 'Remove') :
          active.length > 0 ? h('select', {
            style: { padding:'3px 6px', fontSize:'0.7rem', background:'#161b22', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:'3px' },
            onchange: (e) => {
              const targetProjId = e.target.value;
              if (!targetProjId) return;
              window.tycoonTeams.assign(id, targetProjId);
              rerenderTeamsModal();
            }
          },
            h('option', { value: '' }, 'Assign to…'),
            ...active.map(p => h('option', { value: p.id }, p.name))
          ) : null
      );
    };

    const renderProjectSection = (proj) => {
      const team = (proj.team || []).map(id => {
        if (id === 'founder') return S.founder;
        return (S.employees || []).find(e => e.id === id);
      }).filter(Boolean);
      const typeDef = window.PROJECT_TYPES[proj.type];
      return h('div', { style: { marginBottom:'18px' } },
        h('div', { style: { fontSize:'0.85rem', fontWeight:'700', color:'#f0f6fc', marginBottom:'4px' } },
          (typeDef?.icon || '') + ' ' + proj.name + ' (' + proj.phase + ')'),
        team.length === 0 ?
          h('div', { className: 't-empty', style: { padding:'8px 0', fontSize:'0.8rem' } }, 'No team assigned — will use bench fallback.') :
          h('div', null, ...team.map(eng => renderEngineerPill(eng, proj.id)))
      );
    };

    const ov = h('div', { className: 't-modal-ov', id: '_t_teams_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '620px' } },
        h('h2', null, '👥 Teams'),
        h('div', { style: { color:'#8b949e', fontSize:'0.8rem', marginBottom:'12px' } },
          active.length + ' active project' + (active.length === 1 ? '' : 's') + ' · ' +
          bench.length + ' on bench'),
        active.length === 0 ?
          h('div', { className: 't-empty' }, 'No active projects. Create one from the Studio panel.') :
          h('div', null, ...active.map(renderProjectSection)),
        h('h2', { style: { marginTop:'8px', fontSize:'0.85rem' } },
          'Bench (' + bench.length + ')'),
        bench.length === 0 ?
          h('div', { className: 't-empty', style: { padding:'8px 0' } }, 'Everyone is assigned.') :
          h('div', null, ...bench.map(eng => renderEngineerPill(eng, null))),
        // Bulk-assign controls — only useful when there's bench AND at least
        // one active project. Single-project case: one-click assign. Multi:
        // dropdown + button.
        (bench.length > 0 && active.length > 0) && (() => {
          let selected = active[0].id;
          const doBulk = () => {
            const target = selected;
            const targetName = active.find(p => p.id === target)?.name || 'project';
            let moved = 0;
            for (const eng of bench) {
              const id = eng.isFounder ? 'founder' : eng.id;
              const r = window.tycoonTeams.assign(id, target);
              if (r?.ok) moved++;
            }
            pushToast('👥 Assigned ' + moved + ' to ' + targetName, 'win');
            rerenderTeamsModal();
          };
          if (active.length === 1) {
            return h('button', {
              className: 't-btn',
              style: { marginTop:'10px', width:'100%' },
              onclick: doBulk
            }, '\u21AA Assign all ' + bench.length + ' bench to ' + active[0].name);
          }
          return h('div', { style: { marginTop:'10px', display:'flex', gap:'6px' } },
            h('select', {
              style: { flex:'1 1 auto', padding:'6px 8px', background:'#161b22', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:'4px', fontFamily:'inherit', fontSize:'0.8rem' },
              onchange: (e) => { selected = e.target.value; }
            },
              ...active.map(p => h('option', { value: p.id }, p.name))
            ),
            h('button', { className: 't-btn', style: { flex:'0 0 auto' }, onclick: doBulk },
              'Assign all ' + bench.length)
          );
        })(),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: closeTeamsModal }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function closeTeamsModal() {
    const ov = document.getElementById('_t_teams_modal');
    if (ov) ov.remove();
    // Sidebar Teams button carries an idle-count badge; refresh so it
    // reflects the post-reassignment bench state.
    refreshMain();
  }

  function rerenderTeamsModal() {
    if (document.getElementById('_t_teams_modal')) {
      closeTeamsModal();
      openTeamsModal();
    }
  }

  // ---------- Research panel modal ----------
  function openResearchModal() {
    if (!window.tycoonResearch) return;
    closeResearchModal();
    const nodes = window.tycoonResearch.NODES;
    // Group by era bucket
    const byEra = {};
    for (const n of nodes) {
      const era = window.tycoonEra?.current(n.era) || { label: 'Era ' + n.era };
      const key = era.id || era.label;
      if (!byEra[key]) byEra[key] = { era, nodes: [] };
      byEra[key].nodes.push(n);
    }
    // Sort eras by first node's era year
    const eraKeys = Object.keys(byEra).sort((a,b) => byEra[a].nodes[0].era - byEra[b].nodes[0].era);

    const ov = h('div', { className: 't-modal-ov', id: '_t_research_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '720px' } },
        h('h2', null, '🔬 Research'),
        h('div', { style: { color:'#8b949e', fontSize:'0.8rem', marginBottom:'10px' } },
          (window.tycoonResearch.state().completedCount) + ' completed · ' +
          (S.research?.inProgress ? 'Researching ' + window.tycoonResearch.NODE_BY_ID[S.research.inProgress.nodeId]?.name : 'No active research')),
        ...eraKeys.map(key => {
          const group = byEra[key];
          return h('div', null,
            h('div', { className: 't-era-band' }, (group.era.icon || '') + ' ' + group.era.label),
            ...group.nodes.map(n => renderResearchRow(n))
          );
        }),
        // Hardware section (Phase 3D)
        window.tycoonHardware && h('div', { style: { marginTop:'16px' } },
          h('h2', { style: { marginTop:'0', fontSize:'0.85rem' } }, '⚙ Hardware'),
          ...window.tycoonHardware.ITEMS.map(hw => renderHardwareRow(hw))
        ),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: closeResearchModal }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function renderHardwareRow(hw) {
    const HW = window.tycoonHardware;
    const isOwned = HW.isOwned(hw.id);
    const avail = HW.isAvailableToBuy(hw.id);
    let rightSide;
    if (isOwned) {
      rightSide = h('div', { className: 'r-status' }, '✓ Owned');
    } else if (avail.ok) {
      rightSide = h('button', { className: 't-btn', onclick: () => {
        const r = HW.purchase(hw.id);
        if (!r.ok) pushToast(r.error);
        else pushToast('Purchased: ' + hw.name);
        rerenderResearchModal();
        refreshTopBar();
      }}, 'Buy ' + fmtMoney(hw.upfront));
    } else {
      rightSide = h('div', { className: 'r-status' }, '🔒 ' + avail.reason);
    }
    return h('div', { className: 't-research-row ' + (isOwned ? 'completed' : !avail.ok ? 'locked' : '') },
      h('div', { style: { flex:1, minWidth:0 } },
        h('div', { className: 'r-name' }, hw.icon + ' ' + hw.name),
        h('div', { className: 'r-meta' },
          fmtMoney(hw.upfront) + ' upfront' +
          (hw.monthly ? ' + ' + fmtMoney(hw.monthly) + '/mo' : '') +
          (hw.era > 1980 ? ' · ' + hw.era + '+' : '') +
          (hw.unlocks.length ? ' · unlocks ' + hw.unlocks.length + ' node' + (hw.unlocks.length>1?'s':'') : '') +
          ' — ' + hw.desc)
      ),
      rightSide
    );
  }

  function closeResearchModal() {
    const ov = document.getElementById('_t_research_modal');
    if (ov) ov.remove();
  }

  function renderResearchRow(node) {
    const R = window.tycoonResearch;
    const isDone = R.isCompleted(node.id);
    const ip = S.research?.inProgress;
    const isInProg = ip?.nodeId === node.id;
    const avail = R.isAvailable(node.id);
    const categoryIcons = { tech:'🛠️', genre:'🎮', efficiency:'⚙️', platform:'💻', business:'💼' };

    const rowClass = 't-research-row' + (isDone ? ' completed' : isInProg ? ' inprogress' : avail.ok ? '' : ' locked');

    // Show Pioneer badge if applicable
    const pioneerOwner = S.researchPioneers?.[node.id];
    const pioneerBadge = pioneerOwner ? (() => {
      if (pioneerOwner === 'player') return h('span', { style:{color:'#f0883e', fontWeight:'700', fontSize:'0.7rem', marginLeft:'6px'} }, '🏆 Pioneer');
      const rival = (S.rivals || []).find(r => r.id === pioneerOwner);
      return h('span', { style:{color:'#8b949e', fontSize:'0.7rem', marginLeft:'6px'} }, '🥈 ' + (rival?.name || pioneerOwner));
    })() : null;

    // Rival progress on this node (if any rival is actively researching it)
    const rivalProgs = (S.rivals || []).map(r => {
      const p = window.tycoonRivals?.rivalResearchProgress?.(r.id, node.id);
      if (!p || p.status !== 'in_progress') return null;
      return r.icon + ' ' + r.name + ' ' + p.pct + '%';
    }).filter(Boolean);

    const leftSide = h('div', { style: { flex:1, minWidth: 0 } },
      h('div', { className: 'r-name' },
        (categoryIcons[node.category] || '') + ' ' + node.name,
        pioneerBadge
      ),
      h('div', { className: 'r-meta' },
        node.rpCost + ' RP · ' + (node.category) + (node.era > 1980 ? ' · ' + node.era + '+' : '') +
        (node.hardware ? ' · ⚙ hw:' + node.hardware : '') +
        (rivalProgs.length ? ' · 🏁 ' + rivalProgs.join(', ') : '') +
        (node.desc ? ' — ' + node.desc : ''))
    );
    let rightSide;
    if (isDone) {
      rightSide = h('div', { className: 'r-status' }, '✓ Complete');
    } else if (isInProg) {
      rightSide = h('div', null,
        h('div', { className: 'r-prog' }, ip.rpEarned.toFixed(0) + '/' + node.rpCost + ' RP'),
        h('button', { className: 't-btn secondary', onclick: () => {
          R.stop();
          rerenderResearchModal();
        }}, 'Stop')
      );
    } else if (avail.ok) {
      rightSide = h('button', { className: 't-btn', onclick: () => {
        const r = R.start(node.id, 'founder');
        if (!r.ok) pushToast(r.error);
        rerenderResearchModal();
      }}, 'Start');
    } else {
      rightSide = h('div', { className: 'r-status' }, '🔒 ' + avail.reason);
    }

    return h('div', { className: rowClass }, leftSide, rightSide);
  }

  function rerenderResearchModal() {
    if (document.getElementById('_t_research_modal')) {
      closeResearchModal();
      openResearchModal();
    }
  }

  // ---------- Shipped project detail modal (sales graph + breakdown) ----------
  function closeShippedProjectModal() {
    const ov = document.getElementById('_t_proj_detail_modal');
    if (ov) ov.remove();
  }

  // Build the 24-week sales projection graph as inline SVG.
  // v10.2 data model: weekRevenue(proj, weekIndex) distributes the launch
  // spike over the first half of the (doubled) tail with front-loaded
  // weights; the second half pays the flat tail rate.
  //   Actual weeks (weeksSinceLaunch ≤): solid bars + solid cumulative
  //   Projected weeks (> weeksSinceLaunch): transparent bars + dashed cum
  function buildSalesGraph(proj) {
    const MAX_WEEKS = 24;
    const tailWeeks = proj.tailWeeksTotal || 0;
    const currentWk = window.tycoonProjects?.absoluteWeek?.() || 0;
    const weeksSinceLaunch = Math.max(0, currentWk - (proj.shippedAtWeek || 0));
    // Build per-week data using the canonical formula
    const weekly = [];
    const cumulative = [];
    const weekRev = window.tycoonProjects?.weekRevenue;
    let cum = 0;
    for (let wk = 0; wk <= MAX_WEEKS; wk++) {
      const val = (wk < tailWeeks && weekRev) ? (weekRev(proj, wk) || 0) : 0;
      weekly.push(val);
      cum += val;
      cumulative.push(cum);
    }
    const maxWeekly = Math.max(...weekly, 1);
    const maxCum = Math.max(...cumulative, 1);
    // v10.2: breakeven line includes BOTH marketing spend and team salary
    // paid across the project's duration. That's the real "what the
    // project cost" baseline the cumulative line needs to cross to be
    // genuinely profitable.
    const marketingSpend = proj.marketingSpend || 0;
    const salaryCost = Math.round(proj.salaryCost || 0);
    const breakeven = marketingSpend + salaryCost;

    // SVG dimensions
    const W = 600, H = 220;
    const padL = 52, padR = 46, padT = 14, padB = 28;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const colW = plotW / (MAX_WEEKS + 1);

    // Format helper for axis labels
    const fmtK = (v) => {
      if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
      if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';
      return '$' + Math.round(v);
    };

    // Y positions
    const yForWeekly = (v) => padT + plotH - (v / maxWeekly) * plotH;
    const yForCum    = (v) => padT + plotH - (v / maxCum) * plotH;

    // Build SVG elements as string for simplicity
    const parts = [];
    // axes
    parts.push(`<line class="t-pd-graph-axis" x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+plotH}"/>`);
    parts.push(`<line class="t-pd-graph-axis" x1="${W-padR}" y1="${padT}" x2="${W-padR}" y2="${padT+plotH}"/>`);
    parts.push(`<line class="t-pd-graph-axis" x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}"/>`);

    // Left y-axis labels (weekly revenue)
    for (let i = 0; i <= 4; i++) {
      const v = maxWeekly * (i / 4);
      const y = padT + plotH - (i/4)*plotH;
      parts.push(`<text class="t-pd-graph-label" x="${padL-4}" y="${y+3}" text-anchor="end">${fmtK(v)}</text>`);
    }
    // Right y-axis labels (cumulative)
    for (let i = 0; i <= 4; i++) {
      const v = maxCum * (i / 4);
      const y = padT + plotH - (i/4)*plotH;
      parts.push(`<text class="t-pd-graph-label" x="${W-padR+4}" y="${y+3}" text-anchor="start">${fmtK(v)}</text>`);
    }
    // Axis titles
    parts.push(`<text class="t-pd-graph-label axis-title" x="${padL-40}" y="${padT-2}" text-anchor="start">Weekly</text>`);
    parts.push(`<text class="t-pd-graph-label axis-title" x="${W-padR+4}" y="${padT-2}" text-anchor="start">Cumul.</text>`);

    // X-axis labels (weeks) — every 4 weeks since we span 24 now
    for (let wk = 0; wk <= MAX_WEEKS; wk += 4) {
      const x = padL + colW * (wk + 0.5);
      parts.push(`<text class="t-pd-graph-label" x="${x}" y="${H-padB+12}" text-anchor="middle">w${wk}</text>`);
    }

    // Bars (weekly)
    for (let wk = 0; wk <= MAX_WEEKS; wk++) {
      const val = weekly[wk];
      if (val <= 0) continue;
      const barH = (val / maxWeekly) * plotH;
      const x = padL + colW * wk + 2;
      const y = padT + plotH - barH;
      const projected = wk > weeksSinceLaunch;
      parts.push(`<rect class="t-pd-graph-bar${projected ? ' projected' : ''}" x="${x}" y="${y}" width="${colW-4}" height="${barH}" data-wk="${wk}"/>`);
    }

    // Cumulative line — split into past (solid) and future (dashed) segments
    const buildLine = (fromWk, toWk, projected) => {
      const pts = [];
      for (let wk = fromWk; wk <= toWk; wk++) {
        const x = padL + colW * (wk + 0.5);
        const y = yForCum(cumulative[wk]);
        pts.push(`${x},${y}`);
      }
      if (pts.length < 2) return '';
      return `<polyline class="t-pd-graph-cum${projected ? ' projected' : ''}" points="${pts.join(' ')}"/>`;
    };
    const splitWk = Math.min(weeksSinceLaunch, MAX_WEEKS);
    if (splitWk >= 1) parts.push(buildLine(0, splitWk, false));
    if (splitWk < MAX_WEEKS) parts.push(buildLine(Math.max(0, splitWk), MAX_WEEKS, true));

    // Breakeven horizontal line on the cumulative axis.
    // v10.2: breakeven = marketing spend + total team salary paid during
    // dev/polish/design weeks. The cumulative-revenue line crossing this
    // is the real "profitable" moment.
    if (breakeven > 0 && breakeven <= maxCum) {
      const by = yForCum(breakeven);
      parts.push(`<line class="t-pd-graph-breakeven" x1="${padL}" y1="${by}" x2="${W-padR}" y2="${by}"/>`);
      const label = salaryCost > 0 && marketingSpend > 0
        ? `breakeven: ${fmtK(breakeven)} (mkt ${fmtK(marketingSpend)} + salary ${fmtK(salaryCost)})`
        : `breakeven: ${fmtK(breakeven)}`;
      parts.push(`<text class="t-pd-graph-label" x="${W-padR-4}" y="${by-3}" text-anchor="end" style="fill:#ff7b72">${label}</text>`);
    }

    const svg = `<svg class="t-pd-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-max-weekly="${maxWeekly}" data-max-cum="${maxCum}" data-weeks-since-launch="${weeksSinceLaunch}">${parts.join('')}</svg>`;
    return { svg, weekly, cumulative, weeksSinceLaunch, tailWeeks, maxWeekly, maxCum, breakeven, salaryCost, marketingSpend };
  }

  function openShippedProjectModal(projId) {
    closeShippedProjectModal();
    const proj = (S.projects?.shipped || []).find(p => p.id === projId);
    if (!proj) return;
    const typeDef = window.PROJECT_TYPES[proj.type];
    const platDef = proj.platform ? window.tycoonPlatforms?.PLATFORM_BY_ID?.[proj.platform] : null;

    // --- Awards won by this project (match by title across yearly ceremonies) ---
    const awardsWon = [];
    for (const year of (S.awards?.history || [])) {
      const ws = year.winners || {};
      if (ws.goty?.source === 'player' && ws.goty.title === proj.name) awardsWon.push('🏆 Game of the Year ' + year.year);
      if (ws.risingStar?.source === 'player' && ws.risingStar.title === proj.name) awardsWon.push('⭐ Rising Star ' + year.year);
      if (ws.innovation?.source === 'player' && ws.innovation.title === proj.name) awardsWon.push('💡 Innovation ' + year.year);
      for (const [genre, w] of Object.entries(ws.bestInGenre || {})) {
        if (w.source === 'player' && w.title === proj.name) awardsWon.push('🎯 Best ' + (window.PROJECT_TYPES[genre]?.label || genre) + ' ' + year.year);
      }
    }

    // --- Portfolio comparison: this project vs studio average own-IP revenue ---
    const ownIp = (S.projects?.shipped || []).filter(p => !p.isContract && p.id !== proj.id);
    const avgRev = ownIp.length
      ? Math.round(ownIp.reduce((s, p) => s + (p.launchSales || 0) + (p.tailSales || 0), 0) / ownIp.length)
      : 0;
    const thisTotal = (proj.launchSales || 0) + (proj.tailSales || 0);
    let portfolioComparison = null;
    if (ownIp.length > 0 && avgRev > 0) {
      const pct = Math.round(((thisTotal / avgRev) - 1) * 100);
      const sign = pct >= 0 ? '+' : '';
      const color = pct >= 0 ? '#7ee787' : '#ff7b72';
      portfolioComparison = h('div', { style: { color, fontSize: '0.85rem' } },
        sign + pct + '% vs studio average (avg ' + fmtMoney(avgRev) + ' over ' + ownIp.length + ' own-IP ships)');
    }

    // --- Launch breakdown ---
    // Values are stored on the project at ship time
    const critic = proj.criticScore || 0;
    let thresholdMul = 1;
    if (critic >= 98) thresholdMul = 25;
    else if (critic >= 95) thresholdMul = 10;
    const base = Math.round(Math.pow(Math.max(critic, 10) / 50, 2.0) * 100000);
    const scopeMul = proj.scope === 'small' ? 1 : proj.scope === 'medium' ? 2.5 : 6;
    const platformMul = proj.platformPhaseMult && proj.platformRoyaltyCut != null
      ? proj.platformPhaseMult * (1 - proj.platformRoyaltyCut) : null;
    const synergies = proj.marketingSynergies || [];
    const breakdownParts = [
      h('div', null, h('span', { className: 'k' }, 'Base from critic ' + critic + (thresholdMul > 1 ? ' × ' + thresholdMul + ' jackpot' : '') + ':'), ' ', h('span', { className: 'v' }, fmtMoney(base * thresholdMul))),
      h('div', null, h('span', { className: 'k' }, 'Scope:'), ' ', h('span', { className: 'mul' }, '× ' + scopeMul)),
      platformMul != null ? h('div', null, h('span', { className: 'k' }, (platDef?.icon || '') + ' ' + (platDef?.name || 'Platform') + ':'), ' ', h('span', { className: 'mul' }, '× ' + platformMul.toFixed(2) + ' (royalty −' + Math.round((proj.platformRoyaltyCut || 0) * 100) + '%)')) : null,
      (synergies && synergies.length) ? h('div', null, h('span', { className: 'k' }, 'Marketing synergies:'), ' ', h('span', { className: 'mul' }, synergies.join(', '))) : null,
      (proj.launchNotes && proj.launchNotes.length) ? h('div', null, ...proj.launchNotes.map(n => h('div', null, h('span', { className: 'k' }, n)))) : null,
      h('div', { style: { marginTop: '8px', fontSize: '0.85rem' } },
        h('span', { className: 'k' }, 'Launch sales total:'), ' ', h('span', { className: 'v' }, fmtMoney(proj.launchSales || 0)),
        proj.tailSales ? h('span', null, ' · ', h('span', { className: 'k' }, 'earned so far:'), ' ', h('span', { className: 'v' }, fmtMoney(proj.tailSales))) : null
      ),
      h('div', { style: { marginTop: '6px', fontSize: '0.85rem' } },
        proj.marketingSpend ? h('span', null, h('span', { className: 'k' }, 'Marketing spend:'), ' ', h('span', { className: 'v', style:{color:'#ff7b72'} }, fmtMoney(proj.marketingSpend))) : null,
        proj.marketingSpend && proj.salaryCost ? ' · ' : null,
        proj.salaryCost ? h('span', null, h('span', { className: 'k' }, 'Team salary paid:'), ' ', h('span', { className: 'v', style:{color:'#ff7b72'} }, fmtMoney(Math.round(proj.salaryCost)))) : null,
        (proj.marketingSpend || proj.salaryCost)
          ? h('span', null, ' · ', h('span', { className: 'k' }, 'Breakeven target:'), ' ',
              h('span', { className: 'v', style:{color:'#f85149', fontWeight:'700'} },
                fmtMoney((proj.marketingSpend || 0) + Math.round(proj.salaryCost || 0))))
          : null
      )
    ].filter(Boolean);

    // Build graph
    const graphData = buildSalesGraph(proj);

    // Scores line
    const delta = (proj.userScore || 0) - (proj.criticScore || 0);
    const label = delta >= 10 ? ' — cult hit' : delta <= -10 ? ' — reviewer favorite' : '';
    const scoreLine = h('div', { className: 't-pd-scores' },
      'Critic ' + proj.criticScore + '/100  ·  Users ' + proj.userScore + '/100',
      label ? h('span', { className: 'lbl' }, label.replace(' — ', '')) : null
    );

    // Reviews
    const reviewsList = (proj.reviews || []).map(r =>
      h('div', { className: 't-pd-review' },
        (r.stars ? '\u2605'.repeat(r.stars) + '\u2606'.repeat(Math.max(0, 5 - r.stars)) + ' — ' : '') + (r.quote || r.text || ''),
        h('span', { className: 'src' }, '— ' + (r.source || r.publication || 'Critic'))
      )
    );

    // Modal
    const ov = h('div', { className: 't-modal-ov', id: '_t_proj_detail_modal',
      onclick: (e) => { if (e.target.id === '_t_proj_detail_modal') closeShippedProjectModal(); }
    },
      h('div', { className: 't-modal', style: { maxWidth: '780px' } },
        h('h2', null, (typeDef?.icon || '') + ' ' + proj.name),
        h('div', { style: { color: '#8b949e', fontSize: '0.8rem', marginBottom: '8px' } },
          (typeDef?.label || proj.type) + ' · ' +
          (window.PROJECT_SCOPES[proj.scope]?.label || proj.scope) + ' scope' +
          (platDef ? ' · ' + platDef.icon + ' ' + platDef.name : '') +
          ' · shipped ' + (() => {
            // Convert absolute week → "Week N, YYYY". 48 weeks per calendar year.
            const absW = proj.shippedAtWeek || 0;
            const year = 1980 + Math.floor(absW / 48);
            const wkOfYear = (absW % 48) + 1;
            return 'Week ' + wkOfYear + ', ' + year;
          })() +
          (proj.tailWeeksRemaining > 0
            ? ' · earning for ' + proj.tailWeeksRemaining + ' more week' + (proj.tailWeeksRemaining === 1 ? '' : 's')
            : ' · tail closed')
        ),
        scoreLine,
        awardsWon.length > 0 ? h('div', { className: 't-pd-awards' }, ...awardsWon.map(a => h('span', { className: 't-pd-award' }, a))) : null,
        h('div', { className: 't-pd-section' },
          h('h3', null, 'Sales projection — 24 weeks'),
          h('div', { className: 't-pd-graph-wrap', id: '_t_pd_graph_wrap' }),
          h('div', { className: 't-pd-legend' },
            h('span', null, h('span', { className: 'swatch sw-bar' }), 'Weekly (actual)'),
            h('span', null, h('span', { className: 'swatch sw-proj' }), 'Weekly (projected)'),
            h('span', null, h('span', { className: 'swatch sw-cum' }), 'Cumulative'),
            (proj.marketingSpend || proj.salaryCost) ? h('span', null, h('span', { className: 'swatch sw-breakeven' }), 'Breakeven (mkt + salary)') : null
          )
        ),
        h('div', { className: 't-pd-section' },
          h('h3', null, 'Launch breakdown'),
          h('div', { className: 't-pd-breakdown' }, ...breakdownParts)
        ),
        portfolioComparison ? h('div', { className: 't-pd-section' },
          h('h3', null, 'Portfolio comparison'),
          portfolioComparison
        ) : null,
        reviewsList.length ? h('div', { className: 't-pd-section' },
          h('h3', null, 'Reviews'),
          ...reviewsList
        ) : null,
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: closeShippedProjectModal }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);

    // Inject the SVG (innerHTML because our h() helper is for DOM nodes, not raw strings)
    const graphWrap = document.getElementById('_t_pd_graph_wrap');
    if (graphWrap) {
      graphWrap.innerHTML = graphData.svg;
      // Tooltip element
      const tip = document.createElement('div');
      tip.className = 't-pd-tooltip';
      tip.style.opacity = '0';
      graphWrap.appendChild(tip);
      const bars = graphWrap.querySelectorAll('.t-pd-graph-bar');
      bars.forEach(bar => {
        bar.addEventListener('pointerenter', (e) => {
          const wk = +bar.dataset.wk;
          const weekly = graphData.weekly[wk];
          const cum = graphData.cumulative[wk];
          const projected = wk > graphData.weeksSinceLaunch;
          tip.innerHTML =
            '<span class="wk">Week ' + wk + (projected ? ' (projected)' : '') + '</span><br>' +
            '<span class="wkly">Weekly: ' + fmtMoney(weekly) + '</span><br>' +
            '<span class="cum">Cumulative: ' + fmtMoney(cum) + '</span>';
          tip.style.opacity = '1';
        });
        bar.addEventListener('pointermove', (e) => {
          const rect = graphWrap.getBoundingClientRect();
          tip.style.left = (e.clientX - rect.left + 10) + 'px';
          tip.style.top = (e.clientY - rect.top - 10) + 'px';
        });
        bar.addEventListener('pointerleave', () => { tip.style.opacity = '0'; });
      });
    }
  }

  // ---------- Hiring Fair modal ----------
  // Auto-pause while the fair is open; restore the player's prior pause
  // state on close. Previously S.paused was set true and never restored,
  // so after hiring the game looked frozen until the user manually hit
  // the Pause button again.
  //
  // The reopen-on-rerender path (Interview → rerenderHiringModal) strips
  // the DOM node directly rather than going through closeHiringModal, so
  // the saved pause state only gets nulled on a *real* close.
  let _hiringPrevPaused = null;
  function openHiringModal() {
    const queue = S.hiring?.queue || [];
    if (queue.length === 0) {
      pushToast('No candidates currently on the market. Wait for the next Hiring Fair.');
      return;
    }
    // Tear down any existing modal without triggering the close-path pause restore
    const existing = document.getElementById('_t_hiring_modal');
    if (existing) existing.remove();
    // Capture the pre-fair pause state on the *first* open only; rerenders
    // keep the original captured value so Close restores correctly.
    if (_hiringPrevPaused === null) _hiringPrevPaused = S.paused === true;
    S.paused = true;
    refreshTopBar();
    const ov = h('div', { className: 't-modal-ov', id: '_t_hiring_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '760px' } },
        h('h2', null, '🎪 Hiring Fair'),
        h('div', { style: { color:'#8b949e', fontSize:'0.8rem', marginBottom:'12px' } },
          queue.length + ' candidate' + (queue.length===1?'':'s') +
          ' available · Interview $' + window.tycoonHiring.INTERVIEW_COST +
          ' (reveals stats + hidden trait)'),
        h('div', { className: 't-candidate-grid' }, ...queue.map(renderCandidateCard)),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: closeHiringModal }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function closeHiringModal() {
    const ov = document.getElementById('_t_hiring_modal');
    if (ov) ov.remove();
    if (_hiringPrevPaused !== null) {
      S.paused = _hiringPrevPaused;
      _hiringPrevPaused = null;
      refreshTopBar();
    }
  }

  // Re-render candidate cards in place without going through close/open —
  // touching the close path would restore pause mid-interaction, and the
  // subsequent reopen would lose _hiringPrevPaused if the hire drained the
  // queue (empty-queue early-return skips the capture). Keeps pause state
  // exactly as-is across interactions.
  function rerenderHiringModal() {
    const modal = document.getElementById('_t_hiring_modal');
    if (!modal) return;
    const queue = S.hiring?.queue || [];
    if (queue.length === 0) {
      // Queue emptied (all hired/passed). Close the modal cleanly, which
      // restores pause to the pre-fair state.
      closeHiringModal();
      return;
    }
    const grid = modal.querySelector('.t-candidate-grid');
    const header = modal.querySelector('.t-modal > div[style*="color"]');
    if (grid) {
      grid.innerHTML = '';
      queue.forEach(c => grid.appendChild(renderCandidateCard(c)));
    }
    if (header) {
      header.textContent = queue.length + ' candidate' + (queue.length === 1 ? '' : 's') +
        ' available \u00B7 Interview $' + window.tycoonHiring.INTERVIEW_COST +
        ' (reveals stats + hidden trait)';
    }
  }

  function renderCandidateCard(c) {
    const card = h('div', { className: 't-candidate-card' + (c.interviewed ? ' interviewed' : '') },
      h('div', { className: 'c-top' },
        h('div', null,
          h('div', { className: 'c-name' }, c.name),
          h('div', { className: 'c-tier' }, c.tierName + ' · ' + c.specialty)
        ),
        h('div', { className: 'c-salary' }, fmtMoney(c.askingSalary) + '/yr')
      ),
      h('div', { className: 'c-meta' }, '🎓 ' + c.education.flavor + ' · Age ' + c.age),
      h('div', { className: 'c-trait' },
        c.interviewed && c.traits ?
          '✨ ' + c.traits.join(' · ') + ' (' + (c.personality || 'Fair') + ')' :
          '✨ ' + c.visibleTrait + ' + ',
        c.interviewed ? '' : h('span', { className: 'hidden' }, '?')),
      renderCandidateStats(c),
      renderCandidateActions(c)
    );
    return card;
  }

  function renderCandidateStats(c) {
    if (!c.interviewed) {
      return h('div', { className: 'c-stats' },
        h('div', { className: 's hidden' }, h('span', { className: 'v' }, '?'), h('span', { className: 'l' }, 'DESIGN')),
        h('div', { className: 's hidden' }, h('span', { className: 'v' }, '?'), h('span', { className: 'l' }, 'TECH')),
        h('div', { className: 's hidden' }, h('span', { className: 'v' }, '?'), h('span', { className: 'l' }, 'SPEED')),
        h('div', { className: 's hidden' }, h('span', { className: 'v' }, '?'), h('span', { className: 'l' }, 'POLISH'))
      );
    }
    const s = c.stats;
    return h('div', { className: 'c-stats' },
      h('div', { className: 's' }, h('span', { className: 'v' }, String(s.design)), h('span', { className: 'l' }, 'DESIGN')),
      h('div', { className: 's' }, h('span', { className: 'v' }, String(s.tech)), h('span', { className: 'l' }, 'TECH')),
      h('div', { className: 's' }, h('span', { className: 'v' }, String(s.speed)), h('span', { className: 'l' }, 'SPEED')),
      h('div', { className: 's' }, h('span', { className: 'v' }, String(s.polish)), h('span', { className: 'l' }, 'POLISH'))
    );
  }

  function renderCandidateActions(c) {
    const btns = [];
    if (!c.interviewed) {
      btns.push(h('button', { className: 't-btn secondary', onclick: () => {
        const r = window.tycoonHiring.interview(c.id);
        if (!r.ok) pushToast(r.error);
        else rerenderHiringModal();
      } }, 'Interview $1K'));
    }
    btns.push(h('button', { className: 't-btn', onclick: () => {
      const r = window.tycoonHiring.hire(c.id);
      if (!r.ok) { pushToast(r.error); return; }
      pushToast('Hired: ' + r.employee.name);
      refreshMain();
      rerenderHiringModal();
    } }, 'Hire'));
    if (!c.negotiated) {
      btns.push(h('button', { className: 't-btn secondary', onclick: () => {
        const r = window.tycoonHiring.negotiate(c.id, 'soft');
        if (!r.ok) { pushToast(r.error); return; }
        if (r.outcome === 'walked') pushToast(r.candidateName + ' walked away');
        else pushToast('Negotiated — new salary');
        rerenderHiringModal();
      } }, 'Negotiate'));
    }
    btns.push(h('button', { className: 't-btn secondary', onclick: () => {
      window.tycoonHiring.pass(c.id);
      rerenderHiringModal();
    } }, 'Pass'));
    return h('div', { className: 'c-actions' }, ...btns);
  }

  // ---------- Contract offer card ----------
  function renderContractCard(contract) {
    const currentWeek = window.tycoonProjects.absoluteWeek();
    const expiresIn = contract.expiresAtWeek - currentWeek;
    const deadlineWeeksFromNow = contract.deadline - currentWeek;
    return h('div', { className: 't-contract-card' },
      h('div', { className: 't-c-hdr' },
        h('div', { className: 't-c-client' },
          (contract.clientTierIcon || '🏪') + ' ' + contract.clientName,
          contract.clientTierLabel ? h('span', { style:{color:'#8b949e',fontWeight:'400',fontSize:'0.7rem',marginLeft:'6px'} }, contract.clientTierLabel) : null
        ),
        h('div', { className: 't-c-pay' }, fmtMoney(contract.payment))
      ),
      h('div', { className: 't-c-proj' }, contract.projectName),
      h('div', { className: 't-c-spec' }, contract.spec),
      h('div', { className: 't-c-deadline' },
        '⏱ Deadline: ' + deadlineWeeksFromNow + ' weeks after acceptance'),
      h('div', { className: 't-c-expires' },
        'Offer expires in ' + expiresIn + ' week' + (expiresIn === 1 ? '' : 's')),
      h('div', { className: 't-c-actions' },
        h('button', { className: 't-btn', onclick: () => {
          window.tycoonContracts.accept(contract.id);
          refreshMain();
          pushToast('Accepted: ' + contract.projectName);
        }}, 'Accept'),
        h('button', { className: 't-btn secondary', onclick: () => {
          window.tycoonContracts.decline(contract.id);
          refreshMain();
        }}, 'Decline')
      )
    );
  }

  // ---------- Main layout ----------
  function renderMainPanels() {
    const main = h('div', { className: 'tycoon-main' });

    // Left: Founder + employees + controls
    const employees = S.employees || [];
    const queueSize = S.hiring?.queue?.length || 0;
    const leftPanel = h('div', { className: 'tycoon-panel', style: { maxWidth: '340px' } },
      h('h2', null, 'Studio'),
      renderFounderCard(),
      h('div', { style: { marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' } },
        h('button', { className: 't-btn', onclick: () => openDesignModal() }, '+ New Project'),
        h('button', { className: 't-btn secondary', onclick: () => openHiringModal() },
          '🎪 Hiring' + (queueSize > 0 ? ' (' + queueSize + ' available)' : '')),
        employees.length > 0 && (() => {
          // Count bench engineers when there's at least one active project —
          // surface idle team members so the player can't miss them.
          const bench = window.tycoonTeams?.getBench?.() || [];
          const active = S.projects?.active || [];
          const idleCount = (bench.length && active.length) ? bench.length : 0;
          const label = idleCount > 0
            ? '👥 Teams \u26A0\uFE0F ' + idleCount + ' idle'
            : '👥 Teams';
          return h('button', {
            className: 't-btn secondary' + (idleCount > 0 ? ' t-teams-idle' : ''),
            onclick: () => openTeamsModal()
          }, label);
        })(),
        h('button', { className: 't-btn secondary', onclick: () => openResearchModal() }, (() => {
          const st = window.tycoonResearch?.state?.();
          const ip = st?.inProgress;
          return '🔬 Research' + (ip ? ' (active)' : st ? ' (' + st.completedCount + ')' : '');
        })()),
        h('button', { className: 't-btn secondary', onclick: () => openMarketModal() }, '📊 Market'),
        h('button', { className: 't-btn secondary', onclick: () => openFinanceModal() }, '💰 Finance'),
        h('button', { className: 't-btn secondary', onclick: () => openLegacyScreen(S.calendar?.year || 1980, 'retrospective') }, '📜 Hall of Fame')
      ),
      employees.length > 0 && h('h2', { style: { marginTop: '16px' } }, 'Team (' + employees.length + ')'),
      employees.length > 0 && h('div', null, ...employees.map(renderEmployeeRow))
    );

    // Middle: Contracts + Active Projects
    const contracts = S.projects?.contracts || [];
    const active = S.projects?.active || [];
    const shipped = S.projects?.shipped || [];
    const projectsPanel = h('div', { className: 'tycoon-panel' },
      contracts.length > 0 && h('h2', null, 'Contract Offers (' + contracts.length + ')'),
      contracts.length > 0 && h('div', { className: 't-projects-list', style: { marginBottom: '18px' } },
        ...contracts.map(c => renderContractCard(c))),

      h('h2', null, 'Active Projects (' + active.length + ')'),
      active.length === 0
        ? h('div', { className: 't-empty' },
            contracts.length > 0
              ? 'Accept a contract above, or click "+ New Project" for own IP.'
              : 'No active projects. Click "+ New Project" or wait for a contract offer.')
        : h('div', { className: 't-projects-list' }, ...active.map(p => renderProjectCard(p, false))),

      shipped.length > 0 && h('h2', { style: { marginTop: '24px' } }, 'Shipped (' + shipped.length + ')'),
      shipped.length > 0 && h('div', { className: 't-projects-list' },
        ...shipped.slice().reverse().slice(0, 5).map(p => renderProjectCard(p, true)))
    );

    main.append(leftPanel, projectsPanel);
    return main;
  }

  // ---------- Finance modal ----------
  function openFinanceModal() {
    const shipped = S.projects?.shipped || [];
    const contractRev = shipped.filter(p => p.isContract).reduce((s,p) => s + (p.payment||0), 0);
    const ipRev = shipped.filter(p => !p.isContract).reduce((s,p) => s + (p.launchSales||0), 0);
    const netProfit = (S.tRevenue || 0) - (S.tExpenses || 0);
    // Runway from the employees module (Phase 2E)
    const runwayM = window.tycoonFinance?.currentRunwayMonths?.() ?? Infinity;
    const runwayStr = runwayM === Infinity || runwayM > 9999 ? '∞' :
                       runwayM.toFixed(1) + ' months';
    const runwayKind = runwayM === Infinity ? 'positive' : runwayM < 3 ? 'negative' : runwayM < 6 ? '' : 'positive';
    const weeklyBurn = window.tycoonEmployees?.weeklyBurn?.() || 0;
    const annualBurn = window.tycoonEmployees?.annualBurn?.() || 0;

    const row = (lbl, val, kind) => h('div', { className: 't-finance-row' + (kind ? ' ' + kind : '') },
      h('span', { className: 'lbl' }, lbl),
      h('span', { className: 'val' }, val)
    );

    const ov = h('div', { className: 't-modal-ov', id: '_t_finance_modal' },
      h('div', { className: 't-modal' },
        h('h2', null, '💰 Finance'),
        h('div', { style: { marginBottom: '16px' } },
          row('Current Cash', fmtMoney(S.cash), 'positive'),
          row('Runway', runwayStr, runwayKind),
          row('Annual Burn', fmtMoney(annualBurn)),
          row('Difficulty', (S.difficulty || 'normal').toUpperCase())
        ),
        h('h2', { style: { marginTop: '20px', fontSize: '0.85rem' } }, 'Lifetime'),
        h('div', null,
          row('Total Revenue', fmtMoney(S.tRevenue), 'positive'),
          row('  · Contract income', fmtMoney(contractRev)),
          row('  · Own-IP sales', fmtMoney(ipRev)),
          row('Total Expenses', fmtMoney(S.tExpenses), 'negative'),
          row('Net Profit', fmtMoney(netProfit), netProfit >= 0 ? 'positive' : 'negative')
        ),
        h('h2', { style: { marginTop: '20px', fontSize: '0.85rem' } }, 'Titles Shipped'),
        h('div', null,
          row('Total shipped', String(shipped.length)),
          row('  · Contracts delivered', String(shipped.filter(p => p.isContract).length)),
          row('  · Own IP', String(shipped.filter(p => !p.isContract).length))
        ),
        // Client relationships grid (Phase 2D)
        S.clientReputation && h('h2', { style: { marginTop: '20px', fontSize: '0.85rem' } }, 'Client Relationships'),
        S.clientReputation && h('div', null,
          ...Object.entries(S.clientReputation).map(([tierId, rep]) => {
            const tierDef = window.CLIENT_TIERS?.[tierId];
            if (!tierDef) return null;
            const starsFilled = Math.round(rep.avg);
            const starStr = rep.count > 0 ? '★'.repeat(starsFilled) + '☆'.repeat(5-starsFilled) : '—';
            const unlocked = rep.unlocked;
            const droppedBelow = rep.count >= 2 && rep.avg < tierDef.minAvg;
            const status = !unlocked ? '🔒 Locked' :
                           droppedBelow ? '⚠️ Reputation dropped' :
                           rep.count === 0 ? 'New' :
                           starStr + ' (avg ' + rep.avg.toFixed(1) + ', ' + rep.count + ' delivered)';
            return row((tierDef.icon || '') + ' ' + tierDef.label, status);
          })
        ),
        // Loans section (Phase 2E)
        h('h2', { style: { marginTop: '20px', fontSize: '0.85rem' } }, 'Loans'),
        renderLoansSection(),
        // VC Cap Table (Phase 5A)
        h('h2', { style: { marginTop: '20px', fontSize: '0.85rem' } }, 'Cap Table / VC Funding'),
        renderVCSection(),
        // Legacy Decisions (Phase 5E) — only show if unlocked year
        window.tycoonLegacy?.isAvailable?.() && h('h2', { style: { marginTop: '20px', fontSize: '0.85rem' } }, 'Legacy Decisions'),
        window.tycoonLegacy?.isAvailable?.() && renderLegacyDecisionsSection(),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: () => document.getElementById('_t_finance_modal')?.remove() }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function renderVCSection() {
    if (!window.tycoonFinance) return h('div', { className:'t-empty' }, 'VC not available.');
    const fin = window.tycoonFinance;
    const founderEq = fin.founderEquity();
    const totalDil = fin.totalDilution();
    const rounds = (S.vcRounds || []);
    const ipoState = S.ipo || {};
    const canIpo = fin.canIPO();

    // Equity breakdown
    const equityRows = [h('div', { className: 't-finance-row' },
      h('span', { className: 'lbl' }, '👑 Founder equity'),
      h('span', { className: 'val', style:{color: founderEq < 0.5 ? '#f85149' : '#7ee787'} },
        (founderEq * 100).toFixed(1) + '%')
    )];
    for (const r of rounds) {
      const round = fin.VC_ROUNDS[r.type] || { icon:'💼', label: r.type };
      equityRows.push(h('div', { className: 't-finance-row' },
        h('span', { className: 'lbl' }, '  · ' + round.icon + ' ' + round.label + ' (' + fmtMoney(r.cash) + ' invested)'),
        h('span', { className: 'val' }, (S.capTable.vcEquity[r.storageKey] * 100).toFixed(1) + '%')
      ));
    }
    if (totalDil > 0.5) {
      equityRows.push(h('div', { style:{color:'#f0883e', fontSize:'0.7rem', marginTop:'4px'} },
        '⚠ Investors own > 50% — board has voting control'));
    }

    // Available rounds
    const available = [];
    for (const [id, r] of Object.entries(fin.VC_ROUNDS)) {
      const canRaise = r.canRaise();
      available.push(h('div', { style:{padding:'8px 10px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px', marginTop:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'} },
        h('div', null,
          h('div', { style:{color:'#f0f6fc', fontWeight:'700', fontSize:'0.85rem'} },
            r.icon + ' ' + r.label),
          h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginTop:'2px'} },
            fmtMoney(r.cashRange[0]) + '–' + fmtMoney(r.cashRange[1]) + ' for ' +
            Math.round(r.equityRange[0]*100) + '–' + Math.round(r.equityRange[1]*100) + '% equity · ' + r.gateText)
        ),
        canRaise ?
          h('button', { className: 't-btn', onclick: () => {
            if (!confirm('Close ' + r.label + ' round? VCs will take equity. This cannot be undone.')) return;
            const result = fin.takeVCRound(id);
            if (!result.ok) { pushToast(result.error); return; }
            pushToast(r.icon + ' ' + r.label + ' closed: ' + fmtMoney(result.cash));
            document.getElementById('_t_finance_modal')?.remove();
            openFinanceModal();
            refreshTopBar();
          }}, 'Raise') :
          h('div', { style:{color:'#8b949e', fontSize:'0.72rem'} }, '🔒 Not eligible')
      ));
    }

    // IPO section
    const ipoRows = [];
    if (ipoState.completed) {
      ipoRows.push(h('div', { style:{padding:'8px 10px', background:'#0c2d4e', border:'1px solid #1f6feb', borderRadius:'4px', marginTop:'8px'} },
        h('div', { style:{color:'#58a6ff', fontWeight:'700', fontSize:'0.9rem'} },
          '🔔 PUBLIC COMPANY — IPO\'d ' + ipoState.closedAtYear),
        h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginTop:'2px'} },
          'Valuation at IPO: ' + fmtMoney(ipoState.valuation) + ' · Net raised: ' + fmtMoney(ipoState.netRaise) +
          ' · Public float: 20% · Quarterly earnings now required')
      ));
    } else {
      const val = fin.currentValuation();
      ipoRows.push(h('div', { style:{padding:'8px 10px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px', marginTop:'8px'} },
        h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center'} },
          h('div', null,
            h('div', { style:{color:'#f0f6fc', fontWeight:'700', fontSize:'0.85rem'} }, '🔔 Go Public (IPO)'),
            h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginTop:'2px'} },
              'Est. valuation: ' + fmtMoney(val) + ' · requires $500M val + Fame 200+ + critic 85+ hit · 5% banker fees'),
            !canIpo.ok && h('div', { style:{color:'#f0883e', fontSize:'0.7rem', marginTop:'2px'} },
              '🔒 ' + canIpo.reason)
          ),
          canIpo.ok && h('button', { className: 't-btn', onclick: () => {
            if (!confirm('Take the studio public? Raises ~' + fmtMoney(val * 0.20 * 0.95) + ' net. You can\'t un-IPO.')) return;
            const r = fin.takeIPO();
            if (!r.ok) { pushToast(r.error); return; }
            pushToast('🔔 IPO closed! Net raise ' + fmtMoney(r.netRaise), 'win');
            document.getElementById('_t_finance_modal')?.remove();
            openFinanceModal();
            refreshTopBar();
          }}, '🔔 IPO Now')
        )
      ));
    }

    return h('div', null, ...equityRows, ...available, ...ipoRows);
  }

  function renderLegacyDecisionsSection() {
    const L = window.tycoonLegacy;
    if (!L) return h('div', { className:'t-empty' }, 'Legacy module not available.');
    const taken = L.takenDecisions();
    const rows = L.DECISIONS.map(d => {
      const isTaken = taken.includes(d.id);
      const canTake = d.canTake();
      return h('div', { style:{padding:'10px 12px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px', marginTop:'6px'} },
        h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'start', gap:'10px'} },
          h('div', null,
            h('div', { style:{color:'#f0f6fc', fontWeight:'700'} }, d.label),
            h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginTop:'2px'} }, d.blurb)
          ),
          isTaken ?
            h('div', { style:{color:'#7ee787', fontSize:'0.8rem', fontWeight:'700'} }, '✓ Taken') :
            canTake ?
              h('button', { className:'t-btn', onclick: () => {
                if (!confirm('Take this decision? This is PERMANENT.\n\n' + d.blurb)) return;
                const r = L.takeDecision(d.id);
                if (!r.ok) { pushToast(r.error); return; }
                pushToast('📜 ' + r.msg);
                document.getElementById('_t_finance_modal')?.remove();
                if (r.endGame) {
                  openLegacyScreen(S.calendar?.year || 2024, 'victory');
                } else {
                  openFinanceModal();
                  refreshTopBar();
                }
              }}, 'Take') :
              h('div', { style:{color:'#8b949e', fontSize:'0.72rem'} }, '🔒')
        )
      );
    });
    const legacy = L.state().legacyScore;
    return h('div', null,
      h('div', { style:{color:'#8b949e', fontSize:'0.72rem', marginBottom:'6px'} },
        'Legacy Score: ' + legacy),
      ...rows
    );
  }

  function renderLoansSection() {
    if (!window.tycoonFinance) return h('div', { className:'t-empty' }, 'Loans not available.');
    const fin = window.tycoonFinance;
    const canLoan = fin.canTakeLoan();
    const maxLoan = fin.maxLoanAmount();
    const loans = S.loans || [];

    const loansList = loans.length === 0 ?
      h('div', { className: 't-empty', style:{padding:'8px 0',textAlign:'left',fontStyle:'normal'} },
        'No active loans. ' + (canLoan ? 'Eligible up to ' + fmtMoney(maxLoan) + '.' : 'Unlock at Fame 5+.')) :
      h('div', null, ...loans.map(l =>
        h('div', { className: 't-finance-row' },
          h('span', { className: 'lbl' }, '  · $' + l.principal.toLocaleString() + ' @ 10% APR'),
          h('span', { className: 'val' }, fmtMoney(l.monthlyPayment) + '/mo · ' + l.monthsRemaining + 'mo left')
        )
      ));

    const takeLoanBtn = canLoan ? h('button', {
      className: 't-btn secondary',
      style: { marginTop:'8px' },
      onclick: () => {
        const str = prompt('Loan amount (up to ' + fmtMoney(maxLoan) + '):', String(Math.min(maxLoan, 50000)));
        const amt = parseInt(str, 10);
        if (isNaN(amt)) return;
        const r = fin.takeLoan(amt);
        if (!r.ok) pushToast(r.error);
        else {
          pushToast('Loan approved: ' + fmtMoney(r.loan.principal));
          // Re-render modal to show new loan
          document.getElementById('_t_finance_modal')?.remove();
          openFinanceModal();
          refreshTopBar();
        }
      }
    }, '🏦 Take Out a Loan') : null;

    // v3 roguelite: voluntary "Retire & Hand Off" button — gated on Fame 50+
    const canRetire = window.tycoonSchool?.canVoluntaryRetire?.();
    const retireBtn = h('button', {
      className: canRetire ? 't-btn secondary' : 't-btn secondary',
      style: { marginTop: '16px', opacity: canRetire ? 1 : 0.5, cursor: canRetire ? 'pointer' : 'not-allowed' },
      title: canRetire ? 'End your run voluntarily; classmate takes over.' : 'Requires Fame 50+ (current ' + (S.tFame || 0) + ')',
      onclick: () => {
        if (!canRetire) { pushToast('Need Fame 50+ to retire (current: ' + (S.tFame || 0) + ')'); return; }
        document.getElementById('_t_finance_modal')?.remove();
        window.openVoluntaryRetireModal();
      }
    }, '🎓 Retire & Hand Off' + (canRetire ? '' : ' (Fame ' + (S.tFame || 0) + '/50)'));

    return h('div', null, loansList, takeLoanBtn, retireBtn);
  }

  function refreshMain() {
    const root = getRootEl();
    if (!root) return;
    const old = root.querySelector('.tycoon-main');
    if (old) { old.replaceWith(renderMainPanels()); }
  }

  // ---------- Design modal ----------
  function openDesignModal() {
    if (!S.founder) { alert('No founder set. Run: createFounder()'); return; }
    // Default to first era-available type
    const availableTypes = Object.keys(window.PROJECT_TYPES).filter(k => window.isProjectTypeAvailable(k));
    const defaultType = availableTypes.includes('game') ? 'game' : availableTypes[0];
    // Default platform: first available for that type
    const initialPlatforms = window.tycoonPlatforms?.availableForType?.(defaultType) || [];
    const defaultPlatform = initialPlatforms[0]?.id || null;
    const config = {
      name: 'Untitled',
      type: defaultType,
      scope: 'small',
      platform: defaultPlatform,
      features: [],
      isContract: false
    };

    function render() {
      const scope = window.PROJECT_SCOPES[config.scope];
      const usedScope = config.features.reduce((s, id) => s + (window.TYCOON_FEATURES_BY_ID[id]?.cost || 0), 0);
      const remaining = scope.scopePoints - usedScope;
      const curYear = S.calendar?.year || 1980;
      const availableFeatures = window.TYCOON_FEATURES.filter(f =>
        f.types.includes(config.type) &&
        curYear >= f.era[0] && curYear <= f.era[1]
      );

      const ov = h('div', { className: 't-modal-ov', id: '_t_modal' },
        h('div', { className: 't-modal' },
          h('h2', null, 'Design a New Project'),
          h('label', null, 'Project name',
            h('input', { type: 'text', value: config.name,
              oninput: (e) => { config.name = e.target.value; }
            })
          ),
          h('label', null, 'Type',
            h('select', {
              onchange: (e) => { config.type = e.target.value; config.features = []; rerender(); }
            },
              ...Object.keys(window.PROJECT_TYPES).filter(k => window.isProjectTypeAvailable(k)).map(key => {
                const t = window.PROJECT_TYPES[key];
                return h('option', { value: key, selected: key === config.type ? true : null },
                  (t.icon || '') + ' ' + t.label);
              })
            )
          ),
          // Platform selector (Phase 4C)
          (() => {
            const avail = window.tycoonPlatforms?.availableForType?.(config.type) || [];
            if (avail.length === 0) return null;
            // Sync config.platform if invalid
            if (!avail.some(p => p.id === config.platform)) config.platform = avail[0].id;
            return h('label', null, 'Platform',
              h('select', {
                onchange: (e) => { config.platform = e.target.value; rerender(); }
              },
                ...avail.map(p => {
                  const phase = window.tycoonPlatforms.phaseLabel(p);
                  const cutStr = p.royaltyCut > 0 ? ' · ' + Math.round(p.royaltyCut*100) + '% cut' : '';
                  return h('option', { value: p.id, selected: p.id === config.platform ? true : null },
                    p.icon + ' ' + p.name + ' — ' + phase + cutStr);
                })
              )
            );
          })(),
          h('label', null, 'Scope',
            h('select', {
              onchange: (e) => { config.scope = e.target.value; rerender(); }
            },
              ...Object.keys(window.PROJECT_SCOPES).map(key => {
                const s = window.PROJECT_SCOPES[key];
                return h('option', { value: key, selected: key === config.scope ? true : null },
                  s.label + ' (' + s.months + ' months, ' + s.scopePoints + ' scope pts)');
              })
            )
          ),
          h('label', null, 'Features ',
            h('span', { className: 't-scope-points' },
              'Scope used: ',
              h('span', { className: 'v' }, usedScope + '/' + scope.scopePoints),
              remaining < 0 ? h('span', { style:{color:'#f85149'}}, ' (OVER)') : ''
            )
          ),
          h('div', { className: 't-feat-grid' },
            ...availableFeatures.map(f => {
              const picked = config.features.includes(f.id);
              const wouldExceed = !picked && (usedScope + f.cost > scope.scopePoints);
              return h('div', {
                className: 't-feat-card ' + (picked ? 'picked ' : '') + (wouldExceed ? 'disabled' : ''),
                onclick: () => {
                  if (wouldExceed) return;
                  if (picked) config.features = config.features.filter(id => id !== f.id);
                  else config.features.push(f.id);
                  rerender();
                }
              },
                h('div', null, h('span', { className: 'n' }, f.name), h('span', { className: 'c' }, '' + f.cost + ' pts')),
                h('div', { className: 'm' }, f.desc)
              );
            })
          ),
          h('div', { className: 't-modal-actions' },
            h('button', { className: 't-btn secondary', onclick: closeDesignModal }, 'Cancel'),
            h('button', { className: 't-btn',
              disabled: remaining < 0 || config.features.length === 0,
              onclick: () => {
                const p = window.tycoonProjects.create(config);
                closeDesignModal();
                refreshMain();
                pushToast('Project started: ' + p.name);
              }
            }, 'Start Project')
          )
        )
      );
      document.body.appendChild(ov);
    }

    function rerender() { closeDesignModal(); render(); }
    render();
  }

  function closeDesignModal() {
    const ov = document.getElementById('_t_modal');
    if (ov) ov.remove();
  }

  // ---------- MC Decision modal ----------
  let _mcPrevPaused = null;
  function openMCModal(proj) {
    if (!proj || !proj.pendingDecision) return;
    // Close any existing modal first (idempotent — handles rapid MC transitions)
    closeMCModal();
    // Auto-pause while decision is pending (remember prev pause state to restore)
    _mcPrevPaused = S.paused;
    S.paused = true;
    refreshTopBar();

    const d = proj.pendingDecision;
    const ov = h('div', { className: 't-modal-ov', id: '_t_mc_modal' },
      h('div', { className: 't-modal' },
        h('h2', null, 'Decision: ' + proj.name),
        h('div', { style: { color: '#f0f6fc', fontSize: '1.05rem', marginBottom: '16px' } }, d.text),
        ...d.answers.map(ans => {
          const effectsStr = Object.entries(ans.effects || {})
            .map(([k, v]) => (v > 0 ? '+' : '') + v + ' ' + k)
            .join(' · ');
          return h('button', {
            className: 't-mc-answer',
            disabled: !ans.available,
            onclick: () => {
              if (!ans.available) return;
              window.tycoonMC.answer(proj.id, ans.idx);
              // Modal closes via mc-answered event listener below
            }
          },
            ans.text,
            effectsStr ? h('span', { className: 'effects' }, effectsStr) : null,
            ans.lockedReasons?.length ? h('span', { className: 'lock' }, '🔒 ' + ans.lockedReasons.join(', ')) : null
          );
        })
      )
    );
    document.body.appendChild(ov);
  }

  function closeMCModal() {
    const ov = document.getElementById('_t_mc_modal');
    if (ov) ov.remove();
    // Restore previous pause state (unpause if it was the MC forcing the pause)
    if (_mcPrevPaused !== null) {
      S.paused = _mcPrevPaused;
      _mcPrevPaused = null;
      refreshTopBar();
    }
  }

  // ---------- Toast system ----------
  // Cache the stack element: pushToast fires on nearly every tick (payroll,
  // research, warnings, …) — a querySelector per call adds up over a long
  // career. Element lives until tycoonUI.exit(), which clears the cache.
  let _toastStack = null;
  function getToastStack() {
    if (_toastStack && _toastStack.isConnected) return _toastStack;
    _toastStack = document.querySelector('.t-toast-stack');
    if (!_toastStack) {
      _toastStack = h('div', { className: 't-toast-stack' });
      document.body.appendChild(_toastStack);
    }
    return _toastStack;
  }
  function pushToast(msg, kind) {
    const stack = getToastStack();
    const t = h('div', { className: 't-toast' }, msg);
    if (kind === 'win') t.style.borderLeftColor = '#f0883e';
    stack.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
  }

  // ---------- Tick listener to auto-refresh UI ----------
  let _uiTickUnsub = null;
  function startUITick() {
    if (_uiTickUnsub) return;
    _uiTickUnsub = window.tycoonTime.onTick(() => {
      refreshTopBar();
      refreshMain();
    });
  }

  // ---------- Week progress bar rAF loop ----------
  // Fills the bar under the week label from 0% → 100% over the duration of
  // one game week at the current speed, resets on each week tick. Pauses
  // cleanly and restarts on speed change (setSpeed reschedules the tick
  // timer from now, so our local clock needs to reset to stay in sync).
  const _WEEK_BASE_MS = 12500;
  let _weekElapsedMs = 0;
  let _weekLastFrameMs = 0;
  let _weekRafHandle = null;
  let _weekTickResetUnsub = null;
  let _weekLastSpeedSeen = null;

  function startCalProgressLoop() {
    if (_weekRafHandle != null) return;
    _weekElapsedMs = 0;
    _weekLastFrameMs = performance.now();
    _weekLastSpeedSeen = S.speed;
    _weekTickResetUnsub = window.tycoonTime.onTick(() => { _weekElapsedMs = 0; });

    // Cache the fill element — the top bar is rebuilt by refreshTopBar(),
    // which replaces the node, so we re-query only when our cached node
    // gets detached from the DOM. Saves ~60 querySelector calls/second.
    let fill = null;

    const loop = () => {
      const now = performance.now();
      const dt = now - _weekLastFrameMs;
      _weekLastFrameMs = now;

      // Speed change mid-week: the underlying setTimeout resets to a fresh
      // tickMs from "now", so our elapsed counter should reset too.
      if (S.speed !== _weekLastSpeedSeen) {
        _weekElapsedMs = 0;
        _weekLastSpeedSeen = S.speed;
      }

      const paused = S.paused === true || S.speed === 0;
      if (!paused) _weekElapsedMs += dt;

      const tickMs = _WEEK_BASE_MS / Math.max(1, S.speed || 1);
      const pct = Math.min(100, (_weekElapsedMs / tickMs) * 100);

      if (!fill || !fill.isConnected) fill = document.querySelector('.t-cal-progress-fill');
      if (fill) fill.style.width = pct.toFixed(1) + '%';

      _weekRafHandle = requestAnimationFrame(loop);
    };
    _weekRafHandle = requestAnimationFrame(loop);
  }

  function stopCalProgressLoop() {
    if (_weekRafHandle != null) { cancelAnimationFrame(_weekRafHandle); _weekRafHandle = null; }
    if (_weekTickResetUnsub) { _weekTickResetUnsub(); _weekTickResetUnsub = null; }
    _weekElapsedMs = 0;
    _weekLastSpeedSeen = null;
  }

  // Listen for MC pending events (fired by 14-tycoon-mc.js)
  document.addEventListener('tycoon:mc-pending', (e) => {
    const proj = window.tycoonProjects.find(e.detail.projectId);
    if (proj) openMCModal(proj);
  });

  // Close MC modal + refresh when any MC is answered (also catches direct API calls)
  document.addEventListener('tycoon:mc-answered', () => {
    closeMCModal();
    refreshMain();
  });

  // Refresh when contract offers arrive/resolve
  document.addEventListener('tycoon:contract-offered', () => refreshMain());
  document.addEventListener('tycoon:contract-accepted', () => refreshMain());
  document.addEventListener('tycoon:contract-declined', () => refreshMain());

  // Hiring Fair triggers — openHiringModal owns the auto-pause (captures
  // pre-fair pause state and restores it on close).
  document.addEventListener('tycoon:hiring-fair', (e) => {
    pushToast('🎪 Hiring Fair: ' + (e.detail.candidates?.length || 0) + ' candidates available', 'win');
    refreshMain();
    openHiringModal();
  });
  document.addEventListener('tycoon:employee-hired', (e) => {
    // Auto-assign to the single active project if there is exactly one.
    // Zero ambiguity in that case; saves a trip to the Teams modal.
    const active = S.projects?.active || [];
    const empId = e?.detail?.employeeId;
    if (active.length === 1 && empId && window.tycoonTeams?.assign) {
      const r = window.tycoonTeams.assign(empId, active[0].id);
      if (r?.ok) pushToast('👥 Assigned to ' + active[0].name, 'win');
    }
    refreshMain();
  });
  // Refresh sidebar (idle badge on Teams button) on any assignment change
  document.addEventListener('tycoon:team-changed', () => refreshMain());
  document.addEventListener('tycoon:employee-fired', () => refreshMain());
  document.addEventListener('tycoon:payroll', () => { refreshTopBar(); });

  // Runway warnings — show toast + auto-pause (2E)
  document.addEventListener('tycoon:runway-warning', (e) => {
    pushToast(e.detail.message);
    refreshTopBar();
  });
  document.addEventListener('tycoon:runway-critical', (e) => {
    pushToast(e.detail.message);
    refreshTopBar();
  });
  document.addEventListener('tycoon:loan-taken', () => {
    refreshTopBar();
    refreshMain();
  });
  document.addEventListener('tycoon:client-tier-unlocked', (e) => {
    const tierDef = window.CLIENT_TIERS?.[e.detail.tierId];
    if (tierDef) pushToast('🔓 Unlocked ' + tierDef.icon + ' ' + tierDef.label + ' clients!', 'win');
  });

  // Era change — show a big toast celebrating the new era (Phase 3B)
  document.addEventListener('tycoon:era-change', (e) => {
    const era = e.detail.era;
    pushToast(era.icon + ' New era: ' + era.label + ' — ' + era.blurb, 'win');
    refreshTopBar();
    refreshMain();
  });

  // Research completion (Phase 3C/3E)
  document.addEventListener('tycoon:research-completed', (e) => {
    const node = window.tycoonResearch.NODE_BY_ID[e.detail.nodeId];
    const isPioneer = window.tycoonRivals?.isPlayerPioneer?.(e.detail.nodeId);
    if (node) pushToast((isPioneer ? '🏆 Pioneer: ' : '✅ Research done: ') + node.name, 'win');
    refreshMain();
    rerenderResearchModal();
  });
  document.addEventListener('tycoon:research-started', () => refreshMain());

  // Macro events (Phase 3G)
  document.addEventListener('tycoon:macro-event', (e) => {
    const ev = e.detail.event;
    pushToast(ev.title + ' — ' + ev.blurb, 'win');
    // No auto-pause: macro events are toast-notifications, not blocking
    // modals. Previously we set S.paused=true with no restore path, which
    // silently froze the game every 4 weeks when an event rolled.
  });

  // Rival research updates (for UI refresh)
  document.addEventListener('tycoon:rival-research-completed', () => {
    rerenderResearchModal();
  });

  // Annual Awards Ceremony (Phase 4G)
  document.addEventListener('tycoon:awards-ceremony', (e) => {
    openAwardsCeremony(e.detail.year, e.detail.winners, e.detail.effects);
  });

  // Bankruptcy (Phase 5C) — game over
  document.addEventListener('tycoon:bankruptcy', (e) => {
    openLegacyScreen(e.detail.year, 'bankruptcy');
  });

  // Win conditions (Phase 5H)
  document.addEventListener('tycoon:win-achieved', (e) => {
    openVictoryModal(e.detail.path);
  });

  // Megacorp exit (Phase 5E) — immediate retrospective
  document.addEventListener('tycoon:megacorp-exit', (e) => {
    pushToast('💰 Sold to Megacorp for ' + fmtMoney(e.detail.price) + '! You\'re retired in splendor.', 'win');
    setTimeout(() => {
      // Guard: if the player exits to the slot screen within the 1.5s
      // window, don't open the retrospective over the slot screen.
      if (!getRootEl()) return;
      openLegacyScreen(S.calendar?.year || 2024, 'victory');
    }, 1500);
  });

  // Achievements (Phase 5G)
  document.addEventListener('tycoon:achievement-unlocked', (e) => {
    const a = e.detail.achievement;
    pushToast('🏅 ' + a.name + ' — ' + a.desc);
  });

  // v3 roguelite: run-end surfaces the endowment banked. This toast is the
  // Phase 4 placeholder — Phase 5 routes post-run-end into the school screen
  // where the full retrospective + class-roster picker live. For now the
  // existing legacy modal (bankruptcy/win/megacorp) still opens behind this
  // toast, keeping the retrospective summary alive while we build the
  // school UI.
  document.addEventListener('tycoon:run-end', (e) => {
    const { type, endowEarned } = e.detail || {};
    const labels = {
      bankruptcy: '💀 Run over — studio closed',
      age_retired: '👴 Founder retired — ran out the clock',
      retire_voluntary: '🎓 Retired and handed off',
      megacorp_exit: '💰 Sold to Megacorp',
      win_condition: '🏆 Triumphant run',
    };
    pushToast((labels[type] || 'Run ended') +
      '  ·  +' + (endowEarned || 0).toLocaleString() + ' endowment banked', 'win');
  });

  // v3 roguelite: voluntary retire button — opens a confirmation. Gated
  // on Fame ≥ 50 per Q4.
  window.openVoluntaryRetireModal = function() {
    if (!window.tycoonSchool?.canVoluntaryRetire?.()) {
      pushToast('⚠️ Need Fame 50+ to retire with dignity (current: ' + (S.tFame || 0) + ')');
      return;
    }
    const endow = window.tycoonSchool.computeEndowment('retire_voluntary');
    const ov = h('div', { className: 't-modal-ov', id: '_t_retire_modal',
      onclick: (e) => { if (e.target.id === '_t_retire_modal') ov.remove(); } },
      h('div', { className: 't-modal', style: { maxWidth: '460px' } },
        h('h2', null, '🎓 Retire & Hand Off'),
        h('div', { style: { fontSize: '0.85rem', color: '#c9d1d9', marginBottom: '14px', lineHeight: '1.5' } },
          'Step down now. Your alumnus joins the Institute\u2019s Alumni Hall and the next classmate takes over.'),
        h('div', { style: { fontSize: '0.85rem', color: '#c9d1d9', marginBottom: '14px' } },
          'Endowment banked: ', h('span', { style: { color: '#7ee787', fontWeight: '700' } }, '+' + endow.toLocaleString())),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn secondary', onclick: () => ov.remove() }, 'Never mind'),
          h('button', { className: 't-btn', onclick: () => {
            ov.remove();
            window.tycoonSchool.voluntaryRetire();
          } }, 'Retire now')
        )
      )
    );
    document.body.appendChild(ov);
  };

  function openVictoryModal(path) {
    // Auto-pause
    S.paused = true;
    refreshTopBar();
    const totalWins = (S.winsAchieved || []).length;
    const ov = h('div', { className: 't-modal-ov', id: '_t_victory_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '560px', textAlign: 'center' } },
        h('div', { style: { fontSize:'3rem', margin:'8px 0' } }, '🏆'),
        h('h2', { style: { fontSize:'1.4rem', color:'#f0883e' } }, 'VICTORY — ' + path.label),
        h('div', { style: { color:'#c9d1d9', fontSize:'0.95rem', margin:'8px 0 20px' } }, path.blurb),
        h('div', { style: { color:'#8b949e', fontSize:'0.85rem' } },
          'Win paths achieved this career: ' + totalWins + ' / ' + (window.tycoonWins?.WIN_PATHS?.length || 5)),
        h('div', { className: 't-modal-actions', style: { justifyContent:'center' } },
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_victory_modal')?.remove();
            S.paused = false;
            refreshTopBar();
          }}, 'Keep Playing'),
          h('button', { className: 't-btn secondary', onclick: () => {
            document.getElementById('_t_victory_modal')?.remove();
            openLegacyScreen(S.calendar?.year || 2024, 'victory');
          }}, 'End Career (Retrospective)')
        )
      )
    );
    document.body.appendChild(ov);
  }

  // Polish phase started — prompt player for marketing channels (Phase 4E)
  document.addEventListener('tycoon:project-polish-started', (e) => {
    // Only auto-prompt for own IP (contracts don't get marketing)
    const proj = window.tycoonProjects.find(e.detail.projectId);
    if (!proj || proj.isContract) return;
    openMarketingModal(proj.id);
  });

  // ---------- Character creator modal ----------
  // Module-level so config persists across re-renders
  let _creatorConfig = null;
  function openCharacterCreator(onConfirm) {
    injectStyles();
    const scenarios = window.TYCOON_SCENARIOS || [];
    // Initialize config only on first open
    if (!_creatorConfig) {
      _creatorConfig = {
        scenario: 'first_studio',
        studioName: 'Acme Software',
        founderName: 'Alex Chen',
        specialty: 'coder',
        trait: 'Creative',
        difficulty: 'normal'
      };
    }
    const config = _creatorConfig;
    const traits = ['Perfectionist', 'Sprinter', 'Methodical', 'Creative'];
    const traitEffects = {
      Perfectionist: '+2 Polish, −1 Speed (bug-free but slower)',
      Sprinter:      '+2 Speed, +0 Polish (ship fast)',
      Methodical:    '+2 Tech, careful work',
      Creative:      '+2 Design, unlocks innovative answers'
    };
    const specialties = Object.keys(window.PROJECT_TYPES).map(k => ({ id: k, label: window.PROJECT_TYPES[k].label }));
    // Add additional specialty options (simplified for Phase 1 — just 4 for now)
    const specialtyChoices = [
      { id: 'coder',    label: 'Coder (versatile, solid tech)' },
      { id: 'frontend', label: 'Frontend (design focus)' },
      { id: 'gamedev',  label: 'Game Dev (entertainment focus)' },
      { id: 'backend',  label: 'Database (business focus)' },
    ];
    const difficulties = [
      { id: 'easy',   label: 'Easy ($100K start, extra warnings)' },
      { id: 'normal', label: 'Normal ($50K start, balanced)' },
      { id: 'hard',   label: 'Hard ($25K start, unforgiving)' },
    ];

    const ov = h('div', { className: 't-modal-ov', id: '_t_creator_modal' },
      h('div', { className: 't-modal' },
        h('h2', null, '🚀 Start Your Studio'),
        h('div', { style: { color:'#8b949e', fontSize:'0.85rem', marginBottom:'16px' } },
          'Pick a scenario, then customize your founder. Build something.'),
        // Scenario selector (Phase 6A)
        scenarios.length > 0 && h('label', null, 'Scenario',
          h('select', {
            onchange: e => {
              config.scenario = e.target.value;
              const s = scenarios.find(sc => sc.id === config.scenario);
              if (s?.defaults) {
                config.specialty = s.defaults.specialty;
                config.trait = s.defaults.trait;
                config.difficulty = s.defaults.difficulty;
              }
              // Rerender to refresh defaults in other selects
              document.getElementById('_t_creator_modal')?.remove();
              openCharacterCreator(onConfirm);
            }
          },
            ...scenarios.map(s => h('option', { value: s.id, selected: s.id === config.scenario ? true : null },
              s.label + (s.yearStart ? ' — ' + s.yearStart : '')))
          )
        ),
        // Scenario blurb
        (() => {
          const s = scenarios.find(sc => sc.id === config.scenario);
          if (!s) return null;
          return h('div', { style:{color:'#8957e5', fontSize:'0.72rem', marginTop:'-8px', marginBottom:'12px', fontStyle:'italic'} },
            s.blurb);
        })(),
        h('label', null, 'Studio name',
          h('input', { type:'text', value: config.studioName,
            oninput: e => { config.studioName = e.target.value; } })
        ),
        h('label', null, 'Your name',
          h('input', { type:'text', value: config.founderName,
            oninput: e => { config.founderName = e.target.value; } })
        ),
        h('label', null, 'Your specialty',
          h('select', {
            onchange: e => { config.specialty = e.target.value; }
          },
            ...specialtyChoices.map(s =>
              h('option', { value: s.id, selected: s.id === config.specialty ? true : null }, s.label))
          )
        ),
        h('label', null, 'Founder trait',
          h('select', {
            onchange: e => { config.trait = e.target.value; }
          },
            ...traits.map(t =>
              h('option', { value: t, selected: t === config.trait ? true : null },
                t + ' — ' + traitEffects[t]))
          )
        ),
        h('label', null, 'Difficulty',
          h('select', {
            onchange: e => { config.difficulty = e.target.value; }
          },
            ...difficulties.map(d =>
              h('option', { value: d.id, selected: d.id === config.difficulty ? true : null }, d.label))
          )
        ),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn secondary', onclick: () => {
            document.getElementById('_t_creator_modal')?.remove();
            _creatorConfig = null;
          } }, 'Cancel'),
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_creator_modal')?.remove();
            const finalConfig = { ..._creatorConfig };
            _creatorConfig = null; // reset for next time
            onConfirm(finalConfig);
          } }, 'Begin →')
        )
      )
    );
    document.body.appendChild(ov);
  }

  // ---------- Public API ----------
  const tycoonUI = {
    enter(opts) {
      opts = opts || {};
      // If no founder + not forcing skip, show creator first
      if (!S.founder && !opts.skipCreator) {
        openCharacterCreator((config) => {
          // Apply config to state
          S.studioName = config.studioName;
          S.founderName = config.founderName;
          S.founderSpecialty = config.specialty;
          S.founderTrait = config.trait;
          S.difficulty = config.difficulty;
          S.scenario = config.scenario;
          // Create the founder
          window.createFounder(config.founderName, config.specialty, config.trait);
          // Set starting cash per difficulty + defunct bonus
          const cashByDiff = { easy: 100000, normal: 50000, hard: 25000 };
          const baseCash = cashByDiff[config.difficulty] || 50000;
          const bonus = window.tycoonFinance?.defunctCashBonus?.() || 0;
          S.cash = Math.round(baseCash * (1 + bonus));
          if (bonus > 0) {
            console.info('[career] Defunct bonus applied: +' + Math.round(bonus * 100) + '% cash');
          }
          S.careerStarted = true;
          S.careerStartedAt = (typeof trustedNow === 'function') ? trustedNow() : Date.now();
          // Apply scenario modifications (Phase 6A)
          if (config.scenario && window.tycoonScenarios) {
            window.tycoonScenarios.apply(config.scenario);
          }
          if (typeof markDirty === 'function') markDirty();
          // Now actually enter
          tycoonUI.enter({ skipCreator: true });
        });
        return;
      }
      // Fallback: if somehow no founder (e.g. dbg call), hardcode
      if (!S.founder) {
        window.createFounder('Alex Chen', 'coder', 'Creative');
      }
      // Set starting cash if zero (for dbg entry path)
      if (!S.cash || S.cash === 0) {
        S.cash = (S.difficulty === 'easy') ? 100000 : (S.difficulty === 'hard') ? 25000 : 50000;
      }
      // If the save was persisted at speed 0 (paused via the speed button),
      // resume at 1× so the loaded game isn't indistinguishable from frozen.
      // Same for S.paused — always un-pause on entry; the player can pause
      // again with the top-bar button or spacebar if they want.
      if (!S.speed || S.speed === 0) S.speed = 1;
      S.paused = false;
      injectStyles();
      if (getRootEl()) return;
      // Set the global tycoon-mode flag — tells clicker loop to skip its work
      window.__tycoonMode = true;
      // Hide all clicker UI (slot screen + main game container)
      const slotsEl = document.getElementById('slots');
      const gameEl = document.getElementById('G');
      if (slotsEl) slotsEl.style.display = 'none';
      if (gameEl) gameEl.style.display = 'none';
      // Build tycoon overlay
      const root = h('div', { className: 'tycoon-overlay', id: 'tycoon-overlay' });
      root.append(renderTopBar(), renderMainPanels());
      document.body.appendChild(root);
      window.tycoonProjects.startTick();
      if (window.tycoonContracts) window.tycoonContracts.startTick();
      if (window.tycoonEmployees) window.tycoonEmployees.startTick();
      if (window.tycoonHiring) window.tycoonHiring.startTick();
      if (window.tycoonFinance) window.tycoonFinance.startTick();
      if (window.tycoonEra) window.tycoonEra.startTick();
      if (window.tycoonResearch) window.tycoonResearch.startTick();
      if (window.tycoonHardware) window.tycoonHardware.startTick();
      if (window.tycoonRivals) window.tycoonRivals.startTick();
      if (window.tycoonMacro) window.tycoonMacro.startTick();
      if (window.tycoonMarket) window.tycoonMarket.startTick();
      if (window.tycoonAwards) window.tycoonAwards.startTick();
      if (window.tycoonSubsidiaries) window.tycoonSubsidiaries.startTick();
      if (window.tycoonWins) window.tycoonWins.startTick();
      if (window.tycoonAchievements) window.tycoonAchievements.startTick();
      if (window.tycoonHints) window.tycoonHints.startTick();
      // v3 roguelite: ensure the class roster exists on entry. Idempotent —
      // first entry for a save seeds the roster; subsequent entries no-op.
      if (window.tycoonTraits) window.tycoonTraits.ensureRoster();
      // v3 roguelite: school module handles yearly founder-age increment +
      // auto-retirement. Stops with the other modules on exit().
      if (window.tycoonSchool) window.tycoonSchool.startTick();
      window.tycoonTime.start();
      startUITick();
      startCalProgressLoop();
      console.info('[tycoon-ui] entered tycoon mode as ' + S.founder.name);
    },
    exit() {
      window.tycoonTime.stop();
      window.tycoonProjects.stopTick();
      if (window.tycoonContracts) window.tycoonContracts.stopTick();
      if (window.tycoonEmployees) window.tycoonEmployees.stopTick();
      if (window.tycoonHiring) window.tycoonHiring.stopTick();
      if (window.tycoonFinance) window.tycoonFinance.stopTick();
      if (window.tycoonEra) window.tycoonEra.stopTick();
      if (window.tycoonResearch) window.tycoonResearch.stopTick();
      if (window.tycoonHardware) window.tycoonHardware.stopTick();
      if (window.tycoonRivals) window.tycoonRivals.stopTick();
      if (window.tycoonMacro) window.tycoonMacro.stopTick();
      if (window.tycoonMarket) window.tycoonMarket.stopTick();
      if (window.tycoonAwards) window.tycoonAwards.stopTick();
      if (window.tycoonSubsidiaries) window.tycoonSubsidiaries.stopTick();
      if (window.tycoonWins) window.tycoonWins.stopTick();
      if (window.tycoonAchievements) window.tycoonAchievements.stopTick();
      if (window.tycoonHints) window.tycoonHints.stopTick();
      if (window.tycoonSchool) window.tycoonSchool.stopTick();
      stopCalProgressLoop();
      if (_uiTickUnsub) { _uiTickUnsub(); _uiTickUnsub = null; }
      const root = getRootEl();
      if (root) root.remove();
      document.querySelector('.t-toast-stack')?.remove();
      _toastStack = null;  // clear cache so re-entry into tycoon gets a fresh stack
      console.info('[tycoon-ui] exited tycoon mode');
    },
    refresh() { refreshTopBar(); refreshMain(); },
    toast: pushToast
  };

  window.tycoonUI = tycoonUI;
  if (window.dbg) window.dbg.ui = tycoonUI;

  // ---------- Slot-screen hijack (Phase 1F) ----------
  // Intercepts slot clicks BEFORE the clicker's own handler fires.
  // Routes to tycoon mode directly. Clicker UI never becomes visible.
  function interceptSlotClicks() {
    const slotsEl = document.getElementById('slots');
    if (!slotsEl) return;
    if (slotsEl.__tycoonIntercepted) return;
    slotsEl.__tycoonIntercepted = true;

    slotsEl.addEventListener('click', (e) => {
      // Allow language-bar and confirm buttons to pass through
      if (e.target.closest('#langBar')) return;
      if (e.target.closest('.slot-new')) return;
      if (e.target.closest('.slot-yes')) return;
      if (e.target.closest('.slot-no')) return;

      const slotBtn = e.target.closest('.slot-btn');
      if (!slotBtn) return;

      // Capture this click — don't let clicker's handler run
      e.stopPropagation();
      e.preventDefault();

      const n = slotBtn.dataset.slot;
      // Phase 6D fix: KEY is a module-scoped `let` in 03-state.js — not a
      // window property. Assigning window.KEY created a stray window prop
      // while load()/save() still targeted slot 1, so every click loaded
      // slot 1's data regardless of which slot was clicked. The IIFE's
      // closure can read/write the outer `let KEY`, so drop the window. prefix.
      KEY = 'gdc_save_' + n;

      // Load existing save (will wipe v1 via SCHEMA_MIGRATIONS[1])
      window.S = defaults();
      load(); // mutates S if valid v2 save exists

      // Route based on career state
      if (S.careerStarted && S.founder) {
        // Resume existing career
        tycoonUI.enter({ skipCreator: true });
      } else {
        // Fresh slot — show creator
        tycoonUI.enter();
      }
    }, true); // capture phase — fires before bubble-phase clicker handler
  }

  // Rebuild slots to match tycoon naming ("Start Career" instead of "New Game")
  function relabelSlots() {
    const slots = document.querySelectorAll('.slot-new');
    slots.forEach(b => { if (b.textContent === 'New Game' || b.textContent === 'Nuevo Juego' || b.textContent === 'Novo Jogo' || b.textContent === 'Nouvelle Partie' || b.textContent === 'Neues Spiel' || b.textContent === 'new run') b.textContent = 'Restart Career'; });
    // Show tycoon banner above slots
    const slotsEl = document.getElementById('slots');
    if (slotsEl && !document.getElementById('_t_tycoon_banner')) {
      const banner = document.createElement('div');
      banner.id = '_t_tycoon_banner';
      banner.style.cssText = 'font-size:0.75rem;color:#8957e5;letter-spacing:.05em;text-transform:uppercase;text-align:center;margin:-8px 0 12px;font-weight:700;';
      banner.textContent = '🚀 Tycoon Edition';
      const subtitle = slotsEl.querySelector('.slot-sub');
      if (subtitle) subtitle.after(banner);
    }
  }

  // Init hooks
  function initSlotHijack() {
    interceptSlotClicks();
    relabelSlots();
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSlotHijack();
  } else {
    document.addEventListener('DOMContentLoaded', initSlotHijack);
  }
  setTimeout(initSlotHijack, 250);

  // If user exits tycoon, reload the page (cleanest — avoids clicker-state bleed)
  const origExit = tycoonUI.exit;
  tycoonUI.exit = function() {
    origExit();
    // Full reload — clicker loop, stale state, timers all reset cleanly
    location.reload();
  };

  // Hook: hijack shipProject to show a launch celebration modal with reviews
  const origShip = window.tycoonProjects?.ship;
  if (origShip) {
    window.tycoonProjects.ship = function(id) {
      const proj = origShip(id);
      if (proj && proj.criticScore !== null) {
        // Short summary toast
        pushToast('🚀 ' + proj.name + ' launched! Critic ' + proj.criticScore + '/100 · ' +
          (proj.isContract ? fmtMoney(proj.payment) + ' paid' : fmtMoney(proj.launchSales) + ' sales'),
          'win');
        // Launch window notes (Phase 4D)
        if (proj.launchNotes && proj.launchNotes.length > 0) {
          proj.launchNotes.forEach(note => pushToast(note));
        }
        // Big celebration modal with reviews (Phase 4F)
        openLaunchCelebration(proj);
        refreshMain();
      }
      return proj;
    };
  }

  // Share card summary (Phase 5F) — plain text for clipboard
  function buildShareCard(founderName, studio, startYear, endYear, years, shipped, hits, awards) {
    const lines = [];
    lines.push('🏢 ' + studio + ' (' + startYear + '–' + endYear + ')');
    lines.push('👤 Founded by ' + founderName);
    lines.push('');
    lines.push('📊 ' + years + ' years · ' + shipped.length + ' titles · ' + fmtMoney(S.tRevenue || 0) + ' lifetime rev');
    lines.push('⭐ Peak Fame: ' + (S.tFame || 0));
    if (hits.length > 0) lines.push('🏆 Legacy games (critic 90+): ' + hits.length);
    if (S.ipo?.completed) lines.push('📈 IPO ' + S.ipo.closedAtYear + ' at ' + fmtMoney(S.ipo.valuation));
    if ((S.winsAchieved || []).length > 0) {
      const names = S.winsAchieved.map(id => (window.tycoonWins?.WIN_PATHS?.find(p => p.id === id)?.label) || id);
      lines.push('✅ Wins: ' + names.join(', '));
    }
    if (awards.length > 0) {
      lines.push('');
      lines.push('🏅 Awards (' + awards.length + '):');
      for (const a of awards.slice(0, 5)) lines.push('  ' + a);
    }
    if (hits.length > 0) {
      lines.push('');
      lines.push('💎 Legacy games:');
      for (const h of hits.slice(0, 5)) {
        lines.push('  ' + (window.PROJECT_TYPES[h.type]?.icon || '') + ' ' + h.name + ' (critic ' + h.criticScore + ')');
      }
    }
    lines.push('');
    lines.push('— Software Dev Tycoon v2');
    return lines.join('\n');
  }

  // ---------- Legacy screen (Phase 5C / 5F) ----------
  // Shown on bankruptcy (game-over) or on-demand retrospective.
  // kind: 'bankruptcy' | 'victory' | 'retrospective'
  function openLegacyScreen(endYear, kind) {
    kind = kind || 'retrospective';
    // Hard-pause
    window.tycoonTime?.stop();

    const founderName = S.founder?.name || 'Founder';
    const studio = S.studioName || 'Studio';
    const startYear = 1980;
    const years = (endYear || S.calendar?.year || startYear) - startYear;
    const shipped = S.projects?.shipped || [];
    const hits = shipped.filter(p => !p.isContract && (p.criticScore || 0) >= 90);
    const contractCount = shipped.filter(p => p.isContract).length;
    const ipCount = shipped.filter(p => !p.isContract).length;
    const awards = (S.awards?.history || []).flatMap(h => {
      const w = [];
      if (h.winners.goty?.source === 'player') w.push('🏆 Game of the Year ' + h.year + ' — ' + h.winners.goty.title);
      if (h.winners.studioOfYear?.key === 'player') w.push('🏛️ Studio of the Year ' + h.year);
      if (h.winners.risingStar?.source === 'player') w.push('🚀 Rising Star ' + h.year);
      if (h.winners.innovation?.source === 'player') w.push('💡 Innovation Award ' + h.year);
      return w;
    });
    const bankrupt = kind === 'bankruptcy';
    const titleText = bankrupt ? '💀 BANKRUPTCY' :
                      kind === 'victory' ? '🏆 VICTORY' : '📜 CAREER SUMMARY';
    const subtitle = bankrupt ? 'Your studio closed its doors in ' + endYear :
                     kind === 'victory' ? 'You built something legendary' :
                     'Looking back at ' + studio;

    const mainColor = bankrupt ? '#f85149' : kind === 'victory' ? '#f0883e' : '#7ee787';

    const ov = h('div', { className: 't-modal-ov', id: '_t_legacy_modal' },
      h('div', { className: 't-modal', style:{maxWidth: '680px', textAlign:'center'} },
        h('h2', { style:{fontSize:'1.4rem', color: mainColor} }, titleText),
        h('div', { style:{color:'#8b949e', fontSize:'0.9rem', marginBottom:'16px'} }, subtitle),

        h('div', { style:{ background:'#0d1117', border:'1px solid #30363d', borderRadius:'6px', padding:'14px', marginBottom:'14px', textAlign:'left' } },
          h('div', { style:{color:'#f0f6fc', fontWeight:'700', marginBottom:'8px'} },
            '👤 ' + founderName + ' · ' + studio + ' · ' + startYear + '–' + (endYear || S.calendar?.year)),
          h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'Years operated'),
            h('span', { className: 'val' }, years + ' years')),
          h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'Titles shipped'),
            h('span', { className: 'val' }, shipped.length + ' total (' + ipCount + ' IP + ' + contractCount + ' contracts)')),
          h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'Legacy hits (critic 90+)'),
            h('span', { className: 'val' }, hits.length + ' title' + (hits.length === 1 ? '' : 's'))),
          h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'Peak Fame'),
            h('span', { className: 'val' }, String(S.tFame || 0))),
          h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'Lifetime revenue'),
            h('span', { className: 'val' }, fmtMoney(S.tRevenue || 0))),
          h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'Lifetime expenses'),
            h('span', { className: 'val' }, fmtMoney(S.tExpenses || 0))),
          S.ipo?.completed && h('div', { className: 't-finance-row' },
            h('span', { className: 'lbl' }, 'IPO'),
            h('span', { className: 'val' }, S.ipo.closedAtYear + ' · ' + fmtMoney(S.ipo.valuation) + ' valuation'))
        ),

        // Legacy hits
        hits.length > 0 && h('div', { style:{textAlign:'left', marginBottom:'14px'} },
          h('div', { className: 't-era-band', style:{marginTop:0} }, 'Legacy Games'),
          ...hits.slice(0, 5).map(p => h('div', { className:'t-finance-row' },
            h('span', { className:'lbl' }, (window.PROJECT_TYPES[p.type]?.icon || '') + ' ' + p.name),
            h('span', { className:'val' }, 'Critic ' + p.criticScore)
          ))
        ),

        // Awards
        awards.length > 0 && h('div', { style:{textAlign:'left', marginBottom:'14px'} },
          h('div', { className: 't-era-band', style:{marginTop:0} }, 'Awards'),
          ...awards.slice(0, 8).map(a => h('div', { style:{color:'#c9d1d9', fontSize:'0.8rem', padding:'2px 0'} }, a))
        ),

        // Bankruptcy note
        bankrupt && h('div', { style:{background:'#3b1519', border:'1px solid #f85149', borderRadius:'4px', padding:'10px', marginBottom:'14px', color:'#ffa198', fontSize:'0.8rem'} },
          'Your save slot is now marked DEFUNCT. Next career will start with +5% cash.'),

        h('div', { className: 't-modal-actions', style:{justifyContent:'center', flexWrap:'wrap'} },
          // Share card button — copies a text summary to clipboard
          h('button', { className: 't-btn secondary', onclick: () => {
            const summary = buildShareCard(founderName, studio, startYear, endYear || S.calendar?.year, years, shipped, hits, awards);
            try {
              navigator.clipboard.writeText(summary);
              pushToast('📋 Career summary copied to clipboard!');
            } catch (err) {
              alert(summary);
            }
          }}, '📋 Copy Share Card'),
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_legacy_modal')?.remove();
            if (bankrupt) {
              // Wipe save + reload for fresh career
              try { localStorage.removeItem(KEY); } catch (e) {}
              location.reload();
            } else {
              // Resume play (retrospective path)
              window.tycoonTime?.start();
            }
          }}, bankrupt ? 'Start New Career' : 'Continue')
        )
      )
    );
    document.body.appendChild(ov);
  }

  // ---------- Awards ceremony modal (Phase 4G) ----------
  function openAwardsCeremony(year, winners, effects) {
    // Auto-pause
    const prevPaused = S.paused;
    S.paused = true;
    refreshTopBar();

    const renderWinnerRow = (category, winner, extra) => {
      if (!winner) return null;
      const sourceLabel = winner.source === 'player' ?
        '⭐ Your Studio' :
        ((winner.sourceIcon || '') + ' ' + (winner.sourceName || 'Rival'));
      const detail = winner.studioName ? winner.studioName : (winner.title || '—');
      const criticStr = winner.critic != null ? ' · Critic ' + winner.critic : '';
      return h('div', { className: 't-finance-row',
        style: winner.source === 'player' ?
          { background:'linear-gradient(90deg, rgba(240,136,62,0.12), transparent)' } : {}
      },
        h('span', { className: 'lbl' }, category),
        h('span', { className: 'val', style:{ color:'#f0f6fc' } },
          (winner.icon || '') + ' ' + detail + ' — ' + sourceLabel + criticStr + (extra || ''))
      );
    };

    const ov = h('div', { className: 't-modal-ov', id: '_t_awards_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '640px' } },
        h('h2', { style: { fontSize:'1.2rem', textAlign:'center' } },
          '🏆 ' + year + ' Industry Awards'),
        h('div', { style: { color:'#8b949e', fontSize:'0.75rem', textAlign:'center', marginBottom:'16px' } },
          'Celebrating the year\'s best across the software industry'),

        // --- Winners ---
        h('div', null,
          renderWinnerRow('🏆 Game of the Year', winners.goty),
          renderWinnerRow('🏛️ Studio of the Year', winners.studioOfYear && {
            source: winners.studioOfYear.key === 'player' ? 'player' : 'rival',
            sourceName: winners.studioOfYear.name,
            sourceIcon: winners.studioOfYear.icon,
            title: winners.studioOfYear.name,
          }),
          renderWinnerRow('🚀 Rising Star', winners.risingStar),
          renderWinnerRow('💡 Innovation Award', winners.innovation),
        ),

        // --- Best in Genre ---
        Object.keys(winners.bestInGenre || {}).length > 0 && h('div', { style: { marginTop:'12px' } },
          h('div', { className: 't-era-band' }, 'Best in Genre'),
          h('div', null, ...Object.entries(winners.bestInGenre).map(([type, w]) => {
            const typeDef = window.PROJECT_TYPES[type];
            return renderWinnerRow('🎖️ Best ' + (typeDef?.label || type), w);
          }))
        ),

        // --- Your Effects ---
        effects && effects.length > 0 && h('div', { style: { marginTop:'16px', padding:'10px', background:'#0d1117', border:'1px solid #30363d', borderRadius:'4px' } },
          h('div', { style:{ color:'#f0883e', fontSize:'0.8rem', fontWeight:'700', marginBottom:'6px' } },
            '🎁 Your studio earned:'),
          ...effects.map(e => h('div', { style: { color:'#c9d1d9', fontSize:'0.8rem', marginLeft:'8px' } }, e))
        ),

        h('div', { className: 't-modal-actions', style: { justifyContent:'center' } },
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_awards_modal')?.remove();
            S.paused = prevPaused;
            refreshTopBar();
            refreshMain();
          }}, 'Continue')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function openLaunchCelebration(proj) {
    // Auto-pause game
    const prevPaused = S.paused;
    S.paused = true;
    refreshTopBar();

    const critic = proj.criticScore;
    const color = critic >= 90 ? '#f0883e' : critic >= 75 ? '#7ee787' : critic >= 60 ? '#58a6ff' : critic >= 40 ? '#c9d1d9' : '#f85149';
    const bandLabel = critic >= 90 ? '🏆 MASTERPIECE' : critic >= 75 ? '✨ GREAT' : critic >= 60 ? '👍 GOOD' : critic >= 40 ? '⚠️ FLAWED' : '💀 DISMAL';

    const ov = h('div', { className: 't-modal-ov', id: '_t_launch_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '560px', textAlign: 'center' } },
        h('h2', { style: { fontSize:'1.3rem', color } }, '🚀 ' + proj.name + ' LAUNCHED'),
        h('div', { style: { color, fontSize:'2.2rem', fontWeight:'800', margin:'12px 0' } },
          critic + '/100'),
        h('div', { style: { color:'#8b949e', fontSize:'0.85rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.06em' } },
          bandLabel),
        h('div', { style: { color:'#7ee787', fontSize:'1.1rem', fontWeight:'700', margin:'12px 0' } },
          proj.isContract ? 'Paid: ' + fmtMoney(proj.payment) : 'Launch Sales: ' + fmtMoney(proj.launchSales)),
        proj.reviews && proj.reviews.length > 0 && h('div', { style: { marginTop:'16px', textAlign:'left' } },
          h('div', { style: { color:'#8b949e', fontSize:'0.72rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'8px' } },
            'Critics Say'),
          ...proj.reviews.map(r => h('div', {
            style: { padding:'10px 12px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px', marginBottom:'6px' }
          },
            h('div', { style: { color:'#c9d1d9', fontSize:'0.85rem', fontStyle:'italic' } }, '"' + r.text + '"'),
            h('div', { style: { color:'#8b949e', fontSize:'0.7rem', marginTop:'4px' } },
              '— ' + r.outlet + ' · ' + r.score + '/100')
          ))
        ),
        h('div', { className: 't-modal-actions', style: { justifyContent:'center' } },
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_launch_modal')?.remove();
            S.paused = prevPaused;
            refreshTopBar();
          }}, 'Continue')
        )
      )
    );
    document.body.appendChild(ov);
  }

  console.log('[tycoon-ui] module loaded. Call %cdbg.ui.enter()%c or %ctycoonUI.enter()%c to activate.',
    'color:#f0883e;font-weight:bold', 'color:inherit', 'color:#f0883e;font-weight:bold', 'color:inherit');
})();
