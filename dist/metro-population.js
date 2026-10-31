/* Metro population drives a team's market tier. team.population is stored in people; marketSize is
   always derived from it so existing code that reads marketSize keeps working.
   Loads before game.js: default teams are built at load time. */
const MARKET_TIER_CUTOFFS={medium:2.5e6,large:6e6}; // Small < 2.5M ≤ Medium < 6M ≤ Large
const METRO_POPULATION_RANGE={min:1e5,max:3e7};
// Old saves without a population get a mid-tier default, so their tier does not change.
const TIER_DEFAULT_POPULATION={Small:1.8e6,Medium:4e6,Large:9e6};
/* Metro populations for the default NBA/WNBA cities and the quick-add setup cities.
   Sources: U.S. Census Bureau, Vintage 2024 metropolitan statistical area estimates (July 1, 2024);
   Statistics Canada, census metropolitan area estimates (July 1, 2024; Toronto 7,106,379, Montréal
   4,615,154, Vancouver 3,108,941); INEGI 2020 Census, Zona Metropolitana del Valle de México (21,804,515).
   U.S. values are rounded to 10,000. Team cities map to their metro (Brooklyn → New York; Indiana →
   Indianapolis; Minnesota → Minneapolis–St. Paul; Salt Lake → Salt Lake City; San Francisco → San
   Francisco–Oakland). Franchise preset cities carry their own population in franchise-presets.js. */
const METRO_POPULATION={
 'Atlanta':6410000,'New York':19940000,'Los Angeles':12930000,'Chicago':9410000,'Miami':6460000,'Memphis':1340000,
 'Seattle':4150000,'New Orleans':960000,'Boston':5030000,'Brooklyn':19940000,'Philadelphia':6330000,'Toronto':7106379,
 'Cleveland':2160000,'Detroit':4400000,'Indiana':2170000,'Milwaukee':1560000,'Charlotte':2810000,'Orlando':2940000,
 'Washington':6390000,'Denver':3050000,'Minnesota':3750000,'Portland':2510000,'Salt Lake':1290000,'Dallas':8340000,
 'Houston':7800000,'San Antonio':2760000,'Phoenix':5190000,'Sacramento':2440000,'San Francisco':4650000,'San Diego':3300000,
 'Las Vegas':2400000,'Vancouver':3108941,'Montreal':4615154,'Kansas City':2250000,'Louisville':1370000,'Pittsburgh':2430000,
 'Baltimore':2860000,'Mexico City':21804515
};
function marketSizeForPopulation(people){return people>=MARKET_TIER_CUTOFFS.large?'Large':people>=MARKET_TIER_CUTOFFS.medium?'Medium':'Small'}
function validMetroPopulation(people){return Number.isFinite(people)&&people>=METRO_POPULATION_RANGE.min&&people<=METRO_POPULATION_RANGE.max}
function cityMetroPopulation(city){if(Object.hasOwn(METRO_POPULATION,city))return METRO_POPULATION[city];const preset=typeof FRANCHISE_PRESETS!=='undefined'?FRANCHISE_PRESETS.find(p=>p.city===city):null;return preset?preset.population:null}
/* Move: every city with a known metro population (default cities, quick-add cities and franchise presets)
   that no other team in the league uses. */
