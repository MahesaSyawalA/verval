import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { DosenTicketDetail } from "@/modules/tiket";

interface TiketDetailPageProps {
  params: Promise<{ id: string }>;
}

async function TiketDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getServerSession(), params]);
  if (!session) {
    redirect("/login");
  }

  return (
    <DosenTicketDetail ticketId={id} userFullName={session.namaLengkap} />
  );
}

export default function TiketDetailPage({ params }: TiketDetailPageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <TiketDetailContent params={params} />
    </Suspense>
  );
}
