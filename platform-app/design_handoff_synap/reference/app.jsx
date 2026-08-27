/* ============================================================
   SYNAP — root app: auth gate, routing, theme, persona
   ============================================================ */

function ComingSoon({ view }) {
  return <Empty icon="cube" title={view + " — in this build"} sub="This module is scaffolded. Tell me to flesh it out next." />;
}

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidUpdate(prev) { if (prev.k !== this.props.k && this.state.err) this.setState({ err: null }); }
  render() {
    if (this.state.err) return <div className="col center" style={{ padding: 60, gap: 10 }}><Empty icon="alert" title="This view hit a snag" sub={String(this.state.err.message || this.state.err)} /><button className="btn" onClick={() => this.setState({ err: null })}>Retry</button></div>;
    return this.props.children;
  }
}

function App() {
  const [authed, setAuthed] = React.useState(false);
  const [view, setView] = React.useState("dashboard");
  const [persona, setPersona] = React.useState("agent"); // agent | enduser
  const [theme, setTheme] = React.useState("light");
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [copilotSeed, setCopilotSeed] = React.useState(null);

  React.useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => { window.addEventListener("synap-brand", force); return () => window.removeEventListener("synap-brand", force); }, []);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((p) => !p); }
      if (e.key === "Escape") { setPaletteOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ask = (q) => { setCopilotSeed(q + "\u0000" + Date.now()); setCopilotOpen(true); };
  const navigate = (v) => { if (v === "portal") { setPersona("enduser"); return; } setView(v); };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  // End-user portal surface (separate persona)
  if (persona === "enduser") {
    const Portal = window.EndUserPortal;
    return <Boundary k="portal">{Portal ? <Portal theme={theme} toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} onExit={() => setPersona("agent")} /> : <ComingSoon view="portal" />}</Boundary>;
  }

  const views = {
    dashboard: window.Dashboard,
    aiops: window.AiopsConsole,
    incidents: window.Incidents,
    monitoring: window.Monitoring,
    knowledge: window.Knowledge,
    cmdb: window.Cmdb,
    servicemap: window.ServiceMap,
    cloud: window.CloudInventory,
    assets: window.Assets,
    analytics: window.Analytics,
    admin: window.Admin,
  };
  const View = views[view];

  return (
    <div className="row" style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar view={view} setView={setView} />
      <div className="col grow" style={{ minWidth: 0, height: "100%" }}>
        <Topbar view={view} setPersona={setPersona} theme={theme}
          toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onPalette={() => setPaletteOpen(true)} onCopilot={() => setCopilotOpen(true)} />
        <main className="grow" style={{ overflowY: "auto", background: "var(--bg)" }}>
          <Boundary k={view}>{View ? <View onNavigate={navigate} onAsk={ask} /> : <ComingSoon view={view} />}</Boundary>
        </main>
      </div>

      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} onNavigate={navigate} seed={copilotSeed} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={navigate} onAsk={ask} />

      {window.SynapTweaks && <window.SynapTweaks theme={theme} setTheme={setTheme} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
