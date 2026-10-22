# Hoops Dynasty — Phase 6 audit
Early-game efficiency, defensive matchups, shot quality and winning-margin variance. Completed 21 October 2026. Production baseline: Phase 5 commit 029dbb71bf50240d531b47823e03038bb4f8f05b.

## Decision and main findings
No new production gameplay correction was justified by this investigation. The Phase 5 engine is unchanged. No score cap, comeback bonus, accuracy boost, altered RNG distribution, compressed rating or correlated scoring multiplier was introduced. The competitiveness problem remains unresolved. This phase adds evidence and reproducible diagnostics, not a claim of improved game balance.

Confirmed: scoring-efficiency gaps exceed the retained complete-season references, and substantial separation develops before Q4. Controlled defensive-strength and bench-quality changes affect outcomes. The simple pregame strength description does not fully characterize actual matchup quality. However, these observations do not demonstrate that a particular probability coefficient is erroneous. Identical-roster shooting residuals must be assessed against their conditional variance, not treated automatically as a broken random generator.

A suspicious team-IQ expression was explicitly checked and ruled out as an averaging defect: the engine’s active rotation weight is 1/courtPlayers, so its weighted sum is already an average. Physical attributes are transformed once and restored; active-lineup and direct-matchup effects represent distinct terms. No new confirmed double application was found in the inspected paths.

## 1. Samples, definitions and reproducibility
The production audit reran ten complete NBA regular seasons (12,300 games) and ten complete WNBA regular seasons (2,400 games), seeds 101–110. Every retained game record reproduces Phase 5 exactly. This is a deterministic reproduction, not an independent second statistical sample: confidence intervals must not be narrowed by counting both versions twice. All prior production and baseline files were hash-verified.

Diagnostics: 22 controlled datasets × 160 full-length games = 3,520 games; eight diverse-roster datasets × 160 = 1,280 games; plus 320 context-instrumented games. Controlled fixtures reset identical initial states before each seed and use three cloned-roster pairings per league. These fixtures are not chronological careers or full seasons. Diverse-roster worlds 301–304 use 30-team NBA and 12-team WNBA setups. Worlds 301–302 train the diagnostic models; 303–304 are held out. Coaching/ratings variants are test-only source/context mutations and never enter production.

Possession definition: estimated possessions = FGA + 0.44×FTA − ORB + total team turnovers. Offensive rating = 100×points/estimated possessions. Team-only turnovers are separately recovered from recorded turnover transitions in instrumented fixtures; they are not assigned to a player. Quarter estimates use recorded within-period box changes, not a claimed exact official possession counter. A team’s defensive rating is its opponent’s offensive rating under the same denominator.

“Close” means within 10 points in transition tables; both within-five and within-ten are shown at checkpoints. “Blowout” means at least 20. Margin SD is the signed home-minus-away SD; absolute-margin SD is separately retained in JSON. Ties are included in checkpoint close-game counts. Full-game final margins cannot be tied.

## 2. First-three-quarter margin distributions
### NBA

| Checkpoint / source | N | Mean absolute | Median absolute | Signed SD | Within 5 % | Within 10 % | 20+ % | 30+ % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 / Simulation | 12300 | 6.77 | 6.00 | 8.46 | 48.19 | 78.28 | 2.11 | 0.07 |
| Q1 / Official subset | 136 | 6.21 | 5.00 | 7.64 | 52.21 | 81.62 | 0.74 | 0.00 |
| Half / Simulation | 12300 | 10.09 | 9.00 | 12.55 | 33.07 | 59.51 | 12.28 | 1.79 |
| Half / Official subset | 136 | 8.83 | 8.00 | 10.66 | 36.76 | 60.29 | 8.09 | 0.00 |
| Q3 / Simulation | 12300 | 12.68 | 11.00 | 15.73 | 27.09 | 48.78 | 22.11 | 6.04 |
| Q3 / Official subset | 136 | 11.09 | 9.00 | 13.52 | 30.88 | 52.21 | 16.18 | 1.47 |
| Final / Simulation | 12300 | 14.77 | 12.00 | 17.99 | 20.02 | 43.72 | 28.20 | 10.19 |
| Final / Official subset | 136 | 11.90 | 11.00 | 14.47 | 27.94 | 47.06 | 16.91 | 3.68 |

| Transition | Sim count | Sim all games % | Reference subset count | Reference all games % |
| --- | --- | --- | --- | --- |
| Q1closeToHalfBlowout | 560 | 4.55 | 9 | 6.62 |
| HalfCloseToQ3Blowout | 475 | 3.86 | 4 | 2.94 |
| Q3closeToFinalBlowout | 283 | 2.30 | 1 | 0.74 |
| Q3blowoutToFinalClose | 95 | 0.77 | 1 | 0.74 |

### WNBA

| Checkpoint / source | N | Mean absolute | Median absolute | Signed SD | Within 5 % | Within 10 % | 20+ % | 30+ % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 / Simulation | 2400 | 5.93 | 5.00 | 7.45 | 53.87 | 83.71 | 0.96 | 0.00 |
| Q1 / Official subset | 62 | 5.94 | 4.50 | 7.28 | 54.84 | 83.87 | 1.61 | 0.00 |
| Half / Simulation | 2400 | 8.80 | 7.00 | 11.04 | 38.92 | 66.42 | 7.46 | 1.04 |
| Half / Official subset | 62 | 7.21 | 6.00 | 8.76 | 48.39 | 72.58 | 3.23 | 0.00 |
| Q3 / Simulation | 2400 | 10.77 | 9.00 | 13.50 | 31.58 | 56.92 | 14.50 | 3.62 |
| Q3 / Official subset | 62 | 8.85 | 7.50 | 11.43 | 41.94 | 64.52 | 12.90 | 0.00 |
| Final / Simulation | 2400 | 12.79 | 10.00 | 15.51 | 23.50 | 50.12 | 20.54 | 5.83 |
| Final / Official subset | 62 | 10.44 | 9.00 | 12.75 | 30.65 | 56.45 | 9.68 | 3.23 |

