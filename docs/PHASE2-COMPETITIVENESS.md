# Hoops Dynasty — Phase 2 possession and competitiveness audit

## Outcome

The possession corrections reduce scoring volume. They do not complete competitive-balance calibration. No blanket shooting reduction or spread widening was used.

- NBA: points/team 119.47 → 115.35; FGA 95.10 → 89.80; mean margin 15.73 → 15.55; 20+ margins 32.12% → 31.39% (reference 21.06%).
- WNBA: points/team 92.81 → 86.88; FGA 79.15 → 72.37; mean margin 13.72 → 13.47; 20+ margins 25.67% → 24.67% (reference 9.17%).

The remaining excessive margin variance has not been traced to one confirmed defect. Equal-roster and rested-game results show that fatigue alone is not an adequate explanation. The engine still compresses possessions into fixed clock windows, lacks complete secondary-shot foul/turnover paths, and needs further shot-location foul and efficiency calibration. Historical format compatibility passed; historical statistical balance is not established by the small fixtures.

Baseline: commit 48d22fc668ff4c06c445bfcf119f025fffb335fe, preserved secondary-* files, seeds 101–110. All measurements below come from completed runs. Fictional rosters; independent full regular seasons, not consecutive career years or verified historical rosters. Identical starting seeds preserve reproducibility, but changed random branches naturally lead to different later injuries, morale and game states; the separate controlled fixtures reset state for every matchup.

## NBA

Rate rows are percentages; Change % is relative change, not percentage-point change. FGp10/FGp90 describe the distribution of individual team-game shooting percentages.

| Metric | Baseline | Revised | Change % | Reference |
|---|---:|---:|---:|---:|
| Games | 12300.00 | 12300.00 | 0.00 | 1230.00 |
| Points per team | 119.47 | 115.35 | -3.44 | 113.83 |
| Mean winning margin | 15.73 | 15.55 | -1.11 | 12.74 |
| Median winning margin | 13.00 | 13.00 | 0.00 | 10.00 |
| Largest margin | 82.00 | 74.00 | -9.76 | 59.00 |
| Engine slots per team | 100.97 | 98.35 | -2.59 | Unavailable |
| FGA per team | 95.10 | 89.80 | -5.58 | 89.20 |
| FTA per team | 17.84 | 19.89 | 11.45 | 21.70 |
| Offensive rebounds per team | 12.70 | 12.06 | -5.00 | 11.10 |
| Player-box turnovers per team | 12.74 | 13.64 | 7.01 | Unavailable |
| Personal fouls per team | 12.09 | 17.93 | 48.28 | 18.60 |
| FG% | 48.82 | 48.95 | 0.26 | 46.70 |
| 3P% | 34.72 | 34.81 | 0.27 | 36.00 |
| FT% | 77.70 | 77.53 | -0.22 | 78.00 |
| eFG% | 55.52 | 55.64 | 0.23 | 54.32 |
| TS% | 58.02 | 58.53 | 0.87 | 57.64 |
| Points per 100 engine slots | 118.32 | 117.28 | -0.88 | Unavailable |
| Spread mean absolute error | 14.31 | 14.18 | -0.91 | Unavailable |
| Spread signed error (home bias) | 2.16 | 1.83 | -15.56 | Unavailable |
| Spread root mean squared error | 17.95 | 17.73 | -1.24 | Unavailable |
| Spread residual standard deviation | 17.82 | 17.64 | -1.05 | Unavailable |
| Overtime games % | 2.01 | 1.86 | -7.29 | Unavailable |
| Home win % | 60.02 | 59.03 | -1.65 | 54.39 |
| 1–5 point games % | 20.88 | 21.15 | 1.32 | 25.12 |
| 6–10 point games % | 19.43 | 19.09 | -1.76 | 25.04 |
| 11–19 point games % | 27.57 | 28.37 | 2.89 | 28.78 |
| 20–29 point games % | 19.24 | 19.07 | -0.89 | 14.55 |
| 30–39 point games % | 8.54 | 8.35 | -2.19 | 4.72 |
| 40–49 point games % | 3.23 | 2.88 | -10.83 | 1.38 |
| 50+ point games % | 1.11 | 1.09 | -2.19 | 0.41 |
| 20+ point margins % | 32.12 | 31.39 | -2.28 | 21.06 |
| 30+ point margins % | 12.88 | 12.32 | -4.36 | 6.51 |
| 40+ point margins % | 4.34 | 3.97 | -8.61 | 1.79 |
| 50+ point margins % | 1.11 | 1.09 | -2.19 | 0.41 |
| Actual margin / strength-gap regression slope | 1.67 | 1.70 | 2.00 | Unavailable |
| Strength regression home intercept | 4.67 | 4.33 | -7.27 | Unavailable |
| Actual / predicted margin regression slope | 1.39 | 1.42 | 1.88 | Unavailable |
| Prediction regression home intercept | 1.19 | 0.78 | -33.98 | Unavailable |
| Higher pregame-strength team win % | 61.91 | 62.36 | 0.72 | Unavailable |
| Team scoring standard deviation | 14.30 | 14.18 | -0.86 | Unavailable |
| FGp10% | 42.05 | 41.94 | -0.26 | Unavailable |
| FGp90% | 55.79 | 56.10 | 0.55 | Unavailable |
| 2P% | 57.68 | 57.79 | 0.18 | 54.50 |
| 3PAshare% | 38.58 | 38.46 | -0.30 | 42.15 |
| ORB share of credited rebounds % | 25.32 | 25.35 | 0.10 | Unavailable |
| Engine slots per 48 minutes | 100.75 | 98.15 | -2.58 | Unavailable |
| Combined game score | 238.93 | 230.70 | -3.44 | 227.65 |
| Mean lead changes | 6.46 | 6.27 | -2.87 | Unavailable |
| Mean margin entering Q4 | 13.24 | 13.12 | -0.89 | Unavailable |
| Q4 trailing team eventually wins % | 13.31 | 14.06 | 5.61 | Unavailable |
| Bench points per team | 47.00 | 47.02 | 0.05 | Unavailable |
| Absolute spread error 40+ % | 2.65 | 2.64 | -0.31 | Unavailable |
| Total team turnovers per team | Unavailable | 13.77 | Unavailable | 14.30 |
| Team-only turnovers per team | Unavailable | 0.13 | Unavailable | Unavailable |
| Estimated possessions per team | Unavailable | 100.26 | Unavailable | Unavailable |
| Points per 100 estimated possessions | Unavailable | 115.06 | Unavailable | Unavailable |

