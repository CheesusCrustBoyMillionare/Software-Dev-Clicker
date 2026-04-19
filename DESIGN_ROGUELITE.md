# Roguelite Layer — Design Brainstorm

**Status:** brainstorming. Nothing locked yet. Goal: convert "bankruptcy = game over" into "bankruptcy = run end, new founder, meta-progression continues."

**Core inspiration mix:** Rogue Legacy (procedural heirs with quirky inherited/new traits, permanent upgrade shop) + RimWorld (deeply simulated individual with psychological depth, backstory, skill passions).

**Not re-inventing:** Dwarf Fortress (way too simulation-heavy), Slay the Spire (deckbuilding — wrong shape), Hades (story-arc per run — we have 44 years of gameplay already).

---

## The shape we're going for (provisional)

```
  run 1: Alex Chen, Creative Gamedev, 1980 → goes broke in 1994
     ↓ death / bankruptcy / retirement
     ↓ (your studio is acquired for pennies, but...)
     ↓
  legacy selection screen — pick from 2-3 heirs with rolled traits
     ↓
  run 2: Jordan Chen (inherits +1 "Design" trait from Alex; has own "Insomniac" quirk)
         starts 1980 again (or inherits some years?)
         starts with some inherited cash / research / reputation?
     ↓
  ... each run a full career arc ending in bankruptcy / retirement / megacorp exit
```

Each run is a full tycoon career. Between runs the *player* (the meta-persona) gets stronger; each individual *founder* is mortal.

---

## Core design questions (need answers before writing code)

Ordered by priority: Q1-Q5 set the architecture; Q6-Q7 layer gameplay texture; Q8-Q9 layer meta-progression; Q10 is final polish. Later questions often only make sense once earlier ones are locked.

### Q1 — The founder itself ✅ LOCKED: Tech School Alumni

**Every founder is a graduate of the same famous tech institute.** They're differentiated by their *rank in their graduating class*. The studio resets every run (new founder = new studio) but the **school is the persistent institution** whose reputation grows with every alumnus who succeeds.

