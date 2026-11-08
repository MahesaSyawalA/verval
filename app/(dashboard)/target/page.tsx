import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { canAccessRoute } from "@/config/roles";
import { getServerSession } from "@/lib/session";
import { RoleOverviewCard } from "@/modules/auth";

async function TargetContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessRoute(session.role, "/target")) {
    redirect("/dashboard");
  }

  return (
    <RoleOverviewCard
      user={session}
      pageTitle="Master Target 2026"
      pageDescription="Target tahunan dari Direktur Cibiru yang diturunkan ke prodi."
    />
  );
}

export default function TargetPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <TargetContent />
    </Suspense>
  );
}
