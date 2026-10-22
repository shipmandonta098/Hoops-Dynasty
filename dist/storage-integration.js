/* Async history hydration at navigation/rollover boundaries, never in render loops. */
const storageHistoryCache=new Map();
async function hydrateLeagueHistory(kinds){if(simulationHeadless()||!activeSaveId||!careerStore?.allArchive)return;const id=activeSaveId,year=state.year;await saveQueue;for(const kind of kinds){const cacheKey=id+':'+year+':'+kind;if(storageHistoryCache.has(cacheKey))continue;const records=await careerStore.allArchive(id,kind);if(activeSaveId!==id||state.year!==year)throw Error('League changed while history was loading');const current=kind==='hallPeople'?(state.hallOfFame?.people||[]):state[kind]||[],map=new Map(records.map((r,i)=>[hdArchiveId(kind,r,i),r]));current.forEach((r,i)=>{if(kind!=='hallPeople'||r.seasons.length||!map.has(r.key))map.set(hdArchiveId(kind,r,i),r)});if(kind==='hallPeople'){state.hallOfFame??={version:1,people:[],classes:[]};state.hallOfFame.people=[...map.values()]}else state[kind]=[...map.values()];storageHistoryCache.set(cacheKey,true);}}
const storageGoBefore=go;
go=function(v){if(v==='Player stats'&&!simulationHeadless()&&activeSaveId&&careerStore?.getArchiveYears){storageGoBefore(v);return refreshStorageStatsYears();}if(v==='Hall of Fame'&&!simulationHeadless()&&activeSaveId&&careerStore?.archivePage)return loadStorageHallPage().then(()=>storageGoBefore(v)).catch(e=>toast(e.message));const kinds={'Team stats':['teamStatsArchive'],'League stats':['statsArchive','playerPostseasonArchive'],'League history':['statsArchive','draftHistory'],'Draft':['draftHistory'],'Team management':['statsArchive','playerPostseasonArchive']}[v];if(!kinds||simulationHeadless()||!activeSaveId||!careerStore?.allArchive)return storageGoBefore(v);return hydrateLeagueHistory(kinds).then(()=>storageGoBefore(v)).catch(e=>toast('History could not load: '+e.message));};
const storageProfileBefore=openPlayerProfile;
openPlayerProfile=function(id){if(simulationHeadless()||!activeSaveId||!careerStore?.getArchive)return storageProfileBefore(id);const league=activeSaveId;return careerStore.getArchive(league,'hallPeople','p:'+id).then(row=>{if(activeSaveId!==league)return;const found=row?.value;if(found){state.hallOfFame??={version:1,people:[],classes:[]};const i=state.hallOfFame.people.findIndex(p=>p.key===found.key);if(i<0)state.hallOfFame.people.push(found);else if(state.hallOfFame.people[i].seasons.length<found.seasons.length)state.hallOfFame.people[i]=found}return storageProfileBefore(id)}).catch(e=>toast('Player history could not load: '+e.message));};
const storageNewSeasonBefore=newSeason;
newSeason=function(){if(simulationHeadless()||!activeSaveId||!careerStore?.allArchive)return storageNewSeasonBefore();return hydrateLeagueHistory(['statsArchive','playerPostseasonArchive','hallPeople','teamSeasonArchive','draftHistory']).then(()=>storageNewSeasonBefore()).catch(e=>toast('Season rollover stopped: '+e.message));};
const storageOpenCareerBefore=openSavedCareer;
openSavedCareer=async function(id){storageHistoryCache.clear();storageStatsYears=[];storageStatsPage=0;storageStatsLoad=null;storageHallPage=null;return storageOpenCareerBefore(id)};
async function storageDiagnostics({requestPersistent=false}={}){await requireCareerStore();const estimate=await careerStore.storageEstimate();let persistence={status:'not-requested'};if(requestPersistent)persistence=await careerStore.requestPersistence();else if(globalThis.navigator?.storage?.persisted)persistence={status:await navigator.storage.persisted()?'granted':'not-granted'};return {database:'hoops-dynasty-careers',version:HD_STORAGE_VERSION,estimate,persistence};}

