import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  Fingerprint,
  Globe,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Siren,
  StickyNote,
  Target,
} from "lucide-react";
import "./playbooks.css";

type CSFFunction =
  | "Govern"
  | "Identify"
  | "Protect"
  | "Detect"
  | "Respond"
  | "Recover";
type Step = {
  id: string;
  name: string;
  fn: CSFFunction;
  goal: string;
  actions: string[];
  evidence: string;
  exit: string;
  owner: string;
};
type Playbook = {
  id: string;
  name: string;
  subtitle: string;
  icon: typeof Siren;
  severity: string;
  category: string;
  summary: string;
  steps: Step[];
};
const playbooks: Playbook[] = [
  {
    id: "ransomware",
    name: "Ransomware containment",
    subtitle: "Endpoint compromise & recovery",
    icon: LockKeyhole,
    severity: "CRITICAL",
    category: "ENDPOINT / T1486",
    summary:
      "An endpoint reports rapid file encryption and a suspicious process. Preserve evidence, limit spread, and restore business operations from a trusted state.",
    steps: [
      {
        id: "authority",
        name: "Confirm response authority",
        fn: "Govern",
        goal: "Establish who can approve containment and which business services are most critical.",
        actions: [
          "Identify the incident commander and escalation contacts.",
          "Confirm authority for endpoint isolation and business service interruption.",
          "Record legal, privacy, reporting, and evidence-retention obligations.",
        ],
        evidence:
          "Incident ownership, escalation matrix, business impact notes.",
        exit: "A responsible incident lead and containment authority are recorded.",
        owner: "Incident commander",
      },
      {
        id: "scope",
        name: "Map critical assets & dependencies",
        fn: "Identify",
        goal: "Know the affected asset, its data, and the systems it can reach before deciding the scope of action.",
        actions: [
          "Record the workstation, user, owner, and affected business process.",
          "Identify accessible shares, privileged accounts, and connected systems.",
          "Check the asset inventory and known vulnerabilities for the endpoint.",
        ],
        evidence:
          "Asset record, network segment, account privileges, dependencies.",
        exit: "The asset context and potential blast radius are understood.",
        owner: "SOC analyst",
      },
      {
        id: "readiness",
        name: "Check protective readiness",
        fn: "Protect",
        goal: "Verify that the protective and recovery controls needed for the exercise are available.",
        actions: [
          "Verify endpoint telemetry and approved containment tooling.",
          "Locate immutable or offline backups and recent restore-test records.",
          "Confirm least-privilege and network-segmentation controls.",
        ],
        evidence:
          "EDR coverage, backup test, segmentation and access-control status.",
        exit: "The team has a viable containment path and a known recovery source.",
        owner: "Endpoint & infrastructure teams",
      },
      {
        id: "triage",
        name: "Validate and classify the incident",
        fn: "Detect",
        goal: "Distinguish malicious encryption from legitimate bulk changes and establish an incident timeline.",
        actions: [
          "Correlate process, file-change, login, and network events.",
          "Capture relevant alerts, timestamps, file hashes, and parent-child process relationships.",
          "Search for the same indicators on other endpoints and classify impact.",
        ],
        evidence:
          "Correlated event timeline, process tree, hashes, observed indicators.",
        exit: "Malicious activity is validated and affected assets are prioritized.",
        owner: "SOC analyst",
      },
      {
        id: "contain",
        name: "Contain spread & preserve evidence",
        fn: "Respond",
        goal: "Stop active harm using approved containment while preserving the ability to investigate.",
        actions: [
          "Request approved endpoint isolation, preserving the management and evidence channel.",
          "Restrict compromised credentials and block validated indicators where appropriate.",
          "Preserve volatile evidence and logs using the established evidence-handling procedure.",
        ],
        evidence:
          "Containment approval, action timestamps, evidence inventory and custody records.",
        exit: "Active spread is contained and evidence is protected.",
        owner: "Incident response team",
      },
      {
        id: "eradicate",
        name: "Investigate & remove the foothold",
        fn: "Respond",
        goal: "Determine the entry point and remove persistence before attempting a safe restoration.",
        actions: [
          "Reconstruct initial access, execution, persistence, and lateral movement.",
          "Remove malicious artifacts or reimage affected systems from a trusted baseline.",
          "Patch the exploited weakness and rotate exposed credentials.",
        ],
        evidence:
          "Root-cause timeline, persistence findings, remediation and patch records.",
        exit: "The initial access path and persistence are addressed.",
        owner: "Incident response & endpoint teams",
      },
      {
        id: "restore",
        name: "Recover and improve defenses",
        fn: "Recover",
        goal: "Restore in a controlled sequence, confirm service health, and use lessons learned to improve resilience.",
        actions: [
          "Verify clean backups and restore prioritized services into a monitored environment.",
          "Validate integrity, functionality, and absence of recurring indicators before reconnecting.",
          "Record lessons learned, owners, and due dates for control improvements.",
        ],
        evidence:
          "Restore validation, service-owner acceptance, monitoring results, improvement tasks.",
        exit: "The service owner accepts recovery and follow-up actions have accountable owners.",
        owner: "Infrastructure & service owners",
      },
    ],
  },
  {
    id: "travel",
    name: "Impossible travel investigation",
    subtitle: "Identity anomaly & VPN authentication",
    icon: Globe,
    severity: "HIGH",
    category: "IDENTITY / VPN",
    summary:
      "One account authenticates from Chicago and Zurich minutes apart. Treat geolocation as a signal to investigate: VPN exits, shared gateways, mobile networks, and inaccurate IP mappings can explain the anomaly.",
    steps: [
      {
        id: "authority",
        name: "Set identity response authority",
        fn: "Govern",
        goal: "Establish the business impact and approval process for interrupting a user’s access.",
        actions: [
          "Assign an incident lead and contact the identity service owner.",
          "Confirm approval rules for session revocation and temporary access restrictions.",
          "Record privacy and authentication-log retention requirements.",
        ],
        evidence:
          "Assigned owner, approval workflow, relevant business and privacy context.",
        exit: "The response owner and access restriction authority are defined.",
        owner: "Identity incident lead",
      },
      {
        id: "scope",
        name: "Establish account & VPN context",
        fn: "Identify",
        goal: "Understand the account, expected travel, and legitimate network egress before drawing a conclusion.",
        actions: [
          "Identify account privileges, role, and affected applications.",
          "Check approved VPN exit points, corporate gateways, and expected travel.",
          "Compare the raw source IPs, timestamps, location data source, and device identifiers.",
        ],
        evidence:
          "Account profile, approved VPN exits, raw source IPs and geolocation provenance.",
        exit: "Expected identity and network behavior are documented.",
        owner: "SOC & identity teams",
      },
      {
        id: "readiness",
        name: "Verify identity protection",
        fn: "Protect",
        goal: "Check controls that constrain unauthorized account use and preserve visibility.",
        actions: [
          "Verify MFA enrollment and the authentication method used.",
          "Review conditional access and risky sign-in policies.",
          "Confirm session revocation and credential-reset procedures are available.",
        ],
        evidence:
          "MFA and conditional-access policy status, session management capabilities.",
        exit: "Identity controls and the intervention path are verified.",
        owner: "Identity administrator",
      },
      {
        id: "triage",
        name: "Validate the travel anomaly",
        fn: "Detect",
        goal: "Determine whether the sign-ins imply account compromise or a benign network explanation.",
        actions: [
          "Correlate sign-ins with device, MFA, ASN, user agent, and session evidence.",
          "Contact the user through a trusted channel to verify activity.",
          "Check VPN egress and geolocation inconsistencies; the same public IP cannot establish physical travel.",
        ],
        evidence:
          "Authentication timeline, trusted user confirmation, VPN and device correlation.",
        exit: "The event is explained or escalated with corroborating compromise indicators.",
        owner: "SOC analyst",
      },
      {
        id: "contain",
        name: "Constrain confirmed compromise",
        fn: "Respond",
        goal: "Use approved identity actions to prevent continued unauthorized access.",
        actions: [
          "For confirmed or sufficiently high-confidence compromise, obtain required approval.",
          "Revoke affected sessions and restrict access under the approved policy.",
          "Reset exposed credentials and enroll secure MFA through a verified process.",
        ],
        evidence:
          "Decision rationale, approvals, session-revocation and credential-reset records.",
        exit: "Unauthorized sessions are invalidated and access is controlled.",
        owner: "Identity administrator",
      },
      {
        id: "investigate",
        name: "Investigate downstream activity",
        fn: "Respond",
        goal: "Determine how access was obtained and what the account accessed or changed.",
        actions: [
          "Review mailbox rules, application access, privilege changes, and data downloads.",
          "Look for related accounts, devices, phishing evidence, or stolen session tokens.",
          "Preserve relevant logs and remediate confirmed unauthorized changes.",
        ],
        evidence:
          "Account activity timeline, affected resources, log preservation and remediation records.",
        exit: "The entry point and material downstream actions are understood.",
        owner: "Incident response team",
      },
      {
        id: "restore",
        name: "Restore access & tune detection",
        fn: "Recover",
        goal: "Restore verified access and improve anomaly detection without hiding real compromise.",
        actions: [
          "Validate account and device security before restoring normal access.",
          "Monitor subsequent sign-ins and confirm access with the user.",
          "Tune approved VPN exclusions with evidence and document lessons learned.",
        ],
        evidence:
          "Verified user access, follow-up monitoring, documented rule changes.",
        exit: "Access is restored safely and justified detection improvements are recorded.",
        owner: "Identity & SOC teams",
      },
    ],
  },
  {
    id: "service",
    name: "Exposed service remediation",
    subtitle: "Attack surface & vulnerability response",
    icon: Target,
    severity: "HIGH",
    category: "EXPOSURE / NETWORK",
    summary:
      "A sanctioned assessment identifies an internet-facing management service. Validate the exposure and business need, reduce access, and retest within the authorized assessment scope.",
    steps: [
      {
        id: "authority",
        name: "Confirm scope and ownership",
        fn: "Govern",
        goal: "Establish explicit assessment scope and the authority to change service access.",
        actions: [
          "Confirm the asset is owned or explicitly authorized for assessment.",
          "Record permitted targets, test windows, and non-disruptive assessment limits.",
          "Identify the service owner and change approver.",
        ],
        evidence:
          "Authorized scope, rules of engagement, asset and change owners.",
        exit: "Assessment scope and remediation authority are documented.",
        owner: "Assessment lead",
      },
      {
        id: "scope",
        name: "Inventory the exposed asset",
        fn: "Identify",
        goal: "Understand the service, data sensitivity, and dependencies behind the exposed port.",
        actions: [
          "Match the target to the asset inventory and internet-facing service records.",
          "Identify the service version, firewall path, and legitimate access requirements.",
          "Review applicable vendor advisories and known vulnerabilities.",
        ],
        evidence:
          "Asset inventory, service fingerprint, network path, authoritative advisories.",
        exit: "The exposed service and business purpose are understood.",
        owner: "Vulnerability analyst",
      },
      {
        id: "readiness",
        name: "Validate protective controls",
        fn: "Protect",
        goal: "Review access restrictions and safe remediation options before changing the service.",
        actions: [
          "Check authentication, MFA, encryption, and administrative access restrictions.",
          "Prepare a backup or rollback path and an approved change plan.",
          "Identify patch, VPN-only access, or service removal options.",
        ],
        evidence: "Access-control review, rollback plan, proposed remediation.",
        exit: "The owner approves a practical risk-reduction plan.",
        owner: "Service & network owners",
      },
      {
        id: "triage",
        name: "Confirm exposure and exploitation",
        fn: "Detect",
        goal: "Verify the finding and check whether the exposure has already been abused.",
        actions: [
          "Use approved non-disruptive checks to confirm externally reachable access.",
          "Correlate service and firewall logs for failed logins, anomalous sessions, or suspicious requests.",
          "Prioritize the finding using exposure, exploitability, data sensitivity, and business impact.",
        ],
        evidence:
          "Authorized validation result, relevant access logs, contextual risk assessment.",
        exit: "The exposure is confirmed and incident escalation need is assessed.",
        owner: "Vulnerability & SOC teams",
      },
      {
        id: "contain",
        name: "Limit exposure with approval",
        fn: "Respond",
        goal: "Reduce immediate exposure through an approved change that preserves required business access.",
        actions: [
          "Approve the change and communicate the maintenance window.",
          "Restrict the service to approved networks or VPN access, or disable it if unnecessary.",
          "If exploitation is suspected, preserve evidence and invoke the relevant incident playbook.",
        ],
        evidence:
          "Change approval, firewall or service change record, preserved evidence.",
        exit: "Unnecessary external access is blocked and legitimate access is validated.",
        owner: "Network & service owners",
      },
      {
        id: "remediate",
        name: "Patch and harden the service",
        fn: "Respond",
        goal: "Remove the vulnerable condition and improve the service configuration.",
        actions: [
          "Apply vendor-supported patches or migrate away from unsupported software.",
          "Enforce least privilege, secure authentication, and hardened configuration.",
          "Review nearby systems for the same exposure or configuration weakness.",
        ],
        evidence: "Patch version, hardening checklist, related-asset review.",
        exit: "The service has a supported, hardened configuration.",
        owner: "Service administrator",
      },
      {
        id: "restore",
        name: "Retest and monitor",
        fn: "Recover",
        goal: "Verify the fix with authorized retesting and prevent exposure from recurring.",
        actions: [
          "Repeat the original approved check and confirm the finding is resolved.",
          "Validate business functionality and monitor service and firewall telemetry.",
          "Update inventory, detection rules, and configuration baselines.",
        ],
        evidence:
          "Retest evidence, service-owner acceptance, inventory and baseline updates.",
        exit: "The finding is closed with evidence and recurrence controls are recorded.",
        owner: "Assessment & service owners",
      },
    ],
  },
];
type ExerciseState = {
  completed: string[];
  checked: Record<string, number[]>;
  notes: Record<string, string>;
  updatedAt: string;
};
type SavedState = Record<string, ExerciseState>;
const STORAGE_KEY = "security-workbench.playbooks.v1";
const emptyState = (): ExerciseState => ({
  completed: [],
  checked: {},
  notes: {},
  updatedAt: "",
});
function readState(): SavedState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    const safe: SavedState = {};
    for (const pb of playbooks) {
      const value = parsed[pb.id];
      if (!value || !Array.isArray(value.completed)) continue;
      const checked: Record<string, number[]> = {};
      const notes: Record<string, string> = {};
      for (const step of pb.steps) {
        const actions = value.checked?.[step.id];
        checked[step.id] = Array.isArray(actions)
          ? [
              ...new Set(
                actions.filter(
                  (index: unknown): index is number =>
                    typeof index === "number" &&
                    Number.isInteger(index) &&
                    index >= 0 &&
                    index < step.actions.length,
                ),
              ),
            ]
          : [];
        notes[step.id] =
          typeof value.notes?.[step.id] === "string"
            ? value.notes[step.id]
            : "";
      }
      safe[pb.id] = {
        completed: [
          ...new Set<string>(
            value.completed.filter(
              (id: unknown): id is string =>
                typeof id === "string" &&
                pb.steps.some((step) => step.id === id),
            ),
          ),
        ],
        checked,
        notes,
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
      };
    }
    return safe;
  } catch {
    return {};
  }
}