**Why this works better than family lineage:**
- Game always starts at the same date (1980) — a grandson-of-grandson chain doesn't fit
- Rank is a natural procgen seed (valedictorian vs rank #47 vs rank #312 gives wildly different feels)
- Meta-progression has a natural home: **endow the school** → future grads arrive better-prepared

**Class-rank design sketch:**
- Each graduating class is a fixed cohort size (TBD — 50? 100? 200?)
- Your rank is an integer; lower is "better" by GPA but not strictly better in gameplay
- **Top 5 (valedictorian / salutatorian / honors):** best raw stats, best starting research, but "high expectations" — an early bankruptcy hits reputation harder
- **Top 50 (distinguished):** strong stats, 1-2 notable professors as references, balanced
- **Middle of the pack (51-80%):** average stats, quirkier rolls, more procedural traits
- **Bottom of the class (lowest 20%):** weaker stats BUT resilience perks, underdog traits, "had to fight for every grade"
- Every rank gets exactly one founder per run — no duplicates; you can't "re-roll the valedictorian"

**Implications this already resolves for later questions:**
- **Q2 (classic mode):** if the tycoon only has one mode, every career is an alumnus' career. If classic stays, it's probably "one-shot alumnus with no meta-progression"
- **Q3 (carries over):** the tech school carries over. Your lifetime alumni stats, endowments, and "famous alumni" roster persist. The studio always resets.
- **Q4 (run-end triggers):** bankruptcy ends a run for sure. Since calendar always restarts (Q5 A), retirement doesn't spawn a new run — but could be "graduate retires in glory and your run ends early with bonus rep"
- **Q5 (calendar):** ✅ "Always restart at 1980" — this is part of the framing
- **Q8 (meta-progression):** meta-currency ≈ "school endowment / reputation". Earn it in runs, spend it between runs on school upgrades (better curriculum, famous professors, richer alumni network) that benefit *every future grad*, not just one bloodline

**Things to think about later:**
- School name (placeholder: "The Institute" / "Sunnyvale Tech" / you pick)
- What does "class rank" specifically translate to in starting stats/traits? (Q6 will nail this)

### Q1a — Stat/trait distribution by rank ✅ LOCKED: Bell curve
Middle-of-class ranks produce "normal" founders — average stats, few or no notable traits. Both **extremes** of the ranking produce quirkier rolls with archetypal flavor:
- **Top 5 ("class president" archetype):** high stats + polished traits (Networker, Ambitious, Workaholic) but high-expectation drawbacks (Perfectionist, Imposter Syndrome)
- **Middle (25-75 percentile):** unremarkable — solid baseline, 0-1 traits, play the game mostly on merit
- **Bottom 5 ("dark academia" / hidden-genius archetype):** lower base stats BUT more numerous/wilder traits (Insomniac, Eccentric, Chip-on-Shoulder, 10×'ed Work Ethic, Unorthodox) — compensates with style

Base stat shape by rank: smooth U-curve? Inverted U? Probably roughly:
- Top 5: stat sum ~50-55 (high), 3-4 traits (half positive, half double-edged)
- Top 6-25: ~45-50, 1-2 traits
- Middle (25-75%): ~40-45, 0-1 traits
- Bottom 5-25%: ~35-40, 1-2 traits
- Bottom 5: ~30-35 (low), 3-4 traits (disproportionately positive to compensate — chaos energy)

### Q1b — Class cohort structure ✅ LOCKED: Single class, start at bottom, climb up
- One graduating class (Class of '80) is the pool for an entire save's runs
- **Run 1 = bottom-ranked member of the class** (the underdog who everyone thought wouldn't amount to anything)
- Subsequent runs unlock higher-ranked classmates as you accumulate school endowment / meta-progression
- Your past runs' founders become famous alumni (or infamous flops) referenced in the current run — rivals, cameos, "that guy from your class is now running MegaCorp"
- Class size TBD — probably 20-50. Too many = never reach the top; too few = game ends when you run out. Target: roughly 10-20 runs per "save slot" to feel like a full arc.

**Implication:** progression is automatic difficulty scaling. Your early runs have bottom-of-class quirky underdogs; your mid runs are middle-of-class "normies"; your late runs (if you've earned the endowment) are top-of-class stars who come with both high stats AND their own baggage.

---

Original options (for reference — not picked):
- **A) Actual family lineage** (Rogue Legacy): heir inherits from parent, has literal name
- **B) Apprentices**: each founder trains a handful of candidates; one becomes next founder
- **C) Reincarnation / "spiritual successor"**: (what we picked, reframed as alumni)
- **D) "Meta-founder"** who is the player; each run is a career phase

### Q2 — Classic mode coexistence ✅ LOCKED: Roguelite replaces classic everywhere

One mode only. Bankruptcy (and every other run-terminating event) spawns the next classmate. Classic "one career, one life" is retired.

**Consequences for existing end-game systems:**
- **Bankruptcy** → always spawns next classmate (core mechanic)
- **Sell to Megacorp** (legacy decision) → still a valid run-end, now framed as "you cashed out; your classmate takes over the school's attention + a chunk of endowment bonus"
- **Retire early** (possible future legacy decision) → same: run ends, classmate next
- **Win conditions** (Industry Titan, IPO Exit, Catalog Master, etc.) → currently "game over → retrospective." In roguelite these become *endorsements* — the run ends triumphantly and the next classmate inherits an outsized endowment boost, plus the founder joins the "famous alumni" roster permanently
- **Hall of Fame retrospective** → repurposed from "per-career summary" to "school-wide alumni ledger" showing every founder who's passed through this save

**What this means for achievements tuned to a single career:**
- "Ship 50 projects in one run" — reachable only if class size is large enough or runs last long enough; may need re-tuning (e.g., class size 50+ so a late run can hit it)
- "Reach $1B lifetime revenue" — interpret as per-save, cross-run? Probably yes, since the school endowment persists
- Will need an achievement audit in a dedicated phase

**Old options (not picked):**
- B) Two modes at slot screen
- C) Difficulty toggle per career

### Q3 — What carries over vs what resets ✅ LOCKED

| Field | Behavior |
|---|---|
| Cash, active/shipped projects, contracts, current run state | Reset |
| Calendar (→ always 1980) | Reset (locked in Q5) |
| **Q3a Research nodes** | Endowment-paid curriculum: player spends meta-currency to **permanently** document research nodes into the school's curriculum; every future classmate starts with those nodes pre-unlocked. Un-documented research resets each run. |
| **Q3b Fame (tFame)** | Converts to endowment meta-currency at run-end. Nothing carries directly as "fame" — it's cashed in. |
| **Q3c Hardware** | "School lab" carryover — once any alumnus buys a piece of hardware, it becomes part of the school's lab and every future classmate starts with access. One-time investment, permanent benefit. |
| **Q3d Studio name** | Resets every run — each classmate names their own studio at the creator. The school persists; the company doesn't. |
| **Q3e Achievements** | Persist across all runs (trophy cabinet). |
| **Q3f Lifetime stats** (total revenue, ships, hires, etc.) | School-wide cumulative ("Sunnyvale Tech alumni have shipped 247 projects across 8 founders") — on top of per-run tracking that drives the Hall of Fame entries. |
| **Q3g Employees** | Alumni hire pool — past founders become hireable senior staff in later runs at premium salary. Your current team does NOT carry over; everyone scatters when the studio folds. |
| **Q3h Rivals** | Famous alumni bleed-in — if a past founder's run ended with IPO / Megacorp exit / Industry Titan win, their studio becomes a persistent rival entity in future runs. Failed runs don't bleed in (those alumni are just hireable or referenced narratively). |

