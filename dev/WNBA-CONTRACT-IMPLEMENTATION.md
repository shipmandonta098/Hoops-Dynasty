# Historical WNBA contract implementation

Implementation against Hoops Dynasty source version 204 (baseline commit `31d82349a6139809e8c9d5eb7341731b93b24375`). October 12, 2026.

## Result and scope

New historical WNBA careers resolve a dedicated integer-dollar registry before player generation. Contracts, rookie schedules, human and AI offers, demands, extensions, draft rights, trades, cap payroll, waivers, annual progression and opt-in save repair use the WNBA paths. NBA behavior remains on the legacy paths. This fixes the production NBA-scale salary defect; it is not a complete reproduction of every CBA administrative procedure. The limitations below remain explicit in the game.

No exact individual historical player contracts are claimed: this game generates fictional players. Initial salaries, service histories and one-year unprotected agreements are labeled estimates. Verified rookie schedules retain their cohort and fourth-year option. Higher ratings produce higher estimated market salaries within individual limits, with team-wide budget allocation at league creation.

## Root cause

1. `historical-era-profile.js` reset contract fields to NBA defaults; `historical-settings.js` only supplied WNBA finances for 2003 onward. Thus 1997 retained a $1M minimum, $52.5M maximum and $150M soft cap.
2. `game.js` generated OVR-based NBA salaries. Setup later multiplied salaries by cap/150; the retained $150M value left 1997 contracts unchanged. Per-player clamping did not ensure aggregate team legality.
3. Free-agent quote wrappers rounded to $100,000 before the historical precision adapter. WNBA offers consequently collapsed toward the maximum. Drafts used a generic declining NBA-style scale, extensions rewrote the current salary, and trade previews counted dead money twice.

## Actual 1997 before and after

Seed 440, production script load order, default 30-team definitions. Independent new-career runs, not manually edited settings. Initial roster counts changed from the inherited 14 to the explicitly modeled 11; random generation order and some ratings therefore differ. All shown salaries are fictional estimates.

| Setting | Original game | Corrected game |
|---|---:|---:|
| Minimum | $1,000,000 | $15,000 (`0.015` million) |
| Ordinary maximum | $52,500,000 | $50,000 (`0.05` million) |
| Team limit | $150,000,000 soft cap | $600,000 explicitly estimated simulation budget |

The 1997 $600,000 budget is **not** a historical cap. It is an explicit operating limit of 12 × $50,000 in a period of centralized league contracts, with no verified team cap.

| Fictional player | OVR before → after | Salary before | Salary after |
|---|---:|---:|---:|
| Kayla Grant | 83 → 67 | $14,300,000 | $19,520 |
| Aaliyah Brooks | 79 → 79 | $12,200,000 | $29,687 |
| Brianna Hayes | 78 → 75 | $11,700,000 | $25,773 |
| Danielle Lewis | 78 → 76 | $11,700,000 | $26,704 |
| Jasmine Okafor | 77 → 83 | $11,100,000 | $34,087 |

| Team | Original payroll | Corrected payroll |
|---|---:|---:|
| Atlanta | $142,200,000 | $304,932 |
| New York | $148,000,000 | $316,127 |
| Los Angeles | $156,300,000 | $282,707 |

Every generated player and all 30 team payrolls were checked for each of the 30 supported years, not only these displayed samples.

## Annual registry

Nominal annual USD. Minimum entries list service thresholds; pre-2008 service thresholds are model estimates even when salary amounts are documented. `Estimated` is not verified history. Special maxima require qualifying rights and service; they are never awarded just for OVR. Team floors are season-end shortfall obligations, not a requirement that every transaction immediately reach the floor.

