// ========== BUBBLE MINIGAME ==========
const BUGS = ['\uD83D\uDC1B','\uD83E\uDEB2','\uD83D\uDC1C','\uD83E\uDD97','\uD83D\uDD77\uFE0F','\uD83D\uDC1E'];
const _bub = {
  timer: 0,
  INTERVAL: 10,        // normal: spawn every 10s
  AIM_INTERVAL: 1.0,   // aim trainer: spawn every 1s at 1x
  DESPAWN: 5000,        // normal: 5s despawn
  AIM_DESPAWN: 1000,    // aim trainer: 1s to click at 1x
  activeMul: 1,
  mulEnd: 0,
  activeEl: null,
  aimActive: false,     // aim trainer toggle state
  aimLog: [],           // rolling accuracy log [{t, hit}]
  aimToggleEl: null,
  aimAccEl: null,
  aimSlidersEl: null,
  despawnTimeout: null,
  aimSpeed: 1,         // speed multiplier (0.25 to 4)
  aimSize: 28,         // bubble size in px (12 to 56)
};

function bubbleInitAimUI() {
  const container = document.querySelector('.left');
  if (!container || _bub.aimToggleEl) return;
  container.style.position = 'relative';
  // Toggle button
  const tog = document.createElement('button');
  tog.className = 'aim-toggle';
  tog.textContent = '\uD83C\uDFAF AIM';
  tog.addEventListener('click', (e) => {
    e.stopPropagation();
    _bub.aimActive = !_bub.aimActive;
    tog.classList.toggle('active', _bub.aimActive);
    if (_bub.aimSlidersEl) _bub.aimSlidersEl.classList.toggle('show', _bub.aimActive);
    if (_bub.aimActive) {
      _bub.aimLog = [];
      _bub.timer = _bub.AIM_INTERVAL / _bub.aimSpeed; // spawn immediately
    } else {
      // Remove active bubble when toggling off
      if (_bub.activeEl) { _bub.activeEl.remove(); _bub.activeEl = null; }
      if (_bub.despawnTimeout) { clearTimeout(_bub.despawnTimeout); _bub.despawnTimeout = null; }
      _bub.aimLog = [];
    }
    aimAccUpdate();
  });
  container.appendChild(tog);
  _bub.aimToggleEl = tog;
  // Accuracy readout
  const acc = document.createElement('div');
  acc.className = 'aim-acc';
  container.appendChild(acc);
  _bub.aimAccEl = acc;
  // Sliders panel
  const sliders = document.createElement('div');
  sliders.className = 'aim-sliders';
  // Speed slider
  const spdLbl = document.createElement('label');
  spdLbl.innerHTML = '\u26A1 Speed';
  const spdVal = document.createElement('span'); spdVal.className = 'aim-val'; spdVal.textContent = '1.0x';
  const spdSlider = document.createElement('input');
  spdSlider.type = 'range'; spdSlider.min = '-2'; spdSlider.max = '2'; spdSlider.step = '0.25'; spdSlider.value = '0';
  spdSlider.addEventListener('input', (e) => {
    e.stopPropagation();
    _bub.aimSpeed = Math.pow(2, +spdSlider.value);
    spdVal.textContent = _bub.aimSpeed.toFixed(1) + 'x';
  });
  spdSlider.addEventListener('click', (e) => e.stopPropagation());
  spdLbl.append(spdSlider, spdVal);
  sliders.appendChild(spdLbl);
  // Size slider
  const sizeLbl = document.createElement('label');
  sizeLbl.innerHTML = '\uD83D\uDD35 Size';
  const sizeVal = document.createElement('span'); sizeVal.className = 'aim-val'; sizeVal.textContent = '28px';
  const sizeSlider = document.createElement('input');
  sizeSlider.type = 'range'; sizeSlider.min = '12'; sizeSlider.max = '56'; sizeSlider.step = '2'; sizeSlider.value = '28';
  sizeSlider.addEventListener('input', (e) => {
    e.stopPropagation();
    _bub.aimSize = +sizeSlider.value;
    sizeVal.textContent = _bub.aimSize + 'px';
  });
  sizeSlider.addEventListener('click', (e) => e.stopPropagation());
  sizeLbl.append(sizeSlider, sizeVal);
  sliders.appendChild(sizeLbl);
  container.appendChild(sliders);
  _bub.aimSlidersEl = sliders;
  // Miss detection: clicks on .left that don't hit a bubble
  container.addEventListener('click', (e) => {
    if (!_bub.aimActive) return;
    if (e.target.closest('.bubble') || e.target.closest('.aim-toggle') || e.target.closest('.aim-sliders') || e.target.closest('#mon')) return;
    // Missed — penalize
    _bub.aimLog.push({ t: performance.now(), hit: false });
    _bub.activeMul = 0.5;
    _bub.mulEnd = performance.now() + 10000;
    aimAccUpdate();
    float(e.clientX - 15, e.clientY - 20, 'MISS!');
  });
}

