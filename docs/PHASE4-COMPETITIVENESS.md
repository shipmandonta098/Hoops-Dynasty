# Hoops Dynasty — Phase 4 competitive balance audit

Baseline: Phase 3 commit 42eee072d688f3ed058163a7bc7822ce66e6b448. Ten independent full NBA regular seasons (12,300 games) and ten independent full WNBA regular seasons (2,400 games), seeds 101–110. These use fictional generated rosters, not verified historical player populations. They are independent seasons, not twenty consecutive career years. All Phase 2/3 source corrections and retained baseline results are preserved.

## Outcome and scope

This update corrects an open-shot contest inconsistency and reduces the modern crowd-effect scale. It does not declare the blowout problem solved. The rotation-aware strength model remains a diagnostic: its independent evaluation is reported below, without adding any team-level gameplay bonus or silently replacing every use of the existing rating. WNBA competitive balance did not reliably improve: its mean margin was essentially flat, its 6–10 point game share fell, and its 20+ margin rate rose from 21.08% to 22.50%. The stronger result is reduced home bias, not a solved competitiveness distribution. Mean winning margins moved from 15.10 to 14.75 in the NBA and from 12.71 to 12.75 in the WNBA. Home-win rates moved from 59.47% to 55.54% and 58.13% to 53.87%, respectively.

The two production mechanics changes affect future games only. No saved ratings, completed results, contracts, rosters, schedules, GM history, or city photographs are rewritten. No score caps, comeback bonuses, forced margins, rating compression, or roster equalization were introduced.

## Full-season results

Percent rows are percentages. Reference ORtg/DRtg below use the same simple possession estimator as the audit, not official advanced-rating definitions. The full-season spread errors continue to evaluate the original OVR-based prediction; the separate rotation-model evaluation is not substituted into these results.

### NBA

| Metric | Phase 3 | Phase 4 | Change | Real reference |
|---|---:|---:|---:|---:|
| Points/team | 112.35 | 112.58 | +0.23 | 113.83 |
| Mean winning margin | 15.10 | 14.75 | -0.34 | 12.75 |
| Median margin | 13.00 | 12.00 | -1.00 | 10.00 |
| maxMargin | 72.00 | 74.00 | +2.00 | — |
| 1–5 point games % | 21.67 | 23.04 | +1.37 | 25.12 |
| 6–10 point games % | 20.10 | 19.63 | -0.47 | 25.04 |
| 11–19 point games % | 28.29 | 28.60 | +0.31 | 28.78 |
| 20+ margins % | 29.93 | 28.73 | -1.20 | 21.06 |
| 30+ margins % | 11.40 | 10.71 | -0.69 | 6.50 |
| 40+ margins % | 3.38 | 3.30 | -0.08 | 1.79 |
| 50+ margins % | 0.76 | 0.68 | -0.07 | 0.41 |
| Home wins % | 59.47 | 55.54 | -3.93 | 54.47 |
| 3P% | 33.28 | 33.52 | +0.24 | 36.02 |
| FG% | 47.84 | 47.95 | +0.11 | 46.72 |
| eFG% | 54.75 | 54.91 | +0.16 | 54.31 |
| TS% | 57.68 | 57.78 | +0.10 | 57.62 |
| fga | 88.70 | 88.87 | +0.17 | 89.24 |
| fta | 19.78 | 19.45 | -0.32 | 21.67 |
| orb | 12.29 | 12.22 | -0.07 | 11.12 |
| totalTov | 13.76 | 13.74 | -0.01 | 14.30 |
| Engine slots/team | 98.34 | 98.42 | +0.08 | — |
| Estimated possessions/team | 98.87 | 98.96 | +0.09 | 101.95 |
| Points/100 estimated possessions | 113.64 | 113.77 | +0.13 | 111.64 |
| Original spread MAE | 13.68 | 13.58 | -0.10 | — |
| Original spread RMSE | 17.17 | 17.04 | -0.13 | — |
| Original spread signed error (actual minus prediction) | 1.73 | 0.03 | -1.70 | — |
| Overtime % | 1.85 | 2.28 | +0.43 | 4.88 |

### NBA uncertainty across independent seeds

