// Rasterize dist/preset-logos/*.svg into the 4-column primary atlas (rows grow with the preset count) and 36px-class secondary PNGs.
// Usage (repo root): node dev/franchise-presets/render-logos.cjs [preview.png]
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
// Order must match FRANCHISE_PRESETS (new presets are appended so saved logo indices stay valid).
const ORDER=['ANA','BUF','CGY','CIN','GBY','NSH','NWK','OTT','SJO','STL','TPA','WPG','OKC'],CELL=512,SECONDARY=512,ROWS=Math.ceil(ORDER.length/4);
(async()=>{
 const browser=await chromium.launch({executablePath:fs.existsSync('/opt/pw-browsers/chromium')?undefined:undefined}).catch(()=>chromium.launch());
 const page=await browser.newPage({viewport:{width:CELL*4,height:CELL*ROWS},deviceScaleFactor:1});
 const svg=name=>fs.readFileSync(path.join('dist/preset-logos',name+'.svg'),'utf8');
 // Primary atlas: each cell keeps ~7% padding, matching the existing atlases.
 await page.setContent(`<html><body style="margin:0;background:transparent"><div style="display:grid;grid-template-columns:repeat(4,${CELL}px);grid-template-rows:repeat(${ROWS},${CELL}px)">${ORDER.map(a=>`<div style="padding:${CELL*.07}px;box-sizing:border-box">${svg(a).replace('width="512" height="512"','width="100%" height="100%"')}</div>`).join('')}</div></body></html>`);
 await page.screenshot({path:'dist/preset-logos.png',omitBackground:true,clip:{x:0,y:0,width:CELL*4,height:CELL*ROWS}});
 await page.setViewportSize({width:SECONDARY,height:SECONDARY});
 for(const a of ORDER){await page.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${SECONDARY}px;height:${SECONDARY}px;padding:${SECONDARY*.04}px;box-sizing:border-box">${svg(a+'-secondary').replace('width="512" height="512"','width="100%" height="100%"')}</div></body></html>`);
  await page.screenshot({path:`dist/secondary-logos/${a}.png`,omitBackground:true,clip:{x:0,y:0,width:SECONDARY,height:SECONDARY}});}
 if(process.argv[2]){// Review sheet: primary + secondary on light and dark backgrounds.
  await page.setViewportSize({width:ORDER.length*130,height:4*130});
  const cell=(a,bg)=>`<div style="width:130px;height:130px;background:${bg};display:flex;align-items:center;justify-content:center">${svg(a).replace('width="512" height="512"','width="112" height="112"')}</div>`;
  const cell2=(a,bg)=>`<div style="width:130px;height:130px;background:${bg};display:flex;align-items:center;justify-content:center">${svg(a+'-secondary').replace('width="512" height="512"','width="112" height="112"')}</div>`;
  await page.setContent(`<html><body style="margin:0"><div style="display:grid;grid-template-columns:repeat(${ORDER.length},130px)">${ORDER.map(a=>cell(a,'#F3F0E8')).join('')}${ORDER.map(a=>cell(a,'#20252D')).join('')}${ORDER.map(a=>cell2(a,'#F3F0E8')).join('')}${ORDER.map(a=>cell2(a,'#20252D')).join('')}</div></body></html>`);
  await page.screenshot({path:process.argv[2]});}
 await browser.close();console.log('Rendered preset-logos.png and',ORDER.length,'secondary logos');
})().catch(e=>{console.error(e);process.exitCode=1});
