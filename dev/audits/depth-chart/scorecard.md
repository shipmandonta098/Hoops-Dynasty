# Depth chart — Phase 13 scorecard before/after

Same seeds, same rosters: `dcbefore` = main, `dcafter` = depth-chart branch (final code). NBA 5001–5003 (2025, 30 teams, 82 games), WNBA 5101–5105 (2024, 12 teams, 40 games). Bench minutes per team-game: NBA 89.6 → 87.8, WNBA 62.0 → 60.6.

WNBA blow20% moved +3.4 points here; three after-runs on intermediate versions of this branch gave 15.9, 18.3 and 20.1% (main 16.7%), so on 1,200 games this metric varies by about ±2 points between runs.

### NBA — 3 seasons each (3690 / 3690 games)

| Metric | Before | After | Δ |
|---|---|---|---|
| rim% | 38.11 | 37.89 | -0.22 |
| mid% | 22.40 | 22.20 | -0.19 |
| three% | 39.50 | 39.91 | +0.41 |
| rimFG% | 64.02 | 64.48 | +0.46 |
| midFG% | 48.55 | 48.07 | -0.48 |
| threeFG% | 33.65 | 33.45 | -0.20 |
| teamPts | 111.38 | 111.33 | -0.06 |
| poss | 97.00 | 97.09 | +0.08 |
| ORtg | 114.83 | 114.67 | -0.16 |
| FG% | 48.56 | 48.45 | -0.11 |
| 3P% | 33.65 | 33.45 | -0.20 |
| eFG% | 55.20 | 55.13 | -0.08 |
| FTA | 20.32 | 20.11 | -0.21 |
| TOV | 12.96 | 12.93 | -0.04 |
| AST | 25.08 | 25.02 | -0.06 |
| BLK | 4.77 | 4.79 | +0.02 |
| meanMargin | 13.13 | 12.99 | -0.14 |
| blow20% | 22.11 | 21.49 | -0.62 |
| OT% | 3.31 | 3.98 | +0.68 |
| shot-zone range by season (rim/mid/three) | {'inside': [37.7, 38.6], 'mid': [22.3, 22.5], 'three': [39.1, 39.9]} | {'inside': [37.4, 38.7], 'mid': [22.1, 22.3], 'three': [39.2, 40.3]} | |

### WNBA — 5 seasons each (1200 / 1200 games)

| Metric | Before | After | Δ |
|---|---|---|---|
| rim% | 41.14 | 40.22 | -0.92 |
| mid% | 23.77 | 23.98 | +0.22 |
| three% | 35.10 | 35.80 | +0.70 |
| rimFG% | 57.40 | 57.96 | +0.56 |
| midFG% | 42.34 | 42.24 | -0.10 |
| threeFG% | 30.91 | 30.99 | +0.08 |
| teamPts | 83.60 | 83.64 | +0.04 |
| poss | 80.40 | 80.35 | -0.05 |
| ORtg | 103.98 | 104.09 | +0.11 |
| FG% | 44.52 | 44.54 | +0.01 |
| 3P% | 30.91 | 30.99 | +0.08 |
| eFG% | 49.95 | 50.08 | +0.14 |
| FTA | 17.33 | 16.96 | -0.37 |
| TOV | 11.75 | 11.73 | -0.03 |
| AST | 18.80 | 18.98 | +0.18 |
| BLK | 3.96 | 3.91 | -0.06 |
| meanMargin | 11.69 | 12.16 | +0.48 |
| blow20% | 16.67 | 20.08 | +3.42 |
| OT% | 4.58 | 3.42 | -1.17 |
| shot-zone range by season (rim/mid/three) | {'inside': [40.1, 42.6], 'mid': [23.0, 24.7], 'three': [34.4, 35.8]} | {'inside': [39.5, 41.9], 'mid': [22.6, 25.0], 'three': [35.5, 36.2]} | |
