#!/usr/bin/env node
/**
 * Create the buildfour/wayfinder GitHub repository and push clean app code.
 * Uses `github` token from wayfinder/.env (never committed).
 */
import { execSync } from "child_process";
import { readFileSync, existsSync, rmSync, cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const source = join(__dir, "..");
const staging = join(source, "..", "wayfinder-repo-staging");

const EXCLUDE = new Set([
  "node_modules",
  ".next",
  ".env",
  ".deploy.env",
  ".data",
  "PLAN.md",
  "CLI-PLAN.md",
  "DEPLOY.md",
  "AGENTS.md",
  "CLAUDE.md",
]);

function loadEnv() {
  const vars = {};
  const path = join(source, ".env");
  if (!existsSync(path)) return vars;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let val = m[2].trim().replace(/^["']|["']$/g, "");
    vars[m[1].trim()] = val;
  }
  return vars;
}

function copyClean() {
  if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });

  for (const entry of execSync(`find ${source} -maxdepth 1 -mindepth 1`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)) {
    const name = entry.split("/").pop();
    if (EXCLUDE.has(name)) continue;
    cpSync(entry, join(staging, name), { recursive: true });
  }
}

async function ensureRepo(token, owner, name) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const check = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
  if (check.status === 200) {
    console.log(`Repository ${owner}/${name} already exists`);
    return;
  }

  const res = await fetch(`https://api.github.com/user/repos`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name,
      description: "Turn how-to docs into cinematic guided tours",
      private: process.env.GH_PRIVATE !== "true",
      auto_init: false,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `GitHub API ${res.status}`);
  console.log(`Created repository: ${json.html_url}`);
}

async function main() {
  const env = loadEnv();
  const token = env.github || env.GITHUB_TOKEN;
  if (!token) throw new Error("github token missing from .env");

  const owner = process.env.GH_OWNER || "buildfour";
  const repo = process.env.GH_REPO || "wayfinder";

  copyClean();
  console.log(`Staged clean app at ${staging}`);

  await ensureRepo(token, owner, repo);

  execSync("git init -b main", { cwd: staging, stdio: "inherit" });
  execSync("git add .", { cwd: staging, stdio: "inherit" });
  execSync('git commit -m "Initial commit: Wayfinder web app"', {
    cwd: staging,
    stdio: "inherit",
  });

  const remote = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  try {
    execSync("git remote remove origin", { cwd: staging, stdio: "pipe" });
  } catch {
    /* no remote */
  }
  execSync(`git remote add origin ${remote}`, { cwd: staging, stdio: "inherit" });
  execSync("git push -u origin main --force", { cwd: staging, stdio: "inherit" });

  console.log(`Pushed to https://github.com/${owner}/${repo}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
