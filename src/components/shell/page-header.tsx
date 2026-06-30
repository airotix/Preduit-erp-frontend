export function PageHeader({
  crumb,
  title,
}: {
  crumb: string;
  title: string;
}) {
  return (
    <div className="flex flex-shrink-0 items-end gap-3.5 px-[26px] pb-1 pt-[18px]">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9499A6]">
          {crumb}
        </div>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
    </div>
  );
}
