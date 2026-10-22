# Hoops Dynasty — Phase 3 competitive-balance investigation

Baseline production commit: 9d057ddd3af5f6dfb24de35013db440dc34becae. Phase 2 outputs remain intact. Ten independently seeded full regular seasons per league, seeds 101–110; fictional rosters, not verified historical rosters. Changed possession branches change later RNG consumption, so season trajectories are reproducible but not possession-for-possession paired. Controlled fixtures reset state and seed before each game.


## Outcome

Phase 3 demonstrates partial improvement, not a solved competitiveness problem. All 14,700 full-season games completed: 12,300 NBA and 2,400 WNBA, ten seasons per league, seeds 101–110. NBA mean winning margin fell 15.553 → 15.095; WNBA fell 13.468 → 12.707. Both remain above the retained real references. Median margins remain 13 NBA and 11 WNBA.

Two targeted changes were accepted: current-defender fatigue lookup after switches, and modern shot-type/contact/and-one foul calibration. Isolated tests attribute most observed margin improvement to the foul correction. No direct normal-shot accuracy curve, player rating, home-court parameter, spread formula or comeback mechanism was changed.

Tradeoffs and unresolved results: NBA home wins rose 59.03% → 59.47%; WNBA declined 59.08% → 58.13%. Three-point accuracy moved farther below the reference (NBA 33.28%, WNBA 30.55%). Overall eFG%/TS% moved closer to the references, but that does not validate the shot-type mix. WNBA 50+ margins increased from 4 to 7 games out of 2,400; those tails are too sparse for a confident direction claim. Several paired-seed tail intervals include zero. The report does not claim universal or statistically decisive improvement in every blowout bin.

The strongest remaining investigation targets are minutes/attribute-aware team quality, home advantage, shot-type efficiency and shared pace/scoring covariance. The ablations do not support indiscriminate rating compression or variance suppression. Historical testing verifies formats and event integrity, not historical statistical calibration.

## NBA

| Metric | Phase 2 | Phase 3 | Relative change % | Retained real reference |
|---|---:|---:|---:|---:|
| Points/team | 115.35 | 112.35 | -2.60 | 113.83 |
| Mean winning margin | 15.55 | 15.10 | -2.95 | 12.74 |
| Median winning margin | 13.00 | 13.00 | 0.00 | 10.00 |
| 1–5 point games % | 21.15 | 21.67 | 2.46 | 25.12 |
| 6–10 point games % | 19.09 | 20.10 | 5.28 | 25.04 |
| 11–19 point games % | 28.37 | 28.29 | -0.26 | 28.78 |
| 20+ margins % | 31.39 | 29.93 | -4.64 | 21.06 |
| 30+ margins % | 12.32 | 11.40 | -7.46 | 6.51 |
| 40+ margins % | 3.97 | 3.38 | -14.75 | 1.79 |
| 50+ margins % | 1.09 | 0.76 | -30.60 | 0.41 |
| Home wins % | 59.03 | 59.47 | 0.74 | 54.39 |
| FGA/team | 89.80 | 88.70 | -1.23 | 89.20 |
| FTA/team | 19.89 | 19.78 | -0.55 | 21.70 |
| ORB/team | 12.06 | 12.29 | 1.88 | 11.10 |
| Total turnovers/team | 13.77 | 13.76 | -0.11 | 14.30 |
| FG% | 48.95 | 47.84 | -2.27 | 46.72 |
| 3P% | 34.81 | 33.28 | -4.39 | 36.02 |
| eFG% | 55.64 | 54.75 | -1.60 | 54.31 |
| TS% | 58.53 | 57.68 | -1.45 | 57.62 |
| Points/100 estimated possessions | 115.06 | 113.64 | -1.23 | 111.64 |
| Spread MAE | 14.18 | 13.68 | -3.55 | Unavailable |
| Spread RMSE | 17.73 | 17.17 | -3.16 | Unavailable |
| Spread signed error | 1.83 | 1.73 | -5.34 | Unavailable |
| Spread residual SD | 17.64 | 17.08 | -3.14 | Unavailable |
| Overtime games % | 1.86 | 1.85 | -0.87 | Unavailable |
| strengthSlope | 1.70 | 1.65 | -3.28 | Unavailable |
| strengthIntercept | 4.33 | 4.23 | -2.25 | Unavailable |
| predictedMarginSlope | 1.42 | 1.37 | -3.32 | Unavailable |
| predictedMarginIntercept | 0.78 | 0.80 | 2.55 | Unavailable |
| strongerWin% | 62.36 | 62.42 | 0.09 | Unavailable |
| teamScoreSD | 14.18 | 13.83 | -2.50 | Unavailable |
| residual40% | 2.64 | 2.09 | -20.92 | Unavailable |
| meanEnteringQ4Margin | 13.12 | 12.73 | -2.95 | Unavailable |
| Q4trailerWins% | 14.06 | 13.51 | -3.92 | Unavailable |
| estimatedPoss | 100.26 | 98.87 | -1.39 | Unavailable |
| rawPoss | 98.35 | 98.34 | -0.01 | Unavailable |
| 2P% | 57.79 | 58.19 | 0.69 | 54.51 |
| FT% | 77.53 | 76.98 | -0.72 | 77.98 |
| 3PAshare% | 38.46 | 41.56 | 8.05 | 42.12 |

Rate rows are percentages; relative change is not percentage-point change. Estimated possessions = FGA − ORB + total TOV + 0.44 FTA, not official pace. The shot-type foul correction changes the FT mix, so this generic estimator remains approximate.

