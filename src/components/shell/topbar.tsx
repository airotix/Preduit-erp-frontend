"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Bell, Sparkles } from "lucide-react";
import { getModule } from "@/config/navigation";
import { QUICK_CREATE, NOTIFICATIONS } from "@/config/topbar-data";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { tone as toneOf } from "@/lib/tone";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const [, moduleId, tabId] = pathname.split("/");
  const mod = getModule(moduleId ?? "dashboard");
  const { user } = useAuth();

  // The cross-company overview tab is Super-Admin only.
  const tabs = (mod?.tabs ?? []).filter(
    (t) => !(mod?.id === "admin" && t.id === "companies") || user?.isPlatformAdmin
  );

  const [notifOpen, setNotifOpen] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="flex flex-shrink-0 items-center gap-5 border-b border-border/70 px-[26px] py-3.5">
      <div className="erp-scroll flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.id === tabId;
          return (
            <Link
              key={t.id}
              href={`/${mod?.id ?? "dashboard"}/${t.id}`}
              className={cn(
                "whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="flex flex-shrink-0 items-center gap-2.5">
        <div className="flex w-[230px] items-center gap-2 rounded-full border border-border/70 bg-muted px-3.5 py-2 text-muted-foreground">
          <Search size={16} strokeWidth={1.9} />
          <input
            placeholder="Search anything…"
            className="w-full border-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <button
          title="Quick create"
          onClick={() => setQuickOpen(true)}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-secondary text-white transition-colors hover:bg-brand-ink"
        >
          <Plus size={19} strokeWidth={2} />
        </button>

        <button
          title="Notifications"
          onClick={() => setNotifOpen(true)}
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border/70 bg-white text-[#4A4F61] transition-colors hover:bg-muted"
        >
          <Bell size={18} strokeWidth={1.9} />
          {unread > 0 && (
            <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-brand-orange" />
          )}
        </button>

        <button className="flex h-[38px] items-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange-d px-4 text-[13px] font-bold text-white transition-[filter] hover:brightness-95">
          <Sparkles size={16} strokeWidth={2} /> Copilot
        </button>
      </div>

      {/* Quick create */}
      <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Quick create</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 px-6 pt-2">
            {QUICK_CREATE.map((q) => (
              <SheetClose asChild key={q.label}>
                <Link
                  href={q.href}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 transition-shadow hover:shadow-erp-md"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: q.bg, color: q.color }}
                  >
                    <Icon name={q.icon} size={20} strokeWidth={1.9} />
                  </span>
                  <span className="font-bold text-foreground">{q.label}</span>
                </Link>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              Notifications{" "}
              {unread > 0 && (
                <span className="ml-1 align-middle">
                  <ToneBadge tone="accent" dot={false}>
                    {unread} new
                  </ToneBadge>
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="erp-scroll flex-1 divide-y divide-border/50 overflow-y-auto px-6">
            {NOTIFICATIONS.map((n, i) => {
              const k = toneOf(n.tone);
              return (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 py-4",
                    n.unread && "-mx-6 bg-[#FFF9F5] px-6"
                  )}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: k.bg, color: k.fg }}
                  >
                    <Icon name={n.icon} size={17} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] leading-snug text-[#3A4150]">
                      {n.text}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {n.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
