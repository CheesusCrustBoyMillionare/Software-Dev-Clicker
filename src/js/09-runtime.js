// ========== EVENT DELEGATION ==========
$('G').addEventListener('click', e => {
  ensureAudio();
  if (e.target.closest('#mon')) return doClick(e);
  // v6.8: Hire Pack button
  if (e.target.closest('#packHeader')) { buyPack(); return; }
  // v6.9: Upgrade Office button
  if (e.target.closest('#officeHeader')) { buyOffice(); return; }
  // Quantity selector
  const qBtn = e.target.closest('.qty-btn');
  if (qBtn) {
    buyQty = qBtn.dataset.q === 'Infinity' ? Infinity : +qBtn.dataset.q;
    document.querySelectorAll('.qty-btn').forEach(b => b.classList.toggle('active', b === qBtn));
    return;
  }
  // Pause toggle for support staff (Facility Director, Trainer)
  const pauseBtn = e.target.closest('.pause-toggle');
  if (pauseBtn) {
    e.stopPropagation();
    const idx = +pauseBtn.dataset.sp;
    S.sp[idx] = S.sp[idx] ? 0 : 1;
    pauseBtn.textContent = S.sp[idx] ? '\u25B6' : '\u23F8';
    pauseBtn.classList.toggle('paused', !!S.sp[idx]);
    return;
  }
  // Coder equipment toggle
  const tog = e.target.closest('.eu-toggle');
  if (tog) {
    e.stopPropagation();
    // v7.4: Recruiter upgrade submenu (shares .eu-toggle styling but has dedicated id)
    if (tog.id === 'ruToggle') {
      const sub = document.getElementById('ru-sub');
      const opening = !sub.classList.contains('show');
      if (opening) {
        document.querySelectorAll('.eu-sub.show').forEach(s => {
          s.classList.remove('show');
          const otherTog = s.previousElementSibling && s.previousElementSibling.querySelector('.eu-toggle');
          if (otherTog) { otherTog.classList.remove('open'); otherTog.textContent = '+'; }
        });
      }
      sub.classList.toggle('show', opening);
      tog.classList.toggle('open', opening);
      tog.textContent = opening ? '\u2212' : '+';
      if (opening) updateRUSub();
      return;
    }
    const gi = +tog.dataset.gi;
    const sub = document.getElementById('eu-sub-' + gi);
    const opening = !sub.classList.contains('show');
    // Close any other open submenu first
    if (opening) {
      document.querySelectorAll('.eu-sub.show').forEach(s => {
        s.classList.remove('show');
        const otherTog = s.previousElementSibling.querySelector('.eu-toggle');
        if (otherTog) { otherTog.classList.remove('open'); otherTog.textContent = '+'; }
      });
    }
    sub.classList.toggle('show', opening);
    tog.classList.toggle('open', opening);
    tog.textContent = opening ? '−' : '+';
    if (opening) updateEUSub(gi);
    return;
  }
  // v7.4: Recruiter upgrade buy
  const ruRow = e.target.closest('.ru-row');
  if (ruRow) {
    e.stopPropagation();
    buyRU(+ruRow.dataset.ui);
    updateRUSub();
    return;
  }
  // Coder equipment buy
  const euRow = e.target.closest('.eu-row');
  if (euRow) {
    const gi = +euRow.dataset.gi, ui = +euRow.dataset.ui;
    buyEU(gi, ui);
    updateEUSub(gi);
    return;
  }
  const up = e.target.closest('.up');
  if (up) {
    const a = up.dataset.a;
    // v6.8: per-tier 'g' buy disabled — tier rows are display-only; hiring is via Hire Pack
    if (a === 'c') buyClk(+up.dataset.i);
    else if (a === 'ss') buySS(+up.dataset.i);
    else if (a === 'f') buyFame(+up.dataset.b, +up.dataset.u);
    return;
  }
  // Launch bar click → ship confirmation
  if (e.target.closest('#progWrap') && document.getElementById('progWrap').classList.contains('ready')) {
    const cf = document.getElementById('shipConfirm');
    document.getElementById('shipWarnText').textContent = t('shipWarn');
    document.getElementById('shipYes').textContent = t('shipConfirm');
    document.getElementById('shipNo').textContent = t('shipCancel');
    cf.classList.toggle('show');
    // Dismiss tutorial on first click
    const tut = document.getElementById('shipTutorial');
    if (tut) tut.remove();
    return;
  }
  if (e.target.id === 'shipYes') { document.getElementById('shipConfirm').classList.remove('show'); ship(); return; }
  if (e.target.id === 'shipNo') { document.getElementById('shipConfirm').classList.remove('show'); return; }
});

// Accessibility: Enter/Space triggers click on focusable game elements
$('G').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const el = e.target.closest('.up, .eng-tab, .st-btn, .ach-btn, .mob-tab');
    if (el) { e.preventDefault(); el.click(); }
  }
});

