"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Store, Check, Shirt, Layers, ShoppingCart, Truck, Landmark, TrendingUp,
  BadgeCheck, Package, Globe, Share2, Trash2, Plus, KeyRound, Loader2,
  type LucideIcon,
} from "lucide-react";
import { useAuth, type CompanySetupPayload } from "@/lib/auth";
import { getAssignableRoles } from "@/lib/admin-api";
import { CURRENCIES } from "@/lib/currency";

// ---- theme tokens (matched to the setup mockups) --------------------------
const INPUT =
  "w-full h-12 rounded-[10px] border border-[#e4e0d6] bg-white px-3.5 text-[15px] text-[#26241f] placeholder:text-[#b3ab9e] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20";
const LABEL = "mb-2 block text-[13px] font-bold text-[#3a372f]";
const CARD = "rounded-[20px] border border-[#ecebe2] bg-white p-6 shadow-[0_10px_40px_rgba(120,90,60,0.06)]";
const BTN_PRIMARY =
  "flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#F58220] px-6 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(234,108,24,0.28)] transition-colors hover:bg-[#EA6C18] disabled:opacity-60";
const BTN_GHOST =
  "flex h-12 items-center gap-2 rounded-[10px] border border-[#e4e0d6] bg-white px-5 text-[15px] font-bold text-[#26241f] transition-colors hover:bg-[#faf7f1]";

const CURRENCY_LABEL: Record<string, string> = {
  PKR: "Pakistani rupee", USD: "US dollar", EUR: "Euro", AED: "UAE dirham",
};

interface ModuleDef {
  key: string; label: string; desc: string; icon: LucideIcon;
  core?: boolean; defaultOn?: boolean;
}
const MODULES: ModuleDef[] = [
  { key: "catalog", label: "Catalog", desc: "Products, variants, pricing", icon: Shirt, core: true },
  { key: "inventory", label: "Inventory", desc: "Stock levels, transfers, stock takes", icon: Layers, core: true },
  { key: "sales", label: "Sales & Orders", desc: "Tills, orders, returns", icon: ShoppingCart, core: true },
  { key: "procurement", label: "Procurement", desc: "Suppliers, POs, goods received", icon: Truck, defaultOn: true },
  { key: "finance", label: "Finance", desc: "Ledger, tax, payables", icon: Landmark },
  { key: "production", label: "Production", desc: "Work orders, BOMs, assembly", icon: TrendingUp },
  { key: "quality", label: "Quality", desc: "Inspections, holds, returns to vendor", icon: BadgeCheck },
  { key: "shipments", label: "Shipments", desc: "Dispatch, carriers, tracking", icon: Package },
  { key: "channels", label: "Channels", desc: "Online store, marketplaces, wholesale", icon: Globe },
  { key: "demand", label: "Demand Planning", desc: "Forecasts, replenishment suggestions", icon: Share2 },
];
const STEPS = ["Outlets", "Modules", "Your team"];

type TeamRow = { email: string; role: string };

