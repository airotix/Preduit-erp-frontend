import { notFound } from "next/navigation";
import { MODULES, getModule, getTab } from "@/config/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { ScreenRenderer } from "@/components/screens/screen-renderer";
import { FinanceScreen } from "@/components/screens/finance/finance-screen";
import { AiScreen } from "@/components/screens/ai/ai-screen";
import { ProcurementInvoices } from "@/components/screens/procurement/procurement-invoices";
import { SalesInvoices } from "@/components/screens/sales/sales-invoices";
import { AdminUsers } from "@/components/screens/admin/admin-users";
import { AdminRoles } from "@/components/screens/admin/admin-roles";
import { AdminCompanies } from "@/components/screens/admin/admin-companies";

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

  // Finance dashboards/ledgers are a bespoke redesign; the ledger/accounting
  // list tabs (Chart of Accounts, Journals, Payments, Bills, AR/AP aging) use
  // the generic list renderer below.
  const FINANCE_BESPOKE = new Set([
    "overview", "customerledger", "supplierledger", "cashledger", "bankledger",
    "profitability", "reports", "banking",
  ]);
  if (mod.id === "finance" && FINANCE_BESPOKE.has(tab.id)) {
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

  // Admin team management + platform overview (self-managed auth, AUTH-D).
  if (mod.id === "admin" && (tab.id === "users" || tab.id === "roles" || tab.id === "companies")) {
    const titles: Record<string, string> = { users: "Users", roles: "Roles", companies: "Companies" };
    return (
      <>
        <PageHeader crumb={mod.label} title={titles[tab.id]} />
        <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
          {tab.id === "users" && <AdminUsers />}
          {tab.id === "roles" && <AdminRoles />}
          {tab.id === "companies" && <AdminCompanies />}
        </div>
      </>
    );
  }

  // Sales Invoices — bespoke: generate a retail/online/wholesale invoice from an order.
  if (mod.id === "sales" && tab.id === "invoices") {
    return (
      <>
        <PageHeader crumb={mod.label} title="Invoices" />
        <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
          <SalesInvoices />
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