Full-season baseline total team turnovers were not retained in the old audit. Its player-box totals are shown separately; revised total turnovers include team-only violations. The separately traced baseline sample supplies the missing distinction without inventing full-season totals. Raw possessions are scheduled engine slots; estimated possessions are FGA − ORB + total TOV + 0.44 FTA. Neither is presented as identical to an official pace estimator.

### Run-to-run uncertainty

| Metric | Revised mean across seeds | Approx. 95% interval for seed mean | Seed range |
|---|---:|---:|---:|
| Points per team | 115.35 | 114.99–115.71 | 114.73–116.00 |
| Mean winning margin | 15.55 | 15.28–15.83 | 14.75–16.06 |
| 20+ point margins % | 31.39 | 30.53–32.25 | 29.27–33.01 |
| 30+ point margins % | 12.32 | 11.75–12.89 | 10.98–13.90 |
| 40+ point margins % | 3.97 | 3.29–4.64 | 2.44–5.28 |
| 50+ point margins % | 1.09 | 0.84–1.34 | 0.57–1.71 |

Intervals use ten independently seeded seasons, not an assumption that games within a season are independent. Rare tails remain uncertain.

### Spread calibration by predicted home margin

| Predicted home margin | Games | Actual mean margin | Signed error | MAE | RMSE | Home win % |
|---|---:|---:|---:|---:|---:|---:|
| -100 to -10 | 34 | -16.41 | -4.99 | 14.28 | 18.25 | 20.59 |
| -10 to -5 | 651 | -8.98 | -2.04 | 13.71 | 17.28 | 30.26 |
| -5 to 0 | 2879 | -2.54 | -0.19 | 13.95 | 17.46 | 44.15 |
| 0 to 5 | 4727 | 3.76 | 1.48 | 14.25 | 17.77 | 57.94 |
| 5 to 10 | 3181 | 11.09 | 4.20 | 14.51 | 18.05 | 73.69 |
| 10 to 100 | 828 | 16.81 | 5.00 | 13.74 | 17.57 | 84.90 |

## WNBA

Rate rows are percentages; Change % is relative change, not percentage-point change. FGp10/FGp90 describe the distribution of individual team-game shooting percentages.

