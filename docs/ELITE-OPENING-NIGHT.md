# Elite Opening Night and Day 3 debuts

This update supersedes the format/soft-deadline policy in OPENING-WEEK-AUDIT.md. It retains that audit as a historical record of the earlier fix.

## Behavior

New calendars contain two or three featured games with distinct teams. The default/automatic format is two games for both leagues and historical years. The explicit triple-header setting uses three. Older solo/standard selections are accepted for loading, but their next generated calendar uses two games; the settings labels disclose this. Existing saved calendars and opening-night text remain unchanged on load.

The opening-night selector reads the immediately previous season's actual team archives and honors. Missing historical results are not invented. First-year historical and fictional careers without recorded results use current roster estimates. Current city, market size, and user-controlled franchise do not contribute to selection scores.

The existing date-placement engine moves existing directed fixtures. It then repairs debuts, prefers Day 2 over Day 3, and smooths the opening week's workload without moving a debut later. It preserves opponents, home/away counts, game totals, the finale, NBA rest limits and protected All-Star dates. All accepted calendars must have every team debut by Day 3. Up to 16 high-ranked alternate slates are attempted when placement conflicts occur.

If a requested calendar cannot satisfy the constraints, generation reports an error instead of retaining an invalid opener. Preseason settings already restore state on errors. A new rollover guard also restores pre-transition state for opening-night constraint errors. This is a bounded search, so a rejection does not constitute mathematical proof that no globally different solution exists.

## Transparent selection score

Each team's merit score is:

- Current top-eight roster average: `2 × max(0, average OVR − 50)`.
- Prior regular-season win percentage: `30 × win percentage`, when recorded.
- Prior title: +40; otherwise Finals runner-up +24; otherwise an explicitly recorded Conference Final appearance +12.
- Best current player: `0.5 × max(0, best OVR − 80)`.
- Reigning MVP currently on roster: +8. Archived player ID follows an MVP who changes teams; names plus archived team provide a limited fallback when IDs are unavailable.
- Newly acquired players rated 85+: +4 each, capped at +8, only when a prior roster exists for comparison. This is a high-rated acquisition signal, not a claim to measure complete offseason net improvement.

Matchup score is the sum of both team scores, plus 25% of the weaker team's score, plus one storyline bonus:

| Category | Bonus | Required evidence |
|---|---:|---|
| Championship Rematch | 65 | Recorded preceding champion and Finals opponent/runner-up |
| Conference Finals Rematch | 30 | Explicit preceding `Conference final` game between the teams |
| Defending Champion Showcase | 45 | Recorded preceding champion |
| Elite Rivalry | 16 | Both competitive; stored rivalry heat at least 50 and at least three recorded events |
| Contender Showdown | 12 | Both competitive by current roster ranking and prior record |
| Star Power Showcase | 5 | Both feature a player rated at least 85 |
| Opening Night Showcase | 0 | Roster-merit fallback; no invented accomplishment |

“Competitive” means a top-third current roster (minimum four teams), plus a non-losing recorded prior season, no available prior record, or a current top-eight average of at least 82. This allows a substantially improved former loser to become a contender, while reducing the priority of weakened former contenders. A key-based, season-dependent tie breaker avoids team-index/user-selection bias. Selection greedily takes the highest-ranked non-overlapping eligible fixtures; alternate slates are tried only for calendar feasibility.

The champion/rematch is placed in the Prime slot when selected. Descriptions show actual roster averages, available previous records, supported star/acquisition signals and total selection score. The existing dark panel, slots and date display are reused.

## Compatibility and explicit constraints

- No verified historical previous-season database was added. The game uses its real simulated archives where available; otherwise it labels the roster projection as such.
- An exclusive two-game opener needs at least six teams; an exclusive three-game opener needs at least eight. Four-team custom leagues cannot satisfy “two games but not the entire league” and are rejected for new calendars. Six-team leagues must use two games. Existing saves still load, but an incompatible next-season configuration must be changed before proceeding.
- A fully packed short round-robin calendar may have no room to move any opening-night games while preserving its dates and total games. It is rejected rather than silently extended. Custom dates can provide the necessary room.
- The legacy editable first-game preference remains readable for compatibility, but new calendars always enforce Day 3, regardless of its value.
- Conference-final labels require explicit archived stage evidence. Ambiguous older semifinal records do not receive an invented Conference Finals Rematch label.
- No arena-availability or flight-distance database was introduced. Existing travel audit and rest restrictions remain in effect.
- Changes do not rewrite current saved schedules. They apply on new career creation, preseason regeneration and season rollover.

## Files

Production: `dist/opening-night.js`, `dist/league-settings.js`, `dist/index.html` (cache refresh).

