# Player dissatisfaction overhaul

## Scope and original behavior

The pre-change audit is in `MORALE-AUDIT.md`. The effective postgame handler guaranteed a trade request below 15 morale, or after five/eight consecutive games below 40. The final negotiation wrapper also guaranteed refusal below 40. There was no private request, behavioral cooldown, or separate contract intention.

This change keeps existing players, contracts, financial engines, historical presets, family IDs, statistics, and city photographs. It does not rewrite unhappy players on load. Existing requests remain valid; their unknown original dates are not invented.

## Decision model

`dist/player-dissatisfaction.js` owns one versioned per-player decision record. It is called by the existing postgame morale handler, not a parallel simulation.

- Response: professional or frustrated.
- Contract intention: open, exploring permitted post-contract options, or declining extension discussions.
- Trade request: none, private, or public; one active request with ID, date, reason, duration, visibility, denial status and resolution history.
- Separate counters record consecutive and total low-morale games, recent morale change, recovery, role commitments, management attempts, review timing and cooldown.

Reviews occur every eight actual games. Ordinary requests require at least twelve consecutive games below 40 AND a specific dissatisfaction cause. Causes come from real playing time, underpayment, team results and ambition, management trust, or an unfulfilled accepted minutes commitment. Injury absences do not create a role complaint.

The per-review request probability starts at 0.8%, then depends on severity, duration, loyalty, professionalism, role/team causes, star status, impatient/fiery traits, career stage and contract years. It is capped at 6% per review. Expiring deals multiply the chance by 0.22; three-plus remaining years multiply it by 1.5. Prior requests reduce repeat propensity. This is a simulation balance model, not an empirically established real-world frequency.

Public requests need at least 24 low-morale games and two causes. Only a small personality-dependent share of qualifying requests are public (3–20%); the remainder are private. A private request may later become public under sustained circumstances, retaining its original request ID. Requests are not a mandatory escalation ladder.

Intent decisions are separate draws (maximum 30% per review after twelve low games), with expiring players more inclined to wait for their next permitted opportunity. Six consecutive games at 60+ morale reopen discussions and can withdraw a request. Resolution starts a 90-calendar-day request cooldown. Changing teams grants eight games of settling-in time. A low-morale player can remain professional indefinitely.

Constants are centralized in `DISSATISFACTION_RULES`. An optional validated career field `dissatisfactionSettings.requestScale` accepts 0.5, 1 or 1.5 (default 1); there is no new settings-screen control. Independent per-player deterministic RNG state is saved. Opening profiles consumes no random draws.

## Gameplay integration

- Existing extension dialogs and the Contract tab use the same `negotiationStatus`. Low morale influences asking terms without automatically refusing an extension. Stored intentions can refuse discussions; successful agreements clear the situation atomically with the save.
- Offseason former-team interest honors stated intentions. A financially improved offer with a credible role can change the decision. Other teams are not blocked. In-season offers and the older direct-sign action also respect former-team intentions.
- Existing qualifying offers, matching rights, WNBA hard caps, eligibility windows and contract validators remain authoritative. An intention does not cancel a contract or grant unrestricted free agency. Early-era profile wording says “permitted post-contract options.” This change adds no new historical CBA research or movement rights; pre-existing historical limitations remain.
- AI teams can prioritize a requested player in their existing trade search, retain a contender’s star, wait, or prepare for expiration. Bilateral trade value and legality tests remain mandatory; there is no forced trade. The recorded AI response does not implement a new promise-negotiation dialog or a bespoke roster-building optimizer.
- The user can decline an active request in the player profile. Coach conversations remain the existing management action, now recorded with rollback on failed saves. Rotation changes, team improvement and accepted contracts feed the existing morale/contract systems.
- Private requests and role concerns go only to the controlling GM inbox; public requests enter league news. Private requests do not become public trade-block reasons. Concern notifications have a 30-day cooldown, and an unresolved request cannot be emitted twice.
- The profile shows morale, contract outlook and trade-request status separately. Other teams’ private intentions remain private.

## Performance balance

