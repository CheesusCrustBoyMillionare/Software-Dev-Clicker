# Game Dev Clicker - Patch Notes

## v1.0 - Initial Release
- Core clicker game with game development theme
- 8 generators: Rubber Duck, Stack Overflow Tab, Intern, Junior Dev, Senior Dev, AI Copilot, Dev Team, Game Studio
- 3 click upgrades: Mechanical Keyboard (x2), Energy Drinks (x5), Flow State (x20)
- Prestige system: ship a game at 1M LoC to earn Fame
- Fame provides permanent x0.1 multiplier per point to all production
- 3 Fame upgrades: Marketing Team, Publisher Deal, Engine License
- localStorage autosave every 30s + on page close
- Single requestAnimationFrame loop with delta-time
- Event delegation, CSS-only animations, single-file build

## v1.1 - Generator Buff
- Increased all generator LoC/s rates by 10x

## v1.2 - Best Value Indicator
- Generators with the best LoC/s per LoC cost are now highlighted with a green border and glow
- Recalculates every frame as prices change

## v1.3 - Click Upgrade Cost Reduction
- Halved base cost of all click upgrades (100 -> 50, 5000 -> 2500, 500000 -> 250000)

## v1.4 - Click Power Scales Generators
- Generator LoC/s now scales with the click power multiplier
- Energy Drinks, Mechanical Keyboard, and Flow State all boost passive income too

## v1.5 - Generator Description Update
- Generator descriptions now show "clicks/s" instead of "LoC/s"

## v1.6 - Scaling Ship Threshold
- Each game now requires 10x more LoC to ship than the previous
- Game 1: 1M, Game 2: 10M, Game 3: 100M, etc.

## v1.7 - Career Save Slots
- Added save slot selection screen on launch with 3 career slots
- Each slot previews Fame and games shipped, or shows "Empty"
- Separate localStorage key per slot

## v1.8 - Click Upgrade Rework
- **Mechanical Keyboard**: Changed from x2 multiplier to +1 flat LoC per click (stacks additively, cost scales at 1.5x)
- **Energy Drinks**: Changed from x5 to x2 multiplier per purchase on all production and clicks
- **Flow State**: Changed from x20 permanent to x10 buff for 5 seconds every 60 seconds
- Added Flow State timer display showing active countdown and time until next activation
- Generators now scale with Energy Drinks multiplier instead of old click multiplier

## v1.8.1 - Generator Scaling Fix
- Fixed generators not scaling with Mechanical Keyboard bonus (was lost in v1.8 rework)
- Generator LoC/s now correctly multiplied by (1 + keyboards owned) again

## v1.8.2 - Keyboard Cost Scaling
- Reverted Mechanical Keyboard cost scaling from 1.5x back to 10x per purchase (matches original scaling)

## v1.8.3 - Power Up Price Increase
- Doubled base cost of all click power ups (Keyboard 50->100, Energy Drinks 2500->5000, Flow State 250000->500000)

## v1.9 - Year System & Console Ship Animations
- Each shipped game now represents a year, starting from 1979
- Year displayed in the top bar and on the ship button
- Replaced simple text transition with era-appropriate console animations on ship:
  - 1979-1982: Atari 2600 — cartridge slides into console
  - 1983-1989: NES — cartridge slides into top-loader
  - 1990-1993: SNES — cartridge slides into console
  - 1994-1998: N64 — cartridge slides into console
  - 1999-2004: PS2 — disc slides into front slot
  - 2005-2009: Xbox 360 — disc slides into tray
  - 2010+: PC with "Smoke" app — download progress bar animation
- All console art is pure CSS, no images

## v1.9.1 - New Game on Save Slot
- Non-empty save slots now show a "New Game" button
- Clicking it prompts "Erase this save?" with Yes/No confirmation
- Confirming deletes the save and refreshes the slot list to show "Empty"

## v1.9.2 - Slower Ship Animation
- Slowed all ship transition animations by 5x (overlay 3.5s->17.5s, cartridge/disc insert 1.8s->9s, download bar 2.5s->12.5s)

