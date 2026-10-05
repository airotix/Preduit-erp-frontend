export function PageHeader({
  crumb,
  title,
}: {
  crumb: string;
  title: string;
}) {
  return (
    <div className="flex flex-shrink-0 items-end gap-3.5 px-3 pb-1 pt-4 sm:px-5 lg:px-[26px]">
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9499A6]">
          {crumb}
        </div>
        <h1 className="mt-0.5 break-words text-[22px] font-extrabold tracking-tight text-foreground sm:text-[26px]">
          {title}
        </h1>
      </div>
    </div>
  );
}
