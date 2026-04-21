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
    // v11.1: honor research nodes with effect.type === 'unlock_early' —
    // pulls the era-start back by 1 year. Previously the research existed
    // (n_mobile_os promises "target mobile one year sooner") but the
    // effect was never read anywhere. Now it is.
    let eraMin = t.era[0];
    const R = window.tycoonResearch;
    if (R?.NODE_BY_ID) {
      for (const id of (S.research?.completed || [])) {
        const node = R.NODE_BY_ID[id];
        if (node?.effect?.type === 'unlock_early' && node.effect.projectType === typeId) {
          eraMin = Math.min(eraMin, t.era[0] - 1);
        }
      }
    }
    return year >= eraMin && year <= t.era[1];
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
      platform: config.platform || null, // Phase 4C
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
    // Apply team Speed to the initial design phase duration too
    proj.phaseWeeksRequired = applySpeedToDuration(proj, proj.phaseWeeksRequired);
    S.projects.active.push(proj);
    if (typeof markDirty === 'function') markDirty();
    return proj;
  }

  // ---------- Speed-stat wiring (v11.1) ----------
  // The team's average Speed stat compresses phase duration at phase-start.
  // Baseline ≈ 5 (a solid junior); each point above 5 trims 4% off the phase;
  // each point below adds 4% (capped ±30%). Team Speed locked in at phase
  // transition so a mid-phase reassign doesn't shift an already-committed
  // schedule. Founder + assigned employees both count equally.
  function avgTeamSpeed(proj) {
    const contributors = getContributorsFor(proj);
    if (!contributors.length) return 5;
    let total = 0;
    for (const c of contributors) total += (c.stats?.speed || 0);
    return total / contributors.length;
  }
  function applySpeedToDuration(proj, baseWeeks) {
    if (!baseWeeks) return baseWeeks;
    const avg = avgTeamSpeed(proj);
    // 1 - 0.04 × (avg - 5), clamped to [0.7, 1.3] — 30% fastest, 30% slowest
    let mul = Math.max(0.7, Math.min(1.3, 1 - (avg - 5) * 0.04));
    // v11.1: Serial Founder trait — first project ships 30% faster. Applies
    // on top of Speed compression. Checked against shipped count, so this
    // only fires when no ships have landed yet in the current run.
    const serial = window.tycoonTraits?.founderTraitHook?.('firstShipSpeed');
    if (serial?.mul && (S.projects?.shipped?.length || 0) === 0) {
      mul *= serial.mul;
    }
    return Math.max(1, Math.round(baseWeeks * mul));
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
      proj.phaseWeeksRequired = applySpeedToDuration(proj, scope.phaseWeeks.development);
    } else if (proj.phase === 'development') {
      proj.phase = 'polish';
      proj.phaseStartedAtWeek = absoluteWeek();
      proj.phaseWeeksRequired = applySpeedToDuration(proj, scope.phaseWeeks.polish);
      // v3 roguelite: Perfectionist founder extends polish phase duration.
      // Quality mult is applied in polishOneWeek (above).
      const perf = window.tycoonTraits?.founderTraitHook?.('polishPhase');
      if (perf?.durationMul) {
        proj.phaseWeeksRequired = Math.ceil(proj.phaseWeeksRequired * perf.durationMul);
      }
      // Phase 4E: fire event so UI can prompt for marketing channels.
      document.dispatchEvent(new CustomEvent('tycoon:project-polish-started', { detail: { projectId: proj.id } }));
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
  // v11.1: Nihilist founder trait flattens morale's effect on output to 1.0.
  // The matching morale cap (≤65 for the team) is enforced in
  // tycoonEmployees onWeekTick so mid-range drift still works.
  function moraleMultiplier(m) {
    if (window.tycoonTraits?.founderTraitHook?.('moraleFlat')) return 1;
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
    // v11.1: Crunch Addict founder trait reworks crunch numbers:
    // output +20% (was +30%), bug risk neutralized (was +50%). Trait-less
    // founder keeps the original crunch rules.
    const crunchRework = window.tycoonTraits?.founderTraitHook?.('crunchRework');
    const crunchOutMul = crunchRework?.outputMul ?? 1.30;
    const crunchBugMul = crunchRework?.bugRiskMul ?? 1.50;
    const crunchMul = proj.crunching ? crunchOutMul : 1.0;
    const bugRisk   = proj.crunching ? crunchBugMul : 1.0;
    const perProjMul = 1;

    const researchTech    = window.tycoonResearch?.qualityMultiplierFor?.('tech', proj.type) || 1;
    const researchDesign  = window.tycoonResearch?.qualityMultiplierFor?.('design', proj.type) || 1;
    const researchPolish  = window.tycoonResearch?.qualityMultiplierFor?.('polish', proj.type) || 1;
    const teamMult = window.tycoonResearch?.teamProductivityMultiplier?.() || 1;
    const devSpeedMult = window.tycoonResearch?.devSpeedMultiplierForType?.(proj.type) || 1;
    // v11.1: employee trait team multipliers. Team Player boosts the WHOLE
    // team; Lone Wolf / Veteran are per-contributor (computed inside the loop).
    const teamTraitMul = computeTeamTraitMultiplier(contributors);
    // v3 roguelite: founder-level output modifier (Night Owl, Caffeinated,
    // Chip on Shoulder, Scrappy, Workaholic) + per-axis modifier (passions +
    // Polish Snob). Computed once per tick since S.founder is shared.
    const founderOut = window.tycoonTraits?.founderOutputMul?.(proj, 'development') ?? 1;
    const founderAxisT = window.tycoonTraits?.founderAxisMul?.('tech')    ?? 1;
    const founderAxisD = window.tycoonTraits?.founderAxisMul?.('design')  ?? 1;
    const founderAxisP = window.tycoonTraits?.founderAxisMul?.('polish')  ?? 1;

    for (const c of contributors) {
      const es = effectiveStats(c);
      const mm = moraleMultiplier(c.morale);
      // v11.1: specialty bias is now baked into each contributor's base
      // stats at generation time (generateCandidate) / at enrollment
      // (founder passions shape rolled stats). No runtime specialty
      // multiplier needed — what you see in the UI is what contributes.

      // Founder-specific multipliers (apply to founder only, 1.0 for employees).
      const fOut = c.isFounder ? founderOut : 1.0;
      const fAxT = c.isFounder ? founderAxisT : 1.0;
      const fAxD = c.isFounder ? founderAxisD : 1.0;
      const fAxP = c.isFounder ? founderAxisP : 1.0;
      // Per-contributor trait multiplier (Lone Wolf, Veteran)
      const traitMul = computeContributorTraitMultiplier(c, contributors, proj);

      proj.quality.tech    += (es.tech    * w.tech    * 0.8 * crunchMul * mm * perProjMul * teamMult * teamTraitMul * traitMul * researchTech   * devSpeedMult * fOut * fAxT);
      proj.quality.design  += (es.design  * w.design  * 0.8 * crunchMul * mm * perProjMul * teamMult * teamTraitMul * traitMul * researchDesign * devSpeedMult * fOut * fAxD);
      proj.quality.polish  += (es.polish  * w.polish  * 0.6 * crunchMul * mm * perProjMul * teamMult * teamTraitMul * traitMul * researchPolish * devSpeedMult * fOut * fAxP);
      proj.bugs += (bugRisk * 0.3 * perProjMul);
      if (proj.crunching) {
        c.morale = Math.max(0, (c.morale || 70) - 3);
      }
    }

    // Workaholic founder drains team morale by 1/week if on the team.
    const wk = window.tycoonTraits?.founderTraitHook?.('outputTradeoff');
    if (wk && contributors.some(c => c.isFounder)) {
      for (const c of contributors) {
        if (!c.isFounder) c.morale = Math.max(0, (c.morale || 70) - (wk.moraleDrain || 0));
      }
    }
    // v11.1: Toxic trait — each Toxic teammate drains everyone else on the
    // project by 0.5 morale/week (-2/month, per the trait hint). Stacks if
    // you somehow assembled multiple toxics on one team.
    applyToxicDrain(contributors);
  }

  // ---------- Per-tick polish work ----------
  function polishOneWeek(proj) {
    if (proj.phase !== 'polish') return;
    if (proj.pendingDecision) return;
    const contributors = getContributorsFor(proj);
    if (contributors.length === 0) return;
    const perProjMul = 1;
    // v11.1: Crunch Addict — same output rework applies in polish phase.
    const crunchRework = window.tycoonTraits?.founderTraitHook?.('crunchRework');
    const crunchMul = proj.crunching ? (crunchRework?.outputMul ?? 1.30) : 1.0;

    // v3 roguelite: founder mods for polish phase. Perfectionist gives an
    // additional quality bump on top of the normal polish gains.
    const founderOut = window.tycoonTraits?.founderOutputMul?.(proj, 'polish') ?? 1;
    const founderAxisP = window.tycoonTraits?.founderAxisMul?.('polish') ?? 1;
    const perfHook = window.tycoonTraits?.founderTraitHook?.('polishPhase');
    const perfMul = perfHook?.qualityMul || 1.0;
    const teamTraitMul = computeTeamTraitMultiplier(contributors);

    for (const c of contributors) {
      const es = effectiveStats(c);
      const mm = moraleMultiplier(c.morale);
      // v11.1: specialty bias is baked into base stats; no runtime multiplier.
      // Contributors whose specialty is polish just happen to have higher
      // polish stat values, so this loop doesn't need a special case.

      const fOut = c.isFounder ? founderOut : 1.0;
      const fAxP = c.isFounder ? founderAxisP : 1.0;
      const fPerf = c.isFounder ? perfMul : 1.0;
      const traitMul = computeContributorTraitMultiplier(c, contributors, proj);

      proj.bugs = Math.max(0, proj.bugs - (es.polish * 0.6 * crunchMul * mm * perProjMul * fOut * traitMul));
      proj.quality.polish += (es.polish * 0.4 * crunchMul * mm * perProjMul * teamTraitMul * traitMul * fOut * fAxP * fPerf);
    }

    // Workaholic morale drain applies in polish phase too.
    const wk = window.tycoonTraits?.founderTraitHook?.('outputTradeoff');
    if (wk && contributors.some(c => c.isFounder)) {
      for (const c of contributors) {
        if (!c.isFounder) c.morale = Math.max(0, (c.morale || 70) - (wk.moraleDrain || 0));
      }
    }
    // Toxic drain during polish phase too
    applyToxicDrain(contributors);
  }

  // v11.1: employee-trait multipliers used by developOneWeek + polishOneWeek.
  //
  // Team Player: +10% team-wide synergy per Team Player on the team (stacks).
  // Lone Wolf on a multi-person team: −5% to team synergy (stacks).
  // The returned value is applied to every contributor's output.
  function computeTeamTraitMultiplier(contributors) {
    if (!Array.isArray(contributors) || contributors.length === 0) return 1;
    const has = (c, t) => Array.isArray(c.traits) && c.traits.includes(t);
    const teamPlayers = contributors.filter(c => has(c, 'Team Player')).length;
    const loneWolves = contributors.length > 1
      ? contributors.filter(c => has(c, 'Lone Wolf')).length
      : 0;
    return 1 + (teamPlayers * 0.10) - (loneWolves * 0.05);
  }

  // Per-contributor trait multiplier — reads traits that affect only this
  // individual's output, not the whole team.
  //   Lone Wolf, solo on the project: +20% to own output.
  //   Veteran: +15% output on project types they've shipped before.
  function computeContributorTraitMultiplier(c, contributors, proj) {
    const traits = c.traits;
    if (!Array.isArray(traits) || traits.length === 0) return 1;
    let mul = 1;
    if (traits.includes('Lone Wolf') && contributors.length === 1) mul *= 1.20;
    if (traits.includes('Veteran') && proj && Array.isArray(c.shippedTypes) && c.shippedTypes.includes(proj.type)) {
      mul *= 1.15;
    }
    return mul;
  }

  // Mentor growth — called once per week from tycoonEmployees weekly tick.
  // For each project with a Mentor on the team, every junior (tier ≤ 2)
  // teammate gains 0.1 of growth in a random stat. When a stat's growth
  // pool crosses 1.0, the stat increments by 1 (capped at tier statCap + 1).
  function applyMentorGrowth() {
    if (!S.projects?.active) return;
    const TIERS = window.TYCOON_TIERS || [];
    const has = (c, t) => Array.isArray(c.traits) && c.traits.includes(t);
    for (const proj of S.projects.active) {
      const contributors = getContributorsFor(proj);
      const mentors = contributors.filter(c => has(c, 'Mentor')).length;
      if (!mentors) continue;
      for (const c of contributors) {
        if (c.isFounder) continue;
        if ((c.tier || 0) > 2) continue;  // only juniors/interns/mids
        if (has(c, 'Mentor')) continue;    // mentors don't mentor themselves
        if (!c.mentorGrowth) c.mentorGrowth = { tech:0, design:0, polish:0, speed:0 };
        // Pick a random axis per mentor per week
        for (let i = 0; i < mentors; i++) {
          const axis = ['tech','design','polish','speed'][Math.floor(Math.random() * 4)];
          c.mentorGrowth[axis] = (c.mentorGrowth[axis] || 0) + 0.1;
          if (c.mentorGrowth[axis] >= 1) {
            const cap = (TIERS[c.tier]?.statCap || 10) + 1;
            c.stats[axis] = Math.min(cap, (c.stats[axis] || 0) + 1);
            c.mentorGrowth[axis] -= 1;
            if (typeof log === 'function') log('\uD83C\uDF93 Mentor growth: ' + c.name + ' +1 ' + axis);
          }
        }
      }
    }
  }
  // Expose so tycoonEmployees can call it from its weekly tick
  window._tycoonApplyMentorGrowth = applyMentorGrowth;

  // v11.1: Toxic-teammate morale drain. Called from developOneWeek +
  // polishOneWeek. Each Toxic contributor subtracts 0.5 morale/wk from every
  // OTHER member on the team (founder included). Toxic folks don't drain
  // themselves. The founder is never a Toxic carrier (founder traits are a
  // separate catalog), so this only fires for employees.
  function applyToxicDrain(contributors) {
    if (!Array.isArray(contributors) || contributors.length < 2) return;
    const toxicCount = contributors.filter(c => Array.isArray(c.traits) && c.traits.includes('Toxic')).length;
    if (toxicCount === 0) return;
    const drainPerTick = 0.5 * toxicCount;
    for (const c of contributors) {
      if (Array.isArray(c.traits) && c.traits.includes('Toxic')) continue;
      if (c.isFounder && S.founder) {
        S.founder.morale = Math.max(0, (S.founder.morale || 70) - drainPerTick);
      } else {
        c.morale = Math.max(0, (c.morale || 70) - drainPerTick);
      }
    }
  }

  // Check if current phase is complete (enough weeks elapsed)
  function isPhaseComplete(proj) {
    const elapsed = absoluteWeek() - proj.phaseStartedAtWeek;
    return elapsed >= proj.phaseWeeksRequired;
  }

  // ---------- Per-week revenue for shipped own-IP project ----------
  // v10.2: Rebuilt sales-over-time model.
  //   - Tail duration doubled: now Math.min(24, round(user/10) * 2), min 4
  //   - What was the week-0 lump is now distributed over the FIRST HALF of
  //     the tail (H weeks) with weeks 0 & 1 both at peak, then linearly
  //     declining to week H-1. Launch cash still "feels" like a spike but
  //     spread across the first couple months.
  //   - The SECOND HALF of the tail pays the standard per-week rate:
  //     launchSales × 0.10 × (user/100). Good reviews → long fat tail.
  //
  // weekIndex: 0 = launch week, 1 = week after, …, (tailWeeksTotal − 1) = last.
  function weekRevenue(proj, weekIndex) {
    if (!proj || proj.isContract) return 0;
    const total = proj.tailWeeksTotal || 0;
    if (weekIndex < 0 || weekIndex >= total) return 0;
    const H = Math.floor(total / 2);
    const launch = proj.launchSales || 0;
    const userScore = proj.userScore || 0;
    if (weekIndex < H) {
      // Front-loaded launch distribution
      const weightFor = (i) => Math.max(1, H - Math.max(0, i - 1));
      let totalWeight = 0;
      for (let i = 0; i < H; i++) totalWeight += weightFor(i);
      return totalWeight > 0 ? Math.round(launch * (weightFor(weekIndex) / totalWeight)) : 0;
    }
    // Second half — standard flat tail
    return Math.round(launch * 0.10 * (userScore / 100));
  }
  // Expose for the sales-graph renderer in the UI module.
  if (window.dbg) window.dbg.weekRevenue = weekRevenue;

  // ---------- Shipping ----------
  function shipProject(projId) {
    const proj = findProject(projId);
    if (!proj) return null;

    // v10.1 D: enforce minimum-bug floor BEFORE scoring. No ship is perfect —
    // the bug penalty can never fully disappear, so critic 100 is blocked.
    proj.bugs = Math.max(1, Math.round(proj.bugs));

    const ship = computeCriticScore(proj);
    proj.criticScore = ship.critic;
    proj.userScore = ship.user;
    proj.shippedAtWeek = absoluteWeek();
    proj.phase = 'launched';
    proj.launchSales = computeLaunchSales(proj);

    // v3 roguelite: ship-time founder trait hooks.
    // Deal Maker adjusts contract payment + own-IP launch sales. Applied
    // before the tail distribution math so later weeks reflect the scaled
    // launch total.
    const dealMaker = window.tycoonTraits?.founderTraitHook?.('contractTradeoff');
    if (dealMaker) {
      if (proj.isContract && dealMaker.contractMul && proj.payment) {
        proj.payment = Math.round(proj.payment * dealMaker.contractMul);
      } else if (!proj.isContract && dealMaker.ownIpMul) {
        proj.launchSales = Math.round(proj.launchSales * dealMaker.ownIpMul);
      }
    }

    // v10.2: Tail duration doubled — Math.max(4, round(user/10) × 2), cap 24.
    // Week 0 no longer pays in a lump; the first half of the tail spreads
    // the launch distribution with front-loaded weights (see weekRevenue()).
    const tailWeeksTotal = proj.isContract
      ? 0
      : Math.max(4, Math.min(24, Math.round((proj.userScore || 0) / 10) * 2));
    proj.tailSales = 0;
    proj.tailWeeksTotal = tailWeeksTotal;            // immutable — for graph projection
    proj.tailWeeksRemaining = tailWeeksTotal;        // decrements weekly (includes week 0)

    // Record total team salary accumulated across design + development +
    // polish so the breakeven math can include what the team actually
    // cost (salaryCost) on top of what was spent on marketing. Per-week
    // accumulation happens in onWeekTick.
    proj.salaryCost = Math.round(proj.salaryCost || 0);

    // Move from active to shipped
    S.projects.active = S.projects.active.filter(p => p.id !== proj.id);
    S.projects.shipped.push(proj);

    // Market heat bump (Phase 4B)
    if (typeof window._tycoonOnPlayerShip === 'function') {
      window._tycoonOnPlayerShip(proj);
    }

    // Macro event revenue modifier (Phase 3G)
    const macroMult = window.tycoonMacro?.revenueMultiplier?.(proj.type) || 1;

    // Revenue: contract payout (lump) or first distributed launch-week payout
    if (proj.isContract) {
      // v11.1: Alumni Network "Alumni in Every Camp" department node grants
      // a flat +15% on contract payouts when purchased.
      const alumniMul = window.tycoonSchool?.isPurchased?.('n_every_camp') ? 1.15 : 1;
      const paid = Math.round(proj.payment * macroMult * alumniMul);
      S.cash = (S.cash || 0) + paid;
      S.tRevenue = (S.tRevenue || 0) + paid;
      proj.actualPayment = paid;
      if (typeof window._tycoonRecordContractDelivery === 'function') {
        window._tycoonRecordContractDelivery(proj);
      }
    } else {
      // Pay the week-0 slice of the spread-out launch distribution only.
      // Subsequent weekly payouts run via the tail ticker in onWeekTick.
      const week0 = Math.round(weekRevenue(proj, 0) * macroMult);
      S.cash = (S.cash || 0) + week0;
      S.tRevenue = (S.tRevenue || 0) + week0;
      proj.actualLaunchSales = week0;  // just the week-0 payout; tail adds via tailSales
      proj.tailSales = week0;          // accumulated revenue starts with week 0
      proj.tailWeeksRemaining -= 1;    // week 0 already paid
    }

    // Phase 4F: attach generated review quotes
    if (window.tycoonReviews) {
      proj.reviews = window.tycoonReviews.generateReviews(proj, 3);
    }

    // v3 Phase 8: Newsletter endowment node adds a school-attributed bonus
    // review on every ship. Appended after normal reviews so it reads as a
    // separate voice.
    if ((S.school?.departments?.schoolLife || []).includes('sl_newsletter')) {
      const schoolName = S.school?.name || 'The Institute';
      const quote = proj.criticScore >= 85
        ? 'An alumnus making us all proud.'
        : proj.criticScore >= 60
        ? 'A solid contribution to the school\u2019s legacy.'
        : 'Everyone has a rough semester now and then.';
      if (!Array.isArray(proj.reviews)) proj.reviews = [];
      proj.reviews.push({
        stars: Math.max(1, Math.min(5, Math.round(proj.criticScore / 20))),
        quote: quote,
        source: schoolName + ' Alumni Newsletter',
        schoolSourced: true,
      });
    }

    // v3 roguelite: post-ship founder trait hooks.
    // Prestigious founder: flat fame bonus per ship.
    const prestige = window.tycoonTraits?.founderTraitHook?.('prestige');
    if (prestige?.fameBonus) {
      S.fame = (S.fame || 0) + prestige.fameBonus;
      S.tFame = (S.tFame || 0) + prestige.fameBonus;
    }
    // Imposter Syndrome: low-critic ships tank team morale.
    const imposter = window.tycoonTraits?.founderTraitHook?.('shipMoraleCritic');
    if (imposter && proj.criticScore < (imposter.threshold || 80)) {
      const delta = imposter.moraleDelta || -8;
      for (const e of (S.employees || [])) {
        e.morale = Math.max(0, (e.morale || 70) + delta);
      }
    }
    // v11.1: hit-project morale bump. Shipping a 90+ critic project bumps
    // every contributor's morale by +8 (balances the Imposter floor and
    // rewards high-quality work). +5 for 80-89 so a solid ship also helps.
    if (proj.criticScore >= 80) {
      const hitBonus = proj.criticScore >= 90 ? 8 : 5;
      const teamIds = Array.isArray(proj.team) ? proj.team : [];
      for (const empId of teamIds) {
        if (empId === 'founder' && S.founder) {
          S.founder.morale = Math.min(100, (S.founder.morale || 70) + hitBonus);
          continue;
        }
        const emp = (S.employees || []).find(e => e.id === empId);
        if (emp) emp.morale = Math.min(100, (emp.morale || 70) + hitBonus);
      }
      if (typeof log === 'function' && teamIds.length > 0) {
        log('\uD83C\uDF89 Team morale +' + hitBonus + ' — ' + proj.name + ' ' + (proj.criticScore >= 90 ? 'shipped a hit' : 'shipped solid') + ' (critic ' + proj.criticScore + ')');
      }
    }

    // v11.1: Record the shipped project-type on each team member so the
    // Veteran trait can later check "this is a type I've shipped before → +15%".
    if (Array.isArray(proj.team)) {
      for (const empId of proj.team) {
        if (empId === 'founder') continue;
        const emp = (S.employees || []).find(e => e.id === empId);
        if (!emp) continue;
        if (!Array.isArray(emp.shippedTypes)) emp.shippedTypes = [];
        if (!emp.shippedTypes.includes(proj.type)) emp.shippedTypes.push(proj.type);
      }
    }

    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🚀 Shipped: ' + proj.name + ' (critic ' + proj.criticScore + ')');
    return proj;
  }

  // ---------- Quality / review scoring ----------
  // Aggregates the 3 axes weighted by project type, applies bug/feature/luck modifiers.
  //
  // v10.1 rebalance — "100 should be basically impossible":
  //  A. Type-aware harsh caps: per-axis ceiling scales with how important the
  //     axis is for this project type. Primary axis × 80, secondary × 55,
  //     tertiary × 35. A game's design axis is dramatically harder to max
  //     than its polish axis.
  //  B. Tiered feature bonus: required features no longer bonus (they're
  //     baseline), optional features yield +3 / +2 / +1 / +0.5 / +0.5 in
  //     the order picked — max +7. Rewards 1-2 thoughtful picks, punishes
  //     feature-dumping.
  //  D. Bug floor enforced in shipProject (separate): ship bugs >= 1, so
  //     the penalty never goes to zero and 100 is blocked.
  //
  // Target distribution:
  //   50-65: solo / under-staffed / wrong-type shop
  //   65-80: solid team, right genre
  //   80-92: specialist studio, matched type, research, polish
  //   93-98: elite ship, every lever aligned + lucky roll
  //   99-100: unreachable (bug floor)
  function computeCriticScore(proj) {
    const typeDef = PROJECT_TYPES[proj.type];
    const w = typeDef.weights;
    const scope = SCOPES[proj.scope];
    const devW = scope.phaseWeeks.development;

    // Rank axes by weight for this type (primary, secondary, tertiary)
    const ranked = Object.entries(w).sort((a, b) => b[1] - a[1]);
    const primaryAxis = ranked[0][0], secondaryAxis = ranked[1][0], tertiaryAxis = ranked[2][0];
    const multFor = (axisName) =>
      axisName === primaryAxis   ? 80 :
      axisName === secondaryAxis ? 55 : 35;

    const capTech    = devW * multFor('tech');
    const capDesign  = devW * multFor('design');
    const capPolish  = devW * multFor('polish');

    // Square-root normalization — linear would mean a 4-person team (which
    // outputs 2.5× a solo founder) clamps at 100 if we tune the cap so solo
    // scores 50. Sqrt gives diminishing returns: 40% raw → 63%, 90% raw → 95%,
    // 100%+ → capped at 100. Solo hits ~50, team hits ~90 naturally.
    // This also bakes in "diminishing returns per employee" for free.
    const normalize = (v, cap) => {
      if (v <= 0) return 0;
      const ratio = Math.min(1, v / cap);
      return Math.sqrt(ratio) * 100;
    };
    const tech    = normalize(proj.quality.tech,    capTech);
    const design  = normalize(proj.quality.design,  capDesign);
    const polish  = normalize(proj.quality.polish,  capPolish);

    let weighted = (tech * w.tech + design * w.design + polish * w.polish);

    // Tiered feature bonus — optional features only, diminishing per pick
    const requiredSet = new Set(
      (window.tycoonContracts?.CONTRACT_SPECS?.[proj.type]?.requiredFeatures?.[proj.scope]) || []
    );
    const optionalCount = (proj.features || []).reduce(
      (n, id) => n + (requiredSet.has(id) ? 0 : (FEATURES_BY_ID[id] ? 1 : 0)), 0
    );
    const TIER_VALUES = [3, 2, 1, 0.5, 0.5];
    let featureBonus = 0;
    for (let i = 0; i < Math.min(optionalCount, TIER_VALUES.length); i++) {
      featureBonus += TIER_VALUES[i];
    }

    // Bug penalty (floor enforced at ship time — bugs >= 1 always)
    const bugPenalty = Math.min(30, proj.bugs * 1.0);
    // Random luck ±5
    const luck = (Math.random() - 0.5) * 10;
    let critic = Math.round(weighted + featureBonus - bugPenalty + luck);
    // v11.1: Coder Purist founder trait applies a critic adjustment based on
    // the project's primary axis — tech-primary gets +15%, design-primary
    // takes -10%. Polish-primary is neutral.
    const purist = window.tycoonTraits?.founderTraitHook?.('codePurist');
    if (purist) {
      if (primaryAxis === 'tech')   critic = Math.round(critic * (1 + (purist.techBonus || 0)));
      if (primaryAxis === 'design') critic = Math.round(critic * (1 - (purist.designPenalty || 0)));
    }
    critic = Math.max(1, Math.min(100, critic));

    // User score: weighted toward polish + bug sensitivity. Diverges from
    // critic enough to create the "cult hit" / "reviewer favorite" labels.
    const userRaw = (critic * 0.55) + (polish * 0.45) - (proj.bugs * 0.4);
    const user = Math.max(1, Math.min(100, Math.round(userRaw)));
    return { critic, user };
  }

  // ---------- Launch sales ----------
  // Phase 4C: includes platform phase multiplier and royalty cut.
  function computeLaunchSales(proj) {
    if (proj.isContract) return 0;
    const critic = proj.criticScore || 60;
    // v10.1: exponent gentled from 2.2 → 2.0 (high-critic scaling less extreme),
    // but prestige thresholds give dramatic jackpots for elite ships — hitting
    // 95+ multiplies the base by 10×, 98+ by 25×. Since 98+ requires the
    // perfect storm under the new scoring math, those jackpots are once-per-
    // career events, not routine.
    let base = Math.pow(Math.max(critic, 10) / 50, 2.0) * 100000;
    if (critic >= 98)      base *= 25;
    else if (critic >= 95) base *= 10;
    const scopeMul = proj.scope === 'small' ? 1 : proj.scope === 'medium' ? 2.5 : 6;
    // Marketing multiplier (Phase 4E: channel-based)
    let mktMul;
    if (window.tycoonMarketing && Array.isArray(proj.marketingChannels) && proj.marketingChannels.length > 0) {
      const r = window.tycoonMarketing.computeMarketingMultiplier(proj);
      mktMul = r.mult;
      proj.marketingBreakdown = r.breakdown;
      proj.marketingSynergies = r.synergies;
    } else {
      mktMul = 1 + ((proj.marketingSpend || 0) / 100000);
    }
    // Platform multiplier (includes phase × (1 - royaltyCut))
    let platformMul = 1;
    if (proj.platform && window.tycoonPlatforms) {
      const pm = window.tycoonPlatforms.launchMultiplier(proj.platform, S.calendar?.year);
      platformMul = pm.net;
      proj.platformPhaseMult = pm.phaseMult;
      proj.platformRoyaltyCut = pm.royaltyCut;
    }
    // Launch window (seasonal + collision — Phase 4D)
    let launchMul = 1;
    if (window.tycoonLaunch) {
      const lm = window.tycoonLaunch.totalLaunchMultiplier(proj);
      launchMul = lm.mult;
      proj.launchNotes = [
        ...(lm.season.labels.map(l => '🗓 ' + l)),
        ...lm.collision.notes
      ];
    }
    // v11.1 founder traits applied to launch sales
    let traitMul = 1;
    const shipYear = S.calendar?.year || 1980;
    // Trend Chaser — ship in the last N years of a project-type's era window
    const trend = window.tycoonTraits?.founderTraitHook?.('trendChaser');
    if (trend) {
      const typeDef = PROJECT_TYPES[proj.type];
      const eraEnd = typeDef.era[1];
      const windowYears = trend.eraEndWindowYears || 2;
      if (shipYear >= eraEnd - windowYears + 1 && shipYear <= eraEnd) {
        traitMul *= (trend.mul || 1);
        if (!proj.launchNotes) proj.launchNotes = [];
        proj.launchNotes.push('\u{1F4C8} Trend Chaser — shipping in the last ' + windowYears + ' years of the ' + typeDef.label + ' era');
      }
    }
    // Contrarian — project type has low market heat
    const contra = window.tycoonTraits?.founderTraitHook?.('contrarian');
    if (contra) {
      const heat = window.tycoonMarket?.heatForType?.(proj.type);
      if (typeof heat === 'number' && heat < 15) {
        traitMul *= (contra.mul || 1);
        if (!proj.launchNotes) proj.launchNotes = [];
        proj.launchNotes.push('\u{1F9ED} Contrarian — ' + proj.type + ' market was cold');
      }
    }
    return Math.round(base * scopeMul * mktMul * platformMul * launchMul * traitMul);
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
    if (!S.projects) return;
    if (Array.isArray(S.projects.active)) {
      for (const proj of [...S.projects.active]) {
        // v10.2: accumulate weekly team-salary cost for this project. Used
        // later by the breakeven line in the shipped-detail modal
        // (marketing spend + salary cost). Founder excluded (no salary).
        // Runs for every phase (design/development/polish) so the whole
        // duration counts, not just the phases that do quality work.
        if (Array.isArray(proj.team) && proj.team.length > 0) {
          let weeklyWage = 0;
          for (const id of proj.team) {
            if (id === 'founder') continue;
            const e = (S.employees || []).find(x => x.id === id);
            if (e && e.salary) weeklyWage += e.salary / 48;
          }
          if (weeklyWage > 0) proj.salaryCost = (proj.salaryCost || 0) + weeklyWage;
        }

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
    // v10.2: Sales tail — pay weekRevenue(proj, weekIndex) each tick for
    // shipped own-IP. weekIndex starts at 1 (week 0 was paid at ship).
    // The helper distributes the launch lump over the first half of the
    // tail and emits a flat rate for the second half.
    if (Array.isArray(S.projects.shipped)) {
      for (const proj of S.projects.shipped) {
        if (proj.isContract) continue;
        if (!proj.tailWeeksRemaining || proj.tailWeeksRemaining <= 0) continue;
        // weekIndex = total − remaining. Since we decremented on ship to
        // account for week 0, this starts at 1 on the first tick.
        const weekIndex = (proj.tailWeeksTotal || 0) - proj.tailWeeksRemaining;
        const weekly = weekRevenue(proj, weekIndex);
        if (weekly > 0) {
          S.cash = (S.cash || 0) + weekly;
          S.tRevenue = (S.tRevenue || 0) + weekly;
          proj.tailSales = (proj.tailSales || 0) + weekly;
        }
        proj.tailWeeksRemaining -= 1;
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
    // Helpers for UI
    avgTeamSpeed,
    applySpeedToDuration,
    // Scoring (exposed for testing)
    computeCriticScore,
    computeLaunchSales,
    weekRevenue,  // v10.2: per-week payout for shipped own-IP (used by sales graph)
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
    // v3 roguelite: attach passions + mechanical + narrative traits.
    // Default to rank 50 (bottom of class) per Q1b — first run starts
    // at the bottom. Phase 6 will replace this with class-roster picker.
    if (window.tycoonTraits?.augmentFounderWithTraits) {
      window.tycoonTraits.augmentFounderWithTraits(S.founder, 50, 50);
    }
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
