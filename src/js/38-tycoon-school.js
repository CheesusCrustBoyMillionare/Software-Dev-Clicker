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

  // ---------- School-screen UI (Phase 5 shell) ----------
  // The school screen is the roguelite "home base" that sits between runs.
  // Phase 5 builds the shell: top bar (school name + endowment), 4-tab
  // layout with Admissions as the only functional tab. Phase 6/7/8 fill
  // in Departments / Alumni Hall / Lifetime. The enroll button at the
  // bottom launches the next classmate into a fresh tycoon career.

  function injectSchoolStyles() {
    if (document.getElementById('_t_school_styles')) return;
    const s = document.createElement('style');
    s.id = '_t_school_styles';
    s.textContent = `
.school-screen {
  position: fixed; inset: 0; z-index: 90;
  background: #0d1117; color: #c9d1d9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: flex; flex-direction: column;
}
.school-topbar {
  display: flex; align-items: center; gap: 24px; padding: 12px 24px;
  background: linear-gradient(to bottom, #1a2332, #161b22);
  border-bottom: 2px solid #30363d; min-height: 60px;
}
.school-topbar .ss-brand {
  display: flex; align-items: baseline; gap: 12px;
}
.school-topbar .ss-brand .ss-school-name {
  font-size: 1.25rem; font-weight: 700; color: #f0f6fc;
  letter-spacing: 0.02em;
}
.school-topbar .ss-brand .ss-school-sub {
  font-size: 0.7rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em;
}
.school-topbar .ss-stat { display: flex; flex-direction: column; align-items: flex-start; }
.school-topbar .ss-stat-val { font-weight: 700; font-size: 1rem; color: #7ee787; }
.school-topbar .ss-stat-lbl { font-size: 0.65rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
.school-topbar .ss-actions { margin-left: auto; display: flex; gap: 8px; }
.school-topbar button {
  background: transparent; border: 1px solid #30363d; color: #c9d1d9;
  padding: 6px 14px; border-radius: 4px; cursor: pointer; font-family: inherit;
  font-size: 0.85rem;
}
.school-topbar button:hover { background: #30363d; }

.school-tabs {
  display: flex; gap: 2px; padding: 0 24px;
  background: #161b22; border-bottom: 1px solid #30363d;
}
.school-tab {
  padding: 12px 20px; background: transparent; border: none;
  color: #8b949e; font-family: inherit; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; border-bottom: 2px solid transparent;
  letter-spacing: 0.02em;
}
.school-tab:hover { color: #c9d1d9; }
.school-tab.active {
  color: #f0f6fc; border-bottom-color: #58a6ff;
}
.school-tab .ss-badge {
  margin-left: 6px; padding: 1px 6px; background: #1f6feb; color: white;
  border-radius: 9px; font-size: 0.65rem; font-weight: 700;
}

.school-main {
  flex: 1; padding: 24px; overflow-y: auto;
  max-width: 1100px; width: 100%; margin: 0 auto;
}
.school-main h2 { font-size: 1rem; color: #f0f6fc; margin-bottom: 12px; }
.school-main h3 { font-size: 0.85rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; font-weight: 700; }

.school-footer {
  padding: 12px 24px; background: #161b22; border-top: 1px solid #30363d;
  display: flex; justify-content: center;
}
.school-footer .ss-enroll {
  padding: 12px 32px; font-size: 1rem; font-weight: 700;
  background: #238636; border: 1px solid #2ea043; color: white;
  border-radius: 6px; cursor: pointer; font-family: inherit;
}
.school-footer .ss-enroll:hover { background: #2ea043; }
.school-footer .ss-enroll:disabled {
  background: #30363d; border-color: #30363d; color: #8b949e; cursor: not-allowed;
}

.ss-placeholder {
  padding: 60px 20px; text-align: center; color: #8b949e;
  background: #161b22; border: 1px dashed #30363d; border-radius: 8px;
}
.ss-placeholder .ss-placeholder-icon { font-size: 2.5rem; margin-bottom: 12px; }
.ss-placeholder .ss-placeholder-title { font-size: 1rem; color: #c9d1d9; margin-bottom: 6px; font-weight: 700; }
.ss-placeholder .ss-placeholder-body { font-size: 0.85rem; line-height: 1.4; max-width: 480px; margin: 0 auto; }

/* Admissions roster strip */
.ss-roster {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}
.ss-roster-card {
  padding: 10px 12px; background: #161b22; border: 1px solid #30363d;
  border-radius: 6px; cursor: pointer; transition: all 0.15s;
  position: relative;
}
.ss-roster-card:hover { border-color: #58a6ff; transform: translateY(-2px); }
.ss-roster-card.enrolled { opacity: 0.45; cursor: default; }
.ss-roster-card.enrolled:hover { transform: none; border-color: #30363d; }
.ss-roster-card.locked { opacity: 0.30; cursor: not-allowed; }
.ss-roster-card.next-up {
  border-color: #2ea043; background: linear-gradient(135deg, #0f2619, #161b22);
  box-shadow: 0 0 0 2px rgba(46, 160, 67, 0.2);
}
.ss-roster-card .ss-rank {
  font-size: 0.65rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em;
}
.ss-roster-card .ss-name {
  font-size: 0.85rem; font-weight: 600; color: #f0f6fc; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ss-roster-card .ss-band {
  font-size: 0.65rem; color: #8b949e; margin-top: 4px;
  padding: 1px 5px; display: inline-block; background: #21262d; border-radius: 3px;
}
.ss-roster-card.enrolled .ss-fate {
  position: absolute; top: 6px; right: 6px; font-size: 0.9rem;
}

.ss-current-classmate {
  background: #161b22; border: 1px solid #30363d; border-radius: 8px;
  padding: 16px 20px; margin-top: 18px;
}
.ss-current-classmate h3 { margin-bottom: 10px; }
.ss-cc-name { font-size: 1.15rem; font-weight: 700; color: #f0f6fc; margin-bottom: 4px; }
.ss-cc-meta { font-size: 0.8rem; color: #8b949e; margin-bottom: 12px; }
.ss-cc-section { margin-bottom: 10px; }
.ss-cc-section .k { font-size: 0.7rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.ss-cc-passions { display: flex; gap: 8px; flex-wrap: wrap; }
.ss-cc-passion {
  padding: 4px 8px; background: #0d1117; border: 1px solid #30363d; border-radius: 4px;
  font-size: 0.8rem;
}
.ss-cc-passion.burning { border-color: rgba(248,81,73,0.5); color: #ff7b72; }
.ss-cc-passion.interested { border-color: rgba(240,136,62,0.5); color: #f0883e; }
.ss-cc-passion.aversion { border-color: rgba(88,96,105,0.5); color: #6e7681; }
.ss-cc-traits { display: flex; gap: 6px; flex-wrap: wrap; }
.ss-cc-trait {
  padding: 3px 8px; background: rgba(88,166,255,0.08); border: 1px solid rgba(88,166,255,0.3);
  border-radius: 3px; font-size: 0.75rem; color: #79c0ff;
}
.ss-cc-narr {
  padding: 3px 8px; background: rgba(133,120,140,0.1); border: 1px dashed #484f58;
  border-radius: 3px; font-size: 0.75rem; color: #8b949e; font-style: italic;
  display: inline-block; margin: 2px 4px 2px 0;
}
.ss-cc-stat { display: inline-block; margin-right: 14px; font-size: 0.85rem; color: #c9d1d9; }
.ss-cc-stat .v { font-weight: 700; color: #f0f6fc; }

/* Departments tab — Phase 7 */
.ss-dept-bar {
  display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap;
}
.ss-dept-btn {
  background: #21262d; border: 1px solid #30363d; color: #c9d1d9;
  padding: 8px 14px; border-radius: 4px; cursor: pointer; font-family: inherit;
  font-size: 0.8rem; font-weight: 600;
}
.ss-dept-btn:hover { background: #30363d; }
.ss-dept-btn.active {
  background: #1f6feb; border-color: #1f6feb; color: white;
}
.ss-dept-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}
.ss-dept-node {
  padding: 12px 14px; background: #161b22; border: 1px solid #30363d;
  border-radius: 6px; display: flex; flex-direction: column;
  transition: border-color 0.15s;
}
.ss-dept-node:hover { border-color: #484f58; }
.ss-dept-node.owned {
  background: rgba(46, 160, 67, 0.05); border-color: rgba(46, 160, 67, 0.4);
}
.ss-dept-node.locked { opacity: 0.55; }
.ss-dept-node.unaffordable { opacity: 0.7; }
.ss-dept-node-head {
  display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
  margin-bottom: 4px;
}
.ss-dept-node-name { font-size: 0.9rem; font-weight: 700; color: #f0f6fc; }
.ss-dept-node-cost { font-size: 0.8rem; color: #7ee787; font-weight: 700; white-space: nowrap; }
.ss-dept-node.owned .ss-dept-node-cost { color: #2ea043; }
.ss-dept-node-desc { font-size: 0.78rem; color: #8b949e; line-height: 1.4; margin-bottom: 8px; flex: 1; }
.ss-dept-buy {
  margin-top: 6px; padding: 6px 12px;
  background: #238636; border: 1px solid #2ea043; color: white;
  border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 0.8rem; font-weight: 600;
  align-self: stretch;
}
.ss-dept-buy:hover:not(:disabled) { background: #2ea043; }
.ss-dept-buy:disabled { background: #30363d; border-color: #30363d; color: #6e7681; cursor: not-allowed; }

/* Alumni Hall tab — Phase 8 */
.ss-alumni-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.ss-alumnus {
  position: relative;
  padding: 14px 16px; background: #161b22; border: 1px solid #30363d;
  border-radius: 6px;
}
.ss-alumnus.famous {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.04), #161b22);
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.15);
}
.ss-alumnus-famous-tag {
  position: absolute; top: 8px; right: 10px;
  font-size: 0.65rem; color: #f1e05a; letter-spacing: 0.05em; font-weight: 700;
}
.ss-alumnus-head {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
  margin-bottom: 10px;
}
.ss-alumnus-name { font-size: 1rem; font-weight: 700; color: #f0f6fc; }
.ss-alumnus-meta { font-size: 0.7rem; color: #8b949e; margin-top: 2px; }
.ss-alumnus-fate { font-size: 0.75rem; font-weight: 700; white-space: nowrap; text-align: right; }
.ss-alumnus-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 10px;
  margin-bottom: 8px;
}
.ss-al-stat { font-size: 0.75rem; display: flex; flex-direction: column; }
.ss-al-stat .k { color: #8b949e; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.04em; }
.ss-al-stat .v { color: #f0f6fc; font-weight: 700; margin-top: 2px; }
.ss-alumnus-traits { margin: 6px 0; display: flex; flex-wrap: wrap; gap: 4px; }
.ss-alumnus-quote {
  padding: 8px 10px; background: #0d1117; border-left: 3px solid #30363d;
  border-radius: 3px; font-size: 0.75rem; font-style: italic; color: #c9d1d9;
  margin-top: 6px;
}
.ss-al-quote-src { font-style: normal; color: #6e7681; }

/* Lifetime tab — Phase 8 */
.ss-stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px; margin-bottom: 24px;
}
.ss-stat-card {
  padding: 16px; background: #161b22; border: 1px solid #30363d;
  border-radius: 6px; text-align: center;
}
.ss-stat-card-val { font-size: 1.4rem; font-weight: 700; line-height: 1; }
.ss-stat-card-lbl { font-size: 0.7rem; color: #8b949e; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.04em; }

.ss-records {
  padding: 16px; background: #161b22; border: 1px solid #30363d; border-radius: 6px;
}
.ss-record { display: flex; gap: 12px; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid #21262d; }
.ss-record:last-child { border-bottom: none; }
.ss-record .k { color: #8b949e; width: 180px; }
.ss-record .v { color: #f0f6fc; font-weight: 600; flex: 1; }

/* Accelerated-start era picker — Phase 9 */
.ss-era-section { margin-top: 24px; }
.ss-era-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.ss-era-card {
  padding: 12px 14px; background: #161b22; border: 1px solid #30363d;
  border-radius: 6px; cursor: pointer; transition: all 0.15s;
}
.ss-era-card:hover:not(.locked) { border-color: #58a6ff; transform: translateY(-2px); }
.ss-era-card.locked { opacity: 0.5; cursor: not-allowed; }
.ss-era-card.queued {
  background: linear-gradient(135deg, rgba(46,160,67,0.1), #161b22);
  border-color: #2ea043;
  box-shadow: 0 0 0 1px rgba(46,160,67,0.3);
}
.ss-era-year { font-size: 1.5rem; font-weight: 700; color: #f0f6fc; }
.ss-era-label { font-size: 0.75rem; color: #8b949e; margin-top: 2px; }
.ss-era-blurb { font-size: 0.7rem; color: #8b949e; margin-top: 6px; line-height: 1.4; min-height: 2.4em; }
.ss-era-cost { font-size: 0.8rem; color: #7ee787; font-weight: 700; margin-top: 8px; }
.ss-era-status { font-size: 0.7rem; margin-top: 4px; color: #c9d1d9; }
.ss-era-card.queued .ss-era-status { color: #7ee787; }
.ss-era-card.locked .ss-era-status { color: #f0883e; }
`;
    document.head.appendChild(s);
  }

  // ---------- Department catalog (Phase 7) ----------
  // Each department has an array of node definitions. Nodes specify:
  //   id, name, desc, cost, dept (filled by register),
  //   prereqs (optional array of other node ids),
  //   achievementGate (optional — string identifying milestone),
  //   stackable (optional boolean — can be bought multiple times; scholarship only),
  //   maxStack (optional integer, default 3 when stackable),
  //   effect (optional {kind, ...params} consumed by applyDepartmentEffects).
  // Effect kinds handled in Phase 7:
  //   startingCash   add {amount} per purchase/stack to enrollClassmate's
  //                  starting cash
  //   statBoost      {axis, amount} applied to enrolled founder's stats
  //   documentResearch  {nodeIds: [...]} added to S.school.documentedResearch
  //   schoolLab      {hardwareIds: [...]} added to S.school.labHardware
  //   hireAlumni     unlocks alumni hire pool flag (Phase 8 consumes it)
  //   clientRepBonus {amount} applied to top-5 ranks (Phase 7 soft flag)
  //   freeContract   free first-week contract on enroll (Phase 7 soft flag)
  // Achievement-gated super-unlocks (checked via S.school.lifetimeStats +
  // S.school.famousAlumni at purchase time) — stubbed here with a small
  // catalog; expand in Phase 9/10 balancing.
  const DEPARTMENT_CATALOG = {
    academics: {
      label: 'Academics',
      icon: '\uD83D\uDCDA',
      blurb: 'What the school teaches. Documenting research + endowing chairs raises the floor for every future classmate.',
      nodes: [
        { id: 'a_foundational', name: 'Foundational Curriculum', cost: 200,
          desc: 'Pre-unlocks three tier-1 research nodes for every future classmate.',
          effect: { kind: 'documentResearch', nodeIds: ['n_2d_sprites', 'n_text_parser', 'n_sound_chip'] } },
        { id: 'a_prof_tech', name: 'Hire Visiting Professor — Tech', cost: 250,
          desc: '+50 tech to every future classmate at enrollment.',
          effect: { kind: 'statBoost', axis: 'tech', amount: 50 } },
        { id: 'a_prof_design', name: 'Hire Visiting Professor — Design', cost: 250,
          desc: '+50 design to every future classmate at enrollment.',
          effect: { kind: 'statBoost', axis: 'design', amount: 50 } },
        { id: 'a_prof_polish', name: 'Hire Visiting Professor — Polish', cost: 250,
          desc: '+50 polish to every future classmate at enrollment.',
          effect: { kind: 'statBoost', axis: 'polish', amount: 50 } },
        { id: 'a_faculty_chair', name: 'Endow Faculty Chair', cost: 1000,
          desc: 'Pre-unlocks three more early research nodes (on top of Foundational).',
          prereqs: ['a_prof_tech', 'a_prof_design', 'a_prof_polish'],
          effect: { kind: 'documentResearch', nodeIds: ['n_mouse_ui', 'n_floppy_disk', 'n_basic_audio'] } },
        { id: 'a_llm_doc', name: 'Document the LLM Research', cost: 800,
          desc: 'Pre-unlocks the late-era LLM research node. Requires a past alumnus to have shipped an AI project.',
          achievementGate: 'ai_ship',
          effect: { kind: 'documentResearch', nodeIds: ['n_llm_research'] } },
      ],
    },
    facilities: {
      label: 'Facilities',
      icon: '\uD83C\uDFED',
      blurb: 'Physical hardware that used to reset each run. Once the school owns it, every classmate inherits access.',
      nodes: [
        { id: 'f_lab_basic', name: 'Build Computer Lab', cost: 150,
          desc: 'Every classmate starts with a basic dev rig pre-installed.',
          effect: { kind: 'schoolLab', hardwareIds: [] } },  // flag-only; Phase 8 may add a specific hardware id
        { id: 'f_lab_advanced', name: 'Upgrade Workstations', cost: 500,
          desc: 'Lab upgraded to professional-grade hardware.',
          prereqs: ['f_lab_basic'],
          effect: { kind: 'schoolLab', hardwareIds: [] } },
        { id: 'f_hw_sgi', name: 'SGI Workstation', cost: 400,
          desc: 'Permanent SGI workstation in the school lab.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_sgi_workstation'] } },
        { id: 'f_hw_cdmaster', name: 'CD Mastering Suite', cost: 350,
          desc: 'Permanent CD mastering rig in the school lab.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_cd_mastering'] } },
        { id: 'f_hw_server', name: 'Server Infrastructure', cost: 400,
          desc: 'Permanent server rack in the school lab.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_server_infra'] } },
        { id: 'f_hw_cloud', name: 'Cloud Credits', cost: 500,
          desc: 'Permanent cloud-compute credits the school shares.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_cloud_credits'] } },
        { id: 'f_campus_expansion', name: 'Center of Innovation Wing', cost: 1200,
          desc: 'A dedicated campus expansion. Pre-unlocks the era\u2019s best hardware. Requires a past run that reached 2020+.',
          achievementGate: 'reached_2020',
          effect: { kind: 'schoolLab', hardwareIds: ['h_sgi_workstation', 'h_cd_mastering', 'h_server_infra', 'h_cloud_credits'] } },
      ],
    },
    alumniNetwork: {
      label: 'Alumni Network',
      icon: '\uD83E\uDD1D',
      blurb: 'The professional + social capital the school builds as each cohort graduates.',
      nodes: [
        { id: 'n_job_board', name: 'Formalize Alumni Job Board', cost: 250,
          desc: 'Past alumni become hireable senior staff at premium salary.',
          effect: { kind: 'hireAlumni' } },
        { id: 'n_gold_diploma', name: 'Gold-Plated Diploma', cost: 400,
          desc: 'Top-5-ranked graduates open with +1 client-tier reputation.',
          effect: { kind: 'clientRepBonus', amount: 1 } },
        { id: 'n_connections', name: 'Alumni Connections', cost: 200,
          desc: 'Every classmate gets a guaranteed contract offer in their first in-game week.',
          effect: { kind: 'freeContract' } },
        { id: 'n_every_camp', name: 'Alumni in Every Camp', cost: 1000,
          desc: 'Your reputation precedes you. All contract payouts +15%. Requires 3+ win-condition runs.',
          achievementGate: 'three_wins',
          effect: { kind: 'contractBonusMul', mul: 1.15 } },
      ],
    },
    schoolLife: {
      label: 'School Life',
      icon: '\uD83C\uDF93',
      blurb: 'Morale, rivalry, and soft culture — smaller buffs that add up.',
      nodes: [
        { id: 'sl_scholarship', name: 'Scholarship Fund', cost: 100, stackable: true, maxStack: 3,
          desc: 'Every classmate starts with +$25K cash. Stacks up to 3× for +$75K.',
          effect: { kind: 'startingCash', amount: 25000 } },
        { id: 'sl_rivalry', name: 'Celebrated Rivalry', cost: 300,
          desc: 'Adds a named antagonistic rival studio to the persistent market roster. (Phase 8 wires the rival spawn.)',
          effect: { kind: 'spawnRival' } },
        { id: 'sl_newsletter', name: 'School Newsletter', cost: 250,
          desc: 'Each shipped project gets a bonus review quote from the school\u2019s own press. (Phase 8 wires the review.)',
          effect: { kind: 'extraReview' } },
        { id: 'sl_legend_hall', name: 'Legend Lecture Hall', cost: 1500,
          desc: 'A hall named after a great alumnus. Every future classmate begins with +10 Fame. Requires a past founder who won 2+ GOTY awards.',
          achievementGate: 'goty_double',
          effect: { kind: 'startingFame', amount: 10 } },
      ],
    },
  };

  // Flatten catalog for quick lookup
  const NODE_BY_ID = {};
  for (const [deptId, dept] of Object.entries(DEPARTMENT_CATALOG)) {
    for (const node of dept.nodes) {
      node.dept = deptId;
      NODE_BY_ID[node.id] = node;
    }
  }

  // ---------- Achievement gate checks ----------
  function achievementGateMet(gateId) {
    const ls = S.school?.lifetimeStats || {};
    const alumni = S.school?.alumniHall || [];
    switch (gateId) {
      case 'ai_ship':
        return alumni.some(a => {
          // Any past run where an AI-type project shipped. We don't persist
          // individual projects cross-run (Phase 4 only snapshots stats), so
          // we approximate: if any shipped project type hit in any run.
          // Phase 8 will track this more precisely.
          return a.shippedCount > 0 && a.year >= 2020;
        });
      case 'three_wins':
        return (ls.winConditionRuns || 0) >= 3;
      case 'reached_2020':
        return alumni.some(a => (a.year || 0) >= 2020);
      case 'goty_double':
        // Stub for Phase 9 — requires per-alumnus award tracking that
        // Phase 8 adds. False for now so the node is always gated.
        return false;
      default:
        return true;
    }
  }

  // ---------- Purchase state helpers ----------
  function purchaseCount(nodeId) {
    const dept = NODE_BY_ID[nodeId]?.dept;
    if (!dept) return 0;
    const list = S.school?.departments?.[dept] || [];
    return list.filter(id => id === nodeId).length;
  }
  function isPurchased(nodeId) { return purchaseCount(nodeId) > 0; }
  function canPurchase(nodeId) {
    const node = NODE_BY_ID[nodeId];
    if (!node) return { ok: false, reason: 'unknown node' };
    if (node.achievementGate && !achievementGateMet(node.achievementGate)) {
      return { ok: false, reason: 'gated: milestone unmet' };
    }
    if (node.prereqs) {
      for (const pr of node.prereqs) {
        if (!isPurchased(pr)) return { ok: false, reason: 'prereq: ' + (NODE_BY_ID[pr]?.name || pr) };
      }
    }
    if (!node.stackable && isPurchased(nodeId)) {
      return { ok: false, reason: 'already purchased' };
    }
    if (node.stackable && purchaseCount(nodeId) >= (node.maxStack || 3)) {
      return { ok: false, reason: 'max stack reached' };
    }
    if ((S.school?.endowment || 0) < node.cost) {
      return { ok: false, reason: 'not enough endowment' };
    }
    return { ok: true };
  }

  function purchaseNode(nodeId) {
    const check = canPurchase(nodeId);
    if (!check.ok) return check;
    const node = NODE_BY_ID[nodeId];
    S.school.endowment -= node.cost;
    if (!Array.isArray(S.school.departments?.[node.dept])) {
      S.school.departments = S.school.departments || {};
      S.school.departments[node.dept] = [];
    }
    S.school.departments[node.dept].push(nodeId);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('\uD83C\uDFEB Purchased: ' + node.name + ' (\u2212' + node.cost + ')');
    return { ok: true, node };
  }

  // ---------- Apply department effects (called by enrollClassmate) ----------
  // Walks every purchased node and mutates the about-to-be-enrolled founder
  // state accordingly. Called with the built-up S.* and S.founder — mutates
  // them in place. Safe to call with zero purchases (no-op).
  function applyDepartmentEffects() {
    if (!S.school?.departments) return;
    for (const [deptId, purchases] of Object.entries(S.school.departments)) {
      for (const nodeId of purchases) {
        const node = NODE_BY_ID[nodeId];
        if (!node?.effect) continue;
        const eff = node.effect;
        switch (eff.kind) {
          case 'startingCash':
            S.cash = (S.cash || 0) + (eff.amount || 0);
            break;
          case 'statBoost':
            if (S.founder?.stats && eff.axis) {
              S.founder.stats[eff.axis] = (S.founder.stats[eff.axis] || 0) + (eff.amount || 0);
            }
            break;
          case 'documentResearch':
            for (const id of (eff.nodeIds || [])) {
              if (!S.research.completed.includes(id)) S.research.completed.push(id);
              // Also stamp into S.school.documentedResearch so future runs
              // don't need the node purchase repeated
              if (!S.school.documentedResearch.includes(id)) S.school.documentedResearch.push(id);
            }
            break;
          case 'schoolLab':
            for (const hwId of (eff.hardwareIds || [])) {
              if (!S.school.labHardware.includes(hwId)) S.school.labHardware.push(hwId);
              if (!(S.hardware || []).some(h => h.id === hwId)) {
                S.hardware.push({ id: hwId, purchasedAtWeek: 0 });
              }
            }
            break;
          case 'startingFame':
            S.fame = (S.fame || 0) + (eff.amount || 0);
            S.tFame = (S.tFame || 0) + (eff.amount || 0);
            break;
          case 'spawnRival':
            // Phase 8: Celebrated Rivalry adds a persistent named rival to
            // S.school.rivalAlumni. On enroll, these get injected into the
            // run's rival roster (see injectSchoolRivals below).
            if (!S.school.rivalAlumni.some(r => r.source === 'rivalry_node')) {
              S.school.rivalAlumni.push({
                source: 'rivalry_node',
                name: 'Crosstown Dynamics',
                founderName: 'The Rival',
                icon: '\uD83D\uDC65',
                strength: 'aggressive',
                seededByNodeId: nodeId,
              });
            }
            break;
          case 'startingFame':
            S.fame = (S.fame || 0) + (eff.amount || 0);
            S.tFame = (S.tFame || 0) + (eff.amount || 0);
            break;
          // v11.1: Alumni Network effects wired here. clientRepBonus opens
          // the next client tier for Top-5-ranked classmates. freeContract
          // adds a guaranteed contract offer to the queue. hireAlumni sets
          // a flag read by tycoonHiring each tick to inject an alumnus-
          // sourced candidate. contractBonusMul is read at ship time in
          // 13-tycoon-projects (no state here needed).
          case 'clientRepBonus': {
            const rank = S.school?.currentClassmateRank;
            if (typeof rank === 'number' && rank <= 5) {
              // S.clientReputation may not exist yet — contracts module inits
              // it lazily on first use. Seed it here so we can flip unlocks.
              if (!S.clientReputation) {
                S.clientReputation = {
                  small_biz:  { avg: 0, count: 0, unlocked: true  },
                  enterprise: { avg: 0, count: 0, unlocked: false },
                  tech_giant: { avg: 0, count: 0, unlocked: false },
                  government: { avg: 0, count: 0, unlocked: false },
                };
              }
              for (const tierId of ['enterprise','tech_giant','government']) {
                const rep = S.clientReputation[tierId];
                if (rep && !rep.unlocked) {
                  rep.unlocked = true;
                  if (typeof log === 'function') log('\uD83C\uDF93 Gold-Plated Diploma: ' + tierId + ' client tier unlocked early');
                  break;
                }
              }
            }
            break;
          }
          case 'freeContract': {
            // Seed a starter contract in the offer queue so week 1 isn't a
            // runway cliff. Uses the contract module's generator if it can
            // produce one; otherwise a minimal hand-rolled fallback.
            if (window.tycoonContracts?.forceOffer) {
              window.tycoonContracts.forceOffer();
            } else if (S.projects?.contracts) {
              S.projects.contracts.push({
                id: 'free_' + Date.now().toString(36),
                clientName: 'Alumni Connections',
                clientTier: 'small_biz',
                clientTierIcon: '\uD83D\uDCBC',
                clientTierLabel: 'Small Biz',
                projectName: 'Starter Tool',
                projectType: 'business',
                scope: 'small',
                allFeatures: [],
                features: [],
                payment: 15000,
                deadline: (window.tycoonProjects?.absoluteWeek?.() || 0) + 24,
                offeredAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
                expiresAtWeek: (window.tycoonProjects?.absoluteWeek?.() || 0) + 6,
              });
            }
            if (typeof log === 'function') log('\uD83E\uDD1D Alumni Connections: starter contract offer added');
            break;
          }
          // hireAlumni consumed by tycoonHiring.maybeGenerateAlumniCandidate
          // (wired in 18-tycoon-hiring.js onWeekTick).
          // extraReview consumed in shipProject (already wired).
          // contractBonusMul consumed at ship payout (already wired).
          default:
            break;
        }
      }
    }
    // injectSchoolRivals is called from enrollClassmate AFTER tycoonUI
    // enter so the default rival seeding happens first. Don't call it
    // here.
  }

  // Default fields required by tycoonRivals.onWeekTick (see 23-tycoon-rivals.js).
  // School rivals are narrative/fame-focused — they occupy a seat in the
  // competitive landscape but don't actively research or ship. Empty priorityNodes
  // + rpPerWeek=0 means the research branch is a no-op; empty focus means
  // scheduleNextProject exits early. annualRevHistory is seeded so quarterlyUpdate
  // can push without crashing.
  function schoolRivalDefaults() {
    return {
      priorityNodes: [],
      completedResearch: [],
      inProgress: null,
      focus: [],
      rpPerWeek: 0,
      tier: 2,
      revenue: 500_000,
      annualRevHistory: [],
      teamSize: 10,
      quality: 65,
      trajectory: 0,
      marketShare: 0,
      nextProject: null,
      shippedCount: 0,
      nextWeekToSchedule: 0,
      weeksOfDecline: 0,
      spawnedWithOffset: 0,
    };
  }

  // Seed S.rivals with any school-level rival entries (Celebrated Rivalry
  // node + famous alumni bleed-in). Idempotent — skips entries already
  // represented by name.
  function injectSchoolRivals() {
    if (!Array.isArray(S.rivals)) S.rivals = [];
    const alreadyThere = new Set(S.rivals.map(r => r.name));
    // 1. Named rivals from the rivalAlumni list
    for (const ra of (S.school?.rivalAlumni || [])) {
      if (alreadyThere.has(ra.name)) continue;
      S.rivals.push(Object.assign(schoolRivalDefaults(), {
        id: 'r_school_' + (ra.source || 'x') + '_' + (ra.name || '').replace(/\s+/g, '_'),
        name: ra.name,
        founderName: ra.founderName || ra.name,
        icon: ra.icon || '\uD83C\uDFEB',
        status: 'active',
        fame: 60,
        founded: 1980,
        aggressiveness: ra.strength === 'aggressive' ? 0.9 : 0.7,
        schoolRival: true,
      }));
    }
    // 2. Famous alumni (win_condition / megacorp_exit) become rival studios
    for (const a of (S.school?.famousAlumni || [])) {
      const rivalName = a.name + '\u2019s Studio';
      if (alreadyThere.has(rivalName)) continue;
      S.rivals.push(Object.assign(schoolRivalDefaults(), {
        id: 'r_famous_' + a.name.replace(/\s+/g, '_') + '_' + (a.year || 1980),
        name: rivalName,
        founderName: a.name,
        icon: '\u2B50',
        status: 'active',
        fame: Math.max(80, Math.min(250, a.finalFame || 80)),
        founded: a.foundedAt || 1980,
        aggressiveness: 0.85,
        schoolRival: true,
        fromAlumnusFate: a.fate,
        // Famous alumni get a slight tier/quality bump to reflect their pedigree
        tier: 3,
        quality: 72,
        revenue: 2_000_000,
      }));
    }
  }

  // ---------- Specialty inference (Phase 6) ----------
  // Each tycoon specialty maps to a primary axis (per SPECIALTY_AXIS in 13).
  // We pick the specialty whose axis matches the classmate's highest passion.
  const SPECIALTY_BY_AXIS = {
    tech:   ['coder', 'backend', 'network', 'cloud'],
    design: ['gamedev', 'webdev', 'frontend', 'agent'],
    polish: ['mobile', 'devops'],
  };
  const PASSION_RANK = { burning: 3, interested: 2, none: 1, aversion: 0 };
  function inferSpecialty(classmate) {
    if (!classmate?.passions) return 'coder';
    const axes = ['tech', 'design', 'polish'];
    // Rank axes by passion level; break ties on stat value
    axes.sort((a, b) => {
      const pa = PASSION_RANK[classmate.passions[a]] ?? 1;
      const pb = PASSION_RANK[classmate.passions[b]] ?? 1;
      if (pb !== pa) return pb - pa;
      return (classmate.stats?.[b] || 0) - (classmate.stats?.[a] || 0);
    });
    const topAxis = axes[0];
    const candidates = SPECIALTY_BY_AXIS[topAxis] || ['coder'];
    // Pick deterministically based on classmate rank so the same classmate
    // always gets the same specialty (not random each enroll).
    return candidates[(classmate.rank || 0) % candidates.length];
  }

  // ---------- Premium era-start curriculum (Phase 9) ----------
  // Softens the Q5 "always 1980" lock as an earned privilege. Only the
  // enrollment flow consumes it — after the classmate loads into tycoon,
  // era is just the standard calendar year in S.calendar.
  const ERA_STARTS = [
    { id: 'era_1985', year: 1985, cost: 300,  reqWins: 1, label: 'Accelerated Start — 1985',
      blurb: 'Second-gen hardware era. Console launches in full swing.' },
    { id: 'era_1995', year: 1995, cost: 800,  reqWins: 3, label: 'Accelerated Start — 1995',
      blurb: 'CD-ROM era. Web rising. Dot-com smoke on the horizon.' },
    { id: 'era_2005', year: 2005, cost: 1500, reqWins: 5, label: 'Accelerated Start — 2005',
      blurb: 'Post-crash rebuild. Broadband ubiquitous. First smartphones.' },
    { id: 'era_2015', year: 2015, cost: 3000, reqWins: 8, label: 'Accelerated Start — 2015',
      blurb: 'Cloud-native dominance. Gig economy. AI winter thawing.' },
  ];
  function eraStartEligibility(opt) {
    const wins = S.school?.lifetimeStats?.winConditionRuns || 0;
    const endow = S.school?.endowment || 0;
    const needsWins = Math.max(0, opt.reqWins - wins);
    const affordable = endow >= opt.cost;
    return { affordable, unlocked: needsWins === 0, needsWins, eligible: affordable && needsWins === 0 };
  }

  // ---------- Rank labels (Phase 6 flavor) ----------
  function rankLabel(rank) {
    if (rank === 1) return 'Valedictorian';
    if (rank === 2) return 'Salutatorian';
    if (rank <= 5) return 'Honors graduate';
    if (rank <= 12) return 'Cum laude';
    if (rank <= 25) return 'Distinguished';
    if (rank <= 37) return 'Pass';
    if (rank <= 45) return 'Late bloomer';
    return 'Bottom of class';
  }

  // Pick the classmate that's next up.
  // v11.3: Replaces the old "always start at the bottom, climb by 1" logic
  // with a bell-curve-weighted random pick of the unenrolled ranks. Each
  // new run most often lands mid-class; top-5 or bottom-5 picks are rare.
  // The result is cached on S.school.nextClassmateRank so re-renders don't
  // reshuffle the choice — enrollClassmate clears the cache so the next
  // run rolls fresh.
  function nextUpRank() {
    if (!Array.isArray(S.school?.classRoster)) return null;
    const unenrolled = S.school.classRoster.filter(c => !c.enrolled);
    if (unenrolled.length === 0) return null;
    // Validate any cached pick — could be stale if the classmate was
    // enrolled via a different code path or if the roster was reset.
    const cached = S.school?.nextClassmateRank;
    if (typeof cached === 'number' && unenrolled.some(c => c.rank === cached)) {
      return cached;
    }
    const picked = sampleRankBellCurve(unenrolled);
    if (!S.school) S.school = {};
    S.school.nextClassmateRank = picked;
    if (typeof markDirty === 'function') markDirty();
    return picked;
  }

  // Bell-curve sampler — sum of 3 uniforms on [0,1] gives a symmetric,
  // roughly triangular distribution peaked at 0.5 (mean 0.5, stddev ~0.167).
  // We map that sample onto the rank-sorted list of unenrolled classmates,
  // so the middle rank is the most likely draw and the extremes (rank 1
  // top-of-class, rank 50 bottom-of-class) are rare. With 50 classmates,
  // each extreme decile gets roughly ~4% of the draws.
  function sampleRankBellCurve(unenrolledClassmates) {
    const sortedByRank = unenrolledClassmates.slice().sort((a, b) => a.rank - b.rank);
    const N = sortedByRank.length;
    if (N === 1) return sortedByRank[0].rank;
    const r = (Math.random() + Math.random() + Math.random()) / 3;
    let idx = Math.floor(r * N);
    if (idx >= N) idx = N - 1;
    if (idx < 0) idx = 0;
    return sortedByRank[idx].rank;
  }

  // Enroll a classmate — reset per-run state, copy classmate → founder,
  // and enter tycoon mode. Preserves S.school (the persistent meta).
  function enrollClassmate(rank) {
    if (!Array.isArray(S.school?.classRoster)) return { ok: false, error: 'No class roster' };
    const classmate = S.school.classRoster.find(c => c.rank === rank);
    if (!classmate) return { ok: false, error: 'Classmate not found' };
    if (classmate.enrolled) return { ok: false, error: 'Classmate already played' };

    // Reset per-run state (preserve S.school)
    // Phase 7: starting cash is the base + any Department bonuses applied
    // later via applyDepartmentEffects(). Start clean and let the effects
    // pipeline add up Scholarship Fund stacks, school lab hardware, etc.
    S.cash = 50000;
    S.tRevenue = 0;
    S.tExpenses = 0;
    S.tFame = 0;
    S.fame = 0;
    // Phase 9: accelerated-start era (Q5 lock relaxed). If the player queued
    // an era option, use its year and charge its cost. Otherwise default 1980.
    let startYear = 1980;
    const queued = S.school?.queuedEraStart
      ? ERA_STARTS.find(e => e.id === S.school.queuedEraStart)
      : null;
    if (queued) {
      const elig = eraStartEligibility(queued);
      if (elig.eligible) {
        S.school.endowment -= queued.cost;
        startYear = queued.year;
        if (typeof log === 'function') log('\uD83C\uDF93 Enrolled with ' + queued.label + ' (\u2212' + queued.cost + ' endow)');
      }
    }
    S.school.queuedEraStart = null;
    // v11.3: clear the cached next-classmate pick so the next run rolls a
    // fresh bell-curve-weighted rank (otherwise the same rank would re-surface).
    S.school.nextClassmateRank = null;
    S.calendar = { week: 1, month: 1, year: startYear };
    S.projects = { active: [], shipped: [], contracts: [] };
    S.employees = [];
    S.loans = [];
    S.bankruptcy = { negativeWeeks: 0, triggered: false };
    S.warnings = { runway6mo: false, runway3mo: false, runway1mo: false };
    S.hiring = { queue: [], fairIndex: 0 };
    // Delete S.rivals so tycoonRivals.ensureState re-seeds the starting
    // roster on enter. injectSchoolRivals runs AFTER enter to layer on
    // any school-specific rivals without blocking the default seed.
    delete S.rivals;
    delete S.rivalMeta;
    delete S.researchPioneers;
    delete S.rivalShippedTitles;
    S.awards = { history: [] };
    S.subsidiaries = [];
    S.vcRounds = [];
    S.legacyDecisions = [];
    S.hintsShown = [];
    S.hintsDisabled = false;
    delete S._runEndFired;
    S.speed = 1;
    S.paused = false;

    // Research: pre-unlocked from documented curriculum
    S.research = { completed: [...(S.school.documentedResearch || [])], inProgress: null };
    // Hardware: pre-installed from school lab
    S.hardware = (S.school.labHardware || []).map(id => ({ id, purchasedAtWeek: 0 }));

    // Phase 6: auto-pick specialty from the classmate's highest-passion axis.
    // Burning > Interested > None > Aversion. If tied, prefer the axis where
    // the classmate has the highest stat. Specialty is pure tycoon-era
    // (match-bonus target in developOneWeek) so aligning it with the
    // classmate's passion axis gives them a coherent play identity.
    const specialty = inferSpecialty(classmate);

    // Founder built from the classmate snapshot
    S.founder = {
      name: classmate.name,
      specialty,                 // auto-picked from passions
      tier: 1, tierName: 'Junior Dev', exp: 0,
      stats: {
        // v11.2: fallbacks and speed scaled 10x (10-100 range).
        tech:   classmate.stats.tech   || 100,
        design: classmate.stats.design || 100,
        polish: classmate.stats.polish || 100,
        speed:  40,
      },
      morale: 70,
      age: classmate.age,
      retireAge: 57 + Math.floor(Math.random() * 12),
      traits: [],
      isFounder: true,
      // Roguelite layer — copied straight from classmate
      passions: { ...classmate.passions },
      mechanicalTraits: [...classmate.mechanicalTraits],
      narrativeTraits: [...classmate.narrativeTraits],
      classmateRank: classmate.rank,
      classmateBand: classmate.band,
    };
    S.careerStarted = true;
    S.careerStartedAt = Date.now();
    S.studioName = classmate.name.split(' ')[0] + '\u2019s Studio'; // default; player can rename later

    S.school.currentClassmateRank = rank;
    S.school.currentRunNumber = (S.school.currentRunNumber || 0) + 1;

    // Mark roster slot as enrolled immediately — fate + endedAtYear are
    // stamped later at endRun. Prevents the Admissions tab from showing
    // the active classmate as "next up" if the player save-exits mid-run.
    classmate.enrolled = true;
    classmate.enrolledAtYear = S.calendar.year;

    // Phase 7: apply all purchased Department effects now that the base
    // founder + run state is built. Scholarship Fund stacks add to cash,
    // Visiting Professors bump stats, curriculum adds pre-unlocked research,
    // school lab adds hardware, etc.
    // Note: applyDepartmentEffects no longer calls injectSchoolRivals —
    // we run that AFTER tycoonUI.enter so rivals are seeded first.
    applyDepartmentEffects();

    if (typeof markDirty === 'function') markDirty();
    closeSchoolScreen();
    if (window.tycoonUI?.enter) window.tycoonUI.enter({ skipCreator: true });
    // Now that tycoonRivals.ensureState has seeded the starting 5 (and
    // applied Phase 9 rival scaling via S.school.currentRunNumber),
    // layer on the school-level rivals (Celebrated Rivalry + famous
    // alumni bleed-in).
    injectSchoolRivals();
    return { ok: true, classmate };
  }

  // ---------- Tab renderers ----------
  // We keep renderers pure (no side effects) so the school screen can be
  // rebuilt on each tab switch without leaking listeners.
  function hEl(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'className') el.className = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(el.style, attrs[k]);
      else if (k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      if (typeof c === 'string' || typeof c === 'number') {
        el.appendChild(document.createTextNode(String(c)));
      } else {
        el.appendChild(c);
      }
    }
    return el;
  }

  function fateIcon(fate) {
    return { bankruptcy: '\uD83D\uDC80', age_retired: '\uD83D\uDC74',
             retire_voluntary: '\uD83C\uDF93', megacorp_exit: '\uD83D\uDCB0',
             win_condition: '\uD83C\uDFC6' }[fate] || '';
  }

  function renderAdmissionsTab() {
    const roster = S.school?.classRoster || [];
    const nextRank = nextUpRank();
    const next = roster.find(c => c.rank === nextRank);
    const unenrolled = roster.filter(c => !c.enrolled).length;
    const enrolled = roster.length - unenrolled;

    // v11.3: the full 50-card roster grid used to live here. It was hidden
    // because (a) with the bell-curve-weighted next-classmate picker, there's
    // no longer a deterministic "locked / next-up" order to visualize, and
    // (b) the Alumni Hall tab already shows the classmates who've played,
    // so there's no surprise value in seeing unplayed ranks up front. The
    // "Next up" detail block below reveals this run's random pick.

    const currentBlock = next ? (() => {
      const pe = (axis) => {
        const p = next.passions[axis];
        return hEl('span', { className: 'ss-cc-passion ' + (p || 'none') },
          ({ burning: '\uD83D\uDD25\uD83D\uDD25', interested: '\uD83D\uDD25', none: '\u25A1', aversion: '\u{1F6AB}' }[p] || '') + ' ' + axis);
      };
      return hEl('div', { className: 'ss-current-classmate' },
        hEl('h3', null, 'Next up — Rank #' + next.rank),
        hEl('div', { className: 'ss-cc-name' }, next.name),
        hEl('div', { className: 'ss-cc-meta' }, 'Age ' + next.age + ' \u00B7 band: ' + next.band.replace('_', ' ')),
        hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Stats'),
          hEl('div', null,
            hEl('span', { className: 'ss-cc-stat' }, 'Tech ',   hEl('span', { className: 'v' }, String(next.stats.tech))),
            hEl('span', { className: 'ss-cc-stat' }, 'Design ', hEl('span', { className: 'v' }, String(next.stats.design))),
            hEl('span', { className: 'ss-cc-stat' }, 'Polish ', hEl('span', { className: 'v' }, String(next.stats.polish)))
          )
        ),
        hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Passions'),
          hEl('div', { className: 'ss-cc-passions' }, pe('tech'), pe('design'), pe('polish'))
        ),
        next.mechanicalTraits.length ? hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Traits'),
          hEl('div', { className: 'ss-cc-traits' },
            ...next.mechanicalTraits.map(tId => {
              const t = window.tycoonTraits?.TRAITS_BY_ID?.[tId];
              return hEl('span', { className: 'ss-cc-trait', title: t?.desc || '' }, t?.name || tId);
            })
          )
        ) : null,
        next.narrativeTraits.length ? hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Personality'),
          hEl('div', null, ...next.narrativeTraits.map(n => hEl('span', { className: 'ss-cc-narr' }, n)))
        ) : null
      );
    })() : null;

    return hEl('div', null,
      hEl('h2', null, 'Admissions'),
      hEl('div', { style: { fontSize: '0.85rem', color: '#8b949e', marginBottom: '14px' } },
        'Class of ' + (S.school?.foundedYear || 1980) + ' \u00B7 '
        + enrolled + ' enrolled, ' + unenrolled + ' remaining'),
      currentBlock,
      renderEraStartRow()
    );
  }

  // ---------- Accelerated-start era picker (Phase 9) ----------
  function renderEraStartRow() {
    const queuedId = S.school?.queuedEraStart || null;
    const rows = ERA_STARTS.map(opt => {
      const e = eraStartEligibility(opt);
      const queued = queuedId === opt.id;
      const cls = 'ss-era-card'
        + (queued ? ' queued' : '')
        + (e.eligible ? '' : ' locked');
      const statusLine = (() => {
        if (queued) return '\u2713 Queued for next enrollment';
        if (!e.unlocked) return '\uD83D\uDD12 ' + e.needsWins + ' more win' + (e.needsWins === 1 ? '' : 's') + ' needed';
        if (!e.affordable) return '\uD83D\uDCB8 Need ' + (opt.cost - (S.school?.endowment || 0)).toLocaleString() + ' more endowment';
        return '\u2728 Ready';
      })();
      return hEl('div', {
        className: cls,
        onclick: () => {
          if (!e.eligible) return;
          // Toggle: clicking a queued option un-queues it
          S.school.queuedEraStart = queued ? null : opt.id;
          rerenderSchoolScreen();
        }
      },
        hEl('div', { className: 'ss-era-year' }, opt.year),
        hEl('div', { className: 'ss-era-label' }, opt.label.replace('Accelerated Start — ', '')),
        hEl('div', { className: 'ss-era-blurb' }, opt.blurb),
        hEl('div', { className: 'ss-era-cost' }, '\uD83C\uDF93 ' + opt.cost.toLocaleString()),
        hEl('div', { className: 'ss-era-status' }, statusLine)
      );
    });
    return hEl('div', { className: 'ss-era-section' },
      hEl('h3', null, 'Advanced Curriculum — skip ahead in time'),
      hEl('div', { style: { fontSize: '0.8rem', color: '#8b949e', marginBottom: '10px' } },
        'Gated by win-condition runs + endowment. Click to queue for the next enrollment; click again to clear.'),
      hEl('div', { className: 'ss-era-grid' }, ...rows)
    );
  }

  // ---------- Classmate detail modal (Phase 6) ----------
  // Opens when any roster card is clicked. Shows full passions + traits +
  // narrative + fate info. If the clicked classmate is the next-up, the
  // modal offers an Enroll button. Locked classmates show a "locked until
  // rank N" message; enrolled classmates show their fate summary.
  function openClassmateDetail(rank) {
    const roster = S.school?.classRoster || [];
    const c = roster.find(x => x.rank === rank);
    if (!c) return;
    const nextRank = nextUpRank();
    const isNext = c.rank === nextRank;
    const isLocked = !c.enrolled && !isNext;

    // Styling helper — renders a passion pill
    const passionPill = (axis) => {
      const p = c.passions?.[axis] || 'none';
      const icon = { burning: '\uD83D\uDD25\uD83D\uDD25', interested: '\uD83D\uDD25',
                     none: '\u25A1', aversion: '\u{1F6AB}' }[p] || '';
      return hEl('span', { className: 'ss-cc-passion ' + p },
        icon + ' ' + axis + ' — ' + p);
    };

    // Traits block
    const traitsBlock = c.mechanicalTraits.length
      ? hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Mechanical traits'),
          hEl('div', { className: 'ss-cc-traits' },
            ...c.mechanicalTraits.map(tId => {
              const t = window.tycoonTraits?.TRAITS_BY_ID?.[tId];
              return hEl('span', { className: 'ss-cc-trait', title: t?.desc || '' }, t?.name || tId);
            })
          )
        )
      : null;

    const narrativeBlock = c.narrativeTraits.length
      ? hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Personality'),
          hEl('div', null, ...c.narrativeTraits.map(n => hEl('span', { className: 'ss-cc-narr' }, n)))
        )
      : null;

    // Header
    const specialty = inferSpecialty(c);
    const labelTxt = rankLabel(c.rank);
    const header = hEl('div', null,
      hEl('div', { style: { fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em' } },
        'Rank #' + c.rank + ' \u00B7 ' + labelTxt + ' \u00B7 ' + c.band.replace('_', ' ')),
      hEl('h2', { style: { fontSize: '1.3rem', color: '#f0f6fc', margin: '4px 0' } }, c.name),
      hEl('div', { style: { fontSize: '0.8rem', color: '#8b949e' } },
        'Age ' + c.age + ' \u00B7 inferred specialty: ' + specialty)
    );

    // Status block — enrolled / locked / ready
    let statusBlock;
    if (c.enrolled) {
      const fateLabel = {
        bankruptcy: '\uD83D\uDC80 Went bankrupt',
        age_retired: '\uD83D\uDC74 Retired at age-out',
        retire_voluntary: '\uD83C\uDF93 Retired voluntarily',
        megacorp_exit: '\uD83D\uDCB0 Sold to Megacorp',
        win_condition: '\uD83C\uDFC6 Triumphant exit',
      }[c.fate] || c.fate || 'played';
      statusBlock = hEl('div', {
        style: { padding: '10px 14px', background: '#21262d', borderRadius: '4px', marginTop: '12px', fontSize: '0.85rem' }
      },
        hEl('div', { style: { color: '#c9d1d9' } }, 'Fate: ', fateLabel),
        c.enrolledAtYear ? hEl('div', { style: { color: '#8b949e', fontSize: '0.75rem', marginTop: '2px' } },
          'Enrolled ' + c.enrolledAtYear + (c.endedAtYear ? ' \u2192 ended ' + c.endedAtYear : '')) : null
      );
    } else if (isLocked) {
      statusBlock = hEl('div', {
        style: { padding: '10px 14px', background: 'rgba(240,136,62,0.08)', border: '1px solid rgba(240,136,62,0.3)', borderRadius: '4px', marginTop: '12px', fontSize: '0.85rem', color: '#f0883e' }
      }, '\uD83D\uDD12 Locked — enroll Rank #' + nextRank + ' first. The class climbs from the bottom up.');
    } else {
      statusBlock = hEl('div', {
        style: { padding: '10px 14px', background: 'rgba(46,160,67,0.1)', border: '1px solid rgba(46,160,67,0.4)', borderRadius: '4px', marginTop: '12px', fontSize: '0.85rem', color: '#7ee787' }
      }, '\u2B50 Next up — ready to enroll');
    }

    // Actions
    const actions = [
      hEl('button', { className: 't-btn secondary', onclick: () => ov.remove() }, 'Close')
    ];
    if (isNext) {
      actions.push(hEl('button', { className: 't-btn', onclick: () => {
        ov.remove();
        enrollClassmate(c.rank);
      } }, 'Enroll ' + c.name.split(' ')[0]));
    }

    const ov = hEl('div', {
      className: 't-modal-ov',
      id: '_t_classmate_modal',
      onclick: (e) => { if (e.target.id === '_t_classmate_modal') ov.remove(); }
    },
      hEl('div', { className: 't-modal', style: { maxWidth: '560px' } },
        header,
        statusBlock,
        hEl('div', { className: 'ss-cc-section', style: { marginTop: '14px' } },
          hEl('div', { className: 'k' }, 'Stats'),
          hEl('div', null,
            hEl('span', { className: 'ss-cc-stat' }, 'Tech ',   hEl('span', { className: 'v' }, String(c.stats.tech))),
            hEl('span', { className: 'ss-cc-stat' }, 'Design ', hEl('span', { className: 'v' }, String(c.stats.design))),
            hEl('span', { className: 'ss-cc-stat' }, 'Polish ', hEl('span', { className: 'v' }, String(c.stats.polish)))
          )
        ),
        hEl('div', { className: 'ss-cc-section' },
          hEl('div', { className: 'k' }, 'Passions'),
          hEl('div', { className: 'ss-cc-passions' },
            passionPill('tech'), passionPill('design'), passionPill('polish'))
        ),
        traitsBlock,
        narrativeBlock,
        hEl('div', { className: 't-modal-actions' }, ...actions)
      )
    );
    document.body.appendChild(ov);
  }

  // ---------- Departments tab (Phase 7) ----------
  let _activeDept = 'academics';
  function renderDepartmentsTab() {
    const depts = Object.entries(DEPARTMENT_CATALOG);
    const deptBar = hEl('div', { className: 'ss-dept-bar' },
      ...depts.map(([id, d]) => hEl('button', {
        className: 'ss-dept-btn' + (id === _activeDept ? ' active' : ''),
        onclick: () => { _activeDept = id; rerenderSchoolScreen(); }
      }, d.icon + ' ' + d.label))
    );
    const active = DEPARTMENT_CATALOG[_activeDept];
    if (!active) return hEl('div', null, 'No department selected');
    const nodes = active.nodes.map(node => renderDeptNodeCard(node));
    return hEl('div', null,
      hEl('h2', null, active.icon + ' ' + active.label),
      hEl('div', { style: { fontSize: '0.85rem', color: '#8b949e', marginBottom: '10px' } }, active.blurb),
      deptBar,
      hEl('div', { className: 'ss-dept-grid' }, ...nodes)
    );
  }

  function renderDeptNodeCard(node) {
    const owned = purchaseCount(node.id);
    const maxStack = node.stackable ? (node.maxStack || 3) : 1;
    const fullyOwned = owned >= maxStack;
    const check = canPurchase(node.id);
    const affordable = (S.school?.endowment || 0) >= node.cost;
    const gated = node.achievementGate && !achievementGateMet(node.achievementGate);
    const prereqUnmet = node.prereqs && !node.prereqs.every(isPurchased);

    const cls = 'ss-dept-node'
      + (fullyOwned ? ' owned' : '')
      + (gated || prereqUnmet ? ' locked' : '')
      + (!affordable && !fullyOwned && !gated && !prereqUnmet ? ' unaffordable' : '');

    const header = hEl('div', { className: 'ss-dept-node-head' },
      hEl('span', { className: 'ss-dept-node-name' }, node.name),
      hEl('span', { className: 'ss-dept-node-cost' },
        fullyOwned ? '\u2713 owned' : '\uD83C\uDF93 ' + node.cost.toLocaleString()),
    );

    const status = node.stackable
      ? hEl('div', { style: { fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' } },
          'Owned: ' + owned + '/' + maxStack + (owned > 0 ? ' \u2713'.repeat(owned) : ''))
      : null;

    const prereqRow = node.prereqs && node.prereqs.length
      ? hEl('div', { style: { fontSize: '0.7rem', color: (prereqUnmet ? '#ff7b72' : '#7ee787'), marginTop: '4px' } },
          'Requires: ' + node.prereqs.map(pr => NODE_BY_ID[pr]?.name || pr).join(', ')
            + (prereqUnmet ? '' : ' \u2713'))
      : null;

    const gateRow = node.achievementGate
      ? hEl('div', { style: { fontSize: '0.7rem', color: (gated ? '#f0883e' : '#7ee787'), marginTop: '4px' } },
          gated ? '\uD83D\uDD12 Requires milestone: ' + node.achievementGate.replace('_', ' ')
                : '\u2713 Milestone met')
      : null;

    const btn = hEl('button', {
      className: 'ss-dept-buy',
      disabled: !check.ok,
      title: check.ok ? 'Purchase for ' + node.cost.toLocaleString() + ' endowment' : check.reason,
      onclick: () => {
        const r = purchaseNode(node.id);
        if (!r.ok) return;
        rerenderSchoolScreen();
      }
    }, fullyOwned ? 'Purchased' : gated ? 'Locked' : prereqUnmet ? 'Locked' : !affordable ? 'Short ' + (node.cost - (S.school?.endowment || 0)) : 'Purchase');

    return hEl('div', { className: cls },
      header,
      hEl('div', { className: 'ss-dept-node-desc' }, node.desc),
      status, prereqRow, gateRow, btn
    );
  }

  // ---------- Alumni Hall tab (Phase 8) ----------
  function renderAlumniHallTab() {
    const alumni = S.school?.alumniHall || [];
    const famous = S.school?.famousAlumni || [];
    const jobBoardUnlocked = (S.school?.departments?.alumniNetwork || []).includes('n_job_board');

    if (alumni.length === 0) {
      return hEl('div', null,
        hEl('h2', null, '\uD83C\uDF93 Alumni Hall'),
        renderPlaceholderTab('\uD83D\uDCDC', 'No alumni yet',
          'When your classmates finish their careers — win, lose, retire, or sell out — they\u2019ll appear here with their stats, final fate, and signature quotes.')
      );
    }

    // Sort famous first, then by year desc (most recent first)
    const sorted = alumni.slice().sort((a, b) => {
      const af = famous.some(f => f.name === a.name && f.year === a.year) ? 1 : 0;
      const bf = famous.some(f => f.name === b.name && f.year === b.year) ? 1 : 0;
      if (af !== bf) return bf - af;
      return (b.year || 0) - (a.year || 0);
    });

    const cards = sorted.map(a => renderAlumnusCard(a, jobBoardUnlocked));

    return hEl('div', null,
      hEl('h2', null, '\uD83C\uDF93 Alumni Hall'),
      hEl('div', { style: { fontSize: '0.85rem', color: '#8b949e', marginBottom: '14px' } },
        alumni.length + ' alumni \u00B7 ' + famous.length + ' famous' +
        (jobBoardUnlocked ? ' \u00B7 Job Board active' : '')),
      hEl('div', { className: 'ss-alumni-grid' }, ...cards)
    );
  }

  function renderAlumnusCard(a, jobBoardUnlocked) {
    const isFamous = (S.school?.famousAlumni || []).some(f => f.name === a.name && f.year === a.year);
    const fateLabels = {
      bankruptcy: { icon: '\uD83D\uDC80', label: 'Went bankrupt', color: '#ff7b72' },
      age_retired: { icon: '\uD83D\uDC74', label: 'Retired at age-out', color: '#8b949e' },
      retire_voluntary: { icon: '\uD83C\uDF93', label: 'Retired voluntarily', color: '#8b949e' },
      megacorp_exit: { icon: '\uD83D\uDCB0', label: 'Sold to Megacorp', color: '#f0883e' },
      win_condition: { icon: '\uD83C\uDFC6', label: 'Triumphant win', color: '#7ee787' },
    };
    const fate = fateLabels[a.fate] || { icon: '\u2014', label: 'played', color: '#8b949e' };

    const traitTags = (a.mechanicalTraits || []).slice(0, 3).map(tId => {
      const t = window.tycoonTraits?.TRAITS_BY_ID?.[tId];
      return hEl('span', { className: 'ss-cc-trait', title: t?.desc || '' }, t?.name || tId);
    });

    // Hire-as-alumnus button (Phase 8 — requires Alumni Job Board)
    let hireBtn = null;
    if (jobBoardUnlocked && S._runEndFired === undefined) {
      // Only enable when we're IN a run (between runs, no founder to hire into)
      hireBtn = null;
    } else if (jobBoardUnlocked) {
      // Show as informational; hiring alumni actually happens in-run via
      // Hiring panel (wired in Phase 10). For now surface availability.
      hireBtn = hEl('div', { style: { fontSize: '0.7rem', color: '#7ee787', marginTop: '6px', fontStyle: 'italic' } },
        '\u2014 available via Alumni Job Board');
    }

    return hEl('div', { className: 'ss-alumnus' + (isFamous ? ' famous' : '') },
      isFamous ? hEl('div', { className: 'ss-alumnus-famous-tag' }, '\u2B50 Famous') : null,
      hEl('div', { className: 'ss-alumnus-head' },
        hEl('div', null,
          hEl('div', { className: 'ss-alumnus-name' }, a.name),
          hEl('div', { className: 'ss-alumnus-meta' },
            'Rank #' + a.rank + ' \u00B7 ' + rankLabel(a.rank) +
            ' \u00B7 Class of ' + (a.foundedAt || 1980))
        ),
        hEl('div', { className: 'ss-alumnus-fate', style: { color: fate.color } },
          fate.icon + ' ' + fate.label)
      ),
      hEl('div', { className: 'ss-alumnus-stats' },
        hEl('div', { className: 'ss-al-stat' },
          hEl('span', { className: 'k' }, 'Tenure'),
          hEl('span', { className: 'v' }, (a.tenureYears || 0) + 'y')),
        hEl('div', { className: 'ss-al-stat' },
          hEl('span', { className: 'k' }, 'Ships'),
          hEl('span', { className: 'v' }, String(a.shippedCount || 0))),
        hEl('div', { className: 'ss-al-stat' },
          hEl('span', { className: 'k' }, 'Avg critic'),
          hEl('span', { className: 'v' }, a.criticAvg != null ? String(a.criticAvg) : '\u2014')),
        hEl('div', { className: 'ss-al-stat' },
          hEl('span', { className: 'k' }, 'Fame'),
          hEl('span', { className: 'v' }, String(a.finalFame || 0))),
        hEl('div', { className: 'ss-al-stat' },
          hEl('span', { className: 'k' }, 'Revenue'),
          hEl('span', { className: 'v' }, fmtSchoolMoney(a.finalRevenue || 0))),
        hEl('div', { className: 'ss-al-stat' },
          hEl('span', { className: 'k' }, 'Endowment'),
          hEl('span', { className: 'v', style: { color: '#7ee787' } }, '+' + (a.endowmentContribution || 0).toLocaleString()))
      ),
      traitTags.length ? hEl('div', { className: 'ss-alumnus-traits' }, ...traitTags) : null,
      a.signatureQuote ? hEl('div', { className: 'ss-alumnus-quote' },
        '\u201C' + (a.signatureQuote.quote || '\u2014') + '\u201D',
        hEl('span', { className: 'ss-al-quote-src' }, ' \u2014 ' + (a.signatureQuote.source || 'Alumni Office'))
      ) : null,
      hireBtn
    );
  }

  // ---------- Lifetime Stats tab (Phase 8) ----------
  function renderLifetimeTab() {
    const ls = S.school?.lifetimeStats || {};
    const alumni = S.school?.alumniHall || [];
    const bestShip = alumni.reduce((best, a) => {
      if (a.criticAvg != null && (best == null || a.criticAvg > best.criticAvg)) return a;
      return best;
    }, null);
    const longestTenure = alumni.reduce((best, a) => {
      if (best == null || (a.tenureYears || 0) > (best.tenureYears || 0)) return a;
      return best;
    }, null);
    const richestAlumnus = alumni.reduce((best, a) => {
      if (best == null || (a.finalRevenue || 0) > (best.finalRevenue || 0)) return a;
      return best;
    }, null);

    const cards = [
      { label: 'Classmates enrolled', value: ls.runsCompleted || 0 },
      { label: 'Total revenue', value: fmtSchoolMoney(ls.totalRevenue || 0), color: '#7ee787' },
      { label: 'Total ships', value: ls.totalShipped || 0 },
      { label: 'Total hires', value: ls.totalHires || 0 },
      { label: 'Win-condition runs', value: ls.winConditionRuns || 0, color: '#f1e05a' },
      { label: 'Megacorp exits', value: ls.megacorpExits || 0, color: '#f0883e' },
      { label: 'Bankruptcies', value: ls.bankruptcies || 0, color: '#ff7b72' },
      { label: 'Endowment earned (lifetime)', value: '+' + (S.school?.lifetimeEndowmentEarned || 0).toLocaleString(), color: '#7ee787' },
      { label: 'Endowment spent', value: ((S.school?.lifetimeEndowmentEarned || 0) - (S.school?.endowment || 0)).toLocaleString() },
      { label: 'Famous alumni', value: (S.school?.famousAlumni || []).length, color: '#ffd700' },
    ];

    const recordsBlock = alumni.length === 0 ? null : hEl('div', { className: 'ss-records' },
      hEl('h3', null, 'Institute Records'),
      bestShip ? hEl('div', { className: 'ss-record' },
        hEl('span', { className: 'k' }, '\uD83C\uDFC6 Best average critic'),
        hEl('span', { className: 'v' }, bestShip.name + ' \u00B7 critic ' + bestShip.criticAvg + ' (rank #' + bestShip.rank + ')')
      ) : null,
      longestTenure ? hEl('div', { className: 'ss-record' },
        hEl('span', { className: 'k' }, '\u231B Longest tenure'),
        hEl('span', { className: 'v' }, longestTenure.name + ' \u00B7 ' + (longestTenure.tenureYears || 0) + ' years')
      ) : null,
      richestAlumnus ? hEl('div', { className: 'ss-record' },
        hEl('span', { className: 'k' }, '\uD83D\uDCB0 Highest lifetime revenue'),
        hEl('span', { className: 'v' }, richestAlumnus.name + ' \u00B7 ' + fmtSchoolMoney(richestAlumnus.finalRevenue || 0))
      ) : null
    );

    return hEl('div', null,
      hEl('h2', null, '\uD83D\uDCCA Lifetime Stats'),
      hEl('div', { style: { fontSize: '0.85rem', color: '#8b949e', marginBottom: '14px' } },
        'Cumulative totals across every classmate who\u2019s passed through the Institute.'),
      hEl('div', { className: 'ss-stats-grid' },
        ...cards.map(c => hEl('div', { className: 'ss-stat-card' },
          hEl('div', { className: 'ss-stat-card-val', style: { color: c.color || '#f0f6fc' } }, String(c.value)),
          hEl('div', { className: 'ss-stat-card-lbl' }, c.label)
        ))
      ),
      recordsBlock
    );
  }

  function fmtSchoolMoney(v) {
    if (Math.abs(v) >= 1e9) return '$' + (v/1e9).toFixed(1) + 'B';
    if (Math.abs(v) >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
    if (Math.abs(v) >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';
    return '$' + Math.round(v);
  }

  function renderPlaceholderTab(icon, title, body) {
    return hEl('div', { className: 'ss-placeholder' },
      hEl('div', { className: 'ss-placeholder-icon' }, icon),
      hEl('div', { className: 'ss-placeholder-title' }, title),
      hEl('div', { className: 'ss-placeholder-body' }, body)
    );
  }

  // ---------- School-screen overlay ----------
  let _activeTab = 'admissions';
  function renderSchoolScreen() {
    const school = S.school || {};
    const tabs = [
      { id: 'admissions', label: 'Admissions' },
      { id: 'departments', label: 'Departments' },
      { id: 'alumni', label: 'Alumni Hall' },
      { id: 'lifetime', label: 'Lifetime' },
    ];
    const tabBar = hEl('div', { className: 'school-tabs' },
      ...tabs.map(t => hEl('button', {
        className: 'school-tab' + (t.id === _activeTab ? ' active' : ''),
        onclick: () => { _activeTab = t.id; rerenderSchoolScreen(); }
      }, t.label))
    );

    let content;
    if (_activeTab === 'admissions') content = renderAdmissionsTab();
    else if (_activeTab === 'departments') content = renderDepartmentsTab();
    else if (_activeTab === 'alumni') content = renderAlumniHallTab();
    else content = renderLifetimeTab();

    const nextRank = nextUpRank();
    const nextClassmate = S.school?.classRoster?.find(c => c.rank === nextRank);
    const enrollDisabled = !nextClassmate;

    const topBar = hEl('div', { className: 'school-topbar' },
      hEl('div', { className: 'ss-brand' },
        hEl('span', { className: 'ss-school-name' }, school.name || 'The Institute'),
        hEl('span', { className: 'ss-school-sub' }, 'Est. ' + (school.foundedYear || 1980))
      ),
      hEl('div', { className: 'ss-stat' },
        hEl('div', { className: 'ss-stat-val' }, (school.endowment || 0).toLocaleString()),
        hEl('div', { className: 'ss-stat-lbl' }, 'Endowment')
      ),
      hEl('div', { className: 'ss-stat' },
        hEl('div', { className: 'ss-stat-val' }, String(school.classRoster?.filter(c => c.enrolled).length || 0) + '/' + (school.classRoster?.length || 0)),
        hEl('div', { className: 'ss-stat-lbl' }, 'Class Enrolled')
      ),
      hEl('div', { className: 'ss-actions' },
        hEl('button', {
          title: 'Save and return to the slot screen',
          onclick: () => {
            try { if (typeof save === 'function') save(); } catch(e){}
            closeSchoolScreen();
            const slotsEl = document.getElementById('slots');
            const gameEl = document.getElementById('G');
            if (slotsEl) slotsEl.style.display = '';
            if (gameEl) gameEl.style.display = 'none';
            window.__tycoonMode = false;
            // Reload for a fully clean slot screen
            location.reload();
          }
        }, '\uD83D\uDCBE Save & Quit')
      )
    );

    const footer = hEl('div', { className: 'school-footer' },
      hEl('button', {
        className: 'ss-enroll',
        disabled: enrollDisabled,
        onclick: () => {
          if (!nextClassmate) return;
          enrollClassmate(nextClassmate.rank);
        }
      }, enrollDisabled
        ? 'Class fully graduated'
        : 'Enroll Next Classmate \u2192 ' + nextClassmate.name + ' (Rank #' + nextClassmate.rank + ')')
    );

    return hEl('div', { className: 'school-screen', id: '_t_school_screen' },
      topBar, tabBar,
      hEl('div', { className: 'school-main' }, content),
      footer
    );
  }

  function rerenderSchoolScreen() {
    const old = document.getElementById('_t_school_screen');
    if (!old) return;
    const fresh = renderSchoolScreen();
    old.replaceWith(fresh);
  }

  function openSchoolScreen() {
    injectSchoolStyles();
    if (window.tycoonTraits?.ensureRoster) window.tycoonTraits.ensureRoster();
    // Hide clicker + tycoon UIs
    const slotsEl = document.getElementById('slots');
    const gameEl = document.getElementById('G');
    const tycoonEl = document.getElementById('tycoon-overlay');
    if (slotsEl) slotsEl.style.display = 'none';
    if (gameEl) gameEl.style.display = 'none';
    if (tycoonEl) tycoonEl.remove();
    window.__tycoonMode = true;  // blocks clicker loop
    // Remove any existing school screen first
    document.getElementById('_t_school_screen')?.remove();
    document.body.appendChild(renderSchoolScreen());
    _activeTab = 'admissions';  // reset on open
  }

  function closeSchoolScreen() {
    const el = document.getElementById('_t_school_screen');
    if (el) el.remove();
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
    // Phase 5: school screen UI
    openSchoolScreen,
    closeSchoolScreen,
    rerenderSchoolScreen,
    enrollClassmate,
    nextUpRank,
    // Phase 6: admissions refinements
    openClassmateDetail,
    inferSpecialty,
    rankLabel,
    // Phase 7: departments
    DEPARTMENT_CATALOG,
    NODE_BY_ID,
    purchaseNode,
    canPurchase,
    isPurchased,
    purchaseCount,
    achievementGateMet,
    applyDepartmentEffects,
    // Phase 8: alumni + rival injection
    injectSchoolRivals,
    // Phase 9: era-start + rival-scaling hooks
    ERA_STARTS,
    eraStartEligibility,
    queueEraStart(id) {
      const opt = ERA_STARTS.find(e => e.id === id);
      if (!opt) return { ok: false, error: 'Unknown era' };
      const e = eraStartEligibility(opt);
      if (!e.eligible) return { ok: false, error: 'Not eligible' };
      S.school.queuedEraStart = id;
      return { ok: true };
    },
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
        nextUpRank: nextUpRank(),
        classSize: (S.school?.classRoster || []).length,
      };
    },
  };
  if (window.dbg) window.dbg.school = window.tycoonSchool;

  console.log('[tycoon-school] module loaded. endRun + endowment pipeline ready.');
})();