function _aimAcc() {
  const cutoff = performance.now() - 60000;
  let hits = 0, total = 0;
  for (let i = _bub.aimLog.length - 1; i >= 0; i--) {
    if (_bub.aimLog[i].t < cutoff) break;
    total++; if (_bub.aimLog[i].hit) hits++;
  }
  return { hits, total, pct: total > 0 ? (hits / total) * 100 : 0 };
}
function aimbotMul() {
  if (!_bub.aimActive) return 1;
  const a = _aimAcc();
  if (a.total === 0) return 1;
  const diff = _bub.aimSpeed * (28 / _bub.aimSize);
  return 1 + diff * (a.pct / 100) * 0.60;
}
function aimAccUpdate() {
  if (!_bub.aimAccEl) return;
  if (_bub.aimActive) {
    const a = _aimAcc();
    const mul = aimbotMul();
    if (a.total > 0) {
      _bub.aimAccEl.textContent = '\uD83C\uDFAF ' + a.pct.toFixed(1) + '% (' + a.hits + '/' + a.total + ') \u00B7 ' + mul.toFixed(2) + '\u00D7';
    } else {
      _bub.aimAccEl.textContent = '\uD83C\uDFAF 0/0';
    }
    _bub.aimAccEl.classList.add('show');
  } else {
    _bub.aimAccEl.classList.remove('show');
  }
}

function bubbleSpawn() {
  if (_bub.activeEl) return;
  const container = document.querySelector('.left');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const aim = _bub.aimActive;
  const isGood = true;
  const el = document.createElement('div');
  el.className = 'bubble ' + (aim ? 'bug' : 'blue');
  const sz = aim ? _bub.aimSize : 28;
  if (aim) { el.style.width = sz + 'px'; el.style.height = sz + 'px'; el.style.fontSize = Math.max(12, sz * 0.75) + 'px'; el.textContent = BUGS[Math.floor(Math.random() * BUGS.length)]; }
  const margin = 30;
  const x = margin + Math.random() * (rect.width - margin * 2 - sz);
  const y = margin + Math.random() * (rect.height - margin * 2 - sz);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    bubblePop(el, isGood);
  });
  container.style.position = 'relative';
  container.appendChild(el);
  _bub.activeEl = el;
  const despawn = aim ? _bub.AIM_DESPAWN / _bub.aimSpeed : _bub.DESPAWN;
  _bub.despawnTimeout = setTimeout(() => {
    if (_bub.activeEl === el) {
      el.remove();
      _bub.activeEl = null;
      if (aim) { _bub.aimLog.push({ t: performance.now(), hit: false }); aimAccUpdate(); }
    }
  }, despawn);
}

function bubblePop(el, isGood) {
  const container = el.parentElement;
  el.remove();
  _bub.activeEl = null;
  if (_bub.despawnTimeout) { clearTimeout(_bub.despawnTimeout); _bub.despawnTimeout = null; }
  // Pop animation
  const pop = document.createElement('div');
  pop.className = 'bubble-pop';
  pop.style.left = el.style.left;
  pop.style.top = el.style.top;
  pop.style.background = _bub.aimActive
    ? 'radial-gradient(circle,#ffe066,#d4a017)'
    : 'radial-gradient(circle,#6eb5ff,#1a6eff)';
  container.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove());
  // Apply effect
  if (isGood) {
    if (_bub.aimActive) {
      _bub.aimLog.push({ t: performance.now(), hit: true });
      // Bug kill reward: 5× click power
      const reward = 5 * clickPow() * streakMul * acPenalty() * aimbotMul();
      // v7.3: bug-kill reward goes to the active type's resource (matches click target)
      engAddRes(activeType(), reward);
      const bRect = container.getBoundingClientRect();
      float(bRect.left + parseFloat(el.style.left) + 10, bRect.top + parseFloat(el.style.top) - 5, '+' + fmt(reward));
      aimAccUpdate();
    } else {
      _bub.activeMul = 2;
      _bub.mulEnd = performance.now() + 10000;
      toast('\uD83D\uDD35 Code Rush! 2\u00d7 production for 10s');
    }
  }
  playSfx('click');
}

