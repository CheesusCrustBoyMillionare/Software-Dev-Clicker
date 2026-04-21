// ========== TYCOON EMPLOYEES (v2) ==========
// Phase 2A: Employee data model + biweekly salary payroll.
// Founder remains in S.founder; this module manages the hired team in S.employees.
(function(){
  'use strict';

  // ---------- Name pools (era-flavored) ----------
  const FIRST_NAMES = [
    'Alex','Sarah','Mia','Derek','Leo','Morgan','Jamie','Taylor','Riley','Avery',
    'Casey','Jordan','Parker','Quinn','Sam','Pat','Drew','Kai','Remy','Elliot',
    'Blair','Harper','Phoenix','River','Sage','Skyler','Cameron','Dakota','Lee','Robin',
    'Marlon','Wendy','Bobbie','Chris','Terry','Jesse','Frankie','Dana','Lou','Mel'
  ];
  const LAST_NAMES = [
    'Chen','Park','Nguyen','Patel','Johnson','Smith','Lee','Rodriguez','Kim','Singh',
    'Garcia','Brown','Martinez','Taylor','Anderson','Wilson','Clark','Lewis','Walker','Hall',
    'Young','King','Wright','Scott','Green','Adams','Baker','Nelson','Carter','Mitchell',
    'Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart'
  ];

  // ---------- Education flavor pool (by edu level 0-4) ----------
  const EDU_FLAVORS = {
    0: [ // self-taught
      'Bootcamp \'22','BBS scene veteran','Indie projects on GitHub','Self-taught from YouTube',
      'Modding community transplant','HS dropout, prodigy type','Ham radio origin story',
      'Homebrew forum regular','Magazine type-in-program kid','Zines → code pipeline'
    ],
    1: [ // CC / certificate
      'AS CompSci, Berkshire CC','Certificate, DeVry \'89','Tech diploma, local college',
      'Associate\'s from State CC','Night-school self-starter','Vocational tech grad'
    ],
    2: [ // bachelor's
      'BS CompSci, State U','BA CompSci, liberal arts college','BA Design, SVA',
      'BS Electrical Eng','BS Applied Math','BA Informatics','BEng Software'
    ],
    3: [ // master's
      'MS CompSci, Carnegie Mellon','MS CompSci, Stanford','MS HCI, Berkeley',
      'MS CompSci, Georgia Tech','MFA Game Design, USC','MS Systems, Cornell'
    ],
    4: [ // PhD
      'PhD CompSci, MIT','PhD Machine Learning, Stanford','PhD HCI, CMU',
      'PhD Distributed Systems, Berkeley','PhD Database Theory, Wisconsin'
    ]
  };

  // ---------- Specialty → axis map (must match SPECIALTY_AXIS in 13-tycoon-projects) ----------
  // Exposed on-module so we can visually bias rolled stats toward the
  // specialty's axis (v11.1: bakes specialty into stats instead of a runtime
  // multiplier). Kept in sync manually — a single test in the console
  // sanity-checks this against window.tycoonProjects.SPECIALTY_AXIS.
  const SPECIALTY_AXIS_LOCAL = {
    coder:'tech', backend:'tech', network:'tech', cloud:'tech',
    frontend:'design', webdev:'design', gamedev:'design', agent:'design',
    mobile:'polish', devops:'polish',
  };

  // ---------- Specialty stat bias ----------
  // v11.1: returns { tech, design, polish, speed } deltas applied to base
  // stats so the rolled candidate visually specializes. Primary axis +2;
  // the other two quality axes each -1. Speed is untouched (it governs
  // phase duration, not specialty). Net change to statSum = 0 so salary
  // calcs stay balanced.
  function specialtyStatBias(specialty) {
    const bias = { tech:0, design:0, polish:0, speed:0 };
    const primary = SPECIALTY_AXIS_LOCAL[specialty] || 'tech';
    bias[primary] = 2;
    for (const k of ['tech','design','polish']) {
      if (k !== primary) bias[k] = -1;
    }
    return bias;
  }

  // ---------- Edu stat bias (secret, applied at interview reveal) ----------
  // Returns { tech, design, polish, speed } deltas to add to base stats
  function eduStatBias(edu, specialty) {
    const bias = { tech:0, design:0, polish:0, speed:0 };
    // Bachelor's (edu 2) is neutral
    if (edu === 4) { // PhD: +1.5 avg to primary, -0.5 speed
      const primary = isDesignSpecialty(specialty) ? 'design' : 'tech';
      bias[primary] += 1.5;
      bias.speed -= 0.5;
    } else if (edu === 3) { // Master's: +1 to primary
      const primary = isDesignSpecialty(specialty) ? 'design' : 'tech';
      bias[primary] += 1;
    } else if (edu === 1) { // CC: -0.5 avg but +0.5 polish
      bias.tech -= 0.5;
      bias.polish += 0.5;
    } else if (edu === 0) { // Self-taught: high variance (applied in generator)
      // Handled via randomVariance below
    }
    return bias;
  }

  function isDesignSpecialty(s) { return ['frontend','gamedev','agent'].includes(s); }

  // ---------- Trait catalog (Phase 2 subset) ----------
  // Full 20-trait catalog is in DESIGN_V2.md. Phase 2 uses ~10.
  const TRAITS = {
    'Perfectionist': { hint:'+2 Polish, -1 Speed', effect: { polish:+2, speed:-1 } },
    'Sprinter':      { hint:'+2 Speed, -1 Polish', effect: { speed:+2, polish:-1 } },
    'Methodical':    { hint:'+2 Tech, -1 Speed', effect: { tech:+2, speed:-1 } },
    'Creative':      { hint:'+2 Design, unlocks innovation', effect: { design:+2 } },
    'Mentor':        { hint:'+0.1/wk growth to juniors on team', effect: {} },
    'Toxic':         { hint:'-0.5 morale/wk to every teammate on the same project', effect: {}, tag:'teamMoraleDrain' },
    'Team Player':   { hint:'+10% team synergy', effect: {} },
    'Veteran':       { hint:'+15% quality on sequels', effect: {} },
    'Negotiator':    { hint:'Asks for raises 2× as often; +0.1× salary', effect: {} },
    'Lone Wolf':     { hint:'-5% synergy, +2 to solo work', effect: {} },
  };
  const TRAIT_KEYS = Object.keys(TRAITS);
  window.TYCOON_TRAITS = TRAITS;

  // ---------- Tier definitions ----------
  // Mirror of v1's 8 tiers but simplified for tycoon use.
  // statRange: hire-time stat range for each tier; statCap: max any stat reaches without promotion
  const TIERS = [
    { idx:0, name:'Intern',             statRange:[1,3], statCap:3, baseSalary: 25000 },
    { idx:1, name:'Junior Dev',         statRange:[2,4], statCap:4, baseSalary: 45000 },
    { idx:2, name:'Mid-Level Dev',      statRange:[3,6], statCap:6, baseSalary: 70000 },
    { idx:3, name:'Senior Dev',         statRange:[5,7], statCap:7, baseSalary: 120000 },
    { idx:4, name:'Staff Engineer',     statRange:[6,8], statCap:8, baseSalary: 200000 },
    { idx:5, name:'Principal Engineer', statRange:[7,9], statCap:9, baseSalary: 350000 },
    { idx:6, name:'Tech Lead',          statRange:[8,10],statCap:10,baseSalary: 500000 },
    { idx:7, name:'CTO',                statRange:[9,10],statCap:10,baseSalary: 800000 },
  ];
  window.TYCOON_TIERS = TIERS;

  // ---------- Personality multipliers (bespoke salary expectations, per ECON-6c) ----------
  const PERSONALITIES = [
    { label:'Humble',  range:[0.70, 0.90], weight: 0.2 },
    { label:'Fair',    range:[0.90, 1.10], weight: 0.5 },
    { label:'Premium', range:[1.10, 1.25], weight: 0.2 },
    { label:'Diva',    range:[1.25, 1.40], weight: 0.1 }, // boosted if Negotiator trait
  ];

  // ---------- Helpers ----------
  let _employeeIdCounter = 0;
  function newEmployeeId() {
    _employeeIdCounter += 1;
    return 'e_' + Date.now().toString(36) + '_' + _employeeIdCounter;
  }

  function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function randInRange(lo, hi) { return Math.round(lo + Math.random() * (hi - lo)); }

  function randFloat(lo, hi) { return lo + Math.random() * (hi - lo); }

  // Gaussian-ish via sum of 3 uniforms
  function randNormal(mean, stddev) {
    const r = (Math.random() + Math.random() + Math.random()) / 3; // roughly normal
    return mean + (r - 0.5) * 2 * stddev;
  }

  function pickPersonalityForTraits(traits) {
    const isDiva = traits.includes('Negotiator');
    const weights = PERSONALITIES.map(p => {
      let w = p.weight;
      if (isDiva && p.label === 'Diva') w *= 3;
      return { p, w };
    });
    const total = weights.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    for (const { p, w } of weights) {
      roll -= w;
      if (roll <= 0) return p;
    }
    return PERSONALITIES[1]; // Fair fallback
  }

  // ---------- Candidate generation ----------
  // Used by the Hiring Fair. Returns a candidate record (pre-interview).
  // Callers should flip the `interviewed` flag after the player pays for an interview.
  function generateCandidate(opts) {
    opts = opts || {};
    const fame = S.tFame || 0;
    // Fame gates tier: 0-20 = intern/junior, 20-50 = up to mid, 50-100 = seniors, 100-200 = staff, 200+ = principal, 500+ = tech lead
    const maxTier = fame < 20 ? 1 : fame < 50 ? 2 : fame < 100 ? 3 : fame < 200 ? 4 : fame < 500 ? 5 : 6;
    const tier = opts.tier != null ? opts.tier : Math.max(0, randInRange(0, maxTier));
    const tierDef = TIERS[tier];
    const specialty = opts.specialty || randPick(['coder','frontend','backend','gamedev']); // Phase 2: only the 4 we actually use
    const name = randPick(FIRST_NAMES) + ' ' + randPick(LAST_NAMES);

    // Education roll (weighted by tier — higher tiers more likely to have degrees)
    const eduRoll = Math.random();
    let edu;
    if (tier >= 4) edu = eduRoll < 0.1 ? 0 : eduRoll < 0.25 ? 2 : eduRoll < 0.55 ? 3 : 4; // staff+: more likely PhD/MS
    else if (tier >= 2) edu = eduRoll < 0.15 ? 0 : eduRoll < 0.35 ? 1 : eduRoll < 0.75 ? 2 : eduRoll < 0.95 ? 3 : 4;
    else edu = eduRoll < 0.35 ? 0 : eduRoll < 0.65 ? 1 : eduRoll < 0.95 ? 2 : 3;
    const eduFlavor = randPick(EDU_FLAVORS[edu] || EDU_FLAVORS[2]);

    // Base stats (rolled within tier range, then biased by specialty + edu)
    const [lo, hi] = tierDef.statRange;
    const baseStat = () => randInRange(lo, hi);
    const stats = { design: baseStat(), tech: baseStat(), speed: baseStat(), polish: baseStat() };
    // v11.1: specialty bias baked into base stats (replaces the old 1.5×/0.5×
    // runtime multiplier in developOneWeek). Primary axis +2, other two
    // quality axes -1 each. Primary may exceed statCap by 1 to reward
    // specialization.
    const sBias = specialtyStatBias(specialty);
    const primary = SPECIALTY_AXIS_LOCAL[specialty] || 'tech';
    for (const k of ['design','tech','polish','speed']) {
      const cap = (k === primary) ? tierDef.statCap + 1 : tierDef.statCap;
      stats[k] = Math.max(1, Math.min(cap, Math.round(stats[k] + (sBias[k] || 0))));
    }
    const bias = eduStatBias(edu, specialty);
    for (const k of ['design','tech','polish','speed']) {
      const cap = (k === primary) ? tierDef.statCap + 1 : tierDef.statCap;
      stats[k] = Math.max(1, Math.min(cap, Math.round(stats[k] + (bias[k] || 0))));
    }
    // Self-taught high variance: random extreme in one stat
    if (edu === 0 && Math.random() < 0.3) {
      const k = randPick(['design','tech','polish','speed']);
      stats[k] = Math.max(1, Math.min(tierDef.statCap, stats[k] + randInRange(-2, 2)));
    }

    // Traits: one visible pre-interview, one hidden until interview
    const visibleTrait = randPick(TRAIT_KEYS);
    const poolWithoutVisible = TRAIT_KEYS.filter(t => t !== visibleTrait);
    // 60% chance of second trait existing, otherwise null
    const hiddenTrait = Math.random() < 0.6 ? randPick(poolWithoutVisible) : null;
    const traits = [visibleTrait, hiddenTrait].filter(Boolean);

    // Personality multiplier (affects salary ask)
    const personality = pickPersonalityForTraits(traits);
    const personalityMult = randFloat(personality.range[0], personality.range[1]);

    // Base salary ask: tier base × stat modifier × personality × era inflation
    const statSum = stats.design + stats.tech + stats.speed + stats.polish;
    const statMod = 1 + Math.max(0, (statSum - 20)) * 0.05; // each point above 20 = +5%
    const era = (S.calendar?.year || 1980);
    const inflation = Math.pow(1.03, era - 1980);
    const askingSalary = Math.round(tierDef.baseSalary * statMod * personalityMult * inflation);

    // Age: realistic-ish based on edu + tier
    const minAge = 18 + (edu * 2) + (tier * 1.5);
    const age = Math.round(minAge + Math.random() * 8);

    return {
      id: newEmployeeId(),
      candidate: true,            // flag: hasn't been hired yet
      name,
      specialty,
      tier,
      tierName: tierDef.name,
      // Pre-interview visible
      education: { level: edu, flavor: eduFlavor },
      visibleTrait,
      askingSalary,
      age,
      // Hidden until interviewed
      hiddenStats: stats,
      hiddenTrait,
      hiddenPersonality: personality.label,
      personalityMult,
      // Interview state
      interviewed: false,
      // Post-hire state (set by hire())
      morale: 70,
      exp: 0,
      retireAge: Math.min(78, 55 + edu * 2 + Math.floor(Math.random() * (8 + edu * 2))),
      isFounder: false,
      assignedProjectId: null,
      hiredAtWeek: null,
    };
  }

  // After paying interview fee, reveal candidate's hidden fields
  function interviewCandidate(candidate) {
    if (candidate.interviewed) return candidate;
    candidate.interviewed = true;
    candidate.stats = candidate.hiddenStats;
    candidate.personality = candidate.hiddenPersonality;
    if (candidate.hiddenTrait) {
      candidate.traits = [candidate.visibleTrait, candidate.hiddenTrait];
    } else {
      candidate.traits = [candidate.visibleTrait];
    }
    return candidate;
  }

  // Negotiate: 30% chance they walk away; otherwise -10% or -20% salary
  function negotiateCandidate(candidate, aggressiveness) {
    aggressiveness = aggressiveness || 'soft'; // 'soft' = -10%, 'hard' = -20%
    const walkChance = aggressiveness === 'hard' ? 0.5 : 0.25;
    if (Math.random() < walkChance) {
      return { outcome: 'walked', candidate: null };
    }
    const reduction = aggressiveness === 'hard' ? 0.80 : 0.90;
    candidate.askingSalary = Math.round(candidate.askingSalary * reduction);
    return { outcome: 'accepted', candidate };
  }

  // Hire: convert candidate to an employee in S.employees
  function hireCandidate(candidate) {
    if (!S.employees) S.employees = [];
    if (!candidate.interviewed) {
      // Force reveal on hire (player took the leap)
      interviewCandidate(candidate);
    }
    const emp = {
      id: candidate.id,
      name: candidate.name,
      specialty: candidate.specialty,
      tier: candidate.tier,
      tierName: candidate.tierName,
      education: candidate.education,
      stats: { ...candidate.stats },
      traits: [...(candidate.traits || [])],
      personality: candidate.personality,
      personalityMult: candidate.personalityMult,
      salary: candidate.askingSalary,
      morale: 70,
      exp: 0,
      age: candidate.age,
      retireAge: candidate.retireAge,
      isFounder: false,
      assignedProjectId: null,
      hiredAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
    };
    S.employees.push(emp);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🤝 Hired: ' + emp.name + ' (' + emp.tierName + ', $' + emp.salary.toLocaleString() + '/yr)');
    document.dispatchEvent(new CustomEvent('tycoon:employee-hired', { detail: { employeeId: emp.id } }));
    return emp;
  }

  // Fire an employee (no severance in Phase 2; added in later phases)
  function fireEmployee(employeeId) {
    if (!S.employees) return;
    const emp = S.employees.find(e => e.id === employeeId);
    if (!emp) return;
    S.employees = S.employees.filter(e => e.id !== employeeId);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('👋 ' + emp.name + ' let go (severance waived)');
    document.dispatchEvent(new CustomEvent('tycoon:employee-fired', { detail: { employeeId } }));
  }

  // ---------- Payroll ----------
  // Biweekly: every 2 game-weeks, deduct sum of all employee salaries (prorated to biweekly).
  // Founder is unpaid in Phase 2 (token equity in lieu of cash).
  const WEEKS_PER_YEAR = 48;     // our simplified calendar
  const PAYROLL_INTERVAL = 2;    // biweekly

  let _weeksSinceLastPayroll = 0;
  function onWeekTick() {
    _weeksSinceLastPayroll += 1;
    if (_weeksSinceLastPayroll >= PAYROLL_INTERVAL) {
      _weeksSinceLastPayroll = 0;
      runPayroll();
    }
    // v11.1: natural morale drift toward the 70 baseline using proportional
    // decay — each week, morale moves 10% of its gap to 70. Far-from-baseline
    // states recover fast (20 → 70 in ~50 weeks, fast early then asymptotic);
    // near-baseline drift is gentle enough that drains like Toxic (-0.5/wk)
    // still find meaningful equilibria below 70. Previously used flat ±1/±0.5
    // rates which were completely neutralized by Toxic at the 70 floor.
    // v11.1: Nihilist founder trait caps every employee's morale (including
    // the founder) at its capMorale value. Applied before drift so the drift
    // target still reads as 70 — the cap clamps the result afterward.
    const nihilist = window.tycoonTraits?.founderTraitHook?.('moraleFlat');
    const moraleCap = nihilist?.capMorale ?? 100;
    for (const emp of (S.employees || [])) {
      if (typeof emp.morale !== 'number') { emp.morale = 70; continue; }
      const gap = 70 - emp.morale;
      if (Math.abs(gap) >= 0.05) {
        emp.morale = Math.max(0, Math.min(100, emp.morale + gap * 0.1));
      }
      if (emp.morale > moraleCap) emp.morale = moraleCap;
    }
    if (S.founder && typeof S.founder.morale === 'number' && S.founder.morale > moraleCap) {
      S.founder.morale = moraleCap;
    }
    // v11.1: Mentor trait — junior stat growth via tycoonProjects helper.
    if (typeof window._tycoonApplyMentorGrowth === 'function') {
      try { window._tycoonApplyMentorGrowth(); } catch (e) { console.error('[mentor growth]', e); }
    }
    // v11.1: Negotiator trait — periodically fires a raise-request offer
    // modeled identically to rival outside offers (same response UI). Base
    // cadence is every ~26 game-weeks per Negotiator. See hiring module.
    if (typeof window._tycoonMaybeNegotiatorRaise === 'function') {
      try { window._tycoonMaybeNegotiatorRaise(); } catch (e) { console.error('[negotiator]', e); }
    }
    // v11.1: Experience accrual + promotion eligibility. +2 XP/wk if on a
    // project's team, +1/wk on bench. At 48 × (tier+1) XP, the employee
    // asks for a promotion via the existing raise-request UI.
    accrueExperience();
    if (typeof window._tycoonMaybePromotionRequests === 'function') {
      try { window._tycoonMaybePromotionRequests(); } catch (e) { console.error('[promotions]', e); }
    }
  }

  // ---------- Experience accrual (v11.1) ----------
  function accrueExperience() {
    const onProjTeam = new Set();
    for (const p of (S.projects?.active || [])) {
      if (!Array.isArray(p.team)) continue;
      for (const id of p.team) onProjTeam.add(id);
    }
    for (const emp of (S.employees || [])) {
      if (typeof emp.exp !== 'number') emp.exp = 0;
      emp.exp += onProjTeam.has(emp.id) ? 2 : 1;
    }
  }

  // XP threshold for next tier (called by both the promotion check and the
  // employee detail UI). A tier-1 junior needs 96 XP to move to tier 2; a
  // tier-3 senior needs 192 XP, etc. Baseline: 48 XP / step.
  function xpNeededForNextTier(tier) {
    return 48 * ((tier || 0) + 1);
  }

  function runPayroll() {
    const employees = S.employees || [];
    const recruiterSalary = window.tycoonHiring?.recruiterAnnualSalary?.() || 0;
    if (employees.length === 0 && recruiterSalary === 0) return;
    // Biweekly portion of annual salary
    let total = 0;
    for (const emp of employees) {
      total += (emp.salary || 0) * (PAYROLL_INTERVAL / WEEKS_PER_YEAR);
    }
    total += recruiterSalary * (PAYROLL_INTERVAL / WEEKS_PER_YEAR);
    // v11.1: Lean Operator trait — same discount applied to actual payroll
    // withdrawal so Finance matches the annualBurn / runway numbers.
    const leanOps = window.tycoonTraits?.founderTraitHook?.('leanOps');
    if (leanOps?.mul) total *= leanOps.mul;
    total = Math.round(total);
    if (total <= 0) return;
    S.cash = (S.cash || 0) - total;
    S.tExpenses = (S.tExpenses || 0) + total;
    if (typeof markDirty === 'function') markDirty();
    const label = employees.length + ' engineer' + (employees.length === 1 ? '' : 's') + (recruiterSalary > 0 ? ' + recruiter' : '');
    if (typeof log === 'function') log('💸 Payroll: $' + total.toLocaleString() + ' (' + label + ')');
    document.dispatchEvent(new CustomEvent('tycoon:payroll', { detail: { amount: total, employeeCount: employees.length } }));
  }

  // Tick integration
  let _unsub = null;
  function startEmployeesTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[employees] tycoonTime not available'); return; }
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopEmployeesTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Compute per-week burn rate (for runway / finance panel) ----------
  function annualBurn() {
    const employees = S.employees || [];
    const engBurn = employees.reduce((s, e) => s + (e.salary || 0), 0);
    const recruiterBurn = window.tycoonHiring?.recruiterAnnualSalary?.() || 0;
    // v11.1: Lean Operator founder trait — −15% on payroll.
    const leanOps = window.tycoonTraits?.founderTraitHook?.('leanOps');
    const mul = leanOps?.mul ?? 1;
    return Math.round((engBurn + recruiterBurn) * mul);
  }
  function weeklyBurn() {
    return Math.round(annualBurn() / WEEKS_PER_YEAR);
  }
  function runwayMonths() {
    const weekly = weeklyBurn();
    if (weekly <= 0) return Infinity;
    const weeks = (S.cash || 0) / weekly;
    return weeks / 4; // 4 weeks = 1 month in our calendar
  }

  // ---------- Public API ----------
  window.tycoonEmployees = {
    generateCandidate,
    interviewCandidate,
    negotiateCandidate,
    hire: hireCandidate,
    fire: fireEmployee,
    runPayroll,           // exposed for debug
    startTick: startEmployeesTick,
    stopTick: stopEmployeesTick,
    annualBurn,
    weeklyBurn,
    runwayMonths,
    state() {
      return {
        employees: (S.employees || []).map(e => ({
          name: e.name, specialty: e.specialty, tier: e.tierName,
          salary: e.salary, morale: e.morale, traits: e.traits
        })),
        annualBurn: annualBurn(),
        runwayMonths: runwayMonths()
      };
    },
    TIERS,
    TRAITS,
    EDU_FLAVORS,
    xpNeededForNextTier,
  };
  if (window.dbg) window.dbg.employees = window.tycoonEmployees;

  console.log('[tycoon-employees] module loaded. ' + TRAIT_KEYS.length + ' traits, ' + TIERS.length + ' tiers.');
})();
