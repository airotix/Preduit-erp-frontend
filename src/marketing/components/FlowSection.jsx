import { Box } from '../lib/css.jsx';
import { STAGES } from '../data/stages.js';
import { NAV } from '../data/nav.js';

export default function FlowSection({ stage, setStage }) {
  const s = STAGES[stage];
  const next = STAGES[(stage + 1) % STAGES.length];

  return (
    <section id="flow" style={{ padding: '96px 32px', background: 'var(--neutral-50)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal style={{ maxWidth: 720 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>How it works</span>
          <h2 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>One order. Seven stages. Zero re-typing.</h2>
          <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.6, color: 'var(--fg2)', textWrap: 'pretty' }}>
            Most ERPs sell you modules and leave the seams to you. Preduit was built as one flow — the same record travels from the order queue to the general ledger, picking up cost, quality and stock movements as it goes.
          </p>
        </div>

        <div data-reveal style={{ marginTop: 44, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STAGES.map((st, i) => {
            const active = i === stage;
            return active ? (
              <button
                key={st.n}
                type="button"
                onClick={() => setStage(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--fg1)', border: '1.5px solid var(--fg1)', borderRadius: 'var(--radius-pill)', cursor: 'pointer', transition: 'all .2s cubic-bezier(0.22,1,0.36,1)' }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.6 }}>{st.n}</span>
                {st.short}
              </button>
            ) : (
              <Box
                key={st.n}
                as="button"
                type="button"
                onClick={() => setStage(i)}
                css="display:flex;align-items:center;gap:10px;padding:11px 18px;font-family:var(--font-sans);font-size:14px;font-weight:600;color:var(--fg2);background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-pill);cursor:pointer;transition:all .2s cubic-bezier(0.22,1,0.36,1)"
                hover="border-color:var(--primary);color:var(--primary);transform:translateY(-1px)"
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg3)' }}>{st.n}</span>
                {st.short}
              </Box>
            );
          })}
        </div>

        <div key={s.n} style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', background: '#fff', animation: 'pdRise .45s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ padding: '48px 44px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--primary-soft)' }}>
              <i className={NAV[s.mod].iconFill} style={{ fontSize: 15, color: 'var(--primary)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--orange-700)' }}>{s.module}</span>
            </div>
            <h3 style={{ margin: '20px 0 0', fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em' }}>{s.title}</h3>
            <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.62, color: 'var(--fg2)', textWrap: 'pretty' }}>{s.blurb}</p>
            <div style={{ marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {s.chips.map(c => (
                <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--fg1)', background: 'var(--neutral-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}>
                  <i className="ph ph-check" style={{ fontSize: 13, color: 'var(--success)' }} />
                  {c}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--fg3)' }}>Stage {s.n} of 07</span>
              <Box
                as="button"
                type="button"
                onClick={() => setStage((stage + 1) % STAGES.length)}
                css="display:flex;align-items:center;gap:8px;padding:11px 18px;font-family:var(--font-sans);font-size:13.5px;font-weight:700;color:var(--fg1);background:#fff;border:1.5px solid var(--border-strong);border-radius:var(--radius-pill);cursor:pointer;transition:all .2s"
                hover="border-color:var(--primary);color:var(--primary)"
              >
                {`Next: ${next.short}`}
                <i className="ph ph-arrow-right" style={{ fontSize: 14 }} />
              </Box>
            </div>
          </div>

          <div style={{ position: 'relative', padding: 44, background: 'linear-gradient(160deg,var(--champagne),#FFF8F0)', borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(100deg,transparent 40%,rgba(255,255,255,0.75) 50%,transparent 60%)', animation: 'pdSweep 3.2s cubic-bezier(0.22,1,0.36,1) 1' }} />
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {s.rows.map(r => (
                <div key={r.a + r.b} style={{ padding: '18px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700 }}>{r.a}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--fg2)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-pill)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot }} />
                      {r.d}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--fg2)' }}>{r.b}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--fg1)' }}>{r.c}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 6, padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--fg1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neutral-400)' }}>{s.k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: '#fff' }}>{s.v}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
