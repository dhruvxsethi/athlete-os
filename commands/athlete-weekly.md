---
name: athlete-weekly
description: Generate a full training week report — all activities from the past 7 days grouped by sport, with totals, highlights, and a coaching reflection.
---

Generate a complete weekly training summary for the past 7 days.

1. Calculate the Unix timestamp for 7 days ago.
2. Call `get-all-activities` with `after` set to that timestamp.
3. Group activities by sport type and aggregate totals.
4. Apply the `weekly-training-summary` skill to produce the structured report.

Present the week-at-a-glance table, sport breakdown, day-by-day log, and coaching reflection.
