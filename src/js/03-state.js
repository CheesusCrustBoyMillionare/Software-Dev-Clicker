// ========== STATE ==========
// Schema version: incremented when save format changes in a breaking way.
// v1 = clicker era (shipped on main). v2 = tycoon rework (this branch).
// Migrations live in SCHEMA_MIGRATIONS below.
const SCHEMA_VERSION = 2;
const MIN_COMPATIBLE_SCHEMA = 1; // v1 saves flow through SCHEMA_MIGRATIONS[1] (wipe)

const defaults = () => ({
  v:SCHEMA_VERSION, loc:0, tLoc:0, fame:0, tFame:0,
  g: GEN.map(() => 0),
  eu: GEN.map(() => EMP_UPS.map(() => 0)), // eu[genIdx][upIdx] = level
  c: CLK.map(() => 0),
  ss: SUPPORT.map(() => 0),
  ru: RECRUITER_UPS.map(() => 0),
  fu: FACILITY_UPS.map(() => 0),
  cb: 0,
  catsSeen: [],
  milestones: [],
  f: { marketing:0, publisher:0, engine:0,
       genSpeed:0, genCheap:0, genSynergy:0,
       genThreads:0, genReview:0, genAcquihire:0, genOpenSource:0, genPair:0,
       aimTrainer:0, clickDouble:0, autoClick:0, clickFrenzy:0,
       clickPrecision:0, clickLucky:0, autoBotnet:0, clickHackathon:0, clickCaffeine:0,
       ventureCapital:0, goldenParachute:0, viralMarketing:0, franchise:0, ipo:0,
       streakUnlock:0, streakPower:0, streakMastery:0,
       streakSecondWind:0, streakCombo:0, streakTurbo:0, streakZone:0, streakTranscend:0 },
  shipped: 0,
  meetingPaused: 0,
  fameResetUsed: 0,
  fireCount: 0,
  totalRetired: 0,
  coders: [],
  // v7.5: parallel state for all non-coder engineer types (built dynamically from ENG_TYPES).
  // Coder remains in S.coders/S.loc/S.tLoc. Each other type has its own resource, list, etc.
  engineers: Object.fromEntries(ENG_TYPES.filter(e => e.key !== 'coder').map(e => [e.key, { res:0, tRes:0, list:[], shippedSince:0 }])),
  activeType: 'coder',
  unlockedTypes: ['coder'],
  office: 0,
  // v7.5: per-type office levels — each engineer type has its own office capacity
  offices: Object.fromEntries(ENG_TYPES.map(e => [e.key, 0])),
  sp: SUPPORT.map(() => 0),
  trainerLvl: GEN.map(() => 0),
  trainerSSLvl: SUPPORT.map(() => 0),
  trainerSSCount: SUPPORT.map(() => 0),
  ach: [],
  games: [],
  musicVol: 0.5, sfxVol: 0.7,
  funShown: 0,
  // ========== v2 TYCOON STATE ==========
  // Added in Phase 1A. v1 fields above remain for now; cleaned up in Phase 1F.
  // Studio identity (set on new career)
  studioName: '',
  founderName: '',
  founderSpecialty: 'coder',       // one of ENG_TYPES keys
  founderTrait: '',                // one of the 4 starter traits
  difficulty: 'normal',            // easy | normal | hard
  // Finance
  cash: 0,                         // current $ balance (set on career start per difficulty)
  tRevenue: 0,                     // lifetime revenue
  tExpenses: 0,                    // lifetime expenses
  // Calendar — game date
  calendar: { week: 1, month: 1, year: 1980 },  // week 1-4 within month, month 1-12, year 1980+
  // Projects — the heart of Phase 1
  projects: { active: [], shipped: [], contracts: [] },
  // Founder — persistent engineer (set on career start). Simplified in Phase 1 — fuller model in Phase 3.
  founder: null,
  // Employees — hired team beyond founder (Phase 2+)
  employees: [],
  // Time control
  speed: 1,                        // 0 (paused) | 1 | 2 | 4 | 8
  paused: false,                   // distinct from speed=0 — user-initiated pause
  // Career lifecycle
  careerStarted: false,            // set true once studio is founded
  careerStartedAt: 0               // trustedNow() timestamp
});