function bubbleTick(dt) {
  const interval = _bub.aimActive ? _bub.AIM_INTERVAL / _bub.aimSpeed : _bub.INTERVAL;
  _bub.timer += dt;
  if (_bub.timer >= interval) {
    _bub.timer = 0;
    bubbleSpawn();
  }
  if (_bub.activeMul !== 1 && performance.now() >= _bub.mulEnd) {
    _bub.activeMul = 1;
  }
  // Trim old aim log entries (>60s) and refresh accuracy display
  if (_bub.aimActive && _bub.aimLog.length > 0) {
    const cutoff = performance.now() - 60000;
    while (_bub.aimLog.length > 0 && _bub.aimLog[0].t < cutoff) _bub.aimLog.shift();
    aimAccUpdate();
  }
  // Show/hide aim trainer toggle based on fame unlock
  if (S.f.aimTrainer && !_bub.aimToggleEl) bubbleInitAimUI();
  if (_bub.aimToggleEl) _bub.aimToggleEl.style.display = S.f.aimTrainer ? '' : 'none';
}

function bubbleMul() { return _bub.activeMul * aimbotMul(); }

function doClick(e) {
  acRecord(e);
  if (acCheck()) return; // infestation just triggered, swallow click
  ensureAudio();
  playSfx('click');
  let pw = clickPow() * streakMul * acPenalty() * bubbleMul();
  // Precision Click: +1% of LoC/s per click per level
  if (S.f.clickPrecision) pw += lps() * 0.01 * S.f.clickPrecision * acPenalty() * bubbleMul();
  // Combo Breaker: +0.1% LoC/s per click per streak per level
  if (S.f.streakCombo) pw += lps() * 0.001 * S.f.streakCombo * Math.floor(streakMul) * acPenalty() * bubbleMul();
  // Lucky Click: 8% chance per level of 15× click
  if (S.f.clickLucky && Math.random() < 0.08 * S.f.clickLucky) { pw *= 15; float(e.clientX + 10, e.clientY - 40, '\u2728 LUCKY!'); }
  // v7.3: clicks now generate the active engineer type's resource
  engAddRes(activeType(), pw);
  const nowClick = performance.now();
  ctPush(nowClick);
  lastClickTime = nowClick;
  // Immediate streak response on click
  ctTrim(nowClick - STREAK_WINDOW);
  if (S.f.streakUnlock && _ctN / STREAK_DIV >= 3) {
    const sMax = 2 + S.f.streakPower + 2 * S.f.streakTurbo;
    streakMul = Math.min(sMax, streakMul + 0.08);
    updateThermo();
  }
  scr.classList.add('pulse');
  setTimeout(() => scr.classList.remove('pulse'), 150);
  float(e.clientX - 15, e.clientY - 20, '+' + fmt(pw));
  // Add a line of code to the screen
  const _catKey = CAT_MAP[getLandmark(currentYear()).cat];
  const _cbl = (_catKey && CAT_CODE[_catKey]) || CB_CODE_LINES[Math.min(S.cb, CB_CODE_LINES.length - 1)] || CB_CODE_LINES[0];
  codeVisible.push(_cbl[codeIdx % _cbl.length]);
  codeIdx++;
  if (codeVisible.length > 10) codeVisible.shift();
  scr.textContent = codeVisible.join('\n');
}

let buyQty = 1; // 1, 5, 25, or Infinity (max)

function bulkCost(baseFn, owned, n) {
  let total = 0;
  for (let k = 0; k < n; k++) total += baseFn(owned + k);
  return total;
}
function gBulkCost(i, n) { return bulkCost(k => gCostAt(i, k), S.g[i], n); }
function cBulkCost(i, n) { return bulkCost(k => Math.floor(CLK[i].base * CLK[i].gr ** k), S.c[i], n); }
function maxAfford(costFn, owned) {
  let n = 0, total = 0;
  while (true) {
    const c = costFn(owned + n);
    if (total + c > S.loc) break;
    total += c; n++;
  }
  return n;
}
function gMax(i) { return maxAfford(k => gCostAt(i, k), S.g[i]); }
function cMax(i) { return maxAfford(k => Math.floor(CLK[i].base * CLK[i].gr ** k), S.c[i]); }
function effectiveQty(maxFn, i) { return buyQty === Infinity ? maxFn(i) : Math.min(buyQty, maxFn(i)); }