export default function Playbooks() {
  const [selected, setSelected] = useState("ransomware");
  const [stepId, setStepId] = useState("authority");
  const [saved, setSaved] = useState<SavedState>(readState);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [resetArmed, setResetArmed] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const pb = playbooks.find((item) => item.id === selected)!;
  const exercise = saved[selected] || emptyState();
  const stepIndex = pb.steps.findIndex((item) => item.id === stepId);
  const step = pb.steps[stepIndex < 0 ? 0 : stepIndex];
  const checked = exercise.checked[step.id] || [];
  const complete = exercise.completed.includes(step.id);
  const progress = Math.round(
    (exercise.completed.length / pb.steps.length) * 100,
  );
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [saved]);
  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), 5000);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);
  function update(change: (old: ExerciseState) => ExerciseState) {
    setSaved((old) => ({
      ...old,
      [selected]: {
        ...change(old[selected] || emptyState()),
        updatedAt: new Date().toISOString(),
      },
    }));
  }
  function toggleAction(index: number) {
    update((old) => ({
      ...old,
      checked: {
        ...old.checked,
        [step.id]: checked.includes(index)
          ? checked.filter((n) => n !== index)
          : [...checked, index],
      },
      completed: complete
        ? old.completed.filter((id) => id !== step.id)
        : old.completed,
    }));
  }
  function finishStep() {
    if (complete) {
      update((old) => ({
        ...old,
        completed: old.completed.filter((id) => id !== step.id),
      }));
      return;
    }
    update((old) => ({ ...old, completed: [...old.completed, step.id] }));
    if (stepIndex < pb.steps.length - 1) setStepId(pb.steps[stepIndex + 1].id);
  }
  function exportPlaybook() {
    const payload = {
      format: "security-playbook-exercise/v1",
      exportedAt: new Date().toISOString(),
      exercise: true,
      framework: "NIST SP 800-61 Rev. 3 aligned with CSF 2.0",
      playbook: { id: pb.id, name: pb.name, summary: pb.summary },
      progress: {
        completed: exercise.completed.length,
        total: pb.steps.length,
      },
      steps: pb.steps.map((item) => ({
        ...item,
        completed: exercise.completed.includes(item.id),
        checkedActions: (exercise.checked[item.id] || []).map(
          (index) => item.actions[index],
        ),
        notes: exercise.notes[item.id] || "",
      })),
      notice:
        "Simulated tabletop exercise. Checklist selections do not perform actions on real systems.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${pb.id}-playbook-exercise.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportNotice("Exercise report downloaded.");
  }
  return (
    <div className="playbooks-view">
      <div className="pb-page-heading">
        <div>
          <div className="pb-eyebrow">
            <span />
            INCIDENT RESPONSE
          </div>
          <h1>
            A clear plan.<span> When every second counts.</span>
          </h1>
          <p>
            Evidence-driven playbooks for containment, investigation, and a
            stronger recovery.
          </p>
        </div>
        <button className="pb-outline-button" onClick={exportPlaybook}>
          <ArrowDownToLine size={15} />
          Export exercise
        </button>
      </div>
      <div className="pb-framework-banner">
        <div className="pb-framework-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <strong>Built around NIST SP 800-61 Rev. 3</strong>
          <p>
            CSF 2.0: Govern, Identify, and Protect support preparedness; Detect,
            Respond, and Recover support incident handling. Improvement feeds
            every function.
          </p>
        </div>
        <span className="pb-framework-badge">NIST ALIGNED</span>
      </div>
      <div className="pb-layout">
        <aside className="pb-library">
          <div className="pb-library-label">
            <span>PLAYBOOK LIBRARY</span>
            <span>03</span>
          </div>
          {playbooks.map((item) => (
            <button
              className={`pb-library-card ${selected === item.id ? "selected" : ""}`}
              key={item.id}
              onClick={() => {
                setSelected(item.id);
                setStepId(item.steps[0].id);
                setResetArmed(false);
                setExportNotice("");
              }}
            >
              <span className="pb-library-card-icon">
                <item.icon size={20} />
              </span>
              <div>
                <span
                  className={`pb-severity ${item.severity === "CRITICAL" ? "critical" : ""}`}
                >
                  {item.severity}
                </span>
                <strong>{item.name}</strong>
                <small>{item.subtitle}</small>
                <span className="pb-library-meta">
                  7 steps · {saved[item.id]?.completed.length || 0} complete
                </span>
              </div>
              <ChevronRight size={14} />
            </button>
          ))}
          <div className="pb-exercise-note">
            <ShieldCheck size={20} />
            <strong>Practice before the pressure.</strong>
            <p>
              This is a tabletop exercise. Checklist selections record your
              decisions; host isolation, account restrictions, and remediation
              require approved operational tools.
            </p>
            <span>
              <i />
              SIMULATION MODE
            </span>
          </div>
          <div className="pb-legacy-note">
            <span>FRAMEWORK REFERENCE</span>
            <p>
              The older Rev. 2 lifecycle used Preparation → Detection & Analysis
              → Containment, Eradication & Recovery → Post-Incident Activity.
              This workspace uses Rev. 3 and CSF 2.0 functions.
            </p>
            <a
              href="https://csrc.nist.gov/pubs/sp/800/61/r3/final"
              target="_blank"
              rel="noreferrer"
            >
              Read NIST guidance
              <ArrowRight size={11} />
            </a>
          </div>
        </aside>
        <main className="pb-workspace">
          <section className="pb-runbook-header">
            <div className="pb-runbook-heading">
              <span className="pb-category">{pb.category}</span>
              <span className="pb-simulation-tag">
                <i />
                TABLETOP EXERCISE
              </span>
            </div>
            <div className="pb-runbook-title">
              <div className="pb-runbook-icon">
                <pb.icon size={24} />
              </div>
              <h2>{pb.name}</h2>
            </div>
            <p>{pb.summary}</p>
            <div className="pb-progress-header">
              <span>Exercise progress</span>
              <strong>
                {exercise.completed.length}
                <small> / {pb.steps.length} steps</small>
              </strong>
            </div>
            <div className="pb-progress-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="pb-phase-labels">
              <span>
                PREPAREDNESS <small>Govern · Identify · Protect</small>
              </span>
              <span>
                INCIDENT HANDLING <small>Detect · Respond · Recover</small>
              </span>
            </div>
          </section>
          <div className="pb-steps-strip" aria-label="Playbook steps">
            {pb.steps.map((item, index) => (
              <button
                key={item.id}
                className={`pb-step-chip ${step.id === item.id ? "selected" : ""} ${exercise.completed.includes(item.id) ? "done" : ""}`}
                onClick={() => setStepId(item.id)}
                title={item.name}
                aria-label={`Step ${index + 1}: ${item.name}${exercise.completed.includes(item.id) ? ", completed" : ""}`}
              >
                <span>
                  {exercise.completed.includes(item.id) ? (
                    <Check size={11} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <strong>{item.fn}</strong>
              </button>
            ))}
          </div>
          <section className="pb-step-content">
            <div className="pb-step-topline">
              <span
                className={`pb-function-label pb-function-${step.fn.toLowerCase()}`}
              >
                {step.fn.toUpperCase()}
              </span>
              <span className="pb-step-count">
                STEP {String(stepIndex + 1).padStart(2, "0")} OF 07
              </span>
              <span className="pb-owner">
                <Fingerprint size={12} />
                {step.owner}
              </span>
            </div>
            <h3>{step.name}</h3>
            <p className="pb-step-goal">{step.goal}</p>
            <div className="pb-action-label">
              <ClipboardList size={14} />
              <span>ACTION CHECKLIST</span>
              <span>
                {checked.length}/{step.actions.length}
              </span>
            </div>
            <div className="pb-action-list">
              {step.actions.map((action, index) => (
                <button
                  key={action}
                  onClick={() => toggleAction(index)}
                  className={`pb-action ${checked.includes(index) ? "checked" : ""}`}
                  aria-pressed={checked.includes(index)}
                >
                  <span className="pb-action-checkbox">
                    {checked.includes(index) && <Check size={12} />}
                  </span>
                  <span>{action}</span>
                </button>
              ))}
            </div>
            <div className="pb-evidence-grid">
              <div>
                <FileCheck2 size={17} />
                <span>EVIDENCE TO RECORD</span>
                <p>{step.evidence}</p>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>EXIT CRITERIA</span>
                <p>{step.exit}</p>
              </div>
            </div>
            <div className="pb-notes-heading">
              <span>
                <StickyNote size={14} />
                ANALYST NOTES
              </span>
              <small>
                {storageAvailable
                  ? "Saved locally on this browser"
                  : "Browser storage unavailable; export to save"}
              </small>
            </div>
            <textarea
              className="pb-notes"
              placeholder="Record the exercise decision, evidence references, timestamps, and next actions…"
              value={exercise.notes[step.id] || ""}
              onChange={(event) => {
                const value = event.target.value;
                update((old) => ({
                  ...old,
                  notes: { ...old.notes, [step.id]: value },
                }));
              }}
              aria-label={`Analyst notes for ${step.name}`}
            />
            <div className="pb-step-footer">
              <div>
                <Clock3 size={13} />
                <span>
                  {complete
                    ? "Step completed in this exercise"
                    : checked.length === step.actions.length
                      ? "Checklist ready for review"
                      : "Review each action before completing the step"}
                </span>
              </div>
              <button
                className={`pb-complete-button ${complete ? "completed" : ""}`}
                onClick={finishStep}
                disabled={!complete && checked.length !== step.actions.length}
              >
                {complete ? (
                  <RotateCcw size={14} />
                ) : (
                  <CheckCircle2 size={15} />
                )}{" "}
                {complete ? "Reopen step" : "Complete step"}
                {!complete && stepIndex < pb.steps.length - 1 && (
                  <ArrowRight size={14} />
                )}
              </button>
            </div>
          </section>
          <footer className="pb-workspace-footer">
            <span>
              <i />
              {storageAvailable
                ? "Exercise progress stored locally"
                : "Export to preserve this exercise"}
              {exportNotice && <b role="status"> · {exportNotice}</b>}
            </span>
            <button
              onClick={() => {
                if (resetArmed) {
                  setSaved((old) => ({ ...old, [selected]: emptyState() }));
                  setStepId(pb.steps[0].id);
                  setResetArmed(false);
                } else setResetArmed(true);
              }}
            >
              <RotateCcw size={12} />
              {resetArmed
                ? "Click again to reset this exercise"
                : "Reset exercise"}
            </button>
          </footer>
          {progress === 100 && (
            <div className="pb-completion-banner" role="status">
              <CheckCircle2 size={24} />
              <div>
                <strong>Playbook exercise complete.</strong>
                <p>
                  Export the evidence and notes, then review improvement actions
                  with your team.
                </p>
              </div>
              <button onClick={exportPlaybook}>
                Export report
                <ArrowDownToLine size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
