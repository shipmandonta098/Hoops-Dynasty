/* File exports (career saves, presets). iOS browsers ignore a.download on blob URLs and name the file after the blob
   ID, so on touch devices that can share files the export goes through the share sheet (which keeps the file name and
   offers Save to Files). Desktop browsers download as before. Share needs a recent tap: when a slow export has lost
   it, a "Save export" button finishes the share from a fresh tap. Cancelling the share sheet is not an error. */
// Safe file-name part: ASCII letters and digits joined by hyphens, accents dropped, trimmed to max characters.
function exportSlug(text,max=40){return String(text??'').normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,max).replace(/-+$/,'')}
// Local calendar date, YYYY-MM-DD.
function exportDate(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
// Season label for a saved career without loading it: "2025-26" when the season crosses a year, otherwise "2026".
function exportSeasonLabel(data){const rules=data.leagueSettings||{},crosses=data.scheduleFormat!=='custom'||rules.seasonEnd<rules.seasonStart;return crosses?(data.year-1)+'-'+String(data.year).slice(-2):String(data.year)}
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
// Delivers JSON text as a named file. Returns 'shared', 'cancelled', 'pending' (waiting for the Save button) or 'downloaded'.
async function deliverExportFile(json,filename){
 const file=typeof File==='function'?new File([json],filename,{type:'application/json'}):null;
 if(file&&exportPrefersShare()&&typeof navigator.share==='function'&&navigator.canShare?.({files:[file]})){
  try{const result=await exportShare(file);if(result!=='needs-tap')return result;exportReadyPrompt(file);return 'pending'}catch(error){console.warn('Share failed; downloading instead',error)}}
 exportDownload(file||new Blob([json],{type:'application/json'}),filename);return 'downloaded'}
