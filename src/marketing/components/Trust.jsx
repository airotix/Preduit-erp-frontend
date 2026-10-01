import { TRUST } from '../data/content.js';

export default function Trust() {
  return (
    <section style={{ padding: '0 32px 88px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 44px 40px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', background: 'var(--neutral-50)' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 560 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Before you sign anything</span>
            <h2 style={{ margin: '12px 0 0', fontSize: 32, fontWeight: 800, lineHeight: 1.14, letterSpacing: '-0.02em' }}>Diligence, in writing.</h2>
          </div>
          <p style={{ maxWidth: 420, margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--fg2)' }}>
            We would rather lose the deal early than lose it at go-live. Every item below is available before contract, not after.
          </p>
        </div>
        <div id="pd-trust-grid" style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, alignItems: 'start' }}>
          {TRUST.map(t => (
            <div key={t.t} data-reveal style={{ padding: 22, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <i className={t.icon} style={{ fontSize: 20, color: 'var(--fg1)' }} />
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>{t.t}</span>
              <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg2)' }}>{t.d}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
