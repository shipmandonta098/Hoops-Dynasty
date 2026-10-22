# League settings

The Settings tab now contains 14 collapsible groups. Save settings applies validated values to the current career. Legacy saves receive defaults that preserve the prior rule set.

| Group | Controls |
| --- | --- |
| Schedule | Games per team, division games, other conference games, recurring start/end dates, default view and date range; standard presets remain above the groups |
| Standings | Conference or division grouping |
| Playoffs | 4/8/16 bracket slots; best-of-1/3/5/7 series; first-round byes; optional conference splitting (enabled by default) |
| Players | Offseason development and decline multiplier; zero freezes ratings while age advances |
| Teams | Home-court shot bonus |
| Draft | Weighted/equal lottery or reverse standings; future class overall/potential adjustment |
| Finances | Luxury tax and operating-cost multipliers |
| All Star | Enable or disable showcases, retaining scheduled rest days |
| Inflation | Annual salary-cap increase, applied once on successful season rollover |
| Contracts | Maximum offseason free-agent term and new salary-demand multiplier |
| Rookie Contracts | Contract duration and salary scale for future draft selections |
| Injuries | New injury frequency and duration multipliers |
| Game Simulation | Default Courtside playback speed, primary shot conversion and shooting-foul multipliers |
| Tendencies | Passing, driving, three-point, isolation and pick-and-roll frequency |

## Persistence and locks

`state.leagueSettings` stores career-specific values. Validation rejects invalid types, out-of-range values and unknown keys. Missing settings in older saves inherit defaults. Failed saves restore the prior state.

Playoff structure, showcase participation and season financial rules lock after the first regular-season game. Lottery settings lock after the order is drawn; class strength locks once prospects exist; rookie terms lock after the first pick. Offseason free-agent settings lock while that year's market exists. The form shows each lock and its reason.

Existing contracts and historical game results remain snapshots. Salary inflation does not alter signed contracts or ticket prices. Primary-shot controls do not change free throws or follow-up putbacks. Contract settings affect offseason free agency; extensions retain their existing rules.

## Verification

Run `node test-league-settings.cjs`, `node test-settings.cjs`, `node test-attendance.cjs`, and `node test-pick-and-roll.cjs` from the repository root.

The new integration check covers all 14 groups, legacy save migration and round trips, invalid values, form-handler validation, playoff field selection, rule locks, new contract terms, finance and injury multipliers, disabled pick-and-roll selection, a simulated season, rookie salaries, frozen rating development and one-time annual cap inflation.

## Custom seasons and series

Division games and conference games are distinct per-team totals. The conference count excludes division opponents; the remainder is interconference. Changing a count/date or selecting Custom rebuilds the unplayed calendar. The generator enforces exact totals, balances home/away to within one game and prevents two games for the same team on a day. Impossible alignment/count/date combinations are rejected with an explanation. Custom calendars do not guarantee the standard NBA preset's rest limits. Start/end month and day repeat each season; an end month/day earlier than the start falls in the following year. Existing calendars stay intact until edited.

A bracket has 4, 8 or 16 slots. Each first-round bye removes one qualifying team: a 16-slot bracket with four byes has 12 entrants. Highest seeds receive byes. With conference splitting enabled, exactly two conferences with enough qualifying teams receive separate sides, with equal bye counts per side; otherwise seeds are league-wide. Odd bye counts are rejected when conference splitting would apply.

Series end when a team reaches the majority of wins. Home order is H-A-H (best of 3), H-H-A-A-H (best of 5), or H-H-A-A-H-A-H (best of 7), from the higher seed's perspective. Each actual game retains its own box score, Courtside playback and revenue; byes create none. Seed snapshots and recorded results preserve progress across saves. Legacy postseason results retain single-elimination interpretation.

`node test-custom-season.cjs` checks quotas, date ranges, home/away balance, invalid combinations, failed-save rollback, season rollover, all supported series lengths, byes, seeding, conference fallback, reload and title clinching.

## New career setup

New Career has separate Career & team and League settings pages. The second page reuses all 14 rule groups with no active-season locks, plus player gender, schedule preset, salary cap and appearance. Navigation preserves the draft without changing the active career. Full/settings presets include the complete league rule set, and legacy presets inherit defaults. Starting a career validates the configuration, builds its calendar and saves the selected rules with the new career.

Run `node test-new-career-settings.cjs` for setup navigation, all rule controls, draft isolation, custom schedule creation, team selection, preset compatibility and career persistence.

