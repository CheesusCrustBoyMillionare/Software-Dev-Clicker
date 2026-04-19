// ========== TYCOON LAUNCH WINDOWS (v2) ==========
// Phase 4D: Launch collision detection + seasonal bonuses.
// Applied to launch sales at ship time.
(function(){
  'use strict';

  // ---------- Seasonal multipliers per project type ----------
  // Month 1 = January. Multipliers are per-type.
  const SEASONAL_BONUSES = [
    // January — post-holiday lull
    { months:[1],       bonus:{ all: 0.90 },                     label:'January lull' },
    // Back-to-school
    { months:[8, 9],    bonus:{ business:1.15, saas:1.15 },     label:'Back-to-school' },
    // Holiday peak (games + consumer mobile)
    { months:[11, 12],  bonus:{ game:1.20, mobile:1.15, web:1.10 }, label:'Holiday season' },
    // Q4 fiscal (Dec — enterprise buys)
    { months:[12],      bonus:{ business:1.15, saas:1.15 },      label:'Q4 fiscal rush' },
  ];

  function currentSeasonalMultiplier(projectType, month) {
    month = month == null ? (S.calendar?.month || 1) : month;
    let mult = 1;
    let labels = [];
    for (const season of SEASONAL_BONUSES) {
      if (!season.months.includes(month)) continue;
      const typeMul = season.bonus[projectType];
      const allMul = season.bonus.all;
      if (typeMul) { mult *= typeMul; labels.push(season.label); }
      else if (allMul && typeMul == null) { mult *= allMul; labels.push(season.label); }
    }
    return { mult, labels };
  }

  // ---------- Launch collision detection ----------
  // Looks at rival shipments in the same week and nearby weeks, same type
  function computeCollision(proj) {
    const shipped = S.rivalShippedTitles || [];
    const currentWeek = window.tycoonProjects?.absoluteWeek?.() || 0;
    const currentYear = S.calendar?.year || 1980;
    const currentMonth = S.calendar?.month || 1;

    // Same-week = within 1 week of current; same-month = within 4 weeks
    const sameWeek = [];
    const sameMonth = [];
    for (const t of shipped) {
      // Approximate rival ship week = (t.year - 1980)*48 + (t.month-1)*4 + guess week within month
      // Our S.rivalShippedTitles doesn't carry week, only year+month. Use month proximity:
      const titleAbsMonth = (t.year - 1980) * 12 + t.month;
      const currentAbsMonth = (currentYear - 1980) * 12 + currentMonth;
      const monthDiff = currentAbsMonth - titleAbsMonth;
      if (t.type !== proj.type) continue;
      if (monthDiff === 0) sameMonth.push(t);
      if (monthDiff === 0) sameWeek.push(t); // approximate — if in same month treat as same week collision
    }

    // Also check upcoming rival releases scheduled for this week
    const upcoming = window.tycoonRivals?.upcomingRivalReleases?.(10) || [];
    for (const r of upcoming) {
      if (r.weeksUntil > 1) continue;
      if (r.type !== proj.type) continue;
      sameWeek.push({ rivalName: r.rivalName, rivalIcon: r.rivalIcon, title: r.title, tier: 3 });
    }

    // Categorize by rival tier (inferred via upcoming releases' rival record)
    let mult = 1;
    let notes = [];
    const majorInWeek = sameWeek.filter(t => {
      const r = (S.rivals || []).find(x => x.name === t.rivalName);
      return r && r.tier >= 4;
    });
    const minorInWeek = sameWeek.filter(t => {
      const r = (S.rivals || []).find(x => x.name === t.rivalName);
      return r && r.tier >= 2 && r.tier < 4;
    });
    const majorInMonth = sameMonth.filter(t => {
      const r = (S.rivals || []).find(x => x.name === t.rivalName);
      return r && r.tier >= 4;
    }).filter(t => !majorInWeek.includes(t));

    if (majorInWeek.length > 0) {
      mult *= 0.55;  // -45%
      notes.push('💥 Major rival launch this week: ' + majorInWeek.map(t => t.rivalIcon + ' ' + t.title).join(', '));
    } else if (minorInWeek.length > 0) {
      mult *= 0.80;  // -20%
      notes.push('⚠ Minor rival launch this week: ' + minorInWeek.map(t => t.rivalIcon + ' ' + t.title).join(', '));
    } else if (majorInMonth.length > 0) {
      mult *= 0.85;  // -15%
      notes.push('📅 Major rival launch this month: ' + majorInMonth.map(t => t.rivalIcon + ' ' + t.title).join(', '));
    } else if (sameMonth.length === 0 && sameWeek.length === 0) {
      mult *= 1.10;  // +10% clear-window bonus
      notes.push('🎯 Clear window — no same-genre competition this month');
    }

    return { mult, notes, collisions: { sameWeek, sameMonth } };
  }

  // ---------- Combined launch mult (seasonal + collision) ----------
  function totalLaunchMultiplier(proj) {
    const season = currentSeasonalMultiplier(proj.type);
    const collision = computeCollision(proj);
    return {
      mult: season.mult * collision.mult,
      season,
      collision
    };
  }

  // ---------- Public API ----------
  window.tycoonLaunch = {
    currentSeasonalMultiplier,
    computeCollision,
    totalLaunchMultiplier,
    SEASONAL_BONUSES,
  };
  if (window.dbg) window.dbg.launch = window.tycoonLaunch;

  console.log('[tycoon-launch] module loaded.');
})();
