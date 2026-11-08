import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { LoginForm } from "@/modules/auth";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <Skeleton className="h-96 w-full max-w-4xl rounded-3xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
