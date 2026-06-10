/* ============================================================
   HELIX — shared UI primitives
   ============================================================ */

function Avatar({ person, size = 30 }) {
  const p = person || {};
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4, background: p.color || "var(--accent)" }} title={p.name}>
      {p.initials}
    </span>
  );
}

function SevBadge({ sev, children }) {
  const map = { critical: "Critical", high: "High", medium: "Medium", warn: "Warning", low: "Low", info: "Info", ok: "OK" };
  return <span className={"badge sev-" + sev}><span className="dot" />{children || map[sev] || sev}</span>;
}

const HEALTH = {
  critical: { c: "var(--critical)", l: "Critical" },
  degraded: { c: "var(--warn)", l: "Degraded" },
  healthy: { c: "var(--ok)", l: "Healthy" },
};
function HealthDot({ health, label = false }) {
  const h = HEALTH[health] || HEALTH.healthy;
  return (
    <span className="row gap-2" style={{ color: h.c, fontWeight: 600, fontSize: 12.5 }}>
      <span className={"dot" + (health === "critical" ? " pulse-dot" : "")} style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      {label && <span style={{ color: "var(--ink-2)" }}>{h.l}</span>}
    </span>
  );
}

function Sparkline({ data, w = 90, h = 28, color = "var(--accent)", fill = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 4) - 2]);
  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const gid = "sg" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, sub, trend, trendGood, icon, accent, spark }) {
  const up = trend != null && trend > 0;
  const good = trendGood != null ? trendGood : !up;
  return (
    <div className="card pad col gap-3" style={{ minHeight: 116, justifyContent: "space-between" }}>
      <div className="spread">
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {icon && <span style={{ color: accent || "var(--accent)" }}><Icon name={icon} size={16} /></span>}
      </div>
      <div className="row gap-3" style={{ alignItems: "flex-end" }}>
        <div className="display" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
        {spark && <div style={{ marginBottom: 2 }}><Sparkline data={spark} color={accent || "var(--accent)"} /></div>}
      </div>
      <div className="row gap-2" style={{ fontSize: 12 }}>
        {trend != null && (
          <span className="row gap-1" style={{ color: good ? "var(--ok)" : "var(--critical)", fontWeight: 700 }}>
            <Icon name={up ? "arrowUp" : "arrowDown"} size={13} stroke={2.5} />{Math.abs(trend)}%
          </span>
        )}
        <span className="muted">{sub}</span>
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange, size }) {
  return (
    <div className="tabs" style={{ background: "var(--surface-2)", padding: 3, borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return <button key={v} className={"tab" + (value === v ? " active" : "")} style={size === "sm" ? { padding: "5px 10px", fontSize: 12 } : {}} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

function AiOrb({ size = 28, active = false }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: "var(--ai-grad)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: active ? "var(--shadow-glow)" : "none", flexShrink: 0 }}>
      <Icon name="sparkles" size={size * 0.56} fill={true} />
    </span>
  );
}

function AiChip({ children, confidence }) {
  return (
    <span className="badge ai" style={{ fontSize: 11 }}>
      <Icon name="sparkles" size={11} fill={true} />{children}
      {confidence != null && <span style={{ opacity: 0.85, fontWeight: 700 }}>· {confidence}%</span>}
    </span>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div className="col center" style={{ padding: "60px 20px", textAlign: "center", color: "var(--muted)", gap: 10 }}>
      <span style={{ color: "var(--faint)" }}><Icon name={icon || "grid"} size={34} stroke={1.6} /></span>
      <div style={{ fontWeight: 700, color: "var(--ink-2)", fontSize: 15 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, maxWidth: 360 }}>{sub}</div>}
    </div>
  );
}

// Animated number that counts toward target
function CountUp({ to, dur = 900, decimals = 0, suffix = "" }) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(to * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{v.toFixed(decimals)}{suffix}</span>;
}

Object.assign(window, { Avatar, SevBadge, HealthDot, Sparkline, StatCard, Segmented, AiOrb, AiChip, Empty, CountUp });
