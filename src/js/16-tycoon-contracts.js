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

  // ---------- Contract specifications per project type ----------
  // Defines typical features the client wants, scope, payment range.
  // Phase 1: Small scope only (Contract + Medium/Large in Phase 2+).
  const CONTRACT_SPECS = {
    business: {
      scopes: ['small'],                     // Phase 1: small only
      requiredFeatures: {
        small: ['f_save', 'f_print']         // always required on small business contracts
      },
      suggestedFeatures: {
        small: ['f_import', 'f_reports', 'f_templates', 'f_help']  // nice-to-haves
      },
      paymentRange: { small: [12000, 28000] },
      deadlineMult: 1.4,                     // 40% more weeks than minimum dev time
      weights: {                             // relative likelihood of each client tier requesting this
        smallBiz: 1.0
      }
    },
    game: {
      scopes: ['small'],
      requiredFeatures: {
        small: ['f_save']
      },
      suggestedFeatures: {
        small: ['f_sound', 'f_diff', 'f_tutorial', 'f_ach', 'f_help']
      },
      paymentRange: { small: [8000, 22000] },  // games pay less on contract (risk)
      deadlineMult: 1.5,
      weights: {
        smallBiz: 0.3                          // few small biz clients want games
      }
    }
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

  function pickProjectType() {
    // Weighted roll across types based on their smallBiz weights
    const entries = Object.entries(CONTRACT_SPECS).map(([type, spec]) => [type, spec.weights.smallBiz]);
    const total = entries.reduce((s, [,w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [type, w] of entries) {
      roll -= w;
      if (roll <= 0) return type;
    }
    return entries[0][0];
  }

  function generateContract() {
    const currentWeek = window.tycoonProjects.absoluteWeek();
    const type = pickProjectType();
    const spec = CONTRACT_SPECS[type];
    const scope = randomFromArray(spec.scopes);
    const scopeDef = window.PROJECT_SCOPES[scope];

    // Pick required features + 0-2 suggested features
    const required = [...(spec.requiredFeatures[scope] || [])];
    const suggestedPool = spec.suggestedFeatures[scope] || [];
    const suggestedCount = Math.floor(Math.random() * 3);
    const suggested = [];
    for (let i = 0; i < suggestedCount && suggestedPool.length > 0; i++) {
      const pick = randomFromArray(suggestedPool);
      if (!suggested.includes(pick) && !required.includes(pick)) suggested.push(pick);
    }
    const allFeatures = [...required, ...suggested];

    // Scope-based payment with slight variance
    const payment = randomInRange(spec.paymentRange[scope]);

    // Deadline: enough time to complete + buffer
    const minWeeks = scopeDef.phaseWeeks.design + scopeDef.phaseWeeks.development + scopeDef.phaseWeeks.polish;
    const deadline = currentWeek + Math.ceil(minWeeks * spec.deadlineMult);

    // Project name + client name
    const projectName = randomFromArray(PROJECT_NAME_TEMPLATES[type]);
    const clientName = randomFromArray(CLIENT_NAMES);

    // Offer expires 8 game-weeks from now (or on deadline - whichever comes first)
    const expiresAtWeek = Math.min(currentWeek + 8, deadline - 4);

    return {
      id: newContractId(),
      clientName,
      clientTier: 'small_biz',
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
