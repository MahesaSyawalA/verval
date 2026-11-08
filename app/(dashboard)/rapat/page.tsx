import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { RoleOverviewCard } from "@/modules/auth";

async function RapatContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <RoleOverviewCard
      user={session}
      pageTitle="Notulensi & Jadwal Rapat"
      pageDescription="Jadwal rapat, presensi, dan penyusunan notulensi berbasis konsep UANG."
    />
  );
}

export default function RapatPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <RapatContent />
    </Suspense>
  );
}
