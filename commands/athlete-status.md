---
name: athlete-status
description: Check Athlete OS health — Strava connection, token status, configured notification channels, and a quick summary of recent activity. Run this when you're not sure if everything is set up correctly.
---

Run a full health check for Athlete OS.

## Steps

1. **Connection check** — Call `check-strava-connection`.
   - If it returns a name: ✅ Connected
   - If it errors: ❌ Not connected → invoke the `oauth-setup` skill

2. **Token check** — Read the `.env` file:
   ```bash
   grep -E "STRAVA_|SLACK_|TELEGRAM_|EMAIL_" .env 2>/dev/null | sed 's/=.*/=✓ set/' || echo "No .env found"
   ```
   Show which variables are set (values masked).

3. **Recent activity pulse** — Call `get-recent-activities` with `per_page: 1`.
   Show the most recent activity name, type, distance, and date as a quick sanity check that data is flowing.

4. **Notification channels** — Check which are configured:
   ```bash
   [ -n "$SLACK_WEBHOOK_URL" ] && echo "Slack: configured" || echo "Slack: not set"
   [ -n "$TELEGRAM_BOT_TOKEN" ] && echo "Telegram: configured" || echo "Telegram: not set"
   [ -n "$EMAIL_USERNAME" ] && echo "Email: configured" || echo "Email: not set"
   ```

## Output Format

```
Athlete OS — Status

✅ Strava         Connected as Jane Smith
✅ Access token   Set
✅ Refresh token  Set

📊 Last activity  Tuesday run · 8.4 km · 2 days ago

Notifications
  Slack      ✅ configured
  Telegram   ❌ not set
  Email      ❌ not set

Everything looks good. Try: "What did I do this week?"
```

If anything is broken, give the specific fix — don't just report the error.
