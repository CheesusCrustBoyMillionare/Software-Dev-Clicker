// ========== TYCOON MARKET ANALYTICS (v2) ==========
// Phase 4B: genre heat tracking based on recent player + rival shipments.
// Phase 4C adds platform health; Phase 4D adds launch collision detection.
(function(){
  'use strict';

  // ---------- Genre heat model ----------
  // Heat builds from recent shipments in that genre. Decays over time.
  // Shown as 🔥 count (1-5) in Market panel.
  const HEAT_DECAY_PER_WEEK = 0.05;       // heat loses 5% per week
  const HEAT_PER_SHIPMENT = 15;           // each rival/player ship adds this much
  const MAX_HEAT = 100;

  // Project types we track (matches PROJECT_TYPES keys)
  const TRACKED_TYPES = ['game', 'business', 'web', 'mobile', 'saas', 'ai'];

  function ensureState() {
    if (!S.market) S.market = {};
    if (!S.market.heat) {
      S.market.heat = {};
      for (const t of TRACKED_TYPES) S.market.heat[t] = 20; // start warm-ish
    }
    if (!S.market.heatHistory) S.market.heatHistory = {};
  }

  // ---------- Tick: decay + record history ----------
  function onWeekTick() {
    ensureState();
    for (const type of TRACKED_TYPES) {
      // Decay
      S.market.heat[type] = Math.max(0, (S.market.heat[type] || 0) - HEAT_DECAY_PER_WEEK * (S.market.heat[type] || 0));
    }
    // Persist history for trend arrows (weekly snapshot, keep 12 weeks)
    for (const type of TRACKED_TYPES) {
      if (!S.market.heatHistory[type]) S.market.heatHistory[type] = [];
      S.market.heatHistory[type].push(S.market.heat[type]);
      if (S.market.heatHistory[type].length > 12) S.market.heatHistory[type].shift();
    }
  }

  // ---------- Event listeners ----------
  // Rival shipments add heat to their type
  document.addEventListener('tycoon:rival-shipped', (e) => {
    ensureState();
    const type = e.detail.type;
    if (TRACKED_TYPES.includes(type)) {
      // Bigger boost for higher critic scores
      const multiplier = Math.max(0.5, e.detail.critic / 50);
      S.market.heat[type] = Math.min(MAX_HEAT, (S.market.heat[type] || 0) + HEAT_PER_SHIPMENT * multiplier);
    }
  });

  // Player shipments also add heat (slight — we're comparing to the field)
  function onPlayerShip(proj) {
    ensureState();
    const type = proj.type;
    if (TRACKED_TYPES.includes(type)) {
      const multiplier = Math.max(0.5, (proj.criticScore || 60) / 50);
      S.market.heat[type] = Math.min(MAX_HEAT, (S.market.heat[type] || 0) + HEAT_PER_SHIPMENT * multiplier * 0.7);
    }
  }
  window._tycoonOnPlayerShip = onPlayerShip;

  // ---------- Query helpers ----------
  function heatForType(type) {
    ensureState();
    return S.market.heat[type] || 0;
  }
  // Heat as 1-5 🔥 count
  function heatIcons(type) {
    const v = heatForType(type);
    if (v < 10) return '🔥';
    if (v < 25) return '🔥🔥';
    if (v < 50) return '🔥🔥🔥';
    if (v < 75) return '🔥🔥🔥🔥';
    return '🔥🔥🔥🔥🔥';
  }
  // Trend: ↗ (rising), → (steady), ↘ (cooling)
  function heatTrend(type) {
    ensureState();
    const hist = S.market.heatHistory[type] || [];
    if (hist.length < 3) return '→';
    const recent = (hist[hist.length-1] + hist[hist.length-2]) / 2;
    const older = (hist[0] + hist[1]) / 2;
    if (recent > older * 1.15) return '↗';
    if (recent < older * 0.85) return '↘';
    return '→';
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startMarketTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[market] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopMarketTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonMarket = {
    heatForType,
    heatIcons,
    heatTrend,
    TRACKED_TYPES,
    startTick: startMarketTick,
    stopTick: stopMarketTick,
    state() {
      ensureState();
      const out = {};
      for (const t of TRACKED_TYPES) {
        out[t] = {
          heat: Math.round(S.market.heat[t] || 0),
          icons: heatIcons(t),
          trend: heatTrend(t)
        };
      }
      return out;
    }
  };
  if (window.dbg) window.dbg.market = window.tycoonMarket;

  console.log('[tycoon-market] module loaded. Tracking heat for ' + TRACKED_TYPES.length + ' genres.');
})();