function updateEUSub(gi) {
  const sub = document.getElementById('eu-sub-' + gi);
  if (!sub || !sub.classList.contains('show')) return;
  const rows = sub.querySelectorAll('.eu-row');
  rows.forEach((r, ui) => {
    const tier = S.eu[gi][ui];
    const maxTier = EMP_UPS[ui].tiers.length;
    const maxed = tier >= maxTier;
    const nextTier = maxed ? null : EMP_UPS[ui].tiers[tier];
    const c = maxed ? Infinity : euCost(gi, ui);
    const afford = !maxed && S.loc >= c && S.g[gi] >= 1;
    r.querySelector('.eu-row-name').textContent = maxed ? ta('eu_'+ui+'_'+(maxTier-1)+'_name', EMP_UPS[ui].tiers[maxTier - 1].name) : ta('eu_'+ui+'_'+tier+'_name', nextTier.name);
    r.querySelector('.eu-row-desc').textContent = maxed ? t('maxLvl') : ta('eu_'+ui+'_'+tier+'_desc', nextTier.desc);
    r.querySelector('.eu-row-cost').textContent = maxed ? '' : fmt(c);
    r.querySelector('.eu-row-lvl').textContent = tier > 0 ? '\u2605'.repeat(tier) : '';
    r.classList.toggle('no', !afford && !maxed);
    r.classList.toggle('best', !!(_facilityBest && _facilityBest.gi === gi && _facilityBest.ui === ui && !maxed));
    r.style.opacity = maxed ? '.6' : '';
    r.style.cursor = maxed ? 'default' : '';
  });
}

// ========== OFFICE SPRITES UPDATE ==========
const _ofc = {
  el: null,
  staffEls: [],
  spriteCache: [],   // [{type, deskT, chairT, pcT, el}]
  lastCb: -1,
  lastUpdate: 0,
  factCache: [],     // random fact index per sprite
  activeType: null,  // v7.3: which engineer type is currently rendered
  MAX_SPRITES: 50,
};

function _initOfc() {
  _ofc.el = $('officeFloor');
  _ofc.staffEls = [0,1,2,3].map(i => $('staffSprite' + i));
}

function updateOfficeSprites() {
  if (!_ofc.el) _initOfc();
  const now = performance.now();
  if (now - _ofc.lastUpdate < 500) return;
  _ofc.lastUpdate = now;

  // --- Engineer sprites (v7.3: driven by the ACTIVE engineer type, not all coders) ---
  const maxSprites = window.matchMedia('(max-width:480px)').matches ? 20 : _ofc.MAX_SPRITES;
  const aType = activeType();
  const activeList = engList(aType);
  // Group by tier, preserving hire order
  const byTier = GEN.map(() => []);
  for (const c of activeList) byTier[c.tier].push(c);
  let ownedTypes = 0;
  for (let i = 0; i < GEN.length; i++) if (byTier[i].length > 0) ownedTypes++;
  const perType = ownedTypes > 0 ? Math.floor(maxSprites / ownedTypes) : maxSprites;
  const desired = [];
  for (let i = 0; i < GEN.length; i++) {
    if (byTier[i].length < 1) continue;
    const count = Math.min(byTier[i].length, 30, perType);
    for (let j = 0; j < count; j++) {
      desired.push({
        coder: byTier[i][j],
        type: i,
        deskT: S.eu[i][0], chairT: S.eu[i][1], pcT: S.eu[i][2]
      });
    }
  }

  // v7.3: empty desk count is per-active-type (uses that type's office cap)
  const totalOwned = activeList.length;
  const emptyCount = Math.max(0, Math.min(coderCap(aType) - totalOwned, 30));

  // Diff against cache — rebuild only if changed (active type, coder identity + exp + equipment + empty count)
  let dirty = desired.length !== _ofc.spriteCache.length
            || emptyCount !== (_ofc.emptyCount || 0)
            || aType !== _ofc.activeType;
  if (!dirty) {
    for (let i = 0; i < desired.length; i++) {
      const d = desired[i], c = _ofc.spriteCache[i];
      if (d.coder !== c.coder || d.coder.exp !== c.exp || d.coder.age !== c.age ||
          d.type !== c.type || d.deskT !== c.deskT ||
          d.chairT !== c.chairT || d.pcT !== c.pcT) { dirty = true; break; }
    }
  }

  if (dirty) {
    _ofc.el.innerHTML = '';
    _ofc.spriteCache = [];
    _ofc.emptyCount = emptyCount;
    _ofc.activeType = aType;
    // Group desired by type into rows
    let curType = -1, curRow = null, rowIdx = 0, rowCount = 0;
    for (let i = 0; i < desired.length; i++) {
      const d = desired[i];
      if (d.type !== curType) {
        curType = d.type;
        rowIdx = 0;
        rowCount = 0;
        for (let j = i; j < desired.length && desired[j].type === curType; j++) rowCount++;
        curRow = document.createElement('div');
        curRow.className = 'coder-row';
        _ofc.el.appendChild(curRow);
      }
      const c = d.coder;
      const rCls = RARITY_CLS[c.rarity] || 'r-c';
      const div = document.createElement('div');
      div.className = 'coder-sprite ' + rCls;
      div.innerHTML = coderSVG(d.type, d.deskT, d.chairT, d.pcT);
      const tip = document.createElement('div');
      tip.className = 'sprite-tip';
      // Stable fact pick via seed: strip the prefix "Name. " from the canned fact
      const factList = CODER_FACTS[d.type] || [];
      const fact = factList.length
        ? factList[Math.floor(c.seed * factList.length) % factList.length].replace(/^[^.]+\.\s*/, '')
        : '';
      tip.innerHTML = '<b>' + c.name + '</b><br>' +
                      '<span class="' + rCls + '">' + RARITY_NAMES[c.rarity] + '</span> ' + GEN[d.type].name + '<br>' +
                      EDU_NAMES[c.edu] + ' \u2022 Age ' + (c.age || '?') +
                      (fact ? '<br><i class="tip-fact">' + fact + '</i>' : '');
      if (rowIdx < 2) { tip.style.left = '0'; tip.style.transform = 'none'; }
      else if (rowIdx >= rowCount - 2) { tip.style.left = 'auto'; tip.style.right = '0'; tip.style.transform = 'none'; }
      div.appendChild(tip);
      rowIdx++;
      curRow.appendChild(div);
      _ofc.spriteCache.push({
        coder: c, exp: c.exp, age: c.age,
        type: d.type, deskT: d.deskT, chairT: d.chairT, pcT: d.pcT,
        el: div
      });
    }
    // v6.9: append empty desks in their own row(s)
    if (emptyCount > 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'coder-row empty-row';
      _ofc.el.appendChild(emptyRow);
      for (let k = 0; k < emptyCount; k++) {
        const div = document.createElement('div');
        div.className = 'coder-sprite empty';
        div.innerHTML = emptyDeskSVG();
        const tip = document.createElement('div');
        tip.className = 'sprite-tip';
        tip.textContent = 'Empty desk';
        div.appendChild(tip);
        emptyRow.appendChild(div);
      }
    }
  }

  // --- Staff corner sprites ---
  for (let i = 0; i < 4; i++) {
    const el = _ofc.staffEls[i];
    if (!el) continue;
    const owned = S.ss[i] >= 1;
    el.classList.toggle('active', owned);
    el.classList.toggle('paused', !!(owned && S.sp[i]));
    if (owned && !el.hasChildNodes()) {
      el.innerHTML = staffSVG(i);
      const tip = document.createElement('div');
      tip.className = 'sprite-tip';
      tip.textContent = SUPPORT[i].name;
      el.appendChild(tip);
    } else if (!owned && el.hasChildNodes()) {
      el.innerHTML = '';
    }
  }
}

