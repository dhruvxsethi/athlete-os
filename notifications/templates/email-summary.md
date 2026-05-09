# Email Summary Template

Send training summaries to yourself or a team via email.

## Setup Options

Email delivery requires an outbound mail service. Choose one:

### Option A: Gmail via App Password
1. Enable 2-factor authentication on your Google account.
2. Go to https://myaccount.google.com/apppasswords and create an App Password.
3. Set environment variables:
```bash
export EMAIL_SMTP_HOST="smtp.gmail.com"
export EMAIL_SMTP_PORT="587"
export EMAIL_USERNAME="you@gmail.com"
export EMAIL_PASSWORD="your-app-password"
export EMAIL_FROM="you@gmail.com"
export EMAIL_TO="you@gmail.com"
```

### Option B: SendGrid / Postmark / Resend
Set `EMAIL_API_KEY` and `EMAIL_FROM` per the provider's docs. Update the send logic accordingly.

### Option C: No connector — manual copy
If no email connector is configured, Athlete OS formats the email body for you to copy and paste.

## Email Template

**Subject:** Training Update — [Date]

```
Hi,

Here's my training summary from Athlete OS:

━━━━━━━━━━━━━━━━━━━━━━
LATEST ACTIVITY
━━━━━━━━━━━━━━━━━━━━━━
Sport:     [Run / Ride / Swim]
Date:      [Date]
Distance:  [X km]
Time:      [Xh Xm]
Pace:      [X:XX/km or X km/h]
HR:        [Avg X / Max X bpm]
Elevation: [+X m]

Highlight: [One-sentence coaching note]

━━━━━━━━━━━━━━━━━━━━━━
WEEK AT A GLANCE (Mon–Sun)
━━━━━━━━━━━━━━━━━━━━━━
Total distance:  [X km]
Total time:      [Xh]
Sessions:        [N]
Top effort:      [Activity name]

━━━━━━━━━━━━━━━━━━━━━━

Powered by Athlete OS + Claude
```

## Privacy Notes

- Email is lower-risk than group channels for sharing detailed data, but still avoid GPS coordinates.
- If sending to a team distribution list, use the short format (distance, time, sport only) unless everyone has consented to sharing detailed data.
- Store all SMTP credentials in environment variables — never hard-code them.
