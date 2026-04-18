// ========== FUN POPUP ==========
function showFunPopup() {
  if (S.funShown) return;
  S.funShown = 1; markDirty();
  const ov = document.createElement('div');
  ov.className = 'st-ov';
  const panel = document.createElement('div');
  panel.className = 'fun-panel';
  const h = document.createElement('h2');
  h.textContent = 'You are having fun';
  const p = document.createElement('p');
  p.textContent = 'Right?';
  const btns = document.createElement('div');
  btns.className = 'fun-btns';
  const yesBtn = document.createElement('button');
  yesBtn.className = 'fun-btn-yes';
  yesBtn.textContent = 'I am having fun';
  yesBtn.onclick = () => { ov.remove(); playSfx('buy'); };
  const fbBtn = document.createElement('button');
  fbBtn.className = 'fun-btn-fb';
  fbBtn.textContent = 'Feedback';
  fbBtn.onclick = () => { window.open('https://github.com/CheesusCrustBoyMillionare/Software-Dev-Clicker/issues/new', '_blank'); ov.remove(); };
  btns.append(yesBtn, fbBtn);
  panel.append(h, p, btns);
  ov.appendChild(panel);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

// ========== ROSTER MODAL (v7.2) ==========
// v7.2: Roster shared state (used by both modal and always-open panel)
let _rosFilter = -1;   // -1 = all, 0..4 = rarity index
let _rosSort = 'rarity';
let _rosColEl = null;
let _rosLastUpdate = 0;

function _coderContribLps(c) {
  const ti = c.tier | 0;
  if (ti < 0 || ti >= GEN.length) return 0;
  // v7.3: use the active type's tier synergy mul + office prod mul (per-type set bonuses & office)
  const aT = activeType();
  const tierSyn = _C.typeTierSynergyMul ? (_C.typeTierSynergyMul[aT] || 1) : (_C.tierSynergyMul || 1);
  return GEN[ti].rate * _C.euMul[ti] * coderProdMul(c)
       * _C.genSpeedMul * _C.genSynergyMul * tierSyn * _C.prodMul * officeProdMul(aT);
}

// Build roster contents into a panel element. Used by both openRoster (modal)
// and renderRosterCol (always-open). Filter/sort state is module-scoped so both
// views share it.
function buildRosterInto(panel, isModal) {
  panel.innerHTML = '';
  if (isModal) {
    panel.className = 'roster-panel';
  }
  // For always-open variant, leave .right-roster wrapper class as-is — its
  // padding/scroll/border come from the .right-roster CSS rule. The .roster-*
  // sub-element rules apply regardless of parent.

  const title = document.createElement('div');
  title.className = 'stats-title';
  title.textContent = t('rosterTitle') || 'Engineer Roster';
  panel.appendChild(title);

  const synTitle = document.createElement('div');
  synTitle.className = 'stats-sec-title';
  synTitle.textContent = t('rosterSynergy') || 'Tier Set Bonuses';
  panel.appendChild(synTitle);
  const synBox = document.createElement('div');
  synBox.className = 'roster-syn';
  panel.appendChild(synBox);

  const filterRow = document.createElement('div');
  filterRow.className = 'roster-ctrl';
  panel.appendChild(filterRow);
  const sortRow = document.createElement('div');
  sortRow.className = 'roster-ctrl';
  panel.appendChild(sortRow);

  const listEl = document.createElement('div');
  listEl.className = 'roster-list';
  panel.appendChild(listEl);

  function rebuildHeader() {
    recalcIfDirty();
    synBox.innerHTML = '';
    // v7.3: tier counts shown reflect the active type only (set bonuses are per-type)
    const counts = (_C.typeTierCount && _C.typeTierCount[activeType()]) || _C.tierCount || [];
    // Only show rows for tiers the player has unlocked (count > 0) to keep
    // the header tight; players see tiers appear as they hire.
    for (let i = 0; i < GEN.length; i++) {
      if ((counts[i] || 0) === 0) continue;
      const row = document.createElement('div');
      row.className = 'roster-syn-row';
      const name = document.createElement('span');
      name.className = 'rn';
      name.textContent = GEN[i].name;
      const cnt = document.createElement('span');
      cnt.className = 'rc';
      cnt.textContent = (counts[i] || 0) + ' owned';
      const cur = setTierBonus(counts[i] || 0);
      const bonus = document.createElement('span');
      bonus.className = 'rb';
      bonus.textContent = cur > 0 ? '+' + Math.round(cur * 100) + '%' : '—';
      const prog = document.createElement('span');
      prog.className = 'rp';
      let nextN = 0, nextB = 0;
      for (const tier of SET_TIERS) { if ((counts[i] || 0) < tier.n) { nextN = tier.n; nextB = tier.bonus; break; } }
      if (nextN > 0) {
        prog.textContent = (nextN - (counts[i] || 0)) + ' more → +' + Math.round(nextB * 100) + '%';
      } else {
        prog.textContent = 'MAX';
      }
      row.append(name, cnt, bonus, prog);
      synBox.appendChild(row);
    }
    if (synBox.children.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:var(--text-secondary);font-size:.65rem;text-align:center;padding:4px';
      empty.textContent = 'Hire engineers to unlock tier bonuses';
      synBox.appendChild(empty);
    }
  }

  function rebuildList() {
    listEl.innerHTML = '';
    // v7.3: roster shows the active engineer type only
    const sourceList = engList(activeType());
    const rows = sourceList.filter(c => _rosFilter < 0 || c.rarity === _rosFilter);
    rows.sort((a, b) => {
      if (_rosSort === 'rarity') return (b.rarity - a.rarity) || (b.tier - a.tier);
      if (_rosSort === 'tier')   return (b.tier - a.tier) || (b.rarity - a.rarity);
      if (_rosSort === 'exp')    return (b.exp || 0) - (a.exp || 0);
      if (_rosSort === 'lps')    return _coderContribLps(b) - _coderContribLps(a);
      return 0;
    });
    if (rows.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px;font-size:.75rem';
      const meta = activeTypeMeta();
      empty.textContent = (sourceList.length > 0) ? 'No engineers match this filter.' : ('No ' + meta.name.toLowerCase() + 's yet — hire someone!');
      listEl.appendChild(empty);
      return;
    }
    for (const c of rows) {
      const row = document.createElement('div');
      row.className = 'roster-row';
      const nameEl = document.createElement('span');
      nameEl.className = 'r-name ' + (RARITY_CLS[c.rarity] || '');
      nameEl.textContent = c.name || '?';
      const metaEl = document.createElement('span');
      metaEl.className = 'r-meta';
      const tierName = GEN[c.tier] ? GEN[c.tier].name : '?';
      const eduName = EDU_NAMES[c.edu] || '?';
      metaEl.textContent = tierName + ' · ' + eduName + ' · Age ' + (c.age || '?');
      const lpsEl = document.createElement('span');
      lpsEl.className = 'r-lps';
      lpsEl.textContent = fmt(_coderContribLps(c)) + '/s';
      const fireBtn = document.createElement('button');
      fireBtn.className = 'fire-btn';
      const fireLabel = () => (t('fire') || 'Fire') + ' ' + fmt(fireCost());
      const confirmLabel = () => (t('fireConfirm') || 'Fire?') + ' ' + fmt(fireCost());
      fireBtn.textContent = fireLabel();
      let revertTimer = null;
      fireBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!fireBtn.classList.contains('confirm')) {
          fireBtn.classList.add('confirm');
          fireBtn.textContent = confirmLabel();
          revertTimer = setTimeout(() => {
            fireBtn.classList.remove('confirm');
            fireBtn.textContent = fireLabel();
            revertTimer = null;
          }, 3000);
          return;
        }
        if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
        const cost = fireCost();
        const aType = activeType();
        if (engRes(aType) < cost) {
          fireBtn.classList.remove('confirm');
          fireBtn.textContent = fireLabel();
          toast('Not enough ' + (ENG_TYPE_MAP[aType] ? ENG_TYPE_MAP[aType].res : 'LoC') + ' for severance');
          return;
        }
        engSubRes(aType, cost);
        S.fireCount = (S.fireCount || 0) + 1;
        const list = engList(aType);
        const idx = list.indexOf(c);
        if (idx >= 0) list.splice(idx, 1);
        recomputeG();
        markDirty();
        recalcIfDirty();
        rebuildHeader();
        rebuildList();
        // Mirror the change to the other view (always-open + modal share state)
        if (isModal) renderRosterCol();
      });
      row.append(nameEl, metaEl, lpsEl, fireBtn);
      // Stash the coder ref so soft refresh can update LPS text without
      // having to re-derive identity from sort order.
      row._coder = c;
      listEl.appendChild(row);
    }
  }
  // Soft refresh: update LPS text in place. Used by the periodic tick so
  // an in-progress fire-confirm state isn't clobbered by a full rebuild.
  panel._rosterSoftRefresh = () => {
    recalcIfDirty();
    panel.querySelectorAll('.roster-row').forEach(row => {
      const c = row._coder;
      if (!c) return;
      const lpsEl = row.querySelector('.r-lps');
      if (lpsEl) lpsEl.textContent = fmt(_coderContribLps(c)) + '/s';
    });
  };

  function mkCtrlBtn(label, isActive, onClick) {
    const b = document.createElement('button');
    b.textContent = label;
    if (isActive) b.classList.add('active');
    b.addEventListener('click', onClick);
    return b;
  }
  function buildFilters() {
    filterRow.innerHTML = '';
    filterRow.appendChild(mkCtrlBtn(t('filterAll') || 'All', _rosFilter === -1, () => { _rosFilter = -1; buildFilters(); rebuildList(); if (isModal) renderRosterCol(); }));
    for (let r = 0; r < 5; r++) {
      const b = mkCtrlBtn(RARITY_NAMES[r][0], _rosFilter === r, (() => { const rr = r; return () => { _rosFilter = rr; buildFilters(); rebuildList(); if (isModal) renderRosterCol(); }; })());
      b.classList.add(RARITY_CLS[r]);
      filterRow.appendChild(b);
    }
  }
  function buildSort() {
    sortRow.innerHTML = '';
    const keys = [
      ['rarity', t('sortRarity') || 'Rarity'],
      ['tier',   t('sortTier')   || 'Tier'],
      ['exp',    t('sortExp')    || 'Exp'],
      ['lps',    t('sortLps')    || 'LPS'],
    ];
    for (const [k, lbl] of keys) {
      sortRow.appendChild(mkCtrlBtn(lbl, _rosSort === k, (() => { const kk = k; return () => { _rosSort = kk; buildSort(); rebuildList(); if (isModal) renderRosterCol(); }; })()));
    }
  }

  buildFilters();
  buildSort();
  rebuildHeader();
  rebuildList();
}

