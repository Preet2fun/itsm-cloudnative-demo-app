/* ============================================================
   SYNAP — Ops Dashboard (home)
   ============================================================ */

function HeroIncidentCard({ onOpen, onResolve }) {
  const D = window.HELIX_DATA;
  const inc = D.heroIncident;
  return (
    <div className="card" style={{ overflow: "hidden", borderColor: "var(--accent-border)" }}>
      <div style={{ height: 3, background: "var(--ai-grad)" }} />
      <div className="pad col gap-3">
        <div className="spread wrap gap-3">
          <div className="row gap-2 wrap">
            <SevBadge sev="critical" />
            <span className="badge" style={{ color: "var(--critical)", background: "var(--critical-soft)", border: "none" }}>P1 · Active</span>
            <AiChip>Auto-correlated from {inc.correlatedEvents} alerts</AiChip>
          </div>
          <span className="mono muted" style={{ fontSize: 12.5 }}>{inc.id} · {D.fmtAgo(inc.created)}</span>
        </div>

        <h2 className="display" style={{ fontSize: 21, fontWeight: 600, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{inc.title}</h2>

        <div className="ai-surface" style={{ borderRadius: "var(--r-md)", padding: 14 }}>
          <div className="row gap-2" style={{ marginBottom: 8 }}><AiOrb size={22} /><span style={{ fontWeight: 700, fontSize: 13 }}>Synap's read on this</span><AiChip confidence={91}>RCA</AiChip></div>
          <p className="ink2" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{inc.summary}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 2 }}>
          {[["Affected users", inc.affectedUsers], ["Service", "Checkout API"], ["SLA remaining", inc.slaMins + " min"], ["On-call", "Maya O."]].map(([k, v]) => (
            <div key={k} className="col" style={{ gap: 2, minWidth: 0 }}><span className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{k}</span><span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span></div>
          ))}
        </div>

        <div className="row gap-2" style={{ marginTop: 6 }}>
          <button className="btn ai" onClick={onResolve}><Icon name="bolt" size={16} fill={true} />Resolve with Synap</button>
          <button className="btn" onClick={onOpen}>Open incident <Icon name="arrowR" size={15} /></button>
        </div>
      </div>
    </div>
  );
}

