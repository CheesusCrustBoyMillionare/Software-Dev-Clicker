// ========== TYCOON PROJECTS (v2) ==========
// Core project lifecycle: Design → Development → Polish → Launch → Post-launch sales.
// Phase 1C implementation — headless API (no UI). Phase 1D wires UI on top.
// Projects auto-advance when the tycoon time ticker fires.
(function(){
  'use strict';

  // ---------- Feature Catalog ----------
  // Features are gated by project type AND era. Full catalog in DESIGN_V2.md.
  const FEATURES = [
    // ------- Game features -------
    { id:'f_save',     name:'Save System',     types:['game','business'], cost:1, impact:{ polish:+8,  tech:+3 }, era:[1980,2024], desc:'Lets players save progress.' },
    { id:'f_sound',    name:'Sound Effects',   types:['game'],            cost:1, impact:{ design:+5,  polish:+3 }, era:[1980,2024], desc:'Audio feedback for gameplay.' },
    { id:'f_music',    name:'Soundtrack',      types:['game'],            cost:2, impact:{ design:+10, polish:+5 }, era:[1980,2024], desc:'Original music score.' },
    { id:'f_diff',     name:'Difficulty Levels', types:['game'],          cost:1, impact:{ design:+6 }, era:[1980,2024], desc:'Easy/Normal/Hard options.' },
    { id:'f_tutorial', name:'Tutorial',        types:['game','business','web','mobile'], cost:1, impact:{ design:+4, polish:+4 }, era:[1980,2024], desc:'Guide players/users through basics.' },
    { id:'f_mp',       name:'Multiplayer',     types:['game'],            cost:4, impact:{ design:+15, tech:+10 }, era:[1980,2024], desc:'Local 2-player mode.' },
    { id:'f_chars',    name:'Character Select', types:['game'],           cost:2, impact:{ design:+8 }, era:[1980,2024], desc:'Multiple playable characters.' },
    { id:'f_levels',   name:'Extra Levels',    types:['game'],            cost:3, impact:{ design:+12, polish:-2 }, era:[1980,2024], desc:'More content, more stages.' },
    { id:'f_story',    name:'Story Mode',      types:['game','web'],      cost:3, impact:{ design:+14, polish:+4 }, era:[1980,2024], desc:'Narrative campaign with cutscenes.' },
    { id:'f_ach',      name:'Achievements',    types:['game','mobile'],   cost:1, impact:{ polish:+6 }, era:[1980,2024], desc:'Collectable milestones.' },
    // ------- Business Software features -------
    { id:'f_import',   name:'File Import/Export', types:['business'],     cost:2, impact:{ tech:+8,  polish:+3 }, era:[1980,2024], desc:'Read/write common formats.' },
    { id:'f_print',    name:'Printing Support', types:['business'],       cost:2, impact:{ tech:+6,  polish:+6 }, era:[1980,2024], desc:'Output to dot-matrix, laser, etc.' },
    { id:'f_reports',  name:'Reports & Charts', types:['business','saas'],cost:3, impact:{ design:+10, tech:+5 }, era:[1980,2024], desc:'Generate visual summaries.' },
    { id:'f_multi',    name:'Multi-User',       types:['business','web','saas'], cost:3, impact:{ tech:+12 }, era:[1980,2024], desc:'Concurrent editing / shared files.' },
    { id:'f_macro',    name:'Macros / Scripting', types:['business'],     cost:3, impact:{ tech:+10, design:+5 }, era:[1980,2024], desc:'Power users can automate.' },
    { id:'f_templates',name:'Template Library', types:['business','web','saas'], cost:1, impact:{ design:+5, polish:+5 }, era:[1980,2024], desc:'Pre-built starter documents.' },
    { id:'f_help',     name:'Help System',      types:['business','game','web','saas'], cost:1, impact:{ polish:+6 }, era:[1980,2024], desc:'Built-in documentation.' },
    // ------- Web App features (1995+) -------
    { id:'f_auth',     name:'User Accounts',    types:['web','mobile','saas'], cost:2, impact:{ tech:+8, polish:+2 }, era:[1995,2024], desc:'Login, signup, password reset.' },
    { id:'f_pay',      name:'Payment Integration', types:['web','mobile','saas'], cost:3, impact:{ tech:+10, polish:+5 }, era:[1995,2024], desc:'Accept credit cards / subscriptions.' },
    { id:'f_email',    name:'Email Notifications', types:['web','saas'],  cost:2, impact:{ tech:+6, polish:+4 }, era:[1995,2024], desc:'Transactional + marketing emails.' },
    { id:'f_admin',    name:'Admin Dashboard',  types:['web','saas'],     cost:2, impact:{ design:+6, tech:+6 }, era:[1995,2024], desc:'Back-office control panel.' },
    { id:'f_api',      name:'Public API',       types:['web','saas'],     cost:3, impact:{ tech:+12 }, era:[1995,2024], desc:'Third-party integrations.' },
    { id:'f_search',   name:'Search & Discovery', types:['web','mobile'], cost:2, impact:{ tech:+8, design:+4 }, era:[1995,2024], desc:'Find content quickly.' },
    { id:'f_ads',      name:'Ad System',        types:['web','mobile'],   cost:2, impact:{ tech:+4, polish:-3 }, era:[1995,2024], desc:'Monetize via ads.' },
    { id:'f_responsive',name:'Mobile Responsive', types:['web'],          cost:2, impact:{ design:+6, polish:+5 }, era:[2008,2024], desc:'Works on phones + tablets.' },
    // ------- Mobile App features (2007+) -------
    { id:'f_onboard',  name:'Onboarding Flow',  types:['mobile','saas'],  cost:2, impact:{ design:+8, polish:+4 }, era:[2007,2024], desc:'First-run user experience.' },
    { id:'f_push',     name:'Push Notifications', types:['mobile'],       cost:2, impact:{ tech:+6, design:+3 }, era:[2007,2024], desc:'Re-engagement signals.' },
    { id:'f_iap',      name:'In-App Purchases', types:['mobile'],         cost:3, impact:{ tech:+8, polish:+2 }, era:[2008,2024], desc:'Monetize via IAP.' },
    { id:'f_social',   name:'Social Sharing',   types:['mobile','web'],   cost:2, impact:{ design:+6, tech:+3 }, era:[2007,2024], desc:'Share to Facebook, Twitter, etc.' },
    { id:'f_offline',  name:'Offline Mode',     types:['mobile','saas'],  cost:3, impact:{ tech:+10, polish:+4 }, era:[2007,2024], desc:'Works without connectivity.' },
    { id:'f_camera',   name:'Camera Integration', types:['mobile'],       cost:2, impact:{ design:+6, tech:+4 }, era:[2008,2024], desc:'Photo/video capture in-app.' },
    { id:'f_location', name:'Location Services', types:['mobile'],        cost:2, impact:{ tech:+6, design:+4 }, era:[2007,2024], desc:'GPS-based features.' },
    // ------- SaaS features (2010+) -------
    { id:'f_webhooks', name:'Webhooks',         types:['saas'],           cost:2, impact:{ tech:+10 }, era:[2010,2024], desc:'Real-time event delivery to customers.' },
    { id:'f_sso',      name:'SSO / Enterprise Auth', types:['saas'],      cost:3, impact:{ tech:+10, polish:+5 }, era:[2010,2024], desc:'SAML / OAuth for enterprise.' },
    { id:'f_audit',    name:'Audit Logs',       types:['saas'],           cost:2, impact:{ tech:+6, polish:+6 }, era:[2010,2024], desc:'Compliance-ready activity history.' },
    { id:'f_team',     name:'Team Collaboration', types:['saas'],         cost:3, impact:{ design:+10, tech:+6 }, era:[2010,2024], desc:'Shared workspaces, roles.' },
    { id:'f_analytics',name:'Analytics Dashboard', types:['saas','web'],  cost:3, impact:{ design:+8, tech:+8 }, era:[2010,2024], desc:'Usage metrics visualizations.' },
    // ------- AI Product features (2020+) -------
    { id:'f_inference', name:'Inference API',   types:['ai'],             cost:3, impact:{ tech:+12 }, era:[2020,2024], desc:'Serve model predictions.' },
    { id:'f_finetune',  name:'Fine-tuning',     types:['ai'],             cost:3, impact:{ tech:+10, design:+4 }, era:[2020,2024], desc:'Custom model training pipeline.' },
    { id:'f_safety',    name:'Safety Filters',  types:['ai'],             cost:2, impact:{ polish:+10, tech:+4 }, era:[2020,2024], desc:'Content moderation + abuse prevention.' },
    { id:'f_multimodal',name:'Multi-Modal Input', types:['ai'],           cost:3, impact:{ design:+10, tech:+8 }, era:[2023,2024], desc:'Text + image + audio input.' },
    { id:'f_memory',    name:'Conversation Memory', types:['ai'],         cost:3, impact:{ design:+8, tech:+8 }, era:[2020,2024], desc:'Context-aware multi-turn.' },
  ];
  const FEATURES_BY_ID = Object.fromEntries(FEATURES.map(f => [f.id, f]));
  window.TYCOON_FEATURES = FEATURES;
  window.TYCOON_FEATURES_BY_ID = FEATURES_BY_ID;

  // ---------- Project Type Definitions ----------
  // Each type has an era window — can only be created when calendar.year falls in it.
  const PROJECT_TYPES = {
    game: {
      id: 'game',
      label: 'Game',
      icon: '🎮',
      era: [1980, 2024],
      weights: { design: 0.5, tech: 0.3, polish: 0.2 },
      desc: 'Entertainment software. Design-heavy quality.'
    },
    business: {
      id: 'business',
      label: 'Business Software',
      icon: '💼',
      era: [1980, 2024],
      weights: { design: 0.25, tech: 0.45, polish: 0.3 },
      desc: 'Productivity tool. Tech-heavy quality.'
    },
    web: {
      id: 'web',
      label: 'Web App',
      icon: '🌐',
      era: [1995, 2024],
      weights: { design: 0.40, tech: 0.35, polish: 0.25 },
      desc: 'Browser-based app. Reach + design balance.'
    },
    mobile: {
      id: 'mobile',
      label: 'Mobile App',
      icon: '📱',
      era: [2007, 2024],
      weights: { design: 0.40, tech: 0.25, polish: 0.35 },
      desc: 'iOS / Android app. Polish-heavy.'
    },
    saas: {
      id: 'saas',
      label: 'SaaS Product',
      icon: '☁️',
      era: [2010, 2024],
      weights: { design: 0.25, tech: 0.40, polish: 0.35 },
      desc: 'Subscription cloud service. Reliability-focused.'
    },
    ai: {
      id: 'ai',
      label: 'AI Product',
      icon: '🤖',
      era: [2020, 2024],
      weights: { design: 0.30, tech: 0.45, polish: 0.25 },
      desc: 'AI-powered app. Tech-intensive, novel UX.'
    },
  };
  window.PROJECT_TYPES = PROJECT_TYPES;

  // Era-available type helper (used by Design modal + contract generator)
  function isTypeAvailable(typeId, year) {
    const t = PROJECT_TYPES[typeId];
    if (!t) return false;
    year = year == null ? (S.calendar?.year || 1980) : year;
    return year >= t.era[0] && year <= t.era[1];
  }
  window.isProjectTypeAvailable = isTypeAvailable;

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
      clientTier: config.clientTier || null,
      payment: config.payment || 0,
      deadline: config.deadline || null, // absolute week number

      // Development tracking
      quality: { tech: 0, design: 0, polish: 0 },
      bugs: 0,
      crunching: false,
      decisionsMade: [],
      questionsAsked: [], // question IDs already fired
      pendingDecision: null, // fills while waiting for player to answer

      // Team — engineer IDs assigned to this project. 'founder' is a sentinel.
      // Phase 3F: auto-assign founder + all bench engineers by default; player
      // can reassign via the Teams panel.
      team: (() => {
        const bench = window.tycoonTeams ? window.tycoonTeams.getBench() : [];
        return bench.map(e => e.isFounder ? 'founder' : e.id);
      })(),
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

  // ---------- Team contributors (Phase 3F) ----------
  // Engineers can be assigned to a specific project via proj.team[] (array of IDs).
  // 'founder' is a sentinel for the founder; other strings are employee IDs.
  // Contributors for a project = its assigned team, or fallback (unassigned pool)
  // if team empty.
  function getContributorsFor(proj) {
    if (!Array.isArray(proj.team) || proj.team.length === 0) {
      // Fallback: if no explicit team, use all bench engineers + founder
      const bench = getBenchEngineers();
      return bench;
    }
    const list = [];
    for (const id of proj.team) {
      if (id === 'founder' && S.founder) list.push(S.founder);
      else {
        const emp = (S.employees || []).find(e => e.id === id);
        if (emp) list.push(emp);
      }
    }
    return list;
  }

  // Engineers with no current project assignment
  function getBenchEngineers() {
    const assigned = new Set();
    for (const p of (S.projects?.active || [])) {
      for (const id of (p.team || [])) assigned.add(id);
    }
    const list = [];
    if (S.founder && !assigned.has('founder')) list.push(S.founder);
    for (const e of (S.employees || [])) {
      if (!assigned.has(e.id)) list.push(e);
    }
    return list;
  }

  // Move an engineer to a project (removing from current assignment)
  function assignEngineerToProject(engineerId, projectId) {
    for (const p of (S.projects?.active || [])) {
      if (Array.isArray(p.team)) p.team = p.team.filter(id => id !== engineerId);
    }
    const proj = S.projects.active.find(p => p.id === projectId);
    if (!proj) return { ok: false, error: 'Project not found' };
    if (!Array.isArray(proj.team)) proj.team = [];
    if (!proj.team.includes(engineerId)) proj.team.push(engineerId);
    if (typeof markDirty === 'function') markDirty();
    document.dispatchEvent(new CustomEvent('tycoon:team-changed', { detail: { projectId } }));
    return { ok: true };
  }

  function unassignEngineer(engineerId) {
    for (const p of (S.projects?.active || [])) {
      if (Array.isArray(p.team)) p.team = p.team.filter(id => id !== engineerId);
    }
    if (typeof markDirty === 'function') markDirty();
    document.dispatchEvent(new CustomEvent('tycoon:team-changed', { detail: {} }));
  }

  window.tycoonTeams = {
    getContributorsFor,
    getBench: getBenchEngineers,
    assign: assignEngineerToProject,
    unassign: unassignEngineer,
  };
  if (window.dbg) window.dbg.teams = window.tycoonTeams;

  // Specialty → primary quality axis (used for specialty match bonus)
  const SPECIALTY_AXIS = {
    coder: 'tech', frontend: 'design', backend: 'tech', network: 'tech',
    webdev: 'design', gamedev: 'design', mobile: 'polish',
    devops: 'polish', cloud: 'tech', agent: 'design'
  };

  // Apply trait effects to stats for this week's calculation
  function effectiveStats(c) {
    const base = { ...(c.stats || { tech:0, design:0, speed:0, polish:0 }) };
    const traits = c.traits || [];
    for (const t of traits) {
      const def = window.TYCOON_TRAITS?.[t];
      if (!def?.effect) continue;
      for (const k of ['tech','design','polish','speed']) {
        if (def.effect[k]) base[k] = Math.max(0, (base[k] || 0) + def.effect[k]);
      }
    }
    return base;
  }

  // Morale affects productivity — below 40 = -20%, above 85 = +15% "Flow state"
  function moraleMultiplier(m) {
    if (m == null) return 1;
    if (m < 25) return 0.5;     // quit risk
    if (m < 40) return 0.8;     // discontent
    if (m >= 85) return 1.15;   // flow
    return 1;
  }

  // ---------- Per-tick development work ----------
  function developOneWeek(proj) {
    if (proj.phase !== 'development') return;
    if (proj.pendingDecision) return;
    const contributors = getContributorsFor(proj);
    if (contributors.length === 0) return;
    const typeDef = PROJECT_TYPES[proj.type];
    const w = typeDef.weights;
    const crunchMul = proj.crunching ? 1.30 : 1.0;
    const bugRisk   = proj.crunching ? 1.50 : 1.0;
    // With explicit team assignment, no per-project dilution — each team fully dedicated
    const perProjMul = 1;

    // Research bonuses (Phase 3C): quality multipliers per axis + global team productivity
    const researchTech    = window.tycoonResearch?.qualityMultiplierFor?.('tech', proj.type) || 1;
    const researchDesign  = window.tycoonResearch?.qualityMultiplierFor?.('design', proj.type) || 1;
    const researchPolish  = window.tycoonResearch?.qualityMultiplierFor?.('polish', proj.type) || 1;
    const teamMult = window.tycoonResearch?.teamProductivityMultiplier?.() || 1;
    const devSpeedMult = window.tycoonResearch?.devSpeedMultiplierForType?.(proj.type) || 1;
    for (const c of contributors) {
      const es = effectiveStats(c);
      const mm = moraleMultiplier(c.morale);
      const specAxis = SPECIALTY_AXIS[c.specialty];
      const bonus = (axis) => (axis === specAxis ? 1.3 : 1.0);
      proj.quality.tech    += (es.tech    * w.tech    * 0.8 * crunchMul * mm * bonus('tech')   * perProjMul * teamMult * researchTech   * devSpeedMult);
      proj.quality.design  += (es.design  * w.design  * 0.8 * crunchMul * mm * bonus('design') * perProjMul * teamMult * researchDesign * devSpeedMult);
      proj.quality.polish  += (es.polish  * w.polish  * 0.6 * crunchMul * mm * bonus('polish') * perProjMul * teamMult * researchPolish * devSpeedMult);
      proj.bugs += (bugRisk * 0.3 * perProjMul);
      if (proj.crunching) {
        c.morale = Math.max(0, (c.morale || 70) - 3);
      }
    }
  }

  // ---------- Per-tick polish work ----------
  function polishOneWeek(proj) {
    if (proj.phase !== 'polish') return;
    if (proj.pendingDecision) return;
    const contributors = getContributorsFor(proj);
    if (contributors.length === 0) return;
    const perProjMul = 1;
    const crunchMul = proj.crunching ? 1.30 : 1.0;
    for (const c of contributors) {
      const es = effectiveStats(c);
      const mm = moraleMultiplier(c.morale);
      const specBonus = SPECIALTY_AXIS[c.specialty] === 'polish' ? 1.3 : 1.0;
      proj.bugs = Math.max(0, proj.bugs - (es.polish * 0.6 * crunchMul * mm * specBonus * perProjMul));
      proj.quality.polish += (es.polish * 0.4 * crunchMul * mm * specBonus * perProjMul);
    }
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

    // Macro event revenue modifier (Phase 3G)
    const macroMult = window.tycoonMacro?.revenueMultiplier?.(proj.type) || 1;

    // Revenue: contract payout or launch sales
    if (proj.isContract) {
      const paid = Math.round(proj.payment * macroMult);
      S.cash = (S.cash || 0) + paid;
      S.tRevenue = (S.tRevenue || 0) + paid;
      proj.actualPayment = paid; // record post-macro payout
      // Client rating (Phase 2D)
      if (typeof window._tycoonRecordContractDelivery === 'function') {
        window._tycoonRecordContractDelivery(proj);
      }
    } else {
      // Own IP: launch sales (modified by macro events)
      const rev = Math.round(proj.launchSales * macroMult);
      proj.actualLaunchSales = rev;
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
