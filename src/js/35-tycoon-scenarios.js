// ========== TYCOON SCENARIOS (v2) ==========
// Phase 6A: 6 starting scenarios. Each is a preset that shapes the opening state
// — year, cash, founder, starting team, historical research, etc.
(function(){
  'use strict';

  // Each scenario: id, label, blurb, yearStart, difficulty, applyBonus(config)
  // applyBonus mutates state after base character creator has run.
  const SCENARIOS = [
    {
      id: 'first_studio',
      label: '📖 First Studio (Tutorial)',
      blurb: 'Start in 1980 as a solo coder with $50K. Recommended for first playthrough.',
      yearStart: 1980,
      defaults: { specialty: 'coder', trait: 'Creative', difficulty: 'normal' },
      applyBonus() { /* no bonus — base setup */ }
    },
    {
      id: 'sandbox_1980',
      label: '🏖️ Sandbox 1980',
      blurb: 'Fresh 1980 start. No tutorial, pure sandbox.',
      yearStart: 1980,
      defaults: { specialty: 'coder', trait: 'Methodical', difficulty: 'normal' },
      applyBonus() { /* no bonus */ }
    },
    {
      id: 'game_shop_1985',
      label: '🕹️ Mid-80s Game Shop',
      blurb: '1985, $100K cash, Game Dev founder. Basic research done, ready to ship games.',
      yearStart: 1985,
      defaults: { specialty: 'gamedev', trait: 'Creative', difficulty: 'normal' },
      applyBonus() {
        // Jump calendar
        S.calendar = { week: 1, month: 1, year: 1985 };
        S.cash = 100000;
        // Pre-complete 1980s tech research
        if (Array.isArray(S.research?.completed)) {
          const earlyNodes = ['n_2d_sprites','n_text_parser','n_sound_chip','n_mouse_ui'];
          for (const n of earlyNodes) {
            if (!S.research.completed.includes(n)) S.research.completed.push(n);
          }
        }
        // Bump founder tier for experience
        if (S.founder) {
          S.founder.tier = 2;
          S.founder.tierName = 'Mid-Level Dev';
          S.founder.exp = 3;
          S.founder.stats.design += 10;
          S.founder.stats.tech += 10;
          S.founder.age = 28;
        }
        // Small Fame boost from reputation
        S.fame = 10;
        S.tFame = 10;
      }
    },
    {
      id: 'dotcom_survivor',
      label: '💥 Dot-Com Bust Survivor (2001)',
      blurb: '2001, $200K, established coder. Web crashing, rivals in chaos. Rebuild or pivot.',
      yearStart: 2001,
      defaults: { specialty: 'coder', trait: 'Methodical', difficulty: 'normal' },
      applyBonus() {
        S.calendar = { week: 1, month: 1, year: 2001 };
        S.cash = 200000;
        // Apply heavy research history (90s era)
        const nodes90s = ['n_2d_sprites','n_text_parser','n_sound_chip','n_mouse_ui',
                          'n_scsi_storage','n_cd_rom','n_256_color','n_networking',
                          'n_object_oriented','n_3d_graphics','n_tcp_ip','n_databases'];
        if (Array.isArray(S.research?.completed)) {
          for (const n of nodes90s) {
            if (!S.research.completed.includes(n)) S.research.completed.push(n);
          }
        }
        if (S.founder) {
          S.founder.tier = 4;
          S.founder.tierName = 'Staff Engineer';
          S.founder.exp = 12;
          S.founder.stats.design += 20;
          S.founder.stats.tech += 30;
          S.founder.stats.polish += 10;
          S.founder.age = 38;
        }
        // Starting team of 3 engineers
        if (window.tycoonEmployees) {
          for (let i = 0; i < 3; i++) {
            const c = window.tycoonEmployees.generateCandidate({ tier: 2 });
            c.interviewed = true;
            c.stats = c.hiddenStats;
            c.traits = [c.visibleTrait, c.hiddenTrait].filter(Boolean);
            c.personality = c.hiddenPersonality;
            window.tycoonEmployees.hire(c);
          }
        }
        S.fame = 80;
        S.tFame = 80;
        S.tRevenue = 2_000_000;
      }
    },
    {
      id: 'ai_revolution',
      label: '🤖 AI Revolution (2022)',
      blurb: '2022, $5M cash. IPO done. Launch into the AI boom.',
      yearStart: 2022,
      defaults: { specialty: 'coder', trait: 'Creative', difficulty: 'normal' },
      applyBonus() {
        S.calendar = { week: 1, month: 1, year: 2022 };
        S.cash = 5_000_000;
        // All research except cutting-edge AI
        if (Array.isArray(S.research?.completed) && window.tycoonResearch) {
          const allNodes = window.tycoonResearch.NODES.map(n => n.id);
          const excludeRecent = ['n_llm_research'];
          for (const id of allNodes) {
            if (excludeRecent.includes(id)) continue;
            if (!S.research.completed.includes(id)) S.research.completed.push(id);
          }
        }
        // Hardware purchased
        if (window.tycoonHardware) {
          const earlyHW = ['h_cd_mastering','h_sgi_workstation','h_server_infra','h_cloud_credits'];
          if (!Array.isArray(S.hardware)) S.hardware = [];
          for (const id of earlyHW) {
            if (!S.hardware.some(h => h.id === id)) {
              S.hardware.push({ id, purchasedAtWeek: 0 });
            }
          }
        }
        if (S.founder) {
          S.founder.tier = 5;
          S.founder.tierName = 'Principal Engineer';
          S.founder.exp = 25;
          S.founder.stats.design += 30;
          S.founder.stats.tech += 40;
          S.founder.stats.polish += 20;
          S.founder.age = 48;
        }
        // Larger starting team (6 engineers, mix of specialties)
        if (window.tycoonEmployees) {
          const specs = ['coder','frontend','backend','webdev','mobile','cloud'];
          for (const spec of specs) {
            const c = window.tycoonEmployees.generateCandidate({ tier: 3, specialty: spec });
            c.interviewed = true;
            c.stats = c.hiddenStats;
            c.traits = [c.visibleTrait, c.hiddenTrait].filter(Boolean);
            c.personality = c.hiddenPersonality;
            window.tycoonEmployees.hire(c);
          }
        }
        // Retroactively IPO'd studio
        S.ipo = {
          completed: true,
          closedAtWeek: 0,
          closedAtYear: 2015,
          valuation: 800_000_000,
          grossRaise: 160_000_000,
          netRaise: 152_000_000,
          bankerFees: 8_000_000,
        };
        // Cap table reflects IPO
        S.capTable = {
          founderEquity: 0.5,
          vcEquity: { seed: 0.12, series_a: 0.18, public: 0.20 }
        };
        S.vcRounds = [
          { type:'seed', storageKey:'seed', cash: 1500000, equity: 0.15, closedAtWeek: 0 },
          { type:'series_a', storageKey:'series_a', cash: 15000000, equity: 0.22, closedAtWeek: 0 }
        ];
        S.fame = 280;
        S.tFame = 280;
        S.tRevenue = 100_000_000;
      }
    },
    {
      id: 'custom',
      label: '🎲 Custom Start',
      blurb: 'Pick your own year, cash, founder stats. Full freedom.',
      yearStart: null,  // player picks
      defaults: { specialty: 'coder', trait: 'Methodical', difficulty: 'normal' },
      applyBonus() { /* player handles via custom settings */ }
    },
  ];

  window.TYCOON_SCENARIOS = SCENARIOS;

  // Phase 6D: Pre-initialize state containers that scenarios mutate directly.
  // The relevant module ensureState() helpers aren't called until their startTick
  // runs (inside tycoonUI.enter()), which is *after* applyBonus(). Without this,
  // research/hardware/employee pre-seeding in the advanced scenarios silently
  // no-ops because the arrays don't exist yet.
  function preinitStateForScenario() {
    if (!S.research) S.research = { completed: [], inProgress: null };
    if (!Array.isArray(S.hardware)) S.hardware = [];
    if (!Array.isArray(S.employees)) S.employees = [];
    if (!Array.isArray(S.subsidiaries)) S.subsidiaries = [];
    if (!Array.isArray(S.vcRounds)) S.vcRounds = [];
    if (!Array.isArray(S.legacyDecisions)) S.legacyDecisions = [];
    if (!S.projects) S.projects = { active: [], shipped: [] };
    if (!S.capTable) S.capTable = { founderEquity: 1.0, vcEquity: {} };
  }

  window.tycoonScenarios = {
    SCENARIOS,
    getById(id) { return SCENARIOS.find(s => s.id === id); },
    apply(id) {
      const s = SCENARIOS.find(x => x.id === id);
      if (!s) return { ok: false, error: 'Unknown scenario' };
      preinitStateForScenario();
      if (typeof s.applyBonus === 'function') s.applyBonus();
      return { ok: true, scenario: s };
    }
  };
  if (window.dbg) window.dbg.scenarios = window.tycoonScenarios;

  console.log('[tycoon-scenarios] module loaded. ' + SCENARIOS.length + ' scenarios.');
})();
