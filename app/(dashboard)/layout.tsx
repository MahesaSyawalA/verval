import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { DashboardShell, ThemeScope } from "@/components/layout";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}

export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* Pasang tema sebelum cat pertama; ThemeScope menjaganya saat navigasi klien. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <ThemeScope />
      <Suspense
      fallback={
        <div className="min-h-screen bg-surface p-7 space-y-6">
          <Skeleton className="h-16 w-full rounded-3xl" />
          <div className="flex gap-6">
            <Skeleton className="h-[75vh] w-18 rounded-[36px]" />
            <Skeleton className="h-[75vh] flex-1 rounded-3xl" />
          </div>
        </div>
      }
    >
      <AuthenticatedShell>{children}</AuthenticatedShell>
      </Suspense>
    </>
  );
}
