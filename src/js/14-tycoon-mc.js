// ========== TYCOON MC QUESTION SYSTEM (v2) ==========
// Multiple-choice decisions that fire during Development phase.
// v11.1: expanded from 10 → 100+ questions; contract projects now skip MC
// entirely (decisions only fire on own-IP projects).
// Answers can be gated by founder traits, stats, era, or research (future).
(function(){
  'use strict';

  // ---------- Question Catalog ----------
  // Each question has: id, trigger (feature id or 'any'), projectTypes, text, answers[]
  // Answer: { text, effects: { tech, design, polish, bugs, morale, duration }, gate: {traitRequired?, statMin?, eraMin?, eraMax?} }
  const MC_QUESTIONS = [
    // ===================== FEATURE-TRIGGERED =====================
    {
      id: 'mc_save_system',
      trigger: 'f_save', projectTypes: ['game','business'],
      text: 'How should saves work?',
      answers: [
        { text: 'Password codes (1980s-style; cheap)', effects: { design:-5, polish:-2, tech:-2 } },
        { text: 'Cassette / floppy save file',          effects: { polish:+5, tech:+2 } },
        { text: 'Sophisticated save slots + metadata',  effects: { polish:+10, design:+3, tech:+4, bugs:+2 }, gate: { statMin: { tech: 50 } } },
        { text: 'Cloud sync across devices',            effects: { polish:+14, tech:+12, bugs:+4 }, gate: { eraMin: 2008, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_music_direction',
      trigger: 'f_music', projectTypes: ['game'],
      text: 'What direction for the soundtrack?',
      answers: [
        { text: 'Silent — let gameplay speak',          effects: { design:-5, polish:+3 } },
        { text: 'Chiptune (era-authentic)',             effects: { design:+8, polish:+5 } },
        { text: 'Synthesized orchestral (ambitious)',   effects: { design:+14, polish:+2, bugs:+3 }, gate: { statMin: { design: 50 } } },
        { text: 'Licensed band soundtrack',             effects: { design:+18, polish:+6 }, gate: { eraMin: 1994, traitRequired: 'Networker' } },
      ]
    },
    {
      id: 'mc_mp_network',
      trigger: 'f_mp', projectTypes: ['game'],
      text: 'How should multiplayer connect?',
      answers: [
        { text: 'Shared keyboard / same machine',       effects: { design:+5, tech:-2 } },
        { text: 'Serial cable / null modem',            effects: { design:+10, tech:+8, bugs:+2 } },
        { text: 'Dialup / BBS lobby system',            effects: { design:+15, tech:+12, bugs:+5, polish:-3 }, gate: { statMin: { tech: 60 } } },
        { text: 'Dedicated master-server matchmaking',  effects: { design:+18, tech:+16, bugs:+6, polish:+4 }, gate: { eraMin: 2000, statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_diff_curve',
      trigger: 'f_diff', projectTypes: ['game'],
      text: 'Difficulty curve for the game?',
      answers: [
        { text: 'Nintendo-hard — reward mastery',       effects: { design:+8, polish:-2 } },
        { text: 'Gradual ramp — welcoming',             effects: { design:+6, polish:+4 } },
        { text: 'Adaptive — tracks player skill',       effects: { design:+12, tech:+6, bugs:+3 }, gate: { statMin: { tech: 50 } } },
        { text: 'Player-selectable difficulty',         effects: { design:+9, polish:+7, bugs:+2 } },
      ]
    },
    {
      id: 'mc_report_engine',
      trigger: 'f_reports', projectTypes: ['business'],
      text: 'Build the reporting engine how?',
      answers: [
        { text: 'Hardcoded layouts (fast, rigid)',      effects: { tech:+5, polish:+3 } },
        { text: 'Template system with variables',       effects: { tech:+10, design:+6 } },
        { text: 'Full scripting engine for users',      effects: { tech:+15, design:+10, bugs:+5 }, gate: { statMin: { tech: 70 } } },
        { text: 'Drag-and-drop pivot builder',          effects: { tech:+12, design:+14, polish:+6, bugs:+3 }, gate: { eraMin: 2005, statMin: { design: 50 } } },
      ]
    },
    // ----- More feature-triggered (game) -----
    {
      id: 'mc_story_branching', trigger: 'f_story', projectTypes: ['game'],
      text: 'How should the story branch?',
      answers: [
        { text: 'Linear — one canonical path',                  effects: { polish:+6, design:-2 } },
        { text: 'Two-ending fork at the final act',             effects: { design:+8, polish:+3, bugs:+1 } },
        { text: 'Web of choice-consequence throughout',         effects: { design:+16, tech:+6, polish:-2, bugs:+5 }, gate: { traitRequired: 'Visionary' } },
      ]
    },
    {
      id: 'mc_progression_chars', trigger: 'f_chars', projectTypes: ['game'],
      text: 'Character progression system?',
      answers: [
        { text: 'Fixed stats — skill is the player',            effects: { design:+5, polish:+4 } },
        { text: 'XP + levels with skill trees',                 effects: { design:+11, tech:+5, bugs:+2 } },
        { text: 'Open attribute system — any build',            effects: { design:+15, tech:+8, bugs:+4 }, gate: { statMin: { design: 60 } } },
      ]
    },
    {
      id: 'mc_level_design', trigger: 'f_levels', projectTypes: ['game'],
      text: 'Level design philosophy?',
      answers: [
        { text: 'Handcrafted linear levels',                    effects: { design:+10, polish:+6, tech:-1 } },
        { text: 'Open world — one massive map',                 effects: { design:+14, tech:+10, polish:-3, bugs:+5 }, gate: { statMin: { design: 60 } } },
        { text: 'Procedurally generated',                       effects: { design:+7, tech:+14, bugs:+6, polish:-2 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_ach_design', trigger: 'f_ach', projectTypes: ['game'],
      text: 'Achievements design?',
      answers: [
        { text: 'Skip — distracts from design',                 effects: { polish:+2, design:-2 } },
        { text: 'Straightforward completion milestones',        effects: { polish:+6, design:+3 } },
        { text: 'Secret/creative unlocks with lore',            effects: { polish:+10, design:+9, bugs:+1 }, gate: { traitRequired: 'Eccentric' } },
      ]
    },
    {
      id: 'mc_sound_fx', trigger: 'f_sound', projectTypes: ['game'],
      text: 'Sound effects production?',
      answers: [
        { text: 'Stock library samples',                        effects: { polish:+3, design:-2 } },
        { text: 'Record custom foley in-office',                effects: { polish:+9, design:+4 } },
        { text: 'Hire a professional sound designer',           effects: { polish:+14, design:+8, bugs:-1 }, gate: { statMin: { polish: 60 } } },
      ]
    },
    // ----- Feature-triggered (business) -----
    {
      id: 'mc_print_fidelity', trigger: 'f_print', projectTypes: ['business'],
      text: 'Print output fidelity?',
      answers: [
        { text: 'Dot-matrix monospace dump',                    effects: { polish:-3, tech:+1 } },
        { text: 'Laser-printer WYSIWYG layouts',                effects: { polish:+10, tech:+6 }, gate: { eraMin: 1985 } },
        { text: 'PDF export with fonts embedded',               effects: { polish:+14, tech:+10 }, gate: { eraMin: 1994, statMin: { tech: 50 } } },
      ]
    },
    {
      id: 'mc_macro_scripting', trigger: 'f_macro', projectTypes: ['business'],
      text: 'Macro / scripting language?',
      answers: [
        { text: 'Keystroke recorder only',                      effects: { tech:+3, polish:+4 } },
        { text: 'BASIC-style macro dialect',                    effects: { tech:+10, design:+5, bugs:+2 } },
        { text: 'Embed a real scripting runtime',               effects: { tech:+16, design:+8, bugs:+6 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_admin_perm', trigger: 'f_admin', projectTypes: ['business','saas','web'],
      text: 'Permissions model?',
      answers: [
        { text: 'All-or-nothing admin flag',                    effects: { tech:+2, polish:+2, bugs:-1 } },
        { text: 'Role-based access control',                    effects: { tech:+10, design:+6, polish:+4 } },
        { text: 'Attribute-based, policy-as-code',              effects: { tech:+15, design:+8, bugs:+4 }, gate: { eraMin: 2012, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_audit_log', trigger: 'f_audit', projectTypes: ['business','saas'],
      text: 'Audit logging detail?',
      answers: [
        { text: 'Only who logged in',                           effects: { tech:+2, polish:+1 } },
        { text: 'Every mutation with before/after',             effects: { tech:+9, polish:+6, bugs:+1 } },
        { text: 'Tamper-evident hash chain',                    effects: { tech:+14, design:+5, bugs:+3 }, gate: { eraMin: 2015, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_import_formats', trigger: 'f_import', projectTypes: ['business','saas'],
      text: 'Data import formats to support?',
      answers: [
        { text: 'CSV only — keep it simple',                    effects: { tech:+3, polish:+4 } },
        { text: 'CSV + Excel + tab-delimited',                  effects: { tech:+8, polish:+7, bugs:+1 } },
        { text: 'Parse anything — even user-uploaded PDFs',     effects: { tech:+14, polish:+8, bugs:+6 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    // ----- Feature-triggered (web/mobile/saas) -----
    {
      id: 'mc_auth_method', trigger: 'f_auth', projectTypes: ['web','saas','mobile'],
      text: 'Authentication method?',
      answers: [
        { text: 'Username + password',                          effects: { tech:+4, polish:+3 } },
        { text: 'Email magic link',                             effects: { tech:+8, design:+5, polish:+4 }, gate: { eraMin: 2010 } },
        { text: 'Passkeys / WebAuthn',                          effects: { tech:+14, polish:+10, design:+6 }, gate: { eraMin: 2019, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_api_shape', trigger: 'f_api', projectTypes: ['web','saas'],
      text: 'API shape?',
      answers: [
        { text: 'SOAP / XML-RPC',                               effects: { tech:+5, polish:-2, bugs:+1 }, gate: { eraMax: 2005 } },
        { text: 'REST with JSON',                               effects: { tech:+10, design:+6, polish:+4 }, gate: { eraMin: 2005 } },
        { text: 'GraphQL with typed schema',                    effects: { tech:+14, design:+9, bugs:+3 }, gate: { eraMin: 2015, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_analytics', trigger: 'f_analytics', projectTypes: ['web','saas','mobile'],
      text: 'Product analytics approach?',
      answers: [
        { text: 'Hit counter on the homepage',                  effects: { tech:+2, polish:+1 }, gate: { eraMax: 2002 } },
        { text: 'Google Analytics — free + easy',               effects: { tech:+6, design:+5, polish:+3 }, gate: { eraMin: 2005 } },
        { text: 'Self-hosted event pipeline',                   effects: { tech:+12, design:+7, bugs:+3 }, gate: { eraMin: 2015, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_iap', trigger: 'f_iap', projectTypes: ['mobile','game'],
      text: 'In-app purchases?',
      answers: [
        { text: 'No — feels exploitative',                      effects: { polish:+5, design:+4 }, gate: { traitRequired: 'Nihilist' } },
        { text: 'Cosmetics only — honest',                      effects: { polish:+8, design:+6 } },
        { text: 'Energy timers + pay-to-skip',                  effects: { polish:-4, design:-2, morale:-5 } },
      ]
    },
    {
      id: 'mc_push', trigger: 'f_push', projectTypes: ['mobile'],
      text: 'Push notification strategy?',
      answers: [
        { text: 'Never — respect user attention',               effects: { polish:+6, design:+3 } },
        { text: 'Essential updates only',                       effects: { polish:+4, design:+5, tech:+3 } },
        { text: 'Aggressive re-engagement pushes',              effects: { design:-3, polish:-5, morale:-5 } },
      ]
    },
    {
      id: 'mc_offline', trigger: 'f_offline', projectTypes: ['mobile','web'],
      text: 'Offline mode?',
      answers: [
        { text: 'Online-only — simpler',                        effects: { tech:+3, polish:+2 } },
        { text: 'Cache read-only data locally',                 effects: { tech:+9, polish:+7, bugs:+2 } },
        { text: 'Full offline-first CRDT sync',                 effects: { tech:+16, design:+8, polish:+6, bugs:+6 }, gate: { eraMin: 2018, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_onboard', trigger: 'f_onboard', projectTypes: ['saas','mobile','web'],
      text: 'User onboarding?',
      answers: [
        { text: 'Empty dashboard — users figure it out',        effects: { tech:+2, polish:-4 } },
        { text: 'Interactive walkthrough tooltips',             effects: { design:+8, polish:+8, bugs:+1 } },
        { text: 'Sample project preloaded in account',          effects: { design:+12, polish:+10, tech:+4 }, gate: { statMin: { design: 50 } } },
      ]
    },
    {
      id: 'mc_sso', trigger: 'f_sso', projectTypes: ['saas'],
      text: 'Enterprise SSO support?',
      answers: [
        { text: 'Skip — friction for small teams',              effects: { tech:+2, polish:+1 } },
        { text: 'OAuth with Google + Microsoft',                effects: { tech:+9, design:+5 }, gate: { eraMin: 2012 } },
        { text: 'Full SAML + SCIM provisioning',                effects: { tech:+15, polish:+7, bugs:+4 }, gate: { eraMin: 2015, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_responsive', trigger: 'f_responsive', projectTypes: ['web'],
      text: 'Responsive design approach?',
      answers: [
        { text: 'Desktop only — mobile traffic is tiny',        effects: { tech:+2, polish:+2 }, gate: { eraMax: 2009 } },
        { text: 'Separate m-dot mobile site',                   effects: { tech:+5, design:+4, bugs:+3 }, gate: { eraMin: 2005, eraMax: 2013 } },
        { text: 'Mobile-first responsive CSS',                  effects: { tech:+10, design:+10, polish:+6 }, gate: { eraMin: 2010 } },
      ]
    },
    {
      id: 'mc_email', trigger: 'f_email', projectTypes: ['saas','web'],
      text: 'Transactional email stack?',
      answers: [
        { text: 'sendmail on the app server',                   effects: { tech:+2, bugs:+3, polish:-1 }, gate: { eraMax: 2010 } },
        { text: 'SMTP provider (Mandrill / SendGrid)',          effects: { tech:+8, polish:+5 }, gate: { eraMin: 2010 } },
        { text: 'Full lifecycle platform with templates',       effects: { tech:+11, design:+8, polish:+7 }, gate: { eraMin: 2015, statMin: { tech: 50 } } },
      ]
    },
    {
      id: 'mc_pay_integration', trigger: 'f_pay', projectTypes: ['saas','web','mobile'],
      text: 'Payment integration?',
      answers: [
        { text: 'Accept cheques by mail',                       effects: { tech:-2, polish:-3 }, gate: { eraMax: 1998 } },
        { text: 'Drop in Stripe checkout',                      effects: { tech:+9, polish:+8, design:+5 }, gate: { eraMin: 2011 } },
        { text: 'Custom PCI-compliant tokenization',            effects: { tech:+15, polish:+6, bugs:+6 }, gate: { statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_search', trigger: 'f_search', projectTypes: ['web','saas','mobile','business'],
      text: 'Search implementation?',
      answers: [
        { text: 'SQL LIKE queries — good enough',               effects: { tech:+3, polish:-1 } },
        { text: 'Full-text index (Lucene/Postgres)',            effects: { tech:+10, polish:+7 } },
        { text: 'Elasticsearch / vector search',                effects: { tech:+15, polish:+10, bugs:+4 }, gate: { eraMin: 2014, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_social_features', trigger: 'f_social', projectTypes: ['web','mobile','game'],
      text: 'Social features scope?',
      answers: [
        { text: 'Just share-links to copy',                     effects: { polish:+4, design:+2 } },
        { text: 'Comments + likes + follow graph',              effects: { design:+10, tech:+8, polish:+4, bugs:+3 } },
        { text: 'Full in-app messaging + feed',                 effects: { design:+14, tech:+14, polish:+3, bugs:+6 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_ads', trigger: 'f_ads', projectTypes: ['web','mobile','game'],
      text: 'Ad strategy?',
      answers: [
        { text: 'No ads — user respect',                        effects: { polish:+8, design:+5 }, gate: { traitRequired: 'Nihilist' } },
        { text: 'Single tasteful banner',                       effects: { polish:+2 } },
        { text: 'Auto-play video interstitials',                effects: { polish:-7, design:-4, morale:-3 } },
      ]
    },
    {
      id: 'mc_camera', trigger: 'f_camera', projectTypes: ['game'],
      text: 'Camera perspective?',
      answers: [
        { text: 'Top-down / isometric',                         effects: { design:+6, tech:+3, polish:+4 } },
        { text: 'Third-person behind the back',                 effects: { design:+11, tech:+8, bugs:+3 } },
        { text: 'First-person — full immersion',                effects: { design:+14, tech:+10, polish:-2, bugs:+5 }, gate: { statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_help_system', trigger: 'f_help', projectTypes: ['business','saas'],
      text: 'In-app help?',
      answers: [
        { text: 'F1 opens a static HTML page',                  effects: { tech:+1, polish:-2 } },
        { text: 'Context tooltips on hover',                    effects: { design:+6, polish:+8, tech:+3 } },
        { text: 'Searchable help center + videos',              effects: { design:+10, polish:+12, tech:+4 }, gate: { statMin: { polish: 50 } } },
      ]
    },
    {
      id: 'mc_templates', trigger: 'f_templates', projectTypes: ['business','saas','web'],
      text: 'Starter templates?',
      answers: [
        { text: 'Blank slate — user-driven',                    effects: { polish:-2, tech:+1 } },
        { text: 'Five handcrafted starters',                    effects: { design:+8, polish:+7 } },
        { text: 'Crowdsourced template marketplace',            effects: { design:+12, tech:+8, bugs:+3 }, gate: { eraMin: 2010, statMin: { design: 60 } } },
      ]
    },
    {
      id: 'mc_team_collab', trigger: 'f_team', projectTypes: ['saas','web'],
      text: 'Team collaboration?',
      answers: [
        { text: 'Single-user only',                             effects: { polish:+2, tech:+1 } },
        { text: 'Shared docs with permissions',                 effects: { design:+9, tech:+8 } },
        { text: 'Realtime CRDT coediting (Google-docs)',        effects: { design:+14, tech:+15, polish:+6, bugs:+5 }, gate: { eraMin: 2015, statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_multi_tenancy', trigger: 'f_multi', projectTypes: ['saas'],
      text: 'Multi-tenant isolation?',
      answers: [
        { text: 'Shared DB, tenant_id column',                  effects: { tech:+6, polish:+3, bugs:+2 } },
        { text: 'Schema-per-tenant',                            effects: { tech:+10, polish:+5, bugs:+3 } },
        { text: 'Container-per-tenant (fort knox)',             effects: { tech:+15, polish:+7, bugs:+5 }, gate: { statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_memory', trigger: 'f_memory', projectTypes: ['game','business'],
      text: 'Memory management approach?',
      answers: [
        { text: 'Stack allocations only — no GC',               effects: { tech:+8, polish:+4, bugs:+2 } },
        { text: 'Reference counting',                           effects: { tech:+10, polish:+6, bugs:+3 } },
        { text: 'Garbage-collected runtime',                    effects: { tech:+6, polish:+3, bugs:-2 }, gate: { eraMin: 1995 } },
      ]
    },
    {
      id: 'mc_location', trigger: 'f_location', projectTypes: ['mobile'],
      text: 'Location services?',
      answers: [
        { text: 'No location — privacy first',                  effects: { polish:+6, design:+3 } },
        { text: 'City-level only',                              effects: { tech:+5, polish:+4, design:+3 } },
        { text: 'GPS precision with background tracking',       effects: { tech:+12, design:+7, morale:-2 }, gate: { eraMin: 2012 } },
      ]
    },
    // ----- AI-specific feature-triggered -----
    {
      id: 'mc_ai_inference', trigger: 'f_inference', projectTypes: ['ai'],
      text: 'Inference infrastructure?',
      answers: [
        { text: 'CPU inference — cheap at launch',              effects: { tech:+4, polish:-2 } },
        { text: 'GPU cluster in one region',                    effects: { tech:+10, polish:+5, bugs:+3 }, gate: { eraMin: 2015 } },
        { text: 'Edge inference + model distillation',          effects: { tech:+16, polish:+10, bugs:+4 }, gate: { eraMin: 2020, statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_ai_finetune', trigger: 'f_finetune', projectTypes: ['ai'],
      text: 'Fine-tuning strategy?',
      answers: [
        { text: 'Base model + clever prompts',                  effects: { tech:+6, polish:+5, design:+3 } },
        { text: 'LoRA adapters per customer',                   effects: { tech:+11, design:+6, bugs:+3 }, gate: { eraMin: 2022 } },
        { text: 'Full fine-tune + RLHF',                        effects: { tech:+18, design:+10, bugs:+6 }, gate: { eraMin: 2022, statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_ai_safety', trigger: 'f_safety', projectTypes: ['ai'],
      text: 'Safety / content moderation?',
      answers: [
        { text: 'Nothing — user problem',                       effects: { tech:+2, polish:-5, morale:-5 } },
        { text: 'Keyword blocklist',                            effects: { tech:+4, polish:+3 } },
        { text: 'Classifier + human review pipeline',           effects: { tech:+12, design:+8, polish:+10 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_ai_multimodal', trigger: 'f_multimodal', projectTypes: ['ai'],
      text: 'Multimodal inputs?',
      answers: [
        { text: 'Text only — focus',                            effects: { tech:+4, polish:+4 } },
        { text: 'Text + image (vision)',                        effects: { tech:+10, design:+8, bugs:+3 }, gate: { eraMin: 2022 } },
        { text: 'Text + image + audio + video',                 effects: { tech:+16, design:+12, polish:-2, bugs:+6 }, gate: { eraMin: 2023, statMin: { tech: 80 } } },
      ]
    },

    // ===================== ZEITGEIST / ANY-TRIGGER =====================
    // Game (broad)
    {
      id: 'mc_graphics_style', trigger: 'any', projectTypes: ['game'],
      text: 'Graphics style?',
      answers: [
        { text: 'Text / ASCII only',                    effects: { design:-5, tech:-3, polish:+3 } },
        { text: 'Simple 2D sprites',                    effects: { design:+6, polish:+3 } },
        { text: 'Detailed pixel art',                   effects: { design:+14, polish:+8, bugs:+2 }, gate: { statMin: { design: 50 } } },
        { text: 'Full 3D with lighting',                effects: { design:+17, tech:+12, polish:+5, bugs:+5 }, gate: { eraMin: 1996, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_ui_layout', trigger: 'any', projectTypes: ['business'],
      text: 'UI design for the business tool?',
      answers: [
        { text: 'Menu-driven (F-keys)',                 effects: { design:+3, polish:+3, tech:-2 } },
        { text: 'Ribbon-style toolbar',                 effects: { design:+8, polish:+6 }, gate: { eraMin: 2007 } },
        { text: 'Full mouse-driven WYSIWYG',            effects: { design:+12, tech:+8, polish:+4, bugs:+4 }, gate: { statMin: { tech: 50 } } },
        { text: 'Command palette (VS Code-style)',      effects: { design:+11, tech:+6, polish:+9 }, gate: { eraMin: 2018, traitRequired: 'Eccentric' } },
      ]
    },
    {
      id: 'mc_scope_pressure', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'The team feels stretched. Your call?',
      answers: [
        { text: 'Cut a feature to stay on time',        effects: { design:-5, polish:+8, bugs:-3 } },
        { text: 'Push through — no cuts',               effects: { design:+3, polish:-3, bugs:+2 } },
        { text: 'Crunch until we ship it all',          effects: { design:+8, polish:+3, bugs:+6, morale:-10 } },
        { text: 'Hire consultants short-term',          effects: { design:+6, polish:+4, bugs:+1 }, gate: { traitRequired: 'Networker' } },
      ]
    },
    {
      id: 'mc_testing_approach', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Testing strategy?',
      answers: [
        { text: 'Play it a lot ourselves',              effects: { polish:+3, bugs:-2 } },
        { text: 'Friends and family beta',              effects: { polish:+7, design:+3, bugs:-5 } },
        { text: 'Formal QA pass with checklist',        effects: { polish:+12, bugs:-10 }, gate: { statMin: { polish: 50 } } },
        { text: 'Automated test suite + CI',            effects: { tech:+10, polish:+8, bugs:-12 }, gate: { eraMin: 2010, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_manual', trigger: 'any', projectTypes: ['game','business'],
      text: 'What about the user manual?',
      answers: [
        { text: 'README.txt is enough',                 effects: { polish:-3, design:-2 } },
        { text: 'Printed manual with screenshots',      effects: { polish:+8, design:+4 } },
        { text: 'Full illustrated game world lore',     effects: { polish:+14, design:+10 }, gate: { traitRequired: 'Visionary' } },
        { text: 'Video tutorials on YouTube',           effects: { polish:+10, design:+6 }, gate: { eraMin: 2008 } },
      ]
    },
    // --- More game 'any' ---
    {
      id: 'mc_game_tone', trigger: 'any', projectTypes: ['game'],
      text: 'Overall tone of the game?',
      answers: [
        { text: 'Light and campy',                              effects: { design:+7, polish:+4 } },
        { text: 'Gritty and cinematic',                         effects: { design:+11, tech:+4, polish:+2, bugs:+1 } },
        { text: 'Surreal and experimental',                     effects: { design:+14, polish:-2 }, gate: { traitRequired: 'Eccentric' } },
      ]
    },
    {
      id: 'mc_tutorial_style', trigger: 'any', projectTypes: ['game'],
      text: 'How does the player learn to play?',
      answers: [
        { text: 'Manual in the box — go read',                  effects: { design:-2, polish:-3 } },
        { text: 'Opening tutorial level',                       effects: { design:+8, polish:+8 } },
        { text: 'Show-don\u2019t-tell via level design',        effects: { design:+14, polish:+10 }, gate: { traitRequired: 'Perfectionist' } },
      ]
    },
    {
      id: 'mc_boss_design', trigger: 'any', projectTypes: ['game'],
      text: 'Boss fight philosophy?',
      answers: [
        { text: 'No bosses — it\u2019s a vibe game',            effects: { design:+4, polish:+2 } },
        { text: 'Pattern-memorization bosses',                  effects: { design:+10, polish:+6, bugs:+2 } },
        { text: 'Emergent boss behaviors from ecosystem',       effects: { design:+16, tech:+10, bugs:+5 }, gate: { statMin: { design: 70 } } },
      ]
    },
    {
      id: 'mc_enemy_ai', trigger: 'any', projectTypes: ['game'],
      text: 'Enemy AI approach?',
      answers: [
        { text: 'Patrol patterns on fixed paths',               effects: { tech:+4, design:+3 } },
        { text: 'Finite-state machines with alertness',         effects: { tech:+10, design:+7, bugs:+2 } },
        { text: 'Utility-based AI with behavior trees',         effects: { tech:+15, design:+10, bugs:+4 }, gate: { statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_voice_acting', trigger: 'any', projectTypes: ['game'],
      text: 'Voice acting?',
      answers: [
        { text: 'Text only — player reads',                     effects: { polish:-1, tech:+1 } },
        { text: 'Programmer-voiced placeholders shipped',       effects: { polish:-3, design:-2, morale:-3 } },
        { text: 'Full voiced cast with SAG talent',             effects: { polish:+13, design:+9 }, gate: { eraMin: 1995, statMin: { polish: 50 } } },
      ]
    },
    {
      id: 'mc_cutscenes', trigger: 'any', projectTypes: ['game'],
      text: 'Cutscene style?',
      answers: [
        { text: 'Text-only with portraits',                     effects: { polish:+2, design:+2 } },
        { text: 'Pre-rendered CG',                              effects: { polish:+11, design:+7 }, gate: { eraMin: 1993 } },
        { text: 'In-engine scripted with mocap',                effects: { polish:+14, tech:+10, bugs:+4 }, gate: { eraMin: 2000, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_death_system', trigger: 'any', projectTypes: ['game'],
      text: 'Death / failure design?',
      answers: [
        { text: 'Instant game over — respect the player\u2019s time', effects: { design:+5, polish:-1 } },
        { text: 'Checkpoints every 5 minutes',                  effects: { design:+8, polish:+7 } },
        { text: 'Roguelike permadeath + meta progression',      effects: { design:+14, tech:+6, bugs:+3 }, gate: { statMin: { design: 60 } } },
      ]
    },
    {
      id: 'mc_replayability', trigger: 'any', projectTypes: ['game'],
      text: 'Replayability hook?',
      answers: [
        { text: 'None — ship a complete story',                 effects: { design:+4, polish:+6 } },
        { text: 'New Game+ with unlocks',                       effects: { design:+10, tech:+5, polish:+3 } },
        { text: 'Daily challenges with leaderboards',           effects: { design:+12, tech:+9, polish:+4 }, gate: { eraMin: 2007 } },
      ]
    },
    {
      id: 'mc_cheat_codes', trigger: 'any', projectTypes: ['game'],
      text: 'Cheat codes?',
      answers: [
        { text: 'No cheats — integrity matters',                effects: { design:+4, polish:+2 }, gate: { traitRequired: 'Perfectionist' } },
        { text: 'Classic Konami-style easter eggs',             effects: { design:+8, polish:+4 } },
        { text: 'Full developer console for players',           effects: { design:+10, tech:+8, bugs:+3 }, gate: { traitRequired: 'Eccentric' } },
      ]
    },
    {
      id: 'mc_localization', trigger: 'any', projectTypes: ['game','business','web','mobile','saas'],
      text: 'Localization scope?',
      answers: [
        { text: 'English only',                                 effects: { tech:+2, polish:+1 } },
        { text: 'Five major European languages',                effects: { tech:+6, design:+5, polish:+4 } },
        { text: 'Full 30+ language support with RTL',           effects: { tech:+14, design:+8, polish:+7, bugs:+4 }, gate: { statMin: { polish: 60 } } },
      ]
    },
    {
      id: 'mc_accessibility', trigger: 'any', projectTypes: ['game','web','mobile','saas'],
      text: 'Accessibility features?',
      answers: [
        { text: 'Skip — low priority',                          effects: { tech:+1, polish:-4, morale:-2 } },
        { text: 'Basic: captions + color-blind mode',           effects: { design:+7, polish:+8 } },
        { text: 'Full WCAG AAA + controller remapping',         effects: { design:+13, polish:+14, tech:+4 }, gate: { traitRequired: 'Mentor' } },
      ]
    },
    {
      id: 'mc_mod_support', trigger: 'any', projectTypes: ['game'],
      text: 'Mod support?',
      answers: [
        { text: 'Closed — no mods',                             effects: { tech:+2, polish:+1 } },
        { text: 'File-format documentation',                    effects: { tech:+6, design:+4 } },
        { text: 'Official mod SDK + Workshop integration',      effects: { tech:+12, design:+11, bugs:+3 }, gate: { eraMin: 2005, statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_art_direction', trigger: 'any', projectTypes: ['game'],
      text: 'Art direction?',
      answers: [
        { text: 'Photorealistic push',                          effects: { design:+10, tech:+8, bugs:+3 }, gate: { eraMin: 2004 } },
        { text: 'Bold stylized — ages well',                    effects: { design:+14, polish:+8 } },
        { text: 'Hand-drawn 2D animation',                      effects: { design:+12, polish:+12 }, gate: { statMin: { design: 60 } } },
      ]
    },
    {
      id: 'mc_microtx_stance', trigger: 'any', projectTypes: ['game','mobile'],
      text: 'Monetization stance (beyond purchase)?',
      answers: [
        { text: 'None — what you buy is what you get',          effects: { design:+6, polish:+7 }, gate: { traitRequired: 'Nihilist' } },
        { text: 'Expansion packs only',                         effects: { design:+8, polish:+5 } },
        { text: 'Live-service season pass',                     effects: { tech:+8, polish:+3, morale:-3 }, gate: { eraMin: 2013 } },
      ]
    },
    {
      id: 'mc_physics', trigger: 'any', projectTypes: ['game'],
      text: 'Physics engine?',
      answers: [
        { text: 'No physics — tile-based movement',             effects: { tech:+3, polish:+4 } },
        { text: 'License Havok / existing engine',              effects: { tech:+10, polish:+6 }, gate: { eraMin: 2000 } },
        { text: 'Roll our own with verlet integration',         effects: { tech:+15, bugs:+6, polish:-1 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    // --- Business 'any' ---
    {
      id: 'mc_biz_platform', trigger: 'any', projectTypes: ['business'],
      text: 'Primary platform target?',
      answers: [
        { text: 'DOS / command-line only',                      effects: { tech:+4, polish:-2 }, gate: { eraMax: 1993 } },
        { text: 'Windows and Mac via cross-compile',            effects: { tech:+11, design:+5, bugs:+3 } },
        { text: 'Ship on Linux too — niche enterprise',         effects: { tech:+9, polish:+3, morale:+2 }, gate: { traitRequired: 'Recluse' } },
      ]
    },
    {
      id: 'mc_biz_network', trigger: 'any', projectTypes: ['business'],
      text: 'Network support?',
      answers: [
        { text: 'Single-user, local files',                     effects: { tech:+3, polish:+4 } },
        { text: 'LAN file-sharing with record locks',           effects: { tech:+10, bugs:+3 } },
        { text: 'Client-server with a daemon',                  effects: { tech:+15, polish:+6, bugs:+5 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_biz_backup', trigger: 'any', projectTypes: ['business'],
      text: 'Built-in backup strategy?',
      answers: [
        { text: 'User\u2019s problem',                          effects: { tech:+1 } },
        { text: 'Daily copy to a separate file',                effects: { tech:+5, polish:+5 } },
        { text: 'Full versioned history with undo',             effects: { tech:+12, design:+7, bugs:+4 }, gate: { statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_biz_db', trigger: 'any', projectTypes: ['business','saas'],
      text: 'Database engine?',
      answers: [
        { text: 'Flat files with indexes',                      effects: { tech:+4, polish:+1, bugs:+2 } },
        { text: 'Embedded SQL (SQLite-style)',                  effects: { tech:+9, polish:+6 }, gate: { eraMin: 1998 } },
        { text: 'Full client-server (Oracle / Postgres)',       effects: { tech:+14, polish:+5, bugs:+3 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_biz_shortcuts', trigger: 'any', projectTypes: ['business','saas'],
      text: 'Keyboard shortcut philosophy?',
      answers: [
        { text: 'Menu-driven — no shortcuts',                   effects: { design:+2, polish:+1 } },
        { text: 'Discoverable accelerators on every menu',      effects: { design:+8, polish:+10 } },
        { text: 'Full vim / Emacs-style power-user mode',       effects: { design:+6, polish:+12 }, gate: { traitRequired: 'Eccentric' } },
      ]
    },
    {
      id: 'mc_biz_updates', trigger: 'any', projectTypes: ['business','saas'],
      text: 'Update delivery?',
      answers: [
        { text: 'Ship on disk — major yearly release',          effects: { polish:+3, tech:-1 }, gate: { eraMax: 2003 } },
        { text: 'Patches via installer',                        effects: { tech:+7, polish:+4 }, gate: { eraMin: 1995 } },
        { text: 'Auto-update with rolling releases',            effects: { tech:+12, polish:+8, bugs:+3 }, gate: { eraMin: 2008 } },
      ]
    },
    // --- Web 'any' ---
    {
      id: 'mc_web_frontend', trigger: 'any', projectTypes: ['web'],
      text: 'Frontend stack?',
      answers: [
        { text: 'Plain HTML + CGI forms',                       effects: { tech:+3, polish:-1 }, gate: { eraMax: 2003 } },
        { text: 'jQuery + server-rendered templates',           effects: { tech:+8, design:+5 }, gate: { eraMin: 2006, eraMax: 2015 } },
        { text: 'Modern SPA (React / Vue)',                     effects: { tech:+12, design:+10, polish:+5, bugs:+3 }, gate: { eraMin: 2014 } },
      ]
    },
    {
      id: 'mc_web_ssr', trigger: 'any', projectTypes: ['web'],
      text: 'Rendering strategy?',
      answers: [
        { text: 'Classic server-rendered pages',                effects: { tech:+6, polish:+3 } },
        { text: 'Client-rendered SPA',                          effects: { tech:+9, design:+5, polish:-2, bugs:+2 }, gate: { eraMin: 2013 } },
        { text: 'Isomorphic SSR with hydration',                effects: { tech:+14, design:+9, polish:+6, bugs:+4 }, gate: { eraMin: 2016, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_web_cdn', trigger: 'any', projectTypes: ['web','saas'],
      text: 'Content delivery?',
      answers: [
        { text: 'One server, one region',                       effects: { tech:+3, polish:+1 } },
        { text: 'CloudFront / Cloudflare CDN',                  effects: { tech:+9, polish:+8 }, gate: { eraMin: 2009 } },
        { text: 'Edge workers with per-POP compute',            effects: { tech:+14, polish:+10, bugs:+3 }, gate: { eraMin: 2018, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_web_seo', trigger: 'any', projectTypes: ['web'],
      text: 'SEO strategy?',
      answers: [
        { text: 'Ignore — word of mouth',                       effects: { design:+2 } },
        { text: 'Semantic HTML + sitemaps',                     effects: { tech:+5, design:+4, polish:+4 } },
        { text: 'Full content calendar with AI-generated cross-links', effects: { tech:+7, design:+3, morale:-3 }, gate: { eraMin: 2022 } },
      ]
    },
    {
      id: 'mc_web_moderation', trigger: 'any', projectTypes: ['web','mobile','saas'],
      text: 'Content moderation?',
      answers: [
        { text: 'Community self-polices',                       effects: { tech:+2, morale:+3 } },
        { text: 'Flagging queue with small moderator team',     effects: { tech:+6, design:+5, polish:+4 } },
        { text: 'ML classifier + human escalation tiers',       effects: { tech:+13, design:+9, polish:+5 }, gate: { eraMin: 2015, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_web_abtest', trigger: 'any', projectTypes: ['web','saas','mobile'],
      text: 'Experimentation infrastructure?',
      answers: [
        { text: 'Ship and measure with analytics',              effects: { tech:+3, polish:+2 } },
        { text: 'Feature flags with a/b toggles',               effects: { tech:+9, design:+5, polish:+4 }, gate: { eraMin: 2013 } },
        { text: 'Full stat-sig platform with guardrail metrics', effects: { tech:+13, polish:+6 }, gate: { eraMin: 2018, statMin: { tech: 70 } } },
      ]
    },
    // --- Mobile 'any' ---
    {
      id: 'mc_mobile_native', trigger: 'any', projectTypes: ['mobile'],
      text: 'Native or cross-platform?',
      answers: [
        { text: 'Pure native per platform',                     effects: { tech:+12, polish:+10, bugs:+2 } },
        { text: 'React Native / Flutter',                       effects: { tech:+10, design:+8, polish:+4, bugs:+4 }, gate: { eraMin: 2015 } },
        { text: 'Mobile web wrapped in WebView',                effects: { tech:+4, polish:-3, design:-2 } },
      ]
    },
    {
      id: 'mc_mobile_bundle', trigger: 'any', projectTypes: ['mobile'],
      text: 'App bundle size approach?',
      answers: [
        { text: 'Ship everything upfront',                      effects: { polish:+3, bugs:-1 } },
        { text: 'Download assets on demand',                    effects: { tech:+9, polish:+6, bugs:+3 } },
        { text: 'Streaming on-demand resources',                effects: { tech:+13, design:+6, polish:+8 }, gate: { eraMin: 2018, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_mobile_haptics', trigger: 'any', projectTypes: ['mobile','game'],
      text: 'Haptic feedback design?',
      answers: [
        { text: 'None',                                         effects: { polish:-1, tech:+1 } },
        { text: 'Basic buzz on notifications',                  effects: { polish:+4, design:+2 } },
        { text: 'Nuanced haptic vocabulary (iPhone Taptic)',    effects: { polish:+11, design:+9 }, gate: { eraMin: 2015, statMin: { polish: 60 } } },
      ]
    },
    {
      id: 'mc_mobile_darkmode', trigger: 'any', projectTypes: ['mobile','web','saas'],
      text: 'Dark mode support?',
      answers: [
        { text: 'Light only — simpler',                         effects: { polish:+1, design:-2 } },
        { text: 'Manual toggle in settings',                    effects: { design:+7, polish:+7 }, gate: { eraMin: 2017 } },
        { text: 'Follow system preference + per-screen tweaks', effects: { design:+11, polish:+11 }, gate: { eraMin: 2019, statMin: { design: 50 } } },
      ]
    },
    {
      id: 'mc_mobile_privacy', trigger: 'any', projectTypes: ['mobile','web','saas'],
      text: 'Privacy posture?',
      answers: [
        { text: 'Collect everything — it\u2019s fuel',          effects: { tech:+5, morale:-5, polish:-3 } },
        { text: 'Industry-standard retention',                  effects: { tech:+4, polish:+3 } },
        { text: 'Zero-knowledge architecture',                  effects: { tech:+14, polish:+10, bugs:+4 }, gate: { eraMin: 2018, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_mobile_app_store', trigger: 'any', projectTypes: ['mobile'],
      text: 'App Store review risk?',
      answers: [
        { text: 'Play it safe — conservative',                  effects: { polish:+3, design:-2 } },
        { text: 'Push a bit — hope for the best',               effects: { design:+7, polish:+2, bugs:+1 } },
        { text: 'Full sideload option + beg for exceptions',    effects: { design:+10, morale:-3 }, gate: { traitRequired: 'Contrarian' } },
      ]
    },
    // --- SaaS 'any' ---
    {
      id: 'mc_saas_pricing', trigger: 'any', projectTypes: ['saas'],
      text: 'Pricing model?',
      answers: [
        { text: 'Flat monthly per seat',                        effects: { tech:+2, design:+3, polish:+5 } },
        { text: 'Metered usage billing',                        effects: { tech:+10, design:+6, bugs:+3 } },
        { text: 'Freemium with paid tiers',                     effects: { tech:+7, design:+9, polish:+3 }, gate: { eraMin: 2013 } },
      ]
    },
    {
      id: 'mc_saas_trial', trigger: 'any', projectTypes: ['saas'],
      text: 'Trial model?',
      answers: [
        { text: 'No trial — buy to try',                        effects: { tech:+1, design:-2 } },
        { text: '14-day free trial, card required',             effects: { tech:+4, design:+5 } },
        { text: 'Free tier forever',                            effects: { tech:+3, design:+10, polish:+3, morale:+3 }, gate: { traitRequired: 'Mentor' } },
      ]
    },
    {
      id: 'mc_saas_support', trigger: 'any', projectTypes: ['saas','web'],
      text: 'Customer support channel?',
      answers: [
        { text: 'Email only',                                   effects: { tech:+1, polish:+2 } },
        { text: 'Intercom-style live chat',                     effects: { design:+8, polish:+9 }, gate: { eraMin: 2013 } },
        { text: 'Full ticketing + SLA dashboards',              effects: { tech:+12, polish:+7, bugs:+2 }, gate: { statMin: { tech: 60 } } },
      ]
    },
    {
      id: 'mc_saas_integrations', trigger: 'any', projectTypes: ['saas'],
      text: 'Integration ecosystem?',
      answers: [
        { text: 'None — focus on core',                         effects: { tech:+2, polish:+4 } },
        { text: 'Webhooks + public API docs',                   effects: { tech:+9, design:+6, polish:+3 } },
        { text: 'Full marketplace with third-party apps',       effects: { tech:+14, design:+11, bugs:+5 }, gate: { eraMin: 2015, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_saas_churn', trigger: 'any', projectTypes: ['saas'],
      text: 'Churn prevention?',
      answers: [
        { text: 'Best product wins — no gimmicks',              effects: { polish:+4, design:+3 } },
        { text: 'Usage dashboards nudging value',               effects: { tech:+8, design:+7, polish:+4 } },
        { text: 'Aggressive retention specialists + discounts', effects: { design:+3, polish:-2, morale:-3 } },
      ]
    },
    // --- AI 'any' ---
    {
      id: 'mc_ai_model_size', trigger: 'any', projectTypes: ['ai'],
      text: 'Model size philosophy?',
      answers: [
        { text: 'Small models — cheap, fast',                   effects: { tech:+8, polish:+6 } },
        { text: 'Mid-size balanced',                            effects: { tech:+11, design:+6, polish:+4 } },
        { text: 'Frontier-scale — best quality at any cost',    effects: { tech:+15, design:+10, bugs:+4, morale:-2 }, gate: { eraMin: 2022, statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_ai_data_source', trigger: 'any', projectTypes: ['ai'],
      text: 'Training data sourcing?',
      answers: [
        { text: 'Licensed datasets only',                       effects: { tech:+5, polish:+8, morale:+3 } },
        { text: 'Scrape the web — fair use',                    effects: { tech:+10, design:+5, morale:-2 } },
        { text: 'User data with opt-in',                        effects: { tech:+12, design:+8, polish:+6 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_ai_hallucination', trigger: 'any', projectTypes: ['ai'],
      text: 'Hallucination mitigation?',
      answers: [
        { text: 'Disclaimer in footer',                         effects: { tech:+2, polish:-3 } },
        { text: 'Retrieval-augmented generation',               effects: { tech:+12, design:+6, polish:+7, bugs:+2 }, gate: { eraMin: 2022 } },
        { text: 'Confidence score + refusal behavior',          effects: { tech:+14, design:+9, polish:+8 }, gate: { eraMin: 2023, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_ai_eval', trigger: 'any', projectTypes: ['ai'],
      text: 'Quality evaluation?',
      answers: [
        { text: 'Vibe-check by the team',                       effects: { tech:+3, polish:-2, bugs:+3 } },
        { text: 'Golden test set with regression',              effects: { tech:+10, polish:+7, bugs:-3 } },
        { text: 'Automated eval harness + LLM-as-judge',        effects: { tech:+15, design:+6, polish:+8 }, gate: { eraMin: 2023, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_ai_opensource', trigger: 'any', projectTypes: ['ai'],
      text: 'Model openness?',
      answers: [
        { text: 'Proprietary black box',                        effects: { tech:+6, polish:+4 } },
        { text: 'Open weights, closed data',                    effects: { tech:+10, design:+7, morale:+3 } },
        { text: 'Fully open — weights + data + training code',  effects: { tech:+8, design:+11, polish:-1, morale:+5 }, gate: { traitRequired: 'Nihilist' } },
      ]
    },
    // --- Cross-cutting 'any' for all types ---
    {
      id: 'mc_crunch_decision', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Schedule slipping — crunch the team?',
      answers: [
        { text: 'No — we ship when it\u2019s ready',            effects: { polish:+4, morale:+5 }, gate: { traitRequired: 'Mentor' } },
        { text: 'One 60-hour week',                             effects: { design:+4, polish:+3, morale:-4 } },
        { text: 'Whatever it takes — ship it',                  effects: { design:+7, bugs:+5, morale:-12 }, gate: { traitRequired: 'Workaholic' } },
      ]
    },
    {
      id: 'mc_code_review', trigger: 'any', projectTypes: ['business','web','mobile','saas','ai'],
      text: 'Code review practice?',
      answers: [
        { text: 'Skip — velocity matters',                      effects: { tech:+4, bugs:+5 } },
        { text: 'Two reviewers required',                       effects: { tech:+9, polish:+5, bugs:-4 } },
        { text: 'Pair programming exclusively',                 effects: { tech:+12, design:+7, bugs:-7, morale:+2 }, gate: { traitRequired: 'Mentor' } },
      ]
    },
    {
      id: 'mc_documentation', trigger: 'any', projectTypes: ['business','web','mobile','saas','ai'],
      text: 'Internal documentation?',
      answers: [
        { text: 'Code is self-documenting',                     effects: { tech:+2, bugs:+3 } },
        { text: 'README + inline comments',                     effects: { tech:+6, polish:+4 } },
        { text: 'Full design docs per feature',                 effects: { tech:+11, design:+6, polish:+6 }, gate: { traitRequired: 'Perfectionist' } },
      ]
    },
    {
      id: 'mc_security_review', trigger: 'any', projectTypes: ['business','web','saas','ai'],
      text: 'Security review?',
      answers: [
        { text: 'None — pentest after launch',                  effects: { tech:+2, bugs:+4 } },
        { text: 'Checklist-based self-assessment',              effects: { tech:+7, polish:+5, bugs:-2 } },
        { text: 'Third-party audit + bug bounty',               effects: { tech:+14, polish:+8, bugs:-6 }, gate: { eraMin: 2010, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_logging', trigger: 'any', projectTypes: ['business','web','mobile','saas','ai'],
      text: 'Observability / logging?',
      answers: [
        { text: 'printf() to stderr',                           effects: { tech:+3, bugs:+3 } },
        { text: 'Structured logs shipped to a log server',      effects: { tech:+9, polish:+5, bugs:-2 } },
        { text: 'OpenTelemetry + distributed tracing',          effects: { tech:+14, polish:+7, bugs:-4 }, gate: { eraMin: 2019, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_hire_contractor', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Need a specialist we don\u2019t have. Action?',
      answers: [
        { text: 'Learn on the job',                             effects: { tech:+3, design:+3, morale:+2 } },
        { text: 'Hire a contractor',                            effects: { tech:+8, design:+6, polish:+4 }, gate: { traitRequired: 'Networker' } },
        { text: 'Ship without that feature',                    effects: { design:-5, polish:+5 } },
      ]
    },
    {
      id: 'mc_press_strategy', trigger: 'any', projectTypes: ['game','mobile','saas'],
      text: 'Pre-launch press strategy?',
      answers: [
        { text: 'Stealth launch — let quality speak',           effects: { design:+2 }, gate: { traitRequired: 'Recluse' } },
        { text: 'Curated reviewer outreach',                    effects: { design:+9, polish:+6 } },
        { text: 'Hype campaign with trailers + influencers',    effects: { design:+14, polish:+4, morale:-2 }, gate: { traitRequired: 'Showman' } },
      ]
    },
    {
      id: 'mc_launch_timing', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Launch timing debate?',
      answers: [
        { text: 'Ship early — iterate on live',                 effects: { design:+5, bugs:+4, morale:+2 } },
        { text: 'Ship when done',                               effects: { polish:+8, bugs:-4 }, gate: { traitRequired: 'Perfectionist' } },
        { text: 'Follow a competitor\u2019s date',              effects: { design:+9, polish:-2, morale:-3 } },
      ]
    },
    {
      id: 'mc_brand_identity', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Brand identity polish?',
      answers: [
        { text: 'Comic Sans for now',                           effects: { polish:-5, design:-3, morale:+3 }, gate: { traitRequired: 'Contrarian' } },
        { text: 'Commission a logo + color palette',            effects: { design:+8, polish:+7 } },
        { text: 'Full design system with motion rules',         effects: { design:+14, polish:+12 }, gate: { statMin: { design: 70 } } },
      ]
    },
    {
      id: 'mc_data_migration', trigger: 'any', projectTypes: ['business','web','saas'],
      text: 'Existing-user data migration path?',
      answers: [
        { text: 'Start fresh — no migration',                   effects: { tech:+3, morale:-3 } },
        { text: 'One-shot import tool',                         effects: { tech:+8, design:+5, bugs:+3 } },
        { text: 'Dual-write + gradual cutover',                 effects: { tech:+13, polish:+6, bugs:+4 }, gate: { statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_open_source', trigger: 'any', projectTypes: ['business','web','saas','ai'],
      text: 'Open-source some components?',
      answers: [
        { text: 'Keep everything private',                      effects: { tech:+3, polish:+2 } },
        { text: 'Release SDKs + helper libs',                   effects: { tech:+8, design:+6, morale:+3 } },
        { text: 'Open core — the whole platform',               effects: { tech:+10, design:+11, morale:+5 }, gate: { traitRequired: 'Visionary' } },
      ]
    },
    {
      id: 'mc_release_cadence', trigger: 'any', projectTypes: ['business','web','mobile','saas','ai'],
      text: 'Release cadence?',
      answers: [
        { text: 'Big annual release',                           effects: { polish:+5, design:+3 } },
        { text: 'Quarterly features + monthly patches',         effects: { tech:+8, polish:+6, bugs:-2 } },
        { text: 'Continuous deployment to production',          effects: { tech:+12, polish:+5, bugs:+3 }, gate: { eraMin: 2015, statMin: { tech: 70 } } },
      ]
    },
    {
      id: 'mc_easter_egg', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Easter egg?',
      answers: [
        { text: 'None — professional product',                  effects: { polish:+2, morale:-2 } },
        { text: 'A small one for the dev team',                 effects: { polish:+5, design:+4, morale:+4 } },
        { text: 'Elaborate multi-stage ARG',                    effects: { design:+12, polish:+8, morale:+6 }, gate: { traitRequired: 'Eccentric' } },
      ]
    },
    {
      id: 'mc_moral_shortcut', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Ethically gray shortcut is available. Take it?',
      answers: [
        { text: 'No — integrity first',                         effects: { polish:+4, morale:+5 } },
        { text: 'Take it quietly and move on',                  effects: { design:+4, polish:+3, morale:-3 } },
        { text: 'Take it and brag about it',                    effects: { design:+7, polish:+2, morale:-6 }, gate: { traitRequired: 'Contrarian' } },
      ]
    },
    {
      id: 'mc_feedback_loop', trigger: 'any', projectTypes: ['web','mobile','saas','game'],
      text: 'User feedback loop?',
      answers: [
        { text: 'None — our vision leads',                      effects: { design:+3, morale:-2 } },
        { text: 'In-app feedback widget',                       effects: { design:+7, polish:+6 } },
        { text: 'Monthly user research interviews',             effects: { design:+13, polish:+9 }, gate: { statMin: { design: 60 } } },
      ]
    },
    {
      id: 'mc_team_ritual', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'Team-health ritual?',
      answers: [
        { text: 'Daily standups only',                          effects: { tech:+3, morale:+1 } },
        { text: 'Friday demos + retros',                        effects: { design:+5, polish:+5, morale:+5 } },
        { text: 'Quarterly offsite + 20% time',                 effects: { design:+9, polish:+7, morale:+10 }, gate: { traitRequired: 'Mentor' } },
      ]
    },
    {
      id: 'mc_naming', trigger: 'any', projectTypes: ['business','web','mobile','saas','ai'],
      text: 'Product naming?',
      answers: [
        { text: 'Descriptive — TaskMaster Pro',                 effects: { polish:+3, design:+1 } },
        { text: 'Invented word — Notion, Figma',                effects: { design:+10, polish:+4 } },
        { text: 'Animal name — Slack, Basecamp',                effects: { design:+8, polish:+5, morale:+2 } },
      ]
    },
    {
      id: 'mc_uptime_sla', trigger: 'any', projectTypes: ['saas','web','ai'],
      text: 'Uptime commitment?',
      answers: [
        { text: 'Best effort — no SLA',                         effects: { tech:+3, polish:+1 } },
        { text: '99.9% with status page',                       effects: { tech:+10, polish:+7, bugs:+1 } },
        { text: '99.99% multi-region active-active',            effects: { tech:+16, polish:+9, bugs:+6 }, gate: { eraMin: 2015, statMin: { tech: 80 } } },
      ]
    },
    {
      id: 'mc_scaling_plan', trigger: 'any', projectTypes: ['web','saas','mobile','ai'],
      text: 'When to scale?',
      answers: [
        { text: 'Wait until it breaks',                         effects: { tech:+2, bugs:+4 } },
        { text: 'Plan for 10× current load',                    effects: { tech:+9, polish:+6, bugs:-1 } },
        { text: 'Over-engineer for 1000× from day one',         effects: { tech:+13, polish:+3, morale:-3 }, gate: { traitRequired: 'Perfectionist' } },
      ]
    },
    {
      id: 'mc_tech_debt', trigger: 'any', projectTypes: ['business','web','mobile','saas','ai'],
      text: 'Technical debt policy?',
      answers: [
        { text: 'Ignore — always ship features',                effects: { design:+3, bugs:+5 } },
        { text: '20% time on cleanup each sprint',              effects: { tech:+8, polish:+6, bugs:-3 } },
        { text: 'Full refactor sprint every quarter',           effects: { tech:+14, polish:+5, bugs:-7, morale:-2 }, gate: { traitRequired: 'Perfectionist' } },
      ]
    },
    {
      id: 'mc_investor_pitch', trigger: 'any', projectTypes: ['web','saas','mobile','ai'],
      text: 'Narrative for investors?',
      answers: [
        { text: 'Slow and steady — real customers',             effects: { design:+6, polish:+6, morale:+3 } },
        { text: 'Hockey-stick growth story',                    effects: { design:+11, polish:+2, morale:-3 }, gate: { traitRequired: 'Showman' } },
        { text: 'Mission-driven — change the world',            effects: { design:+9, morale:+7 }, gate: { traitRequired: 'Visionary' } },
      ]
    },
    {
      id: 'mc_competitor_move', trigger: 'any', projectTypes: ['game','business','web','mobile','saas','ai'],
      text: 'A competitor just shipped something similar. Respond?',
      answers: [
        { text: 'Stay the course',                              effects: { polish:+4, morale:+4 } },
        { text: 'Clone their winning feature',                  effects: { design:+7, polish:-2, morale:-2 } },
        { text: 'Pivot to a differentiated angle',              effects: { design:+12, tech:+4, morale:+3 }, gate: { traitRequired: 'Contrarian' } },
      ]
    },
    {
      id: 'mc_deprecation', trigger: 'any', projectTypes: ['business','web','mobile','saas'],
      text: 'Sunset a struggling feature?',
      answers: [
        { text: 'Keep it — loyal users depend on it',           effects: { polish:+3, morale:+4 } },
        { text: 'Deprecate with a 6-month runway',              effects: { tech:+5, polish:+4 } },
        { text: 'Kill immediately — clean slate',               effects: { tech:+8, design:+3, polish:-3, morale:-4 } },
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

  // Which reason-strings to show for locked answers (UI uses this).
  // Kept for backwards compat; new code should prefer gateRequirements().
  function lockedReasons(ans) { return gateRequirements(ans, true); }

  // Describe an answer's gate requirements as a short string array. Always
  // returns something when a gate exists (even if the player currently meets
  // it) so the UI can show "✨ Unlocked by: X" for unlocked answers, not just
  // "🔒 Requires: X" for locked ones. When withCurrent=true, appends
  // "(you have N)" to stat requirements so the player sees the gap.
  function gateRequirements(ans, withCurrent) {
    if (!ans.gate) return [];
    const f = S.founder;
    const reasons = [];
    if (ans.gate.traitRequired) {
      reasons.push('Trait: ' + ans.gate.traitRequired);
    }
    if (ans.gate.statMin) {
      for (const [stat, minVal] of Object.entries(ans.gate.statMin)) {
        const have = f?.stats?.[stat];
        if (withCurrent && typeof have === 'number' && have < minVal) {
          reasons.push(stat.toUpperCase() + ' ≥ ' + minVal + ' (you have ' + have + ')');
        } else {
          reasons.push(stat.toUpperCase() + ' ≥ ' + minVal);
        }
      }
    }
    if (ans.gate.eraMin) reasons.push('Year ≥ ' + ans.gate.eraMin);
    if (ans.gate.eraMax) reasons.push('Year ≤ ' + ans.gate.eraMax);
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
    // v11.1: decisions only fire on own-IP projects. Contracts are fixed-
    // scope client work — the player's creative latitude is already set
    // by the contract terms, not by in-development design pivots.
    if (proj.isContract) return;
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
      answers: q.answers.map((a, i) => {
        const avail = isAnswerAvailable(a, proj);
        return {
          idx: i,
          text: a.text,
          effects: a.effects,
          available: avail,
          // Always populate when the answer is gated, even if the player meets
          // the gate — the UI renders unlocked gates as "✨ Unlocked by: ..."
          // for discoverability. withCurrent=true adds "(you have N)" for
          // stat gaps when locked.
          gateReasons: a.gate ? gateRequirements(a, !avail) : [],
          // Legacy field kept for any consumers that read it directly
          lockedReasons: avail ? [] : gateRequirements(a, true),
        };
      })
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