function moveCityOptions(currentCity,takenCities){const taken=new Set([...takenCities,currentCity].map(c=>String(c).trim().toLowerCase())),cities=new Set([...Object.keys(METRO_POPULATION),...(typeof FRANCHISE_PRESETS!=='undefined'?FRANCHISE_PRESETS.map(p=>p.city):[])]);return [...cities].filter(c=>!taken.has(c.toLowerCase())).sort((a,b)=>a.localeCompare(b)).map(city=>({city,population:cityMetroPopulation(city)}))}
function moveCityField(currentCity,takenCities){const options=moveCityOptions(currentCity,takenCities);return `<div class="move-city"><label>Move to another city<span class="move-city-row"><select name="moveCity" aria-label="City to move to"><option value="">Choose an available city</option>${options.map(o=>`<option value="${escapeHTML(o.city)}">${escapeHTML(o.city)} · ${metroPopulationLabel(o.population)} · ${marketSizeForPopulation(o.population)}</option>`).join('')}</select><button type="button" onclick="applyMoveCity(this.form)">Move</button></span><small>${options.length} available cities. Fills the city and metro population; review, then save.</small></label></div>`}
function applyMoveCity(form){const f=form?.elements,city=f?.moveCity?.value;if(!city)return toast('Choose a city to move to.');const people=cityMetroPopulation(city),old=f.city.value.trim();f.city.value=city;if(f.population){f.population.value=metroPopulationMillions(people);const tier=f.population.nextElementSibling;if(tier)tier.textContent=metroTierPreview(f.population.value)}if(f.arenaName&&(!f.arenaName.value.trim()||f.arenaName.value.trim()===old+' Arena'))f.arenaName.value=city+' Arena';if(f.arenaCity)f.arenaCity.value='';if(f.elevationFt)f.elevationFt.value='';if(f.lat)f.lat.value='';if(f.lon)f.lon.value='';toast('Moved to '+city+' in the form. Save to keep it.')}
// Millions with one decimal, as shown in the editors.
function metroPopulationMillions(people){return (Math.round(people/1e5)/10).toFixed(1)}
function metroPopulationLabel(people){return metroPopulationMillions(people)+'M'}
/* Read an editor value in millions (0.1–30, at most one decimal). An unchanged value keeps the stored
   population, so re-saving a form does not round a real estimate to 0.1M. */
function readMetroPopulationInput(value,current){
 const text=String(value??'').trim();
 if(!/^\d{1,2}(\.\d)?$/.test(text))throw Error('Metro population must be in millions with at most one decimal (0.1–30).');
 const millions=Number(text);if(millions<.1||millions>30)throw Error('Metro population must be between 0.1M and 30M.');
 if(validMetroPopulation(current)&&metroPopulationMillions(current)===millions.toFixed(1))return current;
 return Math.round(millions*1e6);
}
/* Population and recalculated tier from an editor value; throws a readable error for invalid input.
   After a Move, a value matching the new city's estimate keeps that exact estimate. */
function metroPopulationEdit(value,current,city){const text=String(value??'').trim(),known=city!==undefined?cityMetroPopulation(String(city).trim()):null,keep=validMetroPopulation(current)&&metroPopulationMillions(current)===text,population=readMetroPopulationInput(value,!keep&&known&&metroPopulationMillions(known)===text?known:current);return {population,marketSize:marketSizeForPopulation(population)}}
// Live tier label for an editor input; blank when the value is not valid.
function metroTierPreview(value){try{return marketSizeForPopulation(readMetroPopulationInput(value))+' market'}catch{return 'Enter 0.1–30'}}
function metroPopulationField(name,people){
 return `<label>Metro population (millions)<span class="metro-population"><input name="${name}" type="number" min="0.1" max="30" step="0.1" inputmode="decimal" required value="${metroPopulationMillions(people)}" oninput="this.nextElementSibling.textContent=metroTierPreview(this.value)"><output aria-live="polite">${marketSizeForPopulation(people)} market</output></span><small>Small &lt; ${MARKET_TIER_CUTOFFS.medium/1e6}M · Medium &lt; ${MARKET_TIER_CUTOFFS.large/1e6}M · Large ${MARKET_TIER_CUTOFFS.large/1e6}M+</small></label>`;
}
/* Population for a team definition: a valid stored value wins; otherwise the city's metro estimate for
   new teams, or the tier default when keepTier is set (old saves). marketSize is recalculated. */
function withMetroPopulation(team,{keepTier=false}={}){
 const tier=['Small','Medium','Large'].includes(team.marketSize)?team.marketSize:'Medium';
 const population=validMetroPopulation(team.population)?team.population:keepTier?TIER_DEFAULT_POPULATION[tier]:cityMetroPopulation(team.city)??TIER_DEFAULT_POPULATION[tier];
 return Object.assign(team,{population,marketSize:marketSizeForPopulation(population)});
}
