"use client";

import { CheckCircle2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useLogout } from "../hooks/use-auth";

export function LogoutCard() {
  const router = useRouter();
  const { mutateAsync } = useLogout();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    mutateAsync()
      .catch(() => null)
      .finally(() => {
        if (active) {
          setDone(true);
        }
      });
    return () => {
      active = false;
    };
  }, [mutateAsync]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-5">
        <div className="mx-auto flex justify-center">
          <BrandLogo />
        </div>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success-ink">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading text-h5 font-bold text-ink">
            {done ? "Anda Telah Keluar" : "Mengakhiri Sesi..."}
          </h1>
          <p className="text-body-sm text-ink-muted">
            Sesi login Anda pada Sistem Informasi RPL telah dihapus dengan aman.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            leftIcon={<LogIn className="h-4 w-4" />}
            onClick={() => {
              router.push("/login");
              router.refresh();
            }}
          >
            Kembali ke Halaman Login
          </Button>
          <Link
            href="/"
            className="text-body-sm font-medium text-ink-muted hover:text-primary py-1"
          >
            Ke Beranda Utama
          </Link>
        </div>
      </Card>
    </div>
  );
}
