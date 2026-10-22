function generatePlayerBio(p,year,teams,rookie=false){let seed=(p.id+97)>>>0;for(const c of p.name)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;const roll=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>8)%n};const ranges=p.gender==='female'?{PG:[65,71,125],SG:[67,71,135],SF:[70,74,150],PF:[71,74,160],C:[74,80,175]}:{PG:[71,77,175],SG:[75,80,195],SF:[77,83,210],PF:[80,85,230],C:[82,88,245]},range=ranges[p.pos];const heightInches=range[0]+roll(range[1]-range[0]+1),weightLbs=range[2]+(heightInches-range[0])*4+roll(21)-10;const month=1+roll(12),day=1+roll(28),birthYear=year-p.age-(month>10||month===10&&day>1?1:0);const debutYear=rookie?year:year-Math.max(0,p.age-(19+roll(3)));const pick=1+roll(60);return internationalBio(p,{heightInches,weightLbs,birthdate:String(birthYear).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'),hometown:['Georgia, USA','Texas, USA','California, USA','New York, USA','Florida, USA','Illinois, USA','North Carolina, USA','Ohio, USA','Michigan, USA','Louisiana, USA'][roll(10)],college:['Georgia','Georgia Tech','Duke','North Carolina','Kentucky','UCLA','Kansas','Michigan State','Arizona','Connecticut','Memphis','Texas'][roll(12)],debutYear,draftYear:debutYear,draftRound:pick<=30?1:2,draftPick:pick,draftTeam:teams[roll(teams.length)].abbr})}
function readPlayerBio(p,year,teams,bad){if(p.bio===undefined)return generatePlayerBio(p,year,teams);const b=p.bio,int=(n,l,h)=>Number.isInteger(n)&&n>=l&&n<=h,str=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;if(!b||!int(b.heightInches,48,100)||!int(b.weightLbs,80,500)||!str(b.hometown,80)||!str(b.college,80)||!str(b.birthdate,10)||!/^\d{4}-\d{2}-\d{2}$/.test(b.birthdate)||!Number.isFinite(Date.parse(b.birthdate))||new Date(b.birthdate).toISOString().slice(0,10)!==b.birthdate||!int(b.debutYear,0,year)||!int(b.draftYear,0,year)||!int(b.draftRound,1,5)||!int(b.draftPick,1,180)||!str(b.draftTeam,5))bad('invalid player biography.');return Object.fromEntries(['heightInches','weightLbs','birthdate','hometown','college','debutYear','draftYear','draftRound','draftPick','draftTeam'].map(k=>[k,b[k]]))}
function playerBioFacts(p){const b=p.bio||(p.bio=generatePlayerBio(p,state.year,state.teams)),experience=Math.max(0,state.year-b.debutYear),birth=new Date(b.birthdate+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});const rows=[['Height',Math.floor(b.heightInches/12)+'′ '+b.heightInches%12+'″'],['Weight',b.weightLbs+' lbs'],['Age',p.age],['Birthdate',birth],['Hometown',b.hometown],['Draft',p.international?.pathway==='professional'?'Undrafted · International free agent':`${b.draftYear}. R${b.draftRound} Pick ${b.draftPick}: ${b.draftTeam}`],['College',b.college],['Experience',experience===0?'Rookie':experience+' season'+(experience===1?'':'s')]];return `<dl class="pp-facts pp-biography">${rows.map(([label,value])=>`<div><dt${label==='Age'?' title="Age at the start of the season (October 1)"':''}>${label}</dt><dd>${label==='Hometown'?playerHometownFlag(p):''}${escapeHTML(String(value))}</dd></div>`).join('')}</dl>`}

function playerHometownFlag(p){
 const hometown=(p.bio?.hometown||'').split(',').at(-1).trim().toLowerCase();
 const countries={US:{name:'United States'},...INTERNATIONAL_COUNTRIES};
 const matched=Object.keys(countries).find(code=>countries[code].name.toLowerCase()===hometown||code.toLowerCase()===hometown);
 const code=matched||(['usa','u.s.a.','us','u.s.'].includes(hometown)?'US':p.international?.country);
 if(!code||!Object.hasOwn(countries,code))return '';
 const flag=String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0)));
 return `<span role="img" aria-label="${escapeHTML(countries[code].name)} flag" title="${escapeHTML(countries[code].name)}">${flag}</span> `;
}

// Authoritative age is the mutable season age (October 1), not today's birthday age.
// One rollover owns aging for every living league population. Historical snapshots
// and the completed draft's unused copies are deliberately not mutated.
function advanceSeasonPlayerAges(previousYear,newYear){
 const players=[...state.teams.flatMap(t=>t.roster),...state.free,...(state.draftRights||[]).map(r=>r.player)];
 for(const p of new Set(players)){
  if(!p.bio)p.bio=generatePlayerBio(p,previousYear,state.teams);
  p.age+=newYear-previousYear;
 }
}