// v7.3: Engineer type helpers — single source of truth for resource & list access.
// Coder is the special case: it uses S.loc/S.tLoc/S.coders directly (zero migration).
// Other types live in S.engineers[type].
function engRes(type) {
  if (type === 'coder') return S.loc;
  return (S.engineers && S.engineers[type] && S.engineers[type].res) || 0;
}
function engTRes(type) {
  if (type === 'coder') return S.tLoc;
  return (S.engineers && S.engineers[type] && S.engineers[type].tRes) || 0;
}
function engAddRes(type, v) {
  if (v <= 0) return;
  if (type === 'coder') { S.loc += v; S.tLoc += v; return; }
  if (!S.engineers || !S.engineers[type]) return;
  S.engineers[type].res += v;
  S.engineers[type].tRes += v;
}
function engSubRes(type, v) {
  if (v <= 0) return true;
  if (type === 'coder') {
    if (S.loc < v) return false;
    S.loc -= v; return true;
  }
  if (!S.engineers || !S.engineers[type]) return false;
  if (S.engineers[type].res < v) return false;
  S.engineers[type].res -= v; return true;
}
function engList(type) {
  if (type === 'coder') return S.coders || (S.coders = []);
  if (!S.engineers || !S.engineers[type]) return [];
  return S.engineers[type].list || (S.engineers[type].list = []);
}
function engShipped(type) {
  if (type === 'coder') return S.shipped || 0;
  return (S.engineers && S.engineers[type] && S.engineers[type].shippedSince) || 0;
}
function engShipAt(type) {
  // v10: 10× growth per ship — 500K → 5M → 50M → … → 500T over 10 releases.
  // New types (shippedSince < 2) get floor = 30% of coder's current threshold.
  const s = engShipped(type);
  let base = 500000;
  for (let i = 0; i < s; i++) base *= 10;
  if (type !== 'coder' && s < 2) {
    const gs = S.shipped || 0;
    if (gs > 0) {
      let globalBase = 500000;
      for (let i = 0; i < gs; i++) globalBase *= 10;
      base = Math.max(base, globalBase * 0.3);
    }
  }
  return Math.floor(base * (0.9 ** S.f.franchise));
}
function isUnlocked(type) {
  return Array.isArray(S.unlockedTypes) && S.unlockedTypes.includes(type);
}
function activeType() { return S.activeType || 'coder'; }
function activeTypeMeta() { return ENG_TYPE_MAP[activeType()] || ENG_TYPE_MAP.coder; }
function totalEngineerCount() {
  let n = (S.coders && S.coders.length) || 0;
  if (S.engineers) for (const k in S.engineers) n += (S.engineers[k].list || []).length;
  return n;
}

