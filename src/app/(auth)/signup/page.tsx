"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiPost } from "@/lib/api-client";

const INPUT =
  "w-full h-12 rounded-[10px] border border-[#e4e0d6] bg-white px-3.5 text-[15px] text-[#26241f] placeholder:text-[#b3ab9e] outline-none transition-colors focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20";
const LABEL = "mb-2 block text-[13px] font-bold text-[#3a372f]";

export default function WorkspaceRequestPage() {
  const [form, setForm] = React.useState({
    name: "", contactNumber: "", email: "", businessName: "", businessDescription: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = form.name.trim() && form.contactNumber.trim() && form.email.trim() && form.businessName.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { setError("Please fill in all required fields."); return; }
    setBusy(true); setError(null);
    try {
      await apiPost("/auth/workspace-request", form);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFBEF]">
          <CheckCircle2 size={28} className="text-[#189315]" />
        </div>
        <h1 className="text-[32px] font-extrabold leading-tight text-[#211f1c]">Request submitted</h1>
        <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-relaxed text-[#8a8579]">
          Thank you! Our team will review your request and set up your workspace. We&apos;ll reach out to you at <b className="text-[#3a372f]">{form.email}</b> once it&apos;s ready.
        </p>
        <a href="/login" className="mt-6 inline-block text-[14px] font-bold text-[#F58220] hover:underline">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[36px] font-extrabold leading-none tracking-tight text-[#211f1c]">Request a workspace</h1>
      <p className="mt-3 text-[15px] text-[#8a8579]">Tell us about your business and we&apos;ll set up a workspace for you.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className={LABEL}>Full name *</label>
          <input id="name" className={INPUT} placeholder="Your full name" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label htmlFor="contactNumber" className={LABEL}>Contact number *</label>
          <input id="contactNumber" type="tel" className={INPUT} placeholder="+1 234 567 8900" value={form.contactNumber} onChange={set("contactNumber")} required />
        </div>
        <div>
          <label htmlFor="email" className={LABEL}>Email address *</label>
          <input id="email" type="email" autoComplete="email" className={INPUT} placeholder="you@company.com" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label htmlFor="businessName" className={LABEL}>Business name *</label>
          <input id="businessName" className={INPUT} placeholder="Your company name" value={form.businessName} onChange={set("businessName")} required />
        </div>
        <div>
          <label htmlFor="businessDescription" className={LABEL}>Business description</label>
          <textarea id="businessDescription" rows={3}
                    className={INPUT + " h-auto py-3 resize-none"}
                    placeholder="Tell us briefly about your business — what you sell, how many locations, etc."
                    value={form.businessDescription} onChange={set("businessDescription")} />
        </div>

        {error && (
          <div className="rounded-lg bg-[#FBEAEA] px-3 py-2.5 text-[13px] font-semibold text-[#C0392B]">{error}</div>
        )}

        <button type="submit" disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F58220] text-[15px] font-bold text-white transition-colors hover:bg-[#EA6C18] disabled:opacity-60">
          {busy ? <><Loader2 size={17} className="animate-spin" /> Submitting…</> : "Submit request"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#9a948a]">
        Already have an account?{" "}
        <a href="/login" className="font-bold text-[#F58220] hover:underline">Sign in</a>
      </p>
    </div>
  );
}
