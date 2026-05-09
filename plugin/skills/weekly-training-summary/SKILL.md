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

3. Group activities by type (Run, Ride, Swim, Walk, Hike, WeightTraining, etc.).

4. For each activity type, aggregate: total distance, total duration, total elevation gain, count.

5. **PR and achievement scan** — check every activity for `pr_count > 0` or `achievement_count > 0`. Collect any activities with PRs or achievements into a highlights list. For activities where `has_heartrate: true` and `average_heartrate` is set, note the HR alongside the PR for context.

6. Identify the longest and most intense activity of the week (highest `suffer_score` or estimated effort).

7. **HR zone snapshot (optional enrichment)** — If 3 or more activities have `has_heartrate: true`, pick the longest run or ride and call `get-activity-streams` with `keys: "heartrate,time"` and `resolution: "low"`. Use the returned HR data to give a single sentence in the Coaching Reflection about time spent in high vs low intensity (e.g., "Your long run was predominantly easy effort — most of the hour was sub-140bpm"). Only do this for one activity to keep API calls minimal; skip silently if streams aren't available.

8. Calculate weekly load: total moving time + activity count.

9. Produce the report in the output format below.

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
- PRs this week: [list with activity name and PR type, or "none"]
- New achievements: [list or "none"]

**Day-by-Day**
Brief one-liner per active day including weather if available (e.g., "Mon: Easy 8km run, 45min · 🌧 14°C, rain"). To get weather: call `get-weather-for-activity` for each activity that has a non-empty `start_latlng`. Use `start_latlng[0]` as latitude and `start_latlng[1]` as longitude. Only show weather if the API returns data — skip silently if not.

**Coaching Reflection**
- Training load assessment: light / moderate / heavy
- Consistency: how many days active out of 7
- Balance: mix of intensity and recovery
- HR note if streams were fetched (one sentence only)
- One specific recommendation for next week (reference `/athlete-zones` if zone balance is worth exploring)

## Telegram delivery

After presenting the full summary in Claude, offer Telegram delivery if the skill was triggered interactively (not by a scheduled routine):

> "Want me to send this to Telegram? (requires Telegram to be set up — say 'set up Telegram' if not done yet)"

If the user says yes, call `send-telegram` with the summary as plain text. Strip markdown formatting (no **, no #) since Telegram renders plain text. Keep tables and unicode bars — those render fine.

If running as a scheduled routine (no interactive user), call `send-telegram` automatically without asking.

## Privacy

- Do not display GPS routes or location data.
- Before sending externally via Telegram, note that activity names are included and confirm if any are sensitive (some users name activities with personal location info). If in doubt, ask first.

## Example Prompts

- "What did I do this week?"
- "Give me a weekly training report"
- "How many kilometres did I run this week?"
- "/athlete-weekly"