| Metric | Baseline | Revised | Change % | Reference |
|---|---:|---:|---:|---:|
| Games | 2400.00 | 2400.00 | 0.00 | 240.00 |
| Points per team | 92.81 | 86.88 | -6.39 | 81.67 |
| Mean winning margin | 13.72 | 13.47 | -1.81 | 10.82 |
| Median winning margin | 12.00 | 11.00 | -8.33 | 9.00 |
| Largest margin | 74.00 | 61.00 | -17.57 | 36.00 |
| Engine slots per team | 83.08 | 80.81 | -2.73 | Unavailable |
| FGA per team | 79.15 | 72.37 | -8.56 | 68.30 |
| FTA per team | 15.18 | 16.91 | 11.39 | 18.00 |
| Offensive rebounds per team | 11.23 | 9.87 | -12.09 | 8.20 |
| Player-box turnovers per team | 9.98 | 12.11 | 21.36 | Unavailable |
| Personal fouls per team | 10.17 | 16.84 | 65.46 | 17.20 |
| FG% | 45.49 | 45.30 | -0.41 | 43.80 |
| 3P% | 32.32 | 31.96 | -1.09 | 33.80 |
| FT% | 79.36 | 79.02 | -0.43 | 78.50 |
| eFG% | 51.02 | 50.79 | -0.45 | 49.41 |
| TS% | 54.07 | 54.43 | 0.66 | 53.58 |
| Points per 100 engine slots | 111.72 | 107.51 | -3.76 | Unavailable |
| Spread mean absolute error | 12.37 | 12.29 | -0.62 | Unavailable |
| Spread signed error (home bias) | 1.26 | 1.42 | 12.78 | Unavailable |
| Spread root mean squared error | 15.38 | 15.31 | -0.46 | Unavailable |
| Spread residual standard deviation | 15.33 | 15.24 | -0.56 | Unavailable |
| Overtime games % | 2.33 | 2.12 | -8.93 | Unavailable |
| Home win % | 58.88 | 59.08 | 0.35 | 52.50 |
| 1–5 point games % | 24.21 | 25.12 | 3.79 | 25.42 |
| 6–10 point games % | 21.12 | 21.79 | 3.16 | 27.50 |
| 11–19 point games % | 29.00 | 28.42 | -2.01 | 37.92 |
| 20–29 point games % | 17.54 | 16.88 | -3.80 | 6.25 |
| 30–39 point games % | 6.50 | 6.33 | -2.56 | 2.92 |
| 40–49 point games % | 1.38 | 1.29 | -6.06 | 0.00 |
| 50+ point games % | 0.25 | 0.17 | -33.33 | 0.00 |
| 20+ point margins % | 25.67 | 24.67 | -3.90 | 9.17 |
| 30+ point margins % | 8.12 | 7.79 | -4.10 | 2.92 |
| 40+ point margins % | 1.62 | 1.46 | -10.26 | 0.00 |
| 50+ point margins % | 0.25 | 0.17 | -33.33 | 0.00 |
| Actual margin / strength-gap regression slope | 1.45 | 1.35 | -7.16 | Unavailable |
| Strength regression home intercept | 3.76 | 3.92 | 4.26 | Unavailable |
| Actual / predicted margin regression slope | 1.21 | 1.12 | -7.37 | Unavailable |
| Prediction regression home intercept | 0.75 | 1.13 | 51.86 | Unavailable |
| Higher pregame-strength team win % | 61.79 | 60.38 | -2.29 | Unavailable |
| Team scoring standard deviation | 12.33 | 12.08 | -2.07 | Unavailable |
| FGp10% | 38.27 | 37.84 | -1.13 | Unavailable |
| FGp90% | 52.86 | 53.09 | 0.43 | Unavailable |
| 2P% | 52.35 | 52.28 | -0.13 | 48.80 |
| 3PAshare% | 34.24 | 34.34 | 0.31 | 33.38 |
| ORB share of credited rebounds % | 25.37 | 24.10 | -5.01 | Unavailable |
| Engine slots per 48 minutes | 99.38 | 96.70 | -2.70 | Unavailable |
| Combined game score | 185.63 | 173.76 | -6.39 | 163.33 |
| Mean lead changes | 5.53 | 5.26 | -4.93 | Unavailable |
| Mean margin entering Q4 | 11.64 | 11.49 | -1.31 | Unavailable |
| Q4 trailing team eventually wins % | 13.01 | 14.35 | 10.29 | Unavailable |
| Bench points per team | 30.42 | 30.24 | -0.58 | Unavailable |
| Absolute spread error 40+ % | 1.08 | 0.96 | -11.54 | Unavailable |
| Total team turnovers per team | Unavailable | 12.24 | Unavailable | 13.30 |
| Team-only turnovers per team | Unavailable | 0.13 | Unavailable | Unavailable |
| Estimated possessions per team | Unavailable | 82.19 | Unavailable | Unavailable |
| Points per 100 estimated possessions | Unavailable | 105.71 | Unavailable | Unavailable |

