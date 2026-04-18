// ========== TYCOON MC QUESTION SYSTEM (v2) ==========
// Multiple-choice decisions that fire during Development phase.
// Phase 1C: 10 hardcoded templates. Full content pool (~130) in Phase 5.
// Answers can be gated by founder traits, stats, era, or research (future).
(function(){
  'use strict';

  // ---------- Question Catalog ----------
  // Each question has: id, trigger (feature id or 'any'), projectTypes, text, answers[]
  // Answer: { text, effects: { quality: {tech,design,polish}, bugs, morale, duration }, gate: {traitRequired?, statMin?, eraMin?, eraMax?} }
  const MC_QUESTIONS = [
    // ===== Feature-triggered =====
    {
      id: 'mc_save_system',
      trigger: 'f_save', projectTypes: ['game','business'],
      text: 'How should saves work?',
      answers: [
        { text: 'Password codes (1980s-style; cheap)', effects: { design:-5, polish:-2, tech:-2 } },
        { text: 'Cassette / floppy save file',          effects: { polish:+5, tech:+2 } },
        { text: 'Sophisticated save slots + metadata',  effects: { polish:+10, design:+3, tech:+4, bugs:+2 }, gate: { statMin: { tech: 5 } } },
      ]
    },
    {
      id: 'mc_music_direction',
      trigger: 'f_music', projectTypes: ['game'],
      text: 'What direction for the soundtrack?',
      answers: [
        { text: 'Silent — let gameplay speak',          effects: { design:-5, polish:+3 } },
        { text: 'Chiptune (era-authentic)',             effects: { design:+8, polish:+5 } },
        { text: 'Synthesized orchestral (ambitious)',   effects: { design:+14, polish:+2, bugs:+3 }, gate: { statMin: { design: 5 } } },
      ]
    },
    {
      id: 'mc_mp_network',
      trigger: 'f_mp', projectTypes: ['game'],
      text: 'How should multiplayer connect?',
      answers: [
        { text: 'Shared keyboard / same machine',       effects: { design:+5, tech:-2 } },
        { text: 'Serial cable / null modem',            effects: { design:+10, tech:+8, bugs:+2 } },
        { text: 'Dialup / BBS lobby system',            effects: { design:+15, tech:+12, bugs:+5, polish:-3 }, gate: { statMin: { tech: 6 } } },
      ]
    },
    {
      id: 'mc_diff_curve',
      trigger: 'f_diff', projectTypes: ['game'],
      text: 'Difficulty curve for the game?',
      answers: [
        { text: 'Nintendo-hard — reward mastery',       effects: { design:+8, polish:-2 } },
        { text: 'Gradual ramp — welcoming',             effects: { design:+6, polish:+4 } },
        { text: 'Adaptive — tracks player skill',       effects: { design:+12, tech:+6, bugs:+3 }, gate: { traitRequired: 'Methodical' } },
      ]
    },
    {
      id: 'mc_report_engine',
      trigger: 'f_reports', projectTypes: ['business'],
      text: 'Build the reporting engine how?',
      answers: [
        { text: 'Hardcoded layouts (fast, rigid)',      effects: { tech:+5, polish:+3 } },
        { text: 'Template system with variables',       effects: { tech:+10, design:+6 } },
        { text: 'Full scripting engine for users',      effects: { tech:+15, design:+10, bugs:+5 }, gate: { statMin: { tech: 7 } } },
      ]
    },
    // ===== Zeitgeist (era/project-type pool) =====
    {
      id: 'mc_graphics_style',
      trigger: 'any', projectTypes: ['game'],
      text: 'Graphics style?',
      answers: [
        { text: 'Text / ASCII only',                    effects: { design:-5, tech:-3, polish:+3 } },
        { text: 'Simple 2D sprites',                    effects: { design:+6, polish:+3 } },
        { text: 'Detailed pixel art',                   effects: { design:+14, polish:+8, bugs:+2 }, gate: { statMin: { design: 5 } } },
      ]
    },
    {
      id: 'mc_ui_layout',
      trigger: 'any', projectTypes: ['business'],
      text: 'UI design for the business tool?',
      answers: [
        { text: 'Menu-driven (F-keys)',                 effects: { design:+3, polish:+3, tech:-2 } },
        { text: 'Ribbon-style toolbar',                 effects: { design:+8, polish:+6 } },
        { text: 'Full mouse-driven WYSIWYG',            effects: { design:+12, tech:+8, polish:+4, bugs:+4 }, gate: { statMin: { tech: 5 } } },
      ]
    },
    {
      id: 'mc_scope_pressure',
      trigger: 'any', projectTypes: ['game','business'],
      text: 'The team feels stretched. Your call?',
      answers: [
        { text: 'Cut a feature to stay on time',        effects: { design:-5, polish:+8, bugs:-3 } },
        { text: 'Push through — no cuts',               effects: { design:+3, polish:-3, bugs:+2 } },
        { text: 'Crunch until we ship it all',          effects: { design:+8, polish:+3, bugs:+6, morale:-10 } },
      ]
    },
    {
      id: 'mc_testing_approach',
      trigger: 'any', projectTypes: ['game','business'],
      text: 'Testing strategy?',
      answers: [
        { text: 'Play it a lot ourselves',              effects: { polish:+3, bugs:-2 } },
        { text: 'Friends and family beta',              effects: { polish:+7, design:+3, bugs:-5 } },
        { text: 'Formal QA pass with checklist',        effects: { polish:+12, bugs:-10 }, gate: { statMin: { polish: 5 } } },
      ]
    },
    {
      id: 'mc_manual',
      trigger: 'any', projectTypes: ['game','business'],
      text: 'What about the user manual?',
      answers: [
        { text: 'README.txt is enough',                 effects: { polish:-3, design:-2 } },
        { text: 'Printed manual with screenshots',      effects: { polish:+8, design:+4 } },
        { text: 'Full illustrated game world lore',     effects: { polish:+14, design:+10 }, gate: { traitRequired: 'Creative' } },
      ]
    },
  ];
  window.TYCOON_MC_QUESTIONS = MC_QUESTIONS;
  const MC_BY_ID = Object.fromEntries(MC_QUESTIONS.map(q => [q.id, q]));

  // ---------- Answer availability logic ----------
  function isAnswerAvailable(ans, proj) {
    if (!ans.gate) return true;
    const f = S.founder;
    if (!f) return false;
    if (ans.gate.traitRequired) {
      if (!Array.isArray(f.traits) || !f.traits.includes(ans.gate.traitRequired)) return false;
    }
    if (ans.gate.statMin) {
      for (const [stat, minVal] of Object.entries(ans.gate.statMin)) {
        if ((f.stats?.[stat] || 0) < minVal) return false;
      }
    }
    if (ans.gate.eraMin && S.calendar.year < ans.gate.eraMin) return false;
    if (ans.gate.eraMax && S.calendar.year > ans.gate.eraMax) return false;
    return true;
  }

  // Which reason-strings to show for locked answers (UI uses this)
  function lockedReasons(ans) {
    if (!ans.gate) return [];
    const reasons = [];
    if (ans.gate.traitRequired) reasons.push('Requires trait: ' + ans.gate.traitRequired);
    if (ans.gate.statMin) {
      for (const [stat, minVal] of Object.entries(ans.gate.statMin)) {
        reasons.push('Requires ' + stat.toUpperCase() + ' ≥ ' + minVal);
      }
    }
    if (ans.gate.eraMin) reasons.push('Requires year ≥ ' + ans.gate.eraMin);
    if (ans.gate.eraMax) reasons.push('Requires year ≤ ' + ans.gate.eraMax);
    return reasons;
  }

  // ---------- Question selection ----------
  // Pick the next relevant question for this project, or null if none apply right now.
  function pickQuestionFor(proj) {
    const candidates = MC_QUESTIONS.filter(q => {
      if (proj.questionsAsked.includes(q.id)) return false;
      if (!q.projectTypes.includes(proj.type)) return false;
      if (q.trigger !== 'any') {
        // Feature-triggered — must be a picked feature
        if (!proj.features.includes(q.trigger)) return false;
      }
      return true;
    });
    if (!candidates.length) return null;
    // Prefer feature-triggered questions (they're more specific)
    const featQs = candidates.filter(q => q.trigger !== 'any');
    const pool = featQs.length ? featQs : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ---------- Trigger cadence ----------
  // During development, fire a question every ~3-4 weeks if there are candidates left.
  // Phase 1: simple modulo check on elapsed weeks.
  function maybeFireMC(proj) {
    if (proj.phase !== 'development') return;
    if (proj.pendingDecision) return;
    const elapsed = window.tycoonProjects.absoluteWeek() - proj.phaseStartedAtWeek;
    // Fire at weeks 2, 6, 10, 14, ... (starting after 2wk warmup)
    if (elapsed < 2) return;
    if ((elapsed - 2) % 4 !== 0) return; // only on the boundary ticks
    const q = pickQuestionFor(proj);
    if (!q) return;
    proj.pendingDecision = {
      questionId: q.id,
      firedAtWeek: window.tycoonProjects.absoluteWeek(),
      text: q.text,
      answers: q.answers.map((a, i) => ({
        idx: i,
        text: a.text,
        effects: a.effects,
        available: isAnswerAvailable(a, proj),
        lockedReasons: isAnswerAvailable(a, proj) ? [] : lockedReasons(a)
      }))
    };
    proj.questionsAsked.push(q.id);
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('❓ Decision: ' + q.text);
    // Signal UI to show modal (Phase 1D wires this in)
    document.dispatchEvent(new CustomEvent('tycoon:mc-pending', { detail: { projectId: proj.id } }));
  }

  // Expose for 13-tycoon-projects.js to call
  window._tycoonMaybeFireMC = maybeFireMC;

  // ---------- Answer application ----------
  function answerMCQuestion(projId, answerIdx) {
    const proj = window.tycoonProjects.find(projId);
    if (!proj || !proj.pendingDecision) return null;
    const q = MC_BY_ID[proj.pendingDecision.questionId];
    if (!q) { proj.pendingDecision = null; return null; }
    const ans = q.answers[answerIdx];
    if (!ans) return null;
    if (!isAnswerAvailable(ans, proj)) return null;

    // Apply effects
    const e = ans.effects || {};
    if (e.tech)    proj.quality.tech    += e.tech;
    if (e.design)  proj.quality.design  += e.design;
    if (e.polish)  proj.quality.polish  += e.polish;
    if (e.bugs)    proj.bugs             = Math.max(0, proj.bugs + e.bugs);
    if (e.morale && S.founder) S.founder.morale = Math.max(0, Math.min(100, S.founder.morale + e.morale));

    // Record the decision
    proj.decisionsMade.push({
      questionId: q.id,
      answerIdx,
      answerText: ans.text,
      effects: e,
      week: window.tycoonProjects.absoluteWeek()
    });
    proj.pendingDecision = null;
    if (typeof markDirty === 'function') markDirty();
    if (typeof log === 'function') log('✓ Chose: ' + ans.text);
    document.dispatchEvent(new CustomEvent('tycoon:mc-answered', { detail: { projectId: proj.id } }));
    return { proj, answer: ans };
  }

  // ---------- Public API ----------
  window.tycoonMC = {
    QUESTIONS: MC_QUESTIONS,
    answer: answerMCQuestion,
    pickQuestionFor,
    isAnswerAvailable,
    lockedReasons
  };
  if (window.dbg) window.dbg.mc = window.tycoonMC;

  console.log('[tycoon-mc] MC module loaded. ' + MC_QUESTIONS.length + ' question templates registered.');
})();
