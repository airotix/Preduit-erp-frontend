import { notFound } from "next/navigation";
import { MODULES, getModule, getTab } from "@/config/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { ScreenRenderer } from "@/components/screens/screen-renderer";
import { FinanceScreen } from "@/components/screens/finance/finance-screen";
import { AiScreen } from "@/components/screens/ai/ai-screen";
import { ProcurementInvoices } from "@/components/screens/procurement/procurement-invoices";

export function generateStaticParams() {
  return MODULES.flatMap((m) =>
    m.tabs.map((t) => ({ module: m.id, tab: t.id }))
  );
}

export default function ScreenPage({
  params,
}: {
  params: { module: string; tab: string };
}) {
  const mod = getModule(params.module);
  const tab = getTab(params.module, params.tab);
  if (!mod || !tab) notFound();

  // Finance is a bespoke redesign — it renders its own headers/layout.
  if (mod.id === "finance") {
    return (
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[22px]">
        <FinanceScreen tab={tab.id} />
      </div>
    );
  }

  // AI Insights replicates the Forcaster screens against the engine API —
  // bespoke, owns its own headers/layout.
  if (mod.id === "ai") {
    return (
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[22px]">
        <AiScreen tab={tab.id} />
      </div>
    );
  }

  // Procurement Invoices — bespoke: generate a commercial invoice from a PO.
  if (mod.id === "procurement" && tab.id === "receipts") {
    return (
      <>
        <PageHeader crumb={mod.label} title="Invoices" />
        <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
          <ProcurementInvoices />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader crumb={mod.label} title={tab.label} />
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
        <ScreenRenderer module={mod.id} tab={tab} />
      </div>
    </>
  );
}
