---
name: year-to-date-summary
description: Summarizes the athlete's training totals and milestones from January 1st of the current year to today. Use when the user asks how far they've run or ridden this year, YTD totals, annual progress, or year-to-date stats. Also surfaces monthly breakdown and progress toward common goals.
triggers:
  - "how far have I run this year"
  - "year to date summary"
  - "YTD stats"
  - "how much have I trained this year"
  - "annual totals"
  - "how many kilometres this year"
  - "/athlete-ytd"
---

# Year-to-Date Summary

Summarize all training from January 1st of the current year through today.

## Steps

1. Determine the Unix timestamp for January 1st of the current year at 00:00:00 UTC.
2. Call `get-all-activities` with `after` set to that timestamp. Paginate if needed (use `per_page: 200`, repeat with `page` param until empty).
3. Group all activities by type and by month.
4. Aggregate per-type totals: distance, duration, elevation, activity count.
5. Aggregate per-month totals for the primary sport(s).
6. Call `get-athlete-stats` to cross-reference official Strava YTD totals (use as a sanity check).
7. Identify standout months, longest streaks, and any milestone distances (e.g., first 100km week, longest long run).

## Output Format

**[Year] Year-to-Date — as of [Today's Date]**

**Overall Totals**
| Metric | Value |
|--------|-------|
| Total Activities | N |
| Total Distance | X km |
| Total Time | Xh |
| Total Elevation | X m |

**By Sport**
| Sport | Activities | Distance | Time | Elevation |
|-------|------------|----------|------|-----------|

**Monthly Breakdown** (primary sport or all sports)
| Month | Activities | Distance | Time |
|-------|------------|----------|------|

**Milestones & Highlights**
- Biggest week: [week of MM/DD, X km]
- Longest single activity: [name, distance, date]
- Most active month: [month, X activities, X km]
- Longest active streak: [N days]
- PRs set this year: N

**Progress Check**
- If the user has mentioned a goal (e.g., "run 1000km this year"), calculate progress and projected year-end total.
- Otherwise, note what pace they're on (annualized rate).

## Privacy

- Do not display location data or route maps.
- Monthly breakdown is safe to share; avoid per-activity names if sending to a team channel.

## Example Prompts

- "How far have I run this year?"
- "YTD training summary"
- "What are my annual totals?"
- "/athlete-ytd"
