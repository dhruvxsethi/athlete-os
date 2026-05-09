---
name: team-leaderboard-summary
description: Fetches Strava club data and generates a team leaderboard or group fitness summary. Use when the user asks about their club standings, how their team is doing, group challenges, or wants a leaderboard for their running/cycling club.
triggers:
  - "how is my team doing"
  - "club leaderboard"
  - "team standings"
  - "how am I doing in the club"
  - "group challenge"
  - "show me the club stats"
  - "team training summary"
---

# Team Leaderboard Summary

Generate a leaderboard or group summary from the athlete's Strava clubs.

## Steps

1. Call `list-athlete-clubs` to get the athlete's club memberships.
2. If the user specifies a club name, match it; otherwise ask "Which club?" if multiple clubs exist.
3. Note: Strava's public API has limited club activity access. Work with what is available:
   - Club details (name, member count, sport type, location)
   - The athlete's own activities can be compared to club challenges if visible
4. If club leaderboard data is unavailable via API (Strava restricts this on most plans), explain the limitation and offer to generate a personal-vs-goal comparison instead.
5. Generate the best available summary.

## Output Format

**[Club Name] — Weekly Snapshot**

**Club Info**
- Members: N
- Sport: Running / Cycling / etc.
- Location: [City, Country]

**Your Contribution This Week**
| Activity | Distance | Time | Date |
|----------|----------|------|------|
| Total: | X km | Xh | |

**Club Challenge Progress** (if visible)
- Challenge name and goal
- Your progress: X / X km (X%)
- Status: On track / Behind / Completed

**Note on Leaderboard Data**
If the full club leaderboard is unavailable via API, include:
> "Full club leaderboard data requires Strava's partner API. I can show your personal contribution and club details. For the full leaderboard, visit strava.com/clubs/[club-id]/leaderboard."

## Privacy

- Do not display other members' full names or private activities without their consent.
- When sending to a team channel, only include aggregated totals or the requesting user's data — never other individuals' data without consent.
- Always confirm with the user before sending club data to external channels.

## Example Prompts

- "How is my running club doing this week?"
- "Show me the club leaderboard"
- "What's my contribution to the team challenge?"
