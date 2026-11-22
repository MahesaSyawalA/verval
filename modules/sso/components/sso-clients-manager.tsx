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

const SHORT_ROLE_LABEL: Record<UserRole, string> = {
  Kaprodi: "Kaprodi",
  Dosen: "Dosen",
  Admin: "Admin",
  Staff_Kaprodi: "Staff Kaprodi",
  Mahasiswa: "Mahasiswa",
  Admin_SSO: "Admin SSO",
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
    typeof window !== "undefined"
      ? window.location.origin
      : "https://sso.kampus.ac.id";
  const lines = [`SSO_URL=${origin}`, `SSO_CLIENT_ID=${client.clientId}`];
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

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<SsoClientAdminItem | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [busyClientId, setBusyClientId] = useState<string | null>(null);

  const [secretResult, setSecretResult] =
    useState<SsoClientSecretPayload | null>(null);
  const [secretHeading, setSecretHeading] = useState("Kredensial Modul");
  const [copiedKey, setCopiedKey] = useState<"secret" | "env" | null>(null);

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.isActive).length;
    return { total: clients.length, active, inactive: clients.length - active };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q),
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
        setSecretHeading(res.data.client.name);
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
        setPageSuccess(`Modul "${res.data.name}" diperbarui.`);
      }
    } catch (err) {
      if (err instanceof AppError) {
        if (err.fields) setFieldErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError("Gagal menyimpan modul.");
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
        `Nonaktifkan "${client.name}"? Semua sesi refresh token modul ini akan dicabut.`,
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
          ? `"${res.data.name}" diaktifkan.`
          : `"${res.data.name}" dinonaktifkan.`,
      );
    } catch (err) {
      setPageError(
        err instanceof AppError ? err.message : "Gagal mengubah status modul.",
      );
    } finally {
      setBusyClientId(null);
    }
  }

  async function handleRotateSecret(client: SsoClientAdminItem) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Putar secret "${client.name}"? Secret lama langsung tidak berlaku.`,
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
      setSecretHeading(`Secret Baru · ${res.data.client.name}`);
      setSecretResult(res.data);
      setCopiedKey(null);
    } catch (err) {
      setPageError(
        err instanceof AppError ? err.message : "Gagal memutar secret.",
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
      <div className="mx-auto max-w-[1100px] space-y-6">
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
          <div className="flex items-center gap-2.5">
            <Link
              href="/menu"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border-soft bg-white px-4 text-body-sm font-medium text-ink hover:bg-primary-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Menu
            </Link>
            <Link
              href="/logout"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border-soft bg-white px-4 text-body-sm font-medium text-ink hover:bg-primary-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Link>
          </div>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-h4 font-bold text-ink">
              Integrasi Modul SSO
            </h1>
            <p className="text-body-sm text-ink-muted">
              Kelola klien OAuth 2.0, akses role, dan secret.
            </p>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreateModal}
          >
            Modul Baru
          </Button>
        </section>

        {pageError && <Alert status="error">{pageError}</Alert>}
        {pageSuccess && <Alert status="success">{pageSuccess}</Alert>}

        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4">
            <p className="text-caption text-ink-muted">Total</p>
            <p className="font-heading text-h4 font-bold text-ink">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-caption text-ink-muted">Aktif</p>
            <p className="font-heading text-h4 font-bold text-success">
              {stats.active}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-caption text-ink-muted">Nonaktif</p>
            <p className="font-heading text-h4 font-bold text-ink-muted">
              {stats.inactive}
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="max-w-sm">
            <Input
              name="search"
              placeholder="Cari nama atau client_id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-muted" />}
            />
          </div>

          {filteredClients.length === 0 ? (
            <Card className="p-8 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-heading text-h6 font-bold text-ink">
                {clients.length === 0
                  ? "Belum ada modul terdaftar"
                  : "Tidak ada hasil"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredClients.map((client) => {
                const isBusy = busyClientId === client.id;
                return (
                  <Card key={client.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-h6 font-bold text-ink">
                          {client.name}
                        </h2>
                        <code className="rounded-full border border-border-soft bg-surface px-2.5 py-0.5 text-caption text-ink-muted">
                          {client.clientId}
                        </code>
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
                          {client.isPublic ? "Publik" : "Rahasia"}
                        </span>
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

                    {client.description && (
                      <p className="text-body-sm text-ink-muted">
                        {client.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-2 border-t border-border-soft pt-3 text-caption sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="break-all">
                          <span className="font-semibold text-ink-muted">
                            Launch:{" "}
                          </span>
                          <span className="font-mono text-ink">
                            {client.launchUrl}
                          </span>
                        </p>
                        <p className="break-all">
                          <span className="font-semibold text-ink-muted">
                            Callback:{" "}
                          </span>
                          <span className="font-mono text-ink">
                            {client.redirectUris.join(", ")}
                          </span>
                        </p>
                        {client.postLogoutRedirectUris.length > 0 && (
                          <p className="break-all">
                            <span className="font-semibold text-ink-muted">
                              Logout:{" "}
                            </span>
                            <span className="font-mono text-ink">
                              {client.postLogoutRedirectUris.join(", ")}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-start gap-1.5 sm:justify-end">
                        {client.allowedRoles.map((r) => (
                          <span
                            key={r}
                            className="rounded-full bg-primary-50 px-2.5 py-0.5 text-caption font-medium text-primary"
                          >
                            {SHORT_ROLE_LABEL[r] ?? r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Tambah / Edit */}
      <ModalForm
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Modul SSO Baru" : "Edit Modul SSO"}
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
              Simpan
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
              placeholder="modul-skripsi"
              value={form.clientId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, clientId: e.target.value }))
              }
              disabled={modalMode === "edit"}
              error={fieldErrors.clientId}
              required
            />
            <Input
              name="name"
              label="Nama Modul"
              placeholder="Sistem Tugas Akhir"
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
            label="Deskripsi (opsional)"
            placeholder="Deskripsi singkat di Menu Utama"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            error={fieldErrors.description}
          />

          <Input
            name="launchUrl"
            label="Launch URL"
            placeholder="https://modul.kampus.ac.id/sso/login"
            value={form.launchUrl}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, launchUrl: e.target.value }))
            }
            error={fieldErrors.launchUrl}
            required
          />

          <TextArea
            name="redirectUris"
            label="Redirect URIs (1 URL per baris)"
            rows={2}
            placeholder="https://modul.kampus.ac.id/auth/callback"
            value={form.redirectUrisText}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, redirectUrisText: e.target.value }))
            }
            error={fieldErrors.redirectUris}
            required
          />

          <TextArea
            name="postLogoutRedirectUris"
            label="Post-Logout URIs (opsional)"
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
          />

          <div className="space-y-2">
            <span className="block text-body-sm font-medium text-ink">
              Role Diizinkan
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
                    {SHORT_ROLE_LABEL[r]}
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
            <label className="flex items-center gap-2.5 text-body-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isPublic: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border-soft text-primary focus:ring-primary"
              />
              <span>Klien Publik (SPA, tanpa secret — wajib PKCE)</span>
            </label>
          )}
        </form>
      </ModalForm>

      {/* Modal Secret Sekali Tampil */}
      <ModalForm
        isOpen={secretResult !== null}
        onClose={() => setSecretResult(null)}
        title={secretHeading}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setSecretResult(null)}>
            Selesai
          </Button>
        }
      >
        {secretResult && (
          <div className="space-y-4">
            {secretResult.clientSecret ? (
              <>
                <Alert status="warning">
                  Secret hanya tampil sekali. Simpan sekarang ke <code>.env</code>{" "}
                  modul.
                </Alert>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-semibold text-ink-muted">
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
                      {copiedKey === "secret" ? "Tersalin" : "Salin"}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto rounded-2xl border border-border-soft bg-surface p-3 font-mono text-body-sm text-ink select-all">
                    {secretResult.clientSecret}
                  </pre>
                </div>
              </>
            ) : (
              <Alert status="info">
                Klien Publik — tanpa <code>client_secret</code>, wajib PKCE{" "}
                <code>S256</code>.
              </Alert>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold text-ink-muted">
                  .env
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
              <pre className="overflow-x-auto rounded-2xl border border-border-soft bg-surface p-3 font-mono text-caption text-ink select-all">
                {buildEnvSnippet(secretResult.client, secretResult.clientSecret)}
              </pre>
            </div>
          </div>
        )}
      </ModalForm>
    </div>
  );
}
