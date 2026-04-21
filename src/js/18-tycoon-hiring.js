// ========== TYCOON HIRING MARKET (v11.1) ==========
// v11.1: replaced the quarterly Hiring Fair with a rolling Talent Market.
// Instead of 4-8 candidates dumping all at once every 12 weeks (and auto-
// opening a modal), one candidate trickles in every CANDIDATE_INTERVAL_WEEKS
// until the queue caps. Player checks the Hiring button whenever they want.
// Future phases (Recruiter upgrades) will let the player accelerate this
// rate and filter by specialty. See the v11.1-polish brainstorm for the roadmap.
(function(){
  'use strict';

  const CANDIDATE_INTERVAL_WEEKS = 2;   // one new candidate every 2 weeks
  const INITIAL_INTERVAL_WEEKS = 2;     // first candidate arrives this many weeks after career start
  const MAX_QUEUE = 6;                  // stop generating once we hit this; resumes as candidates expire/hire
  const CANDIDATE_LIFETIME_WEEKS = 8;   // how long a candidate stays on the market
  const INTERVIEW_COST = 1000;
  const INTERVIEW_WEEKS = 1;            // 1 game-week to "interview"
  // Legacy compat — external callers / hints still reference FAIR_INTERVAL_WEEKS
  const FAIR_INTERVAL_WEEKS = CANDIDATE_INTERVAL_WEEKS;

  let _weeksUntilNextCandidate = INITIAL_INTERVAL_WEEKS;

  // ---------- Candidate queue ----------
  // Lives in S.hiring.queue so it persists with save
  function ensureState() {
    if (!S.hiring) S.hiring = { queue: [], fairIndex: 0, lastViewedAtWeek: 0 };
    if (!Array.isArray(S.hiring.queue)) S.hiring.queue = [];
    if (typeof S.hiring.lastViewedAtWeek !== 'number') S.hiring.lastViewedAtWeek = 0;
  }

  // Public helper for the UI so it can mark "seen" when the player opens the
  // modal — drives the new-candidate badge on the Hiring button.
  function markMarketViewed() {
    ensureState();
    S.hiring.lastViewedAtWeek = (window.tycoonProjects?.absoluteWeek?.() || 0);
    if (typeof markDirty === 'function') markDirty();
  }
  function newCandidatesSinceView() {
    ensureState();
    const cutoff = S.hiring.lastViewedAtWeek || 0;
    return S.hiring.queue.filter(c => (c.offeredAtWeek || 0) > cutoff).length;
  }

  function generateCandidateInMarket() {
    ensureState();
    if (S.hiring.queue.length >= MAX_QUEUE) return null;
    const c = window.tycoonEmployees.generateCandidate();
    c.fairId = ++S.hiring.fairIndex;  // still a unique id per candidate
    c.offeredAtWeek = window.tycoonProjects.absoluteWeek();
    c.expiresAtWeek = c.offeredAtWeek + CANDIDATE_LIFETIME_WEEKS;
    S.hiring.queue.push(c);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('💼 New candidate on the market: ' + c.name + ' (' + c.tierName + ' · ' + c.specialty + ')');
    // Event name kept as 'tycoon:hiring-fair' for backwards compat with the
    // hint system (first-fair tutorial) even though the semantics are now
    // "a candidate arrived." UI listener shows a toast but does NOT auto-
    // open the modal — player decides when to engage.
    document.dispatchEvent(new CustomEvent('tycoon:hiring-fair', {
      detail: { fairId: c.fairId, candidates: [c] }
    }));
    return c;
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
    _weeksUntilNextCandidate -= 1;
    if (_weeksUntilNextCandidate <= 0) {
      generateCandidateInMarket();
      _weeksUntilNextCandidate = CANDIDATE_INTERVAL_WEEKS;
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

  // Force-generate a candidate (for debug)
  function forceFair() {
    _weeksUntilNextCandidate = 0;
    return generateCandidateInMarket();
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
    markMarketViewed,
    newCandidatesSinceView,
    INTERVIEW_COST,
    CANDIDATE_INTERVAL_WEEKS,
    CANDIDATE_LIFETIME_WEEKS,
    MAX_QUEUE,
    FAIR_INTERVAL_WEEKS,  // legacy alias
    state() {
      ensureState();
      return {
        queue: S.hiring.queue,
        weeksUntilNextCandidate: _weeksUntilNextCandidate,
        newSinceView: newCandidatesSinceView(),
      };
    }
  };
  if (window.dbg) window.dbg.hiring = window.tycoonHiring;

  console.log('[tycoon-hiring] module loaded. Rolling market: 1 candidate every ' + CANDIDATE_INTERVAL_WEEKS + ' weeks, queue caps at ' + MAX_QUEUE + '.');
})();
