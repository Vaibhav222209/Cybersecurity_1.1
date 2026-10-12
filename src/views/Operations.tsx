import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Crosshair,
  Download,
  ExternalLink,
  FileSearch,
  Filter,
  Globe2,
  Info,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  Play,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  X,
} from "lucide-react";
import { api, download, relativeTime } from "../api";
import type { Asset, Assessment, Incident, SecurityEvent } from "../api";
export function EventStream({
  events,
  refresh,
  toast,
}: {
  events: SecurityEvent[];
  refresh: () => Promise<void>;
  toast: (s: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [severity, setSeverity] = useState("all"),
    [source, setSource] = useState("all"),
    [selected, setSelected] = useState<SecurityEvent | null>(null);
  const [importOpen, setImportOpen] = useState(false),
    [importText, setImportText] = useState(
      '[{"title":"Application login failure","message":"Failed sign-in observed in local application logs.","severity":"medium","source":"Application","ip":"192.0.2.10"}]',
    ),
    [importError, setImportError] = useState(""),
    [importBusy, setImportBusy] = useState(false);
  async function importLogs() {
    setImportBusy(true);
    setImportError("");
    try {
      const parsed = JSON.parse(importText);
      const r = await api<{ imported: number }>("/events", {
        events: Array.isArray(parsed) ? parsed : parsed.events,
      });
      await refresh();
      setImportOpen(false);
      toast(`${r.imported} local log events imported`);
    } catch (e) {
      setImportError((e as Error).message);
    } finally {
      setImportBusy(false);
    }
  }
  const filtered = events.filter(
    (e) =>
      (severity === "all" || e.severity === severity) &&
      (source === "all" || e.source === source) &&
      JSON.stringify(e).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="operations-view">
      <div className="section-summary">
        <div>
          <Activity size={18} />
          <strong>{events.length}</strong> indexed events{" "}
          <span className="vertical-line" />{" "}
          {new Set(events.map((e) => e.source)).size} telemetry sources
        </div>
        <span className="demo-badge">
          <span className="status-dot" />
          {events.some((e) => e.demo === false)
            ? "Demo + imported logs"
            : "Sample event dataset"}
        </span>
      </div>
      <section className="panel">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={16} />
            <input
              aria-label="Search security events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event, address, asset, tactic…"
            />
          </div>
          <div className="filter-select">
            <Filter size={14} />
            <select
              aria-label="Filter event severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="all">All severities</option>
              {["critical", "high", "medium", "low", "info"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <select
            aria-label="Filter event source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="all">All sources</option>
            {Array.from(new Set(events.map((e) => e.source))).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="button secondary"
            onClick={() => {
              setImportOpen(true);
              setImportError("");
            }}
          >
            <ArrowDown size={14} />
            Import logs
          </button>
          <button
            className="button secondary"
            onClick={() => download("aegis-events.json", filtered)}
          >
            <Download size={14} />
            Export
          </button>
        </div>
        <div className="table-scroll">
          <table className="full-table">
            <thead>
              <tr>
                <th>SEVERITY</th>
                <th>EVENT / TACTIC</th>
                <th>SOURCE</th>
                <th>ADDRESS</th>
                <th>TIME</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className={selected?.id === e.id ? "row-selected" : ""}
                  onClick={() => setSelected(e)}
                  tabIndex={0}
                  onKeyDown={(k) => k.key === "Enter" && setSelected(e)}
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
                      {e.tactic} · {e.id}
                    </small>
                  </td>
                  <td>{e.source}</td>
                  <td>
                    <code>{e.ip}</code>
                  </td>
                  <td className="muted nowrap">{relativeTime(e.timestamp)}</td>
                  <td>
                    <ChevronRight size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty-state">
              <Search size={25} />
              <h3>No matching events</h3>
              <p>Try a different address, source, or severity.</p>
              <button
                className="button secondary"
                onClick={() => {
                  setSearch("");
                  setSeverity("all");
                  setSource("all");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
        <div className="table-footer">
          Showing {filtered.length} of {events.length} events
          <span>UTC timestamps · demo & local logs</span>
        </div>
      </section>
      {selected && (
        <section className="panel event-detail">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">EVENT INVESTIGATION</div>
              <h2>{selected.title}</h2>
            </div>
            <button
              className="icon-btn"
              aria-label="Close event details"
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="event-detail-grid">
            <div>
              <span className={`severity ${selected.severity}`}>
                <span />
                {selected.severity}
              </span>
              <p>{selected.message}</p>
              <dl className="detail-list">
                <dt>Actor</dt>
                <dd>{selected.actor}</dd>
                <dt>Asset</dt>
                <dd>{selected.assetId}</dd>
                <dt>Observed at</dt>
                <dd>{new Date(selected.timestamp).toISOString()}</dd>
                <dt>MITRE tactic</dt>
                <dd>{selected.tactic}</dd>
                <dt>Event type</dt>
                <dd>{selected.eventType}</dd>
              </dl>
            </div>
            <div>
              <div className="code-label">
                <Code2 size={14} />
                RAW EVENT
              </div>
              <pre className="json-block">
                {JSON.stringify(selected, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}
      {importOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !importBusy && setImportOpen(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Import local logs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>Import local logs</h2>
              <button
                className="icon-btn"
                disabled={importBusy}
                aria-label="Close log import"
                onClick={() => setImportOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="settings-content">
              <p>
                Import up to 100 JSON events. Each event needs a title. Message,
                severity, source, address, and timestamp are optional. Use
                sanitized logs without credentials or personal data.
              </p>
              <label className="file-upload">
                Choose a JSON file
                <input
                  type="file"
                  accept=".json,application/json"
                  aria-label="Upload JSON logs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 100000) {
                        setImportError("File exceeds 100 KB.");
                        return;
                      }
                      setImportText(await file.text());
                    }
                  }}
                />
              </label>
              <textarea
                className="log-import-text"
                aria-label="JSON log events"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                spellCheck={false}
              />
              {importError && (
                <p className="inline-error" role="alert">
                  {importError}
                </p>
              )}
              <div className="modal-actions">
                <button
                  className="button secondary"
                  disabled={importBusy}
                  onClick={() => setImportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  disabled={importBusy}
                  onClick={importLogs}
                >
                  {importBusy ? (
                    <LoaderCircle className="spin" size={14} />
                  ) : (
                    <ArrowDown size={14} />
                  )}
                  Import events
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export function Incidents({
  incidents,
  assets,
  refresh,
  toast,
}: {
  incidents: Incident[];
  assets: Asset[];
  refresh: () => Promise<void>;
  toast: (v: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(""),
    [pending, setPending] = useState(""),
    [tab, setTab] = useState("investigations"),
    [confirm, setConfirm] = useState<Asset | null>(null),
    [busy, setBusy] = useState(false);
  const incident = incidents.find((i) => i.id === selectedId) || incidents[0],
    asset = assets.find((a) => a.id === incident?.assetId);
  async function action(name: string) {
    if (!incident) return;
    setPending(name);
    try {
      await api(`/incidents/${incident.id}/actions`, { action: name });
      await refresh();
      toast(`Demo incident ${name} recorded`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setPending("");
    }
  }
  async function isolate() {
    if (!confirm) return;
    setBusy(true);
    try {
      await api(`/assets/${confirm.id}/isolate`, {
        reason: `Analyst containment action for ${incident?.id || "asset review"}`,
      });
      await refresh();
      toast(`Demo endpoint ${confirm.hostname} isolated`);
      setConfirm(null);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="operations-view">
      <div className="info-note compact">
        <Shield size={18} />
        <p>
          Response sandbox: containment changes the demo asset state and records
          an audit event. Real workstation isolation requires an EDR agent
          integration.
        </p>
      </div>
      <div className="view-tabs">
        {[
          ["investigations", "Investigations", incidents.length],
          ["assets", "Asset inventory", assets.length],
        ].map(([id, label, count]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id as string)}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>
      {tab === "assets" ? (
        <section className="panel table-scroll">
          <table className="full-table">
            <thead>
              <tr>
                <th>ASSET</th>
                <th>ADDRESS / OS</th>
                <th>RISK</th>
                <th>STATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>
                      <Monitor size={14} /> {a.hostname}
                    </strong>
                    <small>
                      {a.owner} · {a.criticality} criticality
                    </small>
                  </td>
                  <td>
                    <code>{a.ip}</code>
                    <small>{a.os}</small>
                  </td>
                  <td>
                    <div className="inline-risk">
                      <span
                        style={{
                          width: `${a.riskScore}%`,
                          background: a.riskScore > 70 ? "#ff8b79" : "#ccff6b",
                        }}
                      />
                    </div>
                    {a.riskScore}/100
                  </td>
                  <td>
                    <span
                      className={`status-pill ${a.status === "isolated" ? "orange" : ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button secondary"
                      disabled={a.status === "isolated"}
                      onClick={() => setConfirm(a)}
                    >
                      <LockKeyhole size={13} />
                      {a.status === "isolated" ? "Isolated" : "Isolate (demo)"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="incident-layout">
          <section className="panel incident-list">
            <div className="panel-heading">
              <h2>Investigation queue</h2>
              <span className="small-counter">{incidents.length}</span>
            </div>
            {incidents.map((i) => (
              <button
                key={i.id}
                className={`incident-item ${incident?.id === i.id ? "selected" : ""}`}
                onClick={() => setSelectedId(i.id)}
              >
                <div>
                  <span className={`severity ${i.severity}`}>
                    <span />
                    {i.severity}
                  </span>
                  <span>{i.id}</span>
                </div>
                <h3>{i.title}</h3>
                <p>
                  {i.status.replaceAll("_", " ")}
                  <span> · </span>
                  {relativeTime(i.createdAt)}
                </p>
                <div className="incident-owner">
                  <div className="avatar tiny">
                    {i.assignedTo
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  {i.assignedTo}
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </section>
          <section className="panel incident-workspace">
            {incident ? (
              <>
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">INVESTIGATION / {incident.id}</div>
                    <h2>{incident.title}</h2>
                  </div>
                  <span
                    className={`status-pill ${incident.status === "resolved" ? "" : "orange"}`}
                  >
                    {incident.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="incident-description">{incident.description}</p>
                <div className="incident-meta">
                  <div>
                    <small>AFFECTED ASSET</small>
                    <strong>
                      <Monitor size={15} />
                      {asset?.hostname || incident.assetId}
                    </strong>
                  </div>
                  <div>
                    <small>ANALYST</small>
                    <strong>{incident.assignedTo}</strong>
                  </div>
                  <div>
                    <small>RESPONSE PLAN</small>
                    <strong>
                      NIST response · {incident.playbook.length} steps
                    </strong>
                  </div>
                </div>
                <div className="incident-actions">
                  <button
                    className="button primary"
                    onClick={() => action("investigate")}
                    disabled={!!pending || incident.status === "resolved"}
                  >
                    {pending === "investigate" ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : (
                      <FileSearch size={15} />
                    )}
                    Begin investigation
                  </button>
                  <button
                    className="button danger"
                    onClick={() => asset && setConfirm(asset)}
                    disabled={!asset || asset.status === "isolated"}
                  >
                    <LockKeyhole size={14} />
                    {asset?.status === "isolated"
                      ? "Endpoint isolated"
                      : "Isolate endpoint (demo)"}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => action("resolve")}
                    disabled={!!pending || incident.status === "resolved"}
                  >
                    <Check size={15} />
                    Mark resolved
                  </button>
                </div>
                <div className="investigation-two-col">
                  <div>
                    <h3>
                      <Clock3 size={16} />
                      Attack timeline
                    </h3>
                    <div className="timeline">
                      {incident.timeline.map((item, index) => (
                        <div className="timeline-item" key={index}>
                          <span className="timeline-node" />
                          <small>
                            {item.timestamp
                              ? new Date(item.timestamp)
                                  .toISOString()
                                  .slice(11, 19)
                              : item.time || `Step ${index + 1}`}{" "}
                            UTC
                          </small>
                          <strong>
                            {item.title ||
                              item.event ||
                              item.action ||
                              "Observed event"}
                          </strong>
                          <p>
                            {item.description ||
                              item.detail ||
                              item.message ||
                              ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3>
                      <ShieldCheck size={16} />
                      Mitigation & hardening
                    </h3>
                    <div className="mitigation-list">
                      {[
                        "Preserve evidence before making changes. Collect endpoint and identity logs.",
                        "Contain the affected endpoint; rotate exposed credentials and revoke active sessions.",
                        "Identify initial access. Patch the root cause and remove persistence.",
                        "Recover from a known-good state. Validate controls and monitor for recurrence.",
                      ].map((s, i) => (
                        <div key={s}>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          <p>{s}</p>
                        </div>
                      ))}
                    </div>
                    <div className="tactic-chips">
                      {incident.tactics.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                    <div className="small-note">
                      <Info size={13} />
                      Recommendations need validation against evidence and
                      business impact.
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">Loading investigations…</div>
            )}
          </section>
        </div>
      )}
      {confirm && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setConfirm(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm demo isolation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>Isolate {confirm.hostname}?</h2>
              <button
                className="icon-btn"
                disabled={busy}
                aria-label="Close isolation dialog"
                onClick={() => setConfirm(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="settings-content">
              <div className="info-note">
                <ShieldAlert size={25} />
                <p>
                  This is a demo containment action. It updates the simulated
                  workstation state and adds an audit record. It does not
                  disconnect a real device.
                </p>
              </div>
              <p>
                In production, preserve evidence, verify host identity, and
                confirm the business impact before isolating an endpoint through
                your EDR platform.
              </p>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="button danger"
                  disabled={busy}
                  onClick={isolate}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={15} />
                  ) : (
                    <LockKeyhole size={15} />
                  )}
                  Isolate demo endpoint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export function Assessments({ toast }: { toast: (v: string) => void }) {
  const [target, setTarget] = useState("http://127.0.0.1:4318"),
    [profile, setProfile] = useState("baseline"),
    [busy, setBusy] = useState(false),
    [assessment, setAssessment] = useState<Assessment | null>(null),
    [history, setHistory] = useState<Assessment[]>([]),
    [error, setError] = useState(""),
    [expanded, setExpanded] = useState(""),
    [consent, setConsent] = useState(false);
  useEffect(() => {
    api<{ assessments: Assessment[] }>("/assessments")
      .then((r) => setHistory(r.assessments))
      .catch(() => {});
  }, []);
  async function run() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ assessment: Assessment }>("/assessments", {
        target,
        profile,
      });
      setAssessment(r.assessment);
      setHistory((h) => [r.assessment, ...h]);
      toast("Assessment complete. Review evidence and remediation.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="operations-view">
      <section className="assessment-hero panel">
        <div className="assessment-icon">
          <Crosshair size={32} />
        </div>
        <div>
          <div className="eyebrow">
            VULNERABILITY ASSESSMENT / AUTHORIZED SCOPE
          </div>
          <h2>Make exposure visible.</h2>
          <p>
            Run evidence-based HTTP and TCP checks against the local lab or an
            explicitly authorized target.
          </p>
        </div>
        <span className="outline-tag">
          <ShieldCheck size={13} /> Scope enforced
        </span>
      </section>
      <div className="assessment-layout">
        <section className="panel scan-config">
          <div className="panel-heading">
            <h2>New assessment</h2>
            <span className="small-counter">01</span>
          </div>
          <div className="scan-config-body">
            <label htmlFor="target">Target URL or IP address</label>
            <div className="search-box">
              <Globe2 size={16} />
              <input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="http://127.0.0.1:4318"
              />
            </div>
            <p className="field-hint">
              The deliberately imperfect local lab is ready on port 4318.
            </p>
            <label htmlFor="scan-profile">Assessment profile</label>
            <select
              id="scan-profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            >
              <option value="baseline">
                Web baseline · headers & exposure
              </option>
            </select>
            <div className="profile-checks">
              {[
                "Target scope & DNS validation",
                "HTTP security headers",
                "Transport and server-banner observations",
                "TCP reachability & service evidence",
              ].map((s) => (
                <span key={s}>
                  <Check size={13} />
                  {s}
                </span>
              ))}
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>I own this target or have authorization to assess it.</span>
            </label>
            <button
              className="button primary full-width"
              onClick={run}
              disabled={busy || !consent || !target}
            >
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Play size={16} />
              )}{" "}
              {busy ? "Assessing target…" : "Run assessment"}
              <ArrowRight size={15} />
            </button>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <div className="small-note">
              <Info size={13} />
              No exploitation. Checks cover a limited baseline and can’t
              establish that a site is secure.
            </div>
          </div>
        </section>
        <section className="panel assessment-results">
          <div className="panel-heading">
            <div>
              <h2>Assessment results</h2>
              <p>
                {assessment
                  ? `${assessment.target} · ${new Date(assessment.completedAt).toLocaleTimeString()}`
                  : "Your next insight starts with a scan."}
              </p>
            </div>
            {assessment && (
              <button
                className="button secondary"
                onClick={() => download(`${assessment.id}.json`, assessment)}
              >
                <Download size={14} />
                Export
              </button>
            )}
          </div>
          {busy ? (
            <div className="scan-animation">
              <div className="scan-radar">
                <Crosshair size={42} />
              </div>
              <h3>Inspecting your authorized target</h3>
              <p>Gathering observable evidence. No exploit payloads.</p>
              <div className="loading-bar" />
            </div>
          ) : assessment ? (
            <>
              <div className="assessment-stats">
                <div>
                  <small>FINDINGS</small>
                  <strong>{assessment.findings.length}</strong>
                </div>
                <div>
                  <small>HIGH / CRITICAL</small>
                  <strong className="orange-text">
                    {
                      assessment.findings.filter((f) =>
                        ["high", "critical"].includes(f.severity),
                      ).length
                    }
                  </strong>
                </div>
                <div>
                  <small>CHECKS EXECUTED</small>
                  <strong>{assessment.checks.length}</strong>
                </div>
                <div>
                  <small>STATUS</small>
                  <span className="status-pill">{assessment.status}</span>
                </div>
              </div>
              <div className="finding-list">
                {assessment.findings.map((f) => (
                  <div
                    className={`finding ${expanded === f.id ? "expanded" : ""}`}
                    key={f.id}
                  >
                    <button
                      className="finding-heading"
                      onClick={() => setExpanded(expanded === f.id ? "" : f.id)}
                    >
                      <span className={`severity ${f.severity}`}>
                        <span />
                        {f.severity}
                      </span>
                      <strong>{f.title}</strong>
                      <ChevronRight size={16} />
                    </button>
                    {expanded === f.id && (
                      <div className="finding-body">
                        <p>{f.description}</p>
                        <div className="code-label">OBSERVED EVIDENCE</div>
                        <pre className="json-block">
                          {typeof f.evidence === "string"
                            ? f.evidence
                            : JSON.stringify(f.evidence, null, 2)}
                        </pre>
                        <div className="remediation">
                          <ShieldCheck size={15} />
                          <div>
                            <strong>Remediation</strong>
                            <p>{f.remediation}</p>
                            {f.cwe && (
                              <span className="subtle-tag">{f.cwe}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!assessment.findings.length && (
                <div className="empty-state">
                  <ShieldCheck size={30} />
                  <h3>No findings in these checks</h3>
                  <p>This limited assessment does not guarantee security.</p>
                </div>
              )}
              <details className="assessment-raw">
                <summary>Inspect executed checks & ports</summary>
                <pre className="json-block">
                  {JSON.stringify(
                    { checks: assessment.checks, ports: assessment.ports },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </>
          ) : (
            <div className="empty-state assessment-empty">
              <div className="empty-orbit">
                <Shield size={35} />
              </div>
              <h3>A clearer view of your attack surface</h3>
              <p>
                Choose a target and run an assessment.
                <br />
                Review each finding’s evidence and remediation.
              </p>
              <span className="outline-tag">Real checks · Local lab ready</span>
            </div>
          )}
        </section>
      </div>
      {history.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <h2>Assessment history</h2>
            <span className="subtle-tag">{history.length} RUNS</span>
          </div>
          <div className="table-scroll">
            <table className="full-table">
              <thead>
                <tr>
                  <th>TARGET</th>
                  <th>PROFILE</th>
                  <th>FINDINGS</th>
                  <th>COMPLETED</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.map((a, i) => (
                  <tr
                    key={a.id + i}
                    onClick={() => setAssessment(a)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setAssessment(a)}
                  >
                    <td>
                      <strong>{a.target}</strong>
                      <small>{a.id}</small>
                    </td>
                    <td>{a.profile}</td>
                    <td>{a.findings.length}</td>
                    <td>{new Date(a.completedAt).toLocaleString()}</td>
                    <td>
                      <ArrowUpRight size={15} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
type TerminalEntry = {
  id: number;
  command: string;
  output: string;
  kind: string;
  exitCode: number;
};
export function Terminal() {
  const [command, setCommand] = useState(""),
    [busy, setBusy] = useState(false),
    [entries, setEntries] = useState<TerminalEntry[]>([]),
    [commandHistory, setCommandHistory] = useState<string[]>([]),
    [historyIndex, setHistoryIndex] = useState(-1),
    [tools, setTools] = useState<Record<string, boolean>>({}),
    [error, setError] = useState(""),
    [session, setSession] = useState(0),
    [copied, setCopied] = useState(false);
  const scroll = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api<any>("/health")
      .then((h) =>
        setTools(
          Object.fromEntries(
            Object.entries(h.tools || {}).map(([k, v]) => [
              k,
              (v as { installed: boolean }).installed,
            ]),
          ),
        ),
      )
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries, busy]);
  async function execute(value = command) {
    if (!value.trim() || busy) return;
    setCommand("");
    setHistoryIndex(-1);
    if (value.trim() === "clear") {
      setEntries([]);
      return;
    }
    setBusy(true);
    setCommandHistory((h) => [value, ...h]);
    try {
      const r = await api<{ output: string; kind: string; exitCode: number }>(
        "/terminal",
        { command: value },
      );
      setEntries((e) => [...e, { id: Date.now(), command: value, ...r }]);
    } catch (e) {
      setEntries((h) => [
        ...h,
        {
          id: Date.now(),
          command: value,
          output: (e as Error).message,
          kind: "error",
          exitCode: 1,
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => input.current?.focus(), 20);
    }
  }
  async function copy() {
    await navigator.clipboard?.writeText(
      entries.map((e) => `$ ${e.command}\n${e.output}`).join("\n\n"),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="terminal-view">
      <div className="terminal-top-note">
        <span>
          <LockKeyhole size={14} />
          Scoped command runner
        </span>
        <span>Real local checks · no unrestricted shell</span>
      </div>
      <section className="terminal-window">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <i />
            <i />
            <i />
          </div>
          <span>
            <img src="/parrot-mark.svg" alt="" /> parrot@aegis — security-lab
          </span>
          <div>
            <button
              className="icon-btn"
              aria-label="Export terminal session"
              onClick={() => download("aegis-terminal.json", entries)}
            >
              <Download size={15} />
            </button>
            <button
              className="icon-btn"
              aria-label="Clear terminal"
              onClick={() => {
                setEntries([]);
                setSession((s) => s + 1);
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div
          className="terminal-body"
          ref={scroll}
          onClick={() => input.current?.focus()}
        >
          <div className="terminal-welcome" key={session}>
            <img
              src="/parrot-mark.svg"
              alt="Original geometric parrot emblem"
            />
            <div>
              <h2>
                PARROT<span> / AEGIS</span>
              </h2>
              <p>Sharper tools. Smaller attack surface.</p>
              <div className="terminal-version">
                SECURITY LAB v1.0 <span>·</span> AUTHORIZED SCOPE ONLY
              </div>
            </div>
          </div>
          <div className="terminal-banner">
            Welcome, analyst. Your local security lab is ready.
            <br />
            Type <b>help</b> for commands, <b>scope</b> for authorized targets.
            <br />
            Try <b>scan http://127.0.0.1:4318</b> to run a real baseline
            assessment.
            <br />
            <span className="terminal-dim">
              External tools run only when installed; unavailable tools are
              reported explicitly.
            </span>
          </div>
          {error && <div className="terminal-error">{error}</div>}
          {entries.map((e) => (
            <div className="terminal-entry" key={e.id}>
              <div className="terminal-prompt">
                <span>┌─[parrot@aegis]</span>
                <span className="terminal-dim">─[~/security-lab]</span>
                <br />
                <span>└─$ </span>
                <span className="terminal-command">{e.command}</span>
              </div>
              <pre className={e.exitCode ? "terminal-error" : ""}>
                {e.output}
              </pre>
              <span className="terminal-result">
                {e.kind} · exit {e.exitCode}
              </span>
            </div>
          ))}
          {busy && (
            <div className="terminal-running">
              <LoaderCircle size={13} className="spin" />
              Executing scoped command…
            </div>
          )}
          <form
            className="terminal-input-line"
            onSubmit={(e) => {
              e.preventDefault();
              execute();
            }}
          >
            <label htmlFor="terminal-command">└─$</label>
            <input
              id="terminal-command"
              ref={input}
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal command"
              value={command}
              disabled={busy}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const i = Math.min(
                    historyIndex + 1,
                    commandHistory.length - 1,
                  );
                  if (i >= 0) {
                    setHistoryIndex(i);
                    setCommand(commandHistory[i]);
                  }
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const i = Math.max(-1, historyIndex - 1);
                  setHistoryIndex(i);
                  setCommand(i === -1 ? "" : commandHistory[i]);
                }
              }}
            />
          </form>
        </div>
        <div className="terminal-statusbar">
          <span>
            <span className="status-dot" />
            LOCAL LAB SESSION
          </span>
          <span>
            UTF-8 <span className="vertical-line" />
            PORT 4318 <span className="vertical-line" />
            NO ROOT PRIVILEGES
          </span>
        </div>
      </section>
      <div className="terminal-bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Quick commands</h2>
            <TerminalSquare size={16} />
          </div>
          <div className="quick-commands">
            {[
              { cmd: "help", desc: "Discover supported commands" },
              { cmd: "scope", desc: "Inspect your authorized targets" },
              {
                cmd: "scan http://127.0.0.1:4318",
                desc: "Run a real web security baseline",
              },
              {
                cmd: "tcp 127.0.0.1:4318",
                desc: "Observe a local TCP connection",
              },
              {
                cmd: "nmap -sT -sV -p 4318 127.0.0.1",
                desc: "Service discovery · requires nmap",
              },
            ].map(({ cmd, desc }) => (
              <button key={cmd} disabled={busy} onClick={() => execute(cmd)}>
                <div>
                  <code>{cmd}</code>
                  <small>{desc}</small>
                </div>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel toolchain-panel">
          <div className="panel-heading">
            <h2>Your toolchain</h2>
            <span className="subtle-tag">OPTIONAL INTEGRATIONS</span>
          </div>
          {["nmap", "nuclei", "gobuster", "msfconsole"].map((t) => (
            <div className="toolchain-row" key={t}>
              <span>
                <TerminalSquare size={15} />
                {t === "msfconsole" ? "Metasploit" : t}
              </span>
              <span
                className={`tool-availability ${tools[t] ? "available" : ""}`}
              >
                <span />
                {tools[t] ? "Installed" : "Not installed"}
              </span>
            </div>
          ))}
          <p>
            Built-in scan and TCP commands work now. Configure optional tools on
            the server to enable their scoped commands. Metasploit is limited to
            version and help.
          </p>
          <button
            className="button secondary"
            disabled={!entries.length}
            onClick={copy}
          >
            {copied ? <Check size={14} /> : <Code2 size={14} />}{" "}
            {copied ? "Session copied" : "Copy session"}
          </button>
        </section>
      </div>
    </div>
  );
}
