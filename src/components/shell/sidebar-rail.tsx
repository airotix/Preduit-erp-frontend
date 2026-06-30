"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/config/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export function SidebarRail() {
  const pathname = usePathname();
  const activeModule = pathname.split("/")[1] ?? "dashboard";

  return (
    <aside className="flex w-[78px] flex-shrink-0 flex-col items-center bg-brand-ink py-[18px]">
      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-d text-xl font-extrabold tracking-tight text-white shadow-[0_6px_16px_rgba(243,101,35,0.4)]">
        S
      </div>
      <div className="mt-1.5 text-[8px] font-bold tracking-[0.16em] text-white/50">
        SYS ERP
      </div>

      <nav className="mt-[30px] flex flex-1 flex-col items-center gap-2">
        {MODULES.map((m) => {
          const active = m.id === activeModule;
          return (
            <Link
              key={m.id}
              href={`/${m.id}/${m.tabs[0].id}`}
              title={m.label}
              className={cn(
                "flex h-[46px] w-[46px] items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <Icon name={m.icon} width={21} height={21} strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>

      <div className="flex w-[46px] flex-col items-center gap-3.5 border-t border-white/[0.08] pt-3.5">
        <div className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#5B6478] to-[#3A4256] text-xs font-bold text-white">
          AK
        </div>
        <button
          title="Sign out"
          className="flex p-1 text-white/45 transition-colors hover:text-brand-orange"
        >
          <Icon name="Power" width={19} height={19} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
