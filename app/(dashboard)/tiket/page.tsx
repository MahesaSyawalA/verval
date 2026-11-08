import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { KaprodiTicketList } from "@/modules/tiket";

async function TiketContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return <KaprodiTicketList userFullName={session.namaLengkap} />;
}

export default function TiketPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <TiketContent />
    </Suspense>
  );
}
