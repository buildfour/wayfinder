# How to Reset Your API Key

Use this guide when a key was leaked, rotated on schedule, or you need a fresh credential for a new integration.

**Time:** ~5 minutes  
**Requires:** Admin access to your account dashboard

---

## Before you start

- [ ] You are signed in as an admin (not a read-only teammate)
- [ ] You know which apps or scripts use the current key
- [ ] You have a password manager ready to store the new key

---

## Steps

### 1. Open Security settings

1. Sign in to your account dashboard.
2. Click your avatar in the top-right corner.
3. Select **Settings** from the menu.
4. In the left sidebar, click **Security**.

### 2. Revoke the old key

1. Find the section labeled **API Keys**.
2. Locate the key you want to replace (check the label or last-used date).
3. Click **Revoke** next to that key.
4. Confirm when prompted — revoked keys stop working immediately.

### 3. Generate a new key

1. Click **Create API Key**.
2. Enter a descriptive label, e.g. `production-backend-2026`.
3. Choose the minimum permissions needed (prefer **read-only** unless writes are required).
4. Click **Generate**.
5. **Copy the key now** — you will not be able to see it again.

### 4. Update your applications

Replace the old key everywhere it was used:

| Location | What to update |
| --- | --- |
| Server `.env` file | `API_KEY=...` |
| CI/CD secrets | Pipeline environment variables |
| Local dev machines | Each developer's `.env.local` |

### 5. Verify the new key works

1. Run a simple test request against your API health endpoint.
2. Confirm you receive `200 OK` (not `401 Unauthorized`).
3. Check logs to ensure traffic is flowing with the new credential.

### 6. Delete the old key from password managers

Remove the revoked key entry so nobody tries to use it later.

---

## Troubleshooting

**401 after updating:** Double-check for trailing spaces when pasting the key. Restart the app after changing `.env`.

**Can't find API Keys section:** Your role may be read-only — ask an admin to reset the key for you.

**Key visible in git history:** Rotate again, then scrub the commit or use secret scanning tools.

---

## Done

Your old key is revoked and the new key is live. Document the rotation date in your team's runbook.
