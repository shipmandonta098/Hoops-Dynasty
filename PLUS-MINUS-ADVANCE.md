# Box-score plus/minus and responsive Advance

New games record signed `plusMinus` on each player’s box row. Every made field goal, putback and free throw credits the scoring lineup and debits the defending lineup at the moment points are awarded. This includes technical free throws, substitutions, overtime and the final extended-overtime tiebreaker. Administrative forfeit scoreboard adjustments are not played points.

The Courtside live timeline appends the new stat key without renumbering existing keys. Live and final tables display positive signs and negatives; older games without recorded values show a dash. The total-row cell is intentionally blank rather than summing five players’ copies of the same team margin. Save validation accepts signed integers only for this stat and continues rejecting negative counts elsewhere.

Regular-season advancement now returns a Promise, shows progress before beginning, and yields to the browser between games and calendar days. A busy guard prevents overlapping runs. The modal prevents conflicting UI actions; Stop after this day (or Escape) completes the current league day, then saves. All-Star voting and ownership stops still apply. A failed game restores that day’s checkpoint, retaining prior completed days. Historical game objects are shared in rollback checkpoints to avoid repeatedly serializing all past play-by-play. Watch live and the simulation tool await completion before using results.

This is cooperative scheduling between games, not a background worker. Each individual game and the final save still run through the existing engine. No scoring probabilities, player selection or matchups were changed.

Validation: test-plus-minus-advance.cjs checks lineup-based plus/minus at every live scoring event, team margin identities, signed persistence, legacy handling, timer execution, repeated-click protection, stopping, failed-day rollback and live playback handoff. test-live-box.cjs and test-all-star-voting.cjs pass; legacy DOM mocks stub only the unchanged animated-feed renderer. No browser visual/performance trace was available.
