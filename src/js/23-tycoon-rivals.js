// ========== TYCOON RIVAL STUDIOS (v2) ==========
// Phase 3G: 2 rival studios that research in background. Pioneer/Fast Follower
// bonuses apply to whoever completes a research node first. Full rival sim
// (roster churn, market dynamics) is Phase 4.
(function(){
  'use strict';

  // Starting rivals — named studios with distinct personalities
  const RIVAL_TEMPLATES = [
    {
      id: 'r_electrosoft',
      name: 'Electrosoft',
      icon: '🏢',
      focus: ['business', 'saas'],
      priorityNodes: ['n_databases', 'n_mouse_ui', 'n_object_oriented', 'n_tcp_ip', 'n_broadband', 'n_cloud_infra'],
      rpPerWeek: 3.5,  // Slow but steady researcher
    },
    {
      id: 'r_zeromega',
      name: 'Zeromega',
      icon: '🕹️',
      focus: ['game'],
      priorityNodes: ['n_sound_chip', 'n_2d_sprites', 'n_256_color', 'n_cd_rom', 'n_3d_graphics', 'n_networking'],
      rpPerWeek: 4.0,  // Slightly faster on game tech
    },
  ];

  // ---------- State ----------
  function ensureState() {
    if (!Array.isArray(S.rivals)) {
      S.rivals = RIVAL_TEMPLATES.map(template => ({
        id: template.id,
        name: template.name,
        icon: template.icon,
        focus: template.focus,
        priorityNodes: template.priorityNodes,
        rpPerWeek: template.rpPerWeek,
        completedResearch: [],
        inProgress: null,     // { nodeId, rpEarned }
      }));
    }
    if (!S.researchPioneers) S.researchPioneers = {}; // nodeId -> studioId (first to complete)
  }

  // ---------- Per-tick rival work ----------
  function onWeekTick() {
    ensureState();
    const year = S.calendar?.year || 1980;
    for (const rival of S.rivals) {
      if (!rival.inProgress) {
        // Pick next node from priority list
        const nextNode = rival.priorityNodes.find(id => {
          if (rival.completedResearch.includes(id)) return false;
          const node = window.tycoonResearch?.NODE_BY_ID?.[id];
          if (!node) return false;
          if (year < node.era) return false;  // not yet available for this era
          // Prereqs must be satisfied (from their OWN completed list)
          for (const p of (node.prereqs || [])) {
            if (!rival.completedResearch.includes(p)) return false;
          }
          return true;
        });
        if (!nextNode) continue;
        rival.inProgress = { nodeId: nextNode, rpEarned: 0 };
      }
      // Accumulate RP
      rival.inProgress.rpEarned += rival.rpPerWeek;
      const node = window.tycoonResearch?.NODE_BY_ID?.[rival.inProgress.nodeId];
      if (node && rival.inProgress.rpEarned >= node.rpCost) {
        const completedId = rival.inProgress.nodeId;
        rival.completedResearch.push(completedId);
        rival.inProgress = null;
        // Check if we're the Pioneer (first to complete across all studios + player)
        const playerCompleted = (S.research?.completed || []).includes(completedId);
        if (!S.researchPioneers[completedId]) {
          if (playerCompleted) {
            S.researchPioneers[completedId] = 'player';
          } else {
            S.researchPioneers[completedId] = rival.id;
          }
        }
        if (typeof markDirty === 'function') markDirty();
        if (typeof log === 'function') log('🔬 ' + rival.icon + ' ' + rival.name + ' completed research: ' + node.name);
        document.dispatchEvent(new CustomEvent('tycoon:rival-research-completed', {
          detail: { rivalId: rival.id, nodeId: completedId }
        }));
      }
    }
  }

  // ---------- Hook into player research ----------
  // When player completes research, check if they're the Pioneer
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
    return S.researchPioneers[nodeId] && S.researchPioneers[nodeId] !== 'player' &&
           (S.research?.completed || []).includes(nodeId);
  }

  function rivalResearchProgress(rivalId, nodeId) {
    ensureState();
    const rival = S.rivals?.find(r => r.id === rivalId);
    if (!rival) return null;
    if (rival.completedResearch.includes(nodeId)) return { status: 'done' };
    if (rival.inProgress?.nodeId === nodeId) {
      const node = window.tycoonResearch?.NODE_BY_ID?.[nodeId];
      return {
        status: 'in_progress',
        rpEarned: rival.inProgress.rpEarned,
        rpCost: node?.rpCost || 0,
        pct: node ? Math.round((rival.inProgress.rpEarned / node.rpCost) * 100) : 0
      };
    }
    return { status: 'pending' };
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
    TEMPLATES: RIVAL_TEMPLATES,
    isPlayerPioneer,
    isPlayerFastFollower,
    rivalResearchProgress,
    startTick: startRivalsTick,
    stopTick: stopRivalsTick,
    state() {
      ensureState();
      return {
        rivals: S.rivals.map(r => ({
          name: r.name,
          icon: r.icon,
          completedCount: r.completedResearch.length,
          inProgress: r.inProgress ? {
            nodeId: r.inProgress.nodeId,
            rpEarned: r.inProgress.rpEarned.toFixed(1),
            node: window.tycoonResearch?.NODE_BY_ID?.[r.inProgress.nodeId]?.name
          } : null
        })),
        pioneers: S.researchPioneers
      };
    }
  };
  if (window.dbg) window.dbg.rivals = window.tycoonRivals;

  console.log('[tycoon-rivals] module loaded. ' + RIVAL_TEMPLATES.length + ' rival studios.');
})();
