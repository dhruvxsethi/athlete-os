---
name: athlete-status
description: Check Athlete OS health — Strava connection, token status, integrations (Oura, Telegram), and a quick summary of recent activity. Run this when you're not sure if everything is set up correctly.
---

Run a full health check for Athlete OS.

## Steps

1. **Strava connection** — Call `check-strava-connection`.
   - Returns a name: ✅ Connected
   - Errors: ❌ Not connected → invoke the `oauth-setup` skill

2. **Token and integration status** — Read credentials file (no live calls, no test messages):
   ```bash
   node -e "
   const fs = require('fs'), os = require('os'), path = require('path');
   const f = path.join(os.homedir(), '.config/athlete-os/credentials.json');
   try {
     const c = JSON.parse(fs.readFileSync(f, 'utf8'));
     ['client_id','client_secret','access_token','refresh_token'].forEach(k =>
       console.log(k + '=' + (c[k] ? 'set' : 'NOT SET'))
     );
     console.log('athlete=' + (c.athlete_name || 'unknown'));
     console.log('connected_at=' + (c.connected_at || 'unknown'));
     console.log('oura=' + (c.oura_access_token ? 'configured' : 'not configured'));
     console.log('telegram=' + (c.telegram_bot_token ? 'configured' : 'not configured'));
   } catch { console.log('credentials=not found'); }
   "
   ```

3. **Oura connection** (only if oura shows configured above) — Call `check-oura-connection` to get today's readiness score.

4. **Recent activity** — Call `get-recent-activities` with `per_page: 1`. Show the most recent activity name, type, distance, and date.

## Output Format

```
Athlete OS — Status

✅ Strava         Connected as Dhruv Sethi
✅ Access token   Set
✅ Refresh token  Set
📅 Connected      2026-04-15T09:32:11Z

Integrations
  Oura       ✅ configured  (readiness: 82/100 today)
  Telegram   ✅ configured

📊 Last activity  Morning Run · 8.4 km · 2 days ago

Everything looks good.
Try: "What did I do this week?" · "/athlete-load" · "/athlete-goals"
```

If anything is broken, give the specific fix — don't just report the error.
If Oura or Telegram show "not configured", say: "Say 'connect my Oura' or 'set up Telegram notifications' to enable them."
