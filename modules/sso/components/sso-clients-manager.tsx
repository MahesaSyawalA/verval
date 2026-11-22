"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  KeyRound,
  LogOut,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { BrandLogo } from "@/components/layout";
import {
  Alert,
  Button,
  Card,
  Input,
  ModalForm,
  TextArea,
} from "@/components/ui";
import { ROLE_METADATA, ROLES, type UserRole } from "@/config/roles";
import { AppError, apiFetch } from "@/lib/http";
import { getGreetingName } from "@/lib/utils";
import type { SsoClientAdminItem, SsoClientSecretPayload } from "../types";

export interface SsoClientsManagerProps {
  namaLengkap: string;
  role: UserRole;
  initialClients: SsoClientAdminItem[];
}

interface FormState {
  clientId: string;
  name: string;
  description: string;
  launchUrl: string;
  redirectUrisText: string;
  postLogoutUrisText: string;
  allowedRoles: UserRole[];
  isPublic: boolean;
}

const EMPTY_FORM: FormState = {
  clientId: "",
  name: "",
  description: "",
  launchUrl: "",
  redirectUrisText: "",
  postLogoutUrisText: "",
  allowedRoles: ["Dosen", "Kaprodi"],
  isPublic: false,
};

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildEnvSnippet(
  client: SsoClientAdminItem,
  clientSecret: string | null,
): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://sso.kampus.ac.id";
  const lines = [
    `SSO_URL=${origin}`,
    `SSO_CLIENT_ID=${client.clientId}`,
  ];
  if (clientSecret) {
    lines.push(`SSO_CLIENT_SECRET=${clientSecret}`);
  }
  lines.push(`SSO_REDIRECT_URI=${client.redirectUris[0] ?? ""}`);
  return lines.join("\n");
}

