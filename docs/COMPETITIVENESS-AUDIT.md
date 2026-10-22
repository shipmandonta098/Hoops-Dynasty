# Hoops Dynasty: competitiveness investigation

The confirmed back-to-back penalty overlap has been corrected. Broader scoring and variance calibration remains unfinished; the results below retain those remaining deviations rather than treating the patch as a complete balance solution.

## Scope and reproducibility

Baseline source: `1070a72f4b97e2b5a09e563052e6194c1885ebc8`. Revised source changes only back-to-back fatigue routing and its explanatory UI. Seeds 101–110 generate independent fictional careers, not ten consecutive years of the same career. NBA: 30 teams, 82 games each, 2025 setting using the existing 2024–25 statistical reference. WNBA: 12 fictional teams, 40 games each, 2024 WNBA rules. These are full regular-season calendars, with daily systems, injuries, coaching, AI management, morale and rest enabled. They are not verified historical rosters or exact real-world calendars. Regular-season distributions exclude postseason games. No claim of a full ten-year offseason/career evolution audit is made.

Initial harness attempts stopped at All-Star interaction; excessive concurrent jobs also exhausted available memory (confirmed by the operating system OOM-kill counter). Incomplete/unretained attempts are excluded. The final runner uses the existing headless day boundary, validates all scheduled regular-season games were played, and writes the full regular-season dataset without postseason work. Each seed is counted once.

## Confirmed cause and targeted correction

The old back-to-back wrapper independently reduced physical/scoring/mental attributes, subtracted flat exertion points, cut initial stamina again, and increased in-game stamina consumption by 30%. It doubled several penalties whenever the club was away, without checking its previous venue. The existing workload/recovery system had already reduced energy. Maximum away penalties could reach 30% physical, 20% shooting, 10% mental, 40% starting energy, plus 6–10 flat exertion points on selected ratings. Lower defense as well as lower offense magnified the mismatch.

The correction retains calendar workload, recovery, conditioning, stamina-based effective attributes, substitutions, load management, altitude and injury handling. Extra back-to-back drain is now `min(0.12, 0.10 × previousMinutes / 36 × travel)`, where travel is 1.1 for a recorded venue change and 1 otherwise. No duplicate direct attribute or initial-energy deductions remain. The 12% maximum is an explicitly chosen simulation coefficient, not a medically verified threshold. Saved base ratings and existing completed results are not rewritten. The existing back-to-back injury multiplier remains unchanged.

## Controlled experiment

Identical rosters and coaching, paired seeds 50001–50100, full-length games, fresh state per game. The back-to-back fixture uses 32 minutes the previous day and stored energy 85. Other systems and gameplay RNG remain active. These are a particular controlled roster, not population estimates. Matching seeds do not guarantee identical later random events once a changed branch consumes RNG differently.

| Scenario | Games | Original home margin | Revised home margin | Original combined points | Revised combined points |
|---|---:|---:|---:|---:|---:|
| equal | 100 | 3.97 | 3.97 | 244.15 | 244.15 |
| away-b2b | 100 | 42.59 | 5.56 | 241.59 | 244.72 |
| home-b2b | 100 | -16.01 | 1.65 | 245.57 | 244.39 |
| away-b2b-no-stack | 100 | 4.73 | 3.95 | 247.07 | 244.87 |
| no-momentum | 100 | 4.03 | 4.03 | 243.61 | 243.61 |
| no-in-game-fatigue | 100 | 6.37 | 6.37 | 242.59 | 242.59 |
| denver | 100 | 4.02 | 4.02 | 243.28 | 243.28 |
| denver-acclimated | 100 | 3.97 | 3.97 | 244.15 | 244.15 |
| strong-weak | 100 | 36.98 | 36.98 | 243.68 | 243.68 |
| high-tempo | 100 | 4.37 | 4.37 | 248.17 | 248.17 |
| defense | 100 | 6.03 | 6.03 | 217.21 | 217.21 |
| elite-offense-defense | 100 | 0.89 | 0.89 | 243.79 | 243.79 |

