import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { RoleOverviewCard } from "@/modules/auth";
import { KaprodiDashboardView } from "@/modules/dashboard";
import { getKaprodiDashboardSummary } from "@/modules/dashboard/server/dashboard.service";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "Kaprodi" || session.role === "Admin") {
    const summary = await getKaprodiDashboardSummary();
    return <KaprodiDashboardView initialData={summary} />;
  }

  return (
    <RoleOverviewCard
      user={session}
      pageTitle="Dashboard Personal Dosen"
      pageDescription="Ringkasan capaian kinerja, penugasan dosen, dan agenda rapat Program Studi RPL."
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <DashboardContent />
    </Suspense>
  );
}
