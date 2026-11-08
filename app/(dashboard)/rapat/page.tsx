import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { RapatOverviewView } from "@/modules/rapat";

async function RapatContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <RapatOverviewView userId={session.userId} userRole={session.role} />
  );
}

export default function RapatPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <RapatContent />
    </Suspense>
  );
}