The no-stack diagnostic removes the extra back-to-back attribute/energy reductions while retaining the baseline workload and stamina system. The separate no-in-game-fatigue diagnostic bypasses effective-attribute fatigue only, not every recovery/substitution system. Altitude tests use a 5,280-foot destination; the acclimated control gives the visitor the same home elevation. Crowd momentum is bounded and decays each possession. Nine scenarios without back-to-back workloads (900 paired games) matched exactly before and after, including scores, possessions, shooting counts and reported ending energy.

## Full regular-season results

### NBA

Completed baseline seasons: 10; revised: 10.

| Metric | Original | Revised |
|---|---:|---:|
| Games | 12300.00 | 12300.00 |
| Mean winning margin | 18.30 | 15.75 |
| Median winning margin | 15.00 | 13.00 |
| Largest winning margin | 88.00 | 75.00 |
| Points per team | 119.17 | 119.36 |
| Combined points | 238.35 | 238.71 |
| Possessions per team | 100.91 | 100.98 |
| Points per 100 possessions | 118.10 | 118.20 |
| Overtime games (%) | 1.54 | 1.98 |
| Home wins (%) | 61.75 | 59.16 |
| Mean signed home margin | 6.79 | 4.61 |
| Mean signed spread error | 4.29 | 2.11 |
| Mean absolute spread error | 16.94 | 14.29 |
| Team FG below 30% (%) | 0.02 | 0.00 |
| Team FG above 65% (%) | 0.29 | 0.12 |
| Highest individual points | 69.00 | 65.00 |
| Garbage-time rotation messages/game | 6.44 | 5.06 |
| Margin 20+ (%) | 39.63 | 32.52 |
| Margin 30+ (%) | 19.33 | 13.07 |
| Margin 40+ (%) | 8.10 | 4.02 |
| Margin 50+ (%) | 2.99 | 1.03 |
| FG (%) | 48.96 | 48.78 |
| 3P (%) | 34.81 | 34.69 |
| FT (%) | 77.13 | 77.76 |
| eFG (%) | 55.59 | 55.49 |
| TS (%) | 58.04 | 57.99 |

| Per-team box score | Original | Revised | Real-world reference |
|---|---:|---:|---:|
| FGA | 94.82 | 95.07 | 89.20 |
| TPA | 36.11 | 36.78 | 37.60 |
| FTA | 17.84 | 17.81 | 21.70 |
| ORB | 12.58 | 12.63 | 11.10 |
| DRB | 37.34 | 37.50 | 33.00 |
| TOV | 12.85 | 12.75 | 14.30 |
| AST | 27.63 | 27.67 | 26.50 |
| PF | 12.12 | 12.04 | 18.60 |

| Final margin | Original % | Revised % |
|---|---:|---:|
| 1-5 | 18.15 | 21.54 |
| 6-10 | 16.63 | 18.85 |
| 11-19 | 25.60 | 27.09 |
| 20-29 | 20.29 | 19.46 |
| 30-39 | 11.24 | 9.05 |
| 40-49 | 5.11 | 2.98 |
| 50+ | 2.99 | 1.03 |

| Rest situation | Original games / home margin | Revised games / home margin |
|---|---:|---:|
| neither | 8318 / 4.75 | 8318 / 4.38 |
| awayOnly | 1800 / 30.45 | 1800 / 7.45 |
| homeOnly | 1716 / -10.52 | 1716 / 2.54 |
| both | 466 / 15.59 | 466 / 5.24 |

| OVR strength difference | Original games / mean margin | Revised games / mean margin / stronger team win % |
|---|---:|---:|
| 0-2 | 4565 / 17.14 | 4568 / 14.73 / 53.97 |
| 2-5 | 5004 / 18.28 | 5002 / 15.64 / 63.15 |
| 5-10 | 2583 / 20.12 | 2573 / 17.35 / 76.06 |
| 10-15 | 148 / 22.45 | 157 / 22.94 / 91.08 |
| 15-100 | 0 / Unavailable | 0 / Unavailable / Unavailable |

