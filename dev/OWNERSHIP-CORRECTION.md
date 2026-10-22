# Cross-side ordinary bonus-FT ownership correction

Parent: cf8e0533593be4920ee22042f205a7480db86795.

## One semantic change

The root's cross-side ordinary bonus-FT subtree can hand play to the opposing
team, including recursively after its FT offensive rebound. Previously the
fixed pair dispatcher ignored the subtree's terminal owner. It now uses an
explicit next-owner result for this flow and reanchors alternation from the
actual side dispatched. No time slot is added or removed.

In dist/attributes.js, terminalNextSide records terminal basketball events:
turnover, made FG, final made ordinary FT, DREB and offensive loose-ball foul.
Technical and retained FTs do not overwrite ownership. OREBs still call the
same recursive function at the same 14-second reset; the final event wins.
crossSideBonus scopes use of the result to the identified subtree. possession
returns that result only after recursion finishes; runMinute uses it for the
next existing slot, otherwise alternates normally. Period boundaries preserve
the prior first-side convention. transitionTeam is neither consulted for
ownership nor preserved to compensate for a wrong-side dispatch.

No RNG call, basketball formula, probability, token creation/consumption rule,
Running gate/coefficient, clock formula, PNR/ISO or three pathway changed.

## Evidence

The original 150-game baseline and full-state instrumentation parity were
reproduced first. Deterministic controls preceded seeds 100049/100063, then all
eight affected seeds, then the full fixture. Production was promoted only to
the exact tested source and rerun for 150 games; every retained measurement,
trace, slot and team count matches the candidate. Normal/instrumented complete
postgame parity passes for each game. Standard possession, headless and
simulation-rules regressions pass.

16 deterministic controls run the actual extracted terminal-event hooks and
runMinute dispatcher in a closure harness with scripted stochastic subtrees.
These are unit controls, complemented by the affected-seed and full-engine
fixture—not substituted for full gameplay execution. Controls cover opponent
final FT made; miss+DREB; miss+OREB followed by made FG, DREB, steal, uncredited
turnover, shot-clock turnover or foul/FT; same-side FTs; made/missed technical
and retained FTs; both initial sides, reanchoring across slots/minutes and
period reset. Separate real-engine descriptor tests preserve the 13/14 Running
boundary and 32 contextual shot cases, +.055 accuracy and .5 block multiplier.

All eight former errors have correct subsequent ownership. Zero new ownership
mismatches; zero wrong-side token abandonment; zero wrong-team event advantage.
All valid non-boundary tokens are consumed at the next intended entry. 142
unaffected games remain exactly identical. Slots and time windows match for
every game; 600 regulation periods and one overtime period in both versions.

PPG: 122.846666666667 → 122.853333333333.
Pace: 102.38 → 102.38.
ORtg: 119.990883636127 → 119.997395324608.
Running: 628/586/394 → 626/585/388 evaluations/FGA/makes.

Per-team root poss/defPoss now follows the actually dispatched side; all teams'
counter sums reconcile to their offensive/defensive slots. Overall counts do
not change. Slot-local scoring/ISO/morale bookkeeping was not redesigned.
No second balance change or separate accounting correction is included.

See ownership-adopted-baseline.json for accepted metrics, ownership-full.json
and ownership-full-production.json for all per-game/per-team values, exact
windows, token statuses and complete affected traces. Prior audit output is
retained in token-order-audit.json.
