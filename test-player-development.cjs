// Age curve for yearly development: growth into the mid-20s, a peak at 26-28, small declines at 29-31 that speed up
// after 32, slower declines for elite and durable players, and occasional breakouts and early falloffs.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:17,strictDOM:false});l.setRandomSeed(17);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};var d=makeDraft();d.gmName='Dev';state=validateCareerData(buildSetupCareer(d));lifecycleRatingOffset=()=>0;
 var sample=(age,ovr,pot,dur,n=6000)=>{let sum=0,up=0,down=0;for(let i=0;i<n;i++){const p={age,ovr,pot,attributes:{dur}};const v=developmentBase(p);sum+=v;if(p.pot>pot)up++;if(v<=-3&&age>=26&&age<=28)down++}return {mean:sum/n,up:up/n,down:down/n}};`);
const mean=(age,ovr=74,pot=88,dur=60)=>run(`sample(${age},${ovr},${pot},${dur})`).mean;
const m={20:mean(20),24:mean(24),27:mean(27),30:mean(30),33:mean(33),35:mean(35)};
assert(m[20]>1&&m[24]>0.5,`young players improve: 20 → ${m[20].toFixed(2)}, 24 → ${m[24].toFixed(2)}`);
assert(Math.abs(m[27])<0.35,`peak years are flat: 27 → ${m[27].toFixed(2)}`);
assert(m[30]<0&&m[30]>-1.6,`small declines at 29-31: 30 → ${m[30].toFixed(2)}`);
assert(m[33]<m[30]&&m[35]<m[33],`declines speed up after 32: 30 ${m[30].toFixed(2)}, 33 ${m[33].toFixed(2)}, 35 ${m[35].toFixed(2)}`);
// Elite and durable players decline more slowly.
const plain=mean(34,80,82,50),elite=mean(34,88,90,50),durable=mean(34,80,82,90),both=mean(34,88,90,90);
assert(elite>plain&&durable>plain&&both>elite&&both>durable,`34-year-olds: plain ${plain.toFixed(2)}, elite ${elite.toFixed(2)}, durable ${durable.toFixed(2)}, both ${both.toFixed(2)}`);
// Breakouts (young, room to grow) and early falloffs (26+) both happen, but rarely.
const young=run(`sample(22,70,85,60)`),prime=run(`sample(27,78,85,60)`);
assert(young.up>.03&&young.up<.25,`breakouts happen: ${young.up}`);assert(prime.down>.02&&prime.down<.12,`early falloffs happen: ${prime.down}`);
// A breakout can lift potential.
assert(run(`(()=>{for(let i=0;i<500;i++){const p={age:21,ovr:70,pot:80,attributes:{dur:60}};developmentBase(p);if(p.pot>80)return true}return false})()`),'breakouts raise potential');
console.log('Player development: curve '+Object.entries(m).map(([a,v])=>a+':'+v.toFixed(2)).join(' ')+`; 34yo plain ${plain.toFixed(2)} elite ${elite.toFixed(2)} durable ${durable.toFixed(2)}; breakouts ${(young.up*100).toFixed(1)}%, falloffs ${(prime.down*100).toFixed(1)}%.`);
