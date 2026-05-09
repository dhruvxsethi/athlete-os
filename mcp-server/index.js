#!/usr/bin/env node
/**
 * Athlete OS — Strava MCP Server
 * Zero npm dependencies. Pure Node.js built-ins only.
 * Requires Node.js 18+ (for built-in fetch).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// ─── Credentials ──────────────────────────────────────────────────────────────
// Stored at ~/.config/athlete-os/credentials.json
// Written by oauth.js after the user authorizes. Read fresh on every tool call.

const CREDS_DIR = join(homedir(), ".config", "athlete-os");
const CREDS_FILE = join(CREDS_DIR, "credentials.json");

function loadCredentials() {
  // 1. Environment variables take priority (useful for CI or manual override)
  if (process.env.STRAVA_ACCESS_TOKEN) {
    return {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      access_token: process.env.STRAVA_ACCESS_TOKEN,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
    };
  }
  // 2. Config file (written by oauth.js)
  if (existsSync(CREDS_FILE)) {
    try { return JSON.parse(readFileSync(CREDS_FILE, "utf8")); } catch {}
  }
  return null;
}

function saveCredentials(creds) {
  mkdirSync(CREDS_DIR, { recursive: true });
  writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2), "utf8");
}

// ─── Strava API client ────────────────────────────────────────────────────────

const STRAVA_BASE = "https://www.strava.com/api/v3";

async function stravaGet(creds, path, params = {}) {
  const url = new URL(`${STRAVA_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== undefined) url.searchParams.set(k, String(v));
  }

  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${creds.access_token}` },
  });

  // Token expired → refresh once
  if (res.status === 401 && creds.refresh_token) {
    const refreshed = await refreshToken(creds);
    creds.access_token = refreshed.access_token;
    creds.refresh_token = refreshed.refresh_token;
    saveCredentials(creds);
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });
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
  return res.json();
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

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
        latitude: { type: "number", description: "Activity start latitude" },
        longitude: { type: "number", description: "Activity start longitude" },
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        hour: { type: "number", description: "Hour of day (0-23) the activity started" },
      },
      required: ["latitude", "longitude", "date"],
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
      while (true) {
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
    try { handle(JSON.parse(body)); } catch {}
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
