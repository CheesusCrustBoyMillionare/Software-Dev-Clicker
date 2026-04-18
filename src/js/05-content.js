// ========== CONSOLE BUILDERS ==========
function el(cls, children) {
  const d = document.createElement('div');
  d.className = cls;
  if (children) children.forEach(c => {
    if (typeof c === 'string') d.textContent = c;
    else d.appendChild(c);
  });
  return d;
}

function buildFloppy525() {
  const s = el('ship-scene');
  s.style.alignItems = 'center'; s.style.justifyContent = 'center';
  const f = el('media-floppy525');
  f.append(el('floppy525-label'), el('floppy525-notch'));
  s.appendChild(f);
  return s;
}
function buildFloppy35() {
  const s = el('ship-scene');
  s.style.alignItems = 'center'; s.style.justifyContent = 'center';
  const f = el('media-floppy35');
  f.append(el('floppy35-label'), el('floppy35-arrow'));
  s.appendChild(f);
  return s;
}
function buildCDROM() {
  const s = el('ship-scene');
  s.style.alignItems = 'center'; s.style.justifyContent = 'center';
  const cd = el('media-cd');
  cd.appendChild(el('cd-ring'));
  s.appendChild(cd);
  return s;
}
function buildDVD() {
  const s = el('ship-scene');
  s.style.alignItems = 'center'; s.style.justifyContent = 'center';
  const dvd = el('media-dvd');
  dvd.appendChild(el('dvd-ring'));
  s.appendChild(dvd);
  return s;
}
function buildDownload() {
  const s = el('ship-scene');
  s.style.alignItems = 'center'; s.style.justifyContent = 'center';
  const dl = el('media-dl');
  const bw = el('dl-bar-wrap');
  bw.appendChild(el('dl-bar'));
  dl.append(el('dl-cloud'), el('dl-arrow'), bw);
  s.appendChild(dl);
  return s;
}

const ERAS = [
  { max: 1987, build: buildFloppy525, label: '5.25" Floppy' },
  { max: 1994, build: buildFloppy35,  label: '3.5" Floppy' },
  { max: 2002, build: buildCDROM,     label: 'CD-ROM' },
  { max: 2008, build: buildDVD,       label: 'DVD' },
  { max: 9999, build: buildDownload,  label: 'Digital Download' },
];

const COMPUTER_ERAS = [
  { max: 1980, cls: 'era-apple2' },   // Apple II (1979-1980)
  { max: 1989, cls: 'era-dos' },       // MS-DOS (1981-1989)
  { max: 1994, cls: 'era-win3x' },     // Windows 3.x (1990-1994)
  { max: 1997, cls: 'era-win95' },     // Windows 95 (1995-1997)
  { max: 2000, cls: 'era-win98' },     // Windows 98 (1998-2000)
  { max: 2009, cls: 'era-winxp' },     // Windows XP (2001-2009)
  { max: 2014, cls: 'era-win7' },      // Windows 7 (2010-2014)
  { max: 2021, cls: 'era-win10' },     // Windows 10 (2015-2021)
  { max: 9999, cls: 'era-win11' },     // Windows 11 (2022+)
];

// ========== LANDMARK SOFTWARE ==========
// v10: 10 landmark software titles — one per release
const LANDMARKS = {
  1980:{real:'VisiCalc',parody:'VisiCrash',cat:'Spreadsheet'},
  1986:{real:'Super Mario Bros',parody:'Super Bario Bros',cat:'Video Game'},
  1992:{real:'Microsoft Office',parody:'Microhurt Office',cat:'Office Suite'},
  1996:{real:'Netscape Navigator',parody:'Netscam Navigator',cat:'Web Browser'},
  1999:{real:'Amazon.com',parody:'Amazoom.biz',cat:'E-Commerce'},
  2004:{real:'Google',parody:'Goggle Search',cat:'Search Engine'},
  2010:{real:'Facebook',parody:'Faceplant',cat:'Social Network'},
  2013:{real:'Instagram',parody:'Instantgram',cat:'Mobile App'},
  2018:{real:'AWS',parody:'AW-Jeez',cat:'Cloud Platform'},
  2024:{real:'ChatGPT',parody:'ChadGPT',cat:'AI Assistant'},
};
function getLandmark(year) {
  if (LANDMARKS[year]) return LANDMARKS[year];
  // Fallback for years beyond the list
  const fallback = ['BugSoft','CrashApp','Glitchware','Lagify','NullPtr','SegFault','StackSmash','HeapDump'];
  const idx = (year - 2026) % fallback.length;
  return { real:'Future Software',parody:fallback[idx < 0 ? 0 : idx]+' '+(year),cat:'Future Tech' };
}

