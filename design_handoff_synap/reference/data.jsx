/* ============================================================
   HELIX — mock data layer
   ============================================================ */

const HELIX_DATA = (function () {
  const now = new Date("2026-06-06T14:32:00");
  const ago = (mins) => new Date(now - mins * 60000);
  const fmtTime = (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const fmtAgo = (d) => {
    const m = Math.round((now - d) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  };

  const people = [
    { id: "u1", name: "Maya Okonkwo", role: "SRE Lead", initials: "MO", color: "oklch(0.6 0.17 280)" },
    { id: "u2", name: "David Chen", role: "L2 Engineer", initials: "DC", color: "oklch(0.62 0.15 200)" },
    { id: "u3", name: "Priya Nair", role: "Service Owner", initials: "PN", color: "oklch(0.6 0.16 150)" },
    { id: "u4", name: "Tomas Berg", role: "NOC Engineer", initials: "TB", color: "oklch(0.64 0.15 40)" },
    { id: "u5", name: "Aisha Rahman", role: "Change Manager", initials: "AR", color: "oklch(0.6 0.17 330)" },
    { id: "u6", name: "Sam Whitfield", role: "Employee", initials: "SW", color: "oklch(0.58 0.13 250)" },
  ];
  const me = { id: "me", name: "Alex Morgan", role: "Platform Owner", initials: "AM", color: "var(--accent)" };

  // Services / CMDB
  const services = [
    { id: "svc-checkout", name: "Checkout API", tier: "Tier 1", health: "degraded", owner: "u1", deps: ["svc-payments", "svc-orders", "ci-redis", "ci-db-prod"] },
    { id: "svc-payments", name: "Payments Service", tier: "Tier 1", health: "critical", owner: "u3", deps: ["ci-db-prod", "svc-fraud"] },
    { id: "svc-orders", name: "Orders Service", tier: "Tier 1", health: "healthy", owner: "u1", deps: ["ci-db-prod", "ci-kafka"] },
    { id: "svc-fraud", name: "Fraud Detection", tier: "Tier 2", health: "healthy", owner: "u2", deps: ["ci-ml-infer"] },
    { id: "svc-auth", name: "Identity & SSO", tier: "Tier 1", health: "healthy", owner: "u3", deps: ["ci-db-prod"] },
    { id: "svc-search", name: "Catalog Search", tier: "Tier 2", health: "healthy", owner: "u2", deps: ["ci-es"] },
    { id: "svc-notify", name: "Notifications", tier: "Tier 3", health: "healthy", owner: "u4", deps: ["ci-kafka"] },
  ];
  const cis = [
    { id: "ci-db-prod", name: "prod-postgres-01", type: "Database", env: "prod", health: "critical", cloud: "AWS · us-east-1", kind: "RDS PostgreSQL 15" },
    { id: "ci-redis", name: "prod-redis-cluster", type: "Cache", env: "prod", health: "degraded", cloud: "AWS · us-east-1", kind: "ElastiCache" },
    { id: "ci-kafka", name: "events-kafka", type: "Message Bus", env: "prod", health: "healthy", cloud: "AWS · us-east-1", kind: "MSK" },
    { id: "ci-es", name: "search-es-cluster", type: "Search", env: "prod", health: "healthy", cloud: "GCP · us-central1", kind: "Elasticsearch" },
    { id: "ci-ml-infer", name: "ml-inference-gpu", type: "Compute", env: "prod", health: "healthy", cloud: "AWS · us-east-1", kind: "EKS GPU pool" },
    { id: "ci-k8s", name: "prod-eks-cluster", type: "Cluster", env: "prod", health: "degraded", cloud: "AWS · us-east-1", kind: "EKS 1.29" },
  ];

  // The hero incident
  const heroIncident = {
    id: "INC-4821",
    title: "Checkout failures spiking — payment timeouts across EU & US",
    severity: "critical",
    status: "Investigating",
    priority: "P1",
    service: "svc-checkout",
    assignee: "u1",
    created: ago(23),
    aiGenerated: true,
    correlatedEvents: 47,
    affectedUsers: "~12,400",
    slaMins: 37,
    slaTotal: 60,
    summary:
      "Synap correlated 47 alerts into a single incident. Checkout API error rate jumped to 38% at 14:09 UTC, concentrated on payment authorization calls. Root cause points to connection-pool exhaustion on prod-postgres-01 following a traffic surge.",
  };

  // AIOps raw events (the storm) — pre-correlation
  const events = [
    { id: "EV-9001", source: "Datadog", ts: ago(24), sev: "critical", ci: "ci-db-prod", text: "PostgreSQL connections at 100% of max (200/200)", cluster: "A" },
    { id: "EV-9002", source: "Prometheus", ts: ago(24), sev: "critical", ci: "svc-checkout", text: "checkout_http_5xx_rate > 30% (SLO breach)", cluster: "A" },
    { id: "EV-9003", source: "Datadog", ts: ago(23), sev: "high", ci: "svc-payments", text: "payment.authorize p99 latency 8.4s (threshold 1.5s)", cluster: "A" },
    { id: "EV-9004", source: "CloudWatch", ts: ago(23), sev: "high", ci: "ci-redis", text: "Redis evictions spiking, hit-rate dropped to 71%", cluster: "A" },
    { id: "EV-9005", source: "Prometheus", ts: ago(22), sev: "warn", ci: "ci-k8s", text: "checkout pods restarting (CrashLoopBackOff x3)", cluster: "A" },
    { id: "EV-9006", source: "PagerDuty", ts: ago(22), sev: "critical", ci: "svc-checkout", text: "Synthetic checkout journey failing in EU-West", cluster: "A" },
    { id: "EV-9007", source: "Sentry", ts: ago(21), sev: "high", ci: "svc-payments", text: "spike: TimeoutError acquiring DB connection (1,204 events)", cluster: "A" },
    { id: "EV-9012", source: "Datadog", ts: ago(40), sev: "warn", ci: "ci-es", text: "Search latency p95 nudged to 410ms", cluster: "B" },
    { id: "EV-9015", source: "CloudWatch", ts: ago(95), sev: "info", ci: "svc-notify", text: "Notification queue depth normalized", cluster: "C" },
  ];

  const timeline = [
    { t: ago(24), actor: "ai", title: "Alert storm detected", body: "47 alerts received across Datadog, Prometheus, CloudWatch, Sentry & PagerDuty within 90 seconds.", tag: "Correlation" },
    { t: ago(23), actor: "ai", title: "Correlated into INC-4821", body: "Grouped 47 events into one incident using topology + temporal correlation. Noise reduced 97%.", tag: "Correlation" },
    { t: ago(23), actor: "ai", title: "Severity set to P1 / Critical", body: "Tier-1 service, SLO breach, ~12,400 users affected. Auto-paged on-call (Maya O.).", tag: "Triage" },
    { t: ago(21), actor: "ai", title: "Probable root cause identified", body: "Connection-pool exhaustion on prod-postgres-01 after a 3.2× traffic surge. Confidence 91%.", tag: "RCA" },
    { t: ago(18), actor: "u1", title: "Maya acknowledged", body: "On it — reviewing the DB connections graph now.", tag: "Human" },
    { t: ago(12), actor: "ai", title: "Remediation runbook proposed", body: "Scale connection pool + add read replica failover. Estimated recovery: 4 min.", tag: "Remediation" },
  ];

  // Incident list
  const incidents = [
    heroIncident,
    { id: "INC-4819", title: "Elevated 5xx on Catalog Search after deploy", severity: "high", status: "Investigating", priority: "P2", service: "svc-search", assignee: "u2", created: ago(86), correlatedEvents: 6 },
    { id: "INC-4817", title: "SSO login latency for Azure AD tenants", severity: "medium", status: "Identified", priority: "P3", service: "svc-auth", assignee: "u3", created: ago(180), correlatedEvents: 3 },
    { id: "INC-4814", title: "Notification delivery delays (email channel)", severity: "low", status: "Monitoring", priority: "P4", service: "svc-notify", assignee: "u4", created: ago(320), correlatedEvents: 2 },
    { id: "INC-4810", title: "Fraud model inference timeouts (intermittent)", severity: "medium", status: "Resolved", priority: "P3", service: "svc-fraud", assignee: "u2", created: ago(1440), correlatedEvents: 9 },
  ];

  const problems = [
    { id: "PRB-220", title: "Recurring DB connection-pool exhaustion under peak load", status: "Root Cause Known", linked: 4, aiCluster: true, owner: "u1" },
    { id: "PRB-214", title: "Catalog Search latency regressions tied to index merges", status: "Investigating", linked: 3, aiCluster: true, owner: "u2" },
    { id: "PRB-208", title: "SSO token refresh storms from mobile clients", status: "Known Error", linked: 6, aiCluster: false, owner: "u3" },
  ];

  const changes = [
    { id: "CHG-1042", title: "Increase prod-postgres-01 max_connections 200→500 + add read replica", risk: "Medium", status: "Pending Approval", type: "Standard", when: "Today 16:00", aiRisk: 0.32, requester: "u1" },
    { id: "CHG-1039", title: "Deploy Catalog Search v2.4 (index merge tuning)", risk: "Low", status: "Scheduled", type: "Normal", when: "Tomorrow 02:00", aiRisk: 0.14, requester: "u2" },
    { id: "CHG-1035", title: "Rotate SSO signing certificates (all tenants)", risk: "High", status: "Approved", type: "Normal", when: "Sat 03:00", aiRisk: 0.61, requester: "u3" },
    { id: "CHG-1031", title: "Scale EKS node group for seasonal traffic", risk: "Low", status: "Implemented", type: "Standard", when: "Yesterday", aiRisk: 0.09, requester: "u4" },
  ];

  const catalog = [
    { id: "c1", name: "Request laptop / hardware", cat: "Hardware", icon: "laptop", sla: "3 days", popular: true },
    { id: "c2", name: "New software license", cat: "Software", icon: "package", sla: "1 day", popular: true },
    { id: "c3", name: "Reset password / unlock", cat: "Access", icon: "key", sla: "Instant · AI", popular: true, ai: true },
    { id: "c4", name: "VPN / network access", cat: "Access", icon: "shield", sla: "4 hours" },
    { id: "c5", name: "Onboard new employee", cat: "People", icon: "users", sla: "2 days" },
    { id: "c6", name: "Provision cloud resources", cat: "Cloud", icon: "cloud", sla: "Same day" },
    { id: "c7", name: "Email distribution list", cat: "Access", icon: "mail", sla: "4 hours" },
    { id: "c8", name: "Report a workplace issue", cat: "Facilities", icon: "wrench", sla: "1 day" },
  ];

  const requests = [
    { id: "REQ-7781", item: "Reset password / unlock", status: "Resolved by AI", by: "u6", when: ago(8), ai: true },
    { id: "REQ-7779", item: "New software license — Figma", status: "Awaiting Approval", by: "u6", when: ago(120) },
    { id: "REQ-7774", item: "VPN / network access", status: "In Progress", by: "u2", when: ago(240) },
  ];

  const knowledge = [
    { id: "KB-501", title: "Resolving PostgreSQL connection-pool exhaustion", views: "3.2k", helpful: 94, ai: true, updated: ago(11), tag: "Database" },
    { id: "KB-488", title: "How SSO works with Azure AD & Okta", views: "8.1k", helpful: 97, updated: ago(2880), tag: "Identity" },
    { id: "KB-475", title: "Runbook: Catalog Search latency triage", views: "1.4k", helpful: 89, updated: ago(4320), tag: "Runbook" },
    { id: "KB-462", title: "Standard change: scaling EKS node groups", views: "920", helpful: 91, updated: ago(7200), tag: "Cloud" },
  ];

  // Dashboard metrics
  const metrics = {
    openIncidents: 5,
    p1: 1,
    mttrMins: 41,
    mttrTrend: -28,
    noiseReduction: 96,
    autoResolved: 312,
    autoResolvedPct: 64,
    slaCompliance: 98.2,
    eventsToday: 18420,
    correlatedToday: 540,
  };

  const sparkline = [12, 14, 11, 18, 22, 19, 28, 24, 31, 27, 35, 30, 26, 22, 19, 17];

  return {
    now, ago, fmtTime, fmtAgo, people, me, services, cis,
    heroIncident, events, timeline, incidents, problems, changes,
    catalog, requests, knowledge, metrics, sparkline,
    personById: (id) => id === "me" ? me : people.find((p) => p.id === id) || me,
    serviceById: (id) => services.find((s) => s.id === id) || cis.find((c) => c.id === id) || { name: id },
  };
})();

window.HELIX_DATA = HELIX_DATA;
