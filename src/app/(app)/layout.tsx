import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/DemoContext";
import { UserProvider } from "@/components/UserContext";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </UserProvider>
  );
}