| Metric | Approximate 95% interval for Phase 4 seed mean | Phase 4 seed range | Paired change 95% interval |
|---|---:|---:|---:|
| Points/team | 112.29–112.88 | 111.77–113.12 | +0.00 to +0.46 |
| Mean winning margin | 14.48–15.02 | 14.21–15.17 | -0.74 to +0.05 |
| 20+ margins % | 27.94–29.52 | 27.32–30.24 | -2.34 to -0.07 |
| 30+ margins % | 9.68–11.74 | 8.62–12.68 | -1.68 to +0.29 |
| 40+ margins % | 2.74–3.86 | 2.03–4.47 | -0.71 to +0.55 |
| 50+ margins % | 0.43–0.94 | 0.16–1.38 | -0.41 to +0.26 |
| Home wins % | 54.74–56.35 | 53.66–57.97 | -5.56 to -2.29 |
| 3P% | 33.35–33.68 | 33.27–33.85 | +0.04 to +0.43 |
| Original spread MAE | 13.34–13.81 | 12.90–13.93 | -0.49 to +0.28 |

Intervals use t(9) across ten season estimates, rather than treating every game as independent. Changed random branches can alter later injuries, morale, rotations and roster moves even with the same starting seed. Controlled games reset the fixture for paired comparisons. Rare blowout estimates remain uncertain.

### WNBA

| Metric | Phase 3 | Phase 4 | Change | Real reference |
|---|---:|---:|---:|---:|
| Points/team | 83.98 | 84.40 | +0.42 | 81.67 |
| Mean winning margin | 12.71 | 12.75 | +0.04 | 10.82 |
| Median margin | 11.00 | 11.00 | +0.00 | 9.00 |
| maxMargin | 57.00 | 59.00 | +2.00 | — |
| 1–5 point games % | 26.50 | 26.58 | +0.08 | 25.42 |
| 6–10 point games % | 23.42 | 21.83 | -1.58 | 27.50 |
| 11–19 point games % | 29.00 | 29.08 | +0.08 | 37.92 |
| 20+ margins % | 21.08 | 22.50 | +1.42 | 9.17 |
| 30+ margins % | 6.54 | 5.67 | -0.88 | 2.92 |
| 40+ margins % | 1.25 | 0.83 | -0.42 | 0.00 |
| 50+ margins % | 0.29 | 0.04 | -0.25 | 0.00 |
| Home wins % | 58.13 | 53.87 | -4.25 | 52.50 |
| 3P% | 30.55 | 31.07 | +0.53 | 33.82 |
| FG% | 44.02 | 44.30 | +0.28 | 43.80 |
| eFG% | 49.71 | 50.09 | +0.38 | 49.46 |
| TS% | 53.37 | 53.72 | +0.35 | 53.60 |
| fga | 71.40 | 71.36 | -0.04 | 68.25 |
| fta | 16.55 | 16.37 | -0.18 | 18.03 |
| orb | 10.07 | 9.92 | -0.15 | 8.20 |
| totalTov | 12.35 | 12.28 | -0.07 | 14.27 |
| Engine slots/team | 80.85 | 80.82 | -0.03 | — |
| Estimated possessions/team | 80.96 | 80.92 | -0.04 | 82.25 |
| Points/100 estimated possessions | 103.73 | 104.30 | +0.57 | 99.29 |
| Original spread MAE | 11.56 | 11.85 | +0.29 | — |
| Original spread RMSE | 14.55 | 14.73 | +0.18 | — |
| Original spread signed error (actual minus prediction) | 0.89 | -0.82 | -1.71 | — |
| Overtime % | 2.33 | 2.50 | +0.17 | 3.33 |

### WNBA uncertainty across independent seeds

| Metric | Approximate 95% interval for Phase 4 seed mean | Phase 4 seed range | Paired change 95% interval |
|---|---:|---:|---:|
| Points/team | 83.97–84.83 | 83.23–85.19 | -0.10 to +0.93 |
| Mean winning margin | 12.11–13.38 | 10.68–13.60 | -0.63 to +0.71 |
| 20+ margins % | 19.96–25.04 | 15.00–27.08 | -1.07 to +3.90 |
| 30+ margins % | 4.51–6.82 | 2.50–7.50 | -2.14 to +0.39 |
| 40+ margins % | 0.44–1.23 | 0.00–2.08 | -1.03 to +0.20 |
| 50+ margins % | -0.05–0.14 | 0.00–0.42 | -0.54 to +0.04 |
| Home wins % | 50.91–56.84 | 45.42–61.67 | -6.94 to -1.56 |
| 3P% | 30.76–31.38 | 30.50–31.74 | +0.03 to +1.03 |
| Original spread MAE | 11.49–12.21 | 11.36–12.79 | -0.24 to +0.82 |

Intervals use t(9) across ten season estimates, rather than treating every game as independent. Changed random branches can alter later injuries, morale, rotations and roster moves even with the same starting seed. Controlled games reset the fixture for paired comparisons. Rare blowout estimates remain uncertain.

## Reference variation and provenance