## v2.0 - Fame Skill Tree
- Replaced flat "Fame Upgrades" section with a 4-branch skill tree
- Upgrades unlock sequentially within each branch (need previous at level 1+)
- Visual tree layout with vertical lines and node dots in branch colors
- **Generator branch (green):**
  - Overclock: +25% generator speed per level (max 5)
  - Bulk Discount: -10% generator costs per level (max 3)
  - Team Synergy: +1% bonus per distinct generator type owned (max 1)
- **Click Power branch (blue):**
  - Double Tap: +100% click power per level (max 3)
  - Macro Script: 1 auto-click/s per level (max 5)
  - Code Frenzy: Flow State gives 50x to clicks instead of 10x (max 1)
- **Prestige branch (orange):** existing Marketing Team, Publisher Deal, Engine License unchanged
- **??? branch (gray):** 3 locked placeholders for future development
- Backward-compatible saves: old saves auto-migrate with new upgrade keys defaulting to 0

## v2.1 - Employees & Equipment
- Renamed all generators to programmer career tiers: Intern, Junior Dev, Mid-Level Dev, Senior Dev, Staff Engineer, Principal Engineer, Tech Lead, CTO
- Renamed "Generators" section to "Employees"
- Added per-employee upgrade submenu with collapsible toggle (+/−) button
- 3 equipment upgrades per employee:
  - Desk: +50% speed (×1.5 per level)
  - Chair: +75% speed (×1.75 per level)
  - Computer: +150% speed (×2.5 per level)
- Equipment multipliers stack multiplicatively per upgrade type
- Equipment costs scale with both upgrade growth rate and employee base cost
- Equipment resets on ship (same as employees)

## v2.2 - Office Perks
- Replaced "Click Power" section (Mechanical Keyboard, Energy Drinks, Flow State) with "Office Perks"
- 6 new company-benefit-themed upgrades with unique mechanics:
  - Energy Drinks: +25% all production per level (additive)
  - Catered Lunches: +1 LoC per click per employee owned (scales with workforce)
  - Standing Desks: -10% employee hire costs per level (multiplicative discount)
  - On-Site Daycare: ×1.5 all production per level (multiplicative)
  - Game Room: +50% click power per level
  - Nap Pods: every 45s, gain 10s of production as instant burst (scales with level)
- Updated Fame skill tree "Code Frenzy" to enhance Nap Pod bursts (5× stronger) instead of old Flow State
- Removed flow timer system, replaced with nap pod burst timer
- Each perk has its own growth rate (3×–10×) for varied cost progression

## v2.3 - Bulk Buy
- Added quantity selector bar at top of sidebar: ×1, ×5, ×25, Max
- Applies to both Employees and Office Perks
- Max buys as many as you can currently afford
- Cost display updates to show total bulk cost
- Quantity clips to max affordable when you can't buy the full amount

## v2.4 - Single Purchase Cap
- Accessory upgrades (Desk, Chair, Computer) are now single-purchase per employee
- Office Perks are now single-purchase (shows ✓ when owned, hides cost)
- Per-employee LoC/s rate shown next to each employee row
- Best-value green highlight now factors in accessory multipliers (euMul)
- Max button shows affordable count when hovering over an employee

## v2.5 - Office Expansion & Code Animation
- Renamed "Energy Drinks" to "Free Energy Drinks"
- Made Fame skill tree layout symmetrical (branches mirror evenly around hub)
- 4 new Office Perks (10 total):
  - Pet-Friendly Office: +1 auto-click/s
  - Gym Membership: +30% all production
  - Unlimited PTO: -15% employee hire costs
  - Company Retreat: ×2 all production
- Monitor now shows code lines appearing with each click (30 game-dev-themed snippets cycling)
- Fixed per-employee rate display to include Gym Membership and Company Retreat multipliers

## v2.5.1 - Office Perk Nerf
- Free Energy Drinks: +25% → +15% production
- Catered Lunches: +1 → +0.5 LoC/click per employee
- Standing Desks: -10% → -5% hire cost reduction
- On-Site Daycare: ×1.5 → ×1.3 production
- Game Room: +50% → +35% click power
- Nap Pods: 10s burst every 45s → 8s burst every 50s
- Gym Membership: +30% → +20% production
- Unlimited PTO: -15% → -10% hire cost reduction
- Company Retreat: ×2 → ×1.75 production

