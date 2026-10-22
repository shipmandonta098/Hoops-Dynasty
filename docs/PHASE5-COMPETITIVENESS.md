# Hoops Dynasty — Phase 5 audit
Late-game timing, overtime, scoring covariance and competitive distribution. Completed 21 October 2026. Baseline: published Phase 4 commit 79e210a7e57059165c1808976e14eea1d7426965.

## Outcome
Phase 5 corrects confirmed ending-clock and overtime-integrity defects. It does NOT establish that the game is competitively balanced. Overall winning margins and 20+ point blowouts remain above the retained references. Three-point accuracy and opposing-score correlation remain unresolved. The full-season results below, including regressions, take precedence over small controlled samples. No shooting accuracy bonus, score cap, comeback boost, shared scoring multiplier, rating compression or predetermined margin was introduced.

The completed runs show essentially unchanged mean margins: NBA 14.75 → 14.77 and WNBA 12.75 → 12.79. Overtime rises only from 2.28% → 2.41% and 2.50% → 2.83%, with paired confidence intervals spanning no change. Games within five points fall from 23.04% → 20.02% in the NBA and 26.58% → 23.50% in the WNBA; NBA’s decline is clear across seeds. WNBA scoring rises 84.40 → 85.48 points per team, worsening its reference gap. The implementation is a timing/integrity correction, not a successful competitive-balance calibration.

## 1. Scope, reproducibility and preserved baseline
Ten independent complete NBA regular seasons (12,300 games) and ten WNBA regular seasons (2,400 games), seeds 101–110, reuse the previous fictional-roster setup and full-length 82/40-game team schedules. These are independent seasons, not a single 10-year career. Phase 4 files are retained byte-for-byte. Changed random-number consumption means a matched seed is a controlled initial-world comparison, not a guarantee of identical subsequent injuries, rotations or game randomness. Both phases use the same season sample definitions. No shortened-season substitution was used for the principal results.

Uncertainty: intervals are 95% Student-t intervals across ten season-level observations (9 degrees of freedom), including paired seed differences. They describe run-to-run variation in this fictional setup, not uncertainty about all possible leagues. Rare-event percentages and the 240-game WNBA reference require particular caution. A zero observed reference count is not a zero probability.

## 2A. NBA full-season results
Sample: 12,300 games in each phase; 297 Phase 5 overtime games; largest Phase 5 winning margin 72. Reference: 1,230 games.

| Metric | Phase 4 | Phase 5 | Change | Real reference |
| --- | --- | --- | --- | --- |
| Points/team | 112.58 | 112.82 | 0.23 | 113.83 |
| Mean winning margin | 14.75 | 14.77 | 0.02 | 12.75 |
| Median margin | 12.00 | 12.00 | 0.00 | 10.00 |
| 1–5 points (%) | 23.04 | 20.02 | -3.02 | 25.12 |
| 6–10 points (%) | 19.63 | 23.71 | 4.08 | 25.04 |
| Within 10 (%) | 42.67 | 43.72 | 1.06 | 50.16 |
| 20+ (%) | 28.73 | 28.20 | -0.53 | 21.06 |
| 30+ (%) | 10.71 | 10.19 | -0.52 | 6.50 |
| 40+ (%) | 3.30 | 2.74 | -0.56 | 1.79 |
| 50+ (%) | 0.68 | 0.53 | -0.15 | 0.41 |
| Overtime (%) | 2.28 | 2.41 | 0.14 | 4.88 |
| Home wins (%) | 55.54 | 55.23 | -0.32 | 54.47 |
| Three-point accuracy (%) | 33.52 | 33.61 | 0.09 | 36.02 |
| FG attempts/team | 88.87 | 88.70 | -0.17 | 89.24 |
| FT attempts/team | 19.45 | 19.95 | 0.49 | 21.67 |
| Offensive rebounds/team | 12.22 | 12.18 | -0.03 | 11.12 |
| Total turnovers/team | 13.74 | 13.73 | -0.01 | 14.30 |
| Estimated possessions/team | 98.96 | 99.03 | 0.07 | 101.95 |
| Estimated offensive rating | 113.77 | 113.93 | 0.16 | 111.64 |
| Spread MAE | 13.58 | 13.51 | -0.07 | Not measured |
| Spread RMSE | 17.04 | 16.81 | -0.23 | Not measured |
| Signed spread error | 0.03 | -0.12 | -0.14 | Not measured |

