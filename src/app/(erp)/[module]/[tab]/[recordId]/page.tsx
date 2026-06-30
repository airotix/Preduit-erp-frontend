import { notFound } from "next/navigation";
import { getModule, getTab } from "@/config/navigation";
import { detailTypeFor } from "@/config/detail-types";
import { fetchScreen } from "@/modules/registry";
import { RecordDetailPage } from "@/components/screens/record-detail-page";
import type { Cell } from "@/lib/screen-types";

/**
 * Full-page record detail — the drill-down a clicked list row opens.
 * Ported to behave like the original Apparel ERP HTML, which navigates to a
 * dedicated page with its own sub-tabs (Overview, Variant matrix, …) instead
 * of a slide-over. Lives under the same (erp) shell, so the rail + topbar stay.
 *
 * Route: /<module>/<tab>/<recordId>  (recordId = row index in the store)
 */
export default async function RecordPage({
  params,
}: {
  params: { module: string; tab: string; recordId: string };
}) {
  const mod = getModule(params.module);
  const tab = getTab(params.module, params.tab);
  const type = detailTypeFor(params.module, params.tab);
  if (!mod || !tab || !type) notFound();

  const index = Number.parseInt(params.recordId, 10);
  if (Number.isNaN(index)) notFound();

  const screen = await fetchScreen(params.module, params.tab);
  if (screen.kind !== "list") notFound();

  const row = screen.rows[index] as Cell[] | undefined;
  if (!row) notFound();

  return (
    <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
      <RecordDetailPage
        type={type}
        row={row}
        columns={screen.columns}
        backHref={`/${mod.id}/${tab.id}`}
        backLabel={tab.label}
      />
    </div>
  );
}
