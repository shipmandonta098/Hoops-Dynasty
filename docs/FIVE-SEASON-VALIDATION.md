# Five-season continuous headless validation

Source: db17ec03f3d0e2961e7a89611ffba74c7a859391. Seed: 2026. Requested: 5 continuous seasons. Result: **PASS**. No production engine or balance changes. Existing validators remained enabled; additional read-only diagnostics stop on the first failure.

## Season results

| Season | Games | Seconds | Live players | Roster avg age | Roster avg OVR | Drafted | Retired | Champion | Integrity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026 | 1319 | 258.12 | 515 | 26.91 | 77.84 | 60 | 0 | Houston Comets | passed |
| 2027 | 1315 | 313.86 | 580 | 27.28 | 78.29 | 60 | 0 | Detroit Motors | passed |
| 2028 | 1309 | 287.82 | 645 | 27.85 | 78.78 | 60 | 0 | Denver Summit | passed |
| 2029 | 1307 | 345.19 | 710 | 28.48 | 79.45 | 60 | 0 | Chicago Union | passed |
| 2030 | 1308 | 417.03 | 774 | 28.94 | 79.74 | 60 | 1 | Chicago Union | passed |

Total games: 6558. Total seconds: 1622.24. Average seconds per completed season: 324.45. Fastest: 258.12 seconds. Slowest: 417.03 seconds.

## Population and draft pipeline

Live players means rostered + free agents + unsigned rights; upcoming prospects are separate. Counts are after rollover; aging also includes players retiring during that rollover. Talent metrics use rostered players after rollover.

| Season | Live at start | Rostered | FA | Rights | Prospects available | Drafted / retained | Undrafted | Next class | Retired | Aging correct / checked | Aging failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026 | 450 | 429 | 57 | 29 | 90 | 60 / 60 | 30 | 90 | 0 | 515 / 515 | 0 |
| 2027 | 515 | 429 | 83 | 68 | 90 | 60 / 60 | 30 | 90 | 0 | 580 / 580 | 0 |
| 2028 | 580 | 427 | 112 | 106 | 90 | 60 / 60 | 30 | 90 | 0 | 645 / 645 | 0 |
| 2029 | 645 | 427 | 140 | 143 | 90 | 60 / 60 | 30 | 90 | 0 | 710 / 710 | 0 |
| 2030 | 710 | 429 | 165 | 180 | 90 | 60 / 60 | 30 | 90 | 1 | 775 / 775 | 0 |

Undrafted prospects are discarded by the existing draft rollover; they are not automatically converted into free agents. Ordinary unsigned rights can retain prior contract metadata but are not active signed roster contracts. No historical pruning was added.

## Talent health

| Season | Avg OVR | Avg POT | Min OVR | Max OVR | 90+ | Avg age | Youngest | Oldest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026 | 77.84 | 84.78 | 63 | 97 | 26 | 26.91 | 20 | 34 |
| 2027 | 78.29 | 85.24 | 63 | 99 | 32 | 27.28 | 20 | 35 |
| 2028 | 78.78 | 85.97 | 61 | 99 | 37 | 27.85 | 20 | 36 |
| 2029 | 79.45 | 86.72 | 60 | 99 | 41 | 28.48 | 20 | 37 |
| 2030 | 79.74 | 87.13 | 62 | 99 | 45 | 28.94 | 20 | 38 |

## Regular-season statistical health

Measurements taken before offseason. Offensive rating below is derived as PPG / recorded possessions per team-game × 100, not a separately stored advanced statistic.

| Season | Team PPG | FG% | 3P% | FT% | Recorded possessions | Derived OffRtg |
| --- | --- | --- | --- | --- | --- | --- |
| 2026 | 124.01 | 49.95 | 39.48 | 76.27 | 102.10 | 121.46 |
| 2027 | 124.24 | 49.95 | 39.53 | 76.68 | 102.13 | 121.66 |
| 2028 | 123.25 | 49.69 | 39.64 | 76.45 | 102.16 | 120.64 |
| 2029 | 124.09 | 49.96 | 39.83 | 76.76 | 102.08 | 121.56 |
| 2030 | 123.77 | 49.87 | 39.64 | 76.34 | 102.17 | 121.14 |

## Memory

Node process measurements; garbage-collection timing affects heap/RSS. Sampled peak heap is not an exact peak or proof of a leak. No forced garbage collection.

