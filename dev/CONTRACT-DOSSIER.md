# Contract dossier v1

## Implemented

The existing player Contract tab now contains seven sections in the requested order. It uses integer USD for dossier records, converting the legacy engine's million-dollar scalar once at its boundary. The WNBA annual ledger remains authoritative; the NBA engine's explicitly flat scalar is used only for recoverable years. No original signing date, previous contract, legacy guarantee, or historical earnings are invented.

- Overview, annual salaries/cap charges/guarantees/options/recorded bonuses, current-year highlighting, salary bars (omitted for a single year).
- Existing extension dialogs and validation; own-team eligibility/reasons, morale, asking price, modeled term choices, estimated preference and affordability.
- Market estimate shared with real free-agent demands and NBA renewal quotes. Factors include ratings/potential, age, current box-score production, efficiency, minutes, current injury, positional supply and comparable contracts. This is a bounded simulation estimate, not a historical valuation or guaranteed offer. NBA market budgets use a cap-relative top band rather than pre-maximum-era technical ceilings.
- Correct selected-team payroll, dead money, cap space, payroll share, three-year commitments, applicable tax position, waiver estimate and trade-rule context. Future WNBA fallback and NBA inflation estimates are labeled. Pending options are excluded from committed payroll.
- WNBA rookie option decisions use the existing offseason workflow, now checking future hard-cap room before exercise. Rejected decisions restore the contract and history. WNBA extension entry and submission both enforce morale refusal.
- Persistent history of observed signings, extensions/changes, transfers and departure from the active pool. Trades retain the signing record. Retired/inactive histories remain accessible through Hall of Fame → Recorded Contract Histories.
- Recorded active salary earnings accrue by elapsed regular-season calendar days, with an idempotent per-player cursor. This is explicitly a partial earnings record, not total signed value or a claim of known lifetime earnings.
- Agreement mechanics moved into compact expandable Contract Rules help; all other profile tabs remain unchanged.

## Storage and integration

Optional `state.contractBook = {version:1, startedYear, startedDay, people}`. Stable player IDs key people; each holds records, original known signing identity, annual schedule snapshots, audit events, earnings by season/team, and accrual cursor. It is stored in the normalized database's existing league core; no IndexedDB version change or destructive migration. Validation preserves and checks it. The WNBA contract object is not duplicated as a second transaction engine: records are observational history; live figures always resolve from existing models.

A new career captures a baseline. Loading an older career initializes only recoverable current terms on first use. Signing, draft, option, extension, trade, release, save and season/day boundaries reconcile records. Save failure restores the previous history. Actual player salaries and expiration dates are not rewritten by migration. The WNBA repair preview initializes bookkeeping before taking its fingerprint.

## Historical coverage and sources

Reuses `wnba-financial-data.js`: 30 individual entries, 1997–2026, with field evidence and gaps. Sources include the 1999 reporting, 2008/2014/2020 CBAs and final executed 2026 CBA. Early simulation budgets remain explicitly estimates. No individual historical contract is asserted. Existing WNBA early-extension blocks, unsupported hardship restrictions and 2026 legacy-rookie transition stop remain intact.

- WNBPA final 2026 CBA: https://www.wnbpa.com/_files/ugd/8121a3_675911316ca142178932adc1e56519ac.pdf
- Official confirmation of final executed 2026 agreement: https://www.wnba.com/news/wnba-and-wnbpa-execute-long-form-collective-bargaining-agreement
- WNBPA 2020 CBA: https://www.wnbpa.com/_files/ugd/575289_1904d7b630624d93a59a904e0d5abffb.pdf
- NBA union CBA repository: https://nbpa.com/cba
- Additional season-level sources remain alongside the existing WNBA registry and NBA historical preset tables.

NBA uses existing historical preset cap, minimum, maximum, term, rookie and tax settings. NBA historical presets retain their existing one-time/frozen behavior; configured inflation still applies. This change does **not** provide complete historical NBA CBA enforcement.

## Remaining scope / limitations

This is not the entire comprehensive specification. Player-option creation and AI exercise, no-trade clauses, trade kickers, signing/performance bonuses, two-way deals, designated/supermax eligibility, detailed NBA service tiers/extension windows/aprons and complete era-specific trade exceptions remain unimplemented. Unsupported clauses/classifications are never fabricated. WNBA core designations, qualifying-offer holds, special suspensions and other accounting gaps remain documented by its existing registry/help.

Historical earnings before tracking began, off-roster guaranteed payouts, settlements and unmodeled bonuses are not counted as recorded earnings. Legacy signing teams/lengths unavailable in old data remain unavailable. Current injury is valued; unavailable longitudinal injury history is not invented. NBA guarantees on legacy contracts remain unknown even though its existing waiver engine retains full salary; new observed NBA agreements reflect that existing full-obligation model. Annual varying salaries are supported through the authoritative WNBA schedule; no new NBA escalating/decreasing schedule authoring engine was introduced.

## Verification

- `node dev/test-contract-management.cjs`: seven UI sections, unchanged legacy salaries, transfers without duplicate signings, projection equality, production-sensitive valuation, accrual idempotence, currency, all 30 WNBA seasons with individual legality and team cap checks.
- `HD_TEST_NODE_MODULES=/tmp/hd-family-tests/node_modules node dev/test-contract-storage.cjs`: real simulated day, normalized IndexedDB, load validation, identical records/salaries, legacy migration, invalid schedule rejection.
- `node dev/test-contract-transactions.cjs`: WNBA option exercise, cap rejection and rollback, closed window rejection, extension preserving original salary years, history and future cap.
- `node dev/test-contract-nba.cjs`: seeded NBA generation unchanged except bookkeeping; actual draft/AI market/rollover for 1984, 1997, 2014 and 2026.
- `node dev/test-wnba-offseason.cjs`: six actual offseason transitions, including 2025→2026 (12-player incoming minimum) and 2026→2027 labeled fallback.
- `node dev/test-wnba-season.cjs`: real basketball through playoffs, draft, AI free agency, 1998 rollover and save validation.

The older `test-wnba-contracts.cjs` passed its first two contract/cap/transaction blocks but its legacy-baseline phase is stale: it reads today's HEAD while removing WNBA files, leaving current setup code calling missing `wnbaRules`. Its full run is not claimed as a pass; new dedicated suites provide the relevant coverage.

Responsive CSS uses wrapping cards and horizontally scrollable tables. Browser rendering QA was unavailable under the supported Sites workflow; no visual/browser test pass is claimed.
