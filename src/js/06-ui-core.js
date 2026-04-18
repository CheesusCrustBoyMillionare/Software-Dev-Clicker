// ========== DOM ==========
const $ = document.getElementById.bind(document);
const dYear = $('dYear'), dCat = $('dCat'), dLoc = $('dLoc'), dLps = $('dLps'), dFame = $('dFame');
// v7.3: dynamic labels and tab container
const _dLocLbl = $('dLocLbl'), _dLpsLbl = $('dLpsLbl');
let _typeTabsEl = null;
let _bestType = null;
let _shownShipTutorial = false;
let _shownFmtTutorial = false;
const dCp = $('dCp'), dFm = $('dFm');
const pFill = $('pFill'), pTxt = $('pTxt');
const upsEl = $('ups'), ups2El = $('ups2'), logCol = $('logCol'), toasts = $('toasts'), mon = $('mon'), scr = $('scr');
const deskScene = $('deskScene'), deskEl = $('deskEl');
const perkEls = {
  [P.ENERGY]:$('perkEnergy'),[P.LUNCH]:$('perkLunch'),
  [P.DAYCARE]:$('perkDaycare'),[P.GYM]:$('perkGym'),
  [P.GAMEROOM]:$('perkGameroom'),[P.PTO]:$('perkPto'),
  [P.NAP]:$('perkNap'),[P.RETREAT]:$('perkRetreat'),
};
let currentComputerEra = '';
let _startBtn = null, _startMenu = null, _startWrap = null, _cmdBtns = [];

// v9.1: Toggle Start button vs command-style buttons based on era
const CMD_ERAS = new Set(['era-apple2', 'era-dos', 'era-win3x']);
const CMD_LABELS = ['/skills', '/achieve', '/stats', '/config'];
const NORMAL_KEYS = ['skillTree', 'achievements', 'stats', 'settings'];
function updateLogBtnMode() {
  if (!_startWrap) return;
  const isCmd = CMD_ERAS.has(currentComputerEra);
  // Toggle entire Start wrapper vs individual buttons
  _startWrap.classList.toggle('hidden', isCmd);
  // Collapse accordion on era change
  _startBtn.classList.remove('open');
  _startMenu.classList.remove('open');
  _cmdBtns.forEach((btn, i) => {
    btn.classList.toggle('hidden', !isCmd);
    if (isCmd) btn.textContent = CMD_LABELS[i];
    else btn.textContent = t(NORMAL_KEYS[i]) || NORMAL_KEYS[i];
  });
  // Toggle cmd-mode class on parent for font overrides
  const logBtns = _startWrap.parentElement;
  if (logBtns) logBtns.classList.toggle('cmd-mode', isCmd);
}

let _eraYear = -1, _era = null;
function updateDeskScene() {
  const year = currentYear();
  if (year !== _eraYear) {
    _eraYear = year;
    _era = COMPUTER_ERAS.find(e => year <= e.max) || COMPUTER_ERAS[COMPUTER_ERAS.length - 1];
  }
  const era = _era;
  if (era.cls !== currentComputerEra) {
    // v8.x: era class on <html> so CSS custom properties cascade to entire UI
    if (currentComputerEra) document.documentElement.classList.remove(currentComputerEra);
    document.documentElement.classList.add(era.cls);
    currentComputerEra = era.cls;
    // Chromium won't recompute var()-based styles when transitions are active on
    // ancestor-inherited custom properties. Briefly kill transitions to force recompute,
    // then re-enable so future non-era property changes still animate.
    const s = document.createElement('style');
    s.textContent = '*{transition:none!important}';
    document.head.appendChild(s);
    void document.body.offsetHeight;          // force synchronous layout
    requestAnimationFrame(() => s.remove());  // re-enable transitions next frame
    updateLogBtnMode();
  }
  for (const idx in perkEls) {
    const el = perkEls[idx];
    if (el) el.classList.toggle('active', S.c[idx] >= 1);
  }
  if (deskScene) deskScene.classList.toggle('has-standing', S.c[P.DESK] >= 1);
}

// Build upgrade elements once, store refs
const upRefs = [];
let maxBtn = null, hoveredGen = -1;

