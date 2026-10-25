const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

vm.runInContext(`
state=validateCareerData(fresh(defaultTeams(),82));render=()=>{};save=async()=>true;showResult=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};
sim(1);const scheduleBefore=JSON.stringify(state.schedule),rosterBefore=JSON.stringify(team().roster),original=copy(team()),record=[team().w,team().l],old=team().abbr;
const swap=state.teams.find(t=>t.divisionId!==team().divisionId),other=copy(swap),values={city:'Test City',name:'Comets',abbr:'TST',population:'1.0',logo:'12',swap:String(swap.id),color0:'#112233',color1:'#445566',color2:'#778899',colorName0:'Primary blue',colorName1:'Steel',colorName2:'Gray'};
applyManagedTeam(0,values);assert.equal(team().name,'Comets');assert.equal(team().conference,other.conference);assert.equal(team().divisionId,other.divisionId);assert.equal(swap.divisionId,original.divisionId);assert.equal(JSON.stringify(team().roster),rosterBefore);assert.equal(JSON.stringify(state.schedule),scheduleBefore);assert.deepEqual([team().w,team().l],record);assert(state.history.every(h=>h.box.every(p=>p.team!==old)));assert(secondaryTeamLogo(team()).includes('CLE.png'));
state=validateCareerData(copy(state));assert.equal(team().abbr,'TST');assert.equal(state.scheduleAlignment[0].divisionId,original.divisionId);assert(teamManagementView().includes('Save team info'));
const snapshot=JSON.stringify(state);assert.throws(()=>applyManagedTeam(0,{...values,abbr:state.teams[1].abbr}),/abbreviation/);assert.equal(JSON.stringify(state),snapshot);assert.throws(()=>applyManagedTeam(0,{...values,color0:'invalid'}),/colors/);
state=validateCareerData(fresh(defaultTeams().slice(0,6),1));applyManagedTeam(2,{...values,swap:'',divisionId:state.divisions[0].id});assert.equal(state.teams[2].divisionId,state.divisions[0].id);state=validateCareerData(copy(state));
`,context);vm.runInContext(`
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
team().primaryLogo=image;team().secondaryLogo=image;team().secondaryLogoIndex=3;team().arenaName='Dynasty & Friends Arena';
state=validateCareerData(copy(state));assert.equal(team().primaryLogo,image);assert.equal(team().secondaryLogo,image);assert.equal(team().secondaryLogoIndex,3);assert.equal(teamArena(team()),'Dynasty & Friends Arena');assert(teamLogo(team()).includes(image));assert(secondaryTeamLogo(team()).includes(image));assert.equal(teamSummary(state).primaryLogo,image);assert(teamManagementView().includes('primaryUpload'));assert(teamManagementView().includes('secondaryUpload'));
assert.throws(()=>readTeamBrand({primaryLogo:'javascript:alert(1)'},m=>{throw Error(m)}),/logo/);assert.throws(()=>readTeamBrand({arenaName:' '},m=>{throw Error(m)}),/arena/);assert.throws(()=>readTeamBrand({secondaryLogoIndex:SECONDARY_TEAM_KEYS.length},m=>{throw Error(m)}),/secondary/);assert.equal(readTeamBrand({secondaryLogoIndex:30},m=>{throw Error(m)}).secondaryLogoIndex,30);
delete team().primaryLogo;delete team().secondaryLogo;assert(!teamLogo(team()).includes(image));assert(secondaryTeamLogo(team()).includes('CHI.png'));
`,context);
console.log('Team edits, duplicate validation, colors, logo pairing, alignment exchange, existing schedule and save reload passed.');
