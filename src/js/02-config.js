// ========== CONFIG ==========
const GAME_VERSION = '9.6';

// v7.5: Engineer types — coder is the original; others unlock by year (every 2 years from 1985).
// Each type has its own resource, list of individuals, and ship threshold.
// All upgrades (equipment, perks, support staff, trainers) are SHARED across types.
// v10: 10 landmark engineer types, one unlocking per release. packBase scales ~4x per type.
const ENG_TYPES = [
  { key:'coder',    name:'Coder',    res:'LoC',       resKey:'loc', unlockYear:1980, color:'#7ee787', packBase:        100 },
  { key:'frontend', name:'Frontend', res:'Pixels',    resKey:'pix', unlockYear:1986, color:'#79c0ff', packBase:        400 },
  { key:'backend',  name:'Database', res:'Queries',   resKey:'qry', unlockYear:1992, color:'#d2a8ff', packBase:       1600 },
  { key:'network',  name:'Network',  res:'Packets',   resKey:'pkt', unlockYear:1996, color:'#ffa657', packBase:       6400 },
  { key:'webdev',   name:'Web Dev',  res:'Hits',      resKey:'hit', unlockYear:1999, color:'#58a6ff', packBase:      25600 },
  { key:'gamedev',  name:'Game Dev', res:'Sprites',   resKey:'spr', unlockYear:2004, color:'#ff7dda', packBase:     102400 },
  { key:'mobile',   name:'Mobile',   res:'Taps',      resKey:'tap', unlockYear:2010, color:'#00d4aa', packBase:     409600 },
  { key:'devops',   name:'DevOps',   res:'Deploys',   resKey:'dep', unlockYear:2013, color:'#3fb950', packBase:    1638400 },
  { key:'cloud',    name:'Cloud',    res:'Instances',  resKey:'ins', unlockYear:2018, color:'#87ceeb', packBase:    6553600 },
  { key:'agent',    name:'AI Agent', res:'Traces',    resKey:'trc', unlockYear:2024, color:'#a371f7', packBase:   26214400 },
];
const ENG_TYPE_MAP = Object.fromEntries(ENG_TYPES.map(e => [e.key, e]));
function isEngType(k) { return !!ENG_TYPE_MAP[k]; }

const GEN = [
  { name: 'Intern',             desc: 'Eager but error-prone',         base: 15,            rate: 0.7,    gr: 1.15 },
  { name: 'Junior Dev',         desc: 'Knows one framework well',      base: 610,           rate: 2.1,    gr: 1.15 },
  { name: 'Mid-Level Dev',      desc: 'Can Google anything',           base: 20000,         rate: 6.3,    gr: 1.15 },
  { name: 'Senior Dev',         desc: 'Has mass-deleted prod before',  base: 810000,        rate: 19,     gr: 1.15 },
  { name: 'Staff Engineer',     desc: 'Writes docs nobody reads',       base: 33000000,      rate: 57,     gr: 1.15 },
  { name: 'Principal Engineer', desc: 'Speaks only in abstractions',   base: 1100000000,    rate: 170,    gr: 1.15 },
  { name: 'Tech Lead',          desc: '50% meetings, 50% Slack',      base: 44000000000,   rate: 510,    gr: 1.15 },
  { name: 'CTO',                desc: "Sends 'thoughts?' emails at 3am", base: 1800000000000, rate: 1530,   gr: 1.15 },
];

const EMP_UPS = [
  { id:'desk', tiers:[
    { name:'Folding Table',      desc:'+25% speed',   mult:1.25, baseCost:75 },
    { name:'Office Desk',        desc:'+50% speed',   mult:1.5,  baseCost:750 },
    { name:'Standing Desk',      desc:'+100% speed',  mult:2.0,  baseCost:7500 },
  ], gr:4 },
  { id:'chair', tiers:[
    { name:'Refurbished Chair',  desc:'+37% speed',   mult:1.375,baseCost:300 },
    { name:'Office Chair',       desc:'+75% speed',   mult:1.75, baseCost:3000 },
    { name:'Ergonomic Chair',    desc:'+150% speed',  mult:2.5,  baseCost:30000 },
  ], gr:5 },
  { id:'computer', tiers:[
    { name:'Refurbished PC',     desc:'+75% speed',   mult:1.75, baseCost:1500 },
    { name:'Office Workstation', desc:'+150% speed',  mult:2.5,  baseCost:15000 },
    { name:'Dev Powerhouse',     desc:'+300% speed',  mult:4.0,  baseCost:150000 },
  ], gr:6 },
];

// v7.4: recruiter upgrades — one-time purchases unlocked once Recruiter is hired.
const RECRUITER_UPS = [
  { id: 'headhunter', name: 'Headhunter Network', desc: '\u221215% Hire cost',                baseCost: 40000,   gr: 1 },
  { id: 'talentpool', name: 'Recruiting Drive',   desc: '+1 engineer per hire',                baseCost: 250000,  gr: 1 },
  { id: 'retainer',   name: 'Executive Retainer', desc: 'Doubles Recruiter hire\u2011cost discount', baseCost: 1500000, gr: 1 },
];

const CLK = [
  { name: 'Catered Lunches',    desc: '+1 res/click per engineer',       base: 600,      gr: 4  },
  { name: 'Free Energy Drinks', desc: '+30% all production',             base: 1500,     gr: 3  },
  { name: 'Standing Desks',     desc: '-10% engineer hire costs',        base: 10000,    gr: 5  },
  { name: 'On-Site Daycare',    desc: '\u00d71.6 all production',        base: 60000,    gr: 6  },
  { name: 'Pet-Friendly Office',desc: '+2 auto-click/s',                 base: 100000,   gr: 10 },
  { name: 'Gym Membership',     desc: '+40% all production',             base: 300000,   gr: 10 },
  { name: 'Game Room',          desc: '+70% click power',                base: 400000,   gr: 8  },
  { name: 'Unlimited PTO',      desc: '-20% engineer hire costs',        base: 1000000,  gr: 10 },
  { name: 'Nap Pods',           desc: 'Burst: 16s production every 50s', base: 2000000,  gr: 10 },
  { name: 'Company Retreat',    desc: '\u00d72.5 all production',        base: 6000000,  gr: 10 },
  { name: 'Meeting Room',      desc: '\u221215% Hire cost',               base: 150000,   gr: 10, req: 3 },
];

const FACILITY_UPS = [
  { id:'blueprint',  name:'Blueprints',  desc:'Buy every 15s',         baseCost:30000,  gr:3 },
  { id:'bulk_order',  name:'Bulk Orders', desc:'Buy 2 per cycle',       baseCost:90000,  gr:4 },
];

const SUPPORT = [
  { name: 'Secretary',         desc: 'Highlights best-value tier & bottleneck type', base: 1500, gr: 10 },
  { name: 'Recruiter',         desc: 'Passive hire cost discount',          base: 15000,  gr: 10 },
  { name: 'Facility Director', desc: 'Auto-buys best value equipment',      base: 45000,  gr: 10 },
  { name: 'Trainer',           desc: 'Levels up engineers (+1%/30s) & staff', base: 60000, gr: 10 },
];

