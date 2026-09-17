// Screen 03 — dashboard. Every figure traces to mockData.js.

const {
  orders, deliveries, dashboard, restaurants,
  ORDER_STATUS, DELIVERY_STATUS, relativeTime, money
} = window.HearthMock;

const TONE = {
  success: ['var(--success-soft)', 'var(--success)', 'rgba(34,197,94,0.3)'],
  info:    ['var(--info-soft)',    'var(--info)',    'rgba(42,165,245,0.3)'],
  warning: ['var(--warning-soft)', 'var(--warning)', 'rgba(245,165,36,0.3)'],
  danger:  ['var(--danger-soft)',  'var(--danger)',  'rgba(245,56,94,0.3)'],
  neutral: ['var(--neutral-soft)', 'var(--neutral)', 'rgba(136,146,163,0.3)']
};

function Badge({ tone, children }) {
  const [bg, fg, bd] = TONE[tone] || TONE.neutral;
  return (
    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', whiteSpace: 'nowrap', background: bg, color: fg, border: '1px solid ' + bd }}>
      {children}
    </span>
  );
}

const card = {
  border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
  borderRadius: 'var(--radius-md)'
};
const cardTitle = { margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-sm-size)', lineHeight: 'var(--text-heading-sm-lh)', fontWeight: 'var(--weight-semibold)' };
const eyebrow = { fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-tertiary)' };
const th = { textAlign: 'left', padding: '10px 16px', fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' };
const td = { padding: 'var(--space-3) var(--space-4)' };

function Dashboard({ locationId }) {
  const rows = orders.filter(o => o.restaurantId === locationId).slice(0, 5);
  const inFlight = deliveries.filter(d => d.status !== 'delivered');
  const locationName = (restaurants.find(r => r.id === locationId) || restaurants[0]).name;

  return (
    <div style={{ flex: 1, padding: 'var(--space-6)', maxWidth: 'var(--max-app)', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={eyebrow}>{dashboard.dateLabel}</span>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-md-size)', lineHeight: 'var(--text-display-md-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.02em' }}>{dashboard.greeting}</h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
          <button style={{ height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer' }}>Today</button>
          <button style={{ height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--neutral-100)', color: 'var(--text-inverse)', fontSize: 'var(--text-body-sm-size)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>Pause online orders</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 'var(--space-4)' }}>
        {dashboard.kpis.map(k => (
          <div key={k.label} style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={eyebrow}>{k.label}</span>
            <span className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-md-size)', lineHeight: 'var(--text-display-md-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.02em' }}>{k.value}</span>
            <span style={{ fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)', color: TONE[k.tone][1] }}>{k.delta}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-default)' }}>
            <h2 style={cardTitle}>Orders in progress</h2>
            <a href="#" style={{ marginLeft: 'auto', fontSize: 'var(--text-body-sm-size)' }}>All orders</a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 520, fontSize: 'var(--text-body-md-size)', lineHeight: 'var(--text-body-md-lh)' }}>
              <thead>
                <tr>{['Order', 'Items', 'Total', 'Status', 'Placed'].map(c => <th key={c} style={th}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} style={{ ...td, color: 'var(--text-secondary)' }}>No orders at {locationName} yet today.</td></tr>
                )}
                {rows.map(o => {
                  const s = ORDER_STATUS[o.status];
                  const summary = o.lineItems.map(li => (li.qty > 1 ? li.qty + ' × ' : '') + li.name).join(', ');
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body-sm-size)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>#{o.id}</td>
                      <td style={td}>{summary}</td>
                      <td className="tabular" style={{ ...td, whiteSpace: 'nowrap' }}>{money(o.total)}</td>
                      <td style={td}><Badge tone={s.tone}>{s.label}</Badge></td>
                      <td className="tabular" style={{ ...td, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{relativeTime(o.placedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h2 style={cardTitle}>Deliveries in flight</h2>
              <a href="#" style={{ marginLeft: 'auto', fontSize: 'var(--text-body-sm-size)' }}>All deliveries</a>
            </div>
            {inFlight.length === 0 && <p style={{ margin: 0, color: 'var(--text-secondary)' }}>None in flight.</p>}
            {inFlight.map(d => {
              const s = DELIVERY_STATUS[d.status];
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-canvas)' }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.courierName || 'Unassigned'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)', color: 'var(--text-tertiary)' }}>#{d.orderId} · {d.etaLabel}</span>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>
              );
            })}
          </div>

          <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={cardTitle}>Payments today</h2>
            {dashboard.paymentsToday.map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ width: 8, height: 8, flex: '0 0 8px', borderRadius: '50%', background: TONE[p.tone][1] }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{p.label}</span>
                <span className="tabular">{p.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 2, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm-size)' }}>Needs reconciliation</span>
              <span className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-md-size)', lineHeight: 'var(--text-heading-md-lh)', fontWeight: 'var(--weight-semibold)' }}>
                {dashboard.needsReconciliation || 'None'}
              </span>
            </div>
          </div>

          <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={eyebrow}>Recent activity</span>
            {dashboard.activity.map(a => (
              <div key={a.when + a.what} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)', color: 'var(--text-tertiary)', flex: '0 0 64px' }}>{a.when}</span>
                <span style={{ color: 'var(--text-secondary)', textWrap: 'pretty' }}>{a.what}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.HearthDashboard = Dashboard;
