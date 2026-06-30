import { notFound } from "next/navigation";
import { MODULES, getModule, getTab } from "@/config/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { ScreenRenderer } from "@/components/screens/screen-renderer";

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

  return (
    <>
      <PageHeader crumb={mod.label} title={tab.label} />
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
        <ScreenRenderer module={mod.id} tab={tab} />
      </div>
    </>
  );
}
