# Athlete OS — Setup Guide

This guide walks you through getting Athlete OS fully connected in under 10 minutes.

---

## Step 1: Get Your Strava API Credentials

1. Go to https://www.strava.com/settings/api while logged into your Strava account.
2. Fill in the **Create App** form:
   - **Application Name:** `Athlete OS` (or any name you like)
   - **Category:** `Data Importer`
   - **Club:** leave blank
   - **Website:** `http://localhost` (required, can be anything valid)
   - **Authorization Callback Domain:** `localhost`
3. Click **Create** and agree to the API terms.
4. You'll see your app's **Client ID** and **Client Secret** — copy both.

---

## Step 2: Get Your Access Token and Refresh Token

Strava uses OAuth 2.0. The quickest way to get tokens for personal use:

### Option A: Use the Strava Token Exchange Tool (easiest)

Visit this URL in your browser (replace `YOUR_CLIENT_ID`):

```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read,activity:read_all,profile:read_all
```

1. Click **Authorize** on the Strava page.
2. You'll be redirected to `localhost` — the URL will contain `?code=XXXXXXXX`. Copy that code.
3. Exchange the code for tokens via curl:

```bash
curl -X POST https://www.strava.com/api/v3/oauth/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=YOUR_CODE \
  -d grant_type=authorization_code
```

4. The response contains `access_token` and `refresh_token`. Copy both.

### Option B: Use an OAuth Helper Script

The `@r-huijts/strava-mcp-server` package includes a setup flow. Run:

```bash
npx @r-huijts/strava-mcp-server --setup
```

Follow the prompts to complete OAuth authorization.

---

## Step 3: Configure Environment Variables

Copy the example env file:

```bash
cp docs/.env.example .env
```

Fill in your values:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_ACCESS_TOKEN=your_access_token
STRAVA_REFRESH_TOKEN=your_refresh_token
```

---

## Step 4: Install the Plugin in Claude Code

From the `athlete-os/` directory:

```bash
claude plugin install .
```

Or install from the packaged `.plugin` file:

```bash
claude plugin install athlete-os.plugin
```

---

## Step 5: Optional — Configure Notification Connectors

To enable `/athlete-notify`:

**Slack:**
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```
See `notifications/templates/slack-webhook.md` for full setup.

**Telegram:**
```bash
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_CHAT_ID="..."
```
See `notifications/templates/telegram-bot.md` for full setup.

**Email:**
```bash
export EMAIL_SMTP_HOST="smtp.gmail.com"
export EMAIL_USERNAME="you@gmail.com"
export EMAIL_PASSWORD="your-app-password"
export EMAIL_TO="you@gmail.com"
```
See `notifications/templates/email-summary.md` for full setup.

---

## Step 6: Test Your Connection

Open Claude Code and try:

```
Check my Strava connection
```

Then:

```
What did I do this week?
```

If you see your activities, you're all set.

---

## Troubleshooting

**"No activities found"**
- Ensure `STRAVA_ACCESS_TOKEN` is set and not expired. Access tokens expire after 6 hours; the MCP server uses `STRAVA_REFRESH_TOKEN` to automatically refresh.

**"Unauthorized" error**
- Double-check your `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`.
- Ensure the OAuth scope included `activity:read_all`.

**MCP server not connecting**
- Make sure Node.js (v18+) and npx are installed: `node --version && npx --version`.
- Try running the server manually: `npx @r-huijts/strava-mcp-server` and check for errors.