**Key architectural consequence:** save schema gets two layers.
- **Per-run state** (`S.*` as we have it today) — resets on classmate transition
- **Per-save meta state** (new `S.school = {...}`) — persists across all runs in this save: endowment balance, documented research nodes, school lab hardware, alumni roster with their final stats, persistent rival studios spawned from past winners, lifetime cumulative stats

Schema migration: existing classic saves need to be auto-wrapped with a default empty `S.school` block. No data loss.

### Q4 — Run-end triggers ✅ LOCKED: Five trigger types; all contribute endowment

Every one of these ends the current run and spawns the next classmate. The **endowment bonus** each one grants to the school scales with the quality of the exit — but even bankruptcy contributes something (no null-score runs).

| Trigger | Endowment tier | Notes |
|---|---|---|
| **Bankruptcy** (4 consecutive weeks negative cash) | **Small** | Even failure teaches the school something. Minimum floor. |
| **Age retirement** (~60-70, founder's rolled `retireAge`) | Medium | Automatic forced rotation. Fires even on successful runs to keep the class-climb moving. |
| **Voluntary "Retire & hand off"** (button, gated by Fame ≥ 50) | Medium (scales with Fame + lifetime revenue at time of retirement) | Player-initiated mid-run exit. Fame gate prevents insta-skip exploits. |
| **Megacorp exit** (Sell to Megacorp legacy decision) | Large | Voluntary cash-out. Converts to big endowment + cash payout banked at studio-close. |
| **Win condition** (Industry Titan, IPO Exit, Catalog Master, The Acquirer, Reach 2024) | **Largest** | Triumphant exit. Founder joins "famous alumni" permanently; maxes out endowment bonus + unlocks a commemorative classroom/building (flavor). |

**Design intent:**
- Five distinct ways to end a run → five distinct *vibes* and tempo.
- Quality-of-exit gradient prevents "bankruptcy-farm" strategies (where dying fast would earn more per-hour than playing carefully).
- Specific endowment amounts are tuned in Q8 (meta-currency).

**Old options (for reference):**
- A) Only bankruptcy
- B) Bankruptcy + retirement
- C) Bankruptcy + retirement + megacorp
- D) Player choice at any point

### Q5 — Calendar on new run (timeline behavior)
- **A) Always restart at 1980** — new career, fresh history
- **B) Continue the in-universe timeline** — you went broke in 1994, heir starts in 1994. Game keeps the same era/rivals/platforms but you're re-entering mid-game
- **C) Time skip option** — heir starts "10 years later" so you can choose a different era

### Q6 — Traits model ✅ LOCKED: Passions + Mechanical traits + Narrative flavor traits

Every founder is built from **three layers** of characterization:

#### Layer 1: Passions (gameplay backbone — one per axis)
Each of the 3 quality axes (design / tech / polish) gets a passion level:

| Level | Output mult | Icon |
|---|---|---|
| 🔥🔥 **Burning** | **+40%** | red flame pair |
| 🔥 **Interested** | +15% | single flame |
| ⬜ **None** | baseline (0%) | empty circle |
| 🚫 **Aversion** | **−25%** | stop symbol |

**Passion distribution rule** (initial proposal, tunable):
- Every founder gets exactly **one passion of each flavor category** across their 3 axes:
  - One **high** (Burning or Interested)
  - One **mid** (Interested or None)
  - One **low** (None or Aversion)
- Top-ranked graduates tend to roll higher-tier picks (double Burning possible for top 5); bottom-ranked graduates tend to roll one Burning + one Aversion (intense in one area, allergic to another).
- Middle-ranked graduates tend to roll three Interested / None (consistent generalist).

#### Layer 2: Mechanical character traits (count scales with rank-distance from middle)
From a catalog of ~30-40 traits. Trait count per founder follows the bell curve locked in Q1a:

