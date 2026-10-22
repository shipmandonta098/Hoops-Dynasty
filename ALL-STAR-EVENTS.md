# All-Star events and calendar

League Settings → All Star (also in New Career) adds Rising Stars enabled/disabled, event schedule length (1–7 days, default 3) with no additional rest-day padding. The break covers only the selected event span for all leagues. The former independent break-length setting is removed; older saved values are ignored.

New careers, preseason schedule edits and subsequent seasons reserve an actual game-free break. NBA-format calendars extend their existing gap in automatic mode; other non-custom calendars insert rest days and update the season end date. Custom calendars retain the chosen start/end dates and pack all matchups outside the break, rejecting impossible dates. Already-started careers retain existing game dates until their next calendar is generated.

Rising Stars runs on the first event day and selects available first- and second-year players by rating, up to 12 per side. It reports team scores, player points and MVP without altering club stats. If fewer than four eligible players exist, the event explains why it could not run.

Three-point and dunk contests run on the middle day, with opening and final rounds. Three-point rounds use 25 rack shots plus two deep shots, up to 40 points; dunk rounds use two dunks scored by five judges, up to 100. Rating-driven event results, additional tie rounds and any final random tie resolution are logged. Existing participant counts and enable/disable settings apply. The existing skills challenge remains on the middle day.

The voting-selected All-Star Game runs on the final event day, retaining its captains/conference/mixed assignments and optional untimed fourth quarter. One-day schedules place all events on that day; two-day schedules put Rising Stars and contests first, with the game last.

Results appear in Schedule → Voting & weekend as each event occurs and are announced once in the All-Star News Feed category. All-Star results have their own validated save state and reset on season rollover. Completed legacy reports are preserved.

Validation: test-all-star-events.cjs checks event timing, news, persistence, game-free breaks, game totals, settings changes, disabled events, women’s defaults, custom date constraints and NBA matchup/rest preservation. test-all-star-voting.cjs checks compatibility with voting and exhibitions. Browser visual testing was not performed.

Unplayed padding days in previously saved breaks are removed when loading. Completed dates and game results stay unchanged; future calendar dates and season end adjust with the removed empty days. `test-all-star-no-padding.cjs` verifies migration and default/one-day calendars.