Percentage rows show percentage-point change, not relative percent change. Estimated possessions use FGA + 0.44 × FTA − ORB + team turnovers; estimated offensive rating is points per 100 of those possessions. These are consistent audit estimators, not official NBA pace or official possession tracking. Real spread-error benchmarks were not available.

| Metric | Phase 5 mean [95% CI] | Paired change [95% CI] |
| --- | --- | --- |
| meanMargin | 14.77 [14.46, 15.07] | 0.02 [-0.27, 0.31] |
| close10% | 43.72 [42.51, 44.94] | 1.06 [0.05, 2.07] |
| blow20 | 28.20 [27.03, 29.38] | -0.53 [-1.68, 0.63] |
| blow30 | 10.19 [9.17, 11.20] | -0.52 [-1.53, 0.49] |
| blow40 | 2.74 [2.38, 3.10] | -0.56 [-1.17, 0.05] |
| OT% | 2.41 [2.00, 2.83] | 0.14 [-0.40, 0.68] |
| 3P% | 33.61 [33.48, 33.74] | 0.10 [-0.09, 0.28] |
| homeWin% | 55.23 [54.18, 56.28] | -0.32 [-1.77, 1.13] |
| MAE | 13.51 [13.26, 13.75] | -0.07 [-0.31, 0.17] |
| scoreCorrelation | 0.11 [0.09, 0.13] | -0.00 [-0.03, 0.03] |
| teamVariance | 183.62 [177.06, 190.19] | -5.22 [-11.59, 1.15] |
| totalVariance | 405.05 [389.36, 420.74] | -12.51 [-31.67, 6.65] |
| marginVariance | 323.64 [309.79, 337.48] | -7.64 [-22.27, 6.99] |

## 2B. WNBA full-season results
Sample: 2,400 games in each phase; 68 Phase 5 overtime games; largest Phase 5 winning margin 56. Reference: 240 games.

| Metric | Phase 4 | Phase 5 | Change | Real reference |
| --- | --- | --- | --- | --- |
| Points/team | 84.40 | 85.48 | 1.07 | 81.67 |
| Mean winning margin | 12.75 | 12.79 | 0.04 | 10.82 |
| Median margin | 11.00 | 10.00 | -1.00 | 9.00 |
| 1–5 points (%) | 26.58 | 23.50 | -3.08 | 25.42 |
| 6–10 points (%) | 21.83 | 26.62 | 4.79 | 27.50 |
| Within 10 (%) | 48.42 | 50.12 | 1.71 | 52.92 |
| 20+ (%) | 22.50 | 20.54 | -1.96 | 9.17 |
| 30+ (%) | 5.67 | 5.83 | 0.17 | 2.92 |
| 40+ (%) | 0.83 | 1.17 | 0.33 | 0.00 |
| 50+ (%) | 0.04 | 0.17 | 0.12 | 0.00 |
| Overtime (%) | 2.50 | 2.83 | 0.33 | 3.33 |
| Home wins (%) | 53.87 | 55.62 | 1.75 | 52.50 |
| Three-point accuracy (%) | 31.07 | 31.05 | -0.02 | 33.82 |
| FG attempts/team | 71.36 | 71.81 | 0.45 | 68.25 |
| FT attempts/team | 16.37 | 17.30 | 0.93 | 18.03 |
| Offensive rebounds/team | 9.92 | 10.11 | 0.19 | 8.20 |
| Total turnovers/team | 12.28 | 12.35 | 0.07 | 14.27 |
| Estimated possessions/team | 80.92 | 81.66 | 0.74 | 82.25 |
| Estimated offensive rating | 104.30 | 104.67 | 0.37 | 99.29 |
| Spread MAE | 11.85 | 11.61 | -0.24 | Not measured |
| Spread RMSE | 14.73 | 14.45 | -0.27 | Not measured |
| Signed spread error | -0.82 | -0.21 | 0.61 | Not measured |

Percentage rows show percentage-point change, not relative percent change. Estimated possessions use FGA + 0.44 × FTA − ORB + team turnovers; estimated offensive rating is points per 100 of those possessions. These are consistent audit estimators, not official NBA pace or official possession tracking. Real spread-error benchmarks were not available.

