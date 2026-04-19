// ========== HELPERS ==========
function fmt(n) {
  if (n < 0) return '0';
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toLocaleString();
  const s = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc'];
  const i = Math.min(Math.floor(Math.log10(Math.max(n,1)) / 3), s.length - 1);
  const v = n / 10 ** (i * 3);
  if (!_shownFmtTutorial && typeof _shownFmtTutorial !== 'undefined') { _shownFmtTutorial = true; setTimeout(showFmtTutorial, 300); }
  return (v >= 1e20 ? v.toExponential(2) : v.toFixed(2)) + s[i];
}
function showFmtTutorial() {
  if (document.querySelector('.fmt-tutorial-ov')) return;
  const ov = document.createElement('div');
  ov.className = 'fmt-tutorial-ov';
  ov.innerHTML =
    '<div class="fmt-tutorial">' +
    '<h3>\uD83D\uDCCA Number Notation</h3>' +
    '<p>Large numbers are abbreviated to save space:</p>' +
    '<table>' +
    '<tr><td>K</td><td>Thousand (1,000)</td></tr>' +
    '<tr><td>M</td><td>Million (10\u2076)</td></tr>' +
    '<tr><td>B</td><td>Billion (10\u2079)</td></tr>' +
    '<tr><td>T</td><td>Trillion (10\u00B9\u00B2)</td></tr>' +
    '<tr><td>Qa</td><td>Quadrillion (10\u00B9\u2075)</td></tr>' +
    '<tr><td>Qi</td><td>Quintillion (10\u00B9\u2078)</td></tr>' +
    '<tr><td>Sx</td><td>Sextillion (10\u00B2\u00B9)</td></tr>' +
    '<tr><td>Sp</td><td>Septillion (10\u00B2\u2074)</td></tr>' +
    '<tr><td>Oc</td><td>Octillion (10\u00B2\u2077)</td></tr>' +
    '</table>' +
    '<p style="font-size:.7rem;color:var(--text-secondary)">Beyond Oc, scientific notation is used:<br>' +
    '<span style="color:var(--accent-green);font-weight:700">1.23e+5Oc</span> = 1.23 \u00D7 10\u00B5 Octillion</p>' +
    '<p style="font-size:.7rem;color:var(--text-secondary)">Example: 1.23K = 1,230 &middot; 4.56M = 4,560,000</p>' +
    '<button id="fmtTutClose">Got it!</button>' +
    '</div>';
  document.body.appendChild(ov);
  ov.querySelector('#fmtTutClose').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}

// Perk index constants — use these instead of magic numbers
const P = { LUNCH:0, ENERGY:1, DESK:2, DAYCARE:3, PET:4, GYM:5, GAMEROOM:6, PTO:7, NAP:8, RETREAT:9, MEETING:10 };

// ========== NAMED CONSTANTS ==========
const STREAK_WINDOW = 3000, STREAK_DIV = 3, STREAK_GROW = 0.5, STREAK_DECAY = 2, STREAK_DECAY_DELAY = 2000;
const NAP_INTERVAL = 50, NAP_BURST_MUL = 16;
const RECRUITER_FAST = 5, RECRUITER_SLOW = 10, FACILITY_FAST = 15, FACILITY_SLOW = 30;
const AUTOSAVE_INTERVAL = 30, OFFLINE_CAP = 28800, ACH_CHECK_INTERVAL = 0.5;
const SS = { SECRETARY:0, RECRUITER:1, FACILITY:2, TRAINER:3 };

