---
name: athlete-latest
description: Analyze the most recent Strava activity in depth — distance, pace, HR zones, splits, and a coaching note.
---

Fetch the athlete's latest Strava activity and run a full analysis.

1. Call `get-recent-activities` with `per_page: 1`.
2. Call `get-activity-details` on the result.
3. Call `get-activity-laps` if laps exist.
4. Apply the `latest-activity-analysis` skill to produce the full structured report.

Present the output with the activity header, performance summary, lap breakdown, and coaching note.
