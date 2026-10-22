# International player generation

Newly generated players have a 28% chance of an international background. Existing saved players and existing draft pools are not renamed or rerolled. Subsequent draft classes and offseason markets use the new system. Country/name/training configuration lives in `dist/international-players.js`.

## Recruiting weights

Weights apply within the international pool, not the whole league. They are fictional game-balance defaults informed by the NBA's 2025–26 opening-night international player report, not live FIBA rankings or an exact model of real-world probability:
https://pr.nba.com/international-players-2025-26-nba-rosters/

- Common: Canada 23, France 19, Australia 13, Germany 7, Serbia 6, Lithuania 5, Spain 5.
- Occasional: Nigeria, Greece, Turkey and Slovenia 4 each; Brazil, Argentina and Senegal 3 each; Japan 2.
- Rare: China, India, United Kingdom, New Zealand and Egypt 1 each.

All countries retain the same overall talent ceiling. Rare-country players can become stars through the normal talent/potential distribution. Country-specific male/female given names and surnames are local data, with Chinese family-first ordering and female surname pools for Lithuania and Greece. Pools are representative starting samples, not exhaustive coverage of a country's cultures.

## Training and individual variation

Players sample one of five development programs. European and Asian pipelines favor skill academies; Oceania favors defense; African pipelines favor interior development; South America favors guard programs; Canada favors balanced development. Any country can produce any program. Each specialized program distributes a modest total of 12 rating points across four relevant skills. Position weights follow the selected program. Existing archetypes/tendencies continue to control play decisions.

Personality, aggression, work ethic, height, and jumping ability are not prescribed by nationality. Physical size remains position-based. Skills represent basketball training backgrounds rather than inherited national traits.

## Pathways

- **US college:** retains nationality and overseas hometown with a US college biography.
- **International pro academy:** eligible for the normal draft and immediate signing.
- **Draft-and-stash:** 18–19-year-old European prospects can enter with an overseas commitment. Selection records the pick and retains exclusive draft rights, without a roster slot or active rookie contract. Commitment lasts 1–3 seasons. Development and age advance once per season; rating gains remain hidden until signing. Development respects the league development multiplier and freezes at zero. Your available rights appear under Draft → Your picks. CPU teams sign available rights when roster and payroll space permit. Contracts begin at signing and use current rookie salary rules.
- **Late-blooming professional:** 2–6 players, scaled to league size, enter each offseason market at age 24–27. Their potential sits 0–4 points above their current overall. They enter as unrestricted free agents with no fabricated draft biography in the profile.

Country/pathway labels appear in draft and free-agent lists. Scouting reports and player profiles include the international background panel.

## Adaptation

A stored 0–100 adaptation score produces at most a four-rating-point temporary penalty to selected shooting, passing, perimeter defense and IQ checks. It fades linearly over 30 actual league appearances, never lowers permanent ratings, and carries across seasons. Initial-career veterans begin settled; new prospects and overseas free agents start at zero appearances. DNPs do not advance it.

## International Cup

A fictional offseason cup runs every four seasons (2026, 2030, …) as part of opening free agency. Up to 12 healthy, qualifying generated players per country and gender participate. The lightweight tournament generates 3–6 appearances and separate points/rebounds/assists totals, visible in player profiles. Players return before club competition resumes. No regular-season absences, club stats, standings or payroll are changed. The latest 20 tournament records are retained per player. This is a statistical offseason event, not a separately playable national-team bracket.

## Persistence and verification

International metadata is validated by the normal career importer for rosters, free agents, draft prospects and unsigned rights. Free-agency opening, rights signing and hidden development share existing save/rollback behavior. Old saves remain valid without metadata.

`node test-international.cjs` checks all 20 countries, tier distribution, gender-aware names, draft UI, actual season simulation, draft rights, hidden development, signing gates and contracts, failed-save rollback, full offseason entry, repeat prevention, season rollover, adaptation, independent tournament statistics, and legacy/invalid imports.
