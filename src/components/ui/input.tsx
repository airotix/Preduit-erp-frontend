import * as React from "react";
import { cn } from "@/lib/utils";
import { PhoneInput, type PhoneInputProps } from "./phone-input";

const Input = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, type, ...props }, ref) => {
    const Component = type === "tel" ? PhoneInput : "input";
    return (
      <Component
        type={type}
        className={cn(
          "flex h-11 min-w-0 w-full rounded-lg border border-input bg-white px-3 py-2 text-base sm:h-10 sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
