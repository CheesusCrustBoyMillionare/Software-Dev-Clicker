// ========== TYCOON FINANCE (v2) ==========
// Phase 2E: Bankruptcy runway warnings + loan system.
// Hard bankruptcy game-over is Phase 5; this phase only warns.
(function(){
  'use strict';

  const WEEKS_PER_MONTH = 4;                  // our simplified calendar

  // ---------- Loan terms ----------
  function maxLoanAmount() {
    const fame = S.tFame || 0;
    const annualRev = (() => {
      // Crude proxy: lifetime rev / years since founding (min 1)
      const years = Math.max(1, (S.calendar?.year || 1980) - 1980);
      return (S.tRevenue || 0) / years;
    })();
    const fameBased = 50000 + fame * 10000;
    const revBased = annualRev * 0.5;
    return Math.max(fameBased, revBased);
  }

  function canTakeLoan() {
    const fame = S.tFame || 0;
    return fame >= 5; // min unlock
  }

  function loanInterestRate() {
    // Simple: 10% APR baseline. Later phases scale by era.
    return 0.10;
  }

  // Simple-interest loan math (good enough for v1 balance)
  function computeMonthlyPayment(principal, apr, termMonths) {
    const totalInterest = principal * apr * (termMonths / 12);
    return Math.round((principal + totalInterest) / termMonths);
  }

  function takeLoan(requestedPrincipal) {
    if (!canTakeLoan()) return { ok: false, error: 'Need Fame 5+ to qualify for a loan' };
    const max = maxLoanAmount();
    const principal = Math.min(requestedPrincipal, max);
    if (principal < 5000) return { ok: false, error: 'Minimum loan is $5,000' };
    const apr = loanInterestRate();
    const term = 36;
    const monthly = computeMonthlyPayment(principal, apr, term);
    if (!Array.isArray(S.loans)) S.loans = [];
    const loan = {
      id: 'l_' + Date.now().toString(36),
      principal,
      apr,
      termMonths: term,
      monthlyPayment: monthly,
      monthsRemaining: term,
      startedAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
    };
    S.loans.push(loan);
    S.cash = (S.cash || 0) + principal;
    S.tRevenue = S.tRevenue; // loans aren't revenue
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('🏦 Took loan: $' + principal.toLocaleString() + ' (36mo @ 10% APR, $' + monthly.toLocaleString() + '/mo)');
    document.dispatchEvent(new CustomEvent('tycoon:loan-taken', { detail: { loanId: loan.id } }));
    return { ok: true, loan };
  }

  // ---------- Monthly payment deduction ----------
  let _weeksSinceLastPayment = 0;
  function onWeekTick() {
    _weeksSinceLastPayment += 1;
    if (_weeksSinceLastPayment >= WEEKS_PER_MONTH) {
      _weeksSinceLastPayment = 0;
      runLoanPayments();
    }
    checkRunwayWarnings();
  }

  function runLoanPayments() {
    if (!Array.isArray(S.loans) || S.loans.length === 0) return;
    let totalPaid = 0;
    let missedPayments = 0;
    const toRemove = [];
    for (const loan of S.loans) {
      // Clamp available cash to >= 0 before capping. Previously
      // Math.min(monthlyPayment, S.cash) returned a negative when cash was
      // already underwater, and subtracting a negative added free cash —
      // players past bankruptcy threshold were getting bailed out by their
      // own loans. Treat underwater cash as $0 available for payments.
      const available = Math.max(0, S.cash || 0);
      const pay = Math.min(loan.monthlyPayment, available);
      S.cash = (S.cash || 0) - pay;
      S.tExpenses = (S.tExpenses || 0) + pay;
      totalPaid += pay;
      // Only decrement remaining term if the full payment cleared; a missed
      // or partial payment doesn't shorten the loan.
      if (pay >= loan.monthlyPayment) {
        loan.monthsRemaining -= 1;
        if (loan.monthsRemaining <= 0) toRemove.push(loan.id);
      } else {
        missedPayments += 1;
      }
    }
    for (const id of toRemove) {
      S.loans = S.loans.filter(l => l.id !== id);
      if (typeof log === 'function') log('🏦 Loan paid off');
    }
    if (totalPaid > 0 && typeof log === 'function') {
      log('🏦 Loan payment: $' + totalPaid.toLocaleString());
    }
    if (missedPayments > 0 && typeof log === 'function') {
      log('🏦 Missed ' + missedPayments + ' loan payment' + (missedPayments > 1 ? 's' : '') + ' \u2014 insufficient cash');
    }
    if (typeof markDirty === 'function') markDirty();
  }

  // ---------- Runway warnings ----------
  function ensureWarnings() {
    if (!S.warnings) S.warnings = { runway6mo: false, runway3mo: false, runway1mo: false };
  }

  function currentRunwayMonths() {
    if (window.tycoonEmployees) return window.tycoonEmployees.runwayMonths();
    return Infinity;
  }

  function checkRunwayWarnings() {
    ensureWarnings();
    const runway = currentRunwayMonths();
    const w = S.warnings;
    // Reset warnings if runway recovers above double the threshold
    if (runway >= 12 && (w.runway6mo || w.runway3mo || w.runway1mo)) {
      w.runway6mo = false;
      w.runway3mo = false;
      w.runway1mo = false;
    }
    if (runway <= 1 && !w.runway1mo) {
      w.runway1mo = true;
      fireWarning('critical', '🚨 CRITICAL: <1 month runway. Layoffs, loan, or IP sale urgently needed.');
    } else if (runway <= 3 && !w.runway3mo) {
      w.runway3mo = true;
      fireWarning('alert',    '⚠️ WARNING: <3 months runway. Consider cost cuts or revenue actions.');
    } else if (runway <= 6 && !w.runway6mo) {
      w.runway6mo = true;
      fireWarning('info',     'ℹ️ Runway is getting short: <6 months. Plan ahead.');
    }
  }

  function fireWarning(severity, msg) {
    if (typeof log === 'function') log(msg);
    // Previously auto-paused on alert/critical with no restore path, which
    // silently froze the game when a runway threshold was crossed. The
    // bankruptcy countdown in the top bar now provides the always-visible
    // indicator we actually wanted — the toast is just a heads-up.
    if (severity === 'alert' || severity === 'critical') {
      document.dispatchEvent(new CustomEvent('tycoon:runway-warning', { detail: { severity, message: msg } }));
    }
    if (typeof markDirty === 'function') markDirty();
    if (severity === 'critical') {
      document.dispatchEvent(new CustomEvent('tycoon:runway-critical', { detail: { message: msg } }));
    }
  }

  // ---------- Tick subscription ----------
  let _unsub = null;
  function startFinanceTick() {
    if (_unsub) return;
    if (!window.tycoonTime) { console.warn('[finance] tycoonTime not available'); return; }
    ensureWarnings();
    _unsub = window.tycoonTime.onTick(onWeekTick);
  }
  function stopFinanceTick() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  // ========== VC ROUNDS (Phase 5A) ==========
  // Three rounds: Seed → Series A → Series B/C. Equity dilution.
  // >50% dilution risk: board takeover mid-game event (Phase 5B extension).

  const VC_ROUNDS = {
    seed: {
      id: 'seed', label: 'Seed', icon: '🌱',
      gateText: 'Fame 20+',
      cashRange: [500_000, 2_000_000],
      equityRange: [0.15, 0.25],
      canRaise() { return (S.tFame || 0) >= 20 && !roundExists('seed'); }
    },
    series_a: {
      id: 'series_a', label: 'Series A', icon: '📈',
      gateText: 'First hit (critic 75+) + $1M revenue',
      cashRange: [5_000_000, 20_000_000],
      equityRange: [0.20, 0.30],
      canRaise() {
        if (roundExists('series_a')) return false;
        if (!roundExists('seed')) return false; // must do seed first
        const hasHit = (S.projects?.shipped || []).some(p => !p.isContract && (p.criticScore || 0) >= 75);
        if (!hasHit) return false;
        if ((S.tRevenue || 0) < 1_000_000) return false;
        return true;
      }
    },
    series_b: {
      id: 'series_b', label: 'Series B/C', icon: '🚀',
      gateText: '$10M+ revenue',
      cashRange: [20_000_000, 100_000_000],
      equityRange: [0.15, 0.25],
      canRaise() {
        if (!roundExists('series_a')) return false;
        if ((S.tRevenue || 0) < 10_000_000) return false;
        return true; // stackable
      }
    }
  };

  function roundExists(roundId) {
    return (S.vcRounds || []).some(r => r.type === roundId);
  }

  // ========== IPO (Phase 5B) ==========
  function currentValuation() {
    ensureCapTable();
    const annualRev = (S.tRevenue || 0) / Math.max(1, (S.calendar?.year || 1980) - 1980 + 1);
    const fameBoost = 1 + ((S.tFame || 0) / 500);   // fame up to 500 = 2× valuation
    const growthBoost = 1.5; // post-IPO assumption
    return Math.round(annualRev * 5 * fameBoost * growthBoost);
  }

  function canIPO() {
    if (S.ipo?.completed) return { ok: false, reason: 'Already public' };
    const val = currentValuation();
    if (val < 500_000_000) return { ok: false, reason: 'Valuation < $500M (need ' + ((500_000_000 / 1_000_000).toFixed(0)) + 'M, have ' + (val/1_000_000).toFixed(0) + 'M)' };
    if ((S.tFame || 0) < 200) return { ok: false, reason: 'Fame < 200 (have ' + (S.tFame || 0) + ')' };
    const hasHit = (S.projects?.shipped || []).some(p => !p.isContract && (p.criticScore || 0) >= 85);
    if (!hasHit) return { ok: false, reason: 'No critic 85+ own-IP hit yet' };
    return { ok: true, valuation: val };
  }

  function takeIPO() {
    const check = canIPO();
    if (!check.ok) return { ok: false, error: check.reason };
    const valuation = check.valuation;
    const newEquityOffered = 0.20;     // 20% of company offered to public
    const grossRaise = Math.round(valuation * newEquityOffered);
    const bankerFees = Math.round(grossRaise * 0.05);
    const netRaise = grossRaise - bankerFees;
    // Pay banker fees immediately
    S.cash -= bankerFees;
    S.tExpenses = (S.tExpenses || 0) + bankerFees;
    // Dilute all existing holders proportionally (same math as VC)
    ensureCapTable();
    const existingVCs = { ...S.capTable.vcEquity };
    const scaleFactor = (1 - newEquityOffered);
    S.capTable.founderEquity *= scaleFactor;
    for (const k of Object.keys(existingVCs)) {
      S.capTable.vcEquity[k] = existingVCs[k] * scaleFactor;
    }
    S.capTable.vcEquity['public'] = newEquityOffered;
    // Player pockets the raise (in real life, proceeds split — we simplify)
    S.cash += netRaise;
    // Record IPO
    S.ipo = {
      completed: true,
      closedAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
      closedAtYear: S.calendar?.year || 1980,
      valuation,
      grossRaise,
      netRaise,
      bankerFees,
    };
    // Huge Fame spike
    S.fame = (S.fame || 0) + 50;
    S.tFame = (S.tFame || 0) + 50;
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') {
      log('🔔 Studio IPO! Valuation $' + (valuation/1_000_000).toFixed(0) + 'M. Raised net $' + (netRaise/1_000_000).toFixed(0) + 'M after 5% banker fees. +50 Fame.');
    }
    document.dispatchEvent(new CustomEvent('tycoon:ipo', { detail: { valuation, netRaise } }));
    return { ok: true, valuation, netRaise };
  }

  // ---------- Post-IPO quarterly earnings pressure ----------
  // Every 12 weeks (a quarter) compare current rev trajectory vs expectations.
  let _weeksSinceEarnings = 0;
  let _lastRevenueCheck = null;
  function onEarningsTick() {
    if (!S.ipo?.completed) return;
    _weeksSinceEarnings += 1;
    if (_weeksSinceEarnings < 12) return;
    _weeksSinceEarnings = 0;

    if (_lastRevenueCheck == null) {
      _lastRevenueCheck = S.tRevenue || 0;
      return;
    }
    const growth = ((S.tRevenue || 0) - _lastRevenueCheck) / Math.max(1, _lastRevenueCheck);
    _lastRevenueCheck = S.tRevenue || 0;

    if (growth < 0.05) {
      // Missed forecast
      if (typeof log === 'function') log('📉 Missed earnings forecast — stock drops, morale hit');
      // Morale penalty to all employees + founder
      if (S.founder) S.founder.morale = Math.max(0, (S.founder.morale || 70) - 5);
      for (const e of (S.employees || [])) e.morale = Math.max(0, (e.morale || 70) - 5);
      document.dispatchEvent(new CustomEvent('tycoon:ipo-missed-earnings'));
    } else if (growth > 0.2) {
      // Strong beat
      if (typeof log === 'function') log('📈 Strong earnings beat — stock rises, morale up');
      if (S.founder) S.founder.morale = Math.min(100, (S.founder.morale || 70) + 5);
      for (const e of (S.employees || [])) e.morale = Math.min(100, (e.morale || 70) + 5);
      S.fame = (S.fame || 0) + 3;
      S.tFame = (S.tFame || 0) + 3;
    }
  }

  // ========== HARD BANKRUPTCY (Phase 5C) ==========
  const BANKRUPTCY_WEEKS = 4; // consecutive weeks negative cash = game over

  function ensureBankruptcy() {
    if (!S.bankruptcy) S.bankruptcy = { negativeWeeks: 0, triggered: false };
  }

  function onBankruptcyTick() {
    ensureBankruptcy();
    if (S.bankruptcy.triggered) return;
    if ((S.cash || 0) < 0) {
      S.bankruptcy.negativeWeeks += 1;
      if (S.bankruptcy.negativeWeeks >= BANKRUPTCY_WEEKS) {
        triggerBankruptcy();
      }
    } else {
      S.bankruptcy.negativeWeeks = 0;
    }
  }

  function triggerBankruptcy() {
    ensureBankruptcy();
    if (S.bankruptcy.triggered) return;
    S.bankruptcy.triggered = true;
    S.bankruptcy.triggeredAtWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    S.bankruptcy.triggeredAtYear = S.calendar?.year || 1980;
    // Mark save slot defunct (global counter across all slots)
    try {
      const raw = localStorage.getItem('gdc_defunct_count') || '0';
      const n = parseInt(raw, 10) + 1;
      localStorage.setItem('gdc_defunct_count', String(n));
      S.bankruptcy.defunctIndex = n;
    } catch (e) {}
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('💀 BANKRUPTCY — studio closed. Career ended ' + S.bankruptcy.triggeredAtYear);
    // v3 roguelite: bankruptcy is a run-end trigger — banks a small endowment
    // contribution, adds founder to the Alumni Hall, dispatches tycoon:run-end.
    // The existing tycoon:bankruptcy event still fires for UI continuity.
    if (window.tycoonSchool?.endRun) window.tycoonSchool.endRun('bankruptcy');
    document.dispatchEvent(new CustomEvent('tycoon:bankruptcy', { detail: { year: S.bankruptcy.triggeredAtYear } }));
  }

  // Hook earnings + bankruptcy ticks alongside existing ones
  const _origOnWeekTick = onWeekTick;
  onWeekTick = function() {
    _origOnWeekTick();
    onEarningsTick();
    onBankruptcyTick();
  };

  function defunctCount() {
    try { return parseInt(localStorage.getItem('gdc_defunct_count') || '0', 10); }
    catch { return 0; }
  }

  function defunctCashBonus() {
    // +5% per defunct career, capped at 50%
    return Math.min(0.5, defunctCount() * 0.05);
  }

  function ensureCapTable() {
    if (!S.capTable) {
      S.capTable = {
        founderEquity: 1.0,   // player owns 100% at start
        vcEquity: {},         // { seed: 0.2, series_a: 0.25 }
      };
    }
    if (!Array.isArray(S.vcRounds)) S.vcRounds = [];
  }

  function totalDilution() {
    ensureCapTable();
    return Object.values(S.capTable.vcEquity || {}).reduce((s, v) => s + v, 0);
  }

  function founderEquity() {
    ensureCapTable();
    return Math.max(0, 1 - totalDilution());
  }

  function takeVCRound(roundId) {
    ensureCapTable();
    const r = VC_ROUNDS[roundId];
    if (!r) return { ok: false, error: 'Unknown round' };
    if (!r.canRaise()) return { ok: false, error: 'Not eligible: ' + r.gateText };

    // Randomize within ranges — fame could tilt but keep simple for now
    const cash = Math.round(r.cashRange[0] + Math.random() * (r.cashRange[1] - r.cashRange[0]));
    const equity = r.equityRange[0] + Math.random() * (r.equityRange[1] - r.equityRange[0]);

    // Dilute existing holders proportionally (standard VC deal)
    // After: new VC has `equity` of total; existing holders share (1 - equity)
    const existingVCs = { ...S.capTable.vcEquity };
    const existingTotal = Object.values(existingVCs).reduce((s, v) => s + v, 0) + S.capTable.founderEquity;
    const scaleFactor = (1 - equity) / existingTotal;
    S.capTable.founderEquity *= scaleFactor;
    for (const k of Object.keys(existingVCs)) {
      S.capTable.vcEquity[k] = existingVCs[k] * scaleFactor;
    }
    // Use roundId with uniqueness suffix for series_b (can stack)
    let storageKey = roundId;
    if (roundId === 'series_b') {
      let n = 1;
      while (S.capTable.vcEquity[storageKey]) {
        n += 1;
        storageKey = 'series_b_' + n;
      }
    }
    S.capTable.vcEquity[storageKey] = equity;

    // Credit cash
    S.cash = (S.cash || 0) + cash;
    // VC rounds don't count as revenue
    S.vcRounds.push({
      type: roundId,
      storageKey,
      cash, equity,
      closedAtWeek: window.tycoonProjects?.absoluteWeek?.() || 0,
    });

    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('💼 ' + r.icon + ' ' + r.label + ' round closed: ' + cash.toLocaleString() + ' for ' + (equity*100).toFixed(1) + '% equity');
    document.dispatchEvent(new CustomEvent('tycoon:vc-round', { detail: { roundId, cash, equity } }));

    // Board takeover warning
    if (totalDilution() > 0.5) {
      if (typeof log === 'function') log('⚠ Investor equity exceeds 50% — board can now vote on major decisions');
    }

    return { ok: true, cash, equity, founderEquity: founderEquity() };
  }

  // ---------- Public API ----------
  window.tycoonFinance = {
    canTakeLoan,
    maxLoanAmount,
    loanInterestRate,
    computeMonthlyPayment,
    takeLoan,
    runLoanPayments,             // debug
    currentRunwayMonths,
    // VC / cap table (Phase 5A)
    VC_ROUNDS,
    takeVCRound,
    founderEquity,
    totalDilution,
    // IPO (Phase 5B)
    currentValuation,
    canIPO,
    takeIPO,
    // Bankruptcy (Phase 5C)
    triggerBankruptcy,           // debug
    BANKRUPTCY_WEEKS,            // consecutive negative-cash weeks until game over
    defunctCount,
    defunctCashBonus,
    startTick: startFinanceTick,
    stopTick: stopFinanceTick,
    state() {
      ensureCapTable();
      return {
        loans: S.loans || [],
        warnings: S.warnings || {},
        runway: currentRunwayMonths(),
        canLoan: canTakeLoan(),
        maxLoan: maxLoanAmount(),
        vcRounds: S.vcRounds || [],
        founderEquity: founderEquity(),
        capTable: S.capTable
      };
    }
  };
  if (window.dbg) window.dbg.finance = window.tycoonFinance;

  console.log('[tycoon-finance] module loaded. Loans unlock at Fame 5+. 3 VC rounds available.');
})();
