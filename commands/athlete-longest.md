---
name: athlete-longest
description: Find and analyze the longest activity of a given sport. Optionally scoped to a time period (e.g., "this year", "in 2024", "all time"). Defaults to all sports, all time.
---

Find and analyze the athlete's longest activity.

1. Check if the user specified a sport type or time period in their prompt; use defaults (all sports, all time) if not.
2. Call `get-all-activities` with appropriate `after`/`before` timestamps. Paginate as needed.
3. Filter by sport type if specified. Sort by distance descending.
4. Call `get-activity-details` and `get-activity-laps` on the top result.
5. Apply the `longest-activity-analysis` skill to produce the structured report.

Present activity details, performance breakdown, splits, context comparison, and recovery note.
