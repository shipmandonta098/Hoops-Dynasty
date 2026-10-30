// Preset loading and the 82-game alignment check: specific problem text (team count, conference count, division sizes,
// unassigned teams), alignment-only problems load and open the alignment editor with highlights and two choices,
// corrupt presets still fail, and mixed-scope loads explain which side doesn't fit.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:171,strictDOM:false});const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;var toasts=[];toast=t=>toasts.push(t);var modal='';editorModal=(title,body)=>{modal=body};closeTitleModal=()=>{modal=''};renderSetup=()=>{};
 var store=null;localStorage={getItem:()=>store,setItem:(k,v)=>{store=v}};onSetup=true;setupDraft=makeDraft();setupDraft.gmName='Align';
 var base=()=>{const d=makeDraft();d.gmName='Align';return d};var divisionOf=(d,name)=>d.divisions.find(v=>v.name===name);
 var preset=(scope,d)=>{const saved=setupDraft;setupDraft=d;const data=presetPayload(scope);setupDraft=saved;store=JSON.stringify([{id:'p1',name:'Test',scope,updatedAt:new Date().toISOString(),data}]);return 0};`);
const msg=code=>run(`(()=>{const d=base();${code};return validateDraft(d)})()`);
// 1. Specific problem text.
assert.equal(msg(''),'','the default 30-team league fits');
const m29=msg(`const t=d.teams.find(t=>t.division==='Southeast')||d.teams[0];d.teams=d.teams.filter(x=>x!==t)`);
assert.match(m29,/This league has 29 teams\./);assert.match(m29,/has 4 teams/);
const m31=msg(`d.teams.push({...copy(d.teams[0]),key:'team-x31',abbr:'XTO',city:'Extra',name:'Team'})`);
assert.match(m31,/This league has 31 teams\./);assert.match(m31,/has 6 teams/);
const uneven=run(`(()=>{const d=base(),from=d.divisions[0],to=d.divisions[1];d.teams.find(t=>t.divisionId===from.id).divisionId=to.id;return {text:validateDraft(d),from:from.name,to:to.name}})()`);
assert(!/teams\. This league has/.test(uneven.text)&&!/This league has \d+ teams/.test(uneven.text),'30 teams: no team-count complaint');
assert(uneven.text.includes(uneven.from+' has 4')&&uneven.text.includes(uneven.to+' has 6'),uneven.text);
assert.match(uneven.text,/has 6 teams, .+ has 4\.|has 4 teams, .+ has 6\./,'divisions listed like "Southwest has 6 teams, Pacific has 4"');
const loose=run(`(()=>{const d=base(),t=d.teams[3],div=d.divisions.find(v=>v.id===t.divisionId);t.conferenceId=div.conferenceId;t.divisionId='';return {text:validateDraft(d),abbr:t.abbr,div:div.name}})()`);
assert(loose.text.includes('No division: '+loose.abbr)&&loose.text.includes(loose.div+' has 4'),loose.text);
const three=msg(`d.conferences.push({id:'third',name:'Third'});d.divisions[0].conferenceId='third'`);assert.match(three,/Teams are in 3 conferences\./);
assert.match(three,/has 2 divisions\./);
// 2. Alignment-only problems don't block a preset: it applies, the alignment editor opens with highlights and choices.
const loaded=run(`(()=>{const d=base(),div=d.divisions[2];d.teams=d.teams.filter(t=>!(t.divisionId===div.id&&t.key===d.teams.find(x=>x.divisionId===div.id).key));const i=preset('all',d);toasts.length=0;loadPreset(i);
 return {teams:setupDraft.teams.length,meetings:setupDraft.meetings,review:setupAlignmentReview,modal,toast:toasts.at(-1),div:div.name}})()`);
assert.equal(loaded.teams,29,'the preset was applied');assert.equal(loaded.meetings,82);
assert.equal(loaded.review.lead,'This preset’s teams don’t fit its 82-game format.');assert.match(loaded.toast,/Preset applied\. This preset’s teams don’t fit/);
assert(/alignment-banner/.test(loaded.modal)&&/Fix the divisions/.test(loaded.modal)&&/Switch to round-robin/.test(loaded.modal)&&/Use a custom schedule/.test(loaded.modal),'banner offers both choices');
assert(new RegExp('class="division-row alignment-problem"[^>]*><div><strong>'+loaded.div+'</strong> <small class="alignment-problem-text">4 teams — needs 5').test(loaded.modal),'the short division is highlighted');
// Choosing round-robin clears the problem.
const switched=run(`(()=>{setupSwitchSchedule(2);return {meetings:setupDraft.meetings,review:setupAlignmentReview,banner:setupAlignmentBanner(),valid:validateDraft(setupDraft)}})()`);
assert.deepEqual(switched,{meetings:2,review:null,banner:'',valid:''});
// A team with no division is listed and highlighted in the editor.
const unassigned=run(`(()=>{const d=base(),t=d.teams[5];t.conferenceId=d.divisions.find(v=>v.id===t.divisionId).conferenceId;t.divisionId='';loadPreset(preset('all',d));return {modal,abbr:t.abbr}})()`);
assert(new RegExp('<strong>No division:</strong> '+unassigned.abbr).test(unassigned.modal));
// 3. Corrupt data still fails hard and leaves the setup unchanged.
for(const [label,mut] of [['color',"d.teams[0].colors[0].hex='red'"],['logo',"d.teams[0].logoIndex=999"],['name',"d.teams[0].city=''"],['settings',"d.leagueSettings={...d.leagueSettings,seasonGames:'lots'}"]]){
 const r=run(`(()=>{setupDraft=base();const before=JSON.stringify(setupDraft.teams),i=preset('all',base()),list=JSON.parse(store),d=list[0].data;${mut};store=JSON.stringify(list);toasts.length=0;loadPreset(i);return {toast:toasts.at(-1),same:JSON.stringify(setupDraft.teams)===before}})()`);
 assert(/^Preset is invalid/.test(r.toast)&&r.same,label+': '+r.toast);
}
// A preset that fits loads normally with no banner.
assert.deepEqual(run(`(()=>{setupDraft=base();setupDraft.meetings=2;toasts.length=0;loadPreset(preset('all',base()));return [toasts.at(-1),setupAlignmentReview,modal]})()`),['Preset applied.',null,'']);
// 4. Mixed scopes: the message says which side doesn't fit.
const structure=run(`(()=>{setupDraft=base();const d=base();d.teams.push({...copy(d.teams[0]),key:'team-x31',abbr:'XTO',city:'Extra',name:'Team'});d.meetings=2;loadPreset(preset('structure',d));return {lead:setupAlignmentReview?.lead,teams:setupDraft.teams.length,meetings:setupDraft.meetings}})()`);
assert.deepEqual(structure,{lead:'This preset’s teams don’t fit the current 82-game format.',teams:31,meetings:82});
const settings=run(`(()=>{setupDraft=base();setupDraft.teams.pop();setupDraft.meetings=2;const d=base();d.meetings=82;loadPreset(preset('settings',d));return {lead:setupAlignmentReview?.lead,teams:setupDraft.teams.length,meetings:setupDraft.meetings,detail:setupAlignmentReview?.detail}})()`);
assert.equal(settings.lead,'This preset’s 82-game format doesn’t fit your current teams.');assert.equal(settings.teams,29);assert.equal(settings.meetings,82);assert.match(settings.detail,/This league has 29 teams\./);
// Teams + alignment that fit the current format load cleanly.
assert.equal(run(`(()=>{setupDraft=base();loadPreset(preset('structure',base()));return setupAlignmentReview})()`),null);
// Starting a career with a bad alignment still reports the specific problems.
assert.match(run(`(()=>{setupDraft=base();setupDraft.teams.pop();toasts.length=0;submitCareer({preventDefault(){}});return toasts.at(-1)||''})()`),/This league has 29 teams/);
console.log('Preset alignment: specific problem text, soft alignment loads with highlights and choices, hard failures for corrupt data, mixed-scope messages passed.');
