import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  Fingerprint,
  Globe,
  Layers3,
  LockKeyhole,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import "./learning.css";

type Lab =
  | "TCP handshake"
  | "OSI explorer"
  | "Attack chain"
  | "CIA triad"
  | "Firewall policy";
const labs: { name: Lab; icon: typeof Network; caption: string }[] = [
  { name: "TCP handshake", icon: Network, caption: "Connection anatomy" },
  { name: "OSI explorer", icon: Layers3, caption: "Follow the packet" },
  { name: "Attack chain", icon: Target, caption: "Interrupt the adversary" },
  { name: "CIA triad", icon: ShieldCheck, caption: "Balance your controls" },
  {
    name: "Firewall policy",
    icon: ShieldOff,
    caption: "Test a packet decision",
  },
];

const handshake = [
  {
    label: "Ready to connect",
    flag: "IDLE",
    text: "A client opens a connection to the lab web server on TCP port 443. Play the exchange to follow its state transitions.",
    evidence: "Client CLOSED → SYN-SENT",
    note: "The connection uses documentation-only addresses; all packets are simulated.",
  },
  {
    label: "Synchronize",
    flag: "SYN",
    text: "The client sends its initial sequence number, 1000, and asks the server to establish a connection.",
    evidence: "192.0.2.24:51432 → 198.51.100.8:443  [SYN] seq=1000",
    note: "A SYN consumes one sequence number. Repeated SYNs with no final ACK may indicate scanning or a SYN flood.",
  },
  {
    label: "Synchronize + acknowledge",
    flag: "SYN, ACK",
    text: "The server acknowledges the client’s SYN with ack=1001 and offers its own initial sequence number, 7000.",
    evidence:
      "198.51.100.8:443 → 192.0.2.24:51432  [SYN, ACK] seq=7000 ack=1001",
    note: "The server is now SYN-RECEIVED. A stateful firewall can track this response as part of the same flow.",
  },
  {
    label: "Connection established",
    flag: "ACK",
    text: "The client acknowledges the server’s SYN with ack=7001. Both sides can now exchange application data.",
    evidence: "192.0.2.24:51432 → 198.51.100.8:443  [ACK] seq=1001 ack=7001",
    note: "TCP provides ordered, reliable transport. Encryption begins separately with the TLS handshake on this HTTPS connection.",
  },
];

