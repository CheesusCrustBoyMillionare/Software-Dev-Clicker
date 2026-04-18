# Software Dev Tycoon — v2.0 Design Specification

**Status:** Complete design brainstorm. Ready for build-phase execution.
**Scope:** Full rework of clicker → Medium-depth management simulator.
**Target timeline:** ~24 weeks (5-6 months) at ~20 hrs/week solo dev.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Principles](#2-design-principles)
3. [Core Structure](#3-core-structure)
4. [System Designs](#4-system-designs)
   - 4.1 [Project System](#41-project-system)
   - 4.2 [Employee System](#42-employee-system)
   - 4.3 [Economy](#43-economy)
   - 4.4 [Research Tree](#44-research-tree)
   - 4.5 [Market & Rivals](#45-market--rivals)
   - 4.6 [UI Layout](#46-ui-layout)
   - 4.7 [Content Pools](#47-content-pools)
   - 4.8 [Onboarding](#48-onboarding)
   - 4.9 [Endgame & Goals](#49-endgame--goals)
5. [What Stays, What's Gone, What's New](#5-what-stays-whats-gone-whats-new)
6. [Decision Cadence](#6-decision-cadence)
7. [Technical Risks](#7-technical-risks)
8. [Build Phase Plan](#8-build-phase-plan)
9. [Open TODOs for Post-V1](#9-open-todos-for-post-v1)

---

## 1. Executive Summary

**Software Dev Tycoon v2.0** is a full rework of the current clicker game into a **Medium-depth management simulator** spanning the computing industry from 1980 to 2024.

The player founds a software studio in 1980 as a solo founder with $50K. Over a ~7.5-hour playthrough, they build a team, ship projects (contracts + own IP), research new tech, navigate era shifts and rivalries, and pursue one of six victory paths — or collapse into bankruptcy trying.

Core differentiators:
- **44-year historical arc** with 9 authentic computing eras (preserved from existing game)
- **Engineers as real people** with stats, traits, education, bespoke salaries, and retirement
- **Multiple-choice decisions** during projects, gated by team composition and research
- **Dynamic industry** with 3–10 evolving rival studios, scripted macro events, platform lifecycles
- **Multiple victory paths** — become the Industry Titan, IPO exit, Catalog Master, The Acquirer, simply survive to 2024, or achieve the hidden Phoenix bankruptcy-comeback

---

## 2. Design Principles

### Depth: Medium
- Game Dev Tycoon / Mad Games Tycoon territory
- ~7.5hr full playthrough
- Strategic choices, juggling tradeoffs, reacting to market/rivals
- 10-50 employees per playthrough
- 8–15 decision moments per 10 real minutes (one game year)

### Time: Auto-Ticking, Pausable
- **10 real minutes = 1 game year** (50 sec/game month, ~12.5 sec/week)
- Small project (6 months): 5 real minutes
- Large project (24 months): 20 real minutes
- 5 speed buttons: **Pause / 1× / 2× / 4× / 8×** (keyboard 0–4)
- Week-level display prominent ("Week 12, 1985"); salaries biweekly, sales weekly
- **Auto-pause on**: decision moments, crises, launches, reports, employee actions (toggleable)
- **No auto-pause on**: rival news, market updates, achievements (just notifications)
- **Tab blur = pause** by default (opt-out available)
- **No skip-to-event button** — player manages pacing via speed controls

### Structure
- **Scale-up concurrency**: 1 project → 2 → 3+ as studio grows
- **Background rivals**: appear in market reports/press, not full sim
- **Contracts yes**: early-game revenue stream alongside own IP

---

## 3. Core Structure

### Project Flow
Three phases per project, each taking ~1–3 in-game months:

```
[ DESIGN ] → [ DEVELOPMENT ] → [ POLISH ] → LAUNCH → SALES CURVE
   1 mo        3–9 mo            1–2 mo         6–12 month tail
```

### Decision Architecture
- **Design phase**: strategic commitments (type, genre, platform, scope, features, team, own-IP vs contract)
- **Development phase**: multi-axis quality via MC questions (traits/skills unlock answers)
- **Polish phase**: marketing allocation, release date, polish target
- **Time ticks between decisions**: player watches teams work, occasional crisis events, market news

### Player Agency Summary
- Hire decisions weekly (batched quarterly via Hiring Fair)
- Project decisions at phase boundaries + ~5–10 MC moments per project
- Research assignment any time (task-based, engineer auto-returns when done)
- Market/rival reactions (passive notifications, occasional crises)
- Annual performance reviews (batched raises)
- Half-yearly business reports (auto-pause summary)

---

## 4. System Designs

### 4.1 Project System

**Project types (unlock over time):**

| Type | Available | Team profile |
|---|---|---|
| Business Software | 1980+ | Coder + DB |
| Game | 1980+ | Coder + GameDev + Frontend |
| Tool/Utility | 1980+ | Coder + DB |
| Web App | 1995+ | Coder + Frontend + Webdev + Network |
| Mobile App | 2007+ | Mobile + Frontend + Webdev |
| SaaS Product | 2010+ | Cloud + DevOps + Webdev + DB |
| AI Product | 2020+ | AI Agent + Cloud + DevOps |

**Three quality axes:**
- **Tech**: Coder, DevOps, Cloud, Network
- **Design**: Game Dev, Frontend, AI Agent
- **Polish**: DevOps, QA-flavored work, Mobile

Each project type has a weight profile (e.g., Game = 50% Design / 30% Tech / 20% Polish).

**Features picked in Design phase** consume scope points (6 for small, 12 medium, 20 large). Features spawn MC questions during Development.

**Multiple-choice decisions during Development** — narrative questions with 3–4 answer options. Answers gated by:
- Engineer traits (e.g., "Perfectionist" unlocks polish answers)
- Engineer skill tiers (Senior+ unlocks advanced answers)
- Completed research nodes
- Purchased hardware
- Budget
- Time remaining

**Bug system**: crunch and speed accumulate bugs; Polish phase reduces them; user review tanks with high bug counts.

**Platform targeting**: deep lifecycle sim — Launch/Growth/Peak/Decline/Dead phases affect sales multiplier (0.6× → 1.5× → 0.2×). Multi-platform = 1.5× cost, 2–3× reach. Exclusivity deals offer upfront cash for 2-year lockouts.

---

### 4.2 Employee System

**Four core stats (1–10 each, capped by tier):**
- **Design** — UX, gameplay, architecture
- **Tech** — code quality, algorithms, debugging
- **Speed** — output pace
- **Polish** — QA, attention to detail

**8 tiers** (Intern → CTO), each with stat-cap ceilings.

**Trait catalog (~20 traits)**, 1–2 per engineer at hire, can earn 1 more via events:
- **Work style**: Night Owl, Perfectionist, Sprinter, Methodical, Creative
- **Social**: Mentor, Toxic, Team Player, Lone Wolf
- **Career**: Veteran, Innovator, Specialist, Generalist
- **Flaws**: Stubborn, Slacker, Negotiator
- **Legendary (earned only)**: 10× Engineer, Burnout Survivor, Legend, Mentor of Mentors

**Education visible pre-interview** (reuses `c.edu` field 0–4):
- Self-taught, Community College, Bachelor's, Master's, PhD
- Biases stats but doesn't guarantee them
- Signals probable strengths without spoiling exact numbers

**Bespoke salary expectations** — each engineer has a `personalityMult` (0.7–1.4×) set at generation:
- Personality labels shown post-interview: Humble / Fair / Premium / Diva
- Creates "bargains" and "divas" — same stats can ask vastly different salaries

**Growth paths:**
- **Project completion** (passive, main) — +1 to most-relevant stat per shipped project, max +3/year
- **Training programs** (active, requires Training Center building) — ~10% of salary, +1 stat in 8 weeks
- **Mentorship** (passive, emergent) — Mentor trait or Senior+ passive, +0.1/week to junior's stat

**Hiring flow:**
- **Quarterly Hiring Fair** — 4–8 candidates per quarter
- Interview ($1K + 1 week) reveals hidden stats + second trait
- Negotiate for −10/−20% salary (30% chance they walk)
- Headhunter fee ($10K) guarantees a Senior+ candidate

**Reputation gates tier availability**: Fame 0–20 = Interns/Juniors, 50+ = Seniors, 100+ = Staff/Principals, 200+ = Tech Leads.

**Single morale bar (0–100)**, thresholds:
- 85+ **Flow State** (+15% productivity, rare MC answers unlock)
- 40–70 normal
- 25–40 **Discontent** (−20% productivity, raise spikes)
- <25 **Quit risk** (monthly chance to leave)

**Crunch toggle per phase**: +30% speed, −3 morale/week, +50% bug rate.

**Job offers / poaching**: ~1–2 per year total; high-stat engineers with low morale or below-market salary at higher risk. Options: counter, counter +10%, offer equity, let walk.

**Retirement**: existing age/retireAge system. Retired engineers grant lifetime Fame bonus + Hall of Fame entry.

**Founder is permanent** (ON-6b): doesn't retire, ages through full 44 years, stays as active studio lead.

---

### 4.3 Economy

**Starting cash:** $50K default; difficulty toggle (Easy $100K / Normal $50K / Hard $25K).

**Revenue sources:**
- **Contracts** ($20K–$500M depending on era/tier) — 50% upfront + 50% on delivery; hard deadline with penalty
- **Own IP** — upfront cost (salaries during dev), then 6–12 month sales curve driven by critic × marketing × genre × platform × rival penalty × luck
- **Legacy royalties** — **decay over 5 years** (100% yrs 1-3, 75% yr 3-4, 40% yr 4-5, 0% after). Franchise sequels re-boost original's decay clock.
- **Platform cuts**: 30% on closed platforms (PlayStation, iOS), 0% on PC/Web
- **Licensing** (late-game): IP licensing for royalties
- **Consulting** (optional): lock an engineer for $$$

**Expenses:**
- **Salaries** (55–75% of budget, biweekly payroll)
- **Rent** — scales with office tier + era (Garage $0 to Campus $15M/mo in 2024)
- **Marketing** — per-project Polish phase decision, multi-channel allocation
- **R&D** — training + research (engineer time)
- **Overhead** — ~8% of payroll (auto)
- **Loan payments** — if applicable

**Client rating system (ECON-6b)**: 1–5 stars per contract delivery. Per-client-tier average gates unlocks: Small Biz → Enterprise (avg 3.5★) → Tech Giant (4★) → Government (4★ + Fame 100+).

**Multi-channel marketing (ECON-7c):**
- Pick combo during Polish phase
- Era-available channels: Press Kit, Magazine, Trade Show, Radio, TV, Web Banner, Search Ads, Social Media, Influencer, Streaming
- Each has era availability, cost, genre fit (★★★★★ shown per channel)
- Synergies reward combos: Press Kit + Trade Show = "Industry Darling" +10% critic; TV + Magazine = "Mass Market Blitz" +15% reach; Influencer + Social = "Viral Moment" +25% launch week

**Debt/loans:** unlock at Fame 5+, 8–12% APR, 36mo terms; default after 2 missed payments.

**VC rounds:**
- **Seed** (Fame 20+): $500K–$2M for 15–25% equity
- **Series A** (first hit + $1M rev): $5M–$20M for 20–30%
- **Series B/C** ($10M+ rev): $20M–$100M per round for 15–25%
- Growth pressure (VCs get anxious if revenue flat)
- **>50% total dilution = board takeover risk**

**IPO:** $500M valuation + Fame 200+ + 1 Own IP @ critic 85+; 5% banker fees; 6-month roadshow; post-IPO quarterly earnings pressure, missed forecasts → stock drops → morale hits.

**HARD bankruptcy (ECON-5a):**
- 3 warning stages (6mo/3mo/1mo), all auto-pause
- 4-week restructuring phase with options: layoff / emergency VC / sell IP / sell studio
- If unresolved: **game over**, save slot marked DEFUNCT
- Legacy screen shown (total games, years, Fame peak, etc.)
- Start fresh in same slot: +5% starting cash bonus per defunct slot

**Acquisitions two-way:** acquire rivals (3–5× their rev) or be acquired (incoming offers from bigger rivals, optional graceful exit).

**Era inflation:** 3% baseline, 1.5–2× for salaries (wage race).

---

### 4.4 Research Tree

**DAG with era tiers** — nodes grouped 1980s/90s/00s/10s/20s, 0–2 prereqs per node.

**~50 nodes total:**
- 17 Genres (unlock project types)
- 18 Tech Features (unlock features in Design phase)
- 8 Efficiency (permanent studio buffs)
- 4 Platform Expertise (reduces dev cost on specific platforms)
- 3 Business/Policy

**UI: List grouped by era** (RES-1b) — collapsible sections, active research shown, rival race bars.

**Research cost model:**
- **Time + money + hardware prereqs** (RES-6c)
- Node cost range: Small 20–50 RP (1–2mo) → Flagship 500–1000 RP (1.5–3yr)
- Research Point rate: engineer's Tech stat × level bonus × building bonus
- Senior (Tech 7): ~30 RP/week solo

**Hardware prereqs (~15 items):**
- Apple II Dev System ($3K, starts owned)
- IBM PC Dev Kit ($5K, 1981)
- CD Mastering Kit ($20K, 1991)
- SGI Workstation ($50K, 1993) — unlocks 3D Graphics
- 3D Accelerator Card ($5K, 1994) — unlocks FPS
- Motion Capture Studio ($100K, 1995)
- PS1 Dev Kit ($150K, 1995) — unlocks PlayStation Mastery
- Server Infrastructure ($80K + $5K/mo, 1998) — unlocks MMO
- Mac Workstations ($50K, 2008) — unlocks iOS Dev
- Cloud Infrastructure ($30K + $15K/mo, 2009) — unlocks SaaS
- VR Headset Dev Kit ($30K, 2016)
- RTX GPU Cluster ($50K, 2018) — unlocks Ray Tracing
- Cross-Platform Lab ($40K, 2015)
- GPU Compute Farm ($500K + $50K/mo, 2022) — unlocks AI-Assisted Dev

**Research Lab building tiers:** None 1.0× → Basic Lab 1.25× → Research Center 1.5× → R&D Campus 2.0×.

**Task-based assignment (RES-2c)**: engineer assigned to node, auto-returns to project when done.

**Competitive rival races (RES-3a)**: rivals research same nodes; ghost progress bars visible.
- **Pioneer** (first finish): +25% Innovation, +15% launch sales for 2yrs on that genre, +5 Fame
- **Fast Follower** (second): half the Pioneer bonuses
- **Standard**: node unlocks, no bonuses

**Gradual obsolescence (RES-4a):**
- **Hot** 🔥: +25% Innovation, +15% launch sales on projects using it
- **Standard**: baseline
- **Niche**: −10% mass-market, +20% retro/indie audiences
- **Retro**: nostalgia-only

Nodes pass through phases based on year. Research during optimal window = Hot; late-adopt = Standard or lower.

**Starting tech (RES-5b)**: 2D Sprites, BASIC Development, 8-bit Sound, Apple II Dev System all start owned.

---

### 4.5 Market & Rivals

**Dynamic rival roster 3–10 (MKT-1c):**
- Count fluctuates with era — small in 80s, bursts during Internet/Mobile/AI booms, consolidation in between
- Starting rivals (1980): Electrosoft (business), Zeromega (arcade), Telekrats (networking), Pictronix (graphics), Delphi Labs (research)
- Era-appropriate spawns: Nintendon't (1993), Yaboo! (1995), Gargoyle (2000), ApplePie (2008), Fadebook (2010), CloudShove (2015), OmniAI (2022)
- **Alumni founding events**: ex-engineers (yours included) may found competing startups — emergent rivalry
- **Rival exits**: bankruptcy, acquisition by you, acquisition by rival, rare mergers

**Rival behavior sim (lightweight):**
- Quarterly stat updates (no individual-engineer simulation)
- Each rival has: name, tier 0–7, focus genres, quality rating, team size, revenue, market share, personality, upcoming releases
- Ships procedurally-generated projects per genre at their quality ± 15 variance
- **Light narrative events (MKT-2b)**: occasional rival scandals, pivots, leadership changes

**Full market visibility (MKT-3a):** genre popularity + trend arrows visible in Market Panel.

**Genre popularity system:**
- Hand-tuned cyclical curves per genre (Text Adventure peak 80-84, FPS peak 98+, Mobile 10-∞)
- Dynamic modifiers: rival hits (+10/6mo), saturation (−15), zeitgeist events
- Shown as 🔥 Heat count (1–5 scale)

**Platform lifecycle explicit labels (MKT-4a):**
- **Launch** (0.6× sales) — 2yr phase, small install base
- **Growth** (1.1×) — 3–5yr, momentum building
- **Peak** (1.5×) — 5–8yr, biggest audience
- **Decline** (0.7×) — 3–5yr, audience migrating
- **Dead** (0.2×) — nostalgia only

**Launch window collisions:**
- Same-week + same-genre + major rival: −45%
- Same-week + minor rival: −20%
- Same-month: −15%
- Clear window: baseline
- Dominant launch (no major competition): +10%

**Seasonal bonuses (MKT-6a):**
- Holiday (Nov-Dec): +20% games/consumer
- Back-to-school (Aug-Sep): +15% productivity/education
- Q4 fiscal close (Dec): +15% enterprise
- January lull: −10% everything

**15 scripted macro events (MKT-8a)** — anchored to real history:
- 1983 Video Game Crash (−30% game genres, 2yr)
- 1985 NES Industry Recovery (+25% games)
- 1987 Black Monday (−15% revenue, 1yr)
- 1991 Soviet Dissolution / Business Boom (+20% business SW)
- 1995 Internet Boom (+40% web/network tech)
- 1996 PlayStation Launch
- 2000 Dot-com Bubble Burst (−40% web, recovery 2003)
- 2001 iPod Launch
- 2007 iPhone Launch (mobile era begins)
- 2008 Financial Crisis (−25% revenue, 2yr)
- 2010 Cloud/SaaS Revolution (+50% SaaS)
- 2012 F2P Mobile Revolution
- 2016 VR/AR First Wave (spike then bust 2019)
- 2020 Pandemic Digital Surge (+30% digital, 18mo)
- 2022 ChatGPT/AI Moment (+100% AI Products, reshape-all)

**Critic + User scores** (separate):
- Critic formula: weightedQuality + innovation + synergy + marketFit − bugs − collision + luck roll
- User score: 0.6×critic + 0.4×polish + bug factor
- Low user score tanks sales tail faster

**Review quotes**: 60–80 templates per genre × score band with smart variable fills. Example press outlets era-specific (1980s: Compute!, Byte / 2020s: Digital Foundry, The Verge).

**Annual Awards Ceremony (MKT-5b):** auto-pause event.
- 🏆 Game of the Year (Fame +15, +20% sales tail)
- Best in Genre (Fame +5, +10% sales tail)
- Best Innovation (Fame +10, unlocks policy options)
- Lifetime Achievement (retired engineer, Fame +5, Hall of Fame entry)
- Studio of the Year (Fame +25, +5% all sales next year)
- Rising Star (Fame +10, VC/loan favorable terms)

**Fully visible rival research (MKT-7a)** — enables research race tension.

**Acquisitions:**
- Browse rivals in Market Panel, see valuations
- Offer at 3–5× rev; personality determines acceptance
- Inherit roster (30–50% attrition risk) + IP catalog + Fame
- Bigger rivals may offer to buy you — accept for graceful exit

---

### 4.6 UI Layout

**Main screen layout:**
- **Top bar** (always visible): Cash / Fame / Date / Season indicator / Speed controls / Settings
- **Left dock** (8 icons): Office / Projects / Team / Research / Finance / Market / Hall of Fame / Settings
- **Center**: Office view (default) + Current Project Status widget
- **Bottom**: Event log ticker (scrolling recent notifications)

**UI choices locked:**
- **UI-1b**: Abstract visual office (pixel-art, teams clustered, no mechanic in positioning)
- **UI-2b**: Office view centered + project status widget
- **UI-3c**: Hybrid era theming — core panels consistent, era flavor in background/top bar/fonts/icons
- **UI-4b**: Desktop + tablet (no mobile)
- **UI-5b**: Dock-based panels open as ~70% overlay
- **UI-L1a**: Office centered, not project-pipeline centered
- **UI-L2a**: Dock left-side vertical
- **UI-L3a**: Panels overlay office (not replace)
- **UI-L4a**: Top-down pixel art style (extends current desk scene)
- **UI-L5a**: Bottom ticker for event log
- **UI-L6a**: Hall of Fame gets dedicated dock icon
- **UI-L7b**: Era theming on by default, toggleable for accessibility
- **UI-L8b**: Color + pattern everywhere (no color-alone meaning)
- **UI-L9a**: Era-appropriate sound palette (chiptune → CD-quality → orchestral)

**Keyboard shortcuts:**
- `0–4`: Speeds (Pause, 1×, 2×, 4×, 8×)
- `Space`: Toggle pause
- `O / P / T / R / F / M / H`: Open respective panels
- `,`: Settings
- `Esc`: Close panel / cancel modal
- `Enter`: Confirm modal default
- `/`: Global search (find engineer/project/rival)

**9 modal types:**
1. MC Decision (most frequent)
2. Hiring Fair
3. Performance Review Batch (annual)
4. Project Launch (celebration)
5. Awards Ceremony (annual)
6. Research Complete
7. Macro Event (era splash)
8. Bankruptcy Warning (3 stages)
9. Acquisition Offer (incoming/outgoing)

**Notification hierarchy:**
- **Toast** (top-right, dismissible, no pause) — routine info
- **Event log** (bottom ticker, persistent) — all notifications accumulate
- **Modal** (center-screen, auto-pause) — decisions/crises/launches

**Era theming distribution (UI-3c):**
- **Themed**: desktop/office background, top bar chrome, font family, cursor, transitions, button styles, toasts
- **Consistent**: panel layouts, tables/charts/forms, MC modal structure, data density

**Responsive:**
- Desktop 1024px+: full dock + labels, ~70% overlay panels
- Tablet 768–1023px: icon-only dock, full-width panels, scrollable tables
- Mobile <768px: unsupported (friendly message)

---

### 4.7 Content Pools

**Total content: ~25,750 words** across all pools.

**MC Question Templates (~130 total):**
- 60 feature-triggered (spawn when player picks a feature in Design)
- 50 era-zeitgeist (random pool per era × project type, ~10 per era × 5 eras)
- 20 crisis events (random interrupts during Dev)
- Each has 3–4 answer options; many gated by traits/skills/research/hardware

**Features (~60 across 6 project types):**
- Games: ~18 (Save System, Multiplayer, Character Customization, etc.)
- Business SW: ~10 (File Import, Multi-User, Reports, etc.)
- Web App: ~8 (User Accounts, Payments, API, etc.)
- Mobile App: ~10 (Push Notifications, IAP, AR, etc.)
- SaaS: ~8 (Auth, Webhooks, SSO, etc.)
- AI Product: ~8 (Model Training, Inference API, Safety Filters, etc.)
- Each has scope cost, requirements (research/hardware/engineer), era availability, quality impact, associated questions

**Platform Catalog: 20 mechanical + 15 flavor:**
- Mechanical platforms affect Design phase: Apple II, IBM PC/DOS, C64, Macintosh, Amiga, NES, SNES, Genesis, Windows, PlayStation (1-5), N64, Xbox, Web, iOS, Android, Nintendo DS/3DS, Wii/Switch, Steam, Cloud, VR
- Flavor platforms (Atari 2600, Neo Geo, Dreamcast, Windows Phone, etc.) appear in news/market for era authenticity

**Event Templates (~30):**
- 10 Crisis (Press Leak, Intern Deletes Code, Key Engineer Poached, etc.)
- 10 Flavor (Engineer got married, Team movie night, Office pet, etc.)
- 10 Opportunity (Celebrity Endorsement, Conference Keynote, Partnership, etc.)

**Review Quotes: 60–80 templates** per genre × score band, with smart variable fills:
- 5 score bands × ~12 genres with ~2 templates per cell
- Era-appropriate press outlets (1980s: Compute!, Byte / 2020s: Digital Foundry, The Verge)

**Macro Events: 15 scripted** (listed in Section 4.5).

**Name generators:**
- Project names: combinatorial (extending existing parody generator)
- Rival studios: ~30 pre-written + combinator for extras
- Rival game titles: procedural combination
- Engineer names: existing FIRST_NAMES + LAST_NAMES

**Content production approach:**
- **CON-1b**: Medium content scope
- **CON-2a**: Per-type feature specialization
- **CON-3a**: 20 + 15 platforms
- **CON-4a**: Template-based review quotes with variable fills
- **CON-5a**: English-only launch, community localization post-v1
- **CON-6a**: Gentle/affectionate parody tone (matches existing Microhurt, VisiCrash tone)
- **CON-7a**: No UGC/mods at launch
- **CON-8a**: Human-written with AI assist

---

### 4.8 Onboarding

**Character creator (lightweight):**
- Studio name (with auto-suggestion)
- Founder name
- Specialty (one of: Coder, Frontend, Game Dev, Database — 4 options)
- Trait (one of: Perfectionist, Sprinter, Methodical, Creative — 4 options)
- Difficulty (Easy $100K / Normal $50K / Hard $25K)
- Guided Start toggle (default on)

**Day 1 in 1980:**
- Solo in garage, $50K cash
- First contract brief in inbox (scripted: "Compute Inc. needs a payroll calculator — $18K, 3 months")
- Contextual tooltip pointing to Accept button

**15-minute guided first project:**
- Minutes 0–1: Accept contract → Design phase with feature picker (4 features to choose from)
- Minutes 1–6: Development phase with 2 scripted MC questions + tutorial bubbles
- Minutes 6–9: Polish phase with marketing/release decisions (simplified for contract)
- Minutes 9–11: Launch celebration — client rating, payment, Fame
- Minutes 11–15: Second contract arrives + Hiring Fair icon pulses for first time

**Progressive panel reveal:**
- Day 1: Office / Projects / Finance / Settings (4 icons)
- Month 3 (after 1st ship): Team panel unlocks
- Month 6 (after 1st ship): Market panel unlocks
- Month 12 (game-year 1): Research panel unlocks
- First award / Fame 5+: Hall of Fame unlocks

**Contextual hints system (~40 hints):**
- Fire once per career save on first occurrence of key events
- Single-sentence bubbles with optional highlight/arrow
- Examples: first morale drop, first crunch, first rival poach, first VC eligibility, first IPO eligibility, first bankruptcy warning, first retirement
- Toggleable in settings

**Founder is permanent (ON-6b):**
- Doesn't retire, plays through full 44-year arc
- Ages normally (25ish → 70ish)
- Stats grow normally, promotions available
- Can be demoted to "advisory" role (reduced work contribution, passive morale buff)
- Immune to quit from low morale (can't quit themselves — they own the company)

**5–6 preset scenarios:**
1. **First Studio (Tutorial)** ⭐ default — 1980, Normal, Coder specialty, guided on
2. **Sandbox 1980** — 1980, any difficulty, no tutorial
3. **Mid-80s Game Shop** — 1985, smaller budget, Game Dev locked
4. **Dot-Com Bust Survivor** — 2001, $200K cash, rival chaos
5. **AI Revolution** — 2022, $5M cash, short playthrough to 2024
6. **Custom** — pick any year, cash, specialty, team size

**Minimal narrative (ON-8a):** mechanics-focused. Light narrative (founder diary vignettes) is a stretch goal.

**Accessibility baked in (ON-9b):** colorblind-safe palettes, text scaling (Normal/Large/XL), reduced motion toggle, keyboard-only navigation, screen-reader labels.

**Auto-save:** on tutorial completion, every game-year, before major events (IPO, acquisition, VC), on tab blur.

**Save recovery (per ECON-5a):** bankruptcy → legacy screen → restart fresh in same slot (+5% cash per defunct slot) or load last auto-save (up to 1 game-year back).

---

### 4.9 Endgame & Goals

**Multiple win paths (END-1a):**

| Path | Trigger | Tone |
|---|---|---|
| 🏛️ Industry Titan | Fame 500+ maintained 2 years | Prestige |
| 📈 The Exit (IPO) | IPO at $500M+ valuation | Financial ambition |
| 🎮 Catalog Master | 25+ own-IP titles, avg critic 80+, 10+ awards | Creative artistry |
| 🏰 The Acquirer | 3+ rival acquisitions + tier 6/7 megacorp | Empire |
| 📅 Reach 2024 | Survive the arc without bankruptcy | Survival |
| 💀 Phoenix (hidden) | Bankruptcy + restart + IPO in next run | Comeback |

Multiple wins stack per Career; retrospective shows all achieved.

**2024 soft end (END-2a):** game continues in sandbox mode past 2024; no new era content; player chooses when to end Career.

**Late-game freshness (END-3a, all four strategies):**
1. **Subsidiary Studios** (unlock Fame 200+ and $50M rev, END-4a)
   - Mini-studios under umbrella (5 engineers, genre-focused)
   - Auto or manually managed
   - Contribute to parent catalog + revenue
2. **Scripted late-era events (2015–2024)**
   - 2015 Twitch boom
   - 2016 VR hype/crash
   - 2018 Crypto/NFT craze
   - 2019 Subscription economy
   - 2020 Pandemic surge
   - 2022 AI moment
   - 2023 Regulatory reckoning
   - 2024 Industry Reorganization
3. **Increasing stakes** — market consolidation, megacorp wars, anti-trust scrutiny
4. **Legacy Decisions (END-9a, unlock 2020+):**
   - Philanthropy (convert Fame to legacy score)
   - Take Company Private (reverse IPO)
   - Spawn Spin-off (sets up future roguelite)
   - Sell to Megacorp (massive cash exit)
   - Foundation (pivot to nonprofit)

**~50 achievements (END-6a):**
- Early career (years 1–5): ~10
- Mid career (years 5–20): ~15
- Late career (years 20–44): ~15
- Secret/weird: 7 (Phoenix Rising, Renaissance Master, Tech Completionist, Methuselah, Zero to Hero, Industry Legend, Alumni Network)
- Each triggers celebration toast, Hall of Fame entry
- Some grant small permanent bonuses

**Trophy Room in Hall of Fame:** all GoY, Best-in-Genre, Studio of the Year awards accumulate across career with dates + game titles.

**Detailed retrospective screen (END-5a):**
- Win paths achieved
- By-the-numbers (Peak Fame, Total Revenue, Titles Shipped, Awards Won, Peak Team, Office Tier, Research Nodes)
- Legacy Games (critic 90+ with year/score)
- Key Moments timeline (first hit, bankruptcy close calls, IPO date, major acquisitions)
- Achievement completion count

**Shareable summary card (END-7a):** pre-formatted for social media.

**Post-victory (END-8a):** player chooses "Continue Playing" (sandbox mode continues) or "End Career" (save slot marked COMPLETED but still loadable).

---

## 5. What Stays, What's Gone, What's New

### ✅ What Stays from Current Game

| Current | Tycoon use |
|---|---|
| 10 engineer types (Coder, Frontend, etc.) | Unchanged — core specializations |
| Era visual themes (9 eras) | Unchanged — perfect anchor |
| Retirement system (age/retireAge) | Unchanged — slots in perfectly |
| News headlines | Unchanged — historical flavor |
| Save slots (3 career slots) | Unchanged |
| Parody name generator | Becomes both your games + rival games |
| Engineer rarities (C/U/R/E/L) | Could be reused for trait rarity / candidate quality |

### ❌ What's Gone

- Clicking the monitor (no clicker mechanic)
- LoC/Pixels/Queries/etc. as global resources (replaced with project-local progress + $)
- Hire Packs (hiring is per-candidate with interview)
- Instant ships (projects take in-game months)
- Click streaks, click power, auto-click perks
- Prestige resets (no reset mechanic)
- Old skill tree as passive perks (becomes research tree + company policies)

### 🆕 What's New

- Full project pipeline (Design → Dev → Polish)
- Team-based assignment system
- Multiple-choice decisions during development
- Feature list at design
- Research tree with hardware prereqs
- Rival studios (dynamic 3-10 roster)
- Market with genre popularity, platform lifecycles, macro events
- Economy with VC/IPO/bankruptcy/acquisitions
- Annual awards ceremony
- Subsidiary studios (late-game)
- Legacy decisions (late-game pivots)
- Multiple win paths with retrospective

---

## 6. Decision Cadence

Target: **1 meaningful decision per minute or less** outside project phases; **1 per ~20–40 real seconds** during project Development.

| Event | Frequency | Auto-pause? |
|---|---|---|
| MC questions (Dev phase) | Every 2–4 game weeks during project | ✅ |
| Hiring Fair | Quarterly (4–8 candidates batched) | ✅ |
| Performance Reviews | Annual batch (January) | ✅ |
| Poach events | 1–2 per year total (rare) | ✅ |
| Half-yearly business reports | Twice per year (Jan + Jul) | ✅ |
| Market news | Monthly passive notifications | ❌ |
| Crisis events | 2–4/year, rare | ✅ |
| Macro events (scripted) | ~one every 3 game years | ✅ (splash) |
| Project launches | End of each project | ✅ |
| Awards ceremony | Annual (end of game year) | ✅ |
| Research completion | When engineer finishes node | Toast only |
| Rival news | Varies (shipments, mergers, scandals) | ❌ |
| Employee retirements | When age ≥ retireAge | Popup |

**Automation unlocks** scale with studio growth:
- **HR Policy setting** (unlocks with first office perk): auto-approve raises under X%
- **Recruiter support staff**: auto-pre-screens Hiring Fair candidates
- **Trainer**: auto-assigns training programs within budget
- **COO (late-game)**: auto-handles routine decisions, player intervenes for strategic only

---

## 7. Technical Risks

Sorted by severity × likelihood. Mitigations included.

### 🔴 Critical

#### Risk 1: Single-file HTML architecture at 20,000+ lines
**Current**: ~8,000 lines. Tycoon rework will push to **18,000–25,000**.

**Impact**: Unmaintainable at scale — hard to navigate, debug, hot-reload, cognitively track.

**Mitigation (recommended)**: **Split dev files + concat build step**. Keep 1-file distribution (easy deploy), develop in modular files. A simple `build.sh` concatenates `src/*.js` into `dist/game.html`. Minimal deploy change, huge dev QoL.

**Alternative**: ES modules via `<script type="module">` — works natively in modern browsers.

**Must address by**: Phase 1 start.

#### Risk 2: Save schema migration
**Impact**: All existing saves break. Tycoon data model is fundamentally incompatible with clicker save shape.

**Mitigation (recommended)**: Break old saves cleanly. Banner warns users before upgrading. Old saves viewable as read-only "Clicker Archive" showing shipped titles + achievements for nostalgia. Dev cost: ~3 days.

**Alternative**: Dual-mode (Classic + Career) — doubles code maintenance.

**Must address by**: Phase 1 start.

### 🟠 High

#### Risk 3: Content production workload (~26K words)
**Impact**: Writing is a second job parallel to coding. Placeholder text = hollow game feel.

**Mitigation**: AI-assisted first drafts + manual polish (3–5× faster than cold writing). Content as editable JSON for mid-alpha iteration. Ship at 60% content, expand in updates. Community translation post-v1.

**Must address by**: Phase 4 latest.

#### Risk 4: Balance testing without real playtesters
**Impact**: Cascading balance problems in interlocking systems. Solo devs can't play enough.

**Mitigation**: Debug console (jump-to-year, set-cash, force-event) from Phase 1. Simulation script for headless auto-play runs. Local-only telemetry. Alpha testers by Phase 4. Explicit "difficulty curves" document.

**Must address by**: Phase 1 (debug tools); Phase 4 (testers).

#### Risk 5: Scope creep
**Impact**: Enthusiasm + no deadline = endless feature expansion. Solo dev at risk.

**Mitigation**: Strict MVP definition with cut line. "V2 Ideas" file for temptations. Monthly review of scope drift. Time-box each phase; cut features rather than extend.

**Must address by**: Continuous discipline.

### 🟡 Medium

#### Risk 6: Performance at 8× speed
**Mitigation**: Batch updates, lazy panel rendering, virtual scroll for long lists, requestAnimationFrame for UI updates, profile early in Phase 2.

#### Risk 7: Save state growth
**Mitigation**: Cap event log to 500 entries (rolling). Compress save with LZ encoding. Export-save to JSON file. Summarize old career data. Consider IndexedDB if localStorage insufficient.

#### Risk 8: Era theming maintenance with new panels
**Mitigation**: Hold UI-3c discipline — core panels stay consistent; era theming only affects background/top bar/fonts/icons.

#### Risk 9: Tablet usability
**Mitigation**: Touch-first interactions, test on real iPad/Android early, responsive at 768/1024/1280 breakpoints. Budget 1 week of tablet polish in Phase 5.

#### Risk 10: Player-dependent time estimates
**Mitigation**: Test content density at all speeds. Decision auto-pause is speed-independent so density holds.

### 🟢 Low

#### Risk 11: Accessibility post-hoc pain
**Mitigation**: Semantic HTML habits from start; accessibility checklist per component.

#### Risk 12: Audio asset complexity
**Mitigation**: Stick with synthesized chiptune/SFX for v1. Defer music per era.

#### Risk 13: Save format evolution during dev
**Mitigation**: Version-tag migration helper from day 1 so alpha testers don't lose progress.

### Risk Summary Table

| Risk | Severity | Must address by |
|---|---|---|
| Single-file architecture at 20K+ LOC | 🔴 | Phase 1 start |
| Save schema migration | 🔴 | Phase 1 start |
| Content production workload | 🟠 | Phase 4 latest |
| Balance testing | 🟠 | Phase 1 / Phase 4 |
| Scope creep | 🟠 | Continuous |
| Performance at 8× | 🟡 | Phase 2–3 |
| Save state growth | 🟡 | Phase 5 |
| Era theming maintenance | 🟡 | Continuous discipline |
| Tablet usability | 🟡 | Phase 5 |
| Time estimates | 🟡 | Phase 4 balance |
| Accessibility | 🟢 | Build habits |
| Audio complexity | 🟢 | Cut from v1 |
| Save schema evolution | 🟢 | Phase 1 setup |

---

## 8. Build Phase Plan

Seven phases, each ending in a **playable state** for incremental playtesting.

**Assumption**: Solo dev, ~20 hrs/week focused work.

### Phase 0: Prep & Infrastructure (1 week)
**Goal**: Set up successfully.
- Build pipeline (split dev files → single distribution HTML)
- Save version tagging + migration helper
- Debug console (jump-to-year, set-cash, force-event, reveal-all)
- "V2 Ideas" file for scope-creep temptations
- Decide: strip clicker OR keep as classic mode
- Gut current game's click mechanics, prestige, resources

**Playable**: Current game, now in modular dev files.

### Phase 1: Core Project Loop (3–4 weeks)
**Goal**: One project, end-to-end.
- Project data model (type, genre, scope, features, phases, team)
- 3-phase flow (Design → Dev → Polish)
- Feature picker UI (abbreviated: ~20 features for Games + Business only)
- Basic MC question system (10 hard-coded templates)
- Quality axes (Tech/Design/Polish) tracking
- Launch → critic score → sales curve
- Projects panel basic UI
- Time ticker (auto-tick, pause, 1×/2×)
- Bare office view (sprites, no teams yet)
- Single founder (you)

**Playable**: 1980 founding, one contract, ship, see review. Core loop closed.

**Dev time**: 80 hours.

### Phase 2: Economy & Hiring (2–3 weeks)
**Goal**: Fund yourself, build a team.
- Full economy (cash, revenue, expenses, salaries biweekly)
- Finance panel
- Contract queue with 4 client tiers
- Client rating system (ECON-6b)
- Hiring Fair (quarterly, candidate cards with education pre-reveal)
- Interview system
- Employee system (4 stats, ~10 traits, morale, bespoke salaries)
- Team panel (Roster + Hiring tabs)
- Bankruptcy warnings (safeguards, not hard-fail yet)
- Loan system

**Playable**: Studio with 5–10 employees, 3–5 years played (1980–1985ish). Income/expenses balance.

**Dev time**: 60 hours. Profile performance here.

### Phase 3: Teams & Research (3–4 weeks)
**Goal**: Specialization and long-term investment.
- Teams panel (F3: named team groups, drag engineers, synergy math)
- Team-to-project assignment
- Research tree (abbreviated: ~20 nodes instead of 50)
- Research panel (RES-1b list view)
- Hardware purchases (subset: ~6 key items)
- Research races with 2 rivals (basic)
- Era progression (visual theme shifts at landmark years)
- Macro events (subset: 5 scripted)
- More project types unlock (Web App, Mobile, SaaS)

**Playable**: 10+ year playthrough possible. Strategic specialization matters. ~1995 reachable.

**Dev time**: 80 hours.

### Phase 4: Market & Rivals (2–3 weeks)
**Goal**: A living industry.
- Full rival simulation (dynamic 3–10 roster)
- Rival events (spawn, exit, mergers, acquisitions)
- Market panel (genre heat, platform health, upcoming releases)
- Full platform system (H3: lifecycles, cuts, exclusivity, ports)
- Multi-channel marketing (ECON-7c)
- Launch collision penalties
- Awards ceremony (annual, with effects)
- Review quote generation
- Macro events filled in (10 total)
- Basic acquisitions (you acquire rivals)

**Playable**: Full 44-year arc technically playable. Industry feels alive.

**Dev time**: 60 hours. **Alpha testers join here.**

### Phase 5: Endgame & Polish (3–4 weeks)
**Goal**: Satisfying finale.
- VC rounds + cap table
- IPO event + post-IPO pressure
- Hard bankruptcy + legacy screen
- Subsidiary Studios (END-4a)
- Legacy Decisions (END-9a)
- All 15 macro events
- Awards trophy room in Hall of Fame
- Retrospective screen
- Share summary card
- ~50 achievements
- Full 50-node research tree
- Full 130 MC templates (content complete)
- Balance pass #1 (alpha feedback)
- Performance pass (8× speed reliable)
- Tablet UX polish
- Era theming completeness check

**Playable**: Feature-complete. Any win path achievable.

**Dev time**: 80 hours.

### Phase 6: Scenarios, Balance, Playtest (2–3 weeks)
**Goal**: Fun at every difficulty.
- 6 scenarios implemented
- Difficulty tuning (Easy/Normal/Hard balancing)
- Balance pass #2
- Onboarding polish
- Content polish (writing quality, tone consistency)
- Bug fixing from alpha feedback
- Accessibility audit

**Playable**: Beta-ready.

**Dev time**: 60 hours.

### Phase 7: Release Prep (1–2 weeks)
**Goal**: Ship it.
- Final bug triage
- Save compression + export/import tooling
- Version announcement / changelog
- Landing page / README update
- Classic Clicker archive view
- Release build + deploy
- Community channels (Discord / GitHub Issues)

**Dev time**: 30–40 hours.

### Full Timeline

| Phase | Focus | Duration | Cumulative |
|---|---|---|---|
| 0 | Prep / infra | 1 week | 1 wk |
| 1 | Core project loop | 3–4 wks | 5 wks |
| 2 | Economy + hiring | 2–3 wks | 8 wks |
| 3 | Teams + research | 3–4 wks | 12 wks |
| 4 | Market + rivals | 2–3 wks | 15 wks |
| 5 | Endgame + polish | 3–4 wks | 19 wks |
| 6 | Scenarios + balance | 2–3 wks | 22 wks |
| 7 | Release prep | 1–2 wks | **23–24 wks** |

**Total: ~5–6 months** at 20 hrs/week (realistic: **6–9 months** with interruptions).

### MVP Cut Line

**Ship after Phase 3** for a minimum viable playable version:
- 1980 start, playable to ~1995
- Core loop (projects, teams, hiring, research)
- Limited content (20 features, 20 research nodes, 10 MC templates)
- No rivals, no endgame
- ~12 weeks of work

This is a **vertical slice alpha** — good for soliciting feedback before committing the remaining 12 weeks.

### Decision Gates

- **End of Phase 1** (~5 weeks): "Does the core loop feel fun?" — continue or rework
- **End of Phase 3** (~12 weeks): "Ship MVP for feedback, or continue?"
- **End of Phase 5** (~19 weeks): "Ready for closed beta?"
- **End of Phase 6** (~22 weeks): "Ready for release?"

---

## 9. Open TODOs for Post-V1

### 🔴 MAJOR SYSTEM: Roguelite Meta-Progression (Founder Lineage)
**Status**: Shelved for post-v1 major update. Est. 4–6 weeks of design + implementation.

**Concept**: Each playthrough (founder + studio lifetime) becomes a "Career" in a studio lineage. Careers persist across games, forming meta-progression.

**Planned mechanics:**
- **Legacy Points (LP)** — meta-currency earned per Career (years survived, hits, awards, IPO, Fame)
- **Legacy Tree** — spend LP on permanent unlocks (starting traits, scenarios, cash bonuses, IP heirlooms)
- **Alumni Appearances** — past founders echo in new runs as rivals, consultants, acquisition targets
- **Legendary Founders** — earn permanent traits for future founders
  - "Industry Legend" (Fame 500+ at 2024)
  - "Unkillable" (survive 3 bankruptcies)
  - "Visionary" (5× Game of the Year)
  - "Prolific" (ship 50+ titles)
- **Ascension / difficulty rolls** — Slay-the-Spire-style ramps after each Career
- **Persistent Universe mode** (opt-in) — past studios' games exist in future runs' lore/market
- **Founder Gallery** — view all past founders, pick "Featured Founder" to mentor new run

**Implementation requirements:**
- New meta-save system separate from career saves
- Legacy tree UI
- Founder gallery UI
- Scenario unlock browser
- Alumni event templates (~20–30 new events)
- Legendary trait catalog (~15 new traits)
- Retroactive LP crediting for existing save slots

**v1 silent groundwork**: even without roguelite live, track these fields in save data to make future launch painless:
- Career summary on game end (founder stats, years, Fame peak, IPO, awards, shipped titles)
- LP accrual formula (calculated silently, stored hidden)
- Bankruptcy event records with conditions
- Retired employee pool (for future Alumni events)
- Cross-save lineage markers

---

### 🟡 Card Mechanic (in addition to MC questions)
**Status**: Revisit post-v1 as supplement to MC system.

**Concept**: Studio builds a card deck over time — earned from research, veteran employees, past projects. During any phase, player has a hand of 3–5 cards to play at any moment (not gated to MC moments).

- MC = scripted decisions at milestones
- Cards = tactical plays whenever

**Example cards:**
- "Code Review Day" — +5 Polish, −1 week, needs Senior engineer
- "Marketing Push" — burn cash for +10 hype
- "Veteran Tricks" — −2 weeks on current phase (🔒 requires CTO-tier engineer)
- "Architectural Rewrite" — reset Tech axis but +20 ceiling (🔒 requires 2 Seniors)

**Open questions:**
- How do you earn cards? (ship projects, research, employee traits, events)
- Hand size / deck size caps?
- Consumable vs. reusable cards?
- Do rivals use cards too?
- UI — card hand at bottom? Deck browser?

---

*End of design specification. Ready for build phase execution.*