Removed forced isolation, automatic development suppression, the extra low-morale technical-foul multiplier, and broad 8% rating penalties. Temporary morale effects now touch decision-making, passing and perimeter focus at a nominal maximum 2% reduction (integer rounding applies), with no direct shooting, speed or strength reduction. Remaining turnover, foul and team-miscommunication effects are small and context-dependent. Ordinary existing personality, fatigue and injury effects remain separate. Postgame morale adjustments are bounded and gradually mean-revert; reported adjustments use the actually applied value.

## Persistence

The player field has `version: 1`; the existing career/database format remains unchanged. Validation carries the optional state through the normalized player rows. Missing state in older careers is created only when gameplay or an actual management action needs it, not merely on load. An existing legacy `tradeDemand` is retained as a previously public request with its original date explicitly unknown. Histories retain the most recent 40 events and 20 management attempts to bound save growth. This is not an unlimited archival news system.

Accepted extensions and meetings restore behavioral state if saving fails. Player IDs, names and salary schedules are checked for equality across serialization. Requests and deterministic RNG resume rather than being regenerated.

## Files

| File | Change |
|---|---|
| `dist/player-dissatisfaction.js` | Central state, probability, privacy, intention, profile and persistence integration |
| `dist/morale-effects.js` | Postgame decisions, bounded morale/performance effects, less repetitive contextual concerns |
| `dist/morale.js` | Remove old request trigger, private request visibility, atomic meeting records |
| `dist/attributes.js` | Remove/reduce forced low-morale disruptions |
| `dist/free-agency.js` | Record accepted in-season agreements |
| `dist/trade-logic.js` | AI request prioritization while retaining trade legality/value checks |
| `dist/trade-block.js` | Public-only request availability reason |
| `dist/roster-management.js`, `dist/wnba-gameplay.js`, `dist/contract-management.js` | Accurate extension-refusal explanations |
| `dist/personalities.js` | Probabilistic personality wording |
| `dist/index.html` | Load centralized behavior after existing engines; refresh changed-script cache keys |
| `dev/test-dissatisfaction*.cjs` | Scenarios, transactions, historical coverage and original/revised season comparisons |
| `dev/test-morale-performance.cjs` | Update intended bounded-rating expectations |
| `dev/dissatisfaction-*.json` | Actual observed simulation results |

## Verification and limitations

Targeted checks passed for temporary frustration, sustained expiring and long contracts, loyal/professional personalities, prolonged star dissatisfaction, denied requests, withdrawal/recovery, cooldowns, no duplicate active request, private-news isolation, extension willingness, in-season offers, successful/failed-save behavior, and deterministic next-draw preservation.

Historical compatibility checks passed for every WNBA year 1997–2026 and NBA 1946, 1976, 1984, 1997, 2011 and 2026. They verify behavior integration, contract/identity preservation and movement-rights wording; they are not a new verification of every historical CBA rule. The contract dossier (including all 30 WNBA salary environments) and WNBA option/extension transaction regression checks passed. Seeded NBA teams, player records, contract book and salary cap match the pre-change baseline at creation. NBA offseason checks passed for 1984, 1997 and 2026. An additional 2014 four-team offseason fixture stalls at minimum-roster/payroll construction in both the original and revised engines. That pre-existing financial-construction limitation is not repaired by this behavioral change. The older `test-contract-nba.cjs` baseline loader also fails before testing with an undefined `onSetup` during its old source-replay setup; the new explicit-baseline control test avoids that stale harness.

Serialization, career validation and normalized database-row retention are tested. A real browser IndexedDB write/reload and visual/mobile click-through were not available in this environment. Do not interpret the headless profile-render checks as browser QA.

The controlled 82-game tests hold morale at 10 with persistent underlying causes to exercise adverse behavior. They are stress tests, not ordinary league-frequency estimates. Actual full-season comparisons use the production possession engine, playoffs, draft, AI free agency and rollover, with eight-team customized leagues, 28 regular-season games per team and single-game semifinal/final rounds. They do not establish full-size 30-team/82-game league balance. Original and revised runs use seed 77; revised decisions and performance changes naturally cause paths to diverge.

### Controlled severe-dissatisfaction scenarios

Each scenario contains 1,000 distinct players; sustained scenarios run 82 reviewable games. Temporary frustration runs five games. “Morale only” explicitly removes all additional causes.

