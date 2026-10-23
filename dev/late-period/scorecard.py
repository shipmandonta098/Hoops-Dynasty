# Late-period scorecard: candidate (lpcand) and same-seed control (lpctrl) against the Phase 13 holdout ranges.
# Usage (repo root): python3 dev/late-period/scorecard.py [controlRoot]
# Gate: pooled mean margin, 20+ point share, OT share, pace (possessions per team per game) and FTA/FGA must
# fall inside the Phase 13 holdout per-seed [min, max] range for each league.
import json,sys,pathlib,statistics as st
sys.path.insert(0,'dev/phase13');import analyze
P=pathlib.Path('dev/phase13');ctrl=pathlib.Path(sys.argv[1])/'dev/phase13' if len(sys.argv)>1 else None
def extra(path):
    g=json.load(open(path))['games'];poss=sum(t['poss'] for x in g for t in x['totals'])/(2*len(g))
    return {'pace':poss,'ftaRate':sum(t['fta'] for x in g for t in x['totals'])/sum(t['fga'] for x in g for t in x['totals']),'games':len(g)}
def rows(folder,label,league):
    out=[]
    for p in sorted(folder.glob(f'{label}-{league}-*.json')):
        s=analyze.season(p);s.update({k:v for k,v in extra(p).items() if k!='games'});out.append(s)
    return out
def pooled(r):
    n=sum(x['games'] for x in r);return {k:sum(x[k]*x['games'] for x in r)/n for k in ['meanMargin','blow20Pct','otPct','pace','ftaRate']}|{'seasons':len(r),'games':n}
keys=['meanMargin','blow20Pct','otPct','pace','ftaRate'];report={}
for league in ['nba','wnba']:
    hold=rows(P,'holdout',league);rng={k:[min(x[k] for x in hold),max(x[k] for x in hold)] for k in keys}
    cand=rows(P,'lpcand',league);c=pooled(cand) if cand else None
    ct=rows(ctrl,'lpctrl',league) if ctrl else [];k0=pooled(ct) if ct else None
    gate={k:rng[k][0]<=c[k]<=rng[k][1] for k in keys} if c else None
    report[league]={'phase13HoldoutRange':rng,'phase13HoldoutPooled':pooled(hold),'candidate':c,'candidateSeedRange':{k:[min(x[k] for x in cand),max(x[k] for x in cand)] for k in keys} if cand else None,'control':k0,'gate':gate,'pass':all(gate.values()) if gate else None}
    print(league,json.dumps(report[league],indent=1))
pathlib.Path('dev/late-period/scorecard.json').write_text(json.dumps(report,indent=1)+'\n')
