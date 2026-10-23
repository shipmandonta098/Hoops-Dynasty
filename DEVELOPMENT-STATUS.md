# Hoops Dynasty — Development Status

Snapshot written 2026-10-23 during a Claude Code session. It records what is on `main`, what sits on unmerged branches, what was tested and what is still open. "Implemented" means code exists on the named branch. "Merged" means it is on `main`. "Planned / pending" means the work is not done.

## Git state at time of writing

- **Current branch:** `late-period-strategies`
- **Latest commit on this branch:** see `git log -1`. This file is updated in the commit that records the final scorecard.
- **Latest commit on `main`:** `e27a0c7` (merge of PR #8, `fa-pool-quality`)

Unmerged work on remote branches (commits not on `main`):

| Branch | Commits not on `main` | What it is |
|---|---|---|
| `late-period-strategies` | `7265962` plus scorecard/doc commits | End-of-quarter strategies and hack-a fouling. The scorecard gate passed; awaiting a PR. |
| `fa-swap-entry-fix` | `c1710fa`, `e926cd1` | **Crash fix for a bug that is already on `main`.** It needs a PR. |
| `cpu-transactions` | `183f602`, `501c72c`, `32c54e6` | Trade-pick owner index (performance) and refreshed counts. The PR #6/#7 merges did not include these. |
| `franchise-presets-12` | `3495aa4` | DNP labels in box scores. Not merged. |
| `comeback-callouts` | `a21e2f9` | Comeback and blown-lead broadcast callouts. Not merged. |

## Currently implemented game features (on `main`)

Hoops Dynasty is a static browser GM game. `dist/index.html` loads about 119 scripts in order, each with a `?v=` cache buster. There is no build step. The root `index.html` redirects to `dist/` for GitHub Pages.

- **Simulation engine** (`attributes.js`, `possession-engine.js`, `tendencies.js`, `pick-and-roll.js`, `late-game.js`, `rotations.js`, `statistical-balance.js`, `simulation-rules.js`):
  - Possession-by-possession sim with a possession state machine.
  - Player attributes, tendencies and archetypes.
  - Isolation and pick-and-roll.
  - Fouls, the bonus, free throws and technicals.
  - Rotations with fatigue and foul trouble.
  - Home court and altitude.
  - The clock:
    - Most minutes run in fixed per-minute "buckets."
    - The last 2 minutes of Q4 and of each OT run on a live clock with endgame logic: intentional fouls by the trailing team, run-out-the-clock holds, needing a three, tie-game last shot.
  - Historical era profiles for NBA and WNBA (`historical-era-profile.js`, `historical-settings.js`).
- **League modes:** NBA-style and WNBA-style leagues, including WNBA finances and progression (`wnba-*.js`), plus custom league settings (`league-settings.js`, `LEAGUE_SETTINGS.md`).
- **Franchise / GM:**
  - Contracts, free agency, the draft and the lottery.
  - Trades: trade center, trade block and proposals.
  - Finances, attendance and owners.
  - Coaching and coach contracts.
  - Morale and personalities, injuries and durability.
  - GM career and inbox, news feed, Hall of Fame, league history, awards.
  - All-Star voting and events, rivalries, power rankings, advanced stats.
- **Phase 13 balance work (merged, PR #1):** final 20-seed holdout scorecards. The WNBA initial roster spread was frozen at 1.40×. Files are in `dev/phase13/`.
- **12 fictional franchise presets (merged, PRs #3–#5):** logos, geography, altitude, city photos, rivalries, and setup/expansion/relocation integration (`franchise-presets.js`, `FRANCHISE-PRESETS.md`).
- **Box score and PBP UI (merged):** team logos on results and play-by-play, a merged preset list, and player positions next to names in box scores.
- **CPU transactions (merged, PRs #6/#7):**
  - Multi-asset AI trades with picks, pair sampling, cooldowns and a deadline ramp.
  - CPU in-season signings and waivers.
  - Files: `trade-logic.js`, `cpu-roster-moves.js`.
- **Free-agent pool quality (merged, PR #8):**
  - New leagues generate replacement-level FA pools (`replacementFreeAgentSpecs` in `game.js`):
    - about 85% rated 58–70;
    - about 13% rated 71–74;
    - at most one player rated 75–78, present in about 65% of pools.
  - Ages are mixed, and potential headroom depends on age.
  - Existing saves are not regenerated.
  - CPU offseason "upgrade" bids at full roster: the team names its weakest player as a swap and releases him under dead-cap rules (`faCPUUpgradeOffers` in `free-agency.js`).

## Changes completed in this session

| Work | Status |
|---|---|
| Root `index.html` redirect for GitHub Pages | Merged (#2) |
| 12 franchise presets plus logo/PBP/box-score follow-ups | Merged (#3–#5) |
| DNP labels in box scores (`3495aa4`) | **Implemented on `franchise-presets-12`, not merged** |
| CPU transaction activity (trades, signings, waivers) | Merged (#6/#7) |
| Trade-pick owner Map index, performance (`501c72c`) | **Implemented on `cpu-transactions`, not merged** |
| Comeback and blown-lead callouts (`comebacks.js`, `test-comebacks.cjs`) | **Implemented on `comeback-callouts`, not merged** |
| FA pool quality | Merged (#8) |
| Offseason crash fix after a CPU swap release | **Implemented on `fa-swap-entry-fix`, not merged** |
| Late-period strategies: 2-for-1, last-shot hold, heaves, hack-a | **Implemented on `late-period-strategies`. Scorecard gate passed. Not merged.** |

### Late-period strategies (branch `late-period-strategies`, commit `7265962`)

**Implemented:**

- **Live clock in the final 60 seconds of Q1–Q3.**
  - Those seconds now run on the live clock in `attributes.js` (the regulation loop).
  - The live minute's possession count differs from the bucket plan. The difference goes into `scoreStatePaceCarry`, so the possession total per game is unchanged.
- **Q4/OT logic stays in the final period.** Endgame fouling, run-out-the-clock holds, `quickTwo` and clutch-minute accrual are gated to the final period (`liveFinalPeriod`), so they don't leak into earlier quarters.
- **Quarter-end policy (`quarterEndPlan` in `late-game.js`).**
  - **2-for-1 push:** when the clock is between shot clock + 4 and shot clock + 16, the team pushes. The shot is rushed (−0.015 make chance), and adherence scales with coach tactics.
  - **Last-shot hold:** when the game clock is under the shot clock, the team holds and releases the shot with about 2–4 seconds left.
  - **Buzzer heave:** when 2.5 seconds or less remain, the team heaves. Make chance is 2.5%, and the foul chance is cut to 10%.
- **Hack-a (`intentionalFoul` in `attributes.js`).** The defense targets the worst on-court FT shooter. All of these must hold:
  - the defense is in the bonus;
  - 2 × FT% is below the offense's points per possession;
  - the margin is 15 or less;
  - it is not inside a last-2-minutes window where the away-from-play rule applies.

  How it plays out:
  - A deep-bench player checks in to commit the foul.
  - The offensive coach may sub the target out for about 3 minutes.
  - The per-possession rate depends on coach tactics × coach type, and is lower from 2016 on.
- **New league setting `awayFromPlayRule`** (`league-settings.js`): `era` (default), `allPeriods`, `finalPeriod` or `none`.
  - Era behaviour: the NBA applies the rule in every period from 2016–17 and only in Q4/OT before that.
  - The WNBA applies it in Q4/OT from 2016.
  - Older saves read the default.
  - The WNBA wording is confirmed only for Q4/OT (2016 WNBA rule-change announcement). It is **unverified** whether the WNBA later extended the rule to every period.
- **Play-by-play lines:** "pushes for a 2-for-1", "holds for the last shot", "launches a heave at the buzzer", "intentionally fouls X (NN% FT)", "checks in to foul", "subs out X to stop the intentional fouls".
- **Per-game counters:** on a non-saved `result.lateStrategy` property. They cover 2-for-1 attempts, whether the pushing team got the last possession, end-of-quarter possessions, holds, heaves and makes, intentional fouls, hack sub-outs, and era.

## Tests actually performed

### Full test suite

- **How it was run:** all 99 `test-*.cjs` files with `node -r strip-v.cjs`, on `late-period-strategies` at `7265962`.
- **Result:** 38 passed, 61 failed.
- **Comparison with baseline:** the pre-session baseline was 35 passed / 60 failed (95 files). No file that existed in the baseline changed result.
- **Four new files:**
  - `test-fa-pool.cjs`: pass.
  - `test-franchise-presets.cjs`: pass.
  - `test-late-period.cjs`: pass.
  - `test-cpu-transactions.cjs`: **failed** in the suite run, at the assertion on line 23 that every CPU move's news item is categorized as "Transactions". A diagnostic rerun found no miscategorized items. **It is intermittent (the test depends on random draws), and the cause is unconfirmed.** The same check was not run on `main`.
- **The 60 baseline failures** predate this session. They were not investigated.
- **Nondeterministic tests seen earlier:** decision-tree, fa-sorting, layups, matchup, trade-center.

### Targeted checks

- **`test-late-period.cjs`: passes.** It covers:
  - the quarter-end windows and how adherence scales with tactics;
  - the away-from-play rule by era and by setting, and rejection of an invalid setting;
  - 20 real games: score conservation, counters not saved, strategies appearing in PBP;
  - hack-a: a 20% FT shooter gets fouled, and no hack falls inside a rule-protected last-2-minutes window.
- **`test-fa-pool.cjs`: passes.** The swap-release regression assertions are on `fa-swap-entry-fix`.
- **`dev/fa-pool/check.cjs` after the hotfix** (results in `dev/fa-pool/check-results.json` on `fa-swap-entry-fix`):
  - **NBA:** the season completed with 0 errors. No unsigned 75+ FA at opening night, the All-Star break or the close of FA. There were 7 swap releases and 4 in-season upgrade signings.
  - **WNBA:** the season completed with 0 errors. One unsigned 77 on opening night, then none. There were 6 in-season upgrade signings.
  - Before the fix, the NBA run crashed in the offseason with "Cannot read properties of undefined (reading 'demand')".
- **`dev/late-period/check.cjs`, partial seasons (per game, both teams):**

  | League, year | 2-for-1 pushes | Holds | Heaves (make rate) | Intentional fouls |
  |---|---|---|---|---|
  | NBA 2025 | ~1.9–2.2 | ~2.5 | ~1.0 (2–3.5%) | ~0.04 |
  | WNBA 2024 | ~2.1 | ~2.6 | ~1.1 | 0 |
  | NBA 1995 | ~2.5 | ~2.6 | ~1.0 | ~0.57 |

  About 48% of 2-for-1 pushes ended with the pushing team getting the quarter's last possession.

### Phase 13-style scorecard on fresh seeds (COMPLETE: gate passed)

**Setup:**

- Seeds are reserved in `dev/late-period/reserved-seeds.json`: 3101400001–010 for the NBA and 3101400101–110 for the WNBA. They were checked unused across 1,607 dev files.
- Run with `dev/late-period/run-scorecard.cjs`, summarized with `dev/late-period/scorecard.py`. Results are in `dev/late-period/scorecard.json`.
- The season files are `dev/phase13/lpcand-*` (this branch) and `dev/phase13/lpctrl-*` (same seeds on `main` at `e27a0c7`).
- 40 seasons ran with 0 failures.
- **Gate:** the pooled candidate value must fall inside the Phase 13 holdout per-seed [min, max].

| Metric | NBA candidate | NBA control | Phase 13 range | WNBA candidate | WNBA control | Phase 13 range |
|---|---|---|---|---|---|---|
| Mean margin | 13.60 | 13.41 | 12.35–13.74 | 12.45 | 12.35 | 11.25–12.99 |
| 20+ pt % | 23.69 | 22.78 | 18.46–24.31 | 19.96 | 18.96 | 14.58–23.75 |
| OT % | 3.61 | 3.46 | 3.41–5.37 | 3.29 | 3.46 | 2.92–5.83 |
| Pace | 97.16 | 97.05 | 97.01–97.29 | 80.26 | 80.21 | 80.10–80.50 |
| FTA/FGA | .2341 | .2346 | .2253–.2388 | .2428 | .2445 | .2290–.2685 |

**Result:** all five metrics are inside the Phase 13 ranges for both leagues.

Compared with the same-seed control:

- **Pace and FTA rate:** essentially unchanged. The +0.01 FTA rate seen in the earlier part-season pre-check was noise.
- **Margin:** +0.1–0.2.
- **20+ point share:** about +1 point in both leagues.

The 20+ point share is the one consistent shift, small and inside the ranges. NBA mean margin and 20+ % still sit near the top of their ranges.

**Promotion state:** the change passed the gate the user set. It has **not** been merged to `main`; merging needs the user's go-ahead and a PR.

## Confirmed bugs and unresolved simulation issues

1. **Offseason crash after a CPU swap release (on `main`).** A swapped-out player had no free-agency entry. The fix is on `fa-swap-entry-fix` and is not merged.
2. **`test-cpu-transactions.cjs` intermittent failure.** The news-category assertion failed once. Not reproduced, cause unconfirmed.
3. **Late-period change:** the full scorecard resolved the pre-check concerns. Pace and FTA rate are unchanged against the control. The 20+ point share rose about 1 point in both leagues, which is small and inside the ranges.
4. **60 pre-existing test failures.** They are in the baseline and were not investigated this session.

## Known limitations

- **WNBA CPU teams** make open-spot FA upgrade bids only. They do not release a player to make room.
- **Hack-a fouler substitution:**
  - It swaps the bench player directly into the court set and position slot.
  - The normal rotation refresh usually takes him back out at the next dead ball.
  - It is a simplification, not a full substitution model.
- **Heave rule:** heaves happen only when 2.5 seconds or less remain at the start of a possession that did not come off an offensive rebound. Between 2.5 and 3 seconds, the ordinary quick final shot is used.
- **Q4/OT:** the new heave and 2-for-1 logic does not apply there. The existing endgame code is unchanged.
- **The hack-a threshold:**
  - It uses a blended points-per-possession estimate: game score plus a 1.1 prior over 25 possessions.
  - In generated leagues, only about one player per league shoots under 55% FT, so hack-a is naturally rare.
  - The pre-2016 rate (~0.57 per game in a 1995 league) has not been checked against real data.
- **Headless play-by-play:** only the first logged game in a batch gets full PBP. Those are existing logging caps.

## Important architectural decisions and files

- **Hooks wrap functions:** e.g. `const before=f; f=function(){...}`. A later-loaded script wraps outermost, so script order in `dist/index.html` matters. Changed files get new `?v=` values. This session used `late-period-1` for `attributes.js`, `late-game.js` and `league-settings.js`.
- **Engine state** lives in the `simulate`/`play` closure in `attributes.js`. New per-game values like `liveFinalPeriod`, `possessionTally` and `lateStrategy` are closure-local. Policy helpers that don't need closure state go in `late-game.js`.
- **Results:** new per-game metadata is attached with `Object.defineProperty`, so it isn't enumerable and isn't saved.
- **Saves:** `validateCareerData` / `readLeagueSettings` whitelist fields. A new league setting only needs a row in `LEAGUE_SETTING_GROUPS`, because defaults fill older saves.
- **Headless harness:** `dev/load-league.cjs` and `dev/headless-runner.js`. Balance audits run through `dev/audit-phase13-season.cjs` with `dev/phase13/instrument.cjs`.

## Recommended next steps

1. Open a PR for `late-period-strategies` (the scorecard gate passed in both leagues) if you want it on `main`.
2. Open a PR for `fa-swap-entry-fix`. It fixes a crash already on `main`.
3. Decide whether to merge `501c72c` (performance), `3495aa4` (DNP labels) and `comeback-callouts`.
4. Investigate the intermittent `test-cpu-transactions.cjs` failure. Run it several times on `main` and on this branch.
5. Optional: let WNBA CPU teams release a player to make room for a top FA, and check the pre-2016 hack-a frequency against real data.
