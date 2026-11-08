import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { RoleOverviewCard } from "@/modules/auth";

async function TiketContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <RoleOverviewCard
      user={session}
      pageTitle="Daftar Tiket Penugasan"
      pageDescription="Setiap target yang ditugaskan ke dosen menjadi satu tiket."
    />
  );
}

export default function TiketPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <TiketContent />
    </Suspense>
  );
}