| Rank band | Trait count |
|---|---|
| Top 5 | 3-4 |
| Top 6-25 | 1-2 |
| Middle (25-75%) | 0-1 |
| Bottom 5-25% | 1-2 |
| Bottom 5 | 3-4 |

Each trait has a concrete mechanical effect. Examples to seed the catalog:
- **Night Owl**: +20% output at speed 2×+, −20% at speed 1×
- **Perfectionist**: Polish phase +15% quality, +50% longer duration
- **Networker**: −20% hire cost, +10% to interview reveal quality
- **Workaholic**: +15% output, −1 morale/week
- **Eccentric**: 25% of MC decisions surface a 4th "unorthodox" option
- **Imposter Syndrome**: −morale on critic < 80 ship
- **Caffeinated**: +10% speed during development only
- **Chip on Shoulder**: +10% output when current project is behind schedule
- **Visionary**: Feature-picking UI shows one additional suggested feature
- **Recluse**: Can't use marketing channels; no launch multiplier — but hiring costs −40%
- **Deal-Maker**: Contracts pay +25%, but own-IP launch sales −10%

(Full catalog to be expanded in Phase 1 implementation — Phase 0 design doc just needs ~10-12 exemplars to establish the style.)

#### Layer 3: Narrative flavor traits (pure personality, no mechanical effect)
On top of Layers 1 and 2, every founder also gets **1-3 flavor traits** drawn from a separate narrative catalog. These appear in the founder's bio, occasional log entries, review quotes, dialogue — but touch nothing mechanical.

Examples:
- *"Left-handed"* / *"Avid chess player"* / *"Vegetarian"* / *"Fluent in 3 languages"*
- *"Former garage-band drummer"* / *"Rescue dog owner"* / *"Always drinks iced coffee"*
- *"Wrote the school newspaper"* / *"Was on the debate team"* / *"Has a twin sibling"*
- *"Hates the Oxford comma"* / *"Known for awful shirts"* / *"Collects vintage calculators"*

**Why include these?** Three reasons:
1. **Identity texture** — two founders with the same passions + mechanical traits still feel distinct because one is "that guy who collects vintage calculators" and the other is "former chess champion."
2. **Easy to scale** — a pool of 100+ flavor traits is cheap to write and doesn't need balance testing.
3. **Future hooks** — down the line, narrative traits could enable dialogue-specific scenes ("Known for awful shirts" gives a flavor log entry when the founder is mentioned in a NYT article).

**Old options (for reference):**
- A) Rogue-Legacy-lite (1-2 mechanical only)
- B) Rogue-Legacy-full (3-5 mix)
- C) RimWorld-inspired (passions + 2-3 traits)
- D) Mix of C + narrative ← ✅ picked

### Q7 — Trait inheritance model ✅ LOCKED: Fully procedural

Each classmate's passions + mechanical traits + narrative traits are rolled fresh from the pools (weighted by their rank). Past runs don't influence what future classmates roll.

**Rationale:** bell-curve distribution + rank-driven count already supply plenty of run-to-run variation. Layering a "famous alumni nudge" or "endorse a trait" system on top would muddy the math without adding much texture — the school endowment in Q8 is already a meta-progression layer; doubling up on meta-progression for trait rolls is over-engineering.

**Old options (for reference):**
- B) Famous alumni nudge — past wins bias future trait rolls
- C) Curriculum-driven — endowment unlocks bias trait pool
- D) Player choice — pay to endorse one trait per run

### Q8 — Meta-progression currency ✅ LOCKED: Combination (E)

**Currency:** Endowment. Earned from run-end per Q4 (bankruptcy = small, wins = largest). Lifetime fame cashes in at run-end too (Q3b).

**Structure:** organized into 4 departments, each with its own small talent tree. Most purchases need enough endowment; some big unlocks additionally require an achievement milestone from a past run.

#### Department 1 — Academics (curriculum + research)
Focus: what the school *teaches*. Carries research knowledge forward.
- **Document Research Node** (per-node purchase) — pay endowment to permanently add a researched node to the school curriculum; every future grad starts with it. Price scales with the node's tier.
- **Hire Visiting Professor** — permanent +5 to all future grads' stats on one chosen axis (buy up to 3, one per axis).
- **Endow Faculty Chair** (gated: requires Professor on all 3 axes) — tier-1 research nodes become free pre-unlocked for every future grad.

