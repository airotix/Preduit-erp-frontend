import { useState } from 'react';
import { Box } from '../lib/css.jsx';
import { NAV } from '../data/nav.js';
import { TOUR, TOUR_STEP_MS, TOUR_TOTAL } from '../data/tour.js';
import { useCycle } from '../hooks/index.js';

/** Auto-playing "screen recording" of the ERP — six chapters, twelve modules. */
export default function ProductTour({ autoplay = true }) {
  const [playing, setPlaying] = useState(autoplay);
  const [chap, setChap] = useCycle(TOUR.length, TOUR_STEP_MS, playing);
  const t = TOUR[chap];

  const jump = i => { setChap(i); setPlaying(true); };

  return (
    <section id="modules" style={{ padding: '96px 32px', background: 'var(--champagne)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 660 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Product tour · {TOUR_TOTAL}</span>
            <h2 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>Watch the whole system work, in under ninety seconds.</h2>
          </div>
          <p style={{ maxWidth: 360, margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--fg2)' }}>
            Six chapters, twelve modules, one company&apos;s data. It plays on its own — jump to the chapter you care about.
          </p>
        </div>

        <div id="pd-tour-grid" data-reveal style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '288px minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TOUR.map((c, i) => {
              const active = i === chap;
              return active ? (
                <button
                  key={c.n}
                  type="button"
                  onClick={() => jump(i)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '16px 18px', textAlign: 'left', fontFamily: 'var(--font-sans)', background: 'var(--fg1)', border: '1.5px solid var(--fg1)', borderRadius: 'var(--radius-md)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
                >
                  <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ph-fill ph-play" style={{ fontSize: 11, color: '#fff' }} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{c.title}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--orange-300)' }}>{c.time} · {c.mods}</span>
                  </span>
                </button>
              ) : (
                <Box
                  key={c.n}
                  as="button"
                  type="button"
                  onClick={() => jump(i)}
                  css="display:flex;align-items:flex-start;gap:13px;padding:16px 18px;text-align:left;font-family:var(--font-sans);background:#fff;border:1px solid var(--border);border-radius:var(--radius-md);cursor:pointer;transition:border-color .2s,transform .2s"
                  hover="border-color:var(--primary);transform:translateX(2px)"
                >
                  <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--fg3)' }}>{c.n}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg1)' }}>{c.title}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg3)' }}>{c.time} · {c.mods}</span>
                  </span>
                </Box>
              );
            })}
            <div style={{ marginTop: 6, padding: '16px 18px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>All twelve modules</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--fg2)' }}>{NAV.map(m => m.label).join(' · ')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg3)' }}>50 screens · one login</span>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--fg1)', border: '1px solid var(--neutral-800)', boxShadow: '0 24px 60px rgba(26,25,22,0.22)' }}>
            <div style={{ position: 'relative', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--border)', background: 'var(--neutral-50)' }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--neutral-300)' }} />)}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <span style={{ padding: '4px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg3)', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}>{t.url}</span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--danger)', background: 'var(--danger-soft)', borderRadius: 'var(--radius-pill)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', animation: 'pdPulse 1.6s ease-in-out infinite' }} />
                  Recording
                </span>
              </div>

              <div id="pd-tour-scene" key={t.n} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '172px minmax(0,1fr)', minHeight: 452 }}>
                <div style={{ borderRight: '1px solid var(--border)', background: 'var(--neutral-50)', padding: '12px 9px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {NAV.map((m, i) => {
                    const active = i === t.mod;
                    return (
                      <div
                        key={m.label}
                        style={active
                          ? { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 'var(--radius-xs)', background: '#fff', border: '1px solid var(--orange-100)', boxShadow: 'var(--shadow-xs)' }
                          : { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 'var(--radius-xs)' }}
                      >
                        <i className={active ? m.iconFill : m.icon} style={{ fontSize: 14, color: active ? 'var(--primary)' : 'var(--neutral-400)', flex: 'none' }} />
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--fg1)' : 'var(--fg3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'flex-end', gap: 18, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ paddingBottom: 11, fontSize: 13, fontWeight: 700, borderBottom: '2px solid var(--primary)' }}>{t.tab}</span>
                    <span style={{ paddingBottom: 11, fontSize: 13, fontWeight: 500, color: 'var(--fg3)' }}>{t.tab2}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', marginBottom: 8, fontSize: 11.5, fontWeight: 700, color: 'var(--fg1)', background: 'var(--neutral-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}>
                      <i className="ph ph-plus" style={{ fontSize: 12, color: 'var(--primary)' }} />
                      {t.action}
                    </span>
                  </div>

                  <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div id="pd-tour-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
                      {t.kpis.map((k, i) => (
                        <div key={k.label} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', display: 'flex', flexDirection: 'column', gap: 6, animation: 'pdRowIn .5s cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${(0.12 + i * 0.09).toFixed(2)}s` }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>{k.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--fg1)', lineHeight: 1 }}>{k.value}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: k.tone }}>{k.delta}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr .9fr', gap: 10, padding: '10px 16px', background: 'var(--neutral-50)', borderBottom: '1px solid var(--border)' }}>
                        {t.cols.map(c => (
                          <span key={c} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>{c}</span>
                        ))}
                      </div>
                      {t.rows.map((r, i) => (
                        <div key={r.a + r.b} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr .9fr', gap: 10, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#fff', animation: 'pdRowIn .45s cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${(0.34 + i * 0.1).toFixed(2)}s` }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{r.a}</span>
                          <span style={{ fontSize: 12.5, color: 'var(--fg2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.b}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.c}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--fg2)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', flex: 'none', background: r.dot }} />
                            {r.d}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1 }} />
                </div>

                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(180deg,rgba(26,25,22,0),rgba(26,25,22,0.9) 45%)' }}>
                  <i className={t.icon} style={{ fontSize: 17, color: 'var(--orange-300)', flex: 'none' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: '#fff', textWrap: 'pretty' }}>{t.caption}</span>
                </div>

                <span style={{ position: 'absolute', top: '26%', left: '22%', width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--primary)', background: 'rgba(245,130,32,0.22)', pointerEvents: 'none', animation: 'pdTourCursor 6.6s cubic-bezier(0.22,1,0.36,1) infinite' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--fg1)' }}>
              <button
                type="button"
                aria-label={playing ? 'Pause tour' : 'Play tour'}
                onClick={() => setPlaying(p => !p)}
                style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <i className={playing ? 'ph-fill ph-pause' : 'ph-fill ph-play'} style={{ fontSize: 15 }} />
              </button>
              <div style={{ flex: 1, display: 'flex', gap: 5 }}>
                {TOUR.map((c, i) => {
                  if (i < chap) return <span key={c.n} onClick={() => jump(i)} style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--orange-400)', cursor: 'pointer' }} />;
                  if (i === chap) {
                    return (
                      <span key={c.n} style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
                        <span key={t.n} style={{ display: 'block', height: '100%', borderRadius: 999, background: 'var(--primary)', animation: `pdGrow ${TOUR_STEP_MS}ms linear forwards`, animationPlayState: playing ? 'running' : 'paused' }} />
                      </span>
                    );
                  }
                  return <span key={c.n} onClick={() => jump(i)} style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.16)', cursor: 'pointer' }} />;
                })}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--neutral-400)', flex: 'none' }}>{t.time} / {TOUR_TOTAL}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#fff', flex: 'none' }}>
                <i className="ph ph-monitor-play" style={{ fontSize: 15, color: 'var(--orange-300)' }} />
                {t.title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
