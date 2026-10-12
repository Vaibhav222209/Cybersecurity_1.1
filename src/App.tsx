import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Crosshair,
  Download,
  Fingerprint,
  Globe2,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Monitor,
  MoreHorizontal,
  Radar,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Siren,
  TerminalSquare,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { api, download, relativeTime } from "./api";
import type { Asset, Incident, SecurityEvent } from "./api";
import Learning from "./views/Learning";
import Playbooks from "./views/Playbooks";
import Intelligence from "./views/Intelligence";
import VPNTracker from "./views/VPNTracker";
import {
  EventStream,
  Incidents,
  Assessments,
  Terminal,
} from "./views/Operations";
const navigation = [
  { label: "Overview", icon: LayoutDashboard, group: "OPERATIONS" },
  { label: "Event stream", icon: Activity },
  { label: "Threat intelligence", icon: Radar },
  { label: "Incidents", icon: Siren },
  { label: "Vulnerabilities", icon: Crosshair, group: "DEFENSE & RESPONSE" },
  { label: "VPN tracker", icon: Globe2 },
  { label: "Response playbooks", icon: BookOpen },
  { label: "Cyber lab", icon: Fingerprint, group: "WORKSPACE" },
  { label: "Terminal", icon: TerminalSquare },
];
const pageCopy: Record<string, [string, string]> = {
  Overview: ["Command center", "Every signal. One clear picture."],
  "Event stream": [
    "Event stream",
    "Turn raw telemetry into actionable context.",
  ],
  "Threat intelligence": [
    "Threat intelligence",
    "Know what’s out there. Understand what matters.",
  ],
  Incidents: [
    "Incident workspace",
    "Investigate with context. Respond with confidence.",
  ],
  Vulnerabilities: ["Attack surface", "Find the gaps before an attacker does."],
  "VPN tracker": [
    "Identity & travel",
    "Follow the session. Question the impossible.",
  ],
  "Response playbooks": [
    "Response playbooks",
    "A clear next move, when every second matters.",
  ],
  "Cyber lab": [
    "Cyber defense lab",
    "Understand the attack. Engineer the defense.",
  ],
  Terminal: [
    "Parrot terminal",
    "Your tools. Your scope. A sharper perspective.",
  ],
};
export default function App() {
  const [page, setPage] = useState("Overview"),
    [events, setEvents] = useState<SecurityEvent[]>([]),
    [assets, setAssets] = useState<Asset[]>([]),
    [incidents, setIncidents] = useState<Incident[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [overlay, setOverlay] = useState(""),
    [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(false),
    [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      const [e, a, i] = await Promise.all([
        api<{ events: SecurityEvent[] }>("/events"),
        api<{ assets: Asset[] }>("/assets"),
        api<{ incidents: Incident[] }>("/incidents"),
      ]);
      setEvents(e.events);
      setAssets(a.assets);
      setIncidents(i.incidents);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setOverlay("");
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOverlay("search");
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function navigate(next: string) {
    setPage(next);
    setMobile(false);
    setOverlay("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function exportReport() {
    setBusy(true);
    try {
      download(
        `aegis-report-${new Date().toISOString().slice(0, 10)}.json`,
        await api("/report"),
      );
      setNotice("Workspace report exported");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const critical = events.filter((e) => e.severity === "critical").length;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("Overview");
          }}
        >
          <span className="brand-symbol">
            <ShieldCheck size={25} />
          </span>
          <span>
            AEGIS<span className="brand-caption">SECURITY OPERATIONS</span>
          </span>
        </a>
        <button
          className="workspace-switch"
          onClick={() => setOverlay("settings")}
        >
          <span className="workspace-icon">
            <Command size={16} />
          </span>
          <span>
            Sentinel workspace<small>LOCAL DEVELOPMENT</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <nav aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, group }) => (
            <div key={label}>
              {group && <div className="nav-group">{group}</div>}
              <button
                className={`nav-item ${page === label ? "active" : ""}`}
                onClick={() => navigate(label)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === "Incidents" && (
                  <span className="nav-count">
                    {
                      incidents.filter(
                        (i) => !["resolved", "closed"].includes(i.status),
                      ).length
                    }
                  </span>
                )}
                {page === label && label !== "Incidents" && (
                  <span className="nav-active-dot" />
                )}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-status">
            <span className={`status-dot ${error ? "red" : ""}`} />
            <span>{error ? "API disconnected" : "Systems operational"}</span>
            <Wifi size={14} />
          </div>
          <button className="profile" onClick={() => setOverlay("settings")}>
            <div className="avatar">JD</div>
            <span>
              Vaibhav Thakur<small>Security analyst · Demo</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-layout">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-btn"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </button>
            <Shield size={14} />
            <span>Workspace</span>
            <ChevronRight size={12} />
            <strong>{pageCopy[page][0]}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => setOverlay("search")}
            >
              <Search size={15} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <button
              className="icon-btn notification-btn"
              aria-label="Notifications"
              onClick={() =>
                setOverlay(overlay === "notifications" ? "" : "notifications")
              }
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="icon-btn"
              aria-label="Workspace information"
              onClick={() => setOverlay("settings")}
            >
              <CircleHelp size={18} />
            </button>
            <div className="avatar small">JD</div>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="status-dot" /> DEMO WORKSPACE{" "}
                <span className="eyebrow-slash">/</span> SOC PLATFORM
              </div>
              <h1>{pageCopy[page][0]}</h1>
              <p>{pageCopy[page][1]}</p>
            </div>
            <div className="page-actions">
              <span className="demo-badge">
                <span className="status-dot" />
                {events.some((e) => e.demo === false)
                  ? "Demo + local telemetry"
                  : "Synthetic telemetry"}
              </span>
              <button
                className="button secondary"
                onClick={exportReport}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Download size={15} />
                )}
                Export report
              </button>
            </div>
          </div>
          {error && (
            <div className="error-banner">
              <Siren size={16} />
              <span>
                Backend unavailable: {error}. Start the app with{" "}
                <code>npm run dev</code>.
              </span>
              <button onClick={refresh}>Retry</button>
            </div>
          )}
          {page === "Overview" && (
            <Dashboard
              events={events}
              assets={assets}
              incidents={incidents}
              navigate={navigate}
              critical={critical}
            />
          )}
          {page === "Event stream" && (
            <EventStream events={events} refresh={refresh} toast={setNotice} />
          )}
          {page === "Threat intelligence" && <Intelligence />}
          {page === "Incidents" && (
            <Incidents
              incidents={incidents}
              assets={assets}
              refresh={refresh}
              toast={setNotice}
            />
          )}
          {page === "Vulnerabilities" && <Assessments toast={setNotice} />}
          {page === "VPN tracker" && <VPNTracker />}
          {page === "Response playbooks" && <Playbooks />}
          {page === "Cyber lab" && <Learning />}
          {page === "Terminal" && <Terminal />}
          <footer className="footer">
            <span>
              <ShieldCheck size={12} /> AEGIS SECURITY OPERATIONS
            </span>
            <span>
              Built for clarity. Designed for defense.
              <span className="footer-dot">•</span> v1.0
            </span>
            <span>
              <span className={`status-dot ${error ? "red" : ""}`} />
              {error ? "Local API disconnected" : "Local lab connected"}
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {overlay && (
        <div className="modal-backdrop" onClick={() => setOverlay("")}>
          <section
            className={`modal ${overlay === "search" ? "search-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              overlay === "search"
                ? "Search workspace"
                : "Workspace information"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>
                {overlay === "search"
                  ? "Search workspace"
                  : overlay === "notifications"
                    ? "Priority signals"
                    : "Workspace configuration"}
              </h2>
              <button
                className="icon-btn"
                aria-label="Close dialog"
                onClick={() => setOverlay("")}
              >
                <X size={20} />
              </button>
            </div>
            {overlay === "search" ? (
              <>
                <div className="search-box large">
                  <Search size={20} />
                  <input
                    autoFocus
                    placeholder="Search events, incidents, tools…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>ESC</kbd>
                </div>
                <div className="search-results">
                  {navigation
                    .filter((n) =>
                      n.label.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((n) => (
                      <button key={n.label} onClick={() => navigate(n.label)}>
                        <n.icon size={18} />
                        <span>{n.label}</span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  {query &&
                    events
                      .filter((e) =>
                        (e.title + e.message)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .slice(0, 4)
                      .map((e) => (
                        <button
                          key={e.id}
                          onClick={() => navigate("Event stream")}
                        >
                          <Activity size={18} />
                          <span>
                            {e.title}
                            <small>Security event · {e.source}</small>
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                </div>
              </>
            ) : overlay === "notifications" ? (
              <div className="notification-list">
                {events
                  .filter((e) => ["critical", "high"].includes(e.severity))
                  .slice(0, 5)
                  .map((e) => (
                    <button key={e.id} onClick={() => navigate("Event stream")}>
                      <span className={`severity-dot ${e.severity}`} />
                      <div>
                        <strong>{e.title}</strong>
                        <p>
                          {e.source} · {relativeTime(e.timestamp)}
                        </p>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                {!events.length && <p>Waiting for the local event service.</p>}
              </div>
            ) : (
              <div className="settings-content">
                <div className="info-note">
                  <ShieldCheck size={22} />
                  <div>
                    <strong>A safe space to build your defense</strong>
                    <p>
                      Telemetry, investigations, and response actions are
                      simulated. Assessments execute against the local lab or
                      explicitly configured authorized targets.
                    </p>
                  </div>
                </div>
                <dl>
                  <dt>Workspace</dt>
                  <dd>Sentinel / local demo</dd>
                  <dt>API</dt>
                  <dd>127.0.0.1:4317</dd>
                  <dt>Assessment lab</dt>
                  <dd>127.0.0.1:4318</dd>
                  <dt>Frameworks</dt>
                  <dd>NIST CSF 2.0 · SP 800-61r3 · MITRE ATT&CK</dd>
                  <dt>Target scope</dt>
                  <dd>
                    Loopback by default. Configure AUTHORIZED_TARGETS on the
                    backend to add an authorized hostname.
                  </dd>
                </dl>
                <button
                  className="button primary"
                  onClick={() => navigate("Cyber lab")}
                >
                  Explore the cyber lab
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Sparkline({
  color = "#ccff6b",
  down = false,
}: {
  color?: string;
  down?: boolean;
}) {
  return (
    <svg className="sparkline" viewBox="0 0 104 36">
      <path
        d={
          down
            ? "M1 6 L12 15 L22 12 L31 23 L43 17 L52 26 L63 20 L72 29 L83 25 L94 31 L103 27"
            : "M1 30 L12 25 L22 29 L31 18 L43 24 L52 15 L63 19 L72 8 L83 14 L94 7 L103 10"
        }
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d={
          down
            ? "M1 6 L12 15 L22 12 L31 23 L43 17 L52 26 L63 20 L72 29 L83 25 L94 31 L103 27 L103 36 L1 36Z"
            : "M1 30 L12 25 L22 29 L31 18 L43 24 L52 15 L63 19 L72 8 L83 14 L94 7 L103 10 L103 36 L1 36Z"
        }
        fill={color}
        opacity=".05"
      />
    </svg>
  );
}
function Dashboard({
  events,
  assets,
  incidents,
  navigate,
  critical,
}: {
  events: SecurityEvent[];
  assets: Asset[];
  incidents: Incident[];
  navigate: (p: string) => void;
  critical: number;
}) {
  const [chartMode, setChartMode] = useState("All events"),
    [period, setPeriod] = useState("7 days"),
    [hover, setHover] = useState<number | null>(null);
  const open = incidents.filter(
      (i) => !["closed", "resolved"].includes(i.status),
    ).length,
    findings = assets.reduce((s, a) => s + a.vulnerabilities, 0),
    risk = assets.length
      ? Math.round(assets.reduce((s, a) => s + a.riskScore, 0) / assets.length)
      : 0;
  const metrics = [
    {
      label: "Security events",
      value: events.length.toString().padStart(2, "0"),
      icon: Activity,
      color: "#ccff6b",
      detail: `Across ${new Set(events.map((e) => e.source)).size} connected sources`,
      page: "Event stream",
    },
    {
      label: "Open incidents",
      value: open.toString().padStart(2, "0"),
      icon: Siren,
      color: "#ff9373",
      detail: `${critical} critical signals need review`,
      page: "Incidents",
    },
    {
      label: "Asset vulnerabilities",
      value: findings.toString().padStart(2, "0"),
      icon: Crosshair,
      color: "#82a8ff",
      detail: "Prioritize your exposure",
      page: "Vulnerabilities",
    },
    {
      label: "Monitored assets",
      value: assets.length.toString().padStart(2, "0"),
      icon: Monitor,
      color: "#bc93fa",
      detail: `${assets.filter((a) => a.status === "isolated").length} endpoints isolated`,
      page: "Incidents",
    },
  ];
  const priorities = [...events].sort(
    (a, b) =>
      ["critical", "high", "medium", "low", "info"].indexOf(a.severity) -
        ["critical", "high", "medium", "low", "info"].indexOf(b.severity) ||
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const chartData =
    period === "24 hours"
      ? [19, 12, 25, 17, 39, 27, 46, 21, 30, 23, 45, 31]
      : [
          21, 25, 20, 36, 27, 29, 48, 42, 50, 36, 51, 46, 67, 61, 39, 47, 31,
          28, 40, 32, 44, 35, 49, 61,
        ];
  const data =
    chartMode === "Critical"
      ? chartData.map((n, i) => Math.max(7, n / 2 + (i % 3) * 7))
      : chartData;
  const points = data
    .map((n, i) => `${40 + (i * 660) / (data.length - 1)},${190 - n * 2}`)
    .join(" ");
  return (
    <>
      <section className="hero panel">
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="pulse-dot" /> THE WATCH NEVER STOPS
          </div>
          <h2>
            Your perimeter.
            <br />
            <span>Under watch.</span>
          </h2>
          <p>Stay ahead of threats. Turn insight into action.</p>
          <button className="hero-button" onClick={() => navigate("Incidents")}>
            Open investigation workspace
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="hero-coordinate">
          <span className="crosshair-symbol">+</span>
          <div>
            GLOBAL THREAT VISIBILITY
            <small>40° 43′ N &nbsp; 73° 59′ W · ILLUSTRATIVE</small>
          </div>
        </div>
        <div className="hero-live">
          <span className="status-dot" /> SENTINEL ONLINE
          <span className="hero-live-divider" />
          {assets.length} ASSETS IN SCOPE
        </div>
        <div className="hero-number">
          01<span>/ AEGIS</span>
        </div>
      </section>
      <div className="metrics">
        {metrics.map(({ label, value, icon: Icon, color, detail, page }) => (
          <button
            key={label}
            className="metric-card panel"
            onClick={() => navigate(page)}
          >
            <div className="metric-heading">
              <span>{label}</span>
              <span
                className="metric-icon"
                style={{ color, background: `${color}0d` }}
              >
                <Icon size={17} />
              </span>
            </div>
            <div className="metric-value-row">
              <strong>{value}</strong>
              <Sparkline
                color={color}
                down={label === "Asset vulnerabilities"}
              />
            </div>
            <div className="metric-detail">
              <span style={{ color }}>
                <ArrowUpRight size={12} />
              </span>
              {detail}
              <ChevronRight size={13} />
            </div>
          </button>
        ))}
      </div>
      <div className="analytics-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Threat activity<span className="subtle-tag">ILLUSTRATIVE</span>
              </h2>
              <p>Signal volume across your environment</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="Activity period"
            >
              <option>7 days</option>
              <option>24 hours</option>
            </select>
          </div>
          <div className="chart-toolbar">
            <div className="chart-key">
              <span className="legend-dot" />
              Security events
              <span className="legend-dot blue" />
              Baseline
            </div>
            <div className="segmented">
              {["All events", "Critical"].map((s) => (
                <button
                  key={s}
                  className={chartMode === s ? "selected" : ""}
                  onClick={() => setChartMode(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <svg
              className="activity-chart"
              viewBox="0 0 730 235"
              role="img"
              aria-label={`${chartMode} illustrative activity for ${period}`}
            >
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ccff6b" stopOpacity=".23" />
                  <stop offset="100%" stopColor="#ccff6b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 70, 110, 150, 190].map((y, i) => (
                <g key={y}>
                  <line
                    x1="40"
                    y1={y}
                    x2="710"
                    y2={y}
                    stroke="#223047"
                    strokeDasharray="3 5"
                    opacity=".55"
                  />
                  <text x="4" y={y + 4} fill="#758198" fontSize="10">
                    {80 - i * 20}
                  </text>
                </g>
              ))}
              <path
                d="M40 165 C100 156 135 165 180 146 S255 153 310 139 S400 145 445 138 S515 159 575 153 S635 145 710 136"
                fill="none"
                stroke="#598abe"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                opacity=".65"
              />
              <path
                d={`M${points.replaceAll(" ", " L")} L700 195 L40 195 Z`}
                fill="url(#chart-gradient)"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#ccff6b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {data.map((n, i) => (
                <g
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <rect
                    x={40 + (i * 660) / (data.length - 1) - 14}
                    y="20"
                    width="28"
                    height="178"
                    fill="transparent"
                  />
                  {hover === i && (
                    <>
                      <line
                        x1={40 + (i * 660) / (data.length - 1)}
                        y1="20"
                        x2={40 + (i * 660) / (data.length - 1)}
                        y2="195"
                        stroke="#ccff6b"
                        opacity=".3"
                      />
                      <circle
                        cx={40 + (i * 660) / (data.length - 1)}
                        cy={190 - n * 2}
                        r="4"
                        fill="#ccff6b"
                      />
                      <text
                        x={Math.min(650, 40 + (i * 660) / (data.length - 1))}
                        y="15"
                        fontSize="11"
                        fill="#ccff6b"
                      >
                        {Math.round(n)} events
                      </text>
                    </>
                  )}
                </g>
              ))}
              {(period === "7 days"
                ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                : [
                    "00:00",
                    "04:00",
                    "08:00",
                    "12:00",
                    "16:00",
                    "20:00",
                    "23:59",
                  ]
              ).map((label, i) => (
                <text
                  key={label}
                  x={40 + i * 110}
                  y="224"
                  fill="#758198"
                  fontSize="10"
                  textAnchor={i === 6 ? "end" : "start"}
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
          <div className="chart-bottom">
            <span>
              <Activity size={13} /> Synthetic event trend · training scenario
            </span>
            <button
              className="text-button"
              onClick={() => navigate("Event stream")}
            >
              Explore event stream
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
        <section className="panel posture-panel">
          <div className="panel-heading">
            <div>
              <h2>Security posture</h2>
              <p>Demo asset risk overview</p>
            </div>
            <Shield size={17} className="muted" />
          </div>
          <div className="posture-ring">
            <svg viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="69"
                fill="none"
                stroke="#202c3f"
                strokeWidth="10"
              />
              <circle
                cx="90"
                cy="90"
                r="69"
                fill="none"
                stroke="#ccff6b"
                strokeWidth="10"
                strokeDasharray={`${((100 - risk) / 100) * 434} 434`}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
              />
              <circle
                cx="90"
                cy="90"
                r="55"
                fill="none"
                stroke="#223047"
                strokeDasharray="1 7"
              />
              <text
                x="90"
                y="88"
                fill="#f1f5fb"
                textAnchor="middle"
                fontSize="44"
                fontWeight="600"
              >
                {100 - risk}
              </text>
              <text
                x="90"
                y="110"
                fill="#8491a8"
                textAnchor="middle"
                fontSize="10"
                letterSpacing="1.3"
              >
                OUT OF 100
              </text>
            </svg>
            <span className="posture-state">
              <span className="status-dot" />{" "}
              {risk > 50 ? "Elevated exposure" : "Defense in progress"}
            </span>
          </div>
          <div className="posture-rows">
            <div>
              <span>
                <span className="legend-dot" />
                Healthy endpoints
              </span>
              <strong>
                {assets.filter((a) => a.riskScore < 50).length}
                <small> / {assets.length}</small>
              </strong>
            </div>
            <div>
              <span>
                <span className="legend-dot orange" />
                Require attention
              </span>
              <strong>{assets.filter((a) => a.riskScore >= 50).length}</strong>
            </div>
            <div>
              <span>
                <LockKeyhole size={11} />
                Isolated endpoints
              </span>
              <strong>
                {assets.filter((a) => a.status === "isolated").length}
              </strong>
            </div>
          </div>
          <button
            className="posture-link"
            onClick={() => navigate("Incidents")}
          >
            Review asset inventory
            <ArrowUpRight size={14} />
          </button>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel recent-events">
          <div className="panel-heading">
            <div>
              <h2>
                Priority signals
                <span className="small-counter">
                  {
                    events.filter((e) =>
                      ["critical", "high"].includes(e.severity),
                    ).length
                  }
                </span>
              </h2>
              <p>The events that deserve a closer look</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("Event stream")}
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-scroll">
            <table className="event-mini-table">
              <thead>
                <tr>
                  <th>SEVERITY</th>
                  <th>EVENT</th>
                  <th>SOURCE</th>
                  <th>DETECTED</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {priorities.slice(0, 4).map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate("Event stream")}
                    tabIndex={0}
                    onKeyDown={(k) =>
                      k.key === "Enter" && navigate("Event stream")
                    }
                  >
                    <td>
                      <span className={`severity ${e.severity}`}>
                        <span />
                        {e.severity}
                      </span>
                    </td>
                    <td>
                      <strong>{e.title}</strong>
                      <small>
                        {e.ip} · {e.tactic}
                      </small>
                    </td>
                    <td>
                      <span className="source-label">{e.source}</span>
                    </td>
                    <td className="muted nowrap">
                      {relativeTime(e.timestamp)}
                    </td>
                    <td>
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!events.length && (
              <div className="empty-state">
                <LoaderCircle className="spin" />
                Connecting to the event service…
              </div>
            )}
          </div>
        </section>
        <section className="panel defense-card">
          <div className="panel-heading">
            <div>
              <h2>The defender’s edge</h2>
              <p>Knowledge is your first control.</p>
            </div>
            <BookOpen size={18} className="muted" />
          </div>
          <div className="defense-art">
            <div className="defense-art-ring" />
            <ShieldCheck size={44} />
            <span className="orbit-node n1" />
            <span className="orbit-node n2" />
            <span className="orbit-node n3" />
          </div>
          <h3>
            Trace the attack.
            <br />
            Strengthen the defense.
          </h3>
          <p>
            Explore the kill chain, packet journeys, and the CIA triad in
            action.
          </p>
          <button
            className="button secondary"
            onClick={() => navigate("Cyber lab")}
          >
            Enter cyber lab
            <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
      <div className="nist-strip">
        <span>
          <ShieldCheck size={17} /> FRAMEWORK ALIGNED
        </span>
        <div>
          {[
            "Govern",
            "Identify",
            "Protect",
            "Detect",
            "Respond",
            "Recover",
          ].map((v, i) => (
            <button key={v} onClick={() => navigate("Response playbooks")}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {v}
              {i < 5 && <ChevronRight size={12} />}
            </button>
          ))}
        </div>
        <strong>NIST CSF 2.0</strong>
      </div>
    </>
  );
}
