import { PHASES } from '../data/content.js';

export default function Rollout() {
  return (
    <section id="rollout" style={{ padding: '96px 32px', background: 'var(--champagne)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 640 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Rollout</span>
            <h2 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>Live in three weeks, with your season still running.</h2>
          </div>
          <p style={{ maxWidth: 360, margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--fg2)' }}>
            Nobody stops selling to install software. Each phase ends with something your team already uses in production.
          </p>
        </div>

        <div id="pd-rollout-grid" style={{ marginTop: 44, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 18, alignItems: 'start' }}>
          {PHASES.map(p => (
            <div key={p.title} data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{p.when}</span>
                <span style={{ flex: 1, height: 2, background: 'var(--orange-200)' }} />
              </div>
              <div style={{ padding: '26px 24px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180 }}>
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.title}</span>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg2)' }}>{p.body}</p>
                <div style={{ flex: 1 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--green-600)' }}>
                  <i className="ph-fill ph-flag-checkered" style={{ fontSize: 14 }} />
                  {p.done}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