| Season | Minimum tiers (years: dollars) | Ordinary max | Eligible max | Team cap / model budget | Team floor | Evidence / agreement |
|---|---|---:|---:|---:|---:|---|
| 1997 | 0+: $15,000 | $50,000 | Not documented | $600,000 | Not documented | simulation estimate cap; verified max; partly estimated minimum; Pre-CBA centralized contracts |
| 1998 | 0+: $15,000 | $62,500 | Not documented | $750,000 | Not documented | simulation estimate cap; verified max; partly estimated minimum; Pre-CBA centralized contracts |
| 1999 | 0+: $25,000; 1+: $30,000 | $70,000 | Not documented | $840,000 | Not documented | simulation estimate cap; simulation estimate max; amounts verified service threshold estimated minimum; 1999 CBA (historical reporting) |
| 2000 | 0+: $26,500; 1+: $32,500 | $75,798 | Not documented | $909,576 | Not documented | simulation estimate cap; simulation estimate max; amounts verified service threshold estimated minimum; 1999 CBA (historical reporting) |
| 2001 | 0+: $28,000; 1+: $35,000 | $77,500 | Not documented | $930,000 | Not documented | simulation estimate cap; simulation estimate max; amounts verified service threshold estimated minimum; 1999 CBA (historical reporting) |
| 2002 | 0+: $30,000; 1+: $40,000 | $79,500 | Not documented | $954,000 | Not documented | simulation estimate cap; simulation estimate max; amounts verified service threshold estimated minimum; 1999 CBA (historical reporting) |
| 2003 | 0+: $30,000; 1+: $42,000 | $85,000 | Not documented | $622,000 | Not documented | verified cap; verified max; amounts verified service threshold estimated minimum; 2003 CBA (historical reporting) |
| 2004 | 0+: $30,600; 1+: $43,680 | $87,000 | Not documented | $647,000 | Not documented | verified cap; verified max; amounts verified service threshold estimated minimum; 2003 CBA (historical reporting) |
| 2005 | 0+: $31,200; 1+: $45,427 | $89,000 | Not documented | $673,000 | Not documented | verified cap; verified max; amounts verified service threshold estimated minimum; 2003 CBA (historical reporting) |
| 2006 | 0+: $31,800; 1+: $47,244 | $91,000 | Not documented | $700,000 | Not documented | verified cap; verified max; partly estimated minimum; 2003 CBA (historical reporting) |
| 2007 | 0+: $32,400; 1+: $49,134 | $93,000 | Not documented | $728,000 | Not documented | verified cap; verified max; amounts verified service threshold estimated minimum; 2003 CBA (historical reporting) |
| 2008 | 0+: $34,500; 3+: $50,000 | $95,000 | $97,500 | $772,000 | $675,000 | verified cap; verified max; verified minimum; 2008 CBA |
| 2009 | 0+: $35,190; 3+: $51,000 | $97,000 | $99,500 | $803,000 | $694,800 | verified cap; verified max; verified minimum; 2008 CBA |
| 2010 | 0+: $35,880; 3+: $52,000 | $99,000 | $101,500 | $775,000 | Not documented | reported disputed cap; verified max; verified minimum; 2008 CBA |
| 2011 | 0+: $36,570; 3+: $53,000 | $101,000 | $103,500 | $852,000 | $737,100 | verified cap; verified max; verified minimum; 2008 CBA |
| 2012 | 0+: $37,260; 3+: $54,000 | $103,000 | $105,500 | $878,000 | $759,600 | verified cap; verified max; verified minimum; 2008 CBA |
| 2013 | 0+: $37,950; 3+: $55,000 | $105,000 | $107,500 | $913,000 | $782,100 | verified cap; verified max; verified minimum; 2008 CBA |
| 2014 | 0+: $38,150; 3+: $55,000 | $105,000 | $107,500 | $901,000 | $771,300 | verified cap; verified max; verified minimum; 2014 CBA |
| 2015 | 0+: $38,913; 3+: $55,275 | $107,000 | $109,500 | $919,300 | $786,960 | verified cap; verified max; verified minimum; 2014 CBA |
| 2016 | 0+: $39,676; 3+: $55,550 | $109,000 | $111,500 | $937,900 | $802,890 | verified cap; verified max; verified minimum; 2014 CBA |
| 2017 | 0+: $40,439; 3+: $55,825 | $111,000 | $113,500 | $956,900 | $819,180 | verified cap; verified max; verified minimum; 2014 CBA |
| 2018 | 0+: $41,202; 3+: $56,100 | $113,000 | $115,500 | $976,300 | $835,740 | verified cap; verified max; verified minimum; 2014 CBA |
| 2019 | 0+: $41,965; 3+: $56,375 | $115,000 | $117,500 | $996,100 | $852,660 | verified cap; verified max; verified minimum; 2014 CBA |
| 2020 | 0+: $57,000; 3+: $68,000 | $185,000 | $215,000 | $1,300,000 | $1,088,100 | verified cap; verified max; verified minimum; 2020 CBA |
| 2021 | 0+: $58,710; 3+: $70,040 | $190,550 | $221,450 | $1,339,000 | $1,120,770 | verified cap; verified max; verified minimum; 2020 CBA |
| 2022 | 0+: $60,471; 3+: $72,141 | $196,267 | $228,094 | $1,379,200 | $1,154,340 | verified cap; verified max; verified minimum; 2020 CBA |
| 2023 | 0+: $62,285; 3+: $74,305 | $202,154 | $234,936 | $1,420,500 | $1,188,990 | verified cap; verified max; verified minimum; 2020 CBA |
| 2024 | 0+: $64,154; 3+: $76,535 | $208,219 | $241,984 | $1,463,200 | $1,224,630 | verified cap; verified max; verified minimum; 2020 CBA |
| 2025 | 0+: $66,079; 3+: $78,831 | $214,466 | $249,244 | $1,507,100 | $1,261,440 | verified cap; verified max; verified minimum; 2020 CBA |
| 2026 | 0+: $270,000; 1+: $277,500; 4+: $285,000; 7+: $292,500; 10+: $300,000 | $1,190,000 | $1,400,000 | $7,000,000 | $5,950,000 | verified cap; verified max; verified minimum; 2026 CBA (executed) |