// ========== STAFF DIALOGUE (Hades-inspired) ==========
function _tc() { return S.g.reduce((a,b)=>a+b,0); }
function _allEuMaxed() { return S.eu.every(row => row.every((v,i) => v >= EMP_UPS[i].tiers.length)); }
const STAFF_COLOURS = ['#8b949e','#58a6ff','#f0883e','#3fb950'];
const STAFF_DIALOGUE = [
  // Secretary (0) — sarcastic, observant
  { ss:0, text:"I filed your taxes under 'wishful thinking'.", check:()=>true },
  { ss:0, text:"I've seen your code. I've also seen spaghetti.", check:()=>true },
  { ss:0, text:"Your inbox has 4,000 unread emails. Should I just delete them all?", check:()=>true },
  { ss:0, text:"Another intern? You know they just break things, right?", check:()=>S.g[0]>3 },
  { ss:0, text:"50 engineers and still clicking manually. Respect.", check:()=>_tc()>=50&&!S.f.autoClick },
  { ss:0, text:"At this point I think YOU work for THEM.", check:()=>S.shipped>=10 },
  { ss:0, text:"Remember when this was a one-person operation? Me neither.", check:()=>S.shipped>=5 },
  { ss:0, text:"A hundred million lines of code. Most of it is comments.", check:()=>S.tLoc>=1e8 },
  { ss:0, text:"A publisher? Great, now I have TWO bosses.", check:()=>S.f.publisher },
  { ss:0, text:"The recruiter keeps asking me to 'optimize my workflow'. I answer phones.", check:()=>S.ss[SS.RECRUITER]>=1 },

  // Recruiter (1) — overconfident LinkedIn energy
  { ss:1, text:"Just hired a 10\u00d7 engineer. They said so on their resume.", check:()=>true },
  { ss:1, text:"My network is my net worth.", check:()=>true },
  { ss:1, text:"Let's circle back on that headcount.", check:()=>true },
  { ss:1, text:"I don't recruit. I talent-acquire.", check:()=>true },
  { ss:1, text:"I should start my own recruitment agency.", check:()=>_tc()>=100 },
  { ss:1, text:"We're not hiring, we're scaling human capital.", check:()=>S.shipped>=5 },
  { ss:1, text:"We have more interns than desks. That's a feature, not a bug.", check:()=>S.g[0]>=10 },
  { ss:1, text:"Acqui-hiring? That's just recruiting with extra steps.", check:()=>S.f.genAcquihire },
  { ss:1, text:"The trainer says my hires need 'improvement'. Rude.", check:()=>S.ss[SS.TRAINER]>=1 },
  { ss:1, text:"I'm on pause? Fine. I'll update my LinkedIn.", check:()=>S.sp[SS.RECRUITER] },

  // Facility Director (2) — grumpy, practical
  { ss:2, text:"Standing desks were a mistake. Everyone's just tired AND standing.", check:()=>true },
  { ss:2, text:"The ergonomic chairs cost more than the interns.", check:()=>true },
  { ss:2, text:"Who keeps microwaving fish in the break room?", check:()=>true },
  { ss:2, text:"Nothing left to buy. Am I... done?", check:()=>_allEuMaxed() },
  { ss:2, text:"Every time we ship, I have to reorganize the whole office.", check:()=>S.shipped>=3 },
  { ss:2, text:"The trainer leveled me up. I still feel the same.", check:()=>S.ss[SS.TRAINER]>=1 },
  { ss:2, text:"We need a bigger office. I've been saying this for 3 ships.", check:()=>_tc()>=30 },
  { ss:2, text:"On break. Don't touch my spreadsheets.", check:()=>S.sp[SS.FACILITY] },
  { ss:2, text:"Pair programming means I need twice the desks. Thanks for that.", check:()=>S.f.genPair },
  { ss:2, text:"I ordered 50 monitors. Don't ask questions.", check:()=>_tc()>=50 },

  // Trainer (3) — motivational poster energy
  { ss:3, text:"Today's training: synergy. Tomorrow: more synergy.", check:()=>true },
  { ss:3, text:"Your intern just completed their first PR. It broke staging.", check:()=>true },
  { ss:3, text:"Believe in yourself. Or don't. I still get paid.", check:()=>true },
  { ss:3, text:"I've trained them so well they're training me now.", check:()=>S.trainerLvl.some(l=>l>=10) },
  { ss:3, text:"Five ships! That's what I call a growth mindset.", check:()=>S.shipped>=5 },
  { ss:3, text:"20 engineers. That's 20 opportunities for synergy.", check:()=>_tc()>=20 },
  { ss:3, text:"Click streaks! Now THAT'S what peak performance looks like.", check:()=>S.f.streakUnlock },
  { ss:3, text:"I'm paused but I'm still mentally coaching everyone.", check:()=>S.sp[SS.TRAINER] },
  { ss:3, text:"Overclock level 3? These engineers are basically on espresso IV drips.", check:()=>S.f.genSpeed>=3 },
  { ss:3, text:"Hustle culture? I prefer to call it 'aggressive mentoring'.", check:()=>true },
];

// ========== OFFICE SPRITES ==========
const CODER_COLOURS = ['#7ee787','#58a6ff','#d2a8ff','#f0883e','#ff7b72','#ffd700','#79c0ff','#f778ba'];
const DESK_COLOURS = [['#6b4226','#5a3520'],['#888','#777'],['#333','#222']];
const CHAIR_COLOURS = ['#5a3520','#4a6fa5','#2ea043'];
const PC_GLOWS = ['none','#58a6ff','#3fb950','#ffd700'];

function coderSVG(type, deskT, chairT, pcT) {
  const c = CODER_COLOURS[type] || '#8b949e';
  const dk = DESK_COLOURS[Math.min(deskT, 2)] || DESK_COLOURS[0];
  const ch = CHAIR_COLOURS[Math.min(chairT, 2)] || CHAIR_COLOURS[0];
  const glow = PC_GLOWS[Math.min(pcT, 3)] || 'none';
  return `<svg width="24" height="20" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="8" height="6" rx="1" fill="${ch}" opacity=".6"/>
    <rect x="4" y="13" width="16" height="3" rx="1" fill="${dk[0]}"/>
    <rect x="5" y="16" width="14" height="1" fill="${dk[1]}"/>
    <rect x="14" y="8" width="5" height="5" rx="1" fill="#21262d" stroke="#444" stroke-width=".5"/>
    ${glow !== 'none' ? `<rect x="15" y="9" width="3" height="3" rx=".5" fill="${glow}" opacity=".4"/>` : ''}
    <circle cx="10" cy="4" r="3" fill="${c}"/>
    <rect x="7" y="7" width="6" height="6" rx="1" fill="${c}" opacity=".85"/>
    <rect class="typer" x="13" y="10" width="2" height="1.5" rx=".5" fill="${c}" opacity=".7"/>
  </svg>`;
}

// v6.9: empty desk placeholder (no coder figure)
function emptyDeskSVG() {
  return `<svg width="24" height="20" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="8" height="6" rx="1" fill="#30363d" opacity=".5"/>
    <rect x="4" y="13" width="16" height="3" rx="1" fill="#21262d"/>
    <rect x="5" y="16" width="14" height="1" fill="#161b22"/>
    <rect x="14" y="8" width="5" height="5" rx="1" fill="#0d1117" stroke="#30363d" stroke-width=".5"/>
  </svg>`;
}

function staffSVG(ssIdx) {
  const c = STAFF_COLOURS[ssIdx];
  const icons = [
    '<rect x="18" y="2" width="4" height="6" rx="1" fill="#58a6ff" opacity=".7"/><rect x="19" y="0" width="2" height="3" rx="1" fill="#58a6ff"/>',
    '<rect x="17" y="6" width="7" height="5" rx="1" fill="#8b6914"/><rect x="19" y="4" width="3" height="3" rx=".5" fill="#a07a18"/>',
    '<rect x="18" y="2" width="2" height="7" rx=".5" fill="#8b949e"/><circle cx="19" cy="1.5" r="1.5" fill="#8b949e"/>',
    '<circle cx="20" cy="4" r="2.5" fill="none" stroke="#3fb950" stroke-width="1"/><rect x="19" y="7" width="2" height="3" rx=".5" fill="#3fb950"/>',
  ];
  return `<svg width="30" height="24" viewBox="0 0 30 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="5" r="4" fill="${c}"/>
    <rect x="6" y="9" width="8" height="8" rx="2" fill="${c}" opacity=".85"/>
    <rect x="5" y="17" width="10" height="3" rx="1" fill="#21262d"/>
    ${icons[ssIdx] || ''}
  </svg>`;
}

// ========== CODEBASE-AWARE MONITOR CODE ==========
const CB_CODE_LINES = [
  // Tier 0 (default): generic game code
  ['let score = 0;','player.update(dt);','ctx.clearRect(0,0,W,H);','if (hp <= 0) gameOver();','enemies.push(spawn());','render(scene);','assets.load("sprites");','this.vel.y += gravity;','collider.check(a, b);','sfx.play("jump");','save(localStorage);','fps = 1000 / delta;','cam.follow(player);','tile = map[y][x];','input.poll();'],
  // Tier 1: Structured Programming
  ['int main() {','  if (n > 0) {','    count++;','  }','  printf("%d\\n", n);','  return 0;','}','void sort(int a[]) {','  for (i=0; i<n; i++)','    swap(a[i], a[j]);'],
  // Tier 2: SQL
  ['SELECT name, score','FROM players','WHERE active = 1','ORDER BY score DESC','LIMIT 10;','INSERT INTO logs','VALUES (NOW(), msg);','CREATE INDEX idx_score','ON players(score);'],
  // Tier 3: Shell
  ['#!/bin/bash','for f in *.log; do','  grep -c ERROR "$f"','done','cat input | sort | uniq','find . -name "*.tmp"','  -exec rm {} \\;','echo "Deploy done"','exit 0'],
  // Tier 4: Makefile
  ['CC = gcc','CFLAGS = -Wall -O2','all: game','game: main.o gfx.o','	$(CC) -o $@ $^','%.o: %.c','	$(CC) $(CFLAGS) -c $<','clean:','	rm -f *.o game'],
  // Tier 5: Event-Driven
  ['btn.on("click", () => {','  emit("purchase");','});','socket.on("msg", d => {','  chat.append(d);','});','process.on("exit", save);','emitter.once("ready",','  () => init());'],
  // Tier 6: OOP
  ['class Player extends Entity {','  constructor(x, y) {','    super(x, y);','    this.hp = 100;','  }','  attack(target) {','    target.hp -= this.dmg;','  }','}'],
  // Tier 7: Array/APL
  ['scores +.× weights','⍴ matrix ← 3 4','avg ← (+/data)÷⍴data','sorted ← data[⍋data]','mask ← data>threshold','result ← mask/data','⌈/ scores','primes ← (~R∊R∘.×R)/R'],
  // Tier 8: HyperCard
  ['on mouseUp','  put "Hello" into fld 1','  go to card 2','end mouseUp','on openCard','  show btn "Start"','  play "click"','end openCard'],
  // Tier 9: Functional
  ['map (+1) [1,2,3]','filter even xs','foldr (+) 0 list','compose f g x = f(g(x))','let rec fib n =','  match n with','  | 0 | 1 -> n','  | _ -> fib(n-1)+fib(n-2)'],
  // Tier 10: FSM
  ['state IDLE:','  on INPUT -> RUNNING','state RUNNING:','  on DONE -> IDLE','  on ERROR -> FAILED','state FAILED:','  on RETRY -> RUNNING','  on QUIT -> IDLE','transition(event);'],
  // Tier 11: Plugin
  ['exports.activate = ctx => {','  ctx.register("lint",','    new LintPlugin());','};','hooks.tap("build", () => {','  bundle(entry);','});','plugin.version = "2.0";'],
  // Tier 12: DLL
  ['HMODULE h = LoadLibrary','  ("engine.dll");','typedef void(*InitFn)();','InitFn init = GetProcAddr','  (h, "init");','init();','FreeLibrary(h);'],
  // Tier 13: Client-Server
  ['fetch("/api/scores")','  .then(r => r.json())','  .then(data => {','    render(data);','  });','app.get("/api", (req,res)','  => res.json(db.all()));','ws.send(JSON.stringify','  ({type:"move",x,y}));'],
  // Tier 14: VM/GC
  ['class VM {','  execute(bytecode) {','    for (let op of bc) {','      switch(op) {','        case PUSH: push(v);','        case ADD: push(','          pop()+pop());','      }','    }','  }','}'],
  // Tier 15: Async
  ['async function fetch() {','  const res = await','    net.request(url);','  const data = await','    res.json();','  return data;','}','Promise.all([a, b, c])','  .then(merge);'],
];