## v2.5.2 - Employee Nerf
- Reduced all employee LoC/s rates by 30%
- Intern: 1 → 0.7, Junior Dev: 5 → 3.5, Mid-Level: 20 → 14, Senior: 100 → 70
- Staff: 500 → 350, Principal: 2000 → 1400, Tech Lead: 10000 → 7000, CTO: 50000 → 35000

## v3.0 - Achievements, Events & Genres
- **Achievements**: 15 milestones (Hello World, First Hire, Full Stack, Gone Gold, etc.)
  - Each awards Fame on unlock; checked every 0.5s
  - Persist across ships; viewable in Achievements modal
- **Random Events**: 8 temporary buffs/debuffs that fire every 45-90s
  - Crunch Time (+100% prod), Coffee Spill (-50% prod), Hackathon (+50% clicks),
    Code Review (-30% prod/+30% clicks), Viral Tweet (+75% prod),
    Power Outage (-40% clicks), Investor Visit (+200% prod), Bug Swarm (-25% all)
  - Banner at top of screen shows name, effect, countdown; green=buff, red=debuff
  - Events pause during ship animation
- **Game Genres**: random genre assigned on each ship (10 genres)
  - Platformer, RPG, Puzzle, Shooter, Racing, Adventure, Strategy, Sports, Horror, Simulation
  - Era affinity bonuses: genres popular in certain eras grant +20-50% Fame
  - Genre shown in ship transition animation with ★ for era bonus
  - Game history stored in save (name, genre, year)

## v3.1 - Software Dev Rebrand
- Renamed game from "Game Dev Clicker" to "Software Dev Clicker"
- **Total Fame system**: Fame production multiplier now based on total Fame ever earned (S.tFame), not spendable balance
  - Spending Fame on skill tree no longer reduces production multiplier
  - Display shows "spendable / total" when they differ
  - Old saves auto-migrate tFame from current fame balance
- **Office Perks reordered** by ascending base price
  - New order: Energy Drinks, Catered Lunches, Standing Desks, On-Site Daycare, Pet-Friendly Office, Gym Membership, Game Room, Unlimited PTO, Nap Pods, Company Retreat
  - Old saves auto-migrate perk ownership to new indices
- **Media Type ship animations** replace console cartridge/disc animations
  - 5.25" Floppy (1979-1987), 3.5" Floppy (1988-1994), CD-ROM (1995-2002), DVD (2003-2008), Digital Download (2009+)
  - All media art is pure CSS, no images
  - Ship overlay shortened from 17.5s to 5s
- **Landmark Software auto-naming** replaces manual game naming
  - Each year (1979-2025+) maps to a real software landmark with a parody name
  - VisiCalc → VisiCrash, Photoshop → Photoslop, YouTube → MeTube, ChatGPT → ChatGPD, etc.
  - 47 landmark entries covering 1979-2025, with procedural fallbacks beyond
  - Ship button previews upcoming software name
  - Ship overlay shows: year, software name, category, media type
  - Removed manual name input modal — shipping is now instant

## v3.2 - Era Computers & Desk Scene
- **Era-appropriate computers**: Monitor changes visual style based on current year
  - Apple II (1979-1984): beige box with green phosphor screen
  - Classic Mac (1985-1993): compact Macintosh with built-in screen
  - Beige PC (1994-1998): tower-style beige desktop
  - iMac G3 (1999-2005): colorful translucent all-in-one
  - iMac Aluminum (2006-2014): sleek silver thin-bezel display
  - Ultrawide (2015+): modern curved ultrawide monitor
- **Desk scene**: Computer sits on a desk with visual perk items
  - Office Perks appear on/around the desk when purchased (emoji indicators)
  - Standing Desks perk raises the desk height
- **Pet dog**: 2x larger, horizontally mirrored, triggers code line animation on screen
- **Ship overlay**: Slowed to 20s fade-in, dismiss button required to continue

