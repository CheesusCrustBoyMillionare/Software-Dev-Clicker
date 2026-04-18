// ========== TYCOON PROJECTS (v2) ==========
// Core project lifecycle: Design → Development → Polish → Launch → Post-launch sales.
// Phase 1C implementation — headless API (no UI). Phase 1D wires UI on top.
// Projects auto-advance when the tycoon time ticker fires.
(function(){
  'use strict';

  // ---------- Feature Catalog (Phase 1: abbreviated to Games + Business) ----------
  // Full catalog lives in DESIGN_V2.md; this is a starter slice for Phase 1.
  const FEATURES = [
    // ------- Game features -------
    { id:'f_save',     name:'Save System',     types:['game','business'], cost:1, impact:{ polish:+8,  tech:+3 }, era:[1980,2024], desc:'Lets players save progress.' },
    { id:'f_sound',    name:'Sound Effects',   types:['game'],            cost:1, impact:{ design:+5,  polish:+3 }, era:[1980,2024], desc:'Audio feedback for gameplay.' },
    { id:'f_music',    name:'Soundtrack',      types:['game'],            cost:2, impact:{ design:+10, polish:+5 }, era:[1980,2024], desc:'Original music score.' },
    { id:'f_diff',     name:'Difficulty Levels', types:['game'],          cost:1, impact:{ design:+6 }, era:[1980,2024], desc:'Easy/Normal/Hard options.' },
    { id:'f_tutorial', name:'Tutorial',        types:['game','business'], cost:1, impact:{ design:+4,  polish:+4 }, era:[1980,2024], desc:'Guide players/users through basics.' },
    { id:'f_mp',       name:'Multiplayer',     types:['game'],            cost:4, impact:{ design:+15, tech:+10 }, era:[1980,2024], desc:'Local 2-player mode.' },
    { id:'f_chars',    name:'Character Select', types:['game'],           cost:2, impact:{ design:+8 }, era:[1980,2024], desc:'Multiple playable characters.' },
    { id:'f_levels',   name:'Extra Levels',    types:['game'],            cost:3, impact:{ design:+12, polish:-2 }, era:[1980,2024], desc:'More content, more stages.' },
    { id:'f_story',    name:'Story Mode',      types:['game'],            cost:3, impact:{ design:+14, polish:+4 }, era:[1980,2024], desc:'Narrative campaign with cutscenes.' },
    { id:'f_ach',      name:'Achievements',    types:['game'],            cost:1, impact:{ polish:+6 }, era:[1980,2024], desc:'Collectable milestones.' },
    // ------- Business Software features -------
    { id:'f_import',   name:'File Import/Export', types:['business'],     cost:2, impact:{ tech:+8,  polish:+3 }, era:[1980,2024], desc:'Read/write common formats.' },
    { id:'f_print',    name:'Printing Support', types:['business'],       cost:2, impact:{ tech:+6,  polish:+6 }, era:[1980,2024], desc:'Output to dot-matrix, laser, etc.' },
    { id:'f_reports',  name:'Reports & Charts', types:['business'],       cost:3, impact:{ design:+10, tech:+5 }, era:[1980,2024], desc:'Generate visual summaries.' },
    { id:'f_multi',    name:'Multi-User',       types:['business'],       cost:3, impact:{ tech:+12 }, era:[1980,2024], desc:'Concurrent editing / shared files.' },
    { id:'f_macro',    name:'Macros / Scripting', types:['business'],     cost:3, impact:{ tech:+10, design:+5 }, era:[1980,2024], desc:'Power users can automate.' },
    { id:'f_templates',name:'Template Library', types:['business'],       cost:1, impact:{ design:+5, polish:+5 }, era:[1980,2024], desc:'Pre-built starter documents.' },
    { id:'f_help',     name:'Help System',      types:['business','game'],cost:1, impact:{ polish:+6 }, era:[1980,2024], desc:'Built-in documentation.' },
  ];
  const FEATURES_BY_ID = Object.fromEntries(FEATURES.map(f => [f.id, f]));
  window.TYCOON_FEATURES = FEATURES;
  window.TYCOON_FEATURES_BY_ID = FEATURES_BY_ID;

  // ---------- Project Type Definitions ----------
  const PROJECT_TYPES = {
    game: {
      id: 'game',
      label: 'Game',
      weights: { design: 0.5, tech: 0.3, polish: 0.2 },
      desc: 'Entertainment software. Design-heavy quality.'
    },
    business: {
      id: 'business',
      label: 'Business Software',
      weights: { design: 0.25, tech: 0.45, polish: 0.3 },
      desc: 'Productivity tool. Tech-heavy quality.'
    },
  };
  window.PROJECT_TYPES = PROJECT_TYPES;

  // ---------- Scope presets ----------
  const SCOPES = {
    small:  { id:'small',  label:'Small',  months:6,  weeks:24, scopePoints:6,  phaseWeeks:{ design:4,  development:16, polish:4 } },
    medium: { id:'medium', label:'Medium', months:12, weeks:48, scopePoints:12, phaseWeeks:{ design:6,  development:34, polish:8 } },
    large:  { id:'large',  label:'Large',  months:24, weeks:96, scopePoints:20, phaseWeeks:{ design:8,  development:72, polish:16 } },
  };
  window.PROJECT_SCOPES = SCOPES;

  // ---------- Helpers ----------
  let _projectIdCounter = 0;
  function newId() {
    _projectIdCounter += 1;
    return 'p_' + Date.now().toString(36) + '_' + _projectIdCounter;
  }

  // Compute absolute week index from calendar (used for deadline math)
  function absoluteWeek(cal) {
    if (!cal) cal = S.calendar;
    return (cal.year - 1980) * 48 + (cal.month - 1) * 4 + cal.week;
  }

  // ---------- Project creation ----------
  // config: { name, type, genre, scope, features: [featureId...], isContract, clientId, payment, deadline }
  function createProject(config) {
    if (!config || !config.type || !config.scope) throw new Error('createProject: type + scope required');
    if (!PROJECT_TYPES[config.type]) throw new Error('Unknown project type: ' + config.type);
    if (!SCOPES[config.scope]) throw new Error('Unknown scope: ' + config.scope);
    if (!S.projects) S.projects = { active: [], shipped: [], contracts: [] };
    const scope = SCOPES[config.scope];
    const createdAtWeek = absoluteWeek();
    const proj = {
      id: newId(),
      name: config.name || 'Untitled Project',
      type: config.type,
      genre: config.genre || null,
      scope: config.scope,

      // Phase tracking
      phase: 'design',
      phaseStartedAtWeek: createdAtWeek,
      phaseWeeksRequired: scope.phaseWeeks.design,

      // Design-phase choices
      features: Array.isArray(config.features) ? [...config.features] : [],
      budget: config.budget || 0,
      isContract: !!config.isContract,
      clientId: config.clientId || null,
      payment: config.payment || 0,
      deadline: config.deadline || null, // absolute week number

      // Development tracking
      quality: { tech: 0, design: 0, polish: 0 },
      bugs: 0,
      crunching: false,
      decisionsMade: [],
      questionsAsked: [], // question IDs already fired
      pendingDecision: null, // fills while waiting for player to answer

      // Team
      team: [], // engineer IDs; founder auto-assigned in Phase 1 since solo
      lead: null,

      // Polish phase choices
      marketingSpend: 0,
      marketingChannels: [],
      targetLaunchWeek: null,

      // Post-launch (set on ship)
      shippedAtWeek: null,
      criticScore: null,
      userScore: null,
      launchSales: null,
      totalSales: 0,
      salesCurve: [],
      reviews: [],

      // Meta
      createdAtWeek
    };
    S.projects.active.push(proj);
    if (typeof markDirty === 'function') markDirty();
    return proj;
  }

  // ---------- Phase advancement ----------
  function advancePhase(projId) {
    const proj = findProject(projId);
    if (!proj) return null;
    const curCal = S.calendar;
    const scope = SCOPES[proj.scope];
    if (proj.phase === 'design') {
      proj.phase = 'development';
      proj.phaseStartedAtWeek = absoluteWeek();
      proj.phaseWeeksRequired = scope.phaseWeeks.development;
    } else if (proj.phase === 'development') {
      proj.phase = 'polish';
      proj.phaseStartedAtWeek = absoluteWeek();
      proj.phaseWeeksRequired = scope.phaseWeeks.polish;
    } else if (proj.phase === 'polish') {
      // Launch — handled by shipProject()
      shipProject(proj.id);
      return proj;
    }
    if (typeof markDirty === 'function') markDirty();
    return proj;
  }

  // ---------- Per-tick development work ----------
  // Called by the tick subscription below. Accumulates quality per week during development.
  // Phase 1 simplification: solo founder, fixed per-week output.
  function developOneWeek(proj) {
    if (proj.phase !== 'development') return;
    if (proj.pendingDecision) return; // paused awaiting player MC answer
    const f = S.founder;
    if (!f) return;
    // Per-week output = founder stats (with crunch modifier)
    const crunchMul = proj.crunching ? 1.30 : 1.0;
    const bugRisk   = proj.crunching ? 1.50 : 1.0;
    const typeDef = PROJECT_TYPES[proj.type];
    const w = typeDef.weights;
    // Distribute founder effort per project-type weights
    proj.quality.tech    += (f.stats.tech    * w.tech    * 0.8 * crunchMul);
    proj.quality.design  += (f.stats.design  * w.design  * 0.8 * crunchMul);
    proj.quality.polish  += (f.stats.polish  * w.polish  * 0.6 * crunchMul);
    proj.bugs += (bugRisk * 0.4); // baseline bug accumulation
    // Crunch morale cost
    if (proj.crunching && f.morale) f.morale = Math.max(0, f.morale - 3);
  }

  // Per-tick polish work — reduces bugs
  function polishOneWeek(proj) {
    if (proj.phase !== 'polish') return;
    if (proj.pendingDecision) return;
    const f = S.founder;
    if (!f) return;
    // Polish work primarily reduces bugs + bumps polish axis
    const crunchMul = proj.crunching ? 1.30 : 1.0;
    proj.bugs = Math.max(0, proj.bugs - (f.stats.polish * 0.6 * crunchMul));
    proj.quality.polish += (f.stats.polish * 0.4 * crunchMul);
  }

  // Check if current phase is complete (enough weeks elapsed)
  function isPhaseComplete(proj) {
    const elapsed = absoluteWeek() - proj.phaseStartedAtWeek;
    return elapsed >= proj.phaseWeeksRequired;
  }

  // ---------- Shipping ----------
  function shipProject(projId) {
    const proj = findProject(projId);
    if (!proj) return null;

    const ship = computeCriticScore(proj);
    proj.criticScore = ship.critic;
    proj.userScore = ship.user;
    proj.bugs = Math.max(0, Math.round(proj.bugs));
    proj.shippedAtWeek = absoluteWeek();
    proj.phase = 'launched';
    proj.launchSales = computeLaunchSales(proj);

    // Move from active to shipped
    S.projects.active = S.projects.active.filter(p => p.id !== proj.id);
    S.projects.shipped.push(proj);

    // Revenue: contract payout or launch sales
    if (proj.isContract) {
      const paid = proj.payment;
      S.cash = (S.cash || 0) + paid;
      S.tRevenue = (S.tRevenue || 0) + paid;
    } else {
      // Own IP: launch sales become cash immediately in Phase 1 (sales tail comes later)
      const rev = proj.launchSales;
      S.cash = (S.cash || 0) + rev;
      S.tRevenue = (S.tRevenue || 0) + rev;
    }

    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🚀 Shipped: ' + proj.name + ' (critic ' + proj.criticScore + ')');
    return proj;
  }

  // ---------- Quality / review scoring ----------
  // Aggregates the 3 axes weighted by project type, applies bug/innovation modifiers.
  function computeCriticScore(proj) {
    const typeDef = PROJECT_TYPES[proj.type];
    const w = typeDef.weights;
    // Normalize each axis roughly to 0-100. Empirical tuning.
    const normalize = (v, cap) => Math.max(0, Math.min(100, v * (100/cap)));
    const scope = SCOPES[proj.scope];
    const cap = scope.phaseWeeks.development * 2.5;
    const tech = normalize(proj.quality.tech, cap);
    const design = normalize(proj.quality.design, cap);
    const polish = normalize(proj.quality.polish, cap * 1.3);
    let weighted = (tech * w.tech + design * w.design + polish * w.polish);
    // Feature bonus: each feature adds its raw impact values as a small multiplier
    const featureBonus = proj.features
      .map(id => FEATURES_BY_ID[id])
      .filter(Boolean)
      .reduce((sum, f) => sum + ((f.impact.tech||0) + (f.impact.design||0) + (f.impact.polish||0)) * 0.05, 0);
    // Bug penalty
    const bugPenalty = Math.min(30, proj.bugs * 0.8);
    // Random luck ±5
    const luck = (Math.random() - 0.5) * 10;
    let critic = Math.round(weighted + featureBonus - bugPenalty + luck);
    critic = Math.max(1, Math.min(100, critic));
    // User score: slightly more sensitive to polish/bugs
    const userRaw = (critic * 0.6) + (normalize(proj.quality.polish, cap * 1.3) * 0.4) - (proj.bugs * 0.3);
    const user = Math.max(1, Math.min(100, Math.round(userRaw)));
    return { critic, user };
  }

  // ---------- Launch sales ----------
  // Phase 1: simplified. Real formula with platform/genre/rival in Phase 4.
  function computeLaunchSales(proj) {
    if (proj.isContract) return 0; // contracts paid on delivery, not by sales
    const critic = proj.criticScore || 60;
    // Base multiplier curve: linear below 70, accelerating above
    let base = Math.pow(Math.max(critic, 10) / 50, 2.2) * 100000;
    // Scope modifier
    const scopeMul = proj.scope === 'small' ? 1 : proj.scope === 'medium' ? 2.5 : 6;
    // Marketing (placeholder — full channels in Phase 5)
    const mktMul = 1 + ((proj.marketingSpend || 0) / 100000);
    return Math.round(base * scopeMul * mktMul);
  }

  // ---------- Lookup helpers ----------
  function findProject(idOrProj) {
    if (!idOrProj) return null;
    if (typeof idOrProj === 'object') return idOrProj;
    if (!S.projects) return null;
    return S.projects.active.find(p => p.id === idOrProj)
        || S.projects.shipped.find(p => p.id === idOrProj)
        || null;
  }

  // ---------- Tick integration ----------
  // Subscribe to the tycoon ticker. Each game-week: advance development/polish work,
  // roll phase boundaries, fire MC questions when appropriate.
  let _tickUnsub = null;
  function startProjectsTick() {
    if (_tickUnsub) return;
    if (!window.tycoonTime) { console.warn('[projects] tycoonTime not available — tick not started'); return; }
    _tickUnsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopProjectsTick() {
    if (_tickUnsub) { _tickUnsub(); _tickUnsub = null; }
  }

  function onWeekTick(cal) {
    if (!S.projects || !S.projects.active) return;
    for (const proj of [...S.projects.active]) {
      if (proj.phase === 'design') {
        if (isPhaseComplete(proj)) advancePhase(proj.id);
      } else if (proj.phase === 'development') {
        developOneWeek(proj);
        maybeTriggerMCQuestion(proj);
        if (isPhaseComplete(proj) && !proj.pendingDecision) advancePhase(proj.id);
      } else if (proj.phase === 'polish') {
        polishOneWeek(proj);
        if (isPhaseComplete(proj)) advancePhase(proj.id);
      }
    }
  }

  // ---------- Stub: MC questions are wired in next subsection ----------
  function maybeTriggerMCQuestion(proj) {
    // Filled in by the MC module (13b). Stub here so development ticks don't crash.
    if (typeof window._tycoonMaybeFireMC === 'function') {
      window._tycoonMaybeFireMC(proj);
    }
  }

  // ---------- Public API ----------
  window.tycoonProjects = {
    // Data
    FEATURES,
    PROJECT_TYPES,
    SCOPES,
    // Lifecycle
    create: createProject,
    advance: advancePhase,
    ship: shipProject,
    find: findProject,
    // Scoring (exposed for testing)
    computeCriticScore,
    computeLaunchSales,
    // Tick management
    startTick: startProjectsTick,
    stopTick: stopProjectsTick,
    // Inspection
    state() {
      return {
        active: S.projects?.active?.length || 0,
        shipped: S.projects?.shipped?.length || 0,
        activeDetails: (S.projects?.active || []).map(p => ({
          id: p.id, name: p.name, phase: p.phase,
          week: absoluteWeek() - p.phaseStartedAtWeek + '/' + p.phaseWeeksRequired,
          quality: {...p.quality}, bugs: Math.round(p.bugs*10)/10,
          pendingDecision: !!p.pendingDecision
        }))
      };
    },
    absoluteWeek
  };

  // Expose a founder-create helper for testing (real one in 1D character creator)
  window.createFounder = function(name, specialty, trait) {
    S.founder = {
      name: name || 'Alex',
      specialty: specialty || 'coder',
      tier: 1, // Junior
      exp: 0,
      stats: { design: 4, tech: 4, speed: 4, polish: 3 },
      morale: 70,
      age: 25,
      retireAge: 65,
      traits: trait ? [trait] : [],
      isFounder: true
    };
    // Founder trait modifiers (Phase 1: simple +2 to primary stat)
    if (trait === 'Perfectionist') S.founder.stats.polish += 2;
    else if (trait === 'Sprinter')  S.founder.stats.speed  += 2;
    else if (trait === 'Methodical') S.founder.stats.tech  += 2;
    else if (trait === 'Creative')  S.founder.stats.design += 2;
    if (typeof markDirty === 'function') markDirty();
    return S.founder;
  };

  // Add to dbg console
  if (window.dbg) {
    window.dbg.projects = window.tycoonProjects;
    window.dbg.createFounder = window.createFounder;
  }

  console.log('[tycoon-projects] module loaded. createProject, shipProject, computeCriticScore exposed.');
})();
