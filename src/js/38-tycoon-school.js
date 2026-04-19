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
        { id: 'a_foundational', name: 'Foundational Curriculum', cost: 2000,
          desc: 'Pre-unlocks three tier-1 research nodes for every future classmate.',
          effect: { kind: 'documentResearch', nodeIds: ['n_2d_sprites', 'n_text_parser', 'n_sound_chip'] } },
        { id: 'a_prof_tech', name: 'Hire Visiting Professor — Tech', cost: 2500,
          desc: '+5 tech to every future classmate at enrollment.',
          effect: { kind: 'statBoost', axis: 'tech', amount: 5 } },
        { id: 'a_prof_design', name: 'Hire Visiting Professor — Design', cost: 2500,
          desc: '+5 design to every future classmate at enrollment.',
          effect: { kind: 'statBoost', axis: 'design', amount: 5 } },
        { id: 'a_prof_polish', name: 'Hire Visiting Professor — Polish', cost: 2500,
          desc: '+5 polish to every future classmate at enrollment.',
          effect: { kind: 'statBoost', axis: 'polish', amount: 5 } },
        { id: 'a_faculty_chair', name: 'Endow Faculty Chair', cost: 10000,
          desc: 'Pre-unlocks three more early research nodes (on top of Foundational).',
          prereqs: ['a_prof_tech', 'a_prof_design', 'a_prof_polish'],
          effect: { kind: 'documentResearch', nodeIds: ['n_mouse_ui', 'n_floppy_disk', 'n_basic_audio'] } },
        { id: 'a_llm_doc', name: 'Document the LLM Research', cost: 8000,
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
        { id: 'f_lab_basic', name: 'Build Computer Lab', cost: 1500,
          desc: 'Every classmate starts with a basic dev rig pre-installed.',
          effect: { kind: 'schoolLab', hardwareIds: [] } },  // flag-only; Phase 8 may add a specific hardware id
        { id: 'f_lab_advanced', name: 'Upgrade Workstations', cost: 5000,
          desc: 'Lab upgraded to professional-grade hardware.',
          prereqs: ['f_lab_basic'],
          effect: { kind: 'schoolLab', hardwareIds: [] } },
        { id: 'f_hw_sgi', name: 'SGI Workstation', cost: 4000,
          desc: 'Permanent SGI workstation in the school lab.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_sgi_workstation'] } },
        { id: 'f_hw_cdmaster', name: 'CD Mastering Suite', cost: 3500,
          desc: 'Permanent CD mastering rig in the school lab.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_cd_mastering'] } },
        { id: 'f_hw_server', name: 'Server Infrastructure', cost: 4000,
          desc: 'Permanent server rack in the school lab.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_server_infra'] } },
        { id: 'f_hw_cloud', name: 'Cloud Credits', cost: 5000,
          desc: 'Permanent cloud-compute credits the school shares.',
          effect: { kind: 'schoolLab', hardwareIds: ['h_cloud_credits'] } },
        { id: 'f_campus_expansion', name: 'Center of Innovation Wing', cost: 12000,
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
        { id: 'n_job_board', name: 'Formalize Alumni Job Board', cost: 2500,
          desc: 'Past alumni become hireable senior staff at premium salary.',
          effect: { kind: 'hireAlumni' } },
        { id: 'n_gold_diploma', name: 'Gold-Plated Diploma', cost: 4000,
          desc: 'Top-5-ranked graduates open with +1 client-tier reputation.',
          effect: { kind: 'clientRepBonus', amount: 1 } },
        { id: 'n_connections', name: 'Alumni Connections', cost: 2000,
          desc: 'Every classmate gets a guaranteed contract offer in their first in-game week.',
          effect: { kind: 'freeContract' } },
        { id: 'n_every_camp', name: 'Alumni in Every Camp', cost: 10000,
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
        { id: 'sl_scholarship', name: 'Scholarship Fund', cost: 1000, stackable: true, maxStack: 3,
          desc: 'Every classmate starts with +$25K cash. Stacks up to 3× for +$75K.',
          effect: { kind: 'startingCash', amount: 25000 } },
        { id: 'sl_rivalry', name: 'Celebrated Rivalry', cost: 3000,
          desc: 'Adds a named antagonistic rival studio to the persistent market roster. (Phase 8 wires the rival spawn.)',
          effect: { kind: 'spawnRival' } },
        { id: 'sl_newsletter', name: 'School Newsletter', cost: 2500,
          desc: 'Each shipped project gets a bonus review quote from the school\u2019s own press. (Phase 8 wires the review.)',
          effect: { kind: 'extraReview' } },
        { id: 'sl_legend_hall', name: 'Legend Lecture Hall', cost: 15000,
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
          // hireAlumni / clientRepBonus / freeContract / spawnRival /
          // extraReview / contractBonusMul are flag-only effects — the
          // downstream systems check for their nodes on S.school.departments
          // when they need to. Phase 8 wires those consumers.
          default:
            break;
        }
      }
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

  // Pick the classmate that's next up — the lowest unenrolled rank.
  // (Phase 1 starts at the bottom per Q1b, so "lowest rank number unenrolled
  // from the bottom" = the current next. Actually: classmate.rank 50 first,
  // then 49, then 48, etc. So "next up" = the max unenrolled rank.)
  function nextUpRank() {
    if (!Array.isArray(S.school?.classRoster)) return null;
    const unenrolled = S.school.classRoster.filter(c => !c.enrolled);
    if (unenrolled.length === 0) return null;
    // Highest rank number = furthest from top of class = we start at bottom
    return unenrolled.reduce((max, c) => c.rank > max ? c.rank : max, 0);
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
    S.calendar = { week: 1, month: 1, year: 1980 };
    S.projects = { active: [], shipped: [], contracts: [] };
    S.employees = [];
    S.loans = [];
    S.bankruptcy = { negativeWeeks: 0, triggered: false };
    S.warnings = { runway6mo: false, runway3mo: false, runway1mo: false };
    S.hiring = { queue: [], fairIndex: 0 };
    S.rivals = [];
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
        tech:   classmate.stats.tech   || 10,
        design: classmate.stats.design || 10,
        polish: classmate.stats.polish || 10,
        speed:  4,
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
    applyDepartmentEffects();

    if (typeof markDirty === 'function') markDirty();
    closeSchoolScreen();
    if (window.tycoonUI?.enter) window.tycoonUI.enter({ skipCreator: true });
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
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
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

    // Roster cards — ranked bottom-first since we climb up
    const sortedRoster = roster.slice().sort((a, b) => b.rank - a.rank);
    const rosterEls = sortedRoster.map(c => {
      const isNext = c.rank === nextRank;
      // Phase 6: ranks above next-up are "locked" — visible but not yet
      // enrollable. You have to play the next-up classmate first.
      const isLocked = !c.enrolled && !isNext;
      const cls = 'ss-roster-card'
        + (c.enrolled ? ' enrolled' : '')
        + (isNext ? ' next-up' : '')
        + (isLocked ? ' locked' : '');
      const title = c.enrolled
        ? c.name + ' — rank ' + c.rank + ' (' + (c.fate || 'played') + ')'
        : (isLocked
          ? c.name + ' — rank ' + c.rank + ' (locked; enroll rank ' + nextRank + ' next)'
          : c.name + ' — rank ' + c.rank + ' (ready to enroll)');
      return hEl('div', {
        className: cls,
        title,
        onclick: () => openClassmateDetail(c.rank),
      },
        hEl('div', { className: 'ss-rank' }, 'Rank #' + c.rank),
        hEl('div', { className: 'ss-name' }, c.name),
        hEl('span', { className: 'ss-band' }, c.band.replace('_', ' ')),
        c.enrolled ? hEl('span', { className: 'ss-fate', title: c.fate || '' }, fateIcon(c.fate)) : null,
        isLocked ? hEl('span', {
          style: { position: 'absolute', top: '6px', right: '6px', fontSize: '0.85rem', opacity: '0.6' },
          title: 'Locked'
        }, '\uD83D\uDD12') : null
      );
    });

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
      hEl('div', { className: 'ss-roster' }, ...rosterEls),
      currentBlock
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
    else if (_activeTab === 'alumni') content = renderPlaceholderTab(
      '\uD83C\uDF93', 'Alumni Hall (Phase 8)',
      'Cards for every past founder with their stats, fate, signature quotes, and famous-alumni callouts. ' +
      'Currently tracking ' + (school.alumniHall?.length || 0) + ' alumni behind the scenes.');
    else content = renderPlaceholderTab(
      '\uD83D\uDCCA', 'Lifetime Stats (Phase 8)',
      'Cumulative totals across all runs: revenue, ships, hires, win-condition runs, etc. ' +
      'Current run count: ' + (school.lifetimeStats?.runsCompleted || 0) + '.');

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
