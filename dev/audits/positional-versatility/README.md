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
