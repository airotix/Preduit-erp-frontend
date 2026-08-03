"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MODULES } from "@/config/navigation";
import { Icon } from "@/components/icon";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "erp-sidebar-expanded";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function SidebarRail() {
  const pathname = usePathname();
  const activeModule = pathname.split("/")[1] ?? "dashboard";
  const [expanded, setExpanded] = React.useState(false);
  const { logout, user, hasPermission } = useAuth();

  // Team/admin tools are only shown to workspace admins (and Super Admins).
  const modules = MODULES.filter((m) =>
    m.id === "admin" ? !user || hasPermission("admin.users") : true
  );

  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<{ businessName: string | null }>("/me"),
    enabled: USE_BACKEND,
    staleTime: 5 * 60 * 1000,
  });
  const businessName = data?.businessName || "SYS ERP";
  const badge = initials(businessName);

  // Restore the preference after mount (keeps SSR markup stable).
  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v !== null) setExpanded(v === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () =>
    setExpanded((e) => {
      const next = !e;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  return (
    <aside
      className={cn(
        "flex flex-shrink-0 flex-col bg-brand-ink py-[18px] transition-[width] duration-200",
        expanded ? "w-[184px] px-3" : "w-[78px] items-center"
      )}
    >
      {/* Brand — business name from signup */}
      <div className={cn("flex", expanded ? "items-center gap-2.5 px-1" : "flex-col items-center")}>
        <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-d text-base font-extrabold tracking-tight text-white shadow-[0_6px_16px_rgba(243,101,35,0.4)]">
          {badge}
        </div>
        {expanded ? (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-extrabold leading-tight text-white" title={businessName}>
              {businessName}
            </div>
            <div className="text-[9px] font-bold tracking-[0.16em] text-white/40">ERP</div>
          </div>
        ) : (
          <div className="mt-1.5 text-[8px] font-bold tracking-[0.16em] text-white/50">ERP</div>
        )}
      </div>

      {/* Collapse / expand toggle */}
      <button
        type="button"
        onClick={toggle}
        title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        suppressHydrationWarning
        className={cn(
          "mt-3.5 flex items-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white",
          expanded ? "h-8 w-full gap-2 px-3 text-[12px] font-semibold" : "h-8 w-[46px] justify-center"
        )}
      >
        <Icon name={expanded ? "ChevronsLeft" : "ChevronsRight"} width={18} height={18} strokeWidth={1.75} />
        {expanded && <span>Collapse</span>}
      </button>

      {/* Modules */}
      <nav className={cn("mt-4 flex flex-1 flex-col", expanded ? "gap-1" : "items-center gap-2")}>
        {modules.map((m) => {
          const active = m.id === activeModule;
          return (
            <Link
              key={m.id}
              href={`/${m.id}/${m.tabs[0].id}`}
              title={expanded ? undefined : m.label}
              className={cn(
                "flex rounded-xl transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white",
                expanded
                  ? "h-[42px] items-center gap-3 px-3"
                  : "h-[46px] w-[46px] items-center justify-center"
              )}
            >
              <Icon name={m.icon} width={21} height={21} strokeWidth={1.75} className="shrink-0" />
              {expanded && (
                <span className="truncate text-[12.5px] font-semibold leading-tight">
                  {m.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-white/[0.08] pt-3.5",
          expanded ? "flex items-center justify-between px-1" : "flex w-[46px] flex-col items-center gap-3.5"
        )}
      >
        <div className={cn("flex items-center", expanded && "gap-2.5")}>
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-[#5B6478] to-[#3A4256] text-xs font-bold text-white">
            AK
          </div>
          {expanded && <span className="text-[12px] font-semibold text-white/70">Account</span>}
        </div>
        <button
          type="button"
          title="Sign out"
          aria-label="Sign out"
          onClick={logout}
          suppressHydrationWarning
          className={cn(
            "flex p-1 text-white/45 transition-colors hover:text-brand-orange",
            !expanded && "mt-0"
          )}
        >
          <Icon name="Power" width={19} height={19} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