function showYearTransition(year, name, cat) {
  const era = ERAS.find(e => year <= e.max) || ERAS[ERAS.length - 1];
  const ov = el('ship-ov');
  const yr = el('ship-year', [String(year)]);
  const nm = el('ship-name', [name]);
  const ct = el('ship-cat', [cat]);
  const scene = era.build();
  const ml = el('ship-media-label', ['on ' + era.label]);
  const btn = document.createElement('button');
  btn.className = 'ship-dismiss';
  btn.textContent = t('btnContinue');
  function dismissShip() {
    ov.remove(); isShipping = false;
    if (window._pendingRetired && window._pendingRetired.length > 0) {
      const r = window._pendingRetired; window._pendingRetired = null;
      showRetirePopup(r);
    }
  }
  btn.addEventListener('click', dismissShip);
  ov.addEventListener('click', e => { if (e.target === ov) dismissShip(); });
  ov.append(yr, nm, ct, scene, ml, btn);
  document.body.appendChild(ov);
}

function genSpeedMul() { recalcIfDirty(); return _C.genSpeedMul; }
function genSynergyMul() { recalcIfDirty(); return _C.genSynergyMul; }

function eventMul() { return (activeEvent && !activeEvent.pending) ? activeEvent.mul : 1; }
function eventClickMul() { return (activeEvent && !activeEvent.pending) ? activeEvent.clickMul : 1; }

function clickPow() { recalcIfDirty(); return _C.clickPow; }
function lps() { recalcIfDirty(); return _C.lps; }
function fameGain() {
  // v10: boosted base — fewer ships means each must count more
  let base = 3 + S.f.marketing;
  // Viral Marketing: +25% Fame per ship per level
  if (S.f.viralMarketing) base *= (1 + 0.25 * S.f.viralMarketing);
  // IPO: +1 Fame per 2 lifetime ships
  if (S.f.ipo) base += Math.floor(S.shipped / 2);
  return Math.max(1, Math.floor(base));
}

