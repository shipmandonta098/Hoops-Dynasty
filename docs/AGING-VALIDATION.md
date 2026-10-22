# Aging diagnosis and correction

## Established age model

Hoops Dynasty stores a mutable `player.age`. It is the player's age on **October 1 of the season year**, not their age on the current schedule date. This is explicitly documented by the existing profile Age tooltip in `dist/biographies.js`. The existing biography generator subtracts an additional birth year for birthdays after October 1. Daily advancement, save normalization, development and retirement do not independently calculate birthday age.

The schedule clock is `scheduleDate(state.day)`; there is no separate authoritative July 1 offseason clock. Diagnostic dates report that existing clock exactly. A short round-robin season can finish in November, and its next season still starts the following October. Dates must not be invented to make this resemble an NBA calendar.

Consequently, one actual season transition should increment every surviving player by one, regardless of birthday. The original validator's season-increment expectation was correct. Its diagnostic detail was insufficient.

## Root cause

The base `newSeason()` incremented only team roster players. `internationalNewSeason()` separately incremented stashed international draft-rights players while developing their overseas ratings. Free agents and ordinary unsigned draft-rights players had neither path. Injured roster players were not excluded. Retirement occurs after the base rollover; retired historical records are snapshots, not active players to keep aging.

Draft generation and late-blooming international free-agent generation assign their final age before generating their birthdate. Both use the same October 1 convention. Save normalization preserves existing age and birthdate rather than recomputing age.

## Actual reproduction before the fix

The reproducible six-team, two-meeting New Career test completed 47 games (playoff lengths vary with fixture/seed), then failed. This rerun is distinct from the earlier 43-game diagnostic.

| Field | Recorded value |
|---|---|
| Player | Cole Thompson |
| ID | 10002 |
| Birthdate | 2000-04-21 |
| Previous season / schedule date | 2026 / 2026-11-13 |
| New season / schedule date | 2027 / 2027-10-27 |
| Population before / after | Free agent / free agent |
| Age before / after | 26 / 26 |
| Expected age | 27 |
| Aging applications | 0 |

Full player-level failures are retained in `dev/aging-before-fix.json`.

## Shared production fix

`advanceSeasonPlayerAges(previousYear, newYear)` in `dist/biographies.js` now owns aging of rosters, free agents and draft rights. The existing `newSeason()` calls it once immediately after advancing the year, before development and retirement. It generates missing biographies against the previous season before incrementing. No ratings, development probabilities, contract or retirement rules were changed.

The old roster increment and the international stash increment were removed. Stash development retains its existing `lastDevelopment` guard and random draws; rerunning that development routine cannot increment age again. Newly signed stash players have already aged while still in the rights pool. Completed draft snapshots and retired archives are not mutated.

This corrects future rollover behavior. It does not silently rewrite birthdates or retroactively repair previously corrupted imported saves.

## Stronger diagnostics and validation

The developer runner traces actual age assignments during the complete production rollover, restoring ordinary properties afterward. Diagnostics include player ID/name/DOB, old/new age, expected age, old/new season and schedule date, population before/after, touched flag, write details and application count. Retained player references allow validation of players who legitimately retire during rollover.

Validation still requires exactly one increment per transitioned player and now independently checks live players and prospects against the existing October 1 birthdate convention. Serious failures remain fatal. No checks were weakened or bypassed.

`dev/test-aging.cjs` covers birthdays near season end, July 1, offseason, October 1 and opening night, December 31/January 1, and valid/invalid leap days; roster/free-agent/rights/stash populations; injuries; generated domestic/international prospects and professional free agents; retirement after aging; repeated stash development; deliberate missed/double increments; and save normalization.

## Scope

No performance optimization, long-term pruning, basketball rebalancing, calendar redesign or birthday-based aging migration is included. Tests stop at five seasons at most. Existing unrelated lifecycle limits, such as roster-minimum restrictions on retirements, remain unchanged.

## Verification results

- Before-fix reproduction: 47 games, 8.37 seconds; 42 distinct players failed aging (84 findings including the additional DOB consistency check).
- Fixed small league: 47 games, 8.01 seconds; complete league integrity passed; 128 players traced, 128 aging applications.
- Fixed full league: 1,319 games, 304.34 seconds; complete league integrity passed; 515 players traced, 515 aging applications; initialized season 2027.
- Targeted aging tests passed, including deliberate validator failures.
- Six seeded normal/headless full-state game comparisons passed.
- Save roundtrip, cancellation, rollback, archetype development and international pipeline regressions passed. The existing international test was executed with its stale un-awaited `sim()` call awaited and its isolated year-jump test invoking the new shared aging function; its production assertions were unchanged.

**Five-season continuous test: PASSED.** 6,558 games in 1800.33 seconds (30.01 minutes), 2026 through 2030; initialized 2031. Zero league-integrity failures. All five completed seasons passed aging, roster, standings, bracket/champion, draft/rookie, contract, retirement and next-season initialization checks. No 10–100-season tests were attempted.

| Completed season | Games | Players traced | Aging applications | Retired after aging | Integrity |
|---|---:|---:|---:|---:|---|
| 2026 | 1319 | 515 | 515 | 0 | Passed |
| 2027 | 1315 | 580 | 580 | 0 | Passed |
| 2028 | 1309 | 645 | 645 | 0 | Passed |
| 2029 | 1307 | 710 | 710 | 0 | Passed |
| 2030 | 1308 | 775 | 775 | 1 | Passed |

Full results: `dev/aging-full-5.json`. Runtime is measured, not an optimization claim. The benchmark warnings contain existing informational offseason notifications, not validation failures.