// ========== CATEGORY-THEMED MONITOR CODE ==========
const CAT_CODE = {
  spreadsheet: ['let cell = sheet[r][c];','total += parseFloat(val);','if (formula.startsWith("=SUM")){','  range = getRange(A1, B10);','  return sum(range);','}','cell.format = "currency";','recalcDependents(cell);','chart.bindData(range);','sheet.autoFill(pattern);'],
  database: ['SELECT name, score','  FROM players','  WHERE rank > 10','  ORDER BY score DESC;','INSERT INTO logs','  VALUES (now(), msg);','CREATE INDEX idx_user','  ON sessions(user_id);','BEGIN TRANSACTION;','COMMIT;'],
  systems: ['pid_t pid = fork();','if (pid == 0) exec(cmd);','kmalloc(PAGE_SIZE);','sched_yield();','ioctl(fd, req, arg);','mmap(NULL, len, PROT_RW,','  MAP_PRIVATE, fd, 0);','signal(SIGTERM, handler);','mutex_lock(&lock);','printk(KERN_INFO "ok");'],
  graphics: ['ctx.drawImage(src, x, y);','pixel[i] = lerp(a, b, t);','applyFilter(BLUR, 3);','layer.composite(MULTIPLY);','path.bezierCurveTo(','  cx1, cy1, cx2, cy2);','canvas.toBlob(save);','transform.rotate(45);','gradient.addStop(0,"#f00");','renderer.flush();'],
  web: ['<div class="app">','fetch("/api/data")','  .then(r => r.json())','  .then(render);','document.querySelector','  (".btn").onclick=go;','localStorage.setItem(','  "token", jwt);','history.pushState(s,"",u);','ws.send(JSON.stringify(m));'],
  game: ['player.update(dt);','if (collides(a, b)) {','  score += combo * 10;','  spawnParticles(pos);','}','enemy.pathfind(target);','render(scene, camera);','physics.step(1/60);','input.poll();','level.loadNext();'],
  chat: ['socket.emit("msg", data);','inbox.filter(m => !m.read);','user.status = "online";','channel.broadcast(event);','const thread = new Thread(','  parent, reply);','encrypt(payload, pubKey);','queue.push(notification);','presence.track(userId);','cache.invalidate("feed");'],
  ai: ['model.fit(X_train, y);','loss = crossEntropy(','  pred, label);','grad = backward(loss);','optimizer.step(lr=3e-4);','embed = encode(tokens);','attn = softmax(Q@K.T);','beam = search(logits, k);','checkpoint.save(epoch);','metrics.log({"acc": acc});'],
  media: ['audio.createOscillator();','codec.decode(frame);','playlist.next();','eq.setFrequency(440);','buffer.fill(samples);','stream.pipe(output);','seek(timestamp);','waveform.draw(canvas);','bitrate = 320;','track.fadeOut(2.0);'],
  mobile: ['override func viewDidLoad()','  super.viewDidLoad()','  setupConstraints()','view.animate(0.3) {','  self.alpha = 1.0','}','tableView.reloadData()','NotificationCenter.post(','  name: .didUpdate)','gestures.require(toFail:)'],
  lang: ['fn parse(tokens) {','  let ast = expr();','  expect(Token::Semi);','  return ast;','}','emit(Op::Push, val);','resolve(scope, ident);','typeCheck(node);','codegen(ir, target);','repl.eval(input);'],
};
const CAT_MAP = {
  'Spreadsheet':'spreadsheet','Math Software':'spreadsheet','Scientific Computing':'spreadsheet','Presentations':'spreadsheet',
  'Database':'database',
  'Operating System':'systems','IoT Platform':'systems','Containerization':'systems','Orchestration':'systems',
  'Graphics Editor':'graphics','Image Editing':'graphics','Desktop Publishing':'graphics','Creative Suite':'graphics','CAD Software':'graphics',
  'Web Browser':'web','Email Service':'web','Social Media':'web','Photo Sharing':'web','Short Video':'web',
  'Simulation':'game','Strategy Game':'game','Life Simulator':'game','Sandbox Game':'game','Augmented Reality':'game',
  'Instant Messaging':'chat','Collaboration Tool':'chat','Video Conferencing':'chat','File Sharing':'chat',
  'Machine Learning':'ai','AI Coding Assistant':'ai','AI Chatbot':'ai','AI Video Generator':'ai','AI IDE':'ai','Future Tech':'ai',
  'Multimedia Player':'media','Media Player':'media','Video Streaming':'media','Digital Music Store':'media',
  'Mobile Development':'mobile',
  'Programming Language':'lang',
};

