import { SidebarRail } from "@/components/shell/sidebar-rail";
import { Topbar } from "@/components/shell/topbar";
import { CurrencyProvider } from "@/lib/currency";
import { RequireAuth } from "@/components/auth/require-auth";
import { NavigationProvider } from "@/components/shell/navigation-context";

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <NavigationProvider>
      <div className="erp-shell flex h-dvh w-full bg-[#C8CCD5] p-0 sm:p-2">
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white shadow-erp-lg sm:rounded-[18px]">
          <SidebarRail />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
            <CurrencyProvider>
              <Topbar />
              {children}
            </CurrencyProvider>
          </main>
        </div>
      </div>
      </NavigationProvider>
    </RequireAuth>
  );
}
