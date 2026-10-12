# AEGIS backend and authorized training lab

The service uses Node.js built-in modules only. Node.js 22 or later is recommended.

```sh
node server/index.mjs
node --test server/backend.test.mjs
```

The API listens on `127.0.0.1:4317`. The read-only, intentionally incomplete security-header training lab listens on `127.0.0.1:4318`. The frontend development proxy forwards `/api` to the API. Both listeners remain local to the cloud machine.

SOC events, assets, location anomalies, investigations, playbooks, and containment are **synthetic training scenarios**. Isolation records local demo state; it does not invoke an endpoint agent, terminate real sessions, or change firewall rules. HTTP/TCP baseline assessments are **actual network observations**, with scope and DNS validation performed before any request. A baseline identifies configuration observations; it is not an exploitation engine or a substitute for an authorized penetration test.

State is persisted to `.runtime/soc-state.json`. To reset the demo, stop the backend and remove only this generated file. `AEGIS_RUNTIME_DIR` can place runtime data in another directory. Never commit runtime data.

## Authorized assessment scope

By default, only `http://127.0.0.1:4318` and its `localhost` / `::1` lab aliases are accepted. The bare command target `localhost` maps to this lab. External or internal assessments require exact, explicitly authorized origins:

```sh
AUTHORIZED_TARGETS='https://your-owned-example.com,http://10.20.8.13:8080' node server/index.mjs
```

Use this only for assets you own or have explicit permission to assess. The variable is a comma-separated list of complete HTTP(S) origins, including non-default ports. Wildcards, paths, user credentials, queries, fragments, subnet expansion, and automatic redirects are not supported. DNS results are checked before a request and the selected address is pinned to prevent DNS rebinding. DNS names resolving to local/private networks are rejected; an internal asset must use an explicit authorized IP origin. Link-local, metadata, multicast, unspecified, mapped-address, and non-lab loopback targets remain forbidden even when listed. HTTPS certificate validation stays enabled.

Baseline checks perform one HTTP GET plus one TCP connection to the authorized port. They observe security headers, transport, anti-framing policy, and unnecessary server banners. Header findings are contextual observations; a missing header or technology banner does not establish an exploitable vulnerability. Timeouts, response size caps, fixed target scope, and concurrency limits bound activity. No credentials, login attempts, destructive payloads, or exploit modules are used.

## Terminal

The browser terminal is an allowlisted command interpreter, not an operating-system shell. `help`, `whoami`, `scope`, `ls`, `clear`, `scan localhost`, `curl localhost`, and `tcp localhost` work without external tools. The `ls` listing represents virtual lab routes. `scan` stores a real baseline result in assessment history. A TCP connectivity check confirms successful connection establishment; packet-level handshake animations elsewhere in the UI are educational illustrations, not captured packets.

Native `nmap`, `nuclei`, and `gobuster` integrations execute only against the local lab using fixed arguments and a process timeout. User-supplied arbitrary flags are rejected. Nuclei uses the single included read-only header template, with interaction services and automatic updates disabled; Gobuster uses a five-entry lab wordlist. `msfconsole` supports version/help output only. No arbitrary shell, Metasploit exploit modules, reverse shells, or host filesystem access are available. If a tool is absent, the API returns exit code 127 and an explicit installation message; output is never fabricated as an executed tool scan.

Native tools are optional. Install them using the official OS package manager or the vendor's verified release instructions, keep signature/checksum/TLS checks enabled, and make the executable available in `PATH`. References: [Nmap download](https://nmap.org/download.html), [Nuclei installation](https://docs.projectdiscovery.io/tools/nuclei/install), [Gobuster releases](https://github.com/OJ/gobuster/releases), [Metasploit installation](https://docs.metasploit.com/docs/using-metasploit/getting-started/nightly-installers.html). Restart the backend after installation and check `/api/health` for `tools.<name>.installed`. The built-in assessment workflow remains usable without any of these packages.

For this Debian x86_64 cloud machine, a reproducible local helper is provided:

```sh
bash server/install-tools.sh
```

It downloads Nmap/Gobuster and required libraries using signed Debian archive metadata, extracts them under `/workspace/security-tools`, and installs the pinned Nuclei 3.11.1 official release only after its published SHA256 checksum matches. TLS verification remains enabled. It changes no global package configuration and requires no privileged system install. The API discovers `/workspace/security-tools/bin` automatically and supplies Nmap's local library/data paths. Existing unmanaged files in that directory are preserved by refusing to overwrite the directory.

Metasploit remains optional: its official installer is a substantially larger framework with Ruby/runtime dependencies and potentially database services. The platform does not enable exploit execution, so those dependencies are unnecessary for the required read-only assessment workflow. If installed separately through Rapid7's supported verified package process, `msfconsole --version` / `--help` become available in the terminal.

## API

| Method | Route | Result |
|---|---|---|
| GET | `/api/health` | Service, scope, lab status, tool capabilities, and limitations |
| GET | `/api/events` | Synthetic SOC events |
| POST | `/api/events` | Import 1–100 local JSON log events with required `title`; imported source identity is unverified |
| GET | `/api/assets` | Synthetic asset inventory |
| GET | `/api/incidents` | Synthetic incidents with timelines and NIST CSF 2.0 playbooks |
| POST | `/api/assets/:id/isolate` | Persist demo isolation with optional `{reason}` and audit event |
| POST | `/api/incidents/:id/actions` | Persist `{action}`: `identify`, `investigate`, `contain`, `eradicate`, `recover`, `review`, or `resolve` |
| GET | `/api/assessments` | Actual read-only assessment history |
| POST | `/api/assessments` | Run `{target, profile: "baseline"}` |
| POST | `/api/terminal` | Interpret `{command}`; return `{command, output, exitCode, kind, scope}` |
| GET | `/api/audit` | Demo analyst-action audit trail |
| GET | `/api/report` | Export JSON evidence, state, and assessment results |

Errors return `{error: {message, code}}` with a suitable HTTP status. The same source IP enriched as Chicago and Zurich is intentionally a scenario about location-data uncertainty: it requires VPN egress, session, device, and MFA verification. Geolocation disagreement alone does not prove physical travel or compromise.

NIST-aligned workflow here is a practical educational mapping to CSF 2.0 functions; it is not a certification. Production deployment requires authentication and authorization, secure multi-user storage, connected telemetry ingestion, verified threat feeds, an audited endpoint-control integration, and an independent security review.
