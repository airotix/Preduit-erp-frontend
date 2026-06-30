import { icons, type LucideProps } from "lucide-react";

type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
  name: string;
}

/** Resolve a lucide-react icon by PascalCase name. Falls back to a square. */
export function Icon({ name, ...props }: IconProps) {
  const Cmp = icons[name as IconName] ?? icons.Square;
  return <Cmp {...props} />;
}
