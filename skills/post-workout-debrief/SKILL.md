---
name: post-workout-debrief
description: Generates a rich post-workout debrief immediately after a session. Use when the user has just finished a workout and wants feedback, a shareable summary, coaching notes, or wants to log how they felt. Also generates a ready-to-share summary for Slack, Telegram, or email if requested.
triggers:
  - "just finished my run"
  - "post-workout summary"
  - "debrief my workout"
  - "generate a workout summary"
  - "I just got back from a ride"
  - "how did I do"
  - "write up my workout"
  - "send my workout summary"
---

# Post-Workout Debrief

Generate a fresh, personal debrief of the athlete's most recently completed activity.

## Steps

1. Call `get-recent-activities` with `per_page: 1` to fetch the latest activity.
2. Call `get-activity-details` on the activity ID.
3. If available, call `get-activity-laps` for split data.
4. Ask the user one optional follow-up question: "How did you feel during this session? (optional)" — use their answer to enrich the coaching note.
5. Generate the debrief in two parts: a **detailed personal version** and a **shareable short version**.

## Output Format

### Personal Debrief

**[Activity Name] — [Date]**
- Distance: X km | Time: Xh Xm | Pace: X:XX/km
- Heart Rate: avg X / max X bpm (if available)
- Elevation: +X m
- Effort level: easy / moderate / hard (inferred from HR zones or pace vs. threshold)

**What Went Well**
- 2–3 positives drawn from the data (e.g., "Consistent pacing — your splits varied by less than 5 seconds/km")

**Areas to Watch**
- 1–2 observations (e.g., "HR crept up in the final 2km — signs of early fatigue or under-fueling")

**Coaching Note**
- One paragraph of personalized feedback based on the session data and any subjective notes provided.

**Next Session Suggestion**
- Light recovery / easy aerobic / rest — based on estimated effort.

---

### Shareable Summary (plain text, copy-paste ready)

```
🏃 [Sport] | [Distance] | [Time] | [Pace]
📍 [City/Region only]
❤️ Avg HR: X bpm
✅ [One highlight sentence]
```

This shareable version is safe for Slack, Telegram, or social — location is city-level only, no GPS, no private flags.

## If User Asks to Send Externally

- Confirm which channel (Slack / Telegram / email).
- Use the shareable summary format only.
- Ask: "Should I include activity name?" — some users name activities with personal location info.
- See the `notification-summary` skill for delivery steps.

## Privacy

- Always distinguish between the personal debrief (detailed, stay local) and the shareable version (stripped, safe to send).
- Never send the personal debrief externally without explicit user confirmation.
- Check `private: true` on activity — if set, warn the user before any external sharing.

## Example Prompts

- "I just finished my run, give me a debrief"
- "Post-workout summary"
- "How did my ride go? Send a summary to Slack."
