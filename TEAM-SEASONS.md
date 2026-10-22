# Franchise season pages

Season labels in Franchise history → Season-by-season record open a dedicated Roster and Stats page within franchise history. Previous/next controls navigate recorded seasons for the same franchise; the back button returns to the records table.

The page includes the season identity, record, coach, arena, regular-season home attendance, team scoring/efficiency/pace, roster biographies, per-game or total player statistics, regular-season/playoff selection, and game results. Team possessions use the recorded number of on-court players; pace is normalized to 48 minutes. Missing data shows an em dash instead of fabricated statistics.

`dist/team-seasons.js` maintains optional `teamSeasonArchive` snapshots with stable franchise keys. Current pages refresh from actual box scores. Pregame/postgame capture retains departed roster members and team-specific splits. Championship finalization and archive hooks seal the completed season before offseason changes; later trades, development, retirement and branding changes do not rewrite those snapshots. Newly drafted offseason players are excluded from the completed season.

Older seasons use existing team and franchise-player archives where available. Multi-team player totals are never substituted for a franchise split. Unknown historical biographies, coach/arena, attendance and game logs remain unavailable. The existing historical team logo is not fabricated or replaced with a current logo.

Checks: `node test-team-seasons.cjs` covers navigation, no-games rendering, trade splits, dates/totals, frozen history, validation/save-load, fallback and number formatting. `node test-rivalries.cjs` and `node test-page-headers.cjs` pass. Browser/mobile visual QA is unavailable in this environment; responsive tables reuse the existing scroll containers and do not widen the page.
