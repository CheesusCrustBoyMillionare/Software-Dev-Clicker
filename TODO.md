# Feature TODO

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