## Contract and transaction behavior

- Monetary registry/schedules/ledger use whole dollars. Existing `salary` storage and `$M` inputs have explicit million-dollar adapters. A stored `0.03` is $30,000. Import validation checks schedule/scalar consistency and rejects invalid monetary metadata.
- Initial leagues are created under the selected league identity and season before salary assignment. Imported old setup presets also resolve the registry before roster creation. Missing WNBA years below the supported range fail explicitly; they never inherit NBA salaries. Post-2026 continuation uses a labeled 2026 fallback, not invented future figures.
- Offers validate individual terms and all populated salary years, then team payroll and minimum-roster reserves. Pending offer sheets reserve payroll. Human and AI routes use the same checks; ordinary offers cannot use Bird, MLE or minimum exceptions.
- Rookie draft/signing routes use exact 2008–2026 entry-cohort arrays, three years plus a pending fourth-year option; unsupported early bands are one-year labeled estimates. Full rosters/cap failures retain unsigned rights. Options must be exercised explicitly; AI evaluates affordable options. The conservative game deadline is preseason after year two.
- Veteran extensions require an eligible multi-year agreement and first anniversary, obey the era’s 104%/102%/120%/130% first-year limits, and append future years without changing original salaries. Eligible rookie extensions require an exercised fourth-year option and the post-third-season signing window. EPIC renegotiation is not offered.
- New negotiated agreements currently use flat annual salaries; the validator contains the governing linear annual-change ceiling. Rookie schedules and mandatory minimum adjustments are separate. Service/rights histories are explicit; unknown initial continuity does not earn a special maximum.
- Active salary and retained obligations form the cap ledger. Guarantee amounts are a subset, not a second charge. Waiving a protected contract retains owed amounts; unprotected contracts retain earned pay and midpoint protection. Injured-player waivers are blocked pending injury-protection review instead of granting unsupported relief.
- The 2026 four-plus-year minimum cap-charge rule uses $277,500 while keeping the player’s higher applicable cash salary. Lottery rookies receive first-year protection; 2026 first/second-year protection vests at the modeled regular-season boundary, and option exercise protects the required years.
- Trades use post-transaction ledgers, prohibit cash/retained salary, and preserve contract schedules. Legacy duplicate dead-money checks are bypassed only in the WNBA branch.
- Emergency replacement authorization is separate from cap space: fewer than 10 able regular players, supported CBA year, named replacement, documented approval reason, salary amount and return/season termination. Payroll still includes the replacement; only its recorded allowance authorizes overage. Ordinary hardship and unverified emergency years are not automatically granted.

