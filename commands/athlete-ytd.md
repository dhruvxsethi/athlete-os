---
name: athlete-ytd
description: Show year-to-date training totals — distance, time, elevation, activity count, monthly breakdown, and milestones since January 1st of this year.
---

Generate a year-to-date training summary from January 1st of the current year through today.

1. Calculate the Unix timestamp for January 1st of the current year at 00:00 UTC.
2. Call `get-all-activities` with `after` set to that timestamp. Paginate with `per_page: 200` until exhausted.
3. Cross-reference with `get-athlete-stats` for official Strava YTD totals.
4. Apply the `year-to-date-summary` skill to produce the structured report.

Present overall totals, sport breakdown, monthly table, milestones, and annualized pace.
