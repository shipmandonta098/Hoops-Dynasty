# Clutch moments and player feats

Implemented in the existing production simulator, News Feed and Courtside Game Summary. No additional simulation engine or random draws were introduced. City photographs and existing dashboard assets are unchanged.

## Production files

- `dist/attributes.js`: additive chronological action ledger for made/missed shots, free throws, explicitly credited blocks and steals, defensive/offensive rebounds and credited assists. Stores millisecond clock, period, playback index, player ID, side, shot value, score before/after and sequence. Scoring recognition timestamps follow the actual scoring narration; the separate box-score prefix ledger retains the first visible score update, including intervening crowd commentary. No shooting/fatigue/coaching probabilities changed.
- `dist/player-feats.js`: centralized recognition, importance thresholds, publication, archived game snapshots, observed scoring records, career/profile navigation and validation. Loaded after existing play/validation wrappers.
- `dist/game-summary.js`: validates optional new event fields; replaces the former last-lead-change winner shortcut with shared feats. Existing runs, lead chart, box score and legacy recoverable highlights remain.
- `dist/news-feed.js`: one Player Feat category, stable feat references, clickable team logos, player/portrait links and archived summary action. Keeps existing filters/grouping/styles and 500-item feed limit.
- `dist/index.html`: registers the module and refreshes changed script cache keys.

## Recognition rules

The decisive score changes a tie/deficit to the eventual winner's lead and is followed only by scores that preserve that lead. A later tie invalidates an earlier candidate. This includes free throws and overtime. Only a decisive score in the last **30 seconds of the final period actually played** receives clutch-winner priority. Earlier permanent-lead scores remain lower-priority summary information.

A buzzer-beater requires a made field goal at the exact recorded period boundary and no subsequent basketball action in that period. Seconds remaining alone do not qualify. Tying, halftime, period-ending and winning classifications are distinct. This simulator records action time, not separate ball-release/flight time; the classification follows that model.

Blocks require explicit defensive credit on a potential tying/winning shot. Sealing steals/rebounds require a winning margin of 1–3, the final 10 seconds, and no later opponent scoring attempt or offensive rebound. These are deliberately conservative: a routine miss does not create individual defensive credit.

Other recognized feats include decisive assists, high-scoring periods, scoring bursts in the final three minutes, exceptional overtime scoring, individual leaders of a final-regulation-period comeback from 15+, triple/quadruple doubles, 30/20 double-doubles, and exceptional points/rebounds/assists/three-pointers.

Statistical thresholds are simulation tuning values, **not verified historical records**. NBA baseline recognition is 50 points / 25 rebounds / 20 assists / 10 threes; WNBA is 35 / 18 / 12 / 7. Game duration and bounded pace/shooting-environment factors scale thresholds. Period thresholds also scale for historical halves. The environment is snapshotted so a later season's rules do not reinterpret archived games.

Series context is captured from the actual bracket before play: round label, game number, series length and prior wins. Clinching, elimination survival and Game 7 importance are derived from those wins and the result. No real-world championship history is invented.

## Shared news, live visibility and persistence

- Live highlights use only actions at or before the current playback index. Winner, sealing-defense, final-box and comeback classifications require the completed result. A provisional clutch basket can disappear from winner consideration if the opponent answers.
- Feat IDs derive from year/day/home/away/stage, action sequence, classification and player ID. News and final summary use the same stored recognition; names are presentation, not relationships.
- `FEAT_POLICY` holds developer-configurable timing, importance cutoff and publication limits. At most **two news stories per game**, one per player, are selected by importance. Routine highlights can still appear in the summary.
- Additive `state.playerFeats.version = 1` stores tracking start, current-season processed IDs, scoring high-water marks and significant game entries. Each entry contains the shared feats, publication IDs, actual series context and a final box/scoring/action snapshot. Replay animation frames are not duplicated.
- Significant entries survive season rollover and player removal/retirement. Active profiles and family profiles expose their memorable performances and archived summaries. Feed retention does not delete achievements.
- Old saves without the new fields load without modification. Old games lacking the action ledger do not acquire inferred game-winners or defensive feats. No backfill/news publication occurs on opening a result.
- JSON import/validation and the existing normalized repository's core/game split retain the fields. No IndexedDB schema version change is required.

## Verification actually run

`node dev/test-player-feats.cjs`

- Deterministic cases: winning 1/2/3-point scores, overtime-forcing tie, lost clutch lead, exact buzzer versus one second remaining, early permanent lead, block/steal/rebound, later-possession disqualification, fourth-quarter comeback, live-prefix safety, Finals Game 1 and Game 7 clinch, observed personal/league highs, legacy fallback, repeat publication, archive navigation and validated JSON round-trip.
- **40 paired seeded games** against the previously shipped engine: identical final scores and complete player box scores. NBA/WNBA identities, four quarters and two halves; event provenance and live-prefix safety checked. Captured scoring clocks match the scoring play-by-play lines. Two defensive seals occurred in this sample. No overtime occurred in the random sample; overtime recognition was tested with explicit event fixtures.
- Production day advancement plus validated save/load, repository splitting and repeat finalization.
- Detailed counts: `dev/player-feat-simulation-results.json`. Eligible highlight counts are not published story counts.

`node dev/test-player-feat-presets.cjs`

| Preset rules | Actual games | Published stories | Archived games |
|---|---:|---:|---:|
| NBA 1950 | 9 | 1 | 1 |
| NBA 2026 | 9 | 3 | 2 |
| WNBA 1997 (two 20-minute halves) | 6 | 1 | 1 |
| WNBA 2020 | 7 | 4 | 3 |
| WNBA 2026 | 9 | 6 | 3 |

These are six-day tests using six-team custom calendars with historical game/financial rules, not recreations of complete real historical schedules. All 40 games passed event provenance, summary availability, validated save/load and reopening without duplicate publication.

`node dev/test-player-feat-career.cjs`

- NBA and WNBA: **33 games each** across a complete custom 10-game-per-team season and playoffs, actual series context, offseason progression, next-year save/load, retained game snapshots, career links and summary reopening.

`node dev/test-gm-seasons.cjs`

- Existing regression suite passed two custom seasons per league: **132 games total**, AI/offseason management, repeated rollover, save/load and rehiring.

Additional checks: production JavaScript syntax, `git diff --check`, explicit Conference Final/elimination context, and 39 unchanged city-photo directory files.

## Limits

- There is no complete imported historical single-game records database. Records are accurately labeled **tracked personal/franchise/league/playoff/Finals scoring highs since tracking began**, not unqualified all-time or full-career records. Other statistical categories receive exceptional-performance recognition rather than record claims.
- No generic defender gets credit for an uncredited miss; such plays are omitted.
- Only significant games receive permanent feat snapshots. Their final summaries remain available; old animated play-by-play frames are not duplicated into the feat archive. Archive size grows with accumulated significant games and has not been benchmarked over a 100-year career.
- Actual event timing is no more precise than the existing simulation. Displaying tenths does not imply ball-flight physics.
- Responsive markup uses existing UI classes. Browser visual QA and a real IndexedDB/browser restart test were unavailable in this environment; rendering handlers, serialization, validation and repository splitting were exercised instead.
