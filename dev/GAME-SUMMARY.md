# Courtside Game Summary

Implemented October 17, 2026.

## Gameplay and interface

Courtside now has Play-by-Play, Box Score and Game Summary views. The summary is derived from the existing game result and the scoring events visible at the current playback index. Next Play, timed playback, speed changes and Skip to Final use that same index. Saved schedule results also expose Summary and playback navigation.

The summary includes all tied leaders for PTS, REB, AST, STL, BLK and 3PM; existing profile links and available portraits; team comparisons; biggest leads; lead changes and ties; last lead change; current/final leader; period scoring; largest and current unanswered runs; a differential chart with event tooltips and an expandable scoring-event list; factual milestone highlights; and a final recap. Period names respect two-half historical rules and overtime is dynamic. Styling follows the existing dark theme and orange active buttons, with horizontally scrollable tables/chart on small screens.

## Statistical definitions and integrity

- Scoring records are written by the actual engine's `addScore`, including free throws, putbacks and kickouts. No random values or new simulation decisions are introduced.
- Lead changes compare the new non-tied leader with the last non-tied leader. Initial possession of the lead is not a change. Every scoring event that reaches a tie is counted, excluding initial 0–0.
- Runs are consecutive points by the same team until the opponent scores; quarter breaks alone do not terminate them.
- Paint points are made field goals classified as inside shots by the existing engine, including putbacks. Free throws are excluded.
- Fast-break points use the engine's transition-advantage possession flag, including associated nontechnical free throws. These reflect the simulator's transition model, not independently reconstructed real-world tracking data.
- Second-chance points follow an offensive rebound within the possession, including subsequent nontechnical free throws.
- Points off turnovers belong to the possession immediately following the opponent's turnover, including continued offensive-rebound chances. Technical free throws are excluded from these possession-derived categories.
- Bench points use recorded nonstarter flags. Team shooting/rebound/assist/turnover/foul totals reuse the box-score totals helper, including team turnovers. Offensive rebounds were appended to the live timeline key list to preserve old key indices.
- Highlights are limited to supported events: crossing 15 points in a period, 8+ unanswered points, triple-doubles, three or more final-regulation-period lead changes, late go-ahead baskets that remain decisive, and wins after a 20+ point deficit. The recap only reports recorded statistics.

## Persistence and compatibility

Optional, versioned `summaryData` is saved with each game, validated on load, and stored by the existing normalized career repository. It contains chronological scoring events, recorded milestones, period count, a completeness check, and team identity snapshots. Relocations cannot change these historical summary identities. Replay prefixes are reconstructed from the saved event indices; this feature does not introduce a separate simulation or change existing playback-cursor persistence.

Existing games without this ledger show recoverable box statistics and explicitly unavailable event-derived values. Games with incomplete event totals, such as an awarded forfeit score, suppress detailed event-based summaries instead of inventing a scoring history. Older live timelines without offensive-rebound updates show that statistic as unavailable. The existing engine may retain sparse/no play-by-play for unwatched games; their complete scoring ledger still supports a final summary, but missing live box-score frames are not fabricated.

## Changed production files

- `dist/game-summary.js`: summary derivation, chart, highlights, recap, profile navigation, schema validation and replay entry point.
- `dist/game-summary.css`: responsive summary styling.
- `dist/attributes.js`: scoring flags, chronological ledger and milestone capture.
- `dist/schedule-events.js`: third tab, live refresh, shared totals, offensive-rebound timeline field and preserved scroll/expanded details.
- `dist/game.js`: saved-result Summary navigation.
- `dist/coaching.js`, `dist/rotations.js`, `dist/tendency-results.js`: forward the selected result view through existing wrappers.
- `dist/careers.js`: validate and preserve optional summary data.
- `dist/index.html`: load the module and stylesheet before career startup.

## Verification

`node dev/test-game-summary.cjs` passes:

- Controlled lead changes through ties, times tied, biggest leads and true unanswered runs.
- Live event prefixes and milestone visibility with no final recap before completion.
- Overtime formatting and historical two-half period labels.
- Actual NBA, 1997 WNBA and 2026 WNBA games: scoring/box/period reconciliation, live-prefix synchronization, valid event schema and legacy fallback.
- Forty seeded playoff games compared with the previously published engine: identical player box scores and final scores, including an actual overtime game.
- Real Courtside render/playback handlers with DOM insertion stubbed: third-tab selection, Next Play, Skip to Final and saved-result navigation.
- Historical team identity after relocation.

`HD_TEST_NODE_MODULES=/tmp/hd-family-tests/node_modules node dev/test-game-summary-storage.cjs` passes a simulated day through normalized IndexedDB and career validation, preserving scoring events, milestones, final summaries and replay prefixes. Uses fake-indexeddb 6.2.4.

`node dev/test-altitude.cjs` passed the existing NBA/WNBA engine, fatigue and live/final box regressions. JavaScript syntax checks and `git diff --check` pass.

Browser visual/interaction QA was unavailable in this environment. DOM-handler tests do not substitute for rendered desktop/mobile verification. Older unrecorded statistics cannot be recovered.
