const NEW_TEAM_PRESETS=[
 ['Las Vegas','Aces','LVA','Large','#C72C41','#171717','#E8C66A'],
 ['Vancouver','Orcas','VAN','Large','#087E8B','#102C45','#C5EAF1'],
 ['Montreal','Voyageurs','MTL','Large','#234E9B','#CC354C','#F2F0E9'],
 ['Kansas City','Monarchs','KCM','Medium','#653E9C','#D6AF54','#242035'],
 ['Louisville','Stallions','LOU','Small','#A3293D','#25252C','#E1C493'],
 ['Pittsburgh','Iron','PIT','Medium','#E2B739','#20252A','#D4D9DF'],
 ['Baltimore','Ravens','BAL','Medium','#603898','#171A22','#C4C7CD'],
 ['Mexico City','Jaguars','MEX','Large','#007D61','#D5AE49','#152C29']
];
function openAddSetupTeam(){captureSetup();editorModal('Add team',`<p>Choose a franchise preset, then edit its branding and division. ${setupDraft.teams.length} / 36 teams.</p><label>Division / conference<select id="new-team-division">${divisionOptions(setupDraft.divisions[0].id)}</select></label><p class="setup-help">Adding to the default league switches the schedule to home-and-away round robin. You can change the season format in League settings.</p><div class="team-picker">${NEW_TEAM_PRESETS.map(([city,name,abbr,market,...colors],i)=>{const added=setupDraft.teams.some(t=>t.key==='preset-'+abbr||t.abbr===abbr);return `<article class="setup-section"><h3>${city} ${name}</h3><p>${abbr} · ${market} market</p><div class="franchise-card-colors">${colors.map((hex,j)=>`<span><i style="background:${hex}"></i><small>${['Primary','Secondary','Tertiary'][j]}</small></span>`).join('')}</div><button type="button" class="primary" onclick="addSetupTeam(${i})" ${added||setupDraft.teams.length>=36?'disabled':''}>${added?'Already added':'Add team'}</button></article>`}).join('')}</div><h3 class="editor-subtitle">Franchise presets</h3><p class="setup-help">Original fictional franchises with their own logos, arenas and city data. Optional: none are added unless you choose them.</p><div class="team-picker">${FRANCHISE_PRESETS.map(p=>{const added=setupDraft.teams.some(t=>t.key==='preset-'+p.abbr||t.abbr===p.abbr);return presetCard(p,`<button type="button" class="primary" onclick="addSetupPreset('${p.abbr}')" ${added||setupDraft.teams.length>=36?'disabled':''}>${added?'Already added':'Add team'}</button>`)}).join('')}</div>`)}
function addSetupTeam(index){
 const preset=NEW_TEAM_PRESETS[index];if(!onSetup||!preset||setupDraft.teams.length>=36)return;
 const [city,name,abbr,marketSize,...palette]=preset;if(setupDraft.teams.some(t=>t.key==='preset-'+abbr||t.abbr===abbr))return;
 const divisionId=document.getElementById('new-team-division')?.value;if(!setupDraft.divisions.some(d=>d.id===divisionId))return toast('Choose a division.');
 const t={...copy(defaultTeams()[index]),key:'preset-'+abbr,city,name,abbr,marketSize,divisionId,arenaName:city+' Arena',colors:palette.map((hex,i)=>({hex,name:['Primary','Secondary','Tertiary'][i],role:['Primary','Secondary','Tertiary'][i]})),color:palette[0]};
 setupDraft.teams.push(t);syncAlignment(setupDraft);if(setupDraft.meetings===82&&!nbaAlignment(setupDraft.teams))setupDraft.meetings=2;
 setupQuery='';setupFilter='';closeTitleModal();renderSetup();toast(city+' '+name+' added. Use Edit team to customize.');
}
function addSetupPreset(abbr){
 const p=franchisePreset(abbr);if(!onSetup||!p||setupDraft.teams.length>=36)return;if(setupDraft.teams.some(t=>t.key==='preset-'+p.abbr||t.abbr===p.abbr))return;
 const divisionId=document.getElementById('new-team-division')?.value;if(!setupDraft.divisions.some(d=>d.id===divisionId))return toast('Choose a division.');
 setupDraft.teams.push({...presetTeamDefinition(p),divisionId});syncAlignment(setupDraft);if(setupDraft.meetings===82&&!nbaAlignment(setupDraft.teams))setupDraft.meetings=2;
 setupQuery='';setupFilter='';closeTitleModal();renderSetup();toast(p.city+' '+p.name+' added. Use Edit team to customize.');
}