| Metric | Phase 5 mean [95% CI] | Paired change [95% CI] |
| --- | --- | --- |
| meanMargin | 12.79 [12.31, 13.27] | 0.04 [-0.76, 0.84] |
| close10% | 50.12 [48.57, 51.68] | 1.71 [-1.67, 5.09] |
| blow20 | 20.54 [18.75, 22.33] | -1.96 [-4.41, 0.50] |
| blow30 | 5.83 [4.34, 7.33] | 0.17 [-2.06, 2.39] |
| blow40 | 1.17 [0.68, 1.65] | 0.33 [-0.41, 1.07] |
| OT% | 2.83 [2.39, 3.27] | 0.33 [-0.82, 1.49] |
| 3P% | 31.05 [30.77, 31.34] | -0.02 [-0.43, 0.39] |
| homeWin% | 55.62 [53.25, 58.00] | 1.75 [-2.21, 5.71] |
| MAE | 11.61 [11.21, 12.01] | -0.24 [-0.79, 0.31] |
| scoreCorrelation | 0.10 [0.05, 0.16] | 0.02 [-0.07, 0.11] |
| teamVariance | 135.18 [129.34, 141.02] | 0.58 [-6.75, 7.91] |
| totalVariance | 294.92 [275.65, 314.19] | 5.22 [-23.19, 33.63] |
| marginVariance | 239.45 [221.50, 257.40] | -5.21 [-32.46, 22.05] |

## 3. Confirmed timing and overtime findings
The old loop did enter overtime when regulation ended tied. Low overtime frequency was therefore not explained by a missing ordinary tie check. However, after ten tied overtime periods it awarded a randomly chosen deciding free throw. That hidden resolution was a real defect, although too rare to explain the baseline frequency gap. It has been removed. Each overtime now resets the jump ball and uses ordinary basketball scoring. A pathological failure to resolve after 100 overtime periods raises an explicit error and awards no winner.

The old fixed-window logger could compress a multi-action possession into its assigned display window. Actions consumed more modeled time than their window allowed, and offensive rebounds followed by scoring could share the window-end timestamp. This made the end-of-game chronology unreliable even where points and box totals agreed. Baseline instrumented evidence:

| League | Controlled full games | Late windows | Action-duration overruns | Window-end ORB then score |
| --- | --- | --- | --- | --- |
| NBA | 200 | 1932 | 103 | 23 |
| WNBA | 200 | 1672 | 84 | 12 |

The smallest implemented timing boundary is the final two minutes of regulation and of every overtime. Earlier regulation and early overtime retain fixed windows. This does not repair every earlier quarter-ending approximation. The live ending advances action time before resolving events, stops for free throws, expires actions that cannot finish before the buzzer, and charges rebound time before allowing a second chance. It permits a shot resolving exactly at the boundary but rejects later actions. Final-period labels were also corrected; twenty identical-seed comparisons confirmed that this display correction left scores, boxes and summary scoring unchanged.

These findings establish defects in chronology, not proof that fixed windows caused all excess blowouts or the whole overtime shortfall. No full elapsed-time engine rewrite was performed.

## 4. Late decisions, tying opportunities and intentional fouls
The previous engine lacked a dedicated deficit-sensitive final-shot and intentional-foul path. The new policy reuses the existing player selection, turnovers, contests, shooting, foul, rebound and stat resolvers. A team down three seeks a three when 12 seconds or fewer remain; a team down 3–9 does so with five seconds or fewer. Other short-clock attempts retain ordinary shot selection. There is no special accuracy bonus for tying shots; urgent pull-up threes retain the existing −0.035 shot adjustment.

Possession setup is a declared simulation assumption: roughly 3–8 seconds ordinarily, two seconds for urgent trailing possessions in the last minute, one for transition, followed by existing action durations. A short-clock direct shot takes up to three seconds; modeled rebound recovery takes one second. These constants are not estimates fitted from tracking data. Sub-0.3-second ordinary catch-and-shoot attempts are not generated; tip-only special plays are not modeled.

Intentional-foul eligibility is conditional: the defense trails by 1–8, more than one and at most 35 seconds remain. Within one shot clock the base chance is 0.88 for a 1–6-point deficit and 0.55 for 7–8; outside that range it is 0.50 for deficits of at least four and 0.12 otherwise. Coaching scales this by 0.75 + tactics/200, capped at 0.96. These transparent initial policy assumptions are not claimed to be empirically calibrated hazards. A foul takes up to two seconds and uses normal personal/team foul accounting, bonus free throws and possession retention.

If the offense leads and can legally run out the remaining shot clock, and the defense does not foul, the engine permits clock expiration. This is a simplified concession/ball-protection branch; it does not separately model a turnover hazard during the dribble-out. There is no optimization to foul the weakest free-throw shooter, no newly implemented leading-by-three defensive foul policy, no advance-the-ball timeout action, and no complete historical timeout-budget reconstruction. Existing run-stopping timeout logic remains. These limitations can affect close-game margins and overtime.

