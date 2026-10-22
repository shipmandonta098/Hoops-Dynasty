# Focused aging verification

Production source verified: `81e91b78318eb0c792c8d27fc51fe14bde9fad5b`. Pre-fix production reproduced from `b0f057bbdf1c8ccf6497f5d47fc86c351ab8253c` in an isolated checkout, with the current strict diagnostic runner attached. No production code or validator changes were made during this verification pass.

## ROOT CAUSE

**A. REAL AGING BUG.** The old base `newSeason()` incremented roster players only. The old `internationalNewSeason()` separately incremented stashed international prospects. Free agents and ordinary unsigned draft-rights players were omitted. The exact 43-game small fixture reproduced 43 failing players out of 128: 37 free agents and 6 unsigned rights. There were zero other integrity failures. The strict validator produced 86 findings because each affected player violated both the increment and birthdate checks; that means 43 failing players, not 86 players.

## AGE MODEL

A mutable, stored **season age**: age on **October 1 of `state.year`**. The existing profile tooltip explicitly says “Age at the start of the season (October 1)”. `generatePlayerBio()` uses the same October 1 cutoff when choosing birth year. `playerBioFacts()` displays `p.age` directly. No daily birthday recomputation occurs.

Thus season 2026 → 2027 legitimately requires one age increment. The validator independently recomputes the October 1 age from DOB, in addition to checking the recorded increment. A separate verification-only UTC birthday oracle also checks every traced player. It does not call the production aging function.

The project has a season year and schedule-day index, not an authoritative `league.currentDate` age field. Dates below are the existing `scheduleDate(state.day)` clock, including day zero being the day before opening night. They are not substituted July 1 dates.

## FILES/FUNCTIONS INVOLVED

| File | Functions and responsibility |
|---|---|
| `dist/game.js` | `newSeason()`: advances year and runs rollover; `player()`: initial stored age |
| `dist/biographies.js` | `generatePlayerBio()`: DOB; `readPlayerBio()`: validates/preserves DOB; `playerBioFacts()`: age display and October 1 tooltip; `advanceSeasonPlayerAges()`: shared aging fix |
| `dist/international-players.js` | `internationalNewSeason()`: stash development; `internationalOffseason()`: new professional players and DOB |
| `dist/draft.js` | `ensureDraft()`: prospect age followed by DOB generation; `newSeason` wrapper: draft completion/archive |
| `dist/free-agency.js` | `newSeason` wrapper: requires free agency complete before rollover |
| `dist/hall-of-fame.js` | `hallRollover()`: retirement after aging; retained references permit correct retirement checks |
| `dist/careers.js` | `validateCareerData()`: validates/preserves stored age; uses `readPlayerBio()` |
| `dist/schedule-ui.js` | `scheduleDate()`: date used in diagnostics |
| `dist/custom-season.js` | `seasonDateRange()` and `newSeason` wrapper: calendar validation |
| `dev/headless-runner.js` | `agingSeasonAge()`, `traceSeasonAging()`, `validateHeadlessLeague()`, `simulateSeasonHeadless()` |
| `dev/verify-aging.cjs` | One-season verification, first-ten failure output, independent DOB oracle and requested counts |
| `dev/test-aging-cases.cjs` | Explicit expected-value tests with individual PASS output |

## ACTUAL FAILURE OUTPUT BEFORE FIX

AGING VALIDATION FAILED

Total players checked: **128**. Total failing players: **43**. Other integrity failures: **0**. Games: **43**. Runtime: **4.715629147 seconds**.

All first ten below had season 2026 → 2027, schedule date 2026-11-13 → 2027-10-27, free-agent status before and after, aging touched **false**, and **0** aging applications. Each failed because stored age did not increment and disagreed with DOB-derived age on 2027-10-01.

| Failure | Player ID | Player | DOB | Before | After | Expected |
|---|---:|---|---|---:|---:|---:|
| 1 | 10000 | Terrence Brooks | 2004-07-07 | 22 | 22 | 23 |
| 2 | 10001 | Adrian Hayes | 2000-04-08 | 26 | 26 | 27 |
| 3 | 10004 | Jamal Williams | 1998-01-01 | 28 | 28 | 29 |
| 4 | 10005 | Aaron Mitchell | 2006-04-28 | 20 | 20 | 21 |
| 5 | 10006 | Nico Young | 2006-06-21 | 20 | 20 | 21 |
| 6 | 10007 | Nikola Pavlović | 1998-06-15 | 28 | 28 | 29 |
| 7 | 10008 | Malik Pierce | 1994-07-19 | 32 | 32 | 33 |
| 8 | 10009 | Darius Green | 1997-07-22 | 29 | 29 | 30 |
| 9 | 10011 | Cameron Bennett | 2006-08-02 | 20 | 20 | 21 |
| 10 | 10013 | Andre Porter | 1998-04-21 | 28 | 28 | 29 |