export function SetupWizard() {
  const router = useRouter();
  const { user, completeSetup } = useAuth();

  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1 — Outlets
  const [companyName, setCompanyName] = React.useState(user?.company?.name ?? "");
  const [country, setCountry] = React.useState("");
  const [city, setCity] = React.useState("");
  const [currency, setCurrency] = React.useState<string>(user?.company?.currency ?? "PKR");
  const [taxReg, setTaxReg] = React.useState("");

  // Step 2 — Modules (core + procurement pre-selected)
  const [modules, setModules] = React.useState<Set<string>>(
    () => new Set(MODULES.filter((m) => m.core || m.defaultOn).map((m) => m.key)),
  );

  // Step 3 — Team
  const [roles, setRoles] = React.useState<string[]>([
    "Admin", "Manager", "Merchandiser", "Accountant", "User Overview", "Logistics / Inventory",
  ]);
  const [team, setTeam] = React.useState<TeamRow[]>([{ email: "", role: "Manager" }]);

  React.useEffect(() => {
    getAssignableRoles()
      .then((r) => { if (r && r.length) { setRoles(r); setTeam((t) => t.map((row) => ({ ...row, role: r.includes(row.role) ? row.role : r[0] }))); } })
      .catch(() => { /* keep fallback list */ });
  }, []);

  const toggleModule = (m: ModuleDef) => {
    if (m.core) return; // core modules are always on
    setModules((s) => { const n = new Set(s); n.has(m.key) ? n.delete(m.key) : n.add(m.key); return n; });
  };

  const buildPayload = (invites: TeamRow[]): CompanySetupPayload => ({
    companyName: (companyName.trim() || user?.company?.name || "My workspace"),
    country: country.trim() || undefined,
    city: city.trim() || undefined,
    currency,
    taxRegistration: taxReg.trim() || undefined,
    modules: Array.from(modules),
    invites: invites
      .map((t) => ({ email: t.email.trim(), role: t.role }))
      .filter((t) => t.email.length > 0),
  });

  const finish = async (withInvites: boolean) => {
    setBusy(true); setError(null);
    try {
      const user2 = await completeSetup(buildPayload(withInvites ? team : []));
      router.push("/dashboard/overview");
      return user2;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your setup.");
      setBusy(false);
    }
  };

  const next = () => {
    setError(null);
    if (step === 0 && !companyName.trim()) { setError("Company name is required."); return; }
    setStep((s) => Math.min(2, s + 1));
  };

  return (
    <div className="min-h-screen bg-[#f6f5ef]">
      {/* top bar with stepper */}
      <header className="flex items-center justify-between border-b border-[#ecebe2] bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white"
                style={{ background: "linear-gradient(135deg,#F58220,#EA6C18)" }}>
            <Store size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[16px] font-extrabold tracking-tight text-[#211f1c]">Preduit Retail</span>
        </div>

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

        <button onClick={() => finish(false)} disabled={busy}
                className="text-[14px] font-semibold text-[#9a948a] transition-colors hover:text-[#26241f]">
          Save &amp; exit
        </button>
      </header>

      {/* body */}
      <main className="mx-auto w-full max-w-[760px] px-6 py-12">
        <div className="mb-2 text-[13px] font-bold tracking-[0.08em] text-[#F58220]">Step {step + 1} of 3</div>

        {step === 0 && (
          <StepOutlets
            companyName={companyName} setCompanyName={setCompanyName}
            country={country} setCountry={setCountry} city={city} setCity={setCity}
            currency={currency} setCurrency={setCurrency} taxReg={taxReg} setTaxReg={setTaxReg}
          />
        )}
        {step === 1 && <StepModules modules={modules} toggle={toggleModule} />}
        {step === 2 && <StepTeam team={team} setTeam={setTeam} roles={roles} />}

        {error && (
          <div className="mt-5 rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
        )}

        {/* footer nav */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {step > 0 && (
              <button onClick={() => { setError(null); setStep((s) => s - 1); }} className={BTN_GHOST}>
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {step === 2 && (
              <button onClick={() => finish(false)} disabled={busy}
                      className="text-[14px] font-semibold text-[#9a948a] transition-colors hover:text-[#26241f]">
                Skip for now
              </button>
            )}
            {step < 2 ? (
              <button onClick={next} className={BTN_PRIMARY}>Continue</button>
            ) : (
              <button onClick={() => finish(true)} disabled={busy} className={BTN_PRIMARY}>
                {busy ? <><Loader2 size={17} className="animate-spin" /> Finishing…</> : "Send invites and finish"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Step 1 — Outlets
// --------------------------------------------------------------------------- //
function StepOutlets(p: {
  companyName: string; setCompanyName: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  city: string; setCity: (v: string) => void;
  currency: string; setCurrency: (v: string) => void;
  taxReg: string; setTaxReg: (v: string) => void;
}) {
  return (
    <>
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Where do you sell?</h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#8a8579]">
        Tell us where the business is based. You can add more outlets from Settings once you&apos;re inside.
      </p>

      <div className={`mt-8 ${CARD}`}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className={LABEL}>Company name</label>
            <input className={INPUT} placeholder="Northgate Main" value={p.companyName} onChange={(e) => p.setCompanyName(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Country</label>
            <input className={INPUT} placeholder="Pakistan" value={p.country} onChange={(e) => p.setCountry(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>City</label>
            <input className={INPUT} placeholder="Lahore" value={p.city} onChange={(e) => p.setCity(e.target.value)} />
          </div>
        </div>

        <div className="my-5 border-t border-[#efece4]" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Reporting currency</label>
            <select className={INPUT} value={p.currency} onChange={(e) => p.setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c} — {CURRENCY_LABEL[c] ?? c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Sales tax registration</label>
            <input className={`${INPUT} font-mono`} placeholder="NTN / VAT number" value={p.taxReg} onChange={(e) => p.setTaxReg(e.target.value)} />
          </div>
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- //
// Step 2 — Modules
// --------------------------------------------------------------------------- //
function StepModules({ modules, toggle }: { modules: Set<string>; toggle: (m: ModuleDef) => void }) {
  return (
    <>
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Which modules do you need?</h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#8a8579]">
        Turn on what you use today. Modules can be switched on any time without losing data.
      </p>

      <div className={`mt-8 ${CARD}`}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {MODULES.map((m) => {
            const on = modules.has(m.key);
            const Icon = m.icon;
            return (
              <button key={m.key} type="button" onClick={() => toggle(m)}
                      className={"flex items-start gap-3 rounded-[14px] border p-4 text-left transition-colors " +
                        (on ? "border-[#F58220] bg-[#FEF4EA]" : "border-[#e7e4db] bg-white hover:border-[#d9d4c8]") +
                        (m.core ? " cursor-default" : " cursor-pointer")}>
                <span className={"mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] " +
                  (on ? "bg-[#F58220]/15 text-[#EA6C18]" : "bg-[#f1efe8] text-[#9a948a]")}>
                  <Icon size={19} strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-extrabold text-[#211f1c]">{m.label}</span>
                    {m.core && <span className="text-[10px] font-bold tracking-[0.12em] text-[#b6ad9e]">CORE</span>}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-[#8a8579]">{m.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- //
// Step 3 — Your team
// --------------------------------------------------------------------------- //
function StepTeam({ team, setTeam, roles }: {
  team: TeamRow[]; setTeam: React.Dispatch<React.SetStateAction<TeamRow[]>>; roles: string[];
}) {
  const patch = (i: number, next: Partial<TeamRow>) =>
    setTeam((t) => t.map((r, j) => (j === i ? { ...r, ...next } : r)));
  const add = () => setTeam((t) => [...t, { email: "", role: roles[0] ?? "Manager" }]);
  const remove = (i: number) => setTeam((t) => (t.length === 1 ? t : t.filter((_, j) => j !== i)));

  return (
    <>
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#211f1c]">Bring your team in</h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#8a8579]">
        Invite the people who&apos;ll work in Preduit. They get their own login and only see what their role allows.
      </p>

      <div className={`mt-8 ${CARD}`}>
        <div className="mb-2 grid grid-cols-[1fr_220px_44px] gap-3">
          <span className={LABEL}>Teammate email</span>
          <span className={LABEL}>Role</span>
          <span />
        </div>
        <div className="space-y-3">
          {team.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_220px_44px] items-center gap-3">
              <input className={INPUT} placeholder="colleague@company.com" value={row.email}
                     onChange={(e) => patch(i, { email: e.target.value })} />
              <select className={INPUT} value={row.role} onChange={(e) => patch(i, { role: e.target.value })}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="button" onClick={() => remove(i)} aria-label="Remove teammate"
                      className="flex h-12 w-11 items-center justify-center rounded-[10px] border border-[#e4e0d6] text-[#9a948a] transition-colors hover:bg-[#faf7f1] hover:text-[#C0392B] disabled:opacity-40"
                      disabled={team.length === 1}>
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={add}
                className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-dashed border-[#F58220]/50 bg-[#FEF4EA] px-4 py-2.5 text-[14px] font-bold text-[#EA6C18] transition-colors hover:bg-[#fdecdb]">
          <Plus size={16} strokeWidth={2.5} /> Add teammate
        </button>

        <div className="mt-5 flex items-start gap-2.5 rounded-[12px] bg-[#F3EAFB] px-4 py-3.5 text-[13px] leading-relaxed text-[#6D4E9C]">
          <KeyRound size={16} className="mt-0.5 shrink-0" />
          <p>Invitees set their own password and must verify their email. You stay the only workspace owner until you promote someone.</p>
        </div>
      </div>
    </>
  );
}