## v3.3 - Genre Removal
- Removed game genres system entirely
- Ship overlay no longer shows genre or era affinity bonuses
- Simplified ship() and Fame gain calculations

## v3.4 - Support Staff
- New "Support Staff" section in sidebar with 2 hires:
  - **Secretary**: Reveals the green best-value highlight on employees (was previously always visible)
  - **Buyer**: Auto-purchases the best-value employee every 10 seconds
- Both are single-purchase upgrades that reset on ship
- Best-value highlight now requires Secretary to be hired
- Buyer uses inline cost check to always buy exactly 1 (ignores bulk buy selector)

## v3.5 - Dual Sidebar Layout
- Added left sidebar panel for Support Staff and Office Perks
- Right sidebar now contains only Coders (with qty bar), Skill Tree, and Achievements
- Both sidebars scroll independently, styled symmetrically
- buildUI() uses switchable fragment target to populate both panels

## v3.6 - Coders Rebrand, Recruiter Training & UI Polish
- **Coders rebrand**: Renamed all "Employees"/"Generators" references to "Coders"
  - Section header, skill tree branch, upgrade descriptions, achievement text
- **Buyer → Recruiter**: Renamed support staff hire
- **Recruiter training upgrades**: 3 single-purchase upgrades (toggle submenu like coder equipment)
  - Resume Screener: Hire 2 coders per cycle instead of 1
  - LinkedIn Premium: Reduce auto-hire interval from 10s to 5s
  - Headhunter: Auto-hire top 3 best-value coder types per cycle
  - Training upgrades require Recruiter to be hired first; reset on ship
- **Software category in top bar**: Shows current year's software category (Spreadsheet, Database, etc.)
- **Ship animation shortened**: All timings reduced by 1/3 (overlay 20s→13.3s, dismiss delay 6s→4s, etc.)
- **Support Staff moved above Office Perks** in left sidebar

## v3.7 - Facility Director, Code Base & Polish
- **Facility Director**: New support staff hire (15K) that auto-buys the cheapest available equipment every 5s
- **Top bar category display**: Shows "Currently Developing" label above the software category name
- **Recruiter progress bar**: Visual progress bar on the Recruiter row that fills and resets each auto-hire cycle
- **Code Base Upgrades**: 15 permanent upgrades unlocked by shipping new software categories
  - Each unique category shipped unlocks the next upgrade in sequence
  - Effects: +production, +coder speed, +click power, -hire costs (stack additively)
  - Persist across ships; shown as locked (🔒) or unlocked (✓) in left sidebar
  - Old saves auto-migrate by scanning game history for unique categories
- **Recruiter training visuals**: Training upgrades now styled identically to coder equipment rows

## v3.8 — Director Training, Stats, Offline, Milestones, Office Manager & NYT Headlines
- **Facility Director training upgrades**: 3 single-purchase upgrades (toggle submenu like Recruiter)
  - Blueprints: Reduce auto-buy interval from 30s to 15s
  - Bulk Orders: Buy 2 equipment per cycle instead of 1
  - Contractor: Prioritize best value equipment instead of cheapest
- **Office Manager**: New support staff (150K) that auto-buys the cheapest available office perk every 20s
  - Progress bar shows auto-buy cycle; resets on ship
- **Stats/History panel**: Modal showing all shipped software in a table
  - Summary stats: total shipped, total Fame earned, unique categories
  - Table with Year, Software Name, and Category for each game
- **Offline progress**: Earn LoC while away (up to 8 hours)
  - Reconstructs passive production rate from saved state
  - "Welcome back! Earned X LoC while away" toast on load
- **Milestone notifications**: Toast alerts at major LoC thresholds
  - 10K, 100K, 1M, 10M, 100M, 1B, 1T LoC milestones
  - Persist across ships (tracked by total LoC ever written)
- **NYT Headlines**: Real historical headlines appear at 25% ship progress
  - 47 headlines from 1979–2025 (one per year, major world events)
  - Newspaper-styled banner with auto-dismiss after 8 seconds
