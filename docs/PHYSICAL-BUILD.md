# Physical build rules

`dist/physical-build.js` uses existing biography height (inches) and weight (pounds). It adds no saved fields. Missing biographies use the existing deterministic biography generator without changing RNG state. Reach is estimated at 1.04 times height, because wingspan is not currently recorded.

Physical factors clamp to 0.8–1.2. Speed uses `1 - heightDelta/30 - weightDelta/100`. Baselines are 78 inches/220 pounds for men and 72 inches/165 pounds for women. Other bounded factors cover strength, agility, jumping, endurance, and reach. Generation and development enforce size-dependent rating ceilings; existing saved base ratings are not rewritten on load.

The shared game engine receives temporary derived ratings, restored in `finally`. Existing fatigue, morale, and coaching systems continue to apply. Height-based size enters jump balls, rim protection, screens (through strength), and rebounds. Rebound physical score is 40% size, 30% strength, 30% jumping; learned rebounding retains 70% of the overall rebound selection weight. Positional and crash-glass weights remain.

Matchups use actual measurement differences: more than 15 pounds adds up to 3.5 percentage points to post finishes; more than four inches reduces contested defense by up to 20%; smaller drivers can gain up to 2.5 percentage points against much taller defenders. Longer perimeter defenders recover up to 1.2 percentage points and gain a bounded recovery-block modifier. Pick-and-roll catch checks use reach. No added random draws are needed for these modifiers or narratives.

Verification: `node dev/test-physical-build.cjs` checks trade-offs, extremes, caps, matchup effects, both baselines, deterministic fallback, and restoration. `node dev/test-headless.cjs` checks seeded full-state normal/headless parity and game integrity. These are correctness checks, not a season-level balance calibration.
