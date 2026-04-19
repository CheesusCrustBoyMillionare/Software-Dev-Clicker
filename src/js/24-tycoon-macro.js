// ========== TYCOON MACRO EVENTS (v2) ==========
// Phase 3G: 5 scripted macro events tied to real computing history.
// Each event applies time-limited modifiers to revenue / market.
// Full catalog (15 events) is in DESIGN_V2.md; this is a Phase 3 subset.
(function(){
  'use strict';

  // ---------- Event catalog (5 scripted events) ----------
  const MACRO_EVENTS = [
    {
      id: 'ev_video_game_crash',
      year: 1983,
      month: 3,
      title: '📉 Video Game Crash',
      blurb: 'Atari and over-saturation wreck the gaming market. Game revenue cratering for 2 years.',
      durationMonths: 24,
      effects: { revenueMultByType: { game: 0.70 } }
    },
    {
      id: 'ev_black_monday',
      year: 1987,
      month: 10,
      title: '💸 Black Monday',
      blurb: 'Global stock crash. All tech spending down 15% for a year.',
      durationMonths: 12,
      effects: { revenueMultAll: 0.85 }
    },
    {
      id: 'ev_internet_boom',
      year: 1995,
      month: 8,
      title: '🌐 Internet Boom',
      blurb: 'Netscape IPO kicks off the web gold rush. Web revenue surging +40%!',
      durationMonths: 60,
      effects: { revenueMultByType: { web: 1.40 } }
    },
    {
      id: 'ev_dotcom_burst',
      year: 2001,
      month: 3,
      title: '💥 Dot-com Burst',
      blurb: 'The web bubble pops. Web revenue -40% for 3 years.',
      durationMonths: 36,
      effects: { revenueMultByType: { web: 0.60 } }
    },
    {
      id: 'ev_financial_crisis',
      year: 2008,
      month: 9,
      title: '🏦 Financial Crisis',
      blurb: 'Lehman collapses. Global economy in freefall. All revenue -25% for 2 years.',
      durationMonths: 24,
      effects: { revenueMultAll: 0.75 }
    },
  ];
  window.MACRO_EVENTS = MACRO_EVENTS;

  // ---------- State ----------
  function ensureState() {
    if (!S.macroEvents) S.macroEvents = { fired: [], active: [] };
    if (!Array.isArray(S.macroEvents.fired)) S.macroEvents.fired = [];
    if (!Array.isArray(S.macroEvents.active)) S.macroEvents.active = [];
  }

  // ---------- Fire check ----------
  function checkEventsToFire() {
    ensureState();
    const cal = S.calendar;
    if (!cal) return;
    for (const ev of MACRO_EVENTS) {
      if (S.macroEvents.fired.includes(ev.id)) continue;
      if (cal.year > ev.year || (cal.year === ev.year && cal.month >= ev.month)) {
        fireEvent(ev);
      }
    }
  }

  function fireEvent(ev) {
    ensureState();
    S.macroEvents.fired.push(ev.id);
    const startMonth = (S.calendar.year - 1980) * 12 + S.calendar.month;
    const endMonth = startMonth + ev.durationMonths;
    S.macroEvents.active.push({
      id: ev.id,
      startMonth,
      endMonth,
      effects: ev.effects
    });
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log(ev.title + ' — ' + ev.blurb);
    document.dispatchEvent(new CustomEvent('tycoon:macro-event', { detail: { event: ev } }));
  }

  // ---------- Expire active events ----------
  function expireFinished() {
    ensureState();
    if (!S.calendar) return;
    const curMonth = (S.calendar.year - 1980) * 12 + S.calendar.month;
    const before = S.macroEvents.active.length;
    S.macroEvents.active = S.macroEvents.active.filter(a => a.endMonth > curMonth);
    const expired = before - S.macroEvents.active.length;
    if (expired > 0) {
      if (typeof markDirty === 'function') markDirty();
      if (typeof log === 'function') log('📊 ' + expired + ' macro event effect' + (expired > 1 ? 's' : '') + ' ended');
    }
  }

  // ---------- Query: revenue multipliers ----------
  // Called from shipProject when computing launch sales / contract revenue
  function revenueMultiplier(projectType) {
    ensureState();
    let mult = 1;
    for (const active of S.macroEvents.active) {
      const e = active.effects;
      if (e.revenueMultAll) mult *= e.revenueMultAll;
      if (e.revenueMultByType && e.revenueMultByType[projectType]) {
        mult *= e.revenueMultByType[projectType];
      }
    }
    return mult;
  }

  // ---------- Tick: check monthly ----------
  let _weekCounter = 0;
  const WEEKS_PER_MONTH = 4;
  function onWeekTick() {
    _weekCounter += 1;
    if (_weekCounter >= WEEKS_PER_MONTH) {
      _weekCounter = 0;
      checkEventsToFire();
      expireFinished();
    }
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startMacroTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[macro] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopMacroTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonMacro = {
    EVENTS: MACRO_EVENTS,
    revenueMultiplier,
    checkEventsToFire,
    startTick: startMacroTick,
    stopTick: stopMacroTick,
    state() {
      ensureState();
      return {
        fired: S.macroEvents.fired,
        active: S.macroEvents.active.map(a => {
          const ev = MACRO_EVENTS.find(e => e.id === a.id);
          return { title: ev?.title, endMonth: a.endMonth };
        })
      };
    }
  };
  if (window.dbg) window.dbg.macro = window.tycoonMacro;

  console.log('[tycoon-macro] module loaded. ' + MACRO_EVENTS.length + ' events scripted.');
})();