function buildUI() {
  const frag = document.createDocumentFragment();
  const frag2 = document.createDocumentFragment();
  let target = frag;

  function sec(title) {
    const d = document.createElement('div');
    d.className = 'sec';
    d.textContent = title;
    target.appendChild(d);
  }

  function row(action, idx, name, desc, isFame) {
    const el = document.createElement('div');
    el.className = 'up';
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.dataset.a = action;
    el.dataset.i = idx;
    const info = document.createElement('div'); info.className = 'up-info';
    const n = document.createElement('div'); n.className = 'up-name'; n.textContent = name;
    const dd = document.createElement('div'); dd.className = 'up-desc'; dd.textContent = desc;
    info.append(n, dd);
    const cost = document.createElement('div'); cost.className = 'up-cost' + (isFame ? ' fame' : '');
    const own = document.createElement('div'); own.className = 'up-own';
    el.append(info, cost, own);
    target.appendChild(el);
    upRefs.push({ el, costEl: cost, ownEl: own, action, idx });
  }

  // Quantity selector bar
  const qBar = document.createElement('div'); qBar.className = 'qty-bar'; qBar.id = 'qtyBar';
  [1, 5, 25, Infinity].forEach(q => {
    const b = document.createElement('button');
    b.className = 'qty-btn' + (q === buyQty ? ' active' : '');
    b.textContent = q === Infinity ? t('max') : '×' + q;
    b.dataset.q = q;
    if (q === Infinity) maxBtn = b;
    qBar.appendChild(b);
  });
  frag.appendChild(qBar);

  sec(t('coders'));
  // v6.8: Hire Pack button (single button replaces per-tier buying)
  {
    const ph = document.createElement('div');
    ph.className = 'pack-header';
    ph.id = 'packHeader';
    const pInfo = document.createElement('div'); pInfo.className = 'pack-info';
    const pTitle = document.createElement('div'); pTitle.className = 'pack-title'; pTitle.textContent = 'Hire';
    const pDesc = document.createElement('div'); pDesc.className = 'pack-desc'; pDesc.id = 'packDesc'; pDesc.textContent = packSize() === 1 ? '1 random engineer' : packSize() + ' random engineers';
    pInfo.append(pTitle, pDesc);
    const pCost = document.createElement('div'); pCost.className = 'pack-cost'; pCost.id = 'packCost';
    ph.append(pInfo, pCost);
    frag.appendChild(ph);
  }
  // v6.9: Upgrade Office button
  {
    const oh = document.createElement('div');
    oh.className = 'office-header';
    oh.id = 'officeHeader';
    const oInfo = document.createElement('div'); oInfo.className = 'pack-info';
    const oTitle = document.createElement('div'); oTitle.className = 'office-title'; oTitle.id = 'officeTitle'; oTitle.textContent = 'Office';
    const oDesc = document.createElement('div'); oDesc.className = 'pack-desc'; oDesc.id = 'officeDesc';
    oInfo.append(oTitle, oDesc);
    const oCost = document.createElement('div'); oCost.className = 'pack-cost'; oCost.id = 'officeCost';
    oh.append(oInfo, oCost);
    frag.appendChild(oh);
  }
  GEN.forEach((g, i) => {
    // Main employee row (same as row() but with toggle button)
    const el = document.createElement('div');
    el.className = 'up';
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.dataset.a = 'g';
    el.dataset.i = i;
    const info = document.createElement('div'); info.className = 'up-info';
    const n = document.createElement('div'); n.className = 'up-name'; n.textContent = ta('gen_'+i+'_name', g.name);
    const dd = document.createElement('div'); dd.className = 'up-desc'; dd.textContent = ta('gen_'+i+'_desc', g.desc) + ' (+' + g.rate + ' ' + t('clicksPerSec') + ')';
    info.append(n, dd);
    const cost = document.createElement('div'); cost.className = 'up-cost';
    const own = document.createElement('div'); own.className = 'up-own';
    const rateEl = document.createElement('div'); rateEl.className = 'up-rate';
    const tog = document.createElement('button'); tog.className = 'eu-toggle'; tog.textContent = '+'; tog.dataset.gi = i;
    el.append(info, cost, own, rateEl, tog);
    el.addEventListener('mouseenter', () => { hoveredGen = i; });
    el.addEventListener('mouseleave', () => { if (hoveredGen === i) hoveredGen = -1; });
    frag.appendChild(el);
    upRefs.push({ el, costEl: cost, ownEl: own, rateEl, action: 'g', idx: i });

    // Employee upgrade submenu
    const sub = document.createElement('div'); sub.className = 'eu-sub'; sub.id = 'eu-sub-' + i;
    EMP_UPS.forEach((eu, ui) => {
      const r = document.createElement('div'); r.className = 'eu-row'; r.dataset.gi = i; r.dataset.ui = ui;
      const t0 = eu.tiers[0];
      const rn = document.createElement('span'); rn.className = 'eu-row-name'; rn.textContent = t0.name;
      const rd = document.createElement('span'); rd.className = 'eu-row-desc'; rd.textContent = t0.desc;
      const rc = document.createElement('span'); rc.className = 'eu-row-cost';
      const rl = document.createElement('span'); rl.className = 'eu-row-lvl';
      r.append(rn, rd, rc, rl);
      sub.appendChild(r);
    });
    frag.appendChild(sub);
  });
  target = frag2;
  sec(t('supportStaff'));
  // Secretary — simple row
  row('ss', 0, ta('sup_0_name', SUPPORT[0].name), ta('sup_0_desc', SUPPORT[0].desc));
  { const spr0 = document.createElement('div'); spr0.className = 'staff-sprite-inline'; spr0.id = 'staffSprite0'; target.lastElementChild.prepend(spr0); }
  // Recruiter — v6.8: passive pack-cost discount (no pause, no progress bar)
  // v7.4: adds a training submenu with 3 one-time upgrades (Headhunter, Talent Pool, Executive Retainer)
  {
    const s = SUPPORT[1];
    const el2 = document.createElement('div');
    el2.className = 'up';
    el2.dataset.a = 'ss';
    el2.dataset.i = 1;
    const info2 = document.createElement('div'); info2.className = 'up-info';
    const n2 = document.createElement('div'); n2.className = 'up-name'; n2.textContent = ta('sup_1_name', s.name);
    const dd2 = document.createElement('div'); dd2.className = 'up-desc'; dd2.textContent = 'Each level reduces Hire cost by 2% (Trainer scales).';
    info2.append(n2, dd2);
    const cost2 = document.createElement('div'); cost2.className = 'up-cost';
    const own2 = document.createElement('div'); own2.className = 'up-own';
    el2.style.position = 'relative'; el2.style.overflow = 'hidden';
    const spr1 = document.createElement('div'); spr1.className = 'staff-sprite-inline'; spr1.id = 'staffSprite1';
    // v7.4: submenu toggle button (reuses .eu-toggle styling)
    const rtog = document.createElement('button'); rtog.className = 'eu-toggle'; rtog.textContent = '+'; rtog.id = 'ruToggle';
    el2.append(spr1, info2, cost2, own2, rtog);
    target.appendChild(el2);
    upRefs.push({ el: el2, costEl: cost2, ownEl: own2, action: 'ss', idx: 1 });

    // v7.4: recruiter-upgrade submenu
    const rsub = document.createElement('div'); rsub.className = 'eu-sub'; rsub.id = 'ru-sub';
    RECRUITER_UPS.forEach((ru, ui) => {
      const r = document.createElement('div'); r.className = 'ru-row'; r.dataset.ui = ui;
      const rn = document.createElement('span'); rn.className = 'eu-row-name'; rn.textContent = ta('ru_'+ui+'_name', ru.name);
      const rd = document.createElement('span'); rd.className = 'eu-row-desc'; rd.textContent = ta('ru_'+ui+'_desc', ru.desc);
      const rc = document.createElement('span'); rc.className = 'eu-row-cost';
      const rl = document.createElement('span'); rl.className = 'eu-row-lvl';
      r.append(rn, rd, rc, rl);
      rsub.appendChild(r);
    });
    target.appendChild(rsub);
  }
  // Facility Director — row with toggle + training submenu + progress bar
  {
    const s3 = SUPPORT[2];
    const el3 = document.createElement('div');
    el3.className = 'up';
    el3.dataset.a = 'ss';
    el3.dataset.i = 2;
    el3.style.position = 'relative'; el3.style.overflow = 'hidden';
    const info3 = document.createElement('div'); info3.className = 'up-info';
    const n3 = document.createElement('div'); n3.className = 'up-name'; n3.textContent = ta('sup_2_name', s3.name);
    const dd3 = document.createElement('div'); dd3.className = 'up-desc'; dd3.textContent = ta('sup_2_desc', s3.desc);
    info3.append(n3, dd3);
    const cost3 = document.createElement('div'); cost3.className = 'up-cost';
    const own3 = document.createElement('div'); own3.className = 'up-own';
    const fBar = document.createElement('div'); fBar.className = 'recruiter-bar';
    const fFill = document.createElement('div'); fFill.className = 'recruiter-fill'; fFill.id = 'facilityFill';
    fBar.appendChild(fFill);
    const pause3 = document.createElement('button'); pause3.className = 'pause-toggle' + (S.sp[2] ? ' paused' : ''); pause3.textContent = S.sp[2] ? '\u25B6' : '\u23F8'; pause3.dataset.sp = '2';
    const spr2 = document.createElement('div'); spr2.className = 'staff-sprite-inline'; spr2.id = 'staffSprite2';
    el3.append(spr2, info3, cost3, own3, pause3, fBar);
    target.appendChild(el3);
    upRefs.push({ el: el3, costEl: cost3, ownEl: own3, action: 'ss', idx: 2 });
  }
  // Trainer — simple row with pause toggle
  {
    const s4 = SUPPORT[3];
    const el4 = document.createElement('div');
    el4.className = 'up';
    el4.dataset.a = 'ss';
    el4.dataset.i = 3;
    const info4 = document.createElement('div'); info4.className = 'up-info';
    const n4 = document.createElement('div'); n4.className = 'up-name'; n4.textContent = ta('sup_3_name', s4.name);
    const dd4 = document.createElement('div'); dd4.className = 'up-desc'; dd4.textContent = ta('sup_3_desc', s4.desc);
    info4.append(n4, dd4);
    const cost4 = document.createElement('div'); cost4.className = 'up-cost';
    const own4 = document.createElement('div'); own4.className = 'up-own';
    const pause4 = document.createElement('button'); pause4.className = 'pause-toggle' + (S.sp[3] ? ' paused' : ''); pause4.textContent = S.sp[3] ? '\u25B6' : '\u23F8'; pause4.dataset.sp = '3';
    const spr3 = document.createElement('div'); spr3.className = 'staff-sprite-inline'; spr3.id = 'staffSprite3';
    el4.append(spr3, info4, cost4, own4, pause4);
    target.appendChild(el4);
    upRefs.push({ el: el4, costEl: cost4, ownEl: own4, action: 'ss', idx: 3 });
  }

  sec(t('officePerks'));
  CLK.forEach((c, i) => {
    // v6.8: Meeting Room repurposed — grants additional 15% pack-cost discount
    const desc = (i === P.MEETING) ? '\u221215% Hire cost (stacks with Recruiter)' : ta('clk_'+i+'_desc', c.desc);
    row('c', i, ta('clk_'+i+'_name', c.name), desc);
  });

  // Code Base Upgrades (permanent, unlocked by shipping new categories)
  sec(t('codeBase'));
  CODE_BASE.forEach((cb, i) => {
    const el3 = document.createElement('div');
    el3.className = 'up cb-up';
    el3.dataset.a = 'cb';
    el3.dataset.i = i;
    const info3 = document.createElement('div'); info3.className = 'up-info';
    const n3 = document.createElement('div'); n3.className = 'up-name'; n3.textContent = ta('cb_'+i+'_name', cb.name);
    const dd3 = document.createElement('div'); dd3.className = 'up-desc'; dd3.textContent = ta('cb_'+i+'_desc', cb.desc);
    info3.append(n3, dd3);
    const own3 = document.createElement('div'); own3.className = 'up-own';
    el3.append(info3, own3);
    target.appendChild(el3);
    upRefs.push({ el: el3, costEl: null, ownEl: own3, action: 'cb', idx: i });
  });

  target = frag;

  // Activity Log (right panel, left column)
  const logFrag = document.createDocumentFragment();
  const logHdr = document.createElement('div');
  logHdr.className = 'log-hdr';
  logHdr.textContent = t('activityLog');
  logFrag.appendChild(logHdr);
  const logPanel = document.createElement('div');
  logPanel.className = 'log-panel';
  logPanel.id = 'logPanel';
  // Restore existing log entries (newest first)
  for (let i = gameLog.length - 1; i >= 0; i--) {
    const e = gameLog[i];
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = '<span class="log-year">[' + e.year + ']</span>' + e.msg;
    logPanel.appendChild(entry);
  }
  logFrag.appendChild(logPanel);

  // Buttons below log
  const logBtns = document.createElement('div');
  logBtns.className = 'log-btns';

  // v9.1: Start button + menu wrapper (column-reverse so menu expands upward)
  const startWrap = document.createElement('div');
  startWrap.className = 'start-wrap hidden';

  const startBtn = document.createElement('button');
  startBtn.className = 'start-btn';
  startBtn.innerHTML = '\u229E Start <span class="start-arrow">\u25B2</span>';
  startBtn.addEventListener('click', () => {
    startBtn.classList.toggle('open');
    startMenu.classList.toggle('open');
  });
  startWrap.appendChild(startBtn);

  // Start menu — expands upward above button via column-reverse
  const startMenu = document.createElement('div');
  startMenu.className = 'start-menu';
  const _menuItems = [
    { key: 'settings', icon: '\u2699', fn: openSettings },
    { sep: true },
    { key: 'skillTree', icon: '\uD83C\uDF33', fn: openSkillTree },
    { key: 'achievements', icon: '\uD83C\uDFC6', fn: openAchievements },
    { key: 'stats', icon: '\uD83D\uDCCA', fn: openStats },
  ];
  _menuItems.forEach(mi => {
    if (mi.sep) {
      startMenu.appendChild(document.createElement('hr'));
      return;
    }
    const item = document.createElement('div');
    item.className = 'start-menu-item';
    item.textContent = mi.icon + ' ' + (t(mi.key) || mi.key);
    item.addEventListener('click', () => {
      startBtn.classList.remove('open');
      startMenu.classList.remove('open');
      mi.fn();
    });
    startMenu.appendChild(item);
  });
  startWrap.appendChild(startMenu);
  logBtns.appendChild(startWrap);

  // Individual buttons (visible in command-mode for pre-Windows eras)
  const stBtn = document.createElement('button');
  stBtn.className = 'st-btn';
  stBtn.textContent = t('skillTree');
  stBtn.addEventListener('click', openSkillTree);
  logBtns.appendChild(stBtn);
  const achBtn = document.createElement('button');
  achBtn.className = 'ach-btn';
  achBtn.textContent = t('achievements');
  achBtn.addEventListener('click', openAchievements);
  logBtns.appendChild(achBtn);
  const statsBtn = document.createElement('button');
  statsBtn.className = 'ach-btn';
  statsBtn.textContent = t('stats');
  statsBtn.addEventListener('click', openStats);
  logBtns.appendChild(statsBtn);
  const settBtn = document.createElement('button');
  settBtn.className = 'ach-btn sett-btn';
  settBtn.textContent = t('settings');
  settBtn.addEventListener('click', openSettings);
  logBtns.appendChild(settBtn);

  // Store refs for era-based toggling
  _startBtn = startBtn;
  _startMenu = startMenu;
  _startWrap = startWrap;
  _cmdBtns = [stBtn, achBtn, statsBtn, settBtn];

  logFrag.appendChild(logBtns);
  updateLogBtnMode();

  logCol.innerHTML = '';
  logCol.appendChild(logFrag);

  // v7.2: initial render of always-open roster column
  renderRosterCol();
  // v7.3: initial render of engineer type tabs + ship panel
  renderTypeTabs();
  renderShipPanel();

  upsEl.innerHTML = ''; ups2El.innerHTML = '';
  upsEl.appendChild(frag);
  ups2El.appendChild(frag2);
}

