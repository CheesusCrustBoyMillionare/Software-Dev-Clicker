// ========== DEBUG CONSOLE (window.dbg) ==========
// Developer helpers exposed on window.dbg — call from browser DevTools console.
// Example: dbg.help(), dbg.state(), dbg.jumpYear(2000), dbg.ship().
// Separate from the Ctrl+Shift+D UI debug panel — that's for visual testing.
(function(){
  function cmd(fn, desc) { fn.__desc = desc; return fn; }

  const dbg = {
    help: cmd(() => {
      const entries = Object.keys(dbg).filter(k => typeof dbg[k] === 'function');
      console.group('%cdbg.*', 'font-weight:bold;color:#f0883e');
      for (const k of entries) {
        const f = dbg[k];
        console.log('%c  dbg.' + k + '()%c  ' + (f.__desc || ''), 'color:#7ee787', 'color:#888');
      }
      console.groupEnd();
      return entries.length + ' commands. Call any of them from console.';
    }, 'Show this help'),

    state: cmd(() => {
      return {
        schema: typeof SCHEMA_VERSION !== 'undefined' ? SCHEMA_VERSION : null,
        gameVersion: typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : null,
        year: typeof currentYear === 'function' ? currentYear() : null,
        shipped: S.shipped,
        fame: S.fame, tFame: S.tFame,
        loc: S.loc, tLoc: S.tLoc,
        engineers: {
          coders: S.coders?.length || 0,
          byType: Object.fromEntries(Object.entries(S.engineers || {}).map(([k, v]) => [k, v.list?.length || 0]))
        },
        unlockedTypes: S.unlockedTypes,
        achievements: S.ach?.length + '/' + ACHIEVEMENTS.length,
        saveKey: KEY,
        slot: KEY.replace('gdc_save_', '')
      };
    }, 'Dump current game state summary'),

    schema: cmd(() => ({
      current: SCHEMA_VERSION,
      minCompat: MIN_COMPATIBLE_SCHEMA,
      mySaveVersion: S.v,
      migrationsRegistered: Object.keys(SCHEMA_MIGRATIONS).map(v => 'v' + v + ' → v' + (+v + 1))
    }), 'Show save schema versioning info'),

    jumpYear: cmd((targetYear) => {
      if (typeof RELEASE_YEARS === 'undefined') { console.warn('RELEASE_YEARS not defined'); return; }
      const targetShipped = RELEASE_YEARS.findIndex(y => y >= targetYear);
      const diff = (targetShipped >= 0 ? targetShipped : RELEASE_YEARS.length) - S.shipped;
      if (diff === 0) return 'Already at year ' + currentYear();
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          if (Array.isArray(S.unlockedTypes)) {
            for (const type of S.unlockedTypes) {
              const need = engShipAt(type) + 1;
              if (type === 'coder') { S.loc = need; S.tLoc = Math.max(S.tLoc, need); }
              else if (S.engineers && S.engineers[type]) {
                S.engineers[type].res = need;
                S.engineers[type].tRes = Math.max(S.engineers[type].tRes || 0, need);
              }
            }
          }
          isShipping = false;
          ship();
          const ov = document.querySelector('.ship-ov');
          if (ov) ov.remove();
          window._pendingRetired = null;
          isShipping = false;
        }
      } else {
        S.shipped = Math.max(0, S.shipped + diff);
        _eraYear = -1; currentComputerEra = '';
        document.documentElement.className = '';
        markDirty(); recomputeG(); updateDeskScene();
        renderTypeTabs(); renderResourceBar(); renderShipPanel();
      }
      return 'Jumped to year ' + currentYear() + ' (shipped ' + S.shipped + ')';
    }, 'Jump to year. Example: dbg.jumpYear(2000)'),

    setCash: cmd((n) => {
      // Clicker-era: no explicit cash, use LoC as proxy. In tycoon rework, will set S.cash.
      if (typeof S.cash !== 'undefined') { S.cash = n; markDirty(); return 'cash = ' + n; }
      return 'No cash field in this build (clicker era uses LoC — try dbg.setLoc instead)';
    }, 'Set cash. Tycoon-era. Example: dbg.setCash(1000000)'),

    setLoc: cmd((n) => {
      S.loc = n; S.tLoc = Math.max(S.tLoc, n);
      markDirty();
      return 'loc = ' + n;
    }, 'Set lines of code. Clicker-era. Example: dbg.setLoc(1e9)'),

    setFame: cmd((n) => {
      S.fame = n; S.tFame = Math.max(S.tFame, n);
      markDirty();
      return 'fame = ' + n;
    }, 'Set fame. Example: dbg.setFame(100)'),

    ship: cmd(() => {
      if (typeof canShip === 'function' && !canShip()) {
        // Force-enable by maxing resources
        if (Array.isArray(S.unlockedTypes)) {
          for (const type of S.unlockedTypes) {
            const need = engShipAt(type) + 1;
            if (type === 'coder') { S.loc = need; S.tLoc = Math.max(S.tLoc, need); }
            else if (S.engineers && S.engineers[type]) {
              S.engineers[type].res = need;
              S.engineers[type].tRes = Math.max(S.engineers[type].tRes || 0, need);
            }
          }
        }
      }
      isShipping = false;
      ship();
      return 'Shipped. Now at year ' + currentYear() + ' (total: ' + S.shipped + ')';
    }, 'Force-ship the next release'),

    unlockAllAch: cmd(() => {
      if (!Array.isArray(S.ach)) S.ach = [];
      for (const a of ACHIEVEMENTS) if (!S.ach.includes(a.id)) S.ach.push(a.id);
      markDirty();
      return 'Unlocked ' + S.ach.length + '/' + ACHIEVEMENTS.length + ' achievements';
    }, 'Unlock every achievement'),

    revealAll: cmd(() => {
      // Unlock every engineer type regardless of year
      if (typeof ENG_TYPES !== 'undefined') {
        S.unlockedTypes = ENG_TYPES.map(e => e.key);
      }
      markDirty();
      if (typeof renderTypeTabs === 'function') renderTypeTabs();
      if (typeof renderShipPanel === 'function') renderShipPanel();
      return 'All engineer types unlocked';
    }, 'Unlock all engineer types'),

    forceEvent: cmd((name) => {
      if (typeof EVENTS === 'undefined') return 'EVENTS not defined';
      const ev = EVENTS.find(e => e.name?.toLowerCase() === (name || '').toLowerCase());
      if (!ev) return 'Event not found. Available: ' + EVENTS.map(e => e.name).join(', ');
      if (typeof triggerEvent === 'function') { triggerEvent(ev); return 'Triggered: ' + ev.name; }
      return 'triggerEvent() not available in this build';
    }, 'Trigger named event. Example: dbg.forceEvent("Spaghetti Code")'),

    wipe: cmd(() => {
      if (!confirm('Wipe current save slot (' + KEY + ')? This cannot be undone.')) return 'cancelled';
      localStorage.removeItem(KEY);
      location.reload();
      return 'wiped + reloading';
    }, 'Wipe current save slot (prompts for confirmation)'),

    export: cmd(() => {
      const raw = localStorage.getItem(KEY);
      if (!raw) return 'No save in slot ' + KEY;
      console.log('%cCopy the JSON below:', 'color:#f0883e;font-weight:bold');
      console.log(raw);
      return '(copied to console; ' + (raw.length / 1024).toFixed(1) + ' KB)';
    }, 'Dump save JSON to console'),

    import: cmd((json) => {
      try {
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        if (!parsed || typeof parsed !== 'object') return 'Invalid JSON';
        localStorage.setItem(KEY, JSON.stringify(parsed));
        location.reload();
        return 'imported + reloading';
      } catch (e) { return 'Parse error: ' + e.message; }
    }, 'Import save from JSON string'),

    speed: cmd((mult) => {
      // Clicker era: no game speed concept. In tycoon, will set tick rate.
      if (typeof window.__speedMult !== 'undefined') {
        window.__speedMult = mult;
        return 'speed = ' + mult + '×';
      }
      return 'No speed control in this build (tycoon-era feature)';
    }, 'Set game speed multiplier. Tycoon-era.'),
  };

  // Expose on window + print a one-time greeting
  window.dbg = dbg;
  if (typeof console !== 'undefined' && !window.__dbgGreeted) {
    window.__dbgGreeted = true;
    setTimeout(() => {
      console.log('%c[dbg] Developer console active. Call %cdbg.help()%c for commands.',
        'color:#888', 'color:#f0883e;font-weight:bold', 'color:#888');
    }, 500);
  }
})();
