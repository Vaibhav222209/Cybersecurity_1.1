import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class ScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = "ScopeError";
    this.status = 403;
  }
}

const stripBrackets = (host) => host.replace(/^\[|\]$/g, "").toLowerCase();
const loopback = (host) =>
  ["localhost", "127.0.0.1", "::1"].includes(stripBrackets(host));

export function parseTarget(input) {
  if (
    typeof input !== "string" ||
    input.trim().length === 0 ||
    input.length > 2048
  )
    throw new ScopeError("Enter an HTTP(S) target in the authorized scope.");
  let target = input.trim();
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(target))
    target = "http://127.0.0.1:4318";
  if (!target.includes("://")) target = `http://${target}`;
  let url;
  try {
    url = new URL(target);
  } catch {
    throw new ScopeError(
      "Target must be a valid HTTP(S) URL or hostname:port.",
    );
  }
  if (!["http:", "https:"].includes(url.protocol))
    throw new ScopeError("Only HTTP and HTTPS assessments are supported.");
  if (url.username || url.password)
    throw new ScopeError("Targets cannot contain embedded credentials.");
  if (url.search || url.hash)
    throw new ScopeError("Targets cannot contain a query string or fragment.");
  if (url.pathname !== "/" && url.pathname !== "")
    throw new ScopeError("Assessments use an origin only; remove the path.");
  const hostname = stripBrackets(url.hostname);
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  if (!hostname || !Number.isInteger(port) || port < 1 || port > 65535)
    throw new ScopeError("Invalid target host or port.");
  return { url, hostname, port, protocol: url.protocol, origin: url.origin };
}

export function createScope(
  authorizedTargets = process.env.AUTHORIZED_TARGETS || "",
) {
  const origins = new Set();
  for (const item of authorizedTargets
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    if (!/^https?:\/\//i.test(item))
      throw new Error(
        "AUTHORIZED_TARGETS entries must be complete HTTP(S) origins, separated by commas.",
      );
    origins.add(parseTarget(item).origin);
  }
  return {
    origins,
    label: origins.size
      ? `Local training lab + ${origins.size} explicit authorized origin(s)`
      : "Local training lab · http://127.0.0.1:4318 only",
    targets: ["http://127.0.0.1:4318", ...origins],
  };
}

function reservedAddress(address) {
  const ip = stripBrackets(address);
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 127 ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  // Mapped IPv4 forms are rejected to prevent alternate spellings bypassing policy.
  return (
    ip === "::" ||
    ip === "::1" ||
    ip.startsWith("::ffff:") ||
    /^(fc|fd|fe[89ab])/i.test(ip) ||
    ip.startsWith("ff")
  );
}

function alwaysForbidden(address) {
  const ip = stripBrackets(address);
  if (["100.100.100.200", "168.63.129.16", "fd00:ec2::254"].includes(ip))
    return true;
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || (a === 169 && b === 254) || a >= 224;
  }
  return (
    ip === "::" ||
    ip.startsWith("::ffff:") ||
    /^(fe[89ab])/i.test(ip) ||
    ip.startsWith("ff")
  );
}

export async function authorizeTarget(
  input,
  scope = createScope(),
  resolver = lookup,
) {
  const target = parseTarget(input);
  const lab =
    loopback(target.hostname) &&
    target.port === 4318 &&
    target.protocol === "http:";
  if (lab) return { ...target, address: "127.0.0.1", family: 4, lab: true };
  if (!scope.origins.has(target.origin))
    throw new ScopeError(
      "Target is outside the authorized scope. Use the local lab or add this exact origin to AUTHORIZED_TARGETS.",
    );
  const literal = isIP(target.hostname);
  const addresses = literal
    ? [{ address: target.hostname, family: literal }]
    : await resolver(target.hostname, { all: true, verbatim: true });
  if (!addresses.length)
    throw new ScopeError(
      "The authorized hostname did not resolve to an IP address.",
    );
  for (const entry of addresses) {
    if (alwaysForbidden(entry.address))
      throw new ScopeError(
        "Link-local, metadata, multicast, and unspecified addresses cannot be assessed.",
      );
    if (!literal && reservedAddress(entry.address))
      throw new ScopeError(
        "An authorized DNS name resolved to a private or local address. Use an explicit authorized IP origin for an internal asset.",
      );
    if (loopback(entry.address) || entry.address.startsWith("127."))
      throw new ScopeError(
        "Only the training lab on port 4318 may use a loopback address.",
      );
  }
  return { ...target, ...addresses[0], lab: false };
}