For modern (2023 onward) standard five-team-foul configurations, the second foul in the last two minutes triggers the penalty and overtime uses a four-team-foul threshold. Earlier/custom configurations retain their existing configured bonus rules; this is not a claim of fully verified historical bonus-rule modeling.

## 5. Controlled experiments
Each row below uses 200 complete games with repeated matchup fixtures and consistent seeds. “No fouling” removes the new intentional-foul policy; “no choice” restores the old shot-choice path; “timing only” removes both and the clock-runout branch. Identical-roster tests equalize rosters, coaches and rest and neutralize home effects. These are diagnostic experiments, not additional full seasons. Small overtime counts have wide uncertainty.

| League / experiment | N | Points/team | Mean margin | Signed-margin SD | Within 10 % | 20+ % | 30+ % | 40+ % | OT % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NBA baseline | 200 | 112.42 | 14.38 | 16.56 | 40.00 | 28.00 | 7.00 | 3.50 | 1.50 |
| NBA candidate | 200 | 112.22 | 14.71 | 16.92 | 39.50 | 28.50 | 10.00 | 2.00 | 2.00 |
| NBA no-fouling | 200 | 111.69 | 14.45 | 16.84 | 39.50 | 28.50 | 10.00 | 2.00 | 1.50 |
| NBA no-choice | 200 | 112.08 | 14.95 | 17.00 | 38.00 | 28.50 | 10.50 | 2.00 | 2.50 |
| NBA timing-only | 200 | 112.26 | 15.15 | 17.22 | 36.50 | 29.50 | 10.00 | 2.00 | 3.50 |
| NBA baseline-identical | 200 | 111.68 | 12.97 | 15.98 | 48.00 | 22.00 | 6.00 | 1.50 | 1.50 |
| NBA candidate-identical | 200 | 112.49 | 13.28 | 15.92 | 44.00 | 22.50 | 6.50 | 1.00 | 4.50 |
| WNBA baseline | 200 | 86.77 | 14.93 | 18.44 | 44.50 | 31.00 | 13.50 | 3.00 | 0.00 |
| WNBA candidate | 200 | 87.63 | 14.30 | 17.72 | 46.00 | 24.00 | 8.50 | 3.50 | 1.50 |
| WNBA no-fouling | 200 | 87.16 | 13.94 | 17.60 | 46.00 | 24.00 | 8.50 | 3.50 | 1.50 |
| WNBA no-choice | 200 | 87.78 | 14.40 | 17.76 | 45.50 | 24.00 | 8.50 | 3.50 | 3.00 |
| WNBA timing-only | 200 | 87.66 | 14.31 | 17.90 | 43.50 | 25.00 | 10.50 | 4.00 | 2.50 |
| WNBA baseline-identical | 200 | 85.73 | 11.66 | 14.60 | 52.00 | 15.50 | 5.00 | 1.00 | 3.50 |
| WNBA candidate-identical | 200 | 87.87 | 11.51 | 14.11 | 55.00 | 14.50 | 5.00 | 0.00 | 6.00 |

Identical teams still produce a broad distribution; late timing is not the sole source of margin variance. Differences among 200-game policy variants do not identify a statistically established optimum. The full-season before/after comparison is the release audit; no variant was chosen simply because it happened to generate more overtime.

## 6. End-state fixtures and overtime integrity
For each league, 21 synthetic starting-score scenarios × 80 seeds cover ties, deficits of 1/2/3 at 60/30/15/5 seconds, the requested leading/trailing examples, rebounds, missed free throws and regulation ending tied. Half the trials lower three-point skill by 12 points to test player differentiation. The initial ball is explicitly given to the tested offense; these are not estimates of real-game possession availability. Artificial starting scores make these timing fixtures unsuitable as full-game box-score samples.

