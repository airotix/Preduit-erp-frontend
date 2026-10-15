"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { freshQueryDefaults, refreshData, subscribeToDataChanges } from "@/lib/data-refresh";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: freshQueryDefaults,
        },
      })
  );
  const pathname = usePathname();
  const previousPath = React.useRef(pathname);

  React.useEffect(() => subscribeToDataChanges(client), [client]);
  React.useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      void refreshData(client, false);
    }
  }, [client, pathname]);

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
