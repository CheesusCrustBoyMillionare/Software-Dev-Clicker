// ========== TYCOON AWARDS CEREMONY (v2) ==========
// Phase 4G: Annual Awards at end of each game year.
// Computes winners across all shipped titles (player + rivals) this year.
(function(){
  'use strict';

  // ---------- State ----------
  function ensureState() {
    if (!S.awards) S.awards = { history: [] };
    if (!Array.isArray(S.awards.history)) S.awards.history = [];
  }

  // ---------- Compute winners for a given year ----------
  function computeWinners(year) {
    ensureState();
    // Collect all shipments from this year (player + rivals)
    const playerShipped = (S.projects?.shipped || []).filter(p => {
      // Ship year ≈ (shippedAtWeek / 48) + 1980
      const shipYear = 1980 + Math.floor((p.shippedAtWeek || 0) / 48);
      return shipYear === year;
    });
    const rivalShipped = (S.rivalShippedTitles || []).filter(t => t.year === year);

    // Normalize to a unified format for ranking
    const all = [];
    for (const p of playerShipped) {
      all.push({
        source: 'player',
        title: p.name,
        type: p.type,
        critic: p.criticScore || 0,
        sales: p.isContract ? 0 : (p.launchSales || 0),
        icon: (window.PROJECT_TYPES[p.type]?.icon) || '',
      });
    }
    for (const t of rivalShipped) {
      all.push({
        source: 'rival',
        sourceId: t.rivalId,
        sourceName: t.rivalName,
        sourceIcon: t.rivalIcon,
        title: t.title,
        type: t.type,
        critic: t.critic,
        sales: t.sales,
        icon: (window.PROJECT_TYPES[t.type]?.icon) || '',
      });
    }

    if (all.length === 0) return null;

    const winners = {};

    // --- Game of the Year — highest overall critic score ---
    const sortedByCritic = [...all].sort((a, b) => b.critic - a.critic);
    if (sortedByCritic[0]) winners.goty = sortedByCritic[0];

    // --- Best in Genre (per project type, highest critic) ---
    winners.bestInGenre = {};
    const types = Array.from(new Set(all.map(s => s.type)));
    for (const type of types) {
      const sorted = all.filter(s => s.type === type).sort((a,b) => b.critic - a.critic);
      if (sorted[0]) winners.bestInGenre[type] = sorted[0];
    }

    // --- Studio of the Year — highest combined critic × volume ---
    const studios = {};
    for (const s of all) {
      const key = s.source === 'player' ? 'player' : s.sourceId;
      const name = s.source === 'player' ? (S.studioName || 'Your Studio') : s.sourceName;
      const icon = s.source === 'player' ? '⭐' : s.sourceIcon;
      if (!studios[key]) studios[key] = { key, name, icon, entries: [], criticSum: 0, count: 0 };
      studios[key].entries.push(s);
      studios[key].criticSum += s.critic;
      studios[key].count += 1;
    }
    const studioList = Object.values(studios).sort((a,b) => (b.criticSum) - (a.criticSum));
    if (studioList[0]) winners.studioOfYear = studioList[0];

    // --- Rising Star — first-time studio entry (this year) with highest critic ---
    // For Phase 4G: give to player if their studio shipped their first game this year
    const playerShipCount = (S.projects?.shipped || []).filter(p => (p.shippedAtWeek || 0) > 0).length;
    const playerThisYearCount = playerShipped.length;
    if (playerShipCount === playerThisYearCount && playerShipped.length > 0) {
      // Player entered this year → candidate for Rising Star
      const best = playerShipped.sort((a,b) => (b.criticScore||0) - (a.criticScore||0))[0];
      if (best) winners.risingStar = {
        source: 'player',
        title: best.name,
        critic: best.criticScore,
        icon: '⭐',
        studioName: S.studioName || 'Your Studio'
      };
    }

    // --- Innovation — the title with highest innovation modifier (Phase 5+)
    // For Phase 4G: pick title using newest research node's type
    // Simplified: pick the highest-critic rare/late-game type
    const innovative = all.filter(s => ['ai','saas','mobile'].includes(s.type)).sort((a,b) => b.critic - a.critic);
    if (innovative[0] && innovative[0].critic >= 70) winners.innovation = innovative[0];

    return winners;
  }

  // ---------- Apply award effects ----------
  function applyEffects(winners, year) {
    if (!winners) return;
    const playerName = S.studioName || 'Your Studio';
    const effects = []; // human-readable summary

    // Game of the Year
    if (winners.goty?.source === 'player') {
      S.fame = (S.fame || 0) + 15;
      S.tFame = (S.tFame || 0) + 15;
      effects.push('🏆 Game of the Year: +15 Fame');
    }
    // Best in Genre
    for (const [type, winner] of Object.entries(winners.bestInGenre || {})) {
      if (winner.source === 'player') {
        S.fame = (S.fame || 0) + 5;
        S.tFame = (S.tFame || 0) + 5;
        effects.push('🥇 Best ' + (window.PROJECT_TYPES[type]?.label || type) + ': +5 Fame');
      }
    }
    // Studio of the Year
    if (winners.studioOfYear?.key === 'player') {
      S.fame = (S.fame || 0) + 25;
      S.tFame = (S.tFame || 0) + 25;
      effects.push('🏛️ Studio of the Year: +25 Fame');
    }
    // Rising Star
    if (winners.risingStar?.source === 'player') {
      S.fame = (S.fame || 0) + 10;
      S.tFame = (S.tFame || 0) + 10;
      effects.push('🚀 Rising Star: +10 Fame');
    }
    // Innovation
    if (winners.innovation?.source === 'player') {
      S.fame = (S.fame || 0) + 10;
      S.tFame = (S.tFame || 0) + 10;
      effects.push('💡 Innovation Award: +10 Fame');
    }

    return effects;
  }

  // ---------- Tick: check for year rollover ----------
  let _lastSeenYear = null;
  function onWeekTick() {
    ensureState();
    if (_lastSeenYear == null) {
      _lastSeenYear = S.calendar?.year || 1980;
      return;
    }
    const year = S.calendar?.year || 1980;
    // When year rolls over and we haven't done ceremony for previous year
    if (year > _lastSeenYear) {
      const ceremonyYear = _lastSeenYear;
      _lastSeenYear = year;
      fireCeremony(ceremonyYear);
    }
  }

  function fireCeremony(year) {
    ensureState();
    const winners = computeWinners(year);
    if (!winners) return; // no shipments this year
    const effects = applyEffects(winners, year);
    S.awards.history.push({ year, winners, effects });
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') {
      log('🏆 ' + year + ' Awards Ceremony — ' + Object.keys(winners).length + ' awards');
    }
    document.dispatchEvent(new CustomEvent('tycoon:awards-ceremony', { detail: { year, winners, effects } }));
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startAwardsTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[awards] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopAwardsTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonAwards = {
    computeWinners,
    fireCeremony,       // debug
    startTick: startAwardsTick,
    stopTick: stopAwardsTick,
    state() {
      ensureState();
      return {
        history: S.awards.history.map(y => ({
          year: y.year,
          winnersCount: Object.keys(y.winners).length,
          effects: y.effects
        })),
        totalCeremonies: S.awards.history.length
      };
    }
  };
  if (window.dbg) window.dbg.awards = window.tycoonAwards;

  console.log('[tycoon-awards] module loaded.');
})();