| Absolute pregame spread | Revised games | Favorite win % | Mean favorite margin | 40+ margin % |
|---|---:|---:|---:|---:|
| 0-2 | 2992 | 52.44 | 1.23 | 2.87 |
| 2-5 | 4444 | 61.25 | 4.96 | 2.23 |
| 5-10 | 3964 | 73.23 | 10.86 | 5.63 |
| 10-15 | 834 | 86.09 | 17.17 | 8.39 |
| 15-100 | 66 | 98.48 | 27.02 | 24.24 |

The grouping uses the game’s existing OVR strength measure; it is not a claim that these teams have equal healthy rotation strength. Full per-seed, spread-bin, rest-bin, quarter and box-score aggregates are in `dev/balance-audit/summary.json`.

| Quarter development | Original | Revised |
|---|---:|---:|
| Mean halftime margin | 11.81 | 10.57 |
| Mean margin entering fourth | 15.32 | 13.31 |
| Combined fourth-quarter points | 60.23 | 60.19 |
| Wins after trailing 10+ entering fourth | 197.00 | 218.00 |
| Games with 10+ margin entering fourth | 7634.00 | 7014.00 |
| Lead changes/game | 5.96 | 6.47 |

Original: three largest margins (team IDs are local to the seeded fixture).

| Seed / day | Home / away IDs | Score | Spread (home) | Strength gap | Home / away back-to-back |
|---|---|---|---:|---:|---|
| 108 / 90 | 19 / 18 | 166–78 | -11.50 | 7.30 | False / True |
| 105 / 146 | 8 / 10 | 157–75 | -11.50 | 7.60 | False / True |
| 109 / 174 | 0 / 18 | 172–90 | -6.00 | 2.76 | False / True |

Revised: three largest margins (team IDs are local to the seeded fixture).

| Seed / day | Home / away IDs | Score | Spread (home) | Strength gap | Home / away back-to-back |
|---|---|---|---:|---:|---|
| 108 / 130 | 26 / 1 | 90–165 | 1.00 | -2.88 | False / False |
| 106 / 106 | 7 / 29 | 144–70 | -15.00 | 10.40 | False / False |
| 101 / 51 | 19 / 5 | 155–82 | -12.50 | 8.26 | True / False |

### WNBA

Completed baseline seasons: 10; revised: 10.

| Metric | Original | Revised |
|---|---:|---:|
| Games | 2400.00 | 2400.00 |
| Mean winning margin | 14.30 | 14.00 |
| Median winning margin | 12.00 | 12.00 |
| Largest winning margin | 67.00 | 61.00 |
| Points per team | 92.51 | 92.80 |
| Combined points | 185.02 | 185.59 |
| Possessions per team | 83.09 | 83.16 |
| Points per 100 possessions | 111.33 | 111.60 |
| Overtime games (%) | 2.21 | 2.92 |
| Home wins (%) | 60.58 | 60.50 |
| Mean signed home margin | 4.90 | 4.33 |
| Mean signed spread error | 2.40 | 1.82 |
| Mean absolute spread error | 12.94 | 12.67 |
| Team FG below 30% (%) | 0.35 | 0.25 |
| Team FG above 65% (%) | 0.06 | 0.02 |
| Highest individual points | 50.00 | 53.00 |
| Garbage-time rotation messages/game | 3.23 | 3.15 |
| Margin 20+ (%) | 27.04 | 26.25 |
| Margin 30+ (%) | 9.08 | 8.75 |
| Margin 40+ (%) | 2.58 | 2.17 |
| Margin 50+ (%) | 0.62 | 0.33 |
| FG (%) | 45.48 | 45.44 |
| 3P (%) | 32.33 | 32.22 |
| FT (%) | 78.83 | 79.44 |
| eFG (%) | 50.99 | 50.98 |
| TS (%) | 53.98 | 54.05 |

| Per-team box score | Original | Revised | Real-world reference |
|---|---:|---:|---:|
| FGA | 79.05 | 79.13 | 68.30 |
| TPA | 26.94 | 27.18 | 22.80 |
| FTA | 15.09 | 15.26 | 18.00 |
| ORB | 11.18 | 11.18 | 8.20 |
| DRB | 33.05 | 33.12 | 26.20 |
| TOV | 10.08 | 10.01 | 13.30 |
| AST | 21.98 | 21.91 | 20.50 |
| PF | 10.16 | 10.20 | 17.20 |

