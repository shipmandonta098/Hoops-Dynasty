# All-Star voting

Open Schedule → Voting & weekend. The GM Inbox links to the reserves ballot when voting closes, two days before the weekend begins. Bulk simulation pauses until the manager votes or abstains. Completed legacy weekend reports are preserved; older careers without a report can initialize voting from the weekend screen.

Starter component scores are normalized against the highest score in each conference/pool: 50% fan, 25% media, 25% player. Media uses a custom box-score efficiency metric and team record (not PER or Win Shares); player voting emphasizes production, assists, steals and blocks. The default starter composition is two guards and three frontcourt players; positionless selection is configurable in League Settings → All Star.

Daily fan votes reflect scoring, deterministic player popularity, market size and draft pedigree. Every five days a seeded narrative adds 5,000 or removes 12,000 votes. A 20% seasonal chance creates a cult fan campaign; a resulting fan-favorite starter can be overridden before confirmation. Own-team marketing costs $250,000 for 15,000 votes, once per player, up to $1M per season, with budgets enabled and sufficient cash. Failed saves roll back spending and selections.

Each coach ranks eligible reserves, excluding their own players. The manager contributes the standard seven-reserve ballot (adjusted to roster size), or abstains. Selections and snub reactions enter the All-Star News Feed category. High-merit snubs receive a temporary morale adjustment of −6. Conference, mixed and captains-draft assignments use the confirmed player pool. Captains are the two highest fan vote-getters among selected players; their automatic snake draft is logged.

The optional untimed fourth quarter targets the leading third-quarter score plus 24. Exhibition points and play-by-play are stored separately and do not change club records, regular-season box scores or injuries. Existing dunk, three-point and skills events remain intact. Voting state is validated on import and reset at season rollover.

Validation: node test-all-star-voting.cjs covers campaigns, repeat-spending protection, failed-save rollback, ballot pause, weighted scores, eligibility, cult override, position constraints, announcements, idempotent confirmation, save/load, captains assignment, target-score play and regular-season isolation. UI markup is exercised through the project VM harness; no browser screenshot verification was available.
