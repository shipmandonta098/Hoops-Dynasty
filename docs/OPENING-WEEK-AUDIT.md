# Opening-week scheduling audit and implementation

Implemented against source commit b0a57181d5bed3dcd295152b5976deead64a3837. No existing saved calendar is repaired on load. Changes affect newly generated calendars (new career, preseason regeneration, or next season).

## Verified root cause

The base NBA date optimizer balances daily game counts without a debut-date constraint. The rest-pattern optimizer measures gaps between games, excluding the initial idle interval. After both optimizers, openingNightPlace in dist/opening-night.js removes all non-featured day-1 fixtures and randomly searches every remaining date to reinsert them. This retains correct opponents and season totals but can postpone an entire franchise’s start. Featured games are moved from the completed schedule, not added as extra fixtures. No user-team preference was found in this selection step.

The geography classifier treated matching RIVALRY_REGIONS values (state-level regions) as Cross-Town Derby. Thus Sacramento/Los Angeles and Orlando/Miami incorrectly received the same label as Brooklyn/New York.

## Production changes

- dist/opening-night.js: bounded, deterministic post-placement repair of late debuts; first-week workload smoothing against actual season cadence; protected spotlight, finale and All-Star dates; no new games or reversed home/away pairs. Preserves NBA rest limits and does not introduce additional three-consecutive-day sequences in custom calendars. Uses every team equally, without controlledTeamId in scheduling decisions.
- dist/opening-night.js: Cross-Town, Regional, Divisional, Conference, Historic and Showcase labels, alongside existing evidence-based Finals rematch, champion, trade, returning-star and rookie features. Brooklyn/New York are recognized as one metro; matching state regions alone yield Regional Rivalry.
- dist/league-settings.js: auto and double-header options plus configurable first-game target (day 1–7; default 3). Explicit saved solo/triple/standard choices remain unchanged.
- Auto policy is a simulation preference, NOT a historical assertion: NBA before 1980 keeps the normal generated slate; NBA 1980 onward uses two featured games; WNBA uses one for up to eight teams, otherwise two. Explicit formats override this policy. Existing champion-home preference remains a preference for generated fixtures, not a claim about a real historical opener.
- dist/settings.js: changing the first-game target in preseason regenerates the calendar through the existing settings workflow. In-progress season settings stay locked.
- Schedule banner: actual Your Season Opener and an expandable league-wide audit. It shows debut day, first-week games, home/away, longest rest, back-to-backs and city changes. Constrained debuts have explanations; no placeholder matchups.
- dist/index.html: cache keys updated for the three changed runtime scripts. No city photographs or dashboard assets changed.

## Before / after: controlled comparison

120 complete original calendars and the same 120 seeded configurations with the final repair. Explicit triple-header is held constant to isolate the date-allocation change. Each league has 60 calendars. Percentages weight team observations, not configurations equally. Back-to-backs count a team playing on successive days within days 1–7. “Day 4+” means at least three initial rest days.

| Metric | NBA before | NBA after | WNBA before | WNBA after |
|---|---:|---:|---:|---:|
| Opening night | 26.28% | 26.28% | 51.43% | 51.43% |
| By end of day 2 | 43.36% | 56.93% | 59.00% | 83.57% |
| By end of day 3 | 87.74% | 100.00% | 68.57% | 100.00% |
| Debut day 4+ | 12.26% | 0.00% | 31.43% | 0.00% |
| Average debut day | 2.542 | 2.168 | 2.584 | 1.650 |
| Latest debut day | 16 | 3 | 14 | 3 |
| Opening-week back-to-backs per team | 0.464 | 0.445 | 0.243 | 0.144 |
| Invalid complete calendars | 0 | 0 | 0 | 0 |

An additional 120 complete calendars used the new auto format: all teams debuted by day 3, zero invalid calendars. NBA opening-night share was 18.25%, by day 2 52.34%; WNBA 28.57% and 73.57% respectively.

## Configuration coverage

