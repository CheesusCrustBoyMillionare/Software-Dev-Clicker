// ========== TYCOON MARKETING CHANNELS (v2) ==========
// Phase 4E: multi-channel marketing. Player picks 0-4 channels at Polish phase.
// Each channel has cost + per-type effectiveness; certain combos synergize.
(function(){
  'use strict';

  // ---------- Channel catalog ----------
  // effectiveness: per-type sales multiplier (1 = no effect, 1.1 = +10%)
  // 'all' applies to any type not explicitly listed
  const CHANNELS = [
    {
      id: 'mk_press',
      name: 'Press Kit',
      icon: '📰',
      era: [1980, 9999],
      cost: 5000,
      effectiveness: { all: 1.10, business: 1.15, saas: 1.15 },
      desc: 'Mailed review copies + press release to enthusiast outlets.'
    },
    {
      id: 'mk_magazine',
      name: 'Magazine Ads',
      icon: '📖',
      era: [1980, 2005],
      cost: 25000,
      effectiveness: { all: 1.15, game: 1.20 },
      desc: 'Full-page ads in Compute!, PC Gamer, etc.'
    },
    {
      id: 'mk_tradeshow',
      name: 'Trade Show Booth',
      icon: '🎪',
      era: [1980, 9999],
      cost: 40000,
      effectiveness: { all: 1.12, business: 1.20, saas: 1.20 },
      desc: 'CES, E3, COMDEX presence with demo floor.'
    },
    {
      id: 'mk_tv',
      name: 'TV Commercials',
      icon: '📺',
      era: [1985, 2015],
      cost: 200000,
      effectiveness: { all: 1.25, game: 1.35 },
      desc: 'Prime-time national broadcast spots.'
    },
    {
      id: 'mk_web_banner',
      name: 'Web Banner Ads',
      icon: '🖼️',
      era: [1996, 9999],
      cost: 35000,
      effectiveness: { all: 1.15, web: 1.22, saas: 1.18 },
      desc: 'Banner campaigns on enthusiast and major portal sites.'
    },
    {
      id: 'mk_search',
      name: 'Search Ads',
      icon: '🔎',
      era: [2002, 9999],
      cost: 50000,
      effectiveness: { all: 1.20, saas: 1.25, web: 1.20, business: 1.18 },
      desc: 'Keyword-targeted Google AdWords / Bing Ads.'
    },
    {
      id: 'mk_social',
      name: 'Social Media',
      icon: '📱',
      era: [2006, 9999],
      cost: 30000,
      effectiveness: { all: 1.15, mobile: 1.25, web: 1.20 },
      desc: 'Facebook/Twitter campaigns, organic community building.'
    },
    {
      id: 'mk_influencer',
      name: 'Influencer / YouTube',
      icon: '🎥',
      era: [2010, 9999],
      cost: 100000,
      effectiveness: { all: 1.20, game: 1.30, mobile: 1.25, ai: 1.25 },
      desc: 'Sponsored content with YouTube creators and streamers.'
    },
    {
      id: 'mk_streaming',
      name: 'Streaming / Twitch',
      icon: '📹',
      era: [2015, 9999],
      cost: 75000,
      effectiveness: { all: 1.18, game: 1.28, ai: 1.20 },
      desc: 'Sponsored streams, tournaments, Twitch ads.'
    },
  ];
  window.MARKETING_CHANNELS = CHANNELS;
  const CHANNEL_BY_ID = Object.fromEntries(CHANNELS.map(c => [c.id, c]));

  // ---------- Synergies ----------
  const SYNERGIES = [
    { ids:['mk_press','mk_tradeshow'],       mult: 1.10, label:'Industry Darling' },
    { ids:['mk_magazine','mk_tv'],           mult: 1.15, label:'Mass Market Blitz' },
    { ids:['mk_social','mk_influencer'],     mult: 1.25, label:'Viral Moment' },
    { ids:['mk_search','mk_web_banner'],     mult: 1.10, label:'Digital Full Stack' },
    { ids:['mk_streaming','mk_influencer'],  mult: 1.20, label:'Content Creator Wave' },
  ];

  // ---------- Availability ----------
  function isChannelAvailable(channelId, year) {
    const c = CHANNEL_BY_ID[channelId];
    if (!c) return false;
    year = year == null ? (S.calendar?.year || 1980) : year;
    return year >= c.era[0] && year <= c.era[1];
  }

  function availableChannels(year) {
    year = year == null ? (S.calendar?.year || 1980) : year;
    return CHANNELS.filter(c => year >= c.era[0] && year <= c.era[1]);
  }

  // ---------- Effectiveness math ----------
  // Computes the total marketing multiplier for a project given its selected channels
  function computeMarketingMultiplier(proj) {
    const selected = proj.marketingChannels || [];
    if (selected.length === 0) return { mult: 1.0, breakdown: [], synergies: [] };
    let mult = 1.0;
    const breakdown = [];
    for (const cid of selected) {
      const c = CHANNEL_BY_ID[cid];
      if (!c) continue;
      const eff = c.effectiveness[proj.type] || c.effectiveness.all || 1;
      mult *= eff;
      breakdown.push({ channel: c.name, icon: c.icon, effect: eff });
    }
    // Synergy bonuses
    const synergies = [];
    for (const syn of SYNERGIES) {
      if (syn.ids.every(id => selected.includes(id))) {
        mult *= syn.mult;
        synergies.push({ label: syn.label, mult: syn.mult });
      }
    }
    // Diminishing returns for 5+ channels (spread too thin)
    if (selected.length >= 5) mult *= 0.92;
    return { mult, breakdown, synergies };
  }

  function totalCost(channelIds) {
    return channelIds.reduce((s, id) => s + (CHANNEL_BY_ID[id]?.cost || 0), 0);
  }

  // ---------- Public API ----------
  window.tycoonMarketing = {
    CHANNELS,
    CHANNEL_BY_ID,
    SYNERGIES,
    isChannelAvailable,
    availableChannels,
    computeMarketingMultiplier,
    totalCost,
  };
  if (window.dbg) window.dbg.marketing = window.tycoonMarketing;

  console.log('[tycoon-marketing] module loaded. ' + CHANNELS.length + ' channels.');
})();
