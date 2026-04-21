// ========== TYCOON HIRING MARKET (v11.1) ==========
// v11.1: replaced the quarterly Hiring Fair with a rolling Talent Market.
// Instead of 4-8 candidates dumping all at once every 12 weeks (and auto-
// opening a modal), one candidate trickles in every CANDIDATE_INTERVAL_WEEKS
// until the queue caps. Player checks the Hiring button whenever they want.
// Future phases (Recruiter upgrades) will let the player accelerate this
// rate and filter by specialty. See the v11.1-polish brainstorm for the roadmap.
(function(){
  'use strict';

  const BASE_CANDIDATE_INTERVAL_WEEKS = 2;  // default rate with no recruiter
  const INITIAL_INTERVAL_WEEKS = 2;     // first candidate arrives this many weeks after career start
  const MAX_QUEUE = 6;                  // stop generating once we hit this; resumes as candidates expire/hire
  const CANDIDATE_LIFETIME_WEEKS = 6;   // how long a candidate stays on the market (v11.1 reduced from 8)
  const INTERVIEW_COST = 1000;
  const INTERVIEW_WEEKS = 1;            // 1 game-week to "interview"
  // Legacy compat — external callers / hints still reference FAIR_INTERVAL_WEEKS
  const FAIR_INTERVAL_WEEKS = BASE_CANDIDATE_INTERVAL_WEEKS;

  // ---------- Recruiter tiers (v11.1 Phase 2) ----------
  // The Recruiter is a support role (not in S.employees — they don't contribute
  // to projects). Each tier scales candidate flow and unlocks hiring features.
  // Annual salary flows through tycoonEmployees.weeklyBurn so it shows up in
  // runway + Finance consistently.
  const RECRUITER_TIERS = [
    {
      tier: 0,
      name: 'None',
      icon: '',
      annualSalary: 0,
      intervalWeeks: BASE_CANDIDATE_INTERVAL_WEEKS,
      filterBySpecialty: false,
      postRequisitions: false,
      referrals: false,
      poaching: false,
      desc: 'No recruiter. One candidate appears every 2 weeks from the open market.',
    },
    {
      tier: 1,
      name: 'Recruiter',
      icon: '\uD83D\uDC64',
      annualSalary: 50000,   // ~$4.2K/month
      intervalWeeks: 1,      // candidate flow doubled
      candidatesPerTick: 1,
      filterBySpecialty: true,
      postRequisitions: false,
      referrals: false,
      poaching: false,
      desc: 'A dedicated recruiter doubles candidate flow and lets you filter the market by specialty.',
    },
    {
      tier: 2,
      name: 'Head of People',
      icon: '\uD83C\uDFE2',
      annualSalary: 180000,  // ~$15K/month
      intervalWeeks: 1,
      candidatesPerTick: 2,  // 2 candidates per week → effective 2/wk flow
      filterBySpecialty: true,
      postRequisitions: true,
      referrals: false,
      poaching: false,
      desc: 'A full-time hiring lead. 2 candidates per week AND you can post requisitions targeting a specific specialty + tier — matched applicants trickle in over the req\u2019s lifetime.',
    },
    {
      tier: 3,
      name: 'Executive Recruiter',
      icon: '\uD83C\uDFC6',
      annualSalary: 480000,  // ~$40K/month
      intervalWeeks: 1,
      candidatesPerTick: 2,
      filterBySpecialty: true,
      postRequisitions: true,
      referrals: true,       // happy employees refer candidates from their network
      poaching: true,        // failing rivals' employees leak into the market
      desc: 'An elite talent operator. Adds two new candidate streams: referrals from your happy employees (morale 80+) and poaching ex-talent from failing rival studios.',
    },
  ];
  const RECRUITER_BY_TIER = Object.fromEntries(RECRUITER_TIERS.map(r => [r.tier, r]));

  function currentRecruiter() {
    return RECRUITER_BY_TIER[(S.hiring?.recruiterTier) || 0] || RECRUITER_TIERS[0];
  }

  let _weeksUntilNextCandidate = INITIAL_INTERVAL_WEEKS;

  // ---------- Candidate queue ----------
  // Lives in S.hiring.queue so it persists with save
  const MAX_ACTIVE_REQS = 3;
  const REQ_DEFAULT_DURATION_WEEKS = 6;
  // Probability that a new candidate is tailored to an active req (vs. random)
  const REQ_MATCH_PROB = 0.6;

  function ensureState() {
    if (!S.hiring) S.hiring = { queue: [], fairIndex: 0, lastViewedAtWeek: 0, recruiterTier: 0, specialtyFilter: null, requisitions: [], outsideOffers: [] };
    if (!Array.isArray(S.hiring.queue)) S.hiring.queue = [];
    if (typeof S.hiring.lastViewedAtWeek !== 'number') S.hiring.lastViewedAtWeek = 0;
    if (typeof S.hiring.recruiterTier !== 'number') S.hiring.recruiterTier = 0;
    if (!Array.isArray(S.hiring.requisitions)) S.hiring.requisitions = [];
    if (!Array.isArray(S.hiring.outsideOffers)) S.hiring.outsideOffers = [];
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

    // If an active req exists AND current recruiter can post reqs, the
    // candidate is weighted toward matching a random active req.
    let matchedReq = null;
    const reqs = S.hiring.requisitions || [];
    const canPost = !!currentRecruiter().postRequisitions;
    const opts = {};
    if (canPost && reqs.length > 0 && Math.random() < REQ_MATCH_PROB) {
      matchedReq = reqs[Math.floor(Math.random() * reqs.length)];
      if (matchedReq.specialty) opts.specialty = matchedReq.specialty;
      if (typeof matchedReq.tier === 'number') opts.tier = matchedReq.tier;
    }

    const c = window.tycoonEmployees.generateCandidate(opts);
    c.fairId = ++S.hiring.fairIndex;
    c.offeredAtWeek = window.tycoonProjects.absoluteWeek();
    c.expiresAtWeek = c.offeredAtWeek + CANDIDATE_LIFETIME_WEEKS;
    if (matchedReq) {
      c.reqId = matchedReq.id;
      matchedReq.matchedCount = (matchedReq.matchedCount || 0) + 1;
    }
    S.hiring.queue.push(c);
    if (typeof markDirty === 'function') markDirty();
    const tag = matchedReq ? ' [matches req]' : '';
    if (typeof log === 'function') log('💼 New candidate: ' + c.name + ' (' + c.tierName + ' · ' + c.specialty + ')' + tag);
    // Event name kept as 'tycoon:hiring-fair' for backwards compat with the
    // hint system (first-fair tutorial) even though the semantics are now
    // "a candidate arrived." UI listener shows a toast but does NOT auto-
    // open the modal — player decides when to engage.
    document.dispatchEvent(new CustomEvent('tycoon:hiring-fair', {
      detail: { fairId: c.fairId, candidates: [c], matchedReq: matchedReq?.id || null }
    }));
    return c;
  }

  // ---------- Requisitions (Phase 3) ----------
  function postRequisition(cfg) {
    ensureState();
    if (!currentRecruiter().postRequisitions) {
      return { ok: false, error: 'Requires a Head of People on staff' };
    }
    if ((S.hiring.requisitions || []).length >= MAX_ACTIVE_REQS) {
      return { ok: false, error: 'Max ' + MAX_ACTIVE_REQS + ' active requisitions — close one first' };
    }
    if (!cfg || !cfg.specialty || typeof cfg.tier !== 'number') {
      return { ok: false, error: 'Specialty and tier required' };
    }
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const durationWeeks = cfg.durationWeeks || REQ_DEFAULT_DURATION_WEEKS;
    const req = {
      id: 'req_' + (S.hiring.fairIndex++ + 1).toString(36) + '_' + (currentWeek % 997),
      specialty: cfg.specialty,
      tier: cfg.tier,
      targetSalary: cfg.targetSalary || null,
      postedAtWeek: currentWeek,
      expiresAtWeek: currentWeek + durationWeeks,
      durationWeeks,
      matchedCount: 0,
    };
    S.hiring.requisitions.push(req);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('📋 Posted requisition: ' + cfg.specialty + ' · tier ' + cfg.tier + ' (' + durationWeeks + ' weeks)');
    document.dispatchEvent(new CustomEvent('tycoon:req-posted', { detail: { req } }));
    return { ok: true, req };
  }

  function closeRequisition(reqId) {
    ensureState();
    S.hiring.requisitions = (S.hiring.requisitions || []).filter(r => r.id !== reqId);
    if (typeof markDirty === 'function') markDirty();
  }

  function cleanupExpiredRequisitions() {
    if (!S.hiring || !S.hiring.requisitions) return;
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const before = S.hiring.requisitions.length;
    S.hiring.requisitions = S.hiring.requisitions.filter(r => r.expiresAtWeek > currentWeek);
    const expired = before - S.hiring.requisitions.length;
    if (expired > 0 && typeof log === 'function') {
      log('📋 ' + expired + ' requisition' + (expired > 1 ? 's' : '') + ' expired');
    }
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
    cleanupExpiredRequisitions();
    _weeksUntilNextCandidate -= 1;
    if (_weeksUntilNextCandidate <= 0) {
      const r = currentRecruiter();
      const count = r.candidatesPerTick || 1;
      for (let i = 0; i < count; i++) generateCandidateInMarket();
      _weeksUntilNextCandidate = r.intervalWeeks;
    }
    // Phase 4: referrals from happy employees (tier 3+)
    if (currentRecruiter().referrals) maybeGenerateReferral();
    // v11.1: Alumni Job Board (school department) — past alumni occasionally
    // surface as premium hireable candidates when that node is purchased.
    if (window.tycoonSchool?.isPurchased?.('n_job_board')) maybeGenerateAlumniCandidate();
    // Phase 4b: reverse poaching — rivals poach YOUR low-morale seniors
    processOutsideOffers();
    maybeGenerateOutsideOffer();
  }

  // ---------- Alumni Job Board (v11.1) ----------
  // Past classmates (S.school.alumniHall) occasionally list on the market as
  // premium senior staff. Tagged fromAlumnus so the UI can highlight, with
  // +2 stats across the board, inflated salary, and traits carried over.
  const ALUMNI_WEEKLY_PROB = 0.10;  // ~1 per 10 weeks when hall has entries

  function maybeGenerateAlumniCandidate() {
    ensureState();
    if (S.hiring.queue.length >= MAX_QUEUE) return;
    const hall = S.school?.alumniHall || [];
    if (!hall.length) return;
    if (Math.random() >= ALUMNI_WEEKLY_PROB) return;
    // Skip alumni we've already offered back
    const eligible = hall.filter(a => !S.hiring.queue.some(c => c.fromAlumnus === a.name));
    if (!eligible.length) return;
    const alum = eligible[Math.floor(Math.random() * eligible.length)];
    // Premium senior generated from scratch, then overlaid with alumnus flavor
    const c = window.tycoonEmployees.generateCandidate({ tier: 4 });  // Staff by default
    c.fairId = ++S.hiring.fairIndex;
    c.offeredAtWeek = window.tycoonProjects.absoluteWeek();
    c.expiresAtWeek = c.offeredAtWeek + CANDIDATE_LIFETIME_WEEKS;
    c.fromAlumnus = alum.name;
    c.alumnusRank = alum.rank;
    c.alumnusFate = alum.fate;
    // +2 stats across the board (seasoned pro) and +30% salary ask
    const TIERS = window.TYCOON_TIERS || [];
    const cap = (TIERS[4]?.statCap || 8) + 1;
    for (const k of ['tech','design','polish','speed']) {
      c.hiddenStats[k] = Math.min(cap, (c.hiddenStats[k] || 0) + 2);
    }
    c.askingSalary = Math.round(c.askingSalary * 1.30);
    S.hiring.queue.push(c);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('\uD83C\uDF93 Alumnus on market: ' + alum.name + ' (your rank-' + alum.rank + ' grad) — $' + (c.askingSalary/1000).toFixed(0) + 'K');
    document.dispatchEvent(new CustomEvent('tycoon:hiring-fair', {
      detail: { fairId: c.fairId, candidates: [c], alumnus: true }
    }));
  }

  // ---------- Reverse poaching (Phase 4b) ----------
  // Each week, each tier-3+ employee with morale < REVERSE_POACH_MIN_MORALE has
  // a small chance to receive an outside offer from an active rival. The
  // player can Match (pay the new salary), Exceed (pay +20%, morale bump),
  // or Decline (employee leaves). Unanswered offers auto-expire.
  const REVERSE_POACH_MIN_MORALE = 50;
  const REVERSE_POACH_MIN_TIER = 3;              // Senior Dev+
  const REVERSE_POACH_WEEKLY_PROB = 0.04;        // ~1 per 25 weeks per eligible emp
  const OUTSIDE_OFFER_DURATION_WEEKS = 3;

  function maybeGenerateOutsideOffer() {
    ensureState();
    const rivals = (S.rivals || []).filter(r => r.status === 'active');
    if (!rivals.length) return;
    const candidates = (S.employees || []).filter(e =>
      (e.tier || 0) >= REVERSE_POACH_MIN_TIER &&
      (e.morale || 0) < REVERSE_POACH_MIN_MORALE &&
      !S.hiring.outsideOffers.some(o => o.employeeId === e.id)
    );
    if (!candidates.length) return;
    for (const emp of candidates) {
      if (Math.random() >= REVERSE_POACH_WEEKLY_PROB) continue;
      const rival = rivals[Math.floor(Math.random() * rivals.length)];
      const bump = 1.2 + Math.random() * 0.2;  // 1.20x to 1.40x
      const newSalary = Math.round((emp.salary || 0) * bump);
      const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
      const offer = {
        id: 'poach_' + (S.hiring.fairIndex++).toString(36) + '_' + emp.id,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeTierName: emp.tierName,
        employeeSpecialty: emp.specialty,
        currentSalary: emp.salary,
        newSalary,
        rivalId: rival.id,
        rivalName: rival.name,
        rivalIcon: rival.icon,
        postedAtWeek: currentWeek,
        expiresAtWeek: currentWeek + OUTSIDE_OFFER_DURATION_WEEKS,
      };
      S.hiring.outsideOffers.push(offer);
      if (typeof markDirty === 'function') markDirty();
      if (typeof log === 'function') {
        log('\u{1F4E8} ' + (rival.icon || '') + ' ' + rival.name + ' made ' + emp.name + ' an offer ($' +
            (newSalary/1000).toFixed(0) + 'K, vs your $' + ((emp.salary||0)/1000).toFixed(0) + 'K)');
      }
      document.dispatchEvent(new CustomEvent('tycoon:outside-offer', { detail: { offer } }));
      return;  // one per tick max
    }
  }

  function processOutsideOffers() {
    if (!S.hiring || !S.hiring.outsideOffers) return;
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const expired = S.hiring.outsideOffers.filter(o => o.expiresAtWeek <= currentWeek);
    if (expired.length === 0) return;
    for (const o of expired) {
      // Auto-leave: employee quits for the rival
      loseEmployeeToRival(o, /*silent=*/false);
    }
    S.hiring.outsideOffers = S.hiring.outsideOffers.filter(o => o.expiresAtWeek > currentWeek);
    if (typeof markDirty === 'function') markDirty();
  }

  function loseEmployeeToRival(offer, silent) {
    const emp = (S.employees || []).find(e => e.id === offer.employeeId);
    if (!emp) return;
    S.employees = S.employees.filter(e => e.id !== offer.employeeId);
    // Detach from any project teams
    for (const p of (S.projects?.active || [])) {
      if (Array.isArray(p.team)) p.team = p.team.filter(id => id !== offer.employeeId);
    }
    if (!silent && typeof log === 'function') {
      log('\u{1F4A8} ' + emp.name + ' left for ' + (offer.rivalIcon || '') + ' ' + offer.rivalName);
    }
    document.dispatchEvent(new CustomEvent('tycoon:employee-departed', {
      detail: { employeeId: emp.id, toRivalId: offer.rivalId, toRivalName: offer.rivalName }
    }));
  }

  // Player chooses Match — pay the new salary, employee stays, morale bumps to 70.
  function matchOutsideOffer(offerId) {
    ensureState();
    const offer = S.hiring.outsideOffers.find(o => o.id === offerId);
    if (!offer) return { ok: false, error: 'Offer not found' };
    const emp = (S.employees || []).find(e => e.id === offer.employeeId);
    if (!emp) { removeOfferById(offerId); return { ok: false, error: 'Employee no longer on staff' }; }
    emp.salary = offer.newSalary;
    emp.morale = Math.max(emp.morale || 0, 70);
    removeOfferById(offerId);
    if (typeof log === 'function') log('\u{1F91D} Matched ' + offer.rivalName + '\u2019s offer — ' + emp.name + ' stays at $' + (offer.newSalary/1000).toFixed(0) + 'K');
    document.dispatchEvent(new CustomEvent('tycoon:offer-matched', { detail: { offer, employee: emp } }));
    return { ok: true, employee: emp };
  }

  // Player chooses Exceed — pay new salary + 20%, morale jumps to 85, tiny stat bump.
  function exceedOutsideOffer(offerId) {
    ensureState();
    const offer = S.hiring.outsideOffers.find(o => o.id === offerId);
    if (!offer) return { ok: false, error: 'Offer not found' };
    const emp = (S.employees || []).find(e => e.id === offer.employeeId);
    if (!emp) { removeOfferById(offerId); return { ok: false, error: 'Employee no longer on staff' }; }
    emp.salary = Math.round(offer.newSalary * 1.20);
    emp.morale = Math.max(emp.morale || 0, 85);
    // Small stat boost — pick a random stat, +1 up to tier cap
    const TIERS = window.TYCOON_TIERS || [];
    const cap = TIERS[emp.tier]?.statCap || 10;
    const k = ['design','tech','polish','speed'][Math.floor(Math.random() * 4)];
    if (emp.stats) emp.stats[k] = Math.min(cap, (emp.stats[k] || 0) + 1);
    removeOfferById(offerId);
    if (typeof log === 'function') log('\u{1F386} Exceeded ' + offer.rivalName + '\u2019s offer — ' + emp.name + ' feels valued at $' + (emp.salary/1000).toFixed(0) + 'K (+' + k + ')');
    document.dispatchEvent(new CustomEvent('tycoon:offer-exceeded', { detail: { offer, employee: emp } }));
    return { ok: true, employee: emp };
  }

  // Player chooses Decline — employee leaves for the rival.
  function declineOutsideOffer(offerId) {
    ensureState();
    const offer = S.hiring.outsideOffers.find(o => o.id === offerId);
    if (!offer) return { ok: false, error: 'Offer not found' };
    loseEmployeeToRival(offer, false);
    removeOfferById(offerId);
    return { ok: true };
  }

  function removeOfferById(offerId) {
    if (!S.hiring) return;
    S.hiring.outsideOffers = (S.hiring.outsideOffers || []).filter(o => o.id !== offerId);
    if (typeof markDirty === 'function') markDirty();
  }

  // ---------- Referrals (Phase 4) ----------
  // Each week, each employee with morale >= REFERRAL_MIN_MORALE has a small
  // chance to refer a candidate from their network. The referred candidate
  // shares the referrer's specialty and sits one tier at or below.
  const REFERRAL_MIN_MORALE = 80;
  const REFERRAL_WEEKLY_PROB = 0.08;  // ~1 referral per 12 weeks per happy employee

  function maybeGenerateReferral() {
    ensureState();
    if (S.hiring.queue.length >= MAX_QUEUE) return;
    const happyEmps = (S.employees || []).filter(e => (e.morale || 0) >= REFERRAL_MIN_MORALE);
    if (!happyEmps.length) return;
    // Only one referral attempt per tick — iterate the happy list looking for a hit
    for (const ref of happyEmps) {
      if (Math.random() >= REFERRAL_WEEKLY_PROB) continue;
      // Build candidate opts biased toward the referrer's specialty + tier
      const refTier = (typeof ref.tier === 'number') ? ref.tier : 1;
      const c = window.tycoonEmployees.generateCandidate({
        specialty: ref.specialty,
        tier: Math.max(0, refTier - (Math.random() < 0.7 ? 0 : 1)),
      });
      c.fairId = ++S.hiring.fairIndex;
      c.offeredAtWeek = window.tycoonProjects.absoluteWeek();
      c.expiresAtWeek = c.offeredAtWeek + CANDIDATE_LIFETIME_WEEKS;
      c.referralFromId = ref.id;
      c.referralFromName = ref.name;
      // Referral discount: 10-15% off asking salary as a network favor
      c.askingSalary = Math.round(c.askingSalary * (0.85 + Math.random() * 0.05));
      S.hiring.queue.push(c);
      if (typeof markDirty === 'function') markDirty();
      if (typeof log === 'function') log('\uD83E\uDD1D ' + ref.name + ' referred ' + c.name + ' (' + c.tierName + ' \u00b7 ' + c.specialty + ')');
      document.dispatchEvent(new CustomEvent('tycoon:hiring-fair', {
        detail: { fairId: c.fairId, candidates: [c], referral: true }
      }));
      return;  // one referral max per tick
    }
  }

  // ---------- Poaching (Phase 4) ----------
  // When a rival studio goes bankrupt, 1-2 ex-employees surface in the
  // market. Stats get +1 across the board and a 20% salary uplift; they
  // carry a `poachedFromRival` tag for the UI. Only active when the
  // recruiter tier is Executive Recruiter (3).
  function injectPoachedCandidates(rival) {
    ensureState();
    if (!currentRecruiter().poaching) return;
    const n = 1 + Math.floor(Math.random() * 2);  // 1 or 2
    for (let i = 0; i < n; i++) {
      if (S.hiring.queue.length >= MAX_QUEUE) break;
      // High tier (3-5), prefer rival's focus-axis specialty when available
      const tier = 3 + Math.floor(Math.random() * 3);
      const specPool = {
        game: ['gamedev','coder','frontend'],
        business: ['backend','coder','devops'],
        web: ['frontend','webdev','backend'],
        mobile: ['mobile','frontend','coder'],
        saas: ['backend','cloud','devops'],
        ai: ['agent','cloud','backend'],
      };
      const focus = Array.isArray(rival.focus) ? rival.focus[0] : null;
      const pool = specPool[focus] || ['coder','frontend','backend'];
      const specialty = pool[Math.floor(Math.random() * pool.length)];
      const c = window.tycoonEmployees.generateCandidate({ tier, specialty });
      // Bump each stat by 1 (clamped to tier cap + 1 for consistency)
      const TIERS = window.TYCOON_TIERS || [];
      const cap = (TIERS[tier]?.statCap || 10) + 1;
      for (const k of ['design','tech','polish','speed']) {
        c.hiddenStats[k] = Math.min(cap, (c.hiddenStats[k] || 0) + 1);
      }
      c.askingSalary = Math.round(c.askingSalary * 1.20);
      c.fairId = ++S.hiring.fairIndex;
      c.offeredAtWeek = window.tycoonProjects.absoluteWeek();
      c.expiresAtWeek = c.offeredAtWeek + CANDIDATE_LIFETIME_WEEKS;
      c.poachedFromRival = rival.name;
      c.poachedFromIcon = rival.icon;
      S.hiring.queue.push(c);
      if (typeof log === 'function') log('\u26A1 ' + (rival.icon || '') + ' ' + c.name + ' from ' + rival.name + ' lists on the market');
      document.dispatchEvent(new CustomEvent('tycoon:hiring-fair', {
        detail: { fairId: c.fairId, candidates: [c], poached: true }
      }));
    }
    if (typeof markDirty === 'function') markDirty();
  }

  // Listen for rival bankruptcy and trigger poaching if enabled
  document.addEventListener('tycoon:rival-bankrupt', (e) => {
    const rivalId = e?.detail?.rivalId;
    if (!rivalId) return;
    const rival = (S.rivals || []).find(r => r.id === rivalId);
    if (rival) injectPoachedCandidates(rival);
  });

  // ---------- Recruiter management ----------
  function hireRecruiter(tier) {
    ensureState();
    const def = RECRUITER_BY_TIER[tier];
    if (!def) return { ok: false, error: 'Unknown recruiter tier' };
    if (tier === 0) {
      // "Fire" the recruiter — drop back to baseline
      S.hiring.recruiterTier = 0;
      if (typeof log === 'function') log('\uD83D\uDC64 Recruiter dismissed');
    } else {
      S.hiring.recruiterTier = tier;
      // Reset the countdown to the new interval so the change takes effect immediately
      _weeksUntilNextCandidate = Math.min(_weeksUntilNextCandidate, def.intervalWeeks);
      if (typeof log === 'function') log(def.icon + ' Hired ' + def.name + ' ($' + (def.annualSalary/1000).toFixed(0) + 'K/yr)');
    }
    if (typeof markDirty === 'function') markDirty();
    document.dispatchEvent(new CustomEvent('tycoon:recruiter-changed', { detail: { tier, def } }));
    return { ok: true, recruiter: def };
  }

  function recruiterAnnualSalary() {
    return currentRecruiter().annualSalary || 0;
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
    // Recruiter (Phase 2)
    hireRecruiter,
    currentRecruiter,
    recruiterAnnualSalary,
    RECRUITER_TIERS,
    // Requisitions (Phase 3)
    postRequisition,
    closeRequisition,
    MAX_ACTIVE_REQS,
    REQ_DEFAULT_DURATION_WEEKS,
    // Phase 4 — exposed for debug/testing
    maybeGenerateReferral,
    injectPoachedCandidates,
    // Reverse poaching (Phase 4b)
    maybeGenerateOutsideOffer,
    matchOutsideOffer,
    exceedOutsideOffer,
    declineOutsideOffer,
    INTERVIEW_COST,
    BASE_CANDIDATE_INTERVAL_WEEKS,
    CANDIDATE_LIFETIME_WEEKS,
    MAX_QUEUE,
    FAIR_INTERVAL_WEEKS,  // legacy alias
    state() {
      ensureState();
      return {
        queue: S.hiring.queue,
        weeksUntilNextCandidate: _weeksUntilNextCandidate,
        newSinceView: newCandidatesSinceView(),
        recruiter: currentRecruiter(),
      };
    }
  };
  if (window.dbg) window.dbg.hiring = window.tycoonHiring;

  console.log('[tycoon-hiring] module loaded. Rolling market: 1 candidate every ' + BASE_CANDIDATE_INTERVAL_WEEKS + ' weeks baseline, queue caps at ' + MAX_QUEUE + '.');
})();