| Transition | Sim count | Sim all games % | Reference subset count | Reference all games % |
| --- | --- | --- | --- | --- |
| Q1closeToHalfBlowout | 72 | 3.00 | 1 | 1.61 |
| HalfCloseToQ3Blowout | 54 | 2.25 | 1 | 1.61 |
| Q3closeToFinalBlowout | 42 | 1.75 | 0 | 0.00 |
| Q3blowoutToFinalClose | 14 | 0.58 | 2 | 3.23 |

Among the specified close-to-blowout transitions, Q1→halftime contributes the most cases in both leagues. These categories are not a complete causal partition: a game can qualify for different transitions, and a team already up 15 is not “close” under the stated definition. Separation grows across multiple periods; this does not identify the second quarter as a single faulty subsystem.

## 3. Expanded official references and coverage limits
Attempted every game ID in the retained NBA 2024–25 and WNBA 2024 regular-season logs. Network access returned 403 for many new PBP requests. The successful files plus prior retained files provide 136 NBA and 40 WNBA PBP games. An official Washington Mystics game-notes PDF adds quarter scores for 31 games, with overlap checked and deduplicated, yielding 62 unique WNBA quarter-score games. All final totals were checked against official game logs; overlapping PDF/PBP quarter totals agree.

Coverage is availability-biased, and the WNBA supplement overrepresents Washington. These are NOT complete regular-season quarter samples or random representative samples. The original full-season final-score benchmarks remain 1,230 NBA and 240 WNBA games; they are not replaced by the smaller quarter sample. A neutral-site log can label both teams away; PBP home/away orientation is used. Score-correction games remain usable for validated quarter totals but are excluded from unanswered-run reconstruction when backward score changes would make that sequence ambiguous.


| League | Quarter-score games | PBP games | Run-valid PBP games | Complete-season efficiency games |
| --- | --- | --- | --- | --- |
| NBA | 136 | 136 | 135 | 1230 |
| WNBA | 62 | 40 | 40 | 240 |

Real quarter-level possession counts were not independently reconstructed and validated, so real quarter offensive-rating comparisons are unavailable. No possession counts or event labels were invented to fill that gap. Full-game efficiency gaps can be compared consistently using the retained official box totals:


| League | Sim mean absolute ORtg gap | Real mean absolute ORtg gap | Sim signed gap SD | Real signed gap SD |
| --- | --- | --- | --- | --- |
| NBA | 15.37 | 13.04 | 18.61 | 16.12 |
| WNBA | 16.27 | 13.69 | 19.58 | 16.38 |

## 4. Quarter scoring variance and covariance
### NBA

| Quarter / source | Home score variance | Away score variance | Score covariance | Correlation |
| --- | --- | --- | --- | --- |
| Q1 / Simulation | 37.04 | 37.09 | 1.32 | 0.04 |
| Q1 / Official subset | 29.64 | 38.89 | 5.08 | 0.15 |
| Q2 / Simulation | 37.91 | 37.47 | 1.83 | 0.05 |
| Q2 / Official subset | 33.13 | 40.09 | 0.64 | 0.02 |
| Q3 / Simulation | 38.39 | 37.27 | 2.28 | 0.06 |
| Q3 / Official subset | 35.12 | 32.72 | -0.50 | -0.01 |
| Q4 / Simulation | 35.86 | 35.79 | 3.01 | 0.08 |
| Q4 / Official subset | 37.00 | 37.64 | 11.13 | 0.30 |

### WNBA

| Quarter / source | Home score variance | Away score variance | Score covariance | Correlation |
| --- | --- | --- | --- | --- |
| Q1 / Simulation | 28.47 | 27.12 | 0.02 | 0.00 |
| Q1 / Official subset | 23.03 | 26.26 | -1.87 | -0.08 |
| Q2 / Simulation | 28.97 | 29.01 | 0.94 | 0.03 |
| Q2 / Official subset | 34.53 | 27.54 | 7.30 | 0.24 |
| Q3 / Simulation | 28.99 | 27.89 | 2.01 | 0.07 |
| Q3 / Official subset | 27.21 | 22.11 | -3.76 | -0.15 |
| Q4 / Simulation | 28.35 | 29.34 | 1.80 | 0.06 |
| Q4 / Official subset | 36.73 | 29.99 | -1.53 | -0.05 |

Variances/covariances are population estimates in points squared. Positive covariance reduces margin variance for a given pair of team-score variances. This identity does not establish why a covariance differs. Phase 5 already showed highly correlated opposing possession counts; missing shared pace alone is not a supported explanation. No common scoring shock was added.

