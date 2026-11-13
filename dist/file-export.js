/* File exports (career saves, presets). iOS browsers ignore a.download on blob URLs and name the file after the blob
   ID, so on touch devices that can share files the export goes through the share sheet (which keeps the file name and
   offers Save to Files). Desktop browsers download as before. Share needs a recent tap: when a slow export has lost
   it, a "Save export" button finishes the share from a fresh tap. Cancelling the share sheet is not an error. */
// Safe file-name part: ASCII letters and digits joined by hyphens, accents dropped, trimmed to max characters.
function exportSlug(text,max=40){return String(text??'').normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,max).replace(/-+$/,'')}
// Local calendar date, YYYY-MM-DD.
function exportDate(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
// Season label for a saved career without loading it: "2025-26" when the season crosses a year, otherwise "2026".
// Same rule as seasonCrossesYear: only the season dates decide.
function exportSeasonLabel(data){const rules=data.leagueSettings||{},crosses=(rules.seasonEnd||'04-19')<(rules.seasonStart||'10-28');return crosses?(data.year-1)+'-'+String(data.year).slice(-2):String(data.year)}
// HoopsDynasty_<Team>_<Season>_Day<day>_<YYYY-MM-DD>.json, e.g. HoopsDynasty_Minnesota-Lynx_2026_Day0_2026-11-02.json.
function careerExportFilename(record,now=new Date()){const data=record.data||{},summary=record.team||(()=>{try{return teamSummary(data)}catch{return null}})();
 const team=exportSlug(summary?[summary.city,summary.name].filter(Boolean).join(' '):record.name,40)||'Career';
 return ['HoopsDynasty',team,exportSlug(exportSeasonLabel(data),12)||'Season','Day'+(Number.isInteger(data.day)?data.day:0),exportDate(now)].join('_')+'.json'}
function presetExportFilename(count,now=new Date()){return 'HoopsDynasty_Presets_'+count+'_'+exportDate(now)+'.json'}
function exportPrefersShare(){const coarse=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches,ios=/iP(hone|ad|od)/.test(navigator.userAgent||'')||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;return coarse||ios}
function exportDownload(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function exportShare(file){try{await navigator.share({files:[file],title:file.name});return 'shared'}catch(error){if(error?.name==='AbortError')return 'cancelled';if(error?.name==='NotAllowedError')return 'needs-tap';throw error}}
let exportPendingFile=null;
// Shown when the share lost its tap: one button finishes the share.
function exportReadyPrompt(file){exportPendingFile=file;const d=document.getElementById('profile');d.className='export-ready';d.innerHTML=`<div class="panelhead"><h2>Export ready</h2><button onclick="document.getElementById('profile').close()" aria-label="Close">✕</button></div><p>${escapeHTML(file.name)}</p><div class="actions"><button class="primary" onclick="exportFinishShare()">Save export</button></div>`;d.showModal()}
async function exportFinishShare(){const file=exportPendingFile;if(!file)return;document.getElementById('profile').close();exportPendingFile=null;
 try{const result=await exportShare(file);if(result==='needs-tap'){exportDownload(file,file.name);toast('Export downloaded.')}}catch(error){exportDownload(file,file.name);toast('Export downloaded.')}}
// Delivers JSON (text or a Blob) as a named file. Returns 'shared', 'cancelled', 'pending' (waiting for the Save button)
// or 'downloaded'.
async function deliverExportFile(json,filename){
 const file=typeof File==='function'?new File([json],filename,{type:'application/json'}):null;
 if(file&&exportPrefersShare()&&typeof navigator.share==='function'&&navigator.canShare?.({files:[file]})){
  try{const result=await exportShare(file);if(result!=='needs-tap')return result;exportReadyPrompt(file);return 'pending'}catch(error){console.warn('Share failed; downloading instead',error)}}
 exportDownload(file||new Blob([json],{type:'application/json'}),filename);return 'downloaded'}
// Reads an export file as data. Small files parse directly; large ones are read line by line when they use the streamed
// backup layout (exportBackupBlob), because browsers cap a single string near 512 MB and a long career's backup can
// pass that.
const EXPORT_STREAM_MIN_BYTES=64*1024*1024;
async function readExportFile(file){
 if(file.size>EXPORT_STREAM_MIN_BYTES&&typeof file.stream==='function'&&typeof TextDecoderStream==='function'){try{return await parseBackupLines(file.stream().pipeThrough(new TextDecoderStream()))}catch(error){if(!error?.notStreamed)throw error}}
 return JSON.parse(await file.text())}
// Parses the streamed backup layout: a header line ending in ,"tables":{ then each table as "name":[ / one row per line /
// ] and a closing }}.
async function parseBackupLines(stream){
 const reader=stream.getReader(),tables={},marker=',"tables":{';let raw=null,store=null,closed=false,buffer='';
 const notStreamed=()=>{const e=Error('Not a streamed backup');e.notStreamed=true;return e};
 const line=text=>{if(!text)return;if(closed)throw SyntaxError('Unexpected data after the backup');
  if(!raw){if(!text.startsWith('{"format":"hoops-dynasty-database"')||!text.endsWith(marker))throw notStreamed();raw=JSON.parse(text.slice(0,-marker.length)+'}');raw.tables=tables;return}
  if(store===null){if(text==='}}'){closed=true;return}const m=/^"(archives|games|boxScores)":\[$/.exec(text);if(!m||tables[m[1]])throw SyntaxError('Unexpected line in backup');store=m[1];tables[store]=[];return}
  if(text===']'||text==='],'){store=null;return}
  tables[store].push(JSON.parse(text.endsWith(',')?text.slice(0,-1):text))};
 for(;;){const {value,done}=await reader.read();if(done)break;buffer+=value;let i;while((i=buffer.indexOf('\n'))>=0){line(buffer.slice(0,i));buffer=buffer.slice(i+1)}if(!raw&&buffer.length>64*1024*1024)throw notStreamed()}
 line(buffer);if(!closed)throw SyntaxError('The backup file is incomplete.');return raw}
