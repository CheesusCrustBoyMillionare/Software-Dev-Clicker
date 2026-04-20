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

  // Fraction-of-week progress (0..1). Advances when not paused, resets on each
  // week tick. This is the single source of truth for where we are within the
  // current week — both the setTimeout scheduler and the UI progress bar read
  // from it so speed changes don't reset mid-week progress.
  let _weekFraction = 0;
  let _lastScheduledAt = 0;  // performance.now() when current setTimeout was scheduled
  let _lastScheduledMs = 0;  // duration the current setTimeout was scheduled for

  // Modal pause counter. Each UI modal that auto-pauses the game calls
  // pushModalPause() on open and popModalPause() on close. This is a
  // reference count so nested modals (e.g. an MC decision opening while
  // the hiring fair is up) don't pollute S.paused. S.paused stays clean
  // as "user intent only"; the effective pause = S.paused || counter > 0.
  let _modalPauseCount = 0;

  function currentTickMs() {
    const sp = (S && typeof S.speed === 'number') ? S.speed : 1;
    const mult = SPEED_MULTIPLIERS[sp] || 1;
    if (mult <= 0) return BASE_TICK_MS; // paused — interval doesn't matter
    return BASE_TICK_MS / mult;
  }

  function isPausedNow() {
    return S.paused === true || S.speed === 0 || _modalPauseCount > 0;
  }

  // Roll accumulated real time into _weekFraction. Call this whenever the
  // speed or pause state is about to change, so the fraction reflects
  // progress made at the OLD rate before we start counting at the NEW rate.
  function advanceFractionFromClock() {
    if (!_running || isPausedNow() || _lastScheduledAt === 0 || _lastScheduledMs === 0) return;
    const now = performance.now();
    const dt = now - _lastScheduledAt;
    _weekFraction = Math.min(1, _weekFraction + dt / _lastScheduledMs);
    _lastScheduledAt = now;
  }

  // Schedule the next tick honoring _weekFraction. The timeout fires in
  // (1 - fraction) × newTickMs ms. When paused, cancels the timer entirely
  // — it'll be rescheduled on unpause.
  function rescheduleTick() {
    if (_tickTimer) { clearTimeout(_tickTimer); _tickTimer = null; }
    if (!_running) return;
    if (isPausedNow()) {
      // No pending timer while paused — freezes progress until unpaused
      _lastScheduledAt = 0;
      _lastScheduledMs = 0;
      return;
    }
    const tickMs = currentTickMs();
    const remainingMs = Math.max(0, (1 - _weekFraction) * tickMs);
    _lastScheduledAt = performance.now();
    _lastScheduledMs = tickMs;
    _tickTimer = setTimeout(tick, remainingMs);
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
    // Guard: if we somehow fire while paused (shouldn't happen — rescheduleTick
    // cancels the timer on pause — but handle gracefully), just re-schedule.
    if (isPausedNow()) { rescheduleTick(); return; }
    advanceOneWeek();
    dispatchTick();
    _weekFraction = 0;
    rescheduleTick();
  }

  // Public API
  const time = {
    // Start the ticker. Safe to call multiple times.
    start() {
      if (_running) return;
      _running = true;
      _weekFraction = 0;
      rescheduleTick();
      console.info('[tycoon-time] started at speed ' + (S.speed || 1) + '×');
    },

    // Stop the ticker.
    stop() {
      _running = false;
      if (_tickTimer) { clearTimeout(_tickTimer); _tickTimer = null; }
      _lastScheduledAt = 0;
      _lastScheduledMs = 0;
      // Reset modal pause counter — any modals left open when we exit
      // should not bleed their pause state into the next tycoon session.
      _modalPauseCount = 0;
      console.info('[tycoon-time] stopped');
    },

    // Check if running
    isRunning() { return _running; },

    // Set speed (0/1/2/4/8). Preserves mid-week progress — if you switch
    // from 1× to 2× when 40% through a week, you'll still be 40% through
    // a (now shorter) week and fire the next tick in the remaining 60%
    // rather than starting a fresh interval.
    setSpeed(n) {
      if (!(n in SPEED_MULTIPLIERS)) {
        console.warn('[tycoon-time] invalid speed: ' + n);
        return;
      }
      advanceFractionFromClock();
      S.speed = n;
      if (typeof markDirty === 'function') markDirty();
      console.info('[tycoon-time] speed = ' + n + '×' + (n === 0 ? ' (paused)' : ''));
      rescheduleTick();
      document.dispatchEvent(new CustomEvent('tycoon:speed-changed', { detail: { speed: n } }));
    },

    // Toggle pause. Separate from speed=0 — user-initiated pause. Freezes
    // mid-week progress until unpaused.
    togglePause() {
      advanceFractionFromClock();
      S.paused = !S.paused;
      if (typeof markDirty === 'function') markDirty();
      console.info('[tycoon-time] paused = ' + S.paused);
      rescheduleTick();
      document.dispatchEvent(new CustomEvent('tycoon:pause-toggled', { detail: { paused: S.paused } }));
    },

    // Modal-pause ref counter. Call pushModalPause() when opening a modal
    // that should freeze the game; call popModalPause() exactly once when
    // the modal closes. Unlike writing S.paused directly, this nests
    // correctly across overlapping modals and leaves the player's own
    // pause intent (S.paused) untouched.
    pushModalPause() {
      advanceFractionFromClock();
      _modalPauseCount++;
      if (_modalPauseCount === 1) rescheduleTick();  // transitioned to paused
    },

    popModalPause() {
      if (_modalPauseCount <= 0) {
        console.warn('[tycoon-time] popModalPause called with count already at 0 — ignoring');
        return;
      }
      advanceFractionFromClock();
      _modalPauseCount--;
      if (_modalPauseCount === 0) rescheduleTick();  // transitioned back
    },

    // Inspect modal pause count (useful for diagnostics / tests)
    modalPauseCount() { return _modalPauseCount; },

    // Advance one week manually (debug / step-through testing)
    step() {
      advanceOneWeek();
      dispatchTick();
      _weekFraction = 0;
      if (_running) rescheduleTick();
    },

    // Live 0..1 fraction of current week elapsed. UI progress bars read
    // this directly — it stays continuous across speed changes.
    weekFraction() {
      if (!_running || isPausedNow() || _lastScheduledAt === 0 || _lastScheduledMs === 0) {
        return _weekFraction;
      }
      const now = performance.now();
      const dt = now - _lastScheduledAt;
      return Math.min(1, _weekFraction + dt / _lastScheduledMs);
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
        tickMs: currentTickMs(),
        weekFraction: _weekFraction,
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
        advanceFractionFromClock();
        _wasRunningBeforeBlur = true;
        S.paused = true;
        rescheduleTick();
      }
    } else {
      if (_wasRunningBeforeBlur) {
        advanceFractionFromClock();  // no-op when paused, but safe
        S.paused = false;
        _wasRunningBeforeBlur = false;
        rescheduleTick();
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