| Final margin | Original % | Revised % |
|---|---:|---:|
| 1-5 | 23.00 | 23.33 |
| 6-10 | 19.88 | 20.92 |
| 11-19 | 30.08 | 29.50 |
| 20-29 | 17.96 | 17.50 |
| 30-39 | 6.50 | 6.58 |
| 40-49 | 1.96 | 1.83 |
| 50+ | 0.62 | 0.33 |

| Rest situation | Original games / home margin | Revised games / home margin |
|---|---:|---:|
| neither | 2012 / 4.31 | 2012 / 4.09 |
| awayOnly | 161 / 22.55 | 161 / 7.11 |
| homeOnly | 193 / -5.48 | 193 / 4.05 |
| both | 34 / 15.59 | 34 / 7.12 |

| OVR strength difference | Original games / mean margin | Revised games / mean margin / stronger team win % |
|---|---:|---:|
| 0-2 | 864 / 13.52 | 870 / 13.01 / 52.87 |
| 2-5 | 975 / 13.85 | 947 / 13.82 / 62.51 |
| 5-10 | 516 / 15.94 | 537 / 15.12 / 69.65 |
| 10-15 | 45 / 20.18 | 46 / 23.57 / 86.96 |
| 15-100 | 0 / Unavailable | 0 / Unavailable / Unavailable |

| Absolute pregame spread | Revised games | Favorite win % | Mean favorite margin | 40+ margin % |
|---|---:|---:|---:|---:|
| 0-2 | 569 | 50.10 | 1.12 | 0.88 |
| 2-5 | 854 | 59.95 | 4.02 | 1.76 |
| 5-10 | 779 | 69.83 | 8.10 | 2.70 |
| 10-15 | 175 | 86.29 | 16.27 | 4.57 |
| 15-100 | 23 | 91.30 | 23.57 | 13.04 |

The grouping uses the game’s existing OVR strength measure; it is not a claim that these teams have equal healthy rotation strength. Full per-seed, spread-bin, rest-bin, quarter and box-score aggregates are in `dev/balance-audit/summary.json`.

| Quarter development | Original | Revised |
|---|---:|---:|
| Mean halftime margin | 9.59 | 9.53 |
| Mean margin entering fourth | 12.10 | 12.04 |
| Combined fourth-quarter points | 46.35 | 46.61 |
| Wins after trailing 10+ entering fourth | 28.00 | 31.00 |
| Games with 10+ margin entering fourth | 1278.00 | 1282.00 |
| Lead changes/game | 5.52 | 5.37 |

Original: three largest margins (team IDs are local to the seeded fixture).

| Seed / day | Home / away IDs | Score | Spread (home) | Strength gap | Home / away back-to-back |
|---|---|---|---:|---:|---|
| 102 / 142 | 9 / 7 | 133–66 | -10.50 | 6.85 | True / True |
| 105 / 8 | 3 / 2 | 131–73 | -10.50 | 6.72 | False / False |
| 102 / 39 | 9 / 8 | 123–67 | -12.00 | 7.81 | False / True |

Revised: three largest margins (team IDs are local to the seeded fixture).

| Seed / day | Home / away IDs | Score | Spread (home) | Strength gap | Home / away back-to-back |
|---|---|---|---:|---:|---|
| 108 / 140 | 5 / 0 | 115–54 | -3.50 | 0.91 | False / False |
| 110 / 106 | 9 / 7 | 124–66 | -18.50 | 13.13 | False / False |
| 103 / 139 | 4 / 7 | 131–75 | -3.00 | 0.33 | False / True |

## Real-world comparison and evidence limits

Basketball Reference’s 2024–25 NBA summary reports 113.8 points per team, 46.7% FG, 36.0% 3P, 78.0% FT, 89.2 FGA, 37.6 3PA, 21.7 FTA, 11.1 offensive rebounds and 14.3 turnovers per game. Its 2024 WNBA summary reports 81.7 points, 43.8% FG, 33.8% 3P, 78.5% FT, 68.3 FGA, 22.8 3PA, 18.0 FTA, 8.2 offensive rebounds and 13.3 turnovers. These league-specific references are not interchangeable.

