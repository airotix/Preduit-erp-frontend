"use client";

import * as React from "react";
import { Store, Check, Eye, EyeOff, Loader2, X, CheckCircle2 } from "lucide-react";
import {
  getAssignableRoles, createCompany,
  type CreateWorkspacePayload, type CreateWorkspaceResult,
} from "@/lib/admin-api";
import {
  INPUT, LABEL, CARD, BTN_PRIMARY, BTN_GHOST, MODULES,
  StepOutlets, StepModules, StepTeam,
  type ModuleDef, type TeamRow,
} from "@/components/setup/setup-wizard";

const STEPS = ["Account", "Business", "Modules", "Team"];
const LAST = STEPS.length - 1;
const FALLBACK_ROLES = ["Admin", "Manager", "Merchandiser", "Accountant", "User Overview", "Logistics / Inventory"];

function strength(pw: string): { pct: number; color: string } {
  let s = 0;
  if (pw.length >= 10) s += 2; else if (pw.length >= 6) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 1;
  const pct = Math.min(100, (s / 4) * 100);
  const color = s >= 4 ? "#24B34B" : s >= 2 ? "#F58220" : "#E0574B";
  return { pct: pw ? Math.max(pct, 12) : 0, color };
}

/**
 * Super Admin "Add workspace" stepper. Mirrors the self-serve signup + setup
 * flow (Account → Business → Modules → Team) but provisions the workspace on
 * behalf of the owner via POST /auth/companies, so the Super Admin's own
 * session is never touched.
 */
