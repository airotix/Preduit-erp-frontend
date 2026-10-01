import { MARQUEE } from '../data/content.js';

export default function Marquee() {
  return (
    <div style={{ padding: '22px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: 'pdMarquee 34s linear infinite' }}>
        {MARQUEE.map((w, i) => (
          <span
            key={`${w}-${i}`}
            style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '0 14px', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--neutral-400)', whiteSpace: 'nowrap' }}
          >
            {w}
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--orange-200)' }} />
          </span>
        ))}
      </div>
    </div>
  );
}
