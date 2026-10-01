import { Box } from '../lib/css.jsx';
import { ROLES } from '../data/content.js';

export default function Roles() {
  return (
    <section id="roles" style={{ padding: '96px 32px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal style={{ maxWidth: 700 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Who it is for</span>
          <h2 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>Four people have to agree. Here is what each one gets.</h2>
        </div>

        <div id="pd-roles-grid" style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, alignItems: 'start' }}>
          {ROLES.map(r => (
            <Box
              key={r.who}
              data-reveal
              css="padding:28px 26px;border:1px solid var(--border);border-radius:var(--radius-lg);background:#fff;display:flex;flex-direction:column;gap:14px;transition:transform .22s cubic-bezier(0.22,1,0.36,1),box-shadow .22s"
              hover="transform:translateY(-4px);box-shadow:var(--shadow-lg)"
            >
              <span style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--neutral-50)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={r.icon} style={{ fontSize: 21, color: 'var(--primary)' }} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{r.who}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{r.pain}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--fg2)', textWrap: 'pretty' }}>{r.gain}</p>
              <div style={{ marginTop: 2, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Lives in</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg2)' }}>{r.screens}</span>
              </div>
            </Box>
          ))}
        </div>
      </div>
    </section>
  );
}
