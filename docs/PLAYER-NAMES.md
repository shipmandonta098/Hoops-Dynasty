# Fictional player naming overhaul — 18 October 2026

## What changed

All fictional players created by the existing `player()` factory now receive names through `generatePlayerName()`. The same service creates fictional children. Initial NBA/WNBA rosters, draft/international prospects, generated free agents, replacement recruits and future expansion recruits use that factory; expansion selections and transactions retain the selected existing player. Existing/historical/manual player names are not regenerated.

The former domestic algorithm paired 24 given names and 24 surnames directly from player IDs. International pools generally held eight components each. Neither path reserved names. The family generator used those domestic lists and guessed the surname from the last whitespace-separated word. Those obsolete datasets/selection paths have been removed.

## Corpus and coverage

82 country datasets; 5,867 given-name entries and 3,286 surname entries, counting shared background pools and feminine surname forms. Deduplicated across the whole corpus: **2,931 distinct given-name strings and 1,886 distinct surname strings**. Entries can be compound names. Shared names across countries are intentionally counted only once in the distinct totals.

United States, Canada, Mexico; Brazil, Argentina, Colombia, Venezuela, Chile, Uruguay, Peru; France, Germany, Spain, Italy, Portugal, United Kingdom, Ireland, Serbia, Croatia, Slovenia, Bosnia and Herzegovina, Montenegro, Greece, Lithuania, Latvia, Estonia, Poland, Czech Republic, Slovakia, Ukraine, Türkiye, Georgia, Finland, Sweden, Norway, Denmark, Netherlands, Belgium, Switzerland; Nigeria, Cameroon, Senegal, Ghana, Ivory Coast, Mali, Guinea, Democratic Republic of the Congo, Republic of the Congo, Angola, South Africa, Kenya, Ethiopia, Uganda, Rwanda, Egypt, Morocco, Tunisia, Algeria; China, Japan, South Korea, Philippines, India, Pakistan, Lebanon, Iran, Israel, Jordan, Kazakhstan, Uzbekistan; Australia, New Zealand, Fiji, Samoa, Tonga; Jamaica, Bahamas, Dominican Republic, Puerto Rico, Haiti, Trinidad and Tobago, Cuba.

Given names and surnames are chosen independently inside compatible pools. Added separate component pools include Nigerian Igbo/Yoruba/Hausa traditions, Ghanaian Akan/Ga/Ewe, Indian northern/Sikh/Muslim/Tamil traditions, Kenyan Kikuyu/Kalenjin, South African Nguni/Sotho-Tswana/Afrikaans, and selected diaspora backgrounds. These are **naming templates, not inferred or asserted player ethnicities or religions**. A country's default pool is not a claim about all its residents. The corpus is expandable and not exhaustive.

Chinese, Japanese and Korean templates support family-name-first display, with an optional given-name-first preference. Accents, apostrophes, spaces, hyphens and particles remain Unicode strings. Spanish/Portuguese-language templates can draw two surnames. Explicit feminine forms cover Lithuanian, Latvian, Greek, Czech and Slovak pools; Polish and selected Central Asian endings have constrained transformations. Family inheritance converts supported masculine/feminine surname forms. Patronymic templates can inherit a recorded father's given name.

## Selection and uniqueness

One versioned career field, `nameGeneration`, stores a dedicated seeded RNG state, reserved normalized full names, component usage counts and settings. `nameIdentity` stores generated components on new player/person records. The saved registry remembers names after retirement. Transient Set/WeakMap indices give constant-time duplicate lookup without scanning the database per attempted name.

Names are normalized to NFC, case-folded and whitespace-normalized for collision checks. Accents are retained. Existing rosters, free agents, draft prospects, rights, family records, available statistical archives and Hall of Fame names are reserved on initialization/load and at recruiting boundaries. Known historical family reference names are also reserved. Historical/manual duplicates remain unchanged.

Component weights use estimated 3:2:1 bands, moderated by previous component usage. These are **simulation design weights, not measured national birth frequencies**. Background and recruiting-country weights are also simulation choices. Diversity preferences change the strength of reuse suppression. Generation uses bounded weighted retries, then a deterministic unused-pair search. If a default template is exhausted, other supported templates for that country are tried. No numeric suffixes or fabricated family relationships are added. Unknown countries fail explicitly instead of silently generating American names.

Settings → Fictional player names provides Standard/High/Maximum diversity, cultural/given-name-first display order and unrelated duplicates (off by default). Preferences affect newly created names only. Country-aware generation remains enabled; no authenticity-off setting was added. Manual names and legitimate historical duplicates remain permitted.

## Integration and save behavior