export function AddWorkspaceWizard({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CreateWorkspaceResult | null>(null);

  // Step 1 — Account (workspace owner)
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  // Step 2 — Business
  const [companyName, setCompanyName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [city, setCity] = React.useState("");
  const [currency, setCurrency] = React.useState("PKR");
  const [taxReg, setTaxReg] = React.useState("");

  // Step 3 — Modules (core + procurement pre-selected)
  const [modules, setModules] = React.useState<Set<string>>(
    () => new Set(MODULES.filter((m) => m.core || m.defaultOn).map((m) => m.key)),
  );

  // Step 4 — Team
  const [roles, setRoles] = React.useState<string[]>(FALLBACK_ROLES);
  const [team, setTeam] = React.useState<TeamRow[]>([{ email: "", role: "Manager" }]);

  React.useEffect(() => {
    getAssignableRoles()
      .then((r) => {
        if (r && r.length) {
          setRoles(r);
          setTeam((t) => t.map((row) => ({ ...row, role: r.includes(row.role) ? row.role : r[0] })));
        }
      })
      .catch(() => { /* keep fallback list */ });
  }, []);

  // Esc closes (unless a request is in flight).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const toggleModule = (m: ModuleDef) => {
    if (m.core) return;
    setModules((s) => { const n = new Set(s); n.has(m.key) ? n.delete(m.key) : n.add(m.key); return n; });
  };

  const st = strength(password);

  const validateStep = (i: number): string | null => {
    if (i === 0) {
      if (!first.trim()) return "Owner's first name is required.";
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid owner email.";
      if (password.length < 10) return "Password must be at least 10 characters.";
    }
    if (i === 1 && !companyName.trim()) return "Company name is required.";
    return null;
  };

  const next = () => {
    const msg = validateStep(step);
    if (msg) { setError(msg); return; }
    setError(null);
    setStep((s) => Math.min(LAST, s + 1));
  };

  const finish = async (withInvites: boolean) => {
    for (const i of [0, 1]) {
      const msg = validateStep(i);
      if (msg) { setError(msg); setStep(i); return; }
    }
    setBusy(true); setError(null);
    const payload: CreateWorkspacePayload = {
      ownerName: `${first.trim()} ${last.trim()}`.trim(),
      email: email.trim(),
      password,
      companyName: companyName.trim(),
      country: country.trim() || undefined,
      city: city.trim() || undefined,
      currency,
      taxRegistration: taxReg.trim() || undefined,
      modules: Array.from(modules),
      invites: withInvites
        ? team.map((t) => ({ email: t.email.trim(), role: t.role })).filter((t) => t.email.length > 0)
        : [],
    };
    try {
      setResult(await createCompany(payload));
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the workspace.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f6f5ef]">
      {/* top bar with stepper */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ecebe2] bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white"
                style={{ background: "linear-gradient(135deg,#F58220,#EA6C18)" }}>
            <Store size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[16px] font-extrabold tracking-tight text-[#211f1c]">Add workspace</span>
        </div>

        {!result && (
          <div className="hidden items-center gap-6 sm:flex">
            {STEPS.map((label, i) => {
              const state = i < step ? "done" : i === step ? "active" : "todo";
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={"flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold " +
                    (state === "done" ? "bg-[#24B34B] text-white"
                      : state === "active" ? "bg-[#F58220] text-white" : "bg-[#EDEBE4] text-[#a39c8f]")}>
                    {state === "done" ? <Check size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={"text-[14px] font-semibold " +
                    (state === "todo" ? "text-[#a39c8f]" : "text-[#211f1c]")}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={onClose} disabled={busy} aria-label="Close"
                className="flex items-center gap-1.5 text-[14px] font-semibold text-[#9a948a] transition-colors hover:text-[#26241f] disabled:opacity-50">
          <X size={16} /> {result ? "Close" : "Cancel"}
        </button>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-6 py-12">
        {result ? (
          <Done result={result} onClose={onClose} />
        ) : (
          <>
            <div className="mb-2 text-[13px] font-bold tracking-[0.08em] text-[#F58220]">
              Step {step + 1} of {STEPS.length}
            </div>

            {step === 0 && (
              <StepAccount
                first={first} setFirst={setFirst} last={last} setLast={setLast}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                show={showPw} setShow={setShowPw} st={st}
              />
            )}
            {step === 1 && (
              <StepOutlets
                companyName={companyName} setCompanyName={setCompanyName}
                country={country} setCountry={setCountry} city={city} setCity={setCity}
                currency={currency} setCurrency={setCurrency} taxReg={taxReg} setTaxReg={setTaxReg}
              />
            )}
            {step === 2 && <StepModules modules={modules} toggle={toggleModule} />}
            {step === 3 && (
              <StepTeam
                team={team} setTeam={setTeam} roles={roles}
                footnote="Invitees set their own password and must verify their email. The account owner stays the only workspace owner until they promote someone."
              />
            )}

            {error && (
              <div className="mt-5 rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <div>
                {step > 0 && (
                  <button onClick={() => { setError(null); setStep((s) => s - 1); }} disabled={busy} className={BTN_GHOST}>
                    ← Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                {step === LAST && (
                  <button onClick={() => finish(false)} disabled={busy}
                          className="text-[14px] font-semibold text-[#9a948a] transition-colors hover:text-[#26241f] disabled:opacity-50">
                    Skip invites &amp; create
                  </button>
                )}
                {step < LAST ? (
                  <button onClick={next} className={BTN_PRIMARY}>Continue</button>
                ) : (
                  <button onClick={() => finish(true)} disabled={busy} className={BTN_PRIMARY}>
                    {busy ? <><Loader2 size={17} className="animate-spin" /> Creating…</> : "Create workspace & send invites"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Step 1 — Account (same fields as the old self-serve signup)
// --------------------------------------------------------------------------- //
function StepAccount(p: {
  first: string; setFirst: (v: string) => void;
  last: string; setLast: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void;
  st: { pct: number; color: string };
}) {
  return (
    <>
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Create the owner account</h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#8a8579]">
        This person becomes the workspace owner. They&apos;ll confirm their email with a code the first time they sign in.
      </p>

      <div className={`mt-8 ${CARD}`}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="aw-first" className={LABEL}>First name</label>
            <input id="aw-first" className={INPUT} placeholder="Amara" value={p.first}
                   onChange={(e) => p.setFirst(e.target.value)} />
          </div>
          <div>
            <label htmlFor="aw-last" className={LABEL}>Last name</label>
            <input id="aw-last" className={INPUT} placeholder="Okonjo" value={p.last}
                   onChange={(e) => p.setLast(e.target.value)} />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="aw-email" className={LABEL}>Work email</label>
          <input id="aw-email" type="email" autoComplete="off" className={INPUT} placeholder="owner@northgate.co"
                 value={p.email} onChange={(e) => p.setEmail(e.target.value)} />
        </div>

        <div className="mt-5">
          <label htmlFor="aw-password" className={LABEL}>Initial password</label>
          <div className="relative">
            <input id="aw-password" type={p.show ? "text" : "password"} autoComplete="new-password"
                   placeholder="At least 10 characters" className={`${INPUT} pr-11`}
                   value={p.password} onChange={(e) => p.setPassword(e.target.value)} />
            <button type="button" onClick={() => p.setShow(!p.show)} aria-label="Toggle password"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9a948a] hover:text-[#26241f]">
              {p.show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDEBE4]">
            <div className="h-full rounded-full transition-all" style={{ width: `${p.st.pct}%`, background: p.st.color }} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#9a948a]">
            Share it with the owner securely. If this email already owns a workspace, their existing password is kept and this field is ignored.
          </p>
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- //
// Result screen
// --------------------------------------------------------------------------- //
function Done({ result, onClose }: { result: CreateWorkspaceResult; onClose: () => void }) {
  const { company, owner, invited, skipped } = result;
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFBEF]">
        <CheckCircle2 size={28} className="text-[#189315]" />
      </div>
      <h1 className="text-[32px] font-extrabold leading-tight text-[#211f1c]">Workspace created</h1>
      <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-relaxed text-[#8a8579]">
        <b className="text-[#3a372f]">{company.name}</b> is ready. {owner.name} can sign in with{" "}
        <b className="text-[#3a372f]">{owner.email}</b>
        {owner.existingAccount
          ? " using their existing password."
          : owner.emailVerified
            ? " and the initial password you set."
            : " and the initial password you set — they'll be asked to verify their email with a code on first sign-in."}
      </p>

      {(invited.length > 0 || skipped.length > 0) && (
        <div className={`mx-auto mt-6 max-w-[460px] text-left ${CARD}`}>
          {invited.length > 0 && (
            <>
              <div className="text-[12px] font-bold uppercase tracking-wide text-[#a39c8f]">Invitations sent</div>
              <ul className="mt-2 space-y-1 text-[14px] text-[#26241f]">
                {invited.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="truncate">{i.email}</span>
                    <span className="text-[#a39c8f]">{i.role}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {skipped.length > 0 && (
            <>
              <div className={"text-[12px] font-bold uppercase tracking-wide text-[#C0392B] " + (invited.length ? "mt-4" : "")}>
                Skipped
              </div>
              <ul className="mt-2 space-y-1 text-[13.5px] text-[#26241f]">
                {skipped.map((s) => (
                  <li key={s.email}>{s.email} <span className="text-[#a39c8f]">— {s.reason}</span></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <button onClick={onClose} className={`${BTN_PRIMARY} mx-auto mt-8`}>Done</button>
    </div>
  );
}
