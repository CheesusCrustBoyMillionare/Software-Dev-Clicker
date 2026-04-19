# Feature TODO

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
