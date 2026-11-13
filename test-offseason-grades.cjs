// Owner offseason grade: snapshot at the end of the playoffs, grade when free agency closes. Covers grade boundaries and
// patience, contend vs rebuild weighting of the same trade, a team that made no moves, free-agency gains and losses,
// the user's review (patience, GM history, news, screen, sortable table), the commissioner's hide switch, the save
// checker and old saves.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:31,strictDOM:false});l.setRandomSeed(31);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
const fresh=()=>l.run(`render=()=>{};toast=()=>{};save=()=>Promise.resolve(true);var d=makeDraft();d.gmName='Grades';d.teams=d.teams.slice(0,8);d.meetings=2;state=validateCareerData(buildSetupCareer(d));delete state.offseasonGrades;`);
fresh();

// 1. Grade boundaries and patience swings (smaller than the season review).
const cases=[[100,'A+'],[97,'A+'],[96,'A'],[93,'A'],[92,'A-'],[90,'A-'],[89,'B+'],[87,'B+'],[86,'B'],[83,'B'],[82,'B-'],[80,'B-'],[79,'C+'],[77,'C+'],[76,'C'],[73,'C'],[72,'C-'],[70,'C-'],[69,'D+'],[67,'D+'],[66,'D'],[63,'D'],[62,'D-'],[60,'D-'],[59,'F'],[0,'F']];
for(const [score,letter] of cases)assert.equal(run(`offseasonLetter(${score})`),letter,'score '+score);
assert.deepEqual(run("['A','C','F'].map(g=>OFFSEASON_PATIENCE[g])"),[5,0,-8]);
assert(run("Object.values(OFFSEASON_PATIENCE).every(n=>Math.abs(n)<=8)"),'patience swing smaller than a season-review goal (15–20)');
console.log('PASS grade boundaries A+ … F and patience A +5 / C 0 / F −8');

// 2. No moves: every category is neutral except roster/finances/fit; a strong roster still earns a B.
l.run(`var strong=state.teams.slice().sort((a,b)=>offseasonStrength(b.roster)-offseasonStrength(a.roster))[0];ownerFor(strong).type='tycoon';offseasonSnapshot();var still=offseasonGradeAll();`);
const still=run('still'),strongId=run('strong.id');
assert.equal(still.teams.length,8);for(const t of still.teams){assert.deepEqual(t.active,[],'no moves');assert.equal(t.categories.draft,75);assert.equal(t.categories.freeAgency,75);assert.equal(t.categories.trades,75);assert.equal(t.change,0);assert(t.notes.some(n=>/^Stood pat/.test(n)),'stood-pat note')}
const best=still.teams.find(t=>t.id===strongId);assert(best.score>=83,`contender that stood pat earns at least a B (${best.grade} ${best.score})`);
assert(still.teams.every(t=>t.score>=60),'standing pat is never an F: '+still.teams.map(t=>t.grade).join(' '));
assert.equal(run('offseasonStore().snapshot'),null,'snapshot consumed');assert.equal(run('offseasonGradeAll().year'),still.year,'grading twice returns the same season');
console.log('PASS a team with no moves: neutral categories, strongest roster',best.grade,best.score,'; league',still.teams.map(t=>t.grade).join(' '));

// 3. Rebuild vs contend: the same trade (young upside + a first-round pick for an older star) grades higher for a
//    win-now owner than for a Process-Truster.
fresh();
l.run(`var A=state.teams[0],B=state.teams[1],y=state.year;
 var young=A.roster.slice().sort((a,b)=>(b.pot-b.ovr)-(a.pot-a.ovr)||a.age-b.age)[0];Object.assign(young,{age:21,ovr:72,pot:90,contractThrough:y+3});
 var vet=B.roster.slice().sort((a,b)=>b.ovr-a.ovr)[0];Object.assign(vet,{age:31,ovr:86,pot:86,contractThrough:y+2});
 offseasonSnapshot();
 A.roster=A.roster.filter(p=>p!==young).concat(vet);B.roster=B.roster.filter(p=>p!==vet).concat(young);transferTradePicks(A,B,[{year:y+1,origin:A.id,round:1}],[]);
 var ctx=offseasonContext(offseasonStore().snapshot),gradeAs=type=>{ownerFor(A).type=type;return offseasonGradeTeam(A,offseasonStore().snapshot,ctx)};
 var contend=gradeAs('tycoon'),rebuild=gradeAs('rebuilder');`);
