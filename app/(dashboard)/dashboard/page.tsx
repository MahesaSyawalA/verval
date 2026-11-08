import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import {
  DosenDashboardView,
  KaprodiDashboardView,
} from "@/modules/dashboard";
import {
  getDosenDashboardSummary,
  getKaprodiDashboardSummary,
} from "@/modules/dashboard/server/dashboard.service";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "Kaprodi" || session.role === "Admin") {
    const summary = await getKaprodiDashboardSummary();
    return <KaprodiDashboardView initialData={summary} />;
  }

  const dosenSummary = await getDosenDashboardSummary(session.id);
  return <DosenDashboardView initialData={dosenSummary} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <DashboardContent />
    </Suspense>
  );
}