// ========== MULTIPLIER CACHE ==========
let _dirty = true;
const _C = { prodMul:1, genSpeedMul:1, genSynergyMul:1, tierSynergyMul:1, fameMul:1, clickPow:1, lps:0, shipAt:0, hireCostMul:1, euMul:[], tierCount:[], tierLps:[], typeLps:{}, typeTierCount:{}, typeTierSynergyMul:{} };
function markDirty() { _dirty = true; }
function recalcIfDirty() {
  if (!_dirty) return;
  _dirty = false;
  _C.fameMul = 1 + 0.12 * S.tFame;
  let pm = energyPerkMul() * daycareMul() * gymMul() * retreatMul() * _C.fameMul * (1 + cbBonus('prod'));
  // Open Source: +5% production per shipped game per level
  if (S.f.genOpenSource) pm *= (1 + 0.05 * S.f.genOpenSource * S.shipped);
  // v7.3: Office tier production multiplier is now per-type — applied inside the
  // per-type LPS loop below (not folded into the global _C.prodMul).
  _C.prodMul = pm;
  _C.hireCostMul = (0.9 ** S.f.genCheap) * (0.85 ** S.f.genAcquihire) * deskDiscount() * ptoDiscount() * (1 - cbBonus('cheap'));
  _C.genSpeedMul = (1 + 0.25 * S.f.genSpeed) * (1 + 0.15 * S.f.genThreads) * (1 + cbBonus('speed'));
  // Count coder types owned (used by synergy + code review)
  let _types = 0; for (let i = 0; i < GEN.length; i++) if (S.g[i] > 0) _types++;
  let synMul = S.f.genSynergy ? (1 + 0.03 * _types) : 1;
  if (S.f.genReview) synMul *= (1 + 0.05 * _types);
  _C.genSynergyMul = synMul;
  // Pair Programming: ×1.5 coder production
  const pairMul = S.f.genPair ? 1.5 : 1;
  for (let i = 0; i < GEN.length; i++) {
    let m = 1;
    for (let u = 0; u < EMP_UPS.length; u++) { const tier = S.eu[i][u]; if (tier > 0) m *= EMP_UPS[u].tiers[tier - 1].mult; }
    // Trainer: +1% per trainer level for this coder type
    const tLvl = (S.trainerLvl && S.trainerLvl[i]) || 0;
    _C.euMul[i] = m * pairMul * (1 + 0.01 * tLvl);
  }
  const evMul = (activeEvent && !activeEvent.pending) ? activeEvent.mul : 1;
  const evClk = (activeEvent && !activeEvent.pending) ? activeEvent.clickMul : 1;
  // v7.1/7.2: per-coder production — iterate the engineer list for each type so
  // rarity + exp + tier set bonuses all apply per type independently. Coder is the
  // primary type and remains in S.coders.
  // v7.3: same loop runs for every engineer type into _C.typeLps[type].
  _C.typeLps = {};
  _C.typeTierCount = {};
  _C.typeTierSynergyMul = {};
  _C.typeTierLps = {};
  const _outerLpsRef = { val: 0 };
  const _aTypeForCache = activeType();
  for (const meta of ENG_TYPES) {
    const list = engList(meta.key);
    const tCount = new Array(GEN.length).fill(0);
    const tLps = new Array(GEN.length).fill(0);
    let raw = 0;
    for (const c of list) {
      const t = c.tier | 0;
      if (t < 0 || t >= GEN.length) continue;
      const contrib = GEN[t].rate * _C.euMul[t] * coderProdMul(c);
      raw += contrib;
      tLps[t] += contrib;
      tCount[t]++;
    }
    let tierBonusSum = 0;
    for (let i = 0; i < GEN.length; i++) tierBonusSum += setTierBonus(tCount[i]);
    const tierSyn = 1 + tierBonusSum;
    // v7.3: each type's office prod multiplier applies only to its own production
    const officeMul = officeProdMul(meta.key);
    const finalLps = raw * _C.genSpeedMul * _C.genSynergyMul * tierSyn * _C.prodMul * officeMul * evMul;
    _C.typeLps[meta.key] = finalLps;
    _C.typeTierCount[meta.key] = tCount;
    _C.typeTierSynergyMul[meta.key] = tierSyn;
    _C.typeTierLps[meta.key] = tLps;
    if (meta.key === 'coder') _outerLpsRef.val = finalLps;
  }
  // Backward-compat fields used by older code paths and the HUD/UI for the active type.
  const aType = activeType();
  _C.tierCount = _C.typeTierCount[aType] || new Array(GEN.length).fill(0);
  _C.tierSynergyMul = _C.typeTierSynergyMul[aType] || 1;
  _C.tierLps = _C.typeTierLps[aType] || new Array(GEN.length).fill(0);
  _C.lps = _C.typeLps[aType] || 0;
  // v7.3: click power uses the active type's office prod multiplier (since clicks
  // generate the active type's resource and the office bonus is per-type).
  _C.clickPow = (1 + lunchBonus()) * gameRoomMul() * (1 + S.f.clickDouble) * _C.prodMul * officeProdMul(aType) * evClk * (1 + cbBonus('click'));
  _C.shipAt = engShipAt(aType);
}