## 5. Offensive/defensive calculation inspection
Base shot probability is base(kind) + 0.002×(shooting−defense), with bases 0.625 inside, 0.435 midrange and 0.31 three. It is bounded to [0.02,0.98]; three-point shooters below 50 receive a separate range factor. An otherwise identical five-rating-point increase changes the unclamped base by one percentage point. The inspected 60–95 grid is smooth and monotonic for both offense and defense. It is a pure probability-function test, not a claim that a whole game changes by that amount.


| Shooter rating vs 75 defense | Inside probability | Midrange probability | Three probability |
| --- | --- | --- | --- |
| 60 | 59.50% | 40.50% | 28.00% |
| 65 | 60.50% | 41.50% | 29.00% |
| 70 | 61.50% | 42.50% | 30.00% |
| 75 | 62.50% | 43.50% | 31.00% |
| 80 | 63.50% | 44.50% | 32.00% |
| 85 | 64.50% | 45.50% | 33.00% |
| 90 | 65.50% | 46.50% | 34.00% |
| 95 | 66.50% | 47.50% | 35.00% |

Additional terms include contest status, IQ, physical matchup, isolation/pick-and-roll context, lineup spacing/passing, fatigue, coaching, workload and league settings. Three-point contests add a bounded defense-dependent penalty beyond the base matchup term. This is stacking of distinct modeled effects, not automatically evidence of erroneous duplicate application.

Physical mismatches: contested height advantages can reduce the contest scale no lower than 0.8; post weight advantage contributes at most +0.035; drive size mismatch at most +0.025; recovery at most 0.012. Biography-derived attributes are applied once by a wrapper and restored after simulation. Defensive fatigue is read from the currently selected defender, preserving the earlier switch-attribution correction. Rebounding uses active units, position/build/tendency weights and league-era priors. Ball handling and passing influence several explicit possession branches; Phase 6 did not replace them with a global turnover multiplier.

The model does have simplifications: secondary-shot defenders can remain inherited from the preceding matchup rather than a spatial reassignment; broad “open”/“contest” flags do not encode measured separation distance. These are modeling limitations, not confirmed quantitatively responsible defects in this audit.

## 6. Controlled mechanism tests
A: identical rosters/coaches/rest, neutralized home effects. B: away three-point tendency set to 95 and midrange to 10. C: away perimeter/rim/DIQ/steal/block attributes +12; additional poor-defense control −12. D: away coach defense/tactics attributes set to 95. E: away bench basketball skill attributes −15, starters unchanged. F: away endurance −25. G: away three-point skill +15. H: away rebounding +15. I: away dribbling/passing +15. J: away tempo set to 95. Attributes remain bounded to 25–99 in these test mutations. These are contextual interventions, not forecasts of an exact real player upgrade.

### NBA

| Variant | N | Points/team | Mean absolute margin | Early home margin | Within 10 % | 20+ % | 30+ % | Paired abs-margin change [95% bootstrap] |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| identical | 160 | 111.87 | 12.53 | 0.63 | 46.25 | 20.62 | 2.50 | 0.00 [0.00, 0.00] |
| selection | 160 | 111.79 | 12.50 | 0.50 | 55.00 | 20.62 | 3.75 | -0.03 [-2.03, 1.86] |
| defense | 160 | 108.92 | 14.40 | -6.09 | 48.12 | 28.75 | 11.25 | 1.87 [-0.34, 3.89] |
| poor-defense | 160 | 117.25 | 15.41 | 6.81 | 40.62 | 27.50 | 13.12 | 2.88 [0.88, 5.08] |
| coaching | 160 | 111.24 | 11.73 | -1.30 | 54.37 | 18.12 | 3.12 | -0.80 [-2.28, 0.68] |
| bench | 160 | 112.18 | 15.86 | 7.11 | 38.75 | 31.87 | 14.37 | 3.33 [1.27, 5.49] |
| fatigue | 160 | 113.51 | 12.93 | 1.38 | 49.38 | 23.75 | 5.62 | 0.40 [-1.36, 2.17] |
| three | 160 | 113.97 | 12.59 | -0.23 | 53.75 | 20.62 | 6.88 | 0.06 [-1.54, 1.74] |
| rebounds | 160 | 111.04 | 14.83 | -0.87 | 45.62 | 28.12 | 7.50 | 2.30 [0.73, 4.03] |
| handling | 160 | 115.00 | 13.09 | -1.81 | 52.50 | 23.12 | 5.00 | 0.56 [-1.24, 2.58] |
| pace | 160 | 115.95 | 13.34 | 0.14 | 46.25 | 23.12 | 6.25 | 0.81 [-0.53, 2.27] |

### WNBA

| Variant | N | Points/team | Mean absolute margin | Early home margin | Within 10 % | 20+ % | 30+ % | Paired abs-margin change [95% bootstrap] |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| identical | 160 | 87.18 | 11.46 | 0.76 | 57.50 | 16.25 | 4.38 | 0.00 [0.00, 0.00] |
| selection | 160 | 85.60 | 12.80 | -0.31 | 49.38 | 20.62 | 5.62 | 1.34 [-0.46, 3.13] |
| defense | 160 | 84.13 | 12.41 | -5.83 | 54.37 | 20.62 | 5.00 | 0.95 [-0.96, 2.81] |
| poor-defense | 160 | 90.92 | 12.50 | 4.74 | 50.62 | 21.25 | 5.62 | 1.04 [-0.69, 2.99] |
| coaching | 160 | 86.50 | 11.84 | -0.14 | 58.75 | 20.00 | 5.62 | 0.38 [-0.72, 1.51] |
| bench | 160 | 86.66 | 13.12 | 5.95 | 51.88 | 25.62 | 8.12 | 1.66 [-0.40, 3.76] |
| fatigue | 160 | 86.57 | 13.14 | 0.28 | 44.38 | 22.50 | 5.00 | 1.68 [-0.16, 3.46] |
| three | 160 | 88.08 | 11.11 | 0.26 | 56.25 | 11.25 | 3.12 | -0.35 [-1.94, 1.39] |
| rebounds | 160 | 86.54 | 11.84 | 0.84 | 55.00 | 18.75 | 6.88 | 0.38 [-0.61, 1.46] |
| handling | 160 | 89.27 | 13.26 | -3.84 | 46.88 | 21.25 | 6.25 | 1.80 [0.01, 3.60] |
| pace | 160 | 89.55 | 11.39 | 1.33 | 53.12 | 12.50 | 4.38 | -0.07 [-1.61, 1.43] |

