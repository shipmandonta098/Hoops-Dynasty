/* Additive persistence and lifecycle integration, loaded after all existing wrappers. */
const namesDraftBefore=ensureDraft;
ensureDraft=function(...args){refreshNameRegistry(state);return namesDraftBefore(...args);};
const namesSeasonBefore=newSeason;
newSeason=function(...args){refreshNameRegistry(state);return namesSeasonBefore(...args);};
function readNameIdentity(x){if(x===undefined)return undefined;if(!x||x.version!==1||!PLAYER_NAME_DATA[x.country]||!['cultural','western'].includes(x.order)||x.provenance!=='generated'||['name','given','surname','background'].some(k=>typeof x[k]!=='string'||x[k].length>160))throw Error('Invalid saved naming identity.');return {...x};}
function readNameRegistry(r){
 if(r===undefined)return undefined;
 if(!r||r.version!==1||!Number.isInteger(r.randomState)||r.randomState<0||r.randomState>4294967295||!Array.isArray(r.used)||r.used.length>1000000||r.used.some(n=>typeof n!=='string'||n.length>200)||!['standard','high','maximum'].includes(r.settings?.diversity)||!['cultural','western'].includes(r.settings?.order)||typeof r.settings?.allowDuplicates!=='boolean')throw Error('Invalid saved name registry.');
 for(const k of ['givenUse','surnameUse'])if(!r[k]||typeof r[k]!=='object'||Array.isArray(r[k])||Object.entries(r[k]).some(([name,n])=>name.length>160||!Number.isInteger(n)||n<0||n>10000000))throw Error('Invalid name usage index.');
 return structuredClone(r);
}
const namesValidateBefore=validateCareerData;
validateCareerData=function(raw){const registry=readNameRegistry(raw.nameGeneration),s=namesValidateBefore(raw),original=new Map(familyPlayers(raw).map(p=>[p.id,p]));for(const p of familyPlayers(s)){const x=readNameIdentity(original.get(p.id)?.nameIdentity);if(x)p.nameIdentity=x;}
 for(const n of s.family?.people||[])if(n.nameIdentity)n.nameIdentity=readNameIdentity(n.nameIdentity);
 if(registry)s.nameGeneration=registry;refreshNameRegistry(s);return s;};
const namesFamilySyncBefore=familySync;
familySync=function(s=state){const f=namesFamilySyncBefore(s),players=new Map(familyPlayers(s).map(p=>[p.id,p]));for(const n of f.people){const p=players.get(n.playerId);if(p&&p.nameIdentity?.name===p.name&&n.origin!=='historical')n.nameIdentity={...p.nameIdentity};}return f;};
function familyGeneratedName(parent,gender,s,random){
 const identity=parent.nameIdentity?.name===parent.name?parent.nameIdentity:null;
 // Legacy names have no reliable component boundaries; never guess from their last word.
 let inherited=null;
 if(identity){const d=PLAYER_NAME_DATA[identity.country],v=identity.background==='local'?d:d.variants?.find(v=>v.key===identity.background)||d;
  if(v.patronymic||d.patronymic){if(parent.gender==='male')inherited=identity.given;}
  else {inherited=identity.surname;const at=v.surnames.indexOf(inherited),femaleAt=v.femaleSurnames?.indexOf(inherited)??-1;
   if(gender==='female'){if(at>=0&&v.femaleSurnames)inherited=v.femaleSurnames[at];else inherited=feminineSurname(inherited,v.gendered||d.gendered);}
   else if(femaleAt>=0)inherited=v.surnames[femaleAt];else if((v.gendered||d.gendered)==='PL')inherited=inherited.replace(/ska$/,'ski').replace(/cka$/,'cki').replace(/dzka$/,'dzki');else if(['KZ','UZ'].includes(v.gendered||d.gendered))inherited=inherited.replace(/(ov|ev)a$/,'$1');
  }
 }
 return generatePlayerName({country:identity?.country||familyPlayers(s).find(p=>p.id===parent.playerId)?.international?.country||'US',gender,background:identity?.background||null,inheritedSurname:inherited,s,random});
}
async function setNameGenerationSetting(key,value){if(!ownerCanManage())return;const previous=copy(nameRegistry(state).settings),r=nameRegistry(state);if(key==='diversity'&&['standard','high','maximum'].includes(value)||key==='order'&&['cultural','western'].includes(value))r.settings[key]=value;else if(key==='allowDuplicates')r.settings[key]=value==='true';else return;if(await save()===false){r.settings=previous;render();return;}render();toast('Naming preference saved for newly generated players.');}
function nameGenerationSettings(){const r=nameRegistry(state),select=(key,options)=>'<select onchange="setNameGenerationSetting(\''+key+'\',this.value)">'+options.map(([v,label])=>'<option value="'+v+'" '+(String(r.settings[key])===v?'selected':'')+'>'+label+'</option>').join('')+'</select>';return '<section class="panel"><div class="panelhead"><h2>Fictional player names</h2></div><div class="note"><label>Name diversity '+select('diversity',[['standard','Standard'],['high','High'],['maximum','Maximum']])+'</label> <label>Display order '+select('order',[['cultural','Culturally appropriate'],['western','Given name first']])+'</label> <label>Unrelated duplicate full names '+select('allowDuplicates',[['false','Disabled'],['true','Enabled']])+'</label><p class="muted">Applies to future fictional players only. Country-aware curated name pools use estimated selection weights, not census frequencies. Existing and historical names stay unchanged.</p></div></section>';};

const namesSettingsBefore=settingsView;settingsView=function(){return namesSettingsBefore()+nameGenerationSettings();};