function shipInflation() { return 1.10 ** S.shipped; }
const cCost = i => Math.floor(CLK[i].base * CLK[i].gr ** S.c[i] * shipInflation());
const fameMul = () => { recalcIfDirty(); return _C.fameMul; };

// Office Perk helpers
let napTimer = 0;
function energyPerkMul() { return 1 + 0.30 * S.c[P.ENERGY]; }
// v7.3: lunch bonus counts only the active type's roster — switching tabs changes
// click power. Each engineer "ate lunch" for their own discipline.
function lunchBonus() { return S.c[P.LUNCH] * engList(activeType()).length * 1.0; }
function deskDiscount() { return 0.90 ** S.c[P.DESK]; }
function daycareMul() { return 1.6 ** S.c[P.DAYCARE]; }
function gameRoomMul() { return 1 + 0.70 * S.c[P.GAMEROOM]; }
function petAutoClick() { return S.c[P.PET] * 2; }
function gymMul() { return 1 + 0.40 * S.c[P.GYM]; }
function ptoDiscount() { return 0.80 ** S.c[P.PTO]; }
function retreatMul() { return 2.50 ** S.c[P.RETREAT]; }

// Code base bonuses
function cbBonus(type) { let v = 0; for (let i = 0; i < S.cb && i < CODE_BASE.length; i++) { if (CODE_BASE[i].effect === type) v += CODE_BASE[i].val; } return v; }

// Shared multiplier chains — single source of truth (cached via _C)
function prodMul() { recalcIfDirty(); return _C.prodMul; }
function hireCostMul() { recalcIfDirty(); return _C.hireCostMul; }
function gCostAt(i, owned) { return Math.floor(GEN[i].base * GEN[i].gr ** owned * hireCostMul() * shipInflation()); }
const gCost = i => gCostAt(i, S.g[i]);

// Employee upgrades: tiered multiplier per employee
function euCost(gi, ui) {
  const tier = S.eu[gi][ui];
  if (tier >= EMP_UPS[ui].tiers.length) return Infinity;
  const t = EMP_UPS[ui].tiers[tier];
  return Math.floor(t.baseCost * EMP_UPS[ui].gr ** tier * GEN[gi].base / 10 * shipInflation());
}
function facilityBestPick() {
  let best = null, bestScore = 0;
  for (let gi = 0; gi < GEN.length; gi++) {
    if (S.g[gi] < 1) continue;
    for (let ui = 0; ui < EMP_UPS.length; ui++) {
      const tier = S.eu[gi][ui];
      if (tier >= EMP_UPS[ui].tiers.length) continue;
      const c = euCost(gi, ui);
      const curMul = tier > 0 ? EMP_UPS[ui].tiers[tier - 1].mult : 1;
      const nextMul = EMP_UPS[ui].tiers[tier].mult;
      const val = (nextMul / curMul - 1) / c;
      if (val > bestScore) { bestScore = val; best = { gi, ui }; }
    }
  }
  return best;
}
function euMul(gi) { recalcIfDirty(); return _C.euMul[gi]; }
function buyEU(gi, ui) {
  const tier = S.eu[gi][ui];
  if (tier >= EMP_UPS[ui].tiers.length || S.g[gi] < 1) return;
  const c = euCost(gi, ui);
  if (S.loc < c) return;
  S.loc -= c;
  S.eu[gi][ui] = tier + 1;
  markDirty();
  log(t('logUpgraded') + ' ' + ta('gen_'+gi+'_name', GEN[gi].name) + ' \u2192 ' + ta('eu_'+ui+'_'+(tier)+'_name', EMP_UPS[ui].tiers[tier].name));
  playSfx('buy');
}

