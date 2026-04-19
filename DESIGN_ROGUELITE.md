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

### Q1 — The founder itself (foundational: defines lineage model)
What IS the founder across runs?
- **A) Actual family lineage** (Rogue Legacy): heir inherits from parent, has literal name (Chen → Chen Jr → Chen III)
- **B) Apprentices**: each founder trains a handful of candidates during their career; one becomes next founder
- **C) Reincarnation / "spiritual successor"**: same studio lineage but new unrelated founder picks up the mantle
- **D) "Meta-founder"** who is the player; each run is a career phase — never truly dies, but ages/changes

### Q2 — Classic mode coexistence (foundational: architecture fork)
Is "classic tycoon with bankruptcy = game over" still available?
- **A) Roguelite replaces bankruptcy everywhere** — no more game-over; one mode only
- **B) New game starts ask "classic or roguelite"** — two modes coexist
- **C) Difficulty toggle** — "Classic: bankruptcy ends run" vs "Roguelite: spawn heir"

### Q3 — What carries over vs what resets (foundational: save schema)
**Always resets:** cash, team, projects, calendar year (?)
**Decisions to make:**
- Research nodes → reset fully, keep some percentage, or keep "discovery" permanently?
- Fame → reset, keep accumulated lifetime Fame, or convert to a meta-currency?
- Hardware → reset or inherited?
- Achievements → persist across runs (obvious) or per-founder?
- Studio name → reset (new founder, new studio) or keep ("Acme Software" is an institution)?

### Q4 — Run-end triggers (when does a run end?)
What causes a run to end + spawn a new founder?
- **A) Only bankruptcy** — stay focused, keep game-over meaningful
- **B) Bankruptcy + founder retirement (age-out)** — forced rotation even for successful runs; adds "legacy through time" feel
- **C) Bankruptcy + retirement + megacorp exit** — megacorp currently ends the game with a retrospective; convert that into a "cash out, pass the torch" moment too
- **D) Player choice at any point** — "Retire early" button that triggers heir selection

### Q5 — Calendar on new run (timeline behavior)
- **A) Always restart at 1980** — new career, fresh history
- **B) Continue the in-universe timeline** — you went broke in 1994, heir starts in 1994. Game keeps the same era/rivals/platforms but you're re-entering mid-game
- **C) Time skip option** — heir starts "10 years later" so you can choose a different era

### Q6 — Traits model (core gameplay feel)
How traits shape each founder:
- **Rogue-Legacy-lite**: 1-2 quirky traits per founder, mostly mechanical effects ("Night Owl: +20% output at 2× speed, −20% at 1×")
- **Rogue-Legacy-full**: 3-5 traits, some are pure flavor ("Ambidextrous — no effect, just personality"), some are gameplay-swingy
- **RimWorld-inspired**: full passion system — each of the 3 axes (design/tech/polish) can have "burning passion" (big bonus), "interested" (normal), or "none" (big penalty). Plus 2-3 character traits on top.
- **Mix**: RimWorld-style passions + Rogue-Legacy-style flavor traits. "Night Owl" + "Burning design passion" + "Interested in tech" + "No polish passion" → shapes playstyle AND narrative.

### Q7 — Trait inheritance model (depends on Q1 + Q6)
When a new founder spawns:
- **A) Fully procedural** — every heir re-rolls from scratch
- **B) Pure inheritance** — heir gets parent's traits verbatim
- **C) Mutation** — heir inherits 1-2 parent traits + rolls 1-2 new ones
- **D) Player choice** — pick which trait to pass down, then new traits roll

### Q8 — Meta-progression currency (depends on Q3)
What do players earn across runs that shapes future runs?
- **A) Legacy Score** (already exists!) — converted to a shop where you spend on permanent upgrades
- **B) "Lineage stats"** — the family's cumulative critic average, lifetime revenue, etc., unlock new starting options
- **C) Unlocked content** — hit certain milestones in a run → unlock new scenarios, traits, or starting cities/eras
- **D) Permanent buff tree** — skill tree that persists, each tier costs legacy points
- **E) Combination of above**

### Q9 — Scaling across runs
Each new founder: same game, or harder?
- **A) Flat** — every run is 1980, same challenge, difficulty comes from RNG traits
- **B) Progressive unlocks** — after 3 successful runs, you can start in 1985. After 5, 1995. Opens up the late-era gameplay you earned access to.
- **C) Rival scaling** — rivals get meaner on later runs (they've been developing during your absence)
- **D) Traits can be positive or negative** — good runs give heirs mostly positive traits; bad runs yield heirs with handicaps

### Q10 — UI / onramp depth
- **A) Subtle** — new founder spawns, carry-over shown in a quick "Inheritance" modal, then normal gameplay resumes
- **B) Dedicated "Bloodline" tab** — tracks all past founders, their stats, what they unlocked. Separate panel in the tycoon UI
- **C) Full "Roguelite mode" toggle** — classic tycoon mode still exists; roguelite is a separate game mode with its own slot

---

## Initial scope sketch (subject to answers above)

**Phase 0 — Design lock + branch infra**
- Answer the above questions
- Lock a comprehensive design doc
- Phase plan

**Phase 1 — Trait + passion model**
- Traits catalog (20-30 traits with mechanical effects)
- Passion system (3 axes × 3 levels = 9 combos per founder)
- Founder card UI showing traits + passions
- Hook traits into `developOneWeek`/`polishOneWeek` multipliers

**Phase 2 — Run-end detection + heir spawn**
- Detect run-end trigger(s) from answers above
- Roll 2-3 heirs with procedural traits
- Selection modal — player picks which heir takes over
- Minimal inheritance: whatever we locked in Q3/Q5

**Phase 3 — Meta-progression**
- Legacy shop / lineage stats panel
- Cross-run currency tracking
- Progressive unlocks (if picked)

**Phase 4 — Long-term integration**
- Rebalance with roguelite in mind (early-run difficulty spike, mid-run power)
- Achievements for bloodline milestones
- Legacy-screen redesign from "career retrospective" to "generation retrospective"

---

## Risks / things to watch

1. **Trait explosion** — RimWorld-style sim has hundreds of traits. We want quality over quantity. Aim for 20-30 distinct traits that meaningfully alter play.
2. **Runs getting shorter** — if bankruptcy spawns a new founder, there's risk of quick-death-quick-death cycles. Need to balance early-run viability.
3. **Save schema** — roguelite state has to live alongside current save format. SCHEMA_VERSION bump.
4. **Meta-progression trap** — if earning currency makes runs trivially easy, the roguelite loop loses tension. Needs careful curve tuning.
5. **Scope creep into "RimWorld the tycoon"** — relationships between founders, romance, colonist-style psychology... tempting but wrong scope. The founder is already unique; we don't need to simulate their spouse.
6. **Existing v10 features** — legacy decisions, win conditions, Hall of Fame — need to find their place in the new model.
