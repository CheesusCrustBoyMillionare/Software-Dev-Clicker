// ========== TYCOON ONBOARDING HINTS (v2) ==========
// Phase 6B: Contextual tips that fire once per career to teach systems.
// Each hint has either a weekly `check()` (tick-based) or an `event` listener.
// State: S.hintsShown[] (ids already fired), S.hintsDisabled (player opt-out).
(function(){
  'use strict';

  const HINTS = [
    // ----- Orientation -----
    {
      id: 'welcome', trigger: 'tick', icon: '\u{1F44B}',
      check: () => (S.calendar?.week || 0) >= 1,
      title: 'Welcome to Software Dev Tycoon',
      body: 'Open the Studio panel to start your first project. Time advances in weeks — use the play/pause and speed buttons in the top bar.'
    },

    // ----- Projects -----
    {
      id: 'first_mc', trigger: 'event', event: 'tycoon:mc-pending', icon: '\u{1F3AF}',
      title: 'Milestone Check',
      body: 'Your choices shape the project. There\u2019s no wrong answer \u2014 pick what fits your team and your market.'
    },
    {
      id: 'polish_phase', trigger: 'event', event: 'tycoon:project-polish-started', icon: '\u2728',
      title: 'Polish Phase Started',
      body: 'Polish lifts critic scores but burns weeks of payroll. Ship early to save cash; polish longer for reviews and awards.'
    },
    {
      id: 'first_ship', trigger: 'tick', icon: '\u{1F680}',
      check: () => (S.projects?.shipped || []).length >= 1,
      title: 'First Ship',
      body: 'Revenue arrives over several weeks. Check the Shipped tab to watch your back-catalog keep selling.'
    },

    // ----- Economy -----
    {
      id: 'first_contract_offer', trigger: 'event', event: 'tycoon:contract-offered', icon: '\u{1F4C4}',
      title: 'Contract Offer',
      body: 'Contracts give guaranteed cash but no IP. Accept when cash is tight; skip when own-IP momentum is building.'
    },
    {
      id: 'low_cash', trigger: 'tick', icon: '\u26A0\uFE0F',
      // Threshold is ~1 quarter of average tier-2 salary so the hint lands
      // with real runway headroom rather than 2-3 weeks before bankruptcy.
      check: () => (S.cash || 0) < 25_000 && (S.cash || 0) > 0 && !S.bankruptcy?.triggered,
      title: 'Cash Running Low',
      body: 'Consider accepting a contract or taking a bank loan from the Finance panel before payroll hits.'
    },
    {
      id: 'first_loan', trigger: 'event', event: 'tycoon:loan-taken', icon: '\u{1F3E6}',
      title: 'Loan Taken',
      body: 'Interest compounds weekly. Ship something soon to pay it back before the balance snowballs.'
    },

    // ----- Team -----
    {
      id: 'first_hire', trigger: 'event', event: 'tycoon:employee-hired', icon: '\u{1F477}',
      title: 'First Hire',
      body: 'Interview candidates before hiring to reveal hidden stats. Match specialties to your project types.'
    },
    {
      id: 'first_fair', trigger: 'event', event: 'tycoon:hiring-fair', icon: '\u{1F4BC}',
      title: 'Talent Market',
      body: 'A candidate just listed on the market. New arrivals surface every ~2 weeks; each stays for 6 weeks before leaving. Open \uD83D\uDCBC Hiring from the Studio panel when you\u2019re ready to interview and hire.'
    },

    // ----- Research / Era -----
    {
      id: 'first_research', trigger: 'event', event: 'tycoon:research-completed', icon: '\u{1F52C}',
      title: 'Research Complete',
      body: 'Research raises quality ceilings and unlocks project types. Plan ahead \u2014 some nodes gate era transitions.'
    },
    {
      id: 'first_era_change', trigger: 'event', event: 'tycoon:era-change', icon: '\u{1F310}',
      title: 'New Era',
      body: 'Platforms and features evolve. Old tech depreciates \u2014 don\u2019t let a ship date slip into a new era with stale tech.'
    },
    {
      id: 'first_hardware', trigger: 'event', event: 'tycoon:hardware-purchased', icon: '\u{1F5A5}\uFE0F',
      title: 'Hardware Acquired',
      body: 'Hardware boosts your quality ceiling permanently. Expensive, but the bonus carries across every future project.'
    },

    // ----- Market / Rivals -----
    {
      id: 'first_rival_spawn', trigger: 'event', event: 'tycoon:rival-spawned', icon: '\u{1F3AE}',
      title: 'New Rival Studio',
      body: 'A competitor just entered the market. Open the Market panel to see who they are and what they\u2019re working on.'
    },
    {
      id: 'first_rival_ship', trigger: 'event', event: 'tycoon:rival-shipped', icon: '\u{1F3CE}\uFE0F',
      title: 'Rival Shipped',
      body: 'Rivals compete for attention and fame. Track them in the Market panel \u2014 avoiding their launch window is often worth delaying your own.'
    },
    {
      id: 'first_awards_ceremony', trigger: 'event', event: 'tycoon:awards-ceremony', icon: '\u{1F3C6}',
      title: 'Awards Season',
      body: 'Quality titles win awards, which boost fame and long-tail sales. Ship a strong genre contender to contend next year.'
    },

    // ----- Endgame gates -----
    {
      id: 'vc_available', trigger: 'tick', icon: '\u{1F4B8}',
      check: () => (S.calendar?.year || 1980) >= 1990 && (S.tFame || 0) >= 50 && !(S.vcRounds || []).length && !S.ipo?.completed,
      title: 'VC Funding Available',
      body: 'The Finance panel shows available rounds. Trade equity for cash to scale \u2014 dilution is permanent, so raise only what you need.'
    },
    {
      id: 'legacy_available', trigger: 'tick', icon: '\u{1F4DC}',
      check: () => (S.calendar?.year || 1980) >= 2020 && !(S.legacyDecisions || []).length,
      title: 'Legacy Decisions Unlocked',
      body: 'One-time strategic pivots in the Studio panel. Irreversible \u2014 pick the end of the game you want.'
    },

    // ----- Roguelite layer (v3, Phase 10) -----
    {
      id: 'rl_first_enroll', trigger: 'tick', icon: '\uD83C\uDF93',
      // Fires on week 1 of a freshly-enrolled classmate
      check: () => (S.school?.currentRunNumber || 0) >= 1 && (S.calendar?.week || 0) === 1 && (S.calendar?.month || 0) === 1,
      title: 'Career begins',
      body: 'Your classmate has graduated and founded a studio. Run-end triggers (bankruptcy, megacorp sale, wins, retirement) will bank endowment for the school.'
    },
    {
      id: 'rl_first_run_end', trigger: 'event', event: 'tycoon:run-end', icon: '\uD83C\uDFEB',
      title: 'Run complete',
      body: 'Endowment banked at The Institute. Head to the Departments tab between runs to spend it on permanent upgrades for every future classmate.'
    },
    {
      id: 'rl_first_famous', trigger: 'tick', icon: '\u2B50',
      check: () => (S.school?.famousAlumni || []).length >= 1,
      title: 'Famous Alumnus',
      body: 'Your classmate joined the famous alumni list. Future runs will see their studio as a persistent rival on the market.'
    },
    {
      id: 'rl_era_unlock_ready', trigger: 'tick', icon: '\u23E9',
      // Fires when player has their first win AND enough endowment for 1985 start
      check: () => (S.school?.lifetimeStats?.winConditionRuns || 0) >= 1 && (S.school?.endowment || 0) >= 3000,
      title: 'Advanced Curriculum Unlocked',
      body: 'You can now start the next classmate in 1985. Check the Admissions tab \u2014 Advanced Curriculum row. Gated by endowment + win count.'
    },
    {
      id: 'rl_climbing_class', trigger: 'tick', icon: '\u2B06\uFE0F',
      check: () => (S.school?.currentClassmateRank || 50) <= 37 && (S.school?.currentClassmateRank || 50) > 0,
      title: 'Climbing the class',
      body: 'You\u2019re playing a middle-ranked classmate now. Their stats are better but trait rolls are subtler. Top ranks are in sight \u2014 keep earning endowment.'
    },
  ];

  // ---------- State ----------
  function ensureState() {
    if (!Array.isArray(S.hintsShown)) S.hintsShown = [];
    if (typeof S.hintsDisabled !== 'boolean') S.hintsDisabled = false;
  }
  function wasShown(id) { ensureState(); return S.hintsShown.includes(id); }
  function markShown(id) {
    ensureState();
    if (!S.hintsShown.includes(id)) {
      S.hintsShown.push(id);
      if (typeof markDirty === 'function') markDirty();
    }
  }

  // ---------- Styles ----------
  function injectStyles() {
    if (document.getElementById('_t_hint_styles')) return;
    const s = document.createElement('style');
    s.id = '_t_hint_styles';
    s.textContent = `
.t-hint-stack { position: fixed; bottom: 20px; right: 20px; z-index: 250; display: flex; flex-direction: column-reverse; gap: 8px; max-width: 360px; pointer-events: none; }
.t-hint-card {
  background: linear-gradient(135deg, #1a2f4a, #162638);
  border: 1px solid #3a5a8a; border-left: 4px solid #58a6ff;
  border-radius: 8px; padding: 12px 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.45);
  animation: tHintIn 0.35s ease-out; transition: opacity 0.25s, transform 0.25s;
  pointer-events: auto; font-size: 0.8rem; color: #c9d1d9;
}
.t-hint-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.t-hint-icon { font-size: 1.1rem; flex-shrink: 0; }
.t-hint-title { flex: 1; font-weight: 700; color: #f0f6fc; font-size: 0.9rem; line-height: 1.2; }
.t-hint-close {
  background: transparent; border: none; color: #8b949e; cursor: pointer;
  font-size: 1.25rem; line-height: 1; padding: 0 4px; border-radius: 4px;
}
.t-hint-close:hover { color: #f0f6fc; background: rgba(255,255,255,0.08); }
.t-hint-body { line-height: 1.45; margin-bottom: 8px; color: #c9d1d9; }
.t-hint-foot { display: flex; justify-content: flex-end; }
.t-hint-disable {
  background: transparent; border: 1px solid #484f58; color: #8b949e;
  padding: 3px 10px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;
  font-family: inherit;
}
.t-hint-disable:hover { color: #c9d1d9; border-color: #6e7681; }
@keyframes tHintIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;
    document.head.appendChild(s);
  }

  // ---------- Render ----------
  function showHint(hint) {
    if (!hint) return;
    ensureState();
    // When disabled we simply skip without marking, so re-enabling later
    // still lets future contextual triggers surface as they happen.
    if (S.hintsDisabled) return;
    if (wasShown(hint.id)) return;
    markShown(hint.id);
    injectStyles();

    const card = document.createElement('div');
    card.className = 't-hint-card';

    const head = document.createElement('div');
    head.className = 't-hint-head';
    const icn = document.createElement('span');
    icn.className = 't-hint-icon';
    icn.textContent = hint.icon || '\u{1F4A1}';
    const ttl = document.createElement('span');
    ttl.className = 't-hint-title';
    ttl.textContent = hint.title;
    const close = document.createElement('button');
    close.className = 't-hint-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '\u00D7';
    close.addEventListener('click', () => dismiss(card));
    head.append(icn, ttl, close);

    const body = document.createElement('div');
    body.className = 't-hint-body';
    body.textContent = hint.body;

    const foot = document.createElement('div');
    foot.className = 't-hint-foot';
    const disable = document.createElement('button');
    disable.className = 't-hint-disable';
    disable.textContent = 'Don\u2019t show tips';
    disable.addEventListener('click', () => {
      ensureState();
      S.hintsDisabled = true;
      if (typeof markDirty === 'function') markDirty();
      if (typeof log === 'function') log('\u{1F515} Tips disabled.');
      document.querySelectorAll('.t-hint-card').forEach(c => dismiss(c));
    });
    foot.appendChild(disable);

    card.append(head, body, foot);

    let stack = document.querySelector('.t-hint-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 't-hint-stack';
      document.body.appendChild(stack);
    }
    stack.appendChild(card);

    // Auto-dismiss after 25s if untouched
    setTimeout(() => { if (card.parentElement) dismiss(card); }, 25000);

    if (typeof log === 'function') log('\u{1F4A1} Tip: ' + hint.title);
  }

  function dismiss(card) {
    if (!card || !card.parentElement) return;
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    setTimeout(() => card.remove(), 250);
  }

  // ---------- Tick check (state-based hints) ----------
  function onWeekTick() {
    ensureState();
    if (S.hintsDisabled) return;
    for (const hint of HINTS) {
      if (hint.trigger !== 'tick') continue;
      if (wasShown(hint.id)) continue;
      try { if (hint.check()) showHint(hint); } catch (e) { /* skip */ }
    }
  }

  // ---------- Event bindings ----------
  const _eventHandlers = [];
  function bindEventHints() {
    for (const hint of HINTS) {
      if (hint.trigger !== 'event') continue;
      const h = () => { if (!wasShown(hint.id)) showHint(hint); };
      document.addEventListener(hint.event, h);
      _eventHandlers.push({ event: hint.event, handler: h });
    }
  }
  function unbindEventHints() {
    for (const { event, handler } of _eventHandlers) {
      document.removeEventListener(event, handler);
    }
    _eventHandlers.length = 0;
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[hints] tycoonTime not available'); return; }
    ensureState();
    injectStyles();
    bindEventHints();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopTick() {
    if (_unsub) { _unsub(); _unsub = null; }
    unbindEventHints();
    document.querySelector('.t-hint-stack')?.remove();
  }

  // ---------- Public API ----------
  window.tycoonHints = {
    HINTS,
    startTick,
    stopTick,
    showHint,                        // manual trigger (debug)
    reset() {                        // clear history (debug)
      ensureState();
      S.hintsShown = [];
      S.hintsDisabled = false;
      if (typeof markDirty === 'function') markDirty();
    },
    enable() {
      ensureState();
      S.hintsDisabled = false;
      if (typeof markDirty === 'function') markDirty();
    },
    disable() {
      ensureState();
      S.hintsDisabled = true;
      if (typeof markDirty === 'function') markDirty();
    },
    state() {
      ensureState();
      return {
        shown: S.hintsShown.slice(),
        disabled: S.hintsDisabled,
        total: HINTS.length,
        remaining: HINTS.length - S.hintsShown.length,
      };
    },
  };
  if (window.dbg) window.dbg.hints = window.tycoonHints;

  console.log('[tycoon-hints] module loaded. ' + HINTS.length + ' hints.');
})();
