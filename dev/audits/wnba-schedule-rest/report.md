# WNBA / custom schedule rest — before vs after

Fresh WNBA leagues built from the historical presets (`historicalPlan('wnba', year)`), two conferences, the final calendar after Opening Night and All-Star placement. Seeds 11–15. *Before* = `main`, *after* = this branch.

## 2024 format · 12 teams · 40 games

| Metric | Before (5 seeds) | After (5 seeds) |
|---|---|---|
| Season start → end | 2024-05-01 → 2024-09-30 | 2024-05-16 → 2024-09-11 |
| All-Star break (game) | 2024-08-01..2024-08-07 (game 2024-08-04) | 2024-07-18..2024-07-22 (game 2024-07-21) |
| Longest league-wide blackout | 17d 2024-07-28..2024-08-13 | 5d 2024-07-18..2024-07-22 |
| Rest gaps 0d (% of gaps) | 9.0% (8.8–9.2) | 3.6% (2.6–4.3) |
| Rest gaps 1d (% of gaps) | 51.2% (50.4–51.9) | 15.6% (14.5–16.7) |
| Rest gaps 2d (% of gaps) | 14.7% (13.9–15.2) | 70.1% (69.9–70.3) |
| Rest gaps 3d (% of gaps) | 4.2% (3.8–4.5) | 6.5% (6–7.1) |
| Rest gaps 4d (% of gaps) | 9.3% (8.5–10.3) | 1.4% (0.9–1.9) |
| Rest gaps 5d (% of gaps) | 0.9% (0.6–1.1) | 1.2% (0.6–1.5) |
| Rest gaps 6+d (% of gaps) | 10.9% (10.3–11.1) | 1.7% (1.5–1.9) |
| Back-to-backs per team (mean) | 3.50 (3.42–3.58) | 1.40 (1–1.67) |
| Back-to-backs, worst team | 4–5 | 2–3 |
| Back-to-backs league-wide | 41–43 | 12–20 |
| 3 games in 4 nights (league) | 47–52 | 0 |
| Longest break per team (incl. All-Star) | 17–23 days | 5–9 days |
| Longest break per team (outside All-Star) | 9–15 days | 3–6 days |
| Max games in 7 days (any team) | 5 | 4 |
| Opening Night | 2 games | 2 games |

Per seed (after): back-to-backs by team · longest break outside All-Star by team

- seed 11: b2b [1, 2, 2, 1, 1, 0, 1, 1, 2, 0, 1, 0] · longest [4, 3, 3, 4, 3, 3, 4, 3, 3, 3, 3, 3]
- seed 12: b2b [3, 2, 3, 1, 1, 2, 2, 1, 2, 1, 0, 0] · longest [4, 5, 6, 4, 3, 4, 4, 3, 3, 3, 3, 3]
- seed 13: b2b [2, 2, 2, 1, 1, 1, 3, 2, 2, 1, 0, 0] · longest [4, 4, 3, 4, 3, 3, 4, 4, 3, 3, 3, 3]
- seed 14: b2b [2, 2, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1] · longest [4, 3, 3, 4, 3, 3, 5, 5, 3, 3, 5, 3]
- seed 15: b2b [2, 3, 3, 1, 1, 1, 3, 2, 2, 1, 0, 1] · longest [4, 3, 4, 4, 3, 3, 5, 4, 3, 3, 3, 5]

## 2025 format · 13 teams · 44 games

| Metric | Before (5 seeds) | After (5 seeds) |
|---|---|---|
| Season start → end | 2025-05-01 → 2025-09-30 | 2025-05-16 → 2025-09-11 |
| All-Star break (game) | 2025-08-07..2025-08-13 (game 2025-08-10) | 2025-07-17..2025-07-21 (game 2025-07-20) |
| Longest league-wide blackout | 8d 2025-08-06..2025-08-13 | 5d 2025-07-17..2025-07-21 |
| Rest gaps 0d (% of gaps) | 10.0% (9.7–10.4) | 4.2% (3.9–4.7) |
| Rest gaps 1d (% of gaps) | 52.8% (52.6–52.8) | 39.1% (37.9–40.6) |
| Rest gaps 2d (% of gaps) | 14.8% (14.3–15.2) | 48.7% (47.2–50.4) |
| Rest gaps 3d (% of gaps) | 4.0% (3.8–4.3) | 4.3% (3.4–5.4) |
| Rest gaps 4d (% of gaps) | 10.2% (10–10.4) | 1.1% (0.7–1.4) |
| Rest gaps 5d (% of gaps) | 0.2% (0–0.4) | 0.4% (0.2–0.7) |
| Rest gaps 6+d (% of gaps) | 8.2% (8.1–8.4) | 2.2% (1.6–2.7) |
| Back-to-backs per team (mean) | 4.31 (4.15–4.46) | 1.80 (1.69–2) |
| Back-to-backs, worst team | 6–7 | 3–4 |
| Back-to-backs league-wide | 54–58 | 22–26 |
| 3 games in 4 nights (league) | 71–77 | 0 |
| Longest break per team (incl. All-Star) | 9–19 days | 5–9 days |
| Longest break per team (outside All-Star) | 8–18 days | 2–6 days |
| Max games in 7 days (any team) | 5 | 4 |
| Opening Night | 2 games | 2 games |

Per seed (after): back-to-backs by team · longest break outside All-Star by team

- seed 11: b2b [2, 1, 1, 2, 2, 1, 0, 1, 3, 1, 3, 2, 3] · longest [3, 4, 3, 4, 3, 5, 4, 3, 5, 3, 3, 3, 4]
- seed 12: b2b [3, 1, 1, 0, 1, 1, 0, 2, 3, 1, 3, 4, 3] · longest [3, 6, 3, 4, 3, 4, 5, 4, 3, 4, 3, 3, 6]
- seed 13: b2b [2, 2, 1, 2, 1, 1, 0, 1, 3, 1, 3, 2, 4] · longest [3, 4, 4, 4, 5, 4, 2, 3, 3, 3, 3, 3, 4]
- seed 14: b2b [2, 1, 1, 3, 1, 2, 1, 2, 3, 2, 3, 2, 3] · longest [3, 3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3, 4]
- seed 15: b2b [3, 1, 2, 0, 1, 2, 0, 1, 3, 1, 3, 3, 3] · longest [4, 3, 5, 4, 3, 4, 4, 3, 3, 4, 4, 4, 3]

