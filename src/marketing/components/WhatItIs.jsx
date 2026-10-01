import { PAINS, GAINS } from '../data/content.js';

const eyebrow = { fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' };
const h2 = { margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' };

function Item({ icon, color, t, d, strong }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
      <i className={icon} style={{ fontSize: 17, marginTop: 2, flex: 'none', color }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: strong ? 700 : 600, color: 'var(--fg1)' }}>{t}</span>
        <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg2)' }}>{d}</span>
      </div>
    </div>
  );
}

export default function WhatItIs() {
  return (
    <section id="what" style={{ padding: '96px 32px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal style={{ maxWidth: 700 }}>
          <span style={eyebrow}>What it is</span>
          <h2 style={h2}>An ERP, not another dashboard on top of your spreadsheets.</h2>
          <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.6, color: 'var(--fg2)', textWrap: 'pretty' }}>
            An ERP is the system every other tool reports to: one place where a product, a customer, a stock unit and a rupee mean exactly one thing. Here is what changes on day one.
          </p>
        </div>

        <div id="pd-what-grid" style={{ marginTop: 44, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 64px minmax(0,1fr)', gap: 0, alignItems: 'start' }}>
          <div data-reveal style={{ padding: '34px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', background: 'var(--neutral-50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ph ph-files" style={{ fontSize: 19, color: 'var(--fg3)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>How most teams run today</span>
            </div>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PAINS.map(p => <Item key={p.t} icon="ph ph-x-circle" color="var(--danger)" t={p.t} d={p.d} />)}
            </div>
          </div>

          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
              <i className="ph-fill ph-arrow-right" style={{ fontSize: 20, color: '#fff' }} />
            </span>
          </div>

          <div data-reveal style={{ padding: '34px 32px', border: '1.5px solid var(--orange-200)', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(165deg,#FFF7EF,#fff 60%)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ph-fill ph-cube-transparent" style={{ fontSize: 19, color: 'var(--primary)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--orange-700)' }}>The same week, on Preduit</span>
            </div>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GAINS.map(g => <Item key={g.t} icon="ph-fill ph-check-circle" color="var(--success)" t={g.t} d={g.d} strong />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
