---
name: race-event-detection
description: Detects races and events in the athlete's Strava history and generates a race report. Use when the user asks about races, events, competitions, their 5K time, marathon results, or wants to know their race history. Identifies race activities by name patterns, workout type flags, and PR markers.
triggers:
  - "what races have I done"
  - "show me my race history"
  - "when did I run a 5K"
  - "what's my marathon time"
  - "race report"
  - "event results"
  - "what competitions have I entered"
  - "/athlete-race"
---

# Race & Event Detection

Identify, catalog, and analyze the athlete's race history from Strava.

## Steps

1. Call `get-all-activities` with a broad date range (use `after` for 3 years ago, or all-time). Paginate as needed.

2. Filter for likely race/event activities using these signals:
   - `workout_type` is `1` (Race) for runs or `11` (Race) for rides
   - Activity name contains keywords: "race", "5k", "10k", "half marathon", "marathon", "HM", "triathlon", "gran fondo", "sportive", "event", "competition", "parkrun"
   - `pr_count > 0` (personal records set — strong race indicator)
   - `achievement_count > 3` (multiple achievements suggest a race effort)

3. Sort identified races chronologically (most recent first by default).

4. For each race, call `get-activity-details` to retrieve full data.

5. Group by distance/type category:
   - 5K / 10K / Half Marathon / Marathon (for running)
   - Century / Gran Fondo / Sportive (for cycling)
   - Other

6. Identify PRs within each category.

## Output Format

**Race History** ([N] events found)

**By Distance**
| Date | Event Name | Distance | Time | Pace | PR? |
|------|------------|----------|------|------|-----|

**Personal Records**
| Distance | Best Time | Date | Event |
|----------|-----------|------|-------|

**Race Trends** (if 3+ races in same category)
- Are times improving, plateauing, or declining?
- Average race frequency per year
- Gap since last race

**Upcoming**
- Note: Strava does not store future events; suggest the user add a goal activity manually if needed.

## Edge Cases

- If no activities match race criteria, acknowledge this and suggest the user check if activities were tagged correctly in Strava.
- If the user asks for a specific race (e.g., "my Berlin Marathon result"), search by name and date, then call `get-activity-details`.

## Privacy

- Race results are generally less sensitive than training data. However, check `private` flag on activity before sharing externally.
- Do not share race locations/start points externally without user consent.

## Example Prompts

- "Show me all my races"
- "What's my half marathon PR?"
- "Have I run any marathons?"
- "/athlete-race"
