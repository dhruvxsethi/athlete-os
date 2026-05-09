---
name: latest-activity-analysis
description: Analyzes the athlete's most recent Strava activity in depth. Use when the user asks about their last workout, most recent run, latest ride, what they did today, or how their last session went. Fetches activity data and produces a structured performance breakdown.
triggers:
  - "what did I do today"
  - "analyze my last workout"
  - "how was my last run"
  - "tell me about my most recent activity"
  - "latest ride"
  - "how did my workout go"
---

# Latest Activity Analysis

Produce a detailed breakdown of the athlete's most recent Strava activity.

## MCP connection check

Before doing anything, verify the MCP tools are available by calling `check-strava-connection`. If that tool isn't found or returns an error saying it's not connected, stop immediately and say:

> "The Strava connection isn't active in this session yet. Please fully quit Claude Code (⌘Q) and reopen it — the MCP server loads on startup. This takes about 5 seconds."

Do NOT attempt to work around the missing MCP tools or claim you can call Strava directly. You cannot without the MCP server running.

## Steps

1. Call `get-recent-activities` with `per_page: 1` to retrieve the latest activity.
2. Call `get-activity-details` with the activity ID.
3. If the activity has `has_heartrate: true`, extract heart rate data.
4. If the activity type is `Ride` or `Run`, call `get-activity-laps` for split-level data.
5. Optionally call `get-activity-streams` for granular pace/power/HR streams if available.
6. If the activity has a non-empty `start_latlng` array, call `get-weather-for-activity` using `start_latlng[0]` as latitude and `start_latlng[1]` as longitude, plus the date (YYYY-MM-DD from `start_date_local`) and hour (extract from `start_date_local`). Include weather in the output silently — don't announce you're fetching it.
7. Synthesize all data into the output format below.

## Output Format

Present the analysis in this order:

**Activity Header**
- Activity name, type, and date
- Total distance, moving time, elapsed time
- Elevation gain/loss

**Performance Summary**
- Average and max pace/speed (convert to appropriate units: min/km for runs, km/h for rides)
- Average and max heart rate (if available)
- Estimated power or effort score (if available)
- Calories burned
- Weather conditions (if available): temperature, feels-like, wind, conditions — shown as a single line, e.g. "🌤 18°C, feels 16°C · Wind 12 km/h · Partly cloudy"

**Lap / Split Breakdown** (if laps exist)
- Table: Lap | Distance | Time | Pace | HR

**Highlights**
- Best lap or fastest split
- Any PRs or achievements (check `achievement_count` and `pr_count`)
- Kudos count and social notes

**Coaching Note**
- One paragraph of qualitative feedback: Was the effort appropriate? Signs of fatigue or strong form? One actionable suggestion for next time.

## Privacy

- Do not display start/end GPS coordinates.
- Do not display the map URL unless the user explicitly asks.
- If `private: true` on the activity, note that this is a private activity and do not share summary externally without user confirmation.

## Example Prompts

- "Analyze my last run"
- "How was my workout today?"
- "What did I just finish?"
- "/athlete-latest"