- https://www.basketball-reference.com/leagues/NBA_2025.html
- https://www.basketball-reference.com/wnba/years/2024.html

The published aggregate tables were verified through indexed results. Full game-log pages returned HTTP 403, so this audit does not pretend to have independently reconstructed the requested seven real-world margin bins. The full simulated bins above are measured; an exact same-season real-world seven-bin comparison remains unavailable in this run. No invented reference percentages are used.

For context only, NBAAnalytic reports 19.1% of its 2023–24 sample at 20+ points and median margin 10; its sample includes the extra In-Season Tournament final (1,231 games), so it is not an exact 2024–25 regular-season comparator. https://nbaanalytic.com/articles/how-often-is-an-nba-game-actually-close.html . This secondary analysis was inspected, not used as a precise tuning target.

Possessions in the simulation tables are recorded on-court offensive possessions summed over players and divided by five; overtime is included. Real-world published pace may be regulation-normalized and use an estimator. Do not equate them without accounting for those definitions. TS uses the conventional 0.44 free-throw estimator. Shooting percentages are weighted by attempts, not averages of player percentages.

## Engine audit

| System | Location | Finding / action |
|---|---|---|
| Pregame spread | dist/schedule-spreads.js:3 | `(strength(home)-strength(away))*1.2 + 2.5`, clipped and rounded. No rotation, injury, fatigue, travel or matchup inputs. Kept unchanged; not widened to hide blowouts. |
| Team strength | dist/game.js:49 | First five roster OVRs weighted 80%, remainder 20%; not an availability-aware prediction model. |
| Main simulation | dist/attributes.js | Possession-by-possession scoring, separate NBA/WNBA period rules, shot/FT/turnover/rebound event records. No score caps added. |
| Shooting | dist/statistical-balance.js:7; dist/attributes.js; dist/simulation-rules.js | Base probabilities plus shooting/defense delta and contextual adjustments. Primary probabilities, blocks, follow-up shots and historical accuracy multipliers were inspected, not broadly retuned in this patch. |
| Possessions | dist/attributes.js:43, runMinute | Tempo, workload and era pace determine possession slots; regulation duration respects selected periods. No evidence from these diagnostics that altitude adds possessions. |
| Persistent workload | dist/workload.js; dist/rest-patterns.js | Calendar recovery and initial energy already represent prior workload. Preserved. |
| Back-to-back | dist/back-to-back.js | Confirmed multiple overlapping penalties and away-only doubling; consolidated as described above. |
| In-game stamina / substitutions | dist/rotations.js | Uses energy, planned minutes, stints, positions, foul trouble, late-game and garbage-time priorities. Replaced fixed 1.3 back-to-back drain with the bounded per-player drain factor. |
| Altitude | dist/altitude.js | Bounded extra drain/recovery modifier for away team, dependent on venue and acclimatization. Paired diagnostics did not identify it as the main blowout source; preserved. |
| Crowd / momentum | dist/home-court.js | Small bounded home shot adjustment; momentum capped at 1, decays and resets on timeouts. No unlimited compounding found. |
| Morale | dist/morale-effects.js | Older blanket bonus is disabled; current selected-attribute penalty is at most 2%. Preserved. |
| Coaching | dist/coaching.js; dist/attributes.js | Tempo and skill inputs; six-possession pressure adjustment after runs. No guaranteed comeback. Preserved. |

There is no published win-probability field in the spread model, so probability calibration cannot be reported as if one existed. The data includes empirical favorite win rates by spread magnitude, signed margin bias and MAE. Equal displayed strength does not mean equal current effective strength.

## Historical checks

Four sets of 100 full-length matchup simulations use the existing 1997 and 2004 NBA rules and 1997 and 2006 WNBA rules. These are fictional roster diagnostics, not reconstructions of historical teams. The new fatigue correction has no year-specific shooting override. The 1997 WNBA still uses two 20-minute halves; 2006 WNBA uses four 10-minute quarters. Historical statistical priors were not replaced with modern NBA targets.

