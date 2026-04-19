// ========== TYCOON ACHIEVEMENTS (v2) ==========
// Phase 5G: ~40 tycoon achievements tied to actual state.
(function(){
  'use strict';

  // Each achievement: id, name, desc, check(), hidden?
  const ACHIEVEMENTS = [
    // ----- Early Career -----
    { id: 'a_first_hire',     name: 'First Hire',           desc: 'Hire your first employee.', check: () => (S.employees || []).length >= 1 },
    { id: 'a_first_ship',     name: 'Shipped It!',          desc: 'Ship your first project.', check: () => (S.projects?.shipped || []).length >= 1 },
    { id: 'a_first_contract', name: 'Pay the Bills',        desc: 'Complete your first contract.', check: () => (S.projects?.shipped || []).some(p => p.isContract) },
    { id: 'a_first_ip',       name: 'Own It',               desc: 'Ship your first own-IP title.', check: () => (S.projects?.shipped || []).some(p => !p.isContract) },
    { id: 'a_first_year',     name: 'First Birthday',       desc: 'Survive the first game year.', check: () => (S.calendar?.year || 1980) >= 1981 },

    // ----- Economy -----
    { id: 'a_rev_1m',   name: 'First Million',       desc: '$1M lifetime revenue.', check: () => (S.tRevenue || 0) >= 1_000_000 },
    { id: 'a_rev_10m',  name: 'Million-Maker',       desc: '$10M lifetime revenue.', check: () => (S.tRevenue || 0) >= 10_000_000 },
    { id: 'a_rev_100m', name: 'Mega Dev',            desc: '$100M lifetime revenue.', check: () => (S.tRevenue || 0) >= 100_000_000 },
    { id: 'a_rev_1b',   name: 'Unicorn Status',      desc: '$1B lifetime revenue.', check: () => (S.tRevenue || 0) >= 1_000_000_000 },
    { id: 'a_loan',     name: 'Banker\'s Friend',    desc: 'Take a bank loan.', check: () => (S.loans || []).length >= 1 },

    // ----- Hiring / Team -----
    { id: 'a_team_5',   name: 'Studio Crew',         desc: 'Reach 5 employees.', check: () => (S.employees || []).length >= 5 },
    { id: 'a_team_10',  name: 'Full Roster',         desc: 'Reach 10 employees.', check: () => (S.employees || []).length >= 10 },
    { id: 'a_team_25',  name: 'Scaling Up',          desc: 'Reach 25 employees.', check: () => (S.employees || []).length >= 25 },
    { id: 'a_team_50',  name: 'Workforce',           desc: 'Reach 50 employees.', check: () => (S.employees || []).length >= 50 },
    { id: 'a_hire_phd', name: 'Brain Drain',         desc: 'Hire a PhD.', check: () => (S.employees || []).some(e => e.education?.level === 4) },
    { id: 'a_hire_senior', name: 'Senior Staff',     desc: 'Hire a Senior (tier 3+).', check: () => (S.employees || []).some(e => (e.tier || 0) >= 3) },

    // ----- Projects -----
    { id: 'a_ship_5',   name: 'Productive',          desc: 'Ship 5 projects.', check: () => (S.projects?.shipped || []).length >= 5 },
    { id: 'a_ship_10',  name: 'Prolific',            desc: 'Ship 10 projects.', check: () => (S.projects?.shipped || []).length >= 10 },
    { id: 'a_ship_25',  name: 'Veteran Dev',         desc: 'Ship 25 projects.', check: () => (S.projects?.shipped || []).length >= 25 },
    { id: 'a_ship_50',  name: 'Industry Fixture',    desc: 'Ship 50 projects.', check: () => (S.projects?.shipped || []).length >= 50 },
    { id: 'a_critic_90',name: 'Stellar Reviews',     desc: 'Ship a project with critic 90+.', check: () => (S.projects?.shipped || []).some(p => (p.criticScore || 0) >= 90) },
    { id: 'a_critic_95',name: 'Masterpiece',         desc: 'Ship a project with critic 95+.', check: () => (S.projects?.shipped || []).some(p => (p.criticScore || 0) >= 95) },
    { id: 'a_sales_10m',name: 'Hit Maker',           desc: 'A single project earns $10M+ sales.', check: () => (S.projects?.shipped || []).some(p => (p.launchSales || 0) >= 10_000_000) },
    { id: 'a_sales_100m',name:'Blockbuster',         desc: 'A single project earns $100M+ sales.', check: () => (S.projects?.shipped || []).some(p => (p.launchSales || 0) >= 100_000_000) },
    { id: 'a_all_genres',name: 'Renaissance',        desc: 'Ship in every project type.', check: () => {
      const types = new Set((S.projects?.shipped || []).map(p => p.type));
      return ['game','business','web','mobile','saas','ai'].every(t => types.has(t));
    }},

    // ----- Platforms -----
    { id: 'a_plat_3', name: 'Multi-Platform',      desc: 'Ship on 3 different platforms.', check: () => (new Set((S.projects?.shipped || []).map(p => p.platform).filter(Boolean))).size >= 3 },
    { id: 'a_console',name: 'Console Dev',         desc: 'Ship on a console (NES/PS/Xbox).', check: () => (S.projects?.shipped || []).some(p => ['pl_nes','pl_playstation','pl_xbox'].includes(p.platform)) },

    // ----- Research / Innovation -----
    { id: 'a_research_5',  name: 'R&D',              desc: 'Complete 5 research nodes.', check: () => (S.research?.completed || []).length >= 5 },
    { id: 'a_research_10', name: 'Lab Rats',         desc: 'Complete 10 research nodes.', check: () => (S.research?.completed || []).length >= 10 },
    { id: 'a_research_20', name: 'Completionist',    desc: 'Complete 20 research nodes.', check: () => (S.research?.completed || []).length >= 20 },
    { id: 'a_pioneer',     name: 'Pioneer',          desc: 'Be first to complete any research (vs. rivals).', check: () => {
      const pioneers = S.researchPioneers || {};
      return Object.values(pioneers).some(v => v === 'player');
    }},
    { id: 'a_hardware',    name: 'Big Iron',         desc: 'Purchase any expensive hardware.', check: () => (S.hardware || []).length >= 1 },

    // ----- Awards -----
    { id: 'a_award_rising_star', name: 'Rising Star',      desc: 'Win the Rising Star award.', check: () => (S.awards?.history || []).some(h => h.winners?.risingStar?.source === 'player') },
    { id: 'a_award_genre',       name: 'Best in Show',     desc: 'Win Best in Genre.', check: () => (S.awards?.history || []).some(h => Object.values(h.winners?.bestInGenre || {}).some(w => w.source === 'player')) },
    { id: 'a_award_goty',        name: 'Game of the Year', desc: 'Win Game of the Year.', check: () => (S.awards?.history || []).some(h => h.winners?.goty?.source === 'player') },
    { id: 'a_award_studio',      name: 'Studio of the Year', desc: 'Win Studio of the Year.', check: () => (S.awards?.history || []).some(h => h.winners?.studioOfYear?.key === 'player') },

    // ----- Endgame -----
    { id: 'a_vc_seed',    name: 'Raised Capital',      desc: 'Close a Seed round.', check: () => (S.vcRounds || []).some(r => r.type === 'seed') },
    { id: 'a_vc_a',       name: 'Series A',            desc: 'Close a Series A round.', check: () => (S.vcRounds || []).some(r => r.type === 'series_a') },
    { id: 'a_ipo',        name: 'Going Public',        desc: 'Successfully IPO.', check: () => !!S.ipo?.completed },
    { id: 'a_acquire',    name: 'Acquirer',            desc: 'Acquire a rival studio.', check: () => (S.rivals || []).some(r => r.status === 'acquired') },
    { id: 'a_subsidiary', name: 'Parent Company',      desc: 'Create a subsidiary.', check: () => (S.subsidiaries || []).length >= 1 },
    { id: 'a_legacy',     name: 'Legacy Decision',     desc: 'Take a legacy decision.', check: () => (S.legacyDecisions || []).length >= 1 },

    // ----- Fame milestones -----
    { id: 'a_fame_100', name: 'Recognized',      desc: 'Reach Fame 100.', check: () => (S.tFame || 0) >= 100 },
    { id: 'a_fame_500', name: 'Industry Titan',  desc: 'Reach Fame 500.', check: () => (S.tFame || 0) >= 500 },

    // ----- Year milestones -----
    { id: 'a_year_1990', name: 'Welcome to the 90s', desc: 'Reach 1990.', check: () => (S.calendar?.year || 1980) >= 1990 },
    { id: 'a_year_2000', name: 'Y2K Survivor',       desc: 'Reach 2000.', check: () => (S.calendar?.year || 1980) >= 2000 },
    { id: 'a_year_2010', name: 'Social Era',          desc: 'Reach 2010.', check: () => (S.calendar?.year || 1980) >= 2010 },
    { id: 'a_year_2024', name: 'Witness to History',  desc: 'Reach 2024.', check: () => (S.calendar?.year || 1980) >= 2024 },

    // ----- Rare / hidden -----
    { id: 'a_bankruptcy_warn', name: 'Close Call', desc: 'Trigger a bankruptcy warning and recover.', check: () => S.warnings?.runway3mo && (S.cash || 0) > 100_000 },
    { id: 'a_synergy_triple',  name: 'Marketing Master', desc: 'Trigger 3+ marketing synergies on one launch.', check: () => (S.projects?.shipped || []).some(p => (p.marketingSynergies || []).length >= 3) },
  ];
  window.TYCOON_ACHIEVEMENTS = ACHIEVEMENTS;

  // ---------- State ----------
  function ensureState() {
    if (!S.tycoonAchievements) S.tycoonAchievements = { unlocked: [] };
    if (!Array.isArray(S.tycoonAchievements.unlocked)) S.tycoonAchievements.unlocked = [];
  }

  // ---------- Weekly check ----------
  function onWeekTick() {
    ensureState();
    for (const ach of ACHIEVEMENTS) {
      if (S.tycoonAchievements.unlocked.includes(ach.id)) continue;
      try {
        if (ach.check()) {
          S.tycoonAchievements.unlocked.push(ach.id);
          if (typeof markDirty === 'function') markDirty();
          if (typeof log === 'function') log('🏅 Achievement: ' + ach.name + ' — ' + ach.desc);
          document.dispatchEvent(new CustomEvent('tycoon:achievement-unlocked', {
            detail: { achievement: ach }
          }));
        }
      } catch (e) { /* skip on error */ }
    }
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startAchievementsTick() {
    if (_unsub) return;
    if (!window.tycoonTime) return;
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopAchievementsTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonAchievements = {
    ACHIEVEMENTS,
    startTick: startAchievementsTick,
    stopTick: stopAchievementsTick,
    state() {
      ensureState();
      return {
        unlocked: S.tycoonAchievements.unlocked,
        total: ACHIEVEMENTS.length,
        progress: S.tycoonAchievements.unlocked.length + '/' + ACHIEVEMENTS.length
      };
    }
  };
  if (window.dbg) window.dbg.achievements = window.tycoonAchievements;

  console.log('[tycoon-achievements] module loaded. ' + ACHIEVEMENTS.length + ' achievements.');
})();
