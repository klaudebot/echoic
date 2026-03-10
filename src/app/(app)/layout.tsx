import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/DemoContext";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
