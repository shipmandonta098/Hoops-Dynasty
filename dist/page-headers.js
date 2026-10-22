/* Local assets only. Every configured page has its own relevant background.
   Page copy, art direction and crop positions are maintained in this one map. */
const PAGE_HEADERS={
 'Watch list':{image:'header-players.webp',position:'center',mobilePosition:'65% center',subtitle:'TRACK THE TALENT. PLAN YOUR NEXT MOVE.',treatment:'court'},
 Overview:{image:'header-overview.webp',position:'center',mobilePosition:'65% center',subtitle:'YOUR FRANCHISE. YOUR NEXT CHAPTER.',treatment:'gold'},
 'News feed':{image:'header-news-feed.webp',position:'center',mobilePosition:'65% center',subtitle:'THE STORIES SHAPING THE SEASON.',treatment:'slate'},
 Roster:{image:'header-roster.webp',position:'center',mobilePosition:'65% center',subtitle:'THE PEOPLE BEHIND EVERY POSSESSION.',treatment:'court'},
 Players:{image:'header-players.webp',position:'center',mobilePosition:'65% center',subtitle:'BUILD THE ROSTER. SHAPE THE FUTURE.',treatment:'court'},
 Rotations:{image:'header-rotations.webp',position:'center',mobilePosition:'65% center',subtitle:'PUT THE RIGHT FIVE ON THE FLOOR.',treatment:'slate'},
 Schedule:{image:'header-schedule.webp',position:'center',mobilePosition:'65% center',subtitle:'THE ROAD THROUGH THE SEASON.',treatment:'court'},
 Trades:{image:'header-trades.webp',position:'center',mobilePosition:'65% center',subtitle:'EVERY MOVE HAS A PRICE.',treatment:'gold'},
 'Free agency':{image:'header-free-agency.webp',position:'center',mobilePosition:'65% center',subtitle:'THE MARKET NEVER SLEEPS.',treatment:'slate'},
 'Front office':{image:'header-front-office.webp',position:'center',mobilePosition:'65% center',subtitle:'SET THE DIRECTION. EARN THE TRUST.',treatment:'gold'},
 Finances:{image:'header-finances.webp',position:'center',mobilePosition:'65% center',subtitle:'SUSTAIN SUCCESS, ON AND OFF THE COURT.',treatment:'gold'},
 'Team management':{image:'header-team-management.webp',position:'center',mobilePosition:'65% center',subtitle:'GIVE YOUR FRANCHISE ITS IDENTITY.',treatment:'court'},
 Standings:{image:'header-standings.webp',position:'center',mobilePosition:'65% center',subtitle:'EVERY GAME CHANGES THE RACE.',treatment:'court'},
 'Player stats':{image:'header-player-stats.webp',position:'center 30%',mobilePosition:'65% center',subtitle:'INDIVIDUAL IMPACT, POSSESSION BY POSSESSION.',treatment:'slate'},
 'Award races':{subtitle:'GREATNESS GETS RECOGNIZED.',image:'playoff-trophy.webp',position:'center 35%',mobilePosition:'65% center',treatment:'gold'},
 'Team stats':{image:'header-team-stats.webp',position:'center',mobilePosition:'65% center',subtitle:'SEE HOW YOUR TEAM COMPETES.',treatment:'court'},
 'League stats':{image:'header-league-stats.webp',position:'center',mobilePosition:'65% center',subtitle:'THE NUMBERS BEHIND THE LEAGUE.',treatment:'slate'},
 Playoffs:{subtitle:'BIGGER GAMES. BRIGHTER LEGACIES.',image:'playoff-trophy.webp',position:'center 48%',mobilePosition:'60% center',variant:'playoffs',treatment:'championship',motto:'ONE\nTEAM.\nONE\nCHAMPION.'},
 Draft:{subtitle:'NEW TALENT. A BRIGHTER TOMORROW.',image:'dashboard-skyline.png',variant:'draft',treatment:'draft',showYear:true},
 Expansion:{subtitle:'A NEW CITY. A NEW CHAPTER.',image:'dashboard-skyline.png',position:'65% center',mobilePosition:'70% center',treatment:'gold'},
 'Franchise history':{image:'header-franchise-history.webp',position:'center 35%',mobilePosition:'65% center',subtitle:'EVERY SEASON LEAVES A MARK.',treatment:'archive'},
 'League history':{subtitle:'CHAMPIONS, MILESTONES AND THE YEARS BETWEEN.',image:'playoff-trophy.webp',position:'center 65%',mobilePosition:'65% center',treatment:'archive'},
 'Hall of Fame':{subtitle:'WHERE LEGACIES LIVE.',image:'playoff-trophy.webp',position:'center 30%',mobilePosition:'65% center',treatment:'gold'},
 Settings:{image:'header-settings.webp',position:'center',mobilePosition:'65% center',subtitle:'MAKE THE LEAGUE YOUR OWN.',variant:'minimal',treatment:'minimal'},
 'GM Office':{image:'header-gm-office.webp',position:'center',mobilePosition:'65% center',subtitle:'LEAD WITH A PLAN.',treatment:'gold'},
 'GM Inbox':{image:'header-gm-inbox.webp',position:'center',mobilePosition:'65% center',subtitle:'THE CONVERSATIONS THAT MOVE YOUR FRANCHISE.',variant:'minimal',treatment:'minimal'},
 'Attendance rankings':{image:'header-attendance-rankings.webp',position:'center',mobilePosition:'65% center',subtitle:'MEASURE THE SUPPORT BEHIND EVERY TEAM.',treatment:'court'},
 'Power rankings':{image:'header-power-rankings.webp',position:'center',mobilePosition:'65% center',subtitle:'FORM, MOMENTUM AND THE BIGGER PICTURE.',treatment:'slate'}
};
const PAGE_HEADER_OVERLAYS={
 slate:'linear-gradient(90deg,#0a1117f5 0%,#0a1117c7 45%,#0a111759 100%)',
 court:'linear-gradient(90deg,#0b141cf5 0%,#0b141cc7 45%,#0b141c59 100%)',
 gold:'linear-gradient(90deg,#0a1017f5 0%,#0a1017c7 45%,#0a101759 100%)',
 archive:'linear-gradient(90deg,#101313f5 0%,#101313c7 45%,#10131359 100%)',
 minimal:'linear-gradient(90deg,#121a22f5 0%,#121a22c7 45%,#121a2280 100%)',
 draft:'linear-gradient(100deg,#0c151ef5,#101b25d9)',
 championship:'linear-gradient(transparent,transparent)'
};
function pageHeader({title,eyebrow,subtitle,image=null,position='center',mobilePosition=position,treatment='slate',variant='standard',year=null,motto=null}){
 const mode=['standard','minimal','draft','playoffs'].includes(variant)?variant:'standard';
 const overlay=PAGE_HEADER_OVERLAYS[treatment]||PAGE_HEADER_OVERLAYS.slate;
 const art=image&&/^[a-zA-Z0-9_./-]+\.(?:png|webp|jpe?g|avif)$/i.test(image)&&!image.includes('..')?'url("'+image+'")':'none';
 const crop=value=>/^[a-z0-9 .%+-]+$/i.test(value)?value:'center';
 const style='--page-header-image:'+art+';--page-header-overlay:'+overlay+';--page-header-position:'+crop(position)+';--page-header-mobile-position:'+crop(mobilePosition);
 const legacy=mode==='draft'?' draft-hero':mode==='playoffs'?' po-championship-header':'';
 const aside=year!==null?'<div class="draft-year">'+escapeHTML(String(year))+'</div>':motto?'<div class="po-header-motto">'+motto.split('\n').map(escapeHTML).join('<br>')+'</div>':'';
 return '<header class="po-hero page-header page-header--'+mode+legacy+'" data-page-header="'+escapeHTML(title)+'" style="'+escapeHTML(style)+'"><div class="page-header-copy'+(mode==='playoffs'?' po-header-copy':'')+'"><div class="eyebrow">'+escapeHTML(eyebrow)+'</div><h1>'+escapeHTML(title.toUpperCase())+'</h1><p>'+escapeHTML(subtitle)+'</p></div>'+aside+'</header>';
}
function pageHeaderFor(page){const config=PAGE_HEADERS[page]||{subtitle:'BUILD. MANAGE. LEAVE A LEGACY.'},league=state.leagueName||'DYNASTY BASKETBALL LEAGUE';return pageHeader({...config,title:page,eyebrow:config.showYear?state.year+' · '+league:league,year:config.showYear?state.year:null})}
