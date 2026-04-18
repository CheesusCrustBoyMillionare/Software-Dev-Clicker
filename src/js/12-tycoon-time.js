// ========== TYCOON TIME SYSTEM (v2) ==========
// Game-week-based ticker, separate from the v1 clicker runtime loop.
// Phase 1B builds this; Phase 1F will retire the clicker loop entirely.
// 10 real min = 1 game year → 50 sec/month → 12.5 sec/week at 1× speed.
(function(){
  'use strict';

  // Base tick interval at 1× speed (milliseconds per game week)
  const BASE_TICK_MS = 12500;

  // State
  let _tickTimer = null;
  let _running = false;
  let _listeners = []; // Array of { id, fn }
  let _nextListenerId = 1;
  let _wasRunningBeforeBlur = false;

  // Speed presets. Tycoon speeds: 1, 2, 4, 8. Speed 0 = paused.
  const SPEED_MULTIPLIERS = { 0: 0, 1: 1, 2: 2, 4: 4, 8: 8 };

  function currentTickMs() {
    const sp = (S && typeof S.speed === 'number') ? S.speed : 1;
    const mult = SPEED_MULTIPLIERS[sp] || 1;
    if (mult <= 0) return BASE_TICK_MS; // paused — interval doesn't matter
    return BASE_TICK_MS / mult;
  }

  // Format calendar for display: "Week 12, 1985" style
  function formatCalendar(cal) {
    if (!cal) return '—';
    // Convert week-within-month (1-4) + month (1-12) to absolute week of year (1-48)
    const weekOfYear = (cal.month - 1) * 4 + cal.week;
    return 'Week ' + weekOfYear + ', ' + cal.year;
  }

  // Advance calendar by 1 week
  function advanceOneWeek() {
    const c = S.calendar;
    if (!c) return;
    c.week += 1;
    if (c.week > 4) {
      c.week = 1;
      c.month += 1;
      if (c.month > 12) {
        c.month = 1;
        c.year += 1;
      }
    }
  }

  // Dispatch tick event to all listeners
  function dispatchTick() {
    for (const l of _listeners) {
      try { l.fn(S.calendar); }
      catch (e) { console.error('[tycoon-time] listener ' + l.id + ' threw:', e); }
    }
  }

  // The tick loop itself
  function tick() {
    if (!_running) return;
    const paused = (S.paused === true) || (S.speed === 0);
    if (!paused) {
      advanceOneWeek();
      dispatchTick();
    }
    // Schedule next tick
    _tickTimer = setTimeout(tick, currentTickMs());
  }

  // Public API
  const time = {
    // Start the ticker. Safe to call multiple times.
    start() {
      if (_running) return;
      _running = true;
      // First tick after the current interval (not immediate)
      _tickTimer = setTimeout(tick, currentTickMs());
      console.info('[tycoon-time] started at speed ' + (S.speed || 1) + '×');
    },

    // Stop the ticker.
    stop() {
      _running = false;
      if (_tickTimer) { clearTimeout(_tickTimer); _tickTimer = null; }
      console.info('[tycoon-time] stopped');
    },

    // Check if running
    isRunning() { return _running; },

    // Set speed (0/1/2/4/8). Takes effect at next tick boundary.
    setSpeed(n) {
      if (!(n in SPEED_MULTIPLIERS)) {
        console.warn('[tycoon-time] invalid speed: ' + n);
        return;
      }
      S.speed = n;
      if (typeof markDirty === 'function') markDirty();
      console.info('[tycoon-time] speed = ' + n + '×' + (n === 0 ? ' (paused)' : ''));
      // If timer is pending, reschedule with new interval
      if (_running && _tickTimer) {
        clearTimeout(_tickTimer);
        _tickTimer = setTimeout(tick, currentTickMs());
      }
    },

    // Toggle pause. Separate from speed=0 — user-initiated pause.
    togglePause() {
      S.paused = !S.paused;
      if (typeof markDirty === 'function') markDirty();
      console.info('[tycoon-time] paused = ' + S.paused);
    },

    // Advance one week manually (debug / step-through testing)
    step() {
      advanceOneWeek();
      dispatchTick();
    },

    // Subscribe to tick events. Returns an unsubscribe function.
    onTick(fn) {
      const id = _nextListenerId++;
      _listeners.push({ id, fn });
      return function unsubscribe() {
        _listeners = _listeners.filter(l => l.id !== id);
      };
    },

    // Inspect current state
    state() {
      return {
        running: _running,
        speed: S.speed,
        paused: S.paused,
        calendar: S.calendar,
        formatted: formatCalendar(S.calendar),
        listeners: _listeners.length,
        tickMs: currentTickMs()
      };
    },

    // Utility
    formatCalendar
  };

  // Expose globally
  window.tycoonTime = time;

  // Tab blur handling — pause when tab is hidden (T4a default)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (_running && !S.paused) {
        _wasRunningBeforeBlur = true;
        S.paused = true;
      }
    } else {
      if (_wasRunningBeforeBlur) {
        S.paused = false;
        _wasRunningBeforeBlur = false;
      }
    }
  });

  // Keyboard shortcuts: 0=pause, 1=1×, 2=2×, 3=4×, 4=8×
  // Only fire when the tycoon ticker is running (avoids conflicts with other inputs)
  document.addEventListener('keydown', (e) => {
    if (!_running) return;
    // Ignore when typing in inputs/textareas/contenteditable
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    // Ignore with modifiers
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

    if (e.key === '0') { time.setSpeed(0); e.preventDefault(); }
    else if (e.key === '1') { time.setSpeed(1); e.preventDefault(); }
    else if (e.key === '2') { time.setSpeed(2); e.preventDefault(); }
    else if (e.key === '3') { time.setSpeed(4); e.preventDefault(); }
    else if (e.key === '4') { time.setSpeed(8); e.preventDefault(); }
    else if (e.key === ' ' && !e.repeat) { time.togglePause(); e.preventDefault(); }
  });

  // Expose time helpers on dbg console too
  if (window.dbg) {
    window.dbg.time = time;
    console.log('[tycoon-time] module loaded. Call %cdbg.time.start()%c to begin ticking.',
      'color:#f0883e;font-weight:bold', 'color:inherit');
  }
})();