## Standings tiebreakers

Standings includes its own collapsible tiebreaker form; the same six controls appear in League Settings and New Career. Assign distinct priorities 1–6, or 0 to disable a criterion. Default: head-to-head, division winner, division record, conference record, point differential, then the fixed coin-toss fallback. Point ratio is available but disabled by default. Rules lock with season rules after the first regular-season game.

Rankings first compare winning percentage and wins. Tied groups then apply the configured criteria. Head-to-head is the percentage against the other tied teams. Division/conference records apply only to teams sharing that grouping. Statistical criteria are skipped when the tied teams lack complete regular-season histories or a necessary sample. Subgroups restart the hierarchy after a criterion separates teams. Division winners are resolved without recursively using division-winner status. The final seeded coin toss depends on season and stable team identity, so reloads do not change it.

Conference tables and split playoff fields rank within their conference. Saved playoff seeds remain snapshots. `node test-tiebreakers.cjs` verifies all criteria, multi-team ordering, stable fallback, migration, rule locks, failed-save rollback and new-career/preset inclusion.

### Roster and draft controls

Teams includes minimum (14) and maximum (15) roster sizes, configurable from 5–30. New careers generate the minimum roster; transactions, draft signings, free agency, and expansion respect the limits. Legacy careers retain the prior minimum of 8 unless changed; existing players are never automatically removed or added.

Draft includes weighted/equal/custom lottery, reverse standings, random first-round order, and snake draft types. Lottery selections default to 4 (0–36). Custom comma-separated weights follow worst-to-best eligible record and normalize on each draw; supply one per eligible team and enough positive weights for the drawn slots. Non-lottery selections follow reverse standings. Expansion pick guarantees still apply.

Tradeable pick seasons default to 5 including the current draft (0–10; zero disables pick trading). Existing traded ownership is preserved. Draft rounds default to 2 (1–5), and prospect ages default to 19–22 (16–30). Set both ages equally for a fixed-age class. Generated classes preserve their rounds, pool, and ages; the controls lock for that class. Legacy classes remain two rounds. Removing rounds with already traded future picks is rejected. Rookie contract settings apply to all rounds; full rosters retain unsigned rights.

Validation: `node test-draft-roster-settings.cjs` exercises defaults, legacy migration, six draft types, five rounds, ages, snake order, save/reload, lottery weights, and the pick-trading horizon. Existing New Career, league settings, tiebreaker, and custom-season suites pass.

### Finance and All-Star settings

The existing salary cap input is now inside Finances on both Settings and New Career. Added minimum payroll (default $0M/off), luxury tax threshold (default $165M; legacy careers migrate at 110% of their cap), luxury tax enabled, base rate (1.5 dollars per excess dollar), cap type (soft by default), basketball operations budgets enabled, and trade salary matching (110%, with the existing $0.1M allowance; 0 disables matching).

Hard caps prohibit new payroll above the cap. Soft caps retain offseason exceptions and the 130% ceiling. No-cap leagues remove team payroll ceilings and salary matching while retaining individual contract limits based on the reference cap. Rookie selections exceeding the payroll ceiling remain unsigned rights. Minimum payroll shortfalls post once at season settlement. Inflation now scales the cap, minimum payroll, and tax threshold. Budget disabling pauses category expenses and funding bonuses/penalties, preserving the saved budgets; other finances continue.

All Star includes automatic/custom game scheduling, custom season progress (1–100%), 5–30 players per team (12 default), conference / automatic captains snake draft / mixed assignments, dunk contest enabled with 4 participants, and three-point contest enabled with 8 participants. Contest counts support 2–36 and clamp to the player pool. Conference selection falls back to mixed teams when two complete conference squads cannot be formed. Custom scheduling moves exhibition dates without rebuilding regular-season games or moving the trade deadline. Results are deterministic, stored once, list participants and full rosters, and do not change player statistics or standings. Already recorded showcases remain unchanged.

Validated with `test-finance-allstar-settings.cjs`, `test-finances.cjs`, `test-new-career-settings.cjs`, `test-league-settings.cjs`, and `test-draft-roster-settings.cjs`.

### Inflation and contract limits

Inflation now has minimum (0%), maximum (10%), average (0%), and standard deviation (0 percentage points). A deterministic yearly normal draw is clamped to the chosen bounds; zero deviation uses the average. Negative inflation is supported down to -20%. Each new season applies inflation once to cap, payroll floor, tax threshold, minimum/maximum new contract salaries, and fixed No. 1 rookie salary, within supported monetary limits. A persisted year/rate marker prevents duplicate application after reloading. Signed contracts and ticket prices do not change.

