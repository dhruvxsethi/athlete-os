---
name: notification-summary
description: Formats a workout or training summary and sends it to Slack, Telegram, or email using real delivery. Use when the user asks to send their workout to Slack, post to Telegram, email a summary, or share with the team. Checks which channels are configured and delivers accordingly.
triggers:
  - "send my workout to Slack"
  - "post this to Telegram"
  - "email me my summary"
  - "share my run with the team"
  - "notify Slack"
  - "send workout summary"
  - "/athlete-notify"
---

# Notification Summary

Format and deliver a workout or training summary to a configured external channel.

## Step 1 — Get the content

- Default: latest activity → call `get-recent-activities` per_page:1, then `get-activity-details`
- If user says "weekly" → run the `weekly-training-summary` skill first
- If user references a specific activity from earlier in conversation → use that data

## Step 2 — Privacy strip (always, before sending)

- Remove GPS coordinates (`start_latlng`, `end_latlng`, polyline)
- Check `private: true` → warn user, ask for explicit confirmation before sending
- Check activity name for location info (e.g. "Run from Baker St") → ask: "Should I use this name or a generic one like 'Morning Run'?"
- Strip HR data by default for group channels → include only if user opts in

## Step 3 — Check which channels are configured

```bash
echo "SLACK:$([ -n "$SLACK_WEBHOOK_URL" ] && echo yes || echo no)"
echo "TELEGRAM:$([ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ] && echo yes || echo no)"
echo "EMAIL:$([ -n "$EMAIL_USERNAME" ] && echo yes || echo no)"
```

If none are configured → skip to Step 5 (manual copy).

## Step 4 — Format the message

### Short format (Slack / Telegram)
Build the message string from the activity data. Example:
```
🏃 Run | 10.2 km | 52:14 | 5:07/km
📅 {date}
❤️ Avg HR: {avg_hr} bpm
⛰️ Elevation: +{elevation} m
✅ {one highlight sentence}
```
Omit HR line if `has_heartrate` is false. Omit elevation if < 20m.

### Long format (Email)
```
Subject: Training Update — {date}

Activity: {sport} on {date}
Distance: {distance} km
Time: {moving_time}
Pace / Speed: {pace}
{HR and elevation if available}

{coaching note paragraph}

— Athlete OS
```

## Step 5 — Deliver

### Slack
```bash
curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$(echo "$MESSAGE" | sed 's/"/\\"/g')\"}"
```
Check response — `ok` means delivered. Anything else → show the error.

### Telegram
```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "parse_mode=Markdown" \
  --data-urlencode "text=$MESSAGE"
```

### Email (via curl + SMTP — requires EMAIL_* vars)
For Gmail with app password:
```bash
curl -s --ssl-reqd \
  --url "smtps://${EMAIL_SMTP_HOST}:465" \
  --user "${EMAIL_USERNAME}:${EMAIL_PASSWORD}" \
  --mail-from "${EMAIL_FROM}" \
  --mail-rcpt "${EMAIL_TO}" \
  --upload-file - <<EOF
From: ${EMAIL_FROM}
To: ${EMAIL_TO}
Subject: Training Update — {date}
Content-Type: text/plain

{message body}
EOF
```

## Step 5 (fallback) — Manual copy

If no connector is configured or delivery fails, output:

> "No notification channel configured yet. Here's your formatted message — copy and paste it:
> 
> [formatted message]
>
> To automate this, add `SLACK_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHAT_ID`, or email vars to your `.env`. See `docs/setup-guide.md`."

## After sending

Confirm: "✅ Sent to [channel]." Show the exact message that was delivered.

## Privacy Rules (non-negotiable)

- Never include GPS coordinates in any external message
- Never send a `private: true` activity without explicit "yes" from user
- For group channels: distance + time only by default, unless user says "include my HR"
