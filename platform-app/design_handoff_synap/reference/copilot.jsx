/* ============================================================
   HELIX — global Copilot panel + Command palette
   ============================================================ */

// Scripted "AI" responses so the demo feels alive
const COPILOT_REPLIES = [
  { match: /root cause|rca|why|cause/i, blocks: [
    { type: "text", text: "The probable root cause of **INC-4821** is **connection-pool exhaustion on prod-postgres-01**." },
    { type: "rca" },
    { type: "text", text: "A 3.2× traffic surge at 14:07 UTC drove checkout connections past the 200 max. Want me to open the remediation runbook?" },
    { type: "actions", actions: ["Open runbook", "Show DB metrics", "Page the DBA"] },
  ]},
  { match: /resolve|fix|remediat|runbook|scale/i, blocks: [
    { type: "text", text: "Here's the remediation plan I'd recommend for **INC-4821**:" },
    { type: "plan" },
    { type: "text", text: "Estimated recovery is **~4 minutes**. This needs one human approval before I execute." },
    { type: "actions", actions: ["Approve & run", "Edit plan", "Assign to Maya"] },
  ]},
  { match: /summar|status|brief|update|happening/i, blocks: [
    { type: "text", text: "**Right now across Northwind Production:**" },
    { type: "summary" },
    { type: "actions", actions: ["Open INC-4821", "View all incidents"] },
  ]},
  { match: /change|deploy|risk/i, blocks: [
    { type: "text", text: "**CHG-1042** (increase max_connections + add read replica) has an AI risk score of **32% — Medium**. Similar changes succeeded 14/15 times. The one failure lacked a rollback window." },
    { type: "actions", actions: ["Approve change", "Add rollback step", "View change"] },
  ]},
  { match: /.*/, blocks: [
    { type: "text", text: "I can help across your whole estate — incidents, changes, the CMDB, knowledge, and service requests. Try one of these:" },
    { type: "actions", actions: ["Summarize current status", "What caused INC-4821?", "Draft a fix for checkout"] },
  ]},
];

function CopilotBlock({ block, onAction }) {
  const D = window.HELIX_DATA;
  if (block.type === "text") {
    const html = block.text.replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--ink)">$1</b>');
    return <p style={{ margin: "0 0 8px", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (block.type === "actions") {
    return <div className="row gap-2 wrap" style={{ margin: "4px 0 10px" }}>{block.actions.map((a) => (
      <button key={a} className="btn sm" onClick={() => onAction(a)} style={{ borderColor: "var(--accent-border)", color: "var(--accent-strong)", background: "var(--accent-softer)" }}>{a}</button>
    ))}</div>;
  }
  if (block.type === "rca") {
    return (
      <div className="card pad col gap-2" style={{ margin: "2px 0 10px", background: "var(--surface-2)" }}>
        {[["prod-postgres-01 connections", "200 / 200", "critical"], ["Traffic surge", "3.2× baseline", "high"], ["Checkout error rate", "38%", "critical"]].map(([k, v, s]) => (
          <div key={k} className="spread"><span className="muted" style={{ fontSize: 12.5 }}>{k}</span><span className={"badge sev-" + s} style={{ fontSize: 11 }}>{v}</span></div>
        ))}
        <div className="row gap-2" style={{ marginTop: 4 }}><AiChip confidence={91}>Confidence</AiChip></div>
      </div>
    );
  }
  if (block.type === "plan") {
    return (
      <div className="col gap-2" style={{ margin: "2px 0 10px" }}>
        {["Scale connection pool 200 → 500 on prod-postgres-01", "Promote read replica & route read traffic", "Restart 3 checkout pods in CrashLoopBackOff", "Verify SLO recovery & close incident"].map((s, i) => (
          <div key={i} className="row gap-2" style={{ fontSize: 13 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ color: "var(--ink-2)" }}>{s}</span>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "summary") {
    return (
      <div className="card pad col gap-2" style={{ margin: "2px 0 10px", background: "var(--surface-2)" }}>
        {[["1 P1 incident", "INC-4821 · checkout", "critical"], ["4 other open incidents", "all P2–P4", "info"], ["1 change awaiting approval", "CHG-1042", "warn"], ["312 requests auto-resolved today", "64% deflection", "ok"]].map(([k, v, s]) => (
          <div key={k} className="spread"><span style={{ fontSize: 13, fontWeight: 600 }}>{k}</span><span className={"badge sev-" + s} style={{ fontSize: 11 }}>{v}</span></div>
        ))}
      </div>
    );
  }
  return null;
}

function Copilot({ open, onClose, onNavigate, seed }) {
  const [msgs, setMsgs] = React.useState([
    { role: "ai", blocks: [
      { type: "text", text: "Hi Alex 👋 I'm **Synap**. I'm monitoring Northwind Production in real time. There's **1 active P1** right now." },
      { type: "actions", actions: ["What's happening right now?", "What caused INC-4821?", "Draft a fix"] },
    ]},
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, thinking]);
  React.useEffect(() => { if (seed && open) { send(seed.split("\u0000")[0]); } }, [seed]);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput(""); setThinking(true);
    setTimeout(() => {
      const reply = COPILOT_REPLIES.find((r) => r.match.test(text)) || COPILOT_REPLIES[COPILOT_REPLIES.length - 1];
      setThinking(false);
      setMsgs((m) => [...m, { role: "ai", blocks: reply.blocks }]);
    }, 1100);
  };

  const onAction = (a) => {
    if (/open inc|open runbook|view all inc/i.test(a)) { onNavigate && onNavigate("incidents"); }
    if (/view change|approve change/i.test(a)) { onNavigate && onNavigate("changes"); }
    if (/metrics|db metrics/i.test(a)) { onNavigate && onNavigate("aiops"); }
    send(a);
  };

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.2 0.02 270 / 0.35)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s", zIndex: 60 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, maxWidth: "92vw", background: "var(--surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", transform: open ? "none" : "translateX(105%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", zIndex: 61, display: "flex", flexDirection: "column" }}>
        <div className="row spread" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div className="row gap-2"><AiOrb size={30} active={true} /><div className="col" style={{ lineHeight: 1.15 }}><span className="display" style={{ fontWeight: 700, fontSize: 15 }}>Synap Copilot</span><span className="row gap-1" style={{ fontSize: 11.5, color: "var(--ok)", fontWeight: 600 }}><span className="dot pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />Live · monitoring</span></div></div>
          <button className="iconbtn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div ref={scrollRef} className="col grow" style={{ padding: 16, overflowY: "auto", gap: 14 }}>
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="row" style={{ justifyContent: "flex-end" }}>
              <div style={{ background: "var(--accent)", color: "#fff", padding: "9px 13px", borderRadius: "14px 14px 4px 14px", fontSize: 13.5, maxWidth: "82%", lineHeight: 1.5 }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} className="row gap-2" style={{ alignItems: "flex-start" }}>
              <AiOrb size={26} />
              <div className="col grow" style={{ minWidth: 0 }}>{m.blocks.map((b, j) => <CopilotBlock key={j} block={b} onAction={onAction} />)}</div>
            </div>
          ))}
          {thinking && <div className="row gap-2"><AiOrb size={26} /><div className="row gap-2" style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 12, color: "var(--muted)" }}><span className="typing" style={{ color: "var(--accent)" }}><span /><span /><span /></span><span style={{ fontSize: 12.5 }}>Analyzing telemetry…</span></div></div>}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
          <div className="row gap-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", padding: "6px 6px 6px 12px" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask Synap or give an instruction…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13.5, color: "var(--ink)" }} />
            <button className="btn ai sm" onClick={() => send(input)} style={{ width: 34, height: 34, padding: 0 }}><Icon name="send" size={16} /></button>
          </div>
          <div className="muted" style={{ fontSize: 10.5, textAlign: "center", marginTop: 8 }}>Synap can take actions on your behalf — you stay in control with approvals.</div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ---------- Command palette ----------