- **Recruiter training name swap**: LinkedIn Premium and Resume Screener names swapped
- Backward-compatible saves: old saves auto-migrate new state fields

## v3.9 — Equipment Tiers, Event Choices, Click Streaks & History
- **Equipment Tiers**: Each equipment type now has 3 named upgrade levels instead of a single purchase
  - Desk: Folding Table (+50%) → Office Desk (+100%) → Standing Desk (+200%)
  - Chair: Refurbished Chair (+75%) → Office Chair (+150%) → Ergonomic Chair (+300%)
  - Computer: Refurbished PC (+150%) → Office Workstation (+300%) → Dev Powerhouse (+600%)
  - Stars (★★★) indicate current tier level; shows next tier name/cost or MAX
  - Facility Director updated to buy next tier (Contractor finds best value across tiers)
  - Old saves compatible: tier 1 = previous single purchase
- **Event Choices**: 3 new random events that present 2 options for the player to choose
  - Technical Debt: Refactor (-30% prod, 20s) or Ship It (+30% clicks, 15s)
  - Acquisition Offer: Accept (×3 prod, 8s) or Decline (+50% all, 20s)
  - Open Source?: Go Open Source (+100% clicks, 25s) or Keep Proprietary (+75% prod, 15s)
  - Choice banner with 2 clickable buttons; game pauses event timer until player picks
- **Click Streak System**: Rapid clicking builds a multiplier that boosts ALL production
  - Track clicks-per-second over a 3s rolling window
  - 3+ CPS builds streak at 0.5×/s, up to 5× max
  - Decays at 2×/s after 2 seconds of no clicking
  - Thermometer visual beside the desk scene: fills up with color gradient, bulb glows
  - Three heat states: cool (<2x), warm (2-4x, orange glow), hot (4x+, red glow)
  - Multiplier applies to passive production, clicks, and nap pod bursts
- **Game History Enhancement**: Stats table expanded with Fame and LoC columns
  - Each shipped game now records Fame earned and LoC target
  - Stats table: Year | Software | Category | Fame | LoC (5 columns)
  - Old game records display "-" for missing fields
- Removed Premium Office Perks (Executive Suite, Stock Options, Private Chef)
- Backward-compatible saves: equipment tier values unchanged

## v3.9.1 — Facility Director Fix + Staff Pause Buttons
- **Facility Director training submenu**: Added missing CSS styles so rows match Recruiter training visual
- **Staff Pause Buttons**: Recruiter, Facility Director, and Office Manager each have a ⏸/▶ toggle
  - Pausing stops auto-actions and freezes the progress bar
  - Unpausing resumes from where the timer left off
  - Pause state saved with the game
- **Events reworked to all-choice**: Removed 8 auto-apply events, all 8 events now present 2 options
  - Every option has 1 positive and 1 negative effect (prod vs clicks trade-off)
  - New events: Crunch Time, Investor Visit, Hackathon, Server Migration, Conference Talk
  - Returning events redesigned with trade-offs: Technical Debt, Acquisition Offer, Open Source?

## v3.9.2 — English/Spanish Language Toggle
- **Language switcher**: UK and Spain flag buttons below save slots on the slot screen
  - Click to switch between English and Spanish; preference saved to localStorage
  - Switching language rebuilds all UI text immediately
- **Full Spanish translation**: All 250+ user-visible strings translated
  - Slot screen, top bar labels, section headers, buttons
  - All coder names/descriptions, equipment tiers, office perks, support staff
  - Recruiter/Facility training upgrades, Code Base upgrades
  - All 8 random events with choice labels and descriptions
  - All 40 achievements (names + descriptions)
  - All 7 milestone messages
  - Fame skill tree: branch names, upgrade names + descriptions
  - Stats modal, year transition, progress bar, ship button
  - Toast messages (hired, unlocked, shipped, milestones, achievements, nap burst, offline progress)
- Landmark parody names and NYT headlines remain in English (they are real-world references/puns)

