/* Fictional recruiting weights inspired by NBA opening-night pipelines, not a live ranking.
   Skills follow sampled training programs. Nationality never fixes personality or physique. */
const INTERNATIONAL_SHARE=.28;
const INTERNATIONAL_COUNTRIES={
 CA:{name:'Canada',region:'Canada',tier:1,weight:23,city:'Toronto'},
 FR:{name:'France',region:'Europe',tier:1,weight:19,city:'Lyon'},
 AU:{name:'Australia',region:'Oceania',tier:1,weight:13,city:'Melbourne'},
 RS:{name:'Serbia',region:'Europe',tier:1,weight:6,city:'Belgrade'},
 LT:{name:'Lithuania',region:'Europe',tier:1,weight:5,city:'Kaunas'},
 ES:{name:'Spain',region:'Europe',tier:1,weight:5,city:'Valencia'},
 DE:{name:'Germany',region:'Europe',tier:1,weight:7,city:'Berlin'},
 BR:{name:'Brazil',region:'South America',tier:2,weight:3,city:'São Paulo'},
 AR:{name:'Argentina',region:'South America',tier:2,weight:3,city:'Córdoba'},
 NG:{name:'Nigeria',region:'Africa',tier:2,weight:4,city:'Lagos'},
 SN:{name:'Senegal',region:'Africa',tier:2,weight:3,city:'Dakar'},
 JP:{name:'Japan',region:'Asia',tier:2,weight:2,city:'Osaka'},
 GR:{name:'Greece',region:'Europe',tier:2,weight:4,city:'Athens'},
 TR:{name:'Turkey',region:'Europe',tier:2,weight:4,city:'Istanbul'},
 SI:{name:'Slovenia',region:'Europe',tier:2,weight:4,city:'Ljubljana'},
 CN:{name:'China',region:'Asia',tier:3,weight:1,city:'Shanghai'},
 IN:{name:'India',region:'Asia',tier:3,weight:1,city:'New Delhi'},
 GB:{name:'United Kingdom',region:'Europe',tier:3,weight:1,city:'London'},
 NZ:{name:'New Zealand',region:'Oceania',tier:3,weight:1,city:'Auckland'},
 EG:{name:'Egypt',region:'Africa',tier:3,weight:1,city:'Cairo'}
};
const INTERNATIONAL_TRAINING={
 balanced:{name:'All-round academy',boost:{}},
 skill:{name:'Skill-development academy',boost:{oiq:3,tp:3,ft:3,pss:3}},
 defense:{name:'Defensive development program',boost:{stre:3,endu:3,per:3,diq:3}},
 interior:{name:'Interior development program',boost:{reb:4,rim:3,dnk:3,lay:2}},
 guard:{name:'Guard development program',boost:{drb:3,pss:4,stl:3,oiq:2}}
};
const INTERNATIONAL_PATHWAYS={college:'US college route',academy:'International pro academy',stash:'Draft-and-stash',professional:'Late-blooming professional'};
function internationalRng(id){let seed=(Math.imul(id+101,2654435761)^0x71b3a295)>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function internationalWeighted(rows,random=Math.random){let value=random()*rows.reduce((s,r)=>s+r[1],0);for(const [key,weight] of rows)if((value-=weight)<0)return key;return rows.at(-1)[0]}
function selectInternationalCountry(random=Math.random){return internationalWeighted(Object.entries(INTERNATIONAL_COUNTRIES).map(([code,c])=>[code,c.weight]),random)}
function internationalIdentity(p,context='initial'){
 const random=internationalRng(p.id),isInternational=context==='professional'||random()<INTERNATIONAL_SHARE;
 if(!isInternational)return assignFictionalName(p,'US');
 const country=selectInternationalCountry(random),c=INTERNATIONAL_COUNTRIES[country];
 const preferred={Europe:'skill',Oceania:'defense',Africa:'interior',Canada:'balanced','South America':'guard',Asia:'skill'}[c.region];
 const training=internationalWeighted(Object.keys(INTERNATIONAL_TRAINING).map(k=>[k,k===preferred?4:1]),random);
 p.international={country,training,pathway:context==='professional'?'professional':random()<.45?'college':'academy',adaptation:35+Math.floor(random()*66),adaptationGames:context==='initial'?30:0,entryYear:null,stashUntil:null,lastDevelopment:null,hiddenGrowth:0,nationalStats:[]};
 // Position selection follows an academy specialization, never ancestry or nationality.
 if(context!=='initial')p.pos=internationalWeighted(['PG','SG','SF','PF','C'].map(pos=>[pos,training==='interior'&&['PF','C'].includes(pos)||training==='guard'&&['PG','SG'].includes(pos)?3:1]),random);
 return assignFictionalName(p,country);
}
function internationalTrainingRatings(p,a){const training=INTERNATIONAL_TRAINING[p.international?.training];if(training)for(const [key,n] of Object.entries(training.boost))a[key]=ratingLimit(a[key]+n);return a}
function internationalDraftPathway(p){const x=p.international;if(!x)return;const c=INTERNATIONAL_COUNTRIES[x.country];if(c.region==='Europe'&&p.age>=18&&p.age<=19&&Math.random()<.4)x.pathway='stash';x.adaptationGames=0;}
function internationalBio(p,b){const x=p.international;if(!x)return b;const c=INTERNATIONAL_COUNTRIES[x.country];b.hometown=c.city+', '+c.name;if(x.pathway!=='college')b.college=c.name+' · Pro academy';if(x.pathway==='professional')b.college=c.name+' · Pro league';return b}
function internationalOnDraft(p){const x=p.international;if(x?.pathway==='stash'){x.stashUntil=state.year+rand(1,3);x.lastDevelopment=state.year;x.entryYear=null;delete p.contractThrough;delete p.wnbaContract;return true}return false}
function internationalStashReady(p){return !p.international?.stashUntil||state.year>=p.international.stashUntil}
function internationalPrepareSigning(p){const x=p.international;if(!x)return;if(x.stashUntil){if(!internationalStashReady(p))return;const growth=Math.max(0,Math.min(x.hiddenGrowth,p.pot-p.ovr));p.ovr+=growth;developAttributes(p,growth);x.hiddenGrowth=0;x.stashUntil=null;p.salary=rookieContractSalary(p.bio.draftPick-1,p.bio.draftRound,Math.max(p.bio.draftRound,draftRoundCount()));p.contractThrough=state.year+rookieContractYears(p.bio.draftRound);p.bio.debutYear=state.year;}if(x.entryYear===null&&x.pathway==='professional')p.bio.debutYear=state.year;x.entryYear??=state.year;}
function internationalNewSeason(){
 for(const r of state.draftRights||[]){const p=r.player,x=p.international;if(!x?.stashUntil)continue;const last=x.lastDevelopment??state.year;for(let y=last;y<state.year;y++){if(y<x.stashUntil)x.hiddenGrowth=Math.min(p.pot-p.ovr,x.hiddenGrowth+(leagueRules().developmentRate>0?Math.max(0,Math.round(rand(1,3)*leagueRules().developmentRate)):0));}x.lastDevelopment=state.year;
 if(internationalStashReady(p)&&last<x.stashUntil)say(INTERNATIONAL_COUNTRIES[x.country].name+': '+p.name+' has completed the overseas commitment. Draft rights can now be signed.');
 }
 internationalSignCPURights();
}
function internationalSignCPURights(){if(wnbaEnabled())return wnbaCPURights();for(const r of [...(state.draftRights||[])]){const p=r.player,t=state.teams[r.team];if((!r.team&&!simulationAutopilot())||!p.international?.stashUntil||!internationalStashReady(p)||t.roster.length>=rosterMaximum())continue;const salary=rookieContractSalary(p.bio.draftPick-1,p.bio.draftRound,Math.max(p.bio.draftRound,draftRoundCount()));if(ownerPayroll(t)+salary>financeRosterLimit(t)+.001)continue;internationalPrepareSigning(p);p.tradeWait=15;t.roster.push(p);state.draftRights=state.draftRights.filter(x=>x!==r);say(t.city+' signs '+p.name+' after overseas development.')}}
function internationalAdaptationPenalty(p,key){const x=p.international;if(!x||x.adaptationGames>=30||!['oiq','diq','pss','fg','tp','per'].includes(key))return 0;return 4*(1-x.adaptation/100)*(1-x.adaptationGames/30)}
function internationalAfterGame(club,result){for(const p of club.roster)if(p.international&&result.box.some(r=>r.playerId===p.id&&r.mp>0)){p.international.adaptationGames=Math.min(30,p.international.adaptationGames+1);p.international.entryYear??=state.year;}}
function internationalOffseason(){
 // Called once inside the existing transactional free-agency opening.
 internationalTournament();
 const ids=new Set([...state.teams.flatMap(t=>t.roster),...state.free,...(state.draft?.prospects||[]),...(state.draftRights||[]).map(r=>r.player)].map(p=>p.id));
 const count=Math.min(6,Math.max(2,Math.round(state.teams.length/6)),2000-state.free.length);
 for(let i=0;i<count;i++){let id=7000000+(state.year-1900)*12+i;while(ids.has(id))id++;if(id>10000000)break;ids.add(id);const p=player(id,i,0,state.leagueGender||'male','professional');p.age=rand(24,27);p.ovr=Math.min(88,p.ovr+3);p.pot=Math.min(99,p.ovr+rand(0,4));p.attributes=generatedAttributes(p);p.tendencies=generatedTendencies(p,p.attributes);ensurePlayerArchetype(p,state.year,true);p.bio=generatePlayerBio(p,state.year,state.teams,true);p.salary=faDemand(p);state.free.push(p);say(p.name+' ('+INTERNATIONAL_COUNTRIES[p.international.country].name+') enters free agency after an overseas professional career.');}
}
function internationalTournament(){
 // Fictional four-year offseason cup. Club box scores and availability are untouched.
 if(state.year%4!==2)return;let selected=0;
 const groups=new Map();for(const t of state.teams)for(const p of t.roster){if(!p.international||injuryDays(p)>0||p.international.nationalStats.some(s=>s.year===state.year))continue;const key=p.international.country+':'+p.gender;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)}
 for(const pool of groups.values())for(const p of pool.sort((a,b)=>b.ovr-a.ovr).slice(0,12)){if(p.ovr<65)continue;const games=rand(3,6);const stat={year:state.year,games,pts:0,reb:0,ast:0};for(let i=0;i<games;i++){stat.pts+=Math.max(0,Math.round((p.ovr-45)*.5+rand(-6,8)));stat.reb+=rand(1,['PF','C'].includes(p.pos)?12:6);stat.ast+=rand(0,p.attributes.pss>75?9:4);}p.international.nationalStats.push(stat);p.international.nationalStats=p.international.nationalStats.slice(-20);selected++;}
 if(selected)say('International Cup: '+selected+' players represented their national teams this offseason and returned before club play. Tournament statistics are available in player profiles.');
}
function internationalPlayerInfo(p){const x=p.international;if(!x)return '';const c=INTERNATIONAL_COUNTRIES[x.country],pending=x.stashUntil?`<p>Overseas commitment: ${x.stashUntil} · ${internationalStashReady(p)?'Available to sign':'Not yet available'}. Development is revealed when signed.</p>`:'';return `<section class="pp-card"><h3>INTERNATIONAL BACKGROUND</h3><p>${escapeHTML(c.name)} · ${INTERNATIONAL_PATHWAYS[x.pathway]}</p><p>${INTERNATIONAL_TRAINING[x.training].name}</p><p>Adaptation: ${x.adaptation}/100 · ${x.adaptationGames>=30?'Settled in':x.adaptationGames+'/30 league appearances toward settling in'}</p>${pending}${x.nationalStats.length?'<h4>NATIONAL TEAM · INTERNATIONAL CUP</h4><div class="tablewrap"><table><thead><tr><th>Year</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th></tr></thead><tbody>'+[...x.nationalStats].reverse().map(s=>`<tr><td>${s.year}</td><td>${s.games}</td><td>${(s.pts/s.games).toFixed(1)}</td><td>${(s.reb/s.games).toFixed(1)}</td><td>${(s.ast/s.games).toFixed(1)}</td></tr>`).join('')+'</tbody></table></div><p class="muted">Offseason national-team stats are separate from club statistics.</p>':''}</section>`}
function internationalDraftRightsRow(r){const p=r.player,x=p.international;if(!x?.stashUntil)return `<p>${escapeHTML(p.name)} · Unsigned rights <button onclick="signDraftRights(${p.id})">Sign rookie</button></p>`;return `<p>${escapeHTML(p.name)} · ${escapeHTML(INTERNATIONAL_COUNTRIES[x.country].name)} · ${internationalStashReady(p)?'Ready to join':'Overseas until '+x.stashUntil} <button onclick="signDraftRights(${p.id})" ${internationalStashReady(p)?'':'disabled'}>Sign rookie</button></p>`}
function readInternationalPlayer(raw,bad,year){if(raw===undefined)return undefined;const int=(v,l,h)=>Number.isInteger(v)&&v>=l&&v<=h;if(!raw||!Object.hasOwn(INTERNATIONAL_COUNTRIES,raw.country)||!Object.hasOwn(INTERNATIONAL_TRAINING,raw.training)||!Object.hasOwn(INTERNATIONAL_PATHWAYS,raw.pathway)||!int(raw.adaptation,0,100)||!int(raw.adaptationGames,0,30)||raw.entryYear!==null&&!int(raw.entryYear,1900,year)||raw.stashUntil!==null&&!int(raw.stashUntil,1900,10003)||raw.lastDevelopment!==null&&!int(raw.lastDevelopment,1900,year)||!int(raw.hiddenGrowth,0,99)||!Array.isArray(raw.nationalStats)||raw.nationalStats.length>20)bad('invalid international player');if(raw.stashUntil!==null&&(raw.pathway!=='stash'||raw.lastDevelopment===null||raw.entryYear!==null))bad('invalid overseas commitment');const years=new Set(),nationalStats=raw.nationalStats.map(s=>{if(!s||!int(s.year,1900,year)||years.has(s.year)||!int(s.games,1,12)||!int(s.pts,0,1200)||!int(s.reb,0,600)||!int(s.ast,0,600))bad('invalid national-team statistics');years.add(s.year);return {year:s.year,games:s.games,pts:s.pts,reb:s.reb,ast:s.ast}});return {country:raw.country,training:raw.training,pathway:raw.pathway,adaptation:raw.adaptation,adaptationGames:raw.adaptationGames,entryYear:raw.entryYear,stashUntil:raw.stashUntil,lastDevelopment:raw.lastDevelopment,hiddenGrowth:raw.hiddenGrowth,nationalStats}}

// Country metadata shares the naming registry; no American fallback for unknown countries.
for(const [code,d] of Object.entries(PLAYER_NAME_DATA)){if(code==='US')continue;INTERNATIONAL_COUNTRIES[code]??={name:d.name,city:d.city,region:d.region,tier:3,weight:1};}
