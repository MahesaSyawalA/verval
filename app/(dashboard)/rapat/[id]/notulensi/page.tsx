import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { NotulensiEditorView } from "@/modules/notulensi";

interface NotulensiPageProps {
  params: Promise<{ id: string }>;
}

async function NotulensiContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getServerSession(), params]);
  if (!session) {
    redirect("/login");
  }

  return <NotulensiEditorView rapatId={id} currentUserId={session.id} />;
}

export default function NotulensiPage({ params }: NotulensiPageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <NotulensiContent params={params} />
    </Suspense>
  );
}
