# Trade Center implementation

## JSON contract and sample
See trade-center-schema.json and trade-center-sample.json. Salary and cash amounts use millions. The sample is illustrative, not a seeded offer; live dates, players and valuations come from the career. `tradeCenterModel()` builds the view model from authoritative state. Internal calculation fields supplement the public schema. Positive capImpact means payroll savings. capLimit is the existing roster spending limit, distinct from salaryCap and luxury tax. The Decision Log link is a logical navigation identifier, handled by openTradeDecisionLog() in this single-page app.

## Interface
The deadline header sits above a partner selector. Mirrored You Send / You Receive roster cards support multiple selections with silhouettes, position, age, OVR, salary and years. Cash and reasoning sit beneath. The analysis panel shows value balance, both payroll checks, cap room, top-five OVR impact, coach preferences, AI feedback and owner/fan/chemistry previews. On smaller screens the panels stack. Recent league trades and the GM History button complete the page. The existing dashboard Advance Day control remains available.

## Trade rules
Player value uses an exponential curve (six OVR points double base value), adjusted for age, upside, contract cost and years, positional scarcity, roster need and coach fit. Teams dynamically choose Contender, Rebuilding or Standing Pat based on current record and their top five. Rebuilders favor young upside and near-term firsts; contenders protect their elite core. Standing Pat teams require an extra premium.

Every offer checks both rosters (8–15 players), cash reserves and existing spending limits. Incoming salary must leave the receiver under the salary cap, or remain within 110% of outgoing salary plus $0.1M. This is the game's simplified salary-matching rule, not a complete NBA CBA implementation. Cash cannot replace salary matching.

New signings and traded players wait 15 actual team games before being traded again, including across season boundaries. Legacy players without a recorded acquisition begin eligible. Off-days do not reduce the cooldown.

Draft assets cover the current draft and four future years. Once a draft starts, that year's picks are locked. Ownership persists and controls who makes the actual rookie selection. A team cannot leave itself without any first-round pick in consecutive future drafts. Long-term overpaid players require near-term first-round compensation; a superstar additionally requires a cornerstone player. Cash and multiple low-value players cannot bypass that rule.

## Shared functions
- tradePlayerValue(player, receiver): exponential, contract- and context-adjusted asset value.
- tradeTimeline(team): dynamic team direction.
- tradeSideAssessment(team, givePlayers, receivePlayers, givePicks, receivePicks, cashReceived): value, reasons and acceptance for one team.
- tradeLegality(teamA, teamB, outgoing, incoming, cash, outgoingPicks, incomingPicks): salary, roster, cooldown, ownership and consecutive-pick checks.
- addTradeOffer({club, outgoingPlayerIds, incomingPlayerIds, outgoingPickKeys, incomingPickKeys, cash, reasoning}): pending draft.
- finalizeTradeCenter(): re-resolve assets, validate, transfer players/picks/cash, rebuild rotations, log and save; restore state on save failure.
- updateCapSpace(team): recompute actual payroll, never trust a submitted capImpact string.
- recordTradeToDecisionLog(model): record accepted trade and reactions once.
- displayTradeHistory(limit): recent league trade news.

AI inbox proposals use the same policy. Once each simulation week, CPU teams check for at most one mutually acceptable player swap; no team accepts merely because the other team benefits. Picks are available in the user Trade Center; autonomous weekly CPU proposals currently use players only.

## Multi-year integration
Completed moves persist in career decisions, finances, player cooldowns and the draft ownership ledger. Owner and fan reactions use the existing Decision Log; fan sentiment feeds attendance and merchandise. Chemistry combines roster disruption and coach-system fit. Draft offers are temporary and reset each season. Long-term Decision Log grades are observational, not causal claims. News retains 500 events; the view shows the last five trade events retained. Declines have no owner penalty. Three-team routing is not included.

## Verification
A seeded headless test evaluated 200,000 randomized offers split between player-to-AI and mutually evaluated AI-to-AI cases. It found zero accepted superstar dumps under the cornerstone rule. Additional tests cover salary matching, toxic contracts, 15-game eligibility persistence, consecutive firsts, pick ownership, draft routing, player/cash conservation and failed-save rollback. This is a balance regression suite, not a guarantee of ideal long-run league parity.