function clearOfficeSprites() {
  if (_ofc.el) _ofc.el.innerHTML = '';
  _ofc.spriteCache = [];
  _ofc.factCache = [];
  _ofc.lastCb = -1;
  for (let i = 0; i < 4; i++) {
    if (_ofc.staffEls[i]) _ofc.staffEls[i].innerHTML = '';
    if (_ofc.staffEls[i]) _ofc.staffEls[i].classList.remove('active','paused');
  }
}

// ========== GAME LOOP ==========
let last = performance.now(), saveAcc = 0;

function tick(now) {
  // v2 (tycoon mode): if tycoon is active, do NOT run the clicker loop.
  // We stop rescheduling so the requestAnimationFrame chain dies cleanly.
  if (window.__tycoonMode) return;

  let dt = Math.min((now - last) / 1000, 1); // cap dt to prevent huge jumps
  last = now;
  if (window._dbgSpeed > 1) dt *= window._dbgSpeed;

  recalcIfDirty();
  const sa = shipAt(); // cache for this frame

  // Random events
  tickEvents(dt);
  acTick();
  bubbleTick(dt);

  // Click streak system
  const nowMs = performance.now();
  const cutoff = nowMs - STREAK_WINDOW;
  ctTrim(cutoff);
  const cps = _ctN / STREAK_DIV;
  if (S.f.streakUnlock) {
    const sMax = 2 + S.f.streakPower + 2 * S.f.streakTurbo;
    const growRate = S.f.streakMastery ? STREAK_GROW * 2 : STREAK_GROW;
    let decayRate = S.f.streakMastery ? STREAK_DECAY / 2 : STREAK_DECAY;
    // Second Wind: streak decays 50% slower per level
    if (S.f.streakSecondWind) decayRate *= (0.5 ** S.f.streakSecondWind);
    const streakFloor = S.f.streakTranscend ? 1.5 : 1; // Transcendence: min floor
    if (cps >= 3) {
      streakMul = Math.min(sMax, streakMul + dt * growRate);
    } else if (nowMs - lastClickTime > STREAK_DECAY_DELAY && streakMul > streakFloor) {
      streakMul = Math.max(streakFloor, streakMul - dt * decayRate);
    }
  } else {
    streakMul = 1;
  }
  // The Zone: at max streak, +25% production per level
  const zoneMul = (S.f.streakZone && S.f.streakUnlock && streakMul >= (2 + S.f.streakPower + 2 * S.f.streakTurbo) * 0.99) ? (1 + 0.25 * S.f.streakZone) : 1;

  // Nap Pod burst (every NAP_INTERVAL s)
  if (S.c[P.NAP] > 0) {
    napTimer += dt;
    // Hackathon: burst interval shorter by 50% per level (more frequent bursts)
    const napInterval = NAP_INTERVAL / (1 + 0.5 * S.f.clickHackathon);
    if (napTimer >= napInterval) {
      napTimer = 0;
      // v7.3: nap burst applies to the active type's resource (uses its lps)
      const aType = activeType();
      const burst = (_C.typeLps[aType] || 0) * NAP_BURST_MUL * S.c[P.NAP] * (S.f.clickFrenzy ? 5 : 1) * streakMul * zoneMul * acPenalty() * bubbleMul();
      engAddRes(aType, burst);
      toast(t('napBurst') + ' +' + fmt(burst) + ' ' + (ENG_TYPE_MAP[aType] ? ENG_TYPE_MAP[aType].res : t('loc')));
    }
  }
  // Caffeine IV: auto-clicks advance nap timer faster
  if (S.f.clickCaffeine && S.c[P.NAP] > 0) {
    const acTicks = (S.f.autoClick + S.f.autoBotnet * 2 + petAutoClick());
    if (acTicks > 0) napTimer += dt * acTicks * 0.3;
  }

  // Production — v7.3: each unlocked engineer type produces its own resource.
  // Auto-clicks (autoClick perk, pet) feed the active type only since they
  // simulate the player clicking the monitor.
  recalcIfDirty();
  const aType = activeType();
  const acRate = (S.f.autoClick + S.f.autoBotnet * 2 + petAutoClick()) * clickPow();
  const tickMul = dt * streakMul * zoneMul * acPenalty() * bubbleMul();
  for (const meta of ENG_TYPES) {
    if (!isUnlocked(meta.key)) continue;
    let typeRate = _C.typeLps[meta.key] || 0;
    if (meta.key === aType) typeRate += acRate;
    const prod = typeRate * tickMul;
    if (prod > 0) engAddRes(meta.key, prod);
  }
  // Backward-compat aliases for the rest of the tick code
  const rate = _C.typeLps[aType] || 0;

  // Pet dog animation
  if (!_petEl) { _petEl = document.getElementById('petDog'); if (_petEl) _petEl.addEventListener('click', petBark); }
  const petEl = _petEl;
  if (petEl) {
    const hasPet = petAutoClick() > 0;
    petEl.classList.toggle('active', hasPet);
    if (hasPet) {
      petPawTimer += dt;
      if (petPawTimer >= 1) {
        petPawTimer = 0;
        petEl.classList.remove('paw');
        requestAnimationFrame(() => { if (petEl) petEl.classList.add('paw'); });
        // Dog adds a code line to the screen
        const _dk = CAT_MAP[getLandmark(currentYear()).cat];
        const _dcl = (_dk && CAT_CODE[_dk]) || CB_CODE_LINES[Math.min(S.cb, CB_CODE_LINES.length - 1)] || CB_CODE_LINES[0];
        codeVisible.push(_dcl[codeIdx % _dcl.length]);
        codeIdx++;
        if (codeVisible.length > 10) codeVisible.shift();
        scr.textContent = codeVisible.join('\n');
      }
    }
  }

  // Era & perk visuals
  updateDeskScene();
  updateMusic();

  // Auto-ship
  if (S.f.publisher && canShip()) ship();

  // Update top bar (v7.3: dLoc/dLps reflect the active engineer type)
  dYear.textContent = currentYear();
  dCat.textContent = getLandmark(currentYear()).cat;
  const _aMeta = activeTypeMeta();
  dLoc.textContent = fmt(engRes(aType));
  dLps.textContent = fmt(rate + (aType === activeType() ? acRate : 0)) + '/s';
  if (_dLocLbl) _dLocLbl.textContent = _aMeta.res;
  if (_dLpsLbl) _dLpsLbl.textContent = _aMeta.res + ' / sec';
  dFame.textContent = S.fame + (S.tFame > S.fame ? ' /' + S.tFame : '');
  dCp.textContent = '+' + fmt(clickPow()) + ' ' + _aMeta.res + '/click';
  // Refresh type tabs (cheap soft refresh of resource counts)
  refreshTypeTabValues();
  refreshShipPanel();
  const fm = fameMul();
  const parts = [];
  if (fm > 1) parts.push(t('fame') + ' \u00d7' + fm.toFixed(1));
  if (S.c[P.NAP] > 0) parts.push(t('napIn') + ' ' + Math.ceil(NAP_INTERVAL - napTimer) + 's');
  if (activeEvent && !activeEvent.pending) parts.push(activeEvent.name + ' ' + Math.ceil(activeEvent.remaining) + 's');
  else if (activeEvent && activeEvent.pending) parts.push(activeEvent.name + ' ' + t('choose'));
  dFm.textContent = parts.join(' \u2022 ');
  updateThermo();

  // Progress bar — v7.6: each unlocked type contributes an equal share.
  // If 3 of 4 types are at 100% and one is at 0%, bar shows 75%.
  let totalPct = 0, numTypes = 0;
  for (const meta of ENG_TYPES) {
    if (!isUnlocked(meta.key)) continue;
    const target = engShipAt(meta.key);
    if (target <= 0) continue;
    totalPct += Math.min(engTRes(meta.key) / target, 1);
    numTypes++;
  }
  const pct = numTypes > 0 ? totalPct / numTypes : 0;
  const shipReady = pct >= 1;
  pFill.style.transform = 'scaleX(' + pct + ')';
  const gain = fameGain();
  const lm = getLandmark(currentYear());
  pTxt.textContent = shipReady ? ('\u{1F680} ' + t('shipVerb') + ' ' + lm.parody + '!') : Math.floor(pct * 100) + '%';
  const progWrap = document.getElementById('progWrap');
  if (progWrap) progWrap.classList.toggle('ready', shipReady);
  // Auto-ship for publisher perk (no button needed)
  if (shipReady && S.f.publisher) ship();
  // First-ship tutorial: show once when first game becomes ready
  if (shipReady && !_shownShipTutorial && !document.getElementById('shipTutorial') && S.shipped === 0) {
    _shownShipTutorial = true;
    const tut = document.createElement('div');
    tut.className = 'ship-tutorial';
    tut.id = 'shipTutorial';
    tut.textContent = '\u{1F680} ' + t('clickLaunch');
    const rs = document.getElementById('rightShip');
    if (rs) rs.insertBefore(tut, progWrap.nextSibling);
  }

  // Find best-value coder tier (requires Secretary)
  let bestIdx = -1, bestEff = 0;
  _bestType = null;
  if (S.ss[SS.SECRETARY] >= 1) {
    for (let i = 0; i < GEN.length; i++) {
      const eff = GEN[i].rate * euMul(i) / gCost(i);
      if (eff > bestEff) { bestEff = eff; bestIdx = i; }
    }
    // v7.8: Type Advisor — find the unlocked type furthest from shipping
    let worstProg = Infinity;
    for (const k of (S.unlockedTypes || ['coder'])) {
      const prog = engRes(k) / Math.max(1, engShipAt(k));
      if (prog < worstProg) { worstProg = prog; _bestType = k; }
    }
  }

  // v6.8: Recruiter is now a passive pack-cost discount (see recruiterPackDiscount).
  // Trainer still levels Recruiter to amplify the discount.
  if (S.ss[SS.RECRUITER] >= 1 && S.ss[SS.TRAINER] && S.trainerSSCount) {
    buyerTimer += dt;
    if (buyerTimer >= 10) {
      buyerTimer = 0;
      S.trainerSSCount[SS.RECRUITER] = (S.trainerSSCount[SS.RECRUITER]||0)+1;
      if (S.trainerSSCount[SS.RECRUITER]>=3){
        S.trainerSSCount[SS.RECRUITER]=0;
        if((S.trainerSSLvl[SS.RECRUITER]||0)<100) S.trainerSSLvl[SS.RECRUITER]=(S.trainerSSLvl[SS.RECRUITER]||0)+1;
      }
    }
  }
  // Recruiter progress bar: hidden / static since recruiter is passive now
  if (!_rFill) _rFill = document.getElementById('recruiterFill');
  if (_rFill) _rFill.style.width = '0%';

  // Update facility director progress bar
  const facilityInterval = FACILITY_SLOW / (1 + 0.02 * ((S.trainerSSLvl && S.trainerSSLvl[SS.FACILITY]) || 0));
  if (!_fFill) _fFill = document.getElementById('facilityFill');
  const fFill = _fFill;
  if (fFill) {
    if (S.ss[SS.FACILITY] >= 1 && !S.sp[SS.FACILITY]) {
      fFill.style.width = Math.min(facilityTimer / facilityInterval * 100, 100) + '%';
    } else {
      fFill.style.width = '0%';
    }
  }

  // Facility Director: calculate best pick (for highlight + buying)
  _facilityBest = S.ss[SS.FACILITY] >= 1 ? facilityBestPick() : null;

  // Facility Director auto-buys equipment (with training upgrades)
  if (S.ss[SS.FACILITY] >= 1 && !S.sp[SS.FACILITY]) {
    facilityTimer += dt;
    if (facilityTimer >= facilityInterval) {
      facilityTimer = 0;
      if (S.ss[SS.TRAINER] && S.trainerSSCount) { S.trainerSSCount[SS.FACILITY] = (S.trainerSSCount[SS.FACILITY]||0)+1; if (S.trainerSSCount[SS.FACILITY]>=3){S.trainerSSCount[SS.FACILITY]=0;if((S.trainerSSLvl[SS.FACILITY]||0)<100)S.trainerSSLvl[SS.FACILITY]=(S.trainerSSLvl[SS.FACILITY]||0)+1;} }
      const buyCount = 1;
      for (let b = 0; b < buyCount; b++) {
        let best = null, bestScore = 0;
        for (let gi = 0; gi < GEN.length; gi++) {
          if (S.g[gi] < 1) continue;
          for (let ui = 0; ui < EMP_UPS.length; ui++) {
            const tier = S.eu[gi][ui];
            if (tier >= EMP_UPS[ui].tiers.length) continue;
            const c = euCost(gi, ui);
            // Best value: mult gain per cost
            const curMul = tier > 0 ? EMP_UPS[ui].tiers[tier - 1].mult : 1;
            const nextMul = EMP_UPS[ui].tiers[tier].mult;
            const val = (nextMul / curMul - 1) / c;
            if (val > bestScore) { bestScore = val; best = { gi, ui, c }; }
          }
        }
        if (best && S.loc >= best.c) {
          S.loc -= best.c;
          const tier = S.eu[best.gi][best.ui];
          S.eu[best.gi][best.ui]++;
          markDirty();
          log('\uD83E\uDD16 ' + t('logUpgraded') + ' ' + ta('gen_'+best.gi+'_name', GEN[best.gi].name) + ' \u2192 ' + ta('eu_'+best.ui+'_'+tier+'_name', EMP_UPS[best.ui].tiers[tier].name));
        }
      }
    }
  }

  // Trainer: level up random owned coder every 30s
  if (S.ss[SS.TRAINER] >= 1 && !S.sp[SS.TRAINER]) {
    trainerTimer += dt;
    if (trainerTimer >= 30) {
      trainerTimer = 0;
      const owned = [];
      for (let i = 0; i < GEN.length; i++) if (S.g[i] > 0) owned.push(i);
      if (owned.length > 0) {
        const pick = owned[Math.floor(Math.random() * owned.length)];
        if ((S.trainerLvl[pick] || 0) < 100) {
          S.trainerLvl[pick] = (S.trainerLvl[pick] || 0) + 1;
          markDirty();
          log('🏋️ ' + t('trainerLvlUp') + ': ' + ta('g'+pick, GEN[pick].name) + ' Lv' + S.trainerLvl[pick]);
        }
      }
    }
  }

  // Staff dialogue bubbles
  dialogueTick(dt);

  // "Having fun" popup — halfway through second year
  if (!S.funShown && S.shipped === 1 && pct >= 0.5) showFunPopup();

  // NYT headlines at 10%, 22%, 40% ship progress (no repeats per ship)
  const nytThresholds = [0.10, 0.22, 0.40];
  if (nytShown < nytThresholds.length && pct >= nytThresholds[nytShown]) {
    nytShown++;
    const yr = currentYear();
    const hls = NYT_HEADLINES[yr];
    if (hls) {
      if (!_nytPicked) {
        const shuffled = hls.slice().sort(() => Math.random() - 0.5);
        _nytPicked = shuffled.slice(0, 3);
      }
      showNYTBanner(yr, _nytPicked[nytShown - 1]);
    }
  }

  // Milestone checks (alongside achievements)
  achCheckAcc += dt;
  if (achCheckAcc >= ACH_CHECK_INTERVAL) {
    achCheckAcc = 0;
    checkAchievements();
    for (let mi = 0; mi < MILESTONES.length; mi++) {
      const m = MILESTONES[mi];
      if (!S.milestones.includes(m.id) && S.tLoc >= m.threshold) {
        S.milestones.push(m.id);
        const msMsg = ta('ms_'+mi, m.msg);
        toast('\u{1F3C6} ' + t('milestone') + ': ' + msMsg);
        log('\u{1F3C6} ' + t('milestone') + ': ' + msMsg);
        playSfx('milestone');
      }
    }
  }

  // Offline progress toast (deferred from load)
  if (pendingOfflineMsg) {
    toast(pendingOfflineMsg);
    pendingOfflineMsg = null;
  }

  // v6.8: update Hire Pack button cost + afford state + v6.9 capacity
  {
    const _pc = document.getElementById('packCost');
    const _pd = document.getElementById('packDesc');
    const _ph = document.getElementById('packHeader');
    if (_pc && _ph) {
      const _cap = coderCap();
      const _aT = activeType();
      const _own = engList(_aT).length;
      const _meta = activeTypeMeta();
      const _full = !canFitPack();
      const _info = bulkPackInfo(buyQty);
      const _ps = packSize();
      const _numEng = buyQty === Infinity ? _ps : buyQty > 1 ? _ps * buyQty : _ps;
      const _qLabel = buyQty !== Infinity && buyQty > 1 ? buyQty + '\u00d7' : '';
      const _engLabel = _numEng === 1 ? ' engineer' : ' engineers';
      _pd.textContent = _qLabel + _numEng + ' ' + _meta.name + _engLabel + ' \u00b7 ' + _own + '/' + _cap;
      if (_full) {
        _pc.textContent = 'FULL';
      } else if (_info.count === 0) {
        _pc.textContent = fmt(packCost());
      } else if (buyQty === Infinity) {
        _pc.textContent = fmt(_info.totalCost) + ' (\u00d7' + _info.count + ')';
      } else {
        _pc.textContent = fmt(_info.totalCost);
      }
      const _canAfford = _info.count >= (buyQty === Infinity ? 1 : buyQty) && engRes(_aT) >= _info.totalCost;
      _ph.classList.toggle('no', _full || !_canAfford);
      _ph.classList.toggle('full', _full);
    }
  }
  // v7.3: Upgrade Office button shows the ACTIVE type's office tier + cost
  {
    const _ot = document.getElementById('officeTitle');
    const _od = document.getElementById('officeDesc');
    const _oc = document.getElementById('officeCost');
    const _oh = document.getElementById('officeHeader');
    if (_ot && _oh) {
      const _ofcType = activeType();
      const _ofcMeta = activeTypeMeta();
      const cur = officeTier(_ofcType);
      const nextIdx = officeLvl(_ofcType) + 1;
      const maxed = nextIdx >= OFFICES.length;
      // v7.3: Drop redundant type name (already in tab above); compact seats/prod suffix
      _ot.textContent = cur.name + ' \u00b7 ' + coderCap(_ofcType) + ' seats \u00b7 \u00d7' + cur.prod.toFixed(2);
      if (maxed) {
        _od.textContent = 'Max office reached';
        _oc.textContent = '';
        _oh.classList.add('no');
        _oh.classList.add('maxed');
      } else {
        const nxt = OFFICES[nextIdx];
        _od.textContent = '\u2192 ' + nxt.name + ' (' + nxt.cap + ', \u00d7' + nxt.prod.toFixed(2) + ')';
        const cost = officeCost(_ofcType);
        _oc.textContent = fmt(cost) + ' ' + _ofcMeta.res;
        _oh.classList.toggle('no', engRes(_ofcType) < cost);
        _oh.classList.remove('maxed');
      }
    }
  }

  // Update upgrade rows
  for (let r = 0; r < upRefs.length; r++) {
    const ref = upRefs[r];
    const { action: a, el, costEl, ownEl } = ref;
    let cost, owned, afford, locked = false, maxed = false;

    if (a === 'g') {
      // v6.8: tier rows are display-only. Shown when owned, or when the previous tier has coders.
      // v7.3: owned/isOpen are per-active-type so switching tabs shows only that type's roster.
      const i = ref.idx;
      recalcIfDirty();
      const _aT = activeType();
      const tCounts = (_C.typeTierCount && _C.typeTierCount[_aT]) || [];
      const ownedThis = tCounts[i] | 0;
      const prevThis = tCounts[i - 1] | 0;
      const isOpen = ownedThis >= 1 || i < 1 || prevThis >= 1;
      locked = !isOpen;
      afford = true;  // disable .no dimming — rows are display-only now
      maxed = false;
      if (isOpen) {
        owned = ownedThis;
        costEl.textContent = '';
        const tLv = (S.trainerLvl && S.trainerLvl[i]) || 0;
        ownEl.textContent = owned ? '×' + owned + (tLv > 0 ? ' Lv' + tLv : '') : '\u2014';
        if (ref.rateEl) {
          // v7.3: per-tier sum for active type × active type's office prod
          const tLpsArr = (_C.typeTierLps && _C.typeTierLps[_aT]) || _C.tierLps || [];
          const tl = tLpsArr[i] || 0;
          const tierSyn = (_C.typeTierSynergyMul && _C.typeTierSynergyMul[_aT]) || 1;
          const tierRate = tl * _C.genSpeedMul * _C.genSynergyMul * tierSyn * _C.prodMul * officeProdMul(_aT);
          ref.rateEl.textContent = owned ? fmt(tierRate) + '/s' : '';
        }
        el.classList.toggle('best', i === bestIdx);
      }
    } else if (a === 'c') {
      const i = ref.idx;
      const cUnlocked = 3 + Math.floor(S.shipped / 2);
      const req = CLK[i].req;
      const isOpen = req !== undefined ? S.shipped >= req : i < cUnlocked;
      const isNext = !isOpen && (req !== undefined ? S.shipped >= req - 1 : i === cUnlocked && i < CLK.length);
      locked = !isOpen && !isNext;
      if (isNext) {
        afford = false;
        costEl.textContent = '';
        ownEl.textContent = '\u{1F512}';
      } else if (isOpen) {
        owned = S.c[i]; maxed = owned >= 1;
        cost = cCost(i); afford = !maxed && S.loc >= cost;
        costEl.textContent = maxed ? '' : fmt(cost);
        ownEl.textContent = maxed ? '\u2713' : '';
      }
    } else if (a === 'ss') {
      const i = ref.idx;
      const ssUnlocked = 1 + S.shipped;
      const isNext = i === ssUnlocked && i < SUPPORT.length;
      locked = i > ssUnlocked;
      if (isNext) {
        afford = false;
        costEl.textContent = '';
        ownEl.textContent = '\u{1F512}';
      } else if (i < ssUnlocked) {
        owned = S.ss[i]; maxed = owned >= 1;
        cost = ssCost(i); afford = !maxed && S.loc >= cost;
        costEl.textContent = maxed ? '' : fmt(cost);
        const ssLv = (S.trainerSSLvl && S.trainerSSLvl[i]) || 0;
        ownEl.textContent = maxed ? '\u2713' + (ssLv > 0 ? ' Lv' + ssLv : '') : '';
      }
      // Sync pause button visual with actual state (Meeting Room can flip these)
      const _pb = el.querySelector('.pause-toggle');
      if (_pb) { const p = !!S.sp[i]; _pb.classList.toggle('paused', p); _pb.textContent = p ? '\u25B6' : '\u23F8'; }
    } else if (a === 'cb') {
      const i = ref.idx;
      const unlocked = i < S.cb;
      const isNext = i === S.cb;
      owned = unlocked ? 1 : 0; maxed = unlocked;
      afford = false; locked = !unlocked && !isNext;
      ownEl.textContent = unlocked ? '\u2713' : isNext ? '\u{1F512}' : '';
    }

    el.classList.toggle('no', !afford && !maxed);
    el.classList.toggle('maxed', maxed);
    el.classList.toggle('hide', locked);

    // Pulse plus toggle when affordable sub-upgrade exists
    const _tog = el.querySelector('.eu-toggle');
    if (_tog && !locked && !_tog.classList.contains('open')) {
      let _hasAff = false;
      if (a === 'g') {
        const gi = ref.idx;
        _hasAff = S.g[gi] >= 1 && EMP_UPS.some((eu, ui) => S.eu[gi][ui] < eu.tiers.length && S.loc >= euCost(gi, ui));
      }
      _tog.classList.toggle('has-affordable', _hasAff);
    } else if (_tog) {
      _tog.classList.remove('has-affordable');
    }
  }

  // Update Max button label on hover
  if (maxBtn) maxBtn.textContent = hoveredGen >= 0 ? '×' + gMax(hoveredGen) : t('max');

  // Update open coder/recruiter/facility submenus
  for (let gi = 0; gi < GEN.length; gi++) updateEUSub(gi);
  updateRUSub();

  // Clock drift detection — compare real elapsed (performance.now) to system clock
  const _drift = Date.now() - trustedNow();
  if (Math.abs(_drift) > 30000) {   // >30 s jump = clock was changed mid-session
    _tClockOffset += _drift;         // absorb the jump so trustedNow stays correct
    toast('\u26A0\uFE0F Clock change detected — nice try!', '#da3633');
  }

  // Update office sprites
  updateOfficeSprites();

  // v7.2: throttled refresh of always-open roster column (LPS values + synergy)
  const _rosNow = performance.now();
  if (_rosNow - _rosLastUpdate >= 500) {
    _rosLastUpdate = _rosNow;
    renderRosterCol();
  }

  // Autosave every 30s
  saveAcc += dt;
  if (saveAcc >= AUTOSAVE_INTERVAL) { saveAcc = 0; save(); }

  requestAnimationFrame(tick);
}