| League | Case | Offense margin | Seconds | N | Recorded FG actions/trial | OT % | ORBs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NBA | A | 0 | 30 | 80 | 1.56 | 27.50 | 19 |
| NBA | B | -1 | 20 | 80 | 1.31 | 11.25 | 24 |
| NBA | C | -2 | 10 | 80 | 0.94 | 22.50 | 11 |
| NBA | D | -3 | 15 | 80 | 0.95 | 7.50 | 10 |
| NBA | E | 2 | 30 | 80 | 1.20 | 8.75 | 21 |
| NBA | F | 3 | 10 | 80 | 0.66 | 2.50 | 1 |
| NBA | G | -2 | 5 | 80 | 1.64 | 16.25 | 80 |
| NBA | H | -1 | 3 | 80 | 0.64 | 3.75 | 80 |
| NBA | I | 0 | 0 | 80 | 0.00 | 100.00 | 0 |
| NBA | down1-60 | -1 | 60 | 80 | 2.83 | 17.50 | 58 |
| NBA | down1-30 | -1 | 30 | 80 | 1.66 | 8.75 | 23 |
| NBA | down1-15 | -1 | 15 | 80 | 0.97 | 7.50 | 10 |
| NBA | down1-5 | -1 | 5 | 80 | 0.74 | 2.50 | 0 |
| NBA | down2-60 | -2 | 60 | 80 | 2.88 | 17.50 | 49 |
| NBA | down2-30 | -2 | 30 | 80 | 1.64 | 27.50 | 24 |
| NBA | down2-15 | -2 | 15 | 80 | 0.96 | 32.50 | 10 |
| NBA | down2-5 | -2 | 5 | 80 | 0.74 | 23.75 | 0 |
| NBA | down3-60 | -3 | 60 | 80 | 2.94 | 13.75 | 52 |
| NBA | down3-30 | -3 | 30 | 80 | 1.71 | 13.75 | 22 |
| NBA | down3-15 | -3 | 15 | 80 | 0.95 | 7.50 | 10 |
| NBA | down3-5 | -3 | 5 | 80 | 0.81 | 12.50 | 0 |
| WNBA | A | 0 | 30 | 80 | 1.34 | 35.00 | 21 |
| WNBA | B | -1 | 20 | 80 | 1.18 | 8.75 | 17 |
| WNBA | C | -2 | 10 | 80 | 0.81 | 17.50 | 9 |
| WNBA | D | -3 | 15 | 80 | 0.88 | 6.25 | 9 |
| WNBA | E | 2 | 30 | 80 | 1.12 | 13.75 | 20 |
| WNBA | F | 3 | 10 | 80 | 0.60 | 3.75 | 2 |
| WNBA | G | -2 | 5 | 80 | 1.70 | 27.50 | 80 |
| WNBA | H | -1 | 3 | 80 | 0.70 | 0.00 | 80 |
| WNBA | I | 0 | 0 | 80 | 0.00 | 100.00 | 0 |
| WNBA | down1-60 | -1 | 60 | 80 | 2.98 | 16.25 | 61 |
| WNBA | down1-30 | -1 | 30 | 80 | 1.60 | 12.50 | 23 |
| WNBA | down1-15 | -1 | 15 | 80 | 0.91 | 6.25 | 9 |
| WNBA | down1-5 | -1 | 5 | 80 | 0.64 | 1.25 | 0 |
| WNBA | down2-60 | -2 | 60 | 80 | 3.04 | 15.00 | 64 |
| WNBA | down2-30 | -2 | 30 | 80 | 1.65 | 25.00 | 22 |
| WNBA | down2-15 | -2 | 15 | 80 | 0.89 | 22.50 | 9 |
| WNBA | down2-5 | -2 | 5 | 80 | 0.64 | 18.75 | 0 |
| WNBA | down3-60 | -3 | 60 | 80 | 3.01 | 7.50 | 64 |
| WNBA | down3-30 | -3 | 30 | 80 | 1.71 | 23.75 | 27 |
| WNBA | down3-15 | -3 | 15 | 80 | 0.88 | 6.25 | 9 |
| WNBA | down3-5 | -3 | 5 | 80 | 0.69 | 21.25 | 0 |

Recorded FG actions in the general fixture count made/missed shot events and exclude blocked-shot events; do not read them as official FGA or shooting conversion rates. Focused G/H reruns start the forced miss/free throw at the stated clock without pre-possession setup, then reuse ordinary rebound/shot resolution; their attempt field uses instrumented FGA. G/H involve a forced first offensive rebound to test legal continuation, not a natural rebounding-frequency estimate. Every captured ending event is checked for monotonic time and the period boundary. The down-three/five-second case verifies that its first recorded field-goal attempt is a three when an attempt occurs. Case I always enters overtime.

Additional degeneracy tests suppress scoring for regulation plus ten overtimes, then restore ordinary accuracy. Both leagues continued to a legal winner beyond the former cap, accumulated overtime minutes and accepted their summary data. Synthetic game-winner, tying-shot, block/steal, clinching and live-prefix checks, plus forty actual games, verified existing Player Feat provenance and publication idempotence. No guarantee of overtime success or a made tying shot is encoded.

