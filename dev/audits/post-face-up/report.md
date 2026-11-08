# Post Face-Up — Phase 13 scorecard before/after

Same seeds, same rosters: `fubefore` = main (no face-up), `fuafter` = this branch. WNBA seeds 5101–5105 (2024, 12 teams, 40 games), NBA seeds 5001–5003 (2025, 30 teams, 82 games); regular seasons via `dev/audit-phase13-season.cjs` (which now also records per-game shot zones). Raw seasons in `dev/phase13/fu{before,after}-*.json`. Regenerate: `python3 -I dev/audits/post-face-up/summary.py <before repo> <after repo>`.

### WNBA — 5 seasons each (1200 / 1200 games)

| Metric | Before | After | Δ |
|---|---|---|---|
| rim% | 40.88 | 40.92 | +0.05 |
| mid% | 23.60 | 23.81 | +0.22 |
| three% | 35.53 | 35.26 | -0.26 |
| rimFG% | 57.19 | 57.41 | +0.22 |
| midFG% | 42.26 | 42.71 | +0.45 |
| threeFG% | 30.85 | 31.00 | +0.15 |
| teamPts | 83.44 | 83.52 | +0.07 |
| poss | 80.47 | 80.18 | -0.29 |
| ORtg | 103.70 | 104.16 | +0.46 |
| FG% | 44.31 | 44.60 | +0.29 |
| 3P% | 30.85 | 31.00 | +0.15 |
| eFG% | 49.79 | 50.06 | +0.27 |
| FTA | 17.27 | 17.24 | -0.03 |
| TOV | 11.81 | 11.72 | -0.09 |
| AST | 18.79 | 18.80 | +0.01 |
| BLK | 3.94 | 3.90 | -0.04 |
| meanMargin | 11.96 | 12.43 | +0.47 |
| blow20% | 17.83 | 19.83 | +2.00 |
| OT% | 5.08 | 3.25 | -1.83 |
| shot-zone range by season (rim/mid/three) | {'inside': [40.1, 42.5], 'mid': [22.9, 24.1], 'three': [34.7, 36.4]} | {'inside': [40.1, 42.8], 'mid': [22.8, 24.7], 'three': [34.4, 36.2]} | |

### NBA — 3 seasons each (3690 / 3690 games)

| Metric | Before | After | Δ |
|---|---|---|---|
| rim% | 38.22 | 38.11 | -0.11 |
| mid% | 22.25 | 22.48 | +0.23 |
| three% | 39.54 | 39.41 | -0.12 |
| rimFG% | 64.05 | 63.90 | -0.15 |
| midFG% | 48.37 | 48.14 | -0.23 |
| threeFG% | 33.46 | 33.63 | +0.16 |
| teamPts | 111.26 | 111.01 | -0.25 |
| poss | 97.10 | 97.00 | -0.10 |
| ORtg | 114.59 | 114.44 | -0.15 |
| FG% | 48.47 | 48.43 | -0.04 |
| 3P% | 33.46 | 33.63 | +0.16 |
| eFG% | 55.08 | 55.05 | -0.03 |
| FTA | 20.36 | 20.27 | -0.10 |
| TOV | 13.09 | 13.02 | -0.07 |
| AST | 25.05 | 24.97 | -0.08 |
| BLK | 4.79 | 4.80 | +0.00 |
| meanMargin | 13.04 | 13.00 | -0.04 |
| blow20% | 21.73 | 22.11 | +0.38 |
| OT% | 3.69 | 3.17 | -0.51 |
| shot-zone range by season (rim/mid/three) | {'inside': [37.8, 38.9], 'mid': [22.2, 22.3], 'three': [38.9, 40.0]} | {'inside': [37.8, 38.6], 'mid': [22.4, 22.7], 'three': [39.0, 39.7]} | |

## Generated Post Face-Up (effective, fresh leagues, seed 5)

| | PG | SG | SF | PF | C |
|---|---|---|---|---|---|
| NBA | 20 | 36 | 62 | 56 | 26 |
| WNBA | 20 | 31 | 61 | 55 | 23 |

Bigs (PF/C) in the top third by midrange vs the bottom third: 64 vs 23 (NBA), 64 vs 18 (WNBA). Taller SFs 66 vs shorter 58 (NBA).
Archetypes: Stretch Big 72–76, Shot Creator 49–53, Paint Beast 28–32.
Face-ups are a modest share of possessions (about one per game) because post-ups themselves are a small share of decisions.
