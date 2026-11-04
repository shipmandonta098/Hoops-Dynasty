// Commissioner player editor: invalid fields get a message that names the field and its range (the browser's own
// "Value must be less than or equal to 99" names neither). Browser behavior (section opens, mark clears) was checked
// in Chromium; this covers the message builder against the real editor markup.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:74,strictDOM:false});l.setRandomSeed(74);
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Commish';state=validateCareerData(buildSetupCareer(d));`);
const html=l.run('commissionerPlayerForm(state.teams[0].roster[0])');
// Every number field sits inside a label whose own text names it.
const fields=[...html.matchAll(/<label>([^<]+)<input name="([^"]+)" type="number" min="(\d+)" max="(\d+)"/g)];assert(fields.length>=50,'number fields found: '+fields.length);
for(const [,label] of fields)assert(label.trim().length>1,'label text for every number field');
l.context.fake=(label,min,max,validity)=>({name:'x',min,max,validity,closest:()=>({childNodes:[{nodeType:3,textContent:label},{nodeType:1,textContent:''}]})});
assert.equal(l.run(`commissionerFieldMessage(fake('Endurance','1','99',{rangeOverflow:true}))`),'Endurance: enter a whole number from 1 to 99.');
assert.equal(l.run(`commissionerFieldMessage(fake('Age','16','60',{rangeUnderflow:true}))`),'Age: enter a whole number from 16 to 60.');
assert.equal(l.run(`commissionerFieldMessage(fake('Speed','1','99',{stepMismatch:true}))`),'Speed: enter a whole number from 1 to 99.');
assert.equal(l.run(`commissionerFieldMessage(fake('Speed','1','99',{valueMissing:true}))`),'Speed is required.');
assert.equal(l.run(`commissionerFieldMessage(fake('Speed','1','99',{}))`),'');
// Randomize buttons sit outside their labels (a tap on a button inside a label can go to the label's input on iOS),
// each label still names its input, and touch screens get 16px editor fields (iOS zooms into anything smaller).
const labels=[...html.matchAll(/<label\b[^>]*>([^]*?)<\/label>/g)].map(m=>m[1]);assert(labels.length>50&&labels.every(x=>!/Randomize/.test(x)),'no randomize button inside a label');
for(const k of ['first','last','hometown','college'])assert.match(html,new RegExp(`<label for="commissioner-${k}">[^<]+</label><span class="commissioner-field"><input id="commissioner-${k}" name="${k}"`),k);
const css=require('fs').readFileSync('dist/style.css','utf8');assert.match(css,/@media \(pointer:coarse\)\{\.commissioner-player input[^}]*font-size:16px\}/);
console.log('Commissioner field messages: named field and range for',fields.length,'number fields passed.');
