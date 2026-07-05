# VPN Client Setup Guide

Connect securely to the company network from home or travel. Pick the section for your operating system.

**Support:** #it-help on Slack  
**Estimated time:** 10 minutes

---

## What you need

- Your company email and SSO password
- Admin rights on your laptop (to install software)
- Stable internet connection

---

## macOS

### Install the client

1. Open **Self Service** (company app catalog) from Applications.
2. Search for **Corporate VPN**.
3. Click **Install** and enter your Mac password when prompted.
4. Launch **Corporate VPN** from Applications when install finishes.

### Sign in and connect

1. Open Corporate VPN.
2. Click **Sign in with SSO**.
3. Enter your company email and approve the push notification on your phone.
4. Click **Connect** — status should show **Connected** with a green indicator.

### macOS troubleshooting

- **Stuck on "Connecting":** Quit the app, toggle Wi-Fi off/on, retry.
- **SSO loop:** Clear saved credentials in Keychain Access → search "Corporate VPN" → delete entries → sign in again.

---

## Windows

### Install the client

1. Press **Win + S**, search **Software Center**.
2. Open Software Center and find **Corporate VPN**.
3. Click **Install** — reboot if the installer requests it.
4. After reboot, open **Corporate VPN** from the Start menu.

### Sign in and connect

1. Click **Sign in with SSO**.
2. Complete login in the browser window that opens.
3. Return to the VPN app and click **Connect**.
4. Confirm the system tray icon shows a locked shield.

### Windows troubleshooting

- **Installer blocked:** Contact IT — your device may need a compliance policy update.
- **DNS not resolving internal sites:** Disconnect, run `ipconfig /flushdns`, reconnect.

---

## Verify your connection

After connecting on either OS:

1. Open a browser and visit `https://intranet.company.internal`.
2. You should see the company homepage without a login prompt.
3. Run `ping git.internal.company` — expect replies (not "request timed out").

If intranet loads, VPN setup is complete.

---

## Disconnect when done

1. Click **Disconnect** in the VPN app before closing your laptop.
2. On macOS, use the menu bar icon; on Windows, use the system tray.

Leaving VPN connected on public Wi-Fi is fine; disconnect on untrusted networks only if policy requires it.
