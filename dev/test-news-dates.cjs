const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={assert,say(){},play(){},render(){},escapeHTML:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),gmIcon:()=>'',state:{year:2026,leagueName:'Test league',teams:[],free:[],history:[],news:[],newsFeed:{nextId:7,items:[
{id:6,year:2026,day:31,category:'Results',headline:'Latest result',teams:[0]},
{id:5,year:2026,day:30,category:'Transactions',headline:'Trade update',teams:[1]},
{id:4,year:2025,day:31,category:'Results',headline:'Older result',teams:[0]},
{id:3,year:2026,day:0,category:'League',headline:'Setup update',teams:[]},
{id:2,year:2026,day:null,category:'League',headline:'Unknown day',teams:[]},
{id:1,year:null,day:null,category:'Franchise',headline:'Legacy update',teams:[]}
].map(n=>({...n,phase:'Regular season',detail:'',game:null}))}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/news-feed.js','utf8'),ctx);
vm.runInContext(`
const before=JSON.stringify(state.newsFeed),ids=()=>Array.from(newsFeedRows(),n=>n.id).join(',');
assert.equal(ids(),'6,5,3,2,4,1');
assert.ok(newsFeedView().includes('2026 season · Day 31'));
assert.ok(newsFeedView().includes('Day 0'));
newsFeedChange('season','2025');newsFeedChange('day','31');assert.equal(ids(),'4');
newsFeedUI.limit=90;newsFeedChange('season','2026');assert.equal(newsFeedUI.day,'all');assert.equal(newsFeedUI.limit,30);
newsFeedChange('day','31');assert.equal(ids(),'6');newsFeedChange('type','Transactions');assert.equal(ids(),'');assert.ok(newsFeedView().includes('No news matches'));
newsFeedChange('type','all');newsFeedChange('day','all');newsFeedChange('scope','team');assert.equal(ids(),'6');
newsFeedChange('scope','all');newsFeedChange('query','TRADE');assert.equal(ids(),'5');
newsFeedChange('query','');newsFeedChange('season','all');newsFeedChange('day','31');assert.equal(ids(),'6,4');
newsFeedChange('season','unknown');assert.equal(ids(),'1');assert.ok(newsFeedView().includes('Date unavailable'));
newsFeedChange('season','all');newsFeedChange('group','season');assert.equal((newsFeedView().match(/class="news-date-heading"/g)||[]).length,3);
newsFeedChange('group','none');assert.equal(ids(),'6,5,4,3,2,1');assert.ok(!newsFeedView().includes('news-date-heading'));
newsFeedChange('season','1997');assert.equal(ids(),'6,5,4,3,2,1');assert.equal(newsFeedUI.season,'all');
assert.equal(JSON.stringify(state.newsFeed),before);
const loaded=readNewsFeed(JSON.parse(before),message=>{throw Error(message)},2);assert.deepStrictEqual(loaded,JSON.parse(before));
newsFeedChange('group','day');newsFeedUI.limit=2;const limited=newsFeedView();assert.ok(limited.includes('Load more updates'));assert.ok(!limited.includes('Older result'));
`,ctx);
console.log('PASS: season/day filters, combined search/type/coverage, date groups, undated and day-zero messages, pagination, invalid selections, unchanged saved records and serialization.');
