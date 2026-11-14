// Clutch-winner and buzzer-beater headlines name the shot: each scoring feat action stores the narrated shot, its
// category, the assister (assisterId) and an and-one flag; wording picks a category phrase by (playerId + seq), adds the
// passer and the time left; old feats without a shot type keep the point-value wording; the detail line is unchanged.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:9,strictDOM:false});l.setRandomSeed(9);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Feat';state=validateCareerData(buildSetupCareer(d));`);
// 1. Categories from the engine's shot names.
const cat=[['Driving Dunk',2,'dunk'],['Alley Oop Dunk Shot',2,'dunk'],['Driving Layup over a contest',2,'layup'],['Cutting Finger Roll Layup',2,'layup'],['6′ Driving Floating Jumpshot',2,'floater'],['post hook',2,'hook'],['16′ Fadeaway Jumper over a contest',2,'post'],['14′ Turnaround Jumpshot',2,'post'],['18′ Pullup Jumper',2,'midrange'],['20′ Catch and Shoot Jumpshot',2,'midrange'],['28′ 3PT',3,'three'],['26′ Stepback 3PT',3,'stepbackThree'],['Putback Dunk',2,'putback'],['Putback Layup',2,'putback'],['Tip Shot',2,'putback'],['Free throw',1,'freeThrow']];
for(const [shot,v,want] of cat)assert.equal(run(`featShotCategory(${JSON.stringify(shot)},${v})`),want,shot);
console.log('PASS categories from shot names:',cat.length,'cases');
// 2. Wording per category, clutch and buzzer.
const words={dunk:/dunk|slam/,layup:/lay|layup|winner/,floater:/floater|floats/,hook:/hook/,post:/turnaround|fadeaway|post/,midrange:/jumper|pull-up/,three:/three|triple/,stepbackThree:/step-back three/,putback:/putback|puts back|tips|cleans up the miss/,freeThrow:/free throw|at the line/};
const value={freeThrow:1,three:3,stepbackThree:3};
const word=(type,e,extra={})=>run(`featWording('Ann Lee','',${JSON.stringify(type)},${JSON.stringify(e)},'',${JSON.stringify(extra)})`);
for(const [k,re] of Object.entries(words))for(let seq=0;seq<4;seq++){const e={type:'score',playerId:7,seq,value:value[k]||2,shotType:k};
 const c=word('clutchWinner',e),b=word('winningBuzzer',e);assert.match(c,re,k+' clutch: '+c);assert.match(b,re,k+' buzzer: '+b);assert.match(b,/buzzer|horn|time expires|no time left/,k+' buzzer moment: '+b);assert(c.startsWith('Ann Lee ')&&c.endsWith('.'));assert(!/buzzer|horn/.test(c),'clutch winner is not a buzzer-beater: '+c)}
