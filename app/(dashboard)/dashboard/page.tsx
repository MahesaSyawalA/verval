import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { RoleOverviewCard } from "@/modules/auth";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <RoleOverviewCard
      user={session}
      pageTitle={
        session.role === "Kaprodi"
          ? "Dashboard Kinerja Prodi"
          : session.role === "Dosen"
            ? "Dashboard Personal Dosen"
            : "Dashboard Administrasi RPL"
      }
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
