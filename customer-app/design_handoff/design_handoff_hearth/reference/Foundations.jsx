// Screen 00 — foundations and primitives specimen.

const SWATCHES = [
  ['Canvas', '#050810'], ['Surface', '#0B111C'], ['Elevated', '#141924'], ['Inset', '#030509'],
  ['Text primary', '#F2F5FA'], ['Text secondary', '#8892A3'],
  ['Success', '#22C55E'], ['Info', '#2AA5F5'], ['Warning', '#F5A524'], ['Danger', '#F5385E']
];

const BADGES = [
  ['Received', 'neutral'], ['Preparing', 'info'], ['Out for delivery', 'warning'],
  ['Delivered', 'success'], ['Cancelled', 'danger'], ['Paid', 'success']
];

const TONES = {
  success: ['var(--success-soft)', 'var(--success)', 'rgba(34,197,94,0.3)'],
  info:    ['var(--info-soft)',    'var(--info)',    'rgba(42,165,245,0.3)'],
  warning: ['var(--warning-soft)', 'var(--warning)', 'rgba(245,165,36,0.3)'],
  danger:  ['var(--danger-soft)',  'var(--danger)',  'rgba(245,56,94,0.3)'],
  neutral: ['var(--neutral-soft)', 'var(--neutral)', 'rgba(136,146,163,0.3)']
};

const card = { border: '1px solid var(--border-default)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' };
const eyebrow = { fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-tertiary)' };

function Foundations({ onBack }) {
  return (
    <div style={{ maxWidth: 'var(--max-marketing)', margin: '0 auto', padding: 'var(--space-8) var(--space-6) var(--space-16)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-label-size)', color: 'var(--text-tertiary)' }}>SCREEN 00</span>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-md-size)', lineHeight: 'var(--text-display-md-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.02em' }}>Foundations &amp; primitives</h1>
        </div>
        <button onClick={onBack} style={{ marginLeft: 'auto', height: 'var(--row-h)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer' }}>
          Back to sign in
        </button>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={eyebrow}>Surfaces &amp; semantics</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 'var(--space-3)' }}>
          {SWATCHES.map(([name, hex]) => (
            <div key={name} style={{ ...card, overflow: 'hidden' }}>
              <div style={{ height: 64, background: hex, borderBottom: '1px solid var(--border-default)' }} />
              <div style={{ padding: 'var(--space-2) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)' }}>{name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption-size)', lineHeight: 'var(--text-caption-lh)', color: 'var(--text-tertiary)' }}>{hex}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
        <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={eyebrow}>Type scale</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-lg-size)', lineHeight: 'var(--text-display-lg-lh)', fontWeight: 'var(--weight-bold)', letterSpacing: '-0.025em' }}>Display lg 40/44</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-lg-size)', lineHeight: 'var(--text-heading-lg-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.015em' }}>Heading lg 24/30</span>
          <span>Body md 14/20 — Inter Tight carries all UI text and table content.</span>
          <span style={{ fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)', color: 'var(--text-secondary)' }}>Body sm 13/18 — tables and dense panels.</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body-sm-size)', lineHeight: 'var(--text-body-sm-lh)' }}>Mono md 13/18 — #ORD-4821</span>
        </div>

        <div style={{ ...card, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <span style={eyebrow}>Controls</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <button style={{ height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--neutral-100)', color: 'var(--text-inverse)', fontSize: 'var(--text-body-md-size)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>Primary</button>
            <button style={{ height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-primary)', fontSize: 'var(--text-body-md-size)', cursor: 'pointer' }}>Secondary</button>
            <button style={{ height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: 0, background: 'transparent', color: 'var(--text-secondary)', fontSize: 'var(--text-body-md-size)', cursor: 'pointer' }}>Ghost</button>
            <button disabled style={{ height: 'var(--control-lg)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-disabled)', fontSize: 'var(--text-body-md-size)', opacity: 0.45 }}>Disabled</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="spec-input" style={{ ...eyebrow, color: 'var(--text-secondary)' }}>Input</label>
            <input id="spec-input" defaultValue={'Margherita, 12"'} style={{ height: 'var(--control-lg)', padding: '0 var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-inset)', color: 'var(--text-primary)', fontSize: 'var(--text-body-md-size)' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            {BADGES.map(([label, tone]) => {
              const [bg, fg, bd] = TONES[tone];
              return <span key={label} style={{ padding: '3px 8px', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-label-size)', lineHeight: 'var(--text-label-lh)', background: bg, color: fg, border: '1px solid ' + bd }}>{label}</span>;
            })}
          </div>
        </div>

        <div style={{ ...card, padding: 'var(--space-8) var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <span style={eyebrow}>Empty state</span>
          <div style={{ width: 40, height: 'var(--control-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
            <window.HearthIcons.Inbox size={20} />
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-md-size)', lineHeight: 'var(--text-heading-md-lh)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.01em' }}>No deliveries in flight</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 'var(--text-body-md-lh)' }}>Couriers appear here the moment an order moves to out for delivery.</p>
          <button style={{ marginTop: 4, height: 'var(--row-h)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-primary)', fontSize: 'var(--text-body-sm-size)', cursor: 'pointer' }}>View today's orders</button>
        </div>
      </section>
    </div>
  );
}

window.HearthFoundations = Foundations;
