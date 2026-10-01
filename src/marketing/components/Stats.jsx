import { STATS } from '../data/content.js';

export default function Stats() {
  return (
    <section style={{ padding: '80px 32px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
      <div id="pd-stats-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 20 }}>
        {STATS.map(s => (
          <div key={s.label} data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 22, borderLeft: '3px solid var(--orange-200)' }}>
            <span data-count={s.to} style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg1)', lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg1)' }}>{s.label}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg2)' }}>{s.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
