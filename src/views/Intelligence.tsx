import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  Copy,
  Database,
  Download,
  Eye,
  Fingerprint,
  Globe,
  Network,
  Radar,
  Search,
  ShieldCheck,
} from "lucide-react";
import "./intel.css";

type IndicatorType = "IP address" | "Domain" | "File hash";
type Indicator = {
  id: string;
  value: string;
  type: IndicatorType;
  risk: "Critical" | "High" | "Medium";
  confidence: number;
  tactic: string;
  technique: string;
  source: string;
  sightings: number;
  lastSeen: string;
  description: string;
  context: string;
};

const indicators: Indicator[] = [
  {
    id: "ioc-001",
    value: "198.51.100.42",
    type: "IP address",
    risk: "Critical",
    confidence: 96,
    tactic: "Command & control",
    technique: "T1071.001 · Web protocols",
    source: "AEGIS research lab",
    sightings: 28,
    lastSeen: "12 min ago",
    description:
      "A representative command-and-control endpoint observed in the training dataset. Repeated low-volume HTTPS connections resemble a periodic beacon.",
    context:
      "Correlate destination traffic, DNS resolution, process ancestry, and endpoint telemetry. An indicator match is a lead, not proof of compromise.",
  },
  {
    id: "ioc-002",
    value: "secure-update.example",
    type: "Domain",
    risk: "High",
    confidence: 89,
    tactic: "Initial access",
    technique: "T1566.002 · Spearphishing link",
    source: "Phishing simulation",
    sightings: 14,
    lastSeen: "24 min ago",
    description:
      "A fictional software update domain used in a credential-phishing exercise. The simulation pairs this domain with suspicious email links.",
    context:
      "Review email headers, clicked URLs, browser history, and subsequent sign-ins before deciding whether account containment is required.",
  },
  {
    id: "ioc-003",
    value: "203.0.113.78",
    type: "IP address",
    risk: "High",
    confidence: 92,
    tactic: "Discovery",
    technique: "T1046 · Network service discovery",
    source: "Network lab",
    sightings: 41,
    lastSeen: "38 min ago",
    description:
      "A documentation-range address representing an external source of repeated port probes in the lab network.",
    context:
      "Compare connection rate and destination ports with approved scanning schedules. Validate firewall decisions and exposure before escalation.",
  },
  {
    id: "ioc-004",
    value: "e7a29d4c1b683fa80d942a31c26f817de093bfa628b645729caa5d48f01a364f",
    type: "File hash",
    risk: "Critical",
    confidence: 98,
    tactic: "Execution",
    technique: "T1059.001 · PowerShell",
    source: "Endpoint exercise",
    sightings: 3,
    lastSeen: "46 min ago",
    description:
      "A synthetic SHA-256 fingerprint used to represent a malicious script in an endpoint response exercise. No actual malware is distributed.",
    context:
      "Inspect the command line and parent process, preserve evidence, and determine whether related hosts executed the same sample.",
  },
  {
    id: "ioc-005",
    value: "cdn-assets.example",
    type: "Domain",
    risk: "Medium",
    confidence: 72,
    tactic: "Exfiltration",
    technique: "T1041 · Exfiltration over C2",
    source: "AEGIS research lab",
    sightings: 7,
    lastSeen: "1 hr ago",
    description:
      "A fictional destination representing unusual outbound transfers. Its name alone does not establish malicious behavior.",
    context:
      "Check transfer size, data classification, destination reputation, and application ownership. Confirm business context with the asset owner.",
  },
  {
    id: "ioc-006",
    value: "192.0.2.156",
    type: "IP address",
    risk: "Medium",
    confidence: 78,
    tactic: "Credential access",
    technique: "T1110 · Brute force",
    source: "Identity lab",
    sightings: 32,
    lastSeen: "2 hrs ago",
    description:
      "A documentation-range IP representing repeated failed authentication attempts against an identity provider.",
    context:
      "Check targeted accounts, failure reasons, MFA results, and successful sessions. Rate limiting and MFA are potential mitigations.",
  },
  {
    id: "ioc-007",
    value: "invoice-review.example",
    type: "Domain",
    risk: "High",
    confidence: 86,
    tactic: "Initial access",
    technique: "T1566 · Phishing",
    source: "Phishing simulation",
    sightings: 11,
    lastSeen: "3 hrs ago",
    description:
      "A fictional invoice-themed phishing domain included for practical email investigation and indicator handling.",
    context:
      "Preserve the message, inspect attachments safely, identify other recipients, and check for post-delivery activity.",
  },
];

