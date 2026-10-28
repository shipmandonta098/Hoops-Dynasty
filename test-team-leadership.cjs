// Coach-directed team leadership: selection methods, GM recommendations, vacancies, coaching changes, no-captain and
// co-captain teams, modest morale influence with no morale floor, save/load and legacy migration, NBA and WNBA careers.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const setup=(league,seed)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.lg=league;
 l.run(`render=()=>{};save=async()=>true;toast=()=>{};var said=[];const s0=say;say=t=>{said.push(t);return s0(t)};var d=makeDraft();d.gmName='Lead GM';
  if(lg==='wnba'){d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};}
  state=validateCareerData(buildSetupCareer(d));`);
 return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
const {l,run}=setup('nba',121);
// New careers: every team has a coach-selected structure; captains are not simply the best or highest-paid player.
const start=run(`state.teams.map(t=>{const c=teamCaptain(t),top=[...t.roster].sort((a,b)=>b.ovr-a.ovr)[0],paid=[...t.roster].sort((a,b)=>b.salary-a.salary)[0];return {method:leadershipRecord(t).method,captain:c?.id??null,best:c?.id===top.id,paid:c?.id===paid.id,co:teamCoCaptain(t)?.id??null}})`);
assert(start.every(r=>['appointment','vote','consultation'].includes(r.method)));assert(start.filter(r=>r.captain!==null).length>=25);
assert(start.filter(r=>r.best).length<=10&&start.filter(r=>r.paid).length<=12,'captaincy is not a talent or salary award');
assert(new Set(start.map(r=>r.method)).size>=2,'coaching philosophy produces different methods');
assert.equal(run('said.filter(t=>/captain/i.test(t)).length'),0,'setting up a league does not flood the news feed');
// Leadership is derived from personality, loyalty, experience and communication — not overall rating.
const lead=run(`(()=>{const ps=state.teams.flatMap(t=>t.roster),corr=(xs,ys)=>{const mx=xs.reduce((a,b)=>a+b)/xs.length,my=ys.reduce((a,b)=>a+b)/ys.length;let n=0,dx=0,dy=0;xs.forEach((x,i)=>{n+=(x-mx)*(ys[i]-my);dx+=(x-mx)**2;dy+=(ys[i]-my)**2});return n/Math.sqrt(dx*dy)};const L=ps.map(playerLeadership);
 const vets=ps.filter(p=>yearsPro(p)>=10).map(playerLeadership);return {ovr:corr(ps.map(p=>p.ovr),L),poorVets:vets.filter(x=>x<50).length,vets:vets.length,leaderGap:ps.filter(p=>hasTrait(p,'leader')).map(playerLeadership).reduce((a,b)=>a+b,0)/ps.filter(p=>hasTrait(p,'leader')).length-ps.filter(p=>hasTrait(p,'toxic')).map(playerLeadership).reduce((a,b)=>a+b,0)/ps.filter(p=>hasTrait(p,'toxic')).length}})()`);
assert(Math.abs(lead.ovr)<.3,'leadership is not a proxy for overall: '+lead.ovr);assert(lead.poorVets>0,'not every veteran is a good leader');assert(lead.leaderGap>30);
// Helpers to control the coach's philosophy.
const coachStyle=(id,discipline,charisma,type='Balanced')=>l.run(`(()=>{const c=coachFor(state.teams[${id}]);c.attributes.discipline=${discipline};c.attributes.charisma=${charisma};c.type='${type}'})()`);
// 1. Coach appointment.
coachStyle(3,90,40);const appoint=run(`(()=>{const t=state.teams[3];selectLeadership(t,{reason:'season'});const ranked=leadershipRanking(t,'appointment','x');return {method:leadershipRecord(t).method,captain:teamCaptain(t).id,top:ranked[0].p.id}})()`);
assert.deepEqual([appoint.method,appoint.captain],['appointment',appoint.top]);
// 2. Player vote: reproducible, recognized by the coach, news reports the election.
coachStyle(4,50,92);const vote=run(`(()=>{const t=state.teams[4];delete state.teamLeadership.teams[4];said.length=0;selectLeadership(t,{reason:'season'});const first=teamCaptain(t).id,v1=[...leadershipVote(t,'k')],v2=[...leadershipVote(t,'k')];return {method:leadershipRecord(t).method,first,same:JSON.stringify(v1)===JSON.stringify(v2),votes:v1.reduce((n,[,c])=>n+c,0),size:t.roster.length,news:said.find(x=>/captain/.test(x))}})()`);
assert.equal(vote.method,'vote');assert(vote.same,'votes are reproducible');assert.equal(vote.votes,vote.size,'every player casts one vote');assert.match(vote.news,/players elect .+ as their new captain/);
// 3–4. GM recommendations: accepted for a respected leader, rejected for a poor one.
const gm=run(`(()=>{const t=team();coachFor(t).attributes.charisma=80;coachFor(t).attributes.discipline=60;const weak=[...t.roster].sort((a,b)=>playerLeadership(a)-playerLeadership(b))[0];setLeadership(t,{captain:weak,coCaptain:null,method:'consultation'});
 const strong=[...t.roster].filter(p=>p.id!==weak.id).sort((a,b)=>coachCaptainScore(b,t)-coachCaptainScore(a,t))[0],ok=leadershipRecommend(strong.id),blocked=leadershipRecommend(weak.id);t.roster.forEach(p=>{});
 leadershipRecord(t).lastRecommendation=null;const poor=t.roster.find(p=>p.id!==strong.id);poor.personalityTraits=['lazy','toxic','diva'];const no=leadershipRecommend(poor.id);
 return {ok,blocked,no,captain:teamCaptain(t).id,strong:strong.id,inbox:(state.gmInbox?.items||[]).filter(m=>m.type==='Morale'&&/captain|leadership/i.test(m.subject)).length}})()`);