const RELEASE_YEARS = [1980, 1986, 1992, 1996, 1999, 2004, 2010, 2013, 2018, 2024];
function currentYear() { return RELEASE_YEARS[Math.min(S.shipped, RELEASE_YEARS.length - 1)]; }
function yearGap() {
  if (S.shipped <= 0) return 0;
  const i = Math.min(S.shipped, RELEASE_YEARS.length - 1);
  return RELEASE_YEARS[i] - RELEASE_YEARS[Math.max(0, i - 1)];
}

// ========== AUDIO SYSTEM ==========
let audioCtx, musicGain, sfxGain;
let curMusicEra = null, musicNodes = [], musicLoopId = null, _dbgMusicOverride = false;
const N = {
  C3:131,D3:147,E3:165,F3:175,G3:196,A3:220,B3:247,
  C4:262,D4:294,E4:330,F4:349,G4:392,A4:440,B4:494,
  C5:523,D5:587,E5:659,F5:698,G5:784,A5:880
};

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  sfxGain = audioCtx.createGain();
  musicGain.connect(audioCtx.destination);
  sfxGain.connect(audioCtx.destination);
  musicGain.gain.value = S.musicVol;
  sfxGain.gain.value = S.sfxVol;
}
function ensureAudio() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function setMusicVol(v) {
  S.musicVol = v;
  if (musicGain) musicGain.gain.value = v;
  if (v === 0) stopMusic();
}
function setSfxVol(v) {
  S.sfxVol = v;
  if (sfxGain) sfxGain.gain.value = v;
}

// --- SFX ---
function playSfx(type) {
  if (!audioCtx || S.sfxVol === 0) return;
  const t0 = audioCtx.currentTime;
  const g = audioCtx.createGain();
  g.connect(sfxGain);
  function osc(freq, wave, start, end, vol) {
    const o = audioCtx.createOscillator();
    const og = audioCtx.createGain();
    o.type = wave;
    o.frequency.value = freq;
    og.gain.setValueAtTime(vol || 0.3, t0 + start);
    og.gain.exponentialRampToValueAtTime(0.001, t0 + end);
    o.connect(og);
    og.connect(g);
    o.start(t0 + start);
    o.stop(t0 + end + 0.01);
  }
  switch (type) {
    case 'click':
      osc(880, 'square', 0, 0.06, 0.15);
      break;
    case 'buy':
      osc(440, 'triangle', 0, 0.12, 0.25);
      osc(660, 'triangle', 0.08, 0.2, 0.25);
      break;
    case 'ship':
      osc(523, 'sawtooth', 0, 0.25, 0.2);
      osc(659, 'sawtooth', 0.15, 0.4, 0.2);
      osc(784, 'sawtooth', 0.3, 0.6, 0.25);
      osc(1047, 'sawtooth', 0.45, 0.9, 0.15);
      break;
    case 'event':
      osc(600, 'square', 0, 0.1, 0.2);
      osc(800, 'square', 0.12, 0.22, 0.2);
      osc(600, 'square', 0.24, 0.34, 0.2);
      osc(800, 'square', 0.36, 0.46, 0.2);
      break;
    case 'achieve':
      [N.C5, N.D5, N.E5, N.G5, N.A5].forEach((f, i) => {
        const dur = i === 4 ? 0.4 : 0.1;
        osc(f, 'triangle', i * 0.09, i * 0.09 + dur, 0.25);
      });
      break;
    case 'milestone':
      [N.C4, N.E4, N.G4, N.C5].forEach((f, i) => {
        osc(f, 'triangle', i * 0.12, i * 0.12 + 0.3, 0.2);
      });
      break;
  }
  g.gain.setValueAtTime(1, t0);
}

