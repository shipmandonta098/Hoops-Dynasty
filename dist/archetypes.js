/* Ratings are ability; stored tendencies are preferences. Archetype multipliers
   are applied at read time, so reloads and season changes never stack boosts. */
const PLAYER_ARCHETYPES={
 balanced:{name:'Balanced',description:'A flexible contributor without one dominant specialty.',ratings:{},tendencies:{},develop:[],rare:[],usage:1,pop:1,roll:1,pnr:1},
 stretchBig:{name:'Stretch Big',description:'Spaces the floor, favors pick-and-pop jumpers and draws a big defender away from the rim.',ratings:{fg:8,tp:24,reb:4,post:-10,stre:-5},tendencies:{three:1.5,midrange:1.1,postUp:.45,drive:.65,isolation:.5,standingDunk:.5},develop:['fg','tp','reb'],rare:['post'],usage:1,pop:2.8,roll:.5,pnr:1},
 threeAndD:{name:'3 & D Wing',description:'Works off the ball for spot-up threes and takes the leading scorer on defense.',ratings:{tp:8,per:10,drb:-10,lay:-5,pss:-4},tendencies:{three:1.5,shoot:1.2,drive:.25,postUp:.1,isolation:.15,pullup:.35,pullupThree:.35,passing:1.1,contest:1.3,onBallSteal:1.1},develop:['tp','per','diq'],rare:['post','drb'],usage:.85,pop:1,roll:1,pnr:.55},
 slashKick:{name:'Slash & Kick PG',description:'Attacks the paint, initiates pick-and-rolls and creates kick-out looks for shooters.',ratings:{spd:6,drb:6,pss:10,lay:6,fg:-4,tp:-8},tendencies:{drive:1.55,passing:1.35,three:.6,postUp:.3,isolation:.65,drawFoul:1.2},develop:['spd','drb','pss','lay'],rare:['post'],usage:1.1,pop:1,roll:1,pnr:1.65},
 paintBeast:{name:'Paint Beast',description:'Scores on the block, protects the rim and hunts putbacks. Limited shooting range.',ratings:{rim:8,stre:8,reb:9,post:7,dnk:5,tp:-24,fg:-12,ft:-5,drb:-6},tendencies:{three:.03,midrange:.35,postUp:1.6,postHook:1.35,putback:1.45,block:1.35,crashGlass:1.3,passing:.8,drive:.6,standingDunk:1.2},develop:['stre','reb','rim','post','dnk'],rare:['tp','fg'],usage:1,pop:.05,roll:1.4,pnr:.65},
 shotCreator:{name:'Shot Creator',description:'Creates space off the dribble for isolations and pull-ups, trading shot difficulty for scoring volume.',ratings:{fg:9,drb:8,tp:3,per:-6,pss:-5},tendencies:{isolation:1.65,pullup:1.6,pullupThree:1.3,shoot:1.15,passing:.65,drive:1.1,postUp:.7},develop:['fg','drb','tp','oiq'],rare:['rim','sbl'],usage:1.25,pop:1,roll:1,pnr:1}
};
function generationArchetype(p){const choices={PG:['slashKick','shotCreator','balanced'],SG:['threeAndD','shotCreator','balanced'],SF:['threeAndD','shotCreator','balanced'],PF:['stretchBig','paintBeast','balanced'],C:['paintBeast','stretchBig','paintBeast']}[p.pos];let seed=p.id>>>0;for(const c of p.name)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;return choices[seed%choices.length]}
function archetypeGenerationRatings(p,ratings){const profile=PLAYER_ARCHETYPES[generationArchetype(p)];for(const [key,delta] of Object.entries(profile.ratings))ratings[key]=ratingLimit(ratings[key]+delta);return ratings}
function classifyPlayerArchetype(p){
 const a=p.attributes;if(!a)return 'balanced';
 if(['SG','SF'].includes(p.pos)&&a.tp>80&&a.per>80)return 'threeAndD';
 if(['PF','C'].includes(p.pos)&&a.tp>=65&&(a.tp+a.fg)/2>=a.post-16)return 'stretchBig';
 const scores=['PF','C'].includes(p.pos)?{
  stretchBig:a.tp*.6+a.fg*.25+a.reb*.15,
  paintBeast:a.rim*.25+a.stre*.25+a.reb*.25+a.post*.25-Math.max(0,a.tp-65)*.5
 }:{
  threeAndD:['SG','SF'].includes(p.pos)?(a.tp+a.per)/2+(a.tp-a.drb)*.25:0,
  slashKick:p.pos==='PG'?(a.spd+a.drb+a.pss+a.lay)/4+(a.pss-a.fg)*.2:0,
  shotCreator:a.fg*.4+a.drb*.4+a.tp*.1+a.lay*.1
 };
 const [id,score]=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];return score>=64?id:'balanced';
}
function ensurePlayerArchetype(p,year=state?.year||2026,force=false){if(force||!p.archetype||p.archetype.season!==year)p.archetype={id:classifyPlayerArchetype(p),season:year};return p.archetype}
function archetypeId(p){return ensurePlayerArchetype(p).id}
function archetypeProfile(p){return PLAYER_ARCHETYPES[archetypeId(p)]}
function archetypeTendencyMultiplier(p,key){return archetypeProfile(p).tendencies[key]??1}
function readPlayerArchetype(raw,p,year,bad){if(raw!==undefined&&(!raw||!Object.hasOwn(PLAYER_ARCHETYPES,raw.id)||!Number.isInteger(raw.season)||raw.season<1900||raw.season>year))bad('invalid player archetype');return raw&&raw.season===year?{id:raw.id,season:raw.season}:{id:classifyPlayerArchetype(p),season:year}}
function refreshSeasonArchetypes(){const players=[...state.teams.flatMap(t=>t.roster),...state.free,...(state.draft?.prospects||[]),...(state.draftRights||[]).map(r=>r.player)];for(const p of players)ensurePlayerArchetype(p,state.year,true)}
function archetypeDevelopmentChance(id,key){const profile=PLAYER_ARCHETYPES[id]||PLAYER_ARCHETYPES.balanced;return profile.develop.includes(key)?.9:profile.rare.includes(key)?.05:id==='balanced'?.6:.3}
function archetypeLineupEffects(players){const ids=players.map(archetypeId),paint=ids.filter(id=>id==='paintBeast').length,stretch=ids.filter(id=>id==='stretchBig').length;return {paint,stretch,clogged:paint>=3,drive:paint>=3?-.10:stretch?Math.min(.04,stretch*.02):0,gravity:ids.includes('slashKick')?.05:0}}
function archetypeShotAdjustment(p,shot,context,lineup){const effects=lineup.archetypes||lineup,spotUp=['mid','three'].includes(shot.kind)&&context.lastPasser&&!context.iso&&!shot.selfCreated&&!['pullup','pullupThree','runningThree','fadeaway','postFade','turnaround'].includes(shot.key);return (shot.kind==='inside'&&context.action==='drive'?effects.drive||0:0)+(spotUp&&shot.kind!=='three'&&['stretchBig','threeAndD'].includes(archetypeId(p))?effects.gravity||0:0)}
function archetypeDefender(p,offense,defenders,active,fallback){const wing=defenders.filter(q=>archetypeId(q)==='threeAndD').sort((a,b)=>b.attributes.per-a.attributes.per)[0];if(!wing)return fallback;const scorers=offense.roster.filter(q=>active(offense,q)).sort((a,b)=>playerUsage(b)-playerUsage(a)||b.ovr-a.ovr);if(p.id===scorers[0]?.id)return wing;if(fallback.id===wing.id&&defenders.length>1)return simWeighted(defenders.filter(q=>q!==wing),q=>q.pos===p.pos?6:1);return fallback}
function archetypeCard(p){const profile=archetypeProfile(p);return playerCard('PLAYING STYLE','<strong class="archetype-name">'+escapeHTML(profile.name)+'</strong><p>'+escapeHTML(profile.description)+'</p><p class="muted">Re-evaluated from ratings each season. Preferences shape the choice; ability and defense decide the result.</p>')}
function archetypeDevelopmentCard(p){const profile=archetypeProfile(p),label=key=>ATTRIBUTE_GROUPS.flatMap(g=>g[1]).find(a=>a[0]===key)?.[1]||key;return playerCard('ARCHETYPE DEVELOPMENT','<strong>'+escapeHTML(profile.name)+'</strong><p>'+(profile.develop.length?'Growth priorities: '+profile.develop.map(label).join(', ')+'.':'Balanced development across basketball skills.')+'</p><p>When a player earns positive offseason growth, priority skills have a 90% improvement chance; secondary skills 30%; unlikely skills 5%. Balanced players use 60%. Aging, potential and coaching still apply.</p>')}
