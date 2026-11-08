import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { RoleOverviewCard } from "@/modules/auth";

async function ArsipContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <RoleOverviewCard
      user={session}
      pageTitle="Arsip Rapat (UANG)"
      pageDescription="Satu arsip per rapat: Undangan (U), Absensi (A), Notulensi (N), Gambar (G)."
    />
  );
}

export default function ArsipPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <ArsipContent />
    </Suspense>
  );
}
