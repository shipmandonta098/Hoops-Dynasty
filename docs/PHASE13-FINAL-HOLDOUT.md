# Hoops Dynasty — Phase 13 Final Holdout Report

Frozen production build SHA-256: `fea697ebacf31cb460125afb899dc14dece44aeba7a96aa20af9a1bf0fccc883`  
Frozen at (UTC): 2026-10-22T06:57:25.380030+00:00  
Holdout finished (UTC): 2026-10-22T07:22:24.269Z  
Holdout runs: 20 completed, 0 failures; frozen hashes verified before and after.

## Summary

- **WNBA spread fix holds on holdout:** 10-season mean team-margin SD 5.76 (target 5.3–6.2); pooled 20+ rate 17.92% (real max 18.88%).
- **Per-season variance is large:** only 2/10 WNBA holdout seasons individually land in 5.3–6.2 (range 3.87–8.22); one season reached 23.75% 20+ games.
- **Transition is over-tagged in both leagues** on the same PBP fast-break-qualifier definition: NBA sim 17.60% vs real 12.15%; WNBA sim 18.20% vs real 10.75%. This is engine-wide, not a WNBA-specific issue.
- **NBA runs slightly blowout-heavy and OT-light** (mean margin 13.21 vs 12.58–12.75; 20+ 22.35% vs 19.11–21.06%; OT 4.08% vs 4.80–4.88%). NBA rosters were not changed this phase.
- No parameter was changed after the holdout began.

## 1. WNBA roster-spread calibration (pre-freeze)

Change: Modern fictional WNBA initial roster-quality SD target rises from 1.15x to 1.40x its unallocated value, using the existing same-position swap algorithm. NBA stays at 1.15x.

Selection rationale: 1.45 reached the spread target but exceeded the real 20+ ceiling; 1.35 respected the ceiling but fell below the SD target; 1.40 was borderline on the initial five seeds (SD 5.299); five additional calibration seeds 116–120 were run without a parameter change. The full ten-season calibration met both gates. No transition tuning.

Calibration used seeds 111–120 (not holdout seeds). Selected arm (1.40x, 10 seasons, 2,400 games):

| Metric | Value |
|---|---|
| Mean winning margin (pts) | 12.15 |
| 20+ point games (%) | 18.00 |
| Within 5 points (%) | 23.25 |
| Overtime games (%) | 3.71 |
| Team-margin SD (pts) | 5.54 |

Caveat: 1.40x was borderline (SD 5.299) on the first five calibration seeds; five more seeds (116–120) were added without changing the parameter. That extension was recorded in the protocol before those results were seen. The holdout is the independent check.

## 2. Transition definition check (completed before freeze)

| Sample | Definition | Value |
|---|---|---|
| Real NBA, same 134 score-validated games | fast-break-tagged FGA / all FGA | 12.15% (2,884 / 23,735) |
| Real NBA, 133 score-matching games (sensitivity) | same | 12.12% |
| Real WNBA, 100 games 2022–2025 | same | 10.75% (1,462 / 13,596) |
| NBA Synergy 2024–25 full season | transition share of possessions | 18.61% (team mean 18.58%) |

Notes: the commonly quoted ~20% Synergy figure overstates the retained 2024–25 value (18.6%). Synergy measures possessions over a full season; the PBP figure measures shots in a sample. They are different definitions and denominators, so there is no conversion factor between them. The fair comparison for the simulator is the same PBP-tagged FGA statistic, where both leagues are over-tagged.

## 3. Final holdout scorecards

20 reserved seeds, never used for calibration or smoke tests. Full evolving regular seasons, no resets, no playoffs. 95% intervals are seed-cluster bootstrap (4,000 resamples).

### NBA — 10 seasons, 12,300 games (real reference: 2023–24 and 2024–25 full seasons)