// --- MUSIC ERAS ---
const MUSIC_ERAS = [
  { max:1983, id:'early',  build:buildMusic_early },
  { max:1988, id:'chip8',  build:buildMusic_chip8 },
  { max:1993, id:'16bit',  build:buildMusic_16bit },
  { max:1998, id:'fm',     build:buildMusic_fm },
  { max:2003, id:'cd',     build:buildMusic_cd },
  { max:2008, id:'modern', build:buildMusic_modern },
  { max:2013, id:'indie',  build:buildMusic_indie },
  { max:9999, id:'lofi',   build:buildMusic_lofi },
];

function schedNotes(dest, wave, notes, t0, vol) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = wave;
  o.connect(g);
  g.connect(dest);
  let t = t0;
  notes.forEach(n => {
    if (n.f > 0) {
      o.frequency.setValueAtTime(n.f, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + n.d * 0.95);
    } else {
      g.gain.setValueAtTime(0.001, t);
    }
    t += n.d;
  });
  o.start(t0);
  o.stop(t + 0.05);
  return { nodes: [o, g], duration: t - t0 };
}

// Era 1: 1979-1983 - Early home computer beeps (Apple II, ZX Spectrum)
function buildMusic_early(ctx, dest, t0) {
  const melody = [
    {f:N.C4,d:.4},{f:N.E4,d:.4},{f:N.G4,d:.4},{f:0,d:.4},
    {f:N.A4,d:.3},{f:N.G4,d:.3},{f:N.E4,d:.6},{f:0,d:.4},
    {f:N.D4,d:.4},{f:N.E4,d:.4},{f:N.C4,d:.8},{f:0,d:.4},
    {f:N.G3,d:.3},{f:N.A3,d:.3},{f:N.C4,d:.6},{f:0,d:.4},
  ];
  const r = schedNotes(dest, 'square', melody, t0, 0.12);
  return { nodes: r.nodes, duration: r.duration };
}

// Era 2: 1984-1988 - 8-bit chiptune (NES, C64)
function buildMusic_chip8(ctx, dest, t0) {
  const melody = [
    {f:N.E4,d:.2},{f:N.G4,d:.2},{f:N.A4,d:.2},{f:N.G4,d:.2},
    {f:N.E4,d:.2},{f:N.C4,d:.2},{f:N.D4,d:.4},
    {f:N.E4,d:.2},{f:N.G4,d:.2},{f:N.A4,d:.2},{f:N.B4,d:.2},
    {f:N.A4,d:.2},{f:N.G4,d:.2},{f:N.E4,d:.4},
    {f:N.C5,d:.15},{f:N.B4,d:.15},{f:N.A4,d:.15},{f:N.G4,d:.15},
    {f:N.E4,d:.2},{f:N.D4,d:.2},{f:N.C4,d:.4},{f:0,d:.3},
  ];
  const bass = [
    {f:N.C3,d:.4},{f:0,d:.4},{f:N.C3,d:.2},{f:N.C3,d:.2},
    {f:N.G3,d:.4},{f:0,d:.4},{f:N.G3,d:.2},{f:N.G3,d:.2},
    {f:N.A3,d:.4},{f:0,d:.4},{f:N.F3,d:.4},{f:0,d:.4},
    {f:N.G3,d:.4},{f:0,d:.2},{f:N.G3,d:.2},{f:N.C3,d:.4},{f:0,d:.3},
  ];
  const r1 = schedNotes(dest, 'square', melody, t0, 0.1);
  const r2 = schedNotes(dest, 'square', bass, t0, 0.08);
  return { nodes: [...r1.nodes, ...r2.nodes], duration: Math.max(r1.duration, r2.duration) };
}