Full-season baseline total team turnovers were not retained in the old audit. Its player-box totals are shown separately; revised total turnovers include team-only violations. The separately traced baseline sample supplies the missing distinction without inventing full-season totals. Raw possessions are scheduled engine slots; estimated possessions are FGA − ORB + total TOV + 0.44 FTA. Neither is presented as identical to an official pace estimator.

### Run-to-run uncertainty

| Metric | Revised mean across seeds | Approx. 95% interval for seed mean | Seed range |
|---|---:|---:|---:|
| Points per team | 86.88 | 86.38–87.38 | 85.83–88.03 |
| Mean winning margin | 13.47 | 13.00–13.93 | 12.25–14.21 |
| 20+ point margins % | 24.67 | 23.08–26.25 | 21.67–27.92 |
| 30+ point margins % | 7.79 | 6.16–9.42 | 5.00–11.25 |
| 40+ point margins % | 1.46 | 0.86–2.06 | 0.00–2.50 |
| 50+ point margins % | 0.17 | 0.01–0.32 | 0.00–0.42 |

Intervals use ten independently seeded seasons, not an assumption that games within a season are independent. Rare tails remain uncertain.

### Spread calibration by predicted home margin

| Predicted home margin | Games | Actual mean margin | Signed error | MAE | RMSE | Home win % |
|---|---:|---:|---:|---:|---:|---:|
| -100 to -10 | 16 | -5.50 | 5.78 | 13.22 | 17.69 | 31.25 |
| -10 to -5 | 135 | -8.14 | -1.15 | 13.19 | 15.46 | 33.33 |
| -5 to 0 | 567 | -1.17 | 1.27 | 12.55 | 15.63 | 44.97 |
| 0 to 5 | 881 | 3.44 | 1.19 | 12.18 | 15.19 | 58.00 |
| 5 to 10 | 612 | 8.58 | 1.67 | 12.05 | 14.96 | 71.73 |
| 10 to 100 | 189 | 15.64 | 3.67 | 12.12 | 15.66 | 86.24 |

## Strength and game development

| League / phase / absolute strength gap | Games | Mean margin | 30+ % | 40+ % |
|---|---:|---:|---:|---:|
| nba / secondary / 0–2 | 4551 | 14.66 | 10.44 | 2.90 |
| nba / secondary / 2–5 | 4985 | 15.72 | 12.76 | 3.99 |
| nba / secondary / 5–10 | 2615 | 17.31 | 16.79 | 7.00 |
| nba / secondary / 10–100 | 149 | 20.83 | 22.82 | 13.42 |
| nba / phase2 / 0–2 | 4573 | 14.75 | 10.89 | 3.26 |
| nba / phase2 / 2–5 | 5013 | 15.37 | 11.59 | 3.51 |
| nba / phase2 / 5–10 | 2565 | 17.01 | 15.36 | 5.69 |
| nba / phase2 / 10–100 | 149 | 21.31 | 28.19 | 11.41 |
| wnba / secondary / 0–2 | 873 | 12.73 | 6.07 | 0.80 |
| wnba / secondary / 2–5 | 930 | 13.11 | 6.45 | 0.97 |
| wnba / secondary / 5–10 | 548 | 16.03 | 13.32 | 3.65 |
| wnba / secondary / 10–100 | 49 | 17.04 | 18.37 | 6.12 |
| wnba / phase2 / 0–2 | 855 | 12.50 | 5.26 | 0.58 |
| wnba / phase2 / 2–5 | 947 | 13.03 | 7.07 | 1.37 |
| wnba / phase2 / 5–10 | 552 | 15.38 | 11.78 | 2.72 |
| wnba / phase2 / 10–100 | 46 | 17.50 | 21.74 | 4.35 |