| Metric | Revised seed mean | Approx. 95% interval | Seed range |
|---|---:|---:|---:|
| Points/team | 112.35 | 112.06–112.64 | 111.73–112.99 |
| Mean winning margin | 15.10 | 14.74–15.45 | 14.47–16.08 |
| 20+ margins % | 29.93 | 28.67–31.20 | 27.64–33.09 |
| 30+ margins % | 11.40 | 10.78–12.02 | 10.24–13.01 |
| 40+ margins % | 3.38 | 2.91–3.85 | 2.76–4.80 |
| 50+ margins % | 0.76 | 0.54–0.97 | 0.41–1.30 |

Intervals use ten season seeds, not independent-game assumptions. Rare blowout tails remain uncertain.

### Pregame calibration

| Predicted home margin | Games | Actual home margin | MAE | RMSE |
|---|---:|---:|---:|---:|
| -100 to -10 | 40 | -10.90 | 11.72 | 14.54 |
| -10 to -5 | 639 | -8.05 | 13.11 | 16.34 |
| -5 to 0 | 2874 | -2.57 | 13.84 | 17.41 |
| 0 to 5 | 4759 | 3.75 | 13.86 | 17.29 |
| 5 to 10 | 3151 | 10.67 | 13.56 | 17.13 |
| 10 to 100 | 837 | 16.13 | 13.08 | 16.56 |

| Strength gap | Games | Mean margin | 30+ % | 40+ % |
|---|---:|---:|---:|---:|
| 0–2 | 4589 | 14.31 | 9.46 | 2.70 |
| 2–5 | 4981 | 14.96 | 11.08 | 3.31 |
| 5–10 | 2574 | 16.41 | 14.61 | 4.27 |
| 10–100 | 156 | 21.12 | 25.64 | 10.90 |

## WNBA

| Metric | Phase 2 | Phase 3 | Relative change % | Retained real reference |
|---|---:|---:|---:|---:|
| Points/team | 86.88 | 83.98 | -3.34 | 81.67 |
| Mean winning margin | 13.47 | 12.71 | -5.65 | 10.82 |
| Median winning margin | 11.00 | 11.00 | 0.00 | 9.00 |
| 1–5 point games % | 25.12 | 26.50 | 5.47 | 25.42 |
| 6–10 point games % | 21.79 | 23.42 | 7.46 | 27.50 |
| 11–19 point games % | 28.42 | 29.00 | 2.05 | 37.92 |
| 20+ margins % | 24.67 | 21.08 | -14.53 | 9.17 |
| 30+ margins % | 7.79 | 6.54 | -16.04 | 2.92 |
| 40+ margins % | 1.46 | 1.25 | -14.29 | 0.00 |
| 50+ margins % | 0.17 | 0.29 | 75.00 | 0.00 |
| Home wins % | 59.08 | 58.13 | -1.62 | 52.50 |
| FGA/team | 72.37 | 71.40 | -1.35 | 68.30 |
| FTA/team | 16.91 | 16.55 | -2.14 | 18.00 |
| ORB/team | 9.87 | 10.07 | 2.04 | 8.20 |
| Total turnovers/team | 12.24 | 12.35 | 0.89 | 13.30 |
| FG% | 45.30 | 44.02 | -2.84 | 43.80 |
| 3P% | 31.96 | 30.55 | -4.43 | 33.82 |
| eFG% | 50.79 | 49.71 | -2.14 | 49.46 |
| TS% | 54.43 | 53.37 | -1.94 | 53.60 |
| Points/100 estimated possessions | 105.71 | 103.73 | -1.87 | 99.29 |
| Spread MAE | 12.29 | 11.56 | -5.97 | Unavailable |
| Spread RMSE | 15.31 | 14.55 | -4.94 | Unavailable |
| Spread signed error | 1.42 | 0.89 | -37.39 | Unavailable |
| Spread residual SD | 15.24 | 14.52 | -4.71 | Unavailable |
| Overtime games % | 2.12 | 2.33 | 9.80 | Unavailable |
| strengthSlope | 1.35 | 1.30 | -3.61 | Unavailable |
| strengthIntercept | 3.92 | 3.39 | -13.55 | Unavailable |
| predictedMarginSlope | 1.12 | 1.08 | -3.44 | Unavailable |
| predictedMarginIntercept | 1.13 | 0.69 | -38.73 | Unavailable |
| strongerWin% | 60.38 | 61.00 | 1.04 | Unavailable |
| teamScoreSD | 12.08 | 11.82 | -2.13 | Unavailable |
| residual40% | 0.96 | 0.62 | -34.78 | Unavailable |
| meanEnteringQ4Margin | 11.49 | 10.69 | -6.94 | Unavailable |
| Q4trailerWins% | 14.35 | 14.89 | 3.76 | Unavailable |
| estimatedPoss | 82.19 | 80.96 | -1.49 | Unavailable |
| rawPoss | 80.81 | 80.85 | 0.05 | Unavailable |
| 2P% | 52.28 | 52.01 | -0.51 | 48.82 |
| FT% | 79.02 | 78.60 | -0.53 | 78.54 |
| 3PAshare% | 34.34 | 37.25 | 8.46 | 33.46 |

Rate rows are percentages; relative change is not percentage-point change. Estimated possessions = FGA − ORB + total TOV + 0.44 FTA, not official pace. The shot-type foul correction changes the FT mix, so this generic estimator remains approximate.

| Metric | Revised seed mean | Approx. 95% interval | Seed range |
|---|---:|---:|---:|
| Points/team | 83.98 | 83.49–84.48 | 82.56–84.99 |
| Mean winning margin | 12.71 | 12.26–13.16 | 11.68–13.47 |
| 20+ margins % | 21.08 | 19.14–23.03 | 17.08–25.00 |
| 30+ margins % | 6.54 | 5.34–7.74 | 4.17–9.17 |
| 40+ margins % | 1.25 | 0.59–1.91 | 0.42–2.92 |
| 50+ margins % | 0.29 | 0.05–0.54 | 0.00–0.83 |