// ========== EVENT SYSTEM ==========
let evBanner = null;
function startRandomEvent() {
  const eIdx = Math.floor(Math.random() * EVENTS.length);
  const e = EVENTS[eIdx];
  activeEvent = { name: ta('ev_'+eIdx+'_name', e.name), choices: e.choices, pending: true, eIdx };
  log('\u26A1 ' + activeEvent.name + ' ' + t('choose'));
  showChoiceBanner(e, eIdx);
  playSfx('event');
}
function tickEvents(dt) {
  if (isShipping) return;
  if (activeEvent) {
    if (activeEvent.pending) return; // waiting for player choice
    activeEvent.remaining -= dt;
    updateEventBanner();
    if (activeEvent.remaining <= 0) { activeEvent = null; markDirty(); hideEventBanner(); }
  } else {
    eventCooldown -= dt;
    if (eventCooldown <= 0) { startRandomEvent(); eventCooldown = 135 + Math.random() * 135; }
  }
}
function ensureEvBanner() {
  if (!evBanner) {
    evBanner = document.createElement('div');
    evBanner.id = 'evBanner';
    evBanner.className = 'ev-banner';
    evBanner.addEventListener('click', ev => {
      const btn = ev.target.closest('.ev-opt');
      if (!btn || !activeEvent || !activeEvent.pending) return;
      const ci = +btn.dataset.choice;
      const c = activeEvent.choices[ci];
      const ei = activeEvent.eIdx;
      const cLabel = ta('ev_'+ei+'_'+ci+'_label', c.label);
      const cDesc = ta('ev_'+ei+'_'+ci+'_desc', c.desc);
      const evName = activeEvent.name;
      activeEvent = { name: evName + ': ' + cLabel, desc: cDesc, remaining: c.dur, mul: c.mul, clickMul: c.clickMul };
      markDirty();
      showEventBanner(); updateEventBanner();
      log('\u26A1 ' + evName + ' \u2192 ' + cLabel);
    });
    (document.querySelector('.left') || document.body).appendChild(evBanner);
  }
}
function showEventBanner() {
  ensureEvBanner();
  evBanner.classList.remove('ev-choice');
  evBanner.style.display = 'flex';
}
function showChoiceBanner(e, eIdx) {
  ensureEvBanner();
  evBanner.classList.add('ev-choice');
  evBanner.style.display = 'flex';
  let html = '<span class="ev-name">' + ta('ev_'+eIdx+'_name', e.name) + '</span><div class="ev-choices">';
  e.choices.forEach((c, ci) => {
    html += '<button class="ev-opt" data-choice="' + ci + '"><b>' + ta('ev_'+eIdx+'_'+ci+'_label', c.label) + '</b><br>' + ta('ev_'+eIdx+'_'+ci+'_desc', c.desc) + '</button>';
  });
  html += '</div>';
  evBanner.innerHTML = html;
}
function updateEventBanner() {
  if (!evBanner || !activeEvent || activeEvent.pending) return;
  const debuff = activeEvent.mul < 1 || activeEvent.clickMul < 1;
  evBanner.classList.toggle('debuff', debuff);
  evBanner.innerHTML = '<span class="ev-name">' + activeEvent.name + '</span><span class="ev-desc">' + activeEvent.desc + '</span><span class="ev-time">' + Math.ceil(activeEvent.remaining) + 's</span>';
}
function hideEventBanner() {
  if (evBanner) evBanner.style.display = 'none';
}

// ========== ACHIEVEMENTS ==========
function checkAchievements() {
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i];
    if (S.ach.includes(a.id)) continue;
    if (a.check()) {
      S.ach.push(a.id);
      S.fame += a.fame; S.tFame += a.fame;
      const achName = ta('ach_'+i+'_name', a.name);
      toast(t('achToast') + ': ' + achName + ' (+' + a.fame + ' ' + t('fame') + ')');
      log('\uD83C\uDFC6 ' + t('achToast') + ': ' + achName);
      playSfx('achieve');
    }
  }
}

function openAchievements() {
  const ov = document.createElement('div');
  ov.className = 'st-ov';
  const panel = document.createElement('div');
  panel.className = 'ach-panel';
  const title = document.createElement('div');
  title.className = 'ach-title';
  title.textContent = t('achievements') + ' (' + S.ach.length + '/' + ACHIEVEMENTS.length + ')';
  panel.appendChild(title);
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i];
    const unlocked = S.ach.includes(a.id);
    const row = document.createElement('div');
    row.className = 'ach-row' + (unlocked ? ' unlocked' : '');
    row.innerHTML = '<div class="ach-name">' + (unlocked ? ta('ach_'+i+'_name', a.name) : t('unknown')) + '</div>' +
      '<div class="ach-desc">' + (unlocked ? ta('ach_'+i+'_desc', a.desc) : t('locked')) + '</div>' +
      '<div class="ach-reward">' + (unlocked ? '+' + a.fame + ' ' + t('fame') : '') + '</div>';
    panel.appendChild(row);
  }
  const close = document.createElement('button');
  close.className = 'st-close';
  close.textContent = '\u00d7';
  close.addEventListener('click', () => ov.remove());
  ov.appendChild(close);
  ov.appendChild(panel);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
}

