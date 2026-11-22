import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { LoginForm } from "@/modules/auth";
import { findClientByClientId } from "@/modules/sso/server/sso.repository";

interface TargetModuleInfo {
  name: string;
  description: string | null;
}

async function resolveTargetModule(
  nextParam: string | undefined,
): Promise<TargetModuleInfo | null> {
  if (!nextParam || !nextParam.startsWith("/api/sso/authorize")) {
    return null;
  }

  try {
    const parsed = new URL(nextParam, "http://internal.invalid");
    const clientId = parsed.searchParams.get("client_id");
    if (!clientId) return null;

    const client = await findClientByClientId(clientId);
    if (!client || !client.isActive) return null;

    return {
      name: client.name,
      description: client.description,
    };
  } catch {
    return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const targetModule = await resolveTargetModule(rawNext);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <Skeleton className="h-96 w-full max-w-4xl rounded-3xl" />
        </div>
      }
    >
      <LoginForm targetModule={targetModule} />
    </Suspense>
  );
}
