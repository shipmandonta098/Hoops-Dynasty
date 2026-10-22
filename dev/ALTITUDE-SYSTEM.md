# Altitude gameplay implementation — 2026-10-17

## Implemented

One shared NBA/WNBA engine, no alternate simulation. `altitude.js` scopes the environment around `simulateAttributeGame` and restores it in `finally`. `rotations.js` applies extra stamina consumption and reduced bench recovery; existing `effectiveAttribute` then affects basketball performance. No altitude term enters shooting percentages, overall ratings, or win probability directly. Existing workload recovery already considers age, endurance, durability and conditioning; altitude does not introduce an age-only penalty or repeat the back-to-back travel penalty.

Default raw extra drain = max(0, destination minus acclimated elevation minus 1,500 ft) / 1,000 × .016, capped at .12, multiplied by configurable strength (0–2). Endurance, staff conditioning, current stamina, recent minutes and rehabilitation modify susceptibility, with final extra drain capped at .18. Recovery loses half that fractional amount. Thresholds, coefficients, city elevations and acclimatization speed are simulation estimates, not validated physiological measurements.

Home players have no altitude boost and no extra altitude cost. High-elevation visiting teams normally have little or no extra cost. Neutral/All-Star venues disable this effect. Unknown home/destination elevations disable extra cost rather than assume a real elevation. Injured players retain the existing eligibility rules.

Coaches use the existing fatigue rotation selection plus a conditioning-sensitive penalty for low-stamina players, scaled by rotation skill and reduced in clutch lineups. Positional availability, depth, planned minutes, foul trouble and workload caps still control substitutions. This implementation supports earlier substitutions/bench use; it does not add an automatic tempo/press tactic switch. Accumulation, not quarter-specific penalties, drives late-game effects.

Timeouts now restore two stamina points to both teams (capped by initial game energy), with altitude reducing recovery for affected visitors. Bench recovery remains in the existing minute-accrual calculation. No permanent ratings are changed.

## Travel and saves

Teams store up to 20 recent venue visits, with season, calendar day, elevation, city and away/home status. A short run of games at similar elevation models continued exposure; a gap over four days assumes a return home. First arrivals receive .25 days' estimated exposure; previous comparable stops can provide up to 3.75 days before the next game. Acclimatization approaches the destination over an estimated five-day time constant. Recent road stops, not just home city, determine the input. Rest/workload calculations remain separate.

This is an estimated itinerary, not a flight/hotel database. New arrivals via trades use their team's acclimatization rather than an individual residency record. Existing saves without visits start from their home elevation; completed games are not recomputed. Old-season visit records are ignored after rollover. Replaying a saved game never appends visits.

Game snapshots retain venue, source/quality, impact, acclimatization and itinerary assumptions. Team visits, optional arena city/elevation override and player game stamina pass save validators and normalized IndexedDB storage. Old box timelines remain compatible because stamina was appended to the stat-key array. Unknown old stamina displays —.

## Location and historical coverage

`altitude-data.js` provides approximate city elevations for modern NBA/WNBA locations, historical cities and selected expansion cities. Manual arena city/elevation overrides take priority. Arena matches require city and season, so keeping a franchise name after relocation cannot preserve its former elevation advantage. Editing the city clears venue-location/elevation overrides in the form. No franchise is automatically relocated by this feature.

Known high-elevation arena defaults are dated for explicitly named real teams: Denver Nuggets (1976 onward), Utah Jazz (1979–2005 and 2023 onward), Utah Starzz (1997–2002). Explicit custom arena names win. Remaining seasons use actual stored city/location with an explicitly labeled city estimate. The existing historical presets are financial/rules snapshots with fictional clubs: they do **not** supply full historical team/arena rosters. This feature does not manufacture those records.

**Remaining data work:** a comprehensive historical arena/relocation database, exact arena survey heights, temporary/alternate venues (including bubble seasons), and all arena sponsorship-name intervals. Generic city estimates must not be described as verified arena-floor elevations. Salt Lake City source elevations vary by location (Visit Utah gives 4,226 ft); 4,265 ft is the chosen approximate simulation value, not a surveyed Delta Center height. Arena name dates are better documented than floor elevations.