// ========== SLOT SCREEN ==========
const slotRow = $('slotRow');
const slotsEl = $('slots');
const gameEl = $('G');

function buildSlots() {
  slotRow.innerHTML = '';
  for (let n = 1; n <= 3; n++) {
    const btn = document.createElement('div');
    btn.className = 'slot-btn';
    btn.dataset.slot = n;
    const data = peekSlot(n);
    let info = t('empty');
    if (data) {
      const parts = [];
      if (data.fame) parts.push(data.fame + ' ' + t('fame'));
      if (data.shipped) parts.push(data.shipped + ' ' + t('softwareShipped'));
      if (!parts.length) parts.push(t('inProgress'));
      info = parts.join(' \u2022 ');
    }
    let html = '<div class="slot-num">' + n + '</div><div class="slot-info">' + info + '</div>';
    if (data) {
      html += '<button class="slot-new" data-reset="' + n + '">' + t('newGame') + '</button>';
      html += '<div class="slot-confirm" id="confirm-' + n + '">' + t('eraseSave') + '<div class="slot-confirm-btns">'
        + '<button class="slot-yes" data-wipe="' + n + '">' + t('yes') + '</button>'
        + '<button class="slot-no" data-cancel="' + n + '">' + t('no') + '</button></div></div>';
    }
    btn.innerHTML = html;
    slotRow.appendChild(btn);
  }
}
function applyLang() {
  // Update slot screen
  document.querySelector('.slot-title').textContent = t('slotTitle');
  document.querySelector('.slot-sub').textContent = t('slotSub');
  // Highlight active flag
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  buildSlots();
  // Update top bar labels
  const labels = document.querySelectorAll('.stat-lbl');
  if (labels.length >= 5) {
    labels[0].textContent = t('year');
    labels[1].textContent = t('developing');
    labels[2].textContent = t('linesOfCode');
    labels[3].textContent = t('locSec');
    labels[4].textContent = t('fame');
  }
  // Update click area
  const ci = document.querySelector('.click-info');
  if (ci) ci.textContent = t('clickInfo');
  // Rebuild game UI if in-game
  if (!gameEl.classList.contains('hidden')) {
    upRefs.length = 0;
    maxBtn = null;
    buildUI();
  }
}

