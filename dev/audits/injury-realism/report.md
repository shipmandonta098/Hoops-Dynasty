# Injury realism — 5-season audit, before vs after

NBA, 30 teams, 10 / 10 seasons (seeds 2026, 2027), full seasons with playoffs and offseason. Before = main, after = this branch at an injury-frequency scale of 0.86 (the final audit run; the shipped scale is 0.92, see Calibration).

| Metric | Before | After |
|---|---|---|
| Injuries per season (all contexts) | 98.80 | 86.30 |
| In-game injuries per season | 82.10 | 71.20 |
| Day-to-day share of all injuries % | 0.00 | 38.82 |
| Severe share % | 3.95 | 3.01 |
| Moderate share % | 20.95 | 17.50 |
| Minor share % | 75.10 | 79.49 |
| Player-games missed per team per season (mean) | 9.08 | 7.61 |
| … median / min / max | 4 / 0 / 101 | 2 / 0 / 72 |
| ACL/Achilles tears (total) | 13 | 7 |
| … permanent OVR / speed / jumping change (records) | 0.00 / 0.00 / 0.00 | -1.57 / -3.57 / -4.57 |
| … never the same % | — | 28.57 |
| … reinjury window / minutes-restriction days | 14 / 0 | 60 / 21 |
| … retired the same offseason | 0 | 0 |

## Before: injuries by type (days missed excludes day-to-day)

| Type | Severity | Per season | Day-to-day % | Days min / p25 / median / p75 / max | Mean | % at min |
|---|---|---|---|---|---|---|
| calf tightness | Minor | 12.8 | 0 | 1 / 1 / 2 / 2 / 2 | 1.6 | 45 |
| hip contusion | Minor | 11.4 | 0 | 1 / 1 / 1 / 2 / 2 | 1.4 | 55 |
| ankle sprain | Minor | 11.1 | 0 | 1 / 2 / 2 / 3 / 3 | 2.1 | 18 |
| jammed finger | Minor | 10.7 | 0 | 1 / 1 / 1 / 1 / 2 | 1.1 | 88 |
| back spasms | Minor | 10.5 | 0 | 1 / 1 / 2 / 2 / 3 | 1.9 | 32 |
| sore knee | Minor | 10.0 | 0 | 1 / 1 / 1 / 2 / 2 | 1.5 | 51 |
| twisted ankle | Minor | 7.7 | 0 | 1 / 1 / 2 / 2 / 2 | 1.5 | 45 |
| calf strain | Moderate | 4.2 | 0 | 7 / 7 / 10 / 11 / 14 | 9.7 | 31 |
| sprained wrist | Moderate | 3.8 | 0 | 6 / 6 / 7 / 9 / 13 | 7.9 | 32 |
| groin strain | Moderate | 3.6 | 0 | 7 / 8 / 9 / 12 / 15 | 9.9 | 17 |
| hamstring strain | Moderate | 3.5 | 0 | 7 / 8 / 11 / 13 / 17 | 11.2 | 14 |
| bone bruise | Moderate | 2.9 | 0 | 7 / 9 / 11 / 15 / 17 | 11.6 | 7 |
| high ankle sprain | Moderate | 2.7 | 0 | 10 / 12 / 15 / 17 / 23 | 15.0 | 15 |
| fractured foot | Severe | 1.2 | 0 | 60 / 61 / 75 / 83 / 91 | 75.0 | 17 |
| torn Achilles | Severe | 1.0 | 0 | 270 / 270 / 270 / 270 / 298 | 276.0 | 70 |
| knee ligament injury | Severe | 0.7 | 0 | 136 / 164 / 173 / 181 / 187 | 170.3 | 14 |
| torn meniscus | Severe | 0.7 | 0 | 47 / 48 / 56 / 60 / 71 | 57.3 | 14 |
| torn ACL | Severe | 0.3 | 0 | 240 / 240 / 240 / 240 / 249 | 243.0 | 67 |

## After: injuries by type (days missed excludes day-to-day)

