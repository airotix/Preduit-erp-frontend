"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Store, Image as ImageIcon, Building2, Tag, MapPin, Phone, Globe, ShieldCheck,
  Linkedin, Instagram, Facebook, Twitter, CheckCircle2, Loader2, BadgeCheck, ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getCompanyProfile, saveCompanyProfile, uploadCompanyImage, fetchImageObjectUrl,
  type CompanyProfile,
} from "@/lib/company-profile-api";

// ---- theme tokens (matched to the Company Profile mockups) ----------------
const INPUT =
  "w-full h-11 rounded-[10px] border border-[#e6e3da] bg-white px-3.5 text-[14px] text-[#26241f] placeholder:text-[#c3bcae] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/15";
const LABEL = "mb-1.5 block text-[13px] font-bold text-[#3a372f]";
const CARD = "rounded-[18px] border border-[#ecebe2] bg-white p-6 shadow-[0_6px_28px_rgba(120,90,60,0.05)]";
const H = "text-[19px] font-extrabold tracking-tight text-[#211f1c]";
const SUB = "mt-1 text-[13.5px] text-[#8a8579]";

const INDUSTRIES = ["Grocery", "Apparel", "Pharmacy", "Electronics", "Hardware", "Home & living"];
const BUSINESS_TYPES = ["Private limited company", "Public limited company", "Sole proprietorship", "Partnership", "LLP"];
const SALES_MODELS = ["In-store retail", "Online store", "Wholesale", "Omnichannel", "Marketplace"];
const SOCIALS: { key: keyof CompanyProfile; icon: typeof Linkedin; prefix: string; tint: string }[] = [
  { key: "linkedin", icon: Linkedin, prefix: "linkedin.com/company/", tint: "#0A66C2" },
  { key: "instagram", icon: Instagram, prefix: "instagram.com/", tint: "#E4405F" },
  { key: "facebook", icon: Facebook, prefix: "facebook.com/", tint: "#1877F2" },
  { key: "x", icon: Twitter, prefix: "x.com/", tint: "#111111" },
];
const SECTIONS = [
  { id: "logo", label: "Logo & cover", icon: ImageIcon },
  { id: "identity", label: "Company identity", icon: Building2 },
  { id: "industry", label: "Industry & type", icon: Tag },
  { id: "founded", label: "Founded & HQ", icon: MapPin },
  { id: "contact", label: "Contact info", icon: Phone },
  { id: "social", label: "Website & social", icon: Globe },
  { id: "legal", label: "Legal & registration", icon: ShieldCheck },
];

const PROGRESS_KEYS: (keyof CompanyProfile)[] = [
  "companyName", "about", "industry", "businessType", "salesModel", "founded", "street",
  "country", "city", "businessEmail", "phone", "website", "legalName", "registrationNumber",
  "taxNumber", "logoDocId", "coverDocId",
];

function initials(name: string | null | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}

