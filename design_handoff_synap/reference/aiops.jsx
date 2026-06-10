/* ============================================================
   SYNAP — AIOps Event Console (hero correlation flow)
   ============================================================ */

const RAW_EVENTS = (function () {
  const D = window.HELIX_DATA;
  const base = D.events.filter((e) => e.cluster === "A");
  const extra = [
    { id: "EV-9008", source: "Datadog", sev: "high", ci: "ci-db-prod", text: "DB CPU saturation 96% sustained", cluster: "A" },
    { id: "EV-9009", source: "Prometheus", sev: "warn", ci: "svc-orders", text: "orders queue lag rising (12k msgs)", cluster: "A" },
    { id: "EV-9010", source: "Sentry", sev: "high", ci: "svc-checkout", text: "504 Gateway Timeout burst (842 events)", cluster: "A" },
    { id: "EV-9011", source: "CloudWatch", sev: "warn", ci: "ci-k8s", text: "checkout HPA maxed at 20 replicas", cluster: "A" },
    { id: "EV-9013", source: "PagerDuty", sev: "high", ci: "svc-payments", text: "Synthetic payment check failing US-East", cluster: "A" },
    { id: "EV-9014", source: "Datadog", sev: "warn", ci: "ci-redis", text: "Redis connected_clients +220% spike", cluster: "A" },
  ];
  return [...base, ...extra];
})();

const SOURCE_COLORS = { Datadog: "#774aa4", Prometheus: "#e6522c", CloudWatch: "#ff9900", Sentry: "#362d59", PagerDuty: "#06ac38" };

function SourceTag({ source }) {
  return <span className="badge" style={{ fontSize: 10.5, padding: "2px 8px", color: SOURCE_COLORS[source] || "var(--muted)", borderColor: "var(--border)" }}><span className="dot" style={{ background: SOURCE_COLORS[source] }} />{source}</span>;
}

function EventRow({ ev, collapsing, delay }) {
  const D = window.HELIX_DATA;
  const ci = D.serviceById(ev.ci);
  return (
    <div className="row gap-3" style={{
      padding: "10px 14px", borderBottom: "1px solid var(--border)", alignItems: "center",
      transition: "all 0.5s ease", transitionDelay: delay + "ms",
      opacity: collapsing ? 0 : 1, transform: collapsing ? "translateX(40px) scale(0.96)" : "none",
    }}>
      <SevBadge sev={ev.sev}><span style={{ textTransform: "capitalize" }}>{ev.sev}</span></SevBadge>
      <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.text}</span>
        <span className="row gap-2"><SourceTag source={ev.source} /><span className="mono muted" style={{ fontSize: 11 }}>{ci.name}</span></span>
      </div>
      <span className="mono muted" style={{ fontSize: 11, flexShrink: 0 }}>{ev.id}</span>
    </div>
  );
}

// Visual: many nodes merging into one
function CorrelationViz({ phase }) {
  const dots = Array.from({ length: 24 });
  return (
    <div style={{ position: "relative", height: 180, margin: "8px 0" }}>
      {dots.map((_, i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        const r = 78;
        const x = 50 + (Math.cos(angle) * r) / 3.4;
        const y = 50 + (Math.sin(angle) * r) / 1.9;
        const merged = phase !== "storm";
        return (
          <span key={i} style={{
            position: "absolute", left: merged ? "50%" : x + "%", top: merged ? "50%" : y + "%",
            width: 9, height: 9, borderRadius: "50%",
            background: i % 4 === 0 ? "var(--critical)" : i % 3 === 0 ? "var(--high)" : "var(--warn)",
            transform: "translate(-50%,-50%)" + (merged ? " scale(0.4)" : " scale(1)"),
            opacity: merged ? 0 : 0.9,
            transition: "all 0.9s cubic-bezier(0.5,0,0.2,1)", transitionDelay: (i * 18) + "ms",
          }} />
        );
      })}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        transition: "all 0.6s ease", transitionDelay: "0.6s",
        opacity: phase === "correlated" ? 1 : 0, scale: phase === "correlated" ? "1" : "0.6",
      }}>
        <div className="col center gap-1" style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--ai-grad)", color: "#fff", boxShadow: "var(--shadow-glow)" }}>
          <Icon name="alert" size={24} />
          <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>INC-4821</span>
        </div>
      </div>
      {phase === "correlating" && <div className="col center" style={{ position: "absolute", inset: 0 }}><span className="typing" style={{ color: "var(--accent)" }}><span /><span /><span /></span></div>}
    </div>
  );
}

