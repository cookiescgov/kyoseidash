<div align="center" width="100%">
    <h1>共生</h1>
    <h2>Kyosei Dash</h2>
    <p><em>Symbiosis for monitoring.</em></p>
</div>

---

> **Uptime Kuma handles *"is it up?"* · PRTG handles *"what is it doing?"* · Kyosei Dash unifies both, adds *"let me jump to it."***

Kyosei Dash (共生 — *kyōsei*, "living together") is a self-hosted monitoring dashboard that combines two complementary engines into one pane of glass:

- **Uptime Kuma** — HTTP, ping, TCP, DNS, databases, 2FA, status pages, 60+ notification providers
- **PRTG** — SNMP bandwidth, ping quality, hardware, WMI, NetFlow, vendor sensors, any custom PRTG probe
- **Kyosei Dash** — click-to-connect launchers (RDP, SSH, VNC, Telnet, HTTP) on every monitor, plus a capability-aware importer so you never probe the same target twice

---

## 🚀 Installation

### Option 1: Proxmox LXC (Automated — recommended)

For anyone running Proxmox VE, deploy a fully configured **Debian 13 LXC** running Docker with a single command on your Proxmox host shell:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/cookiescgov/kyoseidash/main/deploy/proxmox-install.sh)"
```

You'll get an interactive whiptail menu — **Install** or **Update** — with prompts for CTID, hostname, storage, cores, RAM, and disk. Everything else is automatic.

### Option 2: Universal Docker (Windows, Mac, Linux, any NAS)

If you don't use Proxmox, run Kyosei Dash anywhere Docker is installed.

1. Download this repository (Code → Download ZIP, or `git clone`).
2. Install **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux).
3. In the project folder:
   ```bash
   docker compose up -d --build
   ```
4. Open `http://<host-ip>:3001`.

### **Installer Features:**
* **Interactive TUI** — whiptail-driven menu handles fresh installs and rolling updates.
* **Smart Defaults** — auto-picks the next free CTID, auto-detects the latest Debian 13 template, falls back to Debian 12 if 13 is unavailable.
* **Unprivileged LXC** — deploys as a secure unprivileged container with `nesting=1` + `keyctl=1` (exactly what Docker-in-LXC needs, nothing more).
* **Credentials stay server-side** — the browser only sees `{ hasPasshash: bool }` flags; PRTG passwords and API tokens never leave the container.
* **Zero-config `update` alias** — inside the LXC, type `update` to apt-upgrade the OS, pull the latest code, and rebuild Docker in one command.

---

## 📖 First-Run Guide

Once installed, Kyosei Dash is at `http://<lxc-ip>:3001`.

1. **Create the admin account** (Kuma-style setup wizard on first load).
2. **Settings → PRTG Servers** → **Add PRTG Server**
   - Name, URL, username + passhash (or API token)
   - Tick **Ignore SSL** if your PRTG has a self-signed cert
   - **Test Connection** before saving
3. **PRTG Import** (top nav) → pick the server → review the sensor list
   - Green-badge rows (PRTG-only) are pre-ticked
   - Yellow-badge rows (Kuma-native) are left unticked — Kuma will probe those natively
   - Adjust per-row, click **Import**
4. **Dashboard** → toggle **List / Devices** view to group by device
5. **Network** (top nav) → top-throughput / latency / loss / errors leaderboards
6. **Edit Monitor → Connection Launchers** to add RDP / SSH / VNC / Telnet / Web click-to-connect buttons on any monitor

---

## 🧭 Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Kyosei Dash                          │
│  Vue SPA + Socket.IO + Express + SQLite (Kuma's DB)    │
│                                                        │
│   Native monitors (ping/http/dns/tcp/...) — Kuma       │
│   PRTG monitor type (new) — bridge to existing PRTG    │
│   Capability-aware importer — no duplicate probes      │
│   Connection launchers — RDP/SSH/VNC/Telnet/HTTP       │
└──────────────────┬─────────────────────────────────────┘
                   │ JSON API
                   ▼
              ┌──────────┐
              │ Your PRTG│
              └──────────┘
```

## 📦 Status

`0.1.0-beta` — first public drop. All six build phases landed in a single
initial commit. Untested end-to-end; first real compile happens on the
Proxmox LXC.

---

## Credits

Built on [Uptime Kuma](https://github.com/louislam/uptime-kuma) by Louis
Lam (MIT). Kuma's original license is preserved verbatim as
[`LICENSE-UPSTREAM`](LICENSE-UPSTREAM).

PRTG® is a registered trademark of Paessler AG. Kyosei Dash is
independent and unaffiliated with either Uptime Kuma or Paessler AG.