// v7.3: Type tabs UI — renders one button per engineer type with resource counts.
// Locked types show their unlock year. Clicking an unlocked tab switches activeType.
function renderTypeTabs() {
  if (!_typeTabsEl) _typeTabsEl = document.getElementById('typeTabs');
  if (!_typeTabsEl) return;
  recalcIfDirty();
  _typeTabsEl.innerHTML = '';
  const aType = activeType();
  // v7.5: show only unlocked types + next 2 locked (keeps tab bar manageable with 26 types)
  let lockedShown = 0;
  const MAX_LOCKED = 2;
  for (const meta of ENG_TYPES) {
    const unlocked = isUnlocked(meta.key);
    if (!unlocked) {
      if (lockedShown >= MAX_LOCKED) continue;
      lockedShown++;
    }
    const isActive = aType === meta.key;
    const tab = document.createElement('div');
    tab.className = 'eng-tab' + (isActive ? ' active' : '') + (unlocked ? '' : ' locked');
    tab.setAttribute('role', 'tab');
    tab.tabIndex = 0;
    tab.dataset.type = meta.key;
    if (isActive) tab.style.borderColor = meta.color;
    if (unlocked) {
      const lpsVal = (_C.typeLps && _C.typeLps[meta.key]) || 0;
      tab.innerHTML =
        '<div class="et-name" style="color:' + meta.color + '">' + meta.name + '</div>' +
        '<div class="et-res">' + fmt(engRes(meta.key)) + ' ' + meta.res + '</div>' +
        '<div class="et-lps">' + fmt(lpsVal) + '/s</div>';
      tab.addEventListener('click', () => {
        if (S.activeType === meta.key) return;
        S.activeType = meta.key;
        markDirty();
        renderTypeTabs();
        renderRosterCol();
        // v7.3: invalidate sprite cache + bypass throttle so the office immediately
        // shows the new active type's engineers (not the previous tab's stale ones).
        if (typeof _ofc !== 'undefined') {
          _ofc.spriteCache = [];
          _ofc.lastUpdate = 0;
        }
        updateOfficeSprites();
        renderShipPanel();
      });
    } else {
      tab.innerHTML =
        '<div class="et-name">' + meta.name + '</div>' +
        '<div class="et-locked">\u{1F512} Year ' + (meta.unlockYear - (S.f.goldenParachute || 0)) + '</div>';
    }
    _typeTabsEl.appendChild(tab);
  }
  // Auto-scroll active tab into view
  const activeEl = _typeTabsEl.querySelector('.eng-tab.active');
  if (activeEl) activeEl.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'nearest' });
  updateTabArrows();
}

// v9.0: Scroll arrow buttons for type-tabs bar
function updateTabArrows() {
  const el = _typeTabsEl || document.getElementById('typeTabs');
  if (!el) return;
  const btnL = document.getElementById('tabArrowL');
  const btnR = document.getElementById('tabArrowR');
  if (!btnL || !btnR) return;
  const canL = el.scrollLeft > 1;
  const canR = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  btnL.classList.toggle('visible', canL);
  btnR.classList.toggle('visible', canR);
}
(function initTabArrows() {
  const el = document.getElementById('typeTabs');
  const btnL = document.getElementById('tabArrowL');
  const btnR = document.getElementById('tabArrowR');
  if (!el || !btnL || !btnR) return;
  const step = 160;
  btnL.addEventListener('click', () => {
    el.scrollBy({ left: -step, behavior: 'smooth' });
    setTimeout(updateTabArrows, 300);
  });
  btnR.addEventListener('click', () => {
    el.scrollBy({ left: step, behavior: 'smooth' });
    setTimeout(updateTabArrows, 300);
  });
  el.addEventListener('scroll', updateTabArrows, { passive: true });
  new ResizeObserver(updateTabArrows).observe(el);
})();

// Cheap soft refresh — update resource numbers without rebuilding DOM (called every tick).
function refreshTypeTabValues() {
  if (!_typeTabsEl) _typeTabsEl = document.getElementById('typeTabs');
  if (!_typeTabsEl) return;
  recalcIfDirty();
  for (const meta of ENG_TYPES) {
    if (!isUnlocked(meta.key)) continue;
    const tab = _typeTabsEl.querySelector('[data-type="' + meta.key + '"]');
    if (!tab || tab.classList.contains('locked')) continue;
    const resEl = tab.querySelector('.et-res');
    const lpsEl = tab.querySelector('.et-lps');
    if (resEl) resEl.textContent = fmt(engRes(meta.key)) + ' ' + meta.res;
    if (lpsEl) lpsEl.textContent = fmt((_C.typeLps && _C.typeLps[meta.key]) || 0) + '/s';
    tab.classList.toggle('best-type', _bestType === meta.key);
  }
}
// renderResourceBar() is an alias for renderTypeTabs() — separated only to make
// future divergence easy if we want a non-clickable secondary bar.
function renderResourceBar() { renderTypeTabs(); }