## v3.9.3 — Era-Appropriate Code Base Upgrades
- **Reworked all 15 Code Base upgrades** to be historically accurate coding paradigms, IDE features, and development practices
  - Each upgrade matches the era when it would be unlocked (1979–1996) and relates to the category of software just shipped
  - Structured Programming (1979/Spreadsheet), SQL & Relational Model (1980/Database), Shell Scripting (1981/OS), Makefile Build System (1982/CAD), Event-Driven Programming (1984/Graphics), Object-Oriented Design (1985/DTP), Array Programming (1986/Scientific), HyperCard Stacks (1987/Presentations), Functional Programming (1988/Math), Finite State Machines (1989/Simulation), Plugin Architecture (1990/Image Editing), Dynamic Linking (1992/Multimedia), Client-Server Model (1993/Web Browser), VM Bytecode & GC (1995/Programming Language), Async Network Sockets (1996/IM)
- Game balance unchanged — same effect types and values as before
- Spanish translations updated for all 15 entries

## v3.9.4 — Activity Log, Era Events, UI Polish & Bulk Buy Rework
- **Activity Log**: Scrollable log panel at the bottom of the right sidebar showing a running history of all game events
  - 15 hook points: hiring coders, unlocking perks, hiring support staff, buying equipment, recruiter/facility training, fame upgrades, shipping software, code base unlocks, random event choices, achievements, milestones, and all auto-actions (Recruiter, Office Manager, Facility Director)
  - Auto-actions prefixed with 🤖, achievements/milestones with 🏆, shipping with 🚀, code base with 📚, events with ⚡
  - Each entry shows `[year]` prefix in blue; capped at 100 entries with auto-scroll
  - Translated header (English: "Activity Log", Spanish: "Registro de Actividad")
- **Era-appropriate random events**: Replaced generic events with 8 era-themed developer dilemmas
  - Spaghetti Code, Publisher Deal, Source Code Sharing, Deadline Crunch, Trade Show, Bug Hunt, Platform Port, Magazine Review
  - Each choice has a meaningful trade-off (production vs clicks, cost vs speed, etc.)
  - Spanish translations for all events and choices
- **Monitor 2× larger**: Desk scene and accompanying text (click info, click power, fame multiplier) scaled up 2×
- **Dog faces computer**: Removed horizontal flip on pet dog sprite
- **Notifications below top bar**: Toasts, event banners, and NYT headlines repositioned to `top:65px+` to avoid covering stats bar
- **Perk animations removed**: Removed pop animation from all office perks except the pet dog
- **Perk images removed**: Removed all emoji images from office perk items except the dog
- **Random events 3× less frequent**: Event cooldown increased from 45-90s to 135-270s
- **Support staff reordered**: Secretary → Recruiter → Office Manager → Facility Director (cheapest to most expensive)
  - Save migration swaps old Office Manager/Facility Director data to match new order
- **Fame upgrades reordered**: Prestige branch now Engine License → Marketing Team → Publisher Deal
- **Ship confirmation dialog**: Warning prompt before shipping reminds players it's a prestige reset
- **Coder flavor text**: Staff Engineer ("Writes docs nobody reads"), Tech Lead ("50% meetings, 50% Slack"), CTO ("Sends 'thoughts?' emails at 3am")
- **Strict bulk buy**: 5× and 25× modes now block purchase entirely if you can't afford the full amount (no fallback to 1×)

## v4.0 — Performance Optimization & Code Quality
- **Dirty flag cache system**: All multiplier chains (prodMul, lps, clickPow, etc.) now computed once per tick via a dirty/recalc pattern instead of 10+ times per frame
- **Ring buffer for click tracking**: Replaced O(n) array shift/filter with O(1) Float64Array circular buffer for click streak CPS calculation
- **Cached DOM refs**: Thermometer, pet, and progress bar elements cached on first access instead of queried every frame
- **DRY refactors**: Shared `_updateTrainingSub()` for recruiter/facility submenu updates, `_logHire()` helper for auto-hire logging, offline progress reuses `lps()` directly
- **Named constants**: 15+ magic numbers replaced with descriptive constants (STREAK_WINDOW, NAP_INTERVAL, RECRUITER_FAST, etc.)
- **SS enum**: Support staff indices via `{ SECRETARY:0, RECRUITER:1, MANAGER:2, FACILITY:3 }`
- **CSS consolidation**: `.eu-row,.ru-row,.fu-row` merged; `.st-btn,.ach-btn` shared base extracted
- **Critical bug fix**: Loop variable `t` in headhunter recruiter code shadowed the global translation function `t()`, causing crashes when headhunter upgrade was active

