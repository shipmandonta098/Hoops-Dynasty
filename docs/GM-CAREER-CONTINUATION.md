# GM career continuation

## Implemented behavior

Firing closes a tenure instead of terminating the career. The dismissal screen retains the dark presentation, reports the actual franchise record at dismissal and the GM's tenure record, and offers **Continue GM Career** and **Save and Exit**. Ordinary simulation batches stop at dismissal until continuation is acknowledged.

**GM Career** opens the permanent managerial history. An unemployed GM sees **Select Team · GM opportunities**, can inspect rosters, apply for vacancies, accept or decline offers, view league information, and advance the existing season. The unemployed offseason action runs the existing draft, free-agency and season-transition functions. Every franchise becomes AI-managed; human roster, finance and coaching mutations remain blocked, including stale dialogs.

Accepting a job changes the controlled franchise ID. It never reindexes teams or transfers players, contracts, picks, statistics, branding or business ledgers. The new team's owner supplies fresh patience and objectives, with a late-season evaluation grace period. Prior private proposals expire, pending human bids are removed, and outstanding offer sheets are handled by the existing AI decision rules. Team strategy and notes are separated by franchise. GM decision history follows the manager, but old decisions are not graded using the new team's results.

The existing GM Office links to career history. Franchise championship totals are separate from GM championship totals. Existing city photographs and branding assets are unchanged.

## Root cause and architecture

The old code treated team ID `0` as the permanent human franchise in dozens of systems. `ownerCanManage()` also gated simulation advancement; zero ownership patience therefore blocked the career itself.

- `dist/gm-identity.js`: `controlledTeamId(data)` and `gmCanAdvance()` separate identity, management authority and permission to continue simulation.
- `dist/gm-career.js`: identity migration/validation, tenure accounting, dismissal, hiring market, reputation, career UI, transaction guards, Hall of Fame integration and unemployed offseason orchestration.
- Existing modules now resolve human ownership dynamically. Literal zero indices used for game sides, arrays, counters and initial setup remain unchanged.
- Existing All-Star ballots retain the franchise ID at voting time, so changing jobs does not invalidate an old ballot.

## Save model

The existing league save gains `gmCareer.version = 1`; no second career database or separate simulation mode is introduced.

Stored fields include a stable GM ID, name, starting year, employment status, current/last franchise IDs, tenures, season records, dismissal snapshots, reputation, management baselines, applications/offers, market evaluation epoch, and franchise workspace preferences. Each tenure stores stable franchise ID/key, displayed name at employment, start/end season and day, departure reason, appointment term, regular/playoff W–L, playoff appearances, titles, conference/division titles and executive awards.

Records are updated from actual committed game results and season milestones. Closed tenures stop accumulating statistics. Repeated saves and milestone checks do not duplicate accomplishments. Existing transaction rollback snapshots include the GM state. Hiring explicitly rolls back the league and UI context if saving fails.

The normalized repository keeps GM state in the league core. Existing saves migrate only recoverable records from franchise archives, prior GM Hall records, current records and game history. Legacy championship counters without identifiable seasons remain explicitly labeled as unallocated legacy titles. Missing older dates/playoff data are disclosed; historical achievements are not fabricated. Existing players, contracts, photos and statistical records are not rewritten.

## Hiring and reputation rules

These are configurable-in-code simulation policies, not claims about real NBA/WNBA executive hiring:

- Market reviews occur every 14 regular-season calendar days and at season rollover.
- Vacancies can result from a fired AI owner state, sustained poor results, or deterministic periodic offseason/front-office turnover. Expansion teams must be active.
- A former employer cannot immediately rehire the fired/resigned GM during the same season.
- Offers last 28 league-day units; season rollover expires old offers. Filled, rejected, declined and accepted offers remain recorded.
- Required reputation uses roster strength, current winning percentage and owner expectations. Applying produces an actual acceptance/rejection decision; rejection leaves the GM unemployed.
- Reputation primarily uses lifetime and recent W–L, playoff appearances, championships, executive awards and capped dismissal penalties. Modest management adjustments use tracked young-player development, roster-strength change, spending-ceiling compliance and owner satisfaction. These are contextual estimates, not causal attribution of every player improvement to a GM.
- Offers specify a two- or three-season appointment, objectives and starting patience. Appointments renew when ownership retains the GM. Executive salaries and personal finances are not modeled.
- New jobs use the franchise's own ownership type and remaining schedule. Inherited financial results are excluded from the new GM's profit objective; late hires receive a fresh full evaluation the following season.

## Verification

