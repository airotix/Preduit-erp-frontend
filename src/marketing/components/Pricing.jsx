import { useState } from 'react';
import { Box } from '../lib/css.jsx';
import { plans } from '../data/content.js';

export default function Pricing({ onDemo }) {
  const [annual, setAnnual] = useState(true);
  const tiers = plans(annual);

  const tab = active => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', fontFamily: 'var(--font-sans)',
    fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? 'var(--fg1)' : 'var(--fg2)',
    background: active ? '#fff' : 'transparent', border: 'none', borderRadius: 'var(--radius-pill)',
    boxShadow: active ? 'var(--shadow-sm)' : 'none', cursor: 'pointer',
  });

  return (
    <section id="pricing" style={{ padding: '96px 32px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div data-reveal style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Pricing</span>
          <h2 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>Priced per workspace, not per spreadsheet.</h2>
          <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--fg2)' }}>
            Implementation, data migration and staff training are included on every plan. No per-module upsell mid-year.
          </p>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 4, padding: 5, background: 'var(--neutral-100)', borderRadius: 'var(--radius-pill)' }}>
            <button type="button" onClick={() => setAnnual(false)} style={tab(!annual)}>Monthly</button>
            <button type="button" onClick={() => setAnnual(true)} style={tab(annual)}>
              Annual
              <span style={{ padding: '3px 8px', fontSize: 10.5, fontWeight: 700, color: 'var(--green-600)', background: 'var(--success-soft)', borderRadius: 'var(--radius-pill)' }}>−20%</span>
            </button>
          </div>
        </div>

        <div id="pd-pricing-grid" style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 20, alignItems: 'start' }}>
          {tiers.map(p => (
            <Box
              key={p.name}
              data-reveal
              css={`position:relative;padding:34px 30px;border-radius:var(--radius-xl);background:${p.bg};border:1.5px solid ${p.border};box-shadow:${p.shadow};display:flex;flex-direction:column;gap:18px;transition:transform .22s cubic-bezier(0.22,1,0.36,1)`}
              hover="transform:translateY(-4px)"
            >
              {p.featured && (
                <span style={{ position: 'absolute', top: -13, left: 30, padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: 'var(--primary)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-primary)' }}>Most chosen</span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: p.fg }}>{p.name}</span>
                <span style={{ fontSize: 14, lineHeight: 1.55, color: p.fg2 }}>{p.who}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: p.fg }}>{p.price}</span>
                <span style={{ fontSize: 13.5, color: p.fg2, paddingBottom: 4 }}>{p.per}</span>
              </div>
              <div style={{ height: 1, background: p.rule }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <i className="ph-fill ph-check-circle" style={{ fontSize: 16, marginTop: 2, flex: 'none', color: p.tick }} />
                    <span style={{ fontSize: 14, lineHeight: 1.5, color: p.fg2 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <Box
                as="button"
                type="button"
                onClick={onDemo}
                css={`display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 20px;font-family:var(--font-sans);font-size:15px;font-weight:700;border-radius:var(--radius-pill);color:${p.ctaFg};background:${p.ctaBg};border:1.5px solid ${p.ctaBorder};cursor:pointer;transition:transform .2s`}
                hover="transform:translateY(-2px)"
              >
                {p.cta}
              </Box>
            </Box>
          ))}
        </div>
      </div>
    </section>
  );
}
