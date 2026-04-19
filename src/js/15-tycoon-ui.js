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
.tycoon-topbar .t-exit:hover { color: #f85149; border-color: #f85149; }

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
    const cal = h('div', { className: 't-cal' }, window.tycoonTime.formatCalendar(S.calendar));
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

    const speedBtns = h('div', { className: 't-speed' });
    const speeds = [{ s: 0, lbl: 'Pause' }, { s: 1, lbl: '1×' }, { s: 2, lbl: '2×' }, { s: 4, lbl: '4×' }, { s: 8, lbl: '8×' }];
    for (const sp of speeds) {
      const btn = h('button', {
        className: S.speed === sp.s ? 'active' : '',
        onclick: () => { window.tycoonTime.setSpeed(sp.s); refreshTopBar(); }
      }, sp.lbl);
      speedBtns.appendChild(btn);
    }

    const exitBtn = h('button', {
      className: 't-exit',
      onclick: () => { tycoonUI.exit(); }
    }, 'Exit Tycoon');

    topbar.append(cal, cash, revenue, shipped, speedBtns, exitBtn);
    return topbar;
  }

  function refreshTopBar() {
    const root = getRootEl();
    if (!root) return;
    const old = root.querySelector('.t-topbar');
    if (old) { const fresh = renderTopBar(); old.replaceWith(fresh); }
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

    const criticEl = isShipped && proj.criticScore ?
      h('div', { className: 't-proj-critic' }, 'Critic ' + proj.criticScore + '/100' + (proj.launchSales ? ' · ' + fmtMoney(proj.launchSales) : '')) : null;

    return h('div', { className: 't-proj-card ' + (isShipped ? 'shipped' : '') },
      h('div', { className: 't-proj-name' }, proj.name),
      h('div', { className: 't-proj-meta' },
        (window.PROJECT_TYPES[proj.type]?.label || proj.type) + ' · ' +
        (window.PROJECT_SCOPES[proj.scope]?.label || proj.scope) + ' scope' +
        (proj.isContract ? ' · contract' : ' · own IP')),
      h('div', { className: 't-proj-phase ' + proj.phase }, proj.phase),
      progEl,
      qRow,
      criticEl
    );
  }

  // ---------- Contract offer card ----------
  function renderContractCard(contract) {
    const currentWeek = window.tycoonProjects.absoluteWeek();
    const expiresIn = contract.expiresAtWeek - currentWeek;
    const deadlineWeeksFromNow = contract.deadline - currentWeek;
    return h('div', { className: 't-contract-card' },
      h('div', { className: 't-c-hdr' },
        h('div', { className: 't-c-client' }, contract.clientName),
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

    // Left: Founder + controls + Finance button
    const leftPanel = h('div', { className: 'tycoon-panel', style: { maxWidth: '340px' } },
      h('h2', null, 'Studio'),
      renderFounderCard(),
      h('div', { style: { marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' } },
        h('button', { className: 't-btn', onclick: () => openDesignModal() }, '+ New Project'),
        h('button', { className: 't-btn secondary', onclick: () => openFinanceModal() }, '💰 Finance')
      )
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
    const runwayMonths = S.cash > 0 ? '∞' : '0'; // no recurring costs yet in Phase 1

    const row = (lbl, val, kind) => h('div', { className: 't-finance-row' + (kind ? ' ' + kind : '') },
      h('span', { className: 'lbl' }, lbl),
      h('span', { className: 'val' }, val)
    );

    const ov = h('div', { className: 't-modal-ov', id: '_t_finance_modal' },
      h('div', { className: 't-modal' },
        h('h2', null, '💰 Finance'),
        h('div', { style: { marginBottom: '16px' } },
          row('Current Cash', fmtMoney(S.cash), 'positive'),
          row('Runway', runwayMonths + ' months'),
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
        h('div', { className: 't-modal-actions' },
          h('button', { className: 't-btn', onclick: () => document.getElementById('_t_finance_modal')?.remove() }, 'Close')
        )
      )
    );
    document.body.appendChild(ov);
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
    const config = {
      name: 'Untitled',
      type: 'game',
      scope: 'small',
      features: [],
      isContract: false
    };

    function render() {
      const scope = window.PROJECT_SCOPES[config.scope];
      const usedScope = config.features.reduce((s, id) => s + (window.TYCOON_FEATURES_BY_ID[id]?.cost || 0), 0);
      const remaining = scope.scopePoints - usedScope;
      const availableFeatures = window.TYCOON_FEATURES.filter(f => f.types.includes(config.type));

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
              ...Object.keys(window.PROJECT_TYPES).map(key =>
                h('option', { value: key, selected: key === config.type ? true : null },
                  window.PROJECT_TYPES[key].label))
            )
          ),
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
  function pushToast(msg, kind) {
    let stack = document.querySelector('.t-toast-stack');
    if (!stack) {
      stack = h('div', { className: 't-toast-stack' });
      document.body.appendChild(stack);
    }
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

  // ---------- Character creator modal ----------
  function openCharacterCreator(onConfirm) {
    injectStyles();
    const config = {
      studioName: 'Acme Software',
      founderName: 'Alex Chen',
      specialty: 'coder',
      trait: 'Creative',
      difficulty: 'normal'
    };
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
          'Founding March 1980. You\'re solo in a garage. Build something.'),
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
          } }, 'Cancel'),
          h('button', { className: 't-btn', onclick: () => {
            document.getElementById('_t_creator_modal')?.remove();
            onConfirm(config);
          } }, 'Begin — March 1980 →')
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
          // Create the founder
          window.createFounder(config.founderName, config.specialty, config.trait);
          // Set starting cash per difficulty
          const cashByDiff = { easy: 100000, normal: 50000, hard: 25000 };
          S.cash = cashByDiff[config.difficulty] || 50000;
          S.careerStarted = true;
          S.careerStartedAt = (typeof trustedNow === 'function') ? trustedNow() : Date.now();
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
      injectStyles();
      if (getRootEl()) return;
      const root = h('div', { className: 'tycoon-overlay', id: 'tycoon-overlay' });
      root.append(renderTopBar(), renderMainPanels());
      document.body.appendChild(root);
      window.tycoonProjects.startTick();
      if (window.tycoonContracts) window.tycoonContracts.startTick();
      window.tycoonTime.start();
      startUITick();
      console.info('[tycoon-ui] entered tycoon mode as ' + S.founder.name);
    },
    exit() {
      window.tycoonTime.stop();
      window.tycoonProjects.stopTick();
      if (window.tycoonContracts) window.tycoonContracts.stopTick();
      if (_uiTickUnsub) { _uiTickUnsub(); _uiTickUnsub = null; }
      const root = getRootEl();
      if (root) root.remove();
      document.querySelector('.t-toast-stack')?.remove();
      console.info('[tycoon-ui] exited tycoon mode');
    },
    refresh() { refreshTopBar(); refreshMain(); },
    toast: pushToast
  };

  window.tycoonUI = tycoonUI;
  if (window.dbg) window.dbg.ui = tycoonUI;

  // ---------- Slot-screen entry point ----------
  // Injects a "Try Tycoon Alpha" button on the slot screen so players can
  // actually reach the new mode. Removed in Phase 1F when clicker UI is stripped.
  function injectSlotScreenButton() {
    const slotsEl = document.getElementById('slots');
    if (!slotsEl) return;
    if (document.getElementById('_t_tycoon_btn')) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.id = '_t_tycoon_btn';
    btn.style.cssText = 'position:relative;margin:24px auto 0;display:block;padding:14px 28px;background:linear-gradient(135deg,#1f6feb,#8957e5);color:white;border:none;border-radius:8px;font-family:-apple-system,"Segoe UI",sans-serif;font-size:1rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(31,111,235,.35);letter-spacing:.02em;';
    btn.textContent = '🚀 Try Tycoon Mode (Alpha)';
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 6px 18px rgba(31,111,235,.5)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; btn.style.boxShadow = '0 4px 14px rgba(31,111,235,.35)'; });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Need a KEY set so saves work. Use slot 1 by default for tycoon alpha.
      if (typeof KEY === 'string' && !KEY) window.KEY = 'gdc_save_1';
      // Hide the clicker UI's slot screen so tycoon can take over
      slotsEl.style.display = 'none';
      tycoonUI.enter();
    });
    slotsEl.appendChild(btn);
  }

  // Inject now if slot screen already rendered; also after any languageapply
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectSlotScreenButton();
  } else {
    document.addEventListener('DOMContentLoaded', injectSlotScreenButton);
  }
  // Retry once after a small delay in case slotRow renders async
  setTimeout(injectSlotScreenButton, 250);

  // If user exits tycoon, show slots again
  const origExit = tycoonUI.exit;
  tycoonUI.exit = function() {
    origExit();
    const slotsEl = document.getElementById('slots');
    if (slotsEl) slotsEl.style.display = '';
    injectSlotScreenButton();
  };

  // Hook: hijack shipProject to show a toast
  const origShip = window.tycoonProjects?.ship;
  if (origShip) {
    window.tycoonProjects.ship = function(id) {
      const proj = origShip(id);
      if (proj && proj.criticScore !== null) {
        pushToast('🚀 ' + proj.name + ' launched! Critic ' + proj.criticScore + '/100 · ' +
          (proj.isContract ? fmtMoney(proj.payment) + ' paid' : fmtMoney(proj.launchSales) + ' sales'),
          'win');
        refreshMain();
      }
      return proj;
    };
  }

  console.log('[tycoon-ui] module loaded. Call %cdbg.ui.enter()%c or %ctycoonUI.enter()%c to activate.',
    'color:#f0883e;font-weight:bold', 'color:inherit', 'color:#f0883e;font-weight:bold', 'color:inherit');
})();
