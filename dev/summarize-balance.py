import json,glob,statistics,os
mean=lambda v:statistics.mean(v) if v else None
pct=lambda v:100*mean(v) if v else None

def summarize(gs):
 if not gs:return None
 margins=[abs(g['score'][0]-g['score'][1]) for g in gs];signed=[g['score'][0]-g['score'][1] for g in gs];teams=[t for g in gs for t in g['totals']];total=lambda k:sum(t[k] for t in teams);n=len(teams)
 out={'games':len(gs),'meanMargin':mean(margins),'medianMargin':statistics.median(margins),'maxMargin':max(margins),'marginBins':{f'{a}-{b}':pct([a<=m<=b for m in margins]) for a,b in [(1,5),(6,10),(11,19),(20,29),(30,39),(40,49),(50,500)]},'blowoutPercent':{str(k):pct([m>=k for m in margins]) for k in [20,30,40,50]},'teamPoints':total('pts')/n,'combinedPoints':total('pts')/len(gs),'possessions':total('poss')/n,'FG':total('fgm')/total('fga'),'3P':total('tpm')/total('tpa') if total('tpa') else None,'FT':total('ftm')/total('fta'),'eFG':(total('fgm')+.5*total('tpm'))/total('fga'),'TS':total('pts')/(2*(total('fga')+.44*total('fta'))),'offensiveRating':100*total('pts')/total('poss'),'overtimePercent':pct([g['ot'] for g in gs]),'homeWinPercent':pct([x>0 for x in signed]),'homeMargin':mean(signed),'spreadBias':mean([m+g['spread'] for m,g in zip(signed,gs)]),'spreadMAE':mean([abs(m+g['spread']) for m,g in zip(signed,gs)]),'FGbelow30Percent':pct([t['fgm']/t['fga']<.3 for t in teams]),'FGabove65Percent':pct([t['fgm']/t['fga']>.65 for t in teams]),'maxPlayerPoints':max(g['playerHigh'] for g in gs),'garbageSubstitutionsPerGame':mean([g['garbage'] for g in gs]),'boxPerTeam':{k:total(k)/n for k in ['fga','tpa','fta','orb','drb','tov','ast','pf','blk','stl','bench','benchMinutes']}}
 fourth=[g for g in gs if len(g['periodScores'])>=4];diff=lambda g,i:sum(p[0]-p[1] for p in g['periodScores'][:i]);out['quarter']={'meanHalfMargin':mean([abs(diff(g,2)) for g in fourth]),'meanEnteringFourthMargin':mean([abs(diff(g,3)) for g in fourth]),'meanFourthCombinedPoints':mean([sum(g['periodScores'][3]) for g in fourth]),'comeback10Plus':sum(abs(diff(g,3))>=10 and diff(g,3)*(g['score'][0]-g['score'][1])<0 for g in fourth),'trailing10PlusEnteringFourth':sum(abs(diff(g,3))>=10 for g in fourth),'leadChanges':mean([g['leadChanges'] for g in gs if g.get('leadChanges') is not None])}
 return out

report={}
for label in ['before','after']:
 report[label]={}
 for league in ['nba','wnba']:
  files=glob.glob(f'dev/balance-audit/{label}-{league}-*.json');runs=[json.load(open(f)) for f in sorted(files)];gs=[dict(g,seed=r['seed']) for r in runs for g in r['games'] if g['stage']=='Regular season'];pg=[g for r in runs for g in r['games'] if g['stage']!='Regular season'];item={'seasons':len(runs),'seeds':[r['seed'] for r in runs],'regular':summarize(gs),'playoffs':summarize(pg),'perSeason':{r['seed']:summarize([g for g in r['games'] if g['stage']=='Regular season']) for r in runs},'strengthGroups':{},'restGroups':{},'spreadGroups':{}}
  for low,high in [(0,2),(2,5),(5,10),(10,15),(15,100)]:
   subset=[g for g in gs if low<=abs(g['strengths'][0]-g['strengths'][1])<high];item['strengthGroups'][f'{low}-{high}']=summarize(subset)
   if subset:item['strengthGroups'][f'{low}-{high}']['strongerWinPercent']=pct([(g['strengths'][0]-g['strengths'][1])*(g['score'][0]-g['score'][1])>0 for g in subset if g['strengths'][0]!=g['strengths'][1]])
  for name,flags in [('neither',[False,False]),('awayOnly',[False,True]),('homeOnly',[True,False]),('both',[True,True])]:item['restGroups'][name]=summarize([g for g in gs if g['back']==flags])
  for low,high in [(0,2),(2,5),(5,10),(10,15),(15,100)]:
   subset=[g for g in gs if low<=abs(g['spread'])<high];item['spreadGroups'][f'{low}-{high}']={'games':len(subset),'favoredWinPercent':pct([(-g['spread'])*(g['score'][0]-g['score'][1])>0 for g in subset if g['spread']]),'averageFavoredMargin':mean([(1 if g['spread']<0 else -1)*(g['score'][0]-g['score'][1]) for g in subset if g['spread']]),'over40Percent':pct([abs(g['score'][0]-g['score'][1])>=40 for g in subset])}
  item['extremeGames']=sorted(gs,key=lambda g:abs(g['score'][0]-g['score'][1]),reverse=True)[:10];report[label][league]=item
for label in ['before','after']:
 path=f'dev/balance-audit/controlled-{label}.json'
 if os.path.exists(path):report['controlled-'+label]=[{ 'scenario':r['scenario'],'games':len(r['games']),'homeMargin':mean([g['score'][0]-g['score'][1] for g in r['games']]),'meanMargin':mean([abs(g['score'][0]-g['score'][1]) for g in r['games']]),'combinedPoints':mean([sum(g['score']) for g in r['games']]),'possessions':mean([g['poss'] for g in r['games']]),'FG':sum(g['fgm'] for g in r['games'])/sum(g['fga'] for g in r['games']),'endingEnergy':mean([g['energy'] for g in r['games']])} for r in json.load(open(path))]
json.dump(report,open('dev/balance-audit/summary.json','w'),indent=2)
for label in ['before','after']:
 for league,item in report[label].items():print(label,league,item['seasons'], {k:round(v,3) for k,v in (item['regular'] or {}).items() if isinstance(v,(int,float))})
for label in ['before','after']:print('controlled',label,report.get('controlled-'+label))
