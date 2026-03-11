import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/DemoContext";
import { UserProvider } from "@/components/UserContext";
import { AuthGuard } from "@/components/AuthGuard";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthGuard>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </AuthGuard>
    </UserProvider>
  );
}
