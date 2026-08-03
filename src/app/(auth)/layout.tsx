import type { ReactNode } from "react";
import { AuthTopBar, AuthAside } from "@/components/auth/auth-chrome";

/** Auth shell: white column (logo bar + centered form) on the left, warm
 *  marketing panel on the right — mirrors the Preduit Retail login design. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="flex w-full flex-col px-8 py-8 lg:w-[58%] lg:px-14">
        <AuthTopBar />
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[420px]">{children}</div>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}
