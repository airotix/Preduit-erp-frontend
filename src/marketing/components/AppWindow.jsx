import { Box } from '../lib/css.jsx';
import { NAV } from '../data/nav.js';

/**
 * The mock ERP window used in the hero. `stage` is one entry of data/stages.js;
 * remounting on `stage.n` (via key from the parent) replays the row animation.
 */
export default function AppWindow({ stage, innerRef }) {
  return (
    <div
      className="pd-app-window"
      ref={innerRef}
      style={{ position: 'relative', borderRadius: 'var(--radius-lg)', background: '#fff', border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(26,25,22,0.16),0 4px 12px rgba(26,25,22,0.06)', overflow: 'hidden', transition: 'transform .25s cubic-bezier(0.22,1,0.36,1)', willChange: 'transform' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--neutral-50)' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--neutral-300)' }} />
        ))}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ padding: '4px 14px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg3)', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}>{stage.url}</span>
        </div>
      </div>

      <div className="pd-app-layout" style={{ display: 'grid', gridTemplateColumns: '186px minmax(0,1fr)', minHeight: 428 }}>
        <div style={{ borderRight: '1px solid var(--border)', background: 'var(--neutral-50)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((m, i) => {
            const active = i === stage.mod;
            return (
              <div
                key={m.label}
                style={active
                  ? { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 'var(--radius-xs)', background: '#fff', boxShadow: 'var(--shadow-xs)', border: '1px solid var(--orange-100)' }
                  : { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 'var(--radius-xs)' }}
              >
                <i className={active ? m.iconFill : m.icon} style={{ fontSize: 15, color: active ? 'var(--primary)' : 'var(--neutral-400)', flex: 'none' }} />
                <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? 'var(--fg1)' : 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ paddingBottom: 11, fontSize: 13, fontWeight: 700, color: 'var(--fg1)', borderBottom: '2px solid var(--primary)' }}>{stage.tab}</span>
            <span style={{ paddingBottom: 11, fontSize: 13, fontWeight: 500, color: 'var(--fg3)' }}>{stage.tab2}</span>
            <div style={{ flex: 1 }} />
            <span style={{ paddingBottom: 11, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pdPulse 2s ease-in-out infinite' }} />
              Live
            </span>
          </div>

          <div className="pd-app-records" key={stage.n} style={{ padding: '16px 20px', animation: 'pdRowIn .4s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr .9fr .9fr', gap: 10, padding: '0 4px 9px' }}>
              {stage.cols.map(c => (
                <span key={c} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>{c}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {stage.rows.map(r => (
                <Box
                  key={r.a + r.b}
                  css="display:grid;grid-template-columns:1.1fr 1.4fr .9fr .9fr;gap:10px;align-items:center;padding:11px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:#fff;transition:box-shadow .2s,transform .2s"
                  hover="box-shadow:var(--shadow-md);transform:translateY(-1px)"
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--fg1)' }}>{r.a}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--fg2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.b}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg1)' }}>{r.c}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--fg2)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flex: 'none', background: r.dot }} />
                    {r.d}
                  </span>
                </Box>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '15px 16px', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>{stage.k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 700, color: 'var(--fg1)' }}>{stage.v}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg3)' }}>posts to the general ledger</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', fontSize: 11, fontWeight: 700, color: 'var(--green-600)', background: 'var(--success-soft)', borderRadius: 'var(--radius-pill)' }}>
                  <i className="ph-fill ph-check-circle" style={{ fontSize: 12 }} />
                  Balanced
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ height: 3, background: 'var(--neutral-100)' }}>
            <div key={stage.n} style={{ height: '100%', background: 'var(--primary)', animation: 'pdGrow 4.4s linear forwards' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