function buyGen(i) {
  let n = effectiveQty(gMax, i);
  if (buyQty !== Infinity && buyQty > 1 && n < buyQty) return;
  if (n < 1) return;
  const c = gBulkCost(i, n);
  if (S.loc < c) return;
  S.loc -= c;
  const wasZero = S.g[i] === 0;
  S.g[i] += n;
  markDirty();
  const gName = ta('gen_'+i+'_name', GEN[i].name);
  log(t('hired') + (n > 1 ? ' ' + n + '× ' : ': ') + gName);
  playSfx('buy');
}

// ========== CODER PACK SYSTEM (v6.8) ==========
const FIRST_NAMES = ['Alex','Jordan','Taylor','Morgan','Casey','Riley','Sam','Jamie','Quinn','Avery','Blake','Drew','Reese','Skyler','Rowan','Sage','Finley','Hayden','Kai','Logan','Parker','Emerson','Dakota','Harper','Robin','Eden','Nico','Remy','Tatum','Marlowe','Arden','Bailey','Carson','Devon','Ellis','Frankie','Gray','Indigo','Jesse','Kendall'];
const LAST_NAMES = ['Smith','Chen','Patel','Garcia','Kim','Nguyen','Johnson','Rivera','Lee','Khan','Brown','Park','Singh','Lopez','Ivanov','Fischer','Nakamura','O\u2019Brien','Dubois','Costa','Ng','Rossi','Yamamoto','Kowalski','Andersen','Tanaka','Silva','Hassan','Novak','Berg','Ruiz','Walsh','Morozov','Vega','Suzuki','Hoffmann','Mbeki','Liu','Rahman','Volkov'];
const RARITY_NAMES = ['Common','Uncommon','Rare','Epic','Legendary'];
const RARITY_CLS = ['r-c','r-u','r-r','r-e','r-l'];
const EDU_NAMES = ['Bootcamp','Associate','Bachelor','Master','PhD'];
// Rarity -> edu range [min, max]
const RARITY_EDU = [[0,1],[1,2],[2,3],[3,4],[4,4]];

