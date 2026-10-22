/* Physical build: biography measurements are authoritative. No extra saved state or RNG. */
const buildClamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function playerBuild(p){
 const fallback=()=>generatePlayerBio(p,2026,[{abbr:'FA'}]);
 const b=p.bio||fallback(),female=p.gender==='female',baseHeight=female?72:78,baseWeight=female?165:220;
 const height=Number.isFinite(b.heightInches)?b.heightInches:baseHeight,weight=Number.isFinite(b.weightLbs)?b.weightLbs:baseWeight;
 const h=buildClamp(height-baseHeight,-18,22),w=buildClamp(weight-baseWeight,-100,200);
 // Wingspan is not recorded by the current save schema; use a height-based reach estimate.
 return {height,weight,h,w,reach:height*1.04,size:ratingLimit(75+h*3),
  speed:buildClamp(1-h/30-w/100,.8,1.2),agility:buildClamp(1-h/45-w/180,.8,1.2),
  strength:buildClamp(1+w/250+h/120,.8,1.2),vertical:buildClamp(1-w/400-h/180,.8,1.2),
  endurance:buildClamp(1-w/600,.8,1.2),reachFactor:buildClamp(1+h/80,.8,1.2)};
}
function physicalAttributeBounds(p){
 const {h,w}=playerBuild(p),tall=Math.max(0,h),short=Math.max(0,-h),heavy=Math.max(0,w),light=Math.max(0,-w);
 const cap=n=>buildClamp(Math.round(n),55,99);
 const max={spd:cap(99-tall*1.4-heavy*.10),drb:cap(99-tall*1.2-heavy*.04),per:cap(99-tall*.9-heavy*.07),stl:cap(99-tall*.7),jmp:cap(99-heavy*.12),endu:cap(99-heavy*.08),stre:cap(99-light*.2-short*.3),rim:cap(99-short*1.4-light*.05),post:cap(99-short*1.3-light*.06),sbl:cap(99-short*2),reb:cap(99-short*1.3)};
 return Object.fromEntries(Object.entries(max).map(([k,v])=>[k,{min:1,max:v}]));
}
function capPhysicalAttributes(p,attributes){const out={...attributes};for(const [key,bounds]of Object.entries(physicalAttributeBounds(p)))out[key]=buildClamp(out[key],bounds.min,bounds.max);out.hgt=playerBuild(p).size;return out;}
function derivedPhysicalAttributes(p){
 const a=p.attributes,b=playerBuild(p),out={...a,hgt:b.size};
 const factors={spd:b.speed,drb:b.agility,per:b.agility,stre:b.strength,jmp:b.vertical,endu:b.endurance,rim:Math.sqrt(b.strength*b.reachFactor),sbl:b.reachFactor,reb:b.reachFactor};
 for(const [key,factor]of Object.entries(factors))out[key]=ratingLimit(a[key]*factor);
 return out;
}
function physicalMatchup(attacker,defender,action,kind,contested){
 const a=playerBuild(attacker),d=playerBuild(defender),height=a.height-d.height,weight=a.weight-d.weight;
 return {height,weight,contestScale:contested&&height>4?buildClamp(1-(height-4)*.035,.8,1):1,
  post:action==='post'&&weight>15?Math.min(.035,(weight-15)*.001):0,
  drive:action==='drive'&&height< -4?Math.min(.025,(-height-4)*.005):0,
  recovery:contested&&kind!=='inside'&&height< -4?Math.min(.012,(-height-4)*.002):0};
}
function physicalReboundScore(p){const a=p.attributes;return playerBuild(p).size*.4+a.stre*.3+a.jmp*.3;}
const buildGeneratedBefore=generatedAttributes;
generatedAttributes=function(p){return capPhysicalAttributes(p,buildGeneratedBefore(p))};
const buildDevelopBefore=developAttributes;
developAttributes=function(p,change){buildDevelopBefore(p,change);p.attributes=capPhysicalAttributes(p,p.attributes);ensurePlayerArchetype(p,state.year,true)};
// Apply once around the shared engine; existing fatigue/morale wrappers still operate normally.
const buildSimBefore=simulateAttributeGame;
simulateAttributeGame=function(a,b,...args){const originals=new Map();try{for(const club of [state.teams[a],state.teams[b]])for(const p of club.roster){withBasketballAttributes(p);originals.set(p,p.attributes);p.attributes=derivedPhysicalAttributes(p)}return buildSimBefore(a,b,...args)}finally{for(const [p,attributes]of originals)p.attributes=attributes}};
