# Phase 12 real-data reference notes

## WNBA team-margin spread

`reference-wnba-spread.json` uses official WNBA LeagueGameLog regular-season full datasets. Metric: population standard deviation (divide by N teams) across each team's full-season mean point differential; includes overtime. Not SD of individual game margins.

| Season | Games | Team mean-margin population SD |
|---|---:|---:|
| 2022 | 216 | 5.5163 |
| 2023 | 240 | 5.7947 |
| 2024 | 240 | 5.7180 |
| 2025 | 286 | 5.9797 |

The summary embeds exact source URLs and team-level inputs. Original 2023/24 game logs are in Phase 4/3 respectively; newly downloaded 2022/25 raw responses are in this folder.

## WNBA transition observables

Official WNBA and NBA `synergyplaytypes` endpoints with LeagueID=10 return successful but empty row sets for 2022–2025. These responses are retained. No official leaguewide Synergy frequency was obtained; do not claim otherwise.

Alternative primary-source observable: official CDN play-by-play `qualifiers` contains `fastbreak` on attempts (including misses) and some free throws. `reference-transition-summary.json` records fast-break FGA/all FGA and a reconstructed tagged-possession proxy, with each game's accounting check. They are not interchangeable with Synergy Transition possessions, simulation transition opportunities, or fast-break points.

| Season | Games sampled | Fast-break FGA share | Tagged-control-sequence share |
|---|---:|---:|---:|
| 2022 | 20 | 9.963% | 9.074% |
| 2023 | 20 | 11.119% | 9.923% |
| 2024 | 40 | 10.688% | 9.855% |
| 2025 | 20 | 11.307% | 10.469% |

2022/23/25 samples use 20 evenly spaced regular-season IDs across each complete schedule; 2024 is the existing Phase 6 convenience sample. All 100 pass scoring-accounting checks. Results are descriptive samples, not population censuses or formal calibration gates. Official source pattern: https://cdn.wnba.com/static/json/liveData/playbyplay/playbyplay_1022300001.json . Every downloaded source URL is retained in `reference-pbp-fetch.json`.

## Final-minute foul timing proxy

`reference-foul-delay.json`: Q4, final 60 seconds, fouling team trailing by 3–6 at foul; preceding meaningful event must be its made FG or made final ordinary FT, and the next live event a non-shooting personal/take foul. Substitutions, timeouts and replay allowed. No intervening rebound, shot, turnover, etc. No short-delay cutoff is used to identify intentionality. Elapsed game clock from prior score to foul is a proxy for inbound touch to whistle, because game clock remains stopped before legal inbound touch. It excludes wall-clock inbound delay. Actual deliberate intent and catch timestamp are not annotated, so do not call this directly measured intentional-foul reaction time. Longer delays may represent initial defense before a deliberate foul, or ordinary fouls.

NBA: 134 score-validated retained 2024–25 games; 18 qualifying events, mean 3.328 seconds, median 1.9, empirical p90 6.0. WNBA: 100 sampled games over 2022–25; 11 events, mean 4.018, median 2.4, p90 8.7. Very small samples. Full event descriptions, clocks and timeout indicators retained for inspection. NBA 2 invalid reference files excluded per existing Phase 10 checks.

Reproduce: `python dev/phase12/reference-fetch.py`, `python dev/phase12/reference-fetch-pbp.py`, `python dev/phase12/reference-transition.py`, `python dev/phase12/reference-analyze.py` from the checkout root. Fetch tools use Python stdlib only.
