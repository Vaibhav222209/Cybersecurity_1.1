# AEGIS · Security Operations

An original cybersecurity operations workspace built with React, TypeScript, Vite, and a Node.js API. Custom orbital wallpaper, a geometric parrot emblem, locally hosted typography, and a responsive dark interface connect investigation, defense, and hands-on learning.

## Start

Requires Node.js 22.12+ or 24+ and npm. The cloud workspace currently uses Node 24.

```sh
npm ci --cache /tmp/aegis-npm-cache
npm run dev
```

One command starts the web interface on port **5173**, the API on **4317**, and a deliberately imperfect local assessment lab on **4318**. API and lab listeners use loopback. Stop the foreground command with Ctrl+C to stop its child services. Work directly in the existing checkout; cloud tasks are already isolated and do not need a Git worktree.

```sh
npm run build       # TypeScript validation and production assets
npm start           # API + production preview on port 4173
npm test            # Backend scope, HTTP/TCP, ingestion, state, and terminal tests
npm run test:e2e    # Browser workflows; run npm run dev separately first
```

The browser test configuration uses `/usr/bin/chromium`, available in this cloud machine. For another development machine, set the Playwright launch configuration to its Chromium executable or install Playwright Chromium through the standard Playwright instructions. Tests use synthetic state and the local lab. They can record assessments, import a test log, and isolate a demo asset.

## The workspace

| Screen | Working capabilities |
| --- | --- |
| Command center | Asset and incident metrics, illustrative activity chart filters, risk overview, priority signals, report export, search, and notifications |
| Event stream | Search and severity/source filters, raw evidence inspection, local JSON log import, and filtered exports |
| Threat intelligence | Synthetic IOC search, type filters, indicator inspection, persistent watchlist, and exports |
| Incident workspace | Attack timelines, asset inventory, demo endpoint isolation with confirmation, incident actions, audit records, and mitigation guidance |
| Attack surface | Real scoped HTTP/TCP baseline assessment, observed evidence, severity, remediation, persistent run history, and JSON reports |
| VPN tracker | Chicago–Zurich case study, travel risk calculation, authentication/session context, geolocation uncertainty, and demo session revocation |
| Response playbooks | Three NIST SP 800-61r3 / CSF 2.0 tabletop runbooks; checklists, notes, progress, and exports persist locally |
| Cyber defense lab | Interactive TCP handshake, seven OSI layers, Lockheed Martin attack chain, CIA controls, and ordered/stateful firewall policy simulation |
| Parrot terminal | Scoped command history, keyboard navigation, built-in HTTP/TCP checks, native tool integrations when installed, clear/copy/export |

## Real observations and simulated operations

The application explicitly marks synthetic telemetry and tabletop exercises. Imported JSON logs are user-supplied records stored locally. Actual HTTP/TCP assessments perform network requests; they do **not** demonstrate exploitation or establish that a website, VPN, or firewall is secure. Firewall rule evaluation and packet diagrams are simulations. Containment and session revocation update demo state; they do not operate real workstations or an identity provider. Threat indicators are synthetic and are not live reputation data.

The security posture score is `100 − mean demo asset risk score`; it is an illustrative summary, not a compliance or maturity measurement. Threat activity and metric sparklines are illustrative. NIST mappings guide the exercises and do not constitute certification.

Backend state and assessment reports persist in `.runtime/soc-state.json`. Browser watchlists, exercise progress, and VPN demo actions persist in local storage. To reset the backend demonstration, stop its process and remove only its generated state file. Never store credentials in logs, reports, or source code.

## Assessment scope and tools

Only the local lab is authorized by default. Add **exact HTTP(S) origins** for assets you own or are authorized to test:

```sh
AUTHORIZED_TARGETS='https://your-owned-domain.example,http://10.20.8.13:8080' npm run dev
```

An internal asset must use an explicit authorized IP origin; DNS names resolving to private addresses are rejected. The runner rejects unapproved destinations, metadata endpoints, shell operators, credentials in URLs, arbitrary flags, and automatic redirects. TLS validation stays enabled. There are no subnet sweeps or exploit modules.

Useful terminal commands:

```text
help
scope
scan http://127.0.0.1:4318
tcp 127.0.0.1:4318
curl localhost
nmap -sT -sV -p 4318 127.0.0.1
nuclei -u http://127.0.0.1:4318
gobuster dir -u http://127.0.0.1:4318
msfconsole --version
```

Nmap 7.95, Nuclei 3.11.1, and Gobuster 3.6 are installed in this cloud workspace under `/workspace/security-tools`. To reproduce this verified local installation on this Debian x86_64 environment, run `bash server/install-tools.sh`. The helper retains Debian signature/package hash validation and verifies the official pinned Nuclei archive checksum. It does not modify system packages. Native-tool availability is shown from the API. Nmap, Nuclei, and Gobuster integrations use fixed commands against the local lab. Nuclei uses the included read-only header template; Gobuster uses a small lab wordlist. Metasploit is an optional external installation, restricted in the web runner to help/version; this is not an unrestricted Parrot OS shell. See [backend and installation documentation](server/README.md) for tool provisioning, API contracts, scope controls, and deployment requirements.

## Next production integrations

A production SOC needs authentication, role-based access, centralized durable storage, authenticated log collectors, verified threat feeds, identity-provider session controls, and an audited EDR containment connector. These integrations are deliberately explicit extension points, rather than simulated operations presented as live infrastructure.
