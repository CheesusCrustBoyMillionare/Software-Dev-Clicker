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

/* Active project info sheet */
.t-qstat { background:#0d1117; border:1px solid #21262d; padding:6px 10px; border-radius:4px; color:#8b949e; font-size:.72rem; font-weight:700; letter-spacing:.04em; }
.t-qstat .v { color:#f0f6fc; font-size:.95rem; margin-left:4px; }
.t-team-list, .t-feat-list, .t-decision-list { background:#0d1117; border:1px solid #21262d; border-radius:4px; padding:6px 0; }
.t-team-row, .t-feat-row { display:flex; justify-content:space-between; padding:6px 10px; font-size:.82rem; }
.t-team-row + .t-team-row, .t-feat-row + .t-feat-row { border-top:1px solid #21262d; }
.t-team-row .n, .t-feat-row .n { color:#c9d1d9; }
.t-team-row .r { color:#8b949e; font-size:.72rem; }
.t-decision-row { padding:8px 10px; font-size:.78rem; }
.t-decision-row + .t-decision-row { border-top:1px solid #21262d; }
.t-decision-row .q { color:#8b949e; margin-bottom:2px; }
.t-decision-row .a { color:#c9d1d9; }
.t-proj-deadline { margin-top:6px; font-size:.72rem; color:#8b949e; }
.t-proj-deadline.tight { color:#f0883e; font-weight:600; }
.t-proj-deadline.late  { color:#f85149; font-weight:700; }

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
/* Red "urgent" variant — used by the Hiring button when outside offers are pending */
.t-btn.t-hiring-urgent {
  background: rgba(248, 81, 73, 0.14);
  border-color: rgba(248, 81, 73, 0.6);
  color: #ff7b72;
}
.t-btn.t-hiring-urgent:hover { background: rgba(248, 81, 73, 0.24); border-color: #f85149; }
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
.t-modal .t-modal-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  /* Sticky footer so Close / Continue / Confirm stay in view even when the
     modal content is long enough to scroll. The negative side+bottom margins
     cancel the .t-modal's 24px padding so the bar reaches the modal edges;
     the internal 14px 24px padding keeps the buttons away from the borders.
     Opaque bg + top border + upward shadow hide the scrolling content behind. */
  position: sticky; bottom: 0; z-index: 2;
  margin: 20px -24px -24px;
  padding: 14px 24px;
  background: #161b22;
  border-top: 1px solid #30363d;
  box-shadow: 0 -6px 16px -8px rgba(0,0,0,0.5);
}

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
.t-mc-answer .lock   { display: block; font-size: 0.72rem; color: #f0883e; margin-top: 4px; font-weight: 600; }
.t-mc-answer .unlock { display: block; font-size: 0.72rem; color: #7ee787; margin-top: 4px; font-weight: 600; }

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
.t-candidate-card.matched-req { border-color: #bc8cff; background: rgba(188,140,255,0.06); }
.t-candidate-card.matched-req.interviewed { border-color: #bc8cff; box-shadow: 0 0 0 1px #bc8cff44; }
.t-candidate-card.referred { border-color: #7ee787; background: rgba(126,231,135,0.05); }
.t-candidate-card.referred.interviewed { border-color: #7ee787; box-shadow: 0 0 0 1px #7ee78744; }
.t-candidate-card.poached { border-color: #ffd33d; background: rgba(255,211,61,0.05); }
.t-candidate-card.poached.interviewed { border-color: #ffd33d; box-shadow: 0 0 0 1px #ffd33d44; }
.t-candidate-card.alumnus { border-color: #79c0ff; background: rgba(121,192,255,0.05); }
.t-candidate-card.alumnus.interviewed { border-color: #79c0ff; box-shadow: 0 0 0 1px #79c0ff44; }

/* Requisition rows (phase 3) */
.t-req-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 10px; background: #0d1117; border: 1px solid #30363d;
  border-radius: 4px; margin-bottom: 6px; font-size: 0.78rem;
}
.t-req-row .label { color: #c9d1d9; }
.t-req-row .meta  { color: #8b949e; font-size: 0.72rem; }
.t-req-row .close-btn {
  background: transparent; border: 1px solid #30363d; color: #8b949e;
  padding: 3px 10px; border-radius: 3px; cursor: pointer; font-size: 0.7rem;
}
.t-req-row .close-btn:hover { color: #f85149; border-color: #f85149; }

.t-employee-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #0d1117; border: 1px solid #21262d;
  border-radius: 4px; margin-bottom: 6px;
}
.t-employee-clickable { cursor: pointer; transition: border-color .12s, background .12s; }
.t-employee-clickable:hover { border-color: #58a6ff; background: #0f1621; }
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
      if (typeof c === 'string' || typeof c === 'number') {
        el.appendChild(document.createTextNode(String(c)));
      } else {
        el.appendChild(c);
      }
    }
    return el;
  }

  function fmtMoney(n) {
    if (n == null) return '$0';
    if (Math.abs(n) >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n/1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }

  // ---------- Quality-axis helpers (used by project UI) ----------
  // Consistent color palette for the three quality axes so the New Project
  // modal, active project detail, and info lines all match.
  const AXIS_COLOR = { design: '#bc8cff', tech: '#58a6ff', polish: '#f0883e' };
  const AXIS_ICON  = { design: '🎨',       tech: '🛠',      polish: '✨' };
  function axisPrimaryLabel(weights) {
    if (!weights) return '';
    const top = Object.entries(weights).sort((a,b) => b[1] - a[1])[0];
    return top ? (top[0] + '-heavy') : '';
  }
  function axisStr(name, w) {
    return name + ' ' + Math.round((w || 0) * 100) + '%';
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

    // Monthly burn (4 game weeks) + runway so the player can see survival
    // horizon at a glance rather than drilling into Finance. Both match the
    // numbers in the Finance modal.
    const weeklyBurn = window.tycoonEmployees?.weeklyBurn?.() || 0;
    const monthlyBurn = weeklyBurn * 4;
    const burn = h('div', { className: 't-stat', title: 'Total team salary burn per game month (4 weeks). Drill into 💰 Finance for the full P&L.' },
      h('div', { className: 't-stat-val', style: { color: '#f85149' } },
        monthlyBurn > 0 ? '\u2212' + fmtMoney(monthlyBurn) : '\u2014'),
      h('div', { className: 't-stat-lbl' }, 'Burn / mo')
    );

    const runwayM = window.tycoonFinance?.currentRunwayMonths?.() ?? Infinity;
    const runwayIsInf = runwayM === Infinity || runwayM > 9999;
    const runwayStr = runwayIsInf ? '\u221E' : runwayM.toFixed(1) + ' mo';
    const runwayColor = runwayIsInf ? '#7ee787'
                       : runwayM < 3 ? '#f85149'
                       : runwayM < 6 ? '#f0883e'
                       : '#7ee787';
    const runwayTitle = runwayIsInf
      ? 'Positive cash flow — runway is effectively unlimited at current burn.'
      : 'Months your current cash can cover team salaries. Red <3, orange 3-6, green 6+.';
    const runway = h('div', { className: 't-stat', title: runwayTitle },
      h('div', { className: 't-stat-val', style: { color: runwayColor } }, runwayStr),
      h('div', { className: 't-stat-lbl' }, 'Runway')
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
    // Pause button highlights when either S.speed=0 (user clicked Pause) or
    // S.paused=true (user hit spacebar). Other speed buttons stay un-lit
    // while paused so the bar doesn't say "1× active" while nothing moves.
    const userPaused = S.speed === 0 || S.paused === true;
    for (const sp of speeds) {
      const isActive = sp.s === 0 ? userPaused : (!userPaused && S.speed === sp.s);
      const btn = h('button', {
        className: isActive ? 'active' : '',
        onclick: () => {
          // Clicking the Pause button when already paused-via-spacebar should
          // unpause — otherwise the Pause button becomes a dead-end when the
          // highlight was triggered by S.paused rather than S.speed=0.
          if (sp.s === 0 && S.paused) {
            window.tycoonTime.togglePause();
          } else {
            if (S.paused) window.tycoonTime.togglePause();
            window.tycoonTime.setSpeed(sp.s);
          }
          refreshTopBar();
        }
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

    topbar.append(cal, cash, revenue, shipped, burn, runway);
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
    return h('div', {
      className: 't-employee-row t-employee-clickable',
      title: 'Click for details, stats, and actions',
      onclick: (e) => {
        // Ignore clicks on inner interactive elements (safety — none today,
        // but future-proof for in-row controls like quick-fire or reassign).
        if (e.target.closest('button')) return;
        openEmployeeDetailModal(emp.id);
      }
    },
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
    // Clickable:
    //   - shipped non-contract: opens sales/reviews modal
    //   - active (any kind): opens project detail info sheet
    const isShippedClickable = isShipped && !proj.isContract;
    const isActiveClickable = !isShipped;
    const isClickable = isShippedClickable || isActiveClickable;
    const cardProps = {
      className: 't-proj-card ' + (isShipped ? 'shipped' : '') + (isClickable ? ' t-proj-clickable' : ''),
      'data-proj-id': proj.id,
    };
    if (isClickable) {
      cardProps.onclick = () => {
        if (isShipped) openShippedProjectModal(proj.id);
        else openActiveProjectModal(proj.id);
      };
      cardProps.title = isShipped ? 'Click for sales breakdown + reviews' : 'Click for project details';
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

    // Pause is handled centrally by the MutationObserver on document.body —
    // adding any .t-modal-ov auto-pauses; removing it auto-unpauses. See
    // startModalPauseObserver() below.
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

    // Compute idle state + best RP/week for header hint and per-node ETAs
    const ip0 = S.research?.inProgress;
    let anyAvailable = false;
    for (const n of nodes) {
      if (window.tycoonResearch.isCompleted(n.id)) continue;
      if (window.tycoonResearch.isAvailable(n.id)?.ok) { anyAvailable = true; break; }
    }
    const isIdle = !ip0 && anyAvailable;
    const bestTech = Math.max(
      S.founder?.stats?.tech || 0,
      ...((S.employees || []).map(e => e.stats?.tech || 0))
    );
    // v11.2: matches rpPerWeek formula in 21-tycoon-research.js (0.12 ÷ 10x stat scale).
    const bestRpPerWeek = bestTech * 0.12;

    // Pioneer / Fast-Follower rollup — surfaces the current sales multiplier
    // the player has earned (or lost) from racing rivals on research.
    const pioneer = window.tycoonResearch?.pioneerSalesMultiplier?.() || null;
    const pioneerLine = pioneer && (pioneer.pioneerCount + pioneer.fastFollowerCount > 0)
      ? h('div', { style: { color: pioneer.pct >= 0 ? '#7ee787' : '#f0883e', fontSize:'0.74rem', marginBottom:'8px', fontWeight:600 } },
          '\uD83C\uDFC6 Legacy: ' + pioneer.pioneerCount + ' Pioneer, ' +
          pioneer.fastFollowerCount + ' Fast-Follower \u2192 ' +
          (pioneer.pct >= 0 ? '+' : '') + pioneer.pct + '% launch sales on every ship')
      : null;

    const ov = h('div', { className: 't-modal-ov', id: '_t_research_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '720px' } },
        h('h2', null, '🔬 Research'),
        h('div', { style: { color: isIdle ? '#f0883e' : '#8b949e', fontSize:'0.8rem', marginBottom:'4px', fontWeight: isIdle ? 600 : 400 } },
          (window.tycoonResearch.state().completedCount) + ' completed · ' +
          (ip0
            ? 'Researching ' + window.tycoonResearch.NODE_BY_ID[ip0.nodeId]?.name + ' · ~' + bestRpPerWeek.toFixed(1) + ' RP/week (best Tech ' + bestTech + ' × 1.2)'
            : (anyAvailable
                ? '⚠ No active research — your Tech stat earns 0 RP/week until you start a node'
                : 'No active research'))),
        pioneerLine,
        // Note on how the new cost + Pioneer system works
        h('div', { style: { color:'#8b949e', fontSize:'0.68rem', marginBottom:'10px', fontStyle:'italic' } },
          'Each research charges cash up-front (scales with RP cost). ' +
          'While researching, the assigned engineer contributes 0 to projects. ' +
          'Finishing a node first earns \uD83C\uDFC6 Pioneer (+2% ship sales forever); ' +
          'finishing after a rival tags it Fast-Follower (\u22121%).'),
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

    // ETA estimate when available and not yet started — helps the player
    // reason about time-to-complete at their best Tech level.
    let etaHint = '';
    if (!isDone && !isInProg && avail.ok) {
      const bestTech = Math.max(
        S.founder?.stats?.tech || 0,
        ...((S.employees || []).map(e => e.stats?.tech || 0))
      );
      // v11.2: matches research rpPerWeek formula (0.12 for 10-100 stat scale).
      const rpPerWeek = bestTech * 0.12;
      if (rpPerWeek > 0) {
        const wks = Math.ceil(node.rpCost / rpPerWeek);
        etaHint = ' · ~' + wks + ' week' + (wks === 1 ? '' : 's') + ' at best Tech';
      }
    } else if (isInProg) {
      const eng = (S.founder?.id === ip.engineerId || ip.engineerId === 'founder')
        ? S.founder
        : (S.employees || []).find(e => e.id === ip.engineerId);
      const tech = eng?.stats?.tech || 0;
      const rpPerWeek = tech * 0.12;
      if (rpPerWeek > 0) {
        const remaining = Math.max(0, node.rpCost - ip.rpEarned);
        const wks = Math.ceil(remaining / rpPerWeek);
        etaHint = ' · ~' + wks + ' week' + (wks === 1 ? '' : 's') + ' left';
      }
    }

    const leftSide = h('div', { style: { flex:1, minWidth: 0 } },
      h('div', { className: 'r-name' },
        (categoryIcons[node.category] || '') + ' ' + node.name,
        pioneerBadge
      ),
      h('div', { className: 'r-meta' },
        node.rpCost + ' RP' + etaHint + ' · ' + (node.category) + (node.era > 1980 ? ' · ' + node.era + '+' : '') +
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
      // v11.1: show cash cost on the Start button; disable if not affordable.
      const cashCost = R.cashCostFor ? R.cashCostFor(node.id) : 0;
      const canAfford = cashCost === 0 || (S.cash || 0) >= cashCost;
      rightSide = h('button', {
        className: 't-btn',
        disabled: canAfford ? null : true,
        title: canAfford ? null : 'Need ' + fmtMoney(cashCost) + ' cash to start',
        onclick: () => {
          const r = R.start(node.id, 'founder');
          if (!r.ok) pushToast(r.error);
          rerenderResearchModal();
          refreshTopBar();
        }
      }, cashCost > 0 ? ('Start — ' + fmtMoney(cashCost)) : 'Start');
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

  // ---------- Active project info sheet ----------
  // Rich read-only view of an in-development project: phase + smooth progress
  // bar, quality breakdown, team roster, features picked, MC decisions made,
  // and cost accrued. Clicking any active project card opens this modal.
  // ---------- Employee detail modal ----------
  // Rich read-only view of a hired engineer — all their stats, traits, origin
  // story, current project assignment, annual cost, morale, and a Fire action.
  function openEmployeeDetailModal(empId) {
    document.getElementById('_t_emp_detail_modal')?.remove();
    const emp = (S.employees || []).find(e => e.id === empId);
    if (!emp) return;

    const TIERS = window.TYCOON_TIERS || [];
    const tierDef = TIERS[emp.tier] || {};
    // v11.2: default cap is now 100 (was 10) to match the 10-100 stat scale.
    const statCap = tierDef.statCap || 100;

    // Which project is this person on right now?
    const assignedProj = (S.projects?.active || []).find(p =>
      Array.isArray(p.team) && p.team.includes(emp.id));

    // Morale status label
    const morale = Math.max(0, Math.min(100, emp.morale || 0));
    const moraleLbl = morale >= 85 ? { text: 'Thriving', color: '#7ee787' }
                    : morale >= 60 ? { text: 'Content',  color: '#7ee787' }
                    : morale >= 40 ? { text: 'Restless', color: '#f0883e' }
                    : morale >= 20 ? { text: 'Unhappy',  color: '#f85149' }
                    :                { text: 'Quitting', color: '#f85149' };

    // Origin story (from candidate metadata, if surviving the hire)
    let originTag = null;
    if (emp.poachedFromRival) {
      originTag = h('span', { style:{color:'#ffd33d', fontWeight:700} },
        '\u26A1 Poached from ' + (emp.poachedFromIcon || '') + ' ' + emp.poachedFromRival);
    } else if (emp.reqId) {
      originTag = h('span', { style:{color:'#bc8cff', fontWeight:700} }, '📋 Requisition hire');
    } else if (emp.referralFromName) {
      originTag = h('span', { style:{color:'#7ee787', fontWeight:700} },
        '\uD83E\uDD1D Referred by ' + emp.referralFromName);
    }

    // Stat bars — bar length scales to the tier's stat cap, but the shown
    // number is just the stat value (the "/ cap" form read as a fraction
    // and confused players). Tooltip retains the cap for anyone curious.
    const statRow = (axis, val, icon, color) => {
      const pct = Math.min(100, (val / Math.max(1, statCap)) * 100);
      return h('div', {
        style: { marginBottom: '5px' },
        title: 'Bar fills toward ' + emp.tierName + ' cap of ' + statCap + '. Promotion raises the cap.'
      },
        h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginBottom:'2px' } },
          h('span', { style: { color, fontWeight: 700 } }, (icon || '') + ' ' + axis.toUpperCase()),
          h('span', { style: { color: '#c9d1d9', fontVariantNumeric: 'tabular-nums' } }, String(val))
        ),
        h('div', { style: { height: '6px', background: '#0d1117', border: '1px solid #21262d', borderRadius: '3px', overflow: 'hidden' } },
          h('div', { style: { width: pct + '%', height: '100%', background: color } })
        )
      );
    };

    // Annual cost vs weekly burn
    const weeklyCost = Math.round((emp.salary || 0) / 48);

    const ov = h('div', { className: 't-modal-ov', id: '_t_emp_detail_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '560px' } },
        // Header
        h('h2', { style: { margin: '0 0 4px' } }, emp.name),
        h('div', { style: { color: '#8b949e', fontSize: '0.78rem', marginBottom: '14px' } },
          emp.tierName + ' \u00b7 ' + emp.specialty +
          (originTag ? ' \u00b7 ' : ''),
          originTag
        ),

        // Stats
        h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700, marginBottom:'6px' } }, 'Stats'),
          statRow('tech',   emp.stats.tech,   '🛠', '#58a6ff'),
          statRow('design', emp.stats.design, '🎨', '#bc8cff'),
          statRow('polish', emp.stats.polish, '✨', '#f0883e'),
          statRow('speed',  emp.stats.speed,  '⚡', '#7ee787')
        ),

        // Traits
        (emp.traits?.length > 0) && h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700, marginBottom:'4px' } }, 'Traits'),
          h('div', { style: { display:'flex', flexWrap:'wrap', gap:'6px' } },
            ...emp.traits.map(t => {
              const def = window.TYCOON_TRAITS?.[t];
              return h('div', {
                style: { padding:'4px 10px', background:'#0d1117', border:'1px solid #30363d', borderRadius:'3px', fontSize:'0.72rem', color:'#c9d1d9' },
                title: def?.hint || ''
              }, '\u2728 ' + t + (def?.hint ? '  (' + def.hint + ')' : ''));
            })
          )
        ),

        // Morale
        h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginBottom:'4px' } },
            h('span', { style: { color:'#c9d1d9', fontWeight:700 } }, 'Morale'),
            h('span', { style: { color: moraleLbl.color, fontWeight:700 } }, moraleLbl.text + ' \u00b7 ' + morale + '/100')
          ),
          h('div', { style: { height: '8px', background: '#0d1117', border: '1px solid #21262d', borderRadius: '4px', overflow: 'hidden' } },
            h('div', { style: { width: morale + '%', height: '100%', background: moraleLbl.color } })
          ),
          morale < 50 && (emp.tier || 0) >= 3
            ? h('div', { style: { color:'#f85149', fontSize:'.7rem', marginTop:'4px' } },
                '\u26A0 Rivals may start making outside offers at morale < 50')
            : null
        ),

        // Promotion XP — only shown if not already max tier
        (() => {
          const TIERS = window.TYCOON_TIERS || [];
          if ((emp.tier || 0) >= TIERS.length - 1) return null;
          const xpNeeded = window.tycoonEmployees?.xpNeededForNextTier?.(emp.tier || 0) || 48;
          const xp = Math.max(0, emp.exp || 0);
          const nextTierName = TIERS[(emp.tier || 0) + 1]?.name || 'next tier';
          const pct = Math.min(100, (xp / xpNeeded) * 100);
          const color = xp >= xpNeeded ? '#79c0ff' : '#8b949e';
          const eligibleNote = xp >= xpNeeded
            ? ' \u2014 eligible for promotion (check Talent Market)'
            : '';
          return h('div', { style: { marginBottom: '14px' } },
            h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginBottom:'4px' } },
              h('span', { style:{color:'#c9d1d9', fontWeight:700} }, '\u2B06\uFE0F Promotion XP'),
              h('span', { style:{color, fontWeight:600} },
                xp + ' / ' + xpNeeded + ' toward ' + nextTierName + eligibleNote)
            ),
            h('div', { style: { height: '6px', background: '#0d1117', border: '1px solid #21262d', borderRadius: '3px', overflow: 'hidden' } },
              h('div', { style: { width: pct + '%', height: '100%', background: color } })
            )
          );
        })(),
        // Cost + assignment
        h('div', { style: { marginBottom: '14px', padding: '10px', background:'#0d1117', border:'1px solid #21262d', borderRadius:'4px' } },
          h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.78rem', marginBottom:'4px' } },
            h('span', { style:{color:'#8b949e'} }, 'Salary'),
            h('span', { style:{color:'#f0883e', fontWeight:700} }, fmtMoney(emp.salary) + '/yr')
          ),
          h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'#8b949e' } },
            h('span', null, 'Weekly burn contribution'),
            h('span', null, fmtMoney(weeklyCost) + '/wk')
          ),
          h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'#8b949e', marginTop:'2px' } },
            h('span', null, 'Education'),
            h('span', null, '🎓 ' + (emp.education?.flavor || '—'))
          ),
          h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'#8b949e', marginTop:'2px' } },
            h('span', null, 'Age'),
            h('span', null, emp.age || '—')
          ),
          h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'#8b949e', marginTop:'2px' } },
            h('span', null, 'Assigned project'),
            h('span', { style: { color: assignedProj ? '#c9d1d9' : '#8b949e' } },
              assignedProj ? assignedProj.name : 'Bench (unassigned)')
          )
        ),

        // Actions
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn secondary',
            onclick: () => {
              if (!confirm('Fire ' + emp.name + '? They\'ll leave immediately; no severance paid.')) return;
              window.tycoonEmployees?.fire?.(emp.id);
              document.getElementById('_t_emp_detail_modal')?.remove();
              pushToast(emp.name + ' has been let go');
              refreshTopBar();
              refreshMain();
            }
          }, 'Fire'),
          h('button', { className: 't-btn',
            onclick: () => document.getElementById('_t_emp_detail_modal')?.remove()
          }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function openActiveProjectModal(projId) {
    // Tear down any existing instance first (idempotent)
    document.getElementById('_t_active_proj_modal')?.remove();
    const proj = (S.projects?.active || []).find(p => p.id === projId);
    if (!proj) return;
    const typeDef = window.PROJECT_TYPES[proj.type];
    const scopeDef = window.PROJECT_SCOPES[proj.scope];
    const platDef = proj.platform ? window.tycoonPlatforms?.PLATFORM_BY_ID?.[proj.platform] : null;

    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const elapsed = currentWeek - proj.phaseStartedAtWeek;
    const weeksIntoPhase = Math.max(0, elapsed);
    const weeksOfPhase = proj.phaseWeeksRequired || 0;
    const phasePct = weeksOfPhase > 0 ? Math.min(100, (weeksIntoPhase / weeksOfPhase) * 100) : 0;

    // Remaining weeks across all phases until ship. Roughly — assumes
    // phaseWeeksRequired for each remaining phase matches scope.phaseWeeks.
    const phaseOrder = ['design', 'development', 'polish'];
    const phaseIdx = phaseOrder.indexOf(proj.phase);
    let weeksRemainingTotal = Math.max(0, weeksOfPhase - weeksIntoPhase);
    if (phaseIdx >= 0 && scopeDef?.phaseWeeks) {
      for (let i = phaseIdx + 1; i < phaseOrder.length; i++) {
        weeksRemainingTotal += scopeDef.phaseWeeks[phaseOrder[i]] || 0;
      }
    }

    // Team — look up assigned engineer rows + founder sentinel
    const teamRows = [];
    const teamIds = proj.team || [];
    if (teamIds.includes('founder') && S.founder) {
      teamRows.push(h('div', { className: 't-team-row' },
        h('span', { className: 'n' }, '👑 ' + (S.founder.name || 'Founder')),
        h('span', { className: 'r' }, 'Founder · ' + (S.founder.specialty || '—'))
      ));
    }
    for (const id of teamIds) {
      if (id === 'founder') continue;
      const e = (S.employees || []).find(x => x.id === id);
      if (!e) continue;
      teamRows.push(h('div', { className: 't-team-row' },
        h('span', { className: 'n' }, e.name),
        h('span', { className: 'r' }, (e.tierName || '—') + ' · ' + (e.specialty || '—'))
      ));
    }

    // Features list — pull from global PROJECT_FEATURES if present, else the raw IDs
    const featureDefs = window.PROJECT_FEATURES || {};
    const featureRows = (proj.features || []).map(fid => {
      const f = featureDefs[fid];
      return h('div', { className: 't-feat-row' },
        h('span', { className: 'n' }, f ? (f.icon ? f.icon + ' ' : '') + f.name : fid));
    });

    // Decisions made so far
    const decisionRows = (proj.decisionsMade || []).map(d => h('div', { className: 't-decision-row' },
      h('div', { className: 'q' }, '💬 ' + (window.TYCOON_MC_QUESTIONS?.find(q => q.id === d.questionId)?.text || d.questionId)),
      h('div', { className: 'a' }, '→ ' + d.answerText)
    ));

    // Cost accrued: weekly salary burn × weeks the project has existed
    const weeksTotalInProject = currentWeek - (proj.createdAtWeek || proj.phaseStartedAtWeek);
    const weeklyBurn = window.tycoonEmployees?.weeklyBurn?.() || 0;
    const salaryCost = Math.max(0, weeksTotalInProject * weeklyBurn * (teamIds.length / Math.max(1, (S.employees?.length || 0) + 1)));
    const mktCost = proj.marketingSpend || 0;

    // Deadline info (contracts only)
    let deadlineBlock = null;
    if (proj.isContract && proj.deadline) {
      const weeksLeft = proj.deadline - currentWeek;
      const late = weeksLeft < 0;
      deadlineBlock = h('div', { className: 't-proj-deadline' + (late ? ' late' : (weeksLeft < 4 ? ' tight' : '')) },
        '⏱ Deadline in ' + (late ? 'PASSED by ' + Math.abs(weeksLeft) : weeksLeft) + ' week' + (Math.abs(weeksLeft) === 1 ? '' : 's'));
    }

    const ov = h('div', { className: 't-modal-ov', id: '_t_active_proj_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '620px' } },
        // Header
        h('h2', { style: { margin: '0 0 4px' } },
          (typeDef?.icon || '') + ' ' + proj.name),
        h('div', { style: { color: '#8b949e', fontSize: '0.78rem', marginBottom: '14px' } },
          (typeDef?.label || proj.type) + ' · ' + (scopeDef?.label || proj.scope) + ' scope' +
          (platDef ? ' · ' + platDef.icon + ' ' + platDef.name : '') +
          (proj.isContract ? ' · contract for ' + (proj.clientName || 'client') : ' · own IP')),

        // Phase + progress
        h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' } },
            h('div', { style: { color:'#f0883e', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', fontSize:'.78rem' } },
              proj.phase),
            h('div', { style: { color:'#8b949e', fontSize:'.72rem' } },
              'Week ' + Math.floor(weeksIntoPhase) + ' / ' + weeksOfPhase + ' · ETA ~' + Math.ceil(weeksRemainingTotal) + ' week' + (Math.ceil(weeksRemainingTotal) === 1 ? '' : 's') + ' to ship')
          ),
          h('div', { className: 't-progbar' },
            h('div', { className: 't-progbar-fill', 'data-active-proj-detail': proj.id, style: { width: phasePct.toFixed(2) + '%' } })
          ),
          deadlineBlock
        ),

        // Quality — show raw / target / normalized per axis. The bar fills
        // based on the NORMALIZED score (0-100, what the critic sees at
        // ship time), while the label shows raw progress toward the axis
        // cap. Normalized uses the sqrt curve from computeCriticScore so
        // the number here matches what ships.
        (() => {
          const targets = window.tycoonProjects?.qualityTargets?.(proj) || null;
          if (!targets) return null;
          const rankLabel = r => r === 0 ? 'primary' : r === 1 ? 'secondary' : 'tertiary';
          const row = (axis) => {
            const t = targets[axis];
            const color = AXIS_COLOR[axis] || '#8b949e';
            const pct = Math.min(100, Math.max(0, t.normalized));
            const isPrimary = t.rank === 0;
            return h('div', { style: { marginBottom: '6px' } },
              h('div', { style: { display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginBottom:'3px' } },
                h('span', { style: { color, fontWeight: 700 } },
                  (AXIS_ICON[axis] || '') + ' ' + axis.toUpperCase() +
                  ' \u00b7 ' + rankLabel(t.rank) +
                  ' \u00b7 ' + Math.round(t.weight * 100) + '%'),
                h('span', { style: { color: '#c9d1d9', fontVariantNumeric: 'tabular-nums' } },
                  Math.round(t.raw) + ' / ' + t.cap + ' raw \u00b7 ' +
                  Math.round(t.normalized) + '/100 score')
              ),
              h('div', { style: { height: '8px', background: '#0d1117', border: '1px solid #21262d', borderRadius: '3px', overflow: 'hidden' } },
                h('div', { style: { width: pct + '%', height: '100%', background: color, opacity: isPrimary ? 1 : 0.55 } })
              )
            );
          };
          return h('div', { style: { marginBottom: '14px' } },
            h('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' } },
              h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700 } }, 'Quality'),
              h('div', { style: { color:'#8b949e', fontSize:'.68rem' } },
                'score = sqrt(raw/cap) \u00d7 100')
            ),
            row('design'),
            row('tech'),
            row('polish'),
            // Bugs + team speed — show concrete impact, not just the raw numbers.
            // Bugs subtract from critic score 1:1 (capped at −30) plus 0.4 per
            // bug from user score. Speed compresses phase duration by 4% per
            // point above the 5-baseline (clamped ±30%).
            (() => {
              const bugs = Math.round(proj.bugs || 0);
              const bugCritic = Math.min(30, bugs);
              const bugUser = +(bugs * 0.4).toFixed(1);
              const bugColor = bugs > 50 ? '#f85149' : bugs > 20 ? '#f0883e' : bugs > 0 ? '#c9d1d9' : '#8b949e';
              const avg = window.tycoonProjects?.avgTeamSpeed?.(proj) || 0;
              const speedMulRaw = 1 - (avg - 5) * 0.04;
              const speedMul = Math.max(0.7, Math.min(1.3, speedMulRaw));
              const speedPct = Math.round((1 - speedMul) * 100);  // positive = faster, negative = slower
              const speedLabel = speedPct === 0 ? 'baseline pace'
                : speedPct > 0 ? ('phases ' + speedPct + '% faster')
                : ('phases ' + Math.abs(speedPct) + '% slower');
              const speedColor = speedPct > 0 ? '#7ee787' : speedPct < 0 ? '#f0883e' : '#8b949e';
              return h('div', { style: { display:'flex', flexDirection:'column', gap:'6px', marginTop:'8px' } },
                h('div', {
                  className: 't-qstat',
                  style: { color: bugColor },
                  title: 'Critic score: −1 per bug (capped at −30). User score: additional −0.4 per bug. Polish phase removes bugs.'
                },
                  '🐞 BUGS ', h('span', { className: 'v' }, String(bugs)),
                  h('span', { style: { color:'#8b949e', fontWeight:400, marginLeft:'6px' } },
                    bugs === 0 ? '→ no impact yet' :
                    '→ −' + bugCritic + ' critic, −' + bugUser + ' user score')
                ),
                h('div', {
                  className: 't-qstat',
                  style: { color: speedColor },
                  title: 'Average team Speed (locked at phase start). Each point above 5 trims 4% off phase duration (clamped ±30%). Only affects timing, not quality.'
                },
                  '⚡ SPEED ', h('span', { className: 'v' }, avg.toFixed(1)),
                  h('span', { style: { color:'#8b949e', fontWeight:400, marginLeft:'6px' } },
                    '→ ' + speedLabel)
                )
              );
            })()
          );
        })(),

        // Team
        teamRows.length > 0 && h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700, marginBottom:'4px' } }, 'Team (' + teamRows.length + ')'),
          h('div', { className: 't-team-list' }, ...teamRows)
        ),

        // Features
        featureRows.length > 0 && h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700, marginBottom:'4px' } }, 'Features'),
          h('div', { className: 't-feat-list' }, ...featureRows)
        ),

        // Decisions made
        decisionRows.length > 0 && h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700, marginBottom:'4px' } }, 'Decisions'),
          h('div', { className: 't-decision-list' }, ...decisionRows)
        ),

        // Cost
        h('div', { style: { marginBottom: '14px' } },
          h('div', { style: { color:'#c9d1d9', fontSize:'.78rem', fontWeight:700, marginBottom:'4px' } }, 'Cost to date'),
          h('div', { style: { color:'#8b949e', fontSize:'.78rem' } },
            'Team salaries: ~' + fmtMoney(salaryCost) + (mktCost ? ' · Marketing locked: ' + fmtMoney(mktCost) : ''))
        ),

        h('div', { className: 't-modal-actions', style: { justifyContent: 'center' } },
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_active_proj_modal')?.remove();
          } }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
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
  // Pause is handled centrally by the MutationObserver on document.body —
  // adding any .t-modal-ov auto-pauses; removing it auto-unpauses. Nesting
  // across overlapping modals (e.g. an MC decision firing mid-hiring) works
  // because the observer counts all .t-modal-ov elements.
  function openHiringModal() {
    // Tear down any existing modal — the rerender path replaces the DOM
    // node rather than going through closeHiringModal.
    const existing = document.getElementById('_t_hiring_modal');
    if (existing) existing.remove();
    // Mark the market as viewed so the "NEW" badge on the Hiring button clears
    window.tycoonHiring?.markMarketViewed?.();
    refreshTopBar();
    refreshMain();  // re-render the Studio panel's Hiring button to drop the NEW badge
    const ov = h('div', { className: 't-modal-ov', id: '_t_hiring_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '760px' } },
        h('h2', null, '💼 Talent Market'),
        renderOutsideOffersBlock(),   // urgent — shown first
        renderRecruiterBlock(),
        renderRequisitionsBlock(),
        renderMarketBody(),
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: closeHiringModal }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
  }

  // Recruiter hire/fire block at the top of the Talent Market modal.
  function renderRecruiterBlock() {
    const H = window.tycoonHiring;
    if (!H) return null;
    const current = H.currentRecruiter();
    const tiers = H.RECRUITER_TIERS || [];
    const currentTier = current.tier;
    const nextDef = tiers.find(t => t.tier === currentTier + 1);

    const bg = currentTier > 0 ? 'rgba(126,231,135,0.06)' : 'rgba(88,166,255,0.06)';
    const border = currentTier > 0 ? '#2ea043' : '#58a6ff';

    const header = h('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'baseline' } },
      h('div', { style: { color: currentTier > 0 ? '#7ee787' : '#79c0ff', fontWeight: 700, fontSize: '0.88rem' } },
        currentTier > 0 ? (current.icon + ' ' + current.name + ' on staff') : '👥 No recruiter on staff'),
      currentTier > 0 ? h('div', { style: { color:'#c9d1d9', fontSize: '0.72rem' } },
        '$' + (current.annualSalary/1000).toFixed(0) + 'K/yr · 1 candidate / ' + current.intervalWeeks + ' week' + (current.intervalWeeks === 1 ? '' : 's')) : null
    );
    const desc = h('div', { style: { color:'#8b949e', fontSize:'0.72rem', marginTop:'2px' } }, current.desc);

    const actions = [];
    if (nextDef) {
      const canAfford = (S.cash || 0) > nextDef.annualSalary / 12;  // ~1 month runway sanity check
      actions.push(h('button', {
        className: 't-btn',
        disabled: canAfford ? null : true,
        title: canAfford ? ('Start paying $' + (nextDef.annualSalary/1000).toFixed(0) + 'K/yr for a ' + nextDef.name) : 'Need at least a month of runway',
        onclick: () => {
          const r = H.hireRecruiter(nextDef.tier);
          if (r.ok) {
            pushToast(nextDef.icon + ' ' + nextDef.name + ' hired — candidate flow is now 1 / ' + nextDef.intervalWeeks + ' week' + (nextDef.intervalWeeks === 1 ? '' : 's'));
            rerenderHiringModal();
            refreshTopBar();
            refreshMain();
          } else {
            pushToast(r.error);
          }
        }
      }, 'Hire ' + nextDef.name + ' — $' + (nextDef.annualSalary/1000).toFixed(0) + 'K/yr'));
    }
    if (currentTier > 0) {
      actions.push(h('button', {
        className: 't-btn secondary',
        onclick: () => {
          if (!confirm('Dismiss the recruiter? Candidate flow drops back to 1 per 2 weeks.')) return;
          H.hireRecruiter(0);
          pushToast('Recruiter dismissed');
          rerenderHiringModal();
          refreshTopBar();
          refreshMain();
        }
      }, 'Dismiss'));
    }

    return h('div', {
      style: { background: bg, border: '1px solid ' + border, borderRadius: '6px', padding: '10px 12px', marginBottom: '12px' }
    },
      header, desc,
      actions.length ? h('div', { style: { display:'flex', gap:'8px', marginTop:'8px' } }, ...actions) : null
    );
  }

  // Outside offers block — shows pending rival poach attempts on YOUR
  // employees. Rendered regardless of recruiter tier since the threat can
  // appear at any time (it's triggered by morale, not recruiter upgrade).
  function renderOutsideOffersBlock() {
    const offers = S.hiring?.outsideOffers || [];
    if (offers.length === 0) return null;
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const H = window.tycoonHiring;

    // Split the offers into three categories so the header reflects what the
    // player is actually looking at:
    //   rival poaches (critical)
    //   promotion requests from XP-earned staff (important)
    //   raise requests from Negotiator-trait staff (less urgent)
    const rivalOffers = offers.filter(o => !o.isInternalRaise && !o.isPromotionRequest);
    const promoOffers = offers.filter(o => o.isPromotionRequest);
    const raiseOffers = offers.filter(o => o.isInternalRaise);
    const blocks = [];

    const renderOffer = (o, kind) => {
      // kind = 'rival' | 'raise' | 'promo'
      const weeksLeft = Math.max(0, o.expiresAtWeek - currentWeek);
      let sourceLine;
      if (kind === 'promo') {
        sourceLine = h('div', { style: { color:'#c9d1d9', fontSize:'0.78rem', marginBottom:'8px' } },
          '\u2B06\uFE0F Wants to be promoted \u2014 ',
          h('span', { style:{color:'#79c0ff', fontWeight:700} }, o.employeeTierName + ' \u2192 ' + o.newTierName),
          ' \u00a0(\u00a0',
          h('span', { style:{color:'#79c0ff', fontWeight:700} }, '$' + (o.newSalary/1000).toFixed(0) + 'K'),
          ' vs current ',
          h('span', { style:{color:'#8b949e'} }, '$' + (o.currentSalary/1000).toFixed(0) + 'K'),
          ', +' + Math.round((o.newSalary/o.currentSalary - 1) * 100) + '%)');
      } else if (kind === 'raise') {
        sourceLine = h('div', { style: { color:'#c9d1d9', fontSize:'0.78rem', marginBottom:'8px' } },
          '\uD83D\uDCB0 ' + (o.employeeName) + ' wants \u00a0',
          h('span', { style:{color:'#ffd33d', fontWeight:700} }, '$' + (o.newSalary/1000).toFixed(0) + 'K'),
          ' \u2014 you\u2019re paying \u00a0',
          h('span', { style:{color:'#8b949e'} }, '$' + (o.currentSalary/1000).toFixed(0) + 'K'),
          ' (+' + Math.round((o.newSalary/o.currentSalary - 1) * 100) + '%)');
      } else {
        sourceLine = h('div', { style: { color:'#c9d1d9', fontSize:'0.78rem', marginBottom:'8px' } },
          (o.rivalIcon || '') + ' ' + o.rivalName + ' is offering \u00a0',
          h('span', { style:{color:'#ff7b72', fontWeight:700} }, '$' + (o.newSalary/1000).toFixed(0) + 'K'),
          ' \u2014 you\u2019re paying \u00a0',
          h('span', { style:{color:'#8b949e'} }, '$' + (o.currentSalary/1000).toFixed(0) + 'K'),
          ' (+' + Math.round((o.newSalary/o.currentSalary - 1) * 100) + '%)');
      }
      const matchLabel =
        kind === 'promo' ? 'Promote $' + (o.newSalary/1000).toFixed(0) + 'K' :
        kind === 'raise' ? 'Approve $' + (o.newSalary/1000).toFixed(0) + 'K' :
                           'Match $' + (o.newSalary/1000).toFixed(0) + 'K';
      const exceedLabel =
        kind === 'promo' ? 'Over-promote $' + Math.round(o.newSalary*1.2/1000) + 'K' :
                           'Exceed $' + Math.round(o.newSalary*1.2/1000) + 'K';
      const declineLabel = kind === 'rival' ? 'Let go' : 'Deny';
      return h('div', {
        style: { padding:'10px', background:'#0d1117', border:'1px solid #30363d', borderRadius:'4px', marginBottom:'6px' }
      },
        h('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'4px' } },
          h('div', { style: { color:'#f0f6fc', fontWeight:700, fontSize:'0.85rem' } },
            o.employeeName + ' \u2014 ' + o.employeeTierName + ' \u00b7 ' + o.employeeSpecialty),
          h('div', { style: { color:'#8b949e', fontSize:'0.7rem' } },
            weeksLeft + ' week' + (weeksLeft === 1 ? '' : 's') + ' to decide')),
        sourceLine,
        h('div', { style: { display:'flex', gap:'6px' } },
          h('button', {
            className: 't-btn',
            style: { padding:'4px 10px', fontSize:'0.72rem' },
            title: kind === 'promo' ? 'Tier up, pay the new salary, morale restored to 70.'
                 : kind === 'raise' ? 'Approve the raise. Morale restored to 70.'
                 : 'Pay the rival\'s salary. Employee stays, morale restored to 70.',
            onclick: () => {
              const r = H.matchOutsideOffer(o.id);
              if (!r.ok) { pushToast(r.error); return; }
              pushToast(kind === 'promo'
                ? o.employeeName + ' promoted to ' + o.newTierName
                : o.employeeName + (kind === 'raise' ? '\u2019s raise approved at $' : ' stays — matched at $') + (o.newSalary/1000).toFixed(0) + 'K');
              rerenderHiringModal();
              refreshTopBar();
              refreshMain();
            }
          }, matchLabel),
          h('button', {
            className: 't-btn',
            style: { padding:'4px 10px', fontSize:'0.72rem' },
            title: kind === 'promo' ? 'Promote AND pay 20% above the ratio salary. +1 stat.'
                 : kind === 'raise' ? 'Give more than they asked. Morale jumps to 85 + stat bump.'
                 : 'Pay 20% above the rival\'s offer. Morale jumps, +1 random stat.',
            onclick: () => {
              const r = H.exceedOutsideOffer(o.id);
              if (!r.ok) { pushToast(r.error); return; }
              pushToast(o.employeeName + ' feels valued — stayed with a stat bump');
              rerenderHiringModal();
              refreshTopBar();
              refreshMain();
            }
          }, exceedLabel),
          h('button', {
            className: 't-btn secondary',
            style: { padding:'4px 10px', fontSize:'0.72rem' },
            title: kind === 'promo' ? 'Deny the promotion. \u221210 morale; they ask again in 12 weeks.'
                 : kind === 'raise' ? 'Deny the raise. Morale drops 10; employee stays.'
                 : 'Let them go. They join the rival.',
            onclick: () => {
              if (kind === 'rival' && !confirm(o.employeeName + ' will leave for ' + o.rivalName + '. Proceed?')) return;
              H.declineOutsideOffer(o.id);
              pushToast(kind === 'promo' ? o.employeeName + '\u2019s promotion denied \u2014 will ask again in 12 weeks'
                       : kind === 'raise' ? o.employeeName + '\u2019s raise denied — morale dropped'
                       : o.employeeName + ' left for ' + o.rivalName);
              rerenderHiringModal();
              refreshTopBar();
              refreshMain();
            }
          }, declineLabel)
        )
      );
    };

    if (rivalOffers.length > 0) {
      blocks.push(h('div', {
        style: { marginBottom:'12px', padding:'10px 12px', background: 'rgba(248,81,73,0.06)', border: '1px solid #f85149', borderRadius: '6px' }
      },
        h('div', { style: { color:'#ff7b72', fontWeight:700, fontSize:'0.88rem', marginBottom:'4px' } },
          '\u26A0 Rival Offers (' + rivalOffers.length + ') \u2014 your people are getting poached'),
        h('div', { style: { color:'#8b949e', fontSize:'0.7rem', marginBottom:'8px' } },
          'Low morale on senior staff leaves them open to outside offers. Match the salary to keep them, exceed to re-engage them, or let them walk.'),
        ...rivalOffers.map(o => renderOffer(o, 'rival'))
      ));
    }
    if (promoOffers.length > 0) {
      blocks.push(h('div', {
        style: { marginBottom:'12px', padding:'10px 12px', background: 'rgba(121,192,255,0.06)', border: '1px solid #79c0ff', borderRadius: '6px' }
      },
        h('div', { style: { color:'#79c0ff', fontWeight:700, fontSize:'0.88rem', marginBottom:'4px' } },
          '\u2B06\uFE0F Promotion Requests (' + promoOffers.length + ') \u2014 earned through experience'),
        h('div', { style: { color:'#8b949e', fontSize:'0.7rem', marginBottom:'8px' } },
          'Tier up an employee (new salary + morale boost + higher stat cap). Over-promote for an extra 20% salary and +1 stat. Deny for \u221210 morale and a 12-week cooldown.'),
        ...promoOffers.map(o => renderOffer(o, 'promo'))
      ));
    }
    if (raiseOffers.length > 0) {
      blocks.push(h('div', {
        style: { marginBottom:'12px', padding:'10px 12px', background: 'rgba(255,211,61,0.06)', border: '1px solid #ffd33d', borderRadius: '6px' }
      },
        h('div', { style: { color:'#ffd33d', fontWeight:700, fontSize:'0.88rem', marginBottom:'4px' } },
          '\uD83D\uDCB0 Raise Requests (' + raiseOffers.length + ') \u2014 your Negotiators are asking'),
        h('div', { style: { color:'#8b949e', fontSize:'0.7rem', marginBottom:'8px' } },
          'Employees with the Negotiator trait periodically ask for raises. Approve to pay the ask, exceed to make them ecstatic, or deny (\u221210 morale, they stay).'),
        ...raiseOffers.map(o => renderOffer(o, 'raise'))
      ));
    }
    return h('div', null, ...blocks);
  }

  // Requisitions block — only rendered when the current recruiter (Head of
  // People or higher) has postRequisitions unlocked.
  function renderRequisitionsBlock() {
    const H = window.tycoonHiring;
    const recruiter = H?.currentRecruiter?.();
    if (!recruiter?.postRequisitions) return null;
    const reqs = S.hiring?.requisitions || [];
    const maxReqs = H.MAX_ACTIVE_REQS || 3;
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;

    // Specialty options from PROJECT_TYPES' axis map — use the employee
    // specialty list directly via a hardcoded set (matches SPECIALTY_AXIS).
    const SPECIALTY_OPTIONS = ['coder','backend','network','cloud','frontend','webdev','gamedev','agent','mobile','devops'];
    const TIERS = window.TYCOON_TIERS || [];

    // Local form state
    const formState = renderRequisitionsBlock._state = renderRequisitionsBlock._state || {
      specialty: 'coder', tier: 1, showForm: false,
    };
    const setState = (k, v) => { formState[k] = v; rerenderHiringModal(); };

    // Post button + inline form
    const canPost = reqs.length < maxReqs;
    const header = h('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' } },
      h('div', { style: { color:'#bc8cff', fontWeight:700, fontSize:'0.82rem' } },
        '📋 Requisitions (' + reqs.length + '/' + maxReqs + ')'),
      canPost
        ? h('button', { className: 't-btn secondary',
            style: { padding:'4px 10px', fontSize:'0.72rem' },
            onclick: () => setState('showForm', !formState.showForm)
          }, formState.showForm ? 'Cancel' : '+ Post Req')
        : h('div', { style: { color:'#8b949e', fontSize:'0.7rem' } }, 'Max reached — close one first')
    );

    let form = null;
    if (formState.showForm && canPost) {
      form = h('div', {
        style: { padding:'10px', background:'rgba(188,140,255,0.05)', border:'1px dashed #bc8cff', borderRadius:'4px', marginBottom:'8px', fontSize:'0.78rem', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px' }
      },
        h('span', { style:{color:'#c9d1d9'} }, 'Source a'),
        h('select', {
          value: formState.tier,
          onchange: (e) => { formState.tier = parseInt(e.target.value, 10); rerenderHiringModal(); },
          style: { padding:'4px 8px', background:'#0d1117', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:'3px' }
        },
          ...TIERS.slice(0, 6).map((t, idx) => h('option', { value: idx, selected: formState.tier === idx ? true : null }, t.name))
        ),
        h('select', {
          value: formState.specialty,
          onchange: (e) => { formState.specialty = e.target.value; rerenderHiringModal(); },
          style: { padding:'4px 8px', background:'#0d1117', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:'3px' }
        },
          ...SPECIALTY_OPTIONS.map(s => h('option', { value: s, selected: formState.specialty === s ? true : null }, s))
        ),
        h('span', { style:{color:'#8b949e'} }, '\u00b7 ' + H.REQ_DEFAULT_DURATION_WEEKS + ' weeks'),
        h('button', { className: 't-btn', style: { padding:'4px 12px', fontSize:'0.75rem' },
          onclick: () => {
            const r = H.postRequisition({ specialty: formState.specialty, tier: formState.tier });
            if (!r.ok) { pushToast(r.error); return; }
            formState.showForm = false;
            pushToast('📋 Requisition posted');
            rerenderHiringModal();
            refreshMain();
          }
        }, 'Post'),
      );
    }

    const reqRows = reqs.length === 0 && !form
      ? h('div', { style: { color:'#8b949e', fontSize:'0.72rem', fontStyle:'italic', padding:'4px 0' } },
          'No active requisitions. Post one to steer ' + (recruiter.candidatesPerTick || 1) + '-per-week sourcing toward a specific role.')
      : reqs.map(r => {
          const tierDef = TIERS[r.tier];
          const weeksLeft = r.expiresAtWeek - currentWeek;
          return h('div', { className: 't-req-row' },
            h('div', null,
              h('div', { className: 'label' },
                '📋 ' + (tierDef?.name || 'Tier ' + r.tier) + ' · ' + r.specialty),
              h('div', { className: 'meta' },
                weeksLeft + ' week' + (weeksLeft === 1 ? '' : 's') + ' left · ' +
                (r.matchedCount || 0) + ' matched so far')
            ),
            h('button', {
              className: 'close-btn',
              onclick: () => { H.closeRequisition(r.id); pushToast('Requisition closed'); rerenderHiringModal(); }
            }, 'Close')
          );
        });

    return h('div', { style: { marginBottom: '12px', padding: '10px 12px', background: 'rgba(188,140,255,0.04)', border: '1px solid #3a2a5c', borderRadius: '6px' } },
      header,
      form,
      ...(Array.isArray(reqRows) ? reqRows : [reqRows])
    );
  }

  function renderMarketBody() {
    const queue = S.hiring?.queue || [];
    const H = window.tycoonHiring;
    const recruiter = H?.currentRecruiter?.() || { filterBySpecialty: false };
    const filter = S.hiring?.specialtyFilter || null;
    const filteredQueue = (filter && recruiter.filterBySpecialty)
      ? queue.filter(c => c.specialty === filter)
      : queue;

    // Specialty filter UI — only rendered when the recruiter unlocks it
    let filterUI = null;
    if (recruiter.filterBySpecialty) {
      const allSpecs = Array.from(new Set(queue.map(c => c.specialty))).sort();
      filterUI = h('div', { style: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', fontSize:'0.78rem', color:'#c9d1d9' } },
        h('span', null, 'Filter by specialty:'),
        h('select', {
          value: filter || '',
          onchange: (e) => {
            S.hiring.specialtyFilter = e.target.value || null;
            if (typeof markDirty === 'function') markDirty();
            rerenderHiringModal();
          },
          style: { padding: '4px 8px', background:'#0d1117', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:'3px' }
        },
          h('option', { value: '', selected: !filter }, 'All specialties'),
          ...allSpecs.map(s => h('option', { value: s, selected: filter === s ? true : null }, s))
        ),
        filter ? h('span', { style:{color:'#8b949e', fontSize:'0.72rem'} },
          '(' + filteredQueue.length + ' of ' + queue.length + ')') : null
      );
    }

    const bodyEmpty = h('div', { className: 't-empty' },
      queue.length === 0
        ? 'Talent Market is empty — a new candidate usually surfaces every ' + (recruiter.intervalWeeks) + ' week' + (recruiter.intervalWeeks === 1 ? '' : 's') + '.'
        : 'No candidates match the current specialty filter.');

    return h('div', null,
      h('div', { style: { color:'#8b949e', fontSize:'0.8rem', marginBottom:'10px' } },
        queue.length + ' candidate' + (queue.length===1?'':'s') +
        ' on the market · Interview $' + H.INTERVIEW_COST +
        ' (reveals stats + hidden trait) · New arrivals every ' + recruiter.intervalWeeks + ' week' + (recruiter.intervalWeeks === 1 ? '' : 's')),
      filterUI,
      filteredQueue.length > 0
        ? h('div', { className: 't-candidate-grid' }, ...filteredQueue.map(renderCandidateCard))
        : bodyEmpty
    );
  }

  function closeHiringModal() {
    const ov = document.getElementById('_t_hiring_modal');
    if (ov) ov.remove();
    refreshTopBar();
  }

  // Re-render candidate cards in place without going through close/open —
  // touching the close path would restore pause mid-interaction, and the
  // subsequent reopen would lose _hiringPrevPaused if the hire drained the
  // queue (empty-queue early-return skips the capture). Keeps pause state
  // exactly as-is across interactions.
  function rerenderHiringModal() {
    const modal = document.getElementById('_t_hiring_modal');
    if (!modal) return;
    const inner = modal.querySelector('.t-modal');
    if (!inner) return;
    // Full re-render — the recruiter block + filter UI + candidate grid all
    // need refreshing after hire/pass/negotiate or recruiter-tier changes.
    // Preserves the outer overlay so the modal observer's pause stays pinned.
    inner.innerHTML = '';
    inner.appendChild(h('h2', null, '💼 Talent Market'));
    const offersBlock = renderOutsideOffersBlock();
    if (offersBlock) inner.appendChild(offersBlock);
    const recBlock = renderRecruiterBlock();
    if (recBlock) inner.appendChild(recBlock);
    const reqBlock = renderRequisitionsBlock();
    if (reqBlock) inner.appendChild(reqBlock);
    inner.appendChild(renderMarketBody());
    inner.appendChild(h('div', { className: 't-modal-actions' },
      h('button', { className: 't-btn', onclick: closeHiringModal }, 'Close')
    ));
  }

  function renderCandidateCard(c) {
    // Highlight candidates by their source — alumnus, poach, requisition, referral.
    // Only one tag applies; priority: alumnus > poach > req > referral.
    const cardClasses = 't-candidate-card'
      + (c.interviewed ? ' interviewed' : '')
      + (c.fromAlumnus ? ' alumnus'
         : c.poachedFromRival ? ' poached'
         : c.reqId ? ' matched-req'
         : c.referralFromId ? ' referred' : '');
    let sourceBadge = null;
    if (c.fromAlumnus) {
      sourceBadge = h('div', { style: { color: '#79c0ff', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '.04em', marginBottom: '4px' } },
        '\uD83C\uDF93 ALUMNUS \u2014 ' + c.fromAlumnus.toUpperCase() + ' (RANK ' + c.alumnusRank + ')');
    } else if (c.poachedFromRival) {
      sourceBadge = h('div', { style: { color: '#ffd33d', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '.04em', marginBottom: '4px' } },
        '\u26A1 POACHED FROM ' + (c.poachedFromIcon || '') + ' ' + c.poachedFromRival.toUpperCase());
    } else if (c.reqId) {
      sourceBadge = h('div', { style: { color: '#bc8cff', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '.04em', marginBottom: '4px' } }, '📋 FROM REQUISITION');
    } else if (c.referralFromName) {
      sourceBadge = h('div', { style: { color: '#7ee787', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '.04em', marginBottom: '4px' } },
        '\uD83E\uDD1D REFERRED BY ' + c.referralFromName.toUpperCase());
    }
    // Expiration indicator — candidates sit on the market for
    // CANDIDATE_LIFETIME_WEEKS (8 by default). Show the remaining window
    // inline with color coding so the player feels the pressure to decide.
    const curWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const weeksLeft = Math.max(0, (c.expiresAtWeek || 0) - curWeek);
    const expColor = weeksLeft <= 1 ? '#f85149'
                    : weeksLeft <= 3 ? '#f0883e'
                    : '#8b949e';
    const expText = weeksLeft <= 0 ? 'expiring now'
                   : weeksLeft === 1 ? 'leaves in 1 week'
                   : 'leaves in ' + weeksLeft + ' weeks';
    const expEl = h('div', {
      style: { color: expColor, fontSize: '0.68rem', fontWeight: 600, marginTop: '2px', letterSpacing: '.02em' },
      title: 'Candidates disappear from the market ' + (c.expiresAtWeek - c.offeredAtWeek) + ' weeks after listing'
    }, '⏳ ' + expText);

    const card = h('div', { className: cardClasses },
      sourceBadge,
      h('div', { className: 'c-top' },
        h('div', null,
          h('div', { className: 'c-name' }, c.name),
          h('div', { className: 'c-tier' }, c.tierName + ' · ' + c.specialty),
          expEl
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
        (() => {
          const newCount = window.tycoonHiring?.newCandidatesSinceView?.() || 0;
          const offerCount = (S.hiring?.outsideOffers || []).length;
          // Pending outside offers are more urgent than new candidates —
          // prioritize them in the label.
          const urgent = offerCount > 0;
          const label = '\uD83D\uDCBC Hiring' +
            (queueSize > 0 ? ' (' + queueSize + ')' : '') +
            (offerCount > 0 ? ' \u2014 \u26A0 ' + offerCount + ' OFFER' + (offerCount === 1 ? '' : 'S') :
             newCount > 0 ? ' \u2014 ' + newCount + ' NEW' : '');
          const title = offerCount > 0
            ? offerCount + ' rival offer' + (offerCount === 1 ? '' : 's') + ' pending on your staff — respond in the Talent Market'
            : (newCount > 0
                ? newCount + ' new candidate' + (newCount === 1 ? '' : 's') + ' on the market since you last looked'
                : (queueSize > 0 ? 'Open the Talent Market to review candidates' : 'Nobody on the market yet — check back in a few weeks'));
          return h('button', {
            className: 't-btn secondary' + (urgent || newCount > 0 ? ' t-teams-idle' : '') + (urgent ? ' t-hiring-urgent' : ''),
            title,
            onclick: () => openHiringModal()
          }, label);
        })(),
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
        (() => {
          const R = window.tycoonResearch;
          const st = R?.state?.();
          const ip = st?.inProgress;
          // "Idle" = nothing being researched AND at least one node is available
          // to start right now. Warns the player that their Tech stat is not
          // converting to RP while no research target is selected.
          let idle = false;
          if (!ip && R?.NODES) {
            for (const n of R.NODES) {
              if (R.isCompleted(n.id)) continue;
              if (R.isAvailable(n.id)?.ok) { idle = true; break; }
            }
          }
          const label = '🔬 Research' + (ip ? ' (active)' : st ? ' (' + st.completedCount + ')' : '') + (idle ? ' ⚠' : '');
          return h('button', {
            className: 't-btn secondary' + (idle ? ' t-teams-idle' : ''),
            title: idle ? 'No research in progress — open the Research menu to pick a node' : null,
            onclick: () => openResearchModal()
          }, label);
        })(),
        h('button', { className: 't-btn secondary', onclick: () => openMarketModal() }, '📊 Market'),
        h('button', { className: 't-btn secondary', onclick: () => openFinanceModal() }, '💰 Finance'),
        h('button', { className: 't-btn secondary', onclick: () => openLegacyScreen(S.calendar?.year || 1980, 'retrospective') }, '📜 Hall of Fame'),
        h('button', { className: 't-btn secondary', onclick: () => openGuideModal() }, '📖 Guide')
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

  // ---------- Guide modal (v11.2) ----------
  // "90s-game-manual"–styled help document. Content is static HTML so the
  // authoring stays in one place rather than hundreds of h() calls. The
  // container is scrollable and uses the standard t-modal pattern so the
  // auto-pause MutationObserver freezes the game while it's open.
  function openGuideModal() {
    document.getElementById('_t_guide_modal')?.remove();

    const body = document.createElement('div');
    body.className = 't-guide-body';
    body.style.cssText = [
      'max-height:70vh',
      'overflow-y:auto',
      'padding:4px 14px 14px',
      'font-size:0.82rem',
      'line-height:1.55',
      'color:#c9d1d9',
      'border:1px solid #30363d',
      'border-radius:6px',
      'background:#0d1117',
    ].join(';');

    // Authored as a long HTML string for readability. All numeric values
    // should match the current game (v11.2 stat scale, TIERS, weekly
    // payroll cadence, etc.) — if a formula changes, update this text too.
    body.innerHTML = `
<style>
  .t-guide-body h1 { color:#f0883e; font-size:1.2rem; margin:18px 0 4px; border-bottom:2px solid #f0883e; padding-bottom:4px; letter-spacing:0.5px; }
  .t-guide-body h2 { color:#79c0ff; font-size:1rem; margin:18px 0 6px; border-bottom:1px dashed #30363d; padding-bottom:3px; }
  .t-guide-body h3 { color:#7ee787; font-size:0.9rem; margin:12px 0 4px; }
  .t-guide-body .t-guide-blurb { color:#8b949e; font-style:italic; margin:4px 0 10px; padding:8px 12px; background:#161b22; border-left:3px solid #f0883e; border-radius:0 4px 4px 0; }
  .t-guide-body .t-guide-tip { color:#f0883e; background:rgba(240,136,62,0.08); border:1px solid rgba(240,136,62,0.4); padding:6px 10px; margin:8px 0; border-radius:4px; font-size:0.78rem; }
  .t-guide-body .t-guide-whisper { color:#c084fc; background:rgba(192,132,252,0.08); border:1px dashed rgba(192,132,252,0.4); padding:6px 10px; margin:8px 0; border-radius:4px; font-size:0.78rem; font-style:italic; }
  .t-guide-body table { width:100%; border-collapse:collapse; margin:8px 0; font-size:0.76rem; }
  .t-guide-body th, .t-guide-body td { padding:4px 8px; border:1px solid #30363d; text-align:left; }
  .t-guide-body th { background:#161b22; color:#f0883e; }
  .t-guide-body code { background:#161b22; color:#7ee787; padding:1px 5px; border-radius:3px; font-size:0.75rem; }
  .t-guide-body ul, .t-guide-body ol { margin:4px 0 10px 24px; padding:0; }
  .t-guide-body li { margin:2px 0; }
  .t-guide-body .t-guide-cover { text-align:center; padding:14px 10px; background:linear-gradient(180deg,#2a1e3a 0%,#0d1117 100%); border:2px solid #f0883e; border-radius:6px; margin-bottom:14px; }
  .t-guide-body .t-guide-cover .t-guide-title-big { color:#f0883e; font-size:1.6rem; font-weight:900; letter-spacing:1.5px; margin-bottom:4px; text-shadow:2px 2px 0 #000; }
  .t-guide-body .t-guide-cover .t-guide-subtitle { color:#c9d1d9; font-size:0.85rem; margin-bottom:8px; }
  .t-guide-body .t-guide-cover .t-guide-version { color:#8b949e; font-size:0.72rem; font-style:italic; }
  .t-guide-body b { color:#f0f6fc; }
  .t-guide-body .t-guide-epilepsy { margin-top:24px; padding:10px; border:1px solid #f85149; color:#ffa198; background:rgba(248,81,73,0.06); border-radius:4px; font-size:0.75rem; }
</style>

<div class="t-guide-cover">
  <div class="t-guide-title-big">🎮 THE SOFTWARE<br>DEVELOPMENT TYCOON</div>
  <div class="t-guide-subtitle">A Brand-New Simulation for the Modern IBM PC</div>
  <div style="color:#79c0ff;font-weight:700;font-size:0.85rem;margin-top:6px;">📖 OFFICIAL PLAYER'S GUIDE</div>
  <div class="t-guide-version">Version 11.2 · Printed in the year of our Lord MCMXCVIII</div>
</div>

<div class="t-guide-blurb">"From garage hacker to corporate titan — the tale of the digital age is now YOURS to write!"</div>

<h1>🌟 WELCOME, FUTURE MOGUL!</h1>
<p>Congratulations on your purchase of <b>THE SOFTWARE DEVELOPMENT TYCOON</b> — the most ambitious simulation to ever grace the personal computer! In this game, YOU will start as a humble classmate at a dusty computer-science school in <b>1980</b> and claw your way to the top of the software industry, shipping games, courting contracts, hiring engineers, battling rivals, and reshaping the digital landscape over <b>four decades</b> of computing history.</p>
<p>Will you become a legendary Pioneer? A scrappy Fast-Follower? Or will your studio collapse into bankruptcy, forcing your next classmate to pick up the torch?</p>
<p><b>Only time — and YOUR decisions — will tell.</b></p>

<h1>🏫 CHAPTER 1: WELCOME TO CAMPUS</h1>
<p>Your adventure begins at <b>The Institute</b> — a computer-science school somewhere in America, the year 1980. Your character is one of <b>50 fresh graduates</b> in a class. Every classmate has:</p>
<ul>
  <li><b>Four stats</b> (10–100 each): Tech, Design, Polish, Speed</li>
  <li><b>Three passions</b> (Burning / Interested / None / Aversion) across three axes</li>
  <li><b>1–4 mechanical traits</b> (Workaholic, Perfectionist, Mentor, Toxic, Negotiator, Lean Operator, and 19 more!)</li>
  <li><b>1–3 narrative traits</b> for flavor</li>
</ul>
<p>The top 5 students are <b>extremes</b> with blazing stats and many traits. The middle 30 are <b>vanilla generalists</b>. The bottom 5 are <b>specialists</b> — one burning passion, two weak axes, and often surprisingly disruptive traits.</p>
<div class="t-guide-tip">💡 <b>MANUAL TIP:</b> Your first playthrough starts you at <b>Rank 50</b> — rock bottom! Don't despair. Every run unlocks <b>endowment</b> that permanently improves the school for every future classmate.</div>

<h1>💼 CHAPTER 2: FOUNDING YOUR STUDIO</h1>
<p>Choose a <b>Scenario</b> to begin:</p>
<table>
  <tr><th>#</th><th>Scenario</th><th>Year</th><th>Cash</th></tr>
  <tr><td>1</td><td>📖 First Studio (Tutorial)</td><td>1980</td><td>$50K</td></tr>
  <tr><td>2</td><td>🏖️ Sandbox 1980</td><td>1980</td><td>$50K</td></tr>
  <tr><td>3</td><td>🕹️ Mid-80s Game Shop</td><td>1985</td><td>$100K</td></tr>
  <tr><td>4</td><td>💥 Dot-Com Bust Survivor</td><td>2001</td><td>$200K</td></tr>
  <tr><td>5</td><td>🤖 AI Revolution</td><td>2022</td><td>$5M</td></tr>
  <tr><td>6</td><td>🎲 Custom Start</td><td>—</td><td>Your call!</td></tr>
</table>
<p>Pick a <b>Specialty</b> (Coder, Frontend, Backend, Game Dev, etc.) and a starter <b>Trait</b>. Your specialty permanently biases your stats: <b>+20 to your primary axis, −10 to the other two quality axes</b>. A Game Dev founder has higher Design; a Coder has higher Tech. This is <b>baked in</b> — no runtime multiplier fudgery. What you see is what you ship.</p>

<h1>📅 CHAPTER 3: THE CALENDAR</h1>
<p>The game runs on a simulated calendar:</p>
<ul>
  <li><b>48 weeks per year</b> (4 weeks per "month")</li>
  <li><b>Game speed:</b> 0× (paused), 1×, 2×, 4×, 8×</li>
  <li>Press <b>SPACE</b> to pause, <b>1–4</b> for speed levels</li>
  <li>Changing speed <b>preserves mid-week progress</b> — no cheating!</li>
  <li>Opening any menu or modal <b>auto-pauses</b> the game</li>
</ul>
<div class="t-guide-tip">🕐 <b>MANUAL TIP:</b> The game autosaves every week. If your dog chews the power cable, you'll lose at most 1 week of progress!</div>

<h1>🛠️ CHAPTER 4: PROJECTS — THE HEART OF THE GAME</h1>
<p>Your studio ships two kinds of software:</p>

<h2>🎮 Own-IP Projects (Your Gamble)</h2>
<p>Design and build your own game, tool, or platform. You pick:</p>
<ul>
  <li><b>Type</b> (Game, Business Tool, Web App, Mobile, SaaS, AI, etc.)</li>
  <li><b>Scope</b> (Small 6mo, Medium 12mo, Large 24mo)</li>
  <li><b>Features</b> (required + optional)</li>
  <li><b>Team</b> (who works on it)</li>
  <li><b>Platform</b> (Apple II, DOS, Win95, Mobile, Cloud…)</li>
  <li><b>Marketing channels</b> (post-ship)</li>
</ul>
<p>Every project has <b>three phases</b>:</p>
<ol>
  <li><b>Design</b> (short) — set the scope, pick features</li>
  <li><b>Development</b> (long) — team grinds away; quality accumulates per week</li>
  <li><b>Polish</b> (short) — reduces bugs, adds final polish</li>
</ol>
<p>Each phase's quality is driven by your team's stats times project-type weights:</p>
<ul>
  <li><b>Games:</b> Design 50%, Tech 30%, Polish 20%</li>
  <li><b>Business Tools:</b> Tech 45%, Design 25%, Polish 30%</li>
  <li><b>SaaS:</b> Tech 40%, Design 25%, Polish 35%</li>
</ul>

<h2>📝 Contracts (The Steady Paycheck)</h2>
<p>Clients offer you fixed-scope work for fixed pay. No launch sales, no critic scores — just <b>deliver on time</b> and collect. Safe, but boring. Balance own-IP risk against contract reliability.</p>

<h1>🎯 CHAPTER 5: QUALITY & CRITIC SCORES</h1>
<p>When you ship an own-IP project, a <b>critic score</b> (1–100) is computed from:</p>
<ul>
  <li>Per-axis quality normalized via square-root curve (prevents runaway scores with big teams)</li>
  <li>Weighted by project-type preferences</li>
  <li><b>Optional features</b> give a tiered bonus (3, 2, 1, 0.5, 0.5…)</li>
  <li><b>Bugs</b> subtract up to 30 points</li>
  <li>±5 random luck</li>
</ul>
<h3>Critic Score Tiers:</h3>
<ul>
  <li><b>50–65</b> — Solo / under-staffed / wrong-type shop</li>
  <li><b>65–80</b> — Solid team, right genre</li>
  <li><b>80–92</b> — Specialist studio, matched type, research, polish</li>
  <li><b>93–98</b> — Elite ship, every lever aligned + lucky roll</li>
  <li><b>95+</b> — <b>10× sales multiplier jackpot!</b> 🎰</li>
  <li><b>98+</b> — <b>25× sales multiplier megajackpot!</b> 💰💰💰</li>
</ul>
<div class="t-guide-tip">🎯 <b>MANUAL TIP:</b> 99–100 is unreachable (bugs always floor the score somewhere). Don't bankrupt yourself chasing the perfect ship!</div>

<h1>👥 CHAPTER 6: HIRING & YOUR TEAM</h1>

<h2>The Talent Market</h2>
<p>Recruiters post candidates to your <b>Talent Market</b>. Each candidate has:</p>
<ul>
  <li><b>Tier</b> (Intern → Junior → Mid → Senior → Staff → Principal → Tech Lead → CTO)</li>
  <li><b>Education</b> (Self-taught, CC, Bachelor's, Master's, PhD — biases hidden stats!)</li>
  <li><b>Specialty</b> (affects stat bias)</li>
  <li><b>Visible trait</b> (pre-interview) + <b>hidden trait</b> (reveal after interview)</li>
  <li><b>Personality</b> (Humble, Fair, Premium, Diva — salary expectation)</li>
</ul>

<h2>The Interview Dance</h2>
<ol>
  <li><b>Interview</b> for a fee → reveals hidden stats, trait, personality</li>
  <li><b>Negotiate</b> (soft −10% or hard −20% salary) → 25–50% chance they walk</li>
  <li><b>Hire</b> them → they join your team</li>
</ol>

<h2>Stat Ranges per Tier</h2>
<table>
  <tr><th>Tier</th><th>Range</th><th>Cap</th><th>Base Salary</th></tr>
  <tr><td>Intern</td><td>10–30</td><td>30</td><td>$25K</td></tr>
  <tr><td>Junior Dev</td><td>20–40</td><td>40</td><td>$45K</td></tr>
  <tr><td>Mid-Level</td><td>30–60</td><td>60</td><td>$70K</td></tr>
  <tr><td>Senior</td><td>50–70</td><td>70</td><td>$120K</td></tr>
  <tr><td>Staff</td><td>60–80</td><td>80</td><td>$200K</td></tr>
  <tr><td>Principal</td><td>70–90</td><td>90</td><td>$350K</td></tr>
  <tr><td>Tech Lead</td><td>80–100</td><td>100</td><td>$500K</td></tr>
  <tr><td>CTO</td><td>90–100</td><td>100</td><td>$800K</td></tr>
</table>
<p>Specialty bias can push the <b>primary axis above the cap by 10</b>.</p>

<h2>Payroll</h2>
<ul>
  <li><b>Biweekly</b> deduction (every 2 weeks)</li>
  <li>Based on sum of all salaries × (2 / 48)</li>
  <li><b>Lean Operator</b> founder trait: −15% payroll</li>
  <li><b>Recruiter</b> adds to payroll (but posts better candidates)</li>
</ul>

<h1>📈 CHAPTER 7: THE PROMOTION SYSTEM</h1>
<p>Employees accrue <b>XP</b> weekly: <b>+2 XP/wk</b> if on a project team, <b>+1 XP/wk</b> on the bench.</p>
<p>When they hit <b>48 × (tier + 1) XP</b>, they open an <b>Outside Offer</b> on the Talent Market. You get three buttons:</p>
<table>
  <tr><th>Button</th><th>Salary</th><th>Morale</th><th>Tier</th><th>Cooldown</th></tr>
  <tr><td><b>Match</b></td><td>Their ask</td><td>+70</td><td>Bumped</td><td>—</td></tr>
  <tr><td><b>⚡ Over-Promote</b></td><td>+20% over their ask</td><td>+85</td><td>Bumped + random +10 stat</td><td>—</td></tr>
  <tr><td><b>Decline</b></td><td>Unchanged</td><td>−10</td><td>Unchanged</td><td><b>12 weeks</b> before re-ask</td></tr>
</table>
<p>Ignoring the offer until it expires = automatic decline with morale penalty.</p>
<div class="t-guide-tip">📈 <b>MANUAL TIP:</b> Tier-3+ employees with morale under 50 are prime targets for <b>rival poaching</b>. Keep morale high!</div>

<h1>😊 CHAPTER 8: MORALE — THE INVISIBLE STAT</h1>
<p>Morale (0–100) quietly shapes output:</p>
<ul>
  <li><b>&lt; 25</b> — Quit risk! Output × 0.5</li>
  <li><b>&lt; 40</b> — Discontent. Output × 0.8</li>
  <li><b>40–84</b> — Normal. Output × 1.0</li>
  <li><b>≥ 85</b> — Flow state! Output × 1.15</li>
</ul>
<p>Morale naturally drifts toward <b>70</b> each week (10% of the gap). Events that move it:</p>
<ul>
  <li><b>Crunching</b> a project: −3/wk per worker</li>
  <li><b>Toxic</b> teammate on team: −0.5/wk per Toxic</li>
  <li><b>Workaholic</b> founder on team: −1/wk per non-founder</li>
  <li><b>Ship a hit</b> (critic ≥ 80): team morale bump</li>
  <li><b>Ship a flop</b> (critic &lt; 40): morale drain</li>
  <li><b>Nihilist</b> founder trait: morale capped at 65 for everyone (!)</li>
</ul>

<h1>🔬 CHAPTER 9: RESEARCH</h1>
<p>Research unlocks <b>era-appropriate technology</b> — from 2D sprites (1980) to LLMs (2022). Each node has:</p>
<ul>
  <li><b>RP cost</b> (30–500 Research Points)</li>
  <li><b>Cash cost</b> (RP × $100)</li>
  <li><b>Era gate</b> (can't research CRDT in 1985)</li>
  <li><b>Category:</b> Tech / Efficiency / Platform / Business</li>
</ul>
<p>Only <b>one engineer at a time</b> can research. RP earned per week = engineer's <b>Tech stat × 0.12</b>. A 60-Tech engineer earns 7.2 RP/wk; a 100-Tech Tech Lead earns 12/wk.</p>
<div class="t-guide-tip">🏆 <b>PIONEER RACE:</b> First studio to complete a research node becomes its <b>Pioneer</b> (+25% sales on relevant projects). Second becomes <b>Fast-Follower</b> (+10%). Miss both windows and you pay a <b>−25% penalty</b>.</div>
<h3>Off-Project Cost</h3>
<p>Your researcher <b>cannot</b> contribute to project development simultaneously. This is the strategic tension: do you dedicate your best engineer to research (future) or shipping (now)?</p>

<h1>⚠️ CHAPTER 10: MULTIPLE CHOICE EVENTS</h1>
<p>Every 3–4 weeks during development, a <b>decision event</b> fires:</p>
<div style="padding:10px 14px;background:#161b22;border-left:3px solid #79c0ff;margin:8px 0;border-radius:0 4px 4px 0;">
  <i>"How should we handle save slots?"</i>
  <ul style="margin-top:6px;">
    <li>Single save file <i>(bland)</i> — +3 polish</li>
    <li>Multiple named slots — +7 polish, +1 design</li>
    <li><b>Sophisticated save slots + metadata</b> — +10 polish, +3 design, +4 tech, +2 bugs <i>(requires Tech ≥ 50)</i></li>
    <li>Cloud sync <i>(requires year ≥ 2008, Tech ≥ 70)</i></li>
  </ul>
</div>
<p>Over <b>111 questions</b> across all project types. Your founder's stats <b>unlock more interesting options</b> — gates are 50, 60, 70, or 80 on the 10–100 scale. Trait-gated options exist too (Pragmatic +25% chance of extra option).</p>
<div class="t-guide-tip">⚠️ <b>MANUAL TIP:</b> Decisions only fire on <b>own-IP projects</b>. Contracts are fixed-scope — no decisions, by design.</div>

<h1>🏢 CHAPTER 11: RIVALS — THE OTHER STUDIOS</h1>
<p>Six AI-controlled rival studios compete for the market — <b>EA</b>, <b>Microsoft</b>, <b>Google</b>, <b>Adobe</b>, <b>Apple</b>, and more (era-appropriate names). Each rival has:</p>
<ul>
  <li><b>Focus</b> (game / business / web / mobile / saas / ai)</li>
  <li><b>Era alignment</b> (some peak in the 90s, others in the 2020s)</li>
  <li><b>Cash, fame, hiring aggression</b></li>
</ul>
<p>Rivals will:</p>
<ul>
  <li><b>Poach your staff</b> (tier-3+ with low morale) — you get a Match/Exceed/Decline modal</li>
  <li><b>Go bankrupt</b> (releases their employees into your talent pool!)</li>
  <li><b>Steal research pioneer slots</b> if you dawdle</li>
  <li><b>Compete for contracts and market heat</b></li>
</ul>

<h1>💰 CHAPTER 12: FINANCE & RUNWAY</h1>
<p>The <b>Finance Panel</b> shows:</p>
<ul>
  <li><b>Current cash</b></li>
  <li><b>Weekly burn</b> (payroll + recruiter + office)</li>
  <li><b>Runway</b> in months — critical!</li>
</ul>
<div class="t-guide-tip">💰 <b>MANUAL TIP:</b> Runway under 3 months = DANGER ZONE. Ship something fast, cut headcount, or raise money!</div>
<h2>Raising Capital</h2>
<p>Three rounds available:</p>
<ul>
  <li><b>Seed</b> ($1.5M for ~15% equity, early-game)</li>
  <li><b>Series A</b> ($15M for ~22% equity, mid-game)</li>
  <li><b>IPO</b> ($152M net for ~20% public float, late-game)</li>
</ul>

<h1>🎓 CHAPTER 13: THE SCHOOL (ROGUELITE META)</h1>
<p>When a run ends (bankruptcy, retirement, megacorp buyout, or win), your <b>classmate's fate</b> is recorded in the Alumni Hall, and you earn <b>Endowment</b> based on achievements. Spend it on four departments:</p>
<h3>📚 Academics</h3>
<ul>
  <li>Foundational Curriculum — pre-unlocks 3 early research nodes</li>
  <li>Visiting Professor (+50 to one axis) × 3</li>
  <li>Faculty Chair — pre-unlocks 3 more nodes</li>
  <li>LLM Research Documentation</li>
</ul>
<h3>🏛️ Facilities</h3>
<p>Server Room, Lab Upgrade, etc.</p>
<h3>🤝 Alumni Network</h3>
<p>Old classmates return as potential hires (+20 stats, +30% salary)</p>
<h3>🏫 School Life</h3>
<p>Client reputation boosts, starting-cash increments, starting-fame boosts</p>
<p>Your next classmate inherits ALL of these. Over many runs, your school evolves from a dusty classroom into a world-class institute!</p>

<h1>🏆 CHAPTER 14: WIN CONDITIONS</h1>
<p>Five paths to victory:</p>
<ol>
  <li><b>$1 Billion cash</b> in the bank</li>
  <li><b>Ship a 98+ critic score</b> project</li>
  <li><b>Acquire 3+ subsidiaries</b></li>
  <li><b>IPO at a $1B+ valuation</b></li>
  <li><b>Become a Megacorp</b> (buyout by a rival at $500M+)</li>
</ol>
<p>Each win unlocks a <b>Famous Alumnus</b> card and permanent school bonuses.</p>

<h1>⌨️ CHAPTER 15: KEYBOARD SHORTCUTS</h1>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td><b>SPACE</b></td><td>Pause / unpause</td></tr>
  <tr><td><b>0</b></td><td>Pause</td></tr>
  <tr><td><b>1 / 2 / 3 / 4</b></td><td>Speed 1× / 2× / 4× / 8×</td></tr>
  <tr><td><b>ESC</b></td><td>Close modal</td></tr>
  <tr><td><b>CTRL+SHIFT+D</b></td><td>🐛 Debug panel (developer mode!)</td></tr>
</table>

<h1>🐛 CHAPTER 16: THE HALL OF SECRETS (DEBUG MODE)</h1>
<p>Press <b>Ctrl+Shift+D</b> to reveal the <b>Debug Panel</b> — or open your browser console and type <code>dbg.help()</code>. Inside you'll find:</p>
<ul>
  <li><code>dbg.maxStats()</code> — Ascend to the pinnacle of developer prowess!</li>
  <li><code>dbg.addCash(1e9)</code> — Summon forth a billion dollars!</li>
  <li><code>dbg.advanceWeeks(48)</code> — Skip an entire year!</li>
  <li><code>dbg.completeAllResearch()</code> — Instantly master every technology!</li>
  <li><code>dbg.hireSquad(5, 3)</code> — Summon five senior engineers!</li>
  <li><b>"Jumpstart"</b> button — $5M + max stats + early research, all at once!</li>
</ul>
<div class="t-guide-whisper">🤫 <b>MANUAL WHISPER:</b> Debug mode disables achievements... or does it? Only the developers know for sure. 😉</div>

<h1>🎭 CHAPTER 17: STRATEGY & TIPS</h1>
<h2>⭐ For Beginners</h2>
<ol>
  <li>Start with <b>Scenario 1</b> (First Studio). Read the intro modal!</li>
  <li>Hire <b>1–2 Juniors</b> before starting your first project.</li>
  <li>Pick a <b>Small</b> scope for your first own-IP. Don't go Large in 1980!</li>
  <li>Take <b>contracts</b> between own-IP projects to smooth cash flow.</li>
  <li>Watch your <b>runway</b> — aim for 6+ months buffer.</li>
</ol>
<h2>🎯 For Intermediate Players</h2>
<ol>
  <li>Match your <b>founder specialty</b> to your project types.</li>
  <li>Recruit at least <b>one Mentor</b> on your team — junior stat growth!</li>
  <li>Research <b>before</b> you need the tech, not after.</li>
  <li>Don't over-hire! Payroll scales fast.</li>
</ol>
<h2>🔥 For Masters</h2>
<ol>
  <li>Stack <b>Team Player</b> traits for team-wide multipliers.</li>
  <li>Time your ship dates to <b>launch windows</b> (avoid holiday collisions).</li>
  <li>Use <b>Negotiator</b> hires to exert leverage on salary negotiations.</li>
  <li>Pioneer the <b>big nodes</b> (TCP/IP, Mobile OS, LLMs) — the +25% compounds.</li>
  <li>Chase <b>Nihilist</b> founder traits in bottom-extreme rank runs for a unique challenge.</li>
</ol>

<h1>🎨 CREDITS</h1>
<p><b>Design &amp; Code:</b> <i>You, the player, and the 38 JavaScript modules of src/js/</i><br>
<b>Playtesting:</b> <i>Thousands of simulated classmates</i><br>
<b>Special Thanks:</b> <i>Coffee ☕, keyboards ⌨️, and the 1980s</i></p>

<div class="t-guide-epilepsy">
  <b>⚠ EPILEPSY WARNING:</b> Extended play sessions may cause symptoms including: loss of sleep, obsessive spreadsheet usage, muttering about "critic scores" during family dinners, and a newfound appreciation for TCP/IP. Consult your physician if these symptoms persist beyond your third IPO.
</div>

<div style="text-align:center; margin:20px 0 8px; color:#f0883e; font-weight:700; font-size:0.95rem;">🎮 NOW CLOSE THIS WINDOW AND BEGIN YOUR EMPIRE! 🎮</div>
<div style="text-align:center; color:#8b949e; font-style:italic; font-size:0.8rem;">"In a world of ones and zeros, only the passionate survive."</div>
`;

    const close = () => document.getElementById('_t_guide_modal')?.remove();
    const ov = h('div', { className: 't-modal-ov', id: '_t_guide_modal',
                          onclick: (e) => { if (e.target === ov) close(); } },
      h('div', { className: 't-modal', style: { maxWidth: '760px' } },
        h('h2', { style: { margin: '0 0 8px', display:'flex', justifyContent:'space-between', alignItems:'center' } },
          h('span', null, '📖 Player\u2019s Guide'),
          h('span', { style: { fontSize: '0.7rem', color: '#8b949e', fontWeight: 400 } },
            'v' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?'))
        ),
        body,
        h('div', { className: 't-modal-actions', style: { justifyContent: 'flex-end', marginTop: '12px' } },
          h('button', { className: 't-btn', onclick: close }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
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
                // Label each type with its primary quality axis so the player
                // can see at a glance which stat matters most.
                const axisLabel = axisPrimaryLabel(t.weights);
                return h('option', { value: key, selected: key === config.type ? true : null },
                  (t.icon || '') + ' ' + t.label + ' \u2014 ' + axisLabel);
              })
            )
          ),
          // Show the full weight breakdown for the currently selected type
          (() => {
            const t = window.PROJECT_TYPES[config.type];
            if (!t?.weights) return null;
            const w = t.weights;
            return h('div', { style: { color: '#8b949e', fontSize: '0.72rem', margin: '-8px 0 8px', fontStyle: 'italic' } },
              'Quality weights: ' +
              axisStr('design', w.design) + ' \u00b7 ' +
              axisStr('tech', w.tech) + ' \u00b7 ' +
              axisStr('polish', w.polish));
          })(),
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
  // Pause handled centrally by the modal observer (see startModalPauseObserver).
  function openMCModal(proj) {
    if (!proj || !proj.pendingDecision) return;
    // Close any existing modal first (idempotent — handles rapid MC transitions)
    closeMCModal();
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
            // Show unlock/lock reasoning for any gated answer — available ones
            // get a green "✨ Unlocked by" line so players see WHY a special
            // option is open to them; locked ones get the orange "🔒 Requires".
            ans.gateReasons?.length ? h('span', {
              className: ans.available ? 'unlock' : 'lock'
            }, (ans.available ? '\u2728 Unlocked by: ' : '\uD83D\uDD12 Requires: ') + ans.gateReasons.join(', ')) : null
          );
        })
      )
    );
    document.body.appendChild(ov);
  }

  function closeMCModal() {
    const ov = document.getElementById('_t_mc_modal');
    if (ov) ov.remove();
    refreshTopBar();
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
      // If the Talent Market is open, re-render so candidate expiration
      // timers tick down visibly and any new arrivals show up inline.
      if (document.getElementById('_t_hiring_modal')) rerenderHiringModal();
      // Weekly autosave — guarantees at most one week of progress lost on
      // a crash / tab close, independent of the 30s wall-clock autosave
      // in the clicker rAF loop (which keeps running at faster tycoon
      // speeds, so 8× = 12.5s per week anyway; at 1× the weekly save is
      // the tighter bound).
      try { if (typeof save === 'function') save(); }
      catch (e) { console.error('[tycoon-ui] weekly autosave failed:', e); }
    });
  }

  // ---------- Week progress bar rAF loop ----------
  // Fills the bar under the week label from 0% → 100% over the duration of
  // one game week at the current speed. Reads the authoritative fraction
  // directly from tycoonTime.weekFraction() so speed changes preserve
  // mid-week progress (tycoonTime reschedules its setTimeout for the
  // remaining fraction × new tickMs; this bar matches that schedule).
  let _weekRafHandle = null;

  function startCalProgressLoop() {
    if (_weekRafHandle != null) return;

    // Cache the week fill — the top bar is rebuilt by refreshTopBar(),
    // which replaces the node, so we re-query only when our cached node
    // gets detached from the DOM. Saves ~60 querySelector calls/second.
    let fill = null;

    const loop = () => {
      const frac = window.tycoonTime?.weekFraction?.() || 0;
      const pct = Math.min(100, frac * 100);
      if (!fill || !fill.isConnected) fill = document.querySelector('.t-cal-progress-fill');
      if (fill) fill.style.width = pct.toFixed(1) + '%';

      // Active project phase-progress bars — interpolate the same way the
      // week bar does. Each .t-proj-card[data-proj-id] carries the project
      // id, so we read fresh elapsed/required values and let weekFraction
      // smooth between week ticks. Also handles the active-project detail
      // modal's progress bar via data-active-proj-detail.
      const active = S.projects?.active;
      if (active && active.length) {
        const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
        const updateFor = (proj, pFill) => {
          const elapsed = (currentWeek - proj.phaseStartedAtWeek) + frac;
          const pPct = Math.min(100, Math.max(0, (elapsed / proj.phaseWeeksRequired) * 100));
          pFill.style.width = pPct.toFixed(2) + '%';
        };
        const cards = document.querySelectorAll('.t-proj-card[data-proj-id]');
        for (const card of cards) {
          const id = card.dataset.projId;
          const proj = active.find(p => p.id === id);
          if (!proj || !proj.phaseWeeksRequired) continue;
          const pFill = card.querySelector('.t-progbar-fill');
          if (pFill) updateFor(proj, pFill);
        }
        // Detail modal's bar (if the modal is open)
        const detailFill = document.querySelector('.t-progbar-fill[data-active-proj-detail]');
        if (detailFill) {
          const proj = active.find(p => p.id === detailFill.dataset.activeProjDetail);
          if (proj && proj.phaseWeeksRequired) updateFor(proj, detailFill);
        }
      }

      _weekRafHandle = requestAnimationFrame(loop);
    };
    _weekRafHandle = requestAnimationFrame(loop);
  }

  function stopCalProgressLoop() {
    if (_weekRafHandle != null) { cancelAnimationFrame(_weekRafHandle); _weekRafHandle = null; }
  }

  // ---------- Modal pause observer ----------
  // Centralized auto-pause for ALL modals: we watch document.body for any
  // .t-modal-ov overlay being added or removed. When the live count goes
  // 0 → 1+, push a modal pause on tycoonTime; when it returns to 0, pop
  // them all back. Individual modals no longer need their own pause
  // plumbing, and any future modal automatically pauses the game by
  // virtue of using the .t-modal-ov class.
  let _modalObserver = null;
  let _modalObserverLastCount = 0;

  function startModalPauseObserver() {
    if (_modalObserver) return;
    _modalObserverLastCount = document.querySelectorAll('.t-modal-ov').length;
    // If modals already exist when we begin observing (shouldn't normally
    // happen — entry clears the DOM — but be defensive), align the counter.
    for (let i = 0; i < _modalObserverLastCount; i++) window.tycoonTime.pushModalPause();

    _modalObserver = new MutationObserver(() => {
      const count = document.querySelectorAll('.t-modal-ov').length;
      if (count > _modalObserverLastCount) {
        for (let i = 0; i < count - _modalObserverLastCount; i++) window.tycoonTime.pushModalPause();
      } else if (count < _modalObserverLastCount) {
        for (let i = 0; i < _modalObserverLastCount - count; i++) window.tycoonTime.popModalPause();
      }
      _modalObserverLastCount = count;
    });
    // All modals in this codebase are appended directly to document.body.
    // Watching only direct children avoids spurious firings from deep
    // DOM updates inside modals.
    _modalObserver.observe(document.body, { childList: true, subtree: false });
  }

  function stopModalPauseObserver() {
    if (_modalObserver) {
      _modalObserver.disconnect();
      _modalObserver = null;
    }
    _modalObserverLastCount = 0;
    // tycoonTime.stop() resets its own counter on exit; we don't need to pop here.
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

  // Refresh the top bar whenever the player changes speed or pause state
  // via keyboard (spacebar / 0-4) — without this, pressing Space to pause
  // leaves the Pause button un-highlighted since the UI doesn't rebuild.
  document.addEventListener('tycoon:speed-changed', () => refreshTopBar());
  document.addEventListener('tycoon:pause-toggled', () => refreshTopBar());

  // New candidate arrived in the rolling market. v11.1 no longer auto-opens
  // the modal — just surfaces a toast + refreshes the Hiring button badge.
  // The player opens the modal from the Studio panel when they want.
  document.addEventListener('tycoon:hiring-fair', (e) => {
    const c = (e.detail?.candidates || [])[0];
    if (c) pushToast('💼 ' + c.name + ' (' + c.tierName + ') is looking for work', 'win');
    refreshMain();
  });

  // Rival made an offer to YOUR employee. More urgent than a new candidate —
  // use a red/warn toast and refresh Studio panel so the pending-offer badge
  // appears on the Hiring button.
  document.addEventListener('tycoon:outside-offer', (e) => {
    const o = e.detail?.offer;
    if (!o) return;
    pushToast('\u26A0 ' + o.rivalName + ' made ' + o.employeeName + ' an offer — 3 weeks to respond');
    refreshMain();
  });
  document.addEventListener('tycoon:employee-departed', () => { refreshMain(); refreshTopBar(); });
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

  // Shared helper — called from the "Continue to Alumni Hall" button on the
  // legacy/victory modals. Dismisses any lingering end-of-run modals, saves,
  // tears down the tycoon overlay, and opens the school screen.
  function transitionToSchoolScreen() {
    if (!window.tycoonSchool?.openSchoolScreen) return;
    document.getElementById('_t_legacy_modal')?.remove();
    document.getElementById('_t_victory_modal')?.remove();
    try { if (typeof save === 'function') save(); } catch (e) {}
    if (window.tycoonUI?.exit) window.tycoonUI.exit({ noReload: true });
    window.tycoonSchool.openSchoolScreen();
  }
  // Expose for the legacy screen button (same file, different scope via IIFE).
  window._tycoonTransitionToSchool = transitionToSchoolScreen;

  // v3 roguelite: run-end surfaces the endowment banked. Prior versions had
  // an automatic 2.5s setTimeout that tore down the legacy/victory modal and
  // opened the school screen whether the player had read it or not. v11.3
  // requires an explicit button press on the legacy screen — see the
  // "Continue to Alumni Hall" button in openLegacyScreen below.
  //
  // Each run-end type has its retrospective modal opened by a different code
  // path — this listener handles the two that DON'T have their own modal
  // opener (voluntary retirement + age retirement), so the player isn't
  // softlocked after a retire confirmation with no way forward.
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
    // Save the run's result so the alumni hall reflects it even if the
    // player later refreshes before pressing the transition button.
    try { if (typeof save === 'function') save(); } catch (e) {}

    // Open the retrospective legacy screen for run-end types that don't
    // already get one from their own event listener:
    //   bankruptcy     → opened by tycoon:bankruptcy listener
    //   megacorp_exit  → opened by tycoon:megacorp-exit listener (1.5s delay)
    //   win_condition  → opened via openVictoryModal → legacy button
    //   retire_*       → no other opener — handle here
    if (type === 'retire_voluntary' || type === 'age_retired') {
      // Small delay so the toast can register before the modal steals focus.
      setTimeout(() => {
        if (!document.getElementById('_t_legacy_modal')) {
          openLegacyScreen(S.calendar?.year || 1980, 'victory');
        }
      }, 400);
    }
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

  // ---------- First-run intro: projects vs contracts ----------
  function openIntroModal() {
    // Already open? don't double-mount
    if (document.getElementById('_t_intro_modal')) return;
    const dismiss = () => {
      document.getElementById('_t_intro_modal')?.remove();
      if (S.school) {
        S.school.introShown = true;
        if (typeof markDirty === 'function') markDirty();
      }
    };
    const ov = h('div', { className: 't-modal-ov', id: '_t_intro_modal' },
      h('div', { className: 't-modal', style: { maxWidth: '620px' } },
        h('h2', { style: { margin: '0 0 6px', fontSize: '1.2rem' } },
          '\uD83D\uDCBC Welcome, ' + (S.founder?.name || 'Founder') + ' \u2014 Two Paths Forward'),
        h('div', { style: { color: '#8b949e', fontSize: '0.78rem', marginBottom: '16px' } },
          'The studio opens on ' + window.tycoonTime.formatCalendar(S.calendar) + '. Your revenue comes from two very different kinds of work \u2014 most careers mix them.'),

        // Projects (Own IP)
        h('div', { style: { padding: '12px 14px', background: 'rgba(46,160,67,0.08)', border: '1px solid #2ea043', borderRadius: '6px', marginBottom: '12px' } },
          h('div', { style: { color: '#7ee787', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' } },
            '\uD83D\uDEE0 Projects \u2014 Your own IP'),
          h('div', { style: { color: '#c9d1d9', fontSize: '0.82rem', lineHeight: '1.5' } },
            'Click ', h('b', null, '+ New Project'), ' to ship your own game, app, or product. You pick the type, scope, and features, then steer design through multiple-choice decisions during development. ',
            h('br', null),
            h('span', { style: { color: '#8b949e' } },
              'Reward: sales scale with review score \u2014 a hit bankrolls years of runway. ',
              'Risk: no guaranteed payout, and salaries burn the whole time.'))
        ),

        // Contracts
        h('div', { style: { padding: '12px 14px', background: 'rgba(88,166,255,0.08)', border: '1px solid #58a6ff', borderRadius: '6px', marginBottom: '16px' } },
          h('div', { style: { color: '#79c0ff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' } },
            '\uD83D\uDCDD Contracts \u2014 Client work'),
          h('div', { style: { color: '#c9d1d9', fontSize: '0.82rem', lineHeight: '1.5' } },
            'Clients post contracts in the ', h('b', null, 'Contract Offers'), ' panel on the right. The scope, pay, and deadline are fixed \u2014 deliver on time and you get paid, miss the deadline and your reputation drops. ',
            h('br', null),
            h('span', { style: { color: '#8b949e' } },
              'Reward: guaranteed cash flow \u2014 ideal for early runway. ',
              'Trade-off: no ongoing sales or creative decisions, and your studio doesn\u2019t own the work.'))
        ),

        h('div', { style: { color: '#8b949e', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '12px' } },
          'Tip: accept one small contract in week 1 for survival cash, then plan your first own-IP project when you have runway. Check ', h('b', null, '\uD83D\uDCB0 Finance'), ' to see how many months you can last on current burn.'),

        h('div', { className: 't-modal-actions', style: { justifyContent: 'center' } },
          h('button', { className: 't-btn', onclick: dismiss }, 'Got it \u2014 let\u2019s go')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function openVictoryModal(path) {
    // Pause handled by modal observer
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
      startModalPauseObserver();  // any open .t-modal-ov auto-pauses the game
      console.info('[tycoon-ui] entered tycoon mode as ' + S.founder.name);
      // First-time intro explaining projects vs contracts. Fires once per
      // save (persists via S.school.introShown). Short delay so the UI
      // finishes rendering before the modal steals focus.
      if (S.school && !S.school.introShown) {
        setTimeout(() => { if (!S.school.introShown) openIntroModal(); }, 400);
      }
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
      stopModalPauseObserver();
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

      // v3 roguelite routing:
      //  - Active run (careerStarted, founder set, no run-end pending) → resume in tycoon
      //  - Fresh save / between runs (run-end fired, or never started) → school screen
      //  - Very old saves with no school container → ensureRoster seeds it
      if (window.tycoonTraits?.ensureRoster) window.tycoonTraits.ensureRoster();
      const activeRun = S.careerStarted && S.founder && !S._runEndFired;
      if (activeRun) {
        tycoonUI.enter({ skipCreator: true });
      } else if (window.tycoonSchool?.openSchoolScreen) {
        // Between-runs or fresh save — school screen is the roguelite home base.
        window.tycoonSchool.openSchoolScreen();
      } else {
        // Fallback: classic creator if school module missing.
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

  // If user exits tycoon, reload the page (cleanest — avoids clicker-state bleed).
  // Pass { noReload: true } to exit in-place (used by the school-screen
  // transition so we can replace the tycoon overlay with the school UI
  // without losing the browser tab state).
  const origExit = tycoonUI.exit;
  tycoonUI.exit = function(opts) {
    origExit();
    if (!opts?.noReload) location.reload();
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
          'Your studio is now marked DEFUNCT. ' + founderName + '\u2019s story joins the Alumni Hall, and the next classmate takes over with a small inheritance bonus.'),

        // v11.3: bankruptcy / victory MUST require an explicit button press
        // to advance. Previously a 2.5s setTimeout in the run-end listener
        // auto-dismissed this modal; now the player reads at their own pace
        // and presses "Continue to Alumni Hall" when ready. The roguelite
        // layer then opens the school screen where their classmate's fate
        // is recorded and the next run begins.
        //   - bankruptcy → school screen (not save-wipe — the alumni hall
        //     persists across runs now; Phase 5+ behavior)
        //   - victory     → school screen (megacorp exit / win-condition end)
        //   - retrospective → resume the in-progress career
        (() => {
          const isRunEnd = bankrupt || kind === 'victory';
          const btnLabel = isRunEnd ? '🎓 Continue to Alumni Hall →' : 'Continue';
          const btnKind = isRunEnd ? '' : ''; // primary in both cases
          return h('div', { className: 't-modal-actions', style:{justifyContent:'center', flexWrap:'wrap'} },
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
              if (isRunEnd) {
                // Transition to the school screen when the player is ready.
                if (typeof window._tycoonTransitionToSchool === 'function') {
                  window._tycoonTransitionToSchool();
                } else {
                  // Fallback: if the school layer isn't loaded for some reason,
                  // wipe save + reload so the player isn't softlocked.
                  document.getElementById('_t_legacy_modal')?.remove();
                  try { localStorage.removeItem(KEY); } catch (e) {}
                  location.reload();
                }
              } else {
                // Retrospective path — resume play.
                document.getElementById('_t_legacy_modal')?.remove();
                window.tycoonTime?.start();
              }
            }}, btnLabel)
          );
        })()
      )
    );
    document.body.appendChild(ov);
  }

  // ---------- Awards ceremony modal (Phase 4G) ----------
  function openAwardsCeremony(year, winners, effects) {
    // Pause handled by modal observer
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
            refreshTopBar();
            refreshMain();
          }}, 'Continue')
        )
      )
    );
    document.body.appendChild(ov);
  }

  function openLaunchCelebration(proj) {
    // Pause handled by modal observer
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
