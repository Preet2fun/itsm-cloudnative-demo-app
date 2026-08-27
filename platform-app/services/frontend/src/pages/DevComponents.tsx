import { useState } from 'react'
import {
  Icon, Button, IconButton, Badge, SevBadge, Card, CardHeader,
  Avatar, HealthDot, Sparkline, StatCard, Segmented, AiOrb,
  AiChip, Empty, CountUp,
} from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'
import type { IconName } from '@/components/ui'

const SPARK_DATA = [14, 22, 18, 35, 28, 42, 38, 55, 47, 61, 58, 72]
const SPARK_DOWN  = [72, 58, 61, 47, 55, 38, 42, 28, 35, 18, 22, 14]

const ALL_ICONS: IconName[] = [
  'grid','pulse','alert','ticket','problem','change','catalog','cube','map','book',
  'chart','gear','spark','bolt','search','bell','plus','check','checkCircle','x',
  'chevR','chevD','chevL','arrowR','arrowUp','arrowDown','clock','user','users',
  'db','cloud','server','shield','key','laptop','package','mail','wrench','link',
  'filter','send','sparkles','command','logout','dots','eye','flag','play','refresh',
  'globe','lock','trend','moon','sun','topology','history','doc','star','thumbsUp',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </section>
  )
}

function Row({ children, gap = 12, style }: { children: React.ReactNode; gap?: number; style?: React.CSSProperties }) {
  return <div className="row wrap" style={{ gap, alignItems: 'flex-start', ...style }}>{children}</div>
}

