import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getServerSession } from "@/lib/session";
import { MenuUtama } from "@/modules/sso";
import { listModulesForRole } from "@/modules/sso/server/sso.service";

async function MenuContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const modules = await listModulesForRole(session.role);

  return (
    <MenuUtama
      namaLengkap={session.namaLengkap}
      role={session.role}
      modules={modules}
    />
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface p-7">
          <Skeleton className="mx-auto h-96 w-full max-w-[1100px] rounded-3xl" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