// ========== CODER FUN FACTS ==========
const CODER_FACTS = [
  // Intern (0)
  ['Alex. Favorite language: HTML.','Sam. Broke prod on day one.','Jordan. Still learning git pull.','Casey. Asks "is this agile?"','Riley. Types 10 WPM. With errors.','Morgan. Thinks CSS is coding.','Taylor. Googles "how to code".','Jamie. Commits node_modules.','Drew. Wrote a 400-line main().','Pat. Uses Notepad unironically.','Logan. Asks what an API is.','Tatum. Forgot their password. Again.','Peyton. Uses Word for coding.','Harley. Thinks HTML is programming.','Nico. Pushes directly to main.','Kerry. "What\'s a terminal?"','Devon. Has a Hello World portfolio.','Corey. Copy-pastes the whole repo.','Bobbie. Spent 3 hours on a typo.','Frankie. Uses Comic Sans in their IDE.','Dallas. "What does rebase do?"','Jessie. Discovered inspect element today.','Remy. Their code has no variables.','Carmen. Thinks agile means fast.','Aubrey. Made a to-do app. It doesn\'t save.','Shiloh. Uses 17 nested if-statements.','Milan. Has 400 Chrome tabs open.','Lane. Hardcodes every value.','Kai. "Is Python a snake?"','Noel. Their first PR was 2,000 lines.'],
  // Junior Dev (1)
  ['Blake. Knows one framework well.','Quinn. Copy-pastes from Stack Overflow.','Avery. Has strong React opinions.','Reese. Thinks they invented MVC.','Harper. Debugs with console.log.','Sage. Uses 47 npm packages.','Dakota. "It works on my machine."','Finley. PR reviews take 3 days.','Rowan. Writes TODO comments. Never returns.','Ellis. Has a "10x" coffee mug.','Tanner. Discovered TypeScript yesterday.','Arden. Has 12 side projects. Zero finished.','Presley. Their git graph is abstract art.','Oakley. Overengineers a TODO list.','Colby. Uses try-catch everywhere.','Rory. Writes tests after the bug.','Linden. "I refactored." Broke everything.','Justice. 43 browser tabs minimum.','Leighton. Thinks REST means napping.','Monroe. Adds dependencies for one function.','Briar. Comments out code. Never deletes.','Indigo. Has 6 VSCode themes installed.','Campbell. Their .env is in the repo.','Hollis. Writes switch cases. All 40 of them.','Everett. Uses var in 2026.','Landry. "It\'s not a bug, it\'s a feature."','Bellamy. Has 3 conflicting eslint configs.','Ainsley. Deploys on Fridays.','Perry. Their merge conflicts have conflicts.','Chandler. Learned coding from TikTok.'],
  // Mid-Level Dev (2)
  ['Charlie. Can Google anything.','Emery. Knows what Big O means.','Hayden. Refactors for fun.','Lennox. Has opinions about tabs.','Phoenix. Actually reads docs.','Skyler. Wrote a linter config.','Robin. Mentors interns. Reluctantly.','Marley. Automates everything.','Kendall. Owns 3 mechanical keyboards.','Eden. Has a dotfiles repo.','Spencer. Side project makes $3/month.','Ari. Writes regex nobody can read.','Raven. Built their own CSS framework.','Carey. "I\'ll document it later."','Sawyer. Knows 5 languages. Masters none.','Greer. Their PR descriptions are novels.','Shea. Has automated their own job. Mostly.','Harlow. Monitors are 90% terminal windows.','Marlowe. Wrote a vim plugin nobody uses.','Sutton. Their desk has 3 monitors and a plant.','Ashton. "It passed in staging."','Sterling. Pair programs with a rubber duck.','Blair. Configured CI/CD in their sleep.','Harbor. Love-hate relationship with Docker.','Leighton. Names branches after movies.','Tanner. Writes Makefiles for everything.','Quinn. "This could be a microservice."','Justice. Has a testing pyramid tattoo.','Oakley. Strong opinions about semicolons.','Campbell. Owns the team Grafana dashboard.'],
  // Senior Dev (3)
  ['Pat. Has mass-deleted prod. Twice.','Lee. Writes code in their sleep.','Ash. Has mass-deleted prod on purpose.','Max. Reviews PRs in 30 seconds.','Kit. Rewrote the ORM. Again.','Val. "I\'ve seen this bug before."','Ray. Has 200 git aliases.','Jude. Pair programs with themselves.','Wren. Their code has no comments needed.','Sol. Fixed a bug from 2014.','Gray. Wrote the framework everyone hates.','Sloan. Reverts commits at 2am.','River. Their terminal is 90% aliases.','Dale. "We solved this in 2018."','Blair. Has mass-deleted a microservice.','Tatum. Wrote the migration that scared ops.','Casey. Answers questions with questions.','Jordan. "Don\'t touch that file."','Reign. Their debugging involves staring.','Shay. "Read the error message."','Addison. Can fix anything. Won\'t explain how.','Hollis. Owns the on-call pager nobody wants.','Remi. Wrote a tool to avoid meetings.','Noel. Their commit messages are haikus.','Harley. Knows which codebase secrets to keep.','August. "That\'s a known issue."','Quinn. Code reviews are therapy sessions.','Morgan. Has 6 mechanical keyboards ranked.','Blake. Been "about to refactor" for months.','Sage. Wrote the postmortem template.'],
  // Staff Engineer (4)
  ['River. Writes docs nobody reads.','Storm. Designed 3 failed microservices.','Brook. Has an RFC for everything.','Sage. Speaks only in diagrams.','Stone. Owns the deployment pipeline.','Cloud. Named a service after their cat.','Lake. Reviewed 10,000 PRs.','Cliff. "Let me draw this on a whiteboard."','Reed. Wrote the style guide. Ignores it.','Onyx. Still debugs with print statements.','Blythe. Drew the architecture diagram. It\'s wrong now.','Winter. Owns 6 deprecated services.','Shiloh. "Let me check the RFC."','Harbor. Migrated the database at 3am.','Trace. Knows where all the tech debt lives.','Merit. Built the internal CLI everyone uses.','Indigo. Has a Confluence page for everything.','Haven. Design docs get more reviews than code.','Blair. Wrote the runbook. Nobody follows it.','Roan. "We should think about scale."','Dale. Maintains 4 libraries nobody thanked them for.','Marlowe. PRs are essays with code attached.','Everest. Built the monitoring that pages everyone.','Oakley. "I have concerns."','Lark. Runs the architecture review meeting.','Timber. Wrote the migration tool by hand.','Echo. Has an opinion about every database.','Ridley. Their Slack threads are legendary.','Avery. "We need to talk about observability."','Ash. Their ADRs are longer than the code.'],
  // Principal Engineer (5)
  ['Atlas. Speaks in abstractions.','Nova. Hasn\'t written code in months.','Orion. Their PRs are 1-line fixes.','Cosmos. Invented a build system.','Zenith. Owns 4 internal tools.','Apex. Gives 2-hour code reviews.','Titan. "This needs more architecture."','Helix. Wrote the monorepo migration.','Summit. Has a Wikipedia page.','Quantum. Their meetings have meetings.','Blaze. Draws system diagrams on napkins.','Solstice. Their title confuses HR.','Dune. Hasn\'t opened an IDE in weeks.','Sterling. "The real problem is organizational."','Harbor. Keynoted a conference. Once.','Frost. Owns 3 patents. Forgot about 2.','Peak. Calendar is 80% "thinking time."','Ridge. "We should rewrite it." Gets approved.','Vale. Slack status is always "focusing."','Lark. Reviews architecture, not code.','Cypress. Speaks at all-hands. Quarterly.','Briar. Has been at the company since v1.','Arbor. Their opinion is the tiebreaker.','Flint. Wrote the migration path. All 47 steps.','Wynn. "This reminds me of the 2019 incident."','Alder. Has a graveyard of killed projects.','Reef. Their one-pager is never one page.','Sage. Writes proposals that become products.','Storm. "Let me share some historical context."','Onyx. Has a personal wiki with 500 pages.'],
  // Tech Lead (6)
  ['Lux. 50% meetings, 50% Slack.','Neon. Writes more Jira than code.','Pixel. Has 14 direct reports.','Vector. "Let\'s take this offline."','Cipher. Sprint planning takes all day.','Matrix. Approves all the PRs.','Prism. Their calendar is a war zone.','Delta. "Per my last email..."','Echo. Runs standup. Always late.','Flux. Manages up, delegates down.','Zenith. Has 3 standups before 10am.','Halo. Their Jira board is a work of art.','Binary. Approves PTO. Denies scope creep.','Slate. "Let\'s parking-lot that."','Blaze. Sprint retros are their therapy.','Nova. Writes quarterly OKRs in their sleep.','Cosmo. Has a team motto nobody remembers.','Atlas. "I\'ll loop in stakeholders."','Onyx. Their 1:1s run long. Always.','Harbor. Shields the team from management.','Rune. "We need to align on priorities."','Drift. Manages 3 Slack channels actively.','Cove. Their status reports are poetry.','Ash. "Let\'s timebox this discussion."','Sterling. Has a spreadsheet for everything.','Peak. Does code review by committee.','Vale. "Good catch in retro."','Ridley. Their roadmap has a roadmap.','Wren. Sends Monday motivation messages.','Sol. "Let\'s circle back on that."'],
  // CTO (7)
  ['Jordan. Sends "thoughts?" at 3am.','Morgan. Last commit: 2019.','Raven. Has a podcast nobody listens to.','Phoenix. "AI will handle that."','Sterling. Tweets about culture.','Royal. Has 5 monitors. Uses one.','Legend. Founded 3 startups. All pivoted.','Noble. Types with two fingers. Fast.','Archer. "Move fast and break things."','Crown. Their LinkedIn is a novel.','Atlas. Speaks at 4 conferences a year.','Blaze. Their vision deck is 200 slides.','Zenith. "We\'re an AI company now."','Onyx. Reads Hacker News religiously.','Storm. Last PR review: 2017.','Harbor. Knows every investor by first name.','Frost. Their Slack is 90% emoji reactions.','Peak. "Let\'s disrupt this space."','Sage. Founded in a garage. Actually a WeWork.','Dune. Has 3 advisors. Ignores all of them.','Vale. "We need to 10x our velocity."','Cosmo. Their all-hands are TED talks.','Ridley. Pivoted the company twice this year.','Flint. "Culture eats strategy for breakfast."','Arbor. Has a blog with 12 subscribers.','Lark. Their title changes yearly.','Wynn. "We\'re not a startup anymore."','Cypress. Reads every Glassdoor review.','Slate. "Let\'s be data-driven about this."','Drift. Their calendar has no free slots. Ever.'],
];

const CODE_BASE = [
  { name: 'Structured Programming',  desc: '+10% all production',      effect: 'prod',  val: 0.10 },
  { name: 'SQL & Relational Model',  desc: '+15% engineer speed',      effect: 'speed', val: 0.15 },
  { name: 'Shell Scripting',         desc: '+20% click power',         effect: 'click', val: 0.20 },
  { name: 'Makefile Build System',   desc: '-10% engineer hire costs', effect: 'cheap', val: 0.10 },
  { name: 'Event-Driven Programming',desc: '+10% all production',      effect: 'prod',  val: 0.10 },
  { name: 'Object-Oriented Design',  desc: '+15% engineer speed',      effect: 'speed', val: 0.15 },
  { name: 'Array Programming',       desc: '+20% click power',         effect: 'click', val: 0.20 },
  { name: 'HyperCard Stacks',        desc: '-10% engineer hire costs', effect: 'cheap', val: 0.10 },
  { name: 'Functional Programming',  desc: '+10% all production',      effect: 'prod',  val: 0.10 },
  { name: 'Finite State Machines',   desc: '+15% engineer speed',      effect: 'speed', val: 0.15 },
  { name: 'Plugin Architecture',     desc: '+20% click power',         effect: 'click', val: 0.20 },
  { name: 'Dynamic Linking (DLLs)',  desc: '-10% engineer hire costs', effect: 'cheap', val: 0.10 },
  { name: 'Client-Server Model',     desc: '+15% all production',      effect: 'prod',  val: 0.15 },
  { name: 'VM Bytecode & GC',        desc: '+20% engineer speed',      effect: 'speed', val: 0.20 },
  { name: 'Async Network Sockets',   desc: '+25% click power',         effect: 'click', val: 0.25 },
];

