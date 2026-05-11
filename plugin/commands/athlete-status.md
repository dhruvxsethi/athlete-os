---
name: athlete-status
description: Check Athlete OS health — Strava connection, token status, integrations (Oura, Telegram), and a quick summary of recent activity. Run this when you're not sure if everything is set up correctly, or when you first install to see what you can do.
---

Run a full health check for Athlete OS, then show what the user can do next.

## Steps

1. **Strava connection** — Call `check-strava-connection`.
   - Returns a name: ✅ Connected
   - Errors: ❌ Not connected → tell them to say "Connect my Strava account"

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
```

If anything is broken, give the specific fix — don't just report the error.
If Oura or Telegram show "not configured", say: "Say 'connect my Oura' or 'set up Telegram notifications' to enable them."

## What you can do

After the status block, always show this section (adapt based on what's connected):

```
─────────────────────────────────────────────────
What you can ask:

  Workouts
  · "How was my last run?"
  · "Analyze my last workout" (splits, laps, HR)
  · "How polarized is my training?" (zone distribution)

  Training overview
  · "What did I do this week?"
  · "Show me monthly trends"
  · "How fit am I right now?" (training load / CTL/ATL/TSB)

  Goals
  · "Set my running goal to 1000km for 2026"
  · "Am I on track for my goals?"

  [If Oura connected:]
  · "What's my readiness today?"
  · "Show me my sleep this week"

  [If Telegram configured:]
  · "Set up my routines" → automated debriefs and summaries sent to your phone

─────────────────────────────────────────────────
```

Omit the Oura and Telegram sections if those integrations aren't configured — instead add:
```
  Not set up yet:
  · "Connect my Oura" — add recovery data to every analysis
  · "Set up Telegram" — get summaries pushed to your phone
```