## Progression and compatibility

New WNBA careers enable annual financial progression. Each new transaction resolves its financial season, including next-season offseason offers before the calendar increments. Signed annual schedules remain intact. Applicable mandatory minimum uplifts are logged and preserve the guarantee percentage. Projected cap conflicts block discretionary spending/rollover rather than deleting players or cutting signed salaries.

Existing saves remain legacy until an explicit repair; ordinary load/import does not rewrite them. Repair adopts a frozen historical environment by default, preserving the old one-time policy until the user enables progression. Financial Progression can be toggled in Finances. NBA save format and legacy engine remain supported.

## Safe repair workflow

Open **Finances → Preview contract repair** (also linked from Settings). Preview is pure and lists current/proposed amounts, classification, proposed roster actions and all team payrolls. The old save lacks definitive provenance: formula matches are labeled suspected, not proved. The user selects the contracts they recognize as generated incorrectly. Valid or unselected custom contracts and existing dead salary remain. Custom/ambiguous financial settings block automatic repair.

A selected faulty agreement becomes an explicitly estimated one-season agreement. If an old 14-player roster exceeds the new limit, the preview separately identifies its lowest-rated selected players proposed for free agency; their IDs and statistical records remain. Preserved players cannot be moved by this repair. The confirmation approves those visible actions.

The full database is exported and imported into a separate backup career, including archive/game/box-score tables, **before** the original career is changed. Backup failure aborts repair. A state fingerprint prevents stale preview application. Version 1 metadata makes repeat repair a no-op. No user’s browser save was accessed or repaired during development.

## Remaining gaps and conservative restrictions

These are implementation/research limitations, not verified exceptions:

- 1997–2002 team budgets are estimates; 1999–2002 legal maximum evidence is incomplete. The 2001 operating maximum is an explicit estimate. Separate 1997–1998 veteran minimums are unknown.
- Full 1999/2003 CBA text, complete early rookie bands, early service thresholds/terms/guarantees and some roster rules remain incomplete. Early contracts use conservative one-year modeling; the 2006 veteran minimum is estimated.
- 2010 uses the reported $775,000 cap, explicitly disputed against the unamended $827,000 schedule. The exact amended team floor is unavailable.
- Exact conversion of pre-2026 rookie cohorts to the final 2026 agreement is unresolved. Progression with affected rookie-scale obligations is blocked; the user may explicitly freeze the financial environment to continue. New 2026 rookie contracts use the final executed scale.
- Qualifying/core-offer issuance and statutory offseason roster holds are not fully modeled. RFA matching requires recorded qualifying-offer eligibility; missing rights are not automatically invented. AI uses a conservative roster-budget reserve.
- Two developmental slots, EPIC, ordinary hardship medical adjudication, pregnancy/season-ending-injury exceptions, special suspension relief, grievance settlements, and arbitrary contract amendments/waiver claims are not implemented. Unsupported relief cannot bypass the hard cap. WNBA expansion allocation is blocked until its historical assignment rules are modeled.
- Daily earned-salary proration follows the simulation calendar; exact real-life payroll dates are not reproduced. Initial historical player/service data are generated estimates. Existing NBA-scale business revenue/coach budgets are not converted by this player-contract change.

## Files changed

