"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/components/UserContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip auth check for demo routes
    if (pathname.startsWith("/demo")) {
      setChecked(true);
      return;
    }

    // Give UserContext time to hydrate from localStorage
    const timeout = setTimeout(() => {
      if (!user) {
        // Double-check localStorage directly (UserContext may not have hydrated yet)
        try {
          const stored = localStorage.getItem("reverbic_user");
          if (!stored) {
            router.replace("/sign-in");
            return;
          }
        } catch {
          router.replace("/sign-in");
          return;
        }
      }
      setChecked(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, [user, router, pathname]);

  // Don't render protected content until auth is verified
  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-brand-violet border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
