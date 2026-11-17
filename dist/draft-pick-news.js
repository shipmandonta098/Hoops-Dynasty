/* Draft pick news. Picks 1–N (league setting draftNewsPicks, default 10) and every pick by the user's team get their own
   Draft item: full team name, "first overall" / "the No. N pick" / "Round 2, Pick 4 (34th overall)", the draft year, and
   a detail line (position, college or club and country, age, "via TEAM" for traded picks). The user's picks also go to
   the GM inbox. The other picks are grouped into one recap per round, posted when the round ends. A pre-draft board
   (neutral ranking of the class, taken before the first pick and saved on the draft) adds "slide" items for top-10
   prospects who fall 5+ spots and "steal" notes for later picks ranked far higher. The draft is named by the calendar
   year it is held in (state.year): the year a single-year season ends, and the year a cross-year season ends (2025–26
   season → 2026 Draft), never a two-year label. Old saves without a board skip slides and steals. */
if(typeof INBOX_TYPES!=='undefined'&&!INBOX_TYPES.includes('Draft'))INBOX_TYPES.push('Draft');
const DRAFT_SLIDE_RANK=10,DRAFT_SLIDE_SPOTS=5,DRAFT_STEAL_SPOTS=10;
function draftOrdinal(n){const t=n%100;return n+(t>=11&&t<=13?'th':['th','st','nd','rd'][n%10]||'th')}
// Neutral pre-draft board: talent now and later, no team need (draftScore without the need term).
function draftBoardScore(p){return p.ovr*.55+p.pot*.45}
function draftBoardTake(d){if(!d.newsBoard)d.newsBoard=[...d.prospects].sort((a,b)=>draftBoardScore(b)-draftBoardScore(a)||a.id-b.id).map(p=>p.id)}
function draftBoardRank(d,id){const at=d.newsBoard?d.newsBoard.indexOf(id):-1;return at<0?null:at+1}
function draftPickSlot(number,count=state.teams.length){return {round:Math.floor((number-1)/count)+1,slot:(number-1)%count+1}}
// "first overall", "the No. 7 pick", "Round 2, Pick 4 (34th overall)".
function draftPickPhrase(number,count=state.teams.length){const {round,slot}=draftPickSlot(number,count);return round>1?'Round '+round+', Pick '+slot+' ('+draftOrdinal(number)+' overall)':number===1?'first overall':'the No. '+number+' pick'}
function draftPickShort(number,count=state.teams.length){const {round,slot}=draftPickSlot(number,count);return round>1?'Round '+round+', Pick '+slot+' ('+draftOrdinal(number)+' overall)':'No. '+number}
function draftPickOrigin(d,number){return draftBaseOrder(d)[number-1]}
function draftPlayerFor(pick){const club=state.teams[pick.team];return club.roster.find(p=>p.id===pick.id)||(state.draftRights||[]).find(r=>r.player.id===pick.id)?.player||null}
function draftPlayerOrigin(p){const school=p?.bio?.college||'',country=p?.international?(typeof INTERNATIONAL_COUNTRIES!=='undefined'&&INTERNATIONAL_COUNTRIES[p.international.country]?.name)||'':'';return country&&school?(school.includes(country)?school:school+' ('+country+')'):school||country||(p?.bio?.hometown||'').split(', ').pop()}
function draftClubName(id){const t=state.teams[id];return t.city+' '+t.name}
function draftPickDetail(d,pick,p){const origin=draftPickOrigin(d,pick.number);return [pick.pos,draftPlayerOrigin(p),p?'Age '+p.age:'',origin!==pick.team?'via '+state.teams[origin].abbr:''].filter(Boolean).join(' · ')}
function draftNewsPost(item){addNewsItem({category:'Draft',...item});state.news.unshift(item.headline);state.news=state.news.slice(0,30)}
function draftIndividualPick(d,pick){const you=controlledTeamId();return pick.number<=leagueRules().draftNewsPicks||(you>=0&&pick.team===you)}
// News for one pick: its own item (top picks and the user's), slide/steal notes, and the round recap when the round ends.
function draftPickNews(d,pick){const p=draftPlayerFor(pick),origin=draftPickOrigin(d,pick.number),year=d.year||state.year,count=state.teams.length,you=controlledTeamId(),teams=[...new Set([pick.team,origin])];
 if(draftIndividualPick(d,pick)){const phrase=draftPickPhrase(pick.number,count),detail=draftPickDetail(d,pick,p);
  draftNewsPost({headline:draftClubName(pick.team)+' select '+pick.name+(pick.number===1?' first overall':' with '+phrase)+' in the '+year+' Draft.',detail,teams});
  if(you>=0&&pick.team===you){const signed=state.teams[you].roster.some(x=>x.id===pick.id);addGMMessage('Draft','Scouting Department','Draft: we select '+pick.name+(pick.number===1?' first overall':' with '+draftPickPhrase(pick.number,count))+'.',pick.name+' — '+detail+'. '+(signed?'Signed to a rookie contract and added to the roster.':'Draft rights held (roster, payroll or an overseas commitment).'))}}
 const rank=draftBoardRank(d,pick.id),abbr=state.teams[pick.team].abbr;
 if(rank!==null&&rank<=DRAFT_SLIDE_RANK&&pick.number-rank>=DRAFT_SLIDE_SPOTS)draftNewsPost({headline:pick.name+' slides to '+draftPickShort(pick.number,count)+' after ranking No. '+rank+' on the pre-draft board.',detail:draftClubName(pick.team)+' take '+pick.name+' '+(pick.number-rank)+' spots past the pre-draft ranking.',teams});
 else if(rank!==null&&rank>DRAFT_SLIDE_RANK&&pick.number>leagueRules().draftNewsPicks&&pick.number-rank>=DRAFT_STEAL_SPOTS&&pick.number>=2*rank)draftNewsPost({headline:'Steal? '+abbr+' land '+pick.name+', No. '+rank+' on the pre-draft board, at '+draftPickShort(pick.number,count)+'.',detail:draftPickDetail(d,pick,p),teams});
 if(pick.number%count===0||pick.number===count*draftRoundCount(d))draftRoundRecap(d,draftPickSlot(pick.number,count).round)}
