import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { ArsipRapatDetailView } from "@/modules/rapat";

interface ArsipDetailPageProps {
  params: Promise<{ id: string }>;
}

async function ArsipDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getServerSession(), params]);
  if (!session) {
    redirect("/login");
  }

  return <ArsipRapatDetailView rapatId={id} />;
}

export default function ArsipDetailPage({ params }: ArsipDetailPageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <ArsipDetailContent params={params} />
    </Suspense>
  );
}
