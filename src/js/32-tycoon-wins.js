// ========== TYCOON WIN CONDITIONS (v2) ==========
// Phase 5H: 5 victory paths. Multiple can stack per career.
// Fires tycoon:win-achieved event on first-time achievement.
(function(){
  'use strict';

  // ---------- Win path definitions ----------
  const WIN_PATHS = [
    {
      id: 'industry_titan',
      label: '🏛️ Industry Titan',
      blurb: 'Reach Fame 500 and hold it for 2 years.',
      check(ctx) {
        if ((S.tFame || 0) < 500) { ctx.titanWeeks = 0; return false; }
        ctx.titanWeeks = (ctx.titanWeeks || 0) + 1;
        return ctx.titanWeeks >= 96; // ~2 years
      }
    },
    {
      id: 'ipo_exit',
      label: '📈 IPO Exit',
      blurb: 'Successfully IPO the studio at $500M+ valuation.',
      check() {
        return !!(S.ipo?.completed);
      }
    },
    {
      id: 'catalog_master',
      label: '🎮 Catalog Master',
      blurb: 'Ship 25+ own-IP titles averaging critic 80+, plus 10+ awards won.',
      check() {
        const ip = (S.projects?.shipped || []).filter(p => !p.isContract);
        if (ip.length < 25) return false;
        const avg = ip.reduce((s, p) => s + (p.criticScore || 0), 0) / ip.length;
        if (avg < 80) return false;
        // Count awards won by player
        const awardsHistory = S.awards?.history || [];
        let awardCount = 0;
        for (const y of awardsHistory) {
          if (y.winners?.goty?.source === 'player') awardCount++;
          if (y.winners?.studioOfYear?.key === 'player') awardCount++;
          if (y.winners?.risingStar?.source === 'player') awardCount++;
          if (y.winners?.innovation?.source === 'player') awardCount++;
          for (const w of Object.values(y.winners?.bestInGenre || {})) {
            if (w.source === 'player') awardCount++;
          }
        }
        return awardCount >= 10;
      }
    },
    {
      id: 'the_acquirer',
      label: '🏰 The Acquirer',
      blurb: 'Acquire 3+ rival studios.',
      check() {
        const acquired = (S.rivals || []).filter(r => r.status === 'acquired').length;
        return acquired >= 3;
      }
    },
    {
      id: 'reach_2024',
      label: '📅 Witness to History',
      blurb: 'Reach 2024 without bankruptcy.',
      check() {
        return (S.calendar?.year || 1980) >= 2024;
      }
    },
  ];

  // ---------- State ----------
  function ensureState() {
    if (!S.winsAchieved) S.winsAchieved = [];
    if (!S.winCheckContext) S.winCheckContext = {};
  }

  // ---------- Weekly check ----------
  function onWeekTick() {
    ensureState();
    for (const path of WIN_PATHS) {
      if (S.winsAchieved.includes(path.id)) continue;
      const hit = path.check(S.winCheckContext);
      if (hit) {
        S.winsAchieved.push(path.id);
        if (typeof markDirty === 'function') markDirty();
        if (typeof log === 'function') log('🏆 ' + path.label + ' achieved!');
        // v3 roguelite: the FIRST win in a run triggers a largest-tier
        // endowment run-end. Subsequent wins in the same run (multiple
        // paths hit) are still celebrated but don't double-bank endowment
        // (endRun is idempotent via S._runEndFired).
        if (window.tycoonSchool?.endRun) {
          window.tycoonSchool.endRun('win_condition', { pathId: path.id, pathLabel: path.label });
        }
        document.dispatchEvent(new CustomEvent('tycoon:win-achieved', {
          detail: { pathId: path.id, path }
        }));
      }
    }
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startWinsTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[wins] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopWinsTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonWins = {
    WIN_PATHS,
    startTick: startWinsTick,
    stopTick: stopWinsTick,
    state() {
      ensureState();
      return {
        achieved: S.winsAchieved,
        total: WIN_PATHS.length,
      };
    },
    // Check all immediately (debug + manual trigger)
    checkAll() { onWeekTick(); }
  };
  if (window.dbg) window.dbg.wins = window.tycoonWins;

  console.log('[tycoon-wins] module loaded. ' + WIN_PATHS.length + ' win paths.');
})();
