import { useCallback, useEffect, useState } from 'react';
import { PhoneInput } from "@/components/ui/phone-input";
import { fieldFormatError } from "@/lib/validators";
import { Box } from '../lib/css.jsx';
import { NAV } from '../data/nav.js';
import { useEscape } from '../hooks/index.js';

const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|icloud)\./;
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const INITIAL = {
  name: '', role: 'Owner', email: '', phone: '', company: '',
  segment: 'Brand', outlets: '2-5', team: '11-50', notes: '',
  modules: ['Sales & Orders', 'Inventory', 'Finance'],
};

const label = { fontSize: 13, fontWeight: 600 };
const field = 'width:100%;box-sizing:border-box;padding:13px 15px;font-family:var(--font-sans);font-size:15px;color:var(--fg1);background:#fff;border:1.5px solid var(--border-strong);border-radius:var(--radius-sm);outline:none';
const fieldSm = field.replace('font-size:15px', 'font-size:14.5px');
const group = { display: 'flex', flexDirection: 'column', gap: 7 };

function Err({ children }) {
  if (!children) return null;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--danger)' }}>
      <i className="ph ph-warning-circle" style={{ fontSize: 14 }} />
      {children}
    </span>
  );
}

/**
 * "Start free setup" — collects the contact + business detail the
 * implementation team needs to build a sandbox. Validates on submit,
 * clears a field error as soon as that field is edited.
 */