assert(gm.ok.accepted&&gm.captain===gm.strong,'coach accepts a sound recommendation');assert.equal(gm.blocked,null,'recommendations have a cooldown');
assert(!gm.no.accepted&&/declines/.test(gm.no.message),'coach rejects a poor recommendation');assert(gm.inbox>=2);
const panel=run(`(()=>{managedTeamId=controlledTeamId();return teamManagementView()})()`);
assert(/Team leadership/.test(panel)&&/Recommend captain/.test(panel)&&/Head coach responsible/.test(panel)&&!/Designate captain/.test(panel)&&!/minimum of 40 morale/.test(panel),'GM sees an advisory leadership panel, not a dropdown');
// 5. Captain traded; 9. leaves in free agency; 6. retires (season start).
const vacancy=(kind)=>run(`(()=>{const t=state.teams[6];selectLeadership(t,{silent:true});const c=teamCaptain(t);said.length=0;t.roster=t.roster.filter(p=>p.id!==c.id);${kind==='trade'?'state.teams[7].roster.push(c)':kind==='fa'?'state.free.push(c)':''};
 leadershipReview(${kind==='retire'});const n=teamCaptain(t),h=state.teamLeadership.history.findLast(h=>h.playerId===c.id&&h.teamKey===t.key);const out={old:c.id,now:n?.id??null,closed:h.to!==null,news:said.find(x=>/captain/.test(x))||'',kind:leadershipDeparture(c.id).kind,newTeamCaptain:teamCaptain(state.teams[7])?.id===c.id};
 if('${kind}'==='trade')state.teams[7].roster=state.teams[7].roster.filter(p=>p.id!==c.id);if('${kind}'==='fa')state.free=state.free.filter(p=>p.id!==c.id);t.roster.push(c);return out})()`);
const traded=vacancy('trade');assert(traded.now!==null&&traded.now!==traded.old&&traded.closed&&traded.kind==='traded'&&!traded.newTeamCaptain,'traded captain is replaced and is not captain of the new team');assert.match(traded.news,/departure/);
const fa=vacancy('fa');assert(fa.now!==fa.old&&fa.kind==='free agency');
const retired=vacancy('retire');assert(retired.now!==retired.old&&retired.kind==='retired');assert.match(retired.news,/following the retirement of its longtime leader/);
// 7. Unhappy captain keeps the role; 8. long-term injury keeps the role with less daily presence.
const keep=run(`(()=>{const t=state.teams[8];selectLeadership(t,{silent:true});const c=teamCaptain(t),base=leaderEffect(c,t);c.moraleAdjustment=-100;leadershipReview(true);const unhappy={kept:teamCaptain(t)?.id===c.id,effect:leaderEffect(c,t)};c.moraleAdjustment=0;
 c.medicalInfo={name:'torn ACL',severity:'Severe',until:medicalStamp()+200,rehabUntil:medicalStamp()+214};leadershipReview(false);const injured={kept:teamCaptain(t)?.id===c.id,effect:leaderEffect(c,t)};delete c.medicalInfo;return {base,unhappy,injured}})()`);