Intervals use ten season seeds, not independent-game assumptions. Rare blowout tails remain uncertain.

### Pregame calibration

| Predicted home margin | Games | Actual home margin | MAE | RMSE |
|---|---:|---:|---:|---:|
| -100 to -10 | 14 | -9.93 | 12.46 | 15.92 |
| -10 to -5 | 125 | -8.52 | 11.49 | 14.43 |
| -5 to 0 | 576 | -1.04 | 11.36 | 14.54 |
| 0 to 5 | 890 | 2.91 | 11.97 | 14.85 |
| 5 to 10 | 619 | 7.83 | 11.44 | 14.34 |
| 10 to 100 | 176 | 14.31 | 10.55 | 13.73 |

| Strength gap | Games | Mean margin | 30+ % | 40+ % |
|---|---:|---:|---:|---:|
| 0–2 | 864 | 12.29 | 5.44 | 0.81 |
| 2–5 | 951 | 11.95 | 5.78 | 1.16 |
| 5–10 | 539 | 14.31 | 8.53 | 1.48 |
| 10–100 | 46 | 17.37 | 19.57 | 8.70 |

## Findings and implemented corrections

1. Confirmed shot-type foul defect: the primary shooting-foul hazard was independent of whether the attempt was worth two or three points. Phase 2 recorded 245 NBA and 205 WNBA three-shot trips in 50 diagnostic games per league. Forty evenly spaced official regular-season play-by-play samples (20 per league) contained 14 and 10 three-shot shooting fouls. All sampled final scores were checked against the official league game logs. The samples establish a large mismatch, not exact universal rates for every era.
2. Confirmed defender-state defect: switches/help changes updated the defender object but could retain the previous defender’s fatigue progress. A forced-switch test reproduced 117 mismatched attribute evaluations out of 1,373; the candidate had zero mismatches in 1,348 evaluations. The new accessor reads the currently assigned defender’s stamina. Different branch outcomes explain the different call counts.
3. Modern foul calibration: shooting-contact multipliers are 0.12 for threes, 1.8 for NBA twos and 1.6 for WNBA twos. Conditional completion multipliers for fouled attempts are 0.45 and 0.35, replacing 0.70; normal field-goal accuracy is unchanged. These are explicit model translations informed by the sampled two-/three-shot and and-one mix, not measured physiological or annual league constants. Existing player foul tendencies, defensive IQ, draw-foul behavior, coaching discipline, crowd and league foul sliders still operate. Only start years 2023 onward use these priors; earlier seasons retain their prior foul calibration. Historical statistical calibration is not claimed.
4. Ratings were not compressed. The direct shooting matchup curve changes one percentage point per five rating points. Defensive ratings change it in the opposite direction. IQ, ball security, blocking and rebounding have separate bounded effects. Isolation has discrete advantage thresholds and physical caps/three-point low-rating behavior are nonlinear; the ablations do not establish these as the dominant source of excessive tails.
5. The pregame strength metric is 80% first-five OVR average plus 20% remaining-roster OVR average. It is not minutes-, injury-, fatigue-, attribute-, position- or tactic-aware. Therefore a 0–2 strength gap is not an independently validated equal-quality matchup. Its slope cannot by itself prove attribute scaling is excessive. No spread widening was used.
6. Physical build changes derived mobility, strength, reach and endurance; direct mismatch adjustments are also present. The direct mismatch probabilities are bounded. Neutralizing physical effects is a diagnostic, not a proposed removal of height/strength advantages. Runtime attributes are restored after each game.
7. Fatigue and rotation effects are real but their ablations do not justify blaming fatigue alone. A shallow bench changes actual lineup quality, which the simple strength metric underweights. Garbage-time rotations and score-conditioned bins are reported separately; correlation with a lead is not proof of a feedback bug.
8. Crowd advantages include home accuracy, road pressure, fouls, turnovers and small rebounding effects; separate two-rest-day home bonuses and rivalry effects also exist. Neutral fixtures remove crowd, rivalry, altitude difference and rest asymmetry. Existing production home-court settings were not retuned from a single reference season.
9. No shared game-level shooting multiplier was found in the inspected shot path. Shots use independent random draws plus contextual probabilities. Isolation heat and home momentum are bounded, not unbounded lead-based bonuses. No comeback logic, score caps, predetermined margins or hidden score edits were introduced.

## Official shooting distributions

Official league game logs contain 2,460 NBA and 480 WNBA team-game rows. The old real margin benchmark is retained for continuity. The newly retrieved NBA logs yield mean margin 12.748 and scoring 113.825, a small source/revision discrepancy from the retained 12.740/113.827; it does not explain the simulation gap. WNBA totals agree.

| League / statistic | Real mean % | Real SD | Real p10 | Real p90 |
|---|---:|---:|---:|---:|
| nba / FG | 46.82 | 5.43 | 39.80 | 53.75 |
| nba / 2P | 54.65 | 7.31 | 45.10 | 64.15 |
| nba / 3P | 35.99 | 8.06 | 25.81 | 46.34 |
| nba / eFG | 54.43 | 6.57 | 46.07 | 62.78 |
| nba / TS | 57.74 | 6.14 | 49.84 | 65.63 |
| wnba / FG | 43.91 | 5.90 | 36.76 | 50.82 |
| wnba / 2P | 49.07 | 7.69 | 39.02 | 58.49 |
| wnba / 3P | 33.41 | 10.23 | 20.00 | 46.15 |
| wnba / eFG | 49.60 | 7.13 | 40.62 | 58.70 |
| wnba / TS | 53.73 | 6.73 | 45.34 | 62.39 |

