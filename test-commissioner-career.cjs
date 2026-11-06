// Commissioner player editor: draft (year, round, pick, team), experience (debut year) and contract (salary, final
// season) are editable. NBA contracts are flat salary + contractThrough; WNBA rebuilds the remaining years of the annual
// schedule (kept years keep guarantees/options) through wnbaAssign. Prospects and free agents show notes instead.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const SETUP=lg=>`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Commish';d.year=${lg==='wnba'?2024:2025};${lg==='wnba'?"d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});":''}var plan=historicalPlan('${lg}',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules${lg==='wnba'?",seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0":''}};syncAlignment(d);state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});ensureDraft();
var formFor=(p,x={})=>{withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const b=p.bio||generatePlayerBio(p,state.year,state.teams),t=p.personalityTraits||generateTraits(p),n=commissionerNameParts(p);
 return {first:n.first,last:n.last,pos:p.pos,age:String(p.age),heightInches:String(b.heightInches),weightLbs:String(b.weightLbs),birthdate:b.birthdate,hometown:b.hometown,college:b.college,draftYear:String(b.draftYear),draftRound:String(b.draftRound),draftPick:String(b.draftPick),draftTeam:b.draftTeam,experience:String(state.year-b.debutYear),salary:String(p.salary),contractThrough:String(p.contractThrough),
  ...Object.fromEntries(ATTRIBUTE_KEYS.map(k=>['a_'+k,String(p.attributes[k])])),...Object.fromEntries(TENDENCY_KEYS.map(k=>['t_'+k,String(p.tendencies[k]??generatedTendencies(p)[k])])),...Object.fromEntries(t.map((v,i)=>['trait'+i,v])),...x}};`;
const roundTrip=`validateCareerData(JSON.parse(JSON.stringify(state)))`;
// ---- NBA ----
{const l=loadLeague({seed:77,strictDOM:false});l.setRandomSeed(77);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};l.run(SETUP('nba'));
 l.run(`var p=state.teams[4].roster[1];p.age=28;var club=state.teams[4],abbr=state.teams[7].abbr,born=Number(p.bio.birthdate.slice(0,4));`);
 const html=run('commissionerPlayerForm(p)');for(const n of ['draftYear','draftRound','draftPick','draftTeam','experience','salary','contractThrough'])assert.match(html,new RegExp(`name="${n}"`),n);
 assert.doesNotMatch(html,/Contracts change through normal roster moves/);assert.match(html,/name="experience" type="number" min="0" max="13"/,'experience capped at age − 15 in the form');
 const y=run('state.year');
 l.run(`commissionerEditPlayer(p.id,formFor(p,{draftYear:String(born+21),draftRound:'2',draftPick:'44',draftTeam:abbr,experience:'6',salary:'23.45',contractThrough:String(state.year+3)}))`);
 assert.deepEqual(run('[p.bio.draftYear-born,p.bio.draftRound,p.bio.draftPick,p.bio.draftTeam===abbr,state.year-p.bio.debutYear,p.salary,p.contractThrough-state.year]'),[21,2,44,true,6,23.45,3]);
 assert.match(run('playerBioFacts(p)'),/Round 2, Pick 44/);assert.match(run('playerBioFacts(p)'),/6 seasons/);
 assert.equal(run(`contractRows(p,club).length`),4,'four remaining seasons');assert(run(`contractRows(p,club).every(r=>r.base===23450000)`));
 // Untouched save leaves the contract alone.
 l.run(`var before=JSON.stringify([p.salary,p.contractThrough]);commissionerEditPlayer(p.id,formFor(p))`);assert.equal(run('JSON.stringify([p.salary,p.contractThrough])'),run('before'));
 // Validation.
 for(const [x,msg] of [[{draftYear:'born+10'},/Draft year must be at least 15 years after/],[{experience:'40'},/Experience/],[{salary:'99999'},/Annual salary/],[{salary:'0'},/Annual salary/],[{contractThrough:String(y+5)},/Contract through/],[{draftPick:'0'},/Draft pick/],[{draftTeam:'TOOLONG'},/drafting team/]]){
  const v=x.draftYear==='born+10'?{draftYear:String(run('born')+10)}:x;assert.throws(()=>l.run(`commissionerEditPlayer(p.id,formFor(p,${JSON.stringify(v)}))`),msg,JSON.stringify(x))}
 assert.equal(run('p.salary'),23.45,'rejected edits change nothing');
 // Free agent: draft/experience yes, contract note; prospect: note only.
 const fa=run('commissionerPlayerForm(state.free[0])');assert.match(fa,/name="draftYear"/);assert.doesNotMatch(fa,/name="salary"/);assert.match(fa,/Free agents have no contract/);
 const pr=run('commissionerPlayerForm(state.draft.prospects[0])');assert.doesNotMatch(pr,/name="draftYear"|name="salary"/);assert.match(pr,/Draft prospects get their draft details/);
 l.run(`commissionerEditPlayer(state.draft.prospects[0].id,(()=>{const f=formFor(state.draft.prospects[0]);for(const k of ['draftYear','draftRound','draftPick','draftTeam','experience','salary','contractThrough'])delete f[k];return f})())`);
 // Saves load.
 assert.deepEqual(run(`(()=>{const q=${roundTrip}.teams[4].roster.find(x=>x.id===p.id);return [q.salary,q.contractThrough-state.year,q.bio.draftPick,state.year-q.bio.debutYear]})()`),[23.45,3,44,6]);
}
// ---- WNBA ----
{const l=loadLeague({seed:78,strictDOM:false});l.setRandomSeed(78);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};l.run(SETUP('wnba'));
 assert(run('wnbaEnabled()'),'WNBA contract rules on');
 l.run(`var club=state.teams.find(t=>t.roster.some(p=>p.wnbaContract));var p=club.roster.find(p=>p.wnbaContract);p.age=Math.max(p.age,24);var oldStart=p.wnbaContract.startYear;`);
 const html=run('commissionerPlayerForm(p)');assert.match(html,/name="salary"[^>]*step="0.001"/);assert.equal((html.match(/<select name="contractThrough">([^]*?)<\/select>/)[1].match(/<option/g)||[]).length,4,'WNBA: up to 4 seasons');
 l.run(`commissionerEditPlayer(p.id,formFor(p,{salary:'0.123',contractThrough:String(state.year+2)}))`);
 const c=run('p.wnbaContract');assert.equal(run('p.salary'),0.123);assert.equal(run('p.contractThrough'),run('state.year')+2);assert.equal(c.evidence,'commissioner_override');assert.equal(c.kind,'veteran');
 assert(c.annual.filter(a=>a.year>=run('state.year')).every(a=>a.base===123000),'remaining years at the new salary');assert.equal(c.annual.at(-1).year,run('state.year')+2);
 assert(c.annual.every((a,i)=>a.year===c.startYear+i&&a.guaranteed<=a.base),'contiguous, guarantees within base');
 assert.equal(run(`wnbaAnnual(p,state.year)?.base??wnbaCapCharge(p,p.wnbaContract.annual.find(a=>a.year===state.year),state.year)`)>0,true);
 // Saves load (strict WNBA contract reader).
 assert.deepEqual(run(`(()=>{const q=${roundTrip}.teams.flatMap(t=>t.roster).find(x=>x.id===p.id);return [q.salary,q.wnbaContract.annual.length===p.wnbaContract.annual.length,q.contractThrough]})()`),[0.123,true,run('state.year')+2]);
}
console.log('Commissioner career fields: NBA draft/experience/salary/term edited, shown on the profile, untouched saves unchanged, 7 validations, FA/prospect notes, save round trip; WNBA annual schedule rebuilt (4-season limit, override evidence) and loads passed.');