Complete official team game logs were retained for NBA 2023–24 and 2024–25 and WNBA 2023 and 2024. Each paired game contributes once. The 2024 WNBA absence of 40-point margins is not interpreted as zero underlying probability.

| Reference | Games | Pts/team | Mean margin | 20+ % | 30+ % | 40+ % | Home wins % | 3P% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| nba-2025 | 1230.00 | 113.83 | 12.75 | 21.06 | 6.50 | 1.79 | 54.47 | 36.02 |
| nba-2024 | 1230.00 | 114.21 | 12.58 | 19.11 | 6.26 | 1.79 | 54.31 | 36.57 |
| wnba-2024 | 240.00 | 81.67 | 10.82 | 9.17 | 2.92 | 0.00 | 52.50 | 33.82 |
| wnba-2023 | 240.00 | 82.74 | 11.67 | 16.25 | 3.33 | 0.83 | 52.08 | 34.68 |

The freshly paired official 2024–25 NBA logs produce 54.47% home wins (670/1,230), compared with the earlier audit reference of 54.39%. The earlier baseline files were not altered. This small reference discrepancy is exposed rather than silently rewriting the previous report.

Sources: https://stats.nba.com/stats/leaguegamelog and https://stats.wnba.com/stats/leaguegamelog; complete query parameters are embedded in each retained response. SeasonType=Regular Season, PlayerOrTeam=T, LeagueID=00/10. Additional raw reference files and fetch status are in dev/phase4/. Original official reference logs remain in dev/phase3/.

## 1. Team strength: confirmed prediction weakness, not a possession multiplier

dist/game.js:49 defines strength as 80% first-five OVR plus 20% the remaining-roster OVR average. It includes injured roster members and ignores minutes, defensive/offensive specialties, stamina and positional coverage. That can misclassify comparable teams. It is not used as a global bonus in the possession engine.

Consumers traced: schedule-spreads.js (pregame spread); schedule-ui.js (projected schedule difficulty); power-rankings.js; playoff-field.js, playoff-series.js and playoffs.js (win/series forecasts); dashboard.js and game.js (display); trade-logic.js (unlocked future-pick valuation); gm-career.js (job requirements, expectations and management evaluation). The local strength variable in statistical-balance.js is a separate rebounding calculation, not this OVR function. No direct home-court, scoring or schedule-matchmaking multiplier was found from this global OVR function. Its AI valuation uses can have indirect long-term effects.

## 2. Rotation-aware diagnostic model

dev/rotation-quality-diagnostic.js projects the existing rotation for a full regulation game on a copied club. It reuses availability, depth, minute targets, workload caps, stamina depletion/recovery and coaching. It measures minutes-weighted effective offensive/defensive attributes, rebounding, passing, ball handling, energy, bench share and coaching skill/fit. The projection never changes individual possession calculations.

It is approximate: minute-granularity rotation checks, a neutral score margin, no future fouls/ejections, injuries during play or garbage time, and no game-specific altitude context. It does not claim to forecast every eventual substitution. Availability tests exclude injured players and verify 240 NBA/200 WNBA player-minutes; the fatigued-player fixture changes the projection. RNG and state immutability are asserted. There is no separate persistent suspension mechanism in the audited availability code, so this phase does not invent one.

The quality-model experiment uses preserved Phase 3 mechanics to isolate prediction quality. It is not a fitted Phase 4 spread model. Fitting uses seeds 201–204; evaluation uses separate seeds 205–208. Each league has 800 training and 800 held-out games (3,200 total). Every fourth observation deliberately makes one home starter unavailable; this is a stress test, not a claim about real injury prevalence. The ridge penalty is fixed at 20. A fitted version of the old OVR estimate is included to distinguish feature improvements from merely fitting an intercept/slope.

| League / held-out model | Games | MAE | RMSE | Signed bias (prediction minus actual) | Brier score |
|---|---:|---:|---:|---:|---:|
| nba / old | 800 | 13.032 | 16.570 | +0.029 | 0.2258 |
| nba / rotation | 800 | 12.804 | 16.244 | +0.515 | 0.2176 |
| nba / fittedOld | 800 | 13.024 | 16.542 | +0.440 | 0.2242 |
| wnba / old | 800 | 11.643 | 14.536 | -0.686 | 0.2222 |
| wnba / rotation | 800 | 11.542 | 14.505 | -0.889 | 0.2204 |
| wnba / fittedOld | 800 | 11.636 | 14.545 | -1.005 | 0.2221 |

The Brier calculation uses a normal residual link and training residual scale, not a verified betting probability. Full probability bins are in quality-evaluation.json. The model remains diagnostic because modest gains on four held-out roster seeds do not justify a blanket replacement across historical eras, AI decisions and every display. Better predictions would not itself reduce blowouts.

