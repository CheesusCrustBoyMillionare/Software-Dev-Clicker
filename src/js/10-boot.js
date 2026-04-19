// ========== DESK SCENE RESPONSIVE SCALING ==========
// v7.3: desk scene scales fluidly with the .left column width. Previously fixed at 2x;
// v7.3 baseline is 1x (half the old size) and scales ~0.9x (tight) to ~1.15x (wide).
// Margin-bottom compensates for transform:scale which does not affect layout box.
function updateDeskScale() {
  if (!deskScene) return;
  const leftEl = deskScene.parentElement;
  const w = leftEl ? leftEl.clientWidth : 320;
  // v8.x: read --desk-scale-max from CSS (set per breakpoint)
  const maxScale = parseFloat(getComputedStyle(deskScene).getPropertyValue('--desk-scale-max')) || 1.15;
  let s;
  if (w <= 240) s = 0.9;
  else if (w >= 520) s = maxScale;
  else s = 0.9 + (w - 240) * (maxScale - 0.9) / (520 - 240);
  deskScene.style.setProperty('--desk-scale', s.toFixed(3));
  // offsetHeight is the unscaled box height; compensate only when scaled >1.
  const h = deskScene.offsetHeight;
  const compensate = s > 1 ? Math.round((s - 1) * h) : 0;
  deskScene.style.marginBottom = compensate + 'px';
}
window.addEventListener('resize', updateDeskScale);

// ========== MOBILE TAB SYSTEM ==========
(function initMobileTabs() {
  const mq = window.matchMedia('(max-width:768px)');
  const tabs = document.createElement('div');
  tabs.className = 'mob-tabs';
  const tabDefs = [
    { key:'desk', icon:'\u{1F5A5}\uFE0F' },
    { key:'coders', icon:'\u{1F465}' },
    { key:'upgrades', icon:'\u{1F527}', labelKey:'officePerks' },
    { key:'log', icon:'\u{1F4CB}', labelKey:'activityLog' }
  ];
  tabDefs.forEach(td => {
    const btn = document.createElement('button');
    btn.className = 'mob-tab';
    btn.dataset.tab = td.key;
    const ico = document.createElement('span');
    ico.className = 'mob-tab-icon';
    ico.textContent = td.icon;
    const lbl = document.createElement('span');
    lbl.textContent = t(td.labelKey || td.key);
    btn.append(ico, lbl);
    tabs.appendChild(btn);
  });
  document.body.appendChild(tabs);

  function activate(key) {
    gameEl.dataset.tab = key;
    tabs.querySelectorAll('.mob-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
    if (key === 'desk') updateDeskScale();
  }
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.mob-tab');
    if (btn) activate(btn.dataset.tab);
  });

  function onResize(e) {
    if (e.matches) {
      if (!gameEl.dataset.tab) activate('desk');
    } else {
      delete gameEl.dataset.tab;
    }
  }
  mq.addEventListener('change', onResize);
  onResize(mq);
})();

// ========== VERSION CHECK + NETWORK CLOCK VALIDATION ==========
let _clockValidated = false;
(function versionCheck() {
  let dismissed = false;
  function check() {
    if (dismissed) return;
    fetch('version.json?_=' + Date.now())
      .then(r => {
        // Network clock validation (once per session)
        if (!_clockValidated) {
          _clockValidated = true;
          const serverDateStr = r.headers.get('Date');
          if (serverDateStr) {
            const serverTime = new Date(serverDateStr).getTime();
            const localTime = Date.now();
            const drift = localTime - serverTime;
            if (drift > 300000) {  // local clock >5 min ahead of server
              _tClockOffset += drift;
              // Claw back any undeserved offline LoC
              if (pendingOfflineMsg) { S.loc = Math.max(0, S.loc - (S._offlineEarned || 0)); S.tLoc = Math.max(0, S.tLoc - (S._offlineEarned || 0)); pendingOfflineMsg = null; }
              S._lastSave = trustedNow(); save();
              toast('\u26A0\uFE0F System clock is ahead — offline progress revoked', '#da3633');
            }
          }
        }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (!data || !data.version) return;
        if (data.version !== GAME_VERSION) showUpdateBanner(data.version);
        else { const b = document.querySelector('.update-banner'); if (b) b.remove(); }
      })
      .catch(() => {});  // silently ignore network errors
  }
  function showUpdateBanner(newVer) {
    if (document.querySelector('.update-banner')) return;
    const bar = document.createElement('div');
    bar.className = 'update-banner';
    bar.innerHTML = '\u26A1 A new version (v' + newVer + ') is available!';
    const refreshBtn = document.createElement('button');
    refreshBtn.style.cssText = 'margin-left:8px;padding:4px 12px;background:var(--text-primary);color:var(--bg-body);border:none;border-radius:var(--border-radius);font-weight:700;font-size:.8rem;cursor:pointer';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.onclick = function(e) { e.stopPropagation(); location.reload(); };
    bar.appendChild(refreshBtn);
    const close = document.createElement('button');
    close.className = 'ub-close';
    close.textContent = '\u2715';
    close.onclick = function(e) { e.stopPropagation(); bar.remove(); dismissed = true; };
    bar.appendChild(close);
    document.body.appendChild(bar);
  }
  check();
  setInterval(check, 60000);
})();

