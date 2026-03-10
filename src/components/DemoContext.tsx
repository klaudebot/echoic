"use client";

import { createContext, useContext } from "react";
import Link from "next/link";

const BasePrefixContext = createContext("");

export function DemoProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrefixContext.Provider value="/demo">
      {children}
    </BasePrefixContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrefixContext.Provider value="">
      {children}
    </BasePrefixContext.Provider>
  );
}

export function useBasePrefix() {
  return useContext(BasePrefixContext);
}

export function AppLink({
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  const prefix = useContext(BasePrefixContext);
  const resolvedHref =
    typeof href === "string" && href.startsWith("/") && !href.startsWith("/demo")
      ? `${prefix}${href}`
      : href;

  return (
    <Link href={resolvedHref} {...props}>
      {children}
    </Link>
  );
}