const andOne=word('clutchWinner',{type:'score',playerId:7,seq:1,value:2,shotType:'layup',andOne:true});assert.match(andOne,/and-one/);assert.match(word('winningBuzzer',{type:'score',playerId:7,seq:0,value:2,shotType:'dunk',andOne:true}),/and-one|contact/);
const counts=Object.fromEntries(Object.keys(words).map(k=>[k,new Set([0,1,2,3,4,5].map(seq=>word('clutchWinner',{type:'score',playerId:7,seq,value:value[k]||2,shotType:k}))).size]));assert(Object.values(counts).every(n=>n>=2&&n<=4),'2–4 phrases per category: '+JSON.stringify(counts));
console.log('PASS wording per category (clutch and buzzer), and-one, 2–4 phrases each:',JSON.stringify(counts));
// 3. Passer and time left; stable choice.
const e={type:'score',playerId:3,seq:10,value:3,shotType:'three'};
assert.match(word('clutchWinner',e,{assister:'Kyle Smith',secondsLeft:22}),/ off a feed from Kyle Smith with 22 seconds left\.$/);
assert.match(word('clutchWinner',e,{secondsLeft:1}),/ with 1 second left\.$/);assert.doesNotMatch(word('clutchWinner',e,{secondsLeft:95}),/left\./,'time only inside the final minute');
assert.doesNotMatch(word('winningBuzzer',e,{assister:'Kyle Smith',secondsLeft:0}),/seconds? left/,'buzzer-beaters skip the clock');assert.match(word('winningBuzzer',e,{assister:'Kyle Smith'}),/off a feed from Kyle Smith\.$/);
assert.doesNotMatch(word('clutchWinner',{type:'score',playerId:3,seq:1,value:1,shotType:'freeThrow'},{assister:'Kyle Smith'}),/feed/,'free throws have no passer');
assert.equal(word('clutchWinner',e),word('clutchWinner',e),'stable');
console.log('PASS passer, time left (final minute only, not on buzzer-beaters), stable choice');
// 4. Old feats without a shot type keep the point-value wording exactly.
const old=[[{type:'score',playerId:4,seq:0,value:2},'clutchWinner','Ann Lee sinks a late two-pointer for the win.'],[{type:'score',playerId:4,seq:1,value:3},'clutchWinner','Ann Lee comes through with the decisive late three-pointer.'],[{type:'score',playerId:4,seq:0,value:1},'winningBuzzer','Ann Lee beats the buzzer with the game-winning free throw.']];
for(const [e,t,want] of old)assert.equal(word(t,e,{assister:'Kyle Smith',secondsLeft:12}),want);
assert.equal(run(`featWording('Ann Lee','Season high',${JSON.stringify('careerHigh')},{type:'score',playerId:1,seq:1,value:2},'40 PTS')`),'Ann Lee — Season high: 40 PTS','other feat wording unchanged');
console.log('PASS old feats without a shot type: unchanged wording');
// 5. Engine records: every score has a type; free throws, assists, and-ones; saves accept and check the fields.
const rec=run(`(()=>{let n=0,typed=0,ft=0,andOne=0,assisted=0,bad=[];const types=new Set();let sample=null;for(let i=0;i<20;i++){const a=i%29,b=(i*5+7)%30===a?(a+2)%30:(i*5+7)%30;const g=play(a,b);for(const e of g.summaryData.featActions){if(e.type!=='score'){if(e.shotType!==undefined)bad.push(e.type);continue}n++;if(FEAT_SHOT_TYPES.includes(e.shotType))typed++;types.add(e.shotType);if(e.value===1&&e.shotType==='freeThrow')ft++;if(e.andOne)andOne++;if(e.assisterId!==undefined)assisted++}sample=g}
 readGameSummaryData(JSON.parse(JSON.stringify(sample.summaryData)),m=>{throw Error(m)});return {n,typed,ft,andOne,assisted,bad,types:[...types].sort(),sample:JSON.stringify(sample.summaryData)}})()`);
assert.equal(rec.typed,rec.n,'every score action has a shot type');assert(rec.ft>50&&rec.andOne>0&&rec.assisted>100,JSON.stringify({ft:rec.ft,andOne:rec.andOne,assisted:rec.assisted}));assert.deepEqual(rec.bad,[]);assert(rec.types.length>=8,rec.types.join());
l.context.sd=rec.sample;for(const [edit,re] of [["s.featActions.find(e=>e.type==='score').shotType='slam'",/shot detail/],["s.featActions.find(e=>e.type==='score').shot=7",/shot detail/],["s.featActions.find(e=>e.type==='score').andOne='yes'",/shot detail/],["s.featActions.find(e=>e.type!=='score').shotType='dunk'",/shot detail/]])assert.throws(()=>l.run(`(()=>{const s=JSON.parse(sd);${edit};readGameSummaryData(s,m=>{throw Error(m)})})()`),re,edit);
l.run(`(()=>{const s=JSON.parse(sd);for(const e of s.featActions){delete e.shot;delete e.shotType;delete e.andOne}readGameSummaryData(s,m=>{throw Error(m)})})()`);
console.log('PASS engine:',rec.n,'scores typed (',rec.types.join(', '),'),',rec.ft,'free throws,',rec.assisted,'assisted,',rec.andOne,'and-ones; saves validate the fields; records without them still load');
// 6. A real clutch winner: headline names the shot; the detail line keeps the score, time and "Score at the play".
const real=run(`(()=>{for(let i=0;i<400;i++){const g=play(i%30,(i*11+5)%30===i%30?(i+1)%30:(i*11+5)%30);const f=recognizePlayerFeats(g).find(f=>f.type==='clutchWinner'||f.type==='winningBuzzer');if(f){const item=state.newsFeed.items.find(n=>n.featId===f.id);return {text:f.text,shotType:f.e.shotType,detail:item?.detail||null}}}return null})()`);
assert(real,'a clutch winner within 400 games');const re=words[real.shotType];assert(re&&re.test(real.text),'headline names the '+real.shotType+': '+real.text);
if(real.detail)assert.match(real.detail,/(defeated|lost to) .*, \d+–\d+.*(Final box score\.|· Score at the play: \d+–\d+\.)$/,'detail line format unchanged: '+real.detail);
console.log('PASS real game:',real.text,real.detail?'| '+real.detail:'');