## v4.1 — Portuguese, French & German Translations
- **3 new languages**: Portuguese (🇧🇷), French (🇫🇷), German (🇩🇪) added to language switcher
- Full translation of all 330+ keys per language including coder names, equipment tiers, office perks, support staff, events, achievements, milestones, fame tree, stats panel, and all UI text

## v4.2 — Gen Z Meme Language
- **Gen Z / Brainrot language (💀)**: Full meme reskin of the entire game
- Coders → Creators: NPC Intern, TikTok Clipper, Twitch Streamer, Influencer, Content Strategist, Looksmaxxer, Brand Deal Closer, CEO of Vibes
- Equipment: Cardboard Box → IKEA Setup → RGB Standing Desk, Bean Bag → Gaming Chair → Herman Miller, Chromebook → Gaming PC → Dual 4090 Rig
- Perks: Boba Tea Bar, Prime Energy Fridge, Ring Lights, Content House, Office Cat, Pilates Class, VR Room, Unlimited Mental Health Days, Nap Pods (ASMR Edition), Team Retreat to Bali
- Events: Got Ratio'd, Brand Deal Offer, Leaked Content, Deadline (no cap), VidCon, Content Takedown, Cross-Platform Repost, Drama Channel Review
- UI: "Lines of Clout", "Currently Cooking", "Feed" (activity log), "W's" (achievements), "Vibes" (perks), "Meta Strats" (code base)

## v4.3 — Sound System & Settings Panel
- **Procedural audio**: All sound generated via Web Audio API (no external files)
- **8 era-based music tracks** reflecting historical computer sound capabilities:
  - 1979-1983: Square wave beeps (Apple II / ZX Spectrum)
  - 1984-1988: 8-bit chiptune arpeggios (NES / C64)
  - 1989-1993: 16-bit triangle + sawtooth (SNES style)
  - 1994-1998: FM synthesis, MIDI-like
  - 1999-2003: Ambient filtered pads (CD-ROM era)
  - 2004-2008: Electronic synth with filter sweeps + kicks
  - 2009-2013: Indie chiptune revival + filtered pads
  - 2014+: Lo-fi beats with vinyl crackle noise
- Music crossfades on era transitions
- **6 sound effects**: click, buy, ship, event, achievement, milestone
- **Settings gear icon (⚙)** in top-right of top bar
- **Settings panel** with Music and SFX volume sliders (0-100%)
- Volume preferences persist in save; all labels translated across 6 languages
- AudioContext created on first user gesture (browser autoplay policy compliant)

## v4.4 — Click Streak Skill Tree & Economy Rebalance
- **Click Streak fame branch**: Replaced mystery "???" branch (index 4) with red Click Streak upgrades
  - Adrenaline Rush (5 fame): Unlocks streak system, 2× max
  - Overdrive (8 fame, 3 levels): +1× max streak per level (up to 5×)
  - Flow State (15 fame): 2× faster streak build, 2× slower decay
  - Without Adrenaline Rush, streak is disabled and thermometer is hidden
  - Thermometer fill and heat thresholds scale with dynamic max
  - Translated across all 6 languages
- **Coder economy rebalanced**: Breakpoint at 15 coders per tier transition (was 2-5)
  - Intern: 15, Junior: 610, Mid-Level: 20K, Senior: 810K, Staff: 33M, Principal: 1.1B, Tech Lead: 44B, CTO: 1.8T
- **Equipment boosts halved**: Folding Table +25%, Office Desk +50%, Standing Desk +100%, Refurbished Chair +37%, Office Chair +75%, Ergonomic Chair +150%, Refurbished PC +75%, Workstation +150%, Dev Powerhouse +300%
- **Equipment costs 1.5×**: All 9 equipment base costs increased by 50%
- **Office perk costs 2×**: All 10 perk base costs doubled
- **Coder rate display**: Each coder row now shows total production and per-unit value of next hire (+X)
- **Version number**: v0.2.0 displayed in settings panel

