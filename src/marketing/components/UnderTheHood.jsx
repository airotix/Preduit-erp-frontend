import { LEDGER, SEC_CHIPS, BARS } from '../data/content.js';

export default function UnderTheHood() {
  return (
    <section id="depth" style={{ padding: '96px 32px', background: 'var(--fg1)', color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal style={{ maxWidth: 700 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange-300)' }}>Under the hood</span>
          <h2 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fff' }}>The parts finance teams actually interrogate.</h2>
          <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.6, color: 'var(--neutral-400)', textWrap: 'pretty' }}>
            Three things separate an ERP from a pretty dashboard. Ask any vendor these; here are our answers.
          </p>
        </div>

        <div id="pd-depth-grid" style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div data-reveal style={{ padding: 40, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(150deg,#332F28,#241F1A)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(245,130,32,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-scales" style={{ fontSize: 22, color: 'var(--orange-300)' }} />
            </span>
            <h3 style={{ margin: '20px 0 0', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>A real double-entry GL engine</h3>
            <p style={{ margin: '12px 0 0', fontSize: 15.5, lineHeight: 1.62, color: 'var(--neutral-400)', maxWidth: 520 }}>
              Not a reporting layer bolted on top. Invoices, receipts, stock movements, FX revaluation and production costs post journal entries against a chart of accounts you control — with posting flags, ledger links and bank reconciliation built in.
            </p>
            <div style={{ marginTop: 26, borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {LEDGER.map((l, i) => (
                <div className="pd-ledger-row" key={`${l.je}-${i}`} style={{ display: 'grid', gridTemplateColumns: '76px minmax(0,1fr) minmax(0,84px) minmax(0,84px)', gap: 10, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--orange-300)' }}>{l.je}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--neutral-300)' }}>{l.acct}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fff', textAlign: 'right' }}>{l.dr}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fff', textAlign: 'right' }}>{l.cr}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(36,179,75,0.12)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green-200)' }}>Trial balance</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--green-200)' }}>Dr = Cr · variance 0.00</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div data-reveal style={{ padding: 36, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(150deg,#3A2A44,#241C2C)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(165,27,252,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ph-fill ph-shield-check" style={{ fontSize: 22, color: 'var(--purple-300)' }} />
              </span>
              <h3 style={{ margin: '18px 0 0', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>Isolation at the database, not the UI</h3>
              <p style={{ margin: '11px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--neutral-400)' }}>
                Row-level security scopes every query to the signed-in company. Run several legal entities in one workspace and no query can cross the line — even a mistaken one.
              </p>
              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SEC_CHIPS.map(c => (
                  <span key={c} style={{ padding: '7px 13px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--purple-100)', background: 'rgba(165,27,252,0.14)', borderRadius: 'var(--radius-pill)' }}>{c}</span>
                ))}
              </div>
            </div>

            <div data-reveal style={{ padding: 36, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(150deg,#243A2A,#19271D)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(36,179,75,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ph-fill ph-brain" style={{ fontSize: 22, color: 'var(--green-200)' }} />
              </span>
              <h3 style={{ margin: '18px 0 0', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>Demand planning that argues back</h3>
              <p style={{ margin: '11px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--neutral-400)' }}>
                Per-SKU projections, size-curve coverage and order validation. When a rep promises 2,000 pieces you cannot make, Preduit says so before the customer hears yes.
              </p>
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
                {BARS.map((b, i) => (
                  <span key={i} style={{ flex: 1, borderRadius: '4px 4px 0 0', background: b.fill, height: b.h }} />
                ))}
              </div>
              <span style={{ display: 'block', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--neutral-500)' }}>projected vs. committed · next 12 weeks</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
