# Hoops Dynasty Decision Log

## JSON files
- `decision-log.schema.json`: full persisted module schema (JSON Schema 2020-12).
- `decision-log.samples.json`: illustrative entries only; never inserted into a career.

## UI
Click your manager name → GM Office → Decision Log. Use the Season selector's **GM Career Timeline** option to browse every recorded season. Filter by season, decision type, player name, and combined immediate impact. Sort newest first or by fan/owner reaction descending. Expand a card to see context, edit reasoning, inspect immediate effects, and read the long-term review. No intent is invented: automatic entries initially say reasoning was not recorded.

## API
```js
const id = addDecision({type, description, reasoning, players, immediateOutcome});
updateLongTermOutcome(id, notes);
const matching = filterDecisionLog({season:'all', type:'Trade', player:'Brooks', impact:'positive'});
const sorted = sortDecisionLog({season:'all', type:'all', player:'', impact:'all', sort:'date'});
await save(); // mutations are in-memory until the career save succeeds
```
`addDecision` supplies unique ID, date, season, current team record, pre-reaction owner mood, baseline record, and team identity. A repeated ID is ignored, including its effects. Sorting copies its array; filtering never edits the log. Notes-only updates do not grant reputation rewards.

## Action integration
Completed Trade, Signing (including extensions), Release, TicketChange and StrategyShift actions are detected by comparing state before and after their existing handlers. Rejected/cancelled actions and unchanged settings do not create entries. Hire and Fire are supported event types for future staff transaction handlers; those transactions are not implemented in this version. Save persistence uses the existing career save mechanism and import validation. Older careers start without fabricated events.

## Immediate effects
- Owner patience: add ownerReaction, clamp 0–100; 0 triggers the existing dismissal state. Automated personnel decisions use a small reaction: a penny-pinching owner reacts to cap-space savings; other owners use the modeled fan reaction. Ticket/strategy changes currently have zero owner reaction. Existing owner-goal settlement remains independent.
- Fan sentiment: accumulate fanReaction, clamped -20 to +20. Each point changes forecast attendance by 0.1 percentage point and merchandise per home game by 0.5%. Effects apply to subsequent business projections, not past receipts.
- Chemistry: accumulated change clamped -15 to +15, adjusts team chemistry score and the existing game modifier by change / 10. Trades apply -1 for disruption. Existing morale/personality effects remain active.
- Cap engine: positive capChange means MORE available cap space. The roster transaction is authoritative and updates actual player salaries once. The log records the resulting delta and refreshes `{amount,capSpace}` in its payroll snapshot; it never subtracts/adds the same salary again. The snapshot is refreshed by logged actions; the roster remains the source of truth.
- Grades: after 20 subsequent team games, or season end, use subsequent win percentage: A ≥ .700, B ≥ .550, C ≥ .400, D ≥ .250, otherwise F. This is an explicitly labeled context estimate, not causal attribution or a full player-value/fit model.
- Reputation: the first automated review changes agent trust by +2/+1/0/-1/-2, clamped 0–100. Trust adjusts future signing quotes and extension premiums by at most 5%. Trust below 20 also prevents extensions for players whose morale score is below 60. Existing morale refusals remain in force. Reviews cannot award trust repeatedly.

## Multiple seasons
Decision entries and aggregate sentiment/trust/chemistry are part of the career JSON and survive season rollover. Unreviewed entries with at least one subsequent team game get a season-end review. The career timeline reads all seasons, including old player names stored on decisions. No historical entries are reconstructed from incomplete saves.

## Optional extension points
- Hire/Fire: call addDecision only after an actual staff transaction succeeds.
- Owner memory: retained decisions, owner mood, reactions, reasoning, and grades provide a persistent memory record. A separate broken-promise detector or future goal-selection modifier is NOT implemented.
- What If: the card opens a read-only cap-delta comparison hook. It does NOT resimulate games. A true counterfactual needs an immutable pre-move snapshot and seeded RNG; branch those into a disposable simulation without saving to the active career.
- Value/fit grading: add roster-fit and asset-value snapshots before combining them with results. Current grades intentionally do not claim that precision.

## Example
See decision-log.samples.json. Monetary values are millions; fan, owner and chemistry reactions are integer point changes.
