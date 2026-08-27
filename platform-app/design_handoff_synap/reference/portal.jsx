/* ============================================================
   SYNAP — End-user self-service portal (flow 1: zero-ticket)
   ============================================================ */

const PORTAL_SCENARIO = {
  trigger: "My laptop VPN keeps disconnecting every few minutes",
  steps: [
    { type: "ai", text: "Hi Sam 👋 I pulled the diagnostics from your **MacBook Pro (SW-MBP-14)** — I can see what's happening." },
    { type: "diag" },
    { type: "ai", text: "Your VPN client is **3 versions behind** and is conflicting with a DNS setting changed by a recent OS update. I can fix both for you right now — no IT ticket needed." },
    { type: "fix" },
  ],
};

function PortalDiag() {
  return (
    <div className="card" style={{ background: "var(--surface-2)", padding: 14, margin: "2px 0 10px" }}>
      <div className="row gap-2" style={{ marginBottom: 10 }}><Icon name="laptop" size={16} className="muted" /><span style={{ fontWeight: 700, fontSize: 13 }}>SW-MBP-14 · diagnostics</span><span className="badge sev-warn" style={{ fontSize: 10.5, marginLeft: "auto" }}>2 issues found</span></div>
      <div className="col gap-2">
        {[["VPN client version", "v4.2.1 — outdated", "warn"], ["DNS resolver", "Conflict detected", "critical"], ["Network adapter", "Healthy", "ok"], ["Disk / memory", "Healthy", "ok"]].map(([k, v, s]) => (
          <div key={k} className="spread" style={{ fontSize: 12.5 }}><span className="muted">{k}</span><span className={"badge sev-" + s} style={{ fontSize: 10.5 }}>{v}</span></div>
        ))}
      </div>
    </div>
  );
}

