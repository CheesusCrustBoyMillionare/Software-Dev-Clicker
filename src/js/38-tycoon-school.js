// ========== TYCOON SCHOOL / RUN-END (v3 roguelite) ==========
// Phase 4: run-end detection + endowment calculation + alumni-hall
// bookkeeping. The UI layer (school-screen shell) arrives in Phase 5;
// this module provides the data-side pipeline.
//
// A run ends for one of 5 reasons (Q4):
//   bankruptcy         small endowment baseline
//   age_retired        founder reaches retireAge; medium
//   retire_voluntary   player clicked "Retire & Hand Off"; medium
//   megacorp_exit      Sell to Megacorp legacy decision; large
//   win_condition      any of the 5 win paths hit; largest
//
// Downstream triggers are re-routed from their existing handlers to
// call tycoonSchool.endRun() *before* (or alongside) their legacy UI
// effects. The legacy retrospective modal still opens so the player
// sees their run summary — Phase 5 will add an endowment breakout and
// a "To the Institute" button leading into the school screen.
(function(){
  'use strict';

  // ---------- Endowment math ----------
  // Each tier has a baseline + scales with lifetime fame and revenue.
  // Tuned so bankruptcy runs can't farm endowment but contribute a
  // dignified minimum; wins pay meaningful 10-20× more.
  function computeEndowment(runEndType) {
    const fame = S.tFame || 0;
    const revenue = S.tRevenue || 0;
    let base, fameMul, revDiv;
    switch (runEndType) {
      case 'bankruptcy':
        base = 50;   fameMul = 0.2; revDiv = 200000; break;  // small floor
      case 'age_retired':
      case 'retire_voluntary':
        base = 200;  fameMul = 1.0; revDiv = 100000; break;  // medium
      case 'megacorp_exit':
        base = 500;  fameMul = 2.0; revDiv = 50000;  break;  // large
      case 'win_condition':
        base = 1000; fameMul = 3.0; revDiv = 25000;  break;  // largest
      default:
        base = 50;   fameMul = 0.2; revDiv = 200000;
    }
    return Math.round(base + fame * fameMul + (revenue / revDiv));
  }

  // ---------- Compute signature quote for the alumnus card ----------
  // Pulls a random review quote from the founder's best-shipped project
  // as their "signature line". Fallback if no shipped projects: generic.
  function pickSignatureQuote(founder, runEndType) {
    const shipped = (S.projects?.shipped || []).slice().sort(
      (a, b) => (b.criticScore || 0) - (a.criticScore || 0));
    if (shipped.length > 0 && shipped[0].reviews?.[0]) {
      const r = shipped[0].reviews[0];
      return { quote: r.quote || r.text || '', source: r.source || r.publication || 'Critic' };
    }
    // Fallback quotes by fate — placeholders to be expanded in Phase 8
    const fallbacks = {
      bankruptcy: { quote: 'Shut the doors quietly, one afternoon.', source: 'Alumni Office' },
      age_retired: { quote: 'Finally got around to the long vacation.', source: 'Alumni Office' },
      retire_voluntary: { quote: 'Walked away before the walls closed in.', source: 'Alumni Office' },
      megacorp_exit: { quote: 'Sold up. Never looked back.', source: 'Industry Weekly' },
      win_condition: { quote: 'Changed the industry. Legend.', source: 'TechCrunch' },
    };
    return fallbacks[runEndType] || { quote: '\u2014', source: 'Alumni Office' };
  }

  function computeCriticAvg() {
    const shipped = (S.projects?.shipped || []).filter(p => typeof p.criticScore === 'number');
    if (shipped.length === 0) return null;
    return Math.round(shipped.reduce((s, p) => s + (p.criticScore || 0), 0) / shipped.length);
  }

  // ---------- Main run-end handler ----------
  // Idempotent-guarded: if a run-end already fired for this career,
  // subsequent triggers are ignored (so a bankrupt-in-the-same-frame-as-
  // a-win scenario doesn't double-count).
  function endRun(runEndType, detail) {
    if (S._runEndFired) return;
    S._runEndFired = true;
    detail = detail || {};
    if (!S.school) S.school = (typeof defaultSchool === 'function') ? defaultSchool() : {};
    const endowEarned = computeEndowment(runEndType);

    // Bank endowment
    S.school.endowment = (S.school.endowment || 0) + endowEarned;
    S.school.lifetimeEndowmentEarned = (S.school.lifetimeEndowmentEarned || 0) + endowEarned;

    // Lifetime aggregates
    const ls = S.school.lifetimeStats = S.school.lifetimeStats || {};
    ls.runsCompleted = (ls.runsCompleted || 0) + 1;
    ls.totalRevenue  = (ls.totalRevenue  || 0) + (S.tRevenue || 0);
    ls.totalShipped  = (ls.totalShipped  || 0) + ((S.projects?.shipped || []).length);
    ls.totalHires    = (ls.totalHires    || 0) + ((S.employees || []).length);
    if (runEndType === 'bankruptcy')     ls.bankruptcies   = (ls.bankruptcies   || 0) + 1;
    if (runEndType === 'megacorp_exit')  ls.megacorpExits  = (ls.megacorpExits  || 0) + 1;
    if (runEndType === 'win_condition')  ls.winConditionRuns = (ls.winConditionRuns || 0) + 1;

    // Alumni hall entry for this founder
    const founder = S.founder;
    if (founder) {
      const alumnus = {
        name: founder.name,
        rank: founder.classmateRank ?? null,
        band: founder.classmateBand ?? null,
        fate: runEndType,
        year: S.calendar?.year ?? null,
        foundedAt: 1980,
        tenureYears: Math.max(0, (S.calendar?.year || 1980) - 1980),
        finalStats: { ...(founder.stats || {}) },
        finalFame: S.tFame || 0,
        finalRevenue: S.tRevenue || 0,
        criticAvg: computeCriticAvg(),
        shippedCount: (S.projects?.shipped || []).length,
        signatureQuote: pickSignatureQuote(founder, runEndType),
        passions: { ...(founder.passions || {}) },
        mechanicalTraits: [...(founder.mechanicalTraits || [])],
        narrativeTraits: [...(founder.narrativeTraits || [])],
        endowmentContribution: endowEarned,
      };
      if (!Array.isArray(S.school.alumniHall)) S.school.alumniHall = [];
      S.school.alumniHall.push(alumnus);
      // Famous alumni = triumphant exits (wins + megacorp)
      if (runEndType === 'win_condition' || runEndType === 'megacorp_exit') {
        if (!Array.isArray(S.school.famousAlumni)) S.school.famousAlumni = [];
        S.school.famousAlumni.push(alumnus);
      }
      // Mark this classmate's slot in the roster as spent (Phase 6 will
      // read this when showing the roster picker).
      if (Array.isArray(S.school.classRoster) && founder.classmateRank) {
        const slot = S.school.classRoster.find(c => c.rank === founder.classmateRank);
        if (slot) {
          slot.enrolled = true;
          slot.fate = runEndType;
          slot.enrolledAtYear = alumnus.foundedAt;
          slot.endedAtYear = alumnus.year;
        }
      }
    }

    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('\uD83C\uDF93 Run ended (' + runEndType + '): +' + endowEarned + ' endowment banked');
    document.dispatchEvent(new CustomEvent('tycoon:run-end', {
      detail: { type: runEndType, endowEarned, ...detail }
    }));
  }

  // ---------- Voluntary retire eligibility ----------
  function canVoluntaryRetire() {
    if (S._runEndFired) return false;
    // Fame 50+ gate per Q4 to prevent insta-skip exploits
    return (S.tFame || 0) >= 50;
  }

  function voluntaryRetire() {
    if (!canVoluntaryRetire()) return { ok: false, error: 'Need Fame 50+ to retire with dignity' };
    endRun('retire_voluntary');
    return { ok: true };
  }

  // ---------- Founder age + auto-retirement ----------
  // Runs once per week. When the calendar rolls into a new year, the
  // founder ages by 1. If they hit retireAge, auto-retire.
  let _lastYearSeen = null;
  function onWeekTick() {
    if (!S.calendar || !S.founder) return;
    const year = S.calendar.year;
    if (_lastYearSeen === null) { _lastYearSeen = year; return; }
    if (year > _lastYearSeen) {
      const delta = year - _lastYearSeen;
      _lastYearSeen = year;
      S.founder.age = (S.founder.age || 25) + delta;
      // Auto-retirement check
      const retireAge = S.founder.retireAge || 65;
      if (S.founder.age >= retireAge && !S._runEndFired) {
        endRun('age_retired');
      }
    }
  }

  let _unsub = null;
  function startTick() {
    if (_unsub) return;
    if (!window.tycoonTime) return;
    _lastYearSeen = null;
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopTick() {
    if (_unsub) { _unsub(); _unsub = null; }
    _lastYearSeen = null;
  }

  // ---------- Public API ----------
  window.tycoonSchool = {
    endRun,
    computeEndowment,
    pickSignatureQuote,
    canVoluntaryRetire,
    voluntaryRetire,
    startTick,
    stopTick,
    // Debug access
    resetRunEndFlag() { delete S._runEndFired; _lastYearSeen = null; },
    state() {
      return {
        endowment: S.school?.endowment || 0,
        lifetimeEndowmentEarned: S.school?.lifetimeEndowmentEarned || 0,
        alumniCount: (S.school?.alumniHall || []).length,
        famousCount: (S.school?.famousAlumni || []).length,
        runEndFired: !!S._runEndFired,
        canRetire: canVoluntaryRetire(),
      };
    },
  };
  if (window.dbg) window.dbg.school = window.tycoonSchool;

  console.log('[tycoon-school] module loaded. endRun + endowment pipeline ready.');
})();