export function CompanyProfilePage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission("admin.users");

  const { data } = useQuery({ queryKey: ["company-profile"], queryFn: getCompanyProfile });

  const [form, setForm] = React.useState<CompanyProfile | null>(null);
  const [saved, setSaved] = React.useState<CompanyProfile | null>(null);
  const [preview, setPreview] = React.useState<{ logo?: string | null; cover?: string | null }>({});
  const [active, setActive] = React.useState("logo");
  const [saving, setSaving] = React.useState(false);
  const [imgError, setImgError] = React.useState<string | null>(null);
  const fetchedRef = React.useRef<string>("");

  React.useEffect(() => {
    if (data && !form) { setForm(data); setSaved(data); }
  }, [data, form]);

  // Load previews for already-stored logo/cover once.
  React.useEffect(() => {
    if (!form) return;
    const key = `${form.logoDocId}|${form.coverDocId}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;
    (async () => {
      if (form.logoDocId) { const u = await fetchImageObjectUrl(form.logoDocId); if (u) setPreview((p) => ({ ...p, logo: u })); }
      if (form.coverDocId) { const u = await fetchImageObjectUrl(form.coverDocId); if (u) setPreview((p) => ({ ...p, cover: u })); }
    })();
  }, [form]);

  const set = <K extends keyof CompanyProfile>(k: K, v: CompanyProfile[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);

  const progress = React.useMemo(() => {
    if (!form) return 0;
    const filled = PROGRESS_KEYS.filter((k) => {
      const v = form[k];
      return typeof v === "string" ? v.trim().length > 0 : Boolean(v);
    }).length;
    return Math.round((filled / PROGRESS_KEYS.length) * 100);
  }, [form]);

  const pickImage = async (kind: "logo" | "cover", file: File | null | undefined) => {
    if (!file || !canEdit) return;
    setImgError(null);
    if (file.size > 2 * 1024 * 1024) { setImgError("Image must be under 2 MB."); return; }
    setPreview((p) => ({ ...p, [kind]: URL.createObjectURL(file) }));
    try {
      const id = await uploadCompanyImage(kind, file);
      set(kind === "logo" ? "logoDocId" : "coverDocId", id);
    } catch {
      setImgError("Upload failed — please try again.");
    }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await saveCompanyProfile(form);
      setSaved(res); setForm(res);
    } finally { setSaving(false); }
  };

  const discard = () => { if (saved) setForm(saved); };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!form) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#fbfaf7] text-[13px] font-semibold text-[#8a8579]">
        Loading company profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] pb-24">
      {/* top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#ecebe2] bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard/overview")} title="Back to dashboard"
                  aria-label="Back to dashboard"
                  className="group flex items-center rounded-lg py-2 pl-2 pr-2 text-[#8a8579] transition-colors hover:bg-[#f2efe8] hover:text-[#26241f]">
            <ArrowLeft size={18} strokeWidth={2} />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[150px] group-hover:opacity-100">
              Back to Dashboard
            </span>
          </button>
          <button onClick={() => router.push("/dashboard/overview")} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white"
                  style={{ background: "linear-gradient(135deg,#F58220,#EA6C18)" }}>
              <Store size={18} strokeWidth={2.2} />
            </span>
            <span className="text-[16px] font-extrabold tracking-tight text-[#211f1c]">Preduit Retail</span>
            <span className="ml-1 border-l border-[#e6e3da] pl-3 text-[14px] text-[#8a8579]">Company profile</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-semibold text-[#8a8579]">{progress}% complete</span>
          <span className="h-1.5 w-[130px] overflow-hidden rounded-full bg-[#EDEBE4]">
            <span className="block h-full rounded-full bg-[#F58220] transition-all" style={{ width: `${progress}%` }} />
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EDE6FA] text-[13px] font-bold text-[#7A5AF0]">
            {initials(user?.name || user?.email)}
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        {/* sections nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-[84px]">
            <div className="mb-3 text-[11px] font-bold tracking-[0.14em] text-[#a39c8f]">SECTIONS</div>
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const on = active === s.id;
                return (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                          className={"flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors " +
                            (on ? "font-bold text-[#211f1c]" : "font-semibold text-[#8a8579] hover:text-[#26241f]")}>
                    <Icon size={16} strokeWidth={2} className={on ? "text-[#EA6C18]" : "text-[#b3ab9e]"} />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* content */}
        <div className="space-y-6">
          {/* Logo & cover */}
          <section id="sec-logo" className={CARD + " p-5"}>
            <DropZone
              kind="cover" preview={preview.cover} onPick={pickImage} canEdit={canEdit}
              className="relative flex h-[190px] items-center justify-center overflow-hidden rounded-[14px] bg-[#ece3d2]"
              hint={<><ImageIcon size={26} className="mb-1 text-[#c9bda6]" /><p className="text-[13px] text-[#9a8f78]">Drop a cover image — 1600×400 works well</p><p className="text-[12px] text-[#b1a58c] underline">or browse files</p></>}
            />
            <div className="flex items-end justify-between gap-4 pl-1 pr-1">
              <div className="flex items-end gap-4">
                <div className="relative z-10 -mt-12 shrink-0">
                  <DropZone
                    kind="logo" preview={preview.logo} onPick={pickImage} canEdit={canEdit}
                    className="flex h-[104px] w-[104px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] border border-[#e6e3da] bg-white text-center shadow-[0_8px_24px_rgba(120,90,60,0.10)]"
                    hint={<><ImageIcon size={20} className="text-[#c9bda6]" /><p className="mt-0.5 text-[11px] text-[#9a8f78]">Logo</p><p className="text-[10px] text-[#b1a58c] underline">or browse files</p></>}
                  />
                </div>
                <div className="pb-1.5">
                  <div className="text-[22px] font-extrabold leading-tight tracking-tight text-[#211f1c]">
                    {form.companyName || "Your company name"}
                  </div>
                  <div className="text-[13.5px] text-[#8a8579]">{form.city || "—"}</div>
                </div>
              </div>
              <p className="hidden max-w-[220px] pb-2 text-right text-[12px] leading-relaxed text-[#a39c8f] sm:block">
                Drag images onto the cover or logo. PNG or SVG, under 2 MB.
              </p>
            </div>
            {imgError && <p className="pt-3 text-[12px] font-semibold text-[#C0392B]">{imgError}</p>}
          </section>

          {/* Company identity */}
          <section id="sec-identity" className={CARD}>
            <h2 className={H}>Company identity</h2>
            <p className={SUB}>The name customers see on receipts, invoices and your online store.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className={LABEL}>Company name</label>
                <input className={INPUT} placeholder="Northgate Retail Group" value={form.companyName}
                       onChange={(e) => set("companyName", e.target.value)} readOnly={!canEdit} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL}>About the business</label>
                  <span className="text-[12px] text-[#b3ab9e]">{form.about.length} / 280</span>
                </div>
                <textarea className={`${INPUT} h-24 resize-none py-2.5`} maxLength={280} readOnly={!canEdit}
                          placeholder="A sentence or two on what you sell and who you serve. This shows on your storefront and supplier portal."
                          value={form.about} onChange={(e) => set("about", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Industry & type */}
          <section id="sec-industry" className={CARD}>
            <h2 className={H}>Industry &amp; business type</h2>
            <p className={SUB}>We use this to preset tax categories, unit types and report templates.</p>
            <div className="mt-5">
              <label className={LABEL}>Industry</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => {
                  const on = form.industry === ind;
                  return (
                    <button key={ind} type="button" disabled={!canEdit} onClick={() => set("industry", on ? "" : ind)}
                            className={"rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors " +
                              (on ? "border-[#F58220] bg-[#FEF4EA] text-[#26241f]" : "border-[#e6e3da] bg-white text-[#6f6a60] hover:border-[#d9d4c8]")}>
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Business type</label>
                <select className={INPUT} value={form.businessType} onChange={(e) => set("businessType", e.target.value)} disabled={!canEdit}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Primary sales model</label>
                <select className={INPUT} value={form.salesModel} onChange={(e) => set("salesModel", e.target.value)} disabled={!canEdit}>
                  <option value="">Select…</option>
                  {SALES_MODELS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Founded & HQ */}
          <section id="sec-founded" className={CARD}>
            <h2 className={H}>Founded &amp; headquarters</h2>
            <p className={SUB}>Your registered head office. This address prints on invoices and purchase orders.</p>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[140px_1fr]">
              <div>
                <label className={LABEL}>Founded</label>
                <input className={INPUT} placeholder="2014" value={form.founded} onChange={(e) => set("founded", e.target.value)} readOnly={!canEdit} />
              </div>
              <div>
                <label className={LABEL}>Street address</label>
                <input className={INPUT} placeholder="14 Ferozepur Road, Gulberg III" value={form.street} onChange={(e) => set("street", e.target.value)} readOnly={!canEdit} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div><label className={LABEL}>Country</label><input className={INPUT} placeholder="Pakistan" value={form.country} onChange={(e) => set("country", e.target.value)} readOnly={!canEdit} /></div>
              <div><label className={LABEL}>City</label><input className={INPUT} placeholder="Lahore" value={form.city} onChange={(e) => set("city", e.target.value)} readOnly={!canEdit} /></div>
              <div><label className={LABEL}>State / province</label><input className={INPUT} placeholder="Punjab" value={form.state} onChange={(e) => set("state", e.target.value)} readOnly={!canEdit} /></div>
              <div><label className={LABEL}>Postal code</label><input className={INPUT} placeholder="54660" value={form.postal} onChange={(e) => set("postal", e.target.value)} readOnly={!canEdit} /></div>
            </div>
          </section>

          {/* Contact info */}
          <section id="sec-contact" className={CARD}>
            <h2 className={H}>Contact information</h2>
            <p className={SUB}>Where customers and suppliers reach the business — not your personal login.</p>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div><label className={LABEL}>Business email</label><input className={INPUT} placeholder="hello@northgate.co" value={form.businessEmail} onChange={(e) => set("businessEmail", e.target.value)} readOnly={!canEdit} /></div>
              <div><label className={LABEL}>Phone</label><input className={INPUT} placeholder="+92 42 111 000 111" value={form.phone} onChange={(e) => set("phone", e.target.value)} readOnly={!canEdit} /></div>
              <div><label className={LABEL}>Support line <span className="font-normal text-[#b3ab9e]">— optional</span></label><input className={INPUT} placeholder="+92 300 000 0000" value={form.supportLine} onChange={(e) => set("supportLine", e.target.value)} readOnly={!canEdit} /></div>
              <div><label className={LABEL}>Opening hours <span className="font-normal text-[#b3ab9e]">— optional</span></label><input className={INPUT} placeholder="Mon–Sat, 10am–9pm" value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} readOnly={!canEdit} /></div>
            </div>
          </section>

          {/* Website & social */}
          <section id="sec-social" className={CARD}>
            <h2 className={H}>Website &amp; social links</h2>
            <p className={SUB}>Used on receipts and in the customer portal footer. Handles are fine — we&apos;ll build the full URL.</p>
            <div className="mt-5">
              <label className={LABEL}>Website</label>
              <div className="flex overflow-hidden rounded-[10px] border border-[#e6e3da] focus-within:border-[#F58220] focus-within:ring-2 focus-within:ring-[#F58220]/15">
                <span className="grid place-items-center bg-[#f6f3ec] px-3 font-mono text-[13px] text-[#9a948a]">https://</span>
                <input className="h-11 w-full bg-white px-3 text-[14px] text-[#26241f] placeholder:text-[#c3bcae] outline-none" placeholder="northgate.co" value={form.website} onChange={(e) => set("website", e.target.value)} readOnly={!canEdit} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px]" style={{ background: `${s.tint}1A`, color: s.tint }}>
                      <Icon size={18} />
                    </span>
                    <div className="flex w-full overflow-hidden rounded-[10px] border border-[#e6e3da] focus-within:border-[#F58220] focus-within:ring-2 focus-within:ring-[#F58220]/15">
                      <span className="grid place-items-center bg-[#f6f3ec] px-3 font-mono text-[13px] text-[#9a948a]">{s.prefix}</span>
                      <input className="h-11 w-full bg-white px-3 text-[14px] text-[#26241f] placeholder:text-[#c3bcae] outline-none"
                             value={String(form[s.key] ?? "")} onChange={(e) => set(s.key, e.target.value as never)} readOnly={!canEdit} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Legal & registration */}
          <section id="sec-legal" className={CARD}>
            <h2 className={H}>Legal name &amp; registration</h2>
            <p className={SUB}>Must match your registration certificate exactly — tax filings are generated from these fields.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className={LABEL}>Legal business name</label>
                <input className={INPUT} placeholder="Northgate Retail (Private) Limited"
                       value={form.sameAsCompany ? form.companyName : form.legalName}
                       onChange={(e) => set("legalName", e.target.value)} readOnly={!canEdit || form.sameAsCompany} />
                <label className="mt-2 flex items-center gap-2.5 text-[13.5px] text-[#5f5a50]">
                  <input type="checkbox" checked={form.sameAsCompany} disabled={!canEdit}
                         onChange={(e) => set("sameAsCompany", e.target.checked)}
                         className="h-[17px] w-[17px] rounded accent-[#F58220]" />
                  Same as company name
                </label>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div><label className={LABEL}>Registration number</label><input className={`${INPUT} font-mono`} placeholder="0123456-7" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} readOnly={!canEdit} /></div>
                <div><label className={LABEL}>Tax / NTN number</label><input className={`${INPUT} font-mono`} placeholder="1234567-8" value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} readOnly={!canEdit} /></div>
              </div>
              {(!form.registrationNumber.trim() || !form.taxNumber.trim()) && (
                <div className="flex items-start gap-2.5 rounded-[12px] bg-[#FEF4EA] px-4 py-3.5 text-[13px] leading-relaxed text-[#B5691B]">
                  <BadgeCheck size={16} className="mt-0.5 shrink-0" />
                  <p>Add your registration and tax numbers to unlock tax-compliant invoicing and supplier credit terms.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* sticky save bar */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ecebe2] bg-white/95 px-6 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            {dirty
              ? <span className="text-[#B5691B]">● Unsaved changes</span>
              : <span className="flex items-center gap-1.5 text-[#1F9254]"><CheckCircle2 size={16} /> All changes saved</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={discard} disabled={!dirty || saving}
                    className="h-11 rounded-[10px] border border-[#e4e0d6] bg-white px-5 text-[14px] font-bold text-[#26241f] transition-colors hover:bg-[#faf7f1] disabled:opacity-50">
              Discard changes
            </button>
            <button onClick={save} disabled={!dirty || saving || !canEdit}
                    className="flex h-11 items-center gap-2 rounded-[10px] bg-[#F58220] px-6 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(234,108,24,0.28)] transition-colors hover:bg-[#EA6C18] disabled:opacity-50">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Save profile"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- shared drop zone (cover / logo) --------------------------------------
function DropZone({ kind, preview, onPick, canEdit, className, hint }: {
  kind: "logo" | "cover";
  preview?: string | null;
  onPick: (kind: "logo" | "cover", file: File | null | undefined) => void;
  canEdit: boolean;
  className: string;
  hint: React.ReactNode;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className={className + (canEdit ? " cursor-pointer" : "")}
      onClick={() => canEdit && ref.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onPick(kind, e.dataTransfer.files?.[0]); }}
      style={preview ? { backgroundImage: `url(${preview})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {!preview && <div className="flex flex-col items-center">{hint}</div>}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden"
             onChange={(e) => onPick(kind, e.target.files?.[0])} />
    </div>
  );
}
