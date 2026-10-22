const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
state=fresh(defaultTeams().slice(0,6),2);render=()=>{};save=async()=>true;ownerCanManage=()=>true;
const v={leagueName:'Test League',gmName:'Test GM',theme:'dark',gender:'mixed',cap:160,format:1},event=()=>({preventDefault(){},target:v});
await saveGameSettings(event());assert.equal(state.salaryCap,160);assert.equal(state.meetings,1);assert.equal(state.schedule.length,5);assert.equal(settingsBusy,false);state=validateCareerData(copy(state));
state.teams[0].w=1;const before=JSON.stringify(state.schedule);v.cap=200;await saveGameSettings(event());assert.equal(state.salaryCap,160);assert.equal(JSON.stringify(state.schedule),before);delete v.cap;delete v.format;v.theme='light';await saveGameSettings(event());assert.equal(state.darkMode,false);assert.equal(state.salaryCap,160);assert(settingsView().includes('Locked'));
save=async()=>false;v.leagueName='Unsaved';await saveGameSettings(event());assert.equal(state.leagueName,'Test League');
})()`,context);console.log('Settings: preseason schedule rebuild, cap, locked-rule enforcement, editable preferences, reload and save rollback passed.');})().catch(e=>{console.error(e);process.exitCode=1});
