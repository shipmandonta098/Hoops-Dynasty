# IndexedDB persistence architecture

## Before

See STORAGE-AUDIT.md. Version 1 already used IndexedDB, but each career was a single whole-league record. localStorage held an older legacy save and small preferences. No React or sessionStorage is involved.

## Version 2 stores

| Store | Records | Important indexes |
| --- | --- | --- |
| leagues | Save-slot metadata plus current non-entity state, schedule/settings, award-comparison summaries and lightweight Hall identities | Primary save ID |
| teams | Team metadata, standings and current team state, without embedded rosters | league |
| players | One live player per league/player ID, status and team reference; contracts remain with their player | league, league/team, league/status |
| games | One completed game summary and its existing presentation data | league, league/season, league/season/day, league/home/season, league/away/season |
| boxScores | One box score per game, independently retrievable | league, league/season |
| archives | Typed historical rows: player/team season stats, team season details, drafts, champions, awards, franchise records, Hall careers, news, decisions | league, league/kind, league/kind/season, league/kind/player, league/kind/team, league/kind/sequence |
| metadata | Verified migration markers | key |
| careers | Original v1 records retained solely for recovery | id |

Player, team and league IDs are preserved. All entity keys include league ID. Historical stats retain actual player IDs where the old model supplied them; old name-only records use name/team identity rather than invented player IDs. Season/game IDs use year plus chronological game ordinal, which stays stable as the existing engine prepends games and distinguishes repeated same-day playoff matchups. Archived team roster snapshots retain their historical metadata; they do not store mutable live player objects.

Schema creation is additive, inside `onupgradeneeded`. Connections close on version changes. Blocked upgrades and unsupported APIs report errors rather than replacing the database. A future upgrade can add stores/indexes in the same upgrade transaction.

## Repository and commits

`dist/league-repository.js` owns all raw IndexedDB operations. The existing career-store interface remains compatible (`get`, `put`, `list`, `metadata`, `remove`, `migrate`). Additional APIs include `saveLeague`, `loadLeague`, `savePlayer`, `getPlayer`, `saveGameResult`, `getGamesForSeason`, `saveSeason`, `getSeason`, `getPlayerCareerStats`, `getChampions`, `saveDraftResults`, `getDraftHistory`, `getAwards`, `getPlayoffs`, `getNews`, `getTransactions`, `getRetiredCareers`, and generic indexed `archivePage`.

Related active state, rosters, players, games, boxes and archives commit in one read/write transaction. `saveGameResult`, `saveSeason` and `saveDraftResults` accept a completed league checkpoint deliberately: callers cannot save a result while forgetting standings/stat consequences. `savePlayer` validates and commits a coherent active checkpoint. Revision checks reject stale writes from another open tab. Errors preserve the previous committed state; the existing Save failed notice tells the player to keep the tab open.

The existing save queue and gameplay save boundaries are unchanged. There are no possession writes. Saved historical rows are upserted, never deleted because an in-memory collection shrank or a season rolled over. Explicitly deleting a save slot removes that league and its recovery copy only.

## Active loading and queries

Opening a career retrieves its current-season games/boxes, live players, current/prior team-season records, prior draft, small award-comparison baseline and lightweight Hall identities. It does not retrieve old games, all historical player-stat rows, old detailed team-season snapshots or full Hall careers. Current-season game history remains resident because existing fatigue, standings, statistics and gameplay functions depend on it.

Historical team-season detail loads one selected team/year. The player-stat season menu reads distinct indexed years without fetching all stat rows, selected seasons load on demand, and statistic tables render 100 rows per page. Player-profile Hall history fetches one player. Hall browsing uses 50-career pages; news loads the most recent 500 records for compatibility with its existing UI while older news remains queryable/exportable. Generic queries default to 50 records, transactions to 100, and enforce a maximum of 500 with continuation keys. Queries are scoped by league. No database requests occur inside render loops.

Some legacy aggregate views (career statistics) still hydrate their relevant stat collection on demand, and rollover hydrates the historical dependencies required by existing award/Hall calculations. This preserves the simulation's existing semantics. It is a remaining memory concern, not a claim that every legacy calculation is now fully incremental. Compact season summary archives also remain in the active compatibility model. The existing 100-champion active-view cap is respected without deleting older database champion records.

## Migration and backup

On database upgrade, original v1 records stay in `careers`. Each unmarked slot is validated, decomposed, read back in full, and compared canonically with the source. Only successful verification writes its migration marker. A failure leaves the source intact and surfaces an error. The legacy localStorage save is likewise retained as a recovery copy; normal saves go to normalized IndexedDB. Small theme/title/sidebar/preferences remain in localStorage.

Existing format-1 JSON imports still work. Export now produces portable `hoops-dynasty-database`, formatVersion 2, containing active state plus all archived games, boxes and archive rows—including records older than the currently loaded UI. Export rejects a revision change during collection to avoid a mixed-time backup. Version-2 import validates the active model, historical records, duplicate IDs, game references and box presence, then atomically installs a new independent slot. A failed import leaves no partial slot. The old arbitrary 25 MiB file-picker ceiling was removed.

Exports/imports currently assemble JSON in memory; streaming backup is the recommended next storage step. No cloud system was added.

## Storage monitoring and durability

Run `await storageDiagnostics()` in the developer console for `navigator.storage.estimate()`. Run `await storageDiagnostics({requestPersistent:true})` to request persistence. Initialization also makes a nonblocking request when supported. Granted, denied and unsupported results are represented explicitly; denial never prevents gameplay.

Actual Chromium measurement is recorded in `dev/indexeddb-browser-results.json`. Quota/usage are browser-origin-specific and are not promises about a player's device. Persistent storage was denied in this test environment; gameplay continued.

## Verification

- fake-indexeddb: creation, exact save/full reload, players, games and separate boxes, repeated same-day playoff games, historical season/career/champion/draft queries, pagination, independent leagues, stale-write transaction abort, rejected corruption, reopen, additive version upgrade, verified v1 migration with original retained, v2 backup/import, missing-box rejection without creating a slot, lazy-load validation, history retention across active rollover.
- Synthetic storage fixture: 25,000 historical stat rows; active load retrieves 250 baseline rows; a 100-row player career is queried in two 50-row pages. This is not a 100-season simulation.
- Real Chromium: new career, normal Advance Day, saved standings/box scores, reload with identical scores, roster/profile, schedule, standings, stats, franchise history, Hall, draft and dashboard navigation, full backup/import to another slot. Zero page errors.
- Existing regression: six seeded normal/headless games match in full basketball/state outcomes; box scores, standings, morale, injuries, finances and rivalries match. Failure rollback, cancellation and zero-DOM headless day pass. Direct aging cases and normal-save isolation pass.

Install development-only dependencies with `npm install --prefix dev`; run `npm --prefix dev run test:storage` and `npm --prefix dev run test:storage-browser`. The development fixtures do not touch a real user's career.

## Scope and remaining limits

No basketball, rating, tendency, development, aging, contract, draft, calendar, or playoff algorithms were changed. Hall rendering only received a paged data adapter. No historical pruning or simulation optimization was implemented. The earlier five-season integrity report is separate and predates this persistence change; no 50–100-season readiness claim is made.

Older games already discarded before migration cannot be reconstructed. Recovery copies temporarily use extra quota. Current-season checkpoints still write their loaded working set, and full legacy aggregate/rollover hydration and JSON backup can consume substantial memory. Browser eviction remains possible when persistence is denied; portable backups remain important. The next recommended storage task is streaming/versioned backup import-export with progress/cancellation; it has not been implemented here.