- Initial league creation establishes a separate naming scope before creating any players. Its seed comes from the game's RNG; names subsequently use their own saved RNG stream.
- Draft creation and season transitions refresh reservations. New names register immediately, including within a not-yet-attached prospect array.
- Family records copy structured components; children inherit supported surnames, including compound names. Children entering the draft retain their recorded name, nationality/template and family identity.
- Older names lack reliable component boundaries. The system preserves them and does **not** infer their surname from the final word. For children of such legacy players, it retains known nationality but draws a new surname. This is an explicit limitation; no legacy family data is fabricated.
- Save validation preserves additive fields and never rewrites historical or existing names, contracts, statistics or IDs. New registry data is initialized for legacy saves. JSON validation and the normalized repository's core/player split preserve it.
- A WNBA draft-and-stash defect exposed by the new recruiting mix was corrected: newly stashed unsigned prospects no longer retain a provisional WNBA contract after its end field is removed. Actual signing still goes through the existing WNBA contract/cap validator.

## Verification actually run

`node dev/test-player-names.cjs`:

- 10,000 generated players across all 82 countries: **10,000 unique, 0 duplicates (0%)**.
- Separate US batch: 10,000/10,000 unique.
- Separate French, Nigerian, Serbian, Brazilian, Japanese, Chinese and Canadian batches: 1,000/1,000 unique each, mixed male/female pools.
- Existing `player()` factory, 100 seasons × 100 recruits: **10,000 unique new male recruits** and **10,000 unique new female recruits**, plus 330 initial players in each career; zero duplicates across each full population. JSON reload every ten seasons.
- Country/template/gender component membership, cultural and western order, exact-collision rejection, optional duplicate allowance, unknown-country rejection, deterministic generation and reload continuation.
- Legacy names/IDs/salaries preserved, historical reference data unchanged, new draft uniqueness, structured family surname inheritance, settings markup and normalized persistence split.
- `dev/player-name-test-results.json` includes every country's distinct given/surname counts and largest component concentration, plus all large-batch results. Counts describe the tested seed, not a guarantee about every possible simulation.

`node dev/test-name-lifecycle.cjs`: actual NBA and 1997 WNBA four-team season fixtures, **15 games each**, through playoffs, draft, AI free agency and rollover; validates names/IDs, actual save parsing, no active duplicates and unchanged existing player names.

`node dev/test-family.cjs`: passed core family relationships, historical safety across 111 year/league combinations, migration, repeated loading, generation and WNBA relative draft integration.

`node dev/test-family-events.cjs`: passed actual-event family news, deduplication, 42-year forced multigeneration births, reciprocity and timeline checks.

`node dev/test-wnba-season.cjs`: passed after the unsigned-stash fix, including contract/cap validation at 1998 rollover.

Syntax checks passed for the new service/integration and changed international module. All 38 city photographs and skyline rendering files are byte-for-byte unchanged relative to the preceding commit.

## Limits and sources

This is a curated simulation corpus, not a census database. It has not been reviewed by native-language experts for every supported tradition. Selection frequencies, migration/background weights and surname-combination rates are estimates. Not every naming tradition, regional spelling, married surname form or historical birth-cohort preference is represented. No ethnicity or secondary nationality is inferred from a name.

Pools are finite. Deliberately exhausting one tiny template or one inherited surname's given-name pool raises a clear error rather than silently inventing suffixes or using another country's names. The tested normal recruiting mix supports 100 years, but this is not an unlimited-capacity guarantee for country-locked/custom careers. Expand the relevant arrays to support unusually concentrated custom populations.

The 100-year checks exercise real recruiting, not 100 full seasons of basketball games. Full basketball lifecycle tests cover one NBA and one WNBA season. Browser visual/responsive QA and an actual IndexedDB backend round trip were unavailable; JSON validation and normalized storage splitting were tested. Existing rendering/escaping is reused for Unicode names.

Design references consulted:

- W3C, [Personal names around the world](https://www.w3.org/International/questions/qa-personal-names.en): naming order, multiple components, cultural exceptions and the danger of parsing surnames from spaces.
- W3C, [Internationalization Best Practices for Spec Developers](https://www.w3.org/TR/international-specs/): Unicode and internationalized data handling.
- US Social Security Administration, [Background information](https://www.ssa.gov/oact/babynames/background.html) and [data limitations](https://www.ssa.gov/oact/babynames/limits.html): frequency datasets have coverage/format limitations. No SSA frequencies were imported; this implementation does not claim their statistical accuracy.

## Files

New production: `dist/player-name-data.js`, `dist/player-names.js`, `dist/name-generation-integration.js`.

Updated production: `dist/game.js`, `dist/international-players.js`, `dist/player-gender.js`, `dist/family.js`, `dist/index.html`.

Tests/report: `dev/load-league.cjs` (accept script cache-busting query strings), `dev/test-player-names.cjs`, `dev/test-name-lifecycle.cjs`, `dev/player-name-test-results.json`, this document.

To extend the corpus, add a country or compatible variant in `player-name-data.js`, retain separate gender pools and explicit formatting flags, then run both naming test files. Do not reintroduce full-name pair lists or a second generator.