| League | Held-out injury MAE: old → rotation | Healthy MAE: old → rotation | 95% seed interval for MAE change |
|---|---:|---:|---:|
| nba | 13.50 → 12.76 | 12.88 → 12.82 | -0.65 to +0.20 |
| wnba | 11.90 → 11.75 | 11.56 → 11.47 | -0.15 to -0.06 |

## 3. Rotation, bench depth and availability

Actual rotation selection prioritizes natural positions and depth coverage, then stamina, planned minutes, foul trouble, workload, coaching and closing/garbage-time context. A natural-position preference can outweigh small OVR differences. Injured players are excluded; emergency fallback does not make injured or disqualified players eligible. Managed workload restrictions are honored subject to having enough available players.

Shallow/deep tests change only the away bench attributes (−15/+10 bounded rating points, excluding height). They are deliberately strong sensitivity probes, not realistic population estimates. The starters-versus-balanced probe gives home starters +5 and home bench −10. Short-long restricts only the home planned rotation; actual substitutions remain free to respond to stamina/positions. No production rotation rule was changed merely to erase the value of depth.

The original NBA injured diagnostic had an incorrect fixture timestamp and is retained under excluded-fixtures/, omitted from every reported result. It was rerun with a validated medicalInfo.until and an explicit injuryDays assertion. The WNBA setup error was corrected before accepted quality-model data were generated. Failed/incomplete season processes were retried, not counted.

## 4. Controlled experiments

Baseline fixtures use Phase 3 mechanics. Candidate fixtures use the exact two mechanics changes. Rosters, bios, personality identity, coaching and rest are matched unless the scenario intentionally changes them. Four roster templates are reused in blocks of 50; sample uncertainty does not cover every possible roster. Standard neutral/home cases set one rest day, full starting energy, no rivalry and no altitude. High/low crowd changes attendance and energy; altitude uses 5,280 feet. Each row retains complete raw outcomes.