The early home margin is signed after the first three quarters; changes are made to the away team. A stronger away defense should generally lower that value, whereas a weaker away bench should raise it. Shared seeds do not maintain identical later RNG branches after a strategic or attribute intervention. Bootstrap intervals resample 160 paired trial seeds; they do not represent a large population of independent roster designs. Multiple variants were examined without a multiplicity-adjusted discovery claim. Wide intervals and small effects must not be reported as established calibration defects.

## 7. Shot quality versus shooting outcomes
Every scoring Bernoulli draw is logged at its final probability: primary attempts, shooting-foul continuation shots, putbacks, kick-outs and free throws. Blocked attempts are recorded with zero make probability after the block has resolved. Thus the expectation is conditional on the actual block outcome and reached action history; it does not audit the block lottery itself as a make draw. Scoring draws sum exactly to each final team score. A 30-game neutral instrumentation test reproduced scores, player boxes, summary data and PBP byte-equivalently after JSON normalization. The hooks consume the original RNG draw once and add no draw.

“Expected points” below means the sum of value×conditional probability along the realized path, not an ex-ante pregame expected score. Shooting-foul misses are included as scoring opportunities but are not official FGA. The record distinguishes those cases. For broad shot-quality categories, flags overlap and are not comprehensively attached to blocked and secondary attempts. These are modeled opportunities, not a tracking-data definition of NBA shot quality.

### NBA identical-roster sample

| Category | Scoring draws | Official FGA in category | Expected make % | Observed make % | Expected points/draw | Observed points/draw | Shooter skill | Defender skill | Fatigue fraction |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inside | 11245 | 10234 | 58.70 | 58.86 | 1.17 | 1.18 | 80.50 | 73.35 | 0.15 |
| mid | 6791 | 5924 | 41.56 | 41.57 | 0.83 | 0.83 | 78.77 | 73.92 | 0.14 |
| three | 12575 | 12447 | 32.68 | 32.14 | 0.98 | 0.96 | 81.73 | 75.58 | 0.14 |
| open | 8976 | 8609 | 39.04 | 38.89 | 1.05 | 1.04 | 82.28 | 75.79 | 0.14 |
| contest | 5646 | 5063 | 47.10 | 47.15 | 0.99 | 1.00 | 81.14 | 74.67 | 0.15 |
| assisted | 19639 | 18251 | 43.35 | 43.22 | 1.03 | 1.03 | 80.62 | 74.23 | 0.15 |
| selfCreated | 1337 | 1323 | 29.36 | 29.32 | 0.88 | 0.88 | 80.91 | 74.00 | 0.14 |
| transition | 14749 | 13734 | 41.75 | 41.49 | 1.01 | 1.00 | 80.50 | 75.06 | 0.15 |
| late | 284 | 251 | 48.61 | 46.13 | 1.05 | 0.97 | 81.14 | 73.61 | 0.14 |
| secondChance | 3433 | 3433 | 59.27 | 58.49 | 1.21 | 1.19 | 78.97 | 70.53 | Unavailable |
| freeThrow | 6156 | 0 | 77.71 | 77.76 | 0.78 | 0.78 | Unavailable | Unavailable | Unavailable |

Primary pre-final-clamp probability at/beyond the 0.02/0.88 clamp: 0.02% of recorded unblocked ordinary primary draws. This excludes the separately bounded foul branch.

### WNBA identical-roster sample

| Category | Scoring draws | Official FGA in category | Expected make % | Observed make % | Expected points/draw | Observed points/draw | Shooter skill | Defender skill | Fatigue fraction |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inside | 9347 | 8396 | 53.29 | 53.32 | 1.07 | 1.07 | 79.33 | 69.26 | 0.20 |
| mid | 6613 | 5710 | 37.71 | 37.18 | 0.75 | 0.74 | 80.81 | 71.33 | 0.19 |
| three | 8844 | 8752 | 31.27 | 30.98 | 0.94 | 0.93 | 80.76 | 72.91 | 0.17 |
| open | 6104 | 5831 | 37.12 | 36.42 | 0.99 | 0.97 | 81.50 | 73.16 | 0.17 |
| contest | 5098 | 4499 | 41.19 | 41.60 | 0.87 | 0.88 | 80.19 | 71.00 | 0.19 |
| assisted | 16084 | 14730 | 40.03 | 39.90 | 0.94 | 0.93 | 79.69 | 71.33 | 0.19 |
| selfCreated | 1228 | 1212 | 27.84 | 28.18 | 0.84 | 0.85 | 81.32 | 72.64 | 0.17 |
| transition | 12217 | 11214 | 39.37 | 39.01 | 0.93 | 0.92 | 80.63 | 71.48 | 0.19 |
| late | 221 | 201 | 43.78 | 47.96 | 0.93 | 1.02 | 79.79 | 72.09 | 0.20 |
| secondChance | 2732 | 2732 | 55.31 | 55.31 | 1.12 | 1.12 | 77.55 | 67.04 | Unavailable |
| freeThrow | 6067 | 0 | 78.60 | 78.98 | 0.79 | 0.79 | Unavailable | Unavailable | Unavailable |

