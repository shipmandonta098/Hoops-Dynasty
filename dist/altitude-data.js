/* Approximate ground elevations (feet); not surveyed playing-floor heights.
   All city values are simulation estimates. Unknown locations remain unknown.
   Arena matches require BOTH location and applicable season; relocations never follow names.
   Calgary 3428, Winnipeg 784, Ottawa 230, Anaheim 157, Green Bay 581: city infobox elevations
   (Calgary sources range 1,042–1,048 m). Calgary rates Moderate for sea-level visitors, below Denver. */
const ALTITUDE_SOURCES={
 denver:'https://www.nba.com/news/is-impact-of-denvers-altitude-fact-or-fiction',
 utah:'https://www.visitutah.com/plan-your-trip/plan-your-ski-trip/high-altitude-tips',
 delta:'https://www.deltacenter.com/about-us/',
 starzz:'https://aces.wnba.com/aces-history-notable-dates-and-transactions',
 cities:'Approximate city-level simulation values; exact arena survey unavailable.',
 physiology:'https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html'
};
const ALTITUDE_CITIES={'denver':5280,'salt lake city':4265,'phoenix':1086,'atlanta':1050,'los angeles':300,'new york':33,'miami':6,'boston':46,'brooklyn':33,'philadelphia':39,'toronto':250,'chicago':594,'cleveland':653,'detroit':600,'indianapolis':715,'milwaukee':617,'charlotte':751,'orlando':82,'washington':25,'dallas':430,'houston':80,'memphis':337,'new orleans':7,'san antonio':650,'minneapolis':830,'oklahoma city':1201,'portland':50,'sacramento':30,'san francisco':52,'oakland':43,'seattle':175,'las vegas':2000,'arlington':604,'uncasville':100,'college park':1000,'inglewood':130,'san diego':62,'vancouver':70,'tulsa':722,'rochester':505,'syracuse':380,'buffalo':600,'fort wayne':810,'st louis':466,'baltimore':33,'washington dc':25,'pittsburgh':730,'providence':75,'waterloo':883,'anderson':883,'sheboygan':630,'moline':590,'cincinnati':482,'kansas city':910,'omaha':1090,'east rutherford':13,'newark':13,'hartford':59,'white plains':213,'san jose':82,'auburn hills':960,'richfield':1056,'tempe':1140,'tampa':48,'mexico city':7350,'honolulu':20,'louisville':466,'st paul':795,'austin':489,'nashville':597,'columbus':902,'jacksonville':16,'calgary':3428,'winnipeg':784,'ottawa':230,'anaheim':157,'green bay':581};
const ALTITUDE_CITY_ALIASES={'utah':'salt lake city','new york city':'new york','golden state':'san francisco','minnesota':'minneapolis','connecticut':'uncasville','new jersey':'east rutherford','la':'los angeles','saint louis':'st louis'};
const ALTITUDE_ARENAS=[
 {cities:['denver'],names:['ball arena','pepsi center'],from:1999,to:10000,feet:5280,source:ALTITUDE_SOURCES.denver},
 {cities:['denver'],names:['mcnichols sports arena'],from:1975,to:1999,feet:5280,source:'City elevation estimate; arena-specific survey unavailable.'},
 {cities:['salt lake city'],names:['delta center','energy solutions arena','energysolutions arena','vivint arena','vivint smart home arena'],from:1991,to:10000,feet:4265,source:ALTITUDE_SOURCES.delta},
 {cities:['salt lake city'],names:['salt palace'],from:1969,to:1991,feet:4265,source:'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf'},
 {cities:['college park','atlanta'],names:['gateway center arena','gateway center arena at college park'],from:2020,to:10000,feet:1000,source:'College Park city estimate; arena-specific survey unavailable.'},
 {cities:['uncasville','connecticut'],names:['mohegan sun arena'],from:2001,to:10000,feet:100,source:'Uncasville city estimate; arena-specific survey unavailable.'}
];
// Only explicitly identified real teams receive these dated defaults. Custom arena names win.
const ALTITUDE_HISTORICAL_VENUES=[
 {city:'denver',team:'nuggets',from:1976,to:1998,arena:'McNichols Sports Arena',source:'https://cdn.nba.com/teams/uploads/sites/1610612743/2024/01/DN_2324_MediaGuide.pdf'},
 {city:'denver',team:'nuggets',from:1999,to:2019,arena:'Pepsi Center',source:'https://www.pepsicenter.com/arena-information/about-ball-arena/'},
 {city:'denver',team:'nuggets',from:2020,to:10000,arena:'Ball Arena',source:'https://www.ballarena.com/kse-ball-global-partnership/'},
 {city:'salt lake city',team:'jazz',from:1979,to:1990,arena:'Salt Palace',source:'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf'},
 {city:'salt lake city',team:'jazz',from:1991,to:2005,arena:'Delta Center',source:ALTITUDE_SOURCES.delta},
 {city:'salt lake city',team:'starzz',from:1997,to:2002,arena:'Delta Center',source:ALTITUDE_SOURCES.starzz},
 {city:'salt lake city',team:'jazz',from:2023,to:10000,arena:'Delta Center',source:'https://www.nba.com/jazz/news/this-is-really-special-jazz-and-delta-reunite-as-arena-to-be-named-delta-center'}
];
