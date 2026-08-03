"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Truck, Package, Users, ShieldCheck, Check, Lock } from "lucide-react";

/** Logo lockup: orange tile + Preduit / RETAIL ERP. */
export function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-[11px] text-white"
        style={{ background: "linear-gradient(135deg,#F58220,#EA6C18)", boxShadow: "0 8px 20px rgba(234,108,24,0.35)" }}
      >
        <Store size={20} strokeWidth={2.2} />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-tight text-[#211f1c]">Preduit</span>
        <span className="mt-0.5 block text-[10px] font-bold tracking-[0.16em] text-[#a39c8f]">RETAIL ERP</span>
      </span>
    </div>
  );
}

/** Top bar: logo left, context CTA right. */
export function AuthTopBar() {
  const pathname = usePathname() || "";
  const onSignup = pathname.startsWith("/signup") || pathname.startsWith("/verify");
  return (
    <div className="flex items-center justify-between">
      <BrandLockup />
      <div className="flex items-center gap-3 text-[14px]">
        <span className="hidden text-[#8a8579] sm:inline">
          {onSignup ? "Already have a workspace?" : "New to Preduit?"}
        </span>
        <Link href={onSignup ? "/login" : "/signup"}
              className="rounded-[10px] border border-[#e4e0d6] bg-white px-4 py-2 font-bold text-[#26241f] transition-colors hover:bg-[#faf7f1]">
          {onSignup ? "Sign in" : "Create a workspace"}
        </Link>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Right-hand aside — content switches by route.
// --------------------------------------------------------------------------- //
function AsideShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative hidden flex-1 overflow-hidden lg:block"
         style={{ background: "radial-gradient(120% 80% at 100% 0%, #FBD3AE 0%, rgba(251,211,174,0) 46%), linear-gradient(180deg,#FCEFE1 0%,#FBEEE5 55%,#F1E7FB 100%)" }}>
      <div className="flex h-full flex-col justify-center px-14 py-16">
        <div className="max-w-[540px]">{children}</div>
      </div>
    </div>
  );
}

type Step = { title: string; desc: string };

