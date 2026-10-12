import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Download,
  Fingerprint,
  Globe,
  MapPin,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";
import "./intel.css";

type SignIn = {
  id: string;
  user: string;
  email: string;
  location: string;
  country: string;
  time: string;
  ip: string;
  device: string;
  session: string;
  outcome: "Success" | "Step-up MFA" | "Blocked";
  flag: string;
};
const signIns: SignIn[] = [
  {
    id: "vpn-01",
    user: "Alex Morgan",
    email: "alex.morgan@example.com",
    location: "Zurich",
    country: "Switzerland",
    time: "11:44:19",
    ip: "198.51.100.42",
    device: "WS-FIN-042",
    session: "SES-9A21",
    outcome: "Step-up MFA",
    flag: "Geo shift",
  },
  {
    id: "vpn-02",
    user: "Alex Morgan",
    email: "alex.morgan@example.com",
    location: "Chicago",
    country: "United States",
    time: "11:42:10",
    ip: "198.51.100.42",
    device: "WS-FIN-042",
    session: "SES-9A21",
    outcome: "Success",
    flag: "Baseline",
  },
  {
    id: "vpn-03",
    user: "Priya Shah",
    email: "priya.shah@example.com",
    location: "London",
    country: "United Kingdom",
    time: "11:38:52",
    ip: "203.0.113.18",
    device: "WS-ENG-019",
    session: "SES-B730",
    outcome: "Success",
    flag: "Known device",
  },
  {
    id: "vpn-04",
    user: "Sam Chen",
    email: "sam.chen@example.com",
    location: "Singapore",
    country: "Singapore",
    time: "11:35:04",
    ip: "192.0.2.74",
    device: "WS-OPS-008",
    session: "SES-C184",
    outcome: "Success",
    flag: "Known device",
  },
  {
    id: "vpn-05",
    user: "Jamie Rivera",
    email: "jamie.rivera@example.com",
    location: "Frankfurt",
    country: "Germany",
    time: "11:29:41",
    ip: "203.0.113.92",
    device: "Unknown device",
    session: "SES-D612",
    outcome: "Blocked",
    flag: "MFA failed",
  },
];