// Render the always-open roster column. Throttled by tick(); also called
// after user actions that mutate S.coders.
//
// Fingerprint detects structural changes (hire, fire, ship-tier-bump). Anything
// else is a soft text refresh — we don't tear down the DOM, since that would
// clobber any in-progress fire-confirm state and make the button feel laggy.
function renderRosterCol() {
  if (!_rosColEl) _rosColEl = document.getElementById('rosterCol');
  if (!_rosColEl) return;
  // v7.3: fingerprint includes active type so switching tabs rebuilds
  const aType = activeType();
  const fp = aType + ':' + engList(aType).length + ':' + (S.shipped || 0);
  if (_rosColEl._rosterFp !== fp || !_rosColEl._rosterSoftRefresh) {
    const scrollY = _rosColEl.scrollTop;
    buildRosterInto(_rosColEl, false);
    _rosColEl._rosterFp = fp;
    _rosColEl.scrollTop = scrollY;
  } else {
    _rosColEl._rosterSoftRefresh();
  }
}

function openRoster() {
  // Remove any existing overlay first
  const old = document.querySelector('.st-ov');
  if (old) old.remove();

  const ov = document.createElement('div');
  ov.className = 'st-ov';
  const panel = document.createElement('div');
  buildRosterInto(panel, true);

  const close = document.createElement('button');
  close.className = 'st-close';
  close.textContent = '\u00d7';
  close.addEventListener('click', () => ov.remove());
  ov.appendChild(close);
  ov.appendChild(panel);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

// ========== STATS MODAL ==========
function openStats() {
  const ov = document.createElement('div');
  ov.className = 'st-ov';
  const panel = document.createElement('div');
  panel.className = 'stats-panel';
  const title = document.createElement('div');
  title.className = 'stats-title';
  title.textContent = t('statsTitle');
  panel.appendChild(title);

  // Summary stats row 1
  const sum = document.createElement('div');
  sum.className = 'stats-summary';
  const cats = new Set(S.games.map(g => g.cat));
  const totalEngineers = totalEngineerCount();
  const unlockedTypes = ENG_TYPES.filter(m => isUnlocked(m.key));
  const totalPerks = S.c.filter(n => n > 0).length;
  // v7.3: show available/total fame so players know what's bankable vs lifetime
  const fameCell = S.tFame > S.fame ? (S.fame + ' / ' + S.tFame) : S.fame;
  const stats = [
    { val: S.games.length, lbl: t('statsShipped') },
    { val: fameCell, lbl: t('totalFame') },
    { val: cats.size, lbl: t('categories') },
    { val: S.ach.length + '/' + ACHIEVEMENTS.length, lbl: t('achievements') },
  ];
  stats.forEach(s => {
    const d = document.createElement('div'); d.className = 'stats-stat';
    d.innerHTML = '<div class="stats-stat-val">' + s.val + '</div><div class="stats-stat-lbl">' + s.lbl + '</div>';
    sum.appendChild(d);
  });
  panel.appendChild(sum);

  // v7.3: ensure cache is up-to-date so per-type LPS/synergy reads are accurate
  recalcIfDirty();

  // Current run details
  const runSec = document.createElement('div');
  runSec.className = 'stats-section';
  runSec.innerHTML = '<div class="stats-sec-title">' + t('currentRun') + '</div>';
  // v7.3: Click-driven LoC/s addition (autoClick etc. all go through the coder LoC stream)
  const autoClickLps = (S.f.autoClick + S.f.autoBotnet * 2 + petAutoClick()) * clickPow();
  const coderTotalLps = ((_C.typeLps && _C.typeLps.coder) || 0) + autoClickLps;
  // v7.3: Count hired support staff + their total trainer level boosts
  const staffHired = S.ss.filter(n => n >= 1).length;
  const runDetails = [
    [t('year'), currentYear()],
    [t('developing'), getLandmark(currentYear()).cat],
    [t('loc') + '/s', fmt(coderTotalLps)],
    [t('clickPower'), fmt(clickPow())],
    ['Lifetime LoC', fmt(S.tLoc || 0)],
    ['Engineers', totalEngineers + ' (' + unlockedTypes.length + '/' + ENG_TYPES.length + ' types)'],
    [t('officePerks'), totalPerks + '/' + CLK.length],
    [t('equipment'), S.eu.flat().reduce((a, v) => a + v, 0) + '/' + (S.g.filter(n => n > 0).length * EMP_UPS.length * 3) + ' ' + t('tiers')],
    [t('codeBase'), S.cb + '/' + CODE_BASE.length + ' ' + t('statsUnlocked')],
    ['Support Staff', staffHired + '/' + SUPPORT.length + ' hired'],
    ['Milestones', (S.milestones ? S.milestones.length : 0) + ' reached'],
    [t('shipInflation'), Math.round((shipInflation() - 1) * 100) + '% ' + t('costIncrease')],
    [t('fameMultiplier'), '\u00d7' + fameMul().toFixed(1) + ' ' + t('allProd')],
  ];
  const runTbl = document.createElement('table');
  runTbl.className = 'stats-table';
  runDetails.forEach(([k, v]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td style="color:#8b949e;width:130px">' + k + '</td><td>' + v + '</td>';
    runTbl.appendChild(tr);
  });
  runSec.appendChild(runTbl);
  panel.appendChild(runSec);

  // v7.3: Engineer Types breakdown — one row per unlocked type with count, office, current/lifetime resource, rate
  if (unlockedTypes.length > 0) {
    const engSec = document.createElement('div');
    engSec.className = 'stats-section';
    engSec.innerHTML = '<div class="stats-sec-title">Engineer Types</div>';
    const engTbl = document.createElement('table');
    engTbl.className = 'stats-table';
    // header
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Type</th><th>Owned</th><th>Office</th><th>Lifetime</th><th>Rate</th></tr>';
    engTbl.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const meta of unlockedTypes) {
      const list = engList(meta.key);
      const cap = coderCap(meta.key);
      const ofcName = officeTier(meta.key).name;
      const lpsVal = (_C.typeLps && _C.typeLps[meta.key]) || 0;
      // Extra bonus for coder type: autoClick LPS
      const extra = meta.key === 'coder' ? autoClickLps : 0;
      const syn = (_C.typeTierSynergyMul && _C.typeTierSynergyMul[meta.key]) || 1;
      const synPct = syn > 1 ? ' <span style="color:#3fb950">(+' + Math.round((syn - 1) * 100) + '%)</span>' : '';
      const lifetime = engTRes(meta.key);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span style="color:' + meta.color + '">\u25cf</span> ' + meta.name + '</td>' +
        '<td>' + list.length + '/' + cap + '</td>' +
        '<td style="font-size:.7rem;color:#8b949e">' + ofcName + '</td>' +
        '<td>' + fmt(lifetime) + ' ' + meta.res + '</td>' +
        '<td>' + fmt(lpsVal + extra) + '/s' + synPct + '</td>';
      tbody.appendChild(tr);
    }
    engTbl.appendChild(tbody);
    engSec.appendChild(engTbl);
    panel.appendChild(engSec);
  }

  // v7.3: Support Staff section — hired staff + their trainer levels + recruiter/facility sub-upgrades
  if (staffHired > 0) {
    const staffSec = document.createElement('div');
    staffSec.className = 'stats-section';
    staffSec.innerHTML = '<div class="stats-sec-title">Support Staff</div>';
    const staffTbl = document.createElement('table');
    staffTbl.className = 'stats-table';
    const stHead = document.createElement('thead');
    stHead.innerHTML = '<tr><th>Staff</th><th>Status</th><th>Trainer Lv</th></tr>';
    staffTbl.appendChild(stHead);
    const stBody = document.createElement('tbody');
    for (let i = 0; i < SUPPORT.length; i++) {
      const owned = S.ss[i] >= 1;
      if (!owned) continue;
      const tLv = (S.trainerSSLvl && S.trainerSSLvl[i]) || 0;
      const paused = S.sp[i] >= 1;
      let extra = '';
      // v7.3: surface Recruiter sub-upgrades + Facility sub-upgrades so players see what's active
      if (i === SS.RECRUITER) {
        const subs = RECRUITER_UPS.filter((_, idx) => (S.ru[idx] || 0) >= 1).length;
        if (subs > 0) extra = ' <span style="color:#8b949e;font-size:.65rem">+' + subs + ' perks</span>';
      } else if (i === SS.FACILITY) {
        const subs = FACILITY_UPS.filter((_, idx) => (S.fu[idx] || 0) >= 1).length;
        if (subs > 0) extra = ' <span style="color:#8b949e;font-size:.65rem">+' + subs + ' perks</span>';
      }
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + SUPPORT[i].name + extra + '</td>' +
        '<td>' + (paused ? '<span style="color:#f0883e">Paused</span>' : '<span style="color:#3fb950">Active</span>') + '</td>' +
        '<td>' + (tLv > 0 ? 'Lv' + tLv + ' <span style="color:#3fb950;font-size:.65rem">(+' + tLv + '%)</span>' : '-') + '</td>';
      stBody.appendChild(tr);
    }
    staffTbl.appendChild(stBody);
    staffSec.appendChild(staffTbl);
    panel.appendChild(staffSec);
  }

  // v7.3: Collection — rarity counts across ALL engineer types
  if (totalEngineers > 0) {
    const rarityCounts = [0, 0, 0, 0, 0];
    for (const meta of unlockedTypes) {
      for (const c of engList(meta.key)) {
        if (c.rarity >= 0 && c.rarity < 5) rarityCounts[c.rarity]++;
      }
    }
    const colSec = document.createElement('div');
    colSec.className = 'stats-section';
    colSec.innerHTML = '<div class="stats-sec-title">Collection</div>';
    const colList = document.createElement('div');
    colList.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px';
    for (let r = 4; r >= 0; r--) {
      if (rarityCounts[r] === 0 && r > 0) continue; // always show Common, hide empty higher rarities
      const tag = document.createElement('span');
      tag.className = RARITY_CLS[r];
      tag.style.cssText = 'font-size:.7rem;padding:3px 10px;background:var(--bg-inset);border:1px solid currentColor;border-radius:10px;font-weight:600';
      tag.textContent = RARITY_NAMES[r] + ' \u00d7' + rarityCounts[r];
      colList.appendChild(tag);
    }
    colSec.appendChild(colList);
    panel.appendChild(colSec);
  }

  // Category breakdown
  if (S.catsSeen.length > 0) {
    const catSec = document.createElement('div');
    catSec.className = 'stats-section';
    catSec.innerHTML = '<div class="stats-sec-title">' + t('catDiscovered') + '</div>';
    const catList = document.createElement('div');
    catList.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px';
    S.catsSeen.forEach(cat => {
      const tag = document.createElement('span');
      tag.style.cssText = 'font-size:.65rem;padding:2px 8px;background:var(--border-secondary);border:1px solid var(--border-primary);border-radius:10px;color:var(--text-secondary)';
      tag.textContent = cat;
      catList.appendChild(tag);
    });
    catSec.appendChild(catList);
    panel.appendChild(catSec);
  }

  // Skill tree summary
  const fameSpent = Object.values(S.f).reduce((a, b) => a + b, 0);
  if (fameSpent > 0) {
    const skillSec = document.createElement('div');
    skillSec.className = 'stats-section';
    skillSec.innerHTML = '<div class="stats-sec-title">' + t('skillTree') + '</div>';
    const skillDetails = [];
    FAME_TREE.forEach((branch, bIdx) => {
      branch.upgrades.forEach((u, uIdx) => {
        const lv = S.f[u.id] || 0;
        if (lv > 0) skillDetails.push(ta('ft_'+bIdx+'_'+uIdx+'_name', u.name) + (u.max > 1 ? ' \u00d7' + lv : ''));
      });
    });
    const slist = document.createElement('div');
    slist.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px';
    skillDetails.forEach(s => {
      const tag = document.createElement('span');
      tag.style.cssText = 'font-size:.65rem;padding:2px 8px;background:var(--bg-hover);border:1px solid var(--accent-blue);border-radius:10px;color:var(--accent-blue)';
      tag.textContent = s;
      slist.appendChild(tag);
    });
    skillSec.appendChild(slist);
    panel.appendChild(skillSec);
  }

  // Software history table
  const histSec = document.createElement('div');
  histSec.className = 'stats-section';
  histSec.innerHTML = '<div class="stats-sec-title">' + t('softwareHistory') + '</div>';
  if (S.games.length > 0) {
    const tbl = document.createElement('table');
    tbl.className = 'stats-table';
    tbl.innerHTML = '<thead><tr><th>' + t('year') + '</th><th>' + t('software') + '</th><th>' + t('category') + '</th><th>' + t('fame') + '</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (let i = S.games.length - 1; i >= 0; i--) {
      const g = S.games[i];
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + g.year + '</td><td>' + g.name + '</td><td>' + (g.cat || '-') + '</td><td>' + (g.fame != null ? '+' + g.fame : '-') + '</td>';
      tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
    histSec.appendChild(tbl);
  } else {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px;font-size:.8rem';
    empty.textContent = t('noShipped');
    histSec.appendChild(empty);
  }
  panel.appendChild(histSec);
  const close = document.createElement('button');
  close.className = 'st-close';
  close.textContent = '\u00d7';
  close.addEventListener('click', () => ov.remove());
  ov.appendChild(close);
  ov.appendChild(panel);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

function openSettings() {
  ensureAudio();
  const old = document.querySelector('.st-ov');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'st-ov';
  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  const title = document.createElement('div');
  title.className = 'settings-title';
  title.textContent = t('settings');
  panel.appendChild(title);
  function makeSlider(labelKey, val, onChange) {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const lbl = document.createElement('div');
    lbl.className = 'settings-label';
    lbl.textContent = t(labelKey);
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = 0; slider.max = 100;
    slider.value = Math.round(val * 100);
    slider.className = 'settings-slider';
    const valDisp = document.createElement('div');
    valDisp.className = 'settings-val';
    valDisp.textContent = slider.value + '%';
    slider.addEventListener('input', () => {
      valDisp.textContent = slider.value + '%';
      onChange(slider.value / 100);
    });
    row.appendChild(lbl); row.appendChild(slider); row.appendChild(valDisp);
    return row;
  }
  panel.appendChild(makeSlider('musicVol', S.musicVol, v => {
    setMusicVol(v);
    if (v > 0 && !curMusicEra) updateMusic();
  }));
  panel.appendChild(makeSlider('sfxVol', S.sfxVol, v => {
    setSfxVol(v);
    playSfx('click');
  }));
  const fb = document.createElement('a');
  fb.href = 'https://github.com/CheesusCrustBoyMillionare/Software-Dev-Clicker/issues/new';
  fb.target = '_blank';
  fb.rel = 'noopener';
  fb.style.cssText = 'display:block;text-align:center;margin-top:14px;padding:8px 16px;background:var(--border-secondary);color:var(--accent-blue);border:1px solid var(--border-primary);border-radius:var(--border-radius);font-size:.75rem;font-weight:600;text-decoration:none;cursor:pointer;transition:background .15s';
  fb.textContent = '\uD83D\uDCAC Send Feedback';
  fb.addEventListener('mouseenter', () => fb.style.background = 'var(--border-primary)');
  fb.addEventListener('mouseleave', () => fb.style.background = 'var(--border-secondary)');
  panel.appendChild(fb);
  const pn = document.createElement('a');
  pn.href = 'https://github.com/CheesusCrustBoyMillionare/Software-Dev-Clicker/blob/main/PATCH_NOTES.md';
  pn.target = '_blank';
  pn.rel = 'noopener';
  pn.style.cssText = 'display:block;text-align:center;margin-top:6px;padding:8px 16px;background:var(--border-secondary);color:var(--accent-blue);border:1px solid var(--border-primary);border-radius:var(--border-radius);font-size:.75rem;font-weight:600;text-decoration:none;cursor:pointer;transition:background .15s';
  pn.textContent = '\uD83D\uDCCB Patch Notes';
  pn.addEventListener('mouseenter', () => pn.style.background = 'var(--border-primary)');
  pn.addEventListener('mouseleave', () => pn.style.background = 'var(--border-secondary)');
  panel.appendChild(pn);
  const ver = document.createElement('div');
  ver.style.cssText = 'text-align:center;color:var(--text-secondary);font-size:.65rem;margin-top:8px';
  ver.textContent = 'v' + GAME_VERSION;
  panel.appendChild(ver);
  const close = document.createElement('button');
  close.className = 'st-close';
  close.textContent = '\u00d7';
  close.addEventListener('click', () => ov.remove());
  ov.appendChild(close);
  ov.appendChild(panel);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

// ========== NYT HEADLINE BANNER ==========
function showNYTBanner(year, headline) {
  let b = document.getElementById('nytBanner');
  if (b) b.remove();
  b = document.createElement('div');
  b.id = 'nytBanner'; b.className = 'nyt-banner';
  b.innerHTML = '<div class="nyt-label">The New York Times</div><div class="nyt-year">' + year + '</div><div class="nyt-headline">\u201C' + headline + '\u201D</div>';
  document.body.appendChild(b);
  setTimeout(() => { b.style.opacity = '0'; b.style.transition = 'opacity 1s'; setTimeout(() => b.remove(), 1000); }, 8000);
}

// ========== SKILL TREE MODAL ==========
// Node positions: [x, y] relative to graph content (1518x1038)
// Hub at center (775, 520). Branches radiate to 4 corners, 1.55× scaled for spacing.
// Indices 0-2: spine (existing), 3-7: sub-branches (new)
// v8.x: Tabbed horizontal skill tree (replaces old absolute-positioned graph)
function openSkillTree() {
  const old = document.querySelector('.st-ov');
  if (old) old.remove();

  let activeBranch = 0;

  const ov = document.createElement('div');
  ov.className = 'st-ov';

  const graph = document.createElement('div');
  graph.className = 'st-graph';

  // Close button
  const close = document.createElement('button');
  close.className = 'st-close';
  close.textContent = '\u2715';
  close.addEventListener('click', () => ov.remove());

  // Header: fame display + respec + close
  const header = document.createElement('div');
  header.className = 'st-header';
  const fameArea = document.createElement('div');
  fameArea.className = 'st-fame';
  const fameVal = document.createElement('div');
  fameVal.className = 'st-hub-val';
  fameVal.textContent = S.fame;
  const fameLbl = document.createElement('div');
  fameLbl.className = 'st-hub-lbl';
  fameLbl.textContent = t('fame');
  fameArea.append(fameVal, fameLbl);
  header.appendChild(fameArea);

  // Right-side actions (respec + close)
  const actions = document.createElement('div');
  actions.className = 'st-hdr-actions';

  // Respec button (only after first ship)
  const fameSpent = FAME_TREE.reduce((tt, b) => tt + b.upgrades.reduce((s, u) => s + (S.f[u.id] || 0) * u.cost, 0), 0);
  if (S.shipped >= 1 && fameSpent > 0) {
    const respec = document.createElement('button');
    respec.className = 'st-respec' + (S.fameResetUsed ? ' used' : '');
    respec.textContent = S.fameResetUsed ? 'Respec used \u2014 resets after ship' : 'Respec (' + fameSpent + ' Fame)';
    if (!S.fameResetUsed) {
      respec.addEventListener('click', () => {
        // Confirmation overlay
        const cov = document.createElement('div');
        cov.className = 'st-ov';
        cov.style.zIndex = '200';
        const cbox = document.createElement('div');
        cbox.style.cssText = 'background:var(--bg-surface);border:1px solid var(--border-primary);border-radius:var(--border-radius);padding:20px;max-width:340px;text-align:center;box-shadow:0 0 30px rgba(0,0,0,.5)';
        const cTitle = document.createElement('div');
        cTitle.style.cssText = 'font-size:.95rem;font-weight:700;color:var(--accent-red-bright);margin-bottom:10px';
        cTitle.textContent = '\u26A0 Respec Warning';
        const cMsg = document.createElement('div');
        cMsg.style.cssText = 'font-size:.78rem;color:var(--text-primary);line-height:1.5;margin-bottom:16px';
        cMsg.textContent = 'You can only respec once per software release. This will refund ' + fameSpent + ' Fame and reset all skills. Are you sure?';
        const cBtns = document.createElement('div');
        cBtns.style.cssText = 'display:flex;gap:10px;justify-content:center';
        const cYes = document.createElement('button');
        cYes.style.cssText = 'padding:6px 18px;background:var(--accent-red);border:none;border-radius:var(--border-radius);color:#fff;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit';
        cYes.textContent = 'Respec';
        cYes.addEventListener('click', () => {
          cov.remove();
          FAME_TREE.forEach(b => b.upgrades.forEach(u => { S.fame += (S.f[u.id] || 0) * u.cost; S.f[u.id] = 0; }));
          S.fameResetUsed = 1;
          markDirty();
          toast('Skill tree reset! ' + fameSpent + ' Fame refunded. Next respec after shipping.');
          log('Skill tree respec: +' + fameSpent + ' Fame (resets after next ship)');
          openSkillTree();
        });
        const cNo = document.createElement('button');
        cNo.style.cssText = 'padding:6px 18px;background:var(--bg-hover);border:1px solid var(--border-primary);border-radius:var(--border-radius);color:var(--text-primary);font-size:.8rem;cursor:pointer;font-family:inherit';
        cNo.textContent = 'Cancel';
        cNo.addEventListener('click', () => cov.remove());
        cBtns.appendChild(cYes);
        cBtns.appendChild(cNo);
        cbox.appendChild(cTitle);
        cbox.appendChild(cMsg);
        cbox.appendChild(cBtns);
        cov.appendChild(cbox);
        cov.addEventListener('click', e => { if (e.target === cov) cov.remove(); });
        document.body.appendChild(cov);
      });
    }
    actions.appendChild(respec);
  }
  actions.appendChild(close);
  header.appendChild(actions);
  graph.appendChild(header);

  // Tab bar
  const tabs = document.createElement('div');
  tabs.className = 'st-tabs';
  FAME_TREE.forEach((branch, bIdx) => {
    const tab = document.createElement('button');
    tab.className = 'st-tab' + (bIdx === activeBranch ? ' active' : '');
    tab.style.setProperty('--bc', branch.color);
    tab.textContent = ta('ft_' + bIdx + '_name', branch.name);
    tab.addEventListener('click', () => {
      activeBranch = bIdx;
      tabs.querySelectorAll('.st-tab').forEach((t, i) => t.classList.toggle('active', i === bIdx));
      renderBranch(bIdx);
    });
    tabs.appendChild(tab);
  });
  graph.appendChild(tabs);

  // Path container
  const path = document.createElement('div');
  path.className = 'st-path';
  graph.appendChild(path);

  // Build a node element
  function makeNode(u, uIdx, bIdx, color) {
    const owned = S.f[u.id] || 0;
    const isMystery = u.max === 0;
    const maxed = !isMystery && owned >= u.max;
    const reqIdx = u.req != null ? u.req : (uIdx > 0 ? uIdx - 1 : -1);
    const branch = FAME_TREE[bIdx];
    const prereqMet = reqIdx < 0 || (S.f[branch.upgrades[reqIdx].id] || 0) >= 1;
    const afford = !isMystery && prereqMet && S.fame >= u.cost && !maxed;
    const locked = isMystery || !prereqMet;

    const node = document.createElement('div');
    node.className = 'st-node';
    node.setAttribute('role', 'button');
    node.tabIndex = 0;
    node.style.setProperty('--bc', color);
    if (owned > 0) node.classList.add('owned');
    if (maxed) node.classList.add('maxed');
    if (locked) node.classList.add('locked');
    else if (!afford) node.classList.add('no');
    if (isMystery) node.style.borderStyle = 'dashed';

    const costText = isMystery ? t('unknown') : maxed ? t('maxLvl') : u.cost + ' ' + t('fame');
    const lvlText = isMystery ? '' : owned > 0 ? 'Lv ' + owned + (u.max > 1 ? '/' + u.max : '') : '';
    node.innerHTML = '<div class="st-node-name">' + ta('ft_' + bIdx + '_' + uIdx + '_name', u.name) + '</div>'
      + '<div class="st-node-desc">' + ta('ft_' + bIdx + '_' + uIdx + '_desc', u.desc) + '</div>'
      + '<div class="st-node-cost">' + costText + '</div>'
      + (lvlText ? '<div class="st-node-lvl">' + lvlText + '</div>' : '');

    if (!locked && !maxed && !isMystery) {
      node.addEventListener('click', () => {
        buyFame(bIdx, uIdx);
        fameVal.textContent = S.fame;
        renderBranch(activeBranch);
      });
    }
    return { node, owned, locked };
  }

  // Arrow SVG between nodes
  function makeArrow(color, dim) {
    const arrow = document.createElement('div');
    arrow.className = 'st-arrow';
    arrow.innerHTML = '<svg viewBox="0 0 32 16"><line x1="0" y1="8" x2="26" y2="8" stroke="' + color + '" stroke-width="2" stroke-opacity="' + (dim ? '.15' : '.5') + '"/><polygon points="26,4 32,8 26,12" fill="' + color + '" fill-opacity="' + (dim ? '.15' : '.5') + '"/></svg>';
    return arrow;
  }

  // Sub-branch connector (vertical bar)
  function makeSubArrow(color, lit) {
    const bar = document.createElement('div');
    bar.className = 'st-sub-arrow' + (lit ? ' lit' : '');
    bar.style.setProperty('--bc', color);
    return bar;
  }

  // Render one branch as horizontal path
  function renderBranch(bIdx) {
    path.innerHTML = '';
    const branch = FAME_TREE[bIdx];
    const color = branch.color;
    const ups = branch.upgrades;

    // Build dependency tree: group nodes by their spine parent
    // Spine nodes: nodes whose req forms a chain (-1 → 0 → 1 → 2 ...)
    // We find the spine by following req from -1 upward
    const spineSet = new Set();
    const childrenOf = {};  // spineIdx -> [uIdx, uIdx, ...]

    // First pass: identify spine nodes (nodes reachable by following req=-1 → 0 → next)
    let spineOrder = [];
    // Root nodes (req === -1)
    const roots = [];
    for (let i = 0; i < ups.length; i++) {
      if (ups[i].req === -1) roots.push(i);
    }
    // Build spine: walk from first root following the chain where each node's child points back to it
    // Simple approach: BFS/DFS to find the longest chain from roots
    // Actually, let's use a simpler approach: identify the "main path" as nodes where
    // another node lists them as req AND they themselves are on a chain from a root.
    // For display purposes, treat nodes with req=-1 as column 0,
    // nodes with req=0 as column 1, req=1 as column 2, req=2 as column 3.
    // Group all nodes by their req value into columns.
    const columns = {};  // reqIdx -> [uIdx, ...]
    for (let i = 0; i < ups.length; i++) {
      const r = ups[i].req;
      if (!columns[r]) columns[r] = [];
      columns[r].push(i);
    }

    // Build columns left to right: start with req=-1, then for each node in that column,
    // check if anything points to it, creating the next column
    const colOrder = [];  // each entry: { parent: reqIdx, nodes: [uIdx, ...] }
    let currentReqs = [-1];
    const visited = new Set();
    while (currentReqs.length > 0) {
      const colNodes = [];
      for (const r of currentReqs) {
        if (columns[r]) {
          for (const idx of columns[r]) {
            if (!visited.has(idx)) {
              visited.add(idx);
              colNodes.push(idx);
            }
          }
        }
      }
      if (colNodes.length === 0) break;
      colOrder.push(colNodes);
      currentReqs = colNodes;
    }

    // Render columns with arrows between them
    colOrder.forEach((colNodes, cIdx) => {
      // Arrow before this column (except first)
      if (cIdx > 0) {
        const prevOwned = colOrder[cIdx - 1].some(i => (S.f[ups[i].id] || 0) > 0);
        path.appendChild(makeArrow(color, !prevOwned));
      }

      const col = document.createElement('div');
      col.className = 'st-col';

      colNodes.forEach((uIdx, nIdx) => {
        if (nIdx > 0) col.appendChild(makeSubArrow(color, (S.f[ups[colNodes[0]].id] || 0) > 0));
        const { node } = makeNode(ups[uIdx], uIdx, bIdx, color);
        col.appendChild(node);
      });

      path.appendChild(col);
    });
  }

  renderBranch(activeBranch);

  ov.appendChild(graph);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

function buyFame(bIdx, uIdx) {
  const branch = FAME_TREE[bIdx];
  if (!branch) return;
  const u = branch.upgrades[uIdx];
  if (!u || u.max === 0) return;
  if (S.f[u.id] >= u.max || S.fame < u.cost) return;
  const reqIdx = u.req != null ? u.req : (uIdx > 0 ? uIdx - 1 : -1);
  if (reqIdx >= 0 && (S.f[branch.upgrades[reqIdx].id] || 0) < 1) return;
  S.fame -= u.cost;
  S.f[u.id]++;
  markDirty();
  const fName = ta('ft_'+bIdx+'_'+uIdx+'_name', u.name);
  log(t('logSkill') + ': ' + fName + (u.max > 1 ? ' (Lv ' + S.f[u.id] + ')' : ''));
  playSfx('buy');
  // v7.8: Early Access — immediately check if any types should unlock
  if (u.id === 'goldenParachute') checkTypeUnlocks();
}

// v9.1: shared unlock check — prevents duplicate toasts
function checkTypeUnlocks() {
  if (!Array.isArray(S.unlockedTypes)) return;
  const yr = currentYear();
  let any = false;
  for (const meta of ENG_TYPES) {
    if (meta.key === 'coder') continue;
    if (yr >= meta.unlockYear - (S.f.goldenParachute || 0) && !S.unlockedTypes.includes(meta.key)) {
      S.unlockedTypes.push(meta.key);
      toast('\u{1F389} New engineer type unlocked: ' + meta.name + ' (' + meta.res + ')');
      log('\u{1F389} ' + meta.name + ' engineers can now be hired (\u2192 ' + meta.res + ')');
      any = true;
    }
  }
  if (any) { renderTypeTabs(); renderResourceBar(); renderShipPanel(); }
}

// v7.3: ship requires every unlocked engineer type to meet its own threshold
function canShip() {
  if (S.shipped >= RELEASE_YEARS.length) return false; // v10: no more than 10 releases
  if (!Array.isArray(S.unlockedTypes)) return false;
  for (const type of S.unlockedTypes) {
    if (engTRes(type) < engShipAt(type)) return false;
  }
  return true;
}
function ship() {
  if (!canShip()) return;
  const year = currentYear();
  const lm = getLandmark(year);
  const name = lm.parody;
  const gain = fameGain();
  S.games.push({ name, year, cat: lm.cat, fame: gain, target: shipAt() });
  // Unlock code base upgrade for new category
  if (!S.catsSeen.includes(lm.cat)) {
    S.catsSeen.push(lm.cat);
    if (S.cb < CODE_BASE.length) {
      S.cb++;
      const cbName = ta('cb_'+(S.cb-1)+'_name', CODE_BASE[S.cb - 1].name);
      log('\uD83D\uDCDA ' + t('cbUnlocked') + ': ' + cbName);
    }
  }
  S.fame += gain; S.tFame += gain;
  S.shipped++;
  S.fameResetUsed = 0;
  // v7.2: severance cost resets to 500 base each ship
  S.fireCount = 0;
  // v7.2: ship is no longer a prestige reset — generators, equipment, clickers,
  // support, recruiters, facilities, and resources all persist across ships.
  // v10: Engineers gain +1 exp per ship (gradual tier progression) but age by real year gap.
  const gap = yearGap();
  if (!Array.isArray(S.coders)) S.coders = [];
  S.coders.forEach(c => {
    if (c.age === undefined) { c.age = 20 + (c.edu || 0) * 2 + (c.exp || 0); c.retireAge = Math.min(78, 57 + (c.edu || 0) * 2 + Math.floor((c.seed || Math.random()) * (11 + (c.edu || 0) * 2))); }
    c.exp += 1; c.age += gap; c.tier = computeTier(c.edu, c.exp, c.seed);
  });
  // v7.3: also age engineers from the new types
  if (S.engineers) {
    for (const k in S.engineers) {
      for (const c of (S.engineers[k].list || [])) {
        if (c.age === undefined) { c.age = 20 + (c.edu || 0) * 2 + (c.exp || 0); c.retireAge = Math.min(78, 57 + (c.edu || 0) * 2 + Math.floor((c.seed || Math.random()) * (11 + (c.edu || 0) * 2))); }
        c.exp += 1; c.age += gap; c.tier = computeTier(c.edu, c.exp, c.seed);
      }
    }
  }
  // v9.1: retirement check — remove engineers who reached retirement age
  (function retireCheck() {
    let retired = [];
    if (Array.isArray(S.coders)) {
      S.coders = S.coders.filter(c => {
        if (c.age >= c.retireAge) { retired.push(c); return false; }
        return true;
      });
    }
    if (S.engineers) {
      for (const k in S.engineers) {
        const list = S.engineers[k].list;
        if (!Array.isArray(list)) continue;
        S.engineers[k].list = list.filter(c => {
          if (c.age >= c.retireAge) { retired.push(c); return false; }
          return true;
        });
      }
    }
    if (retired.length > 0) {
      S.totalRetired = (S.totalRetired || 0) + retired.length;
      if (retired.length <= 3) {
        retired.forEach(c => log('\u{1F382} ' + c.name + ' retired at age ' + c.age));
      } else {
        log('\u{1F382} ' + retired.length + ' engineers retired');
      }
      window._pendingRetired = retired;
    }
  })();
  // v7.3: bump shippedSince for every unlocked type so each one's threshold scales
  if (Array.isArray(S.unlockedTypes) && S.engineers) {
    for (const k of S.unlockedTypes) {
      if (k === 'coder') continue;
      if (S.engineers[k]) S.engineers[k].shippedSince = (S.engineers[k].shippedSince || 0) + 1;
    }
  }
  recomputeG();
  markDirty();
  // v7.3: year-based unlock for the next engineer type
  checkTypeUnlocks();
  // v7.6: Engine perk bootstraps types that have NO coders yet with 6 starters
  // (2 per tier 0,1,2). Types that already have coders are skipped to prevent
  // production snowball that makes mid-game ships trivially fast.
  if (S.f.engine) {
    if (!S.offices) S.offices = Object.fromEntries(ENG_TYPES.map(e => [e.key, 0]));
    const starters = [[0,2],[1,2],[2,2]];
    for (const typeKey of (S.unlockedTypes || ['coder'])) {
      if (typeof S.offices[typeKey] !== 'number') S.offices[typeKey] = 0;
      const targetList = engList(typeKey);
      if (targetList.length > 0) continue; // Only bootstrap empty types
      const needCap = targetList.length + 6;
      while (S.offices[typeKey] < OFFICES.length - 1 && OFFICES[S.offices[typeKey]].cap < needCap) {
        S.offices[typeKey]++;
      }
      if (typeKey === 'coder') S.office = S.offices.coder;
      for (const [i, n] of starters) {
        for (let k = 0; k < n; k++) {
          const _edu = Math.min(4, Math.floor(i/2) + 1);
          targetList.push({
            name: FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)] + ' ' + LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)],
            edu: _edu,
            exp: 0,
            rarity: 0,
            seed: Math.random(),
            tier: i,
            age: (18 + _edu * 2) + Math.floor(Math.random() * 5),
            retireAge: Math.min(78, 57 + _edu * 2 + Math.floor(Math.random() * (11 + _edu * 2)))
          });
        }
      }
    }
    recomputeG();
    markDirty();
  }
  // v7.8: Seed Round — all unlocked types get +2%×Lv of their ship threshold per ship
  if (S.f.ventureCapital) {
    for (const k of (S.unlockedTypes || ['coder'])) {
      const vc = Math.floor(engShipAt(k) * 0.02 * S.f.ventureCapital);
      if (vc > 0) {
        if (k === 'coder') { S.loc += vc; S.tLoc += vc; }
        else engAddRes(k, vc);
      }
    }
  }
  clearOfficeSprites();
  isShipping = true;
  showYearTransition(year, name, lm.cat);
  toast(name + ' ' + t('toastShipped') + ' +' + gain + ' ' + t('fame'));
  log('\uD83D\uDE80 ' + name + ' ' + t('toastShipped') + ' +' + gain + ' ' + t('fame'));
  // v10: victory message after shipping all 10 releases
  if (S.shipped >= RELEASE_YEARS.length) {
    setTimeout(() => {
      toast('\uD83C\uDFC6 You shipped through the entire history of computing!');
      log('\uD83C\uDFC6 Congratulations — all ' + RELEASE_YEARS.length + ' landmark releases shipped!');
    }, 2500);
  }
  playSfx('ship');
}

