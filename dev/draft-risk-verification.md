# Draft risk verification

- `node dev/test-draft-risk.cjs`: PASS. Generation, save validator round-trip,
  malformed input, idempotent review, stagnation, ceilings/caps, conditioning,
  actual severe injury hook, entry threshold, unsigned prospects and seeded
  normal/headless parity with draft-risk players.
- `node dev/test-headless.cjs`: PASS. Six seeded games and rollback/cancellation.
- `node dev/benchmark-aging-small.cjs 1 2026`: PASS after isolating hidden trait
  generation from the gameplay RNG. 47 games, 7.22 seconds, 0 integrity errors.
- Initial version consumed shared RNG during prospect initialization and the
  same small fixture stalled in free agency. Published baseline passed. Hidden
  trait generation now follows deterministic personality/durability conventions;
  actual career events still use shared seeded randomness. Same fixture passes.
- IndexedDB suite unavailable: fake-indexeddb dependency missing. JSON validator
  round-trips verify the added player fields; browser storage and visual QA unverified.

Balancing: top-three and picks 4–10 use 12.5% and 30% two-season baseline targets,
modified by risk and environment. Entry threshold and real injuries are additional
risks. Late picks use a separate reserve-ceiling check; it is not called a bust.
These are design parameters, not proven empirical NBA rates or calibrated outcomes.
Existing drafted veterans are not retroactively assigned risk. Current undrafted
prospects and new classes receive stable traits when their class is initialized.