## 7. Scoring covariance and variance decomposition
### NBA
| Metric | Phase 4 | Phase 5 |
| --- | --- | --- |
| scoreCorrelation | 0.12 | 0.11 |
| scoreCovariance | 21.69 | 20.44 |
| teamVariance | 189.00 | 183.74 |
| totalVariance | 418.18 | 405.52 |
| marginVariance | 331.43 | 323.77 |
| possCorrelation | 1.00 | 0.98 |
| estimatedPossessionsCorrelation | 0.96 | 0.95 |
| fgaCorrelation | 0.29 | 0.31 |
| ftaCorrelation | 0.03 | 0.02 |
| orbCorrelation | -0.07 | -0.05 |
| totalTurnoversCorrelation | -0.00 | -0.02 |
| efficiencyCorrelation | -0.05 | -0.07 |
| sharedEstimatedPaceVariance | 24.08 | 23.81 |
| q1Correlation | 0.04 | 0.04 |
| q2Correlation | 0.04 | 0.05 |
| q3Correlation | 0.06 | 0.06 |
| q4Correlation | 0.07 | 0.08 |

| Exact algebraic margin-variance component | Phase 4 | Phase 5 |
| --- | --- | --- |
| unequalPossessionComponentVariance | 2.40 | 2.99 |
| efficiencyDifferenceComponentVariance | 326.45 | 334.10 |
| twiceComponentCovariance | 2.58 | -13.32 |

### WNBA
| Metric | Phase 4 | Phase 5 |
| --- | --- | --- |
| scoreCorrelation | 0.08 | 0.10 |
| scoreCovariance | 11.29 | 13.80 |
| teamVariance | 134.93 | 135.38 |
| totalVariance | 291.02 | 295.72 |
| marginVariance | 245.86 | 240.50 |
| possCorrelation | 0.99 | 0.98 |
| estimatedPossessionsCorrelation | 0.96 | 0.95 |
| fgaCorrelation | 0.23 | 0.19 |
| ftaCorrelation | 0.04 | 0.04 |
| orbCorrelation | -0.07 | -0.14 |
| totalTurnoversCorrelation | 0.03 | -0.01 |
| efficiencyCorrelation | -0.02 | -0.05 |
| sharedEstimatedPaceVariance | 15.63 | 16.31 |
| q1Correlation | 0.03 | 0.00 |
| q2Correlation | 0.02 | 0.03 |
| q3Correlation | 0.04 | 0.07 |
| q4Correlation | 0.03 | 0.06 |

| Exact algebraic margin-variance component | Phase 4 | Phase 5 |
| --- | --- | --- |
| unequalPossessionComponentVariance | 1.46 | 2.02 |
| efficiencyDifferenceComponentVariance | 244.86 | 252.14 |
| twiceComponentCovariance | -0.46 | -13.66 |

Variances use points squared and population denominators; team variance pools home and away team scores. Margin variance obeys Var(H−A)=Var(H)+Var(A)−2Cov(H,A), verified numerically. With P=(P_H+P_A)/2, D=(P_H−P_A)/2 and R=points/estimated possessions, H−A=P(R_H−R_A)+D(R_H+R_A). The component variances and covariance sum exactly; this is descriptive algebra, not causal attribution. Offensive rebounds, turnovers and free throws enter the possession estimator and therefore cannot be assigned independent causal shares from this identity.

Raw possession counts are already highly shared. Weak final-score correlation therefore cannot be diagnosed as absent shared pace alone. Efficiency differences dominate the descriptive margin decomposition; roster quality, shot outcomes, opponent interactions and stochastic variation are still mixed in that component. No artificial common scoring shock was added. Real retained score correlations are 0.217 (NBA 2024–25), 0.254 (NBA 2023–24), 0.276 (WNBA 2024), and 0.226 (WNBA 2023). The revised engine remains below these.

## 8. When games stop being competitive
### NBA
| Metric | Phase 4 | Phase 5 |
| --- | --- | --- |
| marginAfter2 | 10.05 | 10.09 |
| marginAfter3 | 12.52 | 12.68 |
| q4Already20% | 21.75 | 22.11 |
| q4Close5% | 27.78 | 27.09 |
| Q4trailerWins% | 14.25 | 14.00 |
| meanLeadChanges | 6.27 | 6.25 |
| within5Final120% | Not measured | 33.33 |
| tiedFinal60% | Not measured | 7.89 |

