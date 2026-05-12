---
name: athlete-reset
description: Reset Athlete OS — wipe credentials and start fresh. Use when the user wants to reconnect Strava, clear all saved tokens, or troubleshoot by starting over.
---

# Athlete OS Reset

Wipe all saved credentials and optionally saved goals so the user can start fresh.

## Steps

### 1 — Confirm with the user

> "This will delete your saved Strava credentials (and optionally your goals). You'll need to reconnect Strava after.
>
> Are you sure?"

Wait for confirmation. If they say no, stop.

### 2 — Ask what to wipe

Ask (multiSelect: true):
- "Strava credentials (access token, refresh token, client ID/secret)"
- "Goals (saved annual targets)"
- "Everything — full clean slate"

### 3 — Run the reset

**Wipe credentials only:**
```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path');
const f = path.join(os.homedir(), '.config/athlete-os/credentials.json');
if (!fs.existsSync(f)) { console.log('no credentials file found'); process.exit(0); }
const c = JSON.parse(fs.readFileSync(f, 'utf8'));
delete c.access_token;
delete c.refresh_token;
delete c.expires_at;
delete c.athlete_id;
delete c.athlete_name;
delete c.client_id;
delete c.client_secret;
delete c.connected_at;
delete c.last_processed_activity_id;
fs.writeFileSync(f, JSON.stringify(c, null, 2));
console.log('credentials cleared');
"
```

**Wipe goals only:**
```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path');
const f = path.join(os.homedir(), '.config/athlete-os/goals.json');
if (fs.existsSync(f)) { fs.unlinkSync(f); console.log('goals cleared'); }
else { console.log('no goals file found'); }
"
```

**Full reset (everything):**
```bash
rm -f ~/.config/athlete-os/credentials.json ~/.config/athlete-os/goals.json
echo "full reset done"
```

### 4 — Confirm and tell them what's next

> "✅ Reset complete.
>
> To reconnect, say **'connect my Strava'** — it takes about 2 minutes.
> After OAuth completes, you'll need to **restart Claude Code (⌘Q)** once for the tools to load."
