/* ============================================================
   HELIX — app shell (sidebar + topbar)
   ============================================================ */

const NAV = [
  { group: "Operate", items: [
    { id: "dashboard", label: "Ops Dashboard", icon: "grid" },
    { id: "aiops", label: "AIOps Events", icon: "pulse", badge: "47", badgeKind: "ai" },
    { id: "incidents", label: "Incidents", icon: "alert", badge: "5" },
    { id: "monitoring", label: "Monitoring", icon: "chart" },
  ]},
  { group: "Self-Service", items: [
    { id: "knowledge", label: "Knowledge Base", icon: "book" },
    { id: "portal", label: "End-user Portal", icon: "sparkles", badgeKind: "ai" },
  ]},
  { group: "Inventory", items: [
    { id: "cmdb", label: "CMDB / Discovery", icon: "cube" },
    { id: "servicemap", label: "Service Map", icon: "topology" },
    { id: "cloud", label: "Cloud & Infra", icon: "cloud" },
    { id: "assets", label: "Assets", icon: "laptop" },
  ]},
  { group: "Insights", items: [
    { id: "analytics", label: "Analytics", icon: "chart" },
    { id: "admin", label: "Admin", icon: "gear" },
  ]},
];

function Sidebar({ view, setView }) {
  return (
    <aside className="col" style={{ width: "var(--sidebar-w)", flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)", height: "100%" }}>
      <div className="row" style={{ height: 60, padding: "0 18px", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <BrandMark size={28} />
      </div>

      {/* Workspace switcher */}
      <div style={{ padding: "12px 12px 6px" }}>
        <button className="row gap-2 spread" style={{ width: "100%", padding: "9px 10px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", background: "var(--surface-2)", color: "var(--ink)" }}>
          <span className="row gap-2">
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "oklch(0.6 0.15 250)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>N</span>
            <span className="col" style={{ alignItems: "flex-start", lineHeight: 1.1 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Northwind</span>
              <span className="muted" style={{ fontSize: 11 }}>Production</span>
            </span>
          </span>
          <Icon name="chevD" size={14} className="muted" />
        </button>
      </div>

      <nav className="col grow" style={{ padding: "6px 12px", overflowY: "auto", gap: 2 }}>
        {NAV.map((g) => (
          <div key={g.group} className="col" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--faint)", padding: "0 10px 6px" }}>{g.group}</div>
            {g.items.map((it) => {
              const active = view === it.id;
              return (
                <button key={it.id} onClick={() => setView(it.id)} className="row gap-2 spread"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1px solid transparent",
                    background: active ? "var(--accent-softer)" : "transparent", color: active ? "var(--accent)" : "var(--ink-2)",
                    fontWeight: active ? 700 : 500, fontSize: 13.5, transition: "all 0.12s", textAlign: "left",
                    borderColor: active ? "var(--accent-border)" : "transparent" }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <span className="row gap-2"><Icon name={it.icon} size={17} stroke={active ? 2.2 : 1.9} /><span style={{ whiteSpace: "nowrap" }}>{it.label}</span></span>
                  {it.badge && <span className={"badge " + (it.badgeKind === "ai" ? "ai" : "")} style={{ padding: "2px 7px", fontSize: 10.5, ...(it.badgeKind !== "ai" ? { background: active ? "var(--accent-soft)" : "var(--surface-2)", color: active ? "var(--accent-strong)" : "var(--muted)", border: "none" } : {}) }}>{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <div className="ai-surface" style={{ borderRadius: "var(--r-md)", padding: 12 }}>
          <div className="row gap-2" style={{ marginBottom: 6 }}><AiOrb size={22} /><span style={{ fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap" }}>Synap is listening</span></div>
          <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>18,420 signals processed today · 540 correlated · 312 auto-resolved.</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onPalette, onCopilot, theme, toggleTheme, view, setPersona }) {
  const D = window.HELIX_DATA;
  const titles = {
    dashboard: "Ops Dashboard", aiops: "AIOps Event Console", incidents: "Incidents", problems: "Problems",
    catalog: "Service Catalog", requests: "Requests", changes: "Change Management", knowledge: "Knowledge Base",
    cmdb: "CMDB", servicemap: "Service Map", analytics: "Analytics", admin: "Admin & Settings",
  };
  return (
    <header className="row spread" style={{ height: 60, padding: "0 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, gap: 16 }}>
      <div className="row gap-3">
        <h1 className="display" style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>{titles[view] || "Helix"}</h1>
      </div>

      <button onClick={onPalette} className="row gap-2 spread" style={{ flex: "0 1 420px", minWidth: 200, padding: "8px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted)" }}>
        <span className="row gap-2"><Icon name="search" size={16} /><span style={{ fontSize: 13, whiteSpace: "nowrap" }}>Search or ask Synap…</span></span>
        <span className="kbd">⌘K</span>
      </button>

      <div className="row gap-2">
        <Segmented size="sm" value="agent" onChange={(v) => v === "employee" && setPersona && setPersona("enduser")}
          options={[{ value: "agent", label: "Agent" }, { value: "employee", label: "Employee" }]} />
        <div className="vr" style={{ height: 22, margin: "0 2px" }} />
        <button className="btn ai sm" onClick={onCopilot} style={{ padding: "8px 12px" }}><Icon name="sparkles" size={15} fill={true} />Ask Synap</button>
        <button className="iconbtn" onClick={toggleTheme} title="Toggle theme"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></button>
        <button className="iconbtn" title="Notifications" style={{ position: "relative" }}>
          <Icon name="bell" size={18} />
          <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: "var(--critical)", border: "2px solid var(--surface)" }} />
        </button>
        <div className="vr" style={{ height: 24, margin: "0 4px" }} />
        <button className="row gap-2" style={{ background: "transparent", border: "none", padding: "3px 4px" }}>
          <Avatar person={D.me} size={32} />
          <Icon name="chevD" size={14} className="muted" />
        </button>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, Topbar, NAV });