// ========== DEBUG PANEL (Ctrl+Shift+D) ==========
(function initDebugPanel() {
  let open = false, panel = null;
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      if (open) { if (panel) panel.remove(); open = false; return; }
      open = true;
      panel = document.createElement('div');
      panel.id = 'dbgPanel';
      panel.style.cssText = 'position:fixed;bottom:60px;right:12px;z-index:9999;background:#1a1a2e;color:#e0e0e0;border:1px solid #444;border-radius:8px;padding:12px;font:12px monospace;width:260px;box-shadow:0 4px 20px rgba(0,0,0,.6)';
      const title = document.createElement('div');
      title.style.cssText = 'font-weight:700;margin-bottom:8px;color:#f0883e;font-size:13px';
      title.textContent = '\u{1F41B} Debug Panel';
      panel.appendChild(title);

      // Year dropdown (v10: uses RELEASE_YEARS instead of linear slider)
      const curYear = currentYear();
      const lbl = document.createElement('div');
      lbl.style.cssText = 'margin-bottom:4px;font-size:11px';
      lbl.textContent = 'Year: ' + curYear + ' (shipped: ' + S.shipped + ')';
      panel.appendChild(lbl);
      const slider = document.createElement('input');
      slider.type = 'range'; slider.min = 0; slider.max = RELEASE_YEARS.length; slider.value = S.shipped;
      slider.style.cssText = 'width:100%;margin-bottom:8px;accent-color:#f0883e';
      slider.addEventListener('input', () => {
        const idx = Math.min(+slider.value, RELEASE_YEARS.length - 1);
        lbl.textContent = 'Year: ' + RELEASE_YEARS[idx] + ' (shipped: ' + slider.value + ')';
      });
      panel.appendChild(slider);

      // Jump button
      const jumpBtn = document.createElement('button');
      jumpBtn.textContent = 'Jump to Year';
      jumpBtn.style.cssText = 'width:100%;padding:6px;background:#f0883e;color:#000;border:none;border-radius:4px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:6px';
      jumpBtn.addEventListener('click', () => {
        _dbgMusicOverride = false;
        const targetShipped = +slider.value;
        const diff = targetShipped - S.shipped;
        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            // Fill all types using tLoc/tRes (what canShip actually checks)
            if (Array.isArray(S.unlockedTypes)) {
              for (const type of S.unlockedTypes) {
                const need = engShipAt(type) + 1;
                if (type === 'coder') { S.loc = need; S.tLoc = Math.max(S.tLoc, need); }
                else if (S.engineers && S.engineers[type]) {
                  S.engineers[type].res = need;
                  S.engineers[type].tRes = Math.max(S.engineers[type].tRes || 0, need);
                }
              }
            }
            isShipping = false;
            ship();
            // Remove the year-transition overlay that ship() creates
            const ov = document.querySelector('.ship-ov');
            if (ov) ov.remove();
            window._pendingRetired = null; // skip popup during debug jump
            isShipping = false;
          }
        } else if (diff < 0) {
          S.shipped = targetShipped;
          _eraYear = -1; currentComputerEra = '';
          document.documentElement.className = '';
          markDirty(); recomputeG(); updateDeskScene();
          renderTypeTabs(); renderResourceBar(); renderShipPanel();
        }
        lbl.textContent = 'Year: ' + currentYear() + ' (shipped: ' + S.shipped + ')';
        slider.value = S.shipped;
      });
      panel.appendChild(jumpBtn);

      // Quick GUI era buttons (v10: mapped to RELEASE_YEARS indices)
      const eraLabel = document.createElement('div');
      eraLabel.style.cssText = 'margin-top:8px;font-size:11px;color:#f0883e;font-weight:700';
      eraLabel.textContent = '\u{1F5A5} GUI Eras';
      panel.appendChild(eraLabel);
      const eraRow = document.createElement('div');
      eraRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
      const eras = [
        { label:'Apple II', s:0 },{ label:'DOS', s:1 },{ label:'Win3.x', s:2 },
        { label:'Win95', s:3 },{ label:'Win98', s:4 },{ label:'WinXP', s:5 },
        { label:'Win7', s:6 },{ label:'Win10', s:8 },{ label:'Win11', s:9 }
      ];
      eras.forEach(era => {
        const b = document.createElement('button');
        b.textContent = era.label;
        b.style.cssText = 'flex:1;min-width:70px;padding:4px;background:#2a2a44;color:#ccc;border:1px solid #555;border-radius:3px;font-size:10px;cursor:pointer';
        b.addEventListener('click', () => { slider.value = era.s; slider.dispatchEvent(new Event('input')); jumpBtn.click(); });
        eraRow.appendChild(b);
      });
      panel.appendChild(eraRow);

      // Quick sound era buttons
      const sndLabel = document.createElement('div');
      sndLabel.style.cssText = 'margin-top:8px;font-size:11px;color:#a78bfa;font-weight:700';
      sndLabel.textContent = '\u266B Sound Eras';
      panel.appendChild(sndLabel);
      const sndRow = document.createElement('div');
      sndRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
      const soundEras = [
        { label:'Early', id:'early' },{ label:'8-bit', id:'chip8' },
        { label:'16-bit', id:'16bit' },{ label:'FM/MIDI', id:'fm' },
        { label:'CD-ROM', id:'cd' },{ label:'Modern', id:'modern' },
        { label:'Indie', id:'indie' },{ label:'Lo-fi', id:'lofi' }
      ];
      soundEras.forEach(se => {
        const b = document.createElement('button');
        b.textContent = se.label;
        b.style.cssText = 'flex:1;min-width:55px;padding:4px;background:#2a2a44;color:#a78bfa;border:1px solid #555;border-radius:3px;font-size:10px;cursor:pointer';
        b.addEventListener('click', () => {
          ensureAudio();
          if (S.musicVol === 0) { S.musicVol = 0.5; musicGain.gain.value = 0.5; }
          _dbgMusicOverride = true;
          const era = MUSIC_ERAS.find(e => e.id === se.id);
          if (era) { stopMusic(); curMusicEra = era.id; startMusicLoop(era); }
        });
        sndRow.appendChild(b);
      });
      panel.appendChild(sndRow);

      // Add fame
      const fameRow = document.createElement('div');
      fameRow.style.cssText = 'display:flex;gap:4px;margin-top:8px';
      [10, 50, 200].forEach(n => {
        const b = document.createElement('button');
        b.textContent = '+' + n + ' Fame';
        b.style.cssText = 'flex:1;padding:4px;background:#2a2a44;color:#f0883e;border:1px solid #555;border-radius:3px;font-size:10px;cursor:pointer';
        b.addEventListener('click', () => { S.fame += n; S.tFame += n; });
        fameRow.appendChild(b);
      });
      panel.appendChild(fameRow);

      // Add resources
      const resRow = document.createElement('div');
      resRow.style.cssText = 'display:flex;gap:4px;margin-top:4px';
      [1e4, 1e6, 1e9].forEach(n => {
        const b = document.createElement('button');
        b.textContent = '+' + (n >= 1e9 ? '1B' : n >= 1e6 ? '1M' : '10K') + ' Res';
        b.style.cssText = 'flex:1;padding:4px;background:#2a2a44;color:#7ee787;border:1px solid #555;border-radius:3px;font-size:10px;cursor:pointer';
        b.addEventListener('click', () => {
          S.loc += n;
          if (S.engineers) for (const k in S.engineers) S.engineers[k].res = (S.engineers[k].res || 0) + n;
        });
        resRow.appendChild(b);
      });
      panel.appendChild(resRow);

      // Fill to ship
      const fillBtn = document.createElement('button');
      fillBtn.textContent = '\u{1F680} Fill to Ship';
      fillBtn.style.cssText = 'width:100%;padding:6px;background:#2a2a44;color:#7ee787;border:1px solid #555;border-radius:4px;font-weight:700;font-size:11px;cursor:pointer;margin-top:8px';
      fillBtn.addEventListener('click', () => {
        if (Array.isArray(S.unlockedTypes)) {
          for (const type of S.unlockedTypes) {
            const need = engShipAt(type) + 1;
            if (type === 'coder') { S.loc = Math.max(S.loc, need); S.tLoc = Math.max(S.tLoc, need); }
            else if (S.engineers && S.engineers[type]) {
              S.engineers[type].res = Math.max(S.engineers[type].res || 0, need);
              S.engineers[type].tRes = Math.max(S.engineers[type].tRes || 0, need);
            }
          }
        }
        markDirty();
        toast('\u{1F41B} Resources filled — ready to ship!');
      });
      panel.appendChild(fillBtn);

      // Age All +N
      const ageLabel = document.createElement('div');
      ageLabel.style.cssText = 'margin-top:8px;font-size:11px;color:#f87171;font-weight:700';
      ageLabel.textContent = '\u{1F382} Age All Engineers';
      panel.appendChild(ageLabel);
      const ageRow = document.createElement('div');
      ageRow.style.cssText = 'display:flex;gap:4px;margin-top:4px';
      [1, 5, 10].forEach(n => {
        const b = document.createElement('button');
        b.textContent = '+' + n + ' yr';
        b.style.cssText = 'flex:1;padding:4px;background:#2a2a44;color:#f87171;border:1px solid #555;border-radius:3px;font-size:10px;cursor:pointer';
        b.addEventListener('click', () => {
          let count = 0;
          const ageAll = list => { if (!Array.isArray(list)) return; list.forEach(c => { if (c.age === undefined) { c.age = 20 + (c.edu||0)*2 + (c.exp||0); c.retireAge = Math.min(78, 57 + (c.edu||0)*2 + Math.floor((c.seed||Math.random())*(11+(c.edu||0)*2))); } c.age += n; c.exp += n; c.tier = computeTier(c.edu, c.exp, c.seed); count++; }); };
          ageAll(S.coders);
          if (S.engineers) { for (const k in S.engineers) ageAll(S.engineers[k].list); }
          // Run retirement check
          let retired = [];
          if (Array.isArray(S.coders)) S.coders = S.coders.filter(c => { if (c.age >= c.retireAge) { retired.push(c); return false; } return true; });
          if (S.engineers) { for (const k in S.engineers) { const l = S.engineers[k].list; if (Array.isArray(l)) S.engineers[k].list = l.filter(c => { if (c.age >= c.retireAge) { retired.push(c); return false; } return true; }); } }
          if (retired.length > 0) {
            if (retired.length <= 3) retired.forEach(c => log('\u{1F382} ' + c.name + ' retired at age ' + c.age));
            else log('\u{1F382} ' + retired.length + ' engineers retired');
            showRetirePopup(retired);
          }
          recomputeG(); markDirty(); renderRosterCol(); updateOfficeSprites();
          toast('\u{1F41B} Aged ' + count + ' engineers by ' + n + ' yr' + (retired.length ? ' (' + retired.length + ' retired)' : ''));
        });
        ageRow.appendChild(b);
      });
      panel.appendChild(ageRow);

      // Speed multiplier
      const spdLabel = document.createElement('div');
      spdLabel.style.cssText = 'margin-top:8px;font-size:11px;color:#38bdf8;font-weight:700';
      spdLabel.textContent = '\u26A1 Speed Multiplier';
      panel.appendChild(spdLabel);
      const spdRow = document.createElement('div');
      spdRow.style.cssText = 'display:flex;gap:4px;margin-top:4px';
      if (typeof window._dbgSpeed === 'undefined') window._dbgSpeed = 1;
      [1, 2, 5, 10].forEach(n => {
        const b = document.createElement('button');
        b.textContent = n + 'x';
        b.style.cssText = 'flex:1;padding:4px;background:' + (window._dbgSpeed === n ? '#38bdf8' : '#2a2a44') + ';color:' + (window._dbgSpeed === n ? '#000' : '#38bdf8') + ';border:1px solid #555;border-radius:3px;font-size:10px;cursor:pointer;font-weight:700';
        b.addEventListener('click', () => {
          window._dbgSpeed = n;
          // Update button styles
          spdRow.querySelectorAll('button').forEach(btn => {
            const isActive = btn.textContent === n + 'x';
            btn.style.background = isActive ? '#38bdf8' : '#2a2a44';
            btn.style.color = isActive ? '#000' : '#38bdf8';
          });
          toast('\u{1F41B} Speed: ' + n + 'x');
        });
        spdRow.appendChild(b);
      });
      panel.appendChild(spdRow);

      // Close button
      const closeBtn = document.createElement('div');
      closeBtn.textContent = '\u00d7';
      closeBtn.style.cssText = 'position:absolute;top:6px;right:10px;cursor:pointer;font-size:16px;color:#888';
      closeBtn.addEventListener('click', () => { panel.remove(); open = false; });
      panel.appendChild(closeBtn);

      document.body.appendChild(panel);
    }
  });
})();
