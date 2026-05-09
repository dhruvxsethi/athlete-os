#!/usr/bin/env node
/**
 * Athlete OS — Strava OAuth Helper
 * Run this once to get your access + refresh tokens.
 * Tokens are saved to .env in the athlete-os directory.
 * Usage: node mcp-server/oauth.js
 */

import http from "http";
import { exec } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_DIR = join(__dirname, "..");
const ENV_FILE = join(PLUGIN_DIR, ".env");
const PORT = 8888;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "read,activity:read_all,profile:read_all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? `open "${url}"` :
    process.platform === "win32" ? `start "" "${url}"` :
    `xdg-open "${url}"`;
  exec(cmd);
}

function writeEnv(vars) {
  let content = "";
  if (existsSync(ENV_FILE)) {
    // Preserve existing lines that we're not overwriting
    const existing = readFileSync(ENV_FILE, "utf8").split("\n");
    const keys = Object.keys(vars);
    const kept = existing.filter(line => {
      const key = line.split("=")[0].trim();
      return key && !keys.includes(key);
    });
    content = kept.join("\n").trimEnd();
    if (content) content += "\n";
  }
  for (const [k, v] of Object.entries(vars)) {
    content += `${k}=${v}\n`;
  }
  writeFileSync(ENV_FILE, content);
}

function loadEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const vars = {};
  readFileSync(ENV_FILE, "utf8").split("\n").forEach(line => {
    const [k, ...rest] = line.split("=");
    if (k?.trim() && rest.length) vars[k.trim()] = rest.join("=").trim();
  });
  return vars;
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────

async function run() {
  console.log("\n🏃 Athlete OS — Strava OAuth Setup\n");

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // Check for existing values
  const existing = loadEnv();

  let clientId = existing.STRAVA_CLIENT_ID;
  let clientSecret = existing.STRAVA_CLIENT_SECRET;

  if (!clientId) {
    clientId = (await prompt(rl, "Enter your Strava Client ID: ")).trim();
  } else {
    console.log(`✓ Using existing Client ID: ${clientId}`);
    const change = await prompt(rl, "  Change it? (y/N): ");
    if (change.toLowerCase() === "y") {
      clientId = (await prompt(rl, "Enter your new Strava Client ID: ")).trim();
    }
  }

  if (!clientSecret) {
    clientSecret = (await prompt(rl, "Enter your Strava Client Secret: ")).trim();
  } else {
    console.log(`✓ Using existing Client Secret: ${clientSecret.slice(0, 6)}...`);
    const change = await prompt(rl, "  Change it? (y/N): ");
    if (change.toLowerCase() === "y") {
      clientSecret = (await prompt(rl, "Enter your new Strava Client Secret: ")).trim();
    }
  }

  rl.close();

  if (!clientId || !clientSecret) {
    console.error("\n✗ Client ID and Secret are required. Exiting.\n");
    process.exit(1);
  }

  // Save ID + Secret immediately
  writeEnv({ STRAVA_CLIENT_ID: clientId, STRAVA_CLIENT_SECRET: clientSecret });

  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${SCOPE}`;

  console.log("\n📡 Starting local callback server on port " + PORT + "...");

  // Start local HTTP server to catch the OAuth callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400);
        res.end(`<h2>Authorization denied: ${error}</h2><p>You can close this tab.</p>`);
        server.close();
        reject(new Error(`OAuth denied: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#080808;color:#fff">
            <div style="font-size:48px;margin-bottom:16px">✅</div>
            <h2 style="color:#FC4C02">Athlete OS connected!</h2>
            <p style="color:rgba(255,255,255,0.5)">You can close this tab and return to your terminal.</p>
          </body></html>
        `);
        server.close();
        resolve(code);
      }
    });

    server.listen(PORT, () => {
      console.log("✓ Callback server ready\n");
      console.log("🌐 Opening Strava authorization in your browser...");
      console.log("   If it doesn't open, visit:\n   " + authUrl + "\n");
      openBrowser(authUrl);
    });

    server.on("error", reject);

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 5 * 60 * 1000);
  });

  console.log("✓ Authorization code received. Exchanging for tokens...\n");

  // Exchange code for tokens
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} — ${err}`);
  }

  const data = await res.json();

  writeEnv({
    STRAVA_CLIENT_ID: clientId,
    STRAVA_CLIENT_SECRET: clientSecret,
    STRAVA_ACCESS_TOKEN: data.access_token,
    STRAVA_REFRESH_TOKEN: data.refresh_token,
  });

  console.log("✅  Connected as:", data.athlete.firstname, data.athlete.lastname);
  console.log("✅  Tokens saved to .env\n");
  console.log("─".repeat(50));
  console.log("Next step — load the tokens into your shell:\n");
  console.log("  source .env  (or add .env to your shell profile)\n");
  console.log("Then test the connection in Claude:\n");
  console.log("  Check my Strava connection\n");
  console.log("─".repeat(50) + "\n");
}

run().catch(err => {
  console.error("\n✗ OAuth failed:", err.message, "\n");
  process.exit(1);
});
