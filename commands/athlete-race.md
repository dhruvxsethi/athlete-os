---
name: athlete-race
description: Detect and display the athlete's race history from Strava — identified by race flags, naming patterns, and PR counts. Shows PRs by distance and a performance trend.
---

Detect and analyze the athlete's race and event history.

1. Call `get-all-activities` for a broad date range (3 years, paginated).
2. Filter for race activities using: `workout_type == 1` (race), name keywords (5k, marathon, race, event), `pr_count > 0`, `achievement_count > 3`.
3. Group by distance category and sort chronologically.
4. Apply the `race-event-detection` skill to produce the structured report.

Present race history table, PRs by distance, and performance trend analysis.
