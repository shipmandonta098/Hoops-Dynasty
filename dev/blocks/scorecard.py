# Help-side blocking scorecard: candidate (blkcand) and same-seed control (blkctrl) vs the Phase 13 holdout.
# Usage (repo root): python3 dev/blocks/scorecard.py [controlRoot]
# Gate: pooled mean margin, 20+ share, OT share, pace and FTA/FGA inside the Phase 13 holdout per-seed
# [min, max]. Also reported against the control: FG%, inside-neutrality proxies (FG%, points per team)
# and blocks per team per game (targets NBA 4.5-5.2, WNBA ~4.0).
import json,sys,pathlib
sys.path.insert(0,'dev/phase13');import analyze
P=pathlib.Path('dev/phase13');ctrl=pathlib.Path(sys.argv[1])/'dev/phase13' if len(sys.argv)>1 else P
def extra(path):
    g=json.load(open(path))['games'];T=[t for x in g for t in x['totals']];s=lambda k:sum(t[k] for t in T)
    return {'pace':s('poss')/len(T),'ftaRate':s('fta')/s('fga'),'fgPct':100*s('fgm')/s('fga'),'ptsPerTeam':s('pts')/len(T),'blkPerTeam':s('blk')/len(T),'blkPctOpp2PA':100*s('blk')/(s('fga')-s('tpa'))}
def rows(folder,label,league):
    out=[]
    for p in sorted(folder.glob(f'{label}-{league}-*.json')):
        s=analyze.season(p);s.update(extra(p));out.append(s)
    return out
gate=['meanMargin','blow20Pct','otPct','pace','ftaRate'];keys=gate+['fgPct','ptsPerTeam','blkPerTeam','blkPctOpp2PA']
def pooled(r):
    n=sum(x['games'] for x in r);return {k:sum(x[k]*x['games'] for x in r)/n for k in keys}|{'seasons':len(r),'games':n}
report={}
for league in ['nba','wnba']:
    hold=rows(P,'holdout',league);rng={k:[min(x[k] for x in hold),max(x[k] for x in hold)] for k in keys}
    cand=rows(P,'blkcand',league);c=pooled(cand) if cand else None;ct=rows(ctrl,'blkctrl',league);k0=pooled(ct) if ct else None
    g={k:rng[k][0]<=c[k]<=rng[k][1] for k in gate} if c else None
    report[league]={'phase13HoldoutRange':rng,'candidate':c,'control':k0,'diff':{k:c[k]-k0[k] for k in keys} if c and k0 else None,'gate':g,'pass':all(g.values()) if g else None}
    print(league,json.dumps(report[league],indent=1))
pathlib.Path('dev/blocks/scorecard.json').write_text(json.dumps(report,indent=1)+'\n')
