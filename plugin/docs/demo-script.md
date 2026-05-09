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

## Minute 3: Intelligence & Automation

**Prompt:**
> What's my training load looking like right now?

*Expected: Claude computes CTL, ATL, and TSB from your history, shows a 6-week trend chart, and gives a state label (Fresh / Building / Fatigued).*

**Prompt:**
> How far have I run this year vs my goal?

*Expected: If goals are set, Claude shows a progress bar and year-end projection. If not, it prompts to set one.*

**Prompt:**
> Send my weekly summary to Telegram.

*Expected: If Telegram is configured, Claude generates the weekly report and delivers it directly. Otherwise, it offers to set up Telegram.*

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
```
Set up my routines.
```
```
What's my recovery like this week?
```

---

## Notes for Recording a Demo

- Use a real Strava account with at least 3 months of history for the best results.
- Blur or skip the profile picture and exact address in the athlete profile output.
- The weekly report, training load chart, and goal progress are the most visually impressive outputs.
- Set up Telegram notifications beforehand to demo the automated delivery feature.
