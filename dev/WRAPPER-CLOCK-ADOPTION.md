# Three-point wrapper clock exhaustion guard

Parent production: 96f5b681a7059b345c3aa0b6abf813156d272535.
Only gameplay difference: two existing three-point wrapper transition calls now honor
false and invoke existing `recordTurnover('shotClock', player)` then return null.
No timing, probability, selection, rebound, putback-block, ownership, or other formula change.

17 paired deterministic controls: production/candidate drive-and-kick clocks2,3,4,6,7,8,9,14;
early-no-pass2,3,4; early-pass2,3,4,5,6,7. Positive-clock results/RNG identical.
Exhaustion stops without further wrapper RNG. All pass.
Affected seeds100063 and100069 have identical RNG, direct-event prefix and snapshot
through the first exhausted shot transition. Next candidate event is existing team
shotClock turnover; next root owner is opponent, without a steal/token.
150 normal/instrumented complete-state parity in each branch.148 games exactly unchanged.
Both exhausted shots eliminated; one baseline made three directly removed.
Overall fixture points rise4 through downstream divergence (+7 beyond direct−3).
109 scheduled root traces differ,70 score-increment slots differ; these are not109
independent defects. Every scheduled slot/owner/window is identical.

Accepted candidate metrics are retained in wrapper-clock-adopted-baseline.json.
The committed production rerun must exactly match every candidate game hash, state hash,
metric, shot record, token count, clock window, and root trace before publication.

## Reproduction (Node24; no additional packages)

```
node dev/test-wrapper-clock.cjs
node dev/experiment-wrapper-clock.cjs baseline seeds
node dev/experiment-wrapper-clock.cjs candidate seeds
node dev/experiment-wrapper-clock.cjs baseline full
node dev/experiment-wrapper-clock.cjs candidate full
node dev/test-wrapper-clock.cjs --production
WRAPPER_RESULT_PATH=/tmp/wrapper-clock-adopted.json node dev/experiment-wrapper-clock.cjs production full
node dev/verify-wrapper-clock.cjs /tmp/wrapper-clock-adopted.json
```

The baseline/candidate transforms pin parent tendencies.js through git show; current
other production sources must be unchanged. Production mode loads actual current files.
`WRAPPER_RESULT_PATH` prevents a postcommit verification from altering tracked artifacts.
Normal regression commands:

```
node test-possession-engine.cjs
node dev/test-headless.cjs
node test-simulation-rules.cjs
node dev/test-ownership-controls.cjs --production
node dev/test-ownership-context.cjs --production
node dev/test-putback-block.cjs --production
```

Before promotion, use `node -r ./dev/use-wrapper-clock-candidate.cjs ...` for the same suites.

Turnovers in metrics.TOV are summed player box-score turnovers; shotClockTOV is the
separate team event rate. Total including shot-clock team violations is their sum.
Possessions are recorded player possession counts /5, preserving existing definition.
All per-game rates mean per team/game (300 team-games in the full fixture).

Raw full/seeds JSON contains root hashes, slots, putback observations, all exhausted
wrapper traces, state/prefix hashes, first-divergence proof and token safeguards.
No full production simulation code has been duplicated.
