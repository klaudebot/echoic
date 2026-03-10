import { AppShell } from "@/components/AppShell";
import { DemoProvider } from "@/components/DemoContext";

export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <AppShell>{children}</AppShell>
    </DemoProvider>
  );
}
