// Screens 01 + 01b — login and 6-digit verify.
// Contract: POST /auth/login -> {session_id}; POST /auth/mfa/send; POST /auth/mfa/verify -> {token}.
// No SSO. No tenant/workspace field. Tenant resolved server-side.

const { useState, useRef, useEffect, useCallback } = React;
const { BRAND, admin, fakeRequest } = window.HearthMock;

const RESEND_SECONDS = 30;

const panel = {
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-12)',
  padding: 'var(--space-10)', borderRight: '1px solid var(--border-default)', background: 'var(--bg-surface)'
};
const label = {
  fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.02em',
  textTransform: 'uppercase', color: 'var(--text-secondary)'
};
const field = {
  height: 'var(--control-lg)', padding: '0 var(--space-3)', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)', background: 'var(--bg-inset)',
  color: 'var(--text-primary)', fontSize: 'var(--text-body-md-size)'
};
const primary = disabled => ({
  height: 'var(--row-h-comfortable)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)',
  background: 'var(--neutral-100)', color: 'var(--text-inverse)', fontSize: 'var(--text-body-md-size)', fontWeight: 'var(--weight-semibold)',
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1,
  transition: 'filter var(--duration-fast) var(--ease-standard)'
});
const errorBox = {
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(245,56,94,0.3)', background: 'var(--danger-soft)',
  color: 'var(--danger)', fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)'
};

function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(420px,0.9fr)' }}>
      <div className="dotgrid" style={panel}>
        <div className="wordmark" style={{ fontSize: 'var(--text-heading-md-size)' }}>{BRAND}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 460 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-lg-size)', lineHeight: 'var(--text-display-lg-lh)', fontWeight: 'var(--weight-bold)', letterSpacing: '-0.025em', textWrap: 'pretty' }}>
            Every order, every location, one console.
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-body-lg-size)', lineHeight: 'var(--text-heading-sm-lh)', textWrap: 'pretty' }}>
            Menus, orders, deliveries, and payment reconciliation for restaurant groups running more than one kitchen.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {[['LOCATIONS', '3'], ['ORDERS TODAY', '218'], ['UPTIME', '99.9%']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--bg-canvas)', minWidth: 132 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', color: 'var(--text-tertiary)' }}>{k}</span>
              <span className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-md-size)', lineHeight: 'var(--text-heading-md-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.01em' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>{children}</div>
      </div>
    </div>
  );
}

function LoginForm({ onSession, onFoundations }) {
  const [email, setEmail] = useState(admin.email);
  const [password, setPassword] = useState('correct-horse-battery');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError(false);
    // POST /api/v1/auth/login -> { session_id }
    const { session_id } = await fakeRequest({ session_id: 'sess_' + Math.random().toString(36).slice(2, 10) });
    if (!password) { setBusy(false); setError(true); return; }
    // POST /api/v1/auth/mfa/send — fires with no visible step of its own
    await fakeRequest({ sent: true }, 120);
    setBusy(false);
    onSession({ sessionId: session_id, email });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-lg-size)', lineHeight: 'var(--text-heading-lg-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.015em' }}>Sign in</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>We'll email a 6-digit code to confirm it's you.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="email" style={label}>Email</label>
        <input id="email" type="email" autoComplete="username" style={field} value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="password" style={label}>Password</label>
        <input id="password" type="password" autoComplete="current-password" style={field} value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      {error && <div style={errorBox}>We couldn't sign you in with those details. Check the email and password and try again.</div>}
      <button type="submit" disabled={busy} style={primary(busy)}>{busy ? 'Sending code…' : 'Continue'}</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-body-sm-size)' }}>
        <a href="#">Forgot password</a>
        <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)' }}>POST /auth/login</span>
      </div>
      <button type="button" onClick={onFoundations} style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--text-tertiary)', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer', textDecoration: 'underline' }}>
        Design foundations
      </button>
    </form>
  );
}

function VerifyForm({ session, onToken, onRestart }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const refs = useRef([...Array(6)].map(() => React.createRef()));

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i, raw) => {
    const v = (raw || '').replace(/\D/g, '').slice(-1);
    setCode(prev => { const next = prev.slice(); next[i] = v; return next; });
    setError(false);
    if (v && i < 5) refs.current[i + 1].current?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1].current?.focus();
  };

  const complete = code.every(Boolean);

  const submit = async e => {
    e.preventDefault();
    const entered = code.join('');
    if (entered === '000000') { setError(true); return; }  // prototype: forced failure path
    setBusy(true);
    // POST /api/v1/auth/mfa/verify -> { token }
    const { token } = await fakeRequest({ token: 'jwt.' + Math.random().toString(36).slice(2) });
    setBusy(false);
    onToken(token);
  };

  const resend = useCallback(async () => {
    await fakeRequest({ sent: true }, 200);   // POST /api/v1/auth/mfa/send
    setCode(['', '', '', '', '', '']);
    setError(false);
    setCooldown(RESEND_SECONDS);
    refs.current[0].current?.focus();
  }, []);

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-lg-size)', lineHeight: 'var(--text-heading-lg-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.015em' }}>Enter your code</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', textWrap: 'pretty' }}>
          6-digit code sent to <span style={{ color: 'var(--text-primary)' }}>{session.email}</span>. It expires in 10 minutes.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {code.map((d, i) => (
          <input
            key={i} ref={refs.current[i]} value={d} inputMode="numeric" maxLength={1}
            aria-label={'Digit ' + (i + 1)}
            onChange={e => setDigit(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            style={{
              width: '100%', minWidth: 0, height: 56, textAlign: 'center',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid ' + (error ? 'rgba(245,56,94,0.5)' : d ? 'var(--border-strong)' : 'var(--border-default)'),
              background: 'var(--bg-inset)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-heading-md-size)',
              transition: 'border-color var(--duration-fast) var(--ease-standard)'
            }}
          />
        ))}
      </div>
      {error && <div style={errorBox}>That code didn't match. 2 attempts left before we send a new one.</div>}
      <button type="submit" disabled={!complete || busy} style={primary(!complete || busy)}>
        {busy ? 'Verifying…' : 'Verify and sign in'}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-body-sm-size)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Didn't get it?</span>
          <button type="button" onClick={resend} disabled={cooldown > 0} className="tabular"
            style={{ padding: 0, border: 0, background: 'transparent', fontSize: 'var(--text-body-sm-size)', color: cooldown > 0 ? 'var(--text-disabled)' : '#2AA5F5', cursor: cooldown > 0 ? 'default' : 'pointer' }}>
            {cooldown > 0 ? 'Resend in ' + cooldown + 's' : 'Resend code'}
          </button>
        </div>
        <button type="button" onClick={onRestart} style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: '#2AA5F5', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer' }}>
          Use a different account
        </button>
      </div>
    </form>
  );
}

window.HearthAuth = { AuthLayout, LoginForm, VerifyForm };
