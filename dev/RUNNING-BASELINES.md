# Running Layup diagnostic baselines

## Current: three-point wrapper shot-clock guard

Parent production: `96f5b681a7059b345c3aa0b6abf813156d272535`.
Only wrapper pass/shot exhaustion now returns the existing shotClock team turnover.
The immediate-putback block correction, Running gate and all coefficients remain intact.

Accepted metrics: `wrapper-clock-adopted-baseline.json`.
Reproduction, controls and committed-rerun verification: `WRAPPER-CLOCK-ADOPTION.md`.
PPG 123.933333333333; pace 102.646666666667; ORtg 120.737806066117;
2P 55.659386231684%; 3P 38.893633172028%; Running643 /608FGA /407makes.
Zero below14, tempo-only, PNR Running and zero-clock shots.
148 games exactly unchanged; only seeds100063 and100069 diverge at exhaustion.
All scheduled slot owners, windows and targets remain unchanged.

## Historical: immediate putback layup block eligibility

On top of 73183bb3b14d9b6852e563420a296de6da485057, immediate layup
putbacks now use the existing primary inside-shot block formula. Putback dunk
logic and all Running/transition/ownership rules remain unchanged.

Previously accepted baseline: `putback-block-adopted-baseline.json`.
Full reproduction: `putback-block-baseline.json`, `putback-block-candidate.json`,
`putback-block-production.json`. All 150 instrumented games and complete
postgame states match normal execution; production exactly matches candidate.

PPG 123.92; pace 102.646666666667; ORtg 120.724816522699;
2P 55.652606556471%; 3P 38.882564978183%; Running 645 evaluations,
610 FGA, 408 makes, 66.885245901639% FG. Running below 14 / tempo-only /
PNR remain zero. Candidate had five overtime periods versus one in its baseline;
regulation pace, targets and all 30,694 regulation slot windows are identical.
No pace formula or slot-generation rule changed.

Historical experiment commands (use their corresponding source commit):

- `node dev/experiment-putback-block.cjs baseline`
- `node dev/test-putback-block.cjs`
- `node dev/experiment-putback-block.cjs candidate`
- `node dev/test-putback-block.cjs --production`
- `node dev/experiment-putback-block.cjs production`
- `node dev/test-ownership-controls.cjs --production`
- `node dev/test-ownership-context.cjs --production`
- Normal possession/headless/simulation-rules regressions.

The baseline/candidate paths reconstruct attributes.js from the pinned parent.
Older full-fixture verifiers below target historical versions and must not be
interpreted as current production expectations. Historical results are retained.

## Historical: terminal ownership correction

The cross-side ordinary bonus-FT ownership correction is now adopted on top of
`cf8e0533593be4920ee22042f205a7480db86795`. Only the next existing offensive
slot's owner changes, with subsequent alternation reanchored to the actual
dispatched side. Terminal ownership is tracked independently of transitionTeam.
Period starts retain the existing opening-side convention.

Current baseline: `ownership-adopted-baseline.json`.
Exact candidate/production evidence: `ownership-full.json` and
`ownership-full-production.json`. The prior clock-gate baseline below is retained
as historical evidence; it is no longer the current scoring baseline.

150-game production metrics: PPG 122.853333333333; pace 102.38;
ORtg 119.997395324608; 2P 55.650224215247%; 3P 38.355269298983%;
Running 626 evaluations / 585 FGA / 388 makes / 66.324786324786%.
Below-14 / tempo-only / PNR Running remain zero. Ownership mismatches,
wrong-side token abandonment and wrong-team event advantage: zero.
All 30,714 slots and every time window/period total match the old baseline.
142 unaffected games are identical; all 150 instrumented results and complete
postgame states match normal production execution.

Current checks:

- `node dev/experiment-ownership.cjs full --production`
- `node dev/test-ownership-controls.cjs --production` (16 terminal/dispatcher controls)
- `node dev/test-ownership-context.cjs --production` (13/14 boundary + 32 shot controls)
- `node test-possession-engine.cjs`
- `node dev/test-headless.cjs`
- `node test-simulation-rules.cjs`

The ownership experiment reconstructs the original attributes.js from the exact
parent commit. Its no-flag candidate transform also targets that parent; it must
not be applied twice to already-corrected source. The old adoption verifiers and
`audit-token-order.cjs` CLI target the historical clock-gate baseline, not current
production. Its exported observer is reused by the ownership experiment.

## Historical: clock-gate adoption

The adopted production baseline requires event-derived `transitionAdvantage`
AND the current shot clock >= 14 for Running Layup eligibility at evaluation.
No-sag remains adopted. Running retains +.055 accuracy and .5 block multiplier.
Only shotContext clock exposure and the eligibility condition changed.
Token creation/consumption, transition threes, tempo, PNR/ISO, recursive calls,
putbacks and the existing wrong-side token edge case remain unchanged.

Accepted fixture: creation seed 61005, 30 teams, 15 players per team, 150 games,
seeds 100000–100149, ten circle rounds with alternating venues and full preseason
reset per game. Production exactly reproduced the retained clock experiment:
PPG 122.846666666667; pace 102.38; ORtg 119.990883636127;
2P 55.701164874552%; 3P 38.297673549472%; Running 628 evaluations,
586 FGA, 394 makes, 67.235494880546% FG. Below-14, tempo-only and PNR Running: 0.
All 150 production games and complete postgame states match instrumentation.
The 13/14-second controls and 32 other contextual-shot controls pass, as do the
normal possession, headless and simulation-rules suites listed below.

Current retained baseline: `running-adopted-baseline.json`.
Full adoption evidence: `running-clock-adoption-verification.json`.
The original `running-clock-experiment.json` remains unchanged.

Current verification:

- `node dev/verify-running-clock-adoption.cjs`
- `node test-possession-engine.cjs`
- `node test-simulation-rules.cjs`
- `node dev/test-headless.cjs`

The prior `experiment-running.cjs`, `running-eligibility-candidate.cjs`,
`test-running-eligibility.cjs` and transition/two-point comparison harnesses
are retained historical experiments. Their original source anchors and
baseline expectations target commit `2748e11d3205246762bdd68e001a9f0495551ae9`.
Do not run their candidate transform over the already-adopted source or
reinterpret archived result JSON as a new measurement.

The accepted experiment JSON remains unchanged as a reproduction reference.
The lifetime audit's detailed trace JSON is a reproducible scratch output;
its report includes a compressed copy for review. It is not application data.

`verify-running-adoption.cjs`, `audit-transition-lifetime.cjs` and
`experiment-running-clock.cjs` target the pre-clock-gate source at commit
`7aab99ea0bdd99c6efeda34355bdda61ba6cece4`. Treat these as historical harnesses;
do not apply their candidate transforms or 761-Running expectations to current
production. The current verifier reconstructs the previous baseline in memory,
then tests untransformed production and asserts exact retained candidate parity.
