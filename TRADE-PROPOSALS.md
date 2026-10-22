# Trade proposal evaluation

The existing Trade Center, Trade Block, incoming GM proposals and AI-to-AI trades share the updated policy.

## Evaluation order

1. Check asset ownership, pick availability, deadline, roster minimum/maximum, salary matching, spending limit including dead salary, trade restrictions, and consecutive-first-round rules. Invalid packages do not reach asset valuation.
2. Value outgoing and incoming assets from the receiving team's perspective.
3. Apply fit, contracts, team mindset and package discounts.
4. Require received value to strictly exceed sent value × 1.15 in human-involved proposals, or × 1.05 for autonomous AI-to-AI trades. Both AI teams must accept an autonomous trade. Generated human-facing offers use the same buffer as manual finalization.

Existing configurable salary matching is preserved; this does not replace the user's league percentage with a hardcoded 125% rule.

## Value model

Player baseline = 2^((OVR − 60) / 6). It is multiplied by age, potential upside, contract efficiency, positional need and coaching fit. Exponential current ability avoids treating several ordinary players as equivalent to one star. Potential growth is worth more to rebuilding teams and less to contenders. Older contenders retain immediate-impact value rather than suffering an unbounded quadratic age penalty.

Mindsets preserve the game's established team-direction classifier and display as Win-Now, Rebuilding and Neutral. Expiring contracts receive +12% for rebuilding teams and −8% for contenders. A missing position receives ×1.2; three quality players at that position produce ×0.8. Package fit is evaluated against the roster retained after outgoing players leave.

First-round pick baseline = 4 + 36 × (1 − projected slot percentile)^2. Later-round baseline = (1 + 5 × (1 − percentile)^2) / (round − 1). Future value discounts by 0.85 per season. Rebuilders apply ×1.3 and contenders ×0.7. Locked draft orders use known slots; otherwise records blended with roster strength estimate the slot, without labeling future lottery outcomes guaranteed.

## Guardrails

For an oversized package of weaker players, the first player's value counts fully, the second at 70%, and subsequent players at 35%. Genuine premium compensation can still bridge the gap. Existing superstar centerpiece protection remains. Overpaid multi-year contracts require first-round compensation, except when a contender acquires an immediate-impact star; contracts still must satisfy league rules.

Newly traded players receive a 30-calendar-day lock (`tradeLockedUntil`, an absolute game-calendar day). Human and autonomous AI trades both apply it. Locks are validated and saved, unaffected by the number of games played. Existing legacy 15-game restrictions and existing signing restrictions remain until fulfilled. Trade Center and Trade Block show the relevant remaining restriction.

## Negotiation feedback

Trade Center displays the receiving team's mindset, sent/received/required values, strictness buffer and any package discount. Feedback distinguishes illegal finances, badly insufficient value, rebuilding salary concerns, contender core downgrades and missing centerpiece value.

For close rejections, the evaluator searches the offering team's owned picks from cheapest upward. It recommends a specific pick only if adding it passes all legality and valuation checks. Add suggested pick updates the proposal; it never executes the trade.

## Tests

- `node test-trade-proposals.cjs`: legality before valuation; human/AI buffers; mindset, age, fit and contract context; projected pick slots and future discount; package penalties; counteroffers that actually bridge the gap; 30-day locks, import validation, expiry and rollover; salary feedback.
- `node test-trade-block.cjs`: end-to-end saved listings, legal generated offers, review, real trade finalization, cleanup, failed-save rollback, inbox, filters, expiry and legacy saves.
