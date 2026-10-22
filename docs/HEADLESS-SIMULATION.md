# Phase 1: headless execution and league diagnostics

This is a developer harness, not a player-facing multi-season feature. It uses an
isolated JavaScript realm and the production scripts in their HTML load order.
There is one basketball engine. Do not use the debug runner in a mounted career.

## Existing flow inspected before implementation

| System | Existing entry / source | Accuracy requirement |
| --- | --- | --- |
| Calendar advancement | `sim` in `game.js`, `seasonLength`, schedule arrays | Preserve schedule, date, per-day ordering and rollback |
| Game / possessions | full `play` wrapper chain → `simulateAttributeGame` in `attributes.js`; `possession-engine.js` | Preserve all action/outcome calculations and RNG draws |
| Player / team statistics | local box rows, possession counters, clutch rows; `stat-tables.js`, `advanced-stats.js`, `team-seasons.js` | Preserve minutes, plus/minus, shooting, turnovers, team and player totals |
| Standings | game commit updates W/L; `standings-tiebreakers.js` | Preserve all results and seeding |
| Injuries / fatigue | `durabilityAfterGame`, `recordWorkload`, `back-to-back.js`, `rest-patterns.js` | Preserve temporary ratings, medical state and recovery |
| Morale / coaching / rivalries | `play` wrappers, `ownerDay`, `morale-effects.js`, `rivalries.js` | Preserve future-state effects; rivalry reads the last scoring commentary |
| Finances / ownership | attendance wrappers, `ownerTrack`, `ownerDay`, `ownerFinalize`, `financeDay` | Preserve ticket revenue, ledgers, goals, firing, budgets |
| Trades / inbox / watch list | daily owner wrappers and existing AI transaction logic | Preserve proposals, accepted AI transactions, cooldowns and alerts |
| All-Star events | `seasonMilestoneDay`, voting and event processors | Preserve selection, events, morale and news |
| Playoffs / championships | `simulatePlayoffGame`, saved bracket config and per-round series slots | Preserve seeding, byes, home court, series length and championship |
| Awards / archives | `finalizeRegularAwards`, owner-finalization hooks, archive functions | Preserve awards and historical consequences |
| Draft generation / execution | `ensureDraft`, `runDraftLottery`, `autoDraft(false)` | Same prospect generator, lottery, AI pick valuations, rights and contracts |
| Free agency / contracts | `beginFreeAgency`, `advanceFreeAgency`, `faCPUOffers`, `faOfferCheck`, `faInterest`, `faSign` | Same offers, demand changes, acceptance rules, cap checks and RFA matching |
| Offseason / aging / development | complete `newSeason` wrapper chain | Preserve archives, calendar regeneration, inflation, roster aging, development and medical checks |
| Retirement / international | `hallRollover`, `internationalOffseason`, `internationalNewSeason` | Preserve retirement policy, international entrants, stashes and tournaments |
| News | `say`, `addNewsItem`, inbox and decision logs | Kept, including narrative events with gameplay effects |
| Replay / rendering | `log`, `captureBox`, Courtside render functions, `render`, toast/progress dialogs | Suppress presentation only |
| Persistence | `careers.js` IndexedDB `save` queue | Normal unchanged; debug per-step saves deferred, optional explicit season checkpoint callback |

## Execution policy

`dist/simulation-execution.js` supplies NORMAL, FAST and HEADLESS policy. NORMAL
is the default; no normal entry point selects another mode. FAST and HEADLESS
currently share the same nonvisual policy. Basketball code is not forked.

The developer runner exposes:

- `simulateGameHeadless(a, b, stage)` — one transactional game, full production `play` chain.
- `simulateDayHeadless()` — the production `sim(1)` flow, including daily systems.
- `simulateSeasonHeadless(options)` — regular season, All-Star resolution, playoffs,
  draft, free agency, rollover, validation and upcoming draft generation.
- `simulateMultipleSeasonsHeadless(count, options)` — one continuous league for
  1, 5, 10, 25, 50 or 100 seasons; never resets state between seasons.

The first two internal helpers require an isolated realm and active execution mode.
The multi-season runner enters/exits the mode itself and restores RNG and hooks even
on failure. For safety, browser career storage is never written by benchmarks.

### Suppressed work

- DOM render/progress/toast/navigation operations and Courtside playback.
- Artificial pacing waits; the existing normal waits remain unchanged.
- Per-event replay box diffs and persistent full PBP arrays.
- Per-step save serialization / IndexedDB writes (counted as deferred requests).

The virtual log count, clock and `onCourt` bookkeeping remain identical. A small
transient last-made/last-score pair preserves the rivalry buzzer-beater check.
Narrative helpers still evaluate because some consume the shared RNG. Removing those
calls now would perturb later basketball outcomes. News, box scores, game history,
rotation/medical events and season archives are **not** pruned.

### Autopilot policy