Ten independent deterministic seed offsets per configuration. Seeds are added to production scheduleRandom calls, so tests exercise different fixture layouts while holding season/year/rules constant. These are generated test leagues, not reproductions of actual historical franchise lists or real schedules. Historical-year cases test the engine at those years with explicit team counts and game totals; the 1984 test has 24 fictional teams.

| Configuration | Teams | Games/team | First-week range before | First-week range after | Longest week rest after |
|---|---:|---:|---:|---:|---:|
| NBA modern | 30 | 82 | 1–5 | 2–5 | 4 |
| NBA historical 1984 | 24 | 82 | 2–5 | 3–5 | 3 |
| NBA historical 1946 | 11 | 60 | 0–4 | 2–4 | 5 |
| NBA expansion | 32 | 82 | 2–4 | 3–4 | 3 |
| NBA relocated | 30 | 82 | 1–5 | 2–5 | 4 |
| NBA custom | 10 | 40 | 0–5 | 1–3 | 6 |
| WNBA modern | 14 | 44 | 1–5 | 2–4 | 4 |
| WNBA historical 1997 | 8 | 28 | 0–4 | 1–4 | 6 |
| WNBA historical 2003 | 14 | 34 | 0–4 | 1–3 | 6 |
| WNBA expansion | 16 | 44 | 0–5 | 2–4 | 4 |
| WNBA relocated | 12 | 40 | 0–5 | 2–4 | 5 |
| WNBA custom | 6 | 20 | 1–4 | 1–1 | 6 |

## Verification

- dev/audit-opening-week.cjs before / after / auto: 360 complete calendars in the final retained results. Original runtime opening module preserved in dev/fixtures/opening-night-b0a5718.js for reproduction. Raw per-team dates, home/away totals, week counts, rest and diagnostics are in dev/opening-week-{before,after,auto}.json.
- Every batch calendar checked with the production NBA/custom validator, exact directed-fixture multiset comparison, protected-break check and JSON calendar round-trip. No missing/extra games, opponent changes, home/away changes or double bookings.
- dev/test-opening-week.cjs: actual career creation and full save validation for all five formats; selected GM not featured on opening night; real banner content; new calendar through production regeneration; WNBA year cases; recorded champion priority; geography labels; impossible spotlight fallback; protected opening break; legacy setting compatibility.
- dev/test-custom-schedule.cjs: passed exact historical-year/custom matchup allocation, 20 tight-calendar cases and 2,400 independent factor-solver oracle checks.
- dev/test-gm-seasons.cjs: actual game simulation, playoffs, draft, free agency, rollover and save/load for two NBA and two WNBA test seasons (six teams, ten games per team; 132 games total), with added first-game audit assertions after every rollover. These smaller integration seasons supplement the complete-length schedule-generation batches; they are not presented as full NBA/WNBA season simulations.
- JavaScript syntax checks and git diff whitespace check passed.

## Compatibility and remaining limits

The current project generates historical calendars; no verified real-world fixture import/database was found. This patch does not add one or claim historically exact matchups/dates. The auto-era defaults are explicitly simulation choices. Calendar generation continues to respect configured game counts, matchup categories, dates and breaks.

The repair is bounded local search, not a proof of global feasibility. Day 3 is a strong preference, not an unconditional promise for impossible or unusually constrained user calendars. The first-week audit explains unresolved debut targets. Workload smoothing remains soft: some tested NBA weeks still contain five games, and sparse custom/WNBA calendars can retain six-day rest streaks after an early opener. These are visible in the audit, rather than hidden by a claimed universal balance guarantee.

Travel auditing records consecutive scheduled venue cities. No geographic distance, flight-time, arena-availability or broadcast-time conflict database exists in this scheduler, and no such constraints were fabricated. Early/Prime/Late are presentation slots. Schedule milestones retain their existing calendar-based derivation.

Loading an existing save never regenerates its calendar. Users can keep it unchanged, regenerate through preseason Schedule settings before any regular-season game, or receive the corrected generator next season. New fields are a league-setting scalar; the audit is reconstructed from actual fixtures, so there is no competing saved schedule.

Browser automation was unavailable in this environment. Markup, data, save validation and production simulation paths were tested; desktop/mobile visual appearance was not browser-verified. Existing CSS/layout components were reused.
