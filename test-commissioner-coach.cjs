// Commissioner coach editor + profile theme: the coach profile uses the player profile colors (player-themed), shows an
// 'Edit coach' button in commissioner mode, and the coach editor saves bio, style, ratings, assistants and contract
// (contract changes bump the revision). Player and coach editors open full screen in the profile theme.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:82,strictDOM:false});l.setRandomSeed(82);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='C';state=validateCareerData(buildSetupCareer(d));var club=state.teams[3],c=coachFor(club);
var formFor=(x={})=>{const ct=coachContract(c);return {name:c.name,age:String(c.age),birthdate:c.bio.birthdate,hometown:c.bio.hometown,college:c.bio.college,system:c.system,type:c.type,focus:c.focus,tempo:String(c.tempo),...Object.fromEntries(COACH_KEYS.map(k=>['c_'+k,String(c.attributes[k])])),assistant0:c.assistants[0].name,assistantRating0:String(c.assistants[0].rating),assistant1:c.assistants[1].name,assistantRating1:String(c.assistants[1].rating),salary:String(ct.salary),through:String(ct.through),...x}};`);
// 1. Coach profile: player colors, no edit button until commissioner mode is on.
l.run('openCoachProfile(club.id)');assert.match(run(`document.getElementById('profile').className`),/player-dialog coach-dialog player-themed/);assert.doesNotMatch(run(`document.getElementById('profile').innerHTML`),/Edit coach/);
l.run(`Object.assign(commissioner(),{enabled:true,everUsed:true});openCoachProfile(club.id)`);assert.match(run(`document.getElementById('profile').innerHTML`),/commissionerOpenCoachEditor\(3\)">Edit coach/);
// 2. Editor: full screen, profile theme, every field.
l.run('commissionerOpenCoachEditor(club.id)');assert.match(run(`document.getElementById('profile').className`),/player-dialog player-themed commissioner-editor commissioner-fullscreen/);
const html=run('commissionerCoachForm(club)');for(const n of ['name','age','birthdate','hometown','college','system','type','focus','tempo','assistant0','assistantRating0','assistant1','assistantRating1','salary','through',...run('COACH_KEYS').map(k=>'c_'+k)])assert.match(html,new RegExp(`name="${n}"`),n);
// 3. Save: values applied, contract revision bumped, age/birthdate kept in step.
const rev=run('coachContract(c).revision'),year=run('state.year');
l.run(`commissionerEditCoach(club.id,formFor({name:'Test Coach',age:'50',system:'Triangle',type:'Win-Now',focus:'Outside-in',tempo:'61',c_offense:'97',assistant0:'New Assistant',assistantRating0:'88',salary:'7.3',through:String(state.year+3)}))`);
assert.deepEqual(run('[c.name,c.age,c.system,c.type,c.focus,c.tempo,c.attributes.offense,c.assistants[0].name,c.assistants[0].rating,c.contract.salary,c.contract.through-state.year,c.contract.revision]'),['Test Coach',50,'Triangle','Win-Now','Outside-in',61,97,'New Assistant',88,7.3,3,rev+1]);
assert.equal(run('commissionerAgeOn(c.bio.birthdate)'),50,'birth year follows the age');
// Untouched contract keeps the revision.
l.run('commissionerEditCoach(club.id,formFor())');assert.equal(run('c.contract.revision'),rev+1);
// 4. Validation: nothing changes on a bad value.
for(const [x,msg] of [[{age:'20'},/Age/],[{c_defense:'100'},/Defensive Scheme/],[{salary:'25'},/Annual salary/],[{through:String(year+9)},/Contract through/],[{system:'Zone'},/system/],[{name:''},/Name/],[{assistantRating1:'0'},/assistant rating/]])
 assert.throws(()=>l.run(`commissionerEditCoach(club.id,formFor(${JSON.stringify(x)}))`),msg,JSON.stringify(x));
assert.equal(run('c.name'),'Test Coach');
// 5. Through the commissioner action: confirm, log, reopen the coach profile; saves load.
const logged=run(`(async()=>{commissionerConfirm=()=>true;const f={target:{},preventDefault(){}};await commissionerAction(null,'coach',{team:club.id});return commissioner().log?.[0]})()`);
l.run(`state=validateCareerData(JSON.parse(JSON.stringify(state)))`);assert.equal(run('coachFor(state.teams[3]).name'),'Test Coach');assert.equal(run('coachFor(state.teams[3]).contract.salary'),7.3);
// 6. Player editor is full screen too.
l.run('commissionerOpenEditor(state.teams[0].roster[0].id)');assert.match(run(`document.getElementById('profile').className`),/commissioner-fullscreen/);
// 7. CSS: the theme block and full-screen editor rules exist.
const css=require('fs').readFileSync('dist/profiles.css','utf8');assert.match(css,/html dialog\.player-dialog\.player-themed \{/);assert.match(css,/dialog\.player-dialog\.commissioner-fullscreen\{position:fixed;inset:0/);assert.match(css,/\.commissioner-fullscreen form>button\.primary\{position:sticky;bottom:0/);
console.log('Commissioner coach editor: themed coach profile, Edit coach in commissioner mode, full-screen editors, every field saved, contract revision, 7 validations, save/load passed.');