The user club stays team ID 0. In isolated testing only, it receives the same existing
CPU free-agent offers, RFA matching predicate and overseas-rights eligibility as other
clubs. The existing automatic draft selects its picks. All-Star ballots abstain.
Ownership goals/firing still calculate, but the debug controller can continue operating
a fired franchise. No permanent ownership/control flags are changed. No new generic
trade-acceptance policy, expansion automation or rule evolution is introduced.

### Running

From the project root (Node):

```sh
node dev/test-headless.cjs
node dev/test-storage-cancellation.cjs
node dev/benchmark.cjs 1 2026 dev/benchmark-1.json
# Only after the prior size passes validation:
node dev/benchmark.cjs 5 2026 dev/benchmark-5.json
node dev/benchmark.cjs 10 2026 dev/benchmark-10.json
node dev/benchmark.cjs 25 2026 dev/benchmark-25.json
node dev/benchmark.cjs 50 2026 dev/benchmark-50.json
node dev/benchmark.cjs 100 2026 dev/benchmark-100.json
```

`node dev/run-staged-benchmarks.cjs 2026` runs those sizes sequentially and stops
at the first failure. Each benchmark size starts its own fixture, but the seasons
inside that benchmark share one continuous universe.

The default fixture uses the actual New Career builder: 30 teams, 82 games/team,
14-player minimum, 15 maximum, best-of-seven playoffs and All-Star events enabled.
Initialization is excluded from reported simulation runtime. Seeded Math.random is
local to the VM and restored afterward. Existing locally seeded subsystems remain
unchanged. Date-based narrative IDs may differ; this is not a wholesale RNG redesign.

Timing uses `performance.now()`. Memory uses Node `heapUsed`, sampled at safe
boundaries; it is **not** a measured process-wide peak or browser memory estimate.
Unsupported memory APIs yield null, never fabricated numbers. Players processed means
box-score rows processed, including DNPs, not unique human identities.

### Progress, checkpoints, cancellation and failures

Options accept `onProgress`, `signal`, `onCheckpoint`, `memory`, `yieldControl`,
`seed`, `mode` and `log`. Progress includes season, target, phase, completed games,
regular-season scheduled game count and day. `totalGames` is null because playoff
series lengths make the combined total unknown until completion.
There is no progress-bar dependency. `yieldControl` yields CPU time for responsiveness
rather than basketball pacing (Node uses setImmediate); no per-possession logging.

Abort occurs after a committed league day, playoff game or free-agency round. The day
transaction is the regular-season cancellation boundary. An already-aborted signal
makes no league changes. Individual game failures roll back; daily failures use the
existing day rollback. Completed prior boundaries remain inspectable in the VM.
Offseason progress is resumable only where the existing phase model supports it; a
rollover validation failure is deliberately terminal, not silently repaired.

A report has completed validated seasons, actual committed games, timing/memory,
health diagnostics, archive-size counts, warnings and structured failures (year, day,
phase, game/team IDs where applicable, stack and integrity issues). `status:'failed'`
is a failure, not a completed benchmark; the CLI exits nonzero. Free agency is bounded
at 64 rounds and reports roster/payroll context rather than looping forever.

## Integrity and health

At season end and rollover, verify IDs, membership/rights, roster bounds, retirement
exclusion, contract shape, results vs W/L, completed bracket/champion, draft completion,
rookie survival, exact aging, next calendar and the existing save validator. Validation
never installs the save validator's normalized output or repairs bad league data.

Health diagnostics include active/free/rights population, age, OVR/POT, rookies,
retirements, team scoring, shooting percentages, possessions per team game, payroll
range/average, above-cap teams and current injuries. No automatic rebalancing occurs.

## Known performance and retention concerns

- Transactional deep copies scale with the entire saved universe. Replay removal
  helps, but does not solve growth of historical archives.
- `storeTeamSeason` reconstructs season totals before and after every game; other
  stats/rankings/awards also rescan game history. This is meaningful data, not removed.
- Narrative RNG and rivalry parsing couple commentary to gameplay. A future typed
  scoring event interface could remove more formatting cost without changing draws.
- Free agents, unsigned draft rights, stats archives, draft history, team seasons,
  league honors, Hall careers/votes and finance ledgers need a later retention design.
- The existing rollover clears current-season raw game history after archiving; this
  unchanged behavior is not a new headless retention policy.
- Existing caps already truncate some records (e.g. championship archive: 100 seasons,
  recent news, owner history). No additional historical deletion is introduced here.
- Save validation caps the free-agent pool at 2,000 and current game history at 2,500;
  browser imports also have a 25 MB limit. Long careers may hit these existing limits.
- Existing rollover ages rostered players and overseas stashes, but apparently not
  unsigned free agents or ordinary unsigned draft rights. The strict aging check is
  intentionally allowed to fail; no headless-only aging or retirement fix is applied.

See benchmark JSON and the implementation report for measured results and confirmed
blockers. Do not infer 100-season support from the existence of a 100-season option.
