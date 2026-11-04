// Commissioner player editor: overall and potential are not editable; they follow the attributes. Overall moves by the
// average change of the 19 skill attributes (Height comes from the bio, Durability is generated separately), potential
// moves by the same amount, never below overall or above 99; a draft prospect's hidden potential moves with it.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:75,strictDOM:false});l.setRandomSeed(75);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Commish';state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});ensureDraft();
var formFor=(p,change={})=>{withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const b=p.bio||generatePlayerBio(p,state.year,state.teams),t=p.personalityTraits||generateTraits(p),n=commissionerNameParts(p);
 return {first:n.first,last:n.last,pos:p.pos,age:String(p.age),heightInches:String(b.heightInches),weightLbs:String(b.weightLbs),birthdate:b.birthdate,hometown:b.hometown,college:b.college,
  ...Object.fromEntries(ATTRIBUTE_KEYS.map(k=>['a_'+k,String(change[k]??p.attributes[k])])),...Object.fromEntries(TENDENCY_KEYS.map(k=>['t_'+k,String(p.tendencies[k]??generatedTendencies(p)[k])])),...Object.fromEntries(t.map((x,i)=>['trait'+i,x]))}};
var p=state.teams[1].roster[2];p.ovr=70;p.pot=80;withBasketballAttributes(p);`);
const skill=run('COMMISSIONER_OVR_KEYS');assert.equal(skill.length,19);assert(!skill.includes('hgt')&&!skill.includes('dur'));
// 1. Saving untouched attributes leaves both alone; typed ovr/pot are ignored.
l.run(`commissionerEditPlayer(p.id,{...formFor(p),ovr:'99',pot:'99'})`);assert.deepEqual(run('[p.ovr,p.pot]'),[70,80]);
// 2. +10 on every skill attribute → +10 overall, potential keeps its 10-point gap.
l.run(`commissionerEditPlayer(p.id,formFor(p,Object.fromEntries(COMMISSIONER_OVR_KEYS.map(k=>[k,Math.min(99,p.attributes[k]+10)]))))`);
const up=run('[p.ovr,p.pot]');assert(up[0]>=78&&up[0]<=80,'overall rose ~10: '+up);assert.equal(up[1],Math.min(99,80+up[0]-70));
// 3. Height and durability changes do not move overall.
l.run(`var o=p.ovr;commissionerEditPlayer(p.id,formFor(p,{dur:1}))`);assert.equal(run('p.ovr'),run('o'));
// 4. One attribute by +19 → +1 overall (average of 19).
l.run(`p.ovr=60;p.pot=75;p.attributes.tp=50;commissionerEditPlayer(p.id,formFor(p,{tp:69}))`);assert.deepEqual(run('[p.ovr,p.pot]'),[61,76]);
// 5. Potential caps: never above 99, never below overall.
l.run(`p.ovr=90;p.pot=99;commissionerEditPlayer(p.id,formFor(p,Object.fromEntries(COMMISSIONER_OVR_KEYS.map(k=>[k,Math.min(99,p.attributes[k]+5)]))))`);assert(run('p.pot')===99&&run('p.ovr')<=99);
l.run(`p.ovr=70;p.pot=70;commissionerEditPlayer(p.id,formFor(p,Object.fromEntries(COMMISSIONER_OVR_KEYS.map(k=>[k,Math.max(1,p.attributes[k]-8)]))))`);assert(run('p.pot>=p.ovr'));
// 6. Draft prospect: hidden actual potential moves with the shown potential.
const dp=run(`(()=>{const q=state.draft.prospects.find(x=>x.draftRisk&&Number.isFinite(x.draftRisk.actualPotential)&&x.pot<90);if(!q)return null;const before=[q.ovr,q.pot,q.draftRisk.actualPotential];commissionerEditPlayer(q.id,formFor(q,Object.fromEntries(COMMISSIONER_OVR_KEYS.map(k=>[k,Math.min(99,q.attributes[k]+4)]))));return {before,after:[q.ovr,q.pot,q.draftRisk.actualPotential]}})()`);
if(dp){const d=dp.after[0]-dp.before[0];assert(d>0,'prospect overall rose');assert.equal(dp.after[1],Math.min(99,dp.before[1]+d));assert.equal(dp.after[2],Math.max(dp.after[0],Math.min(99,dp.before[2]+d)))}
// 7. Form: no overall/potential inputs; read-only values with a live preview.
const html=run('commissionerPlayerForm(p)');assert(!/name="ovr"|name="pot"/.test(html),'no overall/potential inputs');assert.match(html,/class="commissioner-derived" data-base="[^"]+">Overall <b data-derived="ovr">\d+<\/b> · Potential <b data-derived="pot">\d+<\/b>/);
const prev=run(`(()=>{p.ovr=60;p.pot=70;const base={ovr:60,pot:70,a:Object.fromEntries(COMMISSIONER_OVR_KEYS.map(k=>[k,50]))},nodes={};const box={dataset:{base:JSON.stringify(base)},querySelector:s=>nodes[s]??={textContent:''}};
 const els=Object.fromEntries(COMMISSIONER_OVR_KEYS.map(k=>['a_'+k,{value:'60'}]));commissionerPreviewRatings({querySelector:()=>box,elements:els});return [nodes['[data-derived="ovr"]'].textContent,nodes['[data-derived="pot"]'].textContent]})()`);
assert.deepEqual(prev,[70,80]);
l.run('validateCareerData(JSON.parse(JSON.stringify(state)))');
console.log('Commissioner derived ratings: untouched saves keep ovr/pot, attribute average moves overall, height/durability excluded, potential gap kept and capped, draft hidden potential, read-only form with live preview passed.',dp?'prospect '+JSON.stringify(dp):'no prospect');