New production files: `dist/wnba-financial-data.js`, `dist/wnba-contracts.js`, `dist/wnba-gameplay.js`, `dist/wnba-repair.js`.

Integration changes: `dist/index.html`, `game.js`, `setup-league-settings.js`, `league-settings.js`, `free-agency.js`, `draft.js`, `international-players.js`, `trade-logic.js`, `trade-center.js`, `trade-block.js`, `morale.js`, `expansion.js`. NBA branches retain their prior behavior.

Regression files: `dev/test-wnba-contracts.cjs`, `test-wnba-offseason.cjs`, `test-wnba-repair-storage.cjs`, `test-wnba-season.cjs`; measured evidence: `dev/wnba-contract-verification.json`.

## Verification

- `node dev/test-wnba-contracts.cjs`: all 30 years; actual initial contracts/payrolls, differentiation, JSON round trips, exact-cap/$1-over, human and AI signings, rookies/options, extensions, waivers, trades, emergency replacements, progression/freeze, currency, repair and a seeded NBA full-state equivalence control.
- `node dev/test-wnba-offseason.cjs`: actual lottery/draft and AI bidding to legally full rosters, then the production `newSeason()` path for 1997→1998, 2008→2009, 2014→2015, 2020→2021, 2025→2026, and 2026→2027 fallback. Four-team offseason fixtures, not historical team reconstructions.
- `node dev/test-wnba-season.cjs`: 15 real simulated games in a four-team/six-regular-game fixture, then playoffs, draft, free agency, 1998 rollover and persistence validation.
- `dev/test-wnba-repair-storage.cjs` with fake-indexeddb: actual repository backup/import, backup failure preservation, persisted repaired ledger/contracts, reload and repeat-repair idempotence.
- Existing `dev/test-historical-settings.cjs`: all 111 NBA/WNBA preset previews and representative creation, precision, form and save controls.
- Existing `dev/test-indexeddb.cjs`: atomic persistence, old-save migration, multi-tab conflict rejection, archives, backup/import, corruption rejection and historical preservation.
- JavaScript syntax and `git diff --check`. Browser interaction/visual QA was unavailable in this environment; it is not claimed.

## Source register

- **early** — [Historical reporting; early centralized contracts, not 2026 negotiations](https://abc7ny.com/post/road-1m-paydays-how-wnba-salaries-evolved-each-cba/18540983/)
- **1999** — [1999–2002 minimum salary schedules](https://www.deseret.com/1999/4/15/19440119/key-points-of-wnba-wnbpa-collective-bargaining-agreement/)
- **2007** — [2003–2007 CBA reporting](https://slamonline.com/wnba/the-state-of-the-wnba-cba/)
- **2010** — [Reported 2010 $775,000 actual cap; unamended 2008 CBA schedules $827,000](https://www.swishappeal.com/2009/12/22/1210230/ann-meyers-drysdale-mercury-not)
- **cba2008** — [Articles V–VII; Exhibit 5](https://www.ipmall.law.unh.edu/sites/default/files/hosted_resources/SportsEntLaw_Institute/2008WNBA_WNBPA_CBA.pdf)
- **cba2014** — [Articles V–VII; Exhibit 5; full archival copy](https://nyc3.digitaloceanspaces.com/sportsarchive-documents/prod/60f617a46431e/WNBA-CBA-2014-2021Final.pdf)
- **cba2020** — [Articles V–VII; Exhibit 5 (2020–2025 only)](https://www.wnbpa.com/_files/ugd/575289_1904d7b630624d93a59a904e0d5abffb.pdf)
- **cba2026** — [Final executed agreement May 22, 2026; V, VI, VII and Exhibit 5](https://www.wnbpa.com/_files/ugd/8121a3_675911316ca142178932adc1e56519ac.pdf)

The prior financial and hard-cap audit reports contain the extended historical evidence discussion. The production registry stores source keys and per-year gaps alongside the implemented figures. Final 2026 values come from the executed CBA, not superseded negotiation projections.
