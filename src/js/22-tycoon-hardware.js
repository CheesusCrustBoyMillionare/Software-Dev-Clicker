// ========== TYCOON HARDWARE (v2) ==========
// Phase 3D: hardware purchases that unlock specific research nodes.
// Each hardware item has upfront + optional monthly recurring cost.
(function(){
  'use strict';

  // 6 key items for Phase 3 (full catalog is ~15 in DESIGN_V2.md)
  const HARDWARE_ITEMS = [
    {
      id: 'h_cd_mastering',
      name: 'CD Mastering Kit',
      icon: '💿',
      era: 1991,
      upfront: 20000,
      monthly: 0,
      unlocks: ['n_cd_rom'],
      desc: 'Burn CD-ROM master discs for production.'
    },
    {
      id: 'h_sgi_workstation',
      name: 'SGI Workstation',
      icon: '🖥️',
      era: 1993,
      upfront: 50000,
      monthly: 0,
      unlocks: ['n_3d_graphics'],
      desc: 'Silicon Graphics workstations — industry standard for 3D.'
    },
    {
      id: 'h_server_infra',
      name: 'Server Infrastructure',
      icon: '🗄️',
      era: 1998,
      upfront: 80000,
      monthly: 5000,
      unlocks: ['n_tcp_ip'],
      desc: 'Rack servers, load balancers, co-location. Ongoing hosting.'
    },
    {
      id: 'h_cloud_credits',
      name: 'Cloud Infrastructure',
      icon: '☁️',
      era: 2009,
      upfront: 30000,
      monthly: 15000,
      unlocks: ['n_cloud_infra'],
      desc: 'AWS / Azure credits + DevOps tooling.'
    },
    {
      id: 'h_vr_devkit',
      name: 'VR Headset Dev Kit',
      icon: '🥽',
      era: 2016,
      upfront: 30000,
      monthly: 0,
      unlocks: [],
      desc: 'Rift DK2, Vive Pro — VR development hardware.'
    },
    {
      id: 'h_gpu_cluster',
      name: 'GPU Compute Farm',
      icon: '🧠',
      era: 2022,
      upfront: 500000,
      monthly: 50000,
      unlocks: ['n_llm_research'],
      desc: 'H100s for model training. Serious AI workloads.'
    },
  ];
  window.HARDWARE_ITEMS = HARDWARE_ITEMS;
  const HARDWARE_BY_ID = Object.fromEntries(HARDWARE_ITEMS.map(h => [h.id, h]));

  // ---------- State ----------
  function ensureState() {
    if (!Array.isArray(S.hardware)) S.hardware = [];
  }

  function isOwned(hardwareId) {
    ensureState();
    return S.hardware.some(h => h.id === hardwareId || h === hardwareId);
  }

  function isAvailableToBuy(hardwareId) {
    const hw = HARDWARE_BY_ID[hardwareId];
    if (!hw) return { ok: false, reason: 'Unknown hardware' };
    if (isOwned(hardwareId)) return { ok: false, reason: 'Already owned' };
    const year = S.calendar?.year || 1980;
    if (year < hw.era) return { ok: false, reason: 'Not yet available (needs ' + hw.era + '+)' };
    if ((S.cash || 0) < hw.upfront) return { ok: false, reason: 'Need $' + hw.upfront.toLocaleString() };
    return { ok: true };
  }

  // ---------- Purchase ----------
  function purchase(hardwareId) {
    const check = isAvailableToBuy(hardwareId);
    if (!check.ok) return { ok: false, error: check.reason };
    const hw = HARDWARE_BY_ID[hardwareId];
    S.cash -= hw.upfront;
    S.tExpenses = (S.tExpenses || 0) + hw.upfront;
    ensureState();
    S.hardware.push({ id: hw.id, purchasedAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0 });
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('⚙ Purchased: ' + hw.icon + ' ' + hw.name + ' ($' + hw.upfront.toLocaleString() + ')');
    document.dispatchEvent(new CustomEvent('tycoon:hardware-purchased', { detail: { hardwareId: hw.id } }));
    return { ok: true, hardware: hw };
  }

  // ---------- Monthly upkeep ----------
  let _weeksSinceLastUpkeep = 0;
  const WEEKS_PER_MONTH = 4;
  function onWeekTick() {
    _weeksSinceLastUpkeep += 1;
    if (_weeksSinceLastUpkeep >= WEEKS_PER_MONTH) {
      _weeksSinceLastUpkeep = 0;
      runUpkeep();
    }
  }

  function runUpkeep() {
    ensureState();
    let total = 0;
    for (const owned of S.hardware) {
      const hw = HARDWARE_BY_ID[owned.id];
      if (hw && hw.monthly) total += hw.monthly;
    }
    if (total === 0) return;
    S.cash = (S.cash || 0) - total;
    S.tExpenses = (S.tExpenses || 0) + total;
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('⚙ Hardware upkeep: $' + total.toLocaleString() + '/mo');
  }

  // Monthly burn contribution (used by Finance/runway calculation later)
  function monthlyUpkeep() {
    ensureState();
    let total = 0;
    for (const owned of S.hardware) {
      const hw = HARDWARE_BY_ID[owned.id];
      if (hw && hw.monthly) total += hw.monthly;
    }
    return total;
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startHardwareTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[hardware] tycoonTime not available'); return; }
    ensureState();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopHardwareTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ---------- Public API ----------
  window.tycoonHardware = {
    ITEMS: HARDWARE_ITEMS,
    BY_ID: HARDWARE_BY_ID,
    isOwned,
    isAvailableToBuy,
    purchase,
    monthlyUpkeep,
    startTick: startHardwareTick,
    stopTick: stopHardwareTick,
    state() {
      ensureState();
      return {
        owned: S.hardware,
        monthlyUpkeep: monthlyUpkeep(),
        ownedCount: S.hardware.length + '/' + HARDWARE_ITEMS.length
      };
    }
  };
  if (window.dbg) window.dbg.hardware = window.tycoonHardware;

  console.log('[tycoon-hardware] module loaded. ' + HARDWARE_ITEMS.length + ' items available.');
})();