let storageHallPage=null;
async function loadStorageHallPage(after=null){const leagueId=activeSaveId,filter=hallFilter;const page=await careerStore.archivePage(leagueId,'hallPeople',{after,limit:50,accept:r=>filter==='Inductees'?r.value.inducted!==null:filter==='Eligible'?r.value.inducted===null&&r.value.retired!==null:filter==='Franchise honors'?hallFranchiseHonors(r.value).length>0:r.value.inducted===null});if(activeSaveId===leagueId&&hallFilter===filter)storageHallPage={leagueId,filter,people:page.rows.map(r=>r.value),next:page.next};}
const storageHallViewBefore=hallOfFameView;
function hallPagePeople(all){return storageHallPage?.leagueId===activeSaveId&&storageHallPage.filter===hallFilter?storageHallPage.people:all;}
hallOfFameView=function(){return storageHallViewBefore()+(storageHallPage?.leagueId===activeSaveId&&storageHallPage.filter===hallFilter&&storageHallPage.next?'<button onclick="nextStorageHallPage()">Next 50 careers →</button>':'');};
async function nextStorageHallPage(){try{await loadStorageHallPage(storageHallPage?.next);render()}catch(e){toast(e.message)}}
const storageHallFilterBefore=hallSetFilter;
hallSetFilter=function(v){if(!careerStore?.archivePage||!activeSaveId)return storageHallFilterBefore(v);hallFilter=v;return loadStorageHallPage().then(()=>render()).catch(e=>toast(e.message));};
const storageFranchiseSeasonBefore=openFranchiseSeason;
openFranchiseSeason=async function(id,year){if(activeSaveId&&careerStore?.getArchive&&Number(year)!==state.year){try{const league=activeSaveId,t=state.teams.find(t=>t.id===Number(id)),row=await careerStore.getArchive(league,'teamSeasonArchive',hdKey([Number(year),t?.key]));if(activeSaveId!==league)return;if(row&&!state.teamSeasonArchive.some(s=>s.key===t.key&&s.year===Number(year)))state.teamSeasonArchive.push(row.value);}catch(e){toast('Season history could not load: '+e.message);return}}return storageFranchiseSeasonBefore(id,year)};

let storageStatsYears=[],storageStatsPage=0,storageStatsLoad=null;
// Current-season stats are already in memory; archive discovery must not gate navigation.
async function refreshStorageStatsYears(){
 const request={leagueId:activeSaveId,loading:true,error:null};storageStatsLoad=request;
 try{await loadStorageStatsYears(request)}catch(error){request.error=error.message||String(error)}
 finally{request.loading=false;if(storageStatsLoad===request&&activeSaveId===request.leagueId&&view==='Player stats'&&!onTitle&&!onLoadCareers&&!onSetup)render()}
}
const storageStatsViewBefore=leagueStatsView;
leagueStatsView=function(){
 const status=storageStatsLoad?.leagueId===activeSaveId?storageStatsLoad:null;
 const notice=status?.error?'<p class="note" role="alert">Archived season list could not load: '+escapeHTML(status.error)+' Current-season statistics remain available. <button onclick="refreshStorageStatsYears()">Retry history</button></p>':status?.loading?'<p class="note" role="status">Loading archived seasons…</p>':'';
 return notice+storageStatsViewBefore();
};
async function loadStorageStatsYears(request){const id=activeSaveId;const years=await Promise.all(['statsArchive','playerPostseasonArchive'].map(k=>careerStore.getArchiveYears(id,k)));if(activeSaveId===id&&(!request||storageStatsLoad===request))storageStatsYears=[...new Set(years.flat())];}
const storageStatsYearsBefore=playerStatsYears;
playerStatsYears=function(){return [...new Set([...storageStatsYearsBefore(),...storageStatsYears])].sort((a,b)=>b-a)};
const storageStatsChangeBefore=statsChange,storageStatsSortBefore=statsSort;
statsChange=function(key,value){storageStatsPage=0;if(key!=='season'||!careerStore?.archivePage||!activeSaveId||value==='current')return storageStatsChangeBefore(key,value);const id=activeSaveId;return (async()=>{if(value==='career')await hydrateLeagueHistory(['statsArchive','playerPostseasonArchive']);else for(const kind of ['statsArchive','playerPostseasonArchive']){let after=null,rows=[];do{const page=await careerStore.archivePage(id,kind,{seasonId:Number(value),limit:500,after});rows.push(...page.rows.map(r=>r.value));after=page.next;}while(after);if(activeSaveId!==id)return;state[kind]=[...(state[kind]||[]).filter(r=>r.year!==Number(value)),...rows];}if(activeSaveId===id)storageStatsChangeBefore(key,value)})().catch(e=>toast('Statistics could not load: '+e.message));};
statsSort=function(key){storageStatsPage=0;return storageStatsSortBefore(key)};
function storageStatsSlice(rows){storageStatsPage=Math.max(0,Math.min(storageStatsPage,Math.ceil(rows.length/100)-1));return rows.slice(storageStatsPage*100,(storageStatsPage+1)*100)}
function storageStatsPagination(count){return count>100?'<div class="actions"><button onclick="storageStatsPage--;render()" '+(!storageStatsPage?'disabled':'')+'>Previous</button><span>Page '+(storageStatsPage+1)+' of '+Math.ceil(count/100)+'</span><button onclick="storageStatsPage++;render()" '+((storageStatsPage+1)*100>=count?'disabled':'')+'>Next</button></div>':'';}