const FAME_TREE = [
  { id:'gen', name:'Engineers', color:'#7ee787', upgrades:[
    { id:'genSpeed',      name:'Overclock',         desc:'+25% engineer speed',            cost:1,  max:5,  req:-1 },
    { id:'genCheap',      name:'Bulk Discount',     desc:'-10% engineer costs',            cost:3,  max:3,  req:0 },
    { id:'genSynergy',    name:'Team Synergy',      desc:'+3% per engineer type owned',    cost:5,  max:1,  req:1 },
    { id:'genThreads',    name:'Parallel Threads',  desc:'+15% engineer speed',            cost:2,  max:3,  req:0 },
    { id:'genReview',     name:'Code Review',       desc:'+5% speed per engineer type',    cost:4,  max:1,  req:0 },
    { id:'genAcquihire',  name:'Acqui-hire',        desc:'-15% engineer hire costs',       cost:3,  max:2,  req:1 },
    { id:'genOpenSource', name:'Open Source',       desc:'+5% production per ship',        cost:7,  max:3,  req:2 },
    { id:'genPair',       name:'Pair Programming',  desc:'\u00d71.5 engineer production',  cost:8,  max:1,  req:2 },
  ]},
  { id:'click', name:'Click Power', color:'#58a6ff', upgrades:[
    { id:'aimTrainer',     name:'Aim Trainer',      desc:'Toggle: fast-bubble challenge mode', cost:1, max:1, req:-1 },
    { id:'clickDouble',    name:'Double Tap',       desc:'+100% click power',           cost:1,  max:3,  req:-1 },
    { id:'autoClick',      name:'Macro Script',     desc:'1 auto-click/s',              cost:3,  max:5,  req:1 },
    { id:'clickFrenzy',    name:'Code Frenzy',      desc:'Nap Pod bursts 5\u00d7 stronger', cost:5, max:1,  req:2 },
    { id:'clickPrecision', name:'Precision Click',  desc:'+1% of production per click', cost:2,  max:5,  req:1 },
    { id:'clickLucky',     name:'Lucky Click',      desc:'8% chance of 15\u00d7 click', cost:3,  max:3,  req:1 },
    { id:'autoBotnet',     name:'Bot Net',          desc:'+2 auto-clicks/s',            cost:4,  max:3,  req:2 },
    { id:'clickHackathon', name:'Hackathon',        desc:'Burst duration +50%',         cost:6,  max:2,  req:3 },
    { id:'clickCaffeine',  name:'Caffeine IV',      desc:'Auto-clicks charge bursts',   cost:8,  max:1,  req:3 },
  ]},
  { id:'prestige', name:'Business', color:'#f0883e', upgrades:[
    { id:'engine',         name:'Engine License',   desc:'New types start with 6 engineers', cost:2, max:1, req:-1 },
    { id:'marketing',      name:'Marketing Team',   desc:'+50% Fame per ship',          cost:1,  max:99, req:0 },
    { id:'publisher',      name:'Publisher Deal',   desc:'Auto-ship at threshold',      cost:3,  max:1,  req:1 },
    { id:'ventureCapital', name:'Seed Round',       desc:'+2%\u00d7Lv of each type\'s target per ship', cost:3, max:5, req:0 },
    { id:'goldenParachute',name:'Early Access',     desc:'Types unlock 1 year earlier per Lv', cost:5, max:3, req:0 },
    { id:'viralMarketing', name:'Viral Marketing',  desc:'+25% Fame per ship',          cost:2,  max:5,  req:1 },
    { id:'franchise',      name:'Franchise',        desc:'Ship threshold -10%',         cost:5,  max:3,  req:2 },
    { id:'ipo',            name:'IPO',              desc:'+1 Fame per 3 ships',         cost:6,  max:1,  req:2 },
  ]},
  { id:'streak', name:'Click Streak', color:'#da3633', upgrades:[
    { id:'streakUnlock',    name:'Adrenaline Rush', desc:'Unlock streak (2\u00d7 max)', cost:2,  max:1,  req:-1 },
    { id:'streakPower',     name:'Overdrive',       desc:'+1\u00d7 max streak',        cost:3,  max:3,  req:0 },
    { id:'streakMastery',   name:'Flow State',      desc:'2\u00d7 faster build, 2\u00d7 slower decay', cost:5, max:1, req:1 },
    { id:'streakSecondWind',name:'Second Wind',     desc:'Streak decays 50% slower',    cost:3,  max:2,  req:0 },
    { id:'streakCombo',     name:'Combo Breaker',   desc:'+0.1% production per click per streak', cost:3, max:3, req:0 },
    { id:'streakTurbo',     name:'Turbo Mode',      desc:'+2\u00d7 max streak',        cost:4,  max:2,  req:1 },
    { id:'streakZone',      name:'The Zone',        desc:'At max: +25% production',     cost:7,  max:2,  req:2 },
    { id:'streakTranscend', name:'Transcendence',   desc:'Streak min floor = 1.5\u00d7',cost:10, max:1,  req:2 },
  ]},
];

function shipAt() { recalcIfDirty(); return _C.shipAt; }

// ========== ACHIEVEMENTS ==========
const ACHIEVEMENTS = [
  // LoC milestones
  { id:'loc_1k',     name:'Hello World',       desc:'Write 1,000 LoC',              fame:1, check:()=>S.tLoc>=1e3 },
  { id:'loc_100k',   name:'Script Kiddie',     desc:'Write 100,000 LoC',            fame:1, check:()=>S.tLoc>=1e5 },
  { id:'loc_1m',     name:'Code Monkey',       desc:'Write 1,000,000 LoC',          fame:1, check:()=>S.tLoc>=1e6 },
  { id:'loc_100m',   name:'Code Ape',          desc:'Write 100,000,000 LoC',        fame:2, check:()=>S.tLoc>=1e8 },
  { id:'loc_1b',     name:'Code Gorilla',      desc:'Write 1,000,000,000 LoC',      fame:2, check:()=>S.tLoc>=1e9 },
  { id:'loc_1t',     name:'Code Titan',        desc:'Write 1,000,000,000,000 LoC',  fame:3, check:()=>S.tLoc>=1e12 },
  // Hiring
  { id:'hire_first', name:'First Hire',        desc:'Hire your first engineer',     fame:1, check:()=>S.g.some(n=>n>0) },
  { id:'hire_10',    name:'Growing Team',      desc:'Have 10+ total engineers',     fame:1, check:()=>S.g.reduce((a,b)=>a+b,0)>=10 },
  { id:'hire_50',    name:'Scaling Up',        desc:'Have 50+ total engineers',     fame:1, check:()=>S.g.reduce((a,b)=>a+b,0)>=50 },
  { id:'hire_all',   name:'Full Stack',        desc:'Own every engineer tier',      fame:2, check:()=>S.g.every(n=>n>0) },
  { id:'hire_100',   name:'Mega Corp',         desc:'Have 100+ total engineers',    fame:2, check:()=>S.g.reduce((a,b)=>a+b,0)>=100 },
  { id:'hire_500',   name:'Tech Giant',        desc:'Have 500+ total engineers',    fame:2, check:()=>S.g.reduce((a,b)=>a+b,0)>=500 },
  // Shipping
  { id:'ship_1',     name:'Gone Gold',           desc:'Ship your first software',      fame:1, check:()=>S.shipped>=1 },
  { id:'ship_3',     name:'Hat Trick',           desc:'Ship 3 software titles',        fame:2, check:()=>S.shipped>=3 },
  { id:'ship_5',     name:'Prolific Studio',     desc:'Ship 5 software titles',        fame:3, check:()=>S.shipped>=5 },
  { id:'ship_7',     name:'Seasoned Publisher',   desc:'Ship 7 software titles',       fame:4, check:()=>S.shipped>=7 },
  { id:'ship_10',    name:'Through the Ages',     desc:'Ship all 10 software titles',  fame:5, check:()=>S.shipped>=10 },
  // Office perks
  { id:'perk_first', name:'Office Upgrade',    desc:'Buy your first office perk',   fame:1, check:()=>S.c.some(n=>n>0) },
  { id:'perk_5',     name:'Nice Digs',         desc:'Buy 5 office perks',           fame:1, check:()=>S.c.filter(n=>n>0).length>=5 },
  { id:'perk_all',   name:'Dream Office',      desc:'Buy every office perk',        fame:2, check:()=>S.c.every(n=>n>0) },
  // Support staff
  { id:'ss_first',   name:'Delegation',        desc:'Hire your first support staff',fame:1, check:()=>S.ss.some(n=>n>0) },
  { id:'ss_all',     name:'Management Layer',  desc:'Hire all support staff',       fame:2, check:()=>S.ss.every(n=>n>0) },
  // Fame
  { id:'fame_5',     name:'Rising Star',       desc:'Earn 5 Fame',                  fame:1, check:()=>S.tFame>=5 },
  { id:'fame_25',    name:'Trending Dev',      desc:'Earn 25 Fame',                 fame:1, check:()=>S.tFame>=25 },
  { id:'fame_50',    name:'Industry Legend',   desc:'Earn 50 Fame',                 fame:2, check:()=>S.tFame>=50 },
  { id:'fame_100',   name:'Hall of Fame',      desc:'Earn 100 Fame',                fame:2, check:()=>S.tFame>=100 },
  // Click power
  { id:'click_100',  name:'Fast Fingers',      desc:'Reach 100 click power',        fame:1, check:()=>clickPow()>=100 },
  { id:'click_pow',  name:'Carpal Tunnel',     desc:'Reach 1,000 click power',      fame:1, check:()=>clickPow()>=1000 },
  { id:'click_10k',  name:'Mechanical Menace', desc:'Reach 10,000 click power',     fame:2, check:()=>clickPow()>=10000 },
  // Code base
  { id:'cb_1',       name:'Best Practices',    desc:'Unlock your first Code Base upgrade', fame:1, check:()=>S.cb>=1 },
  { id:'cb_5',       name:'Solid Foundation',   desc:'Unlock 5 Code Base upgrades',  fame:1, check:()=>S.cb>=5 },
  { id:'cb_10',      name:'Enterprise Grade',   desc:'Unlock 10 Code Base upgrades', fame:2, check:()=>S.cb>=10 },
  // Categories
  { id:'cat_5',      name:'Diversified',       desc:'Ship 5 unique categories',     fame:1, check:()=>S.catsSeen.length>=5 },
  { id:'cat_10',     name:'Jack of All Trades',desc:'Ship 10 unique categories',    fame:2, check:()=>S.catsSeen.length>=10 },
  // Equipment
  { id:'equip_first',name:'New Desk Smell',    desc:'Buy your first equipment',     fame:1, check:()=>S.eu.some(row=>row.some(v=>v>0)) },
  { id:'equip_full', name:'Fully Furnished',   desc:'Max-tier equip one engineer',  fame:1, check:()=>S.eu.some(row=>row.every((v,i)=>v>=EMP_UPS[i].tiers.length)) },
  // Production rate
  { id:'lps_100',    name:'Assembly Line',     desc:'Reach 100 res/s',              fame:1, check:()=>lps()>=100 },
  { id:'lps_10k',    name:'Code Factory',      desc:'Reach 10,000 res/s',           fame:1, check:()=>lps()>=10000 },
  { id:'lps_1m',     name:'Code Singularity',  desc:'Reach 1,000,000 res/s',        fame:2, check:()=>lps()>=1e6 },
  { id:'lps_1b',     name:'Infinite Monkeys',  desc:'Reach 1,000,000,000 res/s',    fame:3, check:()=>lps()>=1e9 },
  // Engineer types
  { id:'type_3',     name:'Triple Threat',     desc:'Unlock 3 engineer types',      fame:1, check:()=>S.unlockedTypes.length>=3 },
  { id:'type_5',     name:'Department Heads',  desc:'Unlock 5 engineer types',      fame:2, check:()=>S.unlockedTypes.length>=5 },
  { id:'type_all',   name:'Full Roster',       desc:'Unlock all 10 engineer types', fame:3, check:()=>S.unlockedTypes.length>=10 },
  // Engineer tiers
  { id:'tier_cto',   name:'C-Suite',           desc:'Promote an engineer to CTO',   fame:2, check:()=>{const all=[...S.coders,...Object.values(S.engineers||{}).flatMap(e=>e.list||[])];return all.some(c=>c.tier>=7);} },
  { id:'tier_all',   name:'Career Ladder',     desc:'Have all 8 engineer tiers at once', fame:3, check:()=>{const tiers=new Set();S.coders.forEach(c=>tiers.add(c.tier));Object.values(S.engineers||{}).forEach(e=>(e.list||[]).forEach(c=>tiers.add(c.tier)));return tiers.size>=8;} },
  // Skill tree
  { id:'skill_auto', name:'Idle Hands',        desc:'Unlock Auto-Click',            fame:1, check:()=>!!S.f.autoClick },
  { id:'skill_pub',  name:'Going Public',      desc:'Hire a Publisher',             fame:1, check:()=>!!S.f.publisher },
  { id:'skill_ipo',  name:'IPO Day',           desc:'Take your company public',     fame:2, check:()=>!!S.f.ipo },
  { id:'skill_10',   name:'Skill Hoarder',     desc:'Buy 10 skill tree perks',      fame:2, check:()=>Object.values(S.f).filter(v=>v>0).length>=10 },
  // Click streaks
  { id:'streak_5x',  name:'On Fire',           desc:'Reach a 5\u00d7 click streak', fame:1, check:()=>typeof streakMul!=='undefined'&&streakMul>=5 },
  { id:'streak_max', name:'In the Zone',       desc:'Max out your click streak',    fame:2, check:()=>typeof streakMul!=='undefined'&&streakMul>=(2+(S.f.streakPower||0)+2*(S.f.streakTurbo||0)) },
  // Retirement
  { id:'retire_1',   name:'Gold Watch',        desc:'Have an engineer retire',      fame:1, check:()=>(S.totalRetired||0)>=1 },
  { id:'retire_10',  name:'Old Guard',         desc:'Have 10 engineers retire',     fame:2, check:()=>(S.totalRetired||0)>=10 },
  // Eras
  { id:'era_dos',    name:'Command Line',      desc:'Reach the DOS era (1986)',     fame:1, check:()=>currentYear()>=1986 },
  { id:'era_xp',     name:'Bliss Wallpaper',   desc:'Reach the Windows XP era (2004)', fame:2, check:()=>currentYear()>=2004 },
  { id:'era_modern', name:'Flat Design',       desc:'Reach the Windows 11 era (2024)', fame:3, check:()=>currentYear()>=2024 },
  // Recruiter upgrades
  { id:'recruit_all',name:'Talent Pipeline',   desc:'Buy all recruiter upgrades',   fame:2, check:()=>S.ru.every(v=>v>0) },
  // Trainer
  { id:'train_max',  name:'Sensei',            desc:'Max out trainer level on any staff', fame:2, check:()=>S.trainerLvl&&S.trainerLvl.some(l=>l>=10) },
  // Total engineers
  { id:'hire_1k',    name:'Unicorn Status',    desc:'Have 1,000+ total engineers',  fame:3, check:()=>{let t=S.g.reduce((a,b)=>a+b,0);Object.values(S.engineers||{}).forEach(e=>t+=(e.list||[]).length);return t>=1000;} },
];

