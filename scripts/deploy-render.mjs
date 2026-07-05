#!/usr/bin/env node
/**
 * Deploy Wayfinder to Render via API.
 * @see https://render.com/docs/api
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

function loadEnvFile(path) {
  const vars = {};
  if (!existsSync(path)) return vars;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[m[1].trim()] = val;
  }
  return vars;
}

async function renderApi(key, path, options = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(json.message || `Render API ${res.status}: ${text.slice(0, 200)}`);
  }
  return json;
}

async function main() {
  const env = loadEnvFile(join(root, ".env"));
  const deploy = loadEnvFile(join(root, ".deploy.env"));
  const renderKey = env.RENDER_API_KEY || env.Render;
  if (!renderKey) throw new Error("Render API key missing from .env");

  const repo = process.env.GITHUB_REPO || "https://github.com/buildfour/wayfinder";
  const branch = process.env.DEPLOY_BRANCH || "main";

  const ownerId = (await renderApi(renderKey, "/owners?limit=1"))[0]?.owner?.id;
  if (!ownerId) throw new Error("No Render owner found");

  const services = await renderApi(renderKey, `/services?limit=50`);
  let service = services.find((s) => s.service?.name === "wayfinder")?.service;

  if (!service) {
    const created = await renderApi(renderKey, "/services", {
      method: "POST",
      body: JSON.stringify({
        type: "web_service",
        name: "wayfinder",
        ownerId,
        repo,
        branch,
        autoDeploy: "yes",
        serviceDetails: {
          runtime: "node",
          plan: "free",
          region: "oregon",
          healthCheckPath: "/",
          envSpecificDetails: {
            buildCommand: "npm install && npx prisma generate && npm run build",
            startCommand: "npm start",
          },
        },
      }),
    });
    service = created.service || created;
    console.log(`Created Render service: ${service.id}`);
  } else {
    console.log(`Using existing Render service: ${service.id}`);
  }

  const serviceUrl =
    service.serviceDetails?.url?.startsWith("http")
      ? service.serviceDetails.url
      : `https://${service.serviceDetails?.url || service.slug + ".onrender.com"}`;

  const envVars = {
    NODE_ENV: "production",
    AUTH_TRUST_HOST: "true",
    GEMINI_MODEL: "gemini-3.5-flash",
    DATABASE_URL: "file:/tmp/wayfinder.db",
    NEXT_PUBLIC_APP_URL: serviceUrl,
    AUTH_URL: serviceUrl,
    ...deploy,
    GEMINI_API_KEY: deploy.GEMINI_API_KEY || env.gemini,
    GRADIUM_API_KEY: env.gradium || deploy.GRADIUM_API_KEY,
    AUTH_SECRET: deploy.AUTH_SECRET || env.AUTH_SECRET,
    CF_ACCOUNT_ID: deploy.CF_ACCOUNT_ID || env["cloudflare-account-id"] || env.CF_ACCOUNT_ID,
    CF_D1_DATABASE_ID: deploy.CF_D1_DATABASE_ID || env.CF_D1_DATABASE_ID,
    CLOUDFLARE_API_TOKEN:
      deploy.CLOUDFLARE_API_TOKEN || env.cloudflare || env.cloudflare2,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) continue;
    await renderApi(renderKey, `/services/${service.id}/env-vars`, {
      method: "POST",
      body: JSON.stringify({ envVar: { key, value } }),
    }).catch(async () => {
      await renderApi(renderKey, `/services/${service.id}/env-vars/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
    });
  }
  console.log("Environment variables synced");

  await renderApi(renderKey, `/services/${service.id}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  });
  console.log("Deploy triggered");

  console.log(`Service URL: ${serviceUrl}`);
  console.log(`NEXT_PUBLIC_APP_URL and AUTH_URL set to ${serviceUrl}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
