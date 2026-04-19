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
    const toRemove = [];
    for (const loan of S.loans) {
      const pay = Math.min(loan.monthlyPayment, S.cash || 0);
      S.cash = (S.cash || 0) - pay;
      S.tExpenses = (S.tExpenses || 0) + pay;
      totalPaid += pay;
      loan.monthsRemaining -= 1;
      if (loan.monthsRemaining <= 0) {
        toRemove.push(loan.id);
      }
    }
    for (const id of toRemove) {
      S.loans = S.loans.filter(l => l.id !== id);
      if (typeof log === 'function') log('🏦 Loan paid off');
    }
    if (totalPaid > 0 && typeof log === 'function') {
      log('🏦 Loan payment: $' + totalPaid.toLocaleString());
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
    // Auto-pause on alert/critical
    if (severity === 'alert' || severity === 'critical') {
      if (window.tycoonTime && !S.paused) {
        S.paused = true;
        document.dispatchEvent(new CustomEvent('tycoon:runway-warning', { detail: { severity, message: msg } }));
      }
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

  // ---------- Public API ----------
  window.tycoonFinance = {
    canTakeLoan,
    maxLoanAmount,
    loanInterestRate,
    computeMonthlyPayment,
    takeLoan,
    runLoanPayments,             // debug
    currentRunwayMonths,
    startTick: startFinanceTick,
    stopTick: stopFinanceTick,
    state() {
      return {
        loans: S.loans || [],
        warnings: S.warnings || {},
        runway: currentRunwayMonths(),
        canLoan: canTakeLoan(),
        maxLoan: maxLoanAmount()
      };
    }
  };
  if (window.dbg) window.dbg.finance = window.tycoonFinance;

  console.log('[tycoon-finance] module loaded. Loans unlock at Fame 5+.');
})();
