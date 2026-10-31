/* League presets live in the careers IndexedDB (metadata store, key "setting:presets"). Until a verified move from
   the old localStorage key succeeds, presets are read from and written to localStorage as before. Errors name their
   cause; presets can be exported to and imported from a JSON file; first launch warns once when storage can be
   cleared by the browser. */
let presetCache=null,presetMove=null;
const PRESET_FILE_FORMAT='hoops-dynasty-presets',PRESET_LIMIT=30;
function presetStorageMessage(error,action='save presets'){
 const name=error?.name||'',text=String(error?.message||error||'');
 if(name==='QuotaExceededError'||name==='NS_ERROR_DOM_QUOTA_REACHED'||error?.code===22||/quota/i.test(text))return `Could not ${action}: browser storage is full. Free up space (or delete old careers), then try again. Export presets to keep a backup.`;
 if(name==='SecurityError'||error?.storageUnavailable||/insecure|access is denied/i.test(text))return `Could not ${action}: your browser is blocking site storage (private browsing or cookie blocking). Allow site data for this page, or export presets to keep them.`;
 return `Could not ${action}: ${text||'unknown error'}`;
}
function presetLocalStorage(){const store=globalThis.localStorage;if(!store){const e=Error('Site storage is unavailable.');e.storageUnavailable=true;throw e}return store}
function readLocalPresets(){const value=JSON.parse(presetLocalStorage().getItem(PRESET_KEY)||'[]');if(!Array.isArray(value))throw Error('Preset list is not a list.');return value}
function presetStoreActive(){return presetCache!==null&&typeof careerStore?.putSetting==='function'}
function readPresets(){
 if(presetStoreActive()){presetError='';return copy(presetCache)}
 try{const value=readLocalPresets();presetError='';return value}catch(error){console.error('Presets could not be read',error);presetError=error?.name==='SecurityError'||error?.storageUnavailable?presetStorageMessage(error,'read presets'):'Your preset list could not be read. No presets have been changed.';return []}
}
// Resolves true when saved. Failures show the real cause and leave the stored list unchanged.
async function writePresets(presets){
 try{
  if(presetMove)await presetMove;
  if(presetStoreActive()){await careerStore.putSetting('presets',presets);presetCache=copy(presets)}
  else presetLocalStorage().setItem(PRESET_KEY,JSON.stringify(presets));
  return true;
 }catch(error){console.error('Presets could not be saved',error);toast(presetStorageMessage(error));return false}
}
// One-time move into IndexedDB. The old key is read until the copy is stored and read back; then it is removed.
async function movePresetsToDatabase(store=careerStore){
 if(!store?.getSetting||!store?.putSetting)return false;
 const saved=await store.getSetting('presets');if(Array.isArray(saved)){presetCache=saved;return true}
 let local;try{local=readLocalPresets()}catch(error){console.error('Old presets could not be read; they stay in place',error);return false}
 await store.putSetting('presets',local);const check=await store.getSetting('presets');
 if(JSON.stringify(check)!==JSON.stringify(local))throw Error('Preset move could not be verified. Presets stay in browser storage.');
 presetCache=check;try{presetLocalStorage().removeItem(PRESET_KEY)}catch{}return true;
}
function startPresetMove(){presetMove=movePresetsToDatabase().catch(error=>{console.error('Presets were not moved',error);return false}).finally(()=>{presetMove=null});return presetMove}
// Export / import.
function presetExportPayload(list=readPresets()){return {format:PRESET_FILE_FORMAT,version:1,exportedAt:new Date().toISOString(),presets:list}}
function exportPresets(){const list=readPresets();if(presetError)return toast(presetError);if(!list.length)return toast('No presets to export yet.');
 const blob=new Blob([JSON.stringify(presetExportPayload(list),null,1)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hoops-dynasty-presets-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Exported '+list.length+' preset'+(list.length===1?'':'s')+'.')}
// Merges presets from a file. Same id replaces; a name clash gets " (imported)". Returns {added,replaced}.
function mergeImportedPresets(list,text){
 let file;try{file=JSON.parse(text)}catch{throw Error('That file is not valid JSON.')}
 const rows=Array.isArray(file)?file:file?.format===PRESET_FILE_FORMAT&&Array.isArray(file.presets)?file.presets:null;if(!rows)throw Error('That file is not a Hoops Dynasty preset export.');
 const out=copy(list);let added=0,replaced=0;
 for(const p of rows){
  if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>60||!['all','structure','settings'].includes(p.scope)||!p.data||typeof p.data!=='object'||Array.isArray(p.data))throw Error('A preset in that file is damaged'+(typeof p?.name==='string'?': '+p.name.slice(0,60):'')+'. Nothing was imported.');
  const row={id:typeof p.id==='string'&&p.id?p.id:newStructureId('preset'),name:p.name.trim(),scope:p.scope,updatedAt:Number.isNaN(Date.parse(p.updatedAt))?new Date().toISOString():p.updatedAt,data:copy(p.data)},same=out.findIndex(x=>x.id===row.id);
  if(same>=0){out[same]=row;replaced++;continue}
  const base=row.name.slice(0,44);for(let n=1;out.some(x=>x.name.toLowerCase()===row.name.toLowerCase());n++)row.name=base+' (imported'+(n>1?' '+n:'')+')';out.push(row);added++;
 }
 if(out.length>PRESET_LIMIT)throw Error(`Importing would make ${out.length} presets; keep at most ${PRESET_LIMIT}. Delete some first.`);
 return {list:out,added,replaced};
}
async function importPresetFile(file){
 try{if(!file)return;if(file.size>5e6)throw Error('That file is too large for a preset export.');const list=readPresets();if(presetError)throw Error(presetError);const result=mergeImportedPresets(list,await file.text());
  if(!await writePresets(result.list))return false;openPresets(false);toast(`Imported ${result.added} preset${result.added===1?'':'s'}${result.replaced?`, updated ${result.replaced}`:''}.`);return true;
 }catch(error){console.error('Preset import failed',error);toast(error.message);return false}
}
// Rendered in the presets dialog (setup.js openPresets) under the create form.
function presetBackupMarkup(){return `<div class="actions preset-backup"><button type="button" onclick="exportPresets()">Export presets</button><button type="button" onclick="this.nextElementSibling.click()">Import presets</button><input type="file" accept="application/json,.json" hidden aria-label="Preset file to import" onchange="importPresetFile(this.files[0]);this.value=''"><small>${presetStoreActive()?'Saved in this browser’s game database.':'Saved in this browser.'} Export a JSON backup to move presets to another device.</small></div>`}
// First launch: ask for persistent storage; warn once if the browser may still clear it.
function presetIsIOSSafari(){const n=globalThis.navigator||{},ua=n.userAgent||'';return (/iP(hone|ad|od)/.test(ua)||/Macintosh/.test(ua)&&n.maxTouchPoints>1)&&!n.standalone&&!globalThis.matchMedia?.('(display-mode: standalone)')?.matches}
function storagePersistenceWarningHTML(ios){return `<p>Your browser hasn’t granted this site persistent storage, so it may clear your careers and presets to free up space.</p>${ios?'<p><strong>On iPhone and iPad:</strong> Safari can erase site data after 7 days without a visit. Add Hoops Dynasty to your Home Screen (Share → Add to Home Screen) and open it from there to keep your saves.</p>':''}<p>Export careers and presets now and then to keep a backup.</p><div class="actions"><button class="primary" onclick="closeTitleModal()">Got it</button></div>`}
async function checkStoragePersistence(){
 const storage=globalThis.navigator?.storage;if(!storage?.persisted)return null;
 let persisted=await storage.persisted().catch(()=>false);if(!persisted&&storage.persist)persisted=await storage.persist().catch(()=>false);if(persisted)return true;
 const seen=await careerStore?.getSetting?.('persistenceWarningShown').catch(()=>null);if(seen)return false;
 let local=null;try{local=localStorage.getItem('hoops-dynasty-persistence-warning')}catch{}if(local)return false;
 titleModal('Keep your saves safe',storagePersistenceWarningHTML(presetIsIOSSafari()));
 await careerStore?.putSetting?.('persistenceWarningShown',true).catch(()=>{});try{localStorage.setItem('hoops-dynasty-persistence-warning','1')}catch{}
 return false;
}
const presetInitializeBefore=initializeCareers;
initializeCareers=async function(...args){const ok=await presetInitializeBefore(...args);if(ok){await startPresetMove();void checkStoragePersistence().catch(error=>console.error('Storage persistence check failed',error))}return ok};