### Rested matchups

| League / phase | Games with neither team on a back-to-back | Mean margin | 30+ % | 40+ % |
|---|---:|---:|---:|---:|
| nba / secondary | 8318 | 15.78 | 12.95 | 4.28 |
| nba / phase2 | 8318 | 15.57 | 12.37 | 3.96 |
| wnba / secondary | 2012 | 13.74 | 8.40 | 1.74 |
| wnba / phase2 | 2012 | 13.39 | 7.90 | 1.54 |

The strength field is the existing pregame team-strength calculation, not an independently validated talent score. Identical strengths need not imply identical rotations, attributes or tactics.


## Confirmed mechanisms and changes

- Possessions are fixed minute slots, not elapsed-time-driven ball-control episodes. Coach tempo had been centered at 50 despite generated system tempos averaging 63.5. Centering the existing pace adjustment at 63.5 removes the structural population-level addition while preserving fast/slow coaching differences.
- Team-only shot-clock turnovers are already stored independently and displayed through teamTurnoverCount. They are rare in the traced sample; they do not explain the several-turnover shortfall. Player and team turnovers remain distinct.
- Existing pass, handling, interception, isolation and pick-and-roll hazards lacked league/era turnover context. Their rating-dependent risks now use a bounded multiplier derived from the reference turnover share relative to the measured approximately 12.5% neutral event environment. This is a model translation, not a guarantee of a target count.
- Ordinary off-ball defensive contact was absent. A bounded non-shooting defensive-foul path now depends on defender foul tendency, defensive IQ, coaching discipline, crowd and the existing foul slider. Non-bonus calls retain the ball; bonus calls use existing free throws and rebound resolution. Shooting-foul and shooting-accuracy formulas were not retuned.
- Rebounding used neutral 1:3 offensive/defensive odds in every era. Reference ORB/DRB odds now provide the starting environment, multiplied by the existing active-lineup strength ratio and user slider. This preserves rebounding talent. The original modern offensive-board probability was near 25%; high per-game counts partly reflected too many misses, not a huge probability defect.
- The old clock was always 24 seconds and every rebound reset to 14. WNBA pre-2006 now uses 30; WNBA pre-2016 and NBA pre-2018 use the full rebound reset; NBA pre-1954 has no shot-clock violation. Early WNBA defensive-foul resets now use 30 seconds through 2003, 20 in 2004–05, then 14. These are rule corrections, separate from statistical calibration; older NBA defensive-foul reset history remains incompletely modeled.
- The added retained-possession contact path now refreshes the defender, box row, stamina and lineup effects if that foul disqualifies the original defender. A forced non-bonus disqualification regression passes five games per league. The first provisional full-season batch is retained under dev/phase2/candidate-seasons, but excluded from the final comparison; all twenty final seasons were rerun after this correction.
- No overall-rating compression, score caps, trailing-team bonuses, scripted comebacks, widened spreads, or shooting penalties were added. The spread formula is unchanged.

## Accounting and remaining limitations

- Instrumentation records each slot’s start side, start/end clock window, state trace, terminal phase, fouls, FT trips, turnovers, rebound opportunities, shot path and before/after box deltas. It consumes no randomness. All 200 baseline diagnostic scores matched the previously retained game results exactly.
- Offensive rebounds are continuations, not possession endings. The report separates terminal outcomes from rebound and foul events; an and-one is not counted as a second possession. Technical/flagrant retained trips do not create a new slot.
- The legacy possessionOutcomes field marks the first qualifying event, so it is not an authoritative terminal-outcome count. New audit tracing uses final state/turnover evidence instead. Existing saved records are preserved.
- The engine still uses fixed clock windows. Secondary shots and repeated rebounds can be compressed into one window; shot-clock time and game-clock time are not fully coupled. Period-expiration endings and team-rebound attribution are not comprehensively modeled. This phase does not claim a physically complete clock engine.
- The existing primary shooting-foul hazard has no shot-location term. The matched samples below record the actual one-, two- and three-shot trip counts. This distribution was not calibrated against verified shot-location foul data in this phase. It also makes the generic 0.44 FTA possession estimator imperfect for this engine.
- Final missed free throws still use the general rebound resolver; separate FT rebound geometry and shooting-foul opportunities on immediate secondary shots remain modeling weaknesses. No unsupported FT rebound percentage was asserted as verified.
- Statistical priors are sparse: NBA 1997, 2023, 2024; WNBA 1997, 2006, 2023, 2024. Other years use the nearest row; possessionEnvironment exposes the reference and approximate flag. These translations are assumptions for fictional roster populations, not verified annual rates for every historical season.
- Scoring efficiency, physical-matchup accumulation, roster construction and the simple OVR spread model may leave residual bias and blowout excess. Lower shot volume alone is not proof of complete balance. Compare all tail metrics above.

