import { SidebarRail } from "@/components/shell/sidebar-rail";
import { Topbar } from "@/components/shell/topbar";

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen bg-[#C8CCD5] p-4">
      <div className="flex flex-1 overflow-hidden rounded-[22px] bg-white shadow-erp-lg">
        <SidebarRail />
        <main className="flex min-w-0 flex-1 flex-col bg-white">
          <Topbar />
          {children}
        </main>
      </div>
    </div>
  );
}
