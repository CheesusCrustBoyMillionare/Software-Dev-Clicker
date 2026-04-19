// ========== TYCOON RESEARCH TREE (v2) ==========
// Phase 3C: Research node catalog + lifecycle (assign engineer → accumulate RP → complete).
// Phase 3D adds hardware prereqs; Phase 3E adds UI; Phase 3G adds rival races.
// This phase: 20 nodes spanning 1980-2024, one active research at a time.
(function(){
  'use strict';

  // ---------- Node catalog (20 nodes) ----------
  // category: 'tech' | 'genre' | 'efficiency' | 'platform' | 'business'
  // era: earliest year available
  // obsoletes: year when node becomes less useful (display only in Phase 3C)
  // rpCost: Research Points needed to complete
  // prereqs: array of node IDs that must be completed first
  // hardware: hardware ID required (Phase 3D — not enforced yet)
  // effect: { type, payload } — applied on completion
  const RESEARCH_NODES = [
    // ============ Era 1: Early PC (1980-84) ============
    { id:'n_2d_sprites',    name:'2D Sprite Graphics',     category:'tech',    era:1980, obsoletes:2015, rpCost:40,
      prereqs:[], effect:{ type:'quality_bonus', axis:'design', types:['game'], mult:1.1 },
      desc:'Animated bitmap sprites — standard for home computer games.' },
    { id:'n_text_parser',   name:'Text Parser',            category:'tech',    era:1980, obsoletes:1992, rpCost:30,
      prereqs:[], effect:{ type:'quality_bonus', axis:'design', types:['game','business'], mult:1.08 },
      desc:'Adventure-style natural language input.' },
    { id:'n_sound_chip',    name:'Sound Chip Programming', category:'tech',    era:1981, obsoletes:1995, rpCost:50,
      prereqs:[], effect:{ type:'quality_bonus', axis:'design', types:['game'], mult:1.12 },
      desc:'Chiptune programming on SID / AY-3 chips.' },

    // ============ Era 2: PC Growth (1985-89) ============
    { id:'n_mouse_ui',      name:'Mouse UI Design',        category:'tech',    era:1985, obsoletes:null, rpCost:80,
      prereqs:['n_2d_sprites'], effect:{ type:'quality_bonus', axis:'design', types:['business','game'], mult:1.15 },
      desc:'Graphical, mouse-driven interfaces replace command lines.' },
    { id:'n_scsi_storage',  name:'SCSI Storage Pipeline',  category:'efficiency', era:1987, obsoletes:2000, rpCost:60,
      prereqs:[], effect:{ type:'dev_speed', mult:1.05 },
      desc:'Faster asset loading during development.' },

    // ============ Era 3: PC Golden Age (1990-94) ============
    { id:'n_cd_rom',        name:'CD-ROM Mastering',       category:'tech',    era:1991, obsoletes:2005, rpCost:100,
      prereqs:['n_2d_sprites'], effect:{ type:'quality_bonus', axis:'design', types:['game','business'], mult:1.12 },
      desc:'Larger scope via CD distribution — 650MB of freedom.' },
    { id:'n_256_color',     name:'256-Color Graphics',     category:'tech',    era:1990, obsoletes:2002, rpCost:90,
      prereqs:['n_2d_sprites'], effect:{ type:'quality_bonus', axis:'design', types:['game'], mult:1.15 },
      desc:'VGA-era color depth — huge visual leap.' },
    { id:'n_networking',    name:'LAN Networking',         category:'tech',    era:1992, obsoletes:null, rpCost:120,
      prereqs:[], effect:{ type:'unlock_feature', feature:'f_mp' },
      desc:'Serial + IPX networking — enables multiplayer.' },
    { id:'n_object_oriented', name:'OOP Methodology',      category:'efficiency', era:1993, obsoletes:null, rpCost:100,
      prereqs:[], effect:{ type:'team_productivity', mult:1.08 },
      desc:'C++, Smalltalk — team-wide code quality lift.' },

    // ============ Era 4: Internet (1995-99) ============
    { id:'n_3d_graphics',   name:'3D Graphics',            category:'tech',    era:1993, obsoletes:null, rpCost:250,
      prereqs:['n_cd_rom'], hardware:'h_sgi_workstation',
      effect:{ type:'quality_bonus', axis:'design', types:['game'], mult:1.25 },
      desc:'Polygonal 3D breaks out of flat-screen thinking.' },
    { id:'n_tcp_ip',        name:'TCP/IP Protocols',       category:'tech',    era:1995, obsoletes:null, rpCost:150,
      prereqs:['n_networking'], effect:{ type:'dev_speed_type', types:['web','saas'], mult:1.1 },
      desc:'The plumbing of the internet — essential web prereq.' },
    { id:'n_databases',     name:'Relational Databases',   category:'business', era:1995, obsoletes:null, rpCost:180,
      prereqs:[], effect:{ type:'quality_bonus', axis:'tech', types:['business','web','saas'], mult:1.12 },
      desc:'SQL, indexes, joins — durable data foundations.' },

    // ============ Era 5: Dot-com / Broadband (2000-07) ============
    { id:'n_broadband',     name:'Broadband Web Apps',     category:'tech',    era:2001, obsoletes:null, rpCost:200,
      prereqs:['n_tcp_ip'], effect:{ type:'quality_bonus', axis:'design', types:['web','saas'], mult:1.15 },
      desc:'Always-on pipes change UX expectations.' },
    { id:'n_mobile_os',     name:'Mobile OS Platform',     category:'platform', era:2006, obsoletes:null, rpCost:300,
      prereqs:[], effect:{ type:'unlock_early', projectType:'mobile' },
      desc:'Early smartphone OS dev — lets you target mobile one year sooner.' },
    { id:'n_agile',         name:'Agile Methodology',      category:'efficiency', era:2002, obsoletes:null, rpCost:150,
      prereqs:[], effect:{ type:'team_productivity', mult:1.1 },
      desc:'Sprints, retros, iterative delivery — real output lift.' },

    // ============ Era 6: Mobile / Cloud (2008-19) ============
    { id:'n_touchscreen',   name:'Touchscreen UX Patterns', category:'tech',   era:2008, obsoletes:null, rpCost:220,
      prereqs:['n_mobile_os'], effect:{ type:'quality_bonus', axis:'design', types:['mobile'], mult:1.2 },
      desc:'Swipes, pinches, gestures — mobile is its own medium.' },
    { id:'n_social_graph',  name:'Social Graph APIs',      category:'tech',    era:2009, obsoletes:null, rpCost:180,
      prereqs:['n_broadband'], effect:{ type:'unlock_feature', feature:'f_social' },
      desc:'Friend graphs via OAuth — viral loops unlocked.' },
    { id:'n_cloud_infra',   name:'Cloud Infrastructure',   category:'tech',    era:2010, obsoletes:null, rpCost:260,
      prereqs:['n_broadband'], hardware:'h_cloud_credits',
      effect:{ type:'quality_bonus', axis:'tech', types:['saas','ai'], mult:1.18 },
      desc:'AWS / Azure — scales without a data center.' },

    // ============ Era 7: AI (2020-24) ============
    { id:'n_ml_models',     name:'Machine Learning',       category:'tech',    era:2018, obsoletes:null, rpCost:350,
      prereqs:['n_cloud_infra'], effect:{ type:'quality_bonus', axis:'tech', types:['ai','saas'], mult:1.15 },
      desc:'Deep learning goes mainstream — classifiers, embeddings.' },
    { id:'n_llm_research',  name:'Large Language Models',  category:'tech',    era:2022, obsoletes:null, rpCost:500,
      prereqs:['n_ml_models'], hardware:'h_gpu_cluster',
      effect:{ type:'quality_bonus', axis:'design', types:['ai'], mult:1.35 },
      desc:'The ChatGPT moment — completely reshapes the AI product space.' },
  ];
  window.RESEARCH_NODES = RESEARCH_NODES;

  const NODE_BY_ID = Object.fromEntries(RESEARCH_NODES.map(n => [n.id, n]));

  // ---------- State init ----------
  function ensureState() {
    if (!S.research) {
      S.research = { completed: [], inProgress: null };
    }
  }

  // ---------- Node availability checks ----------
  function isNodeAvailable(nodeId) {
    ensureState();
    const node = NODE_BY_ID[nodeId];
    if (!node) return { ok: false, reason: 'Unknown node' };
    if (S.research.completed.includes(nodeId)) return { ok: false, reason: 'Already completed' };
    if (S.research.inProgress?.nodeId === nodeId) return { ok: false, reason: 'In progress' };
    // Era check
    const year = S.calendar?.year || 1980;
    if (year < node.era) return { ok: false, reason: 'Not yet discovered (needs ' + node.era + '+)' };
    // Prereq check
    for (const prereq of (node.prereqs || [])) {
      if (!S.research.completed.includes(prereq)) {
        const pname = NODE_BY_ID[prereq]?.name || prereq;
        return { ok: false, reason: 'Requires: ' + pname };
      }
    }
    // Hardware check (enforced in Phase 3D)
    if (node.hardware) {
      const hasHW = (S.hardware || []).includes(node.hardware);
      if (!hasHW) return { ok: false, reason: 'Hardware needed: ' + node.hardware };
    }
    return { ok: true };
  }

  // Which nodes are visible in the tree UI (available OR already done OR future-locked)
  function visibleNodes() {
    return RESEARCH_NODES.slice();
  }

  // ---------- Start / stop research ----------
  function startResearch(nodeId, engineerId) {
    ensureState();
    const check = isNodeAvailable(nodeId);
    if (!check.ok) return { ok: false, error: check.reason };
    if (S.research.inProgress) {
      return { ok: false, error: 'Already researching: ' + NODE_BY_ID[S.research.inProgress.nodeId]?.name };
    }
    // Engineer must exist (founder or hired)
    const eng = findEngineerOrFounder(engineerId);
    if (!eng) return { ok: false, error: 'Engineer not found' };
    S.research.inProgress = {
      nodeId,
      engineerId: eng.id || 'founder',
      rpEarned: 0,
      startedAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
    };
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') {
      const node = NODE_BY_ID[nodeId];
      log('🔬 Research started: ' + node.name + ' (' + node.rpCost + ' RP)');
    }
    document.dispatchEvent(new CustomEvent('tycoon:research-started', { detail: { nodeId } }));
    return { ok: true, progress: S.research.inProgress };
  }

  function stopResearch() {
    ensureState();
    if (!S.research.inProgress) return { ok: false, error: 'No research in progress' };
    const paused = { ...S.research.inProgress };
    S.research.inProgress = null;
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🔬 Research paused: ' + NODE_BY_ID[paused.nodeId]?.name);
    return { ok: true };
  }

  // ---------- Helpers ----------
  function findEngineerOrFounder(id) {
    if (!id || id === 'founder') return S.founder;
    return (S.employees || []).find(e => e.id === id);
  }

  // ---------- Tick: accumulate RP, complete nodes ----------
  function onWeekTick() {
    ensureState();
    const ip = S.research.inProgress;
    if (!ip) return;
    const node = NODE_BY_ID[ip.nodeId];
    if (!node) { S.research.inProgress = null; return; }
    const eng = findEngineerOrFounder(ip.engineerId);
    if (!eng) { S.research.inProgress = null; return; }
    // RP/week = engineer's Tech stat × some multiplier
    const rpPerWeek = (eng.stats?.tech || 3) * 1.2;
    ip.rpEarned += rpPerWeek;
    if (ip.rpEarned >= node.rpCost) {
      completeResearch(ip.nodeId);
    } else {
      if (typeof markDirty === 'function') markDirty();
    }
  }

  function completeResearch(nodeId) {
    ensureState();
    const node = NODE_BY_ID[nodeId];
    if (!node) return;
    if (!S.research.completed.includes(nodeId)) S.research.completed.push(nodeId);
    S.research.inProgress = null;
    // Apply effects
    applyNodeEffect(node);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('✅ Research complete: ' + node.name);
    document.dispatchEvent(new CustomEvent('tycoon:research-completed', { detail: { nodeId } }));
  }

  function applyNodeEffect(node) {
    const eff = node.effect;
    if (!eff) return;
    // All effects are lookups at production time — nothing persistent to apply now.
    // The completed[] list drives all bonus calculations via helper functions below.
  }

  // ---------- Query helpers (used by other modules to apply research bonuses) ----------
  function isCompleted(nodeId) {
    ensureState();
    return S.research.completed.includes(nodeId);
  }

  // Returns combined quality multiplier for a given axis + project type based on completed research
  function qualityMultiplierFor(axis, projectType) {
    ensureState();
    let mult = 1.0;
    for (const id of S.research.completed) {
      const node = NODE_BY_ID[id];
      if (!node || !node.effect) continue;
      if (node.effect.type !== 'quality_bonus') continue;
      if (node.effect.axis !== axis) continue;
      if (!node.effect.types.includes(projectType)) continue;
      mult *= node.effect.mult;
    }
    return mult;
  }

  // Team productivity multiplier (affects dev speed globally)
  function teamProductivityMultiplier() {
    ensureState();
    let mult = 1.0;
    for (const id of S.research.completed) {
      const node = NODE_BY_ID[id];
      if (node?.effect?.type === 'team_productivity') mult *= node.effect.mult;
    }
    return mult;
  }

  // Dev-speed multiplier for a specific project type
  function devSpeedMultiplierForType(projectType) {
    ensureState();
    let mult = 1.0;
    for (const id of S.research.completed) {
      const node = NODE_BY_ID[id];
      if (!node?.effect) continue;
      if (node.effect.type === 'dev_speed') mult *= node.effect.mult;
      if (node.effect.type === 'dev_speed_type' && node.effect.types?.includes(projectType)) {
        mult *= node.effect.mult;
      }
    }
    return mult;
  }

  // Whether a feature is unlocked by research (some features are research-gated)
  function isFeatureUnlockedByResearch(featureId) {
    ensureState();
    for (const id of S.research.completed) {
      const node = NODE_BY_ID[id];
      if (node?.effect?.type === 'unlock_feature' && node.effect.feature === featureId) return true;
    }
    return false;
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startResearchTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[research] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopResearchTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonResearch = {
    NODES: RESEARCH_NODES,
    NODE_BY_ID,
    isAvailable: isNodeAvailable,
    visibleNodes,
    start: startResearch,
    stop: stopResearch,
    complete: completeResearch,
    isCompleted,
    qualityMultiplierFor,
    teamProductivityMultiplier,
    devSpeedMultiplierForType,
    isFeatureUnlockedByResearch,
    startTick: startResearchTick,
    stopTick: stopResearchTick,
    state() {
      ensureState();
      const ip = S.research.inProgress;
      return {
        completed: S.research.completed,
        completedCount: S.research.completed.length + '/' + RESEARCH_NODES.length,
        inProgress: ip ? {
          nodeId: ip.nodeId,
          name: NODE_BY_ID[ip.nodeId]?.name,
          progress: ip.rpEarned.toFixed(1) + '/' + NODE_BY_ID[ip.nodeId]?.rpCost + ' RP'
        } : null
      };
    }
  };
  if (window.dbg) window.dbg.research = window.tycoonResearch;

  console.log('[tycoon-research] module loaded. ' + RESEARCH_NODES.length + ' nodes registered.');
})();