#### Department 2 — Facilities (hardware + lab)
Focus: physical equipment that used to reset each run.
- **Build Computer Lab** (tier 1) — next grad starts with baseline dev rig already installed.
- **Upgrade Workstations** (tier 2, requires Lab) — lab-grade hardware permanently in place.
- **Specialized Hardware** — one purchase per hardware type (SGI, CD mastering, server infra, cloud credits, etc.). Once bought, permanent.

#### Department 3 — Alumni Network (hire pool + rival economy)
Focus: the social/professional capital the school builds through its graduates.
- **Formalize Alumni Job Board** — unlocks Q3g: past founders become hireable senior staff at premium salary.
- **Gold-Plated Diploma** — top-5-ranked grads start with +1 client-tier reputation (open higher-tier contracts sooner).
- **Alumni Connections** — every classmate gets one free guaranteed contract offer in their first week.

#### Department 4 — School Life (flavor + soft bonuses)
Focus: texture and morale — smaller buffs that add up.
- **Scholarship Fund** — next grad starts with +$25k cash (stacks: 2 = +$50k, 3 = +$75k).
- **Celebrated Rivalry** — adds a custom-named antagonistic rival studio to the persistent market roster (flavor-rich; may be tied to a past alumnus's lore).
- **School Newsletter** — each ship in future runs generates a bonus review quote attributed to the school's own publication.

#### Achievement-gated super-unlocks (cross-cutting)
A few special purchases in each department require *both* endowment AND a past run milestone:
- **Document the LLM Research Node** (Academics) — also requires any past alumnus to have shipped an AI project
- **"Alumni in Every Camp"** (Alumni Network) — requires 3+ past runs that ended in Win Condition (IPO / Industry Titan / Catalog Master)
- **"Center of Innovation" campus expansion** (Facilities) — requires a past run that reached 2020+ era
- **"The Legend of [Founder Name] Lecture Hall"** (School Life) — requires a founder who won GOTY at least twice

These exist to tie the meta-progression to actual achievements, not just endowment grinding.

**Old options (for reference):**
- A) Flat shop
- B) Talent tree
- C) Multi-department hybrid
- D) Purely reactive / achievement-gated

### Q9 — Scaling across runs ✅ LOCKED: Rival scaling + era unlock

Classmate progression (rank climb, stat improvements, endowment spend) makes each run more powerful by default. Q9 layers in world-side pushback:

#### Piece 1 — Mild rival scaling
Each subsequent run, the simulated rival studios start **slightly** more developed, as if time has passed between the classmates even though the calendar is always 1980:
- Run 1: rivals operate at baseline 1980 level (as today)
- Run 5: rivals roughly at 1982-equivalent competency — more research nodes completed, slightly higher-tier founders, average critic scores +5-8
- Run 10: 1984-ish competency — one rival may already be at mid-80s tier
- Run 15+: caps out at "very tough 1985 scene" — we don't want to make late runs genuinely unwinnable

**Tuning dials (for Phase 1 implementation):**
- `rivalLevelOffset = min(5, Math.floor(run_number / 3))` — rivals advance by 1 tier every 3 runs, capped
- Rivals' starting fame, completed research count, and quarterly strategy aggressiveness all bump modestly per level
- Player can always keep up via their own endowment-fueled head-start

#### Piece 2 — Premium era unlock
After accumulating enough endowment AND hitting milestones, the player can purchase "Advanced Curriculum" options at the character creator:
- **Accelerated Start — 1985 kickoff** (requires 1 win-condition run completed + endowment cost)
- **Accelerated Start — 1995 kickoff** (requires 3 win-condition runs + larger endowment cost)
- **Accelerated Start — 2005 kickoff** (requires 5 win-condition runs + still more endowment)
- **Accelerated Start — 2015 kickoff** (endgame content; requires 8 wins + massive endowment)

These relax the Q5 "always 1980" lock as an earned privilege. The framing: **"the school has accelerated-curriculum programs for exceptional candidates"** — a grad can skip ahead through concentrated learning.

Note: in later-era runs, rival scaling stacks normally (run 10 in 1995 = very aggressive competitive field). Not a victory-lap mode.

**Why this shape over the alternatives:**
- Flat (A) → late runs feel like trivial victory laps
- D (dynamic auto-scaling) → feels punitive / invalidates progress
- C alone → era unlock without world tension ruins the late-run feel
- E (our pick) → maintains tension AND rewards long-term investment

**Old options (for reference):**
- A) Flat
- B) Rival scaling alone
- C) Progressive era unlock alone
- D) Dynamic difficulty auto-scaling