The NBA Phase 2 FG% p10–p90 of 41.94–56.10 is primarily shifted upward relative to the real 39.80–53.75 range. The WNBA Phase 2 range is 37.84–53.09 versus real 36.76–50.82. This does not support indiscriminately suppressing shot randomness. Opponents’ scores are more positively correlated in the real logs; fixed clock slots and limited shared pace variation remain possible contributors, not proven causes.

Phase 2 free-throw-made difference SD was approximately 8.88 NBA / 8.25 WNBA, compared with 7.15 / 6.48 in the official logs. This motivated the foul-path investigation; correcting foul-type frequencies does not by itself guarantee the entire margin distribution is fixed.

## Controlled ablations

Each case uses 200 reset games and seeds 80000–80199, with four roster fixtures (50 games each). Both sides have the same stored physical biography in identical-roster tests; changing IDs must not regenerate different bodies. Coaches are initialized before fixture capture. Exploratory runs that did not guarantee these conditions are retained separately and excluded here. Population cases use four fixed unequal roster pairings and are sensitivity tests, not league-wide estimates. The no-coach case neutralizes skill/fit contributions, not every tactical behavior. The no-fatigue case removes effective-attribute fatigue only; stamina-driven substitutions remain.

| League / case | Games | Home margin | Mean absolute margin | Margin SD | 20+ % | 30+ % | 40+ % | Home wins % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| nba / altitude | 200 | 5.24 | 14.13 | 16.37 | 28.50 | 8.50 | 1.00 | 62.00 |
| nba / average | 200 | -1.82 | 13.68 | 16.36 | 24.00 | 6.00 | 1.50 | 44.00 |
| nba / crowd-high | 200 | 4.99 | 15.02 | 17.98 | 29.50 | 10.50 | 5.00 | 62.50 |
| nba / crowd-low | 200 | 4.46 | 14.23 | 17.54 | 24.00 | 12.00 | 3.50 | 60.00 |
| nba / elite-elite | 200 | -0.12 | 12.37 | 15.43 | 20.00 | 6.00 | 1.00 | 48.00 |
| nba / elite-poor | 200 | 28.55 | 29.09 | 16.56 | 70.50 | 49.50 | 27.50 | 95.50 |
| nba / height | 200 | 2.13 | 13.22 | 16.41 | 21.50 | 9.00 | 2.50 | 55.00 |
| nba / home | 200 | 4.43 | 14.29 | 17.20 | 28.00 | 10.50 | 3.00 | 62.00 |
| nba / low-stamina | 200 | 2.69 | 13.34 | 16.20 | 25.50 | 8.50 | 0.50 | 56.00 |
| nba / neutral | 200 | -0.59 | 14.12 | 17.58 | 26.00 | 8.50 | 3.00 | 48.00 |
| nba / no-coach | 200 | 1.07 | 14.32 | 18.57 | 25.00 | 10.50 | 4.00 | 55.00 |
| nba / no-fatigue | 200 | 0.06 | 14.47 | 17.70 | 27.00 | 8.50 | 2.00 | 49.50 |
| nba / no-garbage | 200 | -0.28 | 13.81 | 17.33 | 27.50 | 8.00 | 1.50 | 48.00 |
| nba / no-momentum | 200 | 4.29 | 14.29 | 17.28 | 27.50 | 11.00 | 3.50 | 61.50 |
| nba / no-physical | 200 | 2.14 | 13.08 | 16.26 | 23.00 | 8.00 | 1.50 | 57.00 |
| nba / poor-elite | 200 | -28.09 | 28.47 | 16.15 | 69.50 | 48.50 | 25.50 | 5.50 |
| nba / population-no-coach | 200 | 9.54 | 16.14 | 17.98 | 30.50 | 12.50 | 4.50 | 71.50 |
| nba / population-no-fatigue | 200 | 7.58 | 14.86 | 17.15 | 28.00 | 13.00 | 4.50 | 68.00 |
| nba / population-no-home | 200 | 4.46 | 14.57 | 17.63 | 25.00 | 13.00 | 3.00 | 60.00 |
| nba / population-no-isolation | 200 | 9.49 | 15.80 | 17.04 | 31.50 | 13.00 | 5.00 | 73.50 |
| nba / population-no-momentum | 200 | 8.89 | 15.11 | 16.54 | 29.00 | 11.00 | 4.50 | 72.50 |
| nba / population-no-physical | 200 | 5.51 | 14.09 | 16.62 | 26.00 | 9.50 | 2.00 | 62.00 |
| nba / population | 200 | 8.96 | 15.76 | 17.22 | 32.50 | 11.50 | 5.00 | 73.00 |
| nba / shallow | 200 | 12.49 | 18.08 | 18.69 | 38.50 | 21.50 | 7.50 | 76.50 |
| wnba / altitude | 200 | 4.16 | 13.54 | 16.24 | 25.00 | 8.50 | 1.50 | 58.50 |
| wnba / average | 200 | -0.71 | 12.79 | 16.20 | 23.00 | 8.00 | 1.50 | 49.00 |
| wnba / crowd-high | 200 | 2.69 | 12.30 | 15.08 | 21.50 | 4.50 | 0.50 | 54.00 |
| wnba / crowd-low | 200 | 2.54 | 11.92 | 14.88 | 19.00 | 6.00 | 0.50 | 56.50 |
| wnba / elite-elite | 200 | 2.20 | 11.17 | 13.80 | 14.00 | 3.00 | 1.00 | 57.00 |
| wnba / elite-poor | 200 | 22.23 | 23.14 | 15.99 | 59.00 | 30.50 | 13.00 | 90.50 |
| wnba / height | 200 | 1.85 | 11.12 | 13.51 | 15.50 | 3.50 | 0.00 | 56.50 |
| wnba / home | 200 | 2.44 | 12.20 | 14.99 | 20.50 | 3.50 | 0.50 | 53.50 |
| wnba / low-stamina | 200 | 3.12 | 13.11 | 15.87 | 23.00 | 5.50 | 1.50 | 59.50 |
| wnba / neutral | 200 | 2.16 | 11.66 | 14.88 | 18.50 | 6.00 | 1.50 | 51.00 |
| wnba / no-coach | 200 | -0.12 | 10.71 | 13.56 | 14.00 | 4.00 | 1.00 | 47.00 |
| wnba / no-fatigue | 200 | 1.73 | 12.23 | 15.34 | 20.50 | 5.50 | 1.50 | 50.50 |
| wnba / no-garbage | 200 | 1.85 | 11.63 | 14.57 | 18.00 | 6.50 | 0.00 | 51.00 |
| wnba / no-momentum | 200 | 2.33 | 12.12 | 14.88 | 20.00 | 3.50 | 0.50 | 54.00 |
| wnba / no-physical | 200 | 1.01 | 11.38 | 14.20 | 16.00 | 3.50 | 0.50 | 54.50 |
| wnba / poor-elite | 200 | -20.55 | 21.52 | 14.05 | 50.50 | 27.50 | 8.50 | 6.50 |
| wnba / population-no-coach | 200 | 6.67 | 15.22 | 17.63 | 28.50 | 8.50 | 4.50 | 64.50 |
| wnba / population-no-fatigue | 200 | 7.96 | 13.93 | 15.44 | 24.50 | 9.00 | 3.00 | 68.00 |
| wnba / population-no-home | 200 | 3.27 | 13.56 | 16.55 | 26.00 | 5.50 | 2.00 | 56.00 |
| wnba / population-no-isolation | 200 | 8.38 | 14.63 | 16.35 | 32.50 | 9.00 | 3.50 | 67.00 |
| wnba / population-no-momentum | 200 | 7.53 | 14.59 | 16.56 | 29.50 | 12.00 | 3.50 | 67.50 |
| wnba / population-no-physical | 200 | 7.08 | 14.65 | 17.18 | 28.50 | 11.50 | 4.50 | 65.50 |
| wnba / population | 200 | 7.37 | 14.69 | 16.58 | 31.00 | 10.50 | 2.50 | 67.50 |
| wnba / shallow | 200 | 7.83 | 14.30 | 16.33 | 29.00 | 10.00 | 2.50 | 64.00 |

