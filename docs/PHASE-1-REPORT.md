# Phase 1 implementation report

Shared headless execution and the isolated developer runner are implemented. **100-season support is not verified.** The one-season gate caught an existing aging defect and correctly stopped escalation.

## Changed components

- Added `dist/simulation-execution.js`: shared NORMAL / FAST / HEADLESS policy.
- Modified `dist/attributes.js`, `dist/rivalries.js`: skip replay snapshots/full PBP storage while preserving virtual event bookkeeping, RNG calls and last-score rivalry semantics.
- Modified `dist/game.js`, `dist/careers.js`, `dist/index.html`: load policy, gate presentation/waits/saves, surface headless failures, retain existing day simulation.
- Modified `dist/owners.js`, `dist/free-agency.js`, `dist/international-players.js`: temporary debug autopilot uses existing CPU policies for the user club without changing club ownership.
- Modified `dist/playoff-series.js`, `dist/all-star-voting.js`: nonvisual operation and actionable failure propagation.
- Added developer runner, isolated loader, staged benchmark CLI, parity/cancellation/storage tests, JSON reports, and architecture documentation under `dev/` and `docs/`.

## Normal versus headless

Both call the complete production `play` wrapper chain and `simulateAttributeGame`; no replacement basketball engine or balance changes. The runner invokes the existing day, playoffs, awards, draft, free-agency and rollover systems. Normal mode remains the default.

Headless skips DOM/scroll/render/progress dialogs, Courtside presentation, artificial pacing, replay box diffs, stored full PBP and per-step persistence. News, box scores, stats, finances, medical/workload state and archives remain. RNG-bearing narrative calls still run; removing them would change subsequent outcomes. Scoring commentary needed by rivalry checks is held only transiently.

## Actual benchmarks

All runs used the existing engine. Full fixtures had 30 teams and 82 regular games/team. Counts include playoff games; All-Star events also ran but are not counted as production `play` games. Fixtures were continuous through the next-year transition; none passed the final aging gate.

| Test | Games | Runtime | Integrity outcome |
| --- | ---: | ---: | --- |
| Initial full-league 1-season fixture | 1,314 | 322.38 s | Failed at 2027 rollover: 86 aging errors |
| Six-team diagnostic cycle | 43 | 7.46 s | Failed at 2027 rollover: 43 aging errors |
| New Career builder, 1-season benchmark | 1,319 | 349.42 s | Failed at 2027 rollover: 86 aging errors |
| 5 / 10 / 25 / 50 / 100 seasons | — | Not run | Blocked by the failed 1-season integrity gate |

The New Career run processed **36,932 box-score player rows**, starting in 2026 and reaching 2027 day 0. Average runtime per game: **264.91 ms**. Runtime for the attempted season cycle: **349.42 s**. Average per *successfully validated* season is unavailable because zero seasons passed validation.

Node heap: **17.5 MiB start**, **216.1 MiB finish**, **308.1 MiB sampled peak**. These are measured heap values, not a true maximum RSS or a browser estimate. No leak can be established from one cycle. 299 presentation-path save requests were deferred. Initialization is excluded; checks, simulation and offseason are included. Concurrent local tests affected timing, so these are diagnostic measurements, not isolated hardware comparisons.

## Integrity findings

Regular-season results reconciled, the bracket produced a champion, draft picks were generated and completed, legal free agency completed, archives and next-season calendar existed, and the existing save validator accepted the resulting structure. The strict added aging check found **86 players** who did not age: 57 free agents and 29 unsigned draft-rights players. Detailed IDs and expected/actual ages are in `dev/benchmark-1.json`.

This is existing shared offseason behavior, not a new headless result. It was deliberately **not repaired** or rebalanced in this task. The runner reports failure rather than claiming a successful season or attempting larger benchmarks.

## Regression verification

- Six seeded NORMAL/HEADLESS comparisons matched the complete league state and every box score, excluding replay-only arrays.
- Strict headless day test rejected any DOM access and passed.
- Safe cancellation after a committed day, immediate cancellation, game rollback, duplicate-ID detection, RNG/mode restoration and normal save roundtrips passed.
- Existing tests passed for live playback/plus-minus, instant simulation, standings/schedule persistence, playoff rounds/byes/series, All-Star advancement, draft, free agency, contracts/inflation, durability/injuries, fatigue and archetype development.
- Older draft/free-agency/contract tests assumed synchronous `sim`; their checks were executed with awaited simulation calls. Their stale async assumptions were not changed in production.
- This is source/VM/integration verification, **not browser visual QA**.

## Bottlenecks and storage concerns

Repeated deep-copy rollback snapshots, per-game season-stat reconstruction and history rescans remain major inspection-based bottlenecks; no profiler attribution percentages are claimed. The full-cycle runtime is not yet suitable for claiming efficient 100-season execution.

PBP arrays/replay frames are absent in headless games. Permanent stats, draft/team/finance/Hall histories still grow; free agents and unsigned rights also require attention. Existing limits include a 2,000-free-agent validator cap, 2,500 current-season game limit and 25 MB import limit. Existing retention truncations (including 100 championship seasons) remain unchanged. No new historical pruning was introduced.

## Blockers and next work

1. Fix aging/retirement lifecycle consistently for all player pools in the **shared** offseason system, with migration and normal-mode tests; re-run the 1-season gate.
2. Then run the requested 5 → 10 → 25 → 50 → 100 sequence, stopping at any integrity failure.
3. Next performance optimization: replace repeated full-state rollback copies and repeated season-stat rescans with measured transactional/incremental equivalents, requiring seeded parity before adoption.

No century report, multi-season player UI, pruning/compression, automatic expansion, rule evolution or pre-generated history was added.