function ServiceHealthRow({ svc, onClick }) {
  const D = window.HELIX_DATA;
  const owner = D.personById(svc.owner);
  const data = svc.health === "critical" ? [20, 22, 19, 24, 30, 45, 60, 75, 68, 82] : svc.health === "degraded" ? [30, 28, 32, 35, 31, 38, 42, 36, 44, 40] : [40, 42, 39, 44, 41, 43, 40, 42, 41, 43];
  const color = svc.health === "critical" ? "var(--critical)" : svc.health === "degraded" ? "var(--warn)" : "var(--ok)";
  return (
    <div className="row gap-3 clickable-row" onClick={onClick} style={{ padding: "11px 4px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
      <HealthDot health={svc.health} />
      <div className="col grow" style={{ gap: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{svc.name}</span>
        <span className="muted" style={{ fontSize: 11.5 }}>{svc.tier}</span>
      </div>
      <Sparkline data={data} color={color} w={72} h={24} />
      <Avatar person={owner} size={26} />
    </div>
  );
}

function AiActivityFeed() {
  const D = window.HELIX_DATA;
  const items = [
    { icon: "sparkles", ai: true, text: "Resolved REQ-7781 — password reset for Sam W. without a ticket", time: D.fmtAgo(D.ago(8)), tag: "Deflection" },
    { icon: "pulse", ai: true, text: "Correlated 47 alerts into INC-4821 — 97% noise reduction", time: D.fmtAgo(D.ago(23)), tag: "Correlation" },
    { icon: "problem", ai: true, text: "Flagged recurring DB pool exhaustion as PRB-220", time: D.fmtAgo(D.ago(60)), tag: "Pattern" },
    { icon: "trend", ai: true, text: "Predicted Redis memory pressure — 78% chance in next 2h", time: D.fmtAgo(D.ago(95)), tag: "Predictive" },
    { icon: "book", ai: true, text: "Drafted KB-501 from resolved incident INC-4810", time: D.fmtAgo(D.ago(140)), tag: "Knowledge" },
  ];
  return (
    <div className="card">
      <div className="card-h"><h3 className="row gap-2"><AiOrb size={20} />Synap activity</h3><span className="badge ai" style={{ fontSize: 10.5 }}>Autonomous</span></div>
      <div className="col" style={{ padding: "6px 16px 12px" }}>
        {items.map((it, i) => (
          <div key={i} className="row gap-3" style={{ padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-softer)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={it.icon} size={15} /></span>
            <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 13, lineHeight: 1.45 }}>{it.text}</span>
              <span className="row gap-2"><span className="badge ghost" style={{ fontSize: 10, padding: "2px 7px" }}>{it.tag}</span><span className="muted" style={{ fontSize: 11 }}>{it.time}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PredictiveCard({ onNavigate }) {
  const preds = [
    { svc: "prod-redis-cluster", risk: 78, when: "~2h", text: "Memory pressure → evictions likely to breach SLO", sev: "high" },
    { svc: "search-es-cluster", risk: 41, when: "~6h", text: "Index merge backlog may raise query latency", sev: "medium" },
  ];
  return (
    <div className="card">
      <div className="card-h"><h3 className="row gap-2"><Icon name="trend" size={17} className="muted" />Predictive alerts</h3><span className="badge" style={{ fontSize: 10.5 }}>Next 12h</span></div>
      <div className="col" style={{ padding: 14, gap: 10 }}>
        {preds.map((p) => (
          <div key={p.svc} className="row gap-3" style={{ padding: 12, borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="col center" style={{ width: 46, flexShrink: 0 }}>
              <div className="display" style={{ fontSize: 19, fontWeight: 700, color: p.sev === "high" ? "var(--high)" : "var(--warn)" }}>{p.risk}%</div>
              <div className="muted" style={{ fontSize: 10 }}>{p.when}</div>
            </div>
            <div className="vr" />
            <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.svc}</span>
              <span className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{p.text}</span>
            </div>
          </div>
        ))}
        <button className="btn sm ghost" style={{ alignSelf: "flex-start" }} onClick={() => onNavigate("monitoring")}>View monitoring <Icon name="arrowR" size={14} /></button>
      </div>
    </div>
  );
}

function Dashboard({ onNavigate, onAsk }) {
  const D = window.HELIX_DATA;
  const m = D.metrics;
  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      <div className="spread wrap gap-3">
        <div className="col" style={{ gap: 3 }}>
          <h2 className="display" style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Good afternoon, Alex</h2>
          <span className="muted" style={{ fontSize: 13.5 }}>Northwind Production · {D.now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {D.fmtTime(D.now)}</span>
        </div>
        <div className="row gap-2">
          <button className="btn" onClick={() => onAsk("Summarize current status")}><Icon name="sparkles" size={15} />Daily brief</button>
          <button className="btn primary" onClick={() => onNavigate("aiops")}><Icon name="pulse" size={15} />Event console</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Open incidents" value={m.openIncidents} sub={m.p1 + " P1 active"} icon="alert" accent="var(--critical)" />
        <StatCard label="Median MTTR" value={m.mttrMins + "m"} trend={m.mttrTrend} trendGood={true} sub="vs last week" icon="clock" spark={[60, 55, 48, 52, 44, 38, 41]} />
        <StatCard label="Noise reduced" value={m.noiseReduction + "%"} sub="540 → 18 incidents" icon="pulse" accent="var(--accent)" />
        <StatCard label="Auto-resolved" value={m.autoResolvedPct + "%"} sub={m.autoResolved + " today"} icon="sparkles" accent="var(--ok)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="col gap-4">
          <HeroIncidentCard onOpen={() => onNavigate("incidents")} onResolve={() => onAsk("Draft a fix for checkout")} />
          <div className="card">
            <div className="card-h"><h3 className="row gap-2"><Icon name="server" size={17} className="muted" />Service health</h3><button className="btn ghost sm" onClick={() => onNavigate("servicemap")}>Service map <Icon name="arrowR" size={14} /></button></div>
            <div className="col" style={{ padding: "4px 16px 12px" }}>
              {D.services.slice(0, 6).map((s) => <ServiceHealthRow key={s.id} svc={s} onClick={() => onNavigate("servicemap")} />)}
            </div>
          </div>
        </div>
        <div className="col gap-4">
          <AiActivityFeed />
          <PredictiveCard onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
