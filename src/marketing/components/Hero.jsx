import { Box } from '../lib/css.jsx';
import { HERO_PROOF } from '../data/content.js';
import { useTilt } from '../hooks/index.js';
import AppWindow from './AppWindow.jsx';

export default function Hero({ stage }) {
  const winRef = useTilt('pd-hero');

  return (
    <section id="top" style={{ position: 'relative', padding: '84px 32px 72px', background: 'linear-gradient(180deg,var(--champagne) 0%,#FFFBF6 62%,var(--bg) 100%)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, left: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,130,32,0.30),rgba(245,130,32,0) 68%)', filter: 'blur(10px)', animation: 'pdFloatA 16s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -180, right: -60, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(165,27,252,0.18),rgba(165,27,252,0) 68%)', filter: 'blur(10px)', animation: 'pdFloatB 20s ease-in-out infinite', pointerEvents: 'none' }} />

      <div id="pd-hero" style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.05fr)', gap: 56, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 60, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--fg1)', textWrap: 'balance' }}>
            One system from fabric to{' '}
            <span style={{ position: 'relative', whiteSpace: 'nowrap', color: 'var(--primary)' }}>
              final invoice
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: 6, height: 10, background: 'var(--orange-100)', borderRadius: 'var(--radius-pill)', zIndex: -1 }} />
            </span>.
          </h1>

          <p style={{ margin: '22px 0 0', maxWidth: 530, fontSize: 18.5, lineHeight: 1.6, color: 'var(--fg2)', textWrap: 'pretty' }}>
            <strong style={{ color: 'var(--fg1)', fontWeight: 700 }}>Preduit is an ERP for apparel brands and multi-store retail.</strong>{' '}
            It replaces the order sheets, stock files, production whiteboards and accounting exports with twelve connected modules and one double-entry ledger.
          </p>

          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Box
              as="a"
              href="/signup"
              css="display:flex;align-items:center;gap:10px;padding:16px 26px;font-size:16px;font-weight:700;color:#fff;background:var(--primary);border:none;border-radius:var(--radius-pill);box-shadow:var(--shadow-primary);transition:transform .2s cubic-bezier(0.22,1,0.36,1),background .2s"
              hover="background:var(--primary-hover);transform:translateY(-2px);color:#fff"
            >
              Book a 30-min demo
              <i className="ph-fill ph-arrow-right" style={{ fontSize: 17 }} />
            </Box>
            <Box
              as="a"
              href="#flow"
              css="display:flex;align-items:center;gap:10px;padding:15px 24px;font-size:16px;font-weight:600;color:var(--fg1);background:#fff;border:1.5px solid var(--border-strong);border-radius:var(--radius-pill);transition:border-color .2s,transform .2s"
              hover="border-color:var(--primary);color:var(--primary);transform:translateY(-2px)"
            >
              <i className="ph ph-play-circle" style={{ fontSize: 18 }} />
              Watch the order flow
            </Box>
          </div>

          <div style={{ marginTop: 38, display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
            {HERO_PROOF.map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className={p.icon} style={{ fontSize: 17, color: 'var(--success)' }} />
                <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg2)' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ perspective: 1400 }}>
          <AppWindow stage={stage} innerRef={winRef} />
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="ph ph-cursor-click" style={{ fontSize: 14, color: 'var(--fg3)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--fg3)' }}>Follow the same order through all seven stages below</span>
          </div>
        </div>
      </div>
    </section>
  );
}
