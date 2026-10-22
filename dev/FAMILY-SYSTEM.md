# Player Family & Relatives — implementation and verification

Implemented October 16, 2026. Entry points: Players → Families & basketball legacies; player profile → Family → Edit relatives / Family tree.

## Existing architecture and scope

Historical NBA (1946–2026) and WNBA (1997–2026) presets are **fictional-roster rules snapshots**, explicitly described that way in `historical-settings.js`. There was no historical real-player roster database, family model, or general player identity editor. This implementation adds a sourced historical kinship catalog, explicit identity assignment in the family editor, and a `historicalPersonId` import field. It does not pretend fictional preset players are real people or infer identity from surnames. Verified reference relatives remain accessible outside the roster. References born after the season's October 1 age anchor are hidden. They never automatically acquire a roster spot or contract.

One career simulates one league. Cross-league family links are supported in the registry and interface. Independent careers do not share a live player universe: NBA and WNBA records are not silently merged, and an off-league child does not play unrecorded games in an imaginary second league.

## Production changes

- `dist/family-history.js`: 13 sourced historical identities, eight verified links covering all requested example families; no invented relatives or historical career totals. Cheryl Miller is categorized as Other, not as a WNBA player.
- `dist/family.js`: versioned registry, stable career-local IDs, canonical reciprocal edges, derived extended relationships, ancestry and date validation, generation, prospect insertion, saved lifecycle, recorded legacy totals and event hooks.
- `dist/family-ui.js`: Family profile tab/overview section, active and off-roster dossiers, searchable directory/editor, historical identity assignment, generation settings, multi-generation navigable tree, comparison table and life-status recording.
- `dist/family.css`: responsive family cards, scrollable tree and comparison table, mobile editor layout.
- `dist/profiles.js`: routes the Family tab through the existing dossier renderer.
- `dist/season-awards.js` and `dist/league-history.js`: retain validated numeric winner IDs, so two players with the same name cannot receive each other's family award credit.
- `dist/index.html`: loads the additive modules before career initialization.

## Data and lifecycle

`state.family.version = 1` contains people, canonical edges, monotonic person/player counters, a dedicated persisted random state, last processed year, generation options, and deduplicated news keys. Simulation IDs (`s:N`) are distinct from historical IDs (`h:nba:…`, `h:wnba:…`). Numeric engine player IDs remain unchanged; the registry connects them to stable people. Family player IDs use a checked range starting at 8,000,000, outside existing player-generation ranges.

Relationships store one canonical edge, not two mutable copies. Parent, grandparent and avuncular edges have direction; sibling, half-sibling and cousin edges are symmetric. Shared-parent paths derive siblings, grandparents, aunts/uncles, nieces/nephews and cousins. Removing an inferred relationship requires editing the underlying parent links; the editor explains this. Validation rejects self-links, duplicate/conflicting pair links, more than two biological parents, circular ancestry, ancestor/sibling conflicts, impossible death/birth chronology and unrealistic generation gaps. Manual parent gaps permit 12–80 years and grandparent gaps 24–150 years; automatic births use a narrower adult age range.

Generation runs once for each newly entered season from the actual `advanceSeasonPlayerAges` hook, before the existing rollover save. Simulation assumptions, not scientific demographic estimates: a 2.5% annual birth chance for eligible people aged 20–40, at most three recorded children, and a 22% basketball pathway chance. Generated descendants can themselves have children. Disabling births does not stop existing children from aging. Verified historical people are excluded unless the user explicitly enables fictional relatives for them. Manual fictional links/creation to historical people are similarly protected.

A child's ceiling is sampled independently, with a 25% contribution from the parent's deviation from a baseline potential. Height and attribute inputs have weaker parental influences plus independent variation. Children can exceed a parent's potential. Youth development is separately randomized, capped by the child's own ceiling; not every child takes the basketball pathway or reaches draft quality. These are deliberately simplified simulation genetics, not claims about real heredity.

Eligible children replace a bounded number (up to 10%) of existing generated draft-pool entries; they do not inflate roster sizes or bypass the existing draft, contracts, hard cap, rights, development or retirement paths. They must satisfy configured age bounds (with an adult floor of 18), current league gender, minimum ability, and living status. Entry year and numeric player ID persist, preventing repeat generation. Off-league children remain family records; the game does not invent external careers. The age convention remains the game's season-start October 1 convention.