Primary pre-final-clamp probability at/beyond the 0.02/0.88 clamp: 0.00% of recorded unblocked ordinary primary draws. This excludes the separately bounded foul branch.

## 8. Randomness and residual variance
For each scoring draw j, conditional variance is value_j²×p_j×(1−p_j). The squared home-minus-away shooting residual is compared with the sum of these conditional variances. Under the engine’s sequential independent draws, their expectations agree; finite-sample ratios need not equal one. Paths and probabilities can change after makes/misses. This is not a fixed-shot-binomial assumption and is not a test that the model matches real basketball.


| League / variant | Early residual MSE / modeled variance | 95% bootstrap interval | Early residual variance | Mean modeled variance |
| --- | --- | --- | --- | --- |
| NBA identical | 1.04 | [0.86, 1.26] | 197.43 | 189.26 |
| NBA defense | 1.10 | [0.89, 1.32] | 205.34 | 186.21 |
| NBA bench | 0.88 | [0.68, 1.12] | 165.04 | 187.84 |
| NBA three | 1.05 | [0.85, 1.29] | 201.35 | 192.75 |
| WNBA identical | 1.19 | [0.93, 1.48] | 172.29 | 145.62 |
| WNBA defense | 1.08 | [0.85, 1.32] | 153.43 | 142.83 |
| WNBA bench | 1.04 | [0.82, 1.30] | 151.88 | 145.48 |
| WNBA three | 1.18 | [0.97, 1.43] | 171.77 | 147.27 |

No unbounded game-level shooting multiplier was found. A broad outcome distribution under identical rosters is not by itself proof of a defective RNG. Conversely, consistency with the engine’s own probabilities does not validate those probabilities or their shot-opportunity process against reality. This phase does not justify suppressing independent misses, adding correlated makes, or flattening ratings.

## 9. Rotation-aware quality and out-of-sample attribution
Reused the Phase 4 diagnostic rotation projection: anticipated minutes, active availability, stamina, derived physical attributes, offensive/defensive skill, bench share and coach context. Healthy/injured/fatigued tests pass for both leagues, including zero minutes for unavailable players, correct total court minutes, unchanged source state and no RNG consumption. Projection remains diagnostic; no hidden team bonus or production spread replacement was added.

Retained Phase 4 coefficients are evaluated without refitting. A separate ridge model uses world seeds 301–302 for training and 303–304 for evaluation. The ridge penalty is fixed at 10 rather than selected on test results. Unseen worlds, not a random mix of games from the same roster world, define the split. Only two held-out roster worlds per league limit generalization.

### NBA

| Margin prediction method | Held-out games | MAE | RMSE |
| --- | --- | --- | --- |
| Production spread | 320 | 13.16 | 16.26 |
| Retained Phase 4 rotation model | 320 | 13.23 | 16.64 |
| New diagnostic ridge rotation model | 320 | 13.31 | 16.66 |

| Absolute retained rotation-model gap, excluding home intercept | N | Mean margin | 20+ % | Actual efficiency-gap SD |
| --- | --- | --- | --- | --- |
| 0-2 | 70 | 14.21 | 20.00 | 16.44 |
| 2-5 | 84 | 13.24 | 25.00 | 16.38 |
| 5-10 | 101 | 13.90 | 30.69 | 17.37 |
| 10-100 | 65 | 16.05 | 33.85 | 19.77 |

| Efficiency-gap model / period | Train N | Test N | MAE | RMSE | Held-out R² |
| --- | --- | --- | --- | --- | --- |
| projectedOVR / early | 320 | 320 | 15.36 | 19.61 | 0.11 |
| rotation / early | 320 | 320 | 15.44 | 19.68 | 0.10 |
| rotationAndObservedShotQuality / early | 320 | 320 | 14.35 | 18.33 | 0.22 |
| observedBox / early | 320 | 320 | 14.34 | 18.28 | 0.22 |
| projectedOVR / full | 320 | 320 | 13.65 | 16.90 | 0.09 |
| rotation / full | 320 | 320 | 13.70 | 17.15 | 0.06 |
| rotationAndObservedShotQuality / full | 320 | 320 | 12.50 | 15.77 | 0.21 |
| observedBox / full | 320 | 320 | 12.66 | 15.93 | 0.19 |

### WNBA

| Margin prediction method | Held-out games | MAE | RMSE |
| --- | --- | --- | --- |
| Production spread | 320 | 12.96 | 16.04 |
| Retained Phase 4 rotation model | 320 | 12.89 | 16.32 |
| New diagnostic ridge rotation model | 320 | 12.59 | 16.04 |

| Absolute retained rotation-model gap, excluding home intercept | N | Mean margin | 20+ % | Actual efficiency-gap SD |
| --- | --- | --- | --- | --- |
| 0-2 | 71 | 15.28 | 29.58 | 23.31 |
| 2-5 | 97 | 12.11 | 17.53 | 17.75 |
| 5-10 | 116 | 12.79 | 21.55 | 19.60 |
| 10-100 | 36 | 13.58 | 22.22 | 21.29 |