## Reference variation

The 2023–24 NBA averaged 114.2 points, 88.9 FGA and 21.7 FTA per team; 2024–25 averaged 113.83 points, 89.2 FGA and 21.7 FTA. WNBA 2022 averaged 82.3 points, 68.0 FGA and 18.2 FTA; 2023 averaged 82.7 points, 68.3 FGA and 18.5 FTA; 2024 averaged 81.67 points, 68.3 FGA and 18.0 FTA. These adjacent-season checks support a range, not a mandatory scoring target. Complete real-game margin distributions are available here only for the retained 2024 reference seasons. Reference eFG and TS are estimates derived from rounded aggregate tables. Zero 40+ margins in the 240-game WNBA reference does not imply that the true probability of such a result is zero.

## Sources

- https://www.basketball-reference.com/leagues/NBA_2025.html (2024–25 NBA reference)
- https://www.basketball-reference.com/leagues/NBA_2024.html (2023–24 cross-check)
- https://www.basketball-reference.com/leagues/NBA_1998.html (1997 start-year NBA)
- https://www.basketball-reference.com/wnba/years/2024.html
- https://www.basketball-reference.com/wnba/years/2023.html
- https://www.basketball-reference.com/wnba/years/2022.html
- https://www.basketball-reference.com/wnba/years/2006.html
- https://www.basketball-reference.com/wnba/years/1997.html
- https://official.nba.com/nba-board-of-governors-approves-rules-changes-for-2018-19-season/
- https://www.wnba.com/news/wnba-announces-rules-changes-for-2016-season/amp
- https://www.wnba.com/news/wnba-history-timeline-2012 (December 2003 change for the 2004 season)
- https://www.oursportscentral.com/services/releases/wnba-announces-rules-changes/n-3247203 (WNBA-issued 2005 release)
- Prior audit retained complete margin datasets: https://fixturedownload.com/results/nba-2024 and https://fixturedownload.com/results/wnba-2024; NBA Cup final excluded.

Aggregate reference tables were checked in indexed source results; direct Basketball Reference access returned 403. No claim of newly downloading its complete game logs. Prior validated margin datasets are reused.

## Controlled matchups

100 paired seeds per league/scenario; equal rosters and coaches before the stated changes. WNBA uses 12 teams. The controlled fixture does not claim to represent all real-world roster distributions. The no-fatigue scenario disables effective-attribute fatigue only; stamina-driven substitutions still operate. Home-court and user-team context are retained, so equal rosters are not a neutral-venue experiment.

| League / scenario | Baseline mean home margin | Revised mean home margin | Baseline margin SD | Revised margin SD | Baseline 30+ % | Revised 30+ % |
|---|---:|---:|---:|---:|---:|---:|
| nba / equal | 5.54 | 7.15 | 18.61 | 16.52 | 15 | 11 |
| nba / small | 11.03 | 9.04 | 15.92 | 16.01 | 13 | 6 |
| nba / moderate | 22.47 | 19.30 | 16.26 | 17.64 | 36 | 26 |
| nba / large | 36.42 | 34.95 | 18.67 | 17.43 | 70 | 61 |
| nba / offense-defense | 3.31 | -1.38 | 16.86 | 15.01 | 10 | 5 |
| nba / tempo | 0.95 | 2.20 | 16.93 | 16.63 | 10 | 9 |
| nba / no-fatigue | 5.87 | 6.22 | 17.74 | 19.05 | 12 | 13 |
| wnba / equal | 4.17 | 2.36 | 15.45 | 16.25 | 9 | 5 |
| wnba / small | 10.54 | 9.74 | 14.79 | 16.57 | 11 | 13 |
| wnba / moderate | 21.99 | 18.96 | 17.42 | 13.96 | 35 | 19 |
| wnba / large | 34.39 | 33.34 | 16.06 | 14.09 | 62 | 64 |
| wnba / offense-defense | -0.32 | 1.06 | 17.11 | 15.15 | 7 | 6 |
| wnba / tempo | 1.92 | 2.86 | 14.09 | 16.32 | 4 | 5 |
| wnba / no-fatigue | 3.95 | 4.17 | 15.33 | 17.19 | 6 | 8 |

