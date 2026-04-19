// ========== TYCOON CONTRACTS (v2) ==========
// Phase 1E: contract offer queue. Clients send briefs every ~8 game-weeks.
// Accepting a contract creates a project with isContract:true, payment on delivery.
// Fuller client-tier system (Enterprise → Tech Giant → Government) in Phase 2.
(function(){
  'use strict';

  // ---------- Client name pool ----------
  // Era-flavored (1980s-early-90s, since Phase 1 starts in 1980)
  const CLIENT_NAMES = [
    'Compute Inc', 'DataSys Corp', 'Ledger Labs', 'Acme Publishing',
    'Midwest Industrial', 'BBS Systems', 'Pinnacle Software', 'Reliable Tech',
    'First National Database', 'Quantum Labs', 'Pioneer Press', 'Metro Cable Co',
    'Sunrise Accounting', 'Prestige Retail', 'BlueCollar Tools',
    'Granite State Banking', 'Tri-State Logistics', 'Widget Works Ltd',
    'Evergreen Publishing', 'Paramount Services', 'Copperfield Insurance',
    'Standard Inventory Co', 'Velocity Sales', 'Hamilton Manufacturing',
    'Sierra Hardware', 'Clearwater Realty', 'Mercury Shipping'
  ];

  // ---------- Project name templates per project type ----------
  const PROJECT_NAME_TEMPLATES = {
    business: [
      'Payroll Calculator', 'Inventory Tracker', 'Mailing List Manager',
      'Budget Planner', 'Time Tracker', 'Customer Database', 'Tax Prep Helper',
      'Invoice Generator', 'Financial Reports', 'Shipping Label Printer',
      'Ledger Manager', 'Order Entry System', 'Schedule Organizer',
      'Contact Directory', 'Expense Tracker', 'Sales Dashboard',
      'Document Archive', 'Warehouse Manager', 'Quote Generator'
    ],
    game: [
      'Maze Runner', 'Space Blaster', 'Word Challenge', 'Trivia Quest',
      'Block Puzzler', 'Math Drill', 'Typing Tutor', 'Educational Adventure',
      'Office Bowling', 'Card Shark', 'Number Cruncher', 'Memory Master',
      'Calendar Crisis', 'Conference Room Defender', 'Break Room Brawler'
    ]
  };

  // ---------- Client tiers (ECON-6b) ----------
  // Unlock chain: Small Biz → Enterprise → Tech Giant → Government
  const CLIENT_TIERS = {
    small_biz: {
      id: 'small_biz',
      label: 'Small Biz',
      icon: '🏪',
      payMult: 1.0,
      unlockedFromStart: true,
      gate: null,
      // Drop if avg falls below this (tier stops offering)
      minAvg: 2.5,
    },
    enterprise: {
      id: 'enterprise',
      label: 'Enterprise',
      icon: '🏢',
      payMult: 5.0,                  // 5× small biz pay
      unlockedFromStart: false,
      gate: { tier: 'small_biz', minAvg: 3.5, minDeliveries: 3 },
      minAvg: 3.0,
    },
    tech_giant: {
      id: 'tech_giant',
      label: 'Tech Giant',
      icon: '🏛️',
      payMult: 20.0,                 // 20× small biz pay
      unlockedFromStart: false,
      gate: { tier: 'enterprise', minAvg: 4.0, minDeliveries: 3 },
      minAvg: 3.5,
    },
    government: {
      id: 'government',
      label: 'Government',
      icon: '🏛',
      payMult: 80.0,                 // 80× small biz pay
      unlockedFromStart: false,
      gate: { tier: 'enterprise', minAvg: 4.0, minDeliveries: 5, minFame: 100 },
      minAvg: 3.5,
    },
  };
  window.CLIENT_TIERS = CLIENT_TIERS;

  // ---------- Contract specifications per project type ----------
  // Era-gated: contracts for a type only appear once type is available.
  const CONTRACT_SPECS = {
    business: {
      scopes: ['small'],
      requiredFeatures: { small: ['f_save', 'f_print'] },
      suggestedFeatures: { small: ['f_import', 'f_reports', 'f_templates', 'f_help'] },
      paymentRange: { small: [12000, 28000] },
      deadlineMult: 1.4,
      tierWeights: { small_biz: 1.0, enterprise: 1.3, tech_giant: 1.5, government: 2.0 }
    },
    game: {
      scopes: ['small'],
      requiredFeatures: { small: ['f_save'] },
      suggestedFeatures: { small: ['f_sound', 'f_diff', 'f_tutorial', 'f_ach', 'f_help'] },
      paymentRange: { small: [8000, 22000] },
      deadlineMult: 1.5,
      tierWeights: { small_biz: 0.3, enterprise: 0.4, tech_giant: 0.6, government: 0.2 }
    },
    web: {
      scopes: ['small'],
      requiredFeatures: { small: ['f_auth'] },
      suggestedFeatures: { small: ['f_email', 'f_search', 'f_admin', 'f_responsive', 'f_help'] },
      paymentRange: { small: [15000, 35000] },
      deadlineMult: 1.3,
      tierWeights: { small_biz: 0.7, enterprise: 1.4, tech_giant: 1.8, government: 1.5 }
    },
    mobile: {
      scopes: ['small'],
      requiredFeatures: { small: ['f_onboard'] },
      suggestedFeatures: { small: ['f_push', 'f_iap', 'f_social', 'f_ach', 'f_camera'] },
      paymentRange: { small: [14000, 32000] },
      deadlineMult: 1.3,
      tierWeights: { small_biz: 0.4, enterprise: 0.8, tech_giant: 1.5, government: 0.6 }
    },
    saas: {
      scopes: ['small'],
      requiredFeatures: { small: ['f_auth', 'f_admin'] },
      suggestedFeatures: { small: ['f_sso', 'f_webhooks', 'f_team', 'f_analytics', 'f_audit'] },
      paymentRange: { small: [20000, 45000] },
      deadlineMult: 1.3,
      tierWeights: { small_biz: 0.3, enterprise: 1.6, tech_giant: 2.0, government: 1.3 }
    },
    ai: {
      scopes: ['small'],
      requiredFeatures: { small: ['f_inference', 'f_safety'] },
      suggestedFeatures: { small: ['f_finetune', 'f_memory', 'f_multimodal', 'f_api'] },
      paymentRange: { small: [30000, 60000] },
      deadlineMult: 1.4,
      tierWeights: { small_biz: 0.2, enterprise: 1.0, tech_giant: 2.5, government: 1.8 }
    },
  };

  // ---------- Generator ----------
  let _contractIdCounter = 0;
  function newContractId() {
    _contractIdCounter += 1;
    return 'c_' + Date.now().toString(36) + '_' + _contractIdCounter;
  }

  function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomInRange([lo, hi]) {
    return Math.round(lo + Math.random() * (hi - lo));
  }

  // Which tiers are currently unlocked + not dropped (below minAvg)
  function unlockedTiers() {
    ensureReputation();
    const out = [];
    for (const tierId of Object.keys(CLIENT_TIERS)) {
      if (isClientTierAvailable(tierId)) out.push(tierId);
    }
    return out;
  }

  function isClientTierAvailable(tierId) {
    const tier = CLIENT_TIERS[tierId];
    if (!tier) return false;
    const rep = S.clientReputation[tierId];
    if (!rep) return false;
    if (!rep.unlocked) return false;
    // Drop check: if we have deliveries and avg is below minAvg, tier temporarily stops offering
    if (rep.count >= 2 && rep.avg < tier.minAvg) return false;
    return true;
  }

  // Pick a client tier weighted by what's unlocked
  function pickClientTier() {
    const tiers = unlockedTiers();
    if (tiers.length === 0) return 'small_biz'; // safety fallback
    // Bias: prefer higher tiers slightly (more interesting)
    const weights = tiers.map(t => {
      const idx = Object.keys(CLIENT_TIERS).indexOf(t);
      return { t, w: 1 + idx * 0.5 }; // small_biz=1, enterprise=1.5, tech=2, gov=2.5
    });
    const total = weights.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    for (const { t, w } of weights) {
      roll -= w;
      if (roll <= 0) return t;
    }
    return tiers[0];
  }

  // Weighted project type pick, scaled by the selected tier + era availability
  function pickProjectTypeForTier(tierId) {
    const year = S.calendar?.year || 1980;
    const entries = Object.entries(CONTRACT_SPECS)
      .filter(([type]) => {
        // Only include types that are era-available
        return window.isProjectTypeAvailable ? window.isProjectTypeAvailable(type, year) : true;
      })
      .map(([type, spec]) => [type, spec.tierWeights[tierId] || 0.5]);
    if (entries.length === 0) return 'business'; // safety fallback
    const total = entries.reduce((s, [,w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [type, w] of entries) {
      roll -= w;
      if (roll <= 0) return type;
    }
    return entries[0][0];
  }

  // ---------- Reputation state ----------
  function ensureReputation() {
    if (!S.clientReputation) {
      S.clientReputation = {
        small_biz:  { avg: 0, count: 0, unlocked: true  },
        enterprise: { avg: 0, count: 0, unlocked: false },
        tech_giant: { avg: 0, count: 0, unlocked: false },
        government: { avg: 0, count: 0, unlocked: false },
      };
    }
  }

  // Recompute unlock gates after a delivery or fame change
  function refreshTierUnlocks() {
    ensureReputation();
    for (const tierId of Object.keys(CLIENT_TIERS)) {
      const tier = CLIENT_TIERS[tierId];
      if (tier.unlockedFromStart) continue;
      const gate = tier.gate;
      if (!gate) continue;
      const rep = S.clientReputation[tierId];
      if (rep.unlocked) continue;
      const gateRep = S.clientReputation[gate.tier];
      if (!gateRep) continue;
      if (gateRep.count < gate.minDeliveries) continue;
      if (gateRep.avg < gate.minAvg) continue;
      if (gate.minFame && (S.tFame || 0) < gate.minFame) continue;
      // Unlock!
      rep.unlocked = true;
      if (typeof log === 'function') log('🔓 Client tier unlocked: ' + tier.icon + ' ' + tier.label);
      document.dispatchEvent(new CustomEvent('tycoon:client-tier-unlocked', { detail: { tierId } }));
    }
  }

  // Called when a contract is delivered — records the star rating
  function recordContractDelivery(proj) {
    if (!proj.isContract) return;
    ensureReputation();
    const critic = proj.criticScore || 50;
    // Map critic 0-100 → stars 1-5 (90+ = 5, 70-89 = 4, 50-69 = 3, 30-49 = 2, <30 = 1)
    const stars = Math.max(1, Math.min(5, Math.ceil(critic / 20)));
    proj.clientStars = stars;
    const tierId = proj.clientTier || 'small_biz';
    const rep = S.clientReputation[tierId];
    if (!rep) return;
    // Running average
    const prevAvg = rep.avg;
    rep.avg = ((rep.avg * rep.count) + stars) / (rep.count + 1);
    rep.count += 1;
    if (typeof log === 'function') {
      const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      log('📋 ' + (CLIENT_TIERS[tierId]?.label || tierId) + ' rated ' + proj.name + ': ' + starStr + ' (' + stars + '/5)');
    }
    refreshTierUnlocks();
    if (typeof markDirty === 'function') markDirty();
    document.dispatchEvent(new CustomEvent('tycoon:contract-rated', { detail: { projectId: proj.id, stars, tierId } }));
  }

  // Expose the hook so shipProject can call it
  window._tycoonRecordContractDelivery = recordContractDelivery;

  function generateContract() {
    ensureReputation();
    const currentWeek = window.tycoonProjects.absoluteWeek();
    const tierId = pickClientTier();
    const tier = CLIENT_TIERS[tierId];
    const type = pickProjectTypeForTier(tierId);
    const spec = CONTRACT_SPECS[type];
    const scope = randomFromArray(spec.scopes);
    const scopeDef = window.PROJECT_SCOPES[scope];

    // Pick required features + 0-2 suggested features (higher tiers demand more)
    const required = [...(spec.requiredFeatures[scope] || [])];
    const suggestedPool = spec.suggestedFeatures[scope] || [];
    // Higher tiers want more features (more demanding clients)
    const baseCount = tierId === 'small_biz' ? 0 : tierId === 'enterprise' ? 1 : 2;
    const suggestedCount = baseCount + Math.floor(Math.random() * 2);
    const suggested = [];
    for (let i = 0; i < suggestedCount && suggestedPool.length > 0; i++) {
      const pick = randomFromArray(suggestedPool);
      if (!suggested.includes(pick) && !required.includes(pick)) suggested.push(pick);
    }
    const allFeatures = [...required, ...suggested];

    // Payment: base range × tier multiplier
    const basePay = randomInRange(spec.paymentRange[scope]);
    const payment = Math.round(basePay * tier.payMult);

    // Deadline: enough time to complete + buffer
    const minWeeks = scopeDef.phaseWeeks.design + scopeDef.phaseWeeks.development + scopeDef.phaseWeeks.polish;
    const deadline = currentWeek + Math.ceil(minWeeks * spec.deadlineMult);

    const projectName = randomFromArray(PROJECT_NAME_TEMPLATES[type]);
    const clientName = randomFromArray(CLIENT_NAMES);
    const expiresAtWeek = Math.min(currentWeek + 8, deadline - 4);

    return {
      id: newContractId(),
      clientName,
      clientTier: tierId,
      clientTierLabel: tier.label,
      clientTierIcon: tier.icon,
      projectType: type,
      projectName,
      scope,
      payment,
      deadline,
      requiredFeatures: required,
      suggestedFeatures: suggested,
      allFeatures,
      offeredAtWeek: currentWeek,
      expiresAtWeek,
      spec: buildSpecString(type, scope, required, suggested),
    };
  }

  function buildSpecString(type, scope, required, suggested) {
    const featureNames = (ids) => ids.map(id => window.TYCOON_FEATURES_BY_ID[id]?.name).filter(Boolean).join(', ');
    const typeLbl = window.PROJECT_TYPES[type]?.label || type;
    let s = typeLbl + ' (' + scope + ' scope). ';
    if (required.length) s += 'Required: ' + featureNames(required) + '. ';
    if (suggested.length) s += 'Nice to have: ' + featureNames(suggested) + '. ';
    return s.trim();
  }

  // ---------- Queue management ----------
  // Triggered by tick subscription. Every ~8 weeks, maybe add a new contract.
  // Also expires old offers.
  let _weeksUntilNextOffer = 2; // first offer quickly to get player going
  const OFFER_INTERVAL_MIN = 6;
  const OFFER_INTERVAL_MAX = 10;
  const MAX_OFFERS_IN_QUEUE = 3;

  function onWeekTick() {
    if (!S.projects) S.projects = { active: [], shipped: [], contracts: [] };
    if (!Array.isArray(S.projects.contracts)) S.projects.contracts = [];

    // Expire old offers
    const currentWeek = window.tycoonProjects.absoluteWeek();
    const beforeCount = S.projects.contracts.length;
    S.projects.contracts = S.projects.contracts.filter(c => c.expiresAtWeek >= currentWeek);
    const expired = beforeCount - S.projects.contracts.length;
    if (expired > 0 && typeof log === 'function') {
      log('📪 ' + expired + ' contract offer' + (expired > 1 ? 's' : '') + ' expired');
    }

    // New offer rolling
    _weeksUntilNextOffer -= 1;
    if (_weeksUntilNextOffer <= 0 && S.projects.contracts.length < MAX_OFFERS_IN_QUEUE) {
      const c = generateContract();
      S.projects.contracts.push(c);
      _weeksUntilNextOffer = OFFER_INTERVAL_MIN + Math.floor(Math.random() * (OFFER_INTERVAL_MAX - OFFER_INTERVAL_MIN + 1));
      if (typeof markDirty === 'function') markDirty();
      if (typeof log === 'function') log('📬 Contract offer: ' + c.clientName + ' — ' + c.projectName + ' ($' + c.payment.toLocaleString() + ')');
      document.dispatchEvent(new CustomEvent('tycoon:contract-offered', { detail: { contractId: c.id } }));
    }
  }

  // ---------- Accept / decline ----------
  function acceptContract(contractId) {
    const contract = (S.projects?.contracts || []).find(c => c.id === contractId);
    if (!contract) { console.warn('Contract not found: ' + contractId); return null; }
    // Create project from contract
    const proj = window.tycoonProjects.create({
      name: contract.projectName,
      type: contract.projectType,
      scope: contract.scope,
      features: contract.allFeatures,
      isContract: true,
      clientId: contract.clientName,
      clientTier: contract.clientTier,
      payment: contract.payment,
      deadline: contract.deadline,
    });
    // Remove from queue
    S.projects.contracts = S.projects.contracts.filter(c => c.id !== contractId);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('✓ Accepted: ' + contract.projectName);
    document.dispatchEvent(new CustomEvent('tycoon:contract-accepted', { detail: { contractId, projectId: proj.id } }));
    return proj;
  }

  function declineContract(contractId) {
    if (!S.projects?.contracts) return;
    S.projects.contracts = S.projects.contracts.filter(c => c.id !== contractId);
    if (typeof markDirty === 'function') markDirty();
    document.dispatchEvent(new CustomEvent('tycoon:contract-declined', { detail: { contractId } }));
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startContractsTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[contracts] tycoonTime not available'); return; }
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopContractsTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonContracts = {
    generate: generateContract,
    accept: acceptContract,
    decline: declineContract,
    startTick: startContractsTick,
    stopTick: stopContractsTick,
    state() {
      return {
        queue: S.projects?.contracts || [],
        weeksUntilNext: _weeksUntilNextOffer
      };
    },
    // Force-add an offer (debug)
    forceOffer() {
      _weeksUntilNextOffer = 0;
      onWeekTick();
      return (S.projects?.contracts || []).slice(-1)[0];
    },
    CLIENT_NAMES,
    PROJECT_NAME_TEMPLATES,
    CONTRACT_SPECS
  };
  if (window.dbg) window.dbg.contracts = window.tycoonContracts;

  console.log('[tycoon-contracts] module loaded. ' + Object.keys(CONTRACT_SPECS).length + ' project types, ' + CLIENT_NAMES.length + ' clients.');
})();
