import { FOOTER_COLS } from '../data/content.js';

export default function Footer() {
  return (
    <footer style={{ padding: '56px 32px 40px', background: 'var(--neutral-50)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,var(--orange-400),var(--orange-700))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-cube-transparent" style={{ color: '#fff', fontSize: 18 }} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Preduit</span>
          </div>
          <p style={{ margin: '14px 0 0', maxWidth: 300, fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg3)' }}>
            Retail and apparel ERP — catalog to general ledger, on one database.
          </p>
        </div>
        {FOOTER_COLS.map(col => (
          <div key={col.title} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg1)' }}>{col.title}</span>
            {col.links.map(l => (
              <a key={l} href="#top" style={{ fontSize: 13.5, color: 'var(--fg2)' }}>{l}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '36px auto 0', paddingTop: 22, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--fg3)' }}>© 2026 Preduit. All rights reserved.</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg3)' }}>SOC 2 Type II · PCI-DSS ready · Hosted in-region</span>
      </div>
    </footer>
  );
}
