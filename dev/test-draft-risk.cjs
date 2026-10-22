const assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');
const l=loadLeague({seed:125,strictDOM:false});l.context.assert=assert;
l.run(`
state=fresh();leagueRules();const d=ensureDraft(),p=d.prospects[0],r=p.draftRisk;
assert.ok(r&&r.actualPotential>=p.ovr);assert.ok(r.volatility>=1);
const saved=validateCareerData(JSON.parse(JSON.stringify(state)));
assert.equal(JSON.stringify(saved.draft.prospects[0].draftRisk),JSON.stringify(r));
assert.throws(()=>readDraftRisk({...r,actualPotential:NaN},m=>{throw Error(m)}));
const snapshot=JSON.stringify(r);ensureDraft();assert.equal(JSON.stringify(r),snapshot);
const club=state.teams[0];p.draftRisk.pick=1;club.roster.push(p);d.prospects.shift();
r.volatility=1;r.injuryProneness=1;r.workEthic=90;rookieEnterLeague(p,club);assert.equal(r.event,null);
const game={stage:'Regular season',box:[{playerId:p.id,mp:8}]};state.history=Array.from({length:12},()=>game);
const previous=r.actualPotential;reviewDraftRiskSeason();assert.equal(r.actualPotential,Math.max(p.ovr,previous-2));
const once=JSON.stringify(r);reviewDraftRiskSeason();assert.equal(JSON.stringify(r),once,'idempotent rollover');
r.actualPotential=Math.max(p.ovr,p.pot);r.event=null;rookieBustEvent(p,club,'ceiling');
assert.equal(r.actualPotential,p.ovr);assert.equal(traitDevelopment(p,club,3),0);
const cap={...r.caps};developAttributes(p,3);for(const key of ATTRIBUTE_KEYS)assert.ok(p.attributes[key]<=cap[key]);
assert.equal(rookieBustEvent(p,club,'conditioning'),false,'no stacked bust events');
const q=d.prospects[0];q.draftRisk.pick=8;q.draftRisk.entered=true;q.draftRisk.workEthic=1;club.roster.push(q);d.prospects.shift();
rookieBustEvent(q,club,'conditioning');q.draftRisk.lastReview=state.year-1;const change=traitDevelopment(q,club,3);assert.ok(change>=-3&&change<=-1);
const injury=d.prospects[0];injury.draftRisk.pick=2;injury.draftRisk.entered=true;injury.medicalInfo={name:'ACL tear',severity:'Severe'};
const potential=injury.draftRisk.actualPotential;rookieBustEvent(injury,club,'injury');assert.equal(injury.pot,Math.max(55,Math.round(potential*.8)));
assert.ok(state.newsFeed.items.some(n=>n.headline.includes('severe ACL')));
assert.ok(playerDevelopment({p:q,club}).includes('Conditioning concerns'));
console.log('PASS: persistent hidden traits, invalid-data rejection, scouting initialization, idempotent stagnation, hard ceiling and skill caps, conditioning regression, injury ceiling loss and news/profile events');
`);
// Actual draft and normal/headless result equivalence with risky rookies.
l.run(`state=fresh();leagueRules();state.champion=0;state.day=seasonLength();const draft=ensureDraft();draft.order=state.teams.map(t=>t.id);draft.laterOrder=[...draft.order];const prospect=draft.prospects[0];assert.equal(draftPickInternal(prospect.id),true);assert.equal(prospect.draftRisk.pick,1);assert.equal(prospect.draftRisk.entered,false);globalThis.base=copy(state);`);
function play(mode){l.run(`state=copy(base);simulationExecution.mode='${mode}';`);l.setRandomSeed(90);return JSON.parse(JSON.stringify(l.run(`(()=>{const result=play(0,1);delete result.playByPlay;delete result.boxTimeline;return {result,risks:state.teams.flatMap(t=>t.roster.map(p=>p.draftRisk))}})()`)));}
assert.deepEqual(play('normal'),play('headless'));console.log('PASS: actual pick lifecycle and seeded rookie normal/headless game parity');
l.run(`
(()=>{
 state=fresh();leagueRules();const club=state.teams[0],p=club.roster[0];initializeDraftRisk(p);Object.assign(p.draftRisk,{pick:1,entered:true,injuryProneness:99});p.attributes.dur=1;delete p.medicalInfo;delete p.injuredUntil;
 const rng=Math.random;try{Math.random=()=>0;durabilityMedicalCheck(p,club,40,20,{rotationEvents:[]});}finally{Math.random=rng}
 assert.equal(p.medicalInfo.severity,'Severe');assert.equal(p.draftRisk.event,'injury');
 const reloaded=validateCareerData(JSON.parse(JSON.stringify(state)));assert.equal(JSON.stringify(reloaded.teams[0].roster[0].draftRisk),JSON.stringify(p.draftRisk));
 const q=club.roster[1];initializeDraftRisk(q);q.draftRisk.pick=3;Object.assign(q.draftRisk,{volatility:100,injuryProneness:100,workEthic:1});club.w=0;club.l=30;
 rookieEnterLeague(q,club);assert.equal(q.draftRisk.event,'conditioning');
 const unsigned=ensureDraft().prospects[0],before=JSON.stringify(unsigned.draftRisk);reviewDraftRiskSeason();assert.equal(JSON.stringify(unsigned.draftRisk),before);
 console.log('PASS: actual severe injury hook, persisted post-injury caps, high-risk entry trigger, unsigned prospect protection');
})();
`);
