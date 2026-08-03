import { SidebarRail } from "@/components/shell/sidebar-rail";
import { Topbar } from "@/components/shell/topbar";
import { CurrencyProvider } from "@/lib/currency";
import { RequireAuth } from "@/components/auth/require-auth";

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex h-screen w-screen bg-[#C8CCD5] p-2">
        <div className="flex flex-1 overflow-hidden rounded-[18px] bg-white shadow-erp-lg">
          <SidebarRail />
          <main className="flex min-w-0 flex-1 flex-col bg-white">
            <CurrencyProvider>
              <Topbar />
              {children}
            </CurrencyProvider>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