export function SsoClientsManager({
  namaLengkap,
  role,
  initialClients,
}: SsoClientsManagerProps) {
  const [clients, setClients] = useState<SsoClientAdminItem[]>(initialClients);
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  // Create / Edit modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<SsoClientAdminItem | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-item action loading
  const [busyClientId, setBusyClientId] = useState<string | null>(null);

  // One-time secret modal state
  const [secretResult, setSecretResult] =
    useState<SsoClientSecretPayload | null>(null);
  const [secretHeading, setSecretHeading] = useState("Kredensial Modul Baru");
  const [copiedKey, setCopiedKey] = useState<"secret" | "env" | null>(null);

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.isActive).length;
    return {
      total: clients.length,
      active,
      inactive: clients.length - active,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }, [clients, search]);

  function openCreateModal() {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setModalMode("create");
  }

  function openEditModal(client: SsoClientAdminItem) {
    setEditingClient(client);
    setForm({
      clientId: client.clientId,
      name: client.name,
      description: client.description ?? "",
      launchUrl: client.launchUrl,
      redirectUrisText: client.redirectUris.join("\n"),
      postLogoutUrisText: client.postLogoutRedirectUris.join("\n"),
      allowedRoles: [...client.allowedRoles],
      isPublic: client.isPublic,
    });
    setFieldErrors({});
    setFormError(null);
    setModalMode("edit");
  }

  function toggleRole(targetRole: UserRole) {
    setForm((prev) => {
      const exists = prev.allowedRoles.includes(targetRole);
      return {
        ...prev,
        allowedRoles: exists
          ? prev.allowedRoles.filter((r) => r !== targetRole)
          : [...prev.allowedRoles, targetRole],
      };
    });
  }

  async function handleSubmitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setPageError(null);
    setPageSuccess(null);
    setIsSubmitting(true);

    try {
      const redirectUris = splitLines(form.redirectUrisText);
      const postLogoutRedirectUris = splitLines(form.postLogoutUrisText);

      if (modalMode === "create") {
        const res = await apiFetch<{ data: SsoClientSecretPayload }>(
          "/api/sso/clients",
          {
            method: "POST",
            body: JSON.stringify({
              clientId: form.clientId.trim(),
              name: form.name.trim(),
              description: form.description.trim() || null,
              launchUrl: form.launchUrl.trim(),
              redirectUris,
              postLogoutRedirectUris,
              allowedRoles: form.allowedRoles,
              isPublic: form.isPublic,
            }),
          },
        );
        setClients((prev) => [res.data.client, ...prev]);
        setModalMode(null);
        setSecretHeading(`Modul "${res.data.client.name}" Berhasil Didaftarkan`);
        setSecretResult(res.data);
        setCopiedKey(null);
      } else if (modalMode === "edit" && editingClient) {
        const res = await apiFetch<{ data: SsoClientAdminItem }>(
          `/api/sso/clients/${editingClient.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: form.name.trim(),
              description: form.description.trim() || null,
              launchUrl: form.launchUrl.trim(),
              redirectUris,
              postLogoutRedirectUris,
              allowedRoles: form.allowedRoles,
            }),
          },
        );
        setClients((prev) =>
          prev.map((item) => (item.id === res.data.id ? res.data : item)),
        );
        setModalMode(null);
        setPageSuccess(`Konfigurasi modul "${res.data.name}" berhasil diperbarui.`);
      }
    } catch (err) {
      if (err instanceof AppError) {
        if (err.fields) setFieldErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError("Gagal menyimpan konfigurasi modul SSO.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(client: SsoClientAdminItem) {
    const nextActive = !client.isActive;
    if (
      !nextActive &&
      typeof window !== "undefined" &&
      !window.confirm(
        `Nonaktifkan modul "${client.name}"? Semua refresh token aktif modul ini akan dicabut.`,
      )
    ) {
      return;
    }

    setBusyClientId(client.id);
    setPageError(null);
    setPageSuccess(null);
    try {
      const res = await apiFetch<{ data: SsoClientAdminItem }>(
        `/api/sso/clients/${client.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextActive }),
        },
      );
      setClients((prev) =>
        prev.map((item) => (item.id === res.data.id ? res.data : item)),
      );
      setPageSuccess(
        nextActive
          ? `Modul "${res.data.name}" diaktifkan kembali.`
          : `Modul "${res.data.name}" dinonaktifkan dan seluruh refresh token-nya dicabut.`,
      );
    } catch (err) {
      setPageError(
        err instanceof AppError
          ? err.message
          : "Gagal mengubah status modul SSO.",
      );
    } finally {
      setBusyClientId(null);
    }
  }

  async function handleRotateSecret(client: SsoClientAdminItem) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Putar client_secret untuk "${client.name}"? Secret lama akan langsung tidak berlaku.`,
      )
    ) {
      return;
    }

    setBusyClientId(client.id);
    setPageError(null);
    setPageSuccess(null);
    try {
      const res = await apiFetch<{ data: SsoClientSecretPayload }>(
        `/api/sso/clients/${client.id}/rotate-secret`,
        { method: "POST" },
      );
      setClients((prev) =>
        prev.map((item) =>
          item.id === res.data.client.id ? res.data.client : item,
        ),
      );
      setSecretHeading(`Secret Baru untuk "${res.data.client.name}"`);
      setSecretResult(res.data);
      setCopiedKey(null);
    } catch (err) {
      setPageError(
        err instanceof AppError
          ? err.message
          : "Gagal memutar client_secret modul.",
      );
    } finally {
      setBusyClientId(null);
    }
  }

  async function copyText(value: string, key: "secret" | "env") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Abaikan bila clipboard API tidak tersedia.
    }
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-5 sm:px-7 sm:py-6">
      <div className="mx-auto max-w-[1160px] space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <div>
              <p className="font-heading text-h5 font-bold leading-tight text-ink">
                Halo, {getGreetingName(namaLengkap)}!
              </p>
              <p className="text-body-sm text-ink-muted">
                {ROLE_METADATA[role].label}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/menu"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-white px-5 text-body-sm font-medium text-ink hover:bg-primary-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Menu Utama
            </Link>
            <Link
              href="/logout"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-white px-5 text-body-sm font-medium text-ink hover:bg-primary-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Link>
          </div>
        </header>

        <section className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-caption font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Manajemen Integrasi SSO
            </div>
            <h1 className="font-heading text-h4 font-bold text-ink">
              Daftar Modul Terintegrasi
            </h1>
            <p className="max-w-2xl text-body-md text-ink-muted">
              Daftarkan modul baru, kelola Redirect URI &amp; hak akses role,
              serta putar{" "}
              <code className="rounded bg-primary-50 px-1.5 py-0.5 text-body-sm text-primary">
                client_secret
              </code>{" "}
              langsung dari halaman ini tanpa perintah terminal.
            </p>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreateModal}
          >
            Daftarkan Modul Baru
          </Button>
        </section>

        {pageError && <Alert status="error">{pageError}</Alert>}
        {pageSuccess && <Alert status="success">{pageSuccess}</Alert>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-body-sm text-ink-muted">Total Modul</p>
            <p className="mt-1 font-heading text-h3 font-bold text-ink">
              {stats.total}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-body-sm text-ink-muted">Modul Aktif</p>
            <p className="mt-1 font-heading text-h3 font-bold text-success">
              {stats.active}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-body-sm text-ink-muted">Modul Nonaktif</p>
            <p className="mt-1 font-heading text-h3 font-bold text-ink-muted">
              {stats.inactive}
            </p>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="relative max-w-md">
            <Input
              name="search"
              placeholder="Cari nama modul atau client_id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-muted" />}
            />
          </div>

          {filteredClients.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-heading text-h6 font-bold text-ink">
                {clients.length === 0
                  ? "Belum ada modul SSO terdaftar"
                  : "Modul tidak ditemukan"}
              </h2>
              <p className="mt-1 text-body-sm text-ink-muted">
                {clients.length === 0
                  ? "Klik tombol 'Daftarkan Modul Baru' untuk menghubungkan modul Laravel, Next.js, atau aplikasi lain ke SACIBIRU SSO."
                  : "Coba ubah kata kunci pencarian Anda."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredClients.map((client) => {
                const isBusy = busyClientId === client.id;
                return (
                  <Card key={client.id} className="p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-h6 font-bold text-ink">
                            {client.name}
                          </h2>
                          <span className="rounded-full bg-surface px-2.5 py-0.5 font-mono text-caption text-ink-muted border border-border-soft">
                            {client.clientId}
                          </span>
                          <span
                            className={
                              client.isActive
                                ? "rounded-full bg-success/10 px-2.5 py-0.5 text-caption font-semibold text-success"
                                : "rounded-full bg-danger/10 px-2.5 py-0.5 text-caption font-semibold text-danger"
                            }
                          >
                            {client.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-caption font-medium text-primary">
                            {client.isPublic
                              ? "Klien Publik (PKCE)"
                              : "Klien Rahasia"}
                          </span>
                        </div>
                        {client.description && (
                          <p className="text-body-sm text-ink-muted">
                            {client.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                          disabled={isBusy}
                          onClick={() => openEditModal(client)}
                        >
                          Edit
                        </Button>
                        {!client.isPublic && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                            isLoading={isBusy}
                            onClick={() => handleRotateSecret(client)}
                          >
                            Putar Secret
                          </Button>
                        )}
                        <Button
                          variant={client.isActive ? "danger" : "primary"}
                          size="sm"
                          leftIcon={<Power className="h-3.5 w-3.5" />}
                          isLoading={isBusy}
                          onClick={() => handleToggleActive(client)}
                        >
                          {client.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-border-soft pt-4 text-body-sm md:grid-cols-2">
                      <div className="space-y-2">
                        <div>
                          <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                            Launch URL (Kartu Menu Utama)
                          </p>
                          <p className="mt-0.5 break-all font-mono text-caption text-ink">
                            {client.launchUrl}
                          </p>
                        </div>
                        <div>
                          <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                            Redirect URIs (Callback)
                          </p>
                          <ul className="mt-0.5 space-y-0.5">
                            {client.redirectUris.map((uri) => (
                              <li
                                key={uri}
                                className="break-all font-mono text-caption text-ink"
                              >
                                {uri}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                            Role Diizinkan
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {client.allowedRoles.map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-primary-50 px-2.5 py-0.5 text-caption font-medium text-primary"
                              >
                                {ROLE_METADATA[r]?.label ?? r}
                              </span>
                            ))}
                          </div>
                        </div>
                        {client.postLogoutRedirectUris.length > 0 && (
                          <div>
                            <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                              Post-Logout Redirect URIs
                            </p>
                            <ul className="mt-0.5 space-y-0.5">
                              {client.postLogoutRedirectUris.map((uri) => (
                                <li
                                  key={uri}
                                  className="break-all font-mono text-caption text-ink"
                                >
                                  {uri}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Tambah / Edit Modul SSO */}
      <ModalForm
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={
          modalMode === "create"
            ? "Daftarkan Modul SSO Baru"
            : `Edit Modul "${editingClient?.name ?? ""}"`
        }
        subtitle={
          modalMode === "create"
            ? "Isi detail integrasi OAuth 2.0 modul. Client secret akan dibuat otomatis untuk klien rahasia."
            : "Perbarui nama, URL callback, atau role yang diizinkan mengakses modul ini."
        }
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalMode(null)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="sso-client-form"
              variant="primary"
              isLoading={isSubmitting}
            >
              {modalMode === "create" ? "Daftarkan Modul" : "Simpan Perubahan"}
            </Button>
          </>
        }
      >
        <form
          id="sso-client-form"
          onSubmit={handleSubmitForm}
          className="space-y-4"
          noValidate
        >
          {formError && <Alert status="error">{formError}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="clientId"
              label="Client ID"
              placeholder="mis. modul-skripsi"
              value={form.clientId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, clientId: e.target.value }))
              }
              disabled={modalMode === "edit"}
              error={fieldErrors.clientId}
              helperText="Huruf kecil, angka, titik, underscore, atau strip (2–100 karakter)."
              required
            />
            <Input
              name="name"
              label="Nama Modul"
              placeholder="mis. Sistem Tugas Akhir"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              error={fieldErrors.name}
              required
            />
          </div>

          <Input
            name="description"
            label="Deskripsi Singkat (opsional)"
            placeholder="Ditampilkan pada kartu modul di Menu Utama SSO"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            error={fieldErrors.description}
          />

          <Input
            name="launchUrl"
            label="Launch URL (Tujuan Kartu Menu Utama)"
            placeholder="https://modul.kampus.ac.id/sso/login"
            value={form.launchUrl}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, launchUrl: e.target.value }))
            }
            error={fieldErrors.launchUrl}
            helperText="Rute di modul yang memulai alur login SSO. Wajib https (http hanya untuk localhost)."
            required
          />

          <TextArea
            name="redirectUris"
            label="Redirect URIs (Callback URL)"
            rows={3}
            placeholder={"https://modul.kampus.ac.id/auth/callback\nhttp://localhost:8000/auth/callback"}
            value={form.redirectUrisText}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, redirectUrisText: e.target.value }))
            }
            error={fieldErrors.redirectUris}
            helperText="Satu URL per baris. Dicocokkan persis (tanpa wildcard) demi mencegah Open Redirect."
            required
          />

          <TextArea
            name="postLogoutRedirectUris"
            label="Post-Logout Redirect URIs (opsional)"
            rows={2}
            placeholder="https://modul.kampus.ac.id/"
            value={form.postLogoutUrisText}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                postLogoutUrisText: e.target.value,
              }))
            }
            error={fieldErrors.postLogoutRedirectUris}
            helperText="Satu URL per baris. Tujuan setelah pengguna keluar dari SSO."
          />

          <div className="space-y-2">
            <span className="block text-body-sm font-medium text-ink">
              Role yang Diizinkan Mengakses Modul
            </span>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const selected = form.allowedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={
                      selected
                        ? "rounded-full bg-primary px-3.5 py-1.5 text-body-sm font-semibold text-white transition-colors cursor-pointer"
                        : "rounded-full border border-border-soft bg-surface px-3.5 py-1.5 text-body-sm font-medium text-ink-muted hover:bg-primary-50 hover:text-primary transition-colors cursor-pointer"
                    }
                  >
                    {ROLE_METADATA[r].label} ({r})
                  </button>
                );
              })}
            </div>
            {fieldErrors.allowedRoles && (
              <p className="text-caption text-danger">
                {fieldErrors.allowedRoles}
              </p>
            )}
          </div>

          {modalMode === "create" && (
            <label className="flex items-start gap-3 rounded-2xl border border-border-soft bg-surface/60 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isPublic: e.target.checked }))
                }
                className="mt-1 h-4 w-4 rounded border-border-soft text-primary focus:ring-primary"
              />
              <span className="text-body-sm text-ink">
                <strong className="block font-semibold">
                  Klien Publik (tanpa client_secret)
                </strong>
                <span className="text-ink-muted">
                  Aktifkan hanya untuk SPA / aplikasi frontend murni yang tidak
                  bisa menyimpan secret. Wajib memakai PKCE (S256).
                </span>
              </span>
            </label>
          )}
        </form>
      </ModalForm>

      {/* Modal Kredensial Sekali Tampil */}
      <ModalForm
        isOpen={secretResult !== null}
        onClose={() => setSecretResult(null)}
        title={secretHeading}
        subtitle="Salin dan simpan kredensial ini ke file .env modul terkait."
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setSecretResult(null)}>
            Saya Sudah Menyimpannya
          </Button>
        }
      >
        {secretResult && (
          <div className="space-y-4">
            {secretResult.clientSecret ? (
              <>
                <Alert status="warning">
                  <strong>client_secret hanya ditampilkan satu kali ini.</strong>{" "}
                  Di server SSO hanya hash-nya yang disimpan. Jika hilang, Anda
                  dapat menggunakan tombol <strong>Putar Secret</strong>.
                </Alert>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      client_secret
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={
                        copiedKey === "secret" ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )
                      }
                      onClick={() =>
                        copyText(secretResult.clientSecret!, "secret")
                      }
                    >
                      {copiedKey === "secret" ? "Tersalin" : "Salin Secret"}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto rounded-2xl border border-border-soft bg-surface p-3.5 font-mono text-body-sm text-ink select-all">
                    {secretResult.clientSecret}
                  </pre>
                </div>
              </>
            ) : (
              <Alert status="info">
                Modul ini terdaftar sebagai <strong>Klien Publik</strong> tanpa{" "}
                <code>client_secret</code>. Pastikan modul menggunakan PKCE
                (<code>S256</code>) saat memanggil <code>/api/sso/authorize</code>.
              </Alert>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Contoh Konfigurasi .env Modul
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    copiedKey === "env" ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                  onClick={() =>
                    copyText(
                      buildEnvSnippet(
                        secretResult.client,
                        secretResult.clientSecret,
                      ),
                      "env",
                    )
                  }
                >
                  {copiedKey === "env" ? "Tersalin" : "Salin .env"}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-border-soft bg-surface p-3.5 font-mono text-caption text-ink select-all">
                {buildEnvSnippet(secretResult.client, secretResult.clientSecret)}
              </pre>
            </div>
          </div>
        )}
      </ModalForm>
    </div>
  );
}
