# Statistical balance

The engine uses probabilistic targets, not forced per-game quotas. Existing players and completed games retain their ratings/results. Newly generated players use the new generator; future games use the updated engine and existing league sliders.

## Model

- Overall: truncated normal draws within tiers, with weights 20% reserves (60–69), 55% rotation (70–79), 20% quality starters (80–89), 5% elite (90–99). The 55% rotation share closes the approximate percentages to 100%. Tier means are 65/75/84/93 and within-tier standard deviation is 2.5. Free-agent and prospect generation retains its existing level offsets. Positional attributes use deterministic normal noise with standard deviation 7, positional offsets, and rating clamps.
- Default healthy rotation: five starters plus four reserves, with deeper players available for injuries, foul trouble and game-context substitutions. Explicit saved minute plans take precedence. Short rosters still receive legal minutes.
- Pace: 100 per 48 minutes before coach tempo, team strategy, workload, random variance and the league pace slider. Game length scales the number of possessions.
- Usage: elite base weights 28–35, ordinary contributors 15–22, passing/defensive specialists 10–14. Normalize weights among active players after the player's Usage / Touches tendency. Clutch and pick-and-roll handler skill adjustments still apply. The player tendencies panel displays the base weight; it is not a guaranteed box-score USG%.
- Shot probability: baseline + (effective shooting rating − effective defender rating) × 0.002. Baselines are .625 inside, .435 midrange and .31 three-point before context and archetype lineup effects. Three-point ratings below 50 also receive a range penalty. Shot difficulty, actual passes, screen quality, fatigue, coaching, contests and league sliders modify this. Blocks are separate misses. The same matchup rule governs second chances.
- Shot zones: general shooting priors are calibrated alongside separate drive, post, isolation and pick-and-roll branches; they are not standalone 35/25/40 probability rolls. Individual preferences and coaching affect the mix.
- Rebounding: select the team first, with offensive odds 1:3 at equal lineup strength and neutral settings. Adjust for lineup rebounding strength and the offensive-rebound slider, then select an active player by rebounding, size, athleticism, strength, position and crashing tendency. Missed last free throws and second-chance shots can produce further offensive boards. Eight offensive recoveries bound an extreme possession.
- Assists: an actual preceding passer must exist. Initial ball movement favors passing ability squared; eligible assist checks are calibrated to approximately 55–60% of all made field goals. Self-created shots do not receive an invented assist.
- Turnovers: handling errors, pass errors, steals, screens, charges and clock violations keep their own narratives and attribute checks. Only actual defensive takeaways earn steals. The calibrated share is approximately 40% stolen, 60% unforced; the steal and foul sliders remain effective.

`shotDistribution` stores actual FGA/makes in three zones. `possessionOutcomes` counts the first substantive resolution: field goal (including and-one), free-throw trip, turnover, or other. Offensive rebounds continue that possession, so total FGA or turnovers may exceed initial-resolution counts. Both optional structures validate on import; older saves remain compatible.

## Reproducible validation

Run `node test-statistical-balance.cjs`. Seed 771; 20,000 population draws; 120 games from ten fresh six-team leagues with 14-player rosters, default settings, injuries disabled, four schedule days each. These are calibration observations, not guarantees for custom leagues or a single game.

| Measure | Observed |
|---|---:|
| Mean generated overall | 75.64 |
| Reserve / rotation / starter / elite | 20.11% / 54.82% / 20.32% / 4.76% |
| Possessions per team (including OT) | 100.91 |
| Initial FGA / FT trip / turnover | 79.18% / 6.77% / 14.04% |
| All turnovers per possession, including second chances | 14.39% |
| Inside / midrange / three shot mix | 37.15% / 23.46% / 39.38% |
| Inside / midrange / three FG% | 63.01% / 43.47% / 37.42% |
| Made field goals assisted | 59.60% |
| Offensive share of player rebounds | 25.75% |
| Turnovers credited as steals | 42.28% |
| Points per team | 118.70 |

Assertions cover sampled rates with sampling tolerance, population tiers, matchup and usage direction, FGA reconciliation, reserve minutes, old saves and malformed telemetry. Regression checks cover league tendencies (including zero settings), game rules, new-career settings, pick-and-roll, rotations and possession/box-score/play-by-play consistency. The clock unit test isolates the base decision loop and treats shot-clock violations as team turnovers.

Archetype generation, runtime preferences, development and lineup effects are detailed in `ARCHETYPES.md`.
