# Slack Webhook Template

Send workout summaries to a Slack channel via an incoming webhook.

## Setup

1. Go to https://api.slack.com/apps and create a new app (or use an existing one).
2. Enable **Incoming Webhooks** under Features.
3. Click **Add New Webhook to Workspace** and choose a channel.
4. Copy the webhook URL.
5. Add it to your environment:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../..."
```

Or add to your `.env` file (see `docs/.env.example`).

## Message Format

Athlete OS sends Slack messages in this format:

```
🏃 *Run* | 10.2 km | 52:14 | 5:07/km
📅 May 9, 2026
❤️ Avg HR: 152 bpm
⛰️ Elevation: +85 m
✅ Solid aerobic effort — negative split in the final 3km.
```

For weekly reports:
```
📊 *Weekly Training — May 5–11*
🏃 Running: 3 sessions | 28 km | 2h 22m
🚴 Cycling: 1 session | 45 km | 1h 48m
⭐ Best effort: Tuesday tempo run — new 10km PR
```

## Sending via curl (manual test)

```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  --data '{
    "text": "🏃 *Run* | 10.2 km | 52:14 | 5:07/km\n📅 Today\n✅ Great aerobic session."
  }'
```

## Privacy Notes

- The webhook sends to a channel visible to all members. Never include GPS coordinates or Strava activity URLs by default.
- If the channel is a private group channel, standard privacy still applies — do not include other people's data without consent.
- The `SLACK_WEBHOOK_URL` is sensitive — treat it like a password, never commit it to version control.