function TCPHandshake() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setStep((old) => {
          if (old >= 3) {
            setPlaying(false);
            return 3;
          }
          return old + 1;
        }),
      1550,
    );
    return () => window.clearInterval(timer);
  }, [playing]);
  const play = () => {
    if (step === 3) setStep(0);
    setPlaying((value) => !value);
  };
  return (
    <div className="learn-lab-grid">
      <section className="learn-surface learn-flow">
        <div className="learn-panel-top">
          <span className="learn-kicker">PACKET VISUALIZER</span>
          <span className="learn-live">
            <i />
            {step === 3
              ? "ESTABLISHED"
              : playing
                ? "TRANSMITTING"
                : "LAB READY"}
          </span>
        </div>
        <div className="learn-endpoints">
          <div>
            <div className="learn-device">
              <Globe size={24} />
            </div>
            <strong>Client workstation</strong>
            <code>192.0.2.24 · :51432</code>
            <span>
              {step === 0 ? "CLOSED" : step < 3 ? "SYN-SENT" : "ESTABLISHED"}
            </span>
          </div>
          <div className="learn-flow-middle">
            <span>TCP / HTTPS</span>
            <span className="learn-flow-dots">························</span>
          </div>
          <div>
            <div className="learn-device learn-server">
              <Database size={24} />
            </div>
            <strong>Web server</strong>
            <code>198.51.100.8 · :443</code>
            <span>
              {step < 2
                ? "LISTEN"
                : step === 2
                  ? "SYN-RECEIVED"
                  : "ESTABLISHED"}
            </span>
          </div>
        </div>
        <div className="learn-packet-track">
          <div className="learn-timeline-rail left" />
          <div className="learn-timeline-rail right" />
          {[
            { flag: "SYN", data: "seq = 1000", reverse: false },
            {
              flag: "SYN + ACK",
              data: "seq = 7000 · ack = 1001",
              reverse: true,
            },
            { flag: "ACK", data: "seq = 1001 · ack = 7001", reverse: false },
          ].map((packet, i) => (
            <button
              key={packet.flag}
              className={`learn-packet-row ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""} ${packet.reverse ? "reverse" : ""}`}
              onClick={() => {
                setPlaying(false);
                setStep(i + 1);
              }}
              aria-label={`Inspect ${packet.flag} packet`}
            >
              <span className="learn-packet-number">0{i + 1}</span>
              <div className="learn-packet-wire">
                <span className="learn-packet-label">
                  <b>{packet.flag}</b>
                  <small>{packet.data}</small>
                </span>
                <ArrowRight size={17} />
                <i className={playing && step === i + 1 ? "travel" : ""} />
              </div>
            </button>
          ))}
        </div>
        <div className="learn-transport-status">
          <span>
            <i className={step === 3 ? "complete" : ""} />
            {step === 3
              ? "Reliable transport established"
              : "Awaiting connection exchange"}
          </span>
          <span>{step}/3 packets</span>
        </div>
        <div className="learn-controls">
          <button className="learn-primary" onClick={play}>
            {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
            {playing
              ? "Pause exchange"
              : step === 3
                ? "Replay handshake"
                : "Play handshake"}
          </button>
          <button
            className="learn-icon-button"
            aria-label="Reset handshake"
            onClick={() => {
              setStep(0);
              setPlaying(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="learn-text-button"
            disabled={step === 3}
            onClick={() => {
              setPlaying(false);
              setStep((value) => Math.min(3, value + 1));
            }}
          >
            Next packet
            <ChevronRight size={15} />
          </button>
        </div>
      </section>
      <aside className="learn-surface learn-inspector">
        <span className="learn-kicker">INSPECT THE EXCHANGE</span>
        <div className="learn-step-badge">{handshake[step].flag}</div>
        <h3>{handshake[step].label}</h3>
        <p>{handshake[step].text}</p>
        <div className="learn-code-block">
          <span>PACKET EVIDENCE</span>
          <code>{handshake[step].evidence}</code>
        </div>
        <div className="learn-callout">
          <ShieldCheck size={19} />
          <div>
            <strong>Security perspective</strong>
            <p>{handshake[step].note}</p>
          </div>
        </div>
        <div className="learn-mini-metrics">
          <div>
            <span>Protocol</span>
            <b>TCP</b>
          </div>
          <div>
            <span>Destination</span>
            <b>443</b>
          </div>
          <div>
            <span>Transport</span>
            <b>Layer 4</b>
          </div>
        </div>
      </aside>
    </div>
  );
}

const osiLayers = [
  {
    n: 7,
    name: "Application",
    protocol: "HTTP / DNS / SMTP",
    unit: "Data",
    color: "#ccff6b",
    description:
      "The browser prepares an HTTP request for the application. HTTPS couples HTTP with TLS to protect traffic in transit.",
    example: "GET /account HTTP/1.1\nHost: portal.lab.example",
    control:
      "Validate input, apply authentication, and inspect application requests with a WAF.",
    threat: "Injection, broken access control, phishing",
  },
  {
    n: 6,
    name: "Presentation",
    protocol: "Encoding / serialization",
    unit: "Data",
    color: "#a8ec84",
    description:
      "Data is represented in a format both endpoints understand. The OSI model is conceptual: real TLS spans presentation and session concerns rather than fitting neatly into one layer.",
    example:
      "UTF-8 / JSON representation\nTLS record: encrypted application data",
    control:
      "Enforce modern TLS, validate certificates, and safely decode or deserialize content.",
    threat: "Weak encryption, unsafe deserialization",
  },
  {
    n: 5,
    name: "Session",
    protocol: "Session coordination",
    unit: "Data",
    color: "#77d5af",
    description:
      "Sessions coordinate conversations between systems. An application login session is separate from the TCP transport connection.",
    example: "Session established\nApplication session: authenticated user",
    control:
      "Rotate session tokens, expire idle sessions, and invalidate tokens on logout.",
    threat: "Session hijacking, token replay",
  },
  {
    n: 4,
    name: "Transport",
    protocol: "TCP / UDP",
    unit: "Segment",
    color: "#69c5e0",
    description:
      "TCP adds source and destination ports plus sequence and acknowledgment numbers to deliver an ordered byte stream.",
    example: "TCP 51432 → 443\nseq=1001 ack=7001 [PSH, ACK]",
    control:
      "Track connection state, restrict exposed ports, and limit connection exhaustion.",
    threat: "SYN floods, exposed services",
  },
  {
    n: 3,
    name: "Network",
    protocol: "IPv4 / IPv6 / ICMP",
    unit: "Packet",
    color: "#76abf6",
    description:
      "IP adds logical source and destination addresses. Routers choose a route to the destination network.",
    example: "IPv4 192.0.2.24 → 198.51.100.8\nTTL=64 · protocol=TCP",
    control:
      "Segment networks, apply routing ACLs, and detect unusual destination traffic.",
    threat: "IP spoofing, route manipulation",
  },
  {
    n: 2,
    name: "Data link",
    protocol: "Ethernet / Wi-Fi / ARP",
    unit: "Frame",
    color: "#a799f5",
    description:
      "An Ethernet frame delivers the IP packet to the next hop on the local network. MAC addresses change between routed links.",
    example: "Ethernet: client MAC → gateway MAC\nEtherType=IPv4 · FCS checked",
    control:
      "Use network access control, DHCP snooping, and dynamic ARP inspection.",
    threat: "ARP poisoning, rogue access points",
  },
  {
    n: 1,
    name: "Physical",
    protocol: "Copper / fiber / radio",
    unit: "Bits",
    color: "#c898dd",
    description:
      "The network interface sends the frame as electrical, optical, or radio signals. The receiving stack decapsulates the layers in reverse.",
    example:
      "01001000 01010100 01010100 01010000\nSignals traverse the local link",
    control:
      "Protect network equipment, control physical access, and monitor link availability.",
    threat: "Cable tampering, RF interference",
  },
];

function OSIExplorer() {
  const [selected, setSelected] = useState(4);
  const [journey, setJourney] = useState(-1);
  const layer = osiLayers.find((item) => item.n === selected)!;
  useEffect(() => {
    if (journey < 0) return;
    const timer = window.setTimeout(() => {
      if (journey < 6) {
        setJourney(journey + 1);
        setSelected(6 - journey);
      } else setJourney(-1);
    }, 950);
    return () => window.clearTimeout(timer);
  }, [journey]);
  return (
    <div className="learn-lab-grid learn-osi-grid">
      <section className="learn-surface learn-osi-stack">
        <div className="learn-panel-top">
          <span className="learn-kicker">ENCAPSULATION JOURNEY</span>
          <span className="learn-live">
            <i />
            {journey < 0 ? "INTERACTIVE MODEL" : "SENDING PACKET"}
          </span>
        </div>
        <div className="learn-osi-direction">
          <span>Application data</span>
          <ArrowDown size={14} />
          <span>Network signals</span>
        </div>
        <div className="learn-osi-layers">
          {osiLayers.map((item) => (
            <button
              key={item.n}
              style={{ "--layer-color": item.color } as React.CSSProperties}
              className={`learn-osi-layer ${selected === item.n ? "selected" : ""} ${journey >= 0 && selected === item.n ? "transmitting" : ""}`}
              onClick={() => {
                setSelected(item.n);
                setJourney(-1);
              }}
            >
              <span className="learn-layer-number">L{item.n}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.protocol}</small>
              </div>
              <code>{item.unit}</code>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
        <div className="learn-controls">
          <button
            className="learn-primary"
            disabled={journey >= 0}
            onClick={() => {
              setJourney(0);
              setSelected(7);
            }}
          >
            <Play size={15} />
            {journey < 0 ? "Send a packet" : "Packet in transit"}
          </button>
          <span className="learn-control-note">
            Select a layer to investigate
          </span>
        </div>
      </section>
      <aside className="learn-surface learn-inspector">
        <span className="learn-kicker">LAYER {layer.n} / PACKET INSPECTOR</span>
        <div className="learn-layer-emblem" style={{ color: layer.color }}>
          <Layers3 size={34} />
          <span>{layer.n}</span>
        </div>
        <h3>{layer.name}</h3>
        <p>{layer.description}</p>
        <div className="learn-code-block">
          <span>{layer.unit.toUpperCase()} CONTENT</span>
          <code>{layer.example}</code>
        </div>
        <div className="learn-callout">
          <ShieldCheck size={19} />
          <div>
            <strong>Practical defensive control</strong>
            <p>{layer.control}</p>
          </div>
        </div>
        <div className="learn-risk-line">
          <Zap size={15} />
          <span>{layer.threat}</span>
        </div>
        <div className="learn-osi-legend">
          <span>Sender: encapsulates ↓</span>
          <span>Receiver: decapsulates ↑</span>
        </div>
      </aside>
    </div>
  );
}

const chain = [
  {
    name: "Reconnaissance",
    icon: Eye,
    action:
      "The adversary researches public systems, employees, and exposed services.",
    evidence:
      "Repeated requests to public hostnames and external scanning patterns.",
    defense: "Reduce public exposure and monitor unusual discovery activity.",
    control: "Attack surface review",
    outcome: "Document internet-facing assets and remove unnecessary exposure.",
  },
  {
    name: "Weaponization",
    icon: Target,
    action:
      "A malicious payload is prepared around a vulnerability or convincing lure.",
    evidence:
      "The payload is prepared outside your environment; internal visibility is usually limited.",
    defense:
      "Threat intelligence, hardening, and tested security baselines reduce viable attack paths.",
    control: "Hardened baseline",
    outcome:
      "Patch and harden the target so the prepared exploit is less likely to work.",
  },
  {
    name: "Delivery",
    icon: Globe,
    action:
      "The attacker delivers the payload through an email link, attachment, or exposed application.",
    evidence:
      "Email gateway flags a suspicious attachment sent to a finance workstation.",
    defense:
      "Inspect messages and block malicious attachments or destinations.",
    control: "Email inspection",
    outcome: "Quarantine the attachment before a user can open it.",
  },
  {
    name: "Exploitation",
    icon: Zap,
    action:
      "A user action or software weakness triggers execution on the target.",
    evidence:
      "A document process starts an unexpected child process on a workstation.",
    defense:
      "Keep software patched and prevent risky script or process behavior.",
    control: "Exploit prevention",
    outcome:
      "Block the suspicious child process and preserve endpoint evidence.",
  },
  {
    name: "Installation",
    icon: Database,
    action:
      "The attacker creates persistence to survive reboots and maintain access.",
    evidence:
      "A new startup entry and unsigned binary appear in the user profile.",
    defense: "Detect persistence changes and limit administrative privileges.",
    control: "Persistence monitoring",
    outcome:
      "Alert on the new autorun entry and remove persistence after investigation.",
  },
  {
    name: "Command & control",
    icon: Radio,
    action:
      "The compromised host reaches an external server for attacker instructions.",
    evidence:
      "Regular outbound connections to an unfamiliar destination every 60 seconds.",
    defense:
      "Inspect egress traffic and isolate confirmed compromised endpoints.",
    control: "Egress restrictions",
    outcome:
      "Block the beacon destination and isolate the endpoint through an approved response workflow.",
  },
  {
    name: "Actions on objectives",
    icon: Fingerprint,
    action:
      "The attacker attempts data theft, encryption, or disruption of business services.",
    evidence:
      "A sudden burst of sensitive file reads and unusual outbound data transfer.",
    defense:
      "Protect data, detect bulk access, and use tested offline or immutable backups.",
    control: "Data protection",
    outcome:
      "Restrict sensitive access, stop unauthorized transfer, and recover from verified backups.",
  },
];

function AttackChain() {
  const [selected, setSelected] = useState(2);
  const [controls, setControls] = useState<number[]>([2, 5]);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState("");
  const stage = chain[selected];
  useEffect(() => {
    if (!simulating) return;
    const timer = window.setTimeout(() => {
      if (controls.includes(selected)) {
        setResult(
          `Exercise intercepted at ${chain[selected].name}. ${chain[selected].outcome}`,
        );
        setSimulating(false);
      } else if (selected === 6) {
        setResult(
          "Exercise reached its objective. Enable a defensive control and replay to see where the chain can be interrupted.",
        );
        setSimulating(false);
      } else setSelected(selected + 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [selected, simulating, controls]);
  return (
    <div className="learn-chain-layout">
      <div className="learn-surface learn-chain-overview">
        <div className="learn-panel-top">
          <span className="learn-kicker">
            LOCKHEED MARTIN CYBER KILL CHAIN®
          </span>
          <span className="learn-live">
            <i />
            {controls.length} DEFENSIVE CONTROLS
          </span>
        </div>
        <div className="learn-chain-stage-list">
          {chain.map((item, i) => (
            <button
              key={item.name}
              className={`learn-chain-stage ${selected === i ? "selected" : ""} ${controls.includes(i) ? "protected" : ""}`}
              onClick={() => {
                setSelected(i);
                setSimulating(false);
              }}
            >
              <span className="learn-chain-stage-icon">
                <item.icon size={21} />
              </span>
              <span className="learn-chain-stage-number">0{i + 1}</span>
              <strong>{item.name}</strong>
              <span className="learn-chain-indicator">
                {controls.includes(i) ? <ShieldCheck size={14} /> : <span />}
              </span>
            </button>
          ))}
        </div>
        <div className="learn-chain-footer">
          <span>
            This conceptual model follows an intrusion sequence. Real attacks
            may skip or repeat stages.
          </span>
          <button
            className="learn-primary"
            disabled={simulating}
            onClick={() => {
              setSelected(0);
              setResult("");
              setSimulating(true);
            }}
          >
            <Play size={15} />
            {simulating ? "Running exercise" : "Simulate attack path"}
          </button>
        </div>
        {result && (
          <div
            className={`learn-chain-result ${controls.includes(selected) ? "blocked" : ""}`}
            role="status"
          >
            <ShieldCheck size={18} />
            <span>{result}</span>
          </div>
        )}
      </div>
      <div className="learn-lab-grid">
        <section className="learn-surface learn-stage-detail">
          <div className="learn-panel-top">
            <span className="learn-kicker">STAGE 0{selected + 1} / 07</span>
            <span className="learn-tag">SIMULATED INTRUSION</span>
          </div>
          <h3>{stage.name}</h3>
          <p>{stage.action}</p>
          <div className="learn-code-block">
            <span>WHAT THE ANALYST SEES</span>
            <code>{stage.evidence}</code>
          </div>
          <div className="learn-callout">
            <ShieldCheck size={19} />
            <div>
              <strong>Break the chain here</strong>
              <p>{stage.defense}</p>
            </div>
          </div>
        </section>
        <section className="learn-surface learn-defense-detail">
          <span className="learn-kicker">DEFENSE LAB</span>
          <div
            className={`learn-defense-emblem ${controls.includes(selected) ? "enabled" : ""}`}
          >
            {controls.includes(selected) ? (
              <ShieldCheck size={38} />
            ) : (
              <ShieldOff size={38} />
            )}
          </div>
          <h3>{stage.control}</h3>
          <p>
            Enable this illustrative control, then run the attack path to see
            where the intrusion is interrupted.
          </p>
          <button
            className={`learn-toggle-row ${controls.includes(selected) ? "on" : ""}`}
            disabled={simulating}
            onClick={() =>
              setControls((old) =>
                old.includes(selected)
                  ? old.filter((n) => n !== selected)
                  : [...old, selected],
              )
            }
          >
            <span>
              {controls.includes(selected)
                ? "Control enabled"
                : "Control disabled"}
            </span>
            <span className="learn-switch">
              <i />
            </span>
          </button>
          <small>
            Exercise interception assumes a correctly configured, effective
            control. Actual effectiveness requires validation.
          </small>
        </section>
      </div>
    </div>
  );
}

const ciaControls = [
  {
    id: "mfa",
    name: "Multifactor authentication",
    detail: "Verify identity before sensitive access",
    pillar: "C",
    icon: Fingerprint,
  },
  {
    id: "encryption",
    name: "Encryption at rest",
    detail: "Protect readable data if storage is exposed",
    pillar: "C",
    icon: LockKeyhole,
  },
  {
    id: "hash",
    name: "Signed releases & file integrity",
    detail: "Detect unauthorized software changes",
    pillar: "I",
    icon: CheckCircle2,
  },
  {
    id: "audit",
    name: "Tamper-resistant audit logs",
    detail: "Preserve evidence of who changed what",
    pillar: "I",
    icon: Database,
  },
  {
    id: "backups",
    name: "Tested immutable backups",
    detail: "Restore clean data after disruption",
    pillar: "A",
    icon: RotateCcw,
  },
  {
    id: "redundancy",
    name: "Redundant services",
    detail: "Keep services operating during failures",
    pillar: "A",
    icon: Activity,
  },
];
const scenarios = [
  {
    id: "breach",
    name: "Stolen credentials",
    text: "An attacker uses a stolen password to access the customer database.",
    important: ["mfa", "encryption"],
    action:
      "MFA limits password-only access. Encryption protects storage copies, but an authenticated application may still decrypt data; least privilege and monitoring remain essential.",
  },
  {
    id: "tamper",
    name: "Software tampering",
    text: "An unauthorized update attempts to alter a production application.",
    important: ["hash", "audit"],
    action:
      "Signed releases and integrity monitoring detect changes. Protected audit logs support attribution and investigation.",
  },
  {
    id: "outage",
    name: "Ransomware disruption",
    text: "A compromised workstation encrypts files and disrupts a critical service.",
    important: ["backups", "redundancy"],
    action:
      "Tested immutable backups support recovery. Independent redundant services improve continuity; isolate the compromise before restoring.",
  },
];

function CIATriad() {
  const [enabled, setEnabled] = useState<string[]>(["mfa", "hash", "backups"]);
  const [scenario, setScenario] = useState("breach");
  const current = scenarios.find((item) => item.id === scenario)!;
  const score =
    current.important.filter((id) => enabled.includes(id)).length * 50;
  const pillars = useMemo(
    () =>
      ["C", "I", "A"].map(
        (pillar) =>
          ciaControls.filter(
            (c) => c.pillar === pillar && enabled.includes(c.id),
          ).length * 50,
      ),
    [enabled],
  );
  return (
    <div className="learn-lab-grid learn-cia-grid">
      <section className="learn-surface learn-cia-main">
        <div className="learn-panel-top">
          <span className="learn-kicker">SECURITY CONTROL BALANCE</span>
          <span className="learn-live">
            <i />
            {enabled.length}/6 CONTROLS ENABLED
          </span>
        </div>
        <div className="learn-triad-visual">
          <svg
            viewBox="0 0 380 255"
            role="img"
            aria-label="Confidentiality, integrity, and availability security triad"
          >
            <defs>
              <linearGradient
                id="learn-triad-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop stopColor="#ccff6b" stopOpacity=".22" />
                <stop offset="1" stopColor="#699eff" stopOpacity=".08" />
              </linearGradient>
            </defs>
            <path
              d="M190 33 L315 220 L65 220 Z"
              fill="url(#learn-triad-gradient)"
              stroke="#4e6856"
              strokeWidth="1"
            />
            <path
              d="M190 33 L190 155 L65 220 M190 155 L315 220"
              stroke="#3a4f55"
              strokeDasharray="4 5"
              fill="none"
            />
            <circle cx="190" cy="155" r="37" fill="#111d29" stroke="#3b535a" />
            <path
              d="M190 134 l15 6 v15 c0 12-15 20-15 20 s-15-8-15-20 v-15z"
              fill="none"
              stroke="#ccff6b"
              strokeWidth="2"
            />
            <path
              d="M183 154 l5 5 10-11"
              fill="none"
              stroke="#ccff6b"
              strokeWidth="2"
            />
            {[
              { x: 190, y: 33, label: "C" },
              { x: 65, y: 220, label: "I" },
              { x: 315, y: 220, label: "A" },
            ].map((node, i) => (
              <g key={node.label}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="24"
                  fill="#101925"
                  stroke={pillars[i] ? "#ccff6b" : "#46536b"}
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y + 6}
                  textAnchor="middle"
                  fill={pillars[i] ? "#ccff6b" : "#8491a8"}
                  fontFamily="monospace"
                  fontSize="18"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
          <div className="learn-triad-metrics">
            {["Confidentiality", "Integrity", "Availability"].map(
              (label, i) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>
                    {pillars[i]}
                    <small>%</small>
                  </strong>
                  <div>
                    <i style={{ width: `${pillars[i]}%` }} />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="learn-cia-controls">
          {ciaControls.map((control) => (
            <button
              className={`learn-cia-control ${enabled.includes(control.id) ? "on" : ""}`}
              key={control.id}
              onClick={() =>
                setEnabled((old) =>
                  old.includes(control.id)
                    ? old.filter((id) => id !== control.id)
                    : [...old, control.id],
                )
              }
              aria-pressed={enabled.includes(control.id)}
            >
              <control.icon size={19} />
              <div>
                <strong>{control.name}</strong>
                <small>{control.detail}</small>
              </div>
              <span className="learn-control-pillar">{control.pillar}</span>
              <span className="learn-checkbox">
                {enabled.includes(control.id) && <Check size={12} />}
              </span>
            </button>
          ))}
        </div>
      </section>
      <aside className="learn-surface learn-inspector">
        <span className="learn-kicker">PRACTICAL SCENARIO</span>
        <h3>Put your defenses to work.</h3>
        <p>
          Choose an incident, then enable controls to explore their contribution
          to the CIA triad.
        </p>
        <div className="learn-scenario-buttons">
          {scenarios.map((item) => (
            <button
              key={item.id}
              className={scenario === item.id ? "active" : ""}
              onClick={() => setScenario(item.id)}
            >
              {item.name}
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
        <div className="learn-scenario-evidence">
          <span className="learn-tag">{current.name.toUpperCase()}</span>
          <p>{current.text}</p>
        </div>
        <div className="learn-score">
          <span>Exercise control coverage</span>
          <strong>
            {score}
            <small>%</small>
          </strong>
          <div>
            <i style={{ width: `${score}%` }} />
          </div>
          <small>
            {score === 100
              ? "Both scenario controls enabled"
              : score === 50
                ? "One scenario control enabled"
                : "No scenario controls enabled"}
          </small>
        </div>
        <div className="learn-callout">
          <ShieldCheck size={19} />
          <div>
            <strong>How the controls help</strong>
            <p>{current.action}</p>
          </div>
        </div>
        <p className="learn-score-footnote">
          Coverage is an educational score, not a risk rating or assurance of
          security.
        </p>
      </aside>
    </div>
  );
}

type FirewallRule = {
  id: string;
  name: string;
  protocol: "TCP" | "UDP" | "ANY";
  port: number | null;
  state: "ANY" | "ESTABLISHED";
  destination: string;
  action: "ALLOW" | "DENY";
};
const initialRules: FirewallRule[] = [
  {
    id: "tracked",
    name: "Tracked TCP connections",
    protocol: "TCP",
    port: null,
    state: "ESTABLISHED",
    destination: "ANY",
    action: "ALLOW",
  },
  {
    id: "https",
    name: "HTTPS to lab web",
    protocol: "TCP",
    port: 443,
    state: "ANY",
    destination: "198.51.100.8",
    action: "ALLOW",
  },
  {
    id: "ssh",
    name: "Block remote administration",
    protocol: "ANY",
    port: 22,
    state: "ANY",
    destination: "ANY",
    action: "DENY",
  },
];
function FirewallPolicy() {
  const [rules, setRules] = useState<FirewallRule[]>(initialRules);
  const [protocol, setProtocol] = useState<"TCP" | "UDP">("TCP");
  const [port, setPort] = useState("443");
  const [source, setSource] = useState("192.0.2.24");
  const [destination, setDestination] = useState("198.51.100.8");
  const [state, setState] = useState<"NEW" | "ESTABLISHED">("NEW");
  const [ruleProtocol, setRuleProtocol] = useState<"TCP" | "UDP" | "ANY">(
    "TCP",
  );
  const [rulePort, setRulePort] = useState("22");
  const [ruleAction, setRuleAction] = useState<"ALLOW" | "DENY">("ALLOW");
  const [result, setResult] = useState<{
    action: string;
    rule: string;
    detail: string;
  } | null>(null);
  const [error, setError] = useState("");
  const validPort = (value: string) =>
    /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 65535;
  const validIP = (value: string) =>
    value.split(".").length === 4 &&
    value
      .split(".")
      .every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255);
  function testPacket() {
    if (!validIP(source) || !validIP(destination) || !validPort(port)) {
      setError(
        "Use IPv4 addresses and a destination port between 1 and 65535.",
      );
      setResult(null);
      return;
    }
    setError("");
    const match = rules.find(
      (rule) =>
        (rule.protocol === "ANY" || rule.protocol === protocol) &&
        (rule.port === null || rule.port === Number(port)) &&
        (rule.destination === "ANY" || rule.destination === destination) &&
        (rule.state === "ANY" || state === "ESTABLISHED"),
    );
    setResult({
      action: match?.action || "DENY",
      rule: match
        ? `Rule ${rules.indexOf(match) + 1}: ${match.name}`
        : "Default policy: deny",
      detail: `${protocol} ${source} → ${destination}:${port} · ${state === "ESTABLISHED" ? "Existing tracked TCP connection" : "New connection"} · first matching rule wins`,
    });
  }
  function move(index: number, direction: number) {
    setRules((old) => {
      const next = [...old];
      [next[index], next[index + direction]] = [
        next[index + direction],
        next[index],
      ];
      return next;
    });
    setResult(null);
  }
  function addRule() {
    if (!validPort(rulePort)) {
      setError("Choose a rule port between 1 and 65535.");
      return;
    }
    setRules((old) => [
      ...old,
      {
        id: `custom-${Date.now()}`,
        name: `Custom ${ruleAction.toLowerCase()} on ${rulePort}`,
        protocol: ruleProtocol,
        port: Number(rulePort),
        state: "ANY",
        destination: "ANY",
        action: ruleAction,
      },
    ]);
    setError("");
    setResult(null);
  }
  return (
    <div className="learn-lab-grid learn-firewall-grid">
      <section className="learn-surface learn-firewall-main">
        <div className="learn-panel-top">
          <span className="learn-kicker">ORDERED FIREWALL POLICY</span>
          <span className="learn-live">
            <i />
            LOCAL SIMULATION
          </span>
        </div>
        <div className="learn-firewall-description">
          <h3>Decide what gets through.</h3>
          <p>
            Rules are evaluated from top to bottom. The first match decides the
            packet’s outcome; unmatched traffic is denied.
          </p>
        </div>
        <div className="learn-firewall-table">
          <div className="learn-firewall-table-head">
            <span>ORDER / RULE</span>
            <span>PROTOCOL · PORT</span>
            <span>ACTION</span>
            <span />
          </div>
          {rules.map((rule, index) => (
            <div className="learn-firewall-rule" key={rule.id}>
              <div>
                <span className="learn-firewall-order">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{rule.name}</strong>
                  <small>
                    {rule.state === "ESTABLISHED"
                      ? "Connection table match"
                      : `Destination: ${rule.destination === "ANY" ? "any address" : rule.destination}`}
                  </small>
                </div>
              </div>
              <code>
                {rule.protocol}
                <small>
                  {rule.port === null ? "ANY PORT" : `:${rule.port}`}
                </small>
              </code>
              <span
                className={`learn-firewall-action ${rule.action.toLowerCase()}`}
              >
                {rule.action}
              </span>
              <div className="learn-firewall-order-controls">
                <button
                  aria-label={`Move ${rule.name} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  aria-label={`Move ${rule.name} down`}
                  disabled={index === rules.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={12} />
                </button>
                {rule.id.startsWith("custom-") && (
                  <button
                    aria-label={`Remove ${rule.name}`}
                    onClick={() => {
                      setRules((old) =>
                        old.filter((item) => item.id !== rule.id),
                      );
                      setResult(null);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="learn-firewall-default">
          <ShieldOff size={13} />
          <span>DEFAULT POLICY</span>
          <strong>DENY ALL UNMATCHED TRAFFIC</strong>
        </div>
        <div className="learn-firewall-rule-editor">
          <span className="learn-kicker">ADD A SIMULATED RULE</span>
          <div>
            <label>
              Protocol
              <select
                aria-label="New rule protocol"
                value={ruleProtocol}
                onChange={(event) =>
                  setRuleProtocol(event.target.value as typeof ruleProtocol)
                }
              >
                <option>TCP</option>
                <option>UDP</option>
                <option>ANY</option>
              </select>
            </label>
            <label>
              Destination port
              <input
                aria-label="New rule destination port"
                inputMode="numeric"
                value={rulePort}
                onChange={(event) => setRulePort(event.target.value)}
              />
            </label>
            <label>
              Action
              <select
                aria-label="New rule action"
                value={ruleAction}
                onChange={(event) =>
                  setRuleAction(event.target.value as typeof ruleAction)
                }
              >
                <option>ALLOW</option>
                <option>DENY</option>
              </select>
            </label>
            <button className="learn-primary" onClick={addRule}>
              Add rule
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
        <div className="learn-callout">
          <Network size={18} />
          <div>
            <strong>Try the rule-order challenge</strong>
            <p>
              Add an ALLOW rule for port 22. It still matches the earlier block.
              Move your rule above the block and test again to see the policy
              change.
            </p>
          </div>
        </div>
      </section>
      <aside className="learn-surface learn-inspector">
        <span className="learn-kicker">PACKET DECISION LAB</span>
        <div className="learn-step-badge">VIRTUAL FIREWALL</div>
        <h3>Test the policy.</h3>
        <p>
          Build a packet and evaluate it locally. No packets are sent and no
          system firewall rules are changed.
        </p>
        <div className="learn-firewall-packet-fields">
          <label>
            Source IPv4
            <input
              aria-label="Packet source IPv4"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setResult(null);
              }}
            />
          </label>
          <label>
            Destination IPv4
            <input
              aria-label="Packet destination IPv4"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setResult(null);
              }}
            />
          </label>
          <div>
            <label>
              Protocol
              <select
                aria-label="Packet protocol"
                value={protocol}
                onChange={(event) => {
                  setProtocol(event.target.value as typeof protocol);
                  setState("NEW");
                  setResult(null);
                }}
              >
                <option>TCP</option>
                <option>UDP</option>
              </select>
            </label>
            <label>
              Destination port
              <input
                aria-label="Packet destination port"
                inputMode="numeric"
                value={port}
                onChange={(event) => {
                  setPort(event.target.value);
                  setResult(null);
                }}
              />
            </label>
          </div>
          <label>
            Connection state
            <select
              aria-label="Packet connection state"
              value={state}
              disabled={protocol === "UDP"}
              onChange={(event) => {
                setState(event.target.value as typeof state);
                setResult(null);
              }}
            >
              <option value="NEW">New connection</option>
              <option value="ESTABLISHED">
                Existing tracked TCP connection
              </option>
            </select>
          </label>
        </div>
        <button
          className="learn-primary learn-firewall-test"
          onClick={testPacket}
        >
          <Play size={14} />
          Test packet
        </button>
        {error && (
          <p className="learn-firewall-error" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div
            className={`learn-firewall-result ${result.action.toLowerCase()}`}
            role="status"
          >
            <div>
              {result.action === "ALLOW" ? (
                <ShieldCheck size={21} />
              ) : (
                <ShieldOff size={21} />
              )}
              <strong>
                {result.action === "ALLOW" ? "Packet allowed" : "Packet denied"}
              </strong>
            </div>
            <span>{result.rule}</span>
            <code>{result.detail}</code>
          </div>
        )}
        <div className="learn-callout">
          <ShieldCheck size={18} />
          <div>
            <strong>Stateful inspection</strong>
            <p>
              “Existing tracked” assumes the firewall already has a verified
              connection-table entry for this flow. A packet’s ACK flag alone
              does not prove it belongs to an established connection.
            </p>
          </div>
        </div>
        <p className="learn-score-footnote">
          An open-port check measures service reachability from one location. It
          cannot validate a complete firewall policy, VPN configuration, or all
          network paths.
        </p>
      </aside>
    </div>
  );
}

export default function Learning() {
  const [lab, setLab] = useState<Lab>("TCP handshake");
  return (
    <div className="learning-view">
      <div className="learn-page-heading">
        <div>
          <div className="learn-eyebrow">
            <span />
            SECURITY ACADEMY
          </div>
          <h1>
            Understand the attack.
            <br />
            <span>Build the defense.</span>
          </h1>
          <p>
            Interactive labs that turn security fundamentals into practical
            understanding.
          </p>
        </div>
        <div className="learn-heading-art">
          <div className="learn-orbit orbit-one" />
          <div className="learn-orbit orbit-two" />
          <div className="learn-orbit orbit-three" />
          <div className="learn-art-core">
            <ShieldCheck size={35} />
          </div>
          <span className="learn-art-label">KNOWLEDGE IS A CONTROL</span>
        </div>
      </div>
      <div
        className="learn-lab-tabs"
        role="tablist"
        aria-label="Security academy labs"
      >
        {labs.map((item) => (
          <button
            key={item.name}
            role="tab"
            aria-selected={lab === item.name}
            className={lab === item.name ? "selected" : ""}
            onClick={() => setLab(item.name)}
          >
            <item.icon size={19} />
            <span>
              <strong>{item.name}</strong>
              <small>{item.caption}</small>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={lab}>
        {lab === "TCP handshake" ? (
          <TCPHandshake />
        ) : lab === "OSI explorer" ? (
          <OSIExplorer />
        ) : lab === "Attack chain" ? (
          <AttackChain />
        ) : lab === "CIA triad" ? (
          <CIATriad />
        ) : (
          <FirewallPolicy />
        )}
      </div>
      <div className="learn-bottom-note">
        <Activity size={13} />
        <span>Interactive training environment</span>
        <i />
        <span>
          Documentation addresses · simulated traffic · no external network
          activity
        </span>
      </div>
    </div>
  );
}
