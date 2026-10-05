"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const NavigationContext = React.createContext({ open: false, setOpen: (_open: boolean) => {} });

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const close = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  return <NavigationContext.Provider value={{ open, setOpen }}>{children}</NavigationContext.Provider>;
}

export const useNavigation = () => React.useContext(NavigationContext);
