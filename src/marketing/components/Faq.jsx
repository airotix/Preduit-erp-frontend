import { useState } from 'react';
import { FAQS } from '../data/content.js';

export default function Faq() {
  const [open, setOpen] = useState(-1);

  return (
    <section id="faq" style={{ padding: '0 32px 96px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 data-reveal style={{ margin: '0 0 28px', fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
          The questions you were going to ask on the call
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((f, i) => (
            <div key={f.q} data-reveal style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setOpen(o => (o === i ? -1 : i))}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 24px', fontFamily: 'var(--font-sans)', fontSize: 16.5, fontWeight: 600, textAlign: 'left', color: 'var(--fg1)', background: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {f.q}
                <i className={open === i ? 'ph ph-minus-circle' : 'ph ph-plus-circle'} style={{ fontSize: 19, flex: 'none', color: 'var(--primary)' }} />
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 22px', animation: 'pdRowIn .3s ease-out both' }}>
                  <p style={{ margin: 0, maxWidth: 700, fontSize: 15.5, lineHeight: 1.65, color: 'var(--fg2)', textWrap: 'pretty' }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