function rollName() {
  return FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)] + ' ' +
         LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)];
}
function rollRarity() {
  const r = Math.random();
  if (r < 0.60) return 0;
  if (r < 0.85) return 1;
  if (r < 0.95) return 2;
  if (r < 0.99) return 3;
  return 4;
}
function computeTier(edu, exp, seed) {
  const score = edu * 2 + Math.floor(exp / 2);
  const base = Math.floor(score / 2);
  const jitter = seed < 0.33 ? -1 : seed < 0.66 ? 0 : 1;
  return Math.max(0, Math.min(GEN.length - 1, base + jitter));
}
// v7.1: Per-coder production multipliers — rarity + experience
// Commons stay neutral (1.0) so new-player pack feel is unchanged.
// Rare-tier multipliers interact with tier correlation (high rarities land
// in high tiers), so measured buff on a natural roster is ~25% — treated as
// a v7.1 launch bonus for existing saves.
const RARITY_MUL = [1.00, 1.08, 1.22, 1.50, 2.00]; // C, U, R, E, L
function coderProdMul(c) {
  const r = RARITY_MUL[c.rarity] || 1;
  // +1% per year of exp, soft-capped at +50%
  const e = 1 + Math.min(0.50, 0.01 * (c.exp || 0));
  return r * e;
}
// v7.2: Tier set bonuses — same thresholds for every coder tier, applied independently.
// Highest met threshold wins per tier; sum across all tiers becomes _C.tierSynergyMul.
const SET_TIERS = [
  { n: 3,  bonus: 0.05 },
  { n: 10, bonus: 0.10 },
  { n: 25, bonus: 0.20 },
];
function setTierBonus(count) {
  let b = 0;
  for (const t of SET_TIERS) if (count >= t.n) b = t.bonus;
  return b;
}
function rollCoder() {
  const rarity = rollRarity();
  const [eMin, eMax] = RARITY_EDU[rarity];
  const edu = eMin + Math.floor(Math.random() * (eMax - eMin + 1));
  const exp = 0;
  const seed = Math.random();
  const age = (18 + edu * 2) + Math.floor(Math.random() * 5);
  const retireAge = Math.min(78, 57 + edu * 2 + Math.floor(Math.random() * (11 + edu * 2)));
  const c = { name: rollName(), edu, exp, rarity, seed, tier: 0, age, retireAge };
  c.tier = computeTier(edu, exp, seed);
  return c;
}
function recomputeG() {
  // v7.3: S.g still tracks tier counts but now reflects ALL engineer types combined.
  // This keeps lunchBonus(), Synergy/Code Review, and Trainer auto-pick working
  // across all types without per-type branching.
  for (let i = 0; i < GEN.length; i++) S.g[i] = 0;
  for (const c of (S.coders || [])) S.g[c.tier]++;
  if (S.engineers) {
    for (const k in S.engineers) {
      for (const c of (S.engineers[k].list || [])) {
        if (c.tier >= 0 && c.tier < GEN.length) S.g[c.tier]++;
      }
    }
  }
}
function recruiterPackDiscount() {
  const count = (S.ss && S.ss[SS.RECRUITER]) || 0;
  const tlvl = (S.trainerSSLvl && S.trainerSSLvl[SS.RECRUITER]) || 0;
  // v7.4: Executive Retainer (ru[2]) doubles the per-level discount rate
  const perLvl = 0.02 * ((S.ru && S.ru[2]) ? 2 : 1);
  const effective = count * (1 + 0.02 * tlvl);
  let mul = Math.max(0.3, 1 - perLvl * effective);
  if (S.c && S.c[P.MEETING]) mul *= 0.85;
  // v7.4: Headhunter Network (ru[0]) flat -15% on pack cost
  if (S.ru && S.ru[0]) mul *= 0.85;
  return mul;
}
// v9.5: hire size — base 1, +1 with Recruiting Drive upgrade
function packSize() {
  return PACK_SIZE + ((S.ru && S.ru[1]) ? 1 : 0);
}
// v6.9: Office tiers — cap = max coders in roster, prod = flat production multiplier
const OFFICES = [
  { name: 'Garage',        cap:  20, cost: 0,      prod: 1.00 },
  { name: 'Coworking Desk',cap:  35, cost: 5e3,    prod: 1.10 },
  { name: 'Startup Loft',  cap:  55, cost: 1e5,    prod: 1.20 },
  { name: 'Small Office',  cap:  85, cost: 3e6,    prod: 1.35 },
  { name: 'Open Floor',    cap: 130, cost: 1e8,    prod: 1.55 },
  { name: 'Tower Floor',   cap: 200, cost: 5e9,    prod: 1.80 },
  { name: 'Company HQ',    cap: 300, cost: 2.5e11, prod: 2.10 },
  { name: 'Campus',        cap: 500, cost: 1e13,   prod: 2.50 },
];
// v7.3: per-type office helpers — each engineer type has its own office level
function officeLvl(type) {
  type = type || activeType();
  const v = (S.offices && typeof S.offices[type] === 'number') ? S.offices[type] : 0;
  return Math.max(0, Math.min(OFFICES.length - 1, v));
}
function officeTier(type) { return OFFICES[officeLvl(type)]; }
function coderCap(type) { return officeTier(type).cap; }
function officeProdMul(type) { return officeTier(type).prod; }
function officeCost(type) {
  type = type || activeType();
  const next = officeLvl(type) + 1;
  if (next >= OFFICES.length) return Infinity;
  // v7.7: scale by type's packBase so later types pay proportionally more
  const meta = ENG_TYPE_MAP[type];
  const typeScale = (meta && meta.packBase) ? meta.packBase / 100 : 1;
  return Math.floor(OFFICES[next].cost * typeScale * shipInflation());
}
// v9.5: single-engineer hires. Recruiting Drive (ru[1]) adds +1.
const PACK_SIZE = 1;
// v7.3: pack-fit check counts ONLY the active type's roster against its own office cap
function canFitPack() {
  const t = activeType();
  return engList(t).length + packSize() <= coderCap(t);
}
function buyOffice() {
  const t = activeType();
  const next = officeLvl(t) + 1;
  if (next >= OFFICES.length) return;
  const cost = officeCost(t);
  if (engRes(t) < cost) { toast('Not enough ' + (ENG_TYPE_MAP[t] ? ENG_TYPE_MAP[t].res : 'LoC')); return; }
  if (!engSubRes(t, cost)) return;
  if (!S.offices) S.offices = Object.fromEntries(ENG_TYPES.map(e => [e.key, 0]));
  if (typeof S.offices[t] !== 'number') S.offices[t] = 0;
  S.offices[t] = next;
  if (t === 'coder') S.office = next; // keep legacy field in sync for any old reader
  markDirty();
  // Invalidate sprite cache since cap changed (empty desk count)
  if (typeof _ofc !== 'undefined') _ofc.spriteCache = [];
  playSfx('buy');
  log('\u{1F3E2} ' + (ENG_TYPE_MAP[t] ? ENG_TYPE_MAP[t].name : 'Coder') + ' team moved to ' + OFFICES[next].name);
}
function packCostAt(aType, rosterSize) {
  const meta = ENG_TYPE_MAP[aType];
  const base = (meta && meta.packBase) || 100;
  const growth = Math.pow(2, rosterSize / 5) + 8 * (1 - Math.pow(2, -rosterSize / 2));
  return Math.floor(base * growth * recruiterPackDiscount() * (_C.hireCostMul || 1) * shipInflation());
}
function packCost() {
  return packCostAt(activeType(), engList(activeType()).length);
}
// v9.0: bulk pack helpers — cost escalates after each pack since roster grows
function bulkPackInfo(qty) {
  const aType = activeType();
  const ps = packSize();
  const cap = coderCap(aType);
  let roster = engList(aType).length;
  let res = engRes(aType);
  let total = 0, count = 0;
  const limit = qty === Infinity ? 9999 : qty;
  for (let i = 0; i < limit; i++) {
    if (roster + ps > cap) break;
    const c = packCostAt(aType, roster);
    if (qty === Infinity && res < total + c) break;
    total += c;
    roster += ps;
    count++;
  }
  return { count, totalCost: total };
}
// v7.2: severance cost — 500 base, ×1.25 per fire, resets on ship
function fireCost() {
  return Math.floor(500 * Math.pow(1.25, S.fireCount || 0));
}
function buyPack() {
  const aType = activeType();
  if (!canFitPack()) { toast('Office full \u2014 upgrade office'); return; }
  const info = bulkPackInfo(buyQty);
  // For fixed quantities (x5, x25) require all packs affordable; for max buy what we can
  if (buyQty !== Infinity && buyQty > 1 && info.count < buyQty) {
    if (info.count === 0 && engRes(aType) < packCost()) {
      toast('Not enough ' + (ENG_TYPE_MAP[aType] ? ENG_TYPE_MAP[aType].res : 'LoC'));
    } else if (info.count < buyQty) {
      toast('Can only afford ' + info.count + ' hire' + (info.count !== 1 ? 's' : ''));
    }
    return;
  }
  if (info.count < 1) { toast('Not enough ' + (ENG_TYPE_MAP[aType] ? ENG_TYPE_MAP[aType].res : 'LoC')); return; }
  if (engRes(aType) < info.totalCost) { toast('Not enough ' + (ENG_TYPE_MAP[aType] ? ENG_TYPE_MAP[aType].res : 'LoC')); return; }
  engSubRes(aType, info.totalCost);
  const pulls = [];
  const ps = packSize();
  for (let p = 0; p < info.count; p++)
    for (let k = 0; k < ps; k++) pulls.push(rollCoder());
  engList(aType).push(...pulls);
  recomputeG();
  markDirty();
  playSfx('buy');
  const counts = [0,0,0,0,0];
  pulls.forEach(c => counts[c.rarity]++);
  const summary = counts.map((n,i) => n ? n + RARITY_NAMES[i][0] : '').filter(Boolean).join(' ');
  log('\u{1F4E6} Hired ' + pulls.length + ' engineer' + (pulls.length !== 1 ? 's' : '') + ': ' + summary);
  showPackReveal(pulls);
}
function showPackReveal(pulls) {
  // Remove any existing reveal overlay first
  const old = document.querySelector('.pack-reveal');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'pack-reveal';
  const dlg = document.createElement('div');
  dlg.className = 'pack-dialog';
  const titleBar = document.createElement('div');
  titleBar.className = 'pack-dialog-title';
  const titleTxt = document.createElement('span');
  titleTxt.textContent = 'New Hires';
  const closeBtn = document.createElement('span');
  closeBtn.className = 'dlg-close';
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); ov.remove(); });
  titleBar.appendChild(titleTxt);
  titleBar.appendChild(closeBtn);
  dlg.appendChild(titleBar);
  const row = document.createElement('div');
  row.className = 'pack-reveal-row';
  pulls.forEach(c => {
    const card = document.createElement('div');
    card.className = 'pack-card ' + RARITY_CLS[c.rarity];
    card.innerHTML =
      coderSVG(c.tier, 0, 0, 0) +
      '<div class="pc-name">' + c.name + '</div>' +
      '<div class="pc-rarity ' + RARITY_CLS[c.rarity] + '">' + RARITY_NAMES[c.rarity] + '</div>' +
      '<div class="pc-info">' + EDU_NAMES[c.edu] + ' \u2022 Age ' + c.age + '</div>' +
      '<div class="pc-tier">' + GEN[c.tier].name + '</div>';
    row.appendChild(card);
  });
  dlg.appendChild(row);
  const okBtn = document.createElement('button');
  okBtn.className = 'pack-dialog-ok';
  okBtn.textContent = 'OK';
  okBtn.addEventListener('click', (e) => { e.stopPropagation(); ov.remove(); });
  dlg.appendChild(okBtn);
  dlg.addEventListener('click', (e) => e.stopPropagation());
  ov.appendChild(dlg);
  ov.addEventListener('click', () => ov.remove());
  document.body.appendChild(ov);
}

