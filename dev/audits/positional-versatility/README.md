# Positional versatility: paired WNBA season audit (stopped early)

This compares main at `0d5e580` (option #1 position lineups) against the positional versatility branch (`a3e1887`). Both sides used the same seeds (910001–911000) and the same fresh 12-team, 40-game WNBA league; rosters were checked to be identical per seed.

The run was stopped by request after 517 main and 534 branch seasons. **440 seeds finished on both sides**, and the paired results below come from those.

## Files

- `main-option1-seasons.jsonl.gz`, `branch-seasons.jsonl.gz`: one line per season. Each team has wins, losses, points for/against, preseason `strength()` and top-8 OVR.
- `paired-summary.json`: output of `analyze.py` on the paired seeds. `current` is main and `option1` is the branch (labels kept from the earlier parity study).
- `sim.cjs`: the season harness. Usage: `node sim.cjs <repo dir> <first seed> <count> <out.jsonl>`. Its minutes cache only speeds up the harness; it was verified to reproduce uncached seasons exactly.
- `analyze.py`: the summary script. Set `A_FILE`/`B_FILE` to the two unzipped files.
- `stage-table.md`: per-stage lineup and minutes measurements (main and stages 1–4).

## Paired result (440 seasons, main → branch)

| Metric | Main | Branch | Diff (95% CI) |
|---|---|---|---|
| Win % SD | .165 | .164 | −.001 (−.003, +.002) |
| Margin SD | 5.74 | 5.74 | +0.00 (−0.08, +0.09) |
| Best record (wins of 40) | 31.7 | 31.5 | −.005 win % (−.012, +.002) |
| Worst record (wins of 40) | 9.4 | 9.2 | −.004 win % (−.011, +.002) |
| Top-3 preseason teams' win % | .679 | .674 | −.006 (−.011, −.001) |
| Bottom-3 preseason teams' win % | .335 | .337 | +.002 (−.003, +.007) |
| Preseason favorite finishes 1st | 64.1% | 62.5% | |
| Strength/rank correlation | .777 | .773 | −.004 (−.018, +.009) |

No meaningful change in competitive balance. The only interval that excludes zero is the top-3 contenders' win %, down 0.6 points, which is about 0.2 wins per 40-game season.

## Functional check (branch, 36 seasons)

`functional/func.cjs` (with `inject.js`) simulated 30 WNBA and 6 NBA regular seasons on the branch. It checked every game:

- exactly 5 unique, healthy starters from the team's roster
- team minutes equal to 5 × the game length, including overtime
- no player over the game length

It also recorded rotation sizes, starter and top-3 minutes, and win spread. Raw rows are in `functional/wnba.jsonl` and `functional/nba.jsonl`.

| | WNBA (30 seasons) | NBA (6 seasons) |
|---|---|---|
| Games | 7,200 | 7,380 |
| Crashes / lineup or minutes violations | 0 / 0 | 0 / 0 |
| Players used per team-game (avg, range) | 10.7 (8–12) | 13.1 (9–15) |
| Most minutes in a regulation game | 38 | 43.5 |
| Starter MPG | 27.3 | 29.9 |
| Healthy top-3 OVR players' MPG | 27.4 | 29.7 |
| Healthy top-3 player under 15 MPG (≥10 games) | 4 of ~1,300 | 0 |
| Win % SD (mean, range) | .163 (.128–.215) | .148 (.120–.163) |
| Best / worst record (mean) | 31.4 / 9.2 wins of 40 | 66.8 / 17.8 wins of 82 |

The WNBA win % SD of .163 matches main's .164 from the paired audit.