export default function DevComponents() {
  const { theme, toggle } = useTheme()
  const [seg, setSeg] = useState('all')
  const [seg2, setSeg2] = useState('agent')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div
        className="spread"
        style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}
      >
        <div className="row gap-3">
          {/* Synap brand mark */}
          <span style={{
            width: 28, height: 28, borderRadius: 8, background: 'var(--ai-grad)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 11 11 4M12 11 20 9M12 11 17 19M12 11 5 17" />
              <circle cx="12" cy="11" r="2.7" fill="#fff" stroke="none" />
              <circle cx="11" cy="4"  r="1.6" fill="#fff" stroke="none" />
              <circle cx="20" cy="9"  r="1.6" fill="#fff" stroke="none" />
              <circle cx="17" cy="19" r="1.6" fill="#fff" stroke="none" />
              <circle cx="5"  cy="17" r="1.6" fill="#fff" stroke="none" />
            </svg>
          </span>
          <span className="display" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>Synap</span>
          <Badge variant="default"><span className="mono" style={{ fontSize: 10 }}>Sprint 0 · Design System</span></Badge>
        </div>
        <div className="row gap-2">
          <IconButton onClick={toggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
          </IconButton>
          <Badge variant="default" style={{ fontSize: 11 }}>
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px' }}>

        {/* ── Colours ──────────────────────────────────── */}
        <Section title="Design tokens — accent ramp">
          <Row>
            {(['--accent', '--accent-strong', '--accent-soft', '--accent-softer', '--accent-border'] as const).map(v => (
              <div key={v} className="col gap-2" style={{ alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: `var(${v})`, border: '1px solid var(--border)' }} />
                <span className="mono muted" style={{ fontSize: 10 }}>{v.replace('--', '')}</span>
              </div>
            ))}
            <div className="col gap-2" style={{ alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'var(--ai-grad)', boxShadow: 'var(--shadow-glow)' }} />
              <span className="mono muted" style={{ fontSize: 10 }}>ai-grad</span>
            </div>
          </Row>
        </Section>

        <Section title="Design tokens — semantic colours">
          <Row>
            {[
              { label: 'critical', bg: 'var(--critical)', soft: 'var(--critical-soft)' },
              { label: 'high',     bg: 'var(--high)',     soft: 'var(--high-soft)' },
              { label: 'warn',     bg: 'var(--warn)',     soft: 'var(--warn-soft)' },
              { label: 'ok',       bg: 'var(--ok)',       soft: 'var(--ok-soft)' },
              { label: 'info',     bg: 'var(--info)',     soft: 'var(--info-soft)' },
            ].map(c => (
              <div key={c.label} className="col gap-2" style={{ alignItems: 'center' }}>
                <div style={{ width: 52, height: 26, borderRadius: 'var(--r-sm) var(--r-sm) 0 0', background: c.bg }} />
                <div style={{ width: 52, height: 26, borderRadius: '0 0 var(--r-sm) var(--r-sm)', background: c.soft, border: '1px solid var(--border)' }} />
                <span className="mono muted" style={{ fontSize: 10 }}>{c.label}</span>
              </div>
            ))}
          </Row>
        </Section>

        <Section title="Design tokens — surfaces + neutrals">
          <Row>
            {[
              { label: 'bg',       bg: 'var(--bg)' },
              { label: 'bg-2',     bg: 'var(--bg-2)' },
              { label: 'surface',  bg: 'var(--surface)' },
              { label: 'surface-2',bg: 'var(--surface-2)' },
              { label: 'elevated', bg: 'var(--elevated)' },
              { label: 'border',   bg: 'var(--border)' },
              { label: 'border-strong', bg: 'var(--border-strong)' },
            ].map(c => (
              <div key={c.label} className="col gap-2" style={{ alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: c.bg, border: '1px solid var(--border)' }} />
                <span className="mono muted" style={{ fontSize: 10 }}>{c.label}</span>
              </div>
            ))}
          </Row>
        </Section>

        {/* ── Typography ───────────────────────────────── */}
        <Section title="Typography">
          <div className="col gap-4">
            <div>
              <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em' }}>Space Grotesk — display headings</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>--font-display · weight 700 · letter-spacing -0.03em</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Hanken Grotesk — UI body text, labels, table cells, descriptions</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>--font-ui · weight 400–600 · base 14px</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 13 }}>JetBrains Mono — IDs · telemetry values · CI names · timestamps</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>--font-mono · tnum feature · weight 400–600</div>
            </div>
            <div className="row gap-6 wrap">
              {[
                { size: 30, label: '30 display metric' },
                { size: 24, label: '24 section metric' },
                { size: 18, label: '18 large heading' },
                { size: 15, label: '15 page title' },
                { size: 14, label: '14 body base' },
                { size: 13, label: '13 table cell' },
                { size: 12, label: '12 caption' },
                { size: 11, label: '11 label' },
              ].map(t => (
                <div key={t.size} className="col gap-1">
                  <span style={{ fontSize: t.size, fontWeight: 600, lineHeight: 1 }}>{t.size}px</span>
                  <span className="muted" style={{ fontSize: 11 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Icons ────────────────────────────────────── */}
        <Section title={`Icons — ${ALL_ICONS.length} paths (lucide-compatible)`}>
          <div className="row wrap" style={{ gap: 6 }}>
            {ALL_ICONS.map(name => (
              <div
                key={name}
                className="col center"
                style={{ width: 64, height: 64, gap: 6, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'default' }}
                title={name}
              >
                <Icon name={name} size={20} />
                <span className="mono muted" style={{ fontSize: 9 }}>{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ──────────────────────────────────── */}
        <Section title="Buttons">
          <div className="col gap-4">
            <Row>
              <Button>Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="ai"><Icon name="sparkles" size={14} fill /> Ask Synap</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
            </Row>
            <Row>
              <Button size="sm">Small</Button>
              <Button size="sm" variant="primary">Small Primary</Button>
              <Button size="sm" variant="ai"><Icon name="sparkles" size={13} fill /> AI sm</Button>
              <Button size="sm" variant="ghost">Small Ghost</Button>
            </Row>
            <Row>
              <Button size="lg">Large</Button>
              <Button size="lg" variant="primary">Large Primary</Button>
              <Button size="lg" variant="ai"><Icon name="sparkles" size={16} fill /> Resolve with Synap</Button>
            </Row>
            <Row>
              <IconButton><Icon name="search" size={16} /></IconButton>
              <IconButton><Icon name="bell" size={16} /></IconButton>
              <IconButton bordered><Icon name="moon" size={16} /></IconButton>
              <IconButton bordered><Icon name="gear" size={16} /></IconButton>
            </Row>
          </div>
        </Section>

        {/* ── Badges ───────────────────────────────────── */}
        <Section title="Badges">
          <div className="col gap-3">
            <Row>
              <Badge>Default</Badge>
              <Badge variant="ai"><Icon name="sparkles" size={11} fill /> AI-resolved</Badge>
              <Badge variant="ghost">Ghost</Badge>
            </Row>
            <Row>
              <SevBadge sev="critical" />
              <SevBadge sev="high" />
              <SevBadge sev="medium" />
              <SevBadge sev="warn" />
              <SevBadge sev="low" />
              <SevBadge sev="ok" />
              <SevBadge sev="info" />
            </Row>
          </div>
        </Section>

        {/* ── Cards ────────────────────────────────────── */}
        <Section title="Cards">
          <Row gap={16}>
            <Card pad style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Basic card</div>
              <div className="muted" style={{ fontSize: 13 }}>With .pad — 18px padding on all sides.</div>
            </Card>
            <Card style={{ minWidth: 240 }}>
              <CardHeader title="Card with header">
                <Button size="sm" variant="ghost">Action</Button>
              </CardHeader>
              <div style={{ padding: 18, fontSize: 13, color: 'var(--ink-2)' }}>
                Content area below the card header divider.
              </div>
            </Card>
            <Card style={{ minWidth: 200 }} className="ai-surface">
              <div style={{ padding: 14 }}>
                <AiChip confidence={94}>AI surface</AiChip>
                <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>Accent border + gradient bg.</div>
              </div>
            </Card>
          </Row>
        </Section>

        {/* ── Avatars ──────────────────────────────────── */}
        <Section title="Avatars">
          <Row>
            <Avatar person={{ initials: 'AM', color: '#6366f1', name: 'Alex Morgan' }} />
            <Avatar person={{ initials: 'RK', color: '#0ea5e9', name: 'Raj Kumar' }} size={36} />
            <Avatar person={{ initials: 'SP', color: '#10b981', name: 'Sara Park' }} size={42} />
            <Avatar person={{ initials: 'TL', color: '#f59e0b', name: 'Tom Liu' }} size={48} />
            <Avatar person={{ initials: 'MN', name: 'Maria N.' }} />
          </Row>
        </Section>

        {/* ── Health dots ──────────────────────────────── */}
        <Section title="Health dots">
          <Row gap={24}>
            <HealthDot health="healthy" label />
            <HealthDot health="degraded" label />
            <HealthDot health="critical" label />
            <HealthDot health="healthy" />
            <HealthDot health="degraded" />
            <HealthDot health="critical" />
          </Row>
        </Section>

        {/* ── Sparklines ───────────────────────────────── */}
        <Section title="Sparklines">
          <Row gap={24}>
            <div className="col gap-2">
              <Sparkline data={SPARK_DATA} />
              <span className="muted" style={{ fontSize: 11 }}>Default (accent)</span>
            </div>
            <div className="col gap-2">
              <Sparkline data={SPARK_DOWN} color="var(--critical)" />
              <span className="muted" style={{ fontSize: 11 }}>Critical (down)</span>
            </div>
            <div className="col gap-2">
              <Sparkline data={SPARK_DATA} color="var(--ok)" w={120} h={36} />
              <span className="muted" style={{ fontSize: 11 }}>OK 120×36</span>
            </div>
            <div className="col gap-2">
              <Sparkline data={SPARK_DATA} fill={false} color="var(--muted)" />
              <span className="muted" style={{ fontSize: 11 }}>No fill</span>
            </div>
          </Row>
        </Section>

        {/* ── Stat cards ───────────────────────────────── */}
        <Section title="Stat cards">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <StatCard label="Open Incidents" value={<CountUp to={47} />} sub="last 24h" trend={-18} icon="alert" spark={SPARK_DOWN} />
            <StatCard label="MTTR" value={<><CountUp to={41} />m</>} sub="vs 68m last week" trend={-40} trendGood icon="clock" spark={SPARK_DATA} accent="var(--ok)" />
            <StatCard label="Active Assets" value={<CountUp to={1284} />} sub="across all tenants" trend={3} icon="cube" />
            <StatCard label="AI Auto-resolved" value={<CountUp to={64} suffix="%" />} sub="of total incidents" trend={8} trendGood icon="sparkles" accent="var(--accent)" spark={SPARK_DATA} />
          </div>
        </Section>

        {/* ── Segmented ────────────────────────────────── */}
        <Section title="Segmented controls">
          <div className="col gap-4">
            <div className="col gap-2">
              <Segmented
                options={['all', 'open', 'resolved', 'closed']}
                value={seg}
                onChange={setSeg}
              />
              <span className="muted" style={{ fontSize: 12 }}>Selected: <strong>{seg}</strong></span>
            </div>
            <div className="col gap-2">
              <Segmented
                options={[{ value: 'agent', label: 'Agent console' }, { value: 'enduser', label: 'Employee portal' }]}
                value={seg2}
                onChange={setSeg2}
                size="sm"
              />
              <span className="muted" style={{ fontSize: 12 }}>Persona: <strong>{seg2}</strong></span>
            </div>
          </div>
        </Section>

        {/* ── AI components ────────────────────────────── */}
        <Section title="AI components">
          <Row gap={20}>
            <div className="col gap-3" style={{ alignItems: 'center' }}>
              <AiOrb size={28} />
              <span className="muted" style={{ fontSize: 11 }}>AiOrb 28</span>
            </div>
            <div className="col gap-3" style={{ alignItems: 'center' }}>
              <AiOrb size={40} active />
              <span className="muted" style={{ fontSize: 11 }}>AiOrb 40 active</span>
            </div>
            <div className="col gap-3" style={{ alignItems: 'center' }}>
              <AiOrb size={56} active />
              <span className="muted" style={{ fontSize: 11 }}>AiOrb 56 active</span>
            </div>
            <div className="vr" />
            <div className="col gap-2">
              <AiChip>AI triaged</AiChip>
              <AiChip confidence={94}>Root cause found</AiChip>
              <AiChip confidence={78}>Auto-resolved</AiChip>
            </div>
          </Row>
        </Section>

        {/* ── AI thinking states ────────────────────────── */}
        <Section title="AI thinking states">
          <div className="col gap-4">
            <div className="col gap-2">
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Typing indicator</div>
              <div className="row gap-2">
                <AiOrb size={24} active />
                <div className="typing" style={{ color: 'var(--accent)' }}>
                  <span /><span /><span />
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Synap is thinking…</span>
              </div>
            </div>
            <div className="col gap-2">
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Shimmer skeletons</div>
              <div className="col gap-2" style={{ maxWidth: 320 }}>
                <div className="shimmer" style={{ height: 16, width: '80%' }} />
                <div className="shimmer" style={{ height: 16, width: '60%' }} />
                <div className="shimmer" style={{ height: 16, width: '70%' }} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Animations ───────────────────────────────── */}
        <Section title="Animations">
          <Row gap={16}>
            <div className="card pad fade-in" style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>fade-in</div>
              <div className="muted" style={{ fontSize: 12 }}>0.4s ease, translateY 6px→0</div>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              <div>Refresh page to see entrance animations replay.</div>
              <div style={{ marginTop: 4 }}>AIOps correlation, stepper, and portal fix animations are in Sprint 4–7.</div>
            </div>
          </Row>
        </Section>

        {/* ── Empty state ──────────────────────────────── */}
        <Section title="Empty state">
          <Card style={{ maxWidth: 480 }}>
            <Empty
              icon="ticket"
              title="No incidents found"
              sub="When incidents are created they'll appear here. Try adjusting your filters."
            />
          </Card>
        </Section>

        {/* ── CountUp ──────────────────────────────────── */}
        <Section title="CountUp (animated metric)">
          <Row gap={32}>
            <div className="col gap-1" style={{ alignItems: 'center' }}>
              <div className="display" style={{ fontSize: 40, fontWeight: 700 }}>
                <CountUp to={96} suffix="%" />
              </div>
              <span className="muted" style={{ fontSize: 12 }}>Alert noise reduced</span>
            </div>
            <div className="col gap-1" style={{ alignItems: 'center' }}>
              <div className="display" style={{ fontSize: 40, fontWeight: 700 }}>
                <CountUp to={41} suffix=" min" />
              </div>
              <span className="muted" style={{ fontSize: 12 }}>Median MTTR</span>
            </div>
            <div className="col gap-1" style={{ alignItems: 'center' }}>
              <div className="display" style={{ fontSize: 40, fontWeight: 700 }}>
                <CountUp to={1284} />
              </div>
              <span className="muted" style={{ fontSize: 12 }}>Active assets</span>
            </div>
          </Row>
        </Section>

        {/* ── Radius + shadows ─────────────────────────── */}
        <Section title="Radius scale">
          <Row gap={16}>
            {(['--r-xs','--r-sm','--r-md','--r-lg','--r-xl','--r-full'] as const).map(r => (
              <div key={r} className="col gap-2" style={{ alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: `var(${r})` }} />
                <span className="mono muted" style={{ fontSize: 9 }}>{r.replace('--r-', '')}</span>
              </div>
            ))}
          </Row>
        </Section>

        <Section title="Shadow scale">
          <Row gap={20} style={{ paddingBottom: 8 }}>
            {(['--shadow-xs','--shadow-sm','--shadow-md','--shadow-lg'] as const).map(s => (
              <div key={s} className="col gap-2" style={{ alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: `var(${s})` }} />
                <span className="mono muted" style={{ fontSize: 9 }}>{s.replace('--shadow-', '')}</span>
              </div>
            ))}
            <div className="col gap-2" style={{ alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'var(--ai-grad)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-glow)' }} />
              <span className="mono muted" style={{ fontSize: 9 }}>glow (AI only)</span>
            </div>
          </Row>
        </Section>

        {/* Footer */}
        <div className="row" style={{ justifyContent: 'center', paddingTop: 32, borderTop: '1px solid var(--border)', color: 'var(--faint)', fontSize: 12, gap: 8 }}>
          <Icon name="sparkles" size={13} fill style={{ color: 'var(--accent)' }} />
          <span>Synap UI · Sprint 0 — Design System · All primitives passing</span>
        </div>
      </div>
    </div>
  )
}