function showRetirePopup(retired) {
  const old = document.querySelector('.retire-ov');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'retire-ov';
  const panel = document.createElement('div');
  panel.className = 'retire-panel';
  const title = document.createElement('div');
  title.className = 'retire-title';
  const titleTxt = document.createElement('span');
  titleTxt.textContent = '\u{1F382} ' + retired.length + ' Engineer' + (retired.length > 1 ? 's' : '') + ' Retired';
  const closeBtn = document.createElement('span');
  closeBtn.className = 'dlg-close';
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); ov.remove(); });
  title.appendChild(titleTxt);
  title.appendChild(closeBtn);
  panel.appendChild(title);
  retired.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'retire-card';
    card.style.animationDelay = (i * 0.08) + 's';
    const tierName = GEN[c.tier] ? GEN[c.tier].name : '?';
    const eduName = EDU_NAMES[c.edu] || '?';
    const rarityName = RARITY_NAMES[c.rarity] || '?';
    const rarityCls = RARITY_CLS[c.rarity] || '';
    card.innerHTML =
      coderSVG(c.tier, 0, 0, 0) +
      '<div class="retire-card-info">' +
        '<div class="retire-card-name">' + c.name + '</div>' +
        '<div class="retire-card-stats">' +
          '<span class="' + rarityCls + '">' + rarityName + '</span>' +
          '<span>' + tierName + '</span>' +
          '<span>' + eduName + '</span>' +
          '<span>Age ' + c.age + '</span>' +
          '<span>' + (c.exp || 0) + ' yr exp</span>' +
        '</div>' +
      '</div>';
    panel.appendChild(card);
  });
  const btn = document.createElement('button');
  btn.className = 'retire-dismiss';
  btn.textContent = 'OK';
  btn.addEventListener('click', (e) => { e.stopPropagation(); ov.remove(); });
  panel.appendChild(btn);
  panel.addEventListener('click', (e) => e.stopPropagation());
  ov.appendChild(panel);
  ov.addEventListener('click', () => ov.remove());
  document.body.appendChild(ov);
}