const contend=run('contend'),rebuild=run('rebuild');
assert.deepEqual(contend.active,['trades']);assert(contend.notes.some(n=>/Trade with /.test(n)),'trade named in notes: '+contend.notes.join(' | '));
assert(contend.categories.trades>rebuild.categories.trades,`trade value: contend ${contend.categories.trades} > rebuild ${rebuild.categories.trades}`);
assert(contend.categories.fit>rebuild.categories.fit,`plan fit: contend ${contend.categories.fit} > rebuild ${rebuild.categories.fit}`);
assert(contend.score>rebuild.score,`overall: contend ${contend.score} > rebuild ${rebuild.score}`);assert(contend.change>0,'roster got stronger now');
// The reverse trade (sell the star for youth and a pick) flips it.
l.run(`A.roster=A.roster.filter(p=>p!==vet).concat(young);B.roster=B.roster.filter(p=>p!==young).concat(vet);transferTradePicks(B,A,[{year:y+1,origin:A.id,round:1}],[]);
 var vet2=A.roster.slice().sort((a,b)=>b.ovr-a.ovr)[0];Object.assign(vet2,{age:32,contractThrough:y+2});offseasonStore().snapshot=null;offseasonSnapshot();
 A.roster=A.roster.filter(p=>p!==vet2);B.roster=B.roster.concat(vet2);transferTradePicks(B,A,[{year:y+1,origin:B.id,round:1}],[]);var young2=B.roster.filter(p=>p!==vet2).sort((a,b)=>a.age-b.age)[0];Object.assign(young2,{contractThrough:y+3});B.roster=B.roster.filter(p=>p!==young2);A.roster.push(young2);
 ctx=offseasonContext(offseasonStore().snapshot);var sellC=gradeAs('tycoon'),sellR=gradeAs('rebuilder');`);
const sellC=run('sellC'),sellR=run('sellR');assert(sellR.categories.fit>sellC.categories.fit,`selling: rebuild fit ${sellR.categories.fit} > contend ${sellC.categories.fit}`);assert(sellR.score>sellC.score,`selling: rebuild ${sellR.score} > contend ${sellC.score}`);
console.log('PASS rebuild vs contend: buying a star',contend.grade,'(Tycoon) vs',rebuild.grade,'(Process-Truster); selling it',sellR.grade,'(Process-Truster) vs',sellC.grade,'(Tycoon)');

// 4. Free agency: losing a key expiring player hurts; a bargain signing helps.
fresh();
l.run(`var A=state.teams[0],B=state.teams[1],y=state.year;var star=A.roster.slice().sort((a,b)=>b.ovr-a.ovr)[0];star.contractThrough=y;offseasonSnapshot();
 A.roster=A.roster.filter(p=>p!==star);star.contractThrough=y+3;B.roster.push(star);var lost=offseasonGradeTeam(A,offseasonStore().snapshot,offseasonContext(offseasonStore().snapshot));
 var fa=state.free.slice().sort((a,b)=>b.ovr-a.ovr)[0];Object.assign(fa,{salary:.75,contractThrough:y+2});state.free=state.free.filter(p=>p!==fa);A.roster.push(fa);
 var signed=offseasonGradeTeam(A,offseasonStore().snapshot,offseasonContext(offseasonStore().snapshot));`);
const lost=run('lost'),signed=run('signed');
assert(lost.categories.freeAgency<75,'losing the best player in free agency: '+lost.categories.freeAgency);assert(lost.notes.some(n=>/Worst move: Lost .* to /.test(n)),lost.notes.join(' | '));
assert(signed.categories.freeAgency>lost.categories.freeAgency,'a cheap signing helps');assert(signed.notes.some(n=>/Best move: Signed /.test(n)),signed.notes.join(' | '));
console.log('PASS free agency: lost star',lost.categories.freeAgency,'→ plus bargain signing',signed.categories.freeAgency);

// 5. The user's review: patience, GM career history, news, screen and sortable league table.
fresh();
l.run(`var you=controlledTeamId(),owner=ownerFor(state.teams[you]);owner.patience=50;var news0=state.newsFeed?.items.length||0;offseasonSnapshot();var graded=offseasonGradeAll();var mine=graded.teams.find(t=>t.id===you);`);
const mine=run('mine');assert.equal(run('owner.patience'),50+run('OFFSEASON_PATIENCE[mine.grade]'));assert.equal(mine.patience,run('OFFSEASON_PATIENCE[mine.grade]'));
assert.equal(mine.quote,run('offseasonQuote(mine.grade,mine.owner)'));assert(mine.quote.length>10);
assert.deepEqual(run('gmActiveTenure().records.find(r=>r.year===state.year).offseasonGrade'),{score:mine.score,grade:mine.grade},'GM career history');
const heads=run('state.newsFeed.items.slice(0,2).map(i=>[i.category,i.headline])');assert(heads.some(([c,h])=>c==='Franchise'&&h.includes('offseason: '+mine.grade)),JSON.stringify(heads));assert(heads.some(([c,h])=>c==='League'&&/^Offseason grades: /.test(h)),JSON.stringify(heads));
l.run("view='Offseason grades'");const html=run('careerBodyContent()');
assert(html.includes('OFFSEASON REVIEW')&&html.includes(mine.quote.replace(/’/g,'’'))&&mine.notes.every(n=>html.includes(l.run('escapeHTML')(n))),'review card with quote and notes');
for(const [,name] of run('OFFSEASON_CATEGORIES'))assert(html.includes(name),'category '+name);
const order=()=>[...run('careerBodyContent()').matchAll(/<tr class="(?:you)?"><td>([^<]+)<\/td>/g)].map(m=>m[1]);
l.run("offseasonSort('team')");const az=order();assert.deepEqual(az,[...az].sort((a,b)=>a.localeCompare(b)),'sorted by team A–Z');l.run("offseasonSort('team')");assert.deepEqual(order(),[...az].reverse(),'toggle to Z–A');
l.run("offseasonSort('score')");const scores=[...run('careerBodyContent()').matchAll(/<\/span> (\d+)<\/td>/g)].map(m=>+m[1]);assert.deepEqual(scores,[...scores].sort((a,b)=>b-a),'sorted by score');
assert(run("renderCareerShell.toString().includes(\"'Offseason grades'\")"),'in the sidebar');
const gmHtml=run('gmHistoryPanel()');assert(gmHtml.includes('<th>Offseason</th>')&&gmHtml.includes(mine.grade+' ('+mine.score+')'),'GM Career history column');
console.log('PASS your review: grade',mine.grade,mine.score,', patience',mine.patience,', GM history, news, review card, sortable table');

