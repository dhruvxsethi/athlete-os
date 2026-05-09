---
name: oura-setup
description: Connect an Oura Ring so Athlete OS can read your recovery, HRV, and sleep data alongside Strava training. Use when the user wants to connect Oura, set up recovery tracking, or integrate their ring.
triggers:
  - "connect Oura"
  - "set up Oura"
  - "Oura Ring"
  - "connect my ring"
  - "recovery data"
  - "HRV tracking"
  - "sleep tracking"
---

# Oura Ring Setup

Connect Oura in under 60 seconds — just a personal access token, no OAuth flow.

## Steps

### 1. Check if already connected

Call `check-oura-connection`. If it returns a readiness score, they're already set up — confirm and offer to reconnect.

### 2. Explain what's needed

> "Oura uses a personal access token — no browser auth needed. Here's how to get one:
> 1. Go to **cloud.ouraring.com/personal-access-tokens**
> 2. Click **Create New Personal Access Token**
> 3. Give it any name (e.g. 'Athlete OS')
> 4. Copy the token — it starts with a long string of characters"

### 3. Ask for the token

> "What's your Oura personal access token?"

### 4. Save to credentials file

Construct and run this command, substituting the actual token value (no angle brackets, no quotes around the token unless it contains spaces):

```
node -e "const fs=require('fs'),os=require('os'),path=require('path'),f=path.join(os.homedir(),'.config/athlete-os/credentials.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));c.oura_access_token='TOKEN_HERE';fs.writeFileSync(f,JSON.stringify(c,null,2));console.log('saved');"
```

Replace `TOKEN_HERE` with the user's actual token. Run the complete single-line command so there are no shell escaping issues.

### 5. Verify

Call `check-oura-connection`. If it returns a readiness score:

> "✅ Oura connected! Your readiness score today is [X]/100.
>
> Recovery data is now woven into your training analysis. Try:
> - 'What's my training load?' — now includes your Oura readiness score
> - 'How did I sleep this week?' — shows sleep breakdown with HRV trend"

## Error Handling

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Token is wrong — check for extra spaces or truncation |
| No data returned | Ring hasn't synced yet — open the Oura app to sync, then retry |
| Credentials file not found | Run Strava setup first: "Connect my Strava account" |

## What Athlete OS does with Oura data

- **Training load**: readiness score shown alongside CTL/ATL/TSB
- **Post-workout debrief**: flags when HR was elevated relative to low HRV (sign of cumulative fatigue)
- **Weekly summary**: notes recovery quality for the week if HRV trend is notable
- **Coaching notes**: will caveat hard session recommendations if readiness is low

## For cloud routines

Add `OURA_ACCESS_TOKEN` to **claude.ai/settings → Routines → Environment variables** so scheduled summaries can include recovery context.