// ========== TOAST ==========
function toast(msg, color) {
  const el = document.createElement('div');
  el.className = 'toast';
  if (color) el.style.background = color;
  el.textContent = msg;
  toasts.appendChild(el);
  el.addEventListener('animationend', e => { if (e.animationName === 'tOut') el.remove(); });
}

// ========== ACTIVITY LOG ==========
const gameLog = [];
function log(msg) {
  const year = typeof currentYear === 'function' ? currentYear() : '\u2014';
  gameLog.push({ year, msg });
  if (gameLog.length > 100) gameLog.shift();
  const panel = document.getElementById('logPanel');
  if (panel) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = '<span class="log-year">[' + year + ']</span>' + msg;
    panel.insertBefore(entry, panel.firstChild);
    if (panel.children.length > 100) panel.removeChild(panel.lastChild);
  }
}

// ========== FLOAT TEXT ==========
function float(x, y, txt) {
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = txt;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ========== ACTIONS ==========
const CODE_LINES = [
  'let score = 0;',
  'player.update(dt);',
  'ctx.clearRect(0,0,W,H);',
  'if (hp <= 0) gameOver();',
  'enemies.push(spawn());',
  'render(scene);',
  'assets.load("sprites");',
  'this.vel.y += gravity;',
  'collider.check(a, b);',
  'sfx.play("jump");',
  'save(localStorage);',
  'fps = 1000 / delta;',
  'cam.follow(player);',
  'tile = map[y][x];',
  'input.poll();',
  'particle.emit(pos);',
  'ui.drawHP(hp, maxHp);',
  'wave++;',
  'boss.phase = 2;',
  'inventory.add(loot);',
  'this.x += vel * dt;',
  'sprite.flip = dir < 0;',
  'audio.loop("bgm");',
  'net.send(state);',
  'shader.bind(prog);',
  'anim.play("idle");',
  'world.generate(seed);',
  'quest.complete(id);',
  'dmg = atk - def;',
  'hud.show("Level Up!");',
];
let codeIdx = 0;
const codeVisible = [];

// ========== AUTOCLICKER DETECTION ==========
const _ac = {
  times: [],        // last N click timestamps
  positions: [],    // last N click {x, y}
  untrusted: 0,     // count of isTrusted===false clicks
  strikes: 0,       // accumulated suspicion
  infested: false,   // currently penalized?
  infestEnd: 0,     // when penalty ends (performance.now)
  cooldown: 0,      // grace period after infestation ends
  WINDOW: 40,       // clicks to analyze
  INTERVAL_CV_THRESH: 0.03,  // coefficient of variation below this = bot
  POS_STD_THRESH: 1.5,       // pixel std dev below this = bot
  UNTRUSTED_THRESH: 5,       // untrusted clicks in window = bot
  STRIKE_THRESH: 5,          // strikes before infestation triggers
  INFEST_DUR: 30000,         // 30s penalty
};

function acRecord(e) {
  const now = performance.now();
  _ac.times.push(now);
  _ac.positions.push({ x: e.clientX, y: e.clientY });
  if (_ac.times.length > _ac.WINDOW) _ac.times.shift();
  if (_ac.positions.length > _ac.WINDOW) _ac.positions.shift();
  if (!e.isTrusted) _ac.untrusted++; else _ac.untrusted = Math.max(0, _ac.untrusted - 1);
}

function acCheck() {
  if (_ac.infested || _ac.times.length < _ac.WINDOW) return false;
  const now = performance.now();
  if (_ac.cooldown > now) return false;

  let dominated = false;

  // 1. isTrusted check
  if (_ac.untrusted >= _ac.UNTRUSTED_THRESH) dominated = true;

  // 2. Click interval variance (coefficient of variation)
  if (!dominated) {
    const intervals = [];
    for (let i = 1; i < _ac.times.length; i++) intervals.push(_ac.times[i] - _ac.times[i - 1]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (mean > 0) {
      const variance = intervals.reduce((a, v) => a + (v - mean) ** 2, 0) / intervals.length;
      const cv = Math.sqrt(variance) / mean;
      if (cv < _ac.INTERVAL_CV_THRESH) dominated = true;
    }
  }


  if (dominated) {
    _ac.strikes++;
    if (_ac.strikes >= _ac.STRIKE_THRESH) {
      acTriggerInfestation();
      return true;
    }
  } else {
    _ac.strikes = Math.max(0, _ac.strikes - 1);
  }
  return false;
}

function acTriggerInfestation() {
  _ac.infested = true;
  _ac.infestEnd = performance.now() + _ac.INFEST_DUR;
  _ac.strikes = 0;
  _ac.times.length = 0;
  _ac.positions.length = 0;
  _ac.untrusted = 0;
  log('\uD83D\uDC1B Bug Infestation! Production halted \u2014 bugs are eating your code!');
  toast('\uD83D\uDC1B Bug Infestation! -90% production for 30s');
  playSfx('event');
}

function acTick() {
  if (!_ac.infested) return;
  if (performance.now() >= _ac.infestEnd) {
    _ac.infested = false;
    _ac.cooldown = performance.now() + 15000; // 15s grace after recovery
    log('\uD83D\uDEE0\uFE0F Bugs exterminated! Production restored.');
    toast('\uD83D\uDEE0\uFE0F Bugs exterminated!');
  }
}

function acPenalty() { return _ac.infested ? 0.1 : 1; }

