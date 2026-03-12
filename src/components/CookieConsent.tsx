"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-[4px] border border-border bg-card shadow-2xl shadow-black/10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
          We use cookies to improve your experience and analyze site usage. By continuing, you agree to our{" "}
          <Link href="/privacy" className="text-brand-violet hover:underline font-medium">
            Privacy Policy
          </Link>
          .
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-semibold bg-brand-violet text-white rounded-[4px] hover:bg-brand-violet/90 transition-all"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