Four fixture clusters and 200 games per case leave substantial uncertainty; changes in RNG branches prevent shot-for-shot pairing. A small difference is not treated as proof of causation.

## Attribute sweeps

Eight direct-calculation ratings: 60, 65, 70, 75, 80, 85, 90, 95. The retained JSON includes shooting and defense, free throws, handling/steal/isolation risk, blocking, IQ, endurance and rebound weights plus a height/weight grid. These are calculation sweeps, not independent full-game trials for every individual attribute. Passing and rotation interactions are additionally inspected in code and controlled team tests.

| Rating | Inside vs 75 | Midrange vs 75 | Three vs 75 | FT | Inside 75 vs defense | Handling TO before context |
|---|---:|---:|---:|---:|---:|---:|
| 60 | 59.50% | 40.50% | 28.00% | 70.00% | 65.50% | 5.00% |
| 65 | 60.50% | 41.50% | 29.00% | 72.50% | 64.50% | 4.75% |
| 70 | 61.50% | 42.50% | 30.00% | 75.00% | 63.50% | 4.50% |
| 75 | 62.50% | 43.50% | 31.00% | 77.50% | 62.50% | 4.25% |
| 80 | 63.50% | 44.50% | 32.00% | 80.00% | 61.50% | 4.00% |
| 85 | 64.50% | 45.50% | 33.00% | 82.50% | 60.50% | 3.75% |
| 90 | 65.50% | 46.50% | 34.00% | 85.00% | 59.50% | 3.50% |
| 95 | 66.50% | 47.50% | 35.00% | 87.50% | 58.50% | 3.25% |

## Historical formats and persistence

Historical tests use 30 full-length games each for NBA 1997/2025 and WNBA 1997/2006/2024. Fictional six-team fixtures check rules and score/box/event consistency, not historical statistical calibration. Results are in dev/phase3/historical.json. Existing shot-clock, period, overtime and altitude mechanics are preserved. No save-schema migration or permanent attribute changes are introduced.

Completed game records and city photographs are preserved. Full-season checks enforce game counts, minutes, shooting bounds, score/box/period agreement and baseline hashes. The regression log records save/load, feats, fouls and secondary fatigue checks. Browser visual/device QA is not part of this engine-only audit.

## Remaining limitations

The fixed-window possession engine remains an approximation. Secondary shots do not have all primary foul/turnover paths. Sparse historical priors are not verified annual calibrations. Modern foul parameters use a limited 40-game PBP sample. Home advantage, roster/rotation quality representation and pregame predictions still need improvement if the final metrics remain outside credible ranges. Lower scoring alone is not accepted as competitive-balance success.

## Files and reproduction

Production changes: dist/attributes.js and dist/index.html (cache key). Audit code and retained results: dev/phase3-*.cjs, dev/run-phase3-*.cjs, dev/phase3-*.py, dev/report-phase3.py, dev/phase3/, dev/balance-audit/phase3-*.json, and the optional-transform hook in dev/audit-competitiveness.cjs. Phase 2 results are not overwritten.

Full-season runner: node dev/run-phase3-seasons.cjs. Controlled runners: node dev/run-phase3-diagnostics.cjs and node dev/run-phase3-population.cjs. Read retained outputs rather than silently resimulating an existing seed. The candidate transform and its manifest identify the tested calculation changes.

