# Athlete OS — 3-Minute Demo Script

A guided walkthrough showcasing the core Athlete OS experience. Use this to demo the plugin, record a walkthrough video, or onboard a new user.

---

## Prerequisites

- Athlete OS plugin installed ✓
- Strava credentials configured ✓
- At least a few recent activities on Strava ✓

---

## Minute 1: Connect & First Look

**Prompt:**
> Check my Strava connection and show me my athlete profile.

*Expected: Claude confirms the Strava MCP is connected and shows your name, location, sport type, and key stats.*

**Prompt:**
> What did I do today? Or if nothing today, what was my last workout?

*Expected: Claude fetches the most recent activity and shows a clean summary — distance, time, pace, HR if available.*

---

## Minute 2: Deep Analysis

**Prompt:**
> Analyze my last run in detail. I want to see my splits, heart rate zones, and a coaching note.

*Expected: Claude runs a full analysis — lap table, HR zone breakdown, highlights, and a personalized coaching observation.*

**Prompt:**
> What did I do this week? Give me a full training summary.

*Expected: Claude generates the weekly report — activities by sport, totals, highlights, training load assessment.*

---

## Minute 3: Intelligence & Sharing

**Prompt:**
> How far have I run this year?

*Expected: Claude pulls YTD stats — total distance by sport, monthly breakdown, biggest week, milestones.*

**Prompt:**
> Write a post-workout summary for my last run and send it to Slack.

*Expected: Claude generates a shareable summary (strips GPS, checks privacy), then either sends it via the Slack webhook or outputs the formatted message for manual copy.*

---

## Bonus: More Things to Try

```
What was my longest ride ever?
```
```
Show me my race history.
```
```
Was I in zone 2 for my run this morning?
```
```
What's my half marathon PR?
```
```
How does my training compare to last month?
```

---

## Notes for Recording a Demo

- Use a real Strava account with at least 3 months of history for the best results.
- Blur or skip the profile picture and exact address in the athlete profile output.
- The weekly report and YTD summary are the most visually impressive outputs.
- The `/athlete-notify` command works best when Slack or Telegram is pre-configured.