// ========== RANDOM EVENTS ==========
const EVENTS = [
  { name:'Spaghetti Code', choices:[
    { label:'Refactor',       desc:'+50% clicks, -40% prod for 20s',  dur:20, mul:0.6,  clickMul:1.5 },
    { label:'Patch & Ship',   desc:'+60% prod, -30% clicks for 15s',  dur:15, mul:1.6,  clickMul:0.7 },
  ]},
  { name:'Publisher Deal', choices:[
    { label:'Sign Contract',  desc:'\u00d73 prod, -50% clicks for 8s',  dur:8,  mul:3.0,  clickMul:0.5 },
    { label:'Stay Indie',     desc:'+80% clicks, -30% prod for 18s',   dur:18, mul:0.7,  clickMul:1.8 },
  ]},
  { name:'Source Code Sharing', choices:[
    { label:'Share Freely',    desc:'+100% clicks, -25% prod for 25s',   dur:25, mul:0.75, clickMul:2.0 },
    { label:'Keep Proprietary',desc:'+75% prod, -20% clicks for 15s',   dur:15, mul:1.75, clickMul:0.8 },
  ]},
  { name:'Deadline Crunch', choices:[
    { label:'Pull All-Nighter',desc:'+100% prod, -50% clicks for 15s', dur:15, mul:2.0,  clickMul:0.5 },
    { label:'Cut Scope',       desc:'+80% clicks, -30% prod for 20s',  dur:20, mul:0.7,  clickMul:1.8 },
  ]},
  { name:'Trade Show', choices:[
    { label:'Live Demo',       desc:'\u00d72.5 prod, -60% clicks for 10s', dur:10, mul:2.5,  clickMul:0.4 },
    { label:'Hand Out Floppies',desc:'+75% clicks, -20% prod for 18s',     dur:18, mul:0.8,  clickMul:1.75 },
  ]},
  { name:'Bug Hunt', choices:[
    { label:'Fix Everything',  desc:'+120% clicks, -50% prod for 20s',  dur:20, mul:0.5,  clickMul:2.2 },
    { label:'Ship with Workaround',desc:'+60% prod, -25% clicks for 15s',dur:15, mul:1.6,  clickMul:0.75 },
  ]},
  { name:'Platform Port', choices:[
    { label:'Full Rewrite',    desc:'\u00d73 prod, -70% clicks for 8s',   dur:8,  mul:3.0,  clickMul:0.3 },
    { label:'Compatibility Layer',desc:'+50% clicks, -30% prod for 22s',  dur:22, mul:0.7,  clickMul:1.5 },
  ]},
  { name:'Magazine Review', choices:[
    { label:'Exclusive Preview',desc:'+90% prod, -40% clicks for 15s',    dur:15, mul:1.9,  clickMul:0.6 },
    { label:'Public Beta',     desc:'+70% clicks, -20% prod for 20s',   dur:20, mul:0.8,  clickMul:1.7 },
  ]},
];

const MILESTONES = [
  { id:'loc_10k',  threshold:1e4,   msg:'10,000 LoC written!' },
  { id:'loc_100k', threshold:1e5,   msg:'100,000 LoC written!' },
  { id:'loc_1m',   threshold:1e6,   msg:'1 Million LoC!' },
  { id:'loc_10m',  threshold:1e7,   msg:'10 Million LoC!' },
  { id:'loc_100m', threshold:1e8,   msg:'100 Million LoC!' },
  { id:'loc_1b',   threshold:1e9,   msg:'1 Billion LoC!' },
  { id:'loc_1t',   threshold:1e12,  msg:'1 Trillion LoC!' },
];

