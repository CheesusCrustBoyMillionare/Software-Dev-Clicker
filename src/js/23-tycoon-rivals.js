// ========== TYCOON RIVAL STUDIOS (v2) ==========
// Phase 4A: Dynamic rival roster (3-10 studios), rival shipping + revenue,
// era-triggered spawns, bankruptcy exits. Research races still work.
// Full acquisitions UI in Phase 4I.
(function(){
  'use strict';

  // ---------- Starting rival catalog (1980 roster) ----------
  const STARTING_RIVALS = [
    {
      id: 'r_electrosoft',  name: 'Electrosoft',  icon: '🏢', focus: ['business','saas'],
      priorityNodes: ['n_databases','n_mouse_ui','n_object_oriented','n_tcp_ip','n_broadband','n_cloud_infra'],
      rpPerWeek: 3.5, startTier: 4, startRevenue: 2_000_000, startQuality: 72, spawnYear: 1980,
    },
    {
      id: 'r_zeromega',     name: 'Zeromega',     icon: '🕹️', focus: ['game'],
      priorityNodes: ['n_sound_chip','n_2d_sprites','n_256_color','n_cd_rom','n_3d_graphics','n_networking'],
      rpPerWeek: 4.0, startTier: 2, startRevenue: 300_000, startQuality: 70, spawnYear: 1980,
    },
    {
      id: 'r_telekrats',    name: 'Telekrats',    icon: '📡', focus: ['business','web'],
      priorityNodes: ['n_networking','n_tcp_ip','n_broadband'],
      rpPerWeek: 3.0, startTier: 3, startRevenue: 800_000, startQuality: 68, spawnYear: 1980,
    },
    {
      id: 'r_pictronix',    name: 'Pictronix',    icon: '🎨', focus: ['business'],
      priorityNodes: ['n_mouse_ui','n_256_color','n_cd_rom'],
      rpPerWeek: 3.2, startTier: 2, startRevenue: 400_000, startQuality: 75, spawnYear: 1980,
    },
    {
      id: 'r_delphi_labs',  name: 'Delphi Labs',  icon: '🔬', focus: ['business','ai'],
      priorityNodes: ['n_object_oriented','n_databases','n_ml_models','n_llm_research'],
      rpPerWeek: 3.8, startTier: 3, startRevenue: 600_000, startQuality: 78, spawnYear: 1980,
    },
  ];

  // ---------- Era-triggered rival spawns ----------
  const SPAWN_EVENTS = [
    { id:'r_nintendont',   name:"Nintendon't",   icon:'🎮', focus:['game'],        priorityNodes:['n_cd_rom','n_3d_graphics','n_touchscreen'], rpPerWeek:4.2, startTier:3, startRevenue:1_500_000, startQuality:82, spawnYear:1993 },
    { id:'r_yaboo',        name:'Yaboo!',        icon:'🌐', focus:['web'],         priorityNodes:['n_tcp_ip','n_broadband','n_social_graph'], rpPerWeek:4.5, startTier:1, startRevenue:100_000,   startQuality:68, spawnYear:1995 },
    { id:'r_gargoyle',     name:'Gargoyle',      icon:'🔍', focus:['web','saas'],  priorityNodes:['n_databases','n_broadband','n_cloud_infra','n_ml_models'], rpPerWeek:5.0, startTier:1, startRevenue:200_000, startQuality:76, spawnYear:2000 },
    { id:'r_applepie',     name:'ApplePie Inc.', icon:'📱', focus:['mobile'],       priorityNodes:['n_touchscreen','n_mobile_os','n_cloud_infra'], rpPerWeek:4.8, startTier:4, startRevenue:5_000_000, startQuality:85, spawnYear:2008 },
    { id:'r_fadebook',     name:'Fadebook',      icon:'👤', focus:['web','mobile'],priorityNodes:['n_social_graph','n_cloud_infra','n_ml_models'], rpPerWeek:4.2, startTier:2, startRevenue:1_000_000, startQuality:72, spawnYear:2010 },
    { id:'r_cloudshove',   name:'CloudShove',    icon:'☁️', focus:['saas'],         priorityNodes:['n_cloud_infra','n_ml_models'], rpPerWeek:4.0, startTier:3, startRevenue:800_000, startQuality:74, spawnYear:2015 },
    { id:'r_omniai',       name:'OmniAI',        icon:'🤖', focus:['ai'],           priorityNodes:['n_ml_models','n_llm_research'], rpPerWeek:5.5, startTier:2, startRevenue:500_000, startQuality:80, spawnYear:2022 },
  ];

  // ---------- Project name templates for rival games ----------
  // Procedural generator; grows with era
  const RIVAL_PROJECT_NAMES = {
    game:     ['Starstrike','Dragon Sword','Kart Rally','Pinball Legend','Quest Master','Defenders','Warpath','Cyberspace','Arcane Blade','MegaBlast','Rocket Jump','Dungeon Delve','Galaxy Wars'],
    business: ['OfficePro','Ledger Plus','DataMaster','ReportEngine','InvoicePro','WordSmart','CalcPro','SalesForce Suite','TrackIt','PayrollPro','InventoryManager'],
    web:      ['Portal Pro','NetDesk','Webstream','ContentHub','MetaSearch','LinkIt','Connector','Community+','Discovery'],
    mobile:   ['TouchBlast','Snap','Taptap','PocketDrive','Yapper','PikMe','Zippr','Tapzilla','WaveTap'],
    saas:     ['CloudSync','OpsFlow','DataPipe','TeamHub','Insights Pro','Stackr','WorkOS','Pulse','BaseCamp-X'],
    ai:       ['NeuroFlow','MindMerge','DataOracle','BrainTrust','ThinkChain','Reason','GenCore','AxisAI']
  };

  // ---------- State ----------
  function ensureState() {
    if (!S.rivalMeta) S.rivalMeta = { spawnedSet: {}, weeksSinceCheck: 0 };
    if (!S.rivalMeta.spawnedSet) S.rivalMeta.spawnedSet = {};
    if (!Array.isArray(S.rivals)) {
      S.rivals = STARTING_RIVALS.map(t => newRivalFromTemplate(t));
      for (const t of STARTING_RIVALS) S.rivalMeta.spawnedSet[t.id] = true;
    }
    if (!S.researchPioneers) S.researchPioneers = {};
    if (!S.rivalShippedTitles) S.rivalShippedTitles = [];
  }

  function newRivalFromTemplate(t) {
    // v3 Phase 9: rival scaling. Each run, rivals start progressively more
    // developed as if in-universe time passed while the next classmate was
    // admitted. Offset = min(5, floor(runNumber/3)). Bumps starting tier,
    // revenue, team size, quality, and pre-completes some research from
    // their priority list.
    const offset = Math.max(0, Math.min(5, Math.floor((S.school?.currentRunNumber || 1) / 3)));
    const baseTier = t.startTier || 2;
    const tier = Math.min(5, baseTier + offset);
    const baseRev = t.startRevenue || 200_000;
    const revenue = Math.round(baseRev * (1 + offset * 0.3));
    const quality = Math.min(95, (t.startQuality || 70) + offset * 3);
    const teamSize = Math.round(tier * 12);
    const preCompleted = (t.priorityNodes || []).slice(0, offset);

    return {
      id: t.id, name: t.name, icon: t.icon, focus: t.focus,
      priorityNodes: t.priorityNodes, rpPerWeek: t.rpPerWeek,
      // Research state — rivals may already have knocked out some priority
      // nodes before the player's run begins.
      completedResearch: preCompleted.slice(),
      inProgress: null,
      // Business state, scaled by offset
      tier,
      revenue,
      annualRevHistory: [],
      teamSize,
      quality,
      trajectory: offset * 0.05,  // higher baseline growth at later runs
      marketShare: 0,
      nextProject: null,
      shippedCount: offset,   // more-mature rivals have ship counts on arrival
      // Lifecycle
      status: 'active',
      weeksOfDecline: 0,
      // Audit trail for debug
      spawnedWithOffset: offset,
    };
  }

  function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ---------- Rival project shipping ----------
  // Each rival picks a project in a focus genre, develops it for ~12 weeks,
  // then "ships" it. Sales roll around their quality rating ± variance.
  function scheduleNextProject(rival) {
    // Pick a focus that's era-available
    const year = S.calendar?.year || 1980;
    const validFocus = rival.focus.filter(t => window.isProjectTypeAvailable?.(t, year));
    if (validFocus.length === 0) return;
    const type = randPick(validFocus);
    const names = RIVAL_PROJECT_NAMES[type] || ['Untitled'];
    const name = randPick(names) + ' ' + (rival.shippedCount + 1);
    const startWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    // Duration scales with tier — bigger studios ship bigger titles
    const duration = 12 + rival.tier * 4 + Math.floor(Math.random() * 6);
    rival.nextProject = {
      name, type, startedAtWeek: startWeek,
      duration,
      releaseAtWeek: startWeek + duration,
    };
  }

  function shipRivalProject(rival) {
    const p = rival.nextProject;
    if (!p) return;
    const year = S.calendar?.year || 1980;
    // Critic score rolled around quality
    const critic = Math.max(30, Math.min(99, Math.round(rival.quality + (Math.random() - 0.5) * 30)));
    // Sales formula (simplified): tier × 100K × (critic/50)^2 × macro multiplier
    const macroMult = window.tycoonMacro?.revenueMultiplier?.(p.type) || 1;
    const sales = Math.round((rival.tier * 100_000) * Math.pow(critic / 50, 2.0) * macroMult);
    // Update rival finances
    rival.revenue += sales;
    rival.shippedCount += 1;
    S.rivalShippedTitles.push({
      rivalId: rival.id, rivalName: rival.name, rivalIcon: rival.icon,
      title: p.name, type: p.type, critic, sales, year, month: S.calendar?.month || 1
    });
    // Post-ship: quality drifts slightly with hit/miss
    if (critic >= 85) rival.quality = Math.min(95, rival.quality + 1);
    if (critic <= 55) rival.quality = Math.max(50, rival.quality - 1);
    // Event log
    if (typeof log === 'function') log('🚀 ' + rival.icon + ' ' + rival.name + ' shipped ' + p.name + ' (critic ' + critic + ')');
    document.dispatchEvent(new CustomEvent('tycoon:rival-shipped', {
      detail: { rivalId: rival.id, title: p.name, critic, sales, type: p.type }
    }));
    rival.nextProject = null;
    // Queue next project after a short delay (1-4 weeks)
    rival.nextWeekToSchedule = (window.tycoonProjects?.absoluteWeek?.() || 0) + 1 + Math.floor(Math.random() * 3);
  }

  // ---------- Spawn / exit events ----------
  function checkSpawns() {
    ensureState();
    const year = S.calendar?.year || 1980;
    for (const spawn of SPAWN_EVENTS) {
      if (S.rivalMeta.spawnedSet[spawn.id]) continue;
      if (year >= spawn.spawnYear) {
        const newRival = newRivalFromTemplate(spawn);
        S.rivals.push(newRival);
        S.rivalMeta.spawnedSet[spawn.id] = true;
        if (typeof log === 'function') log('🆕 ' + spawn.icon + ' ' + spawn.name + ' founded — new rival on the market');
        document.dispatchEvent(new CustomEvent('tycoon:rival-spawned', {
          detail: { rivalId: spawn.id }
        }));
      }
    }
  }

  // Quarterly: update tier/revenue trajectory, check for bankruptcy
  function quarterlyUpdate() {
    ensureState();
    for (const rival of S.rivals) {
      if (rival.status !== 'active') continue;
      // Track recent revenue
      rival.annualRevHistory.push(rival.revenue);
      if (rival.annualRevHistory.length > 4) rival.annualRevHistory.shift();
      // Compute trajectory (naive: newest minus oldest)
      if (rival.annualRevHistory.length >= 2) {
        const oldest = rival.annualRevHistory[0];
        const newest = rival.annualRevHistory[rival.annualRevHistory.length - 1];
        rival.trajectory = oldest > 0 ? (newest - oldest) / oldest : 0;
      }
      // Revenue decays slowly (costs of staying in business) but grows from ships
      rival.revenue = Math.round(rival.revenue * 0.96);
      // Tier shifts based on revenue brackets
      rival.tier = tierForRevenue(rival.revenue);
      // Bankruptcy check: tier ≤ 1 + declining trajectory for 3+ quarters
      if (rival.tier <= 1 && rival.trajectory < -0.2) {
        rival.weeksOfDecline = (rival.weeksOfDecline || 0) + 12;
        if (rival.weeksOfDecline >= 36) {
          rival.status = 'bankrupt';
          if (typeof log === 'function') log('💀 ' + rival.icon + ' ' + rival.name + ' has gone bankrupt and closed its doors');
          document.dispatchEvent(new CustomEvent('tycoon:rival-bankrupt', { detail: { rivalId: rival.id } }));
        }
      } else {
        rival.weeksOfDecline = 0;
      }
    }
    // Prune bankrupt rivals after a year so UI doesn't clutter
    // (keep their shipped catalog via S.rivalShippedTitles)
  }

  function tierForRevenue(rev) {
    if (rev < 500_000) return 1;
    if (rev < 5_000_000) return 2;
    if (rev < 50_000_000) return 3;
    if (rev < 500_000_000) return 4;
    if (rev < 5_000_000_000) return 5;
    if (rev < 50_000_000_000) return 6;
    return 7;
  }

  // ---------- Weekly tick ----------
  let _weekCounter = 0;
  function onWeekTick() {
    ensureState();
    // Check spawns on every week — cheap enough
    checkSpawns();

    const year = S.calendar?.year || 1980;
    for (const rival of S.rivals) {
      if (rival.status !== 'active') continue;
      // Defensive guard: rivals injected from outside this module (e.g.,
      // school/famous-alumni rivals) may arrive missing optional fields.
      // Skip gracefully rather than throw — a crash here kills the whole
      // weekly tick for every module that runs after us.
      if (!Array.isArray(rival.priorityNodes) || !Array.isArray(rival.completedResearch)) continue;

      // --- Research progress ---
      if (!rival.inProgress) {
        const nextNode = rival.priorityNodes.find(id => {
          if (rival.completedResearch.includes(id)) return false;
          const node = window.tycoonResearch?.NODE_BY_ID?.[id];
          if (!node) return false;
          if (year < node.era) return false;
          for (const p of (node.prereqs || [])) {
            if (!rival.completedResearch.includes(p)) return false;
          }
          return true;
        });
        if (nextNode) rival.inProgress = { nodeId: nextNode, rpEarned: 0 };
      }
      if (rival.inProgress) {
        rival.inProgress.rpEarned += rival.rpPerWeek;
        const node = window.tycoonResearch?.NODE_BY_ID?.[rival.inProgress.nodeId];
        if (node && rival.inProgress.rpEarned >= node.rpCost) {
          const completedId = rival.inProgress.nodeId;
          rival.completedResearch.push(completedId);
          rival.inProgress = null;
          // Pioneer tracking
          const playerCompleted = (S.research?.completed || []).includes(completedId);
          if (!S.researchPioneers[completedId]) {
            S.researchPioneers[completedId] = playerCompleted ? 'player' : rival.id;
          }
          if (typeof log === 'function') log('🔬 ' + rival.icon + ' ' + rival.name + ' completed research: ' + node.name);
          document.dispatchEvent(new CustomEvent('tycoon:rival-research-completed', {
            detail: { rivalId: rival.id, nodeId: completedId }
          }));
        }
      }

      // --- Project pipeline ---
      if (!rival.nextProject && (rival.nextWeekToSchedule || 0) <= (window.tycoonProjects?.absoluteWeek?.() || 0)) {
        scheduleNextProject(rival);
      }
      if (rival.nextProject) {
        const curWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
        if (curWeek >= rival.nextProject.releaseAtWeek) {
          shipRivalProject(rival);
        }
      }
    }

    // --- Quarterly business updates ---
    _weekCounter += 1;
    if (_weekCounter >= 12) {
      _weekCounter = 0;
      quarterlyUpdate();
    }

    if (typeof markDirty === 'function') markDirty();
  }

  // ---------- Pioneer listener (player completes research) ----------
  document.addEventListener('tycoon:research-completed', (e) => {
    ensureState();
    const nodeId = e.detail.nodeId;
    if (!S.researchPioneers[nodeId]) {
      S.researchPioneers[nodeId] = 'player';
      if (typeof log === 'function') {
        const node = window.tycoonResearch?.NODE_BY_ID?.[nodeId];
        if (node) log('🏆 Pioneer: first to complete ' + node.name + '!');
      }
    }
  });

  // ---------- Query helpers ----------
  function isPlayerPioneer(nodeId) {
    ensureState();
    return S.researchPioneers[nodeId] === 'player';
  }
  function isPlayerFastFollower(nodeId) {
    ensureState();
    return S.researchPioneers[nodeId] &&
           S.researchPioneers[nodeId] !== 'player' &&
           (S.research?.completed || []).includes(nodeId);
  }
  function rivalResearchProgress(rivalId, nodeId) {
    ensureState();
    const r = S.rivals?.find(x => x.id === rivalId);
    if (!r || r.status !== 'active') return null;
    if (r.completedResearch.includes(nodeId)) return { status: 'done' };
    if (r.inProgress?.nodeId === nodeId) {
      const node = window.tycoonResearch?.NODE_BY_ID?.[nodeId];
      return {
        status: 'in_progress',
        pct: node ? Math.round((r.inProgress.rpEarned / node.rpCost) * 100) : 0
      };
    }
    return { status: 'pending' };
  }

  // ---------- Acquisitions (Phase 4I) ----------
  // Cost = 4× rival's annual revenue (simplified; full negotiation in later phases)
  function acquisitionCost(rivalId) {
    const r = S.rivals?.find(x => x.id === rivalId);
    if (!r) return null;
    return Math.round(r.revenue * 4);
  }

  function canAcquire(rivalId) {
    ensureState();
    const r = S.rivals?.find(x => x.id === rivalId);
    if (!r) return { ok: false, reason: 'Rival not found' };
    if (r.status !== 'active') return { ok: false, reason: 'Already inactive' };
    if (r.tier >= 6) return { ok: false, reason: 'Too big to acquire (tier ' + r.tier + ')' };
    // Player must have enough cash
    const cost = acquisitionCost(rivalId);
    if ((S.cash || 0) < cost) return { ok: false, reason: 'Need ' + cost.toLocaleString() + ' cash' };
    return { ok: true, cost };
  }

  function acquireRival(rivalId) {
    const check = canAcquire(rivalId);
    if (!check.ok) return { ok: false, error: check.reason };
    const r = S.rivals.find(x => x.id === rivalId);
    const cost = check.cost;
    // Deduct cash
    S.cash -= cost;
    S.tExpenses = (S.tExpenses || 0) + cost;
    // Change status
    r.status = 'acquired';
    r.acquiredAtWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    // Inherit Fame (small boost based on their quality × shippedCount)
    const fameGain = Math.round(Math.min(40, (r.quality * r.shippedCount) / 20));
    S.fame = (S.fame || 0) + fameGain;
    S.tFame = (S.tFame || 0) + fameGain;
    // Mark their shipped titles as acquired by the player
    if (Array.isArray(S.rivalShippedTitles)) {
      for (const t of S.rivalShippedTitles) {
        if (t.rivalId === rivalId) t.acquiredByPlayer = true;
      }
    }
    // Spawn 2-3 engineers from their team (adds to Hiring Fair queue as "Ex-RivalName" candidates)
    // Phase 4I: simplified — just 2 engineers, direct hire (bypass interview)
    if (window.tycoonEmployees) {
      ensureState();
      if (!S.hiring) S.hiring = { queue: [], fairIndex: 0 };
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const c = window.tycoonEmployees.generateCandidate({ tier: Math.min(4, r.tier) });
        c.interviewed = true;
        c.stats = c.hiddenStats;
        c.traits = [c.visibleTrait, c.hiddenTrait].filter(Boolean);
        c.personality = c.hiddenPersonality;
        c.name = 'Ex-' + r.name + ': ' + c.name;
        c.expiresAtWeek = (window.tycoonProjects?.absoluteWeek?.() || 0) + 24; // longer-lived
        S.hiring.queue.push(c);
      }
    }
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('💼 Acquired ' + r.icon + ' ' + r.name + ' for ' + cost.toLocaleString() + ' — +' + fameGain + ' Fame, ex-engineers added to hiring queue');
    document.dispatchEvent(new CustomEvent('tycoon:rival-acquired', { detail: { rivalId, cost, fameGain } }));
    return { ok: true, cost, fameGain, rivalName: r.name };
  }

  function upcomingRivalReleases(maxCount) {
    ensureState();
    maxCount = maxCount || 6;
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const out = [];
    for (const r of S.rivals) {
      if (r.status !== 'active') continue;
      if (r.nextProject) {
        const weeksUntil = r.nextProject.releaseAtWeek - currentWeek;
        if (weeksUntil >= 0) {
          out.push({
            rivalId: r.id, rivalName: r.name, rivalIcon: r.icon,
            title: r.nextProject.name, type: r.nextProject.type,
            weeksUntil
          });
        }
      }
    }
    out.sort((a, b) => a.weeksUntil - b.weeksUntil);
    return out.slice(0, maxCount);
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startRivalsTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[rivals] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopRivalsTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonRivals = {
    STARTING_RIVALS,
    SPAWN_EVENTS,
    isPlayerPioneer,
    isPlayerFastFollower,
    rivalResearchProgress,
    upcomingRivalReleases,
    acquisitionCost,
    canAcquire,
    acquire: acquireRival,
    startTick: startRivalsTick,
    stopTick: stopRivalsTick,
    state() {
      ensureState();
      return {
        rivals: S.rivals.filter(r => r.status === 'active').map(r => ({
          name: r.name, icon: r.icon, tier: r.tier, revenue: r.revenue,
          quality: r.quality, shipped: r.shippedCount, status: r.status,
          researching: r.inProgress ? window.tycoonResearch?.NODE_BY_ID?.[r.inProgress.nodeId]?.name : null,
          nextRelease: r.nextProject ? r.nextProject.name + ' (in ' + Math.max(0, r.nextProject.releaseAtWeek - (window.tycoonProjects?.absoluteWeek?.() || 0)) + ' wks)' : null
        })),
        pioneers: Object.keys(S.researchPioneers || {}).length,
        lifetimeShipped: S.rivalShippedTitles?.length || 0,
        recentRivalReleases: (S.rivalShippedTitles || []).slice(-5).map(t =>
          t.rivalIcon + ' ' + t.rivalName + ' — ' + t.title + ' (' + t.critic + ')')
      };
    }
  };
  if (window.dbg) window.dbg.rivals = window.tycoonRivals;

  console.log('[tycoon-rivals] module loaded. ' + STARTING_RIVALS.length + ' starting rivals, ' + SPAWN_EVENTS.length + ' scheduled spawns.');
})();
