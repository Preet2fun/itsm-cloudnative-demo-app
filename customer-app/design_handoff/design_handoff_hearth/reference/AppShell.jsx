// Screen 02 — app shell. Sidebar, location switcher, top bar.
// "Location", never "workspace" — that word is reserved for tenant-level concepts.

const { useState } = React;
const { BRAND, tenant, admin, restaurants } = window.HearthMock;
const I = window.HearthIcons;

const NAV = [
  { key: 'dashboard',  label: 'Dashboard',  Icon: I.Gauge,    ready: true },
  { key: 'orders',     label: 'Orders',     Icon: I.Receipt,  ready: false, iteration: 'ITERATION 05' },
  { key: 'menu',       label: 'Menu',       Icon: I.BookOpen, ready: false, iteration: 'ITERATION 06' },
  { key: 'deliveries', label: 'Deliveries', Icon: I.Truck,    ready: false, iteration: 'ITERATION 07' },
  { key: 'payments',   label: 'Payments',   Icon: I.Card,     ready: false, iteration: 'ITERATION 08' }
];

const STUBS = {
  orders:     ['Orders list + detail', 'Filter by status and location, then drill into line items with the linked delivery and payment side by side.'],
  menu:       ['Menu management', 'Per-location item list with inline price edits and an availability toggle that writes straight through.'],
  deliveries: ['Deliveries', 'Courier assignment and status tracking, one delivery per order.'],
  payments:   ['Payments & reconciliation', 'Match payments back to orders, surface failed captures, and clear the reconciliation queue.']
};

const groupLabel = {
  padding: '16px 16px 6px', fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', fontWeight: 'var(--weight-medium)',
  letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-tertiary)'
};

function LocationSwitcher({ current, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Location</span>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', height: 'var(--row-h-comfortable)', padding: '0 var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-inset)', color: 'var(--text-primary)', fontSize: 'var(--text-body-sm-size)', textAlign: 'left', cursor: 'pointer' }}>
        <span style={{ width: 8, height: 8, flex: '0 0 8px', borderRadius: '50%', background: current.status === 'open' ? 'var(--success)' : 'var(--text-tertiary)' }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</span>
        <I.ChevronDown size={14} />
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
          {restaurants.map(r => (
            <button key={r.id} onClick={() => { onPick(r.id); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', minHeight: 40, padding: '0 var(--space-2)', textAlign: 'left', border: 0, borderRadius: 'var(--radius-xs)', background: r.id === current.id ? 'var(--bg-surface)' : 'transparent', color: 'var(--text-primary)', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer' }}>
              <span style={{ width: 6, height: 6, flex: '0 0 6px', borderRadius: '50%', background: r.status === 'open' ? 'var(--success)' : 'var(--text-tertiary)' }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption-size)', color: 'var(--text-tertiary)' }}>{r.status.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Stub({ nav, onBack }) {
  const [title, body] = STUBS[nav.key];
  return (
    <div style={{ flex: 1, padding: 'var(--space-6)', display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: 520, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)', color: 'var(--text-tertiary)' }}>{nav.iteration}</span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-lg-size)', lineHeight: 'var(--text-heading-lg-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.015em' }}>{title}</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 'var(--text-body-md-lh)', textWrap: 'pretty' }}>{body} Specced in BUILD_PLAN.md, not built in this pass.</p>
        <button onClick={onBack} style={{ marginTop: 4, height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-primary)', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer' }}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function AppShell({ screen, onNavigate, locationId, onPickLocation, onSignOut, children }) {
  const current = restaurants.find(r => r.id === locationId) || restaurants[0];
  const activeNav = NAV.find(n => n.key === screen) || NAV[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--sidebar-w) minmax(0,1fr)', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div className="wordmark" style={{ height: 'var(--topbar-h)', flex: '0 0 var(--topbar-h)', display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', borderBottom: '1px solid var(--border-default)', fontSize: 'var(--text-heading-sm-size)' }}>{BRAND}</div>
        <LocationSwitcher current={current} onPick={onPickLocation} />
        <div style={groupLabel}>Operate</div>
        <nav>
          {NAV.map(n => {
            const active = n.key === screen;
            return (
              <button key={n.key} onClick={() => onNavigate(n.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', minHeight: 'var(--row-h-comfortable)', padding: '0 var(--space-4)', textAlign: 'left', border: 0, borderLeft: '2px solid ' + (active ? '#22E06B' : 'transparent'), background: active ? 'var(--bg-elevated)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 'var(--text-body-md-size)', cursor: 'pointer', transition: 'background var(--duration-fast) var(--ease-standard)' }}>
                <n.Icon size={16} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {!n.ready && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption-size)', color: 'var(--text-tertiary)' }}>soon</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', padding: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: 32, height: 'var(--control-md)', flex: '0 0 var(--control-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-label-size)', fontWeight: 'var(--weight-semibold)' }}>{admin.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.name}</div>
            <div style={{ fontSize: 'var(--text-caption-size)', lineHeight: 'var(--text-caption-lh)', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{admin.role}</div>
          </div>
          <button onClick={onSignOut} aria-label="Sign out"
            style={{ width: 32, height: 'var(--control-md)', flex: '0 0 var(--control-md)', display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <I.Power size={16} />
          </button>
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 'var(--topbar-h)', flex: '0 0 var(--topbar-h)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: '0 var(--space-6)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tenant.name} › {current.name} › {activeNav.label}
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: 'var(--row-h)', padding: '0 var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-inset)', color: 'var(--text-tertiary)', fontSize: 'var(--text-body-sm-size)' }}>
            <I.Search size={14} />
            <span>Search orders</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption-size)' }}>⌘K</span>
          </div>
        </header>
        {activeNav.ready ? children : <Stub nav={activeNav} onBack={() => onNavigate('dashboard')} />}
      </main>
    </div>
  );
}

window.HearthShell = { AppShell, NAV };
