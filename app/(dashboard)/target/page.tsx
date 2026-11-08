import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { canAccessRoute } from "@/config/roles";
import { getServerSession } from "@/lib/session";
import { MasterTargetView } from "@/modules/target";

async function TargetContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessRoute(session.role, "/target")) {
    redirect("/dashboard");
  }

  return <MasterTargetView userFullName={session.namaLengkap} />;
}

export default function TargetPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <TargetContent />
    </Suspense>
  );
}