function readRevoked(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("aegis-vpn-revoked") || "[]",
    );
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function RouteMap() {
  return (
    <svg
      className="vpn-world-map"
      viewBox="0 0 900 300"
      role="img"
      aria-label="Simulated VPN geolocation route from Chicago, United States to Zurich, Switzerland"
    >
      <defs>
        <linearGradient id="vpn-route-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ccff6b" />
          <stop offset="1" stopColor="#ff896b" />
        </linearGradient>
        <radialGradient id="vpn-world-glow">
          <stop offset="0" stopColor="#98b5fa" stopOpacity=".09" />
          <stop offset="1" stopColor="#98b5fa" stopOpacity="0" />
        </radialGradient>
        <filter id="vpn-dot-glow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <pattern
          id="vpn-map-grid"
          width="35"
          height="35"
          patternUnits="userSpaceOnUse"
        >
          <path d="M35 0H0V35" fill="none" stroke="#223047" strokeWidth=".55" />
        </pattern>
      </defs>
      <rect width="900" height="300" fill="url(#vpn-world-glow)" />
      <rect width="900" height="300" fill="url(#vpn-map-grid)" opacity=".55" />
      <g fill="#203044" stroke="#33445b" strokeWidth="1" strokeLinejoin="round">
        <path d="M108 55l34-9 18 10 20-8 18 8 25-3 20 16 36-5 27 11 6 16-25 7-11 14-19 7-12 20-9 7-4 22-18 13-7 15-16 7-17-12-5-22-16-8-15-29-20-11-17-31-16-14-4-18-19-6Z" />
        <path d="m116 47-31 8-23 18 25 3 20-11 13 4 11-15Z" />
        <path d="m262 20 36-12 27 12-5 28-20 29-16-3-6-28Z" />
        <path d="m232 194 23 3 21 18 23 7 12 23-10 15-5 28-15 10-9-17-12-16-10-26-11-16-9-8Z" />
        <path d="m420 78 13-7 5 12-7 11-11-1Z" />
        <path d="m460 80 13-24 14-8 13-1 2 23-18 16 1 16-17 1-12-12Z" />
        <path d="m464 110 19-11 17 3 13-9 23 7 7 17-21 10-10-3-9 10-27-4-5-11-14 4Z" />
        <path d="m467 140 23-8 23 4 11 13 25 4 6 19-13 24-18 16-7 27-20 5-14-24-6-25-15-16-8-22Z" />
        <path d="m526 95 21-25 25-3 23-13 32 5 23-9 38 12 37-6 23 17 21-1 22 20 32 3 14 23-17 8-29-8-10 14-25-3-8 18-21-4-10 14-23 2-15 21-14-9-3-27-22-3-15-21-20-2-14-17-14-5-23 5-15-11Z" />
        <path d="m579 139 24 5 16 17-2 23-13-3-9-21-20-5Z" />
        <path d="m672 158 19 10 7 22 23 15-3 11-16-6-12-13-12-7-12-15Z" />
        <path d="m736 137 12-5 2 18-11 16-8-4Z" />
        <path d="m724 229 26-13 32 4 17 15 14 8-7 20-30 6-20-10-22 4-16-14Z" />
        <path d="m833 253 10 3-8 18-10 9-4-7Z" />
        <path d="m552 235 7-9 7 4-5 21-8 2Z" />
      </g>
      <g fill="#7890ab" opacity=".75">
        <circle cx="476" cy="125" r="2.8" />
        <circle cx="640" cy="209" r="2.8" />
        <circle cx="721" cy="244" r="2.8" />
        <circle cx="294" cy="226" r="2.8" />
        <circle cx="510" cy="128" r="2.8" />
      </g>
      <path
        d="M239 120Q365 6 490 120"
        stroke="url(#vpn-route-gradient)"
        strokeWidth="2"
        strokeDasharray="6 5"
        fill="none"
      />
      <path
        d="m480 109 11 12-16-2"
        stroke="#ff896b"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="239" cy="120" r="17" fill="#ccff6b" opacity=".08" />
      <circle
        cx="239"
        cy="120"
        r="10"
        fill="none"
        stroke="#ccff6b"
        opacity=".35"
      />
      <circle cx="239" cy="120" r="4" fill="#ccff6b" />
      <circle cx="490" cy="120" r="23" fill="#ff896b" opacity=".07" />
      <circle
        cx="490"
        cy="120"
        r="13"
        fill="none"
        stroke="#ff896b"
        opacity=".3"
      />
      <circle cx="490" cy="120" r="4" fill="#ff896b" />
      <g fontFamily="Inter, sans-serif">
        <rect
          x="181"
          y="144"
          width="114"
          height="44"
          rx="7"
          fill="#0c1522"
          stroke="#304438"
        />
        <text x="196" y="163" fill="#eef2fa" fontSize="12" fontWeight="600">
          Chicago, US
        </text>
        <text x="196" y="178" fill="#8491a8" fontSize="10">
          11:42:10 UTC
        </text>
        <rect
          x="456"
          y="145"
          width="126"
          height="44"
          rx="7"
          fill="#0c1522"
          stroke="#4d3432"
        />
        <text x="470" y="164" fill="#eef2fa" fontSize="12" fontWeight="600">
          Zurich, CH
        </text>
        <text x="470" y="179" fill="#8491a8" fontSize="10">
          11:44:19 UTC
        </text>
        <rect
          x="314"
          y="55"
          width="108"
          height="23"
          rx="11.5"
          fill="#251b20"
          stroke="#6b403d"
        />
        <text x="368" y="71" fill="#ffad94" fontSize="10" textAnchor="middle">
          GEOLOCATION SHIFT
        </text>
      </g>
    </svg>
  );
}

