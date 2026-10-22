# Player archetypes

Five core styles plus a Balanced fallback are defined in `dist/archetypes.js`. Labels are visible in the Players directory and profile header. The Tendencies tab describes the style and shows effective preferences; Development explains growth priorities.

| Style | Generation strengths | Behavior |
|---|---|---|
| Stretch Big | Midrange, three-point, rebounding | Pick-and-pop preference, perimeter spacing, fewer post-ups |
| 3 & D Wing | Three-point, perimeter defense | Spot-up shots, limited drives/isolation, assignment to the leading active scorer |
| Slash & Kick PG | Speed, dribbling, passing, layups | More drives, kick-outs and pick-and-roll initiation |
| Paint Beast | Strength, rim defense, rebounds, post, dunks | Post-ups, blocks, putbacks; very low three-point preference |
| Shot Creator | Midrange, dribbling, three-point | More touches, isolation and pull-ups; less passing |

Generation applies rating offsets once to a fresh rating object. The visible style is then classified from the resulting ratings and position. Stored preferences stay separate from ability. Reading a tendency multiplies the saved preference by its archetype weight, clamps it, then applies the league slider. No modifier is accumulated into saved tendencies. Existing saves infer tags without regenerating attributes.

The tag is saved as `archetype: {id, season}`. Validation rejects unknown IDs or invalid seasons. Classification refreshes each season after development, including free agents and unsigned draft rights. SG/SF players above 80 in both three-point and perimeter defense become 3 & D Wings; bigs with appropriate shooting range become Stretch Bigs. Other profiles use position-eligible rating scores, with Balanced for players without a clear specialty. Draft prospects are reclassified after draft-strength adjustments. Career creation uses the new career's year, independently of a previously loaded career.

Positive development uses one skill check per offseason: 90% for priority skills, 30% for other skills, 5% for unlikely skills (60% across skills for Balanced players). Paint Beast Strength and Rebounding are priorities, three-point shooting is unlikely. Successful checks award the existing development amount; no growth is forced when the development amount is zero. Potential, aging, durability, coaching protections and the development slider remain active. Height and durability are not developed through these checks.

Only active players contribute lineup effects:

- Three or more Paint Beasts: −0.10 to driving shot success before league accuracy modifiers.
- One or more Stretch Bigs, without a clogged paint: +0.02 driving success per Stretch Big, capped at +0.04.
- A Slash & Kick PG: +0.05 for actual assisted spot-up midrange/three-point attempts by a Stretch Big or 3 & D Wing. Self-created shots and pull-ups do not receive this bonus. The bonus also reaches eligible offensive-rebound kick-outs.
- A 3 & D Wing takes the leading active scorer in the regular matchup assignment. Explicit pick-and-roll switches/help assignments retain priority.

Pick-and-roll pop/roll weights, handler selection, kick-out likelihood and offensive usage use the profiles. Outcome resolution remains rating-based: a shot baseline plus 0.002 × (effective shooter − defender), then contest, fatigue, coaching, context, lineup and league modifiers. Low three-point ratings below 50 use an additional range penalty, so a forced three by a non-shooter is usually missed. New shooting specialization and gravity warranted recalibrating the three-point baseline to .31; this is a pre-context baseline, not the observed league percentage. The user's raw 0.6 offense − 0.4 defense expression was not used as a literal percentage because equal 85-rated players would produce only 17% success.

## Verification

`node test-archetypes.cjs` checks generation offsets, effective choices, no stacked boosts, 2,000 independent development samples (1,798 Strength / 1,805 Rebounding / 100 three-point improvements), retagging, lineup effects and bench exclusion, defensive assignments, pick-and-pop preference, weak shooting, save migration, invalid metadata, past-year career creation, profile rendering and simulated box scores.

`node test-statistical-balance.cjs` retains the prior statistical acceptance ranges. The new 120-game sample produces 100.91 possessions per team, 79.18% initial FGA outcomes, 14.04% initial turnovers and 6.77% FT trips. Shot mix: 37.15% inside / 23.46% midrange / 39.38% three. FG%: 63.01% / 43.47% / 37.42%. Assisted makes: 59.60%; offensive rebounds: 25.75%; stolen turnovers: 42.28%. Samples fluctuate and custom strategies/settings intentionally change these results.

Regression checks pass for pick-and-roll, league tendencies and zero settings, custom simulation rules, New Career settings, and the Players directory.
