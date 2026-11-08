import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { ArsipRapatListView } from "@/modules/rapat";

async function ArsipContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return <ArsipRapatListView />;
}

export default function ArsipPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <ArsipContent />
    </Suspense>
  );
}
