/* ============================================================
   SYNAP — Monitoring, Knowledge, Analytics (NL query), Admin
   ============================================================ */

function rnd(n, base, vol, trend) { const a = []; let v = base; for (let i = 0; i < n; i++) { v += (Math.random() - 0.5) * vol + trend; a.push(Math.max(0, v)); } return a; }

// ---------- Monitoring & Observability ----------
function Monitoring({ onNavigate, onAsk }) {
  const D = window.HELIX_DATA;
  const [svc, setSvc] = React.useState("svc-checkout");
  const TC = window.TelemetryChart;
  const charts = [
    { title: "Request rate", unit: "/s", data: rnd(24, 800, 120, 8), color: "var(--accent)" },
    { title: "Error rate", unit: "%", data: rnd(24, 12, 9, 1.4), color: "var(--critical)", threshold: 30, breach: true },
    { title: "p99 latency", unit: "ms", data: rnd(24, 600, 200, 60), color: "var(--high)" },
    { title: "Saturation (CPU)", unit: "%", data: rnd(24, 72, 12, 1.5), color: "var(--warn)" },
  ];
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <PageHead title="Monitoring & Observability" sub="Golden signals · unified across metrics, logs & traces">
        <Segmented size="sm" value={svc} onChange={setSvc} options={D.services.slice(0, 3).map((s) => ({ value: s.id, label: s.name.replace(" Service", "").replace(" API", "") }))} />
        <button className="btn" onClick={() => onAsk("Why is checkout latency high?")}><Icon name="sparkles" size={15} />Explain anomaly</button>
      </PageHead>

      <div className="card ai-ring" style={{ overflow: "hidden" }}>
        <div style={{ height: 3, background: "var(--ai-grad)" }} />
        <div className="pad row gap-3" style={{ alignItems: "center" }}>
          <Icon name="trend" size={20} style={{ color: "var(--accent)" }} />
          <div className="col grow"><span style={{ fontWeight: 700, fontSize: 13.5 }}>Predicted: Redis memory pressure likely to breach SLO in ~2h (78%)</span><span className="muted" style={{ fontSize: 12.5 }}>Eviction rate trending up. Synap recommends scaling the cache node preemptively.</span></div>
          <button className="btn ai sm" onClick={() => onAsk("Draft a preemptive fix for Redis")}><Icon name="bolt" size={14} fill={true} />Pre-empt</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[["Availability", "99.94%", "ok"], ["Apdex", "0.91", "ok"], ["SLO budget", "32%", "warn"], ["Open alerts", "7", "critical"]].map(([l, v, s]) => (
          <div key={l} className="card pad col gap-1"><span className="muted" style={{ fontSize: 12 }}>{l}</span><span className="display" style={{ fontSize: 26, fontWeight: 600, color: s === "critical" ? "var(--critical)" : s === "warn" ? "var(--warn)" : "var(--ink)" }}>{v}</span></div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {charts.map((c) => <div key={c.title}>{TC ? <TC {...c} /> : null}</div>)}
      </div>
    </div>
  );
}

// ---------- Knowledge Base ----------
function Knowledge({ onAsk }) {
  const D = window.HELIX_DATA;
  const [open, setOpen] = React.useState(null);
  if (open) {
    return (
      <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
        <button className="btn ghost sm" style={{ alignSelf: "flex-start", paddingLeft: 4 }} onClick={() => setOpen(null)}><Icon name="chevL" size={16} />Knowledge base</button>
        <div className="row gap-2 wrap">{open.ai && <AiChip>AI-drafted from INC-4810</AiChip>}<span className="badge ghost" style={{ fontSize: 11 }}>{open.tag}</span><span className="mono muted" style={{ fontSize: 11.5 }}>{open.id} · updated {D.fmtAgo(open.updated)}</span></div>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{open.title}</h1>
        <div className="row gap-4 muted" style={{ fontSize: 12.5 }}><span className="row gap-1"><Icon name="eye" size={14} />{open.views} views</span><span className="row gap-1"><Icon name="thumbsUp" size={14} />{open.helpful}% helpful</span></div>
        <div className="card pad col gap-3" style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-2)" }}>
          <p style={{ margin: 0 }}><b style={{ color: "var(--ink)" }}>Summary.</b> Connection-pool exhaustion occurs when active DB connections reach the configured maximum, causing new requests to time out. This runbook resolves it for PostgreSQL on RDS.</p>
          <div><b style={{ color: "var(--ink)" }}>Symptoms</b><ul style={{ margin: "6px 0", paddingLeft: 18 }}><li>Connections at 100% of max</li><li>TimeoutError acquiring connection in app logs</li><li>Elevated 5xx on dependent services</li></ul></div>
          <div><b style={{ color: "var(--ink)" }}>Resolution</b><ol style={{ margin: "6px 0", paddingLeft: 18 }}><li>Increase <code className="mono">max_connections</code> and pool size</li><li>Promote a read replica and route reads</li><li>Restart pods stuck in CrashLoopBackOff</li><li>Verify SLO recovery</li></ol></div>
        </div>
        <div className="ai-surface" style={{ borderRadius: "var(--r-md)", padding: 14 }}>
          <div className="row gap-2"><AiOrb size={22} /><span style={{ fontWeight: 700, fontSize: 13 }}>Was this helpful?</span></div>
          <p className="muted" style={{ margin: "6px 0 10px", fontSize: 12.5 }}>This article was drafted by Synap from a resolved incident and reviewed by Maya O.</p>
          <div className="row gap-2"><button className="btn sm"><Icon name="thumbsUp" size={13} />Yes</button><button className="btn sm">Needs work</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <PageHead title="Knowledge Base" sub="AI keeps articles fresh — drafted from resolved incidents, reviewed by experts">
        <button className="btn" onClick={() => onAsk("Draft a KB article from INC-4821")}><Icon name="sparkles" size={15} />Draft with AI</button>
        <button className="btn primary"><Icon name="plus" size={15} />New article</button>
      </PageHead>
      <div className="row gap-2 ai-ring" style={{ background: "var(--surface)", border: "1px solid var(--accent-border)", borderRadius: "var(--r-md)", padding: "8px 8px 8px 14px", maxWidth: 560 }}>
        <Icon name="search" size={17} style={{ color: "var(--accent)" }} />
        <input placeholder="Ask a question or search articles…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13.5, color: "var(--ink)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {D.knowledge.map((k) => (
          <div key={k.id} className="card pad col gap-2 clickable-row" style={{ cursor: "pointer" }} onClick={() => setOpen(k)}>
            <div className="row gap-2 wrap">{k.ai && <AiChip>AI-drafted</AiChip>}<span className="badge ghost" style={{ fontSize: 10.5 }}>{k.tag}</span></div>
            <span className="display" style={{ fontSize: 16, fontWeight: 600 }}>{k.title}</span>
            <div className="row gap-4 muted" style={{ fontSize: 12 }}><span className="row gap-1"><Icon name="eye" size={13} />{k.views}</span><span className="row gap-1"><Icon name="thumbsUp" size={13} />{k.helpful}%</span><span className="mono">{k.id}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Analytics with NL query builder ----------
function BarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div className="row gap-3" style={{ alignItems: "flex-end", height: 180, padding: "10px 4px" }}>
      {data.map((d) => (
        <div key={d.l} className="col center grow" style={{ gap: 8, justifyContent: "flex-end", height: "100%" }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>{d.v}{d.unit || ""}</span>
          <div style={{ width: "100%", maxWidth: 54, height: (d.v / max) * 120, background: color || "var(--ai-grad)", borderRadius: "6px 6px 0 0", transition: "height 0.6s ease" }} />
          <span className="muted" style={{ fontSize: 11, textAlign: "center" }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function Analytics({ onAsk }) {
  const [q, setQ] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const suggestions = ["MTTR by service this quarter", "Incidents auto-resolved vs manual", "Top root causes this month", "Ticket deflection rate trend"];
  const run = (query) => {
    setQ(query); setLoading(true); setResult(null);
    setTimeout(() => {
      setLoading(false);
      setResult({
        query,
        insight: "MTTR dropped 38% quarter-over-quarter, driven mostly by AI auto-remediation on Checkout & Payments. Search remains the slowest to resolve.",
        data: [{ l: "Checkout", v: 34, unit: "m" }, { l: "Payments", v: 41, unit: "m" }, { l: "Orders", v: 28, unit: "m" }, { l: "Search", v: 86, unit: "m" }, { l: "Auth", v: 22, unit: "m" }],
      });
    }, 1400);
  };
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <PageHead title="Analytics" sub="Ask anything in plain English — Synap builds the report" />
      <div className="card ai-ring" style={{ overflow: "hidden" }}>
        <div style={{ height: 3, background: "var(--ai-grad)" }} />
        <div className="pad col gap-3">
          <div className="row gap-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", padding: "8px 8px 8px 14px" }}>
            <AiOrb size={24} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && q.trim() && run(q)} placeholder="e.g. Show me MTTR by service this quarter" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 14, color: "var(--ink)" }} />
            <button className="btn ai" onClick={() => run(q.trim() || suggestions[0])}>Generate <Icon name="arrowR" size={15} /></button>
          </div>
          <div className="row gap-2 wrap">{suggestions.map((s) => <button key={s} className="btn sm" style={{ borderRadius: "var(--r-full)" }} onClick={() => run(s)}>{s}</button>)}</div>
        </div>
      </div>

      {loading && <div className="card pad row gap-2" style={{ color: "var(--accent)" }}><span className="typing"><span /><span /><span /></span><span style={{ fontSize: 13, fontWeight: 600 }}>Querying telemetry & building your report…</span></div>}

      {result && (
        <div className="card fade-in" style={{ overflow: "hidden" }}>
          <div className="card-h"><h3 style={{ textTransform: "capitalize" }}>{result.query}</h3><button className="btn ghost sm"><Icon name="plus" size={14} />Save to dashboard</button></div>
          <div className="pad col gap-3">
            <div className="ai-surface" style={{ borderRadius: "var(--r-md)", padding: 13 }}>
              <div className="row gap-2" style={{ marginBottom: 4 }}><AiOrb size={20} /><span style={{ fontWeight: 700, fontSize: 12.5 }}>Synap's insight</span></div>
              <p className="ink2" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{result.insight}</p>
            </div>
            <BarChart data={result.data} />
          </div>
        </div>
      )}

      {!result && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Incidents this quarter" value="184" trend={-12} trendGood={true} sub="vs last quarter" icon="alert" />
          <StatCard label="Avg MTTR" value="41m" trend={-38} trendGood={true} sub="AI-driven" icon="clock" accent="var(--ok)" />
          <StatCard label="Deflection rate" value="64%" trend={22} trendGood={true} sub="self-service" icon="sparkles" accent="var(--accent)" />
          <StatCard label="SLA compliance" value="98.2%" trend={3} trendGood={true} sub="this quarter" icon="check" accent="var(--ok)" />
        </div>
      )}
    </div>
  );
}

// ---------- Admin ----------
function Admin() {
  const [tab, setTab] = React.useState("integrations");
  const D = window.HELIX_DATA;
  const integrations = [
    ["Datadog", "Connected", "#774aa4", true], ["Prometheus", "Connected", "#e6522c", true], ["AWS CloudWatch", "Connected", "#ff9900", true],
    ["Okta SSO", "Connected", "#007dc1", true], ["Azure AD", "Connected", "#0078d4", true], ["PagerDuty", "Connected", "#06ac38", true],
    ["Slack", "Connected", "#4a154b", true], ["Sentry", "Connected", "#362d59", true], ["ServiceNow", "Import available", "#62d84e", false],
  ];
  const roles = [["Alex Morgan", "Platform Owner", "Admin"], ["Maya Okonkwo", "SRE Lead", "Responder"], ["David Chen", "L2 Engineer", "Agent"], ["Priya Nair", "Service Owner", "Manager"], ["Sam Whitfield", "Employee", "End user"]];
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <PageHead title="Admin & Settings" sub="Workspace · integrations · roles · AI governance" />
      <Segmented value={tab} onChange={setTab} options={[{ value: "integrations", label: "Integrations" }, { value: "users", label: "Users & Roles" }, { value: "ai", label: "AI Governance" }]} />

      {tab === "integrations" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {integrations.map(([n, s, c, on]) => (
            <div key={n} className="card pad row spread">
              <div className="row gap-3"><span style={{ width: 36, height: 36, borderRadius: 9, background: c + "22", color: c, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{n[0]}</span><div className="col"><span style={{ fontWeight: 700, fontSize: 13.5 }}>{n}</span><span className="row gap-1" style={{ fontSize: 11.5, color: on ? "var(--ok)" : "var(--muted)" }}>{on && <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />}{s}</span></div></div>
              <button className={"btn sm" + (on ? "" : " primary")}>{on ? "Manage" : "Connect"}</button>
            </div>
          ))}
        </div>
      )}
      {tab === "users" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl"><thead><tr><th>User</th><th>Title</th><th>Role</th><th></th></tr></thead><tbody>
            {roles.map(([n, t, r]) => { const p = D.people.find((x) => x.name === n) || D.me; return (
              <tr key={n}><td><div className="row gap-2"><Avatar person={p} size={26} /><span style={{ fontWeight: 600 }}>{n}</span></div></td><td><span className="muted" style={{ fontSize: 12.5 }}>{t}</span></td><td><span className="badge" style={{ fontSize: 11 }}>{r}</span></td><td><Icon name="dots" size={16} className="muted" /></td></tr>
            ); })}
          </tbody></table>
        </div>
      )}
      {tab === "ai" && (
        <div className="col gap-3">
          {[["Autonomous remediation", "AI can execute approved runbooks automatically", true], ["Require human approval for P1/P2", "High-severity fixes always need sign-off", true], ["Auto-draft KB articles", "Generate knowledge from resolved incidents", true], ["Smart deflection in portal", "Resolve end-user issues without tickets", true], ["Train on resolved incidents", "Improve suggestions from your data", false]].map(([t, d, on]) => (
            <div key={t} className="card pad row spread">
              <div className="col"><span style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</span><span className="muted" style={{ fontSize: 12.5 }}>{d}</span></div>
              <div style={{ width: 42, height: 24, borderRadius: 999, background: on ? "var(--accent)" : "var(--border-strong)", position: "relative", cursor: "pointer", transition: "background 0.2s" }}><span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Monitoring, Knowledge, Analytics, Admin, BarChart });
