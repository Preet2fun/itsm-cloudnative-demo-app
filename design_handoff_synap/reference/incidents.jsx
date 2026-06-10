/* ============================================================
   SYNAP — Incidents: list + AI-assisted detail (flow 2)
   ============================================================ */

function gen(n, base, vol, trend) {
  const a = []; let v = base;
  for (let i = 0; i < n; i++) { v += (Math.random() - 0.5) * vol + trend; a.push(Math.max(0, v)); }
  return a;
}

function TelemetryChart({ title, unit, data, color, threshold, breach }) {
  const max = Math.max(...data, threshold || 0) * 1.1;
  const w = 100, h = 46;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - (v / max) * h]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const cur = data[data.length - 1];
  const gid = "tg" + Math.random().toString(36).slice(2, 7);
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div className="spread" style={{ marginBottom: 6 }}>
        <span className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{title}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: breach ? "var(--critical)" : "var(--ink)" }}>{cur.toFixed(unit === "%" ? 0 : 1)}{unit}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 46, display: "block" }}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {threshold != null && <line x1="0" y1={h - (threshold / max) * h} x2={w} y2={h - (threshold / max) * h} stroke="var(--critical)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6" />}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function IncidentList({ onOpen, onNavigate }) {
  const D = window.HELIX_DATA;
  const [filter, setFilter] = React.useState("all");
  const list = filter === "all" ? D.incidents : D.incidents.filter((i) => (filter === "open" ? i.status !== "Resolved" : i.severity === "critical"));
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <div className="spread wrap gap-3">
        <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "critical", label: "Critical" }]} />
        <div className="row gap-2">
          <button className="btn"><Icon name="filter" size={15} />Filters</button>
          <button className="btn primary"><Icon name="plus" size={15} />New incident</button>
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Severity</th><th>Incident</th><th>Service</th><th>Status</th><th>Assignee</th><th>Source</th><th></th></tr></thead>
          <tbody>
            {list.map((inc) => {
              const a = D.personById(inc.assignee); const svc = D.serviceById(inc.service);
              return (
                <tr key={inc.id} className="clickable" onClick={() => onOpen(inc)}>
                  <td><SevBadge sev={inc.severity} /></td>
                  <td><div className="col" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>{inc.title}</span><span className="mono muted" style={{ fontSize: 11 }}>{inc.id} · {inc.priority} · {D.fmtAgo(inc.created)}</span></div></td>
                  <td><span style={{ fontSize: 12.5 }}>{svc.name}</span></td>
                  <td><span className="badge" style={{ fontSize: 11 }}>{inc.status}</span></td>
                  <td><div className="row gap-2"><Avatar person={a} size={24} /><span style={{ fontSize: 12.5 }}>{a.name.split(" ")[0]}</span></div></td>
                  <td>{inc.aiGenerated ? <AiChip>{inc.correlatedEvents} alerts</AiChip> : <span className="muted mono" style={{ fontSize: 11.5 }}>{inc.correlatedEvents} alerts</span>}</td>
                  <td><Icon name="chevR" size={16} className="muted" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IncidentDetail({ inc, onBack, onAsk }) {
  const D = window.HELIX_DATA;
  const [remediation, setRemediation] = React.useState("idle"); // idle | running | done
  const a = D.personById(inc.assignee);

  const steps = [
    "Scale connection pool 200 → 500 on prod-postgres-01",
    "Promote read replica & route read traffic",
    "Restart 3 checkout pods in CrashLoopBackOff",
    "Verify SLO recovery & close incident",
  ];

  const runRemediation = () => {
    setRemediation("running");
    setTimeout(() => setRemediation("done"), 2600);
  };

  return (
    <div className="col fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto", gap: 16 }}>
      <button className="btn ghost sm" style={{ alignSelf: "flex-start", paddingLeft: 4 }} onClick={onBack}><Icon name="chevL" size={16} />All incidents</button>

      {/* header */}
      <div className="spread wrap gap-3">
        <div className="col gap-2" style={{ maxWidth: 760 }}>
          <div className="row gap-2 wrap">
            <SevBadge sev={inc.severity} /><span className="badge" style={{ fontSize: 11 }}>{inc.priority}</span>
            <span className="badge" style={{ fontSize: 11, color: remediation === "done" ? "var(--ok)" : "var(--high)", background: remediation === "done" ? "var(--ok-soft)" : "var(--high-soft)", border: "none" }}>{remediation === "done" ? "Resolved" : inc.status}</span>
            {inc.aiGenerated && <AiChip>Auto-correlated · {inc.correlatedEvents} alerts</AiChip>}
          </div>
          <h2 className="display" style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{inc.title}</h2>
          <span className="mono muted" style={{ fontSize: 12.5 }}>{inc.id} · opened {D.fmtAgo(inc.created)} · SLA {inc.slaMins || 37}m remaining</span>
        </div>
        <div className="row gap-2"><Avatar person={a} size={32} /><div className="col" style={{ lineHeight: 1.2 }}><span className="muted" style={{ fontSize: 11 }}>On-call</span><span style={{ fontWeight: 700, fontSize: 13 }}>{a.name}</span></div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="col gap-4">
          {/* AI resolution */}
          <div className="card ai-ring" style={{ overflow: "hidden" }}>
            <div style={{ height: 3, background: "var(--ai-grad)" }} />
            <div className="pad col gap-3">
              <div className="spread"><div className="row gap-2"><AiOrb size={24} active={remediation === "running"} /><span style={{ fontWeight: 700, fontSize: 15 }}>AI resolution</span></div><AiChip confidence={91}>Confidence</AiChip></div>
              <p className="ink2" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>Connection-pool exhaustion on <b className="mono">prod-postgres-01</b> after a 3.2× traffic surge. I've drafted a remediation runbook — one approval needed before I execute.</p>

              <div className="col gap-2" style={{ marginTop: 2 }}>
                {steps.map((s, i) => {
                  const active = remediation === "running" && i <= Math.min(3, Math.floor((Date.now() % 1) + i));
                  const done = remediation === "done";
                  return (
                    <div key={i} className="row gap-2" style={{ fontSize: 13 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11,
                        background: done ? "var(--ok)" : "var(--accent-soft)", color: done ? "#fff" : "var(--accent-strong)" }}>
                        {done ? <Icon name="check" size={12} /> : i + 1}
                      </span>
                      <span style={{ color: "var(--ink-2)" }}>{s}</span>
                    </div>
                  );
                })}
              </div>

              {remediation === "idle" && (
                <div className="row gap-2" style={{ marginTop: 4 }}>
                  <button className="btn ai" onClick={runRemediation}><Icon name="play" size={14} fill={true} />Approve &amp; run</button>
                  <button className="btn" onClick={() => onAsk("Edit the remediation plan")}>Edit plan</button>
                  <span className="row gap-1 muted" style={{ fontSize: 12, marginLeft: 4 }}><Icon name="clock" size={13} />~4 min to recover</span>
                </div>
              )}
              {remediation === "running" && <div className="row gap-2" style={{ marginTop: 4, color: "var(--accent)" }}><span className="typing"><span /><span /><span /></span><span style={{ fontSize: 13, fontWeight: 600 }}>Executing runbook… routing traffic & scaling</span></div>}
              {remediation === "done" && (
                <div className="ai-surface fade-in" style={{ borderRadius: "var(--r-md)", padding: 13, marginTop: 2 }}>
                  <div className="row gap-2" style={{ marginBottom: 4 }}><Icon name="checkCircle" size={17} style={{ color: "var(--ok)" }} /><span style={{ fontWeight: 700, fontSize: 13.5 }}>Resolved in 3m 48s · SLO recovered</span></div>
                  <p className="muted" style={{ margin: "0 0 8px", fontSize: 12.5, lineHeight: 1.5 }}>Error rate back to 0.2%. Synap drafted <b style={{ color: "var(--ink-2)" }}>KB-501</b> from this incident and linked it to <b style={{ color: "var(--ink-2)" }}>PRB-220</b>.</p>
                  <button className="btn sm" onClick={() => onAsk("Show the KB article you drafted")}><Icon name="book" size={13} />Review drafted KB article</button>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry */}
          <div className="card">
            <div className="card-h"><h3 className="row gap-2"><Icon name="pulse" size={16} className="muted" />Live telemetry · prod-postgres-01</h3><span className="badge" style={{ fontSize: 10.5 }}>last 30 min</span></div>
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <TelemetryChart title="DB connections" unit="/200" data={remediation === "done" ? gen(20, 120, 30, -3) : gen(20, 120, 30, 5)} color="var(--critical)" threshold={200} breach={remediation !== "done"} />
              <TelemetryChart title="Checkout 5xx rate" unit="%" data={remediation === "done" ? gen(20, 20, 8, -1.5) : gen(20, 10, 10, 1.8)} color="var(--high)" breach={remediation !== "done"} />
              <TelemetryChart title="payment p99 latency" unit="s" data={remediation === "done" ? gen(20, 3, 1, -0.2) : gen(20, 2, 1.5, 0.4)} color="var(--warn)" />
              <TelemetryChart title="DB CPU" unit="%" data={remediation === "done" ? gen(20, 70, 10, -3) : gen(20, 80, 8, 1)} color="var(--accent)" />
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="col gap-4">
          <div className="card">
            <div className="card-h"><h3>Timeline</h3><button className="btn ghost sm" onClick={() => onAsk("Summarize this incident timeline")}><Icon name="sparkles" size={13} />Summarize</button></div>
            <div className="col" style={{ padding: "8px 16px 14px" }}>
              {D.timeline.map((t, i) => {
                const who = t.actor === "ai" ? null : D.personById(t.actor);
                return (
                  <div key={i} className="row gap-3" style={{ alignItems: "flex-start", padding: "8px 0" }}>
                    <div className="col center" style={{ width: 26, flexShrink: 0 }}>
                      {t.actor === "ai" ? <AiOrb size={24} /> : <Avatar person={who} size={24} />}
                      {i < D.timeline.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 14, background: "var(--border)", marginTop: 4 }} />}
                    </div>
                    <div className="col" style={{ gap: 2, paddingBottom: 4 }}>
                      <div className="row gap-2 wrap"><span style={{ fontWeight: 700, fontSize: 12.5 }}>{t.title}</span><span className="badge ghost" style={{ fontSize: 9.5, padding: "1px 6px" }}>{t.tag}</span></div>
                      <span className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>{t.body}</span>
                      <span className="muted" style={{ fontSize: 10.5 }}>{D.fmtTime(t.t)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3 className="row gap-2"><Icon name="book" size={15} className="muted" />Similar & related</h3></div>
            <div className="col" style={{ padding: 10, gap: 4 }}>
              {[["KB-501", "Resolving PostgreSQL pool exhaustion", "94% match", "book"], ["PRB-220", "Recurring DB pool exhaustion", "Linked problem", "problem"], ["INC-4810", "Fraud inference timeouts", "Similar pattern", "alert"]].map(([id, t, m, ic]) => (
                <div key={id} className="row gap-3 clickable-row" style={{ padding: "9px 8px", borderRadius: "var(--r-sm)", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span className="muted"><Icon name={ic} size={16} /></span>
                  <div className="col grow" style={{ gap: 1, minWidth: 0 }}><span style={{ fontSize: 12.5, fontWeight: 600 }}>{t}</span><span className="mono muted" style={{ fontSize: 10.5 }}>{id}</span></div>
                  <span className="badge ghost" style={{ fontSize: 10 }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Incidents({ onNavigate, onAsk }) {
  const D = window.HELIX_DATA;
  const [open, setOpen] = React.useState(null);
  if (open) return <IncidentDetail inc={open} onBack={() => setOpen(null)} onAsk={onAsk} />;
  return <IncidentList onOpen={setOpen} onNavigate={onNavigate} />;
}

window.Incidents = Incidents;
window.TelemetryChart = TelemetryChart;