| League / year | Games | Team points | Possessions | Regulation format |
|---|---:|---:|---:|---|
| nba 1997 | 100 | 102.34 | 93.24 | 4 × 12 minutes |
| nba 2004 | 100 | 102.25 | 93.44 | 4 × 12 minutes |
| wnba 1997 | 100 | 78.75 | 78.24 | 2 × 20 minutes |
| wnba 2006 | 100 | 85.79 | 79.44 | 4 × 10 minutes |

## Validation and compatibility

- `dev/verify-balance-results.py`: all 40 full regular seasons and 29,400 games passed per-team counts, same-day conflict checks, regulation/overtime minutes and box/quarter/final-score reconciliation; the retained files have SHA-256 hashes in `dev/balance-audit/verified-manifest.json`.
- `dev/test-balance-fatigue.cjs`: workload/venue boundaries, bounded drain, no second attribute or energy deduction, unchanged persistent ratings, score/box reconciliation, and completed-result save/load preservation.
- `dev/test-balance-legacy.cjs`: a save generated by the original baseline code loads in the revised code with completed scores, box scores and summary events unchanged.
- `dev/test-summary-fouls.cjs`: actual NBA/WNBA simulation, foul box/event totals and save/load; targeted paired technical and flagrant cases.
- `dev/test-player-feats.cjs`: scoring/defensive feats, overtime/ties, live visibility, postseason context and duplicate-news prevention.
- `dev/test-altitude.cjs`: arena locations, acclimatization, bounded fatigue, rotations, old-save defaults and 1997/2026 WNBA games. Only its obsolete small-league setup was adapted to the existing opening-night constraints.
- 900 non-back-to-back paired controlled games were exactly unchanged.
- JavaScript syntax and whitespace checks passed. Browser visual QA unavailable; no new screen/layout was added.
- No save schema changes, rating migration, rerolled players, contract changes or changes to previously completed results. Only future game simulations use the revised calculation.

## Files and remaining limitations

Production: `dist/back-to-back.js`, `dist/rotations.js`, `dist/schedule-events.js` (keep fatigue diagnostics hidden), `dist/index.html` (cache versions). Developer audit: `dev/audit-competitiveness.cjs`, `dev/run-balance-batch.cjs`, `dev/retry-balance.cjs`, `dev/balance-controlled.cjs`, `dev/balance-historical.cjs`, `dev/summarize-balance.py`, `dev/verify-balance-results.py`, `dev/write-balance-report.py`, `dev/test-balance-fatigue.cjs`, `dev/test-balance-legacy.cjs`, `dev/test-altitude.cjs`, and `dev/balance-audit/` results.

A separate scoring-calibration gap remains: the era profile translates pace, three-point share, shot accuracy and shooting fouls, but does not calibrate all turnover, rebounding and non-shooting-foul priors independently by league. The measured WNBA surplus in field-goal attempts accompanies low turnover/free-throw counts and high offensive rebounds. This is evidence of an attempt-mix problem; it is not a justification to impose a score cap or blindly reduce all shooting percentages.

This patch corrects a demonstrated source of enormous mismatches. It does not establish perfect calibration of every shooting/foul/turnover prior, every historical era, real roster distributions or the coarse OVR spread model. Scoring and margin deviations still visible in the measured results should not be described as solved. Exact supplied screenshot games cannot be replayed without their career state and RNG history. Full same-season real-world game-log margin bins, calibrated win probabilities, quarter-specific FG efficiency and exhaustive garbage-time lineup traces remain outside the measured dataset. All reported quarter scores and substitution counts come from actual stored game records.

## Reproduce the audit

Export `dist/` from baseline commit `1070a72f4b97e2b5a09e563052e6194c1885ebc8` to a separate directory and set `HOOPS_BASELINE_DIST` to that directory. Run from the project root:

```sh
node dev/run-balance-batch.cjs before
node dev/run-balance-batch.cjs after
node dev/balance-controlled.cjs before
node dev/balance-controlled.cjs after
node dev/balance-historical.cjs after
python dev/verify-balance-results.py
python dev/summarize-balance.py
python dev/write-balance-report.py
```

Batch runners skip existing completed output files. Archive or remove those outputs before a fresh rerun. Each batch uses two workers; run sequentially on memory-constrained systems. The baseline and revised copies must use the same fixture and seeds.
