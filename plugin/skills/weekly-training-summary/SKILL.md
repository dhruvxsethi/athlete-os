---
name: weekly-training-summary
description: Generates a structured weekly training report covering all activities from the past 7 days. Use when the user asks what they did this week, how their training week went, a weekly recap, or wants a training summary. Groups activities by type, surfaces trends, and provides coaching feedback.
triggers:
  - "what did I do this week"
  - "weekly training summary"
  - "how was my week"
  - "weekly recap"
  - "summarize my training"
  - "how many miles did I run this week"
  - "/athlete-weekly"
---
## MCP connection check

Before doing anything, call `check-strava-connection`. If the tool isn't available, say:

> "The Strava connection isn't active yet. Please fully quit Claude Code (⌘Q) and reopen it — the MCP server loads on startup."

Do NOT attempt to work around missing MCP tools.



# Weekly Training Summary

Generate a complete training week report for the past 7 days.

## Steps

1. If the user hasn't specified a focus sport, use AskUserQuestion to ask:
   - Question: "Focus on a specific sport or show everything?"
   - Header: "Sport focus"
   - Options: "All sports", "Run", "Bike", "Swim"
   If they've already mentioned a sport ("my running this week"), skip the question.
2. Call `get-all-activities` with `after` set to the Unix timestamp for 7 days ago (current time − 604800 seconds).
2. Group activities by type (Run, Ride, Swim, Walk, Hike, WeightTraining, etc.).
3. For each activity type, aggregate: total distance, total duration, total elevation gain, count.
4. Identify the longest and most intense activity of the week.
5. Check for any PRs (`pr_count > 0`) or achievements across activities.
6. Calculate weekly load: total moving time + weighted effort estimate.
7. Produce the report in the output format below.

## Output Format

**Week at a Glance** (MM/DD – MM/DD)
- Total activities: N
- Total distance: X km / X miles
- Total time: Xh Xm
- Total elevation: X m

**By Sport**
| Sport | Sessions | Distance | Time | Elevation |
|-------|----------|----------|------|-----------|

**Highlights**
- Longest activity: [name, distance, date]
- Hardest effort: [name, estimated effort, date]
- PRs this week: [list or "none"]
- New achievements: [list or "none"]

**Day-by-Day**
Brief one-liner per active day including weather if available (e.g., "Mon: Easy 8km run, 45min · 🌧 14°C, rain"). To get weather: call `get-weather-for-activity` for each activity that has `start_latlng`. Only show weather if the API returns data — skip silently if not.

**Coaching Reflection**
- Training load assessment: light / moderate / heavy
- Consistency: how many days active out of 7
- Balance: mix of intensity and recovery
- One specific recommendation for next week

## Privacy

- Do not display GPS routes or location data.
- If preparing to send this summary externally, ask the user to confirm before including activity names (some users name activities with personal location info).

## Example Prompts

- "What did I do this week?"
- "Give me a weekly training report"
- "How many kilometres did I run this week?"
- "/athlete-weekly"
