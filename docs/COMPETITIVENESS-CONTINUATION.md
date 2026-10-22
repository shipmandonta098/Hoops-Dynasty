# Scoring and competitiveness: continuation audit

The secondary-shot fatigue inconsistency is corrected. This is a small consistency fix, **not a completed scoring calibration**. Full-season scoring and blowout distributions still need improvement. No score caps, comeback bonuses or forced results were added.

## Confirmed defect and change

Ordinary shots used effective runtime attributes. Immediate putbacks used raw layup/dunk ratings, and kick-out shots used raw shooting and physical ratings against a fatigue-adjusted defender. `dist/attributes.js` now routes those secondary-shot inputs through the existing `effectiveAttribute` calculation using the actual shooter’s stamina, minutes role and morale. No stored player attributes change. Shot selection, rebound odds, turnover odds and foul probabilities were not retuned. `dist/index.html` refreshes the script cache key.

## Full-season comparison

Baseline is the previous fatigue fix (commit e787395), not the original excessive back-to-back penalty. Its retained ten NBA and ten WNBA complete regular-season runs are compared with ten new runs per league using the same seeds 101–110. NBA: 30 fictional teams, 82 games each. WNBA: 12 fictional teams, 40 games each. Each phase contains 12,300 NBA and 2,400 WNBA games. These are independent full regular seasons, not twenty consecutive career years or completed postseasons.

| Metric | NBA baseline | NBA revised | WNBA baseline | WNBA revised |
|---|---:|---:|---:|---:|
|Points/team|119.36|119.47|92.80|92.81|
|Mean winning margin|15.75|15.73|14.00|13.72|
|Median margin|13.00|13.00|12.00|12.00|
|Largest margin|75.00|82.00|61.00|74.00|
|Possessions/team|100.98|100.97|83.16|83.08|
|Overtime %|1.98|2.01|2.92|2.33|
|Home wins %|59.16|60.02|60.50|58.88|
|Spread mean absolute error|14.29|14.31|12.67|12.37|
|20+ point wins (%)|32.52|32.12|26.25|25.67|
|30+ point wins (%)|13.07|12.88|8.75|8.12|
|40+ point wins (%)|4.02|4.34|2.17|1.62|
|50+ point wins (%)|1.03|1.11|0.33|0.25|

| Shooting / possessions | NBA baseline | NBA revised | WNBA baseline | WNBA revised |
|---|---:|---:|---:|---:|
|FG|0.4878|0.4882|0.4544|0.4549|
|3P|0.3469|0.3472|0.3222|0.3232|
|FT|0.7776|0.7770|0.7944|0.7936|
|eFG|0.5549|0.5552|0.5098|0.5102|
|TS|0.5799|0.5802|0.5405|0.5407|
|offensiveRating|118.1998|118.3191|111.5958|111.7169|
|FGA per team|95.07|95.10|79.13|79.15|
|TPA per team|36.78|36.69|27.18|27.10|
|FTA per team|17.81|17.84|15.26|15.18|
|ORB per team|12.63|12.70|11.18|11.23|
|DRB per team|37.50|37.44|33.12|33.03|
|TOV per team|12.75|12.74|10.01|9.98|
|PF per team|12.04|12.09|10.20|10.17|
|AST per team|27.67|27.65|21.91|21.88|
|BENCH per team|47.03|47.00|30.41|30.42|

FG/3P/FT/eFG/TS are fractions. Offensive rating is points per 100 engine-counted possessions. TOV here sums player box rows and excludes team-only turnovers.


## Real-season benchmarks

Complete score datasets were retrieved from Fixture Download and checked for duplicate games, full per-team game counts and aggregate scoring. NBA Cup final (Milwaukee 97–81 Oklahoma City, December 17 local / December 18 UTC) is excluded: NBA confirms it does not count toward regular-season statistics. Published league scoring and sample team totals/records were cross-checked against Basketball Reference. These are secondary compiled score datasets, not an official league API export. Individual overtime/possession data are unavailable in these files.

| Metric | NBA 2024–25 | WNBA 2024 |
|---|---:|---:|
|Regular games|1230.00|240.00|
|Points/team|113.83|81.67|
|Mean margin|12.74|10.82|
|Median margin|10.00|9.00|
|Largest margin|59.00|36.00|
|Home wins %|54.39|52.50|
|1-5 point margin (%)|25.12|25.42|
|6-10 point margin (%)|25.04|27.50|
|11-19 point margin (%)|28.78|37.92|
|20-29 point margin (%)|14.55|6.25|
|30-39 point margin (%)|4.72|2.92|
|40-49 point margin (%)|1.38|0.00|
|50+ point margin (%)|0.41|0.00|

