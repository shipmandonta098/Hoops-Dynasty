const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
const source=fs.readFileSync('dist/dashboard.js','utf8'),nav=source.match(/const nav=(\[.*?\]);document/)[1];
const pages=vm.runInContext(nav,context).map(x=>x[0]);pages.push('GM Office','GM Inbox','Attendance rankings','Power rankings');
vm.runInContext("state=validateCareerData(fresh(defaultTeams().slice(0,6),2));ownerCanManage=()=>true;notice='';",context);
const saved=vm.runInContext('JSON.stringify(state)',context),outputs={};
for(const page of pages){vm.runInContext('state='+saved+';view='+JSON.stringify(page),context);seed=2348;outputs[page]=vm.runInContext('careerContent()',context);vm.runInContext('renderCareerShell()',context);assert(element.innerHTML.includes('Franchise navigation'));assert(element.innerHTML.includes('onclick="go(\''+page+'\')"')||!pages.slice(0,23).includes(page));console.log('Rendered '+page);}

for(const page of pages){
 const html=outputs[page];assert.equal((html.match(/data-page-header=/g)||[]).length,1,page);
 assert(html.includes('data-page-header="'+page+'"'));
 vm.runInContext('render=renderCareerShell;go('+JSON.stringify(page)+')',context);
 assert.equal(vm.runInContext('view',context),page);
 assert.equal((element.innerHTML.match(/data-page-header=/g)||[]).length,1,page);
}
const assets=vm.runInContext('Object.values(PAGE_HEADERS).map(c=>c.image)',context);
assert.equal(assets.length,pages.length);
for(const page of pages)assert(!outputs[page].includes('--page-header-image:none'),page+' has no background artwork');
for(const asset of assets)assert(fs.existsSync('dist/'+asset),'Missing banner asset '+asset);
vm.runInContext(`assert(pageHeaderFor('Settings').includes('page-header--minimal'));assert(pageHeaderFor('Draft').includes('draft-year'));assert(pageHeaderFor('Playoffs').includes('ONE<br>TEAM.<br>ONE<br>CHAMPION.'));assert(pageHeader({title:'<bad>',eyebrow:'A&B',subtitle:'Safe',image:'https://example.com/image.png'}).includes('&lt;BAD&gt;'));assert(!pageHeader({title:'Test',eyebrow:'Test',subtitle:'Test',image:'https://example.com/image.png'}).includes('https://'));`,context);
console.log('PASS: all 23 sidebar routes and 4 secondary pages, one shared banner each, navigation, original Draft/Playoffs details, safe text, local artwork on every page and compact settings header.');

