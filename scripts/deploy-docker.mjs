#!/usr/bin/env node
/**
 * Deploy Wayfinder to Render via Docker image (no GitHub repo link required).
 * @see https://render.com/docs/deploying-an-image
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, spawnSync } from "child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const workspace = join(root, "..");

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

function sh(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", cwd: opts.cwd || root, env: { ...process.env, ...opts.env } });
}

function getGitHubToken() {
  try {
    const remote = execSync("git remote get-url origin", { cwd: workspace, encoding: "utf8" }).trim();
    const m = remote.match(/x-access-token:([^@]+)@/);
    if (m) return m[1];
    const m2 = remote.match(/https:\/\/([^:]+):([^@]+)@/);
    if (m2) return m2[2];
  } catch {
    /* ignore */
  }
  return process.env.GITHUB_TOKEN;
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
    throw new Error(json.message || `Render API ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

async function main() {
  const env = loadEnvFile(join(root, ".env"));
  const deploy = loadEnvFile(join(root, ".deploy.env"));
  const renderKey = env.RENDER_API_KEY || env.Render;
  if (!renderKey) throw new Error("Render API key missing from .env");

  const ghToken = getGitHubToken();
  if (!ghToken) throw new Error("GitHub token not found for GHCR push (need git remote or GITHUB_TOKEN)");

  const imageTag = process.env.IMAGE_TAG || "latest";
  const ghOwner = process.env.GH_OWNER || "buildfour";
  const imagePath = `ghcr.io/${ghOwner}/wayfinder:${imageTag}`;

  console.log("Building Docker image...");
  sh(`sudo docker build -t ${imagePath} .`);

  console.log("Logging in to GHCR...");
  const login = spawnSync("sudo", ["docker", "login", "ghcr.io", "-u", ghOwner, "--password-stdin"], {
    input: ghToken,
    encoding: "utf8",
  });
  if (login.status !== 0) {
    throw new Error(`GHCR login failed: ${login.stderr || login.stdout}`);
  }

  console.log("Pushing image...");
  sh(`sudo docker push ${imagePath}`);

  const ownerId = (await renderApi(renderKey, "/owners?limit=1"))[0]?.owner?.id;
  if (!ownerId) throw new Error("No Render owner found");

  const services = await renderApi(renderKey, `/services?limit=50`);
  let service = services.find((s) => s.service?.name === "wayfinder")?.service;

  const envVars = [
    { key: "NODE_ENV", value: "production" },
    { key: "AUTH_TRUST_HOST", value: "true" },
    { key: "GEMINI_MODEL", value: "gemini-3.5-flash" },
    { key: "PORT", value: "3000" },
    { key: "DATABASE_URL", value: "file:/tmp/wayfinder.db" },
    { key: "GEMINI_API_KEY", value: deploy.GEMINI_API_KEY || env.gemini },
    { key: "GRADIUM_API_KEY", value: env.gradium || deploy.GRADIUM_API_KEY },
    { key: "CLOUDFLARE_API_TOKEN", value: deploy.CLOUDFLARE_API_TOKEN || env.cloudflare },
    { key: "CF_ACCOUNT_ID", value: deploy.CF_ACCOUNT_ID || env.CF_ACCOUNT_ID },
    { key: "CF_D1_DATABASE_ID", value: deploy.CF_D1_DATABASE_ID || env.CF_D1_DATABASE_ID },
    { key: "AUTH_SECRET", value: deploy.AUTH_SECRET || env.AUTH_SECRET },
  ].filter((e) => e.value);

  if (!service) {
    const created = await renderApi(renderKey, "/services", {
      method: "POST",
      body: JSON.stringify({
        type: "web_service",
        name: "wayfinder",
        ownerId,
        image: {
          ownerId,
          imagePath,
        },
        envVars,
        serviceDetails: {
          runtime: "image",
          plan: "free",
          region: "oregon",
          healthCheckPath: "/",
        },
      }),
    });
    service = created;
    console.log(`Created image-backed Render service: ${service.id}`);
  } else {
    console.log(`Updating existing service: ${service.id}`);
    await renderApi(renderKey, `/services/${service.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        image: { ownerId, imagePath },
        serviceDetails: {
          runtime: "image",
          plan: "free",
          healthCheckPath: "/",
        },
      }),
    });
    for (const { key, value } of envVars) {
      try {
        await renderApi(renderKey, `/services/${service.id}/env-vars`, {
          method: "POST",
          body: JSON.stringify({ envVar: { key, value } }),
        });
      } catch {
        await renderApi(renderKey, `/services/${service.id}/env-vars/${key}`, {
          method: "PUT",
          body: JSON.stringify({ value }),
        });
      }
    }
  }

  await renderApi(renderKey, `/services/${service.id}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  });

  const host = service.serviceDetails?.url || "wayfinder.onrender.com";
  console.log(`Deploy triggered. URL: https://${host}`);
  console.log("Set NEXT_PUBLIC_APP_URL on Render to this URL after deploy completes.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