| Efficiency-gap model / period | Train N | Test N | MAE | RMSE | Held-out R² |
| --- | --- | --- | --- | --- | --- |
| projectedOVR / early | 320 | 320 | 17.37 | 21.82 | 0.00 |
| rotation / early | 320 | 320 | 17.24 | 21.86 | -0.00 |
| rotationAndObservedShotQuality / early | 320 | 320 | 16.16 | 20.28 | 0.14 |
| observedBox / early | 320 | 320 | 15.48 | 19.30 | 0.22 |
| projectedOVR / full | 320 | 320 | 16.64 | 20.47 | -0.03 |
| rotation / full | 320 | 320 | 15.96 | 20.31 | -0.01 |
| rotationAndObservedShotQuality / full | 320 | 320 | 15.15 | 19.10 | 0.11 |
| observedBox / full | 320 | 320 | 14.04 | 17.67 | 0.24 |

Prediction result: on these held-out worlds the richer rotation model does not reliably improve error over the existing spread. NBA MAE is slightly worse; WNBA MAE is modestly lower but RMSE is essentially unchanged. This sample does not justify replacing the production prediction formula, and it supplies no causal explanation for the remaining blowout discrepancy.

Gap groups use the retained rotation model’s predicted margin contribution, not raw OVR points. “rotationAndObservedShotQuality” and “observedBox” are retrospective association models using realized opportunities and box events; they are not pregame forecasts. They cannot establish causal percentage shares. Shooting residuals are reported separately rather than fed back as a tautological target predictor. Negative held-out R² means worse than predicting the held-out mean. Coefficients of correlated skill features should not be interpreted as causal effects or recommended gameplay weights.

Per-game offensive rating, opponent rating, realized gap, conditional shot-path expectation, roster-predicted gap and residual are retained for the held-out diagnostic games. Quarter ratings and raw estimated possession denominators are also retained. The 14,700-game reproduction preserves the prior full-season fields; it does not retroactively claim rotation projections or per-shot instrumentation for every historical baseline game.

## 10. Scoring runs and coaching responses
An unanswered run is consecutive scoring by one side until the opponent next scores. Made free throws count individually; missed shots do not end a run. Full-game runs may cross a quarter boundary; quarter-specific results reset at the boundary. The same definition is applied to validated real score-change events. Identical-roster fixtures and the availability-biased real subset have different team-quality mixes, so this table is descriptive, not a matched league-wide test. Runs with intervening official score corrections are excluded from real run comparisons.


| League / source | Games | Mean runs/game | Mean largest run | Mean within-game run size | Mean lead changes | Mean scoring ties |
| --- | --- | --- | --- | --- | --- | --- |
| NBA / Identical fixture | 160 | 69.32 | 10.78 | 3.25 | 6.51 | 5.12 |
| NBA / Official PBP | 135 | 66.15 | 11.96 | 3.44 | 6.85 | 4.62 |
| WNBA / Identical fixture | 160 | 53.66 | 10.40 | 3.28 | 5.59 | 4.56 |
| WNBA / Official PBP | 40 | 48.73 | 11.43 | 3.43 | 4.70 | 3.92 |

| League / quarter | Simulation mean largest run | Real subset mean largest run |
| --- | --- | --- |
| NBA Q1 | 7.86 | 8.16 |
| NBA Q2 | 8.04 | 8.85 |
| NBA Q3 | 8.38 | 9.16 |
| NBA Q4 | 8.00 | 8.24 |
| WNBA Q1 | 7.89 | 7.78 |
| WNBA Q2 | 7.75 | 8.40 |
| WNBA Q3 | 7.63 | 7.83 |
| WNBA Q4 | 7.47 | 8.05 |

Actual coaching behavior: offense/defense, fit, discipline and tempo contribute bounded terms. An eight-point scoring run can trigger a tactics-dependent timeout, up to the existing four-timeout counter. This reduces crowd momentum and applies a 0.015 defensive adjustment for six possessions; it does not stack an unbounded run bonus. Rotations respond to planned minutes, stamina, stint length, availability, foul trouble, closing situations and garbage time. Matchup selection uses position/archetype/action logic. A comprehensive adaptive system that diagnoses an opponent’s observed shot chart and changes coverage or personnel was not found and was not invented for this report.


| League / preceding event | Observed events | Opponent net points over next six recorded possessions |
| --- | --- | --- |
| WNBA / timeout | 278 | 0.09 |
| WNBA / substitution | 7885 | 0.01 |
| WNBA / turnover | 4147 | 0.04 |
| WNBA / offensiveRebound | 2704 | 0.04 |
| NBA / timeout | 356 | -0.12 |
| NBA / substitution | 8758 | 0.01 |
| NBA / turnover | 4116 | 0.10 |
| NBA / offensiveRebound | 3416 | -0.09 |

Context sample: 160 additional identical-roster games per league. The event’s team is the reference team for timeout/substitution rows; the ball-owning side is the reference for turnover/rebound rows. Following windows may overlap and end early at the final buzzer. Timeouts are selected after runs and substitutions after fatigue/fouls; these are selection-biased associations, not estimates of causal coaching effectiveness.

## 11. Full-season reproduction and before/after table
### NBA