Every traced player and first-ten full failure records are in `dev/verification-aging-before.json`. The verification command also prints the requested fields separately for each failure.

## FIX

The existing published fix introduces `advanceSeasonPlayerAges(previousYear,newYear)`, called once by `newSeason()` immediately after `state.year` advances. It includes team rosters, free agents and every unsigned draft-rights player. The old roster increment and old stash increment were removed. Stash development still uses its existing yearly guard. Historical snapshots are untouched. No further production fix was necessary in this verification pass.

## DIRECT AGE TESTS

13 explicit cases passed, zero failed. The existing population, generation, retirement and deliberate zero/double-aging regression tests also passed freshly.

| Case | Expected model behavior | Result |
|---|---|---|
| Birthday already occurred | 2006-08-04 on season reference 2027-10-01: 21 | PASS |
| Birthday not occurred | 2006-12-31 on 2027-10-01: 20 | PASS |
| Birthday today/reference date | 2006-10-01 on 2027-10-01: 21 | PASS |
| December/January birthdays | 2000-12-31: 25; 2000-01-01: 26, at 2026-10-01 | PASS |
| Offseason rollover | 2006-07-01: 20 → 21 at the 2026 → 2027 season references | PASS |
| Valid February 29 | 2000-02-29: 27 in 2027; 28 in 2028 | PASS |
| Invalid February 29 | 2001-02-29 rejected | PASS |
| Calendar changes within one season | Dec 31, Jan 1 and July 1 do not silently alter stored season age | PASS |

The generator chooses days 1–28, so it does not generate February 29; valid imported leap-day DOBs are accepted and tested.

## SMALL-LEAGUE TEST

Fresh run of the equivalent original fixture: six teams, two round-robin meetings, seed 2026, 30 regular-season games plus 13 playoff games. Unlike the earlier 47-game follow-up, this preserves the original initialization RNG sequence. Both the pre-fix and current-source runs finish the same 43 games.

- Games: **43**
- Runtime: **4.647129443 seconds**
- Players at season start: **114**
- Players immediately before / after rollover: **128 / 128**
- Players checked / aged correctly: **128 / 128**
- Aging failures: **0**
- Other integrity failures: **0**
- Integrity: **PASS**

Full-season execution is gated in the verification script on this small test passing.

## FULL-SEASON TEST

- Games: **1,319**
- Runtime: **191.48428235 seconds**
- Players at season start: **450** (rosters plus free agents)
- Players immediately before rollover: **515** (including new entrants)
- Players immediately after rollover: **515**
- Players aged correctly: **515 / 515**, each with exactly one application
- Independent DOB oracle failures: **0**
- Retirements: **0** in this transition; the forced retirement edge-case test passed separately
- Completed-year draft prospects generated: **90**; drafted rookies: **60**, all **60** retained
- Upcoming 2027 draft prospects generated: **90**, separate from the 515 live roster/free-agent/rights players
- Champion: **Houston Comets** (team ID 24)
- Aging failures: **0**
- Other integrity failures: **0**
- Integrity: **PASS**

Standings reconciliation, completed playoff bracket, one champion, rosters and unique IDs, contracts, draft completion, rookies, retirement consistency, next-season schedule and year/day transition all passed the existing unchanged integrity gate. The only benchmark warning was the existing informational notification: “Free agency complete. You can start the next season.”

## NEXT STEP — NOT IMPLEMENTED

Review these results. The next focused technical check should be a read-only audit of an existing saved career for historical age/DOB inconsistencies, with any repair policy decided explicitly rather than silently changing player data.

No five-season or longer test was run in this pass. No performance changes, database work, UI changes, engine changes or relaxed checks were introduced. Measured times reflect this run/environment, not an optimization claim.

## Reproduction commands

Current-source direct and small tests:

```sh
node dev/test-aging.cjs
node dev/test-aging-cases.cjs
node dev/verify-aging.cjs small
```

Only after the small test passes:

```sh
node dev/verify-aging.cjs full
```

For pre-fix reproduction, export commit `b0f057bbdf1c8ccf6497f5d47fc86c351ab8253c` into a separate empty directory, copy the current `dev/headless-runner.js` into that isolated directory to attach diagnostics, and run:

```sh
node dev/verify-aging.cjs before /absolute/path/to/isolated/pre-fix-checkout
```

This expected-failure reproduction exits nonzero. It must never be run by replacing the current production source. The verification harness executes exactly one season for every allowed mode and refuses the full test unless the saved small-test result is clean.