const NYT_HEADLINES = {
  1979:["Iranian Militants Storm U.S. Embassy in Tehran, Seize Hostages","Soviet Forces Invade Afghanistan in Major Escalation of Cold War","Accident at Three Mile Island Reactor Raises Nuclear Safety Fears","Margaret Thatcher Becomes Britain's First Woman Prime Minister","Sandinista Rebels Overthrow Somoza Regime in Nicaragua"],
  1980:["U.S. Boycotts Moscow Olympics Over Soviet Invasion of Afghanistan","Mount St. Helens Erupts in Catastrophic Blast, Dozens Feared Dead","John Lennon Shot Dead Outside His Manhattan Apartment","Iraq Invades Iran, Launching Full-Scale War in the Persian Gulf","Reagan Wins Presidency in Landslide Over Carter"],
  1981:["President Reagan Shot Outside Washington Hotel; Condition Serious","Pope John Paul II Wounded by Gunman in St. Peter's Square","Sandra Day O'Connor Confirmed as First Woman on Supreme Court","Sadat Assassinated at Military Parade in Cairo","First Space Shuttle Columbia Completes Maiden Voyage"],
  1982:["Britain and Argentina Go to War Over the Falkland Islands","Israel Invades Lebanon in Drive Against Palestinian Forces","Thousands Rally in Central Park for Nuclear Freeze","Tylenol Poisonings in Chicago Kill 7, Spark Nationwide Panic","Mexico Defaults on Foreign Debt, Triggering Global Financial Crisis"],
  1983:["Korean Air Lines Jet Shot Down by Soviet Fighter; 269 Dead","Suicide Bomber Kills 241 Marines at Beirut Barracks","U.S. Forces Invade Grenada to Oust Marxist Government","Reagan Proposes Space-Based Missile Defense System","Pioneer 10 Crosses Neptune's Orbit, Leaving the Solar System"],
  1984:["Toxic Gas Leak at Union Carbide Plant in Bhopal Kills Thousands","Indira Gandhi Assassinated by Her Own Bodyguards in New Delhi","Famine in Ethiopia Reaches Catastrophic Scale as Millions Starve","Reagan Wins 49 States in Historic Rout of Mondale","Soviet Bloc Boycotts Los Angeles Olympics in Cold War Retaliation"],
  1985:["Gorbachev Rises to Power in Kremlin, Pledges Reform","TWA Jet Hijacked to Beirut; Hostages Held for 17 Days","Earthquake Devastates Mexico City; Thousands Killed","Live Aid Concerts Raise Millions for African Famine Relief","Scientists Discover Widening Hole in Antarctic Ozone Layer"],
  1986:["Space Shuttle Challenger Explodes Seconds After Liftoff; Crew of 7 Dead","Nuclear Reactor at Chernobyl Explodes, Spreading Radioactive Cloud Across Europe","Ferdinand Marcos Flees Philippines as People Power Revolution Prevails","Iran-Contra Affair Revealed: White House Secretly Sold Arms to Iran","U.S. Bombs Libya in Retaliation for Terrorist Attacks"],
  1987:["Stock Market Plunges 508 Points in Worst Single-Day Crash","Reagan and Gorbachev Sign Treaty to Eliminate Nuclear Missiles","Palestinian Uprising Erupts Across Israeli-Occupied Territories","Baby Jessica Rescued After 58 Hours Trapped in Texas Well","World Population Reaches 5 Billion"],
  1988:["Pan Am Flight 103 Destroyed by Bomb Over Lockerbie; 270 Dead","Soviet Union Begins Withdrawal From Afghanistan After 9-Year War","George H.W. Bush Elected 41st President in Victory Over Dukakis","Iran and Iraq Agree to Cease-Fire, Ending 8-Year War","Devastating Earthquake in Armenia Kills Tens of Thousands"],
  1989:["Berlin Wall Falls as East Germany Opens Its Borders","Chinese Army Crushes Tiananmen Square Protest; Hundreds Feared Dead","Exxon Valdez Runs Aground in Alaska, Causing Massive Oil Spill","Velvet Revolution Topples Communist Rule in Czechoslovakia","U.S. Invades Panama to Oust Noriega"],
  1990:["Iraq Invades Kuwait; Bush Vows the Aggression 'Will Not Stand'","East and West Germany Reunite After 45 Years of Division","Nelson Mandela Freed After 27 Years in South African Prison","Hubble Space Telescope Launched Into Orbit by Discovery Crew","Lech Walesa Elected President of Poland in Historic Vote"],
  1991:["Soviet Union Dissolves; Gorbachev Resigns as Cold War Ends","U.S.-Led Coalition Routs Iraqi Forces in 100-Hour Ground War","Clarence Thomas Confirmed to Supreme Court After Bitter Hearings","Yugoslavia Descends Into Civil War as Republics Declare Independence","Rajiv Gandhi Assassinated by Suicide Bomber at Campaign Rally"],
  1992:["Los Angeles Erupts in Riots After Officers Acquitted in King Beating","Bill Clinton Defeats Bush, Ending 12 Years of Republican Rule","U.N. Sends Troops to Somalia as Famine Grips the Nation","Hurricane Andrew Ravages South Florida, Leaving $25 Billion in Damage","Bosnian War Intensifies as Siege of Sarajevo Enters Its Darkest Phase"],
  1993:["Bomb Explodes in World Trade Center Garage, Killing 6","Rabin and Arafat Shake Hands on White House Lawn in Historic Accord","Siege at Waco Compound Ends in Deadly Inferno; 76 Dead","European Union Formally Established Under Maastricht Treaty","U.S. Soldiers Killed in Mogadishu After Black Hawk Helicopters Downed"],
  1994:["Genocide Sweeps Rwanda as Hutu Militias Massacre 800,000 Tutsis","Nelson Mandela Elected President of South Africa in First Free Vote","O.J. Simpson Charged With Murder After Dramatic Freeway Chase","Channel Tunnel Opens, Linking Britain and France Beneath the Sea","North Korea Nuclear Crisis Deepens as Kim Il-sung Dies"],
  1995:["Bomb Destroys Federal Building in Oklahoma City; 168 Dead","Israeli Prime Minister Rabin Assassinated at Peace Rally in Tel Aviv","Srebrenica Massacre: Bosnian Serbs Kill 8,000 Muslim Men and Boys","O.J. Simpson Found Not Guilty in Verdict That Rivets the Nation","Kobe Earthquake in Japan Kills More Than 6,000"],
  1996:["Taliban Seize Kabul, Impose Strict Islamic Rule Over Afghanistan","Clinton Wins Reelection, Defeating Dole in Decisive Victory","Bomb Blast at Atlanta Olympics Kills 1, Injures More Than 100","Mad Cow Disease Crisis Grips Britain; EU Bans British Beef","Dolly the Sheep Cloned From Adult Cell in Scientific First"],
  1997:["Princess Diana Killed in Paris Car Crash; World Mourns","Britain Returns Hong Kong to China After 156 Years of Colonial Rule","Scottish Scientists Announce Successful Cloning of a Sheep","Asian Financial Crisis Sweeps Markets From Bangkok to Seoul","Pathfinder Lands on Mars, Sending Back First Rover Images"],
  1998:["Clinton Impeached by House Over Lewinsky Affair","U.S. Embassies in Kenya and Tanzania Bombed; Hundreds Dead","Good Friday Agreement Brings Hope for Peace in Northern Ireland","India and Pakistan Conduct Nuclear Tests in Dangerous Escalation","Hurricane Mitch Devastates Central America, Killing Over 11,000"],
  1999:["NATO Launches Air War Against Serbia Over Kosovo Crisis","Two Students Kill 13 in Rampage at Columbine High School","Panama Canal Handed to Panama After Nearly a Century of U.S. Control","Catastrophic Earthquake Kills Thousands in Turkey","Global Anxiety Rises Over Y2K Computer Bug as Millennium Approaches"],
  2000:["Supreme Court Halts Florida Recount, Handing Presidency to Bush","Dot-Com Bubble Bursts as Nasdaq Plummets From Record Highs","USS Cole Bombed in Yemen Port; 17 American Sailors Dead","Concorde Crashes Outside Paris After Takeoff, Killing 113","Leaders of North and South Korea Hold First-Ever Summit"],
  2001:["Hijacked Jets Destroy Twin Towers and Hit Pentagon; Thousands Dead","U.S. Invades Afghanistan in Response to Sept. 11 Attacks","Anthrax-Laced Letters Sent to Congress and Media Offices","Enron Collapses in Largest Bankruptcy in American History","Apple Unveils the iPod, Promising 1,000 Songs in Your Pocket"],
  2002:["Bali Nightclub Bombings Kill 202 in Worst Indonesian Terror Attack","Washington Snipers Terrorize Capital Region for Three Weeks","Bush Labels Iraq, Iran and North Korea an 'Axis of Evil'","Moscow Theater Siege Ends in Deadly Raid; 130 Hostages Die","Euro Notes and Coins Enter Circulation Across 12 Nations"],
  2003:["U.S. Invades Iraq, Toppling Saddam Hussein's Regime in Weeks","Space Shuttle Columbia Disintegrates on Reentry; 7 Astronauts Lost","SARS Outbreak Spreads From Asia, Triggering Global Health Alert","Saddam Hussein Captured by U.S. Forces Hiding in Underground Hole","Massive Blackout Plunges Northeast U.S. and Canada Into Darkness"],
  2004:["Tsunami in Indian Ocean Kills Over 230,000 Across 14 Countries","Terror Bombings Rip Through Madrid Trains, Killing 191","Bush Wins Second Term, Defeating Kerry in Close Election","Facebook Launches From Harvard Dorm Room","Beslan School Siege in Russia Ends in Carnage; Over 330 Dead"],
  2005:["Hurricane Katrina Devastates Gulf Coast; New Orleans Submerged","Pope John Paul II Dies at 84; Millions Mourn Worldwide","London Transit Bombings Kill 52 in Coordinated Rush-Hour Attacks","Massive Earthquake in Kashmir Kills Over 80,000","Kyoto Protocol on Climate Change Takes Effect Without U.S."],
  2006:["Saddam Hussein Executed by Hanging After War Crimes Conviction","North Korea Conducts First Nuclear Test, Defying World Pressure","Israel and Hezbollah Fight 34-Day War Across Lebanese Border","Pluto Stripped of Planet Status by International Astronomers","Twitter Launches, Introducing the World to Microblogging"],
  2007:["Global Financial Crisis Begins as U.S. Subprime Mortgage Market Collapses","Apple Unveils the iPhone, Redefining the Mobile Phone","Virginia Tech Gunman Kills 32 in Deadliest U.S. School Shooting","Benazir Bhutto Assassinated at Rally in Pakistan","Former Vice President Gore Wins Nobel Peace Prize for Climate Work"],
  2008:["Barack Obama Elected First Black President of the United States","Lehman Brothers Collapses, Triggering Global Financial Panic","Russia Invades Georgia in Brief but Brutal War Over South Ossetia","Mumbai Besieged by Terrorist Gunmen for 3 Days; 166 Killed","Beijing Hosts Olympic Games in Spectacular Opening to the World"],
  2009:["Michael Jackson Dies at 50, Sending Shockwaves Around the World","Obama Inaugurated as 44th President Before Massive Crowd on the Mall","Swine Flu Pandemic Declared by World Health Organization","Iran Erupts in Protest Over Disputed Presidential Election","US Airways Jet Lands Safely in Hudson River; All 155 Survive"],
  2010:["Massive Earthquake Devastates Haiti, Killing Over 200,000","Deepwater Horizon Rig Explodes, Unleashing Worst U.S. Oil Spill","33 Chilean Miners Rescued After 69 Days Trapped Underground","Arab Spring Ignites as Tunisian Protests Topple Authoritarian Regime","WikiLeaks Publishes Vast Trove of Classified U.S. Documents"],
  2011:["Osama bin Laden Killed by U.S. Navy SEALs in Pakistan Raid","Earthquake and Tsunami Devastate Japan; Fukushima Reactors in Meltdown","Qaddafi Killed as Libyan Civil War Reaches Its Violent End","Arab Spring Spreads: Mubarak Ousted in Egypt After 30-Year Rule","Occupy Wall Street Movement Spreads to Cities Across the Nation"],
  2012:["Gunman Kills 20 Children and 6 Adults at Sandy Hook Elementary","Obama Wins Second Term, Defeating Romney in Hard-Fought Race","Higgs Boson Discovered at CERN, Confirming Fundamental Physics Theory","Superstorm Sandy Batters East Coast, Paralyzing New York City","Felix Baumgartner Jumps From Edge of Space, Breaking Sound Barrier"],
  2013:["Bombs Explode at Boston Marathon Finish Line; 3 Dead, Scores Injured","Edward Snowden Reveals Vast N.S.A. Surveillance Programs","Pope Benedict XVI Resigns; Francis Elected as First Latin American Pope","Typhoon Haiyan Strikes Philippines With Record Force, Killing Thousands","Nelson Mandela Dies at 95; South Africa and the World Grieve"],
  2014:["Russia Annexes Crimea as Ukraine Crisis Escalates Into Armed Conflict","Malaysia Airlines Flight 370 Vanishes Over Indian Ocean With 239 Aboard","ISIS Sweeps Across Iraq, Declaring an Islamic Caliphate","Ebola Outbreak in West Africa Becomes Deadliest in History","Malaysia Airlines Jet Shot Down Over Ukraine; 298 Killed"],
  2015:["Paris Under Siege: Coordinated Terrorist Attacks Kill 130","Supreme Court Rules Same-Sex Marriage Is Legal Nationwide","Iran and World Powers Reach Historic Nuclear Deal After Years of Talks","Migrant Crisis Engulfs Europe as Millions Flee War and Poverty","Paris Climate Accord Reached as 195 Nations Pledge to Cut Emissions"],
  2016:["Donald Trump Elected President in Stunning Upset Over Clinton","Britain Votes to Leave the European Union in Historic Referendum","Pulse Nightclub Massacre in Orlando Kills 49 in Deadliest U.S. Shooting","Zika Virus Epidemic Sweeps Latin America, Threatening Olympics","Fidel Castro Dies at 90, Ending an Era in Cuba"],
  2017:["Hurricane Maria Devastates Puerto Rico, Leaving Island Without Power","Gunman Opens Fire on Las Vegas Concert Crowd, Killing 60","Charlottesville Rally Turns Deadly as Car Plows Into Counterprotesters","#MeToo Movement Erupts After Weinstein Accusations Rock Hollywood","Trump Orders Travel Ban on Several Muslim-Majority Nations"],
  2018:["Trump and Kim Jong-un Hold Unprecedented Summit in Singapore","Jamal Khashoggi Killed Inside Saudi Consulate in Istanbul","Thai Soccer Team Rescued From Flooded Cave After 18-Day Ordeal","Migrant Caravan at U.S. Border Becomes Flashpoint in Immigration Debate","California Wildfires Become Deadliest and Most Destructive in State History"],
  2019:["Trump Impeached by House on Abuse of Power and Obstruction Charges","Notre-Dame Cathedral Engulfed in Flames, Spire Collapses","Hong Kong Rocked by Months of Massive Pro-Democracy Protests","First Image of a Black Hole Captured by Global Telescope Network","Amazon Rainforest Fires Surge, Igniting Global Alarm"],
  2020:["Global Pandemic: Coronavirus Sweeps the World, Killing Millions","George Floyd Killed by Minneapolis Police; Protests Erupt Nationwide","Biden Defeats Trump to Win the Presidency; Trump Refuses to Concede","Scientists Develop Covid-19 Vaccines in Record Time","Beirut Rocked by Catastrophic Explosion at Port; Over 200 Dead"],
  2021:["Pro-Trump Mob Storms U.S. Capitol in Bid to Overturn Election","U.S. Withdraws From Afghanistan as Taliban Retake the Country","Suez Canal Blocked for 6 Days After Giant Container Ship Runs Aground","Climate Disasters Intensify: Record Fires, Floods and Heat Waves Hit Globe","Pfizer and Moderna Vaccines Rolled Out in Largest Inoculation Campaign in History"],
  2022:["Russia Invades Ukraine in Largest European Land War Since 1945","Queen Elizabeth II Dies at 96 After 70-Year Reign","Supreme Court Overturns Roe v. Wade, Ending Federal Abortion Right","Iran Shaken by Protests After Mahsa Amini Dies in Morality Police Custody","NASA's DART Mission Successfully Deflects Asteroid in Planetary Defense Test"],
  2023:["Hamas Launches Surprise Attack on Israel; War Engulfs Gaza","ChatGPT Ignites Global AI Race, Transforming Technology Landscape","Earthquake in Turkey and Syria Kills Over 50,000","Submersible Visiting Titanic Wreck Implodes, Killing All 5 Aboard","Wagner Mutiny in Russia: Armed Convoy Marches Toward Moscow Before Standing Down"],
  2024:["Trump Convicted on 34 Felony Counts in Historic Criminal Trial","Trump Survives Assassination Attempt at Pennsylvania Rally","Trump Wins Second Term as 47th President, Defeating Harris","Baltimore Bridge Collapses After Being Struck by Container Ship","Notre-Dame Cathedral Reopens After 5-Year Restoration"],
  2025:["Trump Launches Sweeping Tariffs, Rattling Global Trade Order","Deadly Wildfires Ravage Los Angeles, Forcing Mass Evacuations","Pope Francis Dies at 88; Vatican Prepares for Conclave","DeepSeek AI Sends Shockwaves Through Markets and Silicon Valley","Gaza Ceasefire Brokered After 15 Months of Devastating Conflict"],
};

