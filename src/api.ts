export type SecurityEvent = {
  id: string;
  timestamp: string;
  severity: string;
  source: string;
  eventType: string;
  title: string;
  message: string;
  assetId: string;
  actor: string;
  ip: string;
  location: string;
  tactic: string;
  status: string;
  demo?: boolean;
  provenance?: string;
};
export type Asset = {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  owner: string;
  criticality: string;
  status: string;
  lastSeen: string;
  vulnerabilities: number;
  riskScore: number;
};
export type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  assetId: string;
  assignedTo: string;
  createdAt: string;
  description: string;
  tactics: string[];
  timeline: any[];
  playbook: {
    id: string;
    phase: string;
    title: string;
    detail: string;
    status: string;
  }[];
};
export type Finding = {
  id: string;
  title: string;
  severity: string;
  description: string;
  evidence: string;
  remediation: string;
  cwe?: string;
};
export type Assessment = {
  id: string;
  target: string;
  profile: string;
  status: string;
  startedAt: string;
  completedAt: string;
  summary: any;
  findings: Finding[];
  checks: any[];
  ports: any[];
};
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    "/api" + path,
    body !== undefined
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "Request failed",
    );
  return data as T;
}
export function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function relativeTime(timestamp: string) {
  const diff = Math.max(0, Date.now() - new Date(timestamp).getTime());
  return diff < 60000
    ? "Just now"
    : diff < 3600000
      ? `${Math.floor(diff / 60000)}m ago`
      : diff < 86400000
        ? `${Math.floor(diff / 3600000)}h ago`
        : `${Math.floor(diff / 86400000)}d ago`;
}