| Case | N | Pts/team | Mean margin | Signed margin SD | Abs margin SD | Home win % | ≤10 % | 20+ % | 30+ % | 40+ % | FG% | 3P% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline-nba-altitude | 300.00 | 112.77 | 14.50 | 17.25 | 10.75 | 62.33 | 44.33 | 26.00 | 10.67 | 3.67 | 48.46 | 34.27 |
| baseline-nba-crowd-high | 300.00 | 112.10 | 13.68 | 15.96 | 9.86 | 61.00 | 45.33 | 25.33 | 7.00 | 1.33 | 48.53 | 34.17 |
| baseline-nba-crowd-low | 300.00 | 111.99 | 13.44 | 16.09 | 10.04 | 57.67 | 47.33 | 26.00 | 7.00 | 1.67 | 48.22 | 34.12 |
| baseline-nba-deep | 300.00 | 112.72 | 14.16 | 16.91 | 10.66 | 38.67 | 45.33 | 26.00 | 10.00 | 2.00 | 48.56 | 34.67 |
| baseline-nba-fast-fast | 200.00 | 120.63 | 14.27 | 17.54 | 10.29 | 56.50 | 43.50 | 27.00 | 9.50 | 2.00 | 48.20 | 34.09 |
| baseline-nba-fast-slow | 200.00 | 114.34 | 12.47 | 15.25 | 8.78 | 46.00 | 50.50 | 20.50 | 4.00 | 1.00 | 48.79 | 34.19 |
| baseline-nba-home | 300.00 | 111.92 | 13.77 | 16.22 | 10.22 | 61.67 | 46.00 | 26.00 | 8.33 | 2.00 | 48.26 | 34.13 |
| baseline-nba-injured | 300.00 | 111.94 | 12.88 | 16.23 | 10.21 | 42.33 | 52.00 | 20.00 | 6.00 | 2.33 | 48.30 | 34.03 |
| baseline-nba-neutral | 300.00 | 112.37 | 12.82 | 15.66 | 9.09 | 51.33 | 48.67 | 22.67 | 6.33 | 0.33 | 48.34 | 33.98 |
| baseline-nba-no-fatigue | 300.00 | 112.24 | 12.85 | 15.96 | 9.47 | 47.33 | 49.67 | 23.00 | 6.33 | 1.00 | 48.35 | 34.28 |
| baseline-nba-no-physical | 300.00 | 110.80 | 13.06 | 16.16 | 9.52 | 51.00 | 45.67 | 22.33 | 7.67 | 1.33 | 48.05 | 33.86 |
| baseline-nba-no-three-contest | 300.00 | 112.49 | 13.08 | 16.25 | 9.76 | 53.33 | 46.67 | 24.67 | 8.00 | 1.00 | 48.24 | 33.95 |
| baseline-nba-rest-home2 | 200.00 | 112.39 | 13.79 | 15.15 | 9.16 | 66.00 | 43.50 | 26.00 | 7.00 | 1.50 | 48.15 | 33.89 |
| baseline-nba-rest-neutral2 | 200.00 | 112.51 | 12.61 | 15.05 | 8.56 | 56.00 | 47.50 | 19.00 | 5.00 | 1.00 | 48.24 | 33.67 |
| baseline-nba-rest-unequal | 200.00 | 112.54 | 13.62 | 14.67 | 9.20 | 68.50 | 45.50 | 26.50 | 7.00 | 1.50 | 48.25 | 34.04 |
| baseline-nba-shallow | 300.00 | 112.42 | 16.58 | 17.04 | 11.77 | 72.00 | 36.00 | 32.67 | 16.67 | 4.33 | 48.61 | 34.39 |
| baseline-nba-short | 300.00 | 112.08 | 13.68 | 16.50 | 9.30 | 49.67 | 43.67 | 27.00 | 5.33 | 1.00 | 48.24 | 34.43 |
| baseline-nba-short-long | 200.00 | 112.88 | 14.15 | 17.57 | 10.59 | 53.00 | 50.00 | 29.00 | 10.50 | 2.50 | 48.53 | 34.07 |
| baseline-nba-starters-v-balanced | 200.00 | 113.75 | 15.20 | 17.92 | 10.45 | 42.50 | 39.50 | 26.00 | 11.50 | 3.00 | 48.65 | 34.42 |
| baseline-wnba-altitude | 300.00 | 83.41 | 11.68 | 14.22 | 8.46 | 55.33 | 52.67 | 18.00 | 4.33 | 0.33 | 44.23 | 31.88 |
| baseline-wnba-crowd-high | 300.00 | 83.52 | 12.13 | 14.64 | 9.48 | 62.00 | 52.00 | 23.00 | 6.33 | 0.33 | 44.27 | 31.49 |
| baseline-wnba-crowd-low | 300.00 | 83.49 | 11.91 | 14.80 | 9.00 | 53.67 | 53.33 | 20.67 | 5.67 | 0.33 | 44.46 | 31.74 |
| baseline-wnba-deep | 300.00 | 83.39 | 12.02 | 14.38 | 9.24 | 39.67 | 55.00 | 18.00 | 6.67 | 1.33 | 44.52 | 31.88 |
| baseline-wnba-fast-fast | 200.00 | 89.23 | 11.65 | 14.39 | 8.45 | 47.00 | 52.50 | 16.50 | 5.00 | 0.50 | 44.28 | 32.00 |
| baseline-wnba-fast-slow | 200.00 | 84.81 | 12.42 | 15.31 | 9.33 | 43.50 | 52.50 | 20.50 | 6.50 | 1.50 | 44.56 | 32.04 |
| baseline-wnba-home | 300.00 | 83.41 | 11.56 | 14.15 | 9.01 | 62.67 | 53.67 | 20.67 | 5.00 | 0.33 | 44.29 | 31.66 |
| baseline-wnba-injured | 300.00 | 83.89 | 12.27 | 14.75 | 8.48 | 44.33 | 49.67 | 19.00 | 4.67 | 0.33 | 44.48 | 32.40 |
| baseline-wnba-neutral | 300.00 | 83.39 | 11.00 | 13.65 | 8.20 | 44.67 | 57.00 | 16.33 | 3.67 | 0.00 | 44.63 | 31.87 |
| baseline-wnba-no-fatigue | 300.00 | 83.02 | 11.82 | 14.71 | 8.82 | 46.00 | 53.33 | 19.00 | 5.00 | 0.33 | 44.44 | 31.81 |
| baseline-wnba-no-physical | 300.00 | 83.55 | 11.81 | 14.56 | 8.69 | 44.67 | 50.00 | 18.00 | 4.00 | 0.33 | 44.55 | 33.12 |
| baseline-wnba-no-three-contest | 300.00 | 83.22 | 11.49 | 14.10 | 8.23 | 47.67 | 51.67 | 15.33 | 3.00 | 0.67 | 44.51 | 32.06 |
| baseline-wnba-rest-home2 | 200.00 | 83.69 | 11.70 | 14.48 | 9.09 | 57.00 | 52.50 | 20.00 | 4.50 | 0.50 | 44.58 | 32.36 |
| baseline-wnba-rest-neutral2 | 200.00 | 83.37 | 11.05 | 13.61 | 8.07 | 52.50 | 57.50 | 17.00 | 2.50 | 0.00 | 44.24 | 32.00 |
| baseline-wnba-rest-unequal | 200.00 | 83.33 | 11.83 | 14.53 | 9.14 | 59.00 | 52.50 | 20.50 | 5.00 | 0.00 | 44.32 | 31.86 |
| baseline-wnba-shallow | 300.00 | 83.80 | 13.59 | 15.60 | 11.09 | 64.67 | 52.00 | 26.00 | 9.67 | 3.00 | 44.59 | 32.60 |
| baseline-wnba-short | 300.00 | 84.21 | 11.94 | 15.17 | 9.39 | 48.33 | 55.67 | 22.33 | 6.00 | 1.00 | 44.62 | 32.29 |
| baseline-wnba-short-long | 200.00 | 83.43 | 11.71 | 14.24 | 8.10 | 50.00 | 49.00 | 17.00 | 3.50 | 0.00 | 44.33 | 31.42 |
| baseline-wnba-starters-v-balanced | 200.00 | 82.93 | 11.53 | 14.02 | 8.10 | 57.00 | 53.00 | 17.00 | 3.50 | 0.00 | 43.91 | 31.21 |
| candidate-nba-altitude | 500.00 | 112.71 | 12.87 | 15.67 | 9.35 | 58.00 | 49.00 | 22.40 | 7.20 | 0.80 | 48.62 | 34.56 |
| candidate-nba-crowd-high | 500.00 | 112.87 | 13.37 | 16.43 | 10.03 | 58.80 | 47.20 | 24.60 | 8.00 | 1.80 | 48.70 | 34.56 |
| candidate-nba-crowd-low | 500.00 | 112.99 | 13.41 | 16.61 | 10.23 | 56.60 | 48.20 | 23.20 | 9.60 | 2.00 | 48.59 | 34.48 |
| candidate-nba-home | 500.00 | 113.19 | 13.50 | 16.50 | 10.06 | 58.40 | 45.80 | 24.20 | 8.40 | 1.80 | 48.72 | 34.64 |
| candidate-nba-neutral | 500.00 | 112.84 | 13.71 | 17.03 | 10.13 | 52.00 | 47.40 | 26.60 | 8.40 | 1.80 | 48.57 | 34.41 |
| candidate-wnba-altitude | 500.00 | 82.78 | 12.04 | 14.67 | 8.93 | 59.20 | 51.20 | 19.80 | 4.20 | 0.80 | 44.20 | 31.65 |
| candidate-wnba-crowd-high | 500.00 | 82.84 | 11.41 | 13.96 | 8.29 | 55.80 | 54.80 | 18.60 | 3.60 | 0.20 | 44.34 | 31.76 |
| candidate-wnba-crowd-low | 500.00 | 82.87 | 11.63 | 14.46 | 8.75 | 56.20 | 55.40 | 20.60 | 4.60 | 0.60 | 44.31 | 31.64 |
| candidate-wnba-home | 500.00 | 82.86 | 11.55 | 14.23 | 8.55 | 56.40 | 53.80 | 18.80 | 4.40 | 0.40 | 44.33 | 31.87 |
| candidate-wnba-neutral | 500.00 | 83.22 | 11.67 | 14.54 | 8.70 | 47.00 | 54.60 | 18.60 | 4.60 | 1.00 | 44.36 | 31.90 |

