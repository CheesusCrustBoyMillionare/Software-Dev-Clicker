// ========== DEBUG CONSOLE (window.dbg) ==========
// Developer helpers exposed on window.dbg — call from browser DevTools console.
// Example: dbg.help(), dbg.state(), dbg.jumpYear(2000), dbg.ship().
// Separate from the Ctrl+Shift+D UI debug panel — that's for visual testing.
//
// v11.2: refreshed for the tycoon/roguelite game. Stats are on the 10-100
// scale; numerous new commands for cash, research, employees, calendar and
// founder tuning. Clicker-era commands still work when called from a clicker
// save, but the tycoon path is the primary focus now.
(function(){
  function cmd(fn, desc) { fn.__desc = desc; return fn; }

  // ---------- tycoon helpers (no-op when tycoon modules aren't loaded) ----------
  const hasTycoon = () => typeof window.tycoonTime !== 'undefined';
  const AXES = ['tech','design','polish','speed'];

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

    // ---------- State / schema ----------
    state: cmd(() => {
      const base = {
        schema: typeof SCHEMA_VERSION !== 'undefined' ? SCHEMA_VERSION : null,
        gameVersion: typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : null,
        saveVersion: S.v,
        saveKey: KEY,
        slot: KEY.replace('gdc_save_', ''),
        achievements: (S.ach?.length || 0) + '/' + (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : '?'),
      };
      // Tycoon-era state (populated once career starts)
      if (S.careerStarted) {
        base.tycoon = {
          calendar: S.calendar,
          week: (S.calendar?.year || 0) + '-W' + (S.calendar?.week || 0),
          speed: S.speed, paused: S.paused,
          cash: S.cash, revenue: S.tRevenue, expenses: S.tExpenses,
          fame: S.fame, tFame: S.tFame,
          employees: (S.employees?.length || 0) + (S.founder ? ' + founder' : ''),
          projectsActive: S.projects?.active?.length || 0,
          projectsShipped: S.projects?.shipped?.length || 0,
          researchDone: (S.research?.completed?.length || 0),
          researchInProg: S.research?.inProgress?.nodeId || null,
        };
        if (S.founder) {
          base.founder = {
            name: S.founder.name,
            specialty: S.founder.specialty,
            tier: S.founder.tierName,
            stats: S.founder.stats,
            morale: S.founder.morale,
            traits: S.founder.mechanicalTraits || S.founder.traits,
          };
        }
      }
      // Clicker-era state
      base.clicker = {
        year: typeof currentYear === 'function' ? currentYear() : null,
        shipped: S.shipped,
        loc: S.loc, tLoc: S.tLoc,
        coders: S.coders?.length || 0,
        byType: Object.fromEntries(Object.entries(S.engineers || {}).map(([k, v]) => [k, v.list?.length || 0])),
        unlockedTypes: S.unlockedTypes,
      };
      return base;
    }, 'Dump current game state summary (tycoon + clicker)'),

    schema: cmd(() => ({
      current: SCHEMA_VERSION,
      minCompat: MIN_COMPATIBLE_SCHEMA,
      mySaveVersion: S.v,
      migrationsRegistered: Object.keys(SCHEMA_MIGRATIONS).map(v => 'v' + v + ' → v' + (+v + 1))
    }), 'Show save schema versioning info'),

    // ---------- Cash / Fame (tycoon) ----------
    setCash: cmd((n) => {
      if (typeof n !== 'number') return 'Usage: dbg.setCash(1000000)';
      if (typeof S.cash !== 'undefined') { S.cash = n; if (typeof markDirty === 'function') markDirty(); return 'cash = $' + n.toLocaleString(); }
      return 'No cash field in this build (clicker era uses LoC — try dbg.setLoc instead)';
    }, 'Set cash. Example: dbg.setCash(1e6)'),

    addCash: cmd((n) => {
      if (typeof n !== 'number') return 'Usage: dbg.addCash(100000)';
      S.cash = (S.cash || 0) + n;
      if (typeof markDirty === 'function') markDirty();
      return 'cash += $' + n.toLocaleString() + ' → $' + S.cash.toLocaleString();
    }, 'Add cash. Example: dbg.addCash(1e5)'),

    setFame: cmd((n) => {
      S.fame = n; S.tFame = Math.max(S.tFame, n);
      if (typeof markDirty === 'function') markDirty();
      return 'fame = ' + n;
    }, 'Set fame. Example: dbg.setFame(100)'),

    // ---------- Founder stats (v11.2: 10-100 scale) ----------
    founder: cmd(() => {
      if (!S.founder) return 'No founder yet — start a career first.';
      return {
        name: S.founder.name,
        specialty: S.founder.specialty,
        tier: S.founder.tier + ' (' + S.founder.tierName + ')',
        stats: S.founder.stats,
        morale: S.founder.morale,
        age: S.founder.age,
        traits: S.founder.mechanicalTraits || S.founder.traits,
        passions: S.founder.passions,
      };
    }, 'Dump founder info'),

    setStat: cmd((axis, val) => {
      if (!S.founder || !S.founder.stats) return 'No founder.';
      if (!AXES.includes(axis)) return 'axis must be one of: ' + AXES.join(', ');
      if (typeof val !== 'number' || val < 0 || val > 200) return 'val must be 0-200 (10-100 is typical)';
      S.founder.stats[axis] = val;
      if (typeof markDirty === 'function') markDirty();
      return S.founder.name + '.stats.' + axis + ' = ' + val;
    }, 'Set a founder stat. Example: dbg.setStat("tech", 90)'),

    maxStats: cmd(() => {
      if (!S.founder || !S.founder.stats) return 'No founder.';
      for (const k of AXES) S.founder.stats[k] = 100;
      if (typeof markDirty === 'function') markDirty();
      return 'All founder stats = 100 (v11.2 max)';
    }, 'Max out all four founder stats to 100'),

    bumpStats: cmd((n) => {
      if (!S.founder || !S.founder.stats) return 'No founder.';
      n = typeof n === 'number' ? n : 10;
      for (const k of AXES) S.founder.stats[k] = Math.max(1, Math.min(100, (S.founder.stats[k] || 0) + n));
      if (typeof markDirty === 'function') markDirty();
      return 'All founder stats +' + n + ' → ' + JSON.stringify(S.founder.stats);
    }, 'Bump every founder stat by n (default 10). Example: dbg.bumpStats(20)'),

    setMorale: cmd((n) => {
      if (!S.founder) return 'No founder.';
      n = Math.max(0, Math.min(100, typeof n === 'number' ? n : 70));
      S.founder.morale = n;
      if (Array.isArray(S.employees)) for (const e of S.employees) e.morale = n;
      if (typeof markDirty === 'function') markDirty();
      return 'Morale set to ' + n + ' on founder + ' + (S.employees?.length || 0) + ' employees';
    }, 'Set morale on whole team. Example: dbg.setMorale(85)'),

    // ---------- Employees ----------
    employees: cmd(() => {
      const list = S.employees || [];
      if (!list.length) return 'No employees hired.';
      return list.map(e => ({
        name: e.name, specialty: e.specialty, tier: e.tierName,
        stats: e.stats, salary: '$' + (e.salary || 0).toLocaleString(),
        morale: e.morale, traits: e.traits, exp: e.exp, assigned: e.assignedProjectId,
      }));
    }, 'List all employees with stats + salaries'),

    hireSquad: cmd((n, tier) => {
      if (!window.tycoonEmployees) return 'tycoonEmployees not loaded.';
      n = typeof n === 'number' ? n : 3;
      const hired = [];
      for (let i = 0; i < n; i++) {
        const opts = typeof tier === 'number' ? { tier } : {};
        const c = window.tycoonEmployees.generateCandidate(opts);
        c.interviewed = true;
        c.stats = c.hiddenStats;
        c.traits = [c.visibleTrait, c.hiddenTrait].filter(Boolean);
        c.personality = c.hiddenPersonality;
        const e = window.tycoonEmployees.hire(c);
        hired.push(e.name + ' (' + e.tierName + ', ' + e.specialty + ')');
      }
      return 'Hired ' + hired.length + ': ' + hired.join(', ');
    }, 'Hire N random candidates. Example: dbg.hireSquad(5, 3) = 5 Seniors'),

    fireAll: cmd(() => {
      const n = (S.employees || []).length;
      S.employees = [];
      if (typeof markDirty === 'function') markDirty();
      return 'Fired ' + n + ' employees';
    }, 'Fire every employee (founder stays)'),

    // ---------- Research ----------
    addRP: cmd((n) => {
      n = typeof n === 'number' ? n : 100;
      const ip = S.research?.inProgress;
      if (!ip) return 'No research in progress. Start one first from the Research panel.';
      ip.rpEarned = (ip.rpEarned || 0) + n;
      if (typeof markDirty === 'function') markDirty();
      return 'Current research +' + n + ' RP → ' + ip.rpEarned.toFixed(1);
    }, 'Add RP to current research. Example: dbg.addRP(500)'),

    completeResearch: cmd((id) => {
      if (!window.tycoonResearch) return 'tycoonResearch not loaded.';
      if (!id) {
        // List available node IDs
        return 'Usage: dbg.completeResearch("n_2d_sprites"). IDs: ' +
          window.tycoonResearch.NODES.slice(0, 8).map(n => n.id).join(', ') + ', …';
      }
      const node = window.tycoonResearch.NODE_BY_ID[id];
      if (!node) return 'Unknown node id: ' + id;
      window.tycoonResearch.complete(id);
      return 'Completed: ' + node.name;
    }, 'Complete a specific research node by id'),

    completeAllResearch: cmd(() => {
      if (!window.tycoonResearch) return 'tycoonResearch not loaded.';
      if (!S.research) S.research = { completed: [], inProgress: null };
      let added = 0;
      for (const n of window.tycoonResearch.NODES) {
        if (!S.research.completed.includes(n.id)) { S.research.completed.push(n.id); added++; }
      }
      if (typeof markDirty === 'function') markDirty();
      return 'Completed all research (+' + added + ' nodes)';
    }, 'Instantly complete every research node'),

    // ---------- Time / calendar ----------
    advanceWeeks: cmd((n) => {
      if (!window.tycoonTime) return 'tycoonTime not loaded.';
      n = typeof n === 'number' ? n : 1;
      for (let i = 0; i < n; i++) window.tycoonTime.step();
      return 'Advanced ' + n + ' week(s) → ' + (S.calendar?.year) + '-W' + (S.calendar?.week);
    }, 'Advance the tycoon calendar by N weeks. Example: dbg.advanceWeeks(12)'),

    setYear: cmd((year) => {
      if (!S.calendar) return 'No calendar (start a career first).';
      S.calendar.year = Math.max(1980, year | 0);
      if (typeof markDirty === 'function') markDirty();
      return 'Calendar year set to ' + S.calendar.year;
    }, 'Set the tycoon calendar year. Example: dbg.setYear(2000)'),

    // Legacy clicker-era year jump — still works when playing a clicker save.
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
    }, 'Clicker-era year jump. Example: dbg.jumpYear(2000)'),

    // ---------- Clicker-era (legacy — still functional) ----------
    setLoc: cmd((n) => {
      S.loc = n; S.tLoc = Math.max(S.tLoc, n);
      if (typeof markDirty === 'function') markDirty();
      return 'loc = ' + n;
    }, 'Set lines of code. Clicker-era. Example: dbg.setLoc(1e9)'),

    ship: cmd(() => {
      if (typeof canShip === 'function' && !canShip()) {
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
    }, 'Force-ship the next clicker release'),

    unlockAllAch: cmd(() => {
      if (!Array.isArray(S.ach)) S.ach = [];
      for (const a of ACHIEVEMENTS) if (!S.ach.includes(a.id)) S.ach.push(a.id);
      if (typeof markDirty === 'function') markDirty();
      return 'Unlocked ' + S.ach.length + '/' + ACHIEVEMENTS.length + ' achievements';
    }, 'Unlock every achievement'),

    revealAll: cmd(() => {
      if (typeof ENG_TYPES !== 'undefined') {
        S.unlockedTypes = ENG_TYPES.map(e => e.key);
      }
      if (typeof markDirty === 'function') markDirty();
      if (typeof renderTypeTabs === 'function') renderTypeTabs();
      if (typeof renderShipPanel === 'function') renderShipPanel();
      return 'All engineer types unlocked';
    }, 'Unlock all engineer types (clicker-era)'),

    forceEvent: cmd((name) => {
      if (typeof EVENTS === 'undefined') return 'EVENTS not defined';
      const ev = EVENTS.find(e => e.name?.toLowerCase() === (name || '').toLowerCase());
      if (!ev) return 'Event not found. Available: ' + EVENTS.map(e => e.name).join(', ');
      if (typeof triggerEvent === 'function') { triggerEvent(ev); return 'Triggered: ' + ev.name; }
      return 'triggerEvent() not available in this build';
    }, 'Trigger named event. Example: dbg.forceEvent("Spaghetti Code")'),

    // ---------- Save I/O ----------
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
      if (hasTycoon() && typeof mult === 'number') {
        window.tycoonTime.setSpeed(mult);
        return 'Tycoon speed = ' + mult + '×';
      }
      if (typeof window.__speedMult !== 'undefined') {
        window.__speedMult = mult;
        return 'Clicker speed = ' + mult + '×';
      }
      return 'No speed control available';
    }, 'Set game speed (tycoon: 0/1/2/4/8; clicker: any multiplier)'),
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
