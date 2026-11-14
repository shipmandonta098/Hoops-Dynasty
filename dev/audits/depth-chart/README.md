# Depth chart audit — main vs depth-chart branch

`audit.cjs` builds 10 leagues (5 NBA 2025, 30 teams; 5 WNBA 2024, 12 teams; seeds 9101–9105 / 9201–9205), reads every
team's chart exactly as games build it (`rotationFromClub`, all wrappers) on opening day and after 12 simulated days
(injuries), and records every in-game rotation check. `main.json` / `branch.json` hold the raw results.
Run: `node audit.cjs <repo dir> <out.json>` (with the usual `HD_TEST_NODE_MODULES` / `strip-v` setup).

## Charts (210 teams, opening day)

| | main | branch |
|---|---|---|
| Starters listed as backups | 1,611 | 16 |
| … where a bench player could play that spot | 1,585 | **0** |
| C primary backup is a guard | 36 | **0** |
| C primary backup can't play C though a bench C/PF-C exists | 127 | **0** |
| Bench players with minutes missing from the chart (of 1,706) | 1,303 | **0** (1 of 1,719 after 12 days) |
| Distinct players among 1,050 primary-backup slots | 654 | 1,049 |

The 16 remaining starter backups are spots no bench player can play (mostly 11–12-player WNBA rosters).

## In games (~107,000 rotation checks, 12 days per league)

| | main | branch |
|---|---|---|
| Guard playing C | 6.7% | 0.5% |
| No C/PF on the floor while a healthy one sat | 108 | 6 |

The 6 are bigs who were not eligible at that moment (foul trouble, workload caps); the unit test
(`test-depth-chart.cjs`) checks eligibility and finds 0.

## Minutes

The first version raised only the backup bonuses and overshot the minute plan (NBA bench 88.5 → 102.6 min per team-game
against a 76-minute plan). With the starter's own spot weighted to match (+60 starter, +45 primary, +30 reserve) the
bench is back to main's level: 87.6 vs 88.5 (plan 76; the gap to plan exists on main too).

## Phase 13 scorecard

Same seeds as the Post Face-Up run (NBA 5001–5003, WNBA 5101–5105), `dcbefore` = main, `dcafter` = this branch,
raw seasons in `dev/phase13/dcafter-*.json`. Regenerate: `python3 -I dev/audits/depth-chart/summary.py <main repo> <branch repo>`.
See `scorecard.md`.
