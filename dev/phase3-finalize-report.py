import pathlib,json,hashlib
p=pathlib.Path('docs/PHASE3-COMPETITIVENESS.md');s=p.read_text();intro='''
## Outcome

Phase 3 demonstrates partial improvement, not a solved competitiveness problem. All 14,700 full-season games completed: 12,300 NBA and 2,400 WNBA, ten seasons per league, seeds 101–110. NBA mean winning margin fell 15.553 → 15.095; WNBA fell 13.468 → 12.707. Both remain above the retained real references. Median margins remain 13 NBA and 11 WNBA.

Two targeted changes were accepted: current-defender fatigue lookup after switches, and modern shot-type/contact/and-one foul calibration. Isolated tests attribute most observed margin improvement to the foul correction. No direct normal-shot accuracy curve, player rating, home-court parameter, spread formula or comeback mechanism was changed.

Tradeoffs and unresolved results: NBA home wins rose 59.03% → 59.47%; WNBA declined 59.08% → 58.13%. Three-point accuracy moved farther below the reference (NBA 33.28%, WNBA 30.55%). Overall eFG%/TS% moved closer to the references, but that does not validate the shot-type mix. WNBA 50+ margins increased from 4 to 7 games out of 2,400; those tails are too sparse for a confident direction claim. Several paired-seed tail intervals include zero. The report does not claim universal or statistically decisive improvement in every blowout bin.

The strongest remaining investigation targets are minutes/attribute-aware team quality, home advantage, shot-type efficiency and shared pace/scoring covariance. The ablations do not support indiscriminate rating compression or variance suppression. Historical testing verifies formats and event integrity, not historical statistical calibration.

'''
s=s.replace('\n## NBA\n', '\n'+intro+'## NBA\n',1)
s+='''
## Verification and changed-file detail

- Production: `dist/attributes.js`, possessionCore at lines 86 and 138; `dist/index.html`, attributes script cache key.
- Test plumbing: `dev/audit-competitiveness.cjs`, `dev/load-league.cjs`, `dev/test-player-feats.cjs` (variant-aware deterministic replay; the initial failure compared different engines and is retained in exploratory logs).
- Reproduction: `dev/phase3-transform.cjs` is the original tested transform. `dev/phase3-candidate.cjs` now reads the hash-verified audit-only Phase 2 snapshot through `dev/phase3-baseline-source.cjs`; it produces the exact production attributes bytes. The snapshot is not included in runtime scripts.
- Diagnostics and report generators: `dev/phase3-*.cjs`, `dev/phase3-*.py`, `dev/run-phase3-*.cjs`, `dev/audit-phase3-paths.cjs`, `dev/test-phase3-defender.cjs`, `dev/verify-phase3.py`, `dev/report-phase3.py`.
- Evidence: `dev/phase3/`, `dev/balance-audit/phase3-*.json`; 48 baseline controlled cases (9,600 games), six isolated/combined correction cases (1,200 games), 150 historical-format games, and 100 possession-path games. Exploratory fixtures are explicitly excluded from final comparisons.
- Functional regressions: 40 actual feat games plus synthetic winner/buzzer/defensive/live-prefix cases; 26 technical/flagrant games; 30 production fatigued games; completed Phase 2 save validation, career serialization, repeated finalization and no duplicate feat news. All completed successfully. Full UI/device coverage and every unrelated gameplay test were not run.
- The separate WNBA seed-101 pilot was reused only because it used the identical frozen transform, seed and full-season harness. It is counted once. Other exploratory/pilot games are excluded from the 14,700 total.
- Phase 2 outputs and 39 city photograph hashes remain intact. Existing completed records are not resimulated or migrated.

To regenerate the report, run `python3 dev/report-phase3.py`, then `python3 dev/phase3-report-details.py`, then `python3 dev/phase3-finalize-report.py`. To check retained full-season results, run `python3 dev/verify-phase3.py`. The full-season runner skips existing completed outputs; use a separate checkout/output copy for a fresh run so preserved evidence is not overwritten.
'''
p.write_text(s)
m=json.load(open('dev/phase3/candidate-manifest.json'));assert hashlib.sha256(pathlib.Path('dist/attributes.js').read_bytes()).hexdigest()==m['testedAttributesSHA256']
print('PASS report finalized; production source exactly matches tested candidate')
