# Connectors

Athlete OS uses `~~connector` placeholders to reference external tools generically. When you install the plugin, replace these with the specific tool you use.

## How Placeholders Work

Skill files use `~~slack`, `~~telegram`, and `~~email` to describe the category of tool needed — not a specific product. This keeps the plugin distributable and tool-agnostic.

## Connectors for This Plugin

| Category | Placeholder | Supported Options | Required Env Vars |
|----------|-------------|-------------------|-------------------|
| Chat | `~~slack` | Slack (webhook) | `SLACK_WEBHOOK_URL` |
| Chat | `~~telegram` | Telegram (bot) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Email | `~~email` | Gmail, SendGrid, Postmark | `EMAIL_SMTP_HOST`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_TO` |

## Which Connectors Are Required?

Only **Strava** is required. All notification connectors (`~~slack`, `~~telegram`, `~~email`) are optional.

If no notification connector is configured, Athlete OS will format the message for you and offer it as plain text to copy and paste manually.

## Setup Instructions

See:
- `notifications/templates/slack-webhook.md` — Slack setup
- `notifications/templates/telegram-bot.md` — Telegram setup
- `notifications/templates/email-summary.md` — Email setup
- `docs/setup-guide.md` — Full Strava setup