### Q10 — UI / onramp depth ✅ LOCKED: Full dedicated school mode

Between runs, the game enters a **school screen** — its own distinct UI layer outside the tycoon overlay. The player walks through spending endowment, reviewing alumni, and choosing the next classmate before firing up the next tycoon career.

**Navigation flow per save:**

```
[Slot screen] → click save slot
     ↓
[School screen] ← ───────────── (default landing)
  │
  ├── Admissions: class roster + next classmate picker
  ├── Departments: 4-tab endowment shop (Academics/Facilities/Alumni/School Life)
  ├── Alumni Hall: past founders' stats, fates, famous-alumni callouts
  ├── Lifetime Stats: cumulative data across runs
  └── [Enroll Next Classmate] → tycoon starts
     ↓
[Tycoon overlay] ← same as today (with new founder pulled from class roster)
     ↓ run ends (any Q4 trigger)
[Run-End Retrospective] — run summary + endowment earned
     ↓
[School screen] (back to top)
```

**During a run (tycoon mode):** a small "🎓 View Institute" button in the top bar opens a READ-ONLY school window — browse endowment balance, alumni hall, lifetime stats — but can't spend endowment (that's a between-runs activity). Keeps the school context one click away without breaking the tycoon loop.

**School screen layout sketch:**

```
┌─ Sunnyvale Tech ─────────────────── Endowment: 3,240 ── [Save] ─┐
│  School crest / banner / flavor                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Admissions] [Departments] [Alumni Hall] [Lifetime]             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  (tab content — varies by selection)                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                 [ Enroll Next Classmate → ]                     │
└─────────────────────────────────────────────────────────────────┘
```

**Admissions tab (default on entry):**
- Class roster strip showing ranks #47 → #1 with portraits/icons
- Ranks already played: grayed out with result (💀 bankrupt / 🏆 IPO'd / etc.)
- Ranks not yet available: locked with required endowment
- Currently-available rank: highlighted, showing rolled passions + traits
- Click "Enroll" to commit to that classmate

**Departments tab:** the 4 department talent trees from Q8. Each department is a sub-tab; nodes show price + prereqs + effect description; bought nodes show as lit-up.

**Alumni Hall:** past founders' cards — portrait, name, rank, tenure years, fate icon, lifetime stats within their run, signature quote. Famous alumni (win-condition winners) get a pinned/featured position.

**Lifetime tab:** aggregate stats. Total ships across all classmates, cumulative revenue, bloodline-wide critic average, win-condition count, achievement progress.

**Why this shape:** committing to a full school screen lets the meta-layer breathe. It's where you PLAN and celebrate between careers. The tycoon loop stays clean and focused while the school mode carries the long-arc narrative.

**Old options (for reference):**
- A) Subtle — inheritance modal, no dedicated panel
- B) Bloodline tab — dedicated panel inside the tycoon UI

---

## Implementation phase plan

All 10 design questions locked. Each phase below is independently shippable (builds cleanly, tests pass, game is playable end-to-end at the current level of integration). No phase leaves the game broken. Phases are roughly in dependency order; items in parentheses are "could move earlier if someone wants to" but most are ordered by risk (low → high).

### Phase 0 — Branch infra + phase plan commit
**Deliverable:** this very design doc locked, phase plan written.
**Files:** `DESIGN_ROGUELITE.md`
**Test:** doc reads coherently end-to-end
**Risk:** none; already done.

### Phase 1 — Schema v3 + migration
**Deliverable:** save schema bumps to v3. New `S.school` container is the persistent meta layer; existing v2 saves auto-migrate with an empty `S.school` (no data loss).
**Files:** `src/js/03-state.js` (SCHEMA_VERSION, defaults, SCHEMA_MIGRATIONS)
**Touches:** save/load paths, `peekSlot` preview (tycoon-save detection stays as-is)
**Test:** load an existing v2 save → `S.school` appears with defaults, everything else intact. New save → v3 from the start.
**Risk:** LOW — purely additive schema work, well-trodden pattern from v1→v2.

### Phase 2 — Trait + passion data model (static, no effects yet)
**Deliverable:** Passion enum defined, mechanical trait catalog (~15 traits for the exemplar set), narrative trait pool (~80 flavor strings). Founder objects now have `passions`, `traits`, `narrativeTraits` fields. Class generation: when a new save starts, roll one full class of ~50 classmates with their rank, base stats, passions, mechanical traits, narrative traits — stored in `S.school.classRoster`.
**Files:** new `src/js/37-tycoon-traits.js`, minor hooks in the creator flow
**Test:** creating a new save produces a coherent class of 50 rolled classmates; bell curve verified (top/bottom 5 have more traits, middle has 0-1); display on founder card shows passions + traits.
**Risk:** LOW-MEDIUM — new data model, but purely additive. No existing behavior changes.