Contracts now have minimum/maximum annual salary (default $1M/$52.5M) and minimum/maximum duration (default 1/4, configurable to 10 seasons). Legacy maximum salary migrates at 35% of the existing cap. Human/CPU free-agent offers, salary quotes, extensions, and New Career starting rosters use the limits. In-season terms include the current season; offseason terms start next season. Extensions choose total future seasons and cannot shorten existing contracts. Existing saved contracts are retained.

Rookie Contracts includes a salary-scale toggle, fixed/percentage basis for the No. 1 pick, No. 1 salary (default $6M), percentage of max contract (default 11.4%), number of final rounds on minimum contracts (default 1), and per-round contract lengths. Enter `4,2` for four seasons in round 1 and two thereafter; `0` uses the default rookie term (2). Rookie terms may be 1–10 and are independent of veteran term limits. With scaling enabled, salaries decline by 2.5% of the top-pick amount per overall selection, with a 25% floor, then apply the existing scale multiplier and contract salary limits. Minimum rounds and a disabled scale use the minimum contract salary. Unsigned rights retain the rookie agreement already assigned at selection.

Validation: `test-contract-inflation-settings.cjs` checks bounds, deterministic variation, idempotent save/reload, migration, monetary and term limits, six-year persisted offers, rookie salaries/terms, real draft selections and New Career generation. Existing league settings, New Career, draft/roster, and finance/All-Star checks also pass.

### Injuries and simulation dimensions

Injuries now has an enabled/disabled switch. Disabling prevents new game/training injuries while existing injuries continue to recover.

Game Simulation adds foul limit (6 default, 2–12), fouls until bonus (5 default, 1–12), three-pointers enabled, regulation periods (4 default, 1–8), period minutes (12 default, 1–20), overtime minutes (5 default, 1–10), and players per team on court (5 default, 3–5). Total regulation time is limited to 60 minutes. Game rules lock after the season starts; the injury switch remains editable.

The Nth defensive team foul triggers bonus free throws; counters reset each period including overtime. Disqualified players are removed. If a team runs out of eligible players, the game records a forfeit rather than blocking simulation. No-three leagues remove three-point selection, transition threes and pick-and-pop threes, with a final shot-conversion guard. All field goals are two points.

Clocks, regulation/OT loops, clutch windows, foul holds, minute allocations and rotation timelines use the configured dimensions. 3-player lineups use PG/SF/C slots; 4-player lineups use PG/SG/PF/C. Existing five-position depth charts remain compatible. Completed games store a rule snapshot so Courtside uses the original starting clock after subsequent rule changes. Legacy games retain a 12-minute opening clock.

Validation: `test-simulation-rules.cjs` covers multiple regulation formats, OT clock boundaries, 3/4/5-player lineups, minute totals, foul caps/bonus, disabled threes, disabled injury risk, rotation persistence and game-rule snapshots. Existing New Career and league-settings checks also pass.

### Expanded league tendencies

Tendencies now includes pace, three-point tendency, three-point/layup/dunk/midrange/post/FT accuracy, block tendency, steal tendency, offensive rebound tendency, foul rate, and assist tendency. All default to 1×. Pace supports 0.5–1.5× with a minimum of one possession per team per minute; other new multipliers support 0–2×. The existing three-point preference is reused without introducing a duplicate setting.

Pace scales regulation and overtime possessions. Accuracy applies after base probability bounds and covers primary attempts, and-ones, putbacks, second-chance kick-outs, and normal/technical free throws. Post accuracy includes hooks, fades and turnarounds. Block/steal settings include putbacks, isolation steals, passing lanes and pick-and-roll traps/interceptions. Offensive rebound weight is scaled independently of defensive boards. Foul rate covers shooting, reach-in, blocking, loose-ball, offensive, illegal-screen, flagrant and technical calls. Assist tendency scales credit only on a made basket following an eligible pass; zero removes assists, including pick-and-roll and alley-oop credit. Existing final extended-overtime tiebreak resolution remains in place. The no-three rule always takes priority.

Validation: `test-league-tendencies.cjs` exercises category accuracy, zero-event simulation, FT accuracy, pace differences, disabled three-point attempts, persisted settings and invalid ranges. Existing league-settings and New Career tests pass.