| Scenario | Players requesting | Request rate | Public requests | Changed contract intention | Mean low games before request |
|---|---:|---:|---:|---:|---:|
| temporary | 0 | 0.0% | 0 | 0 | — |
| morale only | 0 | 0.0% | 0 | 0 | — |
| expiring | 35 | 3.5% | 2 | 697 | 49.4 |
| long term | 183 | 18.3% | 16 | 390 | 51.8 |
| loyal | 130 | 13.0% | 6 | 267 | 50.8 |
| professional | 95 | 9.5% | 2 | 389 | 50.5 |
| star | 362 | 36.2% | 67 | 383 | 49.7 |

A separate WNBA stress test used 500 stars with valid three-year 2020 contracts and 82 games of severe, sustained dissatisfaction: 183 requested trades (36.6%), including 152 private and 31 public requests; 185 changed contract intentions. This deliberately adverse fixture confirms the WNBA request pathway remains functional despite zero requests in the shortened ordinary-season sample.

No trial generated more than one active request. Intent changes are not equivalent to a completed free-agent departure; departures are measured in the actual-season comparison.

### Complete-season comparison

All four arms completed five seasons and 575 games with no runner errors: **20 complete customized seasons and 2,300 games**. Each NBA arm began in 2026; each WNBA arm began in 2020.

| Implementation / league | Requests across five seasons | Private / public at issuance | Players requesting (player-season %) | Unhappy players requesting | Unhappy players refusing extensions | Mean low games before request |
|---|---:|---:|---:|---:|---:|---:|
| original / NBA | 134 | 0 / 134 | 23.33% | 33.08% | 100.00% | 6.1 |
| original / WNBA | 141 | 0 / 141 | 30.73% | 50.18% | 100.00% | 5.8 |
| revised / NBA | 2 | 2 / 0 | 0.35% | 0.70% | 5.94% | 24.0 |
| revised / WNBA | 0 | 0 / 0 | 0.00% | 0.00% | 7.04% | — |

| Implementation / league | Unhappy contract expirations | Finished with no new request that season | Signed elsewhere | Re-signed | Remained unsigned |
|---|---:|---:|---:|---:|---:|
| original / NBA | 231 | 65.8% | 102 (44.2%) | 85 | 44 |
| original / WNBA | 138 | 44.9% | 48 (34.8%) | 14 | 76 |
| revised / NBA | 171 | 100.0% | 65 (38.0%) | 79 | 27 |
| revised / WNBA | 69 | 100.0% | 3 (4.3%) | 24 | 42 |

“Unhappy” means observed below 40 at least once that season. Refusal means the player declined discussions at some point, not necessarily a submitted offer. The no-new-request measure uses that season’s request events, not a reconstruction of requests before the measured season. Free-agent outcomes are actual signed destinations or remaining unsigned; unsigned players are not counted as signing elsewhere. These rates describe the entire existing market/financial model, not solely the effect of dissatisfaction.

The original NBA sample had one repeat request for the same player within a season; the original WNBA sample had three. Revised samples had none. These repeats are distinct from simultaneous active duplicates, which the targeted tests explicitly prohibit. There were no public requests in the revised ordinary-league sample. That does not disable public requests: the sustained-stress scenarios exercise them. Five shortened seasons per league is an initial calibration, not a full-size league or 50–100-season validation.


### Reproducing the checks

Run the targeted tests with `node dev/test-dissatisfaction.cjs`, `node dev/test-dissatisfaction-transactions.cjs`, `node dev/test-dissatisfaction-historical.cjs`, `node dev/test-dissatisfaction-wnba-stress.cjs`, and `node dev/test-morale-performance.cjs` from the project root.

For the original/revised comparison, extract `dist/` and `dev/` from Git revision `b3450a8809bd023fdfb98876fbb736341f7b14dd` into a separate directory. Set `HD_MORALE_BASELINE` to that absolute directory, then run `node dev/test-dissatisfaction-seasons.cjs` and `node dev/test-dissatisfaction-nba-control.cjs`. The comparison runs in isolated headless careers, never a user's loaded save. The JSON result files contain the individual-season denominators and outcomes.

All 38 city photographs and their folder README were compared byte-for-byte with the starting project and preserved.
