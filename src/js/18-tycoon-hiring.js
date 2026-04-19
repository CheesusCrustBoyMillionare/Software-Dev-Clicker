// ========== TYCOON HIRING FAIR (v2) ==========
// Phase 2B: Quarterly Hiring Fair that generates 4-8 candidates at once.
// Player can Interview / Hire Now / Negotiate / Pass / Hold per candidate.
(function(){
  'use strict';

  const FAIR_INTERVAL_WEEKS = 12;       // quarterly
  const MIN_CANDIDATES = 4;
  const MAX_CANDIDATES = 8;
  const INTERVIEW_COST = 1000;
  const INTERVIEW_WEEKS = 1;            // 1 game-week to "interview"

  // First fair fires early in career to get the player moving
  let _weeksUntilNextFair = 6;

  // ---------- Candidate queue ----------
  // Lives in S.hiring.queue so it persists with save
  function ensureState() {
    if (!S.hiring) S.hiring = { queue: [], fairIndex: 0 };
    if (!Array.isArray(S.hiring.queue)) S.hiring.queue = [];
  }

  function generateFair() {
    ensureState();
    const count = MIN_CANDIDATES + Math.floor(Math.random() * (MAX_CANDIDATES - MIN_CANDIDATES + 1));
    const fairId = ++S.hiring.fairIndex;
    const candidates = [];
    for (let i = 0; i < count; i++) {
      const c = window.tycoonEmployees.generateCandidate();
      c.fairId = fairId;
      c.offeredAtWeek = window.tycoonProjects.absoluteWeek();
      c.expiresAtWeek = c.offeredAtWeek + FAIR_INTERVAL_WEEKS; // disappears when next fair arrives
      candidates.push(c);
    }
    S.hiring.queue.push(...candidates);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🎪 Hiring Fair: ' + count + ' candidates available');
    document.dispatchEvent(new CustomEvent('tycoon:hiring-fair', { detail: { fairId, candidates } }));
    return candidates;
  }

  // ---------- Cleanup expired candidates ----------
  function cleanupExpired() {
    if (!S.hiring || !S.hiring.queue) return;
    const currentWeek = window.tycoonProjects.absoluteWeek();
    const before = S.hiring.queue.length;
    S.hiring.queue = S.hiring.queue.filter(c => c.expiresAtWeek > currentWeek);
    const expired = before - S.hiring.queue.length;
    if (expired > 0 && typeof log === 'function') {
      log('📪 ' + expired + ' candidate' + (expired > 1 ? 's' : '') + ' left the market');
    }
  }

  // ---------- Tick integration ----------
  function onWeekTick() {
    ensureState();
    cleanupExpired();
    _weeksUntilNextFair -= 1;
    if (_weeksUntilNextFair <= 0) {
      generateFair();
      _weeksUntilNextFair = FAIR_INTERVAL_WEEKS;
    }
  }

  let _unsub = null;
  function startHiringTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[hiring] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopHiringTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Player actions ----------
  function interviewOffer(candidateId) {
    ensureState();
    const c = S.hiring.queue.find(x => x.id === candidateId);
    if (!c) return { ok: false, error: 'Candidate not found' };
    if (c.interviewed) return { ok: true, candidate: c };
    if ((S.cash || 0) < INTERVIEW_COST) return { ok: false, error: 'Not enough cash for interview ($' + INTERVIEW_COST + ')' };
    // Charge + reveal
    S.cash -= INTERVIEW_COST;
    S.tExpenses = (S.tExpenses || 0) + INTERVIEW_COST;
    window.tycoonEmployees.interviewCandidate(c);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('👥 Interviewed ' + c.name + ' ($1K)');
    document.dispatchEvent(new CustomEvent('tycoon:candidate-interviewed', { detail: { candidateId } }));
    return { ok: true, candidate: c };
  }

  function hireOffer(candidateId) {
    ensureState();
    const c = S.hiring.queue.find(x => x.id === candidateId);
    if (!c) return { ok: false, error: 'Candidate not found' };
    // Check cash for first biweekly payroll (safety)
    const firstPayCost = Math.ceil(c.askingSalary * (2/48));
    if ((S.cash || 0) < firstPayCost) {
      return { ok: false, error: 'Need ' + firstPayCost + ' cash to cover first biweekly pay' };
    }
    const emp = window.tycoonEmployees.hire(c);
    // Remove from queue
    S.hiring.queue = S.hiring.queue.filter(x => x.id !== candidateId);
    if (typeof markDirty === 'function') markDirty();
    return { ok: true, employee: emp };
  }

  function negotiateOffer(candidateId, aggressiveness) {
    ensureState();
    const c = S.hiring.queue.find(x => x.id === candidateId);
    if (!c) return { ok: false, error: 'Candidate not found' };
    if (c.negotiated) return { ok: false, error: 'Already negotiated once' };
    const result = window.tycoonEmployees.negotiateCandidate(c, aggressiveness);
    if (result.outcome === 'walked') {
      // They walked away — remove from queue
      S.hiring.queue = S.hiring.queue.filter(x => x.id !== candidateId);
      if (typeof log === 'function') log('💨 ' + c.name + ' walked away from negotiation');
      if (typeof markDirty === 'function') markDirty();
      return { ok: true, outcome: 'walked', candidateName: c.name };
    }
    c.negotiated = true;
    if (typeof log === 'function') log('✓ Negotiated ' + c.name + ' down to $' + c.askingSalary.toLocaleString());
    if (typeof markDirty === 'function') markDirty();
    return { ok: true, outcome: 'accepted', candidate: c };
  }

  function passOffer(candidateId) {
    ensureState();
    S.hiring.queue = S.hiring.queue.filter(x => x.id !== candidateId);
    if (typeof markDirty === 'function') markDirty();
    document.dispatchEvent(new CustomEvent('tycoon:candidate-passed', { detail: { candidateId } }));
  }

  // Force-generate a fair (for debug)
  function forceFair() {
    _weeksUntilNextFair = 0;
    return generateFair();
  }

  // ---------- Public API ----------
  window.tycoonHiring = {
    interview: interviewOffer,
    hire: hireOffer,
    negotiate: negotiateOffer,
    pass: passOffer,
    startTick: startHiringTick,
    stopTick: stopHiringTick,
    forceFair,
    INTERVIEW_COST,
    FAIR_INTERVAL_WEEKS,
    state() {
      ensureState();
      return {
        queue: S.hiring.queue,
        weeksUntilNextFair: _weeksUntilNextFair
      };
    }
  };
  if (window.dbg) window.dbg.hiring = window.tycoonHiring;

  console.log('[tycoon-hiring] module loaded. Fair interval: ' + FAIR_INTERVAL_WEEKS + ' weeks.');
})();