let activeEvent = null, eventCooldown = 0, isShipping = false, achCheckAcc = 0, petPawTimer = 0, buyerTimer = 0, facilityTimer = 0, trainerTimer = 0, nytShown = 0, _nytPicked = null, pendingOfflineMsg = null;
// Staff dialogue state
let _dlgTimer = 0, _dlgNext = 60 + Math.random() * 30, _dlgRecent = [];
// Ring buffer for click times
const CT_SIZE = 200;
const _ct = new Float64Array(CT_SIZE);
let _ctH = 0, _ctT = 0, _ctN = 0;
function ctPush(v) { _ct[_ctH] = v; _ctH = (_ctH + 1) % CT_SIZE; if (_ctN < CT_SIZE) _ctN++; else _ctT = (_ctT + 1) % CT_SIZE; }
function ctTrim(cutoff) { while (_ctN > 0 && _ct[_ctT] < cutoff) { _ctT = (_ctT + 1) % CT_SIZE; _ctN--; } }
function ctReset() { _ctH = 0; _ctT = 0; _ctN = 0; }
let streakMul = 1, lastClickTime = 0;

// Cached DOM refs for tick-hot elements
let _petEl, _rFill, _fFill, _petBarkEl, _petBarkTimer, _facilityBest = null;
const PET_BARKS = ['Woof!','Arf!','Bark!','Bork!','Yap!','Ruff!','Bow wow!','Woof woof!'];
function petBark() {
  if (!_petBarkEl) _petBarkEl = document.getElementById('petBark');
  if (!_petBarkEl) return;
  _petBarkEl.textContent = PET_BARKS[Math.floor(Math.random() * PET_BARKS.length)];
  _petBarkEl.classList.add('show');
  clearTimeout(_petBarkTimer);
  _petBarkTimer = setTimeout(() => _petBarkEl.classList.remove('show'), 800);
}
let _thermoEl, _thermoFill, _thermoVal, _thermoBulb;
function updateThermo() {
  if (!_thermoEl) {
    _thermoEl = document.getElementById('streakThermo');
    _thermoFill = document.getElementById('streakFill');
    _thermoVal = document.getElementById('streakVal');
    _thermoBulb = document.getElementById('thermoBulb');
  }
  if (!_thermoEl) return;
  if (!S.f.streakUnlock) { _thermoEl.style.opacity = '0'; return; }
  const sMax = 2 + S.f.streakPower + 2 * S.f.streakTurbo;
  const active = streakMul > 1.05;
  _thermoEl.style.opacity = active ? '1' : '0';
  if (active) {
    const pct = (streakMul - 1) / (sMax - 1);
    _thermoFill.style.height = (pct * 100) + '%';
    _thermoVal.textContent = streakMul.toFixed(1) + 'x';
    _thermoBulb.className = 'thermo-bulb ' + (streakMul >= sMax * 0.8 ? 'hot' : streakMul >= sMax * 0.4 ? 'warm' : 'cool');
  }
}

