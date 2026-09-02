"use client";

import { FinanceOverview } from "@/components/screens/finance/finance-overview";
import { FinanceLedger } from "@/components/screens/finance/finance-ledger";
import { FinanceCashBankLedger } from "@/components/screens/finance/finance-cash-bank-ledger";
import { FinanceReports } from "@/components/screens/finance/finance-reports";
import { FinanceBanking } from "@/components/screens/finance/finance-banking";

/** Bespoke finance screens (redesign) — routed here instead of the generic
 *  ScreenRenderer so each screen can own its header, layout and currency. */
export function FinanceScreen({ tab }: { tab: string }) {
  switch (tab) {
    case "overview":
      return <FinanceOverview />;
    case "customerledger":
      return <FinanceLedger variant="customer" />;
    case "supplierledger":
      return <FinanceLedger variant="supplier" />;
    case "cashledger":
      return <FinanceCashBankLedger kind="cash" />;
    case "bankledger":
      return <FinanceCashBankLedger kind="bank" />;
    case "reports":
      return <FinanceReports />;
    case "banking":
      return <FinanceBanking />;
    default:
      return null;
  }
}
