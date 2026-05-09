---
name: post-workout-debrief
description: Quick post-workout coaching debrief immediately after finishing a session. Use when the athlete has just finished training and wants feedback — effort level, what went well, what to watch, and what to do next. More conversational than latest-activity-analysis, which is a full analytical report.
triggers:
  - "just finished a run"
  - "just got back from a ride"
  - "just finished training"
  - "debrief my workout"
  - "debrief my run"
  - "debrief my ride"
  - "how did my workout go"
  - "feedback on my workout"
  - "how did that go"
  - "/athlete-debrief"
---

## MCP connection check

Before doing anything, call `check-strava-connection`. If not available, say:

> "The Strava connection isn't active yet. Please fully quit Claude Code (⌘Q) and reopen it."

# Post-Workout Debrief

Give the athlete direct coaching feedback right after they finish a session. This is a quick read, not a full report.

## Steps

1. Call `get-recent-activities` with `per_page: 1`.

2. Check recency — calculate how long ago the activity ended using `start_date_local` + `elapsed_time`. If it ended more than 4 hours ago, note it briefly ("This one finished a little while ago, but let's go through it.") — don't block on this.

3. Call `get-activity-details` with the activity ID.

4. If the activity type is Run or Ride, call `get-activity-laps`.

5. If `start_latlng` is non-empty (a `[lat, lng]` array), call `get-weather-for-activity` using `start_latlng[0]` as latitude and `start_latlng[1]` as longitude. Include weather context silently in the debrief — don't announce you're fetching it.

6. **Ask one follow-up question** before giving the full debrief — unless the user already stated their goal in the message that triggered this skill:
   - Run: "Did you have a target pace or effort for this one, or was it free?"
   - Ride: "Structured ride or just getting out?"
   - Swim: "Technique focus or distance work?"
   - Other: "What were you going for today?"

7. Produce the debrief based on their answer plus the data.

## Output Format

Keep it conversational. Short paragraphs, not bullet walls. Skip sections with no data.

**Opening line** — Name the activity and lead with one observation that sets the tone. Make it specific, not generic.
> "Good 10k this morning — you held it together in km 6–8 where your splits tightened instead of falling apart."

**Effort read** (2–3 sentences)
- Was the effort appropriate for the stated goal? Use HR if `has_heartrate: true`, otherwise pace relative to recent average.
- Any pacing pattern to note: even splits, positive split (faded), negative split (strong finish)?
- If weather was retrieved: one inline note if conditions were a real factor (heat, wind, rain).

**One thing that went well** — specific, grounded in the data.
> "Your km 4–7 were your best splits — 4:52–4:55/km, which is right where your threshold should be."

**One thing to watch** — honest, not harsh.
> "Last 2km dropped to 5:18/km — could be end-of-run fatigue, or you went out slightly hot. Worth watching next long effort."

**PRs / achievements** — if `pr_count > 0` or `achievement_count > 0`, call them out here with context.

**What's next** (one sentence)
- Light effort: suggest the training continues
- Moderate effort: suggest a recovery activity or easy day
- Hard effort: suggest rest or easy cross-training

## Tone

- Direct, like a coach who knows you — not cheerleader mode
- Don't pad with generic praise ("Great job staying consistent!")
- No opening pleasantries or closing summaries
- If data is thin (no HR, no laps, short activity), keep the debrief proportionally shorter

## Example Prompts

- "Just finished a run — how'd it go?"
- "Debrief my ride"
- "Give me feedback on my workout"
- "/athlete-debrief"