// v7.3: Ship panel — builds one row per unlocked engineer type showing
// "X / Y resource" + bar. Called when unlock state changes (init, ship, fresh load).
let _shipPanelEl = null;
function renderShipPanel() {
  if (!_shipPanelEl) _shipPanelEl = document.getElementById('shipResources');
  if (!_shipPanelEl) return;
  _shipPanelEl.innerHTML = '';
  for (const meta of ENG_TYPES) {
    if (!isUnlocked(meta.key)) continue;
    const row = document.createElement('div');
    row.className = 'ship-res-row';
    row.dataset.type = meta.key;
    if (meta.key === activeType()) row.classList.add('active-type');
    row.innerHTML =
      '<div class="srn"><span style="color:' + meta.color + '">' + meta.res + '</span><span class="srpct">0%</span></div>' +
      '<div class="srv">0 / 0</div>' +
      '<div class="srbar"><div class="srbar-fill" style="transform:scaleX(0)"></div></div>';
    row.addEventListener('click', () => {
      if (S.activeType === meta.key) return;
      S.activeType = meta.key;
      markDirty();
      renderTypeTabs();
      renderRosterCol();
      if (typeof _ofc !== 'undefined') { _ofc.spriteCache = []; _ofc.lastUpdate = 0; }
      updateOfficeSprites();
      renderShipPanel();
    });
    _shipPanelEl.appendChild(row);
  }
  refreshShipPanel();
}
// Cheap soft refresh — update values per tick without DOM rebuild.
function refreshShipPanel() {
  if (!_shipPanelEl) _shipPanelEl = document.getElementById('shipResources');
  if (!_shipPanelEl) return;
  for (const meta of ENG_TYPES) {
    if (!isUnlocked(meta.key)) continue;
    const row = _shipPanelEl.querySelector('[data-type="' + meta.key + '"]');
    if (!row) continue;
    const cur = engTRes(meta.key);
    const tgt = engShipAt(meta.key);
    const pct = tgt > 0 ? Math.min(cur / tgt, 1) : 0;
    const done = cur >= tgt;
    row.classList.toggle('done', done);
    const valEl = row.querySelector('.srv');
    const pctEl = row.querySelector('.srpct');
    const fillEl = row.querySelector('.srbar-fill');
    if (valEl) valEl.textContent = fmt(cur) + ' / ' + fmt(tgt);
    if (pctEl) pctEl.textContent = Math.floor(pct * 100) + '%';
    if (fillEl) fillEl.style.transform = 'scaleX(' + pct + ')';
  }
}

let S = defaults();

// ========== CLOCK INTEGRITY ==========
// trustedNow() is immune to mid-session system-clock changes because
// it anchors to Date.now() captured once at page load and advances
// via performance.now() which is monotonic and untamperable.
const _tSessionDate = Date.now();
const _tSessionPerf = performance.now();
let _tClockOffset = 0;          // ms to subtract if network proves clock is ahead
function trustedNow() {
  return Math.floor(_tSessionDate + (performance.now() - _tSessionPerf) - _tClockOffset);
}

// ========== SAVE / LOAD ==========
let KEY = 'gdc_save_1';

// Schema migration registry: { fromVersion: (d) => migrated_d | null }
// Each migrator mutates d in place + returns it with d.v bumped, OR returns null to discard.
const SCHEMA_MIGRATIONS = {
  // v1 → v2: clicker to tycoon rework. Incompatible data model.
  // During alpha: discard v1 saves. Player starts a fresh v2 career.
  1: function migrateClickerToTycoon(d) {
    console.info('[schema] v1 clicker save detected. Discarding per v2 migration policy.');
    console.info('[schema] Classic clicker is still playable on the main branch. This branch is the tycoon rework.');
    return null; // signals loadSlot to treat as fresh career
  },
};

