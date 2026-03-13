"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Client-side OAuth callback page.
 *
 * The Supabase browser client auto-detects the ?code= parameter
 * (via detectSessionInUrl) and exchanges it for a session.
 * We just wait for the session to appear, then redirect.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  // Capture `next` immediately before the client strips URL params
  const nextRef = useRef(
    typeof window !== "undefined"
      ? new URL(window.location.href).searchParams.get("next") ?? "/dashboard"
      : "/dashboard"
  );

  useEffect(() => {
    const next = nextRef.current;
    const supabase = getSupabaseBrowser();

    // Listen for auth state changes — the auto-exchange will fire SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.replace("/sign-in?error=auth_timeout");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Completing sign-in...</span>
      </div>
    </div>
  );
}