## v4.5 — Progressive Unlocks
- **Progressive unlock system**: Coders, perks, and support staff gated behind ship count
  - Start: 3 coders, 3 perks, 1 support staff (Secretary)
  - Each ship unlocks +1 coder, +1 perk, +1 support (until all unlocked)
  - All 8 coders at ship 5, all 4 support at ship 3, all 10 perks at ship 7
- **Locked preview rows**: Next unlock in each category shown as dimmed row with 🔒 icon (matches code base pattern)
- Items beyond the next unlock are completely hidden

## v4.6 — Fame Tree Expansion & Opaque Window
- **Fame tree now opens in an opaque window**: Solid `#0d1117` background with border, border-radius, box-shadow, and scrollable overflow
- **20 new fame upgrades** (32 total, 8 per branch) branching out from existing nodes with prerequisite system:
  - **Coder branch**: Parallel Threads (+15% speed ×3), Code Review (+2%/type), Acqui-hire (-15% hire cost ×2), Open Source (+5% prod/ship ×3), Pair Programming (×1.5 prod)
  - **Click Power branch**: Click Precision (+1% LoC/s/click), Click Lucky (5% chance 10×), Auto Botnet (+2 auto-clicks/s), Click Hackathon (faster bursts), Click Caffeine (auto-clicks charge bursts)
  - **Prestige branch**: Venture Capital (start with LoC on ship), Golden Parachute (keep % LoC), Viral Marketing (+25% fame), Franchise (-10% ship threshold), IPO (+1 fame per 5 ships)
  - **Click Streak branch**: Second Wind (50% slower decay), Streak Combo (+0.5/streak), Streak Turbo (+2× max), Streak Zone (+25% at max), Streak Transcend (1.5× floor)
- **Branching prerequisite system**: Each upgrade's `req` field points to its parent node; SVG lines drawn from parent to child
- **1.55× scaled layout**: Graph expanded to 1550×1070 to eliminate all node overlaps
- Branch labels positioned at spine tips; close button inside graph panel
- Translations for all 20 new upgrades across 6 languages (EN, ES, PT, FR, DE, Zoomer)

## v4.7 — Trainer, Economy Rebalance & UI Cleanup
- **Trainer support staff**: 5th support staff hire (60K) that levels up coders and other staff over time
  - Levels up a random owned coder every 30s (+1% LoC/s per level, stacks indefinitely)
  - Levels up other support staff every 3 triggers (+2% faster per level)
  - Recruiter, Office Manager, and Facility Director all count triggers toward their next level
  - Trainer level displayed on coder buttons (e.g., "×5 Lv7") and support staff rows (e.g., "✓ Lv4")
  - Pause toggle support; resets on ship
  - Translated across all 6 languages with log message on each coder level-up
- **Equipment price scaling increased**: Desk growth 2.5→4, Chair 3→5, Computer 4→6
- **Fame upgrade costs reduced by 3×**: All 32 fame tree upgrades cost roughly one-third of their previous price
- **Office perks doubled in power**:
  - Energy Drinks: +15% → +30% production
  - Catered Lunches: +0.5 → +1.0 LoC/click per coder
  - Standing Desks: -5% → -10% hire cost
  - On-Site Daycare: ×1.3 → ×1.6 production
  - Pet-Friendly Office: +1 → +2 auto-clicks/s
  - Gym Membership: +20% → +40% production
  - Game Room: +35% → +70% click power
  - Unlimited PTO: -10% → -20% hire cost
  - Nap Pods: 8s burst → 16s burst (NAP_BURST_MUL 8→16)
  - Company Retreat: ×1.75 → ×2.5 production
- **Settings button relocated**: Moved from gear icon in top bar to a button below Stats in the right panel; gear icon and its CSS/handler removed
- Save migration for trainer arrays and 5th support staff slot