| Type | Severity | Per season | Day-to-day % | Days min / p25 / median / p75 / max | Mean | % at min |
|---|---|---|---|---|---|---|
| hip contusion | Minor | 10.6 | 32 | 1 / 1 / 1 / 2 / 2 | 1.3 | 67 |
| sore knee | Minor | 10.6 | 32 | 1 / 1 / 1 / 1 / 2 | 1.2 | 79 |
| calf tightness | Minor | 10.5 | 44 | 1 / 1 / 1 / 2 / 2 | 1.3 | 73 |
| back spasms | Minor | 10.5 | 37 | 1 / 2 / 2 / 3 / 4 | 2.1 | 18 |
| ankle sprain | Minor | 9.3 | 71 | 1 / 2 / 2 / 2 / 3 | 2.1 | 15 |
| twisted ankle | Minor | 8.7 | 64 | 1 / 1 / 1 / 1 / 2 | 1.2 | 77 |
| jammed finger | Minor | 8.4 | 71 | 1 / 1 / 1 / 1 / 1 | 1.0 | 100 |
| hamstring strain | Moderate | 3.6 | 0 | 8 / 10 / 12 / 15 / 18 | 12.6 | 8 |
| groin strain | Moderate | 2.8 | 0 | 7 / 9 / 11 / 12 / 15 | 11.1 | 4 |
| high ankle sprain | Moderate | 2.7 | 0 | 22 / 26 / 30 / 33 / 37 | 29.9 | 7 |
| calf strain | Moderate | 1.9 | 0 | 15 / 17 / 20 / 20 / 25 | 19.5 | 5 |
| bone bruise | Moderate | 1.4 | 0 | 8 / 10 / 12 / 13 / 20 | 12.6 | 7 |
| MCL sprain | Moderate | 1.3 | 0 | 16 / 18 / 22 / 26 / 31 | 22.6 | 8 |
| meniscus trim | Moderate | 0.7 | 0 | 31 / 34 / 41 / 42 / 43 | 39.0 | 14 |
| sprained wrist | Moderate | 0.7 | 0 | 7 / 8 / 8 / 9 / 11 | 8.7 | 14 |
| fractured foot | Severe | 0.8 | 0 | 70 / 74 / 85 / 89 / 91 | 83.6 | 12 |
| meniscus repair | Severe | 0.7 | 0 | 137 / 158 / 166 / 166 / 177 | 162.4 | 14 |
| torn Achilles | Severe | 0.5 | 0 | 331 / 352 / 352 / 378 / 418 | 366.2 | 20 |
| MCL tear | Severe | 0.4 | 0 | 83 / 83 / 92 / 100 / 105 | 95.0 | 25 |
| torn ACL | Severe | 0.2 | 0 | 361 / 361 / 361 / 361 / 384 | 372.5 | 50 |

## Season rating change for the season of the injury (start → end, incl. offseason development) vs uninjured peers

| Group | Before n / OVR / SPD / JMP | After n / OVR / SPD / JMP |
|---|---|---|
| acl/achilles | 0 / — / — / — | 7 / -1.86 / -4.14 / -5.14 |
| peers 30+ | 1039 / -1.60 / -1.84 / -1.84 | 1051 / -1.44 / -1.66 / -1.66 |
| peers <30 | 3329 / 0.30 / -0.17 / -0.20 | 3301 / 0.33 / -0.15 / -0.21 |
| acl/achilles 30+ | 0 / — / — / — | 0 / — / — / — |


## Calibration: games missed per team

Player-games missed per team per regular season (seeds 2026 / 2027). Before (main): 8.56 / 9.61 → mean 9.09.

| Injury-frequency scale | Seeds 2026 / 2027 | Mean | Mean ÷ scale |
|---|---|---|---|
| 0.92 | 11.32 / 9.85 | 10.59 | 11.51 |
| 0.8 | 6.9 / 7.95 | 7.43 | 9.28 |
| 0.86 | 6.47 / 8.75 | 7.61 | 8.85 |

Seed-to-seed noise is larger than the scale effect (the 0.92 run came out high, the 0.80 and 0.86 runs low). Pooling all six runs per unit of scale gives 9.88 ± 0.68; the baseline 9.09 needs a scale of 0.92 (range 0.86–0.99). The expected games missed per injury agree: 2.10 before vs 2.28 after → 0.92. **Shipped: 0.92.** The 0.92 and 0.80 runs predate the fix that applies ACL/Achilles rating losses after the game, so only the final (0.86) run's rating rows are used above; games missed are unaffected by that fix.

Note: the game's injury load is far below the real NBA (about 9 player-games missed per team per season vs a few hundred). This change keeps that total, as asked; raising it would be a separate frequency change.
