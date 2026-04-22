// ========== TYCOON TRAITS + PASSIONS (v3 roguelite) ==========
// Phase 2 of the roguelite layer: data model only — no gameplay effects
// wired in yet (that's Phase 3). Defines the three-layer founder model
// locked in Q6:
//   1. Passions (one per quality axis: tech/design/polish)
//        Burning / Interested / None / Aversion
//   2. Mechanical traits (concrete gameplay effects; count varies by rank)
//   3. Narrative traits (pure flavor, no effect)
//
// Also owns the class-roster generator that populates S.school.classRoster
// on first save entry (Q1b: one class per save, climbed from the bottom).
//
// No effect on current gameplay. Phase 3 wires trait effects into
// developOneWeek/polishOneWeek/hire costs/etc.
(function(){
  'use strict';

  // ---------- Passions ----------
  const PASSIONS = {
    BURNING:    { id: 'burning',    label: 'Burning',    icon: '\uD83D\uDD25\uD83D\uDD25', mult: 1.40 },
    INTERESTED: { id: 'interested', label: 'Interested', icon: '\uD83D\uDD25',              mult: 1.15 },
    NONE:       { id: 'none',       label: 'Unaligned',  icon: '\u25A1',                    mult: 1.00 },
    AVERSION:   { id: 'aversion',   label: 'Aversion',   icon: '\u{1F6AB}',                 mult: 0.75 },
  };
  const AXES = ['tech', 'design', 'polish'];

  // ---------- Mechanical traits catalog (~15 exemplars for Phase 2) ----------
  // Each trait has an id, name, desc, and a short `hook` object that Phase 3
  // will read to apply effects. The hooks are declarative so Phase 3 can
  // dispatch them without pattern-matching on ids.
  const TRAITS = [
    { id: 't_night_owl',         name: 'Night Owl',          desc: '+20% output at speed 2\u00D7+, \u221220% at speed 1\u00D7',
      hook: { kind: 'speedMod', highSpeedMul: 1.2, lowSpeedMul: 0.8 } },
    { id: 't_perfectionist',     name: 'Perfectionist',      desc: 'Polish phase: +15% quality, +50% longer duration',
      hook: { kind: 'polishPhase', qualityMul: 1.15, durationMul: 1.5 } },
    { id: 't_networker',         name: 'Networker',          desc: '\u221220% hire cost, interviews reveal extra info',
      hook: { kind: 'hireDiscount', mul: 0.8, interviewBoost: true } },
    { id: 't_workaholic',        name: 'Workaholic',         desc: '+15% output, \u22121 morale/week to team',
      hook: { kind: 'outputTradeoff', outputMul: 1.15, moraleDrain: 1 } },
    { id: 't_eccentric',         name: 'Eccentric',          desc: '25% of MC decisions surface a 4th unorthodox option',
      hook: { kind: 'mcExtraOption', chance: 0.25 } },
    { id: 't_imposter',          name: 'Imposter Syndrome',  desc: '\u2212morale penalty after shipping with critic < 80',
      hook: { kind: 'shipMoraleCritic', threshold: 80, moraleDelta: -8 } },
    { id: 't_caffeinated',       name: 'Caffeinated',        desc: '+10% speed during development phase only',
      hook: { kind: 'phaseSpeed', phase: 'development', mul: 1.10 } },
    { id: 't_chip_on_shoulder',  name: 'Chip on Shoulder',   desc: '+10% output when a project is behind schedule',
      hook: { kind: 'behindScheduleBoost', mul: 1.10 } },
    { id: 't_visionary',         name: 'Visionary',          desc: 'Feature-picking surfaces 1 extra suggested feature',
      hook: { kind: 'featureSuggest', extra: 1 } },
    { id: 't_recluse',           name: 'Recluse',            desc: '\u221240% hire cost; marketing channels locked',
      hook: { kind: 'recluse', hireMul: 0.6, marketingLocked: true } },
    { id: 't_deal_maker',        name: 'Deal Maker',         desc: 'Contracts pay +25%; own-IP launch sales \u221210%',
      hook: { kind: 'contractTradeoff', contractMul: 1.25, ownIpMul: 0.9 } },
    { id: 't_mentor',            name: 'Mentor',             desc: 'Team members gain stats 30% faster',
      hook: { kind: 'teamXpBoost', mul: 1.30 } },
    { id: 't_polish_snob',       name: 'Polish Snob',        desc: '+15% polish output, \u22125% design output',
      hook: { kind: 'axisShift', polishMul: 1.15, designMul: 0.95 } },
    { id: 't_scrappy',           name: 'Scrappy',            desc: 'First 12 weeks: +30% output, then baseline',
      hook: { kind: 'earlyCareer', weeks: 12, outputMul: 1.30 } },
    { id: 't_prestigious',       name: 'Prestigious',        desc: '+20 Fame per ship; all costs +10%',
      hook: { kind: 'prestige', fameBonus: 20, costMul: 1.10 } },
    // Phase 10 trait catalog expansion (15 → 25).
    // These are DEFINED but flagged wired:false so the class-roster
    // generator doesn't roll them into founders yet — the mechanical
    // effects aren't hooked into the gameplay loop. They'll light up in
    // a future patch. Keeps the founder UI honest: every rolled trait
    // has a real effect, no dud descriptions.
    { id: 't_polymath',          name: 'Polymath',           desc: '+10% output on the two axes OUTSIDE your specialty\u2019s primary axis (jack-of-all-trades, master of one)',
      hook: { kind: 'polymath', nonSpecialtyMul: 1.10 } },
    { id: 't_lean_ops',          name: 'Lean Operator',      desc: '\u221215% monthly loan payments and payroll',
      hook: { kind: 'leanOps', mul: 0.85 } },
    { id: 't_trend_chaser',      name: 'Trend Chaser',       desc: '+30% launch sales on ships in the last 2 years of an era window',
      hook: { kind: 'trendChaser', mul: 1.30, eraEndWindowYears: 2 } },
    { id: 't_early_riser',       name: 'Early Riser',        desc: '+15% output during weeks 1\u20136 of a project',
      hook: { kind: 'earlyPhase', weeks: 6, outputMul: 1.15 } },
    { id: 't_crunch_addict',     name: 'Crunch Addict',      desc: 'Crunch mode: +20% output (was +30%), but no bug risk penalty',
      hook: { kind: 'crunchRework', outputMul: 1.20, bugRiskMul: 1.0 } },
    { id: 't_nihilist',          name: 'Nihilist',           desc: 'Morale doesn\'t affect output (flat 1.0\u00D7), but max morale capped at 65',
      hook: { kind: 'moraleFlat', capMorale: 65 } },
    { id: 't_showman',           name: 'Showman',            desc: '+40% marketing multipliers, but 1st marketing channel costs +50%',
      hook: { kind: 'showman', mktMul: 1.40, firstChannelCostMul: 1.50 } },
    { id: 't_coder_purist',      name: 'Coder Purist',       desc: 'Tech axis ships get +15% critic; design-heavy types get \u221210%',
      hook: { kind: 'codePurist', techBonus: 0.15, designPenalty: 0.10 } },
    { id: 't_serial_founder',    name: 'Serial Founder',     desc: 'First project ships 30% faster; subsequent projects normal',
      hook: { kind: 'firstShipSpeed', mul: 0.70 } },
    { id: 't_contrarian',        name: 'Contrarian',         desc: '+25% launch sales on types with current low market heat',
      hook: { kind: 'contrarian', mul: 1.25 } },
  ];
  // Traits without an explicit wired:false flag are wired. Default-wired
  // kept implicit so the original 15 traits don't each need a flag.
  for (const t of TRAITS) { if (t.wired === undefined) t.wired = true; }
  // Pool used by the class-roster generator — only wired traits. Defined-
  // but-not-wired traits still appear in TRAITS_BY_ID for docs / UI.
  const WIRED_TRAITS = TRAITS.filter(t => t.wired);
  const TRAITS_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));

  // ---------- Narrative flavor catalog ----------
  // No mechanical effect. Seeds the founder bio / Alumni Hall quotes /
  // flavor log entries in later phases. Aim for ~70 entries with variety
  // across hobbies, physical traits, quirks, and background.
  const NARRATIVE_TRAITS = [
    // Hobbies
    'Avid chess player', 'Serial yogi', 'Collects vintage calculators',
    'Marathon runner', 'Amateur radio operator', 'Keeps a bee hive',
    'Rock climber', 'Obsessed with latte art', 'Birdwatcher',
    'Homebrews beer', 'Sommelier in training', 'Board-game night regular',
    // Physical traits / quirks
    'Left-handed', 'Wears a beret indoors', 'Stutters when nervous',
    'Can\u2019t stand fluorescent light', 'Tall enough to duck through doorways',
    'Colorblind (red/green)', 'Wakes at 5am every day', 'Incurable night-owl',
    // Interests
    'Film buff, specializes in noir', 'Opera season-ticket holder',
    'Writes bad poetry', 'Watches pro wrestling religiously',
    'Reads 3 books a month', 'Knows every Star Trek episode',
    'Collects fountain pens', 'Plays jazz piano',
    // Pets + home
    'Rescue dog named after a physicist', 'Three indoor cats',
    'Saltwater aquarium hobbyist', 'Adopted a retired racing greyhound',
    'Lives with a parrot that mocks them', 'Keeps a lizard', 'No pets, allergic to everything',
    // Food / drink
    'Iced coffee year-round', 'Strict vegetarian', 'Can\u2019t cook to save their life',
    'Trained as a pastry chef', 'Hates the taste of cilantro',
    'Hot sauce on literally everything', 'Sober, decade running',
    // Pre-tech background
    'Philosophy major before switching', 'Dropped out of music school',
    'Former competitive gymnast', 'Ex-army, tight-lipped about it',
    'Self-taught, no formal CS education', 'Second career after law school',
    'Worked as a barista for six years', 'Grew up on a farm',
    // Quirks + pet peeves
    'Hates the Oxford comma', 'Known for loud shirts', 'Always wears the same watch',
    'Can\u2019t sit still in meetings', 'Never uses emoji',
    'Speaks three languages, badly', 'Twitches when people chew loudly',
    'Keeps a notebook for every project', 'Refuses to eat in the office',
    // Family + background
    'Only child', 'Eldest of five siblings', 'Has an identical twin',
    'Adopted', 'First in family to go to college',
    // Unusual backgrounds
    'Former stage magician', 'Retired competitive dancer', 'Once hiked the Appalachian Trail solo',
    'Part-time standup comedian', 'Survived a lightning strike',
    'Owns a vintage motorcycle they never rides', 'Licensed pilot',
    'Competed in a robotics championship in high school', 'Once met a US president',
  ];

  // ---------- Name pools ----------
  // Separate from the employees module — classmates come from a fictional
  // international tech school, so broader surname variety feels right.
  const FIRST_NAMES = [
    'Alex','Jordan','Taylor','Morgan','Casey','Riley','Sam','Jamie','Quinn','Avery',
    'Blake','Drew','Reese','Skyler','Rowan','Sage','Finley','Hayden','Kai','Logan',
    'Parker','Emerson','Dakota','Harper','Robin','Eden','Nico','Remy','Tatum','Marlowe',
    'Arden','Bailey','Carson','Devon','Ellis','Frankie','Gray','Indigo','Jesse','Kendall',
    'Saanvi','Aarav','Yuki','Ibrahim','Amara','Omar','Chen','Mei','Priya','Ravi',
    'Ingrid','Klaus','Sofia','Matteo','Diego','Lucia','Hiro','Nia','Zainab','Raj'
  ];
  const LAST_NAMES = [
    'Smith','Chen','Patel','Garcia','Kim','Nguyen','Johnson','Rivera','Lee','Khan',
    'Brown','Park','Singh','Lopez','Ivanov','Fischer','Nakamura','O\u2019Brien','Dubois','Costa',
    'Ng','Rossi','Yamamoto','Kowalski','Andersen','Tanaka','Silva','Hassan','Novak','Berg',
    'Ruiz','Walsh','Morozov','Vega','Suzuki','Hoffmann','Mbeki','Liu','Rahman','Volkov',
    'Abiola','Cardoso','Eriksen','Haider','Lindqvist','Nakamoto','Okonkwo','Papadopoulos','Shah','Thorne'
  ];

  function rollName() {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return fn + ' ' + ln;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pickN(pool, n) {
    if (pool.length <= n) return pool.slice();
    return shuffle(pool).slice(0, n);
  }

  // ---------- Band classification by rank ----------
  // Q1a bell curve: top 5 + bottom 5 are extremes (more traits, more stat
  // extremes); top 25% / bottom 25% are lighter versions; middle is vanilla.
  function bandForRank(rank, classSize) {
    if (rank <= 5) return 'top_extreme';
    if (rank <= Math.floor(classSize * 0.25)) return 'top_normal';
    if (rank > classSize - 5) return 'bottom_extreme';
    if (rank > Math.floor(classSize * 0.75)) return 'bottom_normal';
    return 'middle';
  }

  // Stat sum by band. Individual axis stats distributed around this sum,
  // with the high-passion axis getting more weight (see rollStats).
  // v11.2: all sums 10x to match the 10-100 stat range.
  function statSumForBand(band) {
    switch (band) {
      case 'top_extreme':    return 500 + Math.floor(Math.random() * 60);  // 500-559
      case 'top_normal':     return 450 + Math.floor(Math.random() * 50);  // 450-499
      case 'middle':         return 400 + Math.floor(Math.random() * 50);  // 400-449
      case 'bottom_normal':  return 350 + Math.floor(Math.random() * 50);  // 350-399
      case 'bottom_extreme': return 300 + Math.floor(Math.random() * 60);  // 300-359
      default: return 420;
    }
  }

  // Mechanical trait count by band (Q1a bell curve)
  function traitCountForBand(band) {
    switch (band) {
      case 'top_extreme':    return 3 + Math.floor(Math.random() * 2);    // 3-4
      case 'top_normal':     return 1 + Math.floor(Math.random() * 2);    // 1-2
      case 'middle':         return Math.random() < 0.5 ? 0 : 1;          // 0-1
      case 'bottom_normal':  return 1 + Math.floor(Math.random() * 2);    // 1-2
      case 'bottom_extreme': return 3 + Math.floor(Math.random() * 2);    // 3-4
      default: return 1;
    }
  }

  // ---------- Passion distribution ----------
  // Q6 rule: every founder gets one high, one mid, one low across 3 axes.
  // Band skews:
  //   top_extreme     → two Burning possible, weak 3rd axis
  //   top_normal      → one Burning likely, two Interested
  //   middle          → three Interested/None (generalist)
  //   bottom_normal   → one Burning or Interested, one None, one None/Aversion
  //   bottom_extreme  → one Burning + one None + one Aversion (specialist)
  function rollPassions(band) {
    const axesShuffled = shuffle(AXES);
    let levels;
    switch (band) {
      case 'top_extreme':
        levels = [
          Math.random() < 0.5 ? 'burning' : 'interested',
          Math.random() < 0.5 ? 'burning' : 'interested',
          Math.random() < 0.6 ? 'interested' : 'none',
        ];
        break;
      case 'top_normal':
        levels = [
          Math.random() < 0.6 ? 'burning' : 'interested',
          'interested',
          Math.random() < 0.5 ? 'interested' : 'none',
        ];
        break;
      case 'middle':
        levels = [
          Math.random() < 0.2 ? 'burning' : 'interested',
          'interested',
          Math.random() < 0.5 ? 'none' : 'interested',
        ];
        break;
      case 'bottom_normal':
        levels = [
          Math.random() < 0.3 ? 'burning' : 'interested',
          Math.random() < 0.5 ? 'none' : 'interested',
          Math.random() < 0.6 ? 'none' : 'aversion',
        ];
        break;
      case 'bottom_extreme':
        // Specialist character: one Burning + one None + one Aversion.
        levels = ['burning', 'none', 'aversion'];
        break;
      default:
        levels = ['interested', 'interested', 'interested'];
    }
    return {
      [axesShuffled[0]]: levels[0],
      [axesShuffled[1]]: levels[1],
      [axesShuffled[2]]: levels[2],
    };
  }

  // ---------- Stat distribution ----------
  // Weighted toward the passion-high axis so a burning-design classmate
  // also has higher design stat. Total stats always match band sum.
  function rollStats(statSum, passions) {
    // Weight per axis based on passion
    const weightFor = (axis) => {
      const p = passions[axis];
      if (p === 'burning')    return 3;
      if (p === 'interested') return 2;
      if (p === 'none')       return 1.2;
      if (p === 'aversion')   return 0.6;
      return 1.5;
    };
    const weights = AXES.map(weightFor);
    const total = weights.reduce((a, b) => a + b, 0);
    // Distribute statSum proportionally, then nudge with ±20 jitter.
    // v11.2: jitter and floor scaled 10x to match the 10-100 stat range.
    const stats = {};
    let assigned = 0;
    AXES.forEach((axis, i) => {
      if (i === AXES.length - 1) {
        stats[axis] = Math.max(50, statSum - assigned);
      } else {
        const v = Math.round((weights[i] / total) * statSum + (Math.random() * 40 - 20));
        stats[axis] = Math.max(50, v);
        assigned += stats[axis];
      }
    });
    return stats;
  }

  // ---------- Generate one classmate ----------
  function generateClassmate(rank, classSize) {
    const band = bandForRank(rank, classSize);
    const passions = rollPassions(band);
    const stats = rollStats(statSumForBand(band), passions);
    const mechCount = traitCountForBand(band);
    // Only roll from wired traits — defined-but-not-wired entries sit in
    // TRAITS for future patches without misleading the roster UI.
    const mechanicalTraits = pickN(WIRED_TRAITS, mechCount).map(t => t.id);
    // 1-3 narrative traits regardless of band — flavor is universal
    const narrativeCount = 1 + Math.floor(Math.random() * 3);
    const narrativeTraits = pickN(NARRATIVE_TRAITS, narrativeCount);
    return {
      rank,
      band,
      name: rollName(),
      age: 22 + Math.floor(Math.random() * 4), // 22-25 fresh grad
      stats,
      passions,
      mechanicalTraits,
      narrativeTraits,
      // Run state (populated when this classmate is enrolled)
      enrolled: false,
      enrolledAtYear: null,
      fate: null,     // 'bankrupt' | 'retired' | 'megacorp' | 'won' | null
    };
  }

  // ---------- Generate a full class (default 50) ----------
  function generateClass(size = 50) {
    const roster = [];
    for (let r = 1; r <= size; r++) roster.push(generateClassmate(r, size));
    return roster;
  }

  // ---------- Lazy state init ----------
  function ensureSchoolState() {
    if (!S.school) S.school = {};
    // Fill any missing fields from the canonical defaultSchool(). Lets old
    // saves adopt new fields added in later phases without explicit migration.
    const blank = (typeof defaultSchool === 'function') ? defaultSchool() : {};
    for (const k of Object.keys(blank)) {
      if (S.school[k] === undefined) S.school[k] = blank[k];
    }
  }

  // Ensure the class roster exists. Idempotent — only rolls a class if the
  // roster is empty. Should be called on every tycoon-mode entry; the first
  // time it runs for a save, it seeds the class; subsequent calls are no-ops.
  function ensureRoster() {
    ensureSchoolState();
    if (Array.isArray(S.school.classRoster) && S.school.classRoster.length > 0) return false;
    const CLASS_SIZE = 50;
    S.school.classRoster = generateClass(CLASS_SIZE);
    // Default school name if none set — player can rename later (Phase 5 UI).
    if (!S.school.name) S.school.name = 'The Institute';
    if (!S.school.foundedYear) S.school.foundedYear = 1980;
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('\uD83C\uDF93 Class roster generated (' + CLASS_SIZE + ' alumni candidates)');
    return true;
  }

  // ---------- Trait-effect lookup helpers (Phase 3: wired into gameplay) ----------
  function getPassionMult(passion) { return PASSIONS[passion?.toUpperCase?.()]?.mult ?? 1.0; }
  function traitHookById(id) { return TRAITS_BY_ID[id]?.hook || null; }
  function passionForAxis(founder, axis) {
    return founder?.passions?.[axis] || 'none';
  }

  // Augment an existing founder object with rolled passions + traits.
  // Called after the creator sets S.founder (pre-Phase-6) so the founder
  // picks up the roguelite layer seamlessly. Idempotent — skips any
  // field that's already populated.
  function augmentFounderWithTraits(founder, rank, classSize) {
    if (!founder) return founder;
    rank = rank || 50;        // Q1b: first run starts at the bottom of class
    classSize = classSize || 50;
    const band = bandForRank(rank, classSize);
    if (!founder.passions) founder.passions = rollPassions(band);
    if (!Array.isArray(founder.mechanicalTraits)) {
      const mechCount = traitCountForBand(band);
      founder.mechanicalTraits = pickN(WIRED_TRAITS, mechCount).map(t => t.id);
    }
    if (!Array.isArray(founder.narrativeTraits)) {
      const narrCount = 1 + Math.floor(Math.random() * 3);
      founder.narrativeTraits = pickN(NARRATIVE_TRAITS, narrCount);
    }
    founder.classmateRank = rank;
    founder.classmateBand = band;
    return founder;
  }

  // Find the first trait-hook of a given kind on the current founder.
  function founderTraitHook(kind) {
    const f = S.founder;
    if (!f || !Array.isArray(f.mechanicalTraits)) return null;
    for (const tId of f.mechanicalTraits) {
      const hook = TRAITS_BY_ID[tId]?.hook;
      if (hook && hook.kind === kind) return hook;
    }
    return null;
  }

  function weeksSinceCareerStart() {
    const c = S.calendar;
    if (!c) return 0;
    return Math.max(0,
      ((c.year || 1980) - 1980) * 48 + ((c.month || 1) - 1) * 4 + ((c.week || 1) - 1));
  }

  // Specialty → primary quality-axis map (mirrors 13-tycoon-projects +
  // 17-tycoon-employees). Kept in sync manually; only 10 entries.
  const SPECIALTY_AXIS_LOCAL = {
    coder:'tech', backend:'tech', network:'tech', cloud:'tech',
    frontend:'design', webdev:'design', gamedev:'design', agent:'design',
    mobile:'polish', devops:'polish',
  };

  // Per-axis multiplier for FOUNDER contributions — combines passion mult
  // with any axis-shifting trait (Polish Snob). Returns 1.0 for non-founder.
  function founderAxisMul(axis) {
    const f = S.founder;
    if (!f) return 1.0;
    let mul = getPassionMult(f.passions?.[axis]);
    const shift = founderTraitHook('axisShift');
    if (shift) {
      if (axis === 'polish' && shift.polishMul) mul *= shift.polishMul;
      if (axis === 'design' && shift.designMul) mul *= shift.designMul;
    }
    // v11.1: Polymath — +10% on axes outside the founder's specialty axis.
    // Rewards breadth (the two axes they're not already built around).
    const poly = founderTraitHook('polymath');
    if (poly) {
      const specAxis = SPECIALTY_AXIS_LOCAL[f.specialty] || 'tech';
      if (axis !== specAxis) mul *= (poly.nonSpecialtyMul || 1);
    }
    return mul;
  }

  // Global output multiplier for FOUNDER contributions (applies to all 3
  // axes equally). Combines: speed mod (Night Owl), phase-specific speed
  // (Caffeinated), behind-schedule boost (Chip on Shoulder), scrappy
  // early-career boost, workaholic output. Returns 1.0 for non-founder.
  function founderOutputMul(proj, phase) {
    const f = S.founder;
    if (!f) return 1.0;
    let mul = 1.0;
    // Night Owl — speed-dependent
    const nightOwl = founderTraitHook('speedMod');
    if (nightOwl) {
      const sp = S.speed || 1;
      if (sp >= 2) mul *= nightOwl.highSpeedMul;
      else mul *= nightOwl.lowSpeedMul;
    }
    // Caffeinated — phase-specific
    const caff = founderTraitHook('phaseSpeed');
    if (caff && caff.phase === phase) mul *= caff.mul;
    // Chip on Shoulder — behind-schedule
    const chip = founderTraitHook('behindScheduleBoost');
    if (chip && proj) {
      const absW = window.tycoonProjects?.absoluteWeek?.() || 0;
      const elapsed = absW - (proj.phaseStartedAtWeek || 0);
      const threshold = (proj.phaseWeeksRequired || 1) * 0.8;
      if (elapsed >= threshold) mul *= chip.mul;
    }
    // Scrappy — first N weeks of career
    const scrappy = founderTraitHook('earlyCareer');
    if (scrappy && weeksSinceCareerStart() < scrappy.weeks) mul *= scrappy.outputMul;
    // Workaholic — output boost
    const workaholic = founderTraitHook('outputTradeoff');
    if (workaholic) mul *= workaholic.outputMul;
    // v11.1 Early Riser — bonus during the first N weeks of each project
    const early = founderTraitHook('earlyPhase');
    if (early && proj) {
      const absW = window.tycoonProjects?.absoluteWeek?.() || 0;
      const createdAt = proj.createdAtWeek ?? proj.phaseStartedAtWeek ?? 0;
      const elapsed = absW - createdAt;
      if (elapsed >= 0 && elapsed < (early.weeks || 6)) mul *= (early.outputMul || 1);
    }
    return mul;
  }

  // ---------- Public API ----------
  window.tycoonTraits = {
    PASSIONS, TRAITS, TRAITS_BY_ID, NARRATIVE_TRAITS, AXES,
    // Generation
    generateClass,
    generateClassmate,
    ensureRoster,
    // Lookups
    bandForRank,
    getPassionMult,
    traitHookById,
    passionForAxis,
    // Phase 3: founder augmentation + effect helpers
    augmentFounderWithTraits,
    founderTraitHook,
    founderAxisMul,
    founderOutputMul,
    weeksSinceCareerStart,
    // Debug
    rerollClass(size = 50) {
      ensureSchoolState();
      S.school.classRoster = generateClass(size);
      if (typeof markDirty === 'function') markDirty();
      return S.school.classRoster;
    },
    state() {
      ensureSchoolState();
      return {
        classSize: S.school.classRoster.length,
        currentRank: S.school.currentClassmateRank,
        runNumber: S.school.currentRunNumber,
        endowment: S.school.endowment,
      };
    },
  };
  if (window.dbg) window.dbg.traits = window.tycoonTraits;

  console.log('[tycoon-traits] module loaded. '
    + TRAITS.length + ' mechanical traits ('
    + WIRED_TRAITS.length + ' wired, '
    + (TRAITS.length - WIRED_TRAITS.length) + ' defined-not-wired), '
    + NARRATIVE_TRAITS.length + ' narrative traits.');
})();