Tests/report: `dev/audit-opening-week.cjs`, `dev/test-elite-opening.cjs`, `dev/test-opening-week.cjs` (current test entry point), `dev/test-gm-seasons.cjs` (valid 30-day custom-calendar fixture), `dev/opening-week-elite.json.gz`, this report.

The city photographs and other dashboard assets were not modified.

## Regression checks

`node dev/test-elite-opening.cjs` checks quality over weak geography; changed champions/finalists; explicit Conference Final rematches; competitive rivalries; missing-history behavior; user-team and index-order independence; exact two/three-game counts; production NBA validity; full career save validation; unchanged legacy solo/triple/standard calendars; production next-calendar generation; infeasible-calendar rejection; rollback on failed rollover; MVP transfer by archived ID; historical WNBA financial presets for 1997, 2003 and 2026 with both formats and actual save validation.

`node dev/test-gm-seasons.cjs` exercises two NBA and two WNBA career seasons, actual games/playoffs, AI draft/free agency, rollover, save/load and debut assertions. The six-team integration fixture uses ten games per team and a 30-day season so the exclusive opener has room. This is integration coverage, not a claim of four full-length modern seasons.

`node dev/audit-opening-week.cjs elite` generates complete schedules using independently offset production RNG seeds. Each compatible two-/three-game variant receives 100 seeds. The six-team configuration uses only two games. Full per-team fixture statistics and diagnostics are compressed in `dev/opening-week-elite.json.gz` (gzip JSON).

Each batch calendar checks the production NBA/custom validator, exact directed-fixture multiset preservation, protected breaks, JSON schedule round-trip, opening-night count and every debut by Day 3. Repeated season meetings between the same opponents are legitimate fixtures; duplicate same-day assignments are not.

Browser automation was unavailable; production markup, logic and save paths were tested, but visual layout was not browser-verified.

## Final batch results

Completed 2,300 complete calendars: 100 seeds for each of 23 compatible configuration/format combinations.

| Metric | NBA | WNBA |
|---|---:|---:|
| Schedules | 1200 | 1100 |
| Team observations | 27400 | 13400 |
| Opening-night participation | 21.90% | 40.30% |
| Debuted by Day 2 | 94.73% | 99.51% |
| Debuted by Day 3 | 100.00% | 100.00% |
| Debuted Day 4+ | 0.00% | 0.00% |
| Average first-game day | 1.834 | 1.602 |
| Latest first-game day | 3 | 3 |
| Invalid calendars | 0 | 0 |

| Test configuration | Featured games | Complete calendars | Latest debut | Invalid |
|---|---:|---:|---:|---:|
| NBA modern | 2 | 100 | 3 | 0 |
| NBA modern | 3 | 100 | 3 | 0 |
| NBA historical 1984 | 2 | 100 | 3 | 0 |
| NBA historical 1984 | 3 | 100 | 3 | 0 |
| NBA historical 1946 | 2 | 100 | 3 | 0 |
| NBA historical 1946 | 3 | 100 | 3 | 0 |
| NBA expansion | 2 | 100 | 3 | 0 |
| NBA expansion | 3 | 100 | 3 | 0 |
| NBA relocated | 2 | 100 | 3 | 0 |
| NBA relocated | 3 | 100 | 3 | 0 |
| NBA custom | 2 | 100 | 3 | 0 |
| NBA custom | 3 | 100 | 3 | 0 |
| WNBA modern | 2 | 100 | 3 | 0 |
| WNBA modern | 3 | 100 | 3 | 0 |
| WNBA historical 1997 | 2 | 100 | 3 | 0 |
| WNBA historical 1997 | 3 | 100 | 2 | 0 |
| WNBA historical 2003 | 2 | 100 | 3 | 0 |
| WNBA historical 2003 | 3 | 100 | 3 | 0 |
| WNBA expansion | 2 | 100 | 3 | 0 |
| WNBA expansion | 3 | 100 | 3 | 0 |
| WNBA relocated | 2 | 100 | 3 | 0 |
| WNBA relocated | 3 | 100 | 3 | 0 |
| WNBA custom | 2 | 100 | 2 | 0 |

A strict majority of non-featured teams debuted on Day 2 in 2,300 of 2,300 calendars. All debuts were within Day 3 in every calendar.

The configurations are fictional test leagues using historical years and explicit game counts, not verified reproductions of real historical franchises. They cover 30-team 82-game NBA schedules; historical-year, expansion and custom NBA calendars (11–32 teams); and WNBA calendars with 6–16 teams and 20–44 games. The 1984 test uses 24 fictional teams. Odd team counts are covered by the 11-team historical-year NBA case. The six-team WNBA custom case supports only the two-game exclusive format.

All selection, history, save/load and rejected-rollover tests passed. Four six-team career integration seasons also completed (132 actual games including playoffs), with Day 3 assertions after each rollover.
