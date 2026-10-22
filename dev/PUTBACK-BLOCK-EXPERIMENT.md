# Immediate Putback Layup Block Experiment

Parent production: 73183bb3b14d9b6852e563420a296de6da485057.
Recommendation: ADOPT. Production reproduces the tested candidate exactly.

## One change

Only immediate layup putbacks gain block eligibility. The existing dunk
expression remains unchanged on the dunk branch. A local helper applies the
primary inside-shot block formula with the current defender's effective
block/height/jumping, the rebounder's effective strength/jumping, existing
block tendency/slider and existing high-morale factor. The plain putback
multiplier is 1; inside-shot physical recovery is zero. No Running modifier is
inherited. Rim defense continues to affect the unchanged make calculation;
it is not a direct term in the primary block formula.

The original primary-shot defender is retained. Nearest-defender selection,
other contest/fatigue/accuracy inconsistencies and block logic for other shot
classes are outside this single-variable change. The primary block expression,
putback selection and make expression, rebounds, fouls, tokens, ownership,
Running gate, clocks and all other game formulas remain unchanged.

A denied layup increments the existing block/FGA statistics, emits the existing
block narrative and calls the unchanged finishRebound. Of 106 new blocks,
86 led to DREB and immediate intended-side transition consumption, and 20 to
same-side recursive OREB continuation at 14. Two sequences later generated
another immediate putback under existing rules. No bespoke possession outcome.

## Measurements

The 150-game parent baseline reproduced exactly before testing the candidate.
Creation seed 61005; seeds 100000–100149; 30 teams / 15 players; first ten circle
rounds with alternating venues; preseason state reset before every game.

PPG 122.853333 → 123.920000; ORtg 119.997395 → 120.724817;
2P 55.650224% → 55.652607%; 3P 38.355269% → 38.882565%.
Layup putback FG 64.365782% → 60.869565%; blocks 0 → 106 / 1610 FGA
(6.583851%). Second-chance points/team/game 15.18 → 14.826667.

All 30,694 regulation slot windows/targets match. Overtime periods changed
from one to five through game-result divergence; each retains the existing
20 slots / 300 seconds. This accounts for the entire observed pace change from
102.38 to 102.646667. No timing, possession-target or schedule formula changed.

All 150 games encounter the new branch. In each, the entire causal event prefix,
RNG index, player/box/clock/stamina snapshot and make probability match until the
first added block roll. A separate whole-game control with putback selection
disabled is outcome/full-state identical. Fixed matched dunk and primary layup
controls are identical. Production matches every retained candidate result and
complete instrumented/normal postgame state.

ADOPT is based on basketball semantics and regression safety, not lower league
PPG. The target branch now responds to defense; observed block rate 6.58% is
consistent with its mean existing-formula risk 6.87%. PPG rose by 1.066667;
paired approximate 95% interval is [-0.755512, 2.888845]. This fixture does not
establish a league scoring reduction. No compensation or additional tuning.

## Evidence and reproduction

- dev/putback-block-baseline.json: reproduced parent + all event-boundary evidence.
- dev/putback-block-candidate.json: 150 experimental results / all 106 block traces.
- dev/putback-block-production.json: exact adopted reproduction.
- dev/putback-block-controls[-production].json: actual extracted putback path,
  rebound continuation, matched primary/dunk/rebound and no-branch full-game controls.
- dev/putback-block-adopted-baseline.json: current metrics and validation summary.

Run the commands in RUNNING-BASELINES.md, plus standard regression suites:

    node test-possession-engine.cjs > /tmp/putback-prod-possession.log 2>&1
    node dev/test-headless.cjs > /tmp/putback-prod-headless.log 2>&1
    node test-simulation-rules.cjs > /tmp/putback-prod-rules.log 2>&1
    node dev/test-ownership-controls.cjs --production > /tmp/putback-prod-ownership.log 2>&1
    node dev/test-ownership-context.cjs --production > /tmp/putback-prod-context.log 2>&1
    node dev/verify-putback-adoption.cjs

Regression results: PASS. The 16 ownership and 32 contextual-shot controls,
13/14 gate, +.055 Running accuracy and .5 Running block multiplier remain intact.