### WNBA
| Metric | Phase 4 | Phase 5 |
| --- | --- | --- |
| marginAfter2 | 8.62 | 8.80 |
| marginAfter3 | 10.84 | 10.77 |
| q4Already20% | 15.62 | 14.50 |
| q4Close5% | 32.50 | 31.58 |
| Q4trailerWins% | 15.29 | 15.50 |
| meanLeadChanges | 5.21 | 5.34 |
| within5Final120% | Not measured | 38.00 |
| tiedFinal60% | Not measured | 9.00 |

A material share of games is already separated by 20 at fourth-quarter entry. Final-two-minute changes cannot directly repair those earlier possessions. Across different season runs, later rosters and RNG paths can change earlier-quarter aggregates, so their between-phase changes are not direct effects of late-clock logic.

## 9. Official play-by-play comparison
Downloaded and retained 40 NBA 2024–25 and 40 WNBA 2024 official play-by-play files, selecting evenly spaced sorted regular-season game IDs without conditioning on score. Every final total was checked against retained official game logs. A neutral-site NBA Cup game labels both clubs away in the logs; its unordered final totals were checked and PBP home/away orientation retained. This is a small systematic sample, not a random league-wide PBP census. It provides context, not tight calibration targets.

| League | N | Within 5 in last 2m % | Within 3 in last 1m % | Tied in last 1m % | Regulation tied % | 20+ entering Q4 % |
| --- | --- | --- | --- | --- | --- | --- |
| NBA | 40 | 47.50 | 40.00 | 10.00 | 5.00 | 10.00 |
| WNBA | 40 | 45.00 | 42.50 | 7.50 | 2.50 | 15.00 |

The real deficit/time checkpoint groups are retained in real-pbp-analysis.json. Most cells contain very few games and do not isolate which team possessed the ball. They cannot validate precise tying-shot conversion or possession-availability rates against the controlled offense-starts-with-ball fixtures. That requested empirical comparison remains incomplete; no unsupported probability correction was made from it.

## 10. Three-point accuracy
Primary shot-decision instrumentation separates open, contested, assisted, self-created and late-clock threes. Categories overlap. Values below are pre-final-home/clamp model probabilities at the decision stage, including decisions subsequently fouled; they are NOT observed shooting percentages and exclude secondary-shot decisions.

| League / decision group | N | Mean modeled probability % | Mean shooter skill | Mean defender skill | Mean fatigue fraction | Mean shot adjustment |
| --- | --- | --- | --- | --- | --- | --- |
| NBA open | 8199 | 34.90 | 79.99 | 73.06 | 0.17 | 0.0082 |
| NBA contested | 1626 | 25.66 | 80.75 | 76.84 | 0.16 | -0.0004 |
| NBA assisted | 11888 | 34.02 | 79.92 | 72.43 | 0.17 | 0.0091 |
| NBA selfCreated | 1796 | 29.86 | 80.39 | 72.38 | 0.14 | -0.0350 |
| NBA lateClock | 88 | 32.06 | 81.47 | 74.08 | 0.21 | 0.0072 |
| WNBA open | 6236 | 35.67 | 82.60 | 73.63 | 0.18 | 0.0093 |
| WNBA contested | 1112 | 26.76 | 82.72 | 74.84 | 0.18 | -0.0000 |
| WNBA assisted | 9112 | 34.58 | 82.41 | 73.71 | 0.18 | 0.0088 |
| WNBA selfCreated | 1461 | 30.45 | 81.76 | 72.49 | 0.17 | -0.0350 |
| WNBA lateClock | 76 | 31.91 | 83.31 | 75.45 | 0.17 | 0.0041 |

Open/assisted attempts remain more favorable than contested/self-created attempts. The audit did not confirm a new three-point arithmetic defect that justified changing accuracy globally. Remaining differences may involve roster skill, attempt mix, fatigue, contests and league priors. Pull-up urgency is a legitimate shot-selection cost, not a tying bonus. Distance/transition/catch-and-shoot taxonomy is not comprehensively independently tagged in this audit. The gap remains unresolved.

## 11. Files and calculation changes
| Production file | Change |
| --- | --- |
| dist/attributes.js | Final-two-minute action clock, conditional fouls/clock management, legal rebound timing, overtime continuation and jump ball reset, modern bonus handling, final-period clock labels. |
| dist/late-game.js (new) | Transparent timing/intentional-foul policy and deficit-sensitive final-shot selection; wraps the existing possession resolver. |
| dist/possession-engine.js | Optional live-clock advancement hook and legal period-expiration finish. |
| dist/index.html | Loads late-game integration after the existing possession wrappers; refreshes changed script cache keys. |