| Metric | Holdout | 95% CI | Seed range | Real reference |
|---|---|---|---|---|
| Mean winning margin (pts) | 13.21 | 12.91–13.48 | 12.35–13.74 | 12.58–12.75 |
| 20+ point games (%) | 22.35 | 21.15–23.38 | 18.46–24.31 | 19.11–21.06 |
| Within 5 points (%) | 23.99 | 23.01–24.98 | 21.46–26.50 | 23.33–25.12 |
| Overtime games (%) | 4.08 | 3.80–4.41 | 3.41–5.37 | 4.80–4.88 |
| Team-margin SD (pts) | 5.49 | 5.05–5.90 | 4.39–6.44 | 5.46–5.89 |
| Fast-break FGA share (%) | 17.60 | 17.51–17.68 | 17.36–17.79 | 12.15 (134 PBP games) |
| Final-60s possession starts | 5.84 | 5.80–5.88 | 5.69–5.94 | 6.27 (52 close of 134 PBP games) |

Transition opportunity diagnostic (not a Synergy classification): 20.12% of possessions. Final-minute sample: 3,983 games within 6 at 60s.

Per-seed results:

| Seed | Margin | 20+ % | Within 5 % | OT % | Team SD | FB FGA % | Final-60 starts |
|---|---|---|---|---|---|---|---|
| 3101300001 | 13.17 | 22.76 | 25.12 | 3.41 | 5.16 | 17.48 | 5.92 |
| 3101300002 | 13.48 | 22.36 | 22.20 | 4.15 | 6.20 | 17.79 | 5.69 |
| 3101300003 | 13.45 | 23.33 | 24.15 | 3.98 | 5.88 | 17.78 | 5.78 |
| 3101300004 | 13.66 | 24.31 | 22.76 | 4.39 | 5.36 | 17.47 | 5.79 |
| 3101300005 | 13.15 | 22.44 | 23.74 | 3.66 | 4.77 | 17.55 | 5.94 |
| 3101300006 | 12.45 | 19.43 | 26.50 | 3.90 | 4.39 | 17.69 | 5.85 |
| 3101300007 | 13.74 | 24.15 | 21.46 | 3.66 | 6.17 | 17.52 | 5.92 |
| 3101300008 | 12.35 | 18.46 | 24.63 | 4.23 | 4.58 | 17.66 | 5.87 |
| 3101300009 | 13.62 | 23.58 | 23.01 | 4.07 | 6.44 | 17.36 | 5.79 |
| 3101300010 | 13.09 | 22.68 | 26.34 | 5.37 | 5.93 | 17.66 | 5.83 |

### WNBA — 10 seasons, 2,400 games (real reference: 2022–2025 full seasons)

| Metric | Holdout | 95% CI | Seed range | Real reference |
|---|---|---|---|---|
| Mean winning margin (pts) | 11.98 | 11.64–12.32 | 11.25–12.99 | 10.82–12.29 |
| 20+ point games (%) | 17.92 | 16.33–19.75 | 14.58–23.75 | 9.17–18.88 |
| Within 5 points (%) | 25.50 | 24.04–26.92 | 20.83–29.17 | 22.92–25.42 |
| Overtime games (%) | 4.04 | 3.46–4.67 | 2.92–5.83 | 1.75–5.09 |
| Team-margin SD (pts) | 5.76 | 5.03–6.53 | 3.87–8.22 | 5.52–5.98 |
| Fast-break FGA share (%) | 18.20 | 18.09–18.32 | 17.91–18.55 | 10.75 (100 PBP games) |
| Final-60s possession starts | 5.93 | 5.77–6.08 | 5.45–6.30 | 5.78 (40 close of 100 PBP games) |

Transition opportunity diagnostic (not a Synergy classification): 21.03% of possessions. Final-minute sample: 843 games within 6 at 60s.

Per-seed results:

| Seed | Margin | 20+ % | Within 5 % | OT % | Team SD | FB FGA % | Final-60 starts |
|---|---|---|---|---|---|---|---|
| 3101300101 | 12.10 | 20.00 | 29.17 | 2.92 | 5.95 | 17.98 | 6.10 |
| 3101300102 | 11.48 | 15.42 | 25.83 | 5.42 | 5.30 | 17.91 | 5.45 |
| 3101300103 | 11.25 | 15.83 | 28.33 | 2.92 | 4.66 | 18.40 | 5.94 |
| 3101300104 | 12.04 | 17.92 | 25.42 | 2.92 | 6.33 | 18.55 | 6.30 |
| 3101300105 | 11.50 | 16.67 | 27.08 | 4.17 | 4.79 | 18.16 | 6.15 |
| 3101300106 | 12.61 | 19.58 | 25.83 | 3.75 | 6.86 | 18.19 | 5.82 |
| 3101300107 | 12.35 | 20.00 | 25.83 | 4.17 | 6.42 | 18.20 | 6.03 |
| 3101300108 | 11.31 | 14.58 | 20.83 | 4.58 | 3.87 | 18.00 | 5.88 |
| 3101300109 | 12.99 | 23.75 | 22.50 | 5.83 | 8.22 | 18.31 | 5.65 |
| 3101300110 | 12.13 | 15.42 | 24.17 | 3.75 | 5.17 | 18.32 | 5.90 |

## 4. Real full-season references

| League | Season | Games | Mean margin | 20+ % | Within 5 % | OT % | Team-margin SD |
|---|---|---|---|---|---|---|---|
| WNBA | 2022 | 216 | 11.15 | 14.35 | 23.61 | 5.09 | 5.52 |
| WNBA | 2023 | 240 | 11.67 | 16.25 | 22.92 | 4.17 | 5.79 |
| WNBA | 2024 | 240 | 10.82 | 9.17 | 25.42 | 3.33 | 5.72 |
| WNBA | 2025 | 286 | 12.29 | 18.88 | 24.48 | 1.75 | 5.98 |
| NBA | 2024 | 1230 | 12.58 | 19.11 | 23.33 | 4.80 | 5.46 |
| NBA | 2025 | 1230 | 12.75 | 21.06 | 25.12 | 4.88 | 5.89 |

## 5. Definitions and limits

- Mean margin = absolute final score difference including OT. 20+ uses ≥20; within 5 uses ≤5; OT = at least one overtime period.
- Team-margin SD = population SD across teams of their signed season mean margin, computed per season, then averaged across seasons.
- Fast-break FGA share (sim) = primary FGA carrying the sim fast-break flag ÷ all box-score FGA (untagged putbacks/kickouts in denominator). Real = PBP field goals with the `fastbreak` qualifier ÷ all PBP field goals.
- Final-60 = combined possession starts with 0 < regulation time ≤ 60s, in games within 6 points at the 60-second mark. Real values are reconstructed from PBP, not tracking data.
- Real ranges are observed season ranges, not confidence intervals. PBP samples are convenience samples. Simulated WNBA uses 2024 format (12 teams, 40 games); the 2025 real season had 13 teams and 44 games.
- Scope: modern (2020+) leagues only. Player ratings, talent pool and position counts are preserved; roster swaps apply only to newly generated fictional modern WNBA leagues. Existing saves, NBA allocation and pre-2020 generation are unchanged.

## 6. Open items for a future phase

1. Transition over-tagging in the engine (both leagues, ~5.5–7.5 points above the same-definition real rate).
2. NBA blowout rate and mean margin slightly high; OT slightly low.
3. WNBA per-season spread variance: averages are calibrated, individual seasons range widely.

## Reproduction

Branch `phase13-final-holdout`. `python3 dev/phase13/reference.py`; `node dev/phase13/run-holdout.cjs`; `python3 dev/phase13/analyze.py`; `python3 dev/phase13/report.py`. Full text report: `docs/PHASE13-FINAL-HOLDOUT.txt`. Data bundle: `dist/audits/phase13.zip`.