function migrateSave(d) {
  while (d && d.v < SCHEMA_VERSION) {
    const fromV = d.v;
    const migrator = SCHEMA_MIGRATIONS[fromV];
    if (!migrator) {
      console.warn('No schema migrator registered for v' + fromV + ' → v' + (fromV + 1));
      return null;
    }
    d = migrator(d);
    if (!d) return null; // migrator chose to discard (fresh start)
    if (d.v <= fromV) {
      console.error('Migrator for v' + fromV + ' failed to advance schema version');
      return null;
    }
  }
  return d;
}

// Peek at a save's schema version without fully loading it.
function peekSchemaVersion(raw) {
  try { return (JSON.parse(raw) || {}).v ?? null; } catch { return null; }
}

function save() {
  S._lastSave = trustedNow();
  S.v = SCHEMA_VERSION; // ensure schema stamp is current on every save
  localStorage.setItem(KEY, JSON.stringify(S));
}
function loadSlot(raw) {
  try {
    let d = JSON.parse(raw);
    if (!d) return;
    // Schema version validation + migration
    if (typeof d.v !== 'number' || d.v < MIN_COMPATIBLE_SCHEMA) {
      console.warn('Save schema too old to load (v' + d.v + ' < MIN ' + MIN_COMPATIBLE_SCHEMA + ')');
      return;
    }
    if (d.v > SCHEMA_VERSION) {
      console.warn('Save is from a newer version (v' + d.v + ' > current ' + SCHEMA_VERSION + ')');
      return;
    }
    if (d.v < SCHEMA_VERSION) {
      const migrated = migrateSave(d);
      if (!migrated) return;
      d = migrated;
    }
    const df = defaults();
    for (const k in df) if (!(k in d)) d[k] = df[k];
    while (d.g.length < GEN.length) d.g.push(0);
    while (d.c.length < CLK.length) d.c.push(0);
    if (!d.eu) d.eu = GEN.map(() => EMP_UPS.map(() => 0));
    while (d.eu.length < GEN.length) d.eu.push(EMP_UPS.map(() => 0));
    d.eu.forEach(a => { while (a.length < EMP_UPS.length) a.push(0); });
    const dfF = defaults().f;
    for (const k in dfF) if (!(k in d.f)) d.f[k] = dfF[k];
    if (!d.ss) d.ss = SUPPORT.map(() => 0);
    while (d.ss.length < SUPPORT.length) d.ss.push(0);
    // v3.8 migration: swap Energy Drinks (was idx 0) and Catered Lunches (was idx 1)
    if (!d._perkSwap) { const tmp = d.c[0]; d.c[0] = d.c[1]; d.c[1] = tmp; d._perkSwap = 1; }
    if (!d.ru) d.ru = RECRUITER_UPS.map(() => 0);
    // v7.4: RECRUITER_UPS grew from 2 -> 3 entries; extend old saves
    while (d.ru.length < RECRUITER_UPS.length) d.ru.push(0);
    if (!d.sp) d.sp = SUPPORT.map(() => 0);
    while (d.sp.length < SUPPORT.length) d.sp.push(0);
    if (d.cb === undefined) d.cb = 0;
    if (!d.catsSeen || (d.catsSeen.length === 0 && d.games && d.games.length > 0)) {
      const seen = new Set();
      d.games.forEach(g => { if (g.cat) seen.add(g.cat); });
      d.catsSeen = [...seen];
      d.cb = Math.min(d.catsSeen.length, CODE_BASE.length);
    }
    if (!d.ach) d.ach = [];
    if (typeof d.totalRetired !== 'number') d.totalRetired = 0;
    if (!d.games) d.games = [];
    if (d.tFame === undefined) d.tFame = d.fame || 0;
    // Migrate perk order: old [E,L,D,DC,GR,NAP,PET,GYM,PTO,R] → new [E,L,D,DC,PET,GYM,GR,PTO,NAP,R]
    if (!d.perkMigrated && d.c.length >= 10) {
      const old = [...d.c];
      d.c[4] = old[6]; d.c[5] = old[7]; d.c[6] = old[4]; d.c[7] = old[8]; d.c[8] = old[5];
      d.perkMigrated = true;
    }
    // v3.8 migrations
    if (!d.fu) d.fu = FACILITY_UPS.map(() => 0);
    if (!d.milestones) d.milestones = [];
    // v3.9.4 migration: swap support staff indices 2↔3 (Office Manager before Facility Director)
    if (!d._supSwap) {
      if (d.ss && d.ss.length >= 4) { const tmp = d.ss[2]; d.ss[2] = d.ss[3]; d.ss[3] = tmp; }
      if (d.sp && d.sp.length >= 4) { const tmp = d.sp[2]; d.sp[2] = d.sp[3]; d.sp[3] = tmp; }
      d._supSwap = 1;
    }
    // v4 migration: trainer arrays + 5th support staff slot
    if (!d.trainerLvl) d.trainerLvl = GEN.map(() => 0);
    if (!d.trainerSSLvl) d.trainerSSLvl = SUPPORT.map(() => 0);
    if (!d.trainerSSCount) d.trainerSSCount = SUPPORT.map(() => 0);
    // v5.8 migration: remove Office Manager (old index 2), shift Facility+Trainer down
    if (!d._rmManager) {
      if (d.ss && d.ss.length >= 5) d.ss.splice(2, 1);
      if (d.sp && d.sp.length >= 5) d.sp.splice(2, 1);
      if (d.trainerSSLvl && d.trainerSSLvl.length >= 5) d.trainerSSLvl.splice(2, 1);
      if (d.trainerSSCount && d.trainerSSCount.length >= 5) d.trainerSSCount.splice(2, 1);
      d._rmManager = 1;
    }
    while (d.ss.length < SUPPORT.length) d.ss.push(0);
    while (d.sp.length < SUPPORT.length) d.sp.push(0);
    while (d.ss.length > SUPPORT.length) d.ss.pop();
    while (d.sp.length > SUPPORT.length) d.sp.pop();
    while (d.trainerLvl.length < GEN.length) d.trainerLvl.push(0);
    while (d.trainerSSLvl.length < SUPPORT.length) d.trainerSSLvl.push(0);
    while (d.trainerSSLvl.length > SUPPORT.length) d.trainerSSLvl.pop();
    while (d.trainerSSCount.length < SUPPORT.length) d.trainerSSCount.push(0);
    while (d.trainerSSCount.length > SUPPORT.length) d.trainerSSCount.pop();
    // v6.4 migration: clamp trainer levels to 100
    d.trainerLvl = d.trainerLvl.map(v => Math.min(v, 100));
    d.trainerSSLvl = d.trainerSSLvl.map(v => Math.min(v, 100));
    // v6.8 migration: synthesize individual coder objects from S.g counts
    if (!d._coderRework) {
      d.coders = [];
      for (let i = 0; i < GEN.length; i++) {
        const n = (d.g && d.g[i]) || 0;
        for (let k = 0; k < n; k++) {
          // edu/exp chosen high enough that computeTier returns >= i reliably
          const edu = Math.min(4, Math.floor(i / 2) + 1);
          const exp = Math.max(d.shipped || 0, i * 2);
          const fn = FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)];
          const ln = LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)];
          d.coders.push({ name: fn + ' ' + ln, edu, exp, rarity: 0, seed: Math.random(), tier: i });
        }
      }
      d._coderRework = 1;
    }
    if (!Array.isArray(d.coders)) d.coders = [];
    // v6.9 migration: grant office tier large enough to hold existing coders
    if (!d._v69office) {
      if (typeof d.office !== 'number') d.office = 0;
      while (d.office < OFFICES.length - 1 && OFFICES[d.office].cap < d.coders.length) {
        d.office++;
      }
      d._v69office = 1;
    }
    // v7.1 migration: per-coder production formula — zero exp on existing coders
    // so the new +1%/yr bonus doesn't silently buff historic rosters on load.
    // Ship-earned exp accrues from v7.1 forward.
    if (!d._v71prodFormula) {
      if (Array.isArray(d.coders)) {
        for (const c of d.coders) c.exp = 0;
      }
      d._v71prodFormula = 1;
    }
    // v7.5 migration: engineer types — dynamically builds from ENG_TYPES.
    // Existing saves get new types with empty state; year-based unlocks resume on next ship().
    if (!d.engineers) d.engineers = {};
    for (const et of ENG_TYPES) {
      if (et.key === 'coder') continue;
      if (!d.engineers[et.key]) d.engineers[et.key] = { res:0, tRes:0, list:[], shippedSince:0 };
      const e = d.engineers[et.key];
      if (typeof e.res !== 'number') e.res = 0;
      if (typeof e.tRes !== 'number') e.tRes = 0;
      if (!Array.isArray(e.list)) e.list = [];
      if (typeof e.shippedSince !== 'number') e.shippedSince = 0;
    }
    if (!Array.isArray(d.unlockedTypes)) d.unlockedTypes = ['coder'];
    // Reconcile already-shipped progress: any type whose unlockYear is <= currentYear
    // becomes unlocked (so reloading mid-game doesn't lose unlocks).
    {
      const yr = RELEASE_YEARS[Math.min(d.shipped || 0, RELEASE_YEARS.length - 1)];
      for (const e of ENG_TYPES) {
        if (yr >= e.unlockYear - ((d.f && d.f.goldenParachute) || 0) && !d.unlockedTypes.includes(e.key)) d.unlockedTypes.push(e.key);
      }
    }
    if (typeof d.activeType !== 'string' || !ENG_TYPE_MAP[d.activeType]) d.activeType = 'coder';
    // v7.5: per-type office migration — copy old single S.office to coder, default 0 for all others
    if (!d.offices || typeof d.offices !== 'object') {
      d.offices = { coder: d.office | 0 };
    }
    for (const et of ENG_TYPES) {
      if (typeof d.offices[et.key] !== 'number') d.offices[et.key] = 0;
    }
    // Apply state first, then calculate offline progress using cached multipliers
    S = d;
    markDirty();
    recalcIfDirty();
    if (d._lastSave) {
      const elapsed = Math.min((trustedNow() - d._lastSave) / 1000, OFFLINE_CAP);
      if (elapsed > 10) {
        // v7.3: offline progress accrues per unlocked type
        let earnedActive = 0;
        for (const meta of ENG_TYPES) {
          if (!isUnlocked(meta.key)) continue;
          const r = (_C.typeLps && _C.typeLps[meta.key]) || 0;
          const e = Math.floor(r * elapsed);
          if (e > 0) {
            engAddRes(meta.key, e);
            if (meta.key === 'coder') earnedActive = e;
          }
        }
        if (earnedActive > 0) {
          S._offlineEarned = earnedActive;  // stash so network clock check can claw back (coder only)
          pendingOfflineMsg = t('welcomeBack') + ' ' + fmt(earnedActive) + ' ' + t('whileAway') + ' (' + Math.floor(elapsed / 60) + 'm)';
        }
      }
    }
  } catch {}
}
function load() { loadSlot(localStorage.getItem(KEY)); }
function peekSlot(n) {
  try {
    const d = JSON.parse(localStorage.getItem('gdc_save_' + n));
    if (!d) return null;
    // v1 (clicker) saves still count as "populated" — the slot-click
    // hijack in 15-tycoon-ui.js will wipe them via SCHEMA_MIGRATIONS[1]
    // when the user enters. Accepting only v === SCHEMA_VERSION would
    // hide the slot's existence so the player sees "Empty" for their
    // own save (v10.0 bug).
    if (typeof d.v !== 'number' || d.v < 1) return null;
    return d;
  } catch { return null; }
}

