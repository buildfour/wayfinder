#!/usr/bin/env node
/**
 * Provision Cloudflare D1 and apply migrations.
 * Reads secrets from wayfinder/.env (never committed).
 * @see https://developers.cloudflare.com/d1/get-started/
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const envPath = join(root, ".env");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error("Missing wayfinder/.env");
  const vars = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

async function cfFetch(token, path, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message || `Cloudflare API error ${res.status}`);
  }
  return json.result;
}

function getCloudflareToken(env) {
  return (
    env.CLOUDFLARE_API_TOKEN ||
    env.cloudflare ||
    env.cloudflare2 ||
    ""
  );
}

function getAccountId(env) {
  return env.CF_ACCOUNT_ID || env["cloudflare-account-id"] || "";
}

async function main() {
  const env = loadEnv();
  let token = getCloudflareToken(env);
  if (!token) throw new Error("Cloudflare token missing from .env");

  let accountId = getAccountId(env);

  async function tryWithToken(activeToken) {
    if (!accountId) {
      const accounts = await cfFetch(activeToken, "/accounts");
      const account = accounts[0];
      if (account) accountId = account.id;
    }
    if (!accountId) {
      throw new Error("No Cloudflare account ID. Add cloudflare-account-id to .env.");
    }
    return activeToken;
  }

  try {
    token = await tryWithToken(token);
  } catch (firstErr) {
    const fallback = env.cloudflare2;
    if (fallback && fallback !== env.cloudflare) {
      console.log("Retrying Cloudflare setup with secondary token...");
      accountId = getAccountId(env);
      token = await tryWithToken(fallback);
    } else {
      throw firstErr;
    }
  }

  console.log(`Using Cloudflare account: ${accountId}`);

  let databaseId = env.CF_D1_DATABASE_ID;
  if (!databaseId) {
    const existing = await cfFetch(token, `/accounts/${accountId}/d1/database`);
    const found = existing?.find((d) => d.name === "wayfinder");
    if (found) {
      databaseId = found.uuid;
      console.log(`Found existing D1 database: ${databaseId}`);
    } else {
      const created = await cfFetch(token, `/accounts/${accountId}/d1/database`, {
        method: "POST",
        body: JSON.stringify({ name: "wayfinder" }),
      });
      databaseId = created.uuid;
      console.log(`Created D1 database: ${databaseId}`);
    }
  }

  const migrationPath = join(root, "prisma/migrations/20260705055135_init/migration.sql");
  const sql = readFileSync(migrationPath, "utf8");
  const statements = sql
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let applied = 0;
  let skipped = 0;
  for (const statement of statements) {
    try {
      await cfFetch(token, `/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: "POST",
        body: JSON.stringify({ sql: statement }),
      });
      applied++;
    } catch (err) {
      const msg = String(err.message || err);
      if (/already exists/i.test(msg)) {
        skipped++;
        continue;
      }
      throw err;
    }
  }
  console.log(
    `D1 migrations: ${applied} applied${skipped ? `, ${skipped} skipped (already exist)` : ""}`,
  );

  const wranglerPath = join(root, "wrangler.toml");
  let wrangler = readFileSync(wranglerPath, "utf8");
  wrangler = wrangler.replace(/database_id = ".*"/, `database_id = "${databaseId}"`);
  writeFileSync(wranglerPath, wrangler);

  const deployEnvPath = join(root, ".deploy.env");
  const lines = [
    `CF_ACCOUNT_ID=${accountId}`,
    `CF_D1_DATABASE_ID=${databaseId}`,
    `CLOUDFLARE_API_TOKEN=${token}`,
    env.gemini ? `GEMINI_API_KEY=${env.gemini}` : "",
    env.gradium ? `GRADIUM_API_KEY=${env.gradium}` : "",
    env.AUTH_SECRET ? `AUTH_SECRET=${env.AUTH_SECRET}` : "",
  ].filter(Boolean);
  writeFileSync(deployEnvPath, lines.join("\n") + "\n");
  console.log(`Wrote ${deployEnvPath} (gitignored) for Render env sync`);
  console.log("D1 setup complete.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
