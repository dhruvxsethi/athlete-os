#!/usr/bin/env node
/**
 * Athlete OS — Strava MCP Server
 * Zero npm dependencies. Pure Node.js built-ins only.
 * Requires Node.js 18+ (for built-in fetch).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { drawBarChart, drawLineChart, resolveColor } from "./chart.js";

// ─── Credentials ──────────────────────────────────────────────────────────────
// Stored at ~/.config/athlete-os/credentials.json
// Written by oauth.js after the user authorizes. Read fresh on every tool call.

// In-memory token cache for remote-agent (env-var) mode.
// Prevents a fresh OAuth exchange on every tool call when running in cloud.
let _envTokenCache = null; // { access_token, refresh_token, expires_at }

const CREDS_DIR = join(homedir(), ".config", "athlete-os");
const CREDS_FILE = join(CREDS_DIR, "credentials.json");

function loadCredentials() {
  // 1. Full env var set (access token present — use as-is, refresh will handle expiry)
  if (process.env.STRAVA_ACCESS_TOKEN) {
    return {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      access_token: process.env.STRAVA_ACCESS_TOKEN,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
    };
  }
  // 2. Refresh-token-only env vars (remote agents / scheduled routines)
  //    Use in-memory cache if unexpired to avoid a refresh on every call.
  if (process.env.STRAVA_REFRESH_TOKEN && process.env.STRAVA_CLIENT_ID) {
    const now = Date.now() / 1000;
    if (_envTokenCache && now < _envTokenCache.expires_at - 300) {
      return {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        access_token: _envTokenCache.access_token,
        refresh_token: _envTokenCache.refresh_token,
      };
    }
    return {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      access_token: null, // triggers immediate refresh in stravaGet
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
    };
  }
  // 3. Config file (written by oauth.js — local installs)
  if (existsSync(CREDS_FILE)) {
    try { return JSON.parse(readFileSync(CREDS_FILE, "utf8")); } catch {}
  }
  return null;
}

function saveCredentials(creds) {
  mkdirSync(CREDS_DIR, { recursive: true });
  writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2), "utf8");
}

// ─── Oura API ─────────────────────────────────────────────────────────────────

function loadOuraToken() {
  if (process.env.OURA_ACCESS_TOKEN) return process.env.OURA_ACCESS_TOKEN;
  if (existsSync(CREDS_FILE)) {
    try { return JSON.parse(readFileSync(CREDS_FILE, "utf8")).oura_access_token || null; } catch {}
  }
  return null;
}

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

async function ouraGet(token, path, params = {}) {
  const url = new URL(`${OURA_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Oura API ${res.status} at ${path}: ${await res.text()}`);
  return res.json();
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

function loadTelegramConfig() {
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
    return { token: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID };
  if (existsSync(CREDS_FILE)) {
    try {
      const c = JSON.parse(readFileSync(CREDS_FILE, "utf8"));
      if (c.telegram_bot_token && c.telegram_chat_id)
        return { token: c.telegram_bot_token, chatId: c.telegram_chat_id };
    } catch {}
  }
  return null;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

const GOALS_FILE = join(CREDS_DIR, "goals.json");

function loadGoals() {
  if (existsSync(GOALS_FILE)) {
    try { return JSON.parse(readFileSync(GOALS_FILE, "utf8")); } catch {}
  }
  return { goals: [] };
}

function saveGoals(data) {
  mkdirSync(CREDS_DIR, { recursive: true });
  writeFileSync(GOALS_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ─── Strava API client ────────────────────────────────────────────────────────

const STRAVA_BASE = "https://www.strava.com/api/v3";

async function stravaGet(creds, path, params = {}) {
  const url = new URL(`${STRAVA_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== undefined) url.searchParams.set(k, String(v));
  }

  // No access token (refresh-only mode for remote agents) → refresh first
  if (!creds.access_token && creds.refresh_token) {
    const refreshed = await refreshToken(creds);
    creds.access_token = refreshed.access_token;
    creds.refresh_token = refreshed.refresh_token;
    try { saveCredentials(creds); } catch {}
  }

  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${creds.access_token}` },
  });

  // Token expired → refresh once
  if (res.status === 401 && creds.refresh_token) {
    const refreshed = await refreshToken(creds);
    creds.access_token = refreshed.access_token;
    creds.refresh_token = refreshed.refresh_token;
    try { saveCredentials(creds); } catch {}
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });
  }

  // Rate limited → wait for Retry-After, then retry once
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("X-RateLimit-Reset") || res.headers.get("Retry-After") || "60", 10);
    const waitSec = Math.min(retryAfter, 120);
    await new Promise(r => setTimeout(r, waitSec * 1000));
    res = await fetch(url, { headers: { Authorization: `Bearer ${creds.access_token}` } });
    if (res.status === 429) {
      throw new Error(`Strava rate limit hit. You've made too many requests — wait a few minutes and try again.`);
    }
  }

  if (!res.ok) {
    throw new Error(`Strava API ${res.status} at ${path}: ${await res.text()}`);
  }
  return res.json();
}

async function refreshToken(creds) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      grant_type: "refresh_token",
      refresh_token: creds.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  // Cache for env-var mode — remote agents can't write to disk
  if (process.env.STRAVA_REFRESH_TOKEN && data.expires_at) {
    _envTokenCache = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at };
  }
  return data;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────
// Strava tools first, then Oura, Telegram, Goals at the end.

const TOOLS = [
  {
    name: "check-strava-connection",
    description: "Check if Strava is connected and return the athlete's name. Use this to verify setup is complete.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-athlete-profile",
    description: "Get the full athlete profile: name, location, sport type, follower counts, weight, FTP.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-athlete-stats",
    description: "Get all-time and year-to-date totals for running, cycling, and swimming.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-athlete-zones",
    description: "Get configured heart rate zones and power zones.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-recent-activities",
    description: "Get the most recent N activities with summary metrics.",
    inputSchema: {
      type: "object",
      properties: {
        per_page: { type: "number", description: "Number of activities (default 10, max 200)" },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get-all-activities",
    description: "Get all activities in a date range, handling pagination automatically. Returns full list.",
    inputSchema: {
      type: "object",
      properties: {
        after: { type: "number", description: "Unix timestamp — activities after this time only" },
        before: { type: "number", description: "Unix timestamp — activities before this time only" },
      },
      required: [],
    },
  },
  {
    name: "get-activity-details",
    description: "Get full details for a specific activity: splits, segment efforts, gear, photos, metrics.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "Strava activity ID" },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "get-activity-laps",
    description: "Get lap and split data for a specific activity.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "Strava activity ID" },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "get-activity-streams",
    description: "Get time-series stream data: heartrate, velocity, distance, altitude, watts, cadence.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "Strava activity ID" },
        keys: {
          type: "string",
          description: "Comma-separated stream types (default: heartrate,velocity_smooth,distance,time)",
        },
        resolution: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Data resolution (default: medium)",
        },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "list-athlete-clubs",
    description: "List all Strava clubs the athlete belongs to.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list-starred-segments",
    description: "List the athlete's starred segments.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-segment",
    description: "Get details about a specific segment: name, distance, grade, leaderboard.",
    inputSchema: {
      type: "object",
      properties: {
        segment_id: { type: "number", description: "Strava segment ID" },
      },
      required: ["segment_id"],
    },
  },
  {
    name: "list-segment-efforts",
    description: "List all of the athlete's efforts on a specific segment.",
    inputSchema: {
      type: "object",
      properties: {
        segment_id: { type: "number", description: "Strava segment ID" },
        per_page: { type: "number", description: "Results per page (default 30)" },
      },
      required: ["segment_id"],
    },
  },
  {
    name: "list-athlete-routes",
    description: "List routes saved or created by the athlete.",
    inputSchema: {
      type: "object",
      properties: {
        per_page: { type: "number", description: "Results per page (default 30)" },
      },
      required: [],
    },
  },
  {
    name: "get-weather-for-activity",
    description: "Get historical weather at the time and location of an activity. Uses Open-Meteo — free, no API key needed.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number", description: "Activity start latitude — use start_latlng[0] from activity data" },
        longitude: { type: "number", description: "Activity start longitude — use start_latlng[1] from activity data" },
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        hour: { type: "number", description: "Hour of day (0-23) the activity started" },
      },
      required: ["latitude", "longitude", "date"],
    },
  },

  // ── Oura ──────────────────────────────────────────────────────────────────
  {
    name: "check-oura-connection",
    description: "Check if Oura Ring is connected. Returns today's readiness score if connected.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-oura-readiness",
    description: "Get Oura daily readiness scores and HRV for a date range. Includes overall readiness, HRV balance, sleep score, recovery index.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date YYYY-MM-DD" },
        end_date: { type: "string", description: "End date YYYY-MM-DD (default: today)" },
      },
      required: ["start_date"],
    },
  },
  {
    name: "get-oura-sleep",
    description: "Get Oura sleep data for a date range: total sleep duration, deep/REM/light breakdown, sleep score, HRV during sleep.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date YYYY-MM-DD" },
        end_date: { type: "string", description: "End date YYYY-MM-DD (default: today)" },
      },
      required: ["start_date"],
    },
  },
  {
    name: "get-oura-activity",
    description: "Get Oura daily activity data for a date range: steps, active calories, total calories, activity score, equivalent walking distance, sedentary/low/medium/high activity minutes.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date YYYY-MM-DD" },
        end_date: { type: "string", description: "End date YYYY-MM-DD (default: today)" },
      },
      required: ["start_date"],
    },
  },

  // ── Telegram ──────────────────────────────────────────────────────────────
  {
    name: "send-telegram",
    description: "Send a text message to the athlete's configured Telegram bot. Use for training summaries and notifications. Plain text only.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message text to send. Plain text, no Markdown." },
      },
      required: ["message"],
    },
  },

  // ── Deduplication ─────────────────────────────────────────────────────────
  {
    name: "get-last-processed-activity",
    description: "Get the ID of the last activity that was debriefed by an automated routine. Used to avoid sending duplicate debrief notifications.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "mark-activity-processed",
    description: "Record the ID of an activity after its debrief has been sent. Prevents duplicate notifications for the same workout.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "Strava activity ID that was just debriefed" },
      },
      required: ["activity_id"],
    },
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  {
    name: "set-goal",
    description: "Save a training goal for the year. Replaces an existing goal for the same sport+metric+year.",
    inputSchema: {
      type: "object",
      properties: {
        sport: { type: "string", description: "Sport: Run, Ride, or Swim" },
        metric: { type: "string", description: "What to track: distance_km, distance_miles, time_hours, or activities" },
        target: { type: "number", description: "Target value" },
        year: { type: "number", description: "Goal year (default: current year)" },
        label: { type: "string", description: "Short label, e.g. '1000km running'" },
      },
      required: ["sport", "metric", "target"],
    },
  },
  {
    name: "get-goals",
    description: "Retrieve all stored training goals from disk.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "delete-goal",
    description: "Delete a stored training goal by sport, metric, and year.",
    inputSchema: {
      type: "object",
      properties: {
        sport: { type: "string", description: "Sport: Run, Ride, or Swim" },
        metric: { type: "string", description: "Metric: distance_km, distance_miles, time_hours, or activities" },
        year: { type: "number", description: "Goal year" },
      },
      required: ["sport", "metric", "year"],
    },
  },

  // ── Charts ─────────────────────────────────────────────────────────────────
  {
    name: "generate-chart",
    description: "Generate a PNG chart (bar or line) from training data. Returns a file path — use the Read tool on that path to display the chart inline. Also call send-telegram-photo with the path if Telegram is configured.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["bar", "line"], description: "Chart type" },
        title: { type: "string", description: "Chart title (use uppercase, e.g. 'MONTHLY RUN VOLUME')" },
        labels: { type: "array", items: { type: "string" }, description: "X-axis labels" },
        series: {
          type: "array",
          description: "Data series",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              values: { type: "array", items: { type: "number" } },
              color: { type: "string", description: "Color name: run, ride, swim, z1-z5, ctl, atl, tsb, goal, progress, default" },
            },
            required: ["name", "values"],
          },
        },
        unit: { type: "string", description: "Unit label shown on y-axis (e.g. 'km', 'h', 'pts')" },
      },
      required: ["type", "title", "labels", "series"],
    },
  },
  {
    name: "send-telegram-photo",
    description: "Send a PNG chart image to the athlete's Telegram. Use after generate-chart to push the chart to their phone.",
    inputSchema: {
      type: "object",
      properties: {
        photo_path: { type: "string", description: "Absolute path to the PNG file returned by generate-chart" },
        caption: { type: "string", description: "Optional caption text (plain text only)" },
      },
      required: ["photo_path"],
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function callTool(name, args) {
  // Load credentials fresh every call — picks up changes written by oauth.js
  const creds = loadCredentials();

  if (name === "check-strava-connection") {
    if (!creds) {
      return {
        connected: false,
        message: "Not connected. Ask Claude: 'Connect my Strava account' to get started.",
      };
    }
    try {
      const athlete = await stravaGet(creds, "/athlete");
      return {
        connected: true,
        athlete: `${athlete.firstname} ${athlete.lastname}`,
        id: athlete.id,
        city: athlete.city,
        country: athlete.country,
      };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  }

  if (!creds) {
    throw new Error(
      "Strava not connected. Ask Claude: 'Connect my Strava account' to set up in a few seconds."
    );
  }

  switch (name) {
    case "get-athlete-profile":
      return stravaGet(creds, "/athlete");

    case "get-athlete-stats": {
      const { id } = await stravaGet(creds, "/athlete");
      return stravaGet(creds, `/athletes/${id}/stats`);
    }

    case "get-athlete-zones":
      return stravaGet(creds, "/athlete/zones");

    case "get-recent-activities":
      return stravaGet(creds, "/athlete/activities", {
        per_page: args.per_page ?? 10,
        page: args.page ?? 1,
      });

    case "get-all-activities": {
      const all = [];
      let page = 1;
      const MAX_PAGES = 25; // hard cap at 5000 activities
      while (page <= MAX_PAGES) {
        const batch = await stravaGet(creds, "/athlete/activities", {
          after: args.after,
          before: args.before,
          per_page: 200,
          page,
        });
        if (!batch.length) break;
        all.push(...batch);
        if (batch.length < 200) break;
        page++;
      }
      return all;
    }

    case "get-activity-details":
      return stravaGet(creds, `/activities/${args.activity_id}`);

    case "get-activity-laps":
      return stravaGet(creds, `/activities/${args.activity_id}/laps`);

    case "get-activity-streams":
      return stravaGet(creds, `/activities/${args.activity_id}/streams`, {
        keys: args.keys ?? "heartrate,velocity_smooth,distance,time",
        key_by_type: true,
        resolution: args.resolution ?? "medium",
      });

    case "list-athlete-clubs":
      return stravaGet(creds, "/athlete/clubs");

    case "list-starred-segments":
      return stravaGet(creds, "/segments/starred");

    case "get-segment":
      return stravaGet(creds, `/segments/${args.segment_id}`);

    case "list-segment-efforts":
      return stravaGet(creds, "/segment_efforts", {
        segment_id: args.segment_id,
        per_page: args.per_page ?? 30,
      });

    case "list-athlete-routes": {
      const { id } = await stravaGet(creds, "/athlete");
      return stravaGet(creds, `/athletes/${id}/routes`, {
        per_page: args.per_page ?? 30,
      });
    }

    case "get-weather-for-activity": {
      const { latitude, longitude, date, hour = 8 } = args;
      const url = new URL("https://archive-api.open-meteo.com/v1/archive");
      url.searchParams.set("latitude", latitude);
      url.searchParams.set("longitude", longitude);
      url.searchParams.set("start_date", date);
      url.searchParams.set("end_date", date);
      url.searchParams.set(
        "hourly",
        "temperature_2m,apparent_temperature,wind_speed_10m,weathercode,precipitation"
      );
      url.searchParams.set("timezone", "auto");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API ${res.status}`);
      const data = await res.json();
      const h = data.hourly;
      const idx = Math.min(hour, (h.time?.length ?? 1) - 1);
      return {
        date,
        hour,
        temperature_c: h.temperature_2m?.[idx],
        feels_like_c: h.apparent_temperature?.[idx],
        wind_speed_kmh: h.wind_speed_10m?.[idx],
        precipitation_mm: h.precipitation?.[idx],
        conditions: describeCode(h.weathercode?.[idx]),
      };
    }

    // ── Oura ────────────────────────────────────────────────────────────────
    case "check-oura-connection": {
      const token = loadOuraToken();
      if (!token) return { connected: false, message: "Oura not connected. Say 'connect my Oura' to set it up." };
      try {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const data = await ouraGet(token, "/daily_readiness", { start_date: yesterday, end_date: today });
        const latest = data.data?.[data.data.length - 1];
        return { connected: true, readiness_score: latest?.score, date: latest?.day };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    }

    case "get-oura-readiness": {
      const token = loadOuraToken();
      if (!token) throw new Error("Oura not connected. Say 'connect my Oura' to set it up.");
      const today = new Date().toISOString().slice(0, 10);
      return ouraGet(token, "/daily_readiness", {
        start_date: args.start_date,
        end_date: args.end_date ?? today,
      });
    }

    case "get-oura-sleep": {
      const token = loadOuraToken();
      if (!token) throw new Error("Oura not connected. Say 'connect my Oura' to set it up.");
      const today = new Date().toISOString().slice(0, 10);
      return ouraGet(token, "/daily_sleep", {
        start_date: args.start_date,
        end_date: args.end_date ?? today,
      });
    }

    case "get-oura-activity": {
      const token = loadOuraToken();
      if (!token) throw new Error("Oura not connected. Say 'connect my Oura' to set it up.");
      const today = new Date().toISOString().slice(0, 10);
      return ouraGet(token, "/daily_activity", {
        start_date: args.start_date,
        end_date: args.end_date ?? today,
      });
    }

    // ── Deduplication ────────────────────────────────────────────────────────
    case "get-last-processed-activity": {
      if (existsSync(CREDS_FILE)) {
        try {
          const c = JSON.parse(readFileSync(CREDS_FILE, "utf8"));
          return { last_processed_activity_id: c.last_processed_activity_id ?? null };
        } catch {}
      }
      return { last_processed_activity_id: null };
    }

    case "mark-activity-processed": {
      if (existsSync(CREDS_FILE)) {
        try {
          const c = JSON.parse(readFileSync(CREDS_FILE, "utf8"));
          c.last_processed_activity_id = args.activity_id;
          saveCredentials(c);
        } catch {}
      }
      return { marked: true, activity_id: args.activity_id };
    }

    // ── Telegram ────────────────────────────────────────────────────────────
    case "send-telegram": {
      const tg = loadTelegramConfig();
      if (!tg) throw new Error("Telegram not configured. Say 'set up Telegram' to connect it.");
      const res = await fetch(`https://api.telegram.org/bot${tg.token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tg.chatId, text: args.message }),
      });
      if (!res.ok) throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
      return { sent: true };
    }

    // ── Goals ────────────────────────────────────────────────────────────────
    case "set-goal": {
      const year = args.year ?? new Date().getFullYear();
      const data = loadGoals();
      const idx = data.goals.findIndex(
        g => g.sport === args.sport && g.metric === args.metric && g.year === year
      );
      const goal = { sport: args.sport, metric: args.metric, target: args.target, year, label: args.label ?? null };
      if (idx >= 0) data.goals[idx] = goal;
      else data.goals.push(goal);
      saveGoals(data);
      return { saved: true, goal };
    }

    case "get-goals":
      return loadGoals();

    case "delete-goal": {
      const data = loadGoals();
      const before = data.goals.length;
      data.goals = data.goals.filter(
        g => !(g.sport === args.sport && g.metric === args.metric && g.year === args.year)
      );
      saveGoals(data);
      return { deleted: before - data.goals.length > 0, remaining: data.goals.length };
    }

    // ── Charts ────────────────────────────────────────────────────────────────
    case "generate-chart": {
      const { type, title, labels, series, unit = "" } = args;
      const resolved = series.map(s => ({ ...s, color: resolveColor(s.color) }));
      const opts = { title, labels, series: resolved, unit };
      const chartPath = type === "line" ? drawLineChart(opts) : drawBarChart(opts);
      return {
        chart_path: chartPath,
        instruction: "Use the Read tool on chart_path to display the chart inline. If Telegram is configured, also call send-telegram-photo with chart_path.",
      };
    }

    case "send-telegram-photo": {
      const tg = loadTelegramConfig();
      if (!tg) throw new Error("Telegram not configured. Say 'set up Telegram' to connect it.");
      const fileBuffer = readFileSync(args.photo_path);
      const form = new FormData();
      form.append("chat_id", tg.chatId);
      form.append("photo", new Blob([fileBuffer], { type: "image/png" }), "chart.png");
      if (args.caption) form.append("caption", args.caption);
      const res = await fetch(`https://api.telegram.org/bot${tg.token}/sendPhoto`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Telegram photo API ${res.status}: ${await res.text()}`);
      return { sent: true };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function describeCode(c) {
  if (c == null) return "Unknown";
  if (c === 0) return "Clear sky";
  if (c <= 2) return "Partly cloudy";
  if (c === 3) return "Overcast";
  if (c <= 49) return "Foggy";
  if (c <= 59) return "Drizzle";
  if (c <= 69) return "Rain";
  if (c <= 79) return "Snow";
  if (c <= 82) return "Rain showers";
  if (c <= 86) return "Snow showers";
  if (c >= 95) return "Thunderstorm";
  return "Mixed";
}

// ─── MCP Protocol (JSON-RPC over stdio, no SDK needed) ───────────────────────

function send(msg) {
  const json = JSON.stringify(msg);
  const len = Buffer.byteLength(json, "utf8");
  process.stdout.write(`Content-Length: ${len}\r\n\r\n${json}`);
}

function reply(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function replyError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

let buf = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  dispatch();
});

function dispatch() {
  while (true) {
    const sep = buf.indexOf("\r\n\r\n");
    if (sep === -1) return;
    const header = buf.slice(0, sep).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) { buf = buf.slice(sep + 4); continue; }
    const len = parseInt(match[1], 10);
    const start = sep + 4;
    if (buf.length < start + len) return;
    const body = buf.slice(start, start + len).toString("utf8");
    buf = buf.slice(start + len);
    try { handle(JSON.parse(body)); } catch (e) { process.stderr.write(`[athlete-os] parse error: ${e.message}\n`); }
  }
}

async function handle(msg) {
  const { id, method, params } = msg;

  if (method === "initialize") {
    return reply(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "athlete-os-strava", version: "0.1.0" },
    });
  }

  if (method === "notifications/initialized") return; // no response

  if (method === "tools/list") {
    return reply(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;
    try {
      const result = await callTool(name, args);
      return reply(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (err) {
      return reply(id, {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      });
    }
  }

  if (id !== undefined) replyError(id, -32601, `Method not found: ${method}`);
}

process.stdin.resume();