assert(keep.unhappy.kept&&keep.unhappy.effect>0&&keep.unhappy.effect<keep.base,'morale modestly reduces effectiveness, never an on/off switch');
assert(keep.injured.kept&&keep.injured.effect<keep.base);
// A captain with a public trade request is replaced at the next season review.
assert(run(`(()=>{const t=state.teams[8],c=teamCaptain(t),prev=c.dissatisfaction?copy(c.dissatisfaction):undefined;c.dissatisfaction={active:{visibility:'public'}};leadershipReview(true);const out=teamCaptain(t)?.id!==c.id;if(prev)c.dissatisfaction=prev;else delete c.dissatisfaction;return out})()`));
// 10. Head coach replaced → new selection under the new coach.
const coachChange=run(`(()=>{const t=state.teams[9];selectLeadership(t,{silent:true});t.coach=generateCoach({...t,key:t.key+':new'});coachFor(t);leadershipReview(false);return {coach:leadershipRecord(t).coach===coachFor(t).name}})()`);assert(coachChange.coach);
// 11. No captain (league rule) and 12. captain with co-captain; leaders do not stack excessively.
const none=run(`(()=>{const saved=state.leagueSettings.captainDesignations;state.leagueSettings.captainDesignations='none';const t=state.teams[10];selectLeadership(t,{reason:'season'});const out={captain:teamCaptain(t),influence:leadershipInfluence(t),panel:leadershipPanel(t)};state.leagueSettings.captainDesignations=saved;return out})()`);
assert.equal(none.captain,null);assert.equal(none.influence,0);assert.match(none.panel,/Not permitted by league rules/);
const pair=run(`(()=>{const t=state.teams[11],ranked=[...t.roster].sort((a,b)=>playerLeadership(b)-playerLeadership(a));setLeadership(t,{captain:ranked[0],coCaptain:ranked[1],method:'consultation'});const both=leadershipInfluence(t),one=leaderEffect(ranked[0],t),two=leaderEffect(ranked[1],t);return {both,one,two,co:teamCoCaptain(t)?.id===ranked[1].id}})()`);
assert(pair.co&&pair.both<=.25&&pair.both<pair.one+pair.two&&pair.both>=pair.one);
assert.throws(()=>l.run(`readLeagueSettings({...state.leagueSettings,captainDesignations:'three'})`),/Official captains/);
// 13. Modest support: a losing streak erodes a teammate's temporary morale more slowly with a respected captain.
const streak=run(`(()=>{const t=state.teams[11],q=t.roster.find(p=>!leadershipCaptains(t).includes(p.id)&&p.age>25),track=withCaptain=>{let adj=0;for(let i=0;i<15;i++){q.moraleAdjustment=adj;const r=withCaptain?leadershipMoraleChange(q,t,-4,.03):{raw:-4,decay:.03};adj=Math.max(-100,adj+Math.round(Math.max(-4,Math.min(4,r.raw))*.5-adj*r.decay))}q.moraleAdjustment=0;return adj};return {with:track(true),without:track(false)}})()`);
assert(streak.with>streak.without&&streak.with<0&&streak.with-streak.without<=Math.abs(streak.without)*.4,'support is modest: '+JSON.stringify(streak));
// 14. No morale floor: a critically unhappy teammate can reach zero with an excellent captain at high morale.
const floor=run(`(()=>{const t=state.teams[11],c=teamCaptain(t);c.moraleAdjustment=100;const q=t.roster.find(p=>!leadershipCaptains(t).includes(p.id));q.moraleAdjustment=-100;q.rotationMinutes=0;q.salary=0.5;t.w=0;t.l=40;const withC=moraleDetails(q,t).score;const r=leadershipRecord(t),saved={...r};r.captain=null;r.coCaptain=null;const without=moraleDetails(q,t).score;Object.assign(r,saved);t.w=t.l=0;c.moraleAdjustment=0;q.moraleAdjustment=0;return {withC,without}})()`);
assert.equal(floor.withC,floor.without,'a captain never changes a teammate’s current morale score');assert(floor.withC<=5,'critically unhappy players can reach zero: '+floor.withC);
// Captain effect applies only through the morale change of a game, so dissatisfaction and trade logic see the same scores.
// 15. Save/load round trip and legacy migration.
const rt=run(`(()=>{const v=validateCareerData(JSON.parse(JSON.stringify(state)));return {same:JSON.stringify(v.teamLeadership)===JSON.stringify(state.teamLeadership),legacyCaptains:Object.keys(v.moraleSystem?.captains||{}).length}})()`);
assert(rt.same,'leadership round-trips');assert.equal(rt.legacyCaptains,0);
for(const [label,mut] of [['bad method',"r.teamLeadership.teams[1].method='dictator'"],['bad history',"r.teamLeadership.history[0].role='Mascot'"],['same captain twice',"const x=r.teamLeadership.teams[2];x.coCaptain=x.captain"],['bad version','r.teamLeadership.version=2']])
 assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));if(r.teamLeadership.teams[2].captain===null)r.teamLeadership.teams[2].captain=r.teams[2].roster[0].id;${mut};validateCareerData(r)})()`),/leadership|captaincy/,label);
const legacy=run(`(()=>{const r=JSON.parse(JSON.stringify(state));delete r.teamLeadership;const id=r.teams[0].roster[2].id;r.moraleSystem={captains:{0:id},events:{}};const v=validateCareerData(r),t0=v.teamLeadership.teams[0];
 const others=Object.entries(v.teamLeadership.teams).filter(([k])=>k!=='0').map(([,x])=>x.captain);const roster=JSON.stringify(v.teams.map(t=>t.roster.map(p=>[p.id,p.ovr,p.salary,p.contractThrough,p.moraleAdjustment])))===JSON.stringify(r.teams.map(t=>t.roster.map(p=>[p.id,p.ovr,p.salary,p.contractThrough,p.moraleAdjustment])));
 const previous=state;state=v;state.year++;leadershipReview(true);const afterReview=state.teams.filter(t=>teamCaptain(t)).length;state=previous;return {captain:t0.captain===id,method:t0.method,others:others.every(x=>x===null),roster,afterReview,history:v.teamLeadership.history.filter(h=>h.playerId===id).length}})()`);
assert.deepEqual({...legacy,afterReview:undefined},{captain:true,method:'legacy',others:true,roster:true,afterReview:undefined,history:1},'older saves keep the designated captain and are not reselected on load');
assert(legacy.afterReview>=20,'the next season review selects captains for teams without one');
// 12-profile: captaincy history follows the player without making them captain elsewhere.
const prof=run(`(()=>{const t=state.teams[11],c=teamCaptain(t);return moraleProfile({p:c,club:t,own:false})})()`);assert(/LEADERSHIP/.test(prof)&&/Captaincy history: .*Captain, .+\(\d{4}–present\)/.test(prof)&&/<dt>Years served<\/dt><dd>1<\/dd>/.test(prof)&&/Team Captain/.test(prof));
// Commissioner: manual appointment and removal.
const commish=l.run(`(async()=>{state.commissioner={...(state.commissioner||{}),enabled:true};const t=state.teams[12],p=t.roster[3];await commissionerSetCaptain(12,'captain',String(p.id));const a=teamCaptain(t)?.id===p.id&&leadershipRecord(t).method==='commissioner';await commissionerSetCaptain(12,'captain','');const b=teamCaptain(t),co=teamCoCaptain(t);state.commissioner.enabled=false;return {a,b:b?.id===p.id,co:co?.id===p.id}})()`);
// 16. WNBA careers use the same system.
const w=setup('wnba',122);
const wnba=w.run(`(()=>{const rows=state.teams.map(t=>({captain:teamCaptain(t)?.gender,method:leadershipRecord(t).method}));const v=validateCareerData(JSON.parse(JSON.stringify(state)));return {teams:state.teams.length,captains:rows.filter(r=>r.captain).length,female:rows.every(r=>!r.captain||r.captain==='female'),rt:JSON.stringify(v.teamLeadership)===JSON.stringify(state.teamLeadership)}})()`);
assert.equal(wnba.teams,12);assert(wnba.captains>=9&&wnba.female&&wnba.rt,JSON.stringify(wnba));
(async()=>{const c=JSON.parse(JSON.stringify(await commish));assert(c.a,'commissioner appoints directly');assert(!c.b&&!c.co,'commissioner removes a captain (a co-captain, if any, steps up)');
 console.log('Team leadership: coach appointment, player vote, GM recommendations, vacancies, coaching change, no-captain/co-captain, modest influence without a morale floor, save/load, legacy migration, NBA and WNBA passed.')})().catch(e=>{console.error(e);process.exitCode=1});
