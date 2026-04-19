// ========== TYCOON PLATFORM SYSTEM (v2) ==========
// Phase 4C: platforms have lifecycles, royalty cuts, and sales multipliers.
// Player picks a target platform in the Design modal; sales formula applies
// platform phase multiplier and royalty cut on ship.
(function(){
  'use strict';

  // ---------- Platform catalog (10 key platforms, abbreviated from full 20) ----------
  // Phases defined by [startYear, endYear] per phase.
  // Phase multipliers: launch 0.6×, growth 1.1×, peak 1.5×, decline 0.7×, dead 0.2×
  const PLATFORMS = [
    {
      id: 'pl_apple_ii',
      name: 'Apple II',
      icon: '🍏',
      supportedTypes: ['business','game'],
      royaltyCut: 0,
      devCostMult: 0.8,
      phases: [
        { phase:'launch',  years:[1977, 1979] },
        { phase:'growth',  years:[1980, 1982] },
        { phase:'peak',    years:[1983, 1987] },
        { phase:'decline', years:[1988, 1992] },
        { phase:'dead',    years:[1993, 9999] },
      ]
    },
    {
      id: 'pl_pc_dos',
      name: 'IBM PC / DOS',
      icon: '💾',
      supportedTypes: ['business','game'],
      royaltyCut: 0,
      devCostMult: 1.0,
      phases: [
        { phase:'launch',  years:[1981, 1983] },
        { phase:'growth',  years:[1984, 1987] },
        { phase:'peak',    years:[1988, 1994] },
        { phase:'decline', years:[1995, 1998] },
        { phase:'dead',    years:[1999, 9999] },
      ]
    },
    {
      id: 'pl_macintosh',
      name: 'Macintosh',
      icon: '🖥️',
      supportedTypes: ['business','game','web','saas','ai'],
      royaltyCut: 0,
      devCostMult: 1.3,
      phases: [
        { phase:'launch',  years:[1984, 1985] },
        { phase:'growth',  years:[1986, 1990] },
        { phase:'peak',    years:[1991, 9999] }, // immortal peak
      ]
    },
    {
      id: 'pl_nes',
      name: 'Nintendo NES',
      icon: '🎮',
      supportedTypes: ['game'],
      royaltyCut: 0.30,
      devCostMult: 1.2,
      phases: [
        { phase:'launch',  years:[1983, 1984] },
        { phase:'growth',  years:[1985, 1988] },
        { phase:'peak',    years:[1989, 1992] },
        { phase:'decline', years:[1993, 1995] },
        { phase:'dead',    years:[1996, 9999] },
      ]
    },
    {
      id: 'pl_windows',
      name: 'Windows',
      icon: '🪟',
      supportedTypes: ['business','game','web','saas','ai'],
      royaltyCut: 0,
      devCostMult: 1.0,
      phases: [
        { phase:'launch',  years:[1990, 1993] },
        { phase:'growth',  years:[1994, 1996] },
        { phase:'peak',    years:[1997, 9999] },
      ]
    },
    {
      id: 'pl_playstation',
      name: 'PlayStation (1-5)',
      icon: '🎮',
      supportedTypes: ['game'],
      royaltyCut: 0.30,
      devCostMult: 1.5,
      phases: [
        { phase:'launch',  years:[1994, 1995] },
        { phase:'growth',  years:[1996, 1998] },
        { phase:'peak',    years:[1999, 9999] }, // keeps succeeding with new gens
      ]
    },
    {
      id: 'pl_web',
      name: 'Web (Browser)',
      icon: '🌐',
      supportedTypes: ['web','saas'],
      royaltyCut: 0,
      devCostMult: 0.7,
      phases: [
        { phase:'launch',  years:[1995, 1997] },
        { phase:'growth',  years:[1998, 2001] },
        { phase:'peak',    years:[2002, 9999] },
      ]
    },
    {
      id: 'pl_xbox',
      name: 'Xbox',
      icon: '🎮',
      supportedTypes: ['game'],
      royaltyCut: 0.30,
      devCostMult: 1.5,
      phases: [
        { phase:'launch',  years:[2001, 2003] },
        { phase:'growth',  years:[2004, 2006] },
        { phase:'peak',    years:[2007, 9999] },
      ]
    },
    {
      id: 'pl_steam',
      name: 'Steam',
      icon: '♨️',
      supportedTypes: ['game','saas'],
      royaltyCut: 0.30,
      devCostMult: 1.0,
      phases: [
        { phase:'launch',  years:[2004, 2006] },
        { phase:'growth',  years:[2007, 2010] },
        { phase:'peak',    years:[2011, 9999] },
      ]
    },
    {
      id: 'pl_ios',
      name: 'iOS App Store',
      icon: '🍎',
      supportedTypes: ['mobile','saas','ai'],
      royaltyCut: 0.30,
      devCostMult: 1.0,
      phases: [
        { phase:'launch',  years:[2008, 2009] },
        { phase:'growth',  years:[2010, 2012] },
        { phase:'peak',    years:[2013, 9999] },
      ]
    },
    {
      id: 'pl_android',
      name: 'Android',
      icon: '🤖',
      supportedTypes: ['mobile','saas','ai'],
      royaltyCut: 0.30,
      devCostMult: 0.9,
      phases: [
        { phase:'launch',  years:[2009, 2010] },
        { phase:'growth',  years:[2011, 2013] },
        { phase:'peak',    years:[2014, 9999] },
      ]
    },
    {
      id: 'pl_cloud',
      name: 'Cloud (AWS/Azure)',
      icon: '☁️',
      supportedTypes: ['saas','ai'],
      royaltyCut: 0, // no cut — cloud is infrastructure
      devCostMult: 1.2,
      phases: [
        { phase:'launch',  years:[2009, 2011] },
        { phase:'growth',  years:[2012, 2015] },
        { phase:'peak',    years:[2016, 9999] },
      ]
    },
  ];
  window.PLATFORMS = PLATFORMS;
  const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

  const PHASE_MULTIPLIERS = {
    launch: 0.6,
    growth: 1.1,
    peak: 1.5,
    decline: 0.7,
    dead: 0.2
  };
  const PHASE_LABELS = {
    launch:  '🌱 Launch',
    growth:  '📈 Growth',
    peak:    '🚀 Peak',
    decline: '📉 Decline',
    dead:    '💀 Dead'
  };

  // ---------- Lifecycle queries ----------
  function getPhase(platform, year) {
    year = year == null ? (S.calendar?.year || 1980) : year;
    for (const ph of platform.phases) {
      if (year >= ph.years[0] && year <= ph.years[1]) return ph.phase;
    }
    // Not yet launched?
    const firstPhase = platform.phases[0];
    if (year < firstPhase.years[0]) return null; // not available
    return 'dead';
  }

  function isAvailable(platformId, year) {
    const p = PLATFORM_BY_ID[platformId];
    if (!p) return false;
    const phase = getPhase(p, year);
    return phase != null && phase !== 'dead';
  }

  function phaseMultiplier(platform, year) {
    const ph = getPhase(platform, year);
    return ph ? (PHASE_MULTIPLIERS[ph] || 1) : 0;
  }

  function phaseLabel(platform, year) {
    const ph = getPhase(platform, year);
    return ph ? PHASE_LABELS[ph] : '🔒 Not yet';
  }

  // ---------- Platforms available for a given project type + era ----------
  function availableForType(projectType, year) {
    year = year == null ? (S.calendar?.year || 1980) : year;
    return PLATFORMS.filter(p =>
      p.supportedTypes.includes(projectType) && isAvailable(p.id, year)
    );
  }

  // ---------- Sales formula integration ----------
  // Given a project, compute the platform multiplier AFTER royalty cut
  function launchMultiplier(platformId, year) {
    if (!platformId) return { phaseMult: 1, royaltyCut: 0, net: 1 };
    const p = PLATFORM_BY_ID[platformId];
    if (!p) return { phaseMult: 1, royaltyCut: 0, net: 1 };
    const phaseMult = phaseMultiplier(p, year);
    const royaltyCut = p.royaltyCut || 0;
    return {
      phaseMult,
      royaltyCut,
      net: phaseMult * (1 - royaltyCut)
    };
  }

  // ---------- Public API ----------
  window.tycoonPlatforms = {
    PLATFORMS,
    PLATFORM_BY_ID,
    PHASE_LABELS,
    PHASE_MULTIPLIERS,
    getPhase,
    isAvailable,
    phaseMultiplier,
    phaseLabel,
    availableForType,
    launchMultiplier,
    state() {
      const year = S.calendar?.year || 1980;
      return PLATFORMS.map(p => ({
        name: p.name,
        icon: p.icon,
        phase: phaseLabel(p, year),
        mult: phaseMultiplier(p, year),
        cut: p.royaltyCut
      }));
    }
  };
  if (window.dbg) window.dbg.platforms = window.tycoonPlatforms;

  console.log('[tycoon-platforms] module loaded. ' + PLATFORMS.length + ' platforms.');
})();