| Checkpoint | Heap MiB | RSS MiB |
| --- | --- | --- |
| Start | 20.88 | 68.21 |
| 2026 rollover | 159.85 | 511.11 |
| 2027 rollover | 186.89 | 575.86 |
| 2028 rollover | 142.21 | 600.91 |
| 2029 rollover | 88.77 | 673.72 |
| 2030 rollover | 284.32 | 745.74 |
| Finish | 293.13 | not separately sampled |
| Sampled peak heap | 533.90 | not measured |

## Collection growth after rollover

| Season | Live | Retired | Player season rows | Postseason rows | Team season rows | Hall people | Hall season rows | Draft picks archived | News | Decision log |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026 | 515 | 0 | 420 | 222 | 30 | 516 | 516 | 60 | 500 | 13 |
| 2027 | 580 | 0 | 849 | 447 | 60 | 543 | 1059 | 120 | 500 | 13 |
| 2028 | 645 | 0 | 1278 | 672 | 90 | 569 | 1628 | 180 | 500 | 22 |
| 2029 | 710 | 0 | 1705 | 898 | 120 | 598 | 2226 | 240 | 500 | 26 |
| 2030 | 774 | 1 | 2132 | 1123 | 150 | 626 | 2852 | 300 | 500 | 34 |

| Season | Completed game logs | Box rows before rollover | PBP strings | Replay frames | Games after rollover | Awards seasons | Draft archives | Champions archives | League history |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026 | 1319 | 36932 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
| 2027 | 1315 | 37595 | 0 | 0 | 0 | 2 | 2 | 2 | 2 |
| 2028 | 1309 | 37417 | 0 | 0 | 0 | 3 | 3 | 3 | 3 |
| 2029 | 1307 | 37185 | 0 | 0 | 0 | 4 | 4 | 4 | 4 |
| 2030 | 1308 | 37225 | 0 | 0 | 0 | 5 | 5 | 5 | 5 |

## Integrity checks

| Season | Roster contracts checked | Next schedule games | Games per team | Completed playoff series | Integrity |
| --- | --- | --- | --- | --- | --- |
| 2026 | 429 | 1230 | 82 | 15 | passed |
| 2027 | 429 | 1230 | 82 | 15 | passed |
| 2028 | 427 | 1230 | 82 | 15 | passed |
| 2029 | 427 | 1230 | 82 | 15 | passed |
| 2030 | 429 | 1230 | 82 | 15 | passed |

Checks include existing aging/DOB oracle, duplicate live IDs, retired/active exclusion, roster bounds, team references, standings against results, every scheduled regular-season result exactly once, complete playoffs, one champion archive, draft retention, prospect class sizes, contract structure and expiration, live-player retention through offseason, stable player identities, retirement history, and the existing save validator. Production code was not changed. Detailed aging rows and IDs are in the JSON evidence.

## Failures

Aging, roster, contract, draft, schedule, playoff, and other integrity failures: **0**.

## Boundaries and limitations

This is five seasons only, not evidence of 50–100 season readiness. The existing game has retention caps (including 500 news entries, 100 champion seasons, and 30,000 player-season rows); this test did not add or alter them. Runtime measurements include audit overhead and host variability. Root-cause performance profiling has not been performed. No optimization, IndexedDB work, pruning, balance changes, or final multi-season UI was implemented.

## Trends and next investigation

Performance: degrading overall, with host/run variability. Season 5 took 61.6% longer than Season 1; Season 3 was faster than Season 2, so growth is not strictly monotonic. No cause was proven by profiling.

Data: free agents grew 57 → 165; unsigned rights 29 → 180. Live population grew 450 at initialization to 774 after the final rollover, while rosters stayed around 427–429. There was one retirement: [{'id': 791, 'name': 'Cheikh Gueye', 'historySeasons': 5}]. Ordinary rights have no automatic signing path equivalent to international stash signing; retirement processing primarily examines team rosters. These existing lifecycle patterns merit investigation, not an automatic fix.

Talent after rollover: average OVR 77.84 → 79.74; POT 84.78 → 87.13; age 26.91 → 28.94; 90+ players 26 → 45. Measure this drift further before changing balance.

Statistical trend: PPG 124.01 → 123.77; pace 102.10 → 102.17. Full shooting measurements appear above.

Next bottleneck to investigate: persistent player-pool growth and the amount of historical state processed during saves/daily work. No optimization or lifecycle correction was made in the five-season test.