function draftRoundRecap(d,round){const count=state.teams.length,picks=d.picks.filter(x=>x.round===round&&!draftIndividualPick(d,x));if(!picks.length)return;
 const first=picks[0].number,last=picks.at(-1).number,entry=x=>{const origin=draftPickOrigin(d,x.number),{slot}=draftPickSlot(x.number,count);return (round>1?'Pick '+slot+' ('+draftOrdinal(x.number)+')':x.number+'.')+' '+state.teams[x.team].abbr+(origin!==x.team?' (via '+state.teams[origin].abbr+')':'')+' — '+x.name+', '+x.pos};
 draftNewsPost({headline:'Round '+round+' recap: '+(first===last?'pick '+first:'picks '+first+'–'+last)+'.',detail:picks.map(entry).join(' · '),teams:[...new Set(picks.map(x=>x.team))]})}
const draftPickNewsBefore=draftPickInternal;
draftPickInternal=function(id){const d=ensureDraft();if(!d.picks.length&&d.order.length)draftBoardTake(d);const count=d.picks.length,ok=draftPickNewsBefore(id);if(ok&&d.picks.length===count+1)draftPickNews(d,d.picks.at(-1));return ok};
// Saves: the pre-draft board is kept with the draft.
const draftBoardValidateBefore=validateCareerData;validateCareerData=function(raw){const data=draftBoardValidateBefore(raw),board=raw?.draft?.newsBoard;
 if(data.draft&&board!==undefined){if(!Array.isArray(board)||board.length>2000||new Set(board).size!==board.length||board.some(id=>!Number.isInteger(id)||id<0))throw Error('Invalid save: invalid draft board');data.draft.newsBoard=[...board]}return data};
