# Feature TODO

## Tech debt — Dead clicker code removal
The tycoon rework left all pre-v10 clicker code in place (modules 01-11). In tycoon mode the clicker `tick()` early-returns at `09-runtime.js:297` and the chain dies — so the clicker is genuinely unreachable, but ~4,000 lines of its UI, bubble minigame, coder-pack system, and modals still parse on every page load.

**Confirmed clicker-only files (0 tycoon references):**
- `05-content.js` — bug-kill content, achievement blurbs
- `07-minigame-pack.js` — bubble minigame, aim trainer, coder pack system, offices, `rollCoder` etc
- `08-modals.js` — clicker roster modal, clicker achievements modal, prestige tree UI

**Tycoon-used exports in otherwise-clicker files:**
- `06-ui-core.js` — `markDirty()` (18 tycoon callers) + `log()` (35+ tycoon callers). Rest is clicker render functions.
- `03-state.js` — save/load, `KEY`, `defaults()`, migrations. Keep entirely.
- `04-helpers.js` — `fmt()`, some time helpers. Spot-check then trim.
- `09-runtime.js` — the clicker main loop, **not called** but still contains the slot-screen rebuild helpers that the tycoon hijack sits atop. Audit carefully.
- `10-boot.js` — registers resize listener, mobile tab bar, version check loop. Keep.

**Cross-file coupling that blocks naive deletion:**
- `FIRST_NAMES`/`LAST_NAMES` in `07-minigame-pack.js:296-297` are referenced by `03-state.js:453-454` inside a v1→v2 save migration. That migration never runs for a fresh tycoon save (tycoon is schema v2), but removing the arrays would break any legacy save that somehow hits the migration path.
- `coderSVG` / `emptyDeskSVG` in `02-config.js` are used by `07` and `09`. Untangle before cutting.