export default function SetupModal({ open, onClose }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const close = useCallback(() => onClose(), [onClose]);
  useEscape(open, close);

  useEffect(() => {
    if (open) { setSent(false); setErrors({}); }
  }, [open]);

  if (!open) return null;

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  const toggleModule = m => setForm(f => ({
    ...f,
    modules: f.modules.includes(m) ? f.modules.filter(x => x !== m) : [...f.modules, m],
  }));

  const submit = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Tell us who to address this to.';
    const email = form.email.trim().toLowerCase();
    if (!email) next.email = 'We need an email to send the sandbox link.';
    else if (!EMAIL.test(email)) next.email = 'That does not look like a valid email.';
    else if (FREE_MAIL.test(email)) next.email = 'Please use your work email.';
    const phoneError = fieldFormatError("phone", form.phone);
    if (phoneError) next.phone = phoneError;
    if (!form.company.trim()) next.company = 'Which business are we setting up?';
    if (Object.keys(next).length) { setErrors(next); return; }
    setErrors({});
    setSending(true);
    // Swap for a real POST (e.g. /api/leads) when the backend endpoint exists.
    setTimeout(() => { setSending(false); setSent(true); }, 900);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px', overflowY: 'auto', background: 'rgba(26,25,22,0.55)', backdropFilter: 'blur(3px)', animation: 'pdRowIn .22s ease-out both' }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={close} />
      <div role="dialog" aria-label="Start free setup" style={{ position: 'relative', width: '100%', maxWidth: 640, background: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: '0 30px 80px rgba(26,25,22,0.35)', overflow: 'hidden', animation: 'pdRise .3s cubic-bezier(0.22,1,0.36,1) both' }}>

        {sent ? (
          <div style={{ padding: '56px 44px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-check-circle" style={{ fontSize: 32, color: 'var(--success)' }} />
            </span>
            <h3 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Request received, {form.name.trim().split(' ')[0] || 'there'}.
            </h3>
            <p style={{ margin: 0, maxWidth: 440, fontSize: 15.5, lineHeight: 1.6, color: 'var(--fg2)' }}>
              We will email {form.email.trim()} within one business day with a sandbox link and two call slots. Bring one real sales order and a fabric BOM — we will load them before we meet.
            </p>
            <button type="button" onClick={close} style={{ marginTop: 8, padding: '13px 24px', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}>
              Back to the page
            </button>
          </div>
        ) : (
          <div>
            <div style={{ padding: '26px 32px', borderBottom: '1px solid var(--border)', background: 'var(--neutral-50)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Start free setup</span>
                <h3 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Tell us about you and the business</h3>
                <span style={{ fontSize: 13.5, color: 'var(--fg2)' }}>Two minutes. No card, no commitment — we build the sandbox from this.</span>
              </div>
              <button type="button" aria-label="Close" onClick={close} style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', color: 'var(--fg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="ph ph-x" style={{ fontSize: 16 }} />
              </button>
            </div>

            <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Your details</span>
                <div id="pd-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
                  <div style={group}>
                    <label htmlFor="pd-name" style={label}>Full name</label>
                    <Box as="input" id="pd-name" className="pd-input" css={field} placeholder="Amara Okonjo" value={form.name} onChange={e => set('name', e.target.value)} />
                    <Err>{errors.name}</Err>
                  </div>
                  <div style={group}>
                    <label htmlFor="pd-role" style={label}>Your role</label>
                    <Box as="select" id="pd-role" className="pd-input" css={field} value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="Owner">Owner / founder</option>
                      <option value="CFO">Finance lead / CFO</option>
                      <option value="Ops">Operations lead</option>
                      <option value="Production">Production manager</option>
                      <option value="IT">IT / systems</option>
                      <option value="Other">Something else</option>
                    </Box>
                  </div>
                  <div style={group}>
                    <label htmlFor="pd-email" style={label}>Work email</label>
                    <Box as="input" id="pd-email" type="email" className="pd-input" css={field} placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
                    <Err>{errors.email}</Err>
                  </div>
                  <div style={group}>
                    <label htmlFor="pd-phone" style={label}>
                      Phone <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(optional)</span>
                    </label>
                    <Box as={PhoneInput} id="pd-phone" className="pd-input" css={field} placeholder="+92 300 0000000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                    <Err>{errors.phone}</Err>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Business information</span>
                <div style={group}>
                  <label htmlFor="pd-co" style={label}>Business name</label>
                  <Box as="input" id="pd-co" className="pd-input" css={field} placeholder="Northgate Retail Group" value={form.company} onChange={e => set('company', e.target.value)} />
                  <Err>{errors.company}</Err>
                </div>
                <div id="pd-modal-grid-3" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
                  <div style={group}>
                    <label htmlFor="pd-seg" style={label}>What you do</label>
                    <Box as="select" id="pd-seg" className="pd-input" css={fieldSm} value={form.segment} onChange={e => set('segment', e.target.value)}>
                      <option value="Brand">Apparel brand</option>
                      <option value="Manufacturer">Manufacturer</option>
                      <option value="Both">Make and sell</option>
                      <option value="Retail">Multi-store retail</option>
                      <option value="Distributor">Distributor</option>
                    </Box>
                  </div>
                  <div style={group}>
                    <label htmlFor="pd-out" style={label}>Locations</label>
                    <Box as="select" id="pd-out" className="pd-input" css={fieldSm} value={form.outlets} onChange={e => set('outlets', e.target.value)}>
                      <option value="1">1 site</option>
                      <option value="2-5">2–5 sites</option>
                      <option value="6-20">6–20 sites</option>
                      <option value="20+">More than 20</option>
                    </Box>
                  </div>
                  <div style={group}>
                    <label htmlFor="pd-team" style={label}>Team size</label>
                    <Box as="select" id="pd-team" className="pd-input" css={fieldSm} value={form.team} onChange={e => set('team', e.target.value)}>
                      <option value="1-10">1–10 people</option>
                      <option value="11-50">11–50 people</option>
                      <option value="51-200">51–200 people</option>
                      <option value="200+">200+ people</option>
                    </Box>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <span style={label}>
                    Modules you want first <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>— pick any</span>
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {NAV.map(m => {
                      const on = form.modules.includes(m.label);
                      return on ? (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => toggleModule(m.label)}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}
                        >
                          <i className="ph-fill ph-check" style={{ fontSize: 12 }} />
                          {m.label}
                        </button>
                      ) : (
                        <Box
                          key={m.label}
                          as="button"
                          type="button"
                          onClick={() => toggleModule(m.label)}
                          css="padding:9px 14px;font-family:var(--font-sans);font-size:13px;font-weight:600;color:var(--fg2);background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-pill);cursor:pointer;transition:border-color .18s,color .18s"
                          hover="border-color:var(--primary);color:var(--primary)"
                        >
                          {m.label}
                        </Box>
                      );
                    })}
                  </div>
                </div>
                <div style={group}>
                  <label htmlFor="pd-note" style={label}>
                    What is breaking today? <span style={{ fontWeight: 500, color: 'var(--fg3)' }}>(optional)</span>
                  </label>
                  <Box
                    as="textarea"
                    id="pd-note"
                    className="pd-input"
                    rows={3}
                    css={`${field};line-height:1.55;resize:vertical`}
                    placeholder="Stock never matches, month-end takes a week, no costing per style…"
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--fg3)' }}>
                <i className="ph ph-lock-key" style={{ fontSize: 15, color: 'var(--success)' }} />
                Your details stay with our implementation team. No lists, no resale.
              </span>
              <Box
                as="button"
                type="button"
                onClick={submit}
                disabled={sending}
                css="display:flex;align-items:center;gap:10px;padding:14px 24px;font-family:var(--font-sans);font-size:15px;font-weight:700;color:#fff;background:var(--primary);border:none;border-radius:var(--radius-pill);box-shadow:var(--shadow-primary);cursor:pointer;transition:background .18s"
                hover="background:var(--primary-hover)"
              >
                {sending && (
                  <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pdSpin .7s linear infinite' }} />
                )}
                {sending ? 'Sending…' : 'Request my sandbox'}
              </Box>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