// Era 3: 1989-1993 - 16-bit (SNES style)
function buildMusic_16bit(ctx, dest, t0) {
  const melody = [
    {f:N.E4,d:.35},{f:N.F4,d:.35},{f:N.G4,d:.35},{f:N.A4,d:.35},
    {f:N.G4,d:.7},{f:0,d:.35},
    {f:N.C5,d:.35},{f:N.B4,d:.35},{f:N.A4,d:.35},{f:N.G4,d:.35},
    {f:N.F4,d:.7},{f:0,d:.35},
    {f:N.E4,d:.35},{f:N.G4,d:.35},{f:N.C5,d:.7},
    {f:N.B4,d:.35},{f:N.A4,d:.35},{f:N.G4,d:.7},{f:0,d:.35},
  ];
  const harmony = [
    {f:N.C4,d:.7},{f:N.E4,d:.7},{f:N.G4,d:.7},{f:0,d:.35},
    {f:N.A3,d:.7},{f:N.C4,d:.7},{f:N.E4,d:.7},{f:0,d:.35},
    {f:N.C4,d:.7},{f:N.E4,d:.7},
    {f:N.D4,d:.7},{f:N.G3,d:.7},{f:0,d:.35},
  ];
  const bass = [
    {f:N.C3,d:.7},{f:0,d:.7},{f:N.C3,d:.35},{f:N.G3,d:.35},{f:0,d:.7},
    {f:N.A3,d:.7},{f:0,d:.7},{f:N.A3,d:.35},{f:N.E3,d:.35},{f:0,d:.7},
    {f:N.C3,d:.7},{f:0,d:.7},
    {f:N.G3,d:.7},{f:N.C3,d:.7},{f:0,d:.35},
  ];
  const r1 = schedNotes(dest, 'triangle', melody, t0, 0.12);
  const r2 = schedNotes(dest, 'sawtooth', harmony, t0, 0.05);
  const r3 = schedNotes(dest, 'triangle', bass, t0, 0.1);
  return { nodes: [...r1.nodes, ...r2.nodes, ...r3.nodes], duration: Math.max(r1.duration, r2.duration, r3.duration) };
}

// Era 4: 1994-1998 - FM synthesis / MIDI era
function buildMusic_fm(ctx, dest, t0) {
  const all = [];
  const melody = [
    {f:N.A4,d:.3},{f:N.G4,d:.3},{f:N.E4,d:.3},{f:N.D4,d:.3},
    {f:N.C4,d:.6},{f:0,d:.3},
    {f:N.D4,d:.3},{f:N.E4,d:.3},{f:N.G4,d:.3},{f:N.A4,d:.3},
    {f:N.G4,d:.6},{f:0,d:.3},
    {f:N.E4,d:.3},{f:N.G4,d:.6},{f:N.A4,d:.3},
    {f:N.C5,d:.6},{f:N.A4,d:.3},{f:N.G4,d:.6},{f:0,d:.3},
  ];
  // FM: modulator oscillates carrier's frequency
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const cGain = ctx.createGain();
  carrier.type = 'sine';
  modulator.type = 'sine';
  modulator.frequency.value = 280;
  modGain.gain.value = 150;
  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(cGain);
  cGain.connect(dest);
  let t = t0;
  melody.forEach(n => {
    if (n.f > 0) {
      carrier.frequency.setValueAtTime(n.f, t);
      modulator.frequency.setValueAtTime(n.f * 0.5, t);
      cGain.gain.setValueAtTime(0.08, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + n.d * 0.9);
    } else {
      cGain.gain.setValueAtTime(0.001, t);
    }
    t += n.d;
  });
  carrier.start(t0); carrier.stop(t + 0.05);
  modulator.start(t0); modulator.stop(t + 0.05);
  all.push(carrier, modulator, modGain, cGain);
  const dur = t - t0;
  // Bass line
  const bass = [
    {f:N.A3,d:.6},{f:0,d:.6},{f:N.A3,d:.3},{f:N.E3,d:.3},
    {f:N.D3,d:.6},{f:0,d:.6},{f:N.D3,d:.3},{f:N.G3,d:.3},
    {f:N.C3,d:.6},{f:0,d:.3},{f:N.A3,d:.3},
    {f:N.G3,d:.6},{f:N.C3,d:.6},{f:0,d:.3},
  ];
  const rb = schedNotes(dest, 'triangle', bass, t0, 0.08);
  all.push(...rb.nodes);
  return { nodes: all, duration: Math.max(dur, rb.duration) };
}

