# Courtside attendance system

Implemented in Hoops Dynasty. `attendance.schema.json` contains the full JSON Schema; `attendance-examples.json` contains two complete sample entries. The implementation is in `dist/attendance.js` and `dist/attendance.css`.

## Data and formulas

All atmosphere money is dollars. Finance ledger entries are millions of dollars. Revenue means gross ticket revenue, not profit or total concessions/merchandise revenue.

```
ticketPriceEffect = clamp((1 - ticketPrice / baseTicket) × 0.30, -0.60, 0.30)
attendance = round(capacity × clamp(0.75 + teamPerformance + opponentQuality
                                   + fanSentiment + ticketPriceEffect, 0, 1))
fillRate = attendance / capacity
revenue = round(attendance × ticketPrice, 2)
fanEnergy = clamp(round(fillRate × 3), 1, 3)
```

The clamp prevents negative crowds and overcapacity crowds. Zero attendance still yields one flame to match the requested 1–3 scale. The sample's 3,500 tickets at $42 produces $147,000, not $142,000.

The implementation derives inputs as follows:

- Team performance: `clamp((seasonWinRate − 0.5) × 0.20 + winningStreak × 0.015, −0.10, 0.20)`; streak is measured over at most the last ten games.
- Opponent quality: `clamp((opponentWinRate − 0.5) × 0.10 + max(0, highestHealthyOpponentOVR − 80) × 0.01, −0.05, 0.25)`.
- Fan sentiment score: `clamp(existingTradeAndDecisionSentiment + (last10WinRate − 0.5) × 20, −20, 20)`. AI teams use recent results without the human GM's decision modifier.
- Fan sentiment factor: `fanSentimentScore × 0.005`.
- A team with no games starts at a neutral 50% win rate.
- Capacity comes from the existing arena system: `18,000 + arenaUpgradeLevel × 1,000`. The 3,500-seat JSON samples demonstrate the formula; they do not change existing arenas.
- Regular-season ticket price comes from the existing owner plan; playoffs use the existing playoff price.

## Pseudocode and lifecycle

```
calculateAttendance(teamPerformance, opponentQuality, fanSentiment, ticketPrice,
                    capacity, baseTicket):
    derive ticketPriceEffect
    apply the clamped attendance formula
    derive fillRate, updateFanEnergy(fillRate), updateRevenue(attendance, ticketPrice)
    return gameAtmosphere

updateFanEnergy(fillRate):
    return clamp(round(fillRate * 3), 1, 3)

updateRevenue(attendance, ticketPrice):
    return round(attendance * ticketPrice, 2)

displayAttendanceUI(gameAtmosphere, zone):
    render header, crowd side panel, or final summary from the saved snapshot
    do not mutate career state or post money

syncAttendanceWithGMOffice(gameAtmosphere, game):
    if attendanceEffectsApplied: return
    mark attendanceEffectsApplied
    on every fifth tracked home game, if fillRate >= 0.95:
        add 1 owner patience, capped at 100, unless already fired
    compare with previous ten tracked home games
    if fill rate rose at least 10 percentage points after a recent major trade:
        add one contextual Attendance entry per trade to Decision Log

beforeSimulation:
    capture prices, arena capacity, current form, opponent quality and sentiment
    calculate gameAtmosphere

afterSimulation:
    attach the captured atmosphere to the saved game
    synchronize attendance effects once
    regular season: existing daily finance processing posts this game's snapshot
    postseason: post ticket revenue immediately, then mark the result as posted
```

Attendance and energy are dynamic across games, but fixed within a saved game. Playback is a replay of simulated events; pausing, changing speed, returning to a result or changing prices later cannot reroll its crowd or repost revenue. Energy is based on occupancy, not scoring runs; score-reactive energy would require an additional formula.

## Courtside layout

- Header below the scoreboard: attendance count, percentage capacity filled, one to three flame icons, and a tooltip accessible through hover or keyboard focus.
- Collapsible Game Atmosphere section below the attendance header (closed by default): Revenue This Game, Season Avg Attendance, ticket price, a small graph of the last ten tracked home crowds, and a labeled sentiment meter. The graph includes tonight and has a text alternative.
- Mobile: the same collapsible section keeps crowd details out of the full-width game feed. Its open state and keyboard focus survive playback updates. Existing play-by-play scroll-container preservation remains in place.
- Final buzzer (inside Game Atmosphere) and saved result: a crowd summary generated from the actual pregame winning streak, healthy visiting star, sentiment and price effects, followed by ticket revenue and flames. No invented winning streaks or stars.

## GM Office and fan dashboard

The Office Overview contains a Fan & attendance dashboard with the latest home-game snapshot, current sentiment, the existing regular-season ticket-price control, and a link to home/road rankings. Its season average covers tracked home games in all competitions and includes the current game; the existing league attendance rankings remain regular-season only. Before any tracked home game, it shows an honest empty state.

Changing the Office price uses the existing save, validation and Decision Log path. Front office and Finances projections use the same attendance calculation; actual game results use the frozen pregame snapshot.

Wins and losses change the recent-form sentiment component; trades retain their existing immediate fan reaction. Owner boosts are deliberately modest: one point on each fifth tracked home game if that game's arena is at least 95% full. Existing dismissal and owner-goal rules remain effective.

A major trade is one with a currently rostered incoming player rated at least 85 OVR, in the current season and within ten subsequent team games. An attendance alert requires at least one prior tracked home game and a 10-percentage-point lift over the previous ten tracked home games (or all available when fewer). The alert records correlation, with opponent, results and price acknowledged as other factors. It is deduplicated per trade and does not add another fan reaction.

## Persistence and compatibility

`gameAtmosphere` is stored on the game result, validated on import/load, and survives save/export/reload. The optional result-level flags `attendanceEffectsApplied` and `attendanceRevenuePosted` protect against duplicate effects and postings. Regular-season finance attendance records reuse the same crowd and occupancy values, keeping rankings consistent with Courtside. Postseason finalization skips already posted games.

Old games without atmosphere data remain loadable and display attendance as unrecorded. Historical crowds are not fabricated. New tracked season averages/trends exclude games without an atmosphere snapshot; existing ranking records are preserved.

## Verification

Focused attendance tests cover capacity bounds, ticket-price sensitivity, exact ticket accounting, season snapshots, read-only UI/replay behavior, save round trips, rejection of inconsistent revenue, older saves, postseason deduplication, and trade alert deduplication. Existing Decision Log checks also pass. The existing live-box test fails its tip-off zero-stat assertion on both the original source and the updated source. Browser visual verification was unavailable for this static site's managed preview configuration.