“no-three-contest” is the retained filename for neutralizing the base three-point defensive rating at 75. It does NOT disable every contest penalty. “no-fatigue” removes effective-attribute fatigue reductions, not stamina-driven substitutions. “no-physical” removes derived attributes and direct matchup bonuses, not every biography-based rebound factor. These are bounded ablations, not complete system removal. controlled-comparisons.json includes paired mean-absolute-margin deltas and 95% intervals against the neutral fixture (or the matching baseline for candidate cases); intervals crossing zero do not establish a reliable improvement.

## 5. Home-court effects

The crowd system adds home shooting probability, subtracts road shooting probability, changes foul risk, adds a small road turnover hazard, affects rebound odds and produces bounded home momentum. Those paths are cumulative by design, not literally duplicate applications of the same function. Their combined modern effect was too large relative to matched-roster tests and both recent official reference seasons.

The candidate multiplies the existing crowd scale by 0.6 for simulation years 2023 onward, preserving the home-advantage setting and venue differences. This is an empirical modern calibration, NOT an assertion that a league rule changed in 2023. Earlier years retain their existing magnitude. Altitude, rivalry and rest mechanisms are untouched.

There is also an existing two-day-rest asymmetry: +1 passing for either team, but +2 defensive awareness/rebounding only for the home team. The rest-neutral2/rest-home2 probes isolate that behavior; rest-unequal compares two home rest days with one away. This remains an explicit home-preparation modeling assumption, not silently removed or counted as a crowd fix.

