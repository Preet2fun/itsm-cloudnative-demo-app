/* ============================================================
   HELIX — authentication (login + SSO + workspace)
   ============================================================ */

function BrandMark({ size = 30, mono = false }) {
  return (
    <span className="row gap-2" style={{ alignItems: "center" }}>
      <span style={{ width: size, height: size, borderRadius: size * 0.28, background: "var(--ai-grad)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-glow)" }}>
        <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 11 11 4M12 11 20 9M12 11 17 19M12 11 5 17" />
          <circle cx="12" cy="11" r="2.7" fill="#fff" stroke="none" />
          <circle cx="11" cy="4" r="1.6" fill="#fff" stroke="none" />
          <circle cx="20" cy="9" r="1.6" fill="#fff" stroke="none" />
          <circle cx="17" cy="19" r="1.6" fill="#fff" stroke="none" />
          <circle cx="5" cy="17" r="1.6" fill="#fff" stroke="none" />
        </svg>
      </span>
      {!mono && <span className="display" style={{ fontSize: size * 0.62, fontWeight: 700, letterSpacing: "-0.03em" }}>{window.HELIX_BRAND || "Synap"}</span>}
    </span>
  );
}

function SsoButton({ provider, onClick }) {
  const logos = {
    okta: <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#007dc1" strokeWidth="3.5" /></svg>,
    azure: <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2 3 20h5l4-9 4 9h5z" fill="#0078d4" /></svg>,
    google: <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.3-4.9 3.3-8.1Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z"/></svg>,
  };
  const labels = { okta: "Okta", azure: "Microsoft Azure AD", google: "Google Workspace" };
  return (
    <button className="btn block" style={{ justifyContent: "center", padding: "11px 14px", fontSize: 13.5 }} onClick={onClick}>
      {logos[provider]}<span>Continue with {labels[provider]}</span>
    </button>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = React.useState("login"); // login | sso | mfa
  const [email, setEmail] = React.useState("alex.morgan@northwind.io");
  const [pw, setPw] = React.useState("••••••••••");
  const [workspace, setWorkspace] = React.useState("northwind");
  const [loading, setLoading] = React.useState(false);
  const [mfaCode, setMfaCode] = React.useState("");
  const [provider, setProvider] = React.useState(null);

  const submitPw = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setMode("mfa"); }, 850);
  };
  const submitSso = (p) => {
    setProvider(p); setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1100);
  };
  const verifyMfa = () => {
    setLoading(true);
    setTimeout(() => onLogin(), 700);
  };

  return (
    <div className="row" style={{ height: "100%", minHeight: "100vh" }}>
      {/* Brand panel */}
      <div className="col" style={{ flex: "1 1 52%", background: "oklch(0.18 0.04 var(--accent-h))", color: "#fff", padding: "40px 52px", position: "relative", overflow: "hidden", justifyContent: "space-between", minHeight: "100vh" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1000px 600px at 70% -10%, oklch(0.5 0.2 var(--accent-h) / 0.55), transparent 60%), radial-gradient(800px 500px at 0% 110%, oklch(0.5 0.2 calc(var(--accent-h) + 50) / 0.4), transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "linear-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.04) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 75%)" }} />
        <div style={{ position: "relative" }}><BrandMark size={34} /></div>

        <div style={{ position: "relative", maxWidth: 460, padding: "28px 0" }}>
          <div className="badge ai" style={{ marginBottom: 20, background: "oklch(1 0 0 / 0.14)", color: "#fff" }}>
            <Icon name="sparkles" size={12} fill={true} />The AI nervous system for IT
          </div>
          <h1 className="display" style={{ fontSize: 38, lineHeight: 1.08, margin: "0 0 14px", fontWeight: 600, letterSpacing: "-0.03em" }}>
            The nervous system of your enterprise.
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "oklch(1 0 0 / 0.72)", margin: 0 }}>
            Traditional ITSM is a fractured mess of slow tickets. Synap instantly routes ITOM alerts to automated fixes — so issues resolve themselves, while your team stays in control.
          </p>
          <div className="row wrap" style={{ marginTop: 28, gap: 28 }}>
            {[["96%", "alert noise reduced"], ["41 min", "median MTTR"], ["64%", "auto-resolved"]].map(([n, l]) => (
              <div key={l} className="col" style={{ gap: 2 }}>
                <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>{n}</div>
                <div style={{ fontSize: 12, color: "oklch(1 0 0 / 0.6)", whiteSpace: "nowrap" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="row gap-2" style={{ position: "relative", fontSize: 12.5, color: "oklch(1 0 0 / 0.55)" }}>
          <Icon name="shield" size={14} /> SOC 2 Type II · ISO 27001 · GDPR-ready · Hosted on your Kubernetes
        </div>
      </div>

      {/* Form panel */}
      <div className="col center" style={{ flex: "1 1 48%", padding: "40px 24px", background: "var(--bg)" }}>
        <div className="col" style={{ width: "100%", maxWidth: 384 }}>
          {mode !== "mfa" ? (
            <React.Fragment>
              <h2 className="display" style={{ fontSize: 26, fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Sign in to Synap</h2>
              <p className="muted" style={{ margin: "0 0 26px", fontSize: 14 }}>Welcome back. Let's get your operations running.</p>

              <div className="col gap-3">
                <SsoButton provider="okta" onClick={() => submitSso("okta")} />
                <SsoButton provider="azure" onClick={() => submitSso("azure")} />
                <SsoButton provider="google" onClick={() => submitSso("google")} />
              </div>
              {loading && provider && <div className="row gap-2 muted" style={{ fontSize: 12.5, marginTop: 12, justifyContent: "center" }}><span className="typing" style={{ color: "var(--accent)" }}><span /><span /><span /></span> Redirecting to {provider}…</div>}

              <div className="row gap-3" style={{ margin: "22px 0" }}>
                <div className="hr grow" /><span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>or with email</span><div className="hr grow" />
              </div>

              <div className="col gap-3">
                <div>
                  <label className="field-label">Work email</label>
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div>
                  <div className="spread" style={{ marginBottom: 6 }}>
                    <label className="field-label" style={{ margin: 0 }}>Password</label>
                    <a style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }} href="#">Forgot?</a>
                  </div>
                  <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
                </div>
                <button className="btn primary block lg" style={{ marginTop: 4 }} disabled={loading && !provider} onClick={submitPw}>
                  {loading && !provider ? <span className="typing"><span /><span /><span /></span> : <React.Fragment>Sign in <Icon name="arrowR" size={16} /></React.Fragment>}
                </button>
              </div>

              <p className="muted" style={{ fontSize: 13, textAlign: "center", marginTop: 22 }}>
                New here? <a href="#" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Create a workspace</a>
              </p>
            </React.Fragment>
          ) : (
            <div className="fade-in col">
              <button className="btn ghost sm" style={{ alignSelf: "flex-start", marginBottom: 18, paddingLeft: 4 }} onClick={() => setMode("login")}><Icon name="chevL" size={15} /> Back</button>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="shield" size={22} /></div>
              <h2 className="display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px" }}>Two-factor authentication</h2>
              <p className="muted" style={{ margin: "0 0 24px", fontSize: 14 }}>Enter the 6-digit code from your authenticator app for <b style={{ color: "var(--ink-2)" }}>{email}</b>.</p>
              <div className="row gap-2" style={{ justifyContent: "space-between", marginBottom: 22 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input key={i} className="input mono" maxLength={1} value={mfaCode[i] || ""} onChange={(e) => {
                    const c = mfaCode.split(""); c[i] = e.target.value.slice(-1); setMfaCode(c.join(""));
                    if (e.target.value && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                  }} style={{ width: 50, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700, padding: 0 }} />
                ))}
              </div>
              <button className="btn primary block lg" onClick={verifyMfa} disabled={loading}>
                {loading ? <span className="typing"><span /><span /><span /></span> : "Verify & continue"}
              </button>
              <p className="muted" style={{ fontSize: 13, textAlign: "center", marginTop: 18 }}>Didn't get a code? <a href="#" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Resend</a></p>
            </div>
          )}

          <div className="row gap-2 center" style={{ marginTop: 34, fontSize: 12, color: "var(--faint)" }}>
            <Icon name="lock" size={12} /> Secured with end-to-end encryption
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, BrandMark });
