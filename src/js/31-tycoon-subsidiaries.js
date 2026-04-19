// ========== TYCOON SUBSIDIARY STUDIOS (v2) ==========
// Phase 5D: Late-game unlock. Create genre-focused sub-studios that auto-ship
// projects and contribute revenue to parent. Similar to rivals but player-owned.
(function(){
  'use strict';

  // Gate: Fame 200+ and cash $50M+
  const FAME_GATE = 200;
  const CASH_GATE = 50_000_000;

  // ---------- State ----------
  function ensureState() {
    if (!Array.isArray(S.subsidiaries)) S.subsidiaries = [];
  }

  function canCreate() {
    ensureState();
    const fame = S.tFame || 0;
    if (fame < FAME_GATE) return { ok: false, reason: 'Need Fame ' + FAME_GATE + ' (have ' + fame + ')' };
    if ((S.cash || 0) < CASH_GATE) return { ok: false, reason: 'Need $' + (CASH_GATE/1_000_000).toFixed(0) + 'M cash (have ' + ((S.cash || 0)/1_000_000).toFixed(1) + 'M)' };
    return { ok: true };
  }

  // ---------- Create ----------
  // cost: 10M baseline + 10M per existing subsidiary
  function creationCost() {
    ensureState();
    return 10_000_000 + S.subsidiaries.length * 10_000_000;
  }

  function createSubsidiary(name, focus) {
    ensureState();
    const check = canCreate();
    if (!check.ok) return { ok: false, error: check.reason };
    const cost = creationCost();
    if ((S.cash || 0) < cost) return { ok: false, error: 'Need $' + (cost/1_000_000).toFixed(0) + 'M to spin up' };
    S.cash -= cost;
    S.tExpenses = (S.tExpenses || 0) + cost;
    const sub = {
      id: 's_' + Date.now().toString(36) + '_' + S.subsidiaries.length,
      name: name || ('Studio ' + (S.subsidiaries.length + 1)),
      focus: focus || 'game',     // single-genre sub-studio
      teamSize: 5,
      quality: 70,                 // matches founder baseline, grows with output
      createdAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
      shippedCount: 0,
      nextProject: null,
      monthlyCost: 200_000,        // upkeep ~ 5 engineers' payroll
    };
    S.subsidiaries.push(sub);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🏭 Spun up subsidiary: ' + sub.name + ' (' + sub.focus + ', $' + cost.toLocaleString() + ' upfront)');
    document.dispatchEvent(new CustomEvent('tycoon:subsidiary-created', { detail: { subId: sub.id } }));
    return { ok: true, sub };
  }

  function closeSubsidiary(subId) {
    ensureState();
    const idx = S.subsidiaries.findIndex(s => s.id === subId);
    if (idx < 0) return { ok: false, error: 'Not found' };
    const s = S.subsidiaries[idx];
    S.subsidiaries.splice(idx, 1);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🚪 Closed subsidiary: ' + s.name);
    return { ok: true };
  }

  // ---------- Per-tick: ship projects + charge upkeep ----------
  function scheduleProject(sub) {
    const year = S.calendar?.year || 1980;
    if (!window.isProjectTypeAvailable?.(sub.focus, year)) return;
    const startWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const duration = 18 + Math.floor(Math.random() * 6); // 18-24 weeks
    const names = window.PROJECT_NAME_TEMPLATES?.[sub.focus] ||
      (window.tycoonContracts?.PROJECT_NAME_TEMPLATES?.[sub.focus]) ||
      ['Untitled'];
    // Use rival shipped names pool as flavor
    const rivalPool = window.tycoonRivals?.RIVAL_PROJECT_NAMES?.[sub.focus] ||
      ['Megaproject'];
    const name = (rivalPool[Math.floor(Math.random() * rivalPool.length)]) + ' ' + (sub.shippedCount + 1);
    sub.nextProject = {
      name, type: sub.focus,
      startedAtWeek: startWeek,
      releaseAtWeek: startWeek + duration,
    };
  }

  function shipSubsidiaryProject(sub) {
    const p = sub.nextProject;
    if (!p) return;
    const year = S.calendar?.year || 1980;
    const critic = Math.max(40, Math.min(95, Math.round(sub.quality + (Math.random() - 0.5) * 20)));
    const macroMult = window.tycoonMacro?.revenueMultiplier?.(p.type) || 1;
    const sales = Math.round(sub.teamSize * 200_000 * Math.pow(critic / 50, 2.0) * macroMult);
    S.cash = (S.cash || 0) + sales;
    S.tRevenue = (S.tRevenue || 0) + sales;
    sub.shippedCount += 1;
    // Quality drifts with success
    if (critic >= 85) sub.quality = Math.min(95, sub.quality + 1);
    if (critic <= 55) sub.quality = Math.max(50, sub.quality - 1);
    if (typeof log === 'function') log('🏭 ' + sub.name + ' shipped ' + p.name + ' (critic ' + critic + ', +' + sales.toLocaleString() + ')');
    document.dispatchEvent(new CustomEvent('tycoon:subsidiary-shipped', { detail: { subId: sub.id, critic, sales, title: p.name } }));
    sub.nextProject = null;
  }

  let _weeksSinceUpkeep = 0;
  const WEEKS_PER_MONTH = 4;
  function onWeekTick() {
    ensureState();
    // Monthly upkeep
    _weeksSinceUpkeep += 1;
    if (_weeksSinceUpkeep >= WEEKS_PER_MONTH) {
      _weeksSinceUpkeep = 0;
      let total = 0;
      for (const s of S.subsidiaries) total += (s.monthlyCost || 0);
      if (total > 0) {
        S.cash = (S.cash || 0) - total;
        S.tExpenses = (S.tExpenses || 0) + total;
        if (typeof markDirty === 'function') markDirty();
      }
    }
    // Per-sub project progression
    for (const sub of S.subsidiaries) {
      if (!sub.nextProject) {
        scheduleProject(sub);
      } else {
        const curWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
        if (curWeek >= sub.nextProject.releaseAtWeek) {
          shipSubsidiaryProject(sub);
        }
      }
    }
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startSubsidiariesTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[subsidiaries] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopSubsidiariesTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonSubsidiaries = {
    FAME_GATE, CASH_GATE,
    canCreate,
    creationCost,
    create: createSubsidiary,
    close: closeSubsidiary,
    startTick: startSubsidiariesTick,
    stopTick: stopSubsidiariesTick,
    state() {
      ensureState();
      return {
        subsidiaries: S.subsidiaries.map(s => ({
          name: s.name, focus: s.focus,
          shipped: s.shippedCount,
          quality: s.quality,
          nextProject: s.nextProject ? {
            name: s.nextProject.name,
            weeksUntil: Math.max(0, s.nextProject.releaseAtWeek - (window.tycoonProjects?.absoluteWeek?.() || 0))
          } : null
        })),
        canCreate: canCreate(),
        creationCost: creationCost()
      };
    }
  };
  if (window.dbg) window.dbg.subsidiaries = window.tycoonSubsidiaries;

  console.log('[tycoon-subsidiaries] module loaded. Gates: Fame ' + FAME_GATE + '+ and $' + (CASH_GATE/1_000_000) + 'M+.');
})();