### Phase 3 — Trait effects wired into gameplay
**Deliverable:** passions multiply into `developOneWeek`/`polishOneWeek` correctly. Mechanical traits fire their effects (Night Owl speed scaling, Perfectionist polish longer, Networker hire discount, etc.). Each trait gets tested with a controlled probe.
**Files:** `src/js/13-tycoon-projects.js` (weekly tick hooks), `src/js/17-tycoon-employees.js` (hire cost modifier), `src/js/19-tycoon-finance.js` (payroll Workaholic morale drain), a few more as traits require
**Test:** founder with Burning design ships noticeably higher critic than one with Aversion design (holding stats constant). Each trait verified individually.
**Risk:** MEDIUM — touches core gameplay loop. Regressions here break existing runs. Guard with `if (trait && trait.active)` patterns; default-off.

### Phase 4 — Run-end detection + endowment calculation
**Deliverable:** new `tycoon:run-end` event fires on bankruptcy / megacorp / win condition / age retirement. Each dispatches a classified event with `{ type, endowmentEarned, founderSnapshot }`. Endowment math per Q4 tier. Voluntary "Retire & hand off" button in Finance panel (gated by Fame ≥ 50).
**Files:** `src/js/19-tycoon-finance.js` (bankruptcy path rerouted), `src/js/32-tycoon-wins.js` (win triggers run-end not game-over), `src/js/33-tycoon-legacy.js` (megacorp sells now trigger run-end), `src/js/15-tycoon-ui.js` (run-end modal replaces legacy game-over)
**Test:** each exit type correctly dispatches the event; correct endowment amounts land in `S.school.endowment`.
**Risk:** MEDIUM — multiple existing end-states to reroute. Need to keep the retrospective modal content (good for the player) while routing to roguelite flow instead of game-over.

### Phase 5 — School screen shell
**Deliverable:** new UI layer between run-end and next-classmate-enroll. 4 tabs present (Admissions / Departments / Alumni Hall / Lifetime) but most contain placeholder content. Navigation between school screen and tycoon mode works. Save/load handles both modes.
**Files:** new `src/js/38-tycoon-school.js`, `src/js/15-tycoon-ui.js` (slot hijack routes to school instead of direct-to-tycoon), `src/styles.css` (school screen style pass)
**Test:** start new save → lands on school screen → click Enroll Next Classmate → enters tycoon. Run ends → back to school. Save & Quit works from either screen.
**Risk:** MEDIUM-HIGH — new UI layer, lots of surface area. Most complex single phase. Consider splitting if it feels too large during implementation.

### Phase 6 — Admissions tab (class roster + next-classmate picker)
**Deliverable:** class roster strip with 50 portraits, ranks, played/locked/available states. Current next-rank automatically selected. Click "Enroll" → creator opens with that classmate's pre-rolled stats/traits visible (not selectable). Creator start button enters tycoon.
**Files:** `src/js/38-tycoon-school.js` (Admissions sub-module), `src/js/15-tycoon-ui.js` (creator reads from school roster instead of random defaults)
**Test:** admissions tab shows all 50 ranks; previously-played ones greyed with fate; current rank's card shows passions + traits accurately; enrolling starts a fresh tycoon career with that founder.
**Risk:** MEDIUM — mostly UI work; data model already exists from Phase 2.

### Phase 7 — Departments tree (endowment spend)
**Deliverable:** all 4 department trees from Q8 are functional. Player can spend endowment to buy nodes; prereqs and achievement gates enforced. Purchased nodes persist to `S.school` and their effects trigger on the next classmate's run (e.g., Scholarship Fund = +$25K starting cash). Achievement-gated super-unlocks verify conditions before allowing purchase.
**Files:** `src/js/38-tycoon-school.js` (Departments sub-module), plus trait/effect handlers in relevant modules to consume the endowment flags on run start
**Test:** buy "Scholarship Fund" → next run starts with +$25K. Buy "Document n_2d_sprites" → next classmate has that node pre-completed. Achievement-gated purchases correctly blocked/allowed.
**Risk:** MEDIUM — many small effects to wire, each needs its own test. High-surface-area but each individual node is trivial.

