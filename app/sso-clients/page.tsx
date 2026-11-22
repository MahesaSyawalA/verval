import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { isSsoAdminRole } from "@/config/roles";
import { getServerSession } from "@/lib/session";
import { SsoClientsManager } from "@/modules/sso";
import { listSsoClientsAdmin } from "@/modules/sso/server/sso-admin.service";

async function SsoClientsContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?next=/sso-clients");
  }
  if (!isSsoAdminRole(session.role)) {
    redirect("/menu");
  }

  const clients = await listSsoClientsAdmin();

  return (
    <SsoClientsManager
      namaLengkap={session.namaLengkap}
      role={session.role}
      initialClients={clients}
    />
  );
}

export default function SsoClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface p-7">
          <Skeleton className="mx-auto h-96 w-full max-w-[1160px] rounded-3xl" />
        </div>
      }
    >
      <SsoClientsContent />
    </Suspense>
  );
}
