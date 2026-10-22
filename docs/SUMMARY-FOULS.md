# Courtside foul highlights

Game Summary now displays recorded technical fouls, paired opposing double technicals, Flagrant 1/2 fouls, and ejections in its chronological Game Highlights list. Each incident uses the simulation's player ID, clock, score and team snapshot. Paired calls produce one highlight with both players; a player's second technical remains a separate technical and ejection.

The existing simulation still determines technical probabilities and flagrant penalties. Opposing technicals assessed in the same dead-ball check are paired, with no free throws. Both players receive a technical in their box score; second technicals still cause ejection. These highlights do not produce player-achievement news.

References: NBA Rule 12, https://official.nba.com/rule-no-12-fouls-and-penalties/ ; WNBA official rulebook, https://cdn.wnba.com/sites/4/2025/04/2025-WNBA-Official-Rule-Book.pdf . This change does not claim a new audit of all historical disciplinary rules.

Changed production files: dist/attributes.js (simulation recording and paired technical handling), dist/player-feats.js (validation and summary rendering), dist/index.html (cache versions). Existing city photographs and layout are preserved.

Validation: dev/test-summary-fouls.cjs checks single/second technicals, paired technicals, no paired free throws, resulting ejections, Flagrant 1/2, one highlight per paired incident, live visibility, and validation. Production NBA/WNBA simulations: 26 completed games, 6 technicals and 1 flagrant; recorded totals matched box scores and summary data survived career save/load validation. Rare paired calls and both flagrant types are covered by deterministic tests, not claimed as randomly observed outcomes.

Older games without incident records cannot reconstruct foul clocks from aggregate box scores; no incidents are fabricated. Browser visual QA was unavailable in this environment; simulation and rendering helpers were checked programmatically.