Legacy totals track recorded regular-season GP, points, rebounds, assists, steals, blocks, turnovers; player championships, All-Star selections, MVP, DPOY, ROY and Hall inductions. Counts are per player, so two relatives on the same championship team contribute two player titles. There is no claim of historical real-life totals. Current statistics refresh in the Family view; season capture persists totals before rollover erases current games. Existing Hall history is hydrated for family views and supplements legacy saves without fabricating missing data. Older name-only awards and missing historical All-Star selections are not reconstructed by guessing.

News triggers require actual played appearances, recorded relationships, drafted team keys, awards or career totals. Implemented triggers: debut against a parent, siblings playing together, relatives meeting in the Finals, passing a parent's recorded career points, parent/child championships, draft selection by a parent's recorded former team, multiple Hall inductees. Event keys prevent replay spam after reload. No story claims a historical accomplishment merely from a reference record.

## Persistence and compatibility

The normalized IndexedDB repository already preserves additive league-core properties, so no destructive database/schema upgrade is necessary. Existing saves lazily receive the v1 registry through validation. Active identities/contracts/statistics remain unchanged. Retired historical snapshots remain in the existing archive; the family registry keeps lightweight identity and achievement records accessible after roster removal. Unknown legacy birthdates are explicitly marked estimated.

Save validation checks registry IDs, uniqueness, dates, limits, counters, ancestry, links and numeric career totals. Family edits use the existing save queue with rollback on failure; no save overwrites a different career after a pending operation. Retired/inactive/non-player people can receive a recorded death year. The system does not randomly invent deaths for historical people.

## Historical sources (checked 2026-10-16)

Relationship sources are retained on each edge and available in the Family UI:

- Dell/Stephen: https://www.nba.com/news/greatest-father-son-duos-in-nba-history
- Dell/Seth: https://www.nba.com/mavs/seth-brings-his-own-brand-of-curry-to-dallas
- Stephen/Seth: https://www.nba.com/news/curry-brothers-warriors
- LeBron/Bronny: https://www.nba.com/news/lebron-bronny-james-1st-father-son-duo-to-play-in-preseason
- Giannis/Thanasis: https://www.nba.com/news/bucks-band-brothers
- Pau/Marc: https://www.nba.com/bulls/features/pau-gasol-prepares-all-star-history
- Cheryl/Reggie: https://www.nba.com/pacers/news/pacers-have-learned-older-sisters
- Nneka/Chiney: https://sparks.wnba.com/news/sister-sister-nneka-and-chiney-ogwumike

Birth dates are individually sourced alongside identities in `family-history.js`: NBA player profiles; the Naismith Hall of Fame profiles for the Millers; Basketball Reference for Nneka; official WNBA game notes for Chiney. This is a starter catalog covering the requested examples, not an exhaustive genealogy of all historical players. It does not include uncertain family connections.

## Verification

- `dev/test-family.cjs`: all requested historical pairs; all relationship directions; three generations and derived cousins/aunts/grandparents; invalid self/ancestor/duplicate relationships; edit/removal behavior; JSON roundtrip; 111 historical NBA/WNBA year combinations (visibility and non-roster guarantees); child age progression, independent potential, age-gated insertion, no repeat draft entry; same-name award protection; retirement/HoF; tree/profile markup and escaping; additive legacy migration; historical identity assignment/import; opt-in enforcement; female relatives in the WNBA draft salary environment.
- `dev/test-family-events.cjs`: genuine played-event conditions, repeated-news deduplication, no news after link removal, 42 years of multi-generation births, repeated-year idempotence, every explicit reciprocal relation, death-date constraints.
- `dev/test-family-storage.cjs`: actual normalized IndexedDB with fake-indexeddb; full/lazy reload and repeat validation; failed-save rollback; complete four-team NBA season, playoffs, draft, free agency and rollover; generated rookie continuity; achievements preserved; no regeneration after reload.
- Existing `dev/test-wnba-season.cjs`: complete 1997 WNBA season into 1998, preserving contract and team-cap legality.
- Existing `dev/setup-logo-regression.cjs`: New Career branding remains compatible.
- Syntax checks on changed JavaScript.

Browser automation is unavailable in this session. DOM/markup and production-engine tests were run, but desktop/mobile visual appearance and click-through in a real browser were not visually verified.

## Remaining limits

Historical presets do not contain real-player rosters, and the catalog is limited to the requested example families. Users can explicitly assign identities to age-appropriate players; ratings, contracts and simulated results stay simulation values. Off-league relatives are accessible records, not a second simultaneously simulated league. Family totals cannot recover facts never recorded by older versions. Portraits use saved images when available, otherwise the game's silhouette. Large trees show 40 nearby members at a time with re-centering and searchable navigation. People and news are retained in the league core; extremely long saves may eventually warrant archival partitioning of family records.