function PortalFix({ onApply, state }) {
  const fixes = ["Update VPN client to v4.5.0", "Reset DNS resolver to managed profile", "Reconnect & verify tunnel stability"];
  return (
    <div className="ai-surface" style={{ borderRadius: "var(--r-md)", padding: 14, margin: "2px 0 10px" }}>
      <span style={{ fontWeight: 700, fontSize: 13 }}>Recommended fix</span>
      <div className="col gap-2" style={{ margin: "10px 0" }}>
        {fixes.map((f, i) => (
          <div key={i} className="row gap-2" style={{ fontSize: 12.5 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: state === "done" ? "var(--ok)" : "var(--accent-soft)", color: state === "done" ? "#fff" : "var(--accent-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{state === "done" ? <Icon name="check" size={11} /> : i + 1}</span>
            <span className="ink2">{f}</span>
          </div>
        ))}
      </div>
      {state === "idle" && <button className="btn ai block" onClick={onApply}><Icon name="bolt" size={14} fill={true} />Apply fix automatically</button>}
      {state === "running" && <div className="row gap-2 center" style={{ color: "var(--accent)", padding: 6 }}><span className="typing"><span /><span /><span /></span><span style={{ fontSize: 12.5, fontWeight: 600 }}>Applying fix…</span></div>}
      {state === "done" && (
        <div className="fade-in col gap-2">
          <div className="row gap-2" style={{ color: "var(--ok)" }}><Icon name="checkCircle" size={18} /><span style={{ fontWeight: 700, fontSize: 13.5 }}>Fixed! Your VPN is stable.</span></div>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--muted)", background: "var(--ok-soft)", padding: "8px 10px", borderRadius: 8 }}><Icon name="sparkles" size={14} style={{ color: "var(--ok)" }} />Resolved in 40 seconds — <b style={{ color: "var(--ink-2)" }}>no ticket needed</b>. We saved you a ~2-day wait.</div>
        </div>
      )}
    </div>
  );
}

function PortalBubble({ m, fixState, onApply }) {
  if (m.type === "user") return <div className="row" style={{ justifyContent: "flex-end" }}><div style={{ background: "var(--accent)", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14, maxWidth: "80%" }}>{m.text}</div></div>;
  return (
    <div className="row gap-2" style={{ alignItems: "flex-start" }}>
      <AiOrb size={28} />
      <div className="col grow" style={{ minWidth: 0, maxWidth: "85%" }}>
        {m.text && <p style={{ margin: "4px 0 8px", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }} dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--ink)">$1</b>') }} />}
        {m.type === "diag" && <PortalDiag />}
        {m.type === "fix" && <PortalFix state={fixState} onApply={onApply} />}
      </div>
    </div>
  );
}

function EndUserPortal({ theme, toggleTheme, onExit }) {
  const D = window.HELIX_DATA;
  const sam = D.personById("u6");
  const [mode, setMode] = React.useState("home"); // home | chat
  const [msgs, setMsgs] = React.useState([]);
  const [fixState, setFixState] = React.useState("idle");
  const [thinking, setThinking] = React.useState(false);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef(null);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, thinking, fixState]);

  const start = (text) => {
    setMode("chat");
    setMsgs([{ type: "user", text }]);
    let i = 0; setThinking(true);
    const push = () => {
      if (i >= PORTAL_SCENARIO.steps.length) { setThinking(false); return; }
      setThinking(false);
      const step = PORTAL_SCENARIO.steps[i];
      setMsgs((m) => [...m, step]);
      i++;
      if (i < PORTAL_SCENARIO.steps.length) { setThinking(true); setTimeout(push, 1100); }
    };
    setTimeout(push, 1100);
  };
  const applyFix = () => { setFixState("running"); setTimeout(() => setFixState("done"), 2200); };

  const chips = ["My VPN keeps disconnecting", "Reset my password", "Request a new laptop", "Install Figma"];

  return (
    <div className="col" style={{ height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      {/* portal topbar */}
      <header className="row spread" style={{ height: 60, padding: "0 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div className="row gap-2"><BrandMark size={26} /><span className="badge" style={{ fontSize: 10.5, marginLeft: 4 }}>Help Center</span></div>
        <div className="row gap-2">
          <button className="btn ghost sm" onClick={onExit}><Icon name="logout" size={15} />Agent view</button>
          <button className="iconbtn" onClick={toggleTheme}><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></button>
          <Avatar person={sam} size={32} />
        </div>
      </header>

      {mode === "home" ? (
        <div className="col grow" style={{ overflowY: "auto" }}>
          <div className="col center" style={{ padding: "64px 24px 40px", textAlign: "center" }}>
            <AiOrb size={56} active={true} />
            <h1 className="display" style={{ fontSize: 34, fontWeight: 600, margin: "20px 0 8px", letterSpacing: "-0.025em" }}>Hi Sam, how can I help?</h1>
            <p className="muted" style={{ fontSize: 16, margin: "0 0 28px", maxWidth: 460 }}>Describe any IT issue and I'll try to fix it instantly — no ticket, no waiting.</p>

            <div style={{ width: "100%", maxWidth: 600 }}>
              <div className="row gap-2 ai-ring" style={{ background: "var(--surface)", border: "1px solid var(--accent-border)", borderRadius: "var(--r-lg)", padding: "8px 8px 8px 16px" }}>
                <Icon name="sparkles" size={18} style={{ color: "var(--accent)" }} />
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && input.trim() && start(input)} placeholder="e.g. my VPN keeps disconnecting…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 15, color: "var(--ink)" }} />
                <button className="btn ai" onClick={() => start(input.trim() || chips[0])}>Ask Synap <Icon name="arrowR" size={15} /></button>
              </div>
              <div className="row gap-2 wrap center" style={{ marginTop: 16 }}>
                {chips.map((c) => <button key={c} className="btn sm" style={{ borderRadius: "var(--r-full)" }} onClick={() => start(c)}>{c}</button>)}
              </div>
            </div>
          </div>

          {/* assets + popular */}
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "8px 24px 48px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-h"><h3 className="row gap-2"><Icon name="laptop" size={16} className="muted" />Your devices</h3></div>
              <div className="col" style={{ padding: 10, gap: 4 }}>
                {[["MacBook Pro 14\"", "SW-MBP-14", "warn", "VPN issue detected"], ["iPhone 15", "SW-IPH-15", "ok", "Healthy"], ["Dell Monitor", "SW-MON-02", "ok", "Healthy"]].map(([n, id, s, note]) => (
                  <div key={id} className="row gap-3 clickable-row" style={{ padding: "10px 8px", borderRadius: "var(--r-sm)", cursor: s === "warn" ? "pointer" : "default" }} onClick={() => s === "warn" && start(chips[0])}>
                    <HealthDot health={s === "warn" ? "degraded" : "healthy"} />
                    <div className="col grow" style={{ gap: 1, minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{n}</span><span className="mono muted" style={{ fontSize: 11 }}>{id}</span></div>
                    <span className={s === "warn" ? "badge sev-warn" : "badge"} style={{ fontSize: 10.5 }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3 className="row gap-2"><Icon name="book" size={16} className="muted" />Popular help</h3></div>
              <div className="col" style={{ padding: 10, gap: 2 }}>
                {D.knowledge.map((k) => (
                  <div key={k.id} className="row gap-3 clickable-row" style={{ padding: "10px 8px", borderRadius: "var(--r-sm)", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <span className="muted"><Icon name="doc" size={15} /></span>
                    <span className="grow" style={{ fontSize: 12.5, fontWeight: 500 }}>{k.title}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{k.views}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="col grow center" style={{ overflow: "hidden", padding: "0 16px" }}>
          <div className="col" style={{ width: "100%", maxWidth: 640, height: "100%" }}>
            <div ref={scrollRef} className="col grow" style={{ overflowY: "auto", padding: "24px 4px", gap: 16 }}>
              {msgs.map((m, i) => <PortalBubble key={i} m={m} fixState={fixState} onApply={applyFix} />)}
              {thinking && <div className="row gap-2"><AiOrb size={28} /><div className="row gap-2" style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 12, color: "var(--muted)" }}><span className="typing" style={{ color: "var(--accent)" }}><span /><span /><span /></span><span style={{ fontSize: 12.5 }}>Reading device diagnostics…</span></div></div>}
            </div>
            <div className="row gap-2" style={{ padding: "12px 0 18px" }}>
              <button className="btn sm" onClick={() => { setMode("home"); setMsgs([]); setFixState("idle"); }}><Icon name="chevL" size={14} />Home</button>
              <div className="row gap-2 grow" style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", padding: "4px 4px 4px 14px" }}>
                <input placeholder="Reply to Synap…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13.5, color: "var(--ink)" }} />
                <button className="btn ai sm" style={{ width: 32, height: 32, padding: 0 }}><Icon name="send" size={15} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.EndUserPortal = EndUserPortal;