## Traced possession samples

50 matched game seeds per league/phase. Each rebound was checked against recorded misses; no sampled slot had more credited rebounds than eligible recorded field-goal and free-throw misses. Some missed shots have no player rebound (for example, loose-ball fouls).

| League / phase | Shots/team | FTA/team | Total TOV/team | Raw slots/team | ORB share of credited boards |
|---|---:|---:|---:|---:|---:|
| nba / baseline-paths | 96.28 | 17.14 | 12.84 | 101.90 | 24.54% |
| wnba / baseline-paths | 79.35 | 14.68 | 10.09 | 83.42 | 24.66% |
| nba / revised-paths | 90.33 | 19.65 | 13.89 | 98.96 | 25.44% |
| wnba / revised-paths | 72.81 | 16.83 | 12.39 | 81.56 | 23.51% |

nba baseline-paths terminal counts: madeFieldGoal=4341 (42.60%), defensiveRebound=3883 (38.11%), freeThrows=660 (6.48%), turnover=1284 (12.60%), foul=22 (0.22%)

Secondary-shot paths: putback:inside: 573/901, kickout:three: 26/87, kickout:inside: 38/55, kickout:mid: 30/66

Rebound sources: miss: 1135 offensive / 4592 total, freeThrow: 51 offensive / 202 total, block: 77 offensive / 352 total

FT trip counts (technical/retained flags overlap trip lengths): 3shots=257, 2shots=316, 1shots=289, retained=5, technical=12

Turnover types: badPassOut=194, lostBallOut=194, lostBall=469, offBallFoul=29, doubleDribble=59, badPass=103, stepOut=37, charge=20, shotClock=15, backcourt=10, illegalScreen=52, threeSeconds=14, travel=64, offensiveFoul=24


wnba baseline-paths terminal counts: freeThrows=581 (6.96%), turnover=1009 (12.10%), madeFieldGoal=3383 (40.55%), defensiveRebound=3346 (40.11%), foul=23 (0.28%)

Secondary-shot paths: putback:inside: 484/794, kickout:inside: 29/54, kickout:three: 18/40, kickout:mid: 21/60

Rebound sources: miss: 990 offensive / 4063 total, block: 60 offensive / 216 total, freeThrow: 45 offensive / 162 total

FT trip counts (technical/retained flags overlap trip lengths): 1shots=231, 2shots=314, 3shots=198, technical=7, retained=4

Turnover types: lostBall=331, badPassOut=160, travel=58, lostBallOut=153, badPass=92, stepOut=29, offBallFoul=22, illegalScreen=60, offensiveFoul=30, shotClock=11, charge=13, doubleDribble=34, threeSeconds=7, backcourt=9


nba revised-paths terminal counts: madeFieldGoal=4207 (42.51%), defensiveRebound=3508 (35.45%), turnover=1389 (14.04%), freeThrows=775 (7.83%), foul=17 (0.17%)

Secondary-shot paths: putback:inside: 547/852, kickout:inside: 27/43, kickout:mid: 35/69, kickout:three: 18/65

Rebound sources: miss: 1054 offensive / 4171 total, block: 87 offensive / 310 total, freeThrow: 56 offensive / 224 total

FT trip counts (technical/retained flags overlap trip lengths): 1shots=298, 2shots=456, 3shots=245, technical=12, retained=4

Turnover types: doubleDribble=62, lostBall=515, badPass=116, illegalScreen=65, badPassOut=199, lostBallOut=205, offensiveFoul=43, offBallFoul=27, stepOut=40, shotClock=15, threeSeconds=8, backcourt=14, charge=11, travel=69


wnba revised-paths terminal counts: freeThrows=666 (8.17%), defensiveRebound=3166 (38.82%), madeFieldGoal=3068 (37.62%), turnover=1239 (15.19%), foul=17 (0.21%)

Secondary-shot paths: putback:inside: 392/696, kickout:three: 8/41, kickout:mid: 24/63, kickout:inside: 33/54

Rebound sources: miss: 887 offensive / 3796 total, freeThrow: 44 offensive / 164 total, block: 42 offensive / 179 total