// Era 5: 1999-2003 - CD-ROM ambient pads
function buildMusic_cd(ctx, dest, t0) {
  const all = [];
  const chords = [
    { notes: [N.C3, N.E3, N.G3], dur: 3 },
    { notes: [N.A3, N.C4, N.E4], dur: 3 },
    { notes: [N.F3, N.A3, N.C4], dur: 3 },
    { notes: [N.G3, N.B3, N.D4], dur: 3 },
  ];
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1;
  filter.connect(dest);
  all.push(filter);
  let t = t0;
  chords.forEach(ch => {
    ch.notes.forEach(freq => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(filter);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.8);
      g.gain.linearRampToValueAtTime(0.03, t + ch.dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.001, t + ch.dur);
      o.start(t);
      o.stop(t + ch.dur + 0.05);
      all.push(o, g);
    });
    t += ch.dur;
  });
  return { nodes: all, duration: t - t0 };
}

// Era 6: 2004-2008 - Modern electronic
function buildMusic_modern(ctx, dest, t0) {
  const all = [];
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 5;
  filter.connect(dest);
  all.push(filter);
  // Filter sweep
  filter.frequency.setValueAtTime(400, t0);
  filter.frequency.linearRampToValueAtTime(2000, t0 + 4);
  filter.frequency.linearRampToValueAtTime(400, t0 + 8);
  // Synth lead
  const lead = [
    {f:N.A4,d:.25},{f:0,d:.25},{f:N.E4,d:.25},{f:N.G4,d:.25},
    {f:N.A4,d:.5},{f:N.C5,d:.25},{f:N.B4,d:.25},
    {f:N.G4,d:.25},{f:0,d:.25},{f:N.E4,d:.25},{f:N.D4,d:.25},
    {f:N.C4,d:.5},{f:0,d:.5},
    {f:N.E4,d:.25},{f:N.G4,d:.25},{f:N.A4,d:.5},
    {f:N.G4,d:.25},{f:N.E4,d:.25},{f:N.D4,d:.5},
    {f:N.C4,d:.5},{f:N.E4,d:.5},{f:0,d:.5},
  ];
  const rl = schedNotes(filter, 'sawtooth', lead, t0, 0.08);
  all.push(...rl.nodes);
  // Kick pattern (sine pitch drop)
  for (let i = 0; i < 16; i++) {
    const kt = t0 + i * 0.5;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, kt);
    o.frequency.exponentialRampToValueAtTime(40, kt + 0.15);
    g.gain.setValueAtTime(0.15, kt);
    g.gain.exponentialRampToValueAtTime(0.001, kt + 0.2);
    o.connect(g); g.connect(dest);
    o.start(kt); o.stop(kt + 0.25);
    all.push(o, g);
  }
  return { nodes: all, duration: 8 };
}

// Era 7: 2009-2013 - Indie chiptune revival
function buildMusic_indie(ctx, dest, t0) {
  const all = [];
  // Chiptune melody
  const melody = [
    {f:N.C5,d:.2},{f:N.E5,d:.2},{f:N.G5,d:.2},{f:N.E5,d:.2},
    {f:N.C5,d:.2},{f:N.D5,d:.4},{f:0,d:.2},
    {f:N.A4,d:.2},{f:N.C5,d:.2},{f:N.E5,d:.4},
    {f:N.D5,d:.2},{f:N.C5,d:.2},{f:N.A4,d:.4},{f:0,d:.2},
    {f:N.G4,d:.2},{f:N.A4,d:.2},{f:N.C5,d:.4},
    {f:N.E5,d:.2},{f:N.D5,d:.2},{f:N.C5,d:.4},{f:0,d:.4},
  ];
  const r1 = schedNotes(dest, 'square', melody, t0, 0.08);
  all.push(...r1.nodes);
  // Filtered pad behind
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  filter.connect(dest);
  all.push(filter);
  const padNotes = [
    {notes:[N.C3,N.E3,N.G3],dur:2.5},{notes:[N.A3,N.C4,N.E4],dur:2.5},
    {notes:[N.F3,N.A3,N.C4],dur:2.5},{notes:[N.G3,N.B3,N.D4],dur:2.5},
  ];
  let t = t0;
  padNotes.forEach(ch => {
    ch.notes.forEach(freq => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq;
      o.connect(g); g.connect(filter);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t + ch.dur);
      o.start(t); o.stop(t + ch.dur + 0.05);
      all.push(o, g);
    });
    t += ch.dur;
  });
  return { nodes: all, duration: Math.max(r1.duration, t - t0) };
}

