/* ============================================================
   SYNAP — Inventory: CMDB, Service Map, Cloud, Assets
   ============================================================ */

function PageHead({ title, sub, children }) {
  return (
    <div className="spread wrap gap-3" style={{ marginBottom: 4 }}>
      <div className="col" style={{ gap: 3 }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
        {sub && <span className="muted" style={{ fontSize: 13 }}>{sub}</span>}
      </div>
      <div className="row gap-2">{children}</div>
    </div>
  );
}

function healthColor(h) { return h === "critical" ? "var(--critical)" : h === "degraded" ? "var(--warn)" : "var(--ok)"; }

function Cmdb({ onNavigate }) {
  const D = window.HELIX_DATA;
  const all = [...D.services.map((s) => ({ ...s, _kind: "Service" })), ...D.cis.map((c) => ({ ...c, _kind: c.type }))];
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <PageHead title="CMDB / Discovery" sub="13 configuration items · auto-discovered & continuously reconciled">
        <button className="btn"><Icon name="refresh" size={15} />Run discovery</button>
        <button className="btn primary"><Icon name="plus" size={15} />Add CI</button>
      </PageHead>

      <div className="card ai-ring" style={{ overflow: "hidden" }}>
        <div className="pad row gap-3" style={{ alignItems: "center" }}>
          <AiOrb size={26} />
          <div className="col grow"><span style={{ fontWeight: 700, fontSize: 13.5 }}>Synap discovered 3 new CIs and 7 relationships in the last scan</span><span className="muted" style={{ fontSize: 12.5 }}>Auto-mapped a new read replica and 2 Lambda functions to the Payments service.</span></div>
          <button className="btn sm">Review</button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Health</th><th>Name</th><th>Type</th><th>Environment</th><th>Cloud</th><th>Owner</th></tr></thead>
          <tbody>
            {all.map((ci) => (
              <tr key={ci.id} className="clickable" onClick={() => onNavigate("servicemap")}>
                <td><HealthDot health={ci.health} /></td>
                <td><span className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{ci.name}</span></td>
                <td><span className="badge ghost" style={{ fontSize: 10.5 }}>{ci._kind}</span></td>
                <td><span style={{ fontSize: 12.5 }}>{ci.env || (ci.tier || "—")}</span></td>
                <td><span className="muted" style={{ fontSize: 12 }}>{ci.cloud || "—"}</span></td>
                <td>{ci.owner ? <Avatar person={D.personById(ci.owner)} size={24} /> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Service Map (topology) ----------
function ServiceMap({ onNavigate, onAsk }) {
  const D = window.HELIX_DATA;
  const [sel, setSel] = React.useState("svc-checkout");
  // layout positions (x%, y)
  const pos = {
    "svc-checkout": [50, 60], "svc-payments": [22, 180], "svc-orders": [50, 180], "svc-auth": [80, 60],
    "svc-fraud": [10, 300], "svc-search": [80, 180], "svc-notify": [68, 300],
    "ci-db-prod": [30, 300], "ci-redis": [50, 300], "ci-kafka": [60, 420], "ci-es": [88, 300], "ci-ml-infer": [10, 420], "ci-k8s": [40, 420],
  };
  const W = 640, H = 480;
  const px = (id) => (pos[id] ? (pos[id][0] / 100) * W : W / 2);
  const py = (id) => (pos[id] ? pos[id][1] : H / 2);
  const edges = [];
  D.services.forEach((s) => (s.deps || []).forEach((d) => { if (pos[d]) edges.push([s.id, d]); }));
  const node = (n) => {
    const isSvc = n.id.startsWith("svc");
    const seld = sel === n.id;
    return (
      <g key={n.id} onClick={() => setSel(n.id)} style={{ cursor: "pointer" }}>
        <circle cx={px(n.id)} cy={py(n.id)} r={isSvc ? 26 : 20} fill="var(--surface)" stroke={seld ? "var(--accent)" : healthColor(n.health)} strokeWidth={seld ? 3 : 2} />
        <circle cx={px(n.id)} cy={py(n.id)} r={4} fill={healthColor(n.health)} />
        {n.health === "critical" && <circle cx={px(n.id)} cy={py(n.id)} r={isSvc ? 26 : 20} fill="none" stroke="var(--critical)" strokeWidth="1.5" opacity="0.4"><animate attributeName="r" values={`${isSvc ? 26 : 20};${isSvc ? 38 : 30}`} dur="1.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0" dur="1.8s" repeatCount="indefinite" /></circle>}
        <text x={px(n.id)} y={py(n.id) + (isSvc ? 42 : 34)} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-2)" style={{ fontFamily: "var(--font-ui)" }}>{n.name}</text>
      </g>
    );
  };
  const selNode = D.serviceById(sel);
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <PageHead title="Service Map" sub="Live dependency topology · impact-aware">
        <button className="btn" onClick={() => onAsk("What's the blast radius of INC-4821?")}><Icon name="sparkles" size={15} />Blast radius</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden", background: "var(--surface)" }}>
          <div style={{ position: "relative", background: "radial-gradient(circle at 50% 30%, var(--surface-2), var(--surface))", backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 480, display: "block" }}>
              {edges.map(([a, b], i) => <line key={i} x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)} stroke={(sel === a || sel === b) ? "var(--accent)" : "var(--border-strong)"} strokeWidth={(sel === a || sel === b) ? 2 : 1.2} />)}
              {[...D.services, ...D.cis].map(node)}
            </svg>
          </div>
        </div>
        <div className="card pad col gap-3">
          <div className="row gap-2"><HealthDot health={selNode.health} /><span className="display" style={{ fontWeight: 700, fontSize: 16 }}>{selNode.name}</span></div>
          <div className="col gap-2">
            {[["Type", selNode.tier ? "Service · " + selNode.tier : selNode.type], ["Status", (HEALTH[selNode.health] || {}).l], ["Cloud", selNode.cloud || "Multi-AZ"], ["Owner", selNode.owner ? D.personById(selNode.owner).name : "—"]].map(([k, v]) => (
              <div key={k} className="spread" style={{ fontSize: 13 }}><span className="muted">{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
          {selNode.health !== "healthy" && (
            <div className="ai-surface" style={{ borderRadius: "var(--r-md)", padding: 12 }}>
              <div className="row gap-2" style={{ marginBottom: 4 }}><AiOrb size={20} /><span style={{ fontWeight: 700, fontSize: 12.5 }}>Impact analysis</span></div>
              <p className="muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>Degradation here propagates to <b style={{ color: "var(--ink-2)" }}>Checkout & Payments</b>. Linked to active <b style={{ color: "var(--ink-2)" }}>INC-4821</b>.</p>
              <button className="btn sm block" style={{ marginTop: 8 }} onClick={() => onNavigate("incidents")}>View incident</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Cloud & Infra ----------
function CloudInventory() {
  const D = window.HELIX_DATA;
  const rows = [
    { name: "prod-postgres-01", prov: "AWS", svc: "RDS PostgreSQL", region: "us-east-1", cost: "$2,140", health: "critical" },
    { name: "prod-redis-cluster", prov: "AWS", svc: "ElastiCache", region: "us-east-1", cost: "$880", health: "degraded" },
    { name: "prod-eks-cluster", prov: "AWS", svc: "EKS (32 nodes)", region: "us-east-1", cost: "$6,420", health: "degraded" },
    { name: "events-kafka", prov: "AWS", svc: "MSK", region: "us-east-1", cost: "$1,310", health: "healthy" },
    { name: "search-es-cluster", prov: "GCP", svc: "Elasticsearch", region: "us-central1", cost: "$1,990", health: "healthy" },
    { name: "ml-inference-gpu", prov: "AWS", svc: "EKS GPU pool", region: "us-east-1", cost: "$4,750", health: "healthy" },
  ];
  const provColor = { AWS: "#ff9900", GCP: "#4285f4", Azure: "#0078d4" };
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <PageHead title="Cloud & Infrastructure" sub="Multi-cloud inventory · cost & health unified">
        <button className="btn"><Icon name="filter" size={15} />All providers</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard label="Monthly cloud spend" value="$18.3k" trend={6} trendGood={false} sub="vs last month" icon="cloud" />
        <StatCard label="Resources" value="142" sub="across AWS, GCP" icon="server" accent="var(--accent)" />
        <StatCard label="Optimization found" value="$3.1k" sub="Synap right-sizing" icon="sparkles" accent="var(--ok)" />
        <StatCard label="Idle / waste" value="11" sub="resources flagged" icon="alert" accent="var(--warn)" />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Health</th><th>Resource</th><th>Provider</th><th>Service</th><th>Region</th><th>Monthly cost</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="clickable">
                <td><HealthDot health={r.health} /></td>
                <td><span className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{r.name}</span></td>
                <td><span className="badge" style={{ fontSize: 10.5, color: provColor[r.prov] }}><span className="dot" style={{ background: provColor[r.prov] }} />{r.prov}</span></td>
                <td><span style={{ fontSize: 12.5 }}>{r.svc}</span></td>
                <td><span className="muted" style={{ fontSize: 12 }}>{r.region}</span></td>
                <td><span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{r.cost}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Assets ----------
function Assets() {
  const rows = [
    { name: "MacBook Pro 14\"", tag: "SW-MBP-14", user: "u6", status: "warn", warranty: "Apr 2027", os: "macOS 15.3" },
    { name: "ThinkPad X1", tag: "DC-TP-09", user: "u2", status: "ok", warranty: "Jan 2027", os: "Ubuntu 24.04" },
    { name: "MacBook Air", tag: "MO-MBA-21", user: "u1", status: "ok", warranty: "Sep 2026", os: "macOS 15.3" },
    { name: "iPhone 15", tag: "SW-IPH-15", user: "u6", status: "ok", warranty: "Apr 2026", os: "iOS 18.2" },
    { name: "Dell Latitude", tag: "AR-DL-04", user: "u5", status: "ok", warranty: "Nov 2026", os: "Windows 11" },
  ];
  const D = window.HELIX_DATA;
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <PageHead title="Asset Management" sub="248 managed assets · linked to CMDB & owners">
        <button className="btn"><Icon name="filter" size={15} />Filters</button>
        <button className="btn primary"><Icon name="plus" size={15} />Register asset</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard label="Total assets" value="248" sub="laptops, phones, monitors" icon="laptop" />
        <StatCard label="Assigned" value="231" sub="93% utilization" icon="users" accent="var(--accent)" />
        <StatCard label="Needs attention" value="6" sub="health or warranty" icon="alert" accent="var(--warn)" />
        <StatCard label="Off-warranty soon" value="14" sub="next 90 days" icon="clock" accent="var(--high)" />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Status</th><th>Asset</th><th>Asset tag</th><th>Assigned to</th><th>OS</th><th>Warranty</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const u = D.personById(r.user);
              return (
                <tr key={r.tag} className="clickable">
                  <td><HealthDot health={r.status === "warn" ? "degraded" : "healthy"} /></td>
                  <td><span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span></td>
                  <td><span className="mono muted" style={{ fontSize: 12 }}>{r.tag}</span></td>
                  <td><div className="row gap-2"><Avatar person={u} size={24} /><span style={{ fontSize: 12.5 }}>{u.name}</span></div></td>
                  <td><span style={{ fontSize: 12.5 }}>{r.os}</span></td>
                  <td><span className="muted" style={{ fontSize: 12 }}>{r.warranty}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { Cmdb, ServiceMap, CloudInventory, Assets, PageHead });
