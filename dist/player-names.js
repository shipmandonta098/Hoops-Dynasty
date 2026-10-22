/* One fictional naming service. Existing/imported/historical names are never rewritten.
   Registry is career-local; indices are transient and rebuilt once after loading. */
const NAME_DEFAULTS={diversity:'high',order:'cultural',allowDuplicates:false};
let activeNameScope=null;
const nameIndices=new WeakMap();
function nameKey(s){return String(s).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');}
function namePeople(s){return [...(s.teams||[]).flatMap(t=>t.roster||[]),...(s.free||[]),...(s.draft?.prospects||[]),...(s.draftRights||[]).map(r=>r.player),...(s.family?.people||[]),...(s.statsArchive||[]),...(s.hallOfFame?.people||[])];}
function nameRegistry(s){
 s.nameGeneration??={version:1,randomState:((s.year||2026)*2654435761)>>>0,used:[],givenUse:{},surnameUse:{},settings:{...NAME_DEFAULTS}};
 const r=s.nameGeneration;let index=nameIndices.get(r);
 if(!index){index=new Set(r.used);nameIndices.set(r,index);for(const p of namePeople(s))reservePlayerName(p.name,s);if(typeof FAMILY_HISTORY_PEOPLE!=='undefined')for(const p of FAMILY_HISTORY_PEOPLE)reservePlayerName(p.name,s);}
 return r;
}
function reservePlayerName(name,s){if(!name)return;const r=nameRegistry(s),index=nameIndices.get(r),key=nameKey(name);if(!index.has(key)){index.add(key);r.used.push(key);}}
function refreshNameRegistry(s){nameRegistry(s);for(const p of namePeople(s))reservePlayerName(p.name,s);if(typeof FAMILY_HISTORY_PEOPLE!=='undefined')for(const p of FAMILY_HISTORY_PEOPLE)reservePlayerName(p.name,s);}
function nameRandom(r){r.randomState=(Math.imul(r.randomState,1664525)+1013904223)>>>0;return r.randomState/4294967296;}
function namePick(pool,usage,random,diversity){
 const power={standard:0.15,high:0.5,maximum:1}[diversity]??.5;
 const weights=pool.map((v,i)=>(i<pool.length*.25?3:i<pool.length*.65?2:1)/Math.pow(1+(usage[nameKey(v)]||0),power));
 let n=random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++)if((n-=weights[i])<0)return pool[i];return pool.at(-1);
}
function feminineSurname(value,code){
 if(code==='PL')return value.replace(/ski$/,'ska').replace(/cki$/,'cka').replace(/dzki$/,'dzka');
 if(['KZ','UZ'].includes(code))return value.replace(/(ov|ev)$/,'$1a');
 // Explicit feminine pools take precedence; do not infer forms for unknown traditions.
 return value;
}
function generatePlayerName({country='US',gender='male',background=null,inheritedSurname=null,s=activeNameScope||state,random=null}={}){
 const d=PLAYER_NAME_DATA[country];if(!Object.hasOwn(PLAYER_NAME_DATA,country))throw Error('No naming dataset for country '+country+'. Choose a supported naming country.');
 const r=nameRegistry(s),rng=random||(()=>nameRandom(r)),settings=r.settings,index=nameIndices.get(r);
 const variants=[{...d,key:'local',weight:country==='US'?40:8},...(d.variants||[])];
 const v=background?variants.find(v=>v.key===background):internationalWeighted(variants.map(v=>[v,v.weight||1]),rng);
 if(!v)throw Error('Unknown naming background for '+country);
 const given=[...(gender==='female'?v.female:v.male),...(v.neutral||[])];
 const surnames=inheritedSurname?[inheritedSurname]:gender==='female'&&v.femaleSurnames?v.femaleSurnames:v.surnames;
 const format=(g,f)=>settings.order==='cultural'&&(v.familyFirst??d.familyFirst)?f+' '+g:g+' '+f;
 let info;
 const candidate=(g,f)=>{f=gender==='female'&&!inheritedSurname?feminineSurname(f,v.gendered||d.gendered):f;const name=format(g,f);return {version:1,name,given:g,surname:f,country,background:v.key,order:settings.order,provenance:'generated'};};
 for(let attempt=0;attempt<120;attempt++){
  const g=namePick(given,r.givenUse,rng,settings.diversity);let f=namePick(surnames,r.surnameUse,rng,settings.diversity);
  if(!inheritedSurname&&(v.multipleSurnames??d.multipleSurnames)&&rng()<.4){const second=namePick(v.surnames,r.surnameUse,rng,settings.diversity);if(second!==f)f+=' '+second;}
  info=candidate(g,f);if(settings.allowDuplicates||!index.has(nameKey(info.name)))break;info=null;
 }
 // Bounded deterministic exhaustive fallback: no numeric suffixes or invented kinship.
 if(!info){const start=Math.floor(rng()*given.length*surnames.length);for(let j=0;j<given.length*surnames.length;j++){const k=(start+j)%(given.length*surnames.length),x=candidate(given[k%given.length],surnames[Math.floor(k/given.length)]);if(!index.has(nameKey(x.name))){info=x;break;}}}
 // Where compound given names are not in the curated tradition, exhaustion is explicit.
 if(!info&&!background&&!inheritedSurname){for(const alternative of variants.filter(x=>x.key!==v.key)){try{return generatePlayerName({country,gender,background:alternative.key,s,random:rng});}catch(e){if(!e.message.startsWith('Unique name pool exhausted'))throw e;}}}
 if(!info)throw Error('Unique name pool exhausted for '+country+'/'+v.key+'. Enable duplicates or expand the local name dataset.');
 reservePlayerName(info.name,s);for(const [field,value] of [['givenUse',info.given],['surnameUse',info.surname]]){const k=nameKey(value);r[field][k]=(r[field][k]||0)+1;}
 return info;
}
function assignFictionalName(p,country){const info=generatePlayerName({country,gender:p.gender});p.name=info.name;p.nameIdentity=info;return p;}
