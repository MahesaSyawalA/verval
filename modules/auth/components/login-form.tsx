"use client";

import { Lock, LogIn, ShieldCheck, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BrandLogo } from "@/components/layout";
import { Button, Card, Input, StatusChip } from "@/components/ui";
import { APP_NAME, INSTITUTION_NAME } from "@/lib/constants";
import { AppError, formatZodError } from "@/lib/http";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { useLogin } from "../hooks/use-auth";
import { loginSchema } from "../schemas/auth.schema";
import type { DemoAccountInfo } from "../types";

export const DEMO_ACCOUNTS: readonly DemoAccountInfo[] = [
  {
    role: "Kaprodi",
    name: "Dr. Iqbal Al-Farisi, M.Kom.",
    email: "iqbal@upi.edu",
    nip: "198204152008121002",
    description: "Dashboard Kinerja, Master Target, Verifikasi Tiket & Arsip",
  },
  {
    role: "Dosen",
    name: "Indira Nareswari Syawanodya, M.T.",
    email: "indira@upi.edu",
    nip: "199008212018032001",
    description: "Dashboard Personal, Unggah Bukti, Presensi & Editor Notulensi",
  },
  {
    role: "Admin",
    name: "Admin Prodi RPL",
    email: "admin.rpl@upi.edu",
    nip: "199501102020121003",
    description: "Pengelolaan Agenda Rapat, Dokumen & Penugasan",
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const loginMutation = useLogin();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setFieldErrors(formatZodError(parsed.error));
      return;
    }

    try {
      const response = await loginMutation.mutateAsync(parsed.data);
      router.push(getSafeRedirectPath(nextUrl, response.redirectTo));
      router.refresh();
    } catch (err) {
      if (err instanceof AppError) {
        if (err.fields) {
          setFieldErrors(err.fields);
        }
        setFormError(err.message);
      } else {
        setFormError("Gagal masuk ke sistem. Silakan coba lagi.");
      }
    }
  }

  function handleSelectDemo(account: DemoAccountInfo) {
    setIdentifier(account.email);
    setPassword("RplCibiru2026!");
    setFieldErrors({});
    setFormError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <BrandLogo />
              <div>
                <h1 className="font-heading text-h5 font-bold text-ink">
                  Masuk ke Sistem
                </h1>
                <p className="text-body-sm text-ink-muted">
                  {APP_NAME} · {INSTITUTION_NAME}
                </p>
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-2xl border border-danger/30 bg-danger-bg px-4 py-3 text-body-sm font-medium text-danger-ink"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                name="identifier"
                label="Email UPI atau NIP"
                placeholder="Contoh: iqbal@upi.edu atau 198204152008121002"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={fieldErrors.identifier}
                leftIcon={<User className="h-4 w-4" />}
                autoComplete="username"
              />

              <Input
                name="password"
                type="password"
                label="Kata Sandi"
                placeholder="Masukkan kata sandi akun Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="current-password"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={loginMutation.isPending}
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Masuk Sekarang
                </Button>
              </div>
            </form>
          </div>

          <p className="text-body-sm text-ink-subtle pt-4 border-t border-border-soft">
            Modul 2 (Notulensi Rapat UANG) &amp; Modul 8 (Dashboard Kinerja dan
            Penugasan Dosen)
          </p>
        </Card>

        <Card
          variant="primary"
          className="lg:col-span-5 p-7 flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-body-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Akun Demo Seed
              </span>
              <StatusChip status="Berlangsung" tone="accent" />
            </div>

            <h2 className="font-heading text-h5 font-bold text-white">
              Pilih Role untuk Uji Coba Cepat
            </h2>
            <p className="text-body-sm text-white/80">
              Klik salah satu akun di bawah untuk mengisi kredensial otomatis
              sesuai role pada spesifikasi desain:
            </p>

            <div className="space-y-3 pt-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className="w-full text-left rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 p-3.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-body-md font-bold text-white">
                      {acc.name}
                    </span>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-body-sm font-bold text-ink">
                      {acc.role}
                    </span>
                  </div>
                  <p className="mt-1 text-body-sm text-white/85 font-mono">
                    {acc.email} · NIP {acc.nip}
                  </p>
                  <p className="mt-1 text-body-sm text-white/70">
                    {acc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-3.5 text-body-sm text-white/85">
            Password default seed:{" "}
            <code className="font-mono font-bold text-accent">
              RplCibiru2026!
            </code>
          </div>
        </Card>
      </div>
    </div>
  );
}