FT trip counts (technical/retained flags overlap trip lengths): 1shots=199, 2shots=426, 3shots=205, technical=9, retained=4

Turnover types: badPassOut=205, lostBall=452, offensiveFoul=32, lostBallOut=168, doubleDribble=52, shotClock=13, badPass=105, backcourt=19, offBallFoul=24, stepOut=31, threeSeconds=7, charge=6, illegalScreen=63, travel=62


## Historical fixtures

Thirty full-length games in each requested era, fictional six-team test rosters. These check formats, scoring and event integrity; they are not league-wide historical calibration samples.

| League / year | Games | Points/team | FGA/team | FTA/team | Player TOV/team | PF/team |
|---|---:|---:|---:|---:|---:|---:|
| nba / 1997 | 30 | 104.28 | 82.05 | 30.57 | 16.47 | 26.70 |
| nba / 2025 | 30 | 121.42 | 92.13 | 22.90 | 15.03 | 19.78 |
| wnba / 1997 | 30 | 81.00 | 66.23 | 25.63 | 17.42 | 22.62 |
| wnba / 2006 | 30 | 84.57 | 68.90 | 22.62 | 14.90 | 21.93 |
| wnba / 2024 | 30 | 92.18 | 75.87 | 20.27 | 13.07 | 19.00 |

## Validation, persistence and scope

- Full-season verifier checks all 14,700 revised games, 82/40 games per team, no same-day schedule duplicates, period/box/final-score agreement, valid minutes and nonnegative shooting/turnover totals. Original baseline hashes are checked unchanged.
- Historical clock unit tests cover the five requested eras plus NBA pre-1954, bounded/monotonic turnover risks and preserved shooting-skill ordering.
- Player-feat tests: synthetic shot/FT winners, overtime, exact buzzer timing, permanent leads, defensive attribution, live-prefix visibility, playoffs and idempotent news; 40 actual games; production day progression and career persistence.
- Technical/flagrant tests: synthetic paired technicals and ejections plus 26 actual NBA/WNBA games; box/event totals and save/load.
- Legacy save test: baseline engine career loads with completed scores, boxes and summary events unchanged. No save migration required.
- Thirty fatigued full games verify effective secondary-shot attributes, permanent-rating preservation and score/event/box agreement.
- No changes to contracts, names, city photographs, morale decisions, GM employment, schedules or existing completed results. Browser visual QA was unavailable; this is headless gameplay verification, not a claim of device testing.

## Modified files

Production: dist/attributes.js; dist/statistical-balance.js; dist/possession-engine.js; dist/tendencies.js; dist/pick-and-roll.js; dist/index.html (cache versions).

Audit infrastructure: dev/audit-competitiveness.cjs; dev/audit-phase2.cjs; dev/phase2-instrument.cjs; dev/phase2-controlled.cjs; dev/phase2-historical.cjs; dev/test-phase2-rules.cjs; dev/test-phase2-foul-substitution.cjs; dev/run-phase2-seasons.cjs; dev/run-phase2-wnba.cjs; dev/verify-phase2.py; dev/report-phase2.py; dev/protect-phase2-results.cjs; retained output under dev/phase2/ and dev/balance-audit/phase2-*.json; dev/player-feat-simulation-results.json; docs/PHASE2-COMPETITIVENESS.md.

## Reproduction

The full-season runners reuse retained result files; move only phase2-* results aside to rerun, preserving secondary-* baselines. Reconstruct the frozen baseline dist from git commit 48d22fc668ff4c06c445bfcf119f025fffb335fe and set HOOPS_BASELINE_DIST to that dist directory for baseline diagnostics. Run node dev/run-phase2-seasons.cjs, then python3 dev/verify-phase2.py and python3 dev/report-phase2.py. Diagnostic runs: node dev/audit-phase2.cjs baseline-paths 50; node dev/audit-phase2.cjs revised-paths 50; node dev/phase2-controlled.cjs baseline 100; node dev/phase2-controlled.cjs revised 100; node dev/phase2-historical.cjs. Controlled results also resume retained scenarios. The phase2 production change affects future games only.

## Audit output integrity

One NBA seed-105 output was truncated during a repeated audit-file write. The writer now uses a single atomic write. That seed was rerun with the unchanged final engine; all 659 recoverable complete game records matched the replacement exactly. The final 1,230-game file passed the full verifier. No missing game statistics were reconstructed or estimated. Details: dev/phase2/output-integrity.txt.
