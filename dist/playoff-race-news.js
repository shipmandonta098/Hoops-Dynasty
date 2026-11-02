/* Playoff race news: after each regular-season day, the feed reports teams that clinch a playoff berth (the first one
   league-wide gets its own wording), teams that clinch the No. 1 seed, and teams eliminated from playoff contention.
   When the regular season ends it posts the first-round matchups. When every team in a pool makes the playoffs,
   there are no berth or elimination items for it.
   Claims during the season are conservative (ties count against the team), so a clinch is never announced early. On
   the last day the actual playoff field and seeds decide, so every team ends the season clinched or eliminated.
   Nothing new is saved: the status before a day is rebuilt by removing that day's results from the records. */
function raceTeamName(t){return t.city+' '+t.name}
// Playoff pools: each conference when the bracket is split by conference, otherwise the whole league.
function racePools(){const c=createPlayoffConfig(),teams=state.teams.filter(t=>!expansionPendingSeason(t));
 return c.sides.map(side=>({name:c.split?side.name:null,spots:side.teams.length,teams:c.split?teams.filter(t=>t.conference===side.name):teams}))}
// Status for every team from wins and games left; `undo` removes results (team id → wins/losses to subtract).
function raceStatus(undo=new Map()){const out=new Map();
 for(const pool of racePools()){if(!pool.spots)continue;const open=pool.spots<pool.teams.length;
  const rec=new Map(pool.teams.map(t=>{const d=undo.get(t.id)||{w:0,l:0},w=t.w-d.w;return [t.id,{w,max:w+ownerGames(t)-(w+t.l-d.l)}]}));
  for(const t of pool.teams){const me=rec.get(t.id),others=[...rec].filter(([id])=>id!==t.id).map(([,r])=>r);
   out.set(t.id,{pool:pool.name,clinched:open&&others.filter(o=>o.max>=me.w).length<pool.spots,top:others.length>0&&others.every(o=>o.max<me.w),eliminated:open&&others.filter(o=>o.w>me.max).length>=pool.spots})}}
 return out}
// Final standings: the actual field and seeds.
function raceFinalStatus(){const c=playoffConfig(),out=new Map(),field=new Set(c.sides.flatMap(s=>s.teams));
 for(const pool of racePools()){const open=pool.spots<pool.teams.length;for(const t of pool.teams)out.set(t.id,{pool:pool.name,clinched:open&&field.has(t.id),top:c.sides.some(s=>s.teams[0]===t.id),eliminated:open&&!field.has(t.id)})}
 return out}
function raceDayUndo(){const undo=new Map();for(const g of state.history){if(g.day!==state.day||g.stage!=='Regular season')continue;
 for(const id of [g.a,g.b]){const d=undo.get(id)||{w:0,l:0};if(g.winner===id)d.w++;else d.l++;undo.set(id,d)}}return undo}
function racePost(headline,teams){if(newsStore().items.some(n=>n.year===state.year&&n.headline===headline))return;addNewsItem({category:'League',headline,teams})}
let raceNewsDone=null;
function playoffRaceDay(){const key=state.year+':'+state.day;if(raceNewsDone===key||state.day<1||state.day>seasonLength()||playoffGames().length)return;raceNewsDone=key;
 const final=state.day===seasonLength(),before=raceStatus(raceDayUndo()),after=final?raceFinalStatus():raceStatus(),
  firstClinch=![...before.values()].some(s=>s.clinched),clinched=[...after].filter(([id,s])=>s.clinched&&!before.get(id)?.clinched).map(([id])=>state.teams[id]);
 if(firstClinch&&clinched.length>1){const names=clinched.map(t=>'the '+raceTeamName(t));names[0]='The '+raceTeamName(clinched[0]);racePost(names.slice(0,-1).join(', ')+(names.length>2?',':'')+' and '+names.at(-1)+' become the first teams to clinch playoff berths.',clinched.map(t=>t.id))}
 else clinched.forEach(t=>racePost(firstClinch?'The '+raceTeamName(t)+' become the first team to clinch a playoff berth.':'The '+raceTeamName(t)+' clinch a playoff berth.',[t.id]));
 for(const [id,s] of after){const t=state.teams[id];if(s.top&&!before.get(id)?.top)racePost('The '+raceTeamName(t)+' clinch the No. 1 seed'+(s.pool?' in the '+s.pool+' Conference':'')+'.',[id])}
 for(const [id,s] of after)if(s.eliminated&&!before.get(id)?.eliminated)racePost('The '+raceTeamName(state.teams[id])+' have been eliminated from playoff contention.',[id]);
 if(final)playoffMatchupNews()}
// First-round matchups by seed, e.g. "#1 Oklahoma City Thunder will face off against the #8 Phoenix Suns."
function playoffMatchupNews(){const c=playoffConfig(),seed=id=>{const side=c.sides.find(s=>s.teams.includes(id));return side.teams.indexOf(id)+1};
 // 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5 for each side, posted in reverse so the feed (newest first) reads in that order.
 const side=id=>c.sides.findIndex(s=>s.teams.includes(id)),pairs=playoffOpeningPairs(c).map(p=>p.filter(id=>id!==null&&id!==undefined).sort((a,b)=>seed(a)-seed(b))).filter(p=>p.length).sort((a,b)=>side(a[0])-side(b[0])||seed(a[0])-seed(b[0]));
 for(const ids of pairs.reverse()){const [a,b]=ids.map(id=>state.teams[id]),conf=c.split?' in the '+c.sides.find(s=>s.teams.includes(a.id)).name+' Conference':'';
  if(!b)racePost('#'+seed(a.id)+' '+raceTeamName(a)+' earn a first-round bye'+conf+'.',[a.id]);
  else racePost('#'+seed(a.id)+' '+raceTeamName(a)+' will face off against the #'+seed(b.id)+' '+raceTeamName(b)+conf+'.',[a.id,b.id])}}
const seasonMilestoneDayBeforeRace=seasonMilestoneDay;
seasonMilestoneDay=function(...args){const result=seasonMilestoneDayBeforeRace(...args);playoffRaceDay();return result};
