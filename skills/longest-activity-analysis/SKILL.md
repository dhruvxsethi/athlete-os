---
name: longest-activity-analysis
description: Finds and analyzes the athlete's longest activity of a given type within a specified time period. Use when the user asks about their longest ride, longest run, biggest day, or best endurance effort. Defaults to all-time unless a period is specified.
triggers:
  - "what was my longest ride"
  - "what was my longest run"
  - "longest activity"
  - "biggest day"
  - "best long run"
  - "longest ride in 2025"
  - "my furthest run ever"
  - "/athlete-longest"
---

# Longest Activity Analysis

Find and analyze the athlete's longest activity for the requested sport and time period.

## Steps

1. Parse the user's request to determine:
   - **Sport type**: Run, Ride, Swim, or all types (default: all)
   - **Time period**: "this year", "in 2024", "all time" (default: all time)
   - Convert to `after`/`before` Unix timestamps accordingly.

2. Call `get-all-activities` with the appropriate `after`/`before` params and `per_page: 200`. Paginate if needed.

3. Filter activities by the requested sport type.

4. Sort by `distance` descending. Select the top result.

5. Call `get-activity-details` on the longest activity ID.

6. Call `get-activity-laps` if laps are available.

7. Produce the analysis below.

## Output Format

**Longest [Sport] — [Time Period]**

**Activity Details**
- Name, date, and location (city/region only — no GPS coordinates)
- Distance: X km / X miles
- Moving time: Xh Xm Xs
- Elapsed time: Xh Xm Xs
- Elevation gain: X m

**Performance**
- Average pace / speed
- Average and max heart rate (if available)
- Estimated effort / suffer score

**Lap/Split Breakdown** (if available)
| Lap | Distance | Time | Pace | HR |
|-----|----------|------|------|----|

**Context**
- How this compares to their average distance for this sport
- Whether it's an all-time personal record
- Approx. equivalent (e.g., "This is equivalent to running 3.2 marathons back to back")

**Recovery Note**
- Based on distance and estimated effort, suggest appropriate recovery time before next hard session.

## Edge Cases

- If the user asks for "longest ride in 2025" but has no rides in 2025, say so clearly and offer to search a different period.
- If multiple activities are tied in distance (rare), list the top 3.

## Privacy

- Use city/region for location context; never display raw GPS start/end points.
- Do not share this analysis externally without user confirmation.

## Example Prompts

- "What was my longest run ever?"
- "Show me my longest cycling ride in 2025"
- "What's my biggest endurance day?"
- "/athlete-longest"