| Matched comparison | N | Mean home-margin change | Approximate paired 95% interval |
|---|---:|---:|---:|
| nba baseline/home minus baseline/neutral | 300 | +4.24 | +2.15 to +6.33 |
| nba candidate/home minus candidate/neutral | 500 | +2.62 | +1.11 to +4.14 |
| nba candidate/home minus baseline/home | 300 | -1.24 | -3.51 to +1.03 |
| wnba baseline/home minus baseline/neutral | 300 | +5.29 | +3.62 to +6.95 |
| wnba candidate/home minus candidate/neutral | 500 | +2.49 | +1.34 to +3.63 |
| wnba candidate/home minus baseline/home | 300 | -2.86 | -4.93 to -0.80 |

The paired intervals describe these fixtures; sequential random branches diverge after a changed play. They are not possession-for-possession counterfactual estimates. Home/away scoring, turnovers, foul counts, shooting attempts and recorded player stamina totals (not mean energy percentages) are retained in controlled-summary.json.

## 6. Three-point shooting

Confirmed defect: attributes.js could assign contest=true to transition/drive-and-kick decisions that explicitly carried openLook=true. The contest expression now honors the open-look flag before the generic random contest branch. In 30 baseline games, 316 of 1,951 open decisions received a contest; in 30 candidate games, zero of 1,997 did. Changed counts reflect divergent random branches, not invented shots. This corrects primary-shot context, not every secondary-shot situation.

The remaining accuracy gap cannot be attributed solely to this bug. The base shot formula, shooter/defender differences, contested and self-created penalties, tendencies, coaching, morale, physical matchup and fatigue all remain active. No universal three-point bonus was added. The actual season 3P results above determine whether the defect correction materially closes the population-level gap.

## 7. Efficiency, roster distribution and shared pace

Team-season distributions use a common estimate: FGA − ORB + total turnovers + 0.44 FTA, averaged between opponents for each game. This is not exact ball-control pace; foul mix and team rebounds can differ. Simulated team-seasons pool ten leagues, so their extrema should not be equated with one real season’s extrema.

| Population | Team-seasons | ORtg SD | DRtg SD | Net rating SD | Net p10 | Net p90 | Opposing score correlation | Shared estimated-pace SD |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| nba phase3 | 300 | 3.31 | 3.29 | 5.96 | -7.89 | 7.45 | 0.109 | 4.85 |
| nba phase4 | 300 | 3.30 | 3.41 | 5.93 | -7.85 | 7.25 | 0.116 | 4.91 |
| wnba phase3 | 120 | 3.62 | 3.52 | 6.15 | -7.46 | 8.59 | 0.122 | 3.92 |
| wnba phase4 | 120 | 3.60 | 3.56 | 6.20 | -7.82 | 7.89 | 0.084 | 3.95 |
| nba-2025 official | 30 | 3.75 | 3.05 | 5.77 | -9.04 | 5.39 | 0.217 | 5.25 |
| nba-2024 official | 30 | 3.72 | 2.76 | 5.38 | -8.84 | 5.41 | 0.254 | 5.16 |
| wnba-2024 official | 12 | 3.48 | 5.14 | 6.96 | -8.49 | 8.11 | 0.276 | 4.40 |
| wnba-2023 official | 12 | 4.93 | 2.92 | 7.01 | -6.69 | 9.87 | 0.226 | 3.94 |

The Phase 3 WNBA net-rating SD is below both real reference seasons even while blowouts are too frequent. The NBA SD is broadly similar to its references. This does not prove every fictional roster is realistic, but it contradicts an explanation based only on excessive league-wide roster separation. No roster generator change was justified. Healthy minutes-weighted quality, bench-share, attribute and energy distributions for the separate 8-seed population are in quality-analysis.json. Expansion talent concentration and long-term free-agency concentration were not independently calibrated in this phase.

Both clubs already share the same scheduled possession-window count: the engine uses both coaches’ tempos, the user’s pace if involved, a shared random pace term, rest workload and the historical pace multiplier. Fast-fast/fast-slow probes test this directly. The engine is still a fixed-window approximation; repeated rebounds and retained foul possessions can be compressed into a window. The lower simulated opposing-score correlation is a remaining modeling signal, not proof that a hidden score-correlation bonus would be valid. No artificial shared shooting multiplier was added.

Detailed per-team ORtg, DRtg, net rating, eFG, opponent eFG, turnover rate, offensive-rebound share and FT rate distributions, plus team-game FG/3P/eFG/TS and score variance/covariance, are retained in summary.json and reference-analysis.json.

