# Coach profile contract actions

The player's own coach profile now includes Terminate Contract and Negotiate extension. Other teams' profiles show contract facts without management controls.

Contracts default to a rating-based annual salary and the following season for existing coaches without saved terms. Extension negotiations show a deterministic minimum salary; lower offers are declined. Accepted offers add 1–5 seasons and apply the annual salary immediately. Coach salaries are covered by the coaching operating budget, with a salary floor on its daily expense when budgets are enabled. They do not count toward player salary caps.

Termination requires a confirmation displaying the prorated guaranteed buyout and resulting cash balance. It posts an operations expense and promotes the highest-rated assistant to interim head coach for the current season at $1M/year. The assistant vacancy is filled automatically. A tenure baseline prevents the replacement from inheriting the team's earlier wins and losses. News records the transaction.

Contract validation supports existing saves; revisions reject stale controls, a busy guard prevents duplicate submissions, and failed saves restore prior state. Expired contracts remain visible as expired and can be extended; this change does not add a coach hiring market.

Checks: `node test-coach-contracts.cjs`, `node test-page-headers.cjs`. Browser testing remains unavailable in the current environment.
