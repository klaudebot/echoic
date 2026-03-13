"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import CookieConsent from "@/components/CookieConsent";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center">
            {/* Logo — fixed width left column */}
            <div className="flex-1">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <img src="/icon-transparent.svg" alt="" width={22} height={22} className="shrink-0" />
                <span className="font-heading text-xl tracking-tight text-foreground">
                  Reverbic
                </span>
              </Link>
            </div>

            {/* Desktop Nav — true center */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Pricing", href: "/pricing" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="relative px-4 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted/60"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs — fixed width right column */}
            <div className="hidden md:flex flex-1 items-center justify-end gap-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-brand-violet px-4 py-1.5 text-[13px] font-medium text-white hover:bg-brand-violet/90 transition-all shadow-sm rounded-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-4 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-brand-violet px-4 py-1.5 text-[13px] font-medium text-white hover:bg-brand-violet/90 transition-all shadow-sm rounded-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-muted-foreground"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M5 15L15 5" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5h14M3 10h14M3 15h14" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              <a href="#features" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-sm transition-colors">
                Features
              </a>
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-sm transition-colors">
                How It Works
              </a>
              <a href="/pricing" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-sm transition-colors">
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/40 mt-2">
                {isLoggedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="bg-brand-violet px-4 py-2 text-sm font-medium text-white text-center rounded-sm">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" className="text-sm font-medium text-muted-foreground text-center py-2">
                      Sign In
                    </Link>
                    <Link href="/sign-up" className="bg-brand-violet px-4 py-2 text-sm font-medium text-white text-center rounded-sm">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main>{children}</main>
      <CookieConsent />
    </div>
  );
}