// Era 8: 2014+ - Lo-fi beats
function buildMusic_lofi(ctx, dest, t0) {
  const all = [];
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;
  filter.connect(dest);
  all.push(filter);
  // Soft melody
  const melody = [
    {f:N.E4,d:.5},{f:N.G4,d:.5},{f:N.A4,d:.75},{f:0,d:.25},
    {f:N.B4,d:.5},{f:N.A4,d:.5},{f:N.G4,d:.75},{f:0,d:.5},
    {f:N.E4,d:.5},{f:N.D4,d:.5},{f:N.C4,d:.75},{f:0,d:.25},
    {f:N.D4,d:.5},{f:N.E4,d:.5},{f:N.G4,d:.75},{f:0,d:.5},
    {f:N.A4,d:.75},{f:N.G4,d:.5},{f:N.E4,d:.75},{f:0,d:.5},
    {f:N.D4,d:.5},{f:N.C4,d:.75},{f:0,d:.75},
  ];
  const rm = schedNotes(filter, 'triangle', melody, t0, 0.08);
  all.push(...rm.nodes);
  // Sine bass
  const bass = [
    {f:N.C3,d:1},{f:0,d:.5},{f:N.A3,d:1},{f:0,d:.5},
    {f:N.F3,d:1},{f:0,d:.5},{f:N.G3,d:1},{f:0,d:.5},
    {f:N.C3,d:1},{f:0,d:.5},{f:N.G3,d:1},{f:0,d:.5},
  ];
  const rb = schedNotes(filter, 'sine', bass, t0, 0.1);
  all.push(...rb.nodes);
  // Vinyl crackle noise
  const bufLen = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const nf = ctx.createBiquadFilter();
  nf.type = 'highpass'; nf.frequency.value = 1000;
  noise.connect(nf); nf.connect(dest);
  const dur = Math.max(rm.duration, rb.duration);
  noise.start(t0); noise.stop(t0 + dur + 0.05);
  all.push(noise, nf);
  return { nodes: all, duration: dur };
}

// --- MUSIC CONTROLLER ---
function cleanupMusic() {
  musicNodes.forEach(n => { try { n.stop?.(); } catch {} try { n.disconnect(); } catch {} });
  musicNodes = [];
}
function stopMusic() {
  if (musicLoopId) { clearTimeout(musicLoopId); musicLoopId = null; }
  cleanupMusic();
  curMusicEra = null;
}
function startMusicLoop(era) {
  if (!audioCtx || S.musicVol === 0) return;
  const r = era.build(audioCtx, musicGain, audioCtx.currentTime);
  musicNodes = r.nodes;
  musicLoopId = setTimeout(() => {
    cleanupMusic();
    startMusicLoop(era);
  }, (r.duration - 0.1) * 1000);
}
function updateMusic() {
  if (_dbgMusicOverride) return;
  if (!audioCtx || S.musicVol === 0) { if (curMusicEra) stopMusic(); return; }
  const year = currentYear();
  const era = MUSIC_ERAS.find(e => year <= e.max) || MUSIC_ERAS[MUSIC_ERAS.length - 1];
  if (era.id === curMusicEra) return;
  // Crossfade
  if (curMusicEra) {
    const vol = S.musicVol;
    musicGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    setTimeout(() => {
      stopMusic();
      curMusicEra = era.id;
      musicGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      musicGain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.5);
      startMusicLoop(era);
    }, 500);
  } else {
    curMusicEra = era.id;
    startMusicLoop(era);
  }
}

