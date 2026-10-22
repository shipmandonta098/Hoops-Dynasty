# Shared page banners

`dist/page-headers.js` contains `pageHeader(props)`, `pageHeaderFor(page)`, and the central `PAGE_HEADERS` configuration. Props cover title, eyebrow, subtitle, local background image, desktop/mobile position, overlay treatment, variant, and the existing Draft year / Playoffs motto.

The existing `.po-hero` base and Draft/Playoffs variant styles remain in place to preserve their appearance. `dist/page-headers.css` supplies common configurable backgrounds, new-page typography, dark fallbacks, compact variants, and responsive rules. Draft and both Playoffs renderers now call the same component. Other destinations receive their banner through the shared career-content entry point. Existing shell headings, advance controls, team banners, cards, tables, content and navigation remain intact.

Every configured destination now has project-local background artwork. Twenty-one new cinematic basketball images use the flat `dist/header-*.webp` asset convention. Draft and Playoffs retain their original image files, crops and overlays. Expansion reuses the skyline; awards, league history and Hall of Fame retain the existing trophy art. Settings and GM Inbox retain compact headers with understated environmental images. Nonlegacy overlay settings use a strong left-to-right dark gradient, with greater image visibility on the right. No external image URLs are used. See `HEADER-ARTWORK.json` for page themes and generation prompts.

## Verification

`node test-page-headers.cjs` renders and navigates every sidebar route individually: Overview, News feed, Roster, Players, Rotations, Schedule, Trades, Free agency, Front office, Finances, Team management, Standings, Player stats, Award races, Team stats, League stats, Playoffs, Draft, Expansion, Franchise history, League history, Hall of Fame and Settings. GM Office, GM Inbox, Attendance rankings and Power rankings are also checked.

Each destination has exactly one shared banner. Every route is required to have an image; local image paths, escaping, original Draft year and Playoffs motto are checked. A seeded before/after comparison of all 27 rendered destinations confirmed byte-for-byte preservation of existing page-body markup after removing only the old/new banner markup. The Players regression check passes. The older `test-playoffs-view.cjs` expects the already-absent phrase “Projected seeds”; that unrelated stale assertion was not changed.

Responsive inspection: new headers wrap long titles/eyebrows, use container-relative type sizing, cap width at the content area, reduce padding/spacing on small screens and apply configured mobile crops. Existing Draft year hiding and Playoffs responsive copy/motto rules are preserved. Header styling does not target sidebar/navigation or page tables.

The artwork pass checks all 27 rendered pages against the pre-artwork output, allowing only header background style changes. Draft and Playoffs rendered markup and original image files are byte-identical; all header/layout stylesheets are unchanged. All 21 new WebP images decode successfully (about 2.5 MB total). Their approximately 3:1 compositions have right-side subjects, configured mobile crops, and unchanged `cover` behavior.

Browser visual verification was unavailable: this buildless static project has no compatible supervised preview. No claim of screenshot or browser-device testing is made.
