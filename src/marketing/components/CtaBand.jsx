import { Box } from '../lib/css.jsx';
import { ONBOARDING } from '../data/content.js';

export default function CtaBand() {
  return (
    <section id="cta" style={{ padding: '0 32px 96px' }}>
      <div style={{ position: 'relative', maxWidth: 1140, margin: '0 auto', padding: '72px 56px', borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg,var(--orange-500),var(--orange-700) 70%,var(--orange-800))', overflow: 'hidden', boxShadow: 'var(--shadow-primary)' }}>
        <div style={{ position: 'absolute', top: -140, right: -60, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.28),rgba(255,255,255,0) 70%)', animation: 'pdFloatB 18s ease-in-out infinite', pointerEvents: 'none' }} />
        <div id="pd-cta-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.9fr)', gap: 48, alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 42, fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', color: '#fff', textWrap: 'balance' }}>See your own order run end to end.</h2>
            <p style={{ margin: '16px 0 0', maxWidth: 520, fontSize: 17.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
              Send us one real sales order and a fabric BOM. We will load them into a sandbox before the call, and you will watch it post to the ledger live — not a slide about it.
            </p>
            <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Box
                as="a"
                href="/signup"
                css="display:flex;align-items:center;gap:10px;padding:16px 26px;font-family:var(--font-sans);font-size:16px;font-weight:700;color:var(--orange-700);background:#fff;border:none;border-radius:var(--radius-pill);transition:transform .2s"
                hover="transform:translateY(-2px);color:var(--orange-700)"
              >
                Start free setup
                <i className="ph-fill ph-arrow-right" style={{ fontSize: 17 }} />
              </Box>
            </div>
          </div>
          <div style={{ padding: 28, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.24)', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>What week one looks like</span>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ONBOARDING.map(o => (
                <div key={o.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{o.n}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{o.t}</span>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)' }}>{o.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