function AiopsConsole({ onNavigate, onAsk }) {
  const D = window.HELIX_DATA;
  const [phase, setPhase] = React.useState("storm"); // storm | correlating | correlated
  const [tab, setTab] = React.useState("stream");

  const correlate = () => {
    setPhase("correlating");
    setTimeout(() => setPhase("correlated"), 1900);
  };
  const reset = () => setPhase("storm");

  return (
    <div className="col gap-4 fade-in" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      {/* live stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard label="Signals today" value={<CountUp to={18420} />} sub="across 5 sources" icon="pulse" />
        <StatCard label="Correlated" value={<CountUp to={540} />} sub="into 18 incidents" icon="topology" accent="var(--accent)" />
        <StatCard label="Noise reduced" value="96%" sub="less alert fatigue" icon="bolt" accent="var(--ok)" />
        <StatCard label="Active storm" value="47" sub="alerts · last 90s" icon="alert" accent="var(--critical)" />
      </div>

      {/* Storm banner */}
      <div className="card" style={{ overflow: "hidden", borderColor: phase === "storm" ? "var(--critical-soft)" : "var(--accent-border)" }}>
        <div style={{ height: 3, background: phase === "storm" ? "var(--critical)" : "var(--ai-grad)" }} />
        <div className="pad row spread wrap gap-3">
          <div className="row gap-3">
            <span style={{ width: 42, height: 42, borderRadius: 11, background: phase === "storm" ? "var(--critical-soft)" : "var(--accent-softer)", color: phase === "storm" ? "var(--critical)" : "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={phase === "storm" ? "alert" : "checkCircle"} size={22} />
            </span>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{phase === "storm" ? "Alert storm detected" : "Storm correlated into 1 incident"}</span>
              <span className="muted" style={{ fontSize: 12.5 }}>{phase === "storm" ? "47 alerts from Datadog, Prometheus, CloudWatch, Sentry & PagerDuty in 90 seconds." : "Synap grouped 47 alerts using topology + temporal correlation — 97% noise reduced."}</span>
            </div>
          </div>
          {phase === "storm" ? (
            <button className="btn ai" onClick={correlate}><Icon name="sparkles" size={16} fill={true} />Correlate with Synap</button>
          ) : phase === "correlated" ? (
            <div className="row gap-2"><button className="btn" onClick={reset}><Icon name="refresh" size={15} />Replay</button><button className="btn primary" onClick={() => onNavigate("incidents")}>Open INC-4821 <Icon name="arrowR" size={15} /></button></div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Event stream */}
        <div className="card">
          <div className="card-h">
            <Segmented size="sm" value={tab} onChange={setTab} options={[{ value: "stream", label: "Raw events" }, { value: "incidents", label: "Correlated" }]} />
            <span className="row gap-1 muted" style={{ fontSize: 12 }}><span className="dot pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "inline-block", color: "var(--ok)" }} />Live</span>
          </div>
          {tab === "stream" ? (
            <div className="col" style={{ maxHeight: 440, overflowY: "auto" }}>
              {RAW_EVENTS.map((ev, i) => <EventRow key={ev.id} ev={ev} collapsing={phase !== "storm"} delay={i * 30} />)}
              {phase !== "storm" && <div className="col center" style={{ padding: 30, color: "var(--muted)", gap: 6 }}><Icon name="checkCircle" size={26} style={{ color: "var(--ok)" }} /><span style={{ fontSize: 13, fontWeight: 600 }}>All 47 alerts correlated into INC-4821</span></div>}
            </div>
          ) : (
            <div className="col" style={{ padding: 8 }}>
              {D.incidents.map((inc) => (
                <div key={inc.id} className="row gap-3 clickable-row" onClick={() => onNavigate("incidents")} style={{ padding: "12px 10px", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                  <SevBadge sev={inc.severity} />
                  <div className="col grow" style={{ gap: 1, minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.title}</span><span className="mono muted" style={{ fontSize: 11 }}>{inc.id} · {inc.correlatedEvents} alerts</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Correlation panel */}
        <div className="card pad col gap-2">
          <div className="row gap-2"><AiOrb size={22} active={phase === "correlating"} /><span style={{ fontWeight: 700, fontSize: 14 }}>Correlation engine</span></div>
          <CorrelationViz phase={phase} />
          {phase === "correlated" ? (
            <div className="col gap-2 fade-in">
              {[["Alerts grouped", "47"], ["Noise reduction", "97%"], ["Probable root cause", "DB pool exhaustion"], ["Confidence", "91%"]].map(([k, v]) => (
                <div key={k} className="spread" style={{ fontSize: 13 }}><span className="muted">{k}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
              ))}
              <button className="btn ai block" style={{ marginTop: 6 }} onClick={() => onAsk("Draft a fix for checkout")}><Icon name="bolt" size={15} fill={true} />Propose remediation</button>
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, textAlign: "center", margin: "0 8px" }}>
              {phase === "storm" ? "Synap clusters related alerts by service topology, timing and signature — turning noise into one actionable signal." : "Correlating across topology & time…"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

window.AiopsConsole = AiopsConsole;