// 6. Commissioner: hide grades (no patience change, no news, screen says hidden); only while commissioner mode is on.
fresh();
l.run('offseasonToggleHidden()');assert.equal(run('offseasonStore().hidden'),false,'needs commissioner mode');
l.run("commissioner().enabled=true;commissioner().everUsed=true;offseasonToggleHidden();var you=controlledTeamId(),owner=ownerFor(state.teams[you]);owner.patience=50;var news0=state.newsFeed?.items.length||0;offseasonSnapshot();offseasonGradeAll();view='Offseason grades'");
assert.equal(run('offseasonStore().hidden'),true);assert.equal(run('owner.patience'),50,'no patience change while hidden');assert.equal(run('state.newsFeed?.items.length||0'),run('news0'),'no news while hidden');
assert.equal(run('commissioner().log[0].what'),'Offseason grades');assert(run('careerBodyContent()').includes('hidden by the commissioner'));
l.run('offseasonToggleHidden()');assert(run('careerBodyContent()').includes('OFFSEASON REVIEW'),'shown again after un-hiding');
console.log('PASS commissioner hides grades (no patience, no news), logged, and can show them again');

// 7. Save checker and old saves.
const saved=run('JSON.stringify(state)');l.context.saved=saved;
assert.deepEqual(run('validateCareerData(JSON.parse(saved)).offseasonGrades'),run('offseasonStore()'),'round trip');
const bad=(edit,re)=>assert.throws(()=>l.run(`(()=>{const raw=JSON.parse(saved);${edit};validateCareerData(raw)})()`),re,edit);
bad("raw.offseasonGrades.seasons[0].teams[0].grade='A+';raw.offseasonGrades.seasons[0].teams[0].score=10",/offseason grade/);
bad("raw.offseasonGrades.seasons[0].teams[0].categories.trades=140",/offseason grade/);
bad("raw.offseasonGrades.seasons[0].teams[0].id=99",/offseason grade/);
bad("raw.offseasonGrades.version=2",/offseason grades/);
bad("raw.gmCareer.tenures.at(-1).records.find(r=>r.offseasonGrade).offseasonGrade.grade='F'",/GM offseason grade/);
l.run('offseasonSnapshot()');l.context.withSnap=run('JSON.stringify(state)');assert.equal(run('validateCareerData(JSON.parse(withSnap)).offseasonGrades.snapshot.teams.length'),8,'snapshot saved');
assert.throws(()=>l.run('(()=>{const raw=JSON.parse(withSnap);raw.offseasonGrades.snapshot.teams[0].roster[0].ovr=150;validateCareerData(raw)})()'),/snapshot player/);
// An old save (before this feature) loads with no grades and grades nothing that year without a snapshot.
l.run('var old=JSON.parse(saved);delete old.offseasonGrades;for(const t of old.gmCareer.tenures)for(const r of t.records)delete r.offseasonGrade;state=validateCareerData(old)');
assert.equal(run('state.offseasonGrades'),undefined);assert.equal(run('offseasonGradeAll()'),null,'no snapshot, no grade');assert(run("(view='Offseason grades',careerBodyContent())").includes('No offseason has been graded yet'));
// Opened after the draft started: no snapshot that year (no unfair baseline); before the draft: snapshot taken.
l.run("state.champion=0;ensureDraft();state.draft.picks=[{number:1,round:1,team:0,id:1,name:'x',pos:'PG',ovr:60,pot:70}];ownerFinalize()");assert.equal(run('offseasonStore().snapshot'),null,'draft already started');
l.run('state.draft.picks=[];ownerFinalize()');assert.equal(run('offseasonStore().snapshot.year'),run('state.year'),'snapshot at the end of the playoffs');
console.log('PASS save checker (round trip, tampered grades, GM history field, snapshot) and old saves');