## 8. Fourth-quarter development

| League / phase | Mean halftime margin | Mean Q4-entry margin | Mean final margin | Q4 trailer eventually wins % | Bench minutes/team | Garbage-time game % |
|---|---:|---:|---:|---:|---:|---:|
| nba phase3 | 10.18 | 12.73 | 15.10 | 13.51 | 102.90 | 41.24 |
| nba phase4 | 10.05 | 12.52 | 14.75 | 14.25 | 102.57 | 40.22 |
| wnba phase3 | 8.64 | 10.69 | 12.71 | 14.89 | 71.80 | 29.62 |
| wnba phase4 | 8.62 | 10.84 | 12.75 | 15.29 | 72.32 | 32.08 |

Margin-conditioned late-game results are included in summary.json. They are observational: a 20-point lead selects teams already performing better. The code already switches to bench-prioritized rotations in late blowouts and uses closing lineups in close games. There is no generic lead-based shooting boost; crowd momentum is bounded and was included in the crowd-scale reduction. These data do not justify a trailing-team boost. Exact real-game quarter-by-quarter and intentional-foul rate calibration was not newly completed in this phase.

## 9. Historical and regression verification

150 full-length games across NBA 1997/2025 and WNBA 1997/2006/2024 verify formats, nonnegative box statistics, shot bounds and final score/summary agreement. The inaugural WNBA retains two 20-minute halves; later WNBA uses four 10-minute quarters; NBA uses four 12-minute quarters. Overtime remains five minutes. These are format/regression checks with fictional rosters, not statistically verified historical competitiveness calibration.

All 14,700 accepted full-season games are checked for exact per-team game counts, balanced home/away totals, no same-day conflicts, player-minutes totals, period scores, final scores, box-score scoring identities and player-versus-team turnover accounting. The 40 actual Player Feat regression games cover event provenance, live/final distinction, deterministic replay, completed-game recognition and save/reload publication idempotence; synthetic cases also cover overtime winners, buzzer timing and Finals context. A Phase 3 save retains completed scores, boxes and summary events under the candidate.

Thirty fatigued-game regressions preserve permanent attributes and secondary-shot calculations; 26 foul regressions preserve technical/flagrant event and box totals; 1,361 defender-attribute accesses retain correct current-defender stamina. The additional projection and home-court regression outputs are retained alongside these tests. No browser layout change is made. Browser rendering itself is not revalidated by these engine tests.

## 10. Files and reproduction

Production: dist/attributes.js (open-look contest correction), dist/home-court.js (modern crowd scale), dist/index.html (cache-key refresh). Documentation: docs/PHASE4-COMPETITIVENESS.md and dist/audits/phase4.html. Diagnostics: dev/audit-competitiveness.cjs (Phase 4 run claims only), dev/phase4-*.cjs/.py, dev/run-phase4-*.cjs, dev/rotation-quality-diagnostic.js, dev/test-phase4-*.cjs, dev/verify-phase4.py. Data: dev/phase4/ and dev/balance-audit/phase4-*.json. No save schema or database migration is required.

Reproduce full seasons: node dev/run-phase4-seasons.cjs. It skips completed output files and uses bounded-memory workers; remove only Phase 4 output files in a separate checkout to rerun. Candidate transforms read preserved Phase 3 source, so they remain reproducible after production publication. Diagnostics: node dev/run-phase4-diagnostics.cjs; candidate controls: node dev/run-phase4-candidate-controls.cjs; additional rotation/rest/tempo probes: node dev/run-phase4-extra.cjs. Model: node dev/run-phase4-quality.cjs, then python3 dev/phase4-fit-quality.py and python3 dev/phase4-quality-analysis.py. Analysis: python3 dev/phase4-analysis.py; integrity: python3 dev/verify-phase4.py.

Baseline-hashes.json preserves all original production files, city photos, Phase 2/3 season data and previous Phase 3 JSON outputs. Only explicitly listed production paths are exempted after applying the tested changes.

## Remaining limitations

- Excessive blowouts and low three-point accuracy remain; compare every tail and scoring metric rather than declaring success from home wins alone.
- The prediction model is experimental and does not replace historical spreads, displayed ratings, playoff odds or AI valuations.
- Historical crowd magnitudes, expansion-roster distributions, long-term free-agency concentration and exact real-game rotation strategies remain uncalibrated.
- Fixed possession windows, incomplete team-rebound accounting and a generic possession estimator limit causal pace conclusions.
- Home-only two-day-rest preparation remains a documented assumption; it is not confused with the crowd fix.
- The reference samples and four held-out roster seeds are finite. Zero rare events and small prediction gains are not proof of exact probabilities or broad generalization.