const PALETTE_CMDS = [
  { id: "dashboard", label: "Go to Ops Dashboard", icon: "grid", kind: "Navigate" },
  { id: "aiops", label: "Go to AIOps Events", icon: "pulse", kind: "Navigate" },
  { id: "incidents", label: "Go to Incidents", icon: "alert", kind: "Navigate" },
  { id: "changes", label: "Go to Changes", icon: "change", kind: "Navigate" },
  { id: "cmdb", label: "Go to CMDB", icon: "cube", kind: "Navigate" },
  { id: "knowledge", label: "Go to Knowledge", icon: "book", kind: "Navigate" },
];
const PALETTE_AI = [
  "What caused INC-4821?", "Summarize current status", "Draft a fix for checkout", "Show high-risk changes this week",
];

function CommandPalette({ open, onClose, onNavigate, onAsk }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => { if (open && inputRef.current) setTimeout(() => inputRef.current.focus(), 50); if (!open) setQ(""); }, [open]);
  if (!open) return null;
  const cmds = PALETTE_CMDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  const ai = q.trim() ? [q] : PALETTE_AI;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.2 0.02 270 / 0.4)", zIndex: 80, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "12vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 560, maxWidth: "92vw", background: "var(--surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div className="row gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={18} className="muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or ask Synap…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 15, color: "var(--ink)" }}
            onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) { onAsk(q); onClose(); } if (e.key === "Escape") onClose(); }} />
          <span className="kbd">esc</span>
        </div>
        <div className="col" style={{ maxHeight: 380, overflowY: "auto", padding: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--faint)", padding: "8px 10px 4px" }}>Ask Synap AI</div>
          {ai.map((a, i) => (
            <button key={i} onClick={() => { onAsk(a); onClose(); }} className="row gap-3" style={{ width: "100%", padding: "10px 10px", borderRadius: "var(--r-sm)", border: "none", background: "transparent", textAlign: "left", color: "var(--ink)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-softer)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <AiOrb size={24} /><span style={{ fontSize: 13.5, flex: 1 }}>{a}</span><Icon name="arrowR" size={15} className="muted" />
            </button>
          ))}
          {cmds.length > 0 && <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--faint)", padding: "12px 10px 4px" }}>Navigate</div>}
          {cmds.map((c) => (
            <button key={c.id} onClick={() => { onNavigate(c.id); onClose(); }} className="row gap-3" style={{ width: "100%", padding: "10px 10px", borderRadius: "var(--r-sm)", border: "none", background: "transparent", textAlign: "left", color: "var(--ink)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span className="muted"><Icon name={c.icon} size={17} /></span><span style={{ fontSize: 13.5, flex: 1 }}>{c.label}</span><span className="badge ghost" style={{ fontSize: 10.5 }}>{c.kind}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Copilot, CommandPalette });