| Metric | Phase 5 | Phase 6 unchanged | Complete-season reference |
| --- | --- | --- | --- |
| Points/team | 112.82 | 112.82 | 113.83 |
| Mean winning margin | 14.77 | 14.77 | 12.75 |
| Median margin | 12.00 | 12.00 | 10.00 |
| Within five % | 20.02 | 20.02 | 25.12 |
| Within ten % | 43.72 | 43.72 | 50.16 |
| 20+ % | 28.20 | 28.20 | 21.06 |
| 30+ % | 10.19 | 10.19 | 6.50 |
| 40+ % | 2.74 | 2.74 | 1.79 |
| 50+ % | 0.53 | 0.53 | 0.41 |
| Overtime % | 2.41 | 2.41 | 4.88 |
| Three-point % | 33.61 | 33.61 | 36.02 |
| Estimated ORtg / opponent DRtg | 113.93 | 113.93 | 111.64 |
| Opposing-score correlation | 0.11 | 0.11 | 0.22 |
| Spread MAE | 13.51 | 13.51 | Unavailable |
| Spread RMSE | 16.81 | 16.81 | Unavailable |
| Home win % | 55.23 | 55.23 | 54.47 |

| Metric | Across-seed mean [95% CI] |
| --- | --- |
| points | 112.82 [112.56, 113.08] |
| meanMargin | 14.77 [14.46, 15.07] |
| close10% | 43.72 [42.51, 44.94] |
| blow20 | 28.20 [27.03, 29.38] |
| blow30 | 10.19 [9.17, 11.20] |
| blow40 | 2.74 [2.38, 3.10] |
| blow50 | 0.53 [0.31, 0.74] |
| OT% | 2.41 [2.00, 2.83] |
| 3P% | 33.61 [33.48, 33.74] |
| scoreCorrelation | 0.11 [0.09, 0.13] |
| homeWin% | 55.23 [54.18, 56.28] |
| MAE | 13.51 [13.26, 13.75] |

| Seed | Games | Points/team | Mean margin | 20+ % | OT % |
| --- | --- | --- | --- | --- | --- |
| 101 | 1230 | 112.61 | 14.85 | 28.94 | 2.44 |
| 102 | 1230 | 113.04 | 14.74 | 28.46 | 1.14 |
| 103 | 1230 | 112.93 | 14.07 | 25.61 | 2.68 |
| 104 | 1230 | 112.14 | 14.46 | 27.24 | 1.79 |
| 105 | 1230 | 112.75 | 15.67 | 30.49 | 2.44 |
| 106 | 1230 | 112.83 | 14.45 | 26.99 | 2.68 |
| 107 | 1230 | 113.06 | 14.89 | 27.97 | 2.60 |
| 108 | 1230 | 113.51 | 14.72 | 29.43 | 3.09 |
| 109 | 1230 | 112.67 | 14.71 | 26.50 | 2.28 |
| 110 | 1230 | 112.64 | 15.12 | 30.41 | 3.01 |

### WNBA

| Metric | Phase 5 | Phase 6 unchanged | Complete-season reference |
| --- | --- | --- | --- |
| Points/team | 85.48 | 85.48 | 81.67 |
| Mean winning margin | 12.79 | 12.79 | 10.82 |
| Median margin | 10.00 | 10.00 | 9.00 |
| Within five % | 23.50 | 23.50 | 25.42 |
| Within ten % | 50.12 | 50.12 | 52.92 |
| 20+ % | 20.54 | 20.54 | 9.17 |
| 30+ % | 5.83 | 5.83 | 2.92 |
| 40+ % | 1.17 | 1.17 | 0.00 |
| 50+ % | 0.17 | 0.17 | 0.00 |
| Overtime % | 2.83 | 2.83 | 3.33 |
| Three-point % | 31.05 | 31.05 | 33.82 |
| Estimated ORtg / opponent DRtg | 104.67 | 104.67 | 99.29 |
| Opposing-score correlation | 0.10 | 0.10 | 0.28 |
| Spread MAE | 11.61 | 11.61 | Unavailable |
| Spread RMSE | 14.45 | 14.45 | Unavailable |
| Home win % | 55.62 | 55.62 | 52.50 |

| Metric | Across-seed mean [95% CI] |
| --- | --- |
| points | 85.48 [85.14, 85.81] |
| meanMargin | 12.79 [12.31, 13.27] |
| close10% | 50.12 [48.57, 51.68] |
| blow20 | 20.54 [18.75, 22.33] |
| blow30 | 5.83 [4.34, 7.33] |
| blow40 | 1.17 [0.68, 1.65] |
| blow50 | 0.17 [-0.12, 0.45] |
| OT% | 2.83 [2.39, 3.27] |
| 3P% | 31.05 [30.77, 31.34] |
| scoreCorrelation | 0.10 [0.05, 0.16] |
| homeWin% | 55.62 [53.25, 58.00] |
| MAE | 11.61 [11.21, 12.01] |

| Seed | Games | Points/team | Mean margin | 20+ % | OT % |
| --- | --- | --- | --- | --- | --- |
| 101 | 240 | 84.72 | 12.65 | 20.83 | 2.50 |
| 102 | 240 | 86.09 | 12.05 | 18.33 | 3.33 |
| 103 | 240 | 85.87 | 13.00 | 22.08 | 2.50 |
| 104 | 240 | 85.51 | 13.54 | 20.00 | 2.50 |
| 105 | 240 | 85.36 | 13.43 | 21.67 | 3.33 |
| 106 | 240 | 85.70 | 12.75 | 22.92 | 4.17 |
| 107 | 240 | 85.46 | 11.65 | 14.58 | 2.50 |
| 108 | 240 | 86.06 | 12.14 | 20.42 | 2.08 |
| 109 | 240 | 84.87 | 13.05 | 22.50 | 2.92 |
| 110 | 240 | 85.11 | 13.65 | 22.08 | 2.50 |