Sources retained in code:

- NBA, Denver altitude reporting: https://www.nba.com/news/is-impact-of-denvers-altitude-fact-or-fiction
- Nuggets media guide, historical venues: https://cdn.nba.com/teams/uploads/sites/1610612743/2024/01/DN_2324_MediaGuide.pdf
- Arena opening: https://www.pepsicenter.com/arena-information/about-ball-arena/
- Ball Arena renaming: https://www.ballarena.com/kse-ball-global-partnership/
- Delta Center dates: https://www.deltacenter.com/about-us/
- Jazz historical Salt Palace games: https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf
- Utah Starzz debut/relocation history: https://aces.wnba.com/aces-history-notable-dates-and-transactions
- City altitude context: https://www.visitutah.com/plan-your-trip/plan-your-ski-trip/high-altitude-tips
- Acclimatization background: https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html

CDC guidance supports gradual acclimatization as background; its high-altitude illness thresholds are not used as NBA thresholds or as evidence for our coefficients. No exact numerical NBA fatigue coefficient is claimed from these sources.

## UI

- League Settings: Altitude fatigue strength (default 1; 0 off).
- New Career team editor and Team management: arena city, elevation override in feet.
- Pregame regular-season/playoff matchups and live/final results: expandable venue/altitude information.
- Live/final box scores: STA% next to the existing statistics. It uses the actual rotation-runtime stamina.
- Commentary only when altitude adds fatigue and at least three on-court visitors have under 65% stamina; at most once per game.

## Verification

`node dev/test-altitude.cjs`: location/relocation/manual overrides, dated arena defaults, all supported historical year ranges resolving without invalid numbers, neutral venues, short-stay acclimatization, long-gap reset, conditioning, bounded loads, real stamina consumption, timeline/box rendering, invalid-data rejection, old-save defaults, actual 1997 and 2026 WNBA games.

`HD_TEST_NODE_MODULES=/tmp/hd-family-tests/node_modules node dev/test-altitude-storage.cjs`: real scheduled game day → normalized IndexedDB → career validation, preserving game environments, itineraries, stamina, manual elevation and settings.

Existing regressions passed: `dev/setup-logo-regression.cjs`, `dev/test-wnba-season.cjs` (1997–1998 full season/playoffs/draft/free agency), `dev/test-family-storage.cjs` (NBA season/rollover and normalized storage).

`node dev/balance-altitude.cjs`: 1,000 real-engine games, 100 paired seeds per scenario, equal rosters/coaches, identical rest, no crowd advantage, reset state for each run. Results in `dev/altitude-balance-results.json`. At default strength:

| Scenario | Raw extra drain | Home win % off/on | Home margin off/on |
|---|---:|---:|---:|
| Denver vs Miami | 5.63% | 57 / 58 | 2.28 / 2.63 |
| Salt Lake City vs Miami | 4.08% | 57 / 54 | 2.28 / 2.06 |
| Denver vs Salt Lake City | 0% | 57 / 57 | 2.28 / 2.28 |
| Miami vs New York | 0% | 57 / 57 | 2.28 / 2.28 |
| Denver vs Miami after modeled four-day stay | 1.21% | 57 / 55 | 2.28 / 1.22 |

These small samples do not establish a statistically significant home-win improvement. They demonstrate bounded gameplay impact and no excessive home-win boost in the tested fixture. Same-seed low-elevation and Denver/Utah outcomes were exactly unchanged. Acclimatization reduced the actual fatigue input; random outcome differences need not be monotonic. Controlled stamina tests verify the direction independently of scoring randomness.

Browser visual QA was unavailable; no visual-device verification is claimed.

## Production files changed

New: `dist/altitude-data.js`, `dist/altitude.js`.
Integrated: `dist/attributes.js`, `dist/rotations.js`, `dist/careers.js`, `dist/index.html`, `dist/league-settings.js`, `dist/setup.js`, `dist/team-management.js`, `dist/matchup.js`, `dist/playoff-series.js`, `dist/schedule-events.js`, `dist/game.js`.