## Sources

Official complete team game logs: https://stats.nba.com/stats/leaguegamelog (LeagueID=00, Season=2024-25, PlayerOrTeam=T, SeasonType=Regular Season) and https://stats.wnba.com/stats/leaguegamelog (LeagueID=10, Season=2024). Raw responses retained under dev/phase3/real-*.json.

Official play-by-play: https://cdn.nba.com/static/json/liveData/playbyplay/ and https://cdn.wnba.com/static/json/liveData/playbyplay/. Exact URLs, sampled game IDs, download outcomes and score verification are retained in reference-fetch.json and reference-analysis.json. Samples are evenly spaced over sorted regular-season game IDs; this is a coverage sample, not a claim of random sampling.

Phase 2 reference data and sources remain in docs/PHASE2-COMPETITIVENESS.md.
## NBA additional diagnostics

| Identical neutral fixture | Mean margin | Margin SD | 30+ % |
|---|---:|---:|---:|
| baseline (200 games) | 14.12 | 17.58 | 8.50 |
| candidate (200 games) | 13.21 | 16.15 | 9.00 |

These are controlled game fixtures, not ten independent season estimates. NBA 30+ counts can rise even as the mean margin falls. No claim is made that every tail metric improves.

| Pregame lead (signed) | Possession slots | Points/slot |
|---|---:|---:|
| +0 to next ten | 12231 | 1.180 |
| +10 to next ten | 5057 | 1.224 |
| +20 to next ten | 1719 | 1.201 |
| +30 to next ten | 408 | 1.309 |
| +40 to next ten | 166 | 1.157 |
| -0 to next ten | 11341 | 1.188 |
| -10 to next ten | 5614 | 1.160 |
| -20 to next ten | 1980 | 1.155 |
| -30 to next ten | 459 | 1.107 |
| -40 to next ten | 215 | 1.251 |

Lead bins condition on prior game outcomes and different lineups; they cannot establish causation or justify a trailing-team bonus. A possession slot is the engine accounting unit, not official statistical pace.

| Revised team-game distribution | Mean % | SD | p10 | p90 |
|---|---:|---:|---:|---:|
| FG | 47.91 | 5.48 | 40.91 | 54.95 |
| 2P | 58.30 | 7.11 | 49.09 | 67.39 |
| 3P | 33.24 | 8.12 | 22.86 | 43.59 |
| eFG | 54.83 | 6.54 | 46.43 | 63.19 |
| TS | 57.74 | 6.26 | 49.65 | 65.76 |

## WNBA additional diagnostics

| Identical neutral fixture | Mean margin | Margin SD | 30+ % |
|---|---:|---:|---:|
| baseline (200 games) | 11.66 | 14.88 | 6.00 |
| candidate (200 games) | 10.70 | 13.44 | 3.50 |

These are controlled game fixtures, not ten independent season estimates. NBA 30+ counts can rise even as the mean margin falls. No claim is made that every tail metric improves.

| Pregame lead (signed) | Possession slots | Points/slot |
|---|---:|---:|
| +0 to next ten | 10567 | 1.098 |
| +10 to next ten | 3892 | 1.151 |
| +20 to next ten | 1376 | 1.172 |
| +30 to next ten | 235 | 1.132 |
| +40 to next ten | 41 | 1.171 |
| -0 to next ten | 9594 | 1.075 |
| -10 to next ten | 4336 | 1.073 |
| -20 to next ten | 1564 | 1.066 |
| -30 to next ten | 305 | 1.085 |
| -40 to next ten | 52 | 0.846 |

Lead bins condition on prior game outcomes and different lineups; they cannot establish causation or justify a trailing-team bonus. A possession slot is the engine accounting unit, not official statistical pace.

| Revised team-game distribution | Mean % | SD | p10 | p90 |
|---|---:|---:|---:|---:|
| FG | 44.09 | 6.00 | 36.49 | 51.85 |
| 2P | 52.11 | 7.62 | 42.50 | 61.90 |
| 3P | 30.48 | 9.39 | 18.75 | 42.86 |
| eFG | 49.79 | 7.05 | 40.91 | 58.78 |
| TS | 53.44 | 6.77 | 44.86 | 62.19 |

## Foul-path follow-up

The revised 50-game-per-league path audit checks actual trips and rebound sources. The candidate produced 48 NBA and 30 WNBA three-shot trips, down from 245 and 205 in the retained Phase 2 diagnostic. Residual overfrequency remains possible: the official comparison contains only 20 games per league and different rosters. The correction is not presented as complete foul calibration.

The no-physical experiment disables derived physical attributes and direct matchup bonuses; biography-based rebounding size is not removed. The no-coach experiment changes skill/fit only. These names must not be interpreted as complete removal of every related mechanism.

## Ablation scoring and uncertainty

Comparators: home/crowd/altitude are compared with neutral; no-momentum with home; population removals with population; all other identical-roster removals with neutral. Intervals below describe paired seeded games within these fixed fixtures, not uncertainty over the universe of possible rosters.