Confidence intervals are t intervals across ten season means, not pooled independent-game intervals. Identical reproduction means paired differences are exactly zero, with no new balance effect to estimate. Estimated league ORtg and corresponding aggregate opponent DRtg are reciprocal descriptions of the same scoring environment, not two independent checks. No real spread-error benchmark was retained.

## 12. Historical and save/load regression
Thirty full-length games each in NBA 1997, NBA 2025, WNBA 1997, WNBA 2006 and WNBA 2024: 150 games passed scoring identity, period format, accumulated minutes, monotonic summary times, nonnegative statistics, shot-count bounds and legal winner checks. These are fictional-roster format tests, not historical distribution calibration. Period, shot-clock, foul and OT settings were not changed.

A current Phase 5 career save was serialized and loaded with completed scores, boxes and summary events unchanged. Forty actual game/feat regression cases plus synthetic recognition tests passed; repeat finalization remains idempotent. Production day progression/save-load checks passed. Thirty instrumentation comparisons reproduced complete PBP, boxes and scoring. Six projection checks verified availability, fatigue, court minutes, state and RNG integrity. All Phase 1–5 production files, completed audit outputs and custom city photographs covered by the baseline hash manifest remain unchanged.

## 13. Files added and production status
No existing production gameplay JS, player schema, contract, morale, GM, schedule, city-photo or save code was modified. New developer files: phase6-instrument.cjs, phase6-diagnostic.cjs, phase6-context.cjs, phase6-analysis.py, phase6-model.py, phase6-statistics.py, phase6-compress.py, phase6-reference-efficiency.py, phase6-fetch-reference.py, phase6-notes.py, audit-phase6-season.cjs, run-phase6*.cjs, phase6-historical.cjs, test-phase6-{instrument,projection,save,feats}.cjs, verify-phase6.py and report-phase6.py.

New records live in dev/phase6/ and dev/balance-audit/phase6-*.json. The user-facing report is docs/PHASE6-COMPETITIVENESS.md and dist/audits/phase6.{html,txt,zip}. Large raw controlled datasets are losslessly gzip-compressed for storage. No prior results are overwritten. The published change is the audit/report, not an altered engine.

## 14. What is established, and what remains unsupported
Established: the full-season efficiency-gap discrepancy is real under a consistent box estimator; separation develops across early periods; actual defense/bench quality influences simulated outcomes; the original strength estimate omits important skill/rotation information; instrumentation conserves scoring and RNG; current fixtures reproduce the published engine.

Not established: that the independent RNG is defective; that one coefficient causes the blowout gap; that a common shooting multiplier is needed; that an apparent model improvement proves gameplay improvement; or that the limited real quarter sample identifies a league-wide causal mechanism. There is no justified accuracy/defense/ratings correction to accept on this evidence.

Remaining gaps: complete representative quarter/PBP coverage; real quarter possession validation; matched real shot-quality/separation data; causal separation of correlated talent and tactics; broader held-out roster-world coverage; a comprehensive opponent-responsive defensive AI; and the previously disclosed Phase 5 late-game/historical limitations. The WNBA reference’s zero 40-point blowouts remains a small-sample observation, not a prohibited outcome.

A useful next experiment would validate opportunity quality with representative real shot-location/contest data and compare genuinely matched rotation profiles over more independently generated worlds. It should use a predetermined acceptance gate for scoring and margin distributions. It should not start by reducing variance or adding a shared random shooting factor.

## 15. Sources and reproduction
Official reference endpoints and retained data:

- NBA PBP: https://stats.nba.com/stats/playbyplayv3?GameID=<ID>&StartPeriod=0&EndPeriod=0
- WNBA PBP: https://cdn.wnba.com/static/json/liveData/playbyplay/playbyplay_<ID>.json
- Official Mystics game notes, quarter-scoring table page 25: https://cdn.wnba.com/sites/1611661322/2025/05/WAS.CON-08.31.24.pdf
- Official NBA statistics: https://www.nba.com/stats/teams/scoring?Season=2024-25
- Official WNBA box-score index: https://stats.wnba.com/teams/boxscores-traditional/?Season=2024&SeasonType=Regular+Season
- Retained full-season official game logs: dev/phase3/real-nba-2025.json and real-wnba-2024.json; reference summary in dev/phase4/reference-analysis.json.

The fetch manifest records every attempted game ID, URL and failure. The notes parser validates final totals and deduplicates PBP overlaps. Source-code findings are based on the exact published Phase 5 commit, not a newly invented engine.

From project root: node dev/run-phase6.cjs seasons; node dev/run-phase6.cjs diagnostic; python dev/phase6-analysis.py; python dev/phase6-model.py; python dev/phase6-statistics.py; python dev/verify-phase6.py; python dev/report-phase6.py. Completed outputs are retained/reused. Context, historical, save and instrumentation test commands are individual dev/phase6-*.cjs / test-phase6-*.cjs scripts. Preserve archived outputs before deliberately rerunning any dataset.

