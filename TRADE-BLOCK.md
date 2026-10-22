# Trade Block

Trades now has Trade Center and Trade Block subtabs. Existing manual negotiations remain available.

## Your listings

List up to 30 owned players/picks using the checkboxes. Listings save immediately, with rollback on failure. Players in a trade cooldown can be listed, but cannot appear in a legal proposal until eligible. Removed, traded or unavailable assets cannot be offered. Active picks use existing ownership and tradeable-season rules.

## Incoming offers

Find offers searches for packages involving listed assets. The same search runs every seven league days when a block exists. Teams consider current player value, contracts, timeline, positional needs and draft value. Candidates include player swaps, player/pick packages, players for picks and pick swaps. Up to six offers arrive per search (one per responding team), with forty recent offers retained.

Proposals must pass existing trade legality, salary matching, roster limits, cooldowns, pick ownership and consecutive-first-round rules. Payroll checks include dead salary. The AI must accept its valuation and the user's return must reach at least 85% of the user's own assessed outgoing value; no favorable offer is guaranteed. No trades execute automatically.

Repeated searches with unchanged listings on the same day do not generate duplicate offers. Identical recent packages, including declined ones, are suppressed for seven league days. Offers expire after seven league days or at a season change, and are re-evaluated before review. Trade deadlines suspend offers but retain listings. GM Inbox displays a Trade block notification with a link to the subtab.

Review offer fills the existing Trade Center with the package. Propose & finalize trade performs all normal checks, finances, rotation updates, news and Decision Log recording. Matching block offers are marked accepted and outgoing listings removed within that same save transaction. Edited packages are treated as ordinary new negotiations.

## League listings

AI availability derives from trade requests, veterans on rebuilding teams, positional surplus, expiring bench contracts, and players outside the core rotation. Teams protect highly rated core players unless they have requested a trade. First- and later-round picks are shown as assets available for balanced packages, subject to normal legality.

Filter by asset type, position, a skill rating of at least 75, or prospects aged 24 or younger with potential above current overall. Sort players by overall, potential, salary or age. Position/skill/prospect filters apply to players and hide picks. Build offer loads the selected asset into the normal negotiation flow.

## Validation

`node test-trade-block.cjs` checks listing/pick persistence, offer legality, repeated-search suppression, GM Inbox notifications, review, actual trade finalization and cleanup, failed-save rollback, filters, expiry, weekly refresh, invalid data and old saves. No existing career needs migration or a restart.