| Case | Pts/team | FG% | eFG% | Points/100 estimated possessions | Mean margin change | Approx. paired 95% interval |
|---|---:|---:|---:|---:|---:|---:|
| nba altitude | 116.61 | 49.82 | 56.86 | 118.50 | +0.01 | -1.89 to +1.91 |
| nba average | 113.25 | 47.88 | 54.22 | 114.93 | -0.44 | -2.43 to +1.55 |
| nba crowd-high | 116.64 | 49.90 | 56.98 | 118.25 | +0.90 | -1.20 to +3.00 |
| nba crowd-low | 117.30 | 50.05 | 57.15 | 118.97 | +0.11 | -1.52 to +1.74 |
| nba elite-elite | 114.26 | 48.82 | 55.33 | 116.14 | -1.75 | -3.73 to +0.22 |
| nba elite-poor | 129.50 | 54.74 | 61.94 | 131.30 | +14.97 | +12.29 to +17.65 |
| nba height | 116.66 | 50.18 | 57.37 | 118.54 | -0.90 | -2.93 to +1.13 |
| nba home | 116.61 | 49.85 | 56.88 | 118.40 | +0.17 | -1.64 to +1.99 |
| nba low-stamina | 115.54 | 49.44 | 56.42 | 117.23 | -0.79 | -2.70 to +1.13 |
| nba neutral | 116.56 | 49.68 | 56.85 | 118.17 | +0.00 | +0.00 to +0.00 |
| nba no-coach | 114.80 | 48.89 | 55.89 | 116.41 | +0.20 | -1.82 to +2.23 |
| nba no-fatigue | 115.94 | 49.60 | 56.66 | 117.83 | +0.35 | -1.02 to +1.73 |
| nba no-garbage | 116.62 | 49.62 | 56.83 | 118.24 | -0.30 | -1.19 to +0.58 |
| nba no-momentum | 116.62 | 49.88 | 56.93 | 118.41 | -0.01 | -0.22 to +0.20 |
| nba no-physical | 115.52 | 49.50 | 56.56 | 117.11 | -1.04 | -3.14 to +1.06 |
| nba poor-elite | 99.41 | 43.42 | 48.88 | 101.32 | +14.35 | +11.66 to +17.04 |
| nba population-no-coach | 113.83 | 48.87 | 55.65 | 115.86 | +0.39 | -1.82 to +2.59 |
| nba population-no-fatigue | 114.53 | 49.33 | 56.07 | 116.45 | -0.90 | -2.80 to +1.00 |
| nba population-no-home | 116.72 | 49.01 | 55.89 | 116.70 | -1.18 | -2.84 to +0.48 |
| nba population-no-isolation | 113.55 | 48.87 | 55.85 | 115.54 | +0.04 | -2.08 to +2.17 |
| nba population-no-momentum | 114.35 | 49.20 | 56.02 | 116.37 | -0.65 | -1.85 to +0.55 |
| nba population-no-physical | 114.37 | 49.29 | 55.94 | 116.19 | -1.67 | -3.91 to +0.57 |
| nba population | 116.32 | 49.14 | 56.08 | 116.48 | +0.00 | +0.00 to +0.00 |
| nba shallow | 115.97 | 50.06 | 56.97 | 117.74 | +3.96 | +1.70 to +6.22 |
| wnba altitude | 85.53 | 44.86 | 50.97 | 105.56 | +1.88 | +0.30 to +3.46 |
| wnba average | 84.60 | 44.69 | 50.38 | 104.38 | +1.12 | -0.76 to +3.01 |
| wnba crowd-high | 86.47 | 45.55 | 51.62 | 106.34 | +0.64 | -1.02 to +2.30 |
| wnba crowd-low | 85.87 | 45.24 | 51.35 | 105.88 | +0.26 | -1.13 to +1.65 |
| wnba elite-elite | 85.77 | 45.28 | 51.10 | 105.82 | -0.49 | -2.20 to +1.22 |
| wnba elite-poor | 96.59 | 49.58 | 56.21 | 118.93 | +11.48 | +8.93 to +14.04 |
| wnba height | 86.35 | 45.35 | 51.47 | 106.07 | -0.54 | -2.24 to +1.17 |
| wnba home | 85.98 | 45.18 | 51.26 | 105.79 | +0.54 | -1.01 to +2.08 |
| wnba low-stamina | 85.73 | 45.06 | 51.20 | 105.49 | +1.45 | -0.33 to +3.23 |
| wnba neutral | 86.06 | 45.29 | 51.46 | 106.00 | +0.00 | +0.00 to +0.00 |
| wnba no-coach | 85.49 | 45.29 | 51.28 | 105.54 | -0.95 | -2.75 to +0.84 |
| wnba no-fatigue | 85.65 | 45.07 | 51.25 | 105.53 | +0.57 | -0.26 to +1.41 |
| wnba no-garbage | 85.80 | 45.14 | 51.28 | 105.67 | -0.03 | -0.71 to +0.65 |
| wnba no-momentum | 85.94 | 45.17 | 51.23 | 105.73 | -0.07 | -0.28 to +0.13 |
| wnba no-physical | 87.04 | 45.81 | 52.27 | 107.13 | -0.28 | -1.92 to +1.37 |
| wnba poor-elite | 73.89 | 40.65 | 45.52 | 91.32 | +9.86 | +7.75 to +11.96 |
| wnba population-no-coach | 87.84 | 45.50 | 51.43 | 106.69 | +0.54 | -1.50 to +2.57 |
| wnba population-no-fatigue | 88.32 | 45.70 | 51.60 | 107.00 | -0.77 | -2.11 to +0.58 |
| wnba population-no-home | 86.81 | 45.85 | 51.63 | 106.91 | -1.13 | -2.87 to +0.61 |
| wnba population-no-isolation | 89.58 | 46.10 | 52.34 | 108.84 | -0.06 | -2.14 to +2.03 |
| wnba population-no-momentum | 88.46 | 45.73 | 51.67 | 107.11 | -0.10 | -1.04 to +0.83 |
| wnba population-no-physical | 88.83 | 46.32 | 52.37 | 107.59 | -0.04 | -2.12 to +2.05 |
| wnba population | 87.64 | 46.04 | 51.96 | 107.94 | +0.00 | +0.00 to +0.00 |
| wnba shallow | 87.30 | 45.85 | 51.92 | 107.19 | +2.65 | +0.64 to +4.65 |

