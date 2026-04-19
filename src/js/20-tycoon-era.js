// ========== TYCOON ERA PROGRESSION (v2) ==========
// Phase 3B: labels for calendar eras + hooks for era-transition events.
// Visual theming across all 9 eras comes in Phase 5; this module provides the
// mechanical scaffolding.
(function(){
  'use strict';

  // Era definitions: contiguous ranges from 1980 → 2024
  const ERAS = [
    { id: 'early_pc',       label: 'Early PC',          range: [1980, 1984], icon: '💾', blurb: 'Home computers, cassette saves' },
    { id: 'pc_growth',      label: 'PC Growth',         range: [1985, 1989], icon: '🖥️', blurb: 'Mouse UIs, graphical games' },
    { id: 'pc_golden',      label: 'PC Golden Age',     range: [1990, 1994], icon: '🎨', blurb: 'CD-ROM, 256 colors, Windows' },
    { id: 'internet',       label: 'Internet Era',      range: [1995, 1999], icon: '🌐', blurb: 'Web launches. Everyone online.' },
    { id: 'dotcom',         label: 'Dot-com Boom',      range: [2000, 2003], icon: '📈', blurb: 'Startups everywhere, bust looms' },
    { id: 'broadband',      label: 'Broadband Era',     range: [2004, 2007], icon: '📺', blurb: 'Streaming, social media takes off' },
    { id: 'mobile',         label: 'Mobile Revolution', range: [2008, 2014], icon: '📱', blurb: 'iPhone changes everything' },
    { id: 'cloud',          label: 'Cloud Era',         range: [2015, 2019], icon: '☁️', blurb: 'SaaS dominates, AWS rules' },
    { id: 'ai',             label: 'AI Era',            range: [2020, 2024], icon: '🤖', blurb: 'AI eats software' },
  ];
  window.TYCOON_ERAS = ERAS;

  function currentEra(year) {
    year = year == null ? (S.calendar?.year || 1980) : year;
    return ERAS.find(e => year >= e.range[0] && year <= e.range[1]) || ERAS[ERAS.length - 1];
  }
  function currentEraId(year) { return currentEra(year).id; }

  // ---------- Era transition detection ----------
  // Fires tycoon:era-change when the calendar year crosses into a new era.
  let _lastSeenEraId = null;
  function onWeekTick() {
    const era = currentEra();
    if (_lastSeenEraId == null) {
      _lastSeenEraId = era.id;
      return;
    }
    if (era.id !== _lastSeenEraId) {
      const prevEra = ERAS.find(e => e.id === _lastSeenEraId);
      _lastSeenEraId = era.id;
      if (typeof log === 'function') log('🔄 Era transition: ' + (prevEra?.label || 'previous') + ' → ' + era.icon + ' ' + era.label);
      document.dispatchEvent(new CustomEvent('tycoon:era-change', {
        detail: { fromEraId: prevEra?.id, toEraId: era.id, era }
      }));
    }
  }

  let _unsub = null;
  function startEraTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[era] tycoonTime not available'); return; }
    _lastSeenEraId = currentEraId();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopEraTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonEra = {
    ERAS,
    current: currentEra,
    currentId: currentEraId,
    startTick: startEraTick,
    stopTick: stopEraTick,
    formatDateLine(cal) {
      cal = cal || S.calendar;
      const era = currentEra(cal?.year);
      return era.icon + ' ' + era.label;
    }
  };
  if (window.dbg) window.dbg.era = window.tycoonEra;

  console.log('[tycoon-era] module loaded. ' + ERAS.length + ' eras from 1980-2024.');
})();