Automated tests executed:

| Test | Coverage / result |
|---|---|
| `dev/test-gm-career.cjs` | Firing, real daily games while unemployed, disabled management actions, vacancies, applications/rejection/hiring, unchanged assets, new-team dashboard/finances, repeat firing, save/load and legacy migration |
| `dev/test-gm-edges.cjs` | Hiring save failure rollback, coach ownership, idempotent milestones, multi-franchise championship attribution, separate franchise championships, normalized storage core retention |
| `dev/test-gm-views.cjs` | Rendering 21 employed and 13 unemployed views, team-1 trade partner regression, roster/schedule context, former-roster isolation, dismissal/continuation gates |
| `dev/test-gm-historical.cjs` | NBA 1946/1984/1997/2026 and WNBA 1997/2020/2026: firing, hiring, actual simulated day, preserved financial rules/contracts, save validation and WNBA cap compliance |
| `dev/test-gm-seasons.cjs` | Two complete six-team, ten-game-per-team seasons for each league, including playoffs, AI draft/free agency, rollover, save/load while unemployed and rehiring by the original franchise; 132 total games |
| `dev/test-gm-full-season.cjs` | NBA: 30 teams, 82 games per team, 1,230 regular games + 86 playoff games. WNBA financial environment: 12-team fictional 44-game schedule, 264 regular games + 10 playoff games. Both completed AI offseason, advanced one year and passed save/roster validation while unemployed |
| `dev/test-headless.cjs` | Existing six-game seeded normal/headless parity, game-failure rollback, cancellation and zero-DOM headless advancement |
| `dev/test-dissatisfaction-transactions.cjs` | Existing extension, morale-meeting and contract-intention regression |

Full-size run output is retained in `dev/gm-full-season-results.json`. Milestone attribution tests deliberately use controlled scenario fixtures; they are not presented as naturally occurring championship outcomes.

## Verification limits / remaining model limits

- No browser-control capability was available for visual/mobile QA. Production HTML rendering and syntax were checked; actual browser interaction should still receive a manual smoke test.
- Save verification covers JSON validation, normalized storage splitting and transaction rollback. This run did not exercise an actual browser IndexedDB session.
- Hiring is a lightweight simulated vacancy/reputation model. It does not model real executive job vacancies, executive salaries, interview dialogue or negotiated compensation.
- Older saves can lack exact employment starting dates and older playoff statistics; the UI identifies incomplete legacy history.
- Franchise closure and cross-league employment are not introduced. Hiring stays within the current league; relocations and expansion retain the existing stable franchise identities.

## Files changed

- `dev/gm-full-season-results.json`
- `dev/test-gm-career.cjs`
- `dev/test-gm-edges.cjs`
- `dev/test-gm-full-season.cjs`
- `dev/test-gm-historical.cjs`
- `dev/test-gm-seasons.cjs`
- `dev/test-gm-views.cjs`
- `dist/all-star-actions.js`
- `dist/all-star-voting.js`
- `dist/attendance.js`
- `dist/attributes.js`
- `dist/back-to-back.js`
- `dist/careers.js`
- `dist/coach-contracts.js`
- `dist/dashboard.css`
- `dist/dashboard.js`
- `dist/decision-log.js`
- `dist/draft.js`
- `dist/executive-award.js`
- `dist/fa-sorting.js`
- `dist/finances.js`
- `dist/free-agency.js`
- `dist/game.js`
- `dist/gm-career.js`
- `dist/gm-identity.js`
- `dist/gm-inbox.js`
- `dist/hall-of-fame.js`
- `dist/index.html`
- `dist/matchup.js`
- `dist/morale-effects.js`
- `dist/morale.js`
- `dist/news-feed.js`
- `dist/owners.js`
- `dist/pick-and-roll.js`
- `dist/player-dissatisfaction.js`
- `dist/playoff-actions.js`
- `dist/playoff-field.js`
- `dist/playoff-series.js`
- `dist/playoffs.js`
- `dist/power-rankings.js`
- `dist/profiles.js`
- `dist/rest-patterns.js`
- `dist/rivalries.js`
- `dist/roster-management.js`
- `dist/rotations.js`
- `dist/schedule-ui.js`
- `dist/season-awards.js`
- `dist/standings.js`
- `dist/tendencies.js`
- `dist/trade-block.js`
- `dist/trade-center.js`
- `dist/trade-logic.js`
- `dist/watch-list.js`
- `dist/wnba-contracts.js`
- `dist/wnba-gameplay.js`
- `docs/GM-CAREER-CONTINUATION.md`
