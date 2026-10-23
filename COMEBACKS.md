# Comebacks & blown leads

Every completed regular-season and playoff game is checked against its recorded scoring events (`summaryData`). The winner's largest deficit and the loser's largest lead are the same number, so a comeback win is also the other team's blown lead.

## Where it shows
- **Courtside:** a team-colored banner between the scoreboard and the current play. It appears for:
  - leads of 15, 20, 25 and up, each the largest of the game
  - a "comeback watch" when a team down 20+ cuts the deficit to single digits, with "This would be the largest comeback…" when that's true
  - a team taking the lead after trailing by 15+
  - the final result, with its historical notes

  Each trigger fires once per game, and each banner stays up for 25 plays.
- **Game Summary → Game Story:** both teams' largest leads and when they happened, the comeback, the blown lead, the loser's best comeback attempt, the decisive run (best stretch within 8 game minutes) and the historical notes.
- **Postgame result view:** one compact card when the comeback was 15+. The box score is unchanged.
- **News Feed:** a story for any 20+ comeback, a new or tied league record, or a playoff ranking. It covers the largest lead, the score, last-period scoring, key players and the historical ranking.
- **League history → Comebacks & blown leads:** all-time top 10, playoffs top 5, this season top 5, largest by season, and every franchise's largest comeback and blown lead (overall and playoffs).

## Data
- **`game.comeback`** holds:
  - `largestLeadHome`, `largestLeadAway` and `leadAt`
  - `winningTeamLargestDeficit`, `losingTeamLargestLead`, `comebackWinAmount` and `blownLeadAmount`
  - `attempt`: the loser's largest deficit and the closest it got afterwards
  - `notes`: the rankings as of that game
  - `context`: the records just before tip-off, used for the live "would be" lines
- **`state.comebackRecords`** holds:
  - `allTime` (top 50) and `playoffs` (top 25)
  - `seasons`: the current season keeps every 10+ game; past seasons keep their top 5
  - `franchise`: each franchise's exact bests and its tracked-game count
  - `games`, `since` and `full`

  Entries tied with a list cutoff are always kept, so ranks and "tied for" wording stay correct. Both fields are checked when a save loads.

## Ranking rules
- **Rank and ties:** a game's rank is 1 + the number of games with a larger deficit. If any other game has the same deficit, the note says "tied for".
- **League ranks:** only up to 10th. Until the league has tracked about half a season (teams × 41 games), only the top 3 are called out.
- **Playoff and season ranks:** up to 5th and 3rd respectively.
- **Franchise notes:** need at least 20 tracked games for that franchise.
- **Thresholds:** all of these live in `COMEBACK_CONFIG` in `dist/comebacks.js`.

## Older saves
When an older save loads, the store backfills the games still in the current season's history, using their recorded scoring. Earlier seasons were never kept as scoring data, so they aren't reconstructed. A store started after the league's first season labels league-wide records "since tracking began (year)". Notes and news aren't written retroactively for backfilled games.

## Tests
`node test-comebacks.cjs` covers:
- lead, comeback and blown-lead math; comeback attempts; ties and ranks
- franchise, season, playoff and league notes; news
- banner timing, Game Story and record tables
- save/load, a new season, and the legacy backfill
- real NBA and WNBA days
- simulated results being identical with or without this module