New developer artifacts include audit-phase5-season.cjs, phase5-instrument.cjs, phase5-diagnostics.cjs, phase5-analysis.py, phase5-fetch-reference.py, phase5-historical*.cjs, test-phase5-*.cjs, run-phase5-*.cjs, verify-phase5.py and this report generator. Raw full-season outputs remain in dev/balance-audit/phase5-*.json; controlled data, references, frozen baseline source, manifests and summaries are in dev/phase5/. No new player/save fields or competing game engine were introduced.

## 12. Historical and save/load verification
NBA 1997/2025 and WNBA 1997/2006/2024: thirty full-length games per configuration passed nonnegative-stat, shot-count, scoring-total, period-format and winner checks. A second thirty-game pass per configuration added accumulated-minute and monotonic summary-time checks. Historical plans supply game/period/shot-clock/OT settings. These fictional-roster tests demonstrate format compatibility, not statistically verified historical realism. Earlier WNBA formats retain their historical period structure.

A save created under the frozen Phase 4 engine was loaded under Phase 5: completed scores, player boxes and summary events were unchanged. Current production day progression, save/load and repeated finalization passed. Forty actual games plus synthetic feat checks preserved summary/box/PBP scoring provenance. All twenty full-season outputs were independently checked for exact scheduled counts, 82/40 games per team, scoring identities, period sums, legal shot totals, overtime ties and accumulated court minutes. Baseline files and custom city photographs were hash-checked, excluding only the three intentionally edited pre-existing production files.

The existing summary reader has a 20-period / 3,000-scoring-event limit. Tested eleven-plus-overtime records fit it; extremely pathological games beyond that legacy reader bound are not covered by the save guarantee. This is a disclosed remaining limitation, not a silent forced winner. Existing lineup-unavailable forfeit handling was not changed.

## 13. Remaining limitations and next evidence needed
1. Low NBA overtime frequency is not solved. The ordinary OT trigger was already correct; realistic timing alone does not establish a realistic tie probability.
2. Excess blowouts, weak opposing-score correlation and the three-point gap remain. The full-season tables must not be described as complete calibration success.
3. Earlier quarters retain fixed windows. The last-two-minute duration assumptions, dribble-out branch and foul policy need larger event-level validation.
4. No full timeout/advance-ball model, optimal foul target or leading-by-three defensive fouling was added.
5. Real PBP sample size and lack of reconstructed possession availability prevent a defensible cell-by-cell late-shot conversion benchmark.
6. Variance decomposition is descriptive; it does not separate causal roster, coaching, shooting, rebound and turnover effects.
7. Historical bonus, timeout and sub-second tip rules are not comprehensively reconstructed. Historical format tests are not historical distribution calibration.
8. Persistent records at extreme overtime counts remain subject to legacy summary limits.

The next useful investigation is efficiency variance and roster-conditioned outcome distributions before the final two minutes, together with a larger possession-reconstructed real PBP sample for foul/clock-runout policies. Improving predictions or increasing OT in a small fixture would not, by itself, resolve competitive balance.

## 14. Sources and reproduction
- Official NBA scoring/timing: https://official.nba.com/rule-no-5-scoring-and-timing/
- Official NBA fouls/penalties: https://official.nba.com/rule-no-12-fouls-and-penalties/
- Official NBA shot clock: https://official.nba.com/rule-no-7-24-second-clock/
- Official WNBA 2024 rule book: https://cdn.wnba.com/sites/4/2024/05/2024-WNBA-Rule-Book-FINAL.pdf
- NBA official PBP: https://stats.nba.com/stats/playbyplayv3?GameID=<ID>&StartPeriod=0&EndPeriod=0
- WNBA official PBP: https://cdn.wnba.com/static/json/liveData/playbyplay/playbyplay_<ID>.json
- Retained league-game-log sources and additional reference-season analysis: dev/phase3/real-*.json and dev/phase4/reference-analysis.json. Fetch URLs/failures and game IDs are retained in dev/phase5/reference-pbp-fetch.json.

Reproduction from project root: node dev/run-phase5-seasons.cjs (reuses completed outputs); python dev/phase5-analysis.py; python dev/verify-phase5.py; python dev/report-phase5.py. Controlled scripts and seeds are retained. Preserve the archived results before intentionally rerunning/overwriting an output. All reported simulation results were actually executed; unavailable measurements are marked rather than inferred.