function buyClk(i) {
  if (S.c[i] >= 1) return;
  const c = cCost(i);
  if (S.loc < c) return;
  S.loc -= c;
  S.c[i] = 1;
  markDirty();
  const cName = ta('clk_'+i+'_name', CLK[i].name);
  log(t('unlocked') + ': ' + cName);
  playSfx('buy');
}

function ssCost(i) { return Math.floor(SUPPORT[i].base * SUPPORT[i].gr ** S.ss[i] * shipInflation()); }
function buySS(i) {
  if (S.ss[i] >= 1) return;
  const c = ssCost(i);
  if (S.loc < c) return;
  S.loc -= c;
  S.ss[i] = 1;
  markDirty();
  const sName = ta('sup_'+i+'_name', SUPPORT[i].name);
  log(t('hired') + ': ' + sName);
  playSfx('buy');
}

// Recruiter training upgrades
function ruCost(ui) { return Math.floor(RECRUITER_UPS[ui].baseCost * RECRUITER_UPS[ui].gr ** S.ru[ui] * shipInflation()); }
function buyRU(ui) {
  if (S.ru[ui] >= 1 || S.ss[SS.RECRUITER] < 1) return;
  const c = ruCost(ui);
  if (S.loc < c) return;
  S.loc -= c;
  S.ru[ui] = 1;
  markDirty();
  log(t('logTraining') + ': ' + ta('ru_'+ui+'_name', RECRUITER_UPS[ui].name));
}
// Shared training submenu update
function _updateTrainingSub(subId, rowClass, stateArr, costFn, staffIdx) {
  const sub = document.getElementById(subId);
  if (!sub || !sub.classList.contains('show')) return;
  const rows = sub.querySelectorAll('.' + rowClass);
  rows.forEach((r, ui) => {
    const owned = stateArr[ui] >= 1;
    const c = costFn(ui);
    const afford = !owned && S.loc >= c && S.ss[staffIdx] >= 1;
    r.querySelector('.eu-row-cost').textContent = owned ? '' : fmt(c);
    r.querySelector('.eu-row-lvl').textContent = owned ? '\u2713' : '';
    r.classList.toggle('no', !afford && !owned);
    r.style.opacity = owned ? '.6' : '';
    r.style.cursor = owned ? 'default' : '';
  });
}
function updateRUSub() { _updateTrainingSub('ru-sub', 'ru-row', S.ru, ruCost, SS.RECRUITER); }