function StepsAside({ eyebrow, heading, steps, done, active, footnote }: {
  eyebrow: string; heading: string; steps: Step[]; done: number; active: number; footnote: string;
}) {
  return (
    <AsideShell>
      <div className="text-[12px] font-bold tracking-[0.16em] text-[#EA6C18]">{eyebrow}</div>
      <h2 className="mt-3 text-[38px] font-extrabold leading-[1.08] tracking-tight text-[#211f1c]">{heading}</h2>
      <div className="mt-8 space-y-1.5">
        {steps.map((s, i) => {
          const state = i < done ? "done" : i === active ? "active" : "todo";
          return (
            <div key={i} className={state === "active"
              ? "rounded-[16px] bg-white p-4 shadow-[0_16px_44px_rgba(120,90,60,0.14)]"
              : "px-4 py-3"}>
              <div className="flex gap-3">
                <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
                  (state === "done" ? "bg-[#24B34B] text-white"
                    : state === "active" ? "bg-[#F58220] text-white" : "bg-[#EDEBE4] text-[#a39c8f]")}>
                  {state === "done" ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <div>
                  <div className="text-[14.5px] font-bold text-[#211f1c]">{s.title}</div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#6f6a60]">{s.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-start gap-2 px-4 text-[12.5px] leading-relaxed text-[#8a7f70]">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#189315]" />
        <p>{footnote}</p>
      </div>
    </AsideShell>
  );
}

function FeatureAside() {
  return (
    <AsideShell>
      <div className="text-[12px] font-bold tracking-[0.16em] text-[#EA6C18]">RETAIL ERP</div>
      <h2 className="mt-3 text-[40px] font-extrabold leading-[1.08] tracking-tight text-[#211f1c]">
        Every till, aisle and invoice in one place.
      </h2>
      <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-[#6f6a60]">
        Inventory, purchasing, POS and accounts stay in sync across outlets — so the number you see at 9am is the
        number that&apos;s true at 9pm.
      </p>
      <div className="mt-8 rounded-[18px] bg-white p-5 shadow-[0_20px_50px_rgba(120,90,60,0.14)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.12em] text-[#8a8579]">HOW IT FITS TOGETHER</span>
          <span className="rounded-full bg-[#ECFBEF] px-2.5 py-0.5 text-[11px] font-bold text-[#189315]">● One record</span>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F3E8FF] text-[#A51BFC]">
            <Truck size={18} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] text-[#A51BFC]">IN THE BACK OFFICE</div>
            <div className="text-[15px] font-extrabold text-[#211f1c]">Low stock writes its own PO</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6f6a60]">
              Reorder points raise a draft purchase order against the supplier you actually buy from, ready for a
              manager to approve or edit.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-[#E8E7E0]" />
          <span className="h-1.5 flex-1 rounded-full bg-[#A51BFC]" />
          <span className="h-1.5 flex-1 rounded-full bg-[#E8E7E0]" />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <Bullet icon={<Package size={16} strokeWidth={2.2} />} tint="#FCEEE2" fg="#C2511A"
                lead="Live stock across outlets" rest="— no more midnight spreadsheet reconciliation." />
        <Bullet icon={<Users size={16} strokeWidth={2.2} />} tint="#F3E8FF" fg="#A51BFC"
                lead="Role-based access" rest="— cashiers see tills, managers see margins." />
        <Bullet icon={<ShieldCheck size={16} strokeWidth={2.2} />} tint="#ECFBEF" fg="#189315"
                lead="Audit trail on every edit" rest="— who changed the price, and when." />
      </div>
    </AsideShell>
  );
}

function Bullet({ icon, tint, fg, lead, rest }: { icon: React.ReactNode; tint: string; fg: string; lead: string; rest: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: tint, color: fg }}>{icon}</span>
      <p className="text-[14px] leading-relaxed text-[#6f6a60]"><span className="font-bold text-[#211f1c]">{lead}</span> {rest}</p>
    </div>
  );
}

const ONBOARDING: Step[] = [
  { title: "Create your account", desc: "Your name, work email and a password — you become the workspace owner." },
  { title: "Describe the business", desc: "Business name, sector and rough size so we can set sensible defaults." },
  { title: "Verify your email", desc: "A 6-digit code proves the address is yours before any data goes in." },
  { title: "Set up outlets and team", desc: "Add stores, switch on the modules you use, invite the people who need access." },
];
const RECOVERY: Step[] = [
  { title: "Confirm your email", desc: "We match it to a Preduit account and send a single-use link." },
  { title: "Open the link within 30 minutes", desc: "It works once, on any device, and expires after that." },
  { title: "Set a new password", desc: "At least 10 characters — a short phrase beats a clever symbol." },
  { title: "Sign back in everywhere", desc: "Other sessions and tills sign out, so re-enter it on shared devices." },
];
const LOCKED: Step[] = [
  { title: "Wait out the 15 minutes", desc: "The lock lifts on its own — no ticket needed, nothing is deleted." },
  { title: "Or reset your password now", desc: "A reset link clears the lock immediately once you set a new password." },
  { title: "Check you're on the right workspace", desc: "Staff accounts belong to one business — the email and business name must match." },
  { title: "Still stuck? Ask an owner", desc: "Workspace owners can unlock a colleague from Settings → People." },
];

export function AuthAside() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/signup"))
    return <StepsAside eyebrow="GETTING STARTED" heading="From sign-up to first sale." steps={ONBOARDING} done={0} active={0}
                       footnote="Nothing is billed during setup. You stay the only owner until you promote a teammate." />;
  if (pathname.startsWith("/verify"))
    return <StepsAside eyebrow="GETTING STARTED" heading="From sign-up to first sale." steps={ONBOARDING} done={2} active={2}
                       footnote="Nothing is billed during setup. You stay the only owner until you promote a teammate." />;
  if (pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password"))
    return <StepsAside eyebrow="ACCOUNT RECOVERY" heading="Four steps to get back in." steps={RECOVERY} done={0} active={0}
                       footnote="We never send passwords by email, and support staff can't read yours. If you didn't request a reset, ignore the email — nothing changes." />;
  if (pathname.startsWith("/locked"))
    return <StepsAside eyebrow="LOCKED OUT" heading="Here's how to get moving." steps={LOCKED} done={0} active={0}
                       footnote="Five failed attempts trigger a 15-minute lock. Repeated lockouts are flagged to your workspace owner." />;
  return <FeatureAside />;
}
