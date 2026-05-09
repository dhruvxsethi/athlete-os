# Athlete OS — Privacy & Security Guide

Athlete OS handles personal health and location data. These guidelines are enforced by default and should not be overridden without understanding the implications.

---

## Default Privacy Rules

### 1. No GPS Coordinates Shared by Default

Strava activities include precise GPS tracks with start and end points. These can reveal your home address, workplace, or regular routes.

**Athlete OS never:**
- Displays raw GPS coordinates
- Shares Strava map URLs externally
- Includes route polylines in summaries

**Athlete OS does:**
- Show city/region-level location context (e.g., "San Francisco, CA")
- Omit location entirely from externally shared messages by default

### 2. Private Activities Stay Private

If an activity is flagged `private: true` on Strava:
- Athlete OS will note the privacy flag before any action
- It will ask for explicit user confirmation before generating a shareable summary
- It will never send a private activity to Slack, Telegram, or email without a confirmed "yes"

### 3. Activity Names Are Sanitized Before Sharing

Many users name their activities with location info (e.g., "Morning run — Park St to Beach"). Before sending externally:
- Athlete OS will display the activity name and ask: "Should I use this name or a generic description?"
- If in doubt, it defaults to a generic format: `[Sport] | [Date]`

### 4. Team & Club Data Requires Consent

When generating team leaderboards or club summaries:
- Only the requesting user's own data is shared externally by default
- Other club members' names, times, and routes are never included in external messages
- Aggregate/anonymized totals are acceptable for team channels

### 5. Heart Rate and Health Data Is Sensitive

HR data is personal health information:
- It's included in personal debriefs by default
- It's excluded from shared summaries unless the user explicitly opts in ("include my HR data")
- Never share HR data to team or group channels without explicit user request

---

## Secret Management

### Environment Variables Only

All credentials must be stored as environment variables. Never put them in:
- Code files
- Claude conversation history
- Shared documents or notes
- Version control (git)

Sensitive variables:
- `STRAVA_CLIENT_SECRET` — equivalent to a password, gives API access
- `STRAVA_ACCESS_TOKEN` / `STRAVA_REFRESH_TOKEN` — grant access to your Strava data
- `SLACK_WEBHOOK_URL` — anyone with this URL can post to your channel
- `TELEGRAM_BOT_TOKEN` — anyone with this can control your bot
- Email SMTP credentials

### Token Rotation

Strava access tokens expire every 6 hours. The MCP server handles refresh automatically using `STRAVA_REFRESH_TOKEN`. If refresh fails, re-run the token exchange (see `docs/setup-guide.md`).

### Webhook URL Security

Slack webhook URLs and Telegram bot tokens are effectively bearer tokens. If you suspect one has been exposed:
- Slack: go to api.slack.com → Your App → Incoming Webhooks → Revoke and regenerate
- Telegram: message @BotFather → `/revoke` to get a new token

---

## What Athlete OS Cannot Do

By design, Athlete OS has **read-only** Strava access in the current version. It cannot:
- Create or modify activities
- Follow/unfollow athletes
- Post kudos or comments on your behalf
- Access financial or payment data
- Access activities of other athletes (only your own)

---

## Asking Before Sending

Athlete OS will always confirm before sending data externally. If it ever sends data without asking, that is a bug — please report it.

The confirmation always includes:
1. What data is being sent
2. Where it is being sent
3. Any potential privacy considerations
