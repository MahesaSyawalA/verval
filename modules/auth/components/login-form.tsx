"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { INSTITUTION_NAME } from "@/lib/constants";
import { AppError, formatZodError } from "@/lib/http";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { useLogin } from "../hooks/use-auth";
import { loginSchema } from "../schemas/auth.schema";
import type { DemoAccountInfo } from "../types";

const BRAND_NAME = "SACIBIRU";

// Akun demo hanya tampil saat development; di production cabang ini dibuang
// bundler sehingga email dan password demo tidak ikut terkirim ke browser.
const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== "production";
const DEMO_PASSWORD = "RplCibiru2026!";
const DEMO_ACCOUNTS: readonly DemoAccountInfo[] = [
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

function LoginBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <path
        d="M0 560C260 400 520 300 840 330C1100 355 1260 250 1440 110V0H0Z"
        className="fill-primary-700/35"
      />
      <path
        d="M0 900V650C300 780 650 650 990 560C1190 508 1330 410 1440 320V900Z"
        className="fill-primary-900/40"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError(null);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-primary-800 text-white">
      <LoginBackdrop />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-6">
        <main className="flex flex-1 flex-col items-center justify-center gap-10 py-10 lg:flex-row lg:justify-between lg:gap-16">
          <section className="w-full max-w-md space-y-5 text-center lg:text-left">
            <h1 className="font-heading font-bold leading-tight tracking-tight">
              <span className="block text-h4 text-accent sm:text-h3 lg:text-h2">
                Satu akun RPL.
              </span>
              <span className="block text-h4 text-white sm:text-h3 lg:text-h2">
                Untuk rapat dan kinerja prodi.
              </span>
            </h1>
            <p className="text-body-md text-white/85">
              {BRAND_NAME} membantu dosen, Ketua Program Studi, dan admin
              Program Studi Rekayasa Perangkat Lunak UPI Kampus Cibiru
              mengelola notulensi rapat serta memantau penugasan dan kinerja
              dalam satu akun.
            </p>
          </section>

          <div className="w-full max-w-[490px] rounded-[32px] bg-white p-8 text-ink shadow-2xl shadow-black/30 sm:p-10">
            <div
              role="img"
              aria-label={BRAND_NAME}
              className="mx-auto mb-8 flex h-24 w-full max-w-[300px] items-center justify-center rounded-bl-none rounded-br-[44px] rounded-tl-[44px] rounded-tr-none bg-primary shadow-lg shadow-primary/30"
            >
              <span className="font-heading text-h3 font-bold tracking-tight text-white">
                {BRAND_NAME}
              </span>
            </div>

            {formError && (
              <Alert status="error" className="mb-4">
                {formError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                name="identifier"
                label="Email UPI atau NIP"
                placeholder="Email UPI atau NIP Anda"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={fieldErrors.identifier}
                autoComplete="username"
              />

              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                label="Kata sandi"
                placeholder="Masukkan kata sandi Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    aria-pressed={showPassword}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-primary cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={loginMutation.isPending}
                >
                  Masuk
                </Button>
              </div>
            </form>

            <div className="mt-6 space-y-4 border-t border-border-soft pt-5">
              <p className="text-center text-body-sm text-ink-muted">
                Tidak bisa masuk atau lupa kata sandi? Hubungi Admin Prodi RPL.
              </p>

              <div className="rounded-2xl bg-primary-50/70 px-4 py-3 text-center text-body-sm font-medium text-primary">
                Jangan bagikan kata sandi Anda kepada siapa pun.
              </div>

              {SHOW_DEMO_ACCOUNTS && (
                <details className="rounded-2xl border border-dashed border-border-soft px-4 py-3 text-body-sm">
                  <summary className="cursor-pointer font-medium text-ink-muted">
                    Akun demo (hanya development)
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        title={`${acc.name} · ${acc.description}`}
                        className="rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary-100 cursor-pointer"
                      >
                        {acc.role}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-white/20 py-6 text-center text-body-sm text-white/80">
          <p className="font-medium text-white">
            © 2026 Universitas Pendidikan Indonesia
          </p>
          <p>{INSTITUTION_NAME} · Dikembangkan oleh NodeCraft.ID</p>
        </footer>
      </div>
    </div>
  );
}
