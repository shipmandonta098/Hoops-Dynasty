# Franchise rivalries

Open Franchise history → Rivalries. The existing team selector switches franchises. Cards show bad blood, recorded regular-season/playoff records, the next scheduled meeting, causes, expiring effects, and event timelines.

`dist/rivalries.js` owns the registry, trigger rules, matchup context, migration, and validation. Stable franchise keys survive branding changes. Old saves start tracking at load; no unrecorded history is invented. New saves retain the registry across seasons, exports, and reloads. History is bounded to 80 events per pair. Geography uses same-city matches and an explicit state map; unknown custom cities are not guessed.

Triggers:
- Geography: same city (Cross-Town Feud; Brooklyn counts as New York), same metro area (Metro Rivalry: Los Angeles/Anaheim/Inglewood, New York/Brooklyn/Newark/East Rutherford, San Francisco/Oakland/San Jose) or mapped state/province (In-State / In-Province Rivalry). All three keep the split 50/50 crowd that cancels the configured home shooting advantage; only the label differs.
- Regional: explicit cross-border or long-distance ties (Buffalo–Toronto; Calgary, Winnipeg, Vancouver, Edmonton). Recognized for heat and narrative, but no crowd split. Unlisted distant pairs are never forced into a rivalry.
- Founders: two recorded Finals eliminations between original tracked franchises of the earliest recorded vintage. Expansion franchises added later are excluded.
- Market divide: Small market, Grit & Grind system versus a Large market spending at least 25% more.
- Heartbreak: three consecutive recorded playoff eliminations by the same opponent, or a recorded winning field goal at 0:00 in the final period/OT. Revenge lasts three meetings.
- Enforcer: an actual flagrant foul can cause a contact injury; an injured 85+ OVR star triggers four subsequent grudge meetings. Injury settings and eligible roster limits apply.
- Spoilsport: in the final quarter of the season, a team at ≤40% beats one at ≥65%, both with at least five games played. Three revenge meetings. An eight-plus winning streak is mentioned only if actually broken.
- Return: an observed 85+ OVR player changes franchises. Their first game at their former home arena carries the hostile narrative and increased isolation choices on both sides. It does not invent a trade demand.
- Draft duel: active 85+ OVR players with recorded first-round picks 1 and 2 in the same year.
- Mentor: a tracked young reserve shared a roster with a 30+ Leader/Mentor; later they lead a different roster (top two OVR). Player mentorship is supported; assistant-coach histories are not manufactured.

All performance changes are game-local, bounded at −2 to +5 effective skill points and scaled by intensity. Existing Fiery, Money-Chaser and durability traits provide the competitive/loyalty/fragility mappings. Permanent ratings remain intact. Technical/flagrant risk scales with bad blood; existing ejection rules resolve the consequences. Injury risk respects the league toggle and frequency. Home crowd advantage rises at most 0.8 percentage points unless split. Pregame narrative lines are recorded with matching live box timeline frames; news previews cover upcoming rivalry games within 14 league days. Replaying a result does not consume effects.

Validation: `node test-rivalries.cjs`, `node test-simulation-rules.cjs`, `node test-page-headers.cjs`. Browser preview is unavailable for this static project in the current environment; no browser/device walkthrough is claimed.
