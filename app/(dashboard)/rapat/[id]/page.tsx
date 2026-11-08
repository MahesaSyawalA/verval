import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { DaftarHadirView } from "@/modules/presensi";

interface RapatDetailPageProps {
  params: Promise<{ id: string }>;
}

async function RapatDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getServerSession(), params]);
  if (!session) {
    redirect("/login");
  }

  return <DaftarHadirView rapatId={id} />;
}

export default function RapatDetailPage({ params }: RapatDetailPageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <RapatDetailContent params={params} />
    </Suspense>
  );
}