### Phase 8 — Alumni Hall + Lifetime Stats tabs
**Deliverable:** past founders persist in `S.school.alumniHall` with full stat snapshots + fate + signature quote. Lifetime Stats tab aggregates cross-run totals. Famous alumni (win-condition winners) are featured prominently. Their studios auto-bleed into the rival pool for future runs (Q3h).
**Files:** `src/js/38-tycoon-school.js` (Alumni Hall + Lifetime tabs), `src/js/23-tycoon-rivals.js` (accepts alumni-origin rival entries)
**Test:** complete a run → alumni card appears in Alumni Hall. Win a run → famous alumni entry appears + a rival studio spawns bearing their name. Lifetime stats accumulate correctly.
**Risk:** LOW-MEDIUM — mostly data display; the rival-bleed-in is a small hook.

### Phase 9 — Rival scaling + era-start unlock
**Deliverable:** `rivalLevelOffset = min(5, floor(runNumber / 3))` applies to rival starting states. Premium era-start purchases in Admissions (or a creator option): 1985/1995/2005/2015 kickoff, gated by win count + endowment cost. When chosen, the tycoon career starts in that era with appropriate research/platform access.
**Files:** `src/js/23-tycoon-rivals.js` (level offset in spawn code), `src/js/38-tycoon-school.js` (era-start UI), `src/js/15-tycoon-ui.js` (creator era override), `src/js/35-tycoon-scenarios.js` (possibly reuse scenario system for pre-configured era starts)
**Test:** run 5 → rivals visibly stronger than run 1 (compare baseline critic averages). Buy Accelerated Start to 1995 → next run begins in 1995 with appropriate era state.
**Risk:** MEDIUM — touches the scenario system (existing) and rival engine (existing); some balance iteration expected.

### Phase 10 — Polish + onboarding + merge to main
**Deliverable:** contextual hints for roguelite (new classmate, endowment earned, first time hitting school screen, etc.). Achievement audit — per-run vs per-save reinterpretation where needed. Trait catalog expanded if the exemplar set feels thin (~15 → ~25). Balance pass based on playthrough. Full smoke test. Merge plan for main.
**Files:** `src/js/36-tycoon-hints.js` (new hint entries), `src/js/34-tycoon-achievements.js` (re-tune any per-run gates), assorted polish
**Test:** full playthrough of 3-5 runs feels coherent; meta-progression curve feels rewarding; no regressions in tycoon loop; achievement count matches design.
**Risk:** LOW — polish and tuning. Only risky part is the merge to main since roguelite replaces classic.

---

### Phase dependency graph

```
0 ────▶ 1 (schema)
        │
        ▼
        2 (data model) ─── 4 (run-end) ────────────┐
        │                   │                       │
        ▼                   ▼                       ▼
        3 (effects)         5 (school shell)
                            │
                            ├─ 6 (admissions)
                            ├─ 7 (departments)
                            └─ 8 (alumni hall)
                                 │
                                 ▼
                                 9 (scaling + era unlock)
                                     │
                                     ▼
                                     10 (polish + merge)
```

Phases 2 and 4 can be parallelized if two devs exist. Phases 6/7/8 depend on Phase 5's shell but can be done in any order after that. Phase 9 needs 5-8 done. Phase 10 ties everything.

### Rough complexity estimate
- Phases 0-1: small (pure infra)
- Phases 2-4: medium each (core systems, well-scoped)
- Phase 5: large (new UI layer)
- Phases 6-8: medium each (well-scoped within school shell)
- Phase 9: medium (era-start reuses scenarios; rival scaling is arithmetic)
- Phase 10: medium (polish + merge readiness)

Total: ~11 commits (one per phase, possibly sub-phases within the larger ones).

---

## Risks / things to watch

1. **Trait explosion** — RimWorld-style sim has hundreds of traits. We want quality over quantity. Aim for 20-30 distinct traits that meaningfully alter play.
2. **Runs getting shorter** — if bankruptcy spawns a new founder, there's risk of quick-death-quick-death cycles. Need to balance early-run viability.
3. **Save schema** — roguelite state has to live alongside current save format. SCHEMA_VERSION bump.
4. **Meta-progression trap** — if earning currency makes runs trivially easy, the roguelite loop loses tension. Needs careful curve tuning.
5. **Scope creep into "RimWorld the tycoon"** — relationships between founders, romance, colonist-style psychology... tempting but wrong scope. The founder is already unique; we don't need to simulate their spouse.
6. **Existing v10 features** — legacy decisions, win conditions, Hall of Fame — need to find their place in the new model.
