"use client";

import { AiProvider } from "@/lib/ai-context";
import { AiSetup } from "@/components/screens/ai/ai-setup";
import { AiProductKpis } from "@/components/screens/ai/ai-product-kpis";
import { AiRecommendations } from "@/components/screens/ai/ai-recommendations";
import { AiProjection } from "@/components/screens/ai/ai-projection";
import { AiCustomers } from "@/components/screens/ai/ai-customers";
import { AiValidation } from "@/components/screens/ai/ai-validation";

/** Bespoke AI Insights screens — replicate the Forcaster app against the
 *  engine's external API. Dashboard/Budget/Setup are intentionally excluded
 *  (the ERP Dashboards + Finance modules and ERP sync already cover them). */
export function AiScreen({ tab }: { tab: string }) {
  return (
    <AiProvider>
      {(() => {
        switch (tab) {
          case "setup":
            return <AiSetup />;
          case "productkpis":
            return <AiProductKpis />;
          case "recommendations":
            return <AiRecommendations />;
          case "projection":
            return <AiProjection />;
          case "customers":
            return <AiCustomers />;
          case "validation":
            return <AiValidation />;
          default:
            return null;
        }
      })()}
    </AiProvider>
  );
}