// Flag click handler
document.getElementById('langBar').addEventListener('click', e => {
  const btn = e.target.closest('.lang-btn');
  if (!btn) return;
  lang = btn.dataset.lang;
  localStorage.setItem('gdc_lang', lang);
  applyLang();
});

buildSlots();
applyLang();

slotRow.addEventListener('click', e => {
  // New Game button — show confirmation
  const resetBtn = e.target.closest('.slot-new');
  if (resetBtn) {
    e.stopPropagation();
    const n = resetBtn.dataset.reset;
    const conf = document.getElementById('confirm-' + n);
    if (conf) conf.classList.add('show');
    resetBtn.style.display = 'none';
    return;
  }
  // Confirm wipe
  const wipeBtn = e.target.closest('.slot-yes');
  if (wipeBtn) {
    e.stopPropagation();
    const n = wipeBtn.dataset.wipe;
    localStorage.removeItem('gdc_save_' + n);
    buildSlots();
    return;
  }
  // Cancel wipe
  const cancelBtn = e.target.closest('.slot-no');
  if (cancelBtn) {
    e.stopPropagation();
    const n = cancelBtn.dataset.cancel;
    const conf = document.getElementById('confirm-' + n);
    if (conf) conf.classList.remove('show');
    const rb = slotRow.querySelector('.slot-new[data-reset="' + n + '"]');
    if (rb) rb.style.display = '';
    return;
  }
  // Load slot
  const btn = e.target.closest('.slot-btn');
  if (!btn) return;
  KEY = 'gdc_save_' + btn.dataset.slot;
  S = defaults();
  load();
  // Skip fmt tutorial for existing players who already have large numbers
  if (S.tLoc >= 1000 || S.shipped > 0) _shownFmtTutorial = true;
  slotsEl.classList.add('hidden');
  gameEl.classList.remove('hidden');
  buildUI();
  updateDeskScale();
  setTimeout(updateNotifyTop, 50);
  eventCooldown = 135 + Math.random() * 135;
  achCheckAcc = 0;
  last = performance.now();
  requestAnimationFrame(tick);
});

window.addEventListener('beforeunload', () => { if (!gameEl.classList.contains('hidden')) save(); });

// v9.0: Anchor notifications to top of main content (below top bar + tabs)
function updateNotifyTop() {
  const main = document.querySelector('.main');
  if (main) document.documentElement.style.setProperty('--notify-top', main.getBoundingClientRect().top + 'px');
}
window.addEventListener('resize', updateNotifyTop);