## Remaining scoring mechanisms

The largest new NBA result was 169–87 (seed 105, league day 76, pregame spread −9). The largest WNBA result was 138–64 (seed 106, day 106, spread −8). Both matchups had neither team on a back-to-back and average pregame energy above 99. These retained cases demonstrate that the remaining extreme results cannot all be attributed to the previously corrected back-to-back stack. A maximum alone is not a frequency estimate; the complete distributions above remain the main comparison.

The simulation still allocates too many shot attempts relative to the reference seasons. Its historical style profiles map pace, three-point share, accuracy and shooting fouls; turnover, offensive-rebound and non-shooting-foul priors are not fully mapped by league and era. Lower turnover counts and more offensive rebounds preserve additional shooting opportunities. Secondary possessions also use simplified immediate putback/kick-out resolution. These are calibration/modeling gaps; the small fatigue correction does not resolve them.

The real WNBA reference has 68.3 FGA, 18.0 FTA and 8.2 offensive rebounds per team. Published player-box turnover sums can differ from official team turnover totals; a future turnover calibration must include team turnovers consistently, rather than treating those definitions as interchangeable. Do not simply lower every shooting percentage to hide extra attempts. Fictional talent distributions also differ from actual historical rosters.

## Verification and limitations

- Five era-format fixtures pass: NBA 1997/2025 and WNBA 1997/2006/2024. These use fictional rosters, not verified historical player populations.
- Thirty full fatigued games exercise effective secondary-shot shooting and block inputs; permanent attributes and box/event/final-score agreement are asserted.
- Two thousand paired diagnostic games: 500 NBA and 500 WNBA per phase, same seeded matchups. These reset the career for each matchup and are separate from the full-season sample. Diagnostic probability counts are probability evaluations, not FGA: blocked attempts can bypass probability evaluation and shooting-foul attempts can be included.
- An earlier two-thousand-game diagnostic used 30 teams in both leagues. Those results are retained as `thirty-team-*.json` and excluded from the standard WNBA comparison.
- Forty actual-game feat checks cover male/female and four-/two-period games, event provenance, live-prefix safety, deterministic replay and RNG-free recognition. Synthetic winner/OT/defensive/clinch/idempotence cases also pass.
- Twenty-six actual games validate technical/flagrant events, box totals and saves, plus synthetic double technical/ejection cases.
- Legacy saves from the original audit baseline and the latest pre-change version load without changing completed scores, boxes or summary events.
- No schema migration is necessary. Existing contracts, city photos and custom settings are untouched. Browser QA was unavailable; this is an engine change tested headlessly.
- No claim is made that the broad balance objective is complete. Era-specific turnover/rebound/foul calibration and spread-model calibration remain outstanding.

## Files and reproduction

Production: `dist/attributes.js`, `dist/index.html`. Tests: `dev/test-secondary-fatigue.cjs`, `dev/test-secondary-eras.cjs`, updated `dev/test-player-feats.cjs` (current-engine replay replaces an obsolete exact-score comparison against Git HEAD). Audit tools/data: `dev/audit-secondary-shots.cjs`, `dev/audit-competitiveness.cjs` (shared audit claims), `dev/run-secondary-seasons.cjs`, `dev/verify-secondary-seasons.py`, `dev/verify-real-balance.cjs`, `dev/summarize-secondary.py`, `dev/secondary-shot-audit/`, `dev/balance-audit/secondary-*.json`.

```sh
node dev/test-secondary-fatigue.cjs
node dev/test-player-feats.cjs
node dev/run-secondary-seasons.cjs
python dev/verify-secondary-seasons.py
node dev/verify-real-balance.cjs
python dev/summarize-secondary.py
```

For before-phase diagnostic reproduction, extract `dist` from commit e787395998debe5b3678085ef4369fa1b89402a6 and pass its directory through `HOOPS_BASELINE_DIST`. Run `node dev/audit-secondary-shots.cjs before 500` and `node dev/audit-secondary-shots.cjs after 500`. Baseline season JSON remains in the previous audit; completed reruns are skipped by the batch runner.

## Sources

- https://fixturedownload.com/results/nba-2024 — full score dataset, retrieved October 20, 2026.
- https://fixturedownload.com/results/wnba-2024 — full score dataset, retrieved October 20, 2026.
- https://www.basketball-reference.com/leagues/NBA_2025.html — NBA scoring and sample standings cross-check.
- https://www.basketball-reference.com/wnba/years/2024.html — WNBA scoring and Liberty 3424–3058 point totals cross-check.
- https://www.nba.com/news/starting-5-dec-18-2024 — Cup final excluded from regular-season statistics.