// Facility Director training upgrades
function fuCost(ui) { return Math.floor(FACILITY_UPS[ui].baseCost * FACILITY_UPS[ui].gr ** S.fu[ui] * shipInflation()); }
function buyFU(ui) {
  if (S.fu[ui] >= 1 || S.ss[SS.FACILITY] < 1) return;
  const c = fuCost(ui);
  if (S.loc < c) return;
  S.loc -= c;
  S.fu[ui] = 1;
  markDirty();
  log(t('logTraining') + ': ' + ta('fu_'+ui+'_name', FACILITY_UPS[ui].name));
}
function updateFUSub() { _updateTrainingSub('fu-sub', 'fu-row', S.fu, fuCost, SS.FACILITY); }

// ========== STAFF DIALOGUE ==========
function showStaffBubble(ssIdx, text) {
  const old = document.querySelector('.staff-bubble');
  if (old) old.remove();
  const row = document.querySelector('[data-a="ss"][data-i="'+ssIdx+'"]');
  if (!row) return;
  const rect = row.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'staff-bubble';
  const name = document.createElement('span');
  name.className = 'sb-name';
  name.style.color = STAFF_COLOURS[ssIdx];
  name.textContent = SUPPORT[ssIdx].name + ':';
  el.appendChild(name);
  el.appendChild(document.createTextNode(' ' + text));
  document.body.appendChild(el);
  // Position to the right of the row, clamped to viewport
  const bw = Math.min(280, window.innerWidth - 20);
  el.style.width = bw + 'px';
  el.style.left = Math.min(rect.right + 8, window.innerWidth - bw - 8) + 'px';
  el.style.top = Math.max(4, rect.top + (rect.height / 2) - 16) + 'px';
  el.addEventListener('animationend', e => { if (e.animationName === 'sbOut') el.remove(); });
  log('\uD83D\uDCAC ' + SUPPORT[ssIdx].name + ': ' + text);
}

function dialogueTick(dt) {
  // Need at least one owned staff member
  const owned = [];
  for (let i = 0; i < SUPPORT.length; i++) if (S.ss[i] >= 1) owned.push(i);
  if (owned.length === 0) return;
  _dlgTimer += dt;
  if (_dlgTimer < _dlgNext) return;
  _dlgTimer = 0;
  _dlgNext = 60 + Math.random() * 30;
  // Pick a random owned staff member
  const pick = owned[Math.floor(Math.random() * owned.length)];
  // Filter available lines for this staff
  const pool = [];
  for (let i = 0; i < STAFF_DIALOGUE.length; i++) {
    const d = STAFF_DIALOGUE[i];
    if (d.ss === pick && !_dlgRecent.includes(i) && d.check()) pool.push(i);
  }
  if (pool.length === 0) return;
  const lineIdx = pool[Math.floor(Math.random() * pool.length)];
  _dlgRecent.push(lineIdx);
  if (_dlgRecent.length > 5) _dlgRecent.shift();
  showStaffBubble(pick, STAFF_DIALOGUE[lineIdx].text);
}

