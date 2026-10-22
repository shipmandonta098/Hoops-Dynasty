// Browser check: preset logos and preset flows across the real UI (Chromium via Playwright).
// Usage (repo root): node dev/franchise-presets/ui-check.cjs <screenshot-dir>
// Serves dist/ on a local port. Builds a valid 30-team NBA career with Nashville (user team)
// and Calgary replacing ATL and DEN in their divisions, then visits logo-bearing views.
const fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=path.join('dist',decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/,'/index.html'));fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(b)})}).listen(0);
(async()=>{
 const port=server.address().port,browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!/city-photos\//.test(r.url()))missing.push(r.status()+' '+r.url())});
 const shot=async(name,selector)=>{if(selector)await page.locator(selector).first().scrollIntoViewIfNeeded().catch(()=>{});await page.waitForTimeout(400);await page.screenshot({path:path.join(out,name+'.png')})};
 // Count preset logos actually painted: the :before background must resolve to preset-logos.png.
 const painted=()=>page.evaluate(()=>[...document.querySelectorAll('.franchise-logo.logo-preset')].filter(e=>e.getBoundingClientRect().width>0&&getComputedStyle(e,'::before').backgroundImage.includes('preset-logos.png')).length);
 const secondary=()=>page.evaluate(()=>[...document.querySelectorAll('img.secondary-team-logo')].filter(i=>/\/(ANA|BUF|CGY|CIN|GBY|NSH|NWK|OTT|SJO|STL|TPA|WPG)\.png$/.test(i.src)).map(i=>({src:i.src.split('/').pop(),ok:i.complete&&i.naturalWidth>0})));
 const report={};
 await page.goto(`http://localhost:${port}/`);await page.waitForTimeout(1500);
 await page.getByText('NEW CAREER').first().click();await page.waitForTimeout(800);
 // Setup: Add team modal with the preset section.
 await page.getByRole('button',{name:/Add Team/i}).first().click();await page.waitForTimeout(600);
 report.addTeamModalPresetLogos=await painted();await shot('01-add-team-presets','.preset-card');
 await page.evaluate(()=>closeTitleModal());
 await page.evaluate(()=>{const swap=(abbr,from)=>{const i=setupDraft.teams.findIndex(t=>t.abbr===from),div=setupDraft.teams[i].divisionId;setupDraft.teams[i]={...presetTeamDefinition(franchisePreset(abbr)),divisionId:div}};swap('NSH','ATL');swap('CGY','DEN');setupDraft.selectedKey='preset-NSH';setupDraft.gmName='Preset Tester';renderSetup()});
 report.setupPickerPresetLogos=await painted();await shot('02-setup-team-picker','[data-select-team="0"]');
 await page.evaluate(()=>confirmNewCareer());await page.waitForTimeout(2500);
 await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close?.())});
 const go=async(v,name)=>{await page.evaluate(v=>{view=v;render();window.scrollTo(0,0)},v);await page.waitForTimeout(700);report[name]={presetLogos:await painted(),secondary:await secondary()};await shot(name)};
 await go('Overview','03-dashboard');await go('Standings','04-standings');await go('Schedule','05-schedule');
 await page.evaluate(()=>sim(4));await page.waitForTimeout(6000);
 await go('Overview','06-dashboard-after-games');await go('News feed','07-news-feed');await go('Trades','08-trades');await go('Free agency','09-free-agency');await go('Draft','10-draft');await go('Playoffs','11-playoffs');await go('Power rankings','12-power-rankings');
 // Box score / game summary for the user's first game.
 const idx=await page.evaluate(()=>state.history.findIndex(g=>g.a===0||g.b===0));
 if(idx>=0){await page.evaluate(i=>showResult(i),idx);await page.waitForTimeout(900);report['13-box-score']={presetLogos:await painted()};await shot('13-box-score');await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close?.()))}
 // Team editor with the relocation loader; load a preset and capture the filled form (not saved).
 await page.evaluate(()=>{view='Team management';managedTeamId=1;render();window.scrollTo(0,0)});await page.waitForTimeout(600);
 await page.selectOption('select[name="relocationPreset"]','STL');await page.getByRole('button',{name:'Load preset into form'}).click();await page.waitForTimeout(500);
 report['14-relocation-loader']={presetLogos:await painted(),city:await page.inputValue('input[name="city"]'),abbr:await page.inputValue('input[name="abbr"]'),arena:await page.inputValue('input[name="arenaName"]')};await shot('14-relocation-loader','.tm-relocate');
 // Expansion picker: the window only opens after the playoffs, so this preview forces expansionWindow() for rendering only.
 await page.evaluate(()=>{window.__ew=expansionWindow;expansionWindow=()=>true;view='Expansion';render();window.scrollTo(0,0)});await page.waitForTimeout(600);
 await page.locator('details.exp-presets summary').click();await page.waitForTimeout(300);report['15-expansion-picker']={presetLogos:await painted()};
 await page.locator('details.exp-presets button').first().click();await page.waitForTimeout(500);
 report['15-expansion-picker'].form=await page.evaluate(()=>{const f=document.getElementById('expansion-form').elements;return {preset:f.preset.value,city:f.city.value,abbr:f.abbr.value,arena:f.arenaName.value,capacity:f.capacity.value,primary:f.primary.value}});
 await shot('15-expansion-picker','#expansion-preset-preview');await page.evaluate(()=>{expansionWindow=window.__ew});
 // Dark theme check on standings.
 await page.evaluate(()=>{state.darkMode=true;view='Standings';render();window.scrollTo(0,0)});await page.waitForTimeout(600);report['16-standings-dark']={presetLogos:await painted()};await shot('16-standings-dark');
 report.pageErrors=errors;report.failedRequests=missing;
 fs.writeFileSync(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
