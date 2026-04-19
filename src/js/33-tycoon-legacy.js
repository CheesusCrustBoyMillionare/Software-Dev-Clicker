// ========== TYCOON LEGACY DECISIONS (v2) ==========
// Phase 5E: 5 one-time strategic pivots available 2020+.
// Each is irreversible and reshapes the endgame.
(function(){
  'use strict';

  const UNLOCK_YEAR = 2020;

  const DECISIONS = [
    {
      id: 'philanthropy',
      label: '🌱 Philanthropy',
      blurb: 'Convert 100 Fame into a permanent Legacy Score. Boosts your retrospective; reduces current Fame.',
      canTake() { return (S.fame || 0) >= 100; },
      execute() {
        S.fame -= 100;
        S.legacyScore = (S.legacyScore || 0) + 200;
        return { ok: true, msg: 'Fame 100 → Legacy Score +200' };
      }
    },
    {
      id: 'go_private',
      label: '🔒 Take Company Private',
      blurb: 'Reverse the IPO. Escape board pressure + earnings calls. Costs 2× IPO raise to buy back.',
      canTake() {
        if (!S.ipo?.completed) return false;
        const buyback = (S.ipo?.netRaise || 0) * 2;
        return (S.cash || 0) >= buyback;
      },
      execute() {
        const buyback = (S.ipo.netRaise || 0) * 2;
        S.cash -= buyback;
        S.tExpenses = (S.tExpenses || 0) + buyback;
        S.ipo.completed = false;
        S.ipo.wentPrivate = true;
        S.ipo.privatizedAtYear = S.calendar?.year;
        // Founder reclaims public equity
        const publicEq = S.capTable?.vcEquity?.public || 0;
        delete S.capTable.vcEquity.public;
        S.capTable.founderEquity += publicEq;
        return { ok: true, msg: 'Paid ' + buyback.toLocaleString() + ' to go private. Founder reclaims ' + Math.round(publicEq*100) + '%' };
      }
    },
    {
      id: 'spin_off',
      label: '🌿 Spawn Spin-off',
      blurb: 'Found a sister-studio as your legacy project. Free-form genre focus. (Preps for roguelite mode.)',
      canTake() {
        return (S.cash || 0) >= 5_000_000;
      },
      execute() {
        if (!window.tycoonSubsidiaries) return { ok: false, msg: 'Subsidiary system not available' };
        S.cash -= 5_000_000;
        S.tExpenses += 5_000_000;
        // Force-create (bypass gates for this special case)
        if (!Array.isArray(S.subsidiaries)) S.subsidiaries = [];
        S.subsidiaries.push({
          id: 's_legacy_' + Date.now().toString(36),
          name: 'Legacy Studios',
          focus: 'ai',  // future-looking
          teamSize: 8,
          quality: 75,
          createdAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
          shippedCount: 0,
          nextProject: null,
          monthlyCost: 100_000,  // discounted upkeep — legacy project
          isLegacy: true,
        });
        S.legacyScore = (S.legacyScore || 0) + 150;
        return { ok: true, msg: 'Legacy Studios spawned. +150 Legacy Score.' };
      }
    },
    {
      id: 'sell_megacorp',
      label: '💰 Sell to Megacorp',
      blurb: 'Massive cash exit. 4× annual revenue. Game-ending — triggers retrospective.',
      canTake() { return true; }, // always available 2020+
      execute() {
        const annualRev = (S.tRevenue || 0) / Math.max(1, (S.calendar?.year || 1980) - 1980 + 1);
        const exitPrice = Math.round(annualRev * 4);
        S.cash = (S.cash || 0) + exitPrice;
        S.tRevenue += exitPrice;
        S.soldToMegacorp = { price: exitPrice, year: S.calendar?.year };
        // Trigger victory/retrospective
        document.dispatchEvent(new CustomEvent('tycoon:megacorp-exit', { detail: { price: exitPrice } }));
        return { ok: true, msg: 'Sold for ' + exitPrice.toLocaleString() + '. Retire in splendor.', endGame: true };
      }
    },
    {
      id: 'foundation',
      label: '🎓 Charitable Foundation',
      blurb: 'Donate half your cash. Converts to massive Legacy Score and Fame. Founder becomes philanthropist.',
      canTake() { return (S.cash || 0) >= 10_000_000; },
      execute() {
        const donation = Math.floor((S.cash || 0) / 2);
        S.cash -= donation;
        S.tExpenses += donation;
        const legacyGained = Math.round(donation / 100_000);  // $100K = 1 legacy pt
        S.legacyScore = (S.legacyScore || 0) + legacyGained;
        S.fame = (S.fame || 0) + 100;
        S.tFame = (S.tFame || 0) + 100;
        return { ok: true, msg: 'Donated ' + donation.toLocaleString() + '. +' + legacyGained + ' Legacy Score, +100 Fame.' };
      }
    },
  ];

  function ensureState() {
    if (!Array.isArray(S.legacyDecisions)) S.legacyDecisions = [];
  }

  function isAvailable() {
    return (S.calendar?.year || 1980) >= UNLOCK_YEAR;
  }

  function takenDecisions() {
    ensureState();
    return S.legacyDecisions;
  }

  function takeDecision(id) {
    ensureState();
    if (!isAvailable()) return { ok: false, error: 'Locked until ' + UNLOCK_YEAR };
    if (S.legacyDecisions.includes(id)) return { ok: false, error: 'Already taken' };
    const d = DECISIONS.find(x => x.id === id);
    if (!d) return { ok: false, error: 'Unknown decision' };
    if (!d.canTake()) return { ok: false, error: 'Prerequisites not met' };
    const result = d.execute();
    if (!result.ok) return { ok: false, error: result.msg };
    S.legacyDecisions.push(id);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('📜 Legacy: ' + d.label + ' — ' + result.msg);
    document.dispatchEvent(new CustomEvent('tycoon:legacy-decision', {
      detail: { id, msg: result.msg, endGame: result.endGame }
    }));
    return { ok: true, msg: result.msg, endGame: result.endGame };
  }

  window.tycoonLegacy = {
    DECISIONS,
    UNLOCK_YEAR,
    isAvailable,
    takenDecisions,
    takeDecision,
    state() {
      ensureState();
      return {
        available: isAvailable(),
        unlocked: S.calendar?.year >= UNLOCK_YEAR,
        taken: S.legacyDecisions,
        legacyScore: S.legacyScore || 0,
      };
    }
  };
  if (window.dbg) window.dbg.legacy = window.tycoonLegacy;

  console.log('[tycoon-legacy] module loaded. ' + DECISIONS.length + ' decisions, unlocks ' + UNLOCK_YEAR + '.');
})();
