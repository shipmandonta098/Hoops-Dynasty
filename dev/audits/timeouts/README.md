# Timeouts — before/after

Before = main (the depth-chart `dcafter` seasons, same code and seeds); after = this branch (`toafter`). NBA seeds
5001–5003 (2025, 30 teams), WNBA 5101–5105 (2024, 12 teams). Raw seasons in `dev/phase13/toafter-*.json`.
Regenerate: `python3 -I dev/audits/timeouts/summary.py <repo> <repo>`. `extra.cjs` (400 games per league per side) counts
possessions that start in the final 60 seconds of Q4/OT.

| | NBA before | NBA after | WNBA before | WNBA after |
|---|---|---|---|---|
| Timeouts per team-game (voluntary + mandatory charged) | ~1 (run trigger only) | 5.9 | ~1 | 4.4 |
| Points per team-game | 111.33 | 111.65 | 83.64 | 83.61 |
| ORtg | 114.67 | 114.90 | 104.09 | 104.02 |
| Mean margin | 12.99 | 12.95 | 12.16 | 12.04 |
| Blowouts (20+) | 21.5% | 21.1% | 20.1% | 18.0% |
| OT% | 3.98% | 3.98% | 3.42% | 3.83% |
| Within 5 points at 2:00 | 26.0% | 26.2% | 27.7% | 28.7% |
| Possessions in the final 60 s (all games / within 5) | 4.68 / 6.77 | 4.94 / 6.89 | 4.92 / 6.65 | 4.83 / 6.48 |
| Bench minutes per team-game | 87.8 | 84.7 | 60.6 | 55.7 |

Bench minutes fall 3 (NBA) and 5 (WNBA) per team-game: each timeout's short rest (+4 energy on the floor) keeps
starters fresh longer. The rest moves within the noise of 1,200–3,690 games. `extra.cjs`'s starter-minute column is not
used (it mis-reads starters in headless games); bench minutes come from the scorecard.

Full scorecard table: `scorecard.md`.