export default function VPNTracker() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All outcomes");
  const [distance, setDistance] = useState("7110");
  const [minutes, setMinutes] = useState("2.15");
  const [threshold, setThreshold] = useState("900");
  const [selected, setSelected] = useState(signIns[0]);
  const [investigating, setInvestigating] = useState(false);
  const [revoked, setRevoked] = useState<string[]>(readRevoked);
  const [notice, setNotice] = useState("");
  const modalRef = useRef<HTMLElement>(null);
  const validInput =
    distance.trim() !== "" &&
    minutes.trim() !== "" &&
    threshold.trim() !== "" &&
    Number.isFinite(Number(distance)) &&
    Number(distance) >= 0 &&
    Number.isFinite(Number(minutes)) &&
    Number(minutes) > 0 &&
    Number.isFinite(Number(threshold)) &&
    Number(threshold) > 0;
  const speed = validInput ? Number(distance) / (Number(minutes) / 60) : 0;
  const flagged = validInput && speed > Number(threshold);
  const visible = useMemo(
    () =>
      signIns.filter(
        (item) =>
          `${item.user} ${item.email} ${item.ip} ${item.location} ${item.device}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === "All outcomes" ||
            (filter === "Revoked (demo)"
              ? revoked.includes(item.session)
              : item.outcome === filter)),
      ),
    [query, filter, revoked],
  );

  useEffect(() => {
    if (!investigating) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setInvestigating(false);
      if (event.key !== "Tab") return;
      const controls = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, select, a[href], [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [investigating]);

  function revokeSession() {
    const next = [...new Set([...revoked, selected.session])];
    setRevoked(next);
    try {
      localStorage.setItem("aegis-vpn-revoked", JSON.stringify(next));
      setNotice(
        `${selected.session} marked revoked in this demo. No VPN or identity provider was contacted.`,
      );
    } catch {
      setNotice(
        `${selected.session} marked revoked for this page session. Browser storage is unavailable.`,
      );
    }
  }

  function generateNote() {
    const note = {
      type: "Demo investigation note",
      createdAt: new Date().toISOString(),
      selectedSignIn: selected,
      sessionMarkedRevoked: revoked.includes(selected.session),
      travelAnalysis: {
        distanceKm: Number(distance),
        elapsedMinutes: Number(minutes),
        thresholdKmh: Number(threshold),
        requiredSpeedKmh: validInput ? Math.round(speed) : null,
      },
      observations:
        selected.session === "SES-9A21"
          ? [
              "IP address remains identical across both sign-ins.",
              "Device and session identifiers match.",
              "Geolocation changed from Chicago to Zurich in 129 seconds.",
              "This is an enrichment discrepancy until independent evidence supports account compromise.",
            ]
          : [
              "Review authentication outcome, device identity, and MFA evidence.",
              "IP geolocation alone does not establish the physical location of a user.",
            ],
      recommendedActions: [
        "Correlate identity provider and VPN concentrator logs.",
        "Confirm device identity and user activity through an established channel.",
        "Preserve logs; require fresh MFA if risk remains.",
      ],
      externalActionTaken: false,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(note, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `aegis-vpn-investigation-${selected.session}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Investigation note exported. This is a local demo artifact.");
  }

  return (
    <div className="vpn-page">
      <div className="vpn-status-strip">
        <span>
          <span className="vpn-status-dot" /> Identity & remote access telemetry
        </span>
        <span>
          <Clock size={13} /> Synthetic case · 11:44 UTC
        </span>
        <b>DEMO ENVIRONMENT</b>
      </div>
      <div className="vpn-top-grid">
        <section className="intel-panel vpn-route-panel">
          <div className="intel-panel-heading">
            <div>
              <span className="intel-eyebrow">CASE STUDY / VPN-2026-014</span>
              <h3>One identity. Two continents.</h3>
            </div>
            <span className="vpn-alert-label">
              <AlertTriangle size={14} /> Review required
            </span>
          </div>
          <RouteMap />
          <div className="vpn-route-summary">
            <div>
              <MapPin size={15} />
              <span>
                Chicago <ArrowRight size={12} /> Zurich
              </span>
            </div>
            <span>
              <strong>7,110</strong> km apart
            </span>
            <span>
              <strong>02:09</strong> between sign-ins
            </span>
            <span className="vpn-same-ip">Same IP · 198.51.100.42</span>
          </div>
        </section>
        <section className="intel-panel vpn-calculator">
          <span className="intel-eyebrow">
            <Activity size={14} /> TRAVEL ANOMALY ENGINE
          </span>
          <h3>Test the travel hypothesis</h3>
          <p>Compare required travel speed with your policy threshold.</p>
          <div className="vpn-input-grid">
            <label>
              Distance <span>km</span>
              <input
                type="number"
                min="0"
                step="10"
                value={distance}
                onChange={(event) => setDistance(event.target.value)}
                aria-label="Travel distance in kilometers"
              />
            </label>
            <label>
              Time between sign-ins <span>min</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                aria-label="Minutes between sign-ins"
              />
            </label>
          </div>
          <label className="vpn-threshold-input">
            Speed threshold <span>km/h</span>
            <input
              type="number"
              min="1"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              aria-label="Travel speed threshold in kilometers per hour"
            />
          </label>
          <div className={`vpn-speed-result ${flagged ? "flagged" : ""}`}>
            <span>
              {validInput ? "REQUIRED TRAVEL SPEED" : "CHECK YOUR INPUTS"}
            </span>
            <strong>
              {validInput ? Math.round(speed).toLocaleString() : "—"}{" "}
              <small>km/h</small>
            </strong>
            <p>
              {validInput
                ? flagged
                  ? "Exceeds policy threshold · investigate context"
                  : "Within threshold · review other risk signals"
                : "Use a non-negative distance and positive time and threshold."}
            </p>
          </div>
          <div className="vpn-calc-footnote">
            <ShieldCheck size={14} />
            <span>
              A speed anomaly is a detection signal, not a compromise verdict.
            </span>
          </div>
        </section>
      </div>

      <section className="vpn-analysis">
        <div className="vpn-analysis-icon">
          <Fingerprint size={24} />
        </div>
        <div>
          <span className="intel-eyebrow">
            THE DETAIL THAT CHANGES THE INVESTIGATION
          </span>
          <h3>The IP stayed the same. Did the location really change?</h3>
          <p>
            Both events share <code>198.51.100.42</code>, device{" "}
            <code>WS-FIN-042</code>, and session <code>SES-9A21</code>. A
            geolocation database discrepancy, VPN/proxy routing, or shared
            egress can produce this pattern. Validate device identity, MFA, VPN
            concentrator logs, and enrichment source before claiming account
            takeover.
          </p>
        </div>
        <span className="vpn-analysis-tag">EVIDENCE FIRST</span>
      </section>

      <section className="intel-panel vpn-signins">
        <div className="intel-panel-heading">
          <div>
            <h3>Remote access activity</h3>
            <p>Representative authentication events · timestamps in UTC</p>
          </div>
          <div className="vpn-event-count">
            <span /> {signIns.length} scenario events
          </div>
        </div>
        <div className="intel-toolbar">
          <label className="intel-search">
            <Search size={16} />
            <input
              aria-label="Search VPN sign-ins"
              placeholder="Search user, IP, location, or device…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter VPN sign-ins by outcome"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All outcomes</option>
            <option>Success</option>
            <option>Step-up MFA</option>
            <option>Blocked</option>
            <option>Revoked (demo)</option>
          </select>
        </div>
        <div className="intel-table-scroll">
          <table className="intel-table vpn-table">
            <thead>
              <tr>
                <th>IDENTITY</th>
                <th>LOCATION / IP ADDRESS</th>
                <th>DEVICE</th>
                <th>TIME UTC</th>
                <th>OUTCOME</th>
                <th />
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
                    <div className="vpn-user">
                      <span>
                        {item.user
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{item.user}</strong>
                        <small>{item.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="vpn-table-location">
                      <strong>
                        <MapPin size={12} />
                        {item.location},{" "}
                        {item.country === "United States"
                          ? "US"
                          : item.country === "Switzerland"
                            ? "CH"
                            : item.country === "United Kingdom"
                              ? "UK"
                              : item.country === "Singapore"
                                ? "SG"
                                : "DE"}
                      </strong>
                      <small>{item.ip}</small>
                    </div>
                  </td>
                  <td>
                    <span className="vpn-device">{item.device}</span>
                  </td>
                  <td className="intel-muted-cell">{item.time}</td>
                  <td>
                    <span
                      className={`vpn-outcome ${revoked.includes(item.session) ? "revoked" : item.outcome === "Success" ? "success" : item.outcome === "Blocked" ? "blocked" : "step-up"}`}
                    >
                      {revoked.includes(item.session)
                        ? "Revoked (demo)"
                        : item.outcome}
                    </span>
                  </td>
                  <td>
                    <button
                      className="intel-icon-button"
                      title={`Investigate ${item.user}'s session`}
                      aria-label={`Investigate ${item.user}'s ${item.location} session`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(item);
                        setInvestigating(true);
                      }}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="intel-empty">
              <Search size={24} />
              <strong>No matching sign-ins</strong>
              <p>Adjust the search or outcome filter.</p>
            </div>
          )}
        </div>
        <div className="vpn-selection-bar">
          <div>
            <span className="vpn-selection-icon">
              <UserRound size={16} />
            </span>
            <span>
              Selected: <strong>{selected.user}</strong>{" "}
              <span className="vpn-selection-location">
                · {selected.location} · {selected.session}
              </span>
            </span>
          </div>
          <button
            className="vpn-primary-button"
            onClick={() => setInvestigating(true)}
          >
            Investigate session <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <div className="vpn-bottom-grid">
        <div className="intel-panel vpn-principle">
          <span>01</span>
          <div>
            <h4>Correlate before containment</h4>
            <p>
              Check identity, endpoint, VPN, and MFA evidence together. Shared
              IPs can represent many users.
            </p>
          </div>
        </div>
        <div className="intel-panel vpn-principle">
          <span>02</span>
          <div>
            <h4>Preserve the investigation trail</h4>
            <p>
              Record the original events and enrichment source. Capture
              timestamps, session IDs, and device evidence.
            </p>
          </div>
        </div>
        <div className="intel-panel vpn-principle">
          <span>03</span>
          <div>
            <h4>Respond proportionately</h4>
            <p>
              Reauthenticate or revoke a session when evidence supports it.
              Verify recovery and monitor recurrence.
            </p>
          </div>
        </div>
      </div>
      <div className="intel-footnote">
        <Globe size={14} />
        <span>
          All identities, IPs, and events are synthetic. The route shows
          reported geolocation; it does not track a person's physical movement.
        </span>
      </div>

      {investigating && (
        <div
          className="vpn-modal-backdrop"
          onClick={() => setInvestigating(false)}
        >
          <section
            ref={modalRef}
            className="vpn-investigation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vpn-investigation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="vpn-modal-heading">
              <span className="intel-eyebrow">
                SESSION INVESTIGATION / DEMO
              </span>
              <button
                className="intel-icon-button"
                aria-label="Close investigation"
                onClick={() => setInvestigating(false)}
              >
                <X size={19} />
              </button>
            </div>
            <h2 id="vpn-investigation-title">
              {selected.user}'s remote session
            </h2>
            <p className="vpn-modal-subtitle">
              {selected.session} <span>·</span> {selected.location},{" "}
              {selected.country}
            </p>
            <div className="vpn-evidence-grid">
              <div>
                <span>Source IP</span>
                <strong>{selected.ip}</strong>
              </div>
              <div>
                <span>Device identity</span>
                <strong>{selected.device}</strong>
              </div>
              <div>
                <span>Authentication</span>
                <strong>{selected.outcome}</strong>
              </div>
              <div>
                <span>Local session state</span>
                <strong>
                  {revoked.includes(selected.session)
                    ? "Revoked (demo)"
                    : "Observed (demo)"}
                </strong>
              </div>
            </div>
            <h4>Evidence & observations</h4>
            {selected.session === "SES-9A21" ? (
              <ul className="vpn-evidence-list">
                <li>
                  <Check size={15} />
                  The Chicago and Zurich events share an IP, session ID, and
                  device ID.
                </li>
                <li>
                  <AlertTriangle size={15} />
                  7,110 km in 129 seconds triggers the travel heuristic.
                </li>
                <li>
                  <ShieldCheck size={15} />
                  Same-IP geolocation drift can reflect enrichment or shared
                  egress. This pattern does not establish a stolen session.
                </li>
              </ul>
            ) : (
              <ul className="vpn-evidence-list">
                <li>
                  <Activity size={15} />
                  This event reports {selected.outcome.toLowerCase()} from{" "}
                  {selected.location}.
                </li>
                <li>
                  <Fingerprint size={15} />
                  {selected.device === "Unknown device"
                    ? "Device identity is unresolved. Correlate managed-device and MFA evidence."
                    : `Device ${selected.device} should be verified against endpoint and identity-provider records.`}
                </li>
                <li>
                  <ShieldCheck size={15} />
                  No physical-location conclusion can be drawn from this IP
                  label alone.
                </li>
              </ul>
            )}
            <div className="vpn-investigation-next">
              <span className="intel-small-label">
                NIST CSF 2.0 · DETECT → RESPOND → RECOVER
              </span>
              <p>
                Preserve authentication and VPN logs, verify the user through an
                established channel, compare MFA and device evidence, and
                require reauthentication if risk remains. Use session revocation
                only when supported by evidence and your response policy.
              </p>
            </div>
            <div className="vpn-modal-actions">
              <button className="vpn-secondary-button" onClick={generateNote}>
                <Download size={15} /> Export investigation note
              </button>
              <button
                className="vpn-revoke-button"
                disabled={revoked.includes(selected.session)}
                onClick={revokeSession}
              >
                {revoked.includes(selected.session) ? (
                  <Check size={15} />
                ) : (
                  <ShieldOff size={15} />
                )}
                {revoked.includes(selected.session)
                  ? "Session marked revoked (demo)"
                  : "Revoke session (demo)"}
              </button>
            </div>
            <p className="vpn-modal-disclaimer">
              Demo revocation changes local browser state only. It does not
              disconnect a VPN or contact an identity provider.
            </p>
          </section>
        </div>
      )}
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