Controlled possession estimates use player turnovers because these fixture summaries do not retain team-only turnover totals. They must not be equated exactly with the full-season total-turnover estimator.

## Paired season changes

| League / measure | Mean change | Approx. 95% interval |
|---|---:|---:|
| nba / points | -3.002 | -3.254 to -2.751 |
| nba / meanMargin | -0.458 | -0.890 to -0.027 |
| nba / blow20 | -1.455 | -2.959 to +0.048 |
| nba / blow30 | -0.919 | -1.825 to -0.012 |
| nba / blow40 | -0.585 | -1.416 to +0.246 |
| nba / blow50 | -0.333 | -0.673 to +0.006 |
| wnba / points | -2.898 | -3.458 to -2.338 |
| wnba / meanMargin | -0.761 | -1.220 to -0.302 |
| wnba / blow20 | -3.583 | -5.511 to -1.656 |
| wnba / blow30 | -1.250 | -2.912 to +0.412 |
| wnba / blow40 | -0.208 | -1.066 to +0.649 |
| wnba / blow50 | +0.125 | -0.191 to +0.441 |

Rate differences are percentage points. Same initial seeds do not preserve later injury/roster/RNG trajectories after gameplay branching changes. These intervals describe differences over the ten retained seeds.

## Isolated correction effects

| League / version | Games | Mean margin | 30+ % |
|---|---:|---:|---:|
| nba / baseline | 200 | 14.12 | 8.50 |
| nba / fatigue-only | 200 | 14.21 | 9.00 |
| nba / foul-only | 200 | 13.20 | 9.00 |
| nba / candidate | 200 | 13.21 | 9.00 |
| wnba / baseline | 200 | 11.66 | 6.00 |
| wnba / fatigue-only | 200 | 11.60 | 6.00 |
| wnba / foul-only | 200 | 10.61 | 3.00 |
| wnba / candidate | 200 | 10.70 | 3.50 |

The isolated fatigue correction is a correctness fix, not an established explanation of the broad blowout problem. The foul correction accounts for most of the observed improvement in the fixed NBA neutral fixture. Nonadditive changes reflect different random branches and contextual interactions.

## Independent strength check

Four fixed unequal-roster matchups, each repeated 50 times at neutral venue. The roster summary below uses intended minutes; it is not a fitted replacement spread model.

| League / fixture | OVR strength gap | Repeated mean home margin | Within-fixture margin SD | Home minutes-weighted 3P attribute | Away minutes-weighted 3P attribute |
|---|---:|---:|---:|---:|---:|
| nba / 1 | +3.72 | +5.24 | 18.95 | 72.40 | 63.63 |
| nba / 2 | +1.77 | +0.70 | 18.41 | 69.72 | 64.84 |
| nba / 3 | -0.85 | +4.60 | 14.26 | 78.74 | 72.28 |
| nba / 4 | -0.56 | +7.32 | 17.86 | 75.08 | 67.41 |
| wnba / 1 | -1.27 | -4.92 | 13.16 | 72.29 | 81.80 |
| wnba / 2 | +2.12 | +3.42 | 17.60 | 79.78 | 76.61 |
| wnba / 3 | +6.33 | +16.16 | 12.80 | 74.47 | 67.02 |
| wnba / 4 | -0.13 | -1.58 | 13.86 | 70.06 | 63.73 |

These fixtures show why OVR similarity does not guarantee equivalent offense, defense or rotations. Fifty games per pairing leave wide sampling uncertainty. The evidence supports improving the quality model, not simply multiplying the old spread by the observed regression slope.


## Verification and changed-file detail

- Production: `dist/attributes.js`, possessionCore at lines 86 and 138; `dist/index.html`, attributes script cache key.
- Test plumbing: `dev/audit-competitiveness.cjs`, `dev/load-league.cjs`, `dev/test-player-feats.cjs` (variant-aware deterministic replay; the initial failure compared different engines and is retained in exploratory logs).
- Reproduction: `dev/phase3-transform.cjs` is the original tested transform. `dev/phase3-candidate.cjs` now reads the hash-verified audit-only Phase 2 snapshot through `dev/phase3-baseline-source.cjs`; it produces the exact production attributes bytes. The snapshot is not included in runtime scripts.
- Diagnostics and report generators: `dev/phase3-*.cjs`, `dev/phase3-*.py`, `dev/run-phase3-*.cjs`, `dev/audit-phase3-paths.cjs`, `dev/test-phase3-defender.cjs`, `dev/verify-phase3.py`, `dev/report-phase3.py`.
- Evidence: `dev/phase3/`, `dev/balance-audit/phase3-*.json`; 48 baseline controlled cases (9,600 games), six isolated/combined correction cases (1,200 games), 150 historical-format games, and 100 possession-path games. Exploratory fixtures are explicitly excluded from final comparisons.
- Functional regressions: 40 actual feat games plus synthetic winner/buzzer/defensive/live-prefix cases; 26 technical/flagrant games; 30 production fatigued games; completed Phase 2 save validation, career serialization, repeated finalization and no duplicate feat news. All completed successfully. Full UI/device coverage and every unrelated gameplay test were not run.
- The separate WNBA seed-101 pilot was reused only because it used the identical frozen transform, seed and full-season harness. It is counted once. Other exploratory/pilot games are excluded from the 14,700 total.
- Phase 2 outputs and 39 city photograph hashes remain intact. Existing completed records are not resimulated or migrated.

To regenerate the report, run `python3 dev/report-phase3.py`, then `python3 dev/phase3-report-details.py`, then `python3 dev/phase3-finalize-report.py`. To check retained full-season results, run `python3 dev/verify-phase3.py`. The full-season runner skips existing completed outputs; use a separate checkout/output copy for a fresh run so preserved evidence is not overwritten.
