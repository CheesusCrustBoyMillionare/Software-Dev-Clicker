// ========== TYCOON REVIEW QUOTES (v2) ==========
// Phase 4F: Template-based critic quote generator.
// Generates 2-3 quotes per launched project for flavor + social sharing.
(function(){
  'use strict';

  // ---------- Era-appropriate press outlets ----------
  // Picked from pools based on project year
  const PRESS_OUTLETS = [
    { name:'Compute!',          era:[1980, 1995], types:['game','business'] },
    { name:'Byte Magazine',     era:[1980, 1998], types:['business'] },
    { name:'Creative Computing', era:[1980, 1993], types:['game','business'] },
    { name:'Family Computing',  era:[1980, 1992], types:['game','business'] },
    { name:'PC Gamer',          era:[1993, 9999], types:['game'] },
    { name:'GamePro',           era:[1989, 2011], types:['game'] },
    { name:'Edge',              era:[1993, 9999], types:['game'] },
    { name:'TechPulse',         era:[1990, 9999], types:['business','web','saas'] },
    { name:'Wired',             era:[1993, 9999], types:['business','web','saas','ai'] },
    { name:'IGN',               era:[1996, 9999], types:['game'] },
    { name:'Gamespot',          era:[1996, 9999], types:['game'] },
    { name:'Ars Technica',      era:[1998, 9999], types:['business','web','saas','ai'] },
    { name:'Polygon',           era:[2012, 9999], types:['game'] },
    { name:'The Verge',         era:[2011, 9999], types:['web','saas','ai','mobile'] },
    { name:'TouchArcade',       era:[2008, 9999], types:['mobile'] },
    { name:'Digital Foundry',   era:[2004, 9999], types:['game'] },
    { name:'TechCrunch',        era:[2005, 9999], types:['web','saas','ai'] },
    { name:'Waypoint',          era:[2016, 9999], types:['game'] },
  ];

  // ---------- Quote templates per score band ----------
  // {title} is filled with proj.name; {genre} with the project type label
  const QUOTE_TEMPLATES = {
    masterpiece: [ // 90+
      "{title} is a stunning {genre} that redefines the medium. A masterwork.",
      "Every element of {title} sings — it's the {genre} of the year.",
      "An essential {genre}. {title} will be studied for years to come.",
      "{title} didn't just meet expectations — it shattered them.",
      "Generational. {title} is what the {genre} genre can be at its peak.",
    ],
    great: [ // 75-89
      "{title} is a polished, engaging {genre} that plays it smart.",
      "Not perfect, but {title} delivers on its promise — a solid {genre}.",
      "{title} nails the fundamentals and adds enough spark to stand out.",
      "Confident and assured, {title} earns its place among the best.",
      "{title} rewards patience with one of the better {genre}s this year.",
    ],
    good: [ // 60-74
      "{title} is a passable {genre} that gets the basics right.",
      "There's good here, but {title} also plays it safe.",
      "{title} holds together for the duration, though it rarely surprises.",
      "Competent. {title} won't win awards but doesn't embarrass itself.",
      "{title} is a decent {genre} if you're in the mood, but not a must-have.",
    ],
    flawed: [ // 40-59
      "{title} has the ideas but not the polish — a frustrating {genre}.",
      "Disappointing. {title} can't quite deliver on its promises.",
      "{title} buckles under its own ambitions. A near-miss.",
      "Rough edges everywhere. {title} needed more time in the oven.",
      "{title} flashes brilliance between stretches of tedium.",
    ],
    dismal: [ // <40
      "{title} is broken in too many ways to recommend.",
      "A misfire. {title} misunderstands what its {genre} audience wants.",
      "Avoid {title} — the {genre} genre deserves better than this.",
      "Tedious, confused, and buggy. {title} wastes its runtime.",
      "{title} feels like an alpha that shipped three years early.",
    ],
  };

  function scoreBand(critic) {
    if (critic >= 90) return 'masterpiece';
    if (critic >= 75) return 'great';
    if (critic >= 60) return 'good';
    if (critic >= 40) return 'flawed';
    return 'dismal';
  }

  // ---------- Generation ----------
  function generateReviews(proj, count) {
    count = count || 3;
    const critic = proj.criticScore || 60;
    const band = scoreBand(critic);
    const templates = QUOTE_TEMPLATES[band];
    const year = S.calendar?.year || 1980;
    const typeDef = window.PROJECT_TYPES?.[proj.type];
    const genreLabel = (typeDef?.label || proj.type).toLowerCase();

    const validOutlets = PRESS_OUTLETS.filter(o =>
      year >= o.era[0] && year <= o.era[1] &&
      o.types.includes(proj.type)
    );

    const reviews = [];
    const usedTemplates = new Set();
    const usedOutlets = new Set();
    for (let i = 0; i < count; i++) {
      // Pick template (no repeats)
      const avail = templates.filter(t => !usedTemplates.has(t));
      const tpl = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : templates[0];
      usedTemplates.add(tpl);
      // Slightly vary the score between reviews (±5)
      const thisScore = Math.max(1, Math.min(100, critic + Math.round((Math.random() - 0.5) * 10)));
      // Pick outlet (no repeats, era-appropriate)
      const outletPool = validOutlets.length > 0 ? validOutlets.filter(o => !usedOutlets.has(o)) : [];
      const outlet = outletPool.length > 0 ? outletPool[Math.floor(Math.random() * outletPool.length)] :
                     (validOutlets[0] || { name: 'Anonymous Blog' });
      if (outlet) usedOutlets.add(outlet);

      const text = tpl.replace(/\{title\}/g, proj.name).replace(/\{genre\}/g, genreLabel);
      reviews.push({
        outlet: outlet.name,
        text,
        score: thisScore,
      });
    }
    return reviews;
  }

  // ---------- Hook: generate + attach reviews on ship ----------
  document.addEventListener('tycoon:research-completed', () => {}); // no-op placeholder

  // We can't intercept shipProject easily here without wrapping, so provide API
  // + the UI layer calls generateReviews after launch.
  window.tycoonReviews = {
    generateReviews,
    scoreBand,
    PRESS_OUTLETS,
    QUOTE_TEMPLATES,
  };
  if (window.dbg) window.dbg.reviews = window.tycoonReviews;

  console.log('[tycoon-reviews] module loaded.');
})();
