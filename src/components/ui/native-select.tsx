import * as React from "react";
import { cn } from "@/lib/utils";

/** A native <select> styled to match <Input>; use where a Radix Select would change the form's data flow. */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 min-w-0 w-full rounded-lg border border-input bg-white px-3 py-2 text-base sm:h-10 sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
