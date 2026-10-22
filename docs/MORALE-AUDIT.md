# Morale audit — before implementation (18 October 2026)

Source baseline: b3450a8809bd023fdfb98876fbb736341f7b14dd.

- `morale.js` computes situational morale from minutes vs expected role, wins/losses, underpayment, contract security and temporary adjustment. Personality and captain/performance wrappers modify it.
- The effective `updateMoraleAfterGame` in `morale-effects.js:26` guarantees a request at morale <15 immediately after a game, or after 5 consecutive games below 40 for Spotlight Seekers / 8 for everyone else. There is no request probability. Temporary frustration can therefore create a request on its first game. Professionalism/loyalty do not affect this final decision.
- Existing `tradeDemand` prevents simultaneous repeats, but morale >=70 clears it with no cooldown or history. A subsequent low crossing can announce another request.
- The final negotiation wrapper (`morale-effects.js:21`) sets `refuses = score <40`, overwriting previous loyalty/trust refusal decisions. Every sufficiently unhappy player refuses extensions. There is no separate contract intention.
- `free-agency.js:faInterest` reduces former-team interest by 25 when departure morale <40; it already permits leaving without a request, but does not track prolonged dissatisfaction or intention changes. RFA matching and WNBA-specific offer/cap checks are separate existing systems.
- Trading calls `resetPlayerSituation`, clearing demand and low-morale counters without history. AI trade rounds use legality and bilateral value checks, not an obligation to grant requests. Trade requests receive a blanket 20% market-value reduction and automatically surface on trade-block listings.
- Public `say()` feeds league transaction news; there is no private request distinction. Coach meetings already change morale; promised offer minutes exist, but promises are not separately retained for accountability after rotation edits. No individual coach relationship score exists.
- Performance effects include -8% to nearly all playable attributes below 40, +35% foul multiplier, extra technical-foul multiplier, forced isolation for very unhappy stars, extra turnovers and defensive miscommunication; positive development also stops below 40. These make unhappy players act disruptively by construction.
- Persistence saves `tradeDemand` and `lowMoraleGames`, but no separate intent, request history, review/cooldown, cause or resolution record.

Implementation direction: one saved dissatisfaction decision record per player, reviewed on actual games with a dedicated deterministic RNG; separate professional/frustrated response, contract intent and private/public requests; sustained low morale plus specific causes for requests; preserve existing movement/financial legality and human/AI transaction workflows. No automatic request on load.
