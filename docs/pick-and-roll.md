# Pick-and-roll engine

The new `dist/pick-and-roll.js` module runs on eligible half-court possessions with at least ten seconds on the shot clock. It selects two distinct active attackers and two distinct active defenders. Transition offense and late-clock possessions retain their existing logic.

Existing player ratings provide all inputs, so saved careers need no new player fields:

| Role | Ratings |
| --- | --- |
| Handler | Passing, Dribbling, Mid-range, Layup, Speed |
| Screener | Screening = 85% Strength + 15% Offensive IQ; Roll = 55% Layup + 25% Speed + 20% Offensive IQ; Hands = 60% Dribbling + 40% Offensive IQ; Three-point and Dunking for finishes |
| On-ball defender | Perimeter Defense, Speed, Stealing, Defensive IQ |
| Screener defender | Interior Defense, Speed, Defensive IQ, Stealing |
| Weak-side help | Active teammate's Interior Defense, Defensive IQ and Speed |

1. **Screen:** a bounded illegal-screen probability depends on screening ability and coaching discipline. Otherwise screening plus a d20 competes with 80% Perimeter Defense + 20% Speed plus a d20. An edge greater than five yields an excellent pick; otherwise it is soft. Excellent and soft picks supply temporary advantages of 14 and 4, respectively, used in separation and conversion calculations; no saved rating is modified.
2. **Coverage:** weighted drop, hedge, switch and blitz choices depend on coach system/tactics/defense, screen quality and the defenders' ratings. Grit & Grind favors drop; Pace & Space favors switching. A user's Defense focus increases blitz weight. These are AI-selected coverages, not a new manual coverage control.
3. **Read:** weighted pull-up, drive, roll and pop decisions use the handler's skills and existing tendencies. Drop favors pull-ups; hedge/blitz favors rolling passes; shooters with 70+ Three-point can pop. There is no automatic made basket.
4. **Pressure and passes:** blitz checks handling against both defenders. Roll/pop passes check interception and then the receiver's hands separately. Interceptions credit the passer with a turnover and the defender with a steal. A bobbled catch credits the receiver with a turnover. Illegal screens credit the screener with an offensive foul and turnover, without a steal.
5. **Finish:** the selected defender and shot flow into the existing shot, block, foul, free-throw and rebound engine. Rolls evaluate weak-side help; switches preserve the resulting mismatch. Driving includes an explicit Layup vs. Interior Defense adjustment. Direct roll/pop baskets credit the handler with an assist; misses do not.

The module consumes three seconds for setup and three for each pass/drive and shot step, respecting the possession state machine. Pick-and-roll decisions are protected from being replaced by the separate isolation selector, and their resolved screen/steal checks are not repeated by the generic handling path.

Initial half-court selection rates are 32% for Pace & Space, 23% for Grit & Grind, 16% for Triangle and 27% for Seven Seconds or Less; fast breaks are excluded. These are simulation tuning choices, not claimed real-world frequencies.

Narrative pools include pocket passes, bounce passes, feeds, snakes and turns around the screen. Setup text describes an attempt; the existing scored event reports the actual make, miss, block, foul or turnover. The play-by-play text and resulting box scores persist through the normal career save path.

Verification covers every coverage/action pairing, excellent/soft/illegal screens, shooter eligibility, trap/interception/catch failures, correct illegal-screen attribution, interior-defense effects, no permanent rating changes, 24 full-game score/assist/foul/turnover/live-box consistency checks, and save/reload. Attendance integration regression checks also pass.