**Staged approach for a future session:**
1. Delete the bubble minigame block from `07-minigame-pack.js` (lines ~1-220) — zero tycoon references, only caller (`09-runtime.js:309`) sits behind the `__tycoonMode` early-return so it's safely unreachable.
2. Delete the coder-pack reveal/roster UI from `07-minigame-pack.js` and `08-modals.js`.
3. Blank out `05-content.js` (bug/achievement strings) and verify no stragglers.
4. Trim `06-ui-core.js` to just `markDirty`, `log`, `toast` (if tycoon uses it — it doesn't currently, but cheap to keep), and delete the clicker render functions.

Do each in its own commit so we can bisect any regression.

Projected savings: 2,500-3,500 lines removed, ~150-200 KB off the built HTML, ~50-80ms page-load parse time on a desktop machine. Mobile savings may be larger.

## Tycoon Balance — Diminishing returns per employee
Weekly quality accrual currently scales linearly with team size: each contributor adds its own `stat × weights × multipliers` and they sum. A 4-person team generates ~4× what a solo founder does, which makes scaling mid-game feel flat and makes "hire as many as you can afford" always correct.

Rework so per-project contribution scales on `mean(stat) × f(N)` where `f(N)` is sub-linear — second hire worth more than third, third more than fourth, etc.

**Candidate curve:** `f(N) = N^0.75` (logarithmic-ish)
- N=1: 1.00
- N=2: 1.68 (+0.68)
- N=3: 2.28 (+0.60)
- N=4: 2.83 (+0.55)
- N=5: 3.34 (+0.51)
- N=8: 4.76 (+~0.47 per hire)

**Or:** harmonic-style per-hire additions: hire 2 adds `1/2`, hire 3 adds `1/3`, … (very steep diminishing returns).

**Why mean not sum:** a mediocre senior dragging down your rockstar team should matter. `mean × f(N)` makes a 3-person team of 80s outperform a 10-person team of 50s, which rewards curating the roster.

**Touches:**
- `developOneWeek` and `polishOneWeek` in `13-tycoon-projects.js` (the per-contributor `proj.quality.X +=` loops)
- Need to decide: do morale/specialty/crunch multipliers apply to the team mean, or per-contributor before averaging? Leaning per-contributor then average.
- Team Productivity research nodes currently multiply the team-wide output — make sure they still feel meaningful with the new curve.

## Tycoon Balance — Review scores too easy to max
Getting 90+ critic is routine; 100 happens often enough that it loses its meaning. Players hit the ceiling mid-game and subsequent hires / research / features don't visibly improve reviews.

**Causes to audit:**
- `computeCriticScore` normalize caps: `scope.phaseWeeks.development × 2.5` (tech/design) and `× 3.25` (polish). With enough research multipliers, a solo 80-stat founder saturates the cap in half the design weeks. Raise caps 50–100%, or make them non-linear (`sqrt`-like rolloff).
- Feature bonus: `Σ impact × 0.05` uncapped — picking all 5 suggested features can add 15–25 points on top of an already-90 project. Cap at ~8 points total.
- Luck band is `±5` — harmless but compresses the perceived skill range. Keep.
- Type-mismatch penalty is zero — shipping a game with a tech-heavy team should cost more than it does. Consider reducing the effective stat by 30% on mismatched axes.
- Research-stacking: multiple quality-multiplier nodes of the same axis compound (e.g., `qualityMultiplierFor('tech')`). Audit whether they should cap or diminish.

**Target distribution after rebalance:**
- 50-60: undermanned / wrong team fit
- 60-75: solid, most ships land here
- 75-85: strong team, good research, right genre
- 85-92: genre mastery + polish + awards-candidate territory
- 93-98: legendary ship, requires crunch + SR team + all research in that axis
- 99-100: once-per-career event, not "every 3 ships"

**Touches:**
- `computeCriticScore` caps + feature bonus formula in `13-tycoon-projects.js`
- `computeLaunchSales` exponent (^2.2) may need a small bump to keep 90+ games feeling special if the cap raises

## Upgrade Evolutions (Vampire Survivors)
Owning two specific fame upgrades combines them into a super version. Players discover combos organically.

**Possible combos:**
- Overclock + Parallel Threads → **Hyperthreading** (×2 all speed)
- Pair Programming + Team Synergy → **Mob Programming** (×2.5 production)
- Double Tap + Lucky Click → **Critical Strike** (15% chance of 25× click)
- Macro Script + Bot Net → **Botnet Army** (auto-clicks ×3)
- Adrenaline Rush + Turbo Mode → **Bullet Time** (streak never decays while clicking)
- Code Frenzy + Hackathon → **Crunch Mode** (nap bursts 10× stronger, 3× more frequent)
- Marketing + Viral Marketing → **Growth Hacking** (fame gain doubled)
- Open Source + Franchise → **Tech Monopoly** (ship threshold -30%, +10% prod per ship)

**Implementation notes:**
- Check for combos after each fame purchase
- Show a special animation/toast when a combo is discovered
- Evolved upgrades replace both parents on the skill tree with a glowing node
- Could add a "Codex" that tracks discovered vs undiscovered combos

---

## Deeper Branching Events (FTL)
Multi-step random events with meaningful choices and real consequences.

**Example events:**
- **Rival Startup Poaching**
  - Step 1: "A rival startup is offering your engineers double salary"
  - Fight: spend 20% of current LoC to retain everyone
  - Negotiate: lose 3 random coders but gain a free perk
  - Sabotage: 50% chance of stealing 5 of THEIR coders, 50% chance of losing 5 of yours + a staff member

- **Venture Capitalist Visit**
  - Step 1: "A VC wants to invest in your company"
  - Accept: get 50% of ship target as LoC, but next ship takes 25% more
  - Decline politely: +1 fame for integrity
  - Pitch a pivot: mini-game — if you click 10 bubbles in 5s, get the investment with no strings

- **Server Outage**
  - Step 1: "Your servers are down! Production halted"
  - Hotfix: 30s of 0 production, then +50% for 60s
  - Roll back: lose 10% of current LoC, production resumes immediately
  - Blame the intern: lose 1 intern, no downtime, +20% production for 60s (guilt bonus)

- **Hackathon Invitation**
  - Step 1: "A 48-hour hackathon is happening nearby"
  - Send your best: lose top coder type for 120s, gain 3× fame on next ship
  - Send interns: no penalty, 25% chance of winning a free staff upgrade
  - Host your own: spend LoC equal to 5% of ship target, all production ×2 for 60s

**Implementation notes:**
- Events show as a modal/banner with 3 choices
- Some choices lead to a second step (sub-choices or mini-game)
- Outcomes logged so player can see history
- Weight events by game stage (early/mid/late)

---

## Evolving Staff Dialogue (Hades)
Staff members have personality and comment on your progress. Lines change based on game state.

**Character voices:**
- **Secretary**: Sarcastic, observant. Comments on your buying patterns.
  - "Another intern? You know they just break things, right?"
  - "50 coders and still clicking manually. Respect."
  - [After 10 ships] "At this point I think YOU work for THEM."

- **Recruiter**: Overconfident LinkedIn energy.
  - "Just hired a 10× engineer. They said so on their resume."
  - "My network is my net worth." 
  - [After hiring 100 coders] "I should start a recruitment agency."

- **Facility Director**: Grumpy, practical.
  - "Standing desks were a mistake. Everyone's just tired AND standing."
  - "The ergonomic chairs cost more than the interns."
  - [All equipment maxed] "Nothing left to buy. Am I... done?"

- **Trainer**: Motivational poster energy.
  - "Today's training: synergy. Tomorrow: more synergy."
  - "Your intern just completed their first PR. It broke staging."
  - [After many levels] "I've trained them so well they're training me now."

**Trigger conditions:**
- Milestone-based (first hire, 10th ship, all perks bought, etc.)
- Random idle chatter every 60-90s (pick from pool based on current state)
- React to events (after bug infestation, after shipping, after buying something expensive)
- Special lines for rare situations (0 LoC, max everything, clicking during aim trainer)

**Implementation notes:**
- Dialogue appears as small speech bubbles near the staff section or as log entries
- Each staff member has a pool of ~20-30 lines, tagged with conditions
- Lines don't repeat until the pool is exhausted
- Could add a "favorites" system where players can pin funny lines

## Research system — deeper strategic tension (from v11.1 brainstorm)

The v11.1 commit `d57310e`-ish series added cash cost per node + off-project researcher + Pioneer/Fast-Follower sales multiplier. That's interventions A/B/C from the brainstorm. Four more remain — each increases strategic depth but requires more plumbing than a one-commit pass.

### D. Multiple researchers per node (medium)
Currently one engineer per node. Allow assigning 2-3 — `rpPerWeek = sum(tech × 1.2)` with a 0.9× diminishing multiplier per extra researcher after the first. Creates real sprint vs. spread decisions. Needs:
- UI: multi-select engineer picker on the Research row Start button
- Project tick: when researchers are assigned, they're already filtered out of `getContributorsFor` (see `13-tycoon-projects.js`), so this just needs the data structure change (`S.research.inProgress.engineerIds: []` instead of singular).
- Cash cost could scale with researcher count to offset speed (e.g., full cost per researcher).

### E. Mutually-exclusive fork nodes (medium)
Some pairs of nodes are alternatives — picking one locks the other for the run. Encodes build identity without a full tree redesign. Candidate pairs:
- `n_object_oriented` vs a new `n_functional_paradigm`
- `n_relational_db` vs a new `n_nosql_early`
- `n_cloud_infra` vs a new `n_on_prem_scale`

Needs:
- Node data: `excludes: [nodeId]` property that locks the named node when this one completes.
- UI: excluded nodes show "🔒 Excluded by ..." instead of normal lock reason.
- ~4-6 new fork partners to design thoughtfully before shipping.

### F. Research programs / specialization (larger refactor)
Replace ~60% of individual nodes with "programs" that gate 3-4 nodes sequentially and demand continued investment (e.g. Graphics Program → 2D Sprites → 256-Color → CD-ROM → 3D). Starting a program commits the player to that path. Other programs become available from a pool.

Needs:
- New data structure: `PROGRAMS = [{ id, name, era, nodeChain: [n1, n2, n3] }]`.
- UI: replace the flat tree with program cards + currently-active-within-program progress.
- Balance pass to make picking programs feel like a real build decision.
- ~1-2 day refactor; content heavy.

### G. Dynamic tree — evolve with the world (larger refactor)
Some nodes appear mid-era based on market heat or rival moves; others obsolete if you don't grab them in time. Tree evolves like the macro economy.

Examples:
- Cold market heat on games triggers a new `n_genre_innovation` node.
- A rival completes `n_llm_research` first → a new `n_llm_distillation` appears ("catch up on the frontier").
- Missing `n_mobile_os` entirely by 2010 → locked permanently.

Needs:
- Event system tie-in: listen for `tycoon:rival-research-completed`, `tycoon:market-heat-shift`, `tycoon:era-shift`.
- Dynamic node pool with `appearsIf` / `obsoletesAt` conditions.
- UI: new nodes fade in with a "NEW" banner; obsolete nodes greyed out with an explanatory strikethrough.
- 1-2 day implementation with content design.

---

## Contract deadlines — missed-deadline penalty (small)

Deadline on contract offers is displayed + enforced at acceptance (buffer over dev duration) but there's currently no penalty for blowing past the deadline. `recordContractDelivery` just reads `proj.criticScore` without comparing ship week to `proj.deadline`.

Quick fix:
- At ship time for `isContract` projects, compare `absoluteWeek()` to `proj.deadline`.
- Weeks late → critic penalty (−2 per week, capped −15) + star cap (max 3★ if late by any amount).
- Maybe a fame hit too for repeat offenders.

Size: 30 min. Worth doing — currently there's no pressure to ship contracts on time.