function readWatchlist(): string[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem("aegis-intel-watchlist") || "[]",
    );
    return Array.isArray(saved)
      ? saved.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function TypeIcon({ type, size = 16 }: { type: IndicatorType; size?: number }) {
  return type === "Domain" ? (
    <Globe size={size} />
  ) : type === "File hash" ? (
    <Fingerprint size={size} />
  ) : (
    <Network size={size} />
  );
}

export default function Intelligence() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All indicators");
  const [watchOnly, setWatchOnly] = useState(false);
  const [selected, setSelected] = useState(indicators[0]);
  const [watchlist, setWatchlist] = useState<string[]>(readWatchlist);
  const [notice, setNotice] = useState("");
  const visible = useMemo(
    () =>
      indicators.filter(
        (item) =>
          (type === "All indicators" || item.type === type) &&
          (!watchOnly || watchlist.includes(item.id)) &&
          `${item.value} ${item.tactic} ${item.source}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, type, watchOnly, watchlist],
  );

  function toggleWatch() {
    const next = watchlist.includes(selected.id)
      ? watchlist.filter((id) => id !== selected.id)
      : [...watchlist, selected.id];
    setWatchlist(next);
    try {
      localStorage.setItem("aegis-intel-watchlist", JSON.stringify(next));
      setNotice(
        next.includes(selected.id)
          ? "Indicator added to your local watchlist."
          : "Indicator removed from your local watchlist.",
      );
    } catch {
      setNotice(
        "Watchlist updated for this session; browser storage is unavailable.",
      );
    }
  }

  function exportIndicators() {
    const payload = {
      dataset: "AEGIS synthetic threat intelligence",
      exportedAt: new Date().toISOString(),
      liveFeed: false,
      indicators: visible.map((item) => ({
        ...item,
        watched: watchlist.includes(item.id),
      })),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "aegis-threat-intelligence.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${visible.length} representative indicators as JSON.`);
  }

  async function copyIndicator() {
    try {
      await navigator.clipboard.writeText(selected.value);
      setNotice("Indicator copied to clipboard.");
    } catch {
      setNotice("Clipboard unavailable. Select and copy the indicator text.");
    }
  }

  return (
    <div className="intel-page">
      <section className="intel-overview">
        <div className="intel-overview-copy">
          <span className="intel-eyebrow">
            <Radar size={15} /> THREAT CONTEXT ENGINE
          </span>
          <h2>Every signal has a story.</h2>
          <p>
            Connect indicators, adversary tactics, and the evidence that
            matters.
          </p>
          <div className="intel-source-pill">
            <span /> Curated training dataset{" "}
            <span className="intel-source-separator">/</span> Synthetic
            indicators
          </div>
        </div>
        <div className="intel-orbit" aria-hidden="true">
          <div className="intel-orbit-ring intel-ring-one" />
          <div className="intel-orbit-ring intel-ring-two" />
          <div className="intel-orbit-ring intel-ring-three" />
          <Radar size={47} />
          <i />
          <b />
          <em />
        </div>
        <div className="intel-overview-metrics">
          <div>
            <strong>07</strong>
            <span>Curated indicators</span>
          </div>
          <div>
            <strong>136</strong>
            <span>Simulated sightings</span>
          </div>
          <div>
            <strong>{watchlist.length.toString().padStart(2, "0")}</strong>
            <span>Your watchlist</span>
          </div>
        </div>
      </section>

      <div className="intel-feed-strip">
        <Database size={17} />
        <div>
          <strong>Intelligence sources</strong>
          <span>
            AEGIS research lab · Network lab · Identity lab · Phishing
            simulations
          </span>
        </div>
        <span className="intel-curated-tag">CURATED DEMO</span>
      </div>

      <div className="intel-workspace">
        <section className="intel-panel intel-indicators">
          <div className="intel-panel-heading">
            <div>
              <h3>Indicator collection</h3>
              <p>Search, inspect, and enrich your investigation.</p>
            </div>
            <button
              className="intel-icon-button"
              onClick={exportIndicators}
              title="Export visible indicators as JSON"
              aria-label="Export visible indicators as JSON"
            >
              <Download size={17} />
            </button>
          </div>
          <div className="intel-toolbar">
            <label className="intel-search">
              <Search size={16} />
              <input
                aria-label="Search indicators"
                placeholder="Search an IP, domain, or tactic…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              aria-label="Indicator type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>All indicators</option>
              <option>IP address</option>
              <option>Domain</option>
              <option>File hash</option>
            </select>
          </div>
          <div className="intel-tabs">
            <button
              className={!watchOnly ? "active" : ""}
              onClick={() => setWatchOnly(false)}
            >
              All indicators <span>{indicators.length}</span>
            </button>
            <button
              className={watchOnly ? "active" : ""}
              onClick={() => setWatchOnly(true)}
            >
              Watchlist <span>{watchlist.length}</span>
            </button>
          </div>
          <div className="intel-table-scroll">
            <table className="intel-table">
              <thead>
                <tr>
                  <th>INDICATOR</th>
                  <th>RISK</th>
                  <th>TACTIC</th>
                  <th>SEEN</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    className={selected.id === item.id ? "selected" : ""}
                    onClick={() => setSelected(item)}
                  >
                    <td>
                      <button
                        className="intel-indicator-select"
                        onClick={() => setSelected(item)}
                      >
                        <span
                          className={`intel-type-icon ${item.type === "File hash" ? "hash" : ""}`}
                        >
                          <TypeIcon type={item.type} />
                        </span>
                        <span>
                          <strong title={item.value}>
                            {item.value.length > 29
                              ? `${item.value.slice(0, 22)}…`
                              : item.value}
                          </strong>
                          <small>
                            {item.type}
                            {watchlist.includes(item.id) && (
                              <Eye size={11} aria-label="On watchlist" />
                            )}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span
                        className={`intel-risk intel-risk-${item.risk.toLowerCase()}`}
                      >
                        {item.risk}
                      </span>
                    </td>
                    <td>
                      <span className="intel-table-tactic">{item.tactic}</span>
                    </td>
                    <td className="intel-muted-cell">{item.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <div className="intel-empty">
                <Search size={24} />
                <strong>No matching indicators</strong>
                <p>Try another search or add an indicator to your watchlist.</p>
              </div>
            )}
          </div>
          <div className="intel-table-footer">
            <span>
              Showing {visible.length} of {indicators.length} indicators
            </span>
            <span>
              <ShieldCheck size={13} /> Reserved IPs & example domains
            </span>
          </div>
        </section>

        <aside className="intel-panel intel-detail">
          <div className="intel-detail-top">
            <span className="intel-eyebrow">INDICATOR PROFILE</span>
            <span
              className={`intel-risk intel-risk-${selected.risk.toLowerCase()}`}
            >
              {selected.risk}
            </span>
          </div>
          <div className="intel-detail-icon">
            <TypeIcon type={selected.type} size={29} />
          </div>
          <div className="intel-detail-value">
            <h3>{selected.value}</h3>
            <button
              className="intel-icon-button"
              aria-label="Copy selected indicator"
              onClick={copyIndicator}
            >
              <Copy size={15} />
            </button>
          </div>
          <p className="intel-detail-type">
            {selected.type} <span>·</span> {selected.source}
          </p>
          <div className="intel-confidence">
            <div>
              <span>Analyst confidence</span>
              <strong>{selected.confidence}%</strong>
            </div>
            <div className="intel-progress">
              <span style={{ width: `${selected.confidence}%` }} />
            </div>
            <small>Scenario label; no external reputation lookup.</small>
          </div>
          <div className="intel-detail-stats">
            <div>
              <Activity size={15} />
              <strong>{selected.sightings}</strong>
              <span>Lab sightings</span>
            </div>
            <div>
              <Radar size={15} />
              <strong>{selected.lastSeen}</strong>
              <span>Scenario last seen</span>
            </div>
          </div>
          <div className="intel-context-block">
            <span className="intel-small-label">MITRE ATT&CK MAPPING</span>
            <strong>{selected.tactic}</strong>
            <p>{selected.technique}</p>
          </div>
          <div className="intel-context-block">
            <span className="intel-small-label">WHY IT MATTERS</span>
            <p>{selected.description}</p>
          </div>
          <div className="intel-context-block intel-investigate">
            <ArrowUpRight size={17} />
            <div>
              <strong>Investigation next step</strong>
              <p>{selected.context}</p>
            </div>
          </div>
          <button
            className={`intel-watch-button ${watchlist.includes(selected.id) ? "watched" : ""}`}
            onClick={toggleWatch}
          >
            {watchlist.includes(selected.id) ? (
              <Check size={16} />
            ) : (
              <Eye size={16} />
            )}
            {watchlist.includes(selected.id)
              ? "Remove from watchlist"
              : "Add to watchlist"}
          </button>
        </aside>
      </div>
      <div className="intel-footnote">
        <ShieldCheck size={14} />
        <span>
          This collection is representative synthetic data. No live feed or
          real-world attribution is implied.
        </span>
      </div>
      {notice && (
        <div className="intel-notice" role="status">
          <Check size={16} />
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
