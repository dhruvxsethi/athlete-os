---
name: weather-enrichment
description: Enriches any Strava activity with historical weather data — temperature, wind, conditions — at the time and location of the workout. Use when the user asks about weather during a run or ride, why a workout felt hard, or wants context like "it was 28°C and windy." Uses Open-Meteo (free, no API key needed).
triggers:
  - "what was the weather like"
  - "how hot was it"
  - "weather during my run"
  - "conditions during my ride"
  - "why did that workout feel hard"
  - "enrich with weather"
  - "add weather context"
---

# Weather Enrichment

Add historical weather context to any Strava activity.

## Steps

1. Get the activity to enrich (latest, specific ID, or from context).
2. Call `get-activity-details` to retrieve:
   - `start_latlng` — array of [latitude, longitude]
   - `start_date_local` — ISO timestamp of activity start
3. If `start_latlng` is empty or null, note that GPS data isn't available for this activity and skip weather enrichment.
4. Parse the date as `YYYY-MM-DD` and hour from `start_date_local`.
5. Call `get-weather-for-activity` with latitude, longitude, date, and hour.
6. Present weather inline with the activity analysis.

## Output Format

Add a **Conditions** block to any activity analysis:

**Conditions at start**
| | |
|---|---|
| Temperature | X°C (feels like X°C) |
| Wind | X km/h |
| Sky | Clear / Partly cloudy / Overcast / Rain |
| Precipitation | X mm (or "None") |

**Weather Impact Note**
One sentence interpreting how conditions likely affected performance:
- Heat (>25°C): "Heat stress likely elevated HR — expect pace to be 5–10% slower than equivalent cool-weather effort"
- Cold (<5°C): "Cold conditions — muscles take longer to warm up, early splits often slower"
- Wind (>25 km/h): "Strong headwind/tailwind likely affected pace — compare effort, not pace"
- Rain: "Wet conditions — traction and grip affected for cycling"
- Ideal (10–18°C, calm, clear): "Near-ideal running/cycling conditions"

## Privacy

- Weather data uses GPS coordinates but only to query a public weather API — coordinates are not stored or shared.
- Only use `start_latlng` (start point), never route polyline data.

## Example Prompts

- "What was the weather like during my last run?"
- "Add weather context to my Tuesday ride"
- "Why did that workout feel so hard — what were the conditions?"
