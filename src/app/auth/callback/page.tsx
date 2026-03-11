"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Client-side OAuth callback page.
 * The browser client exchanges the auth code for a session directly,
 * so the tokens are stored in document.cookie where createBrowserClient
 * can find them (unlike server-set cookies which may be httpOnly).
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") ?? "/dashboard";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
          router.replace("/sign-in?error=auth_callback_failed");
        } else {
          router.replace(next);
        }
      });
    } else {
      router.replace("/sign-in?error=no_code");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-brand-violet border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Completing sign-in...</span>
      </div>
    </div>
  );
}
