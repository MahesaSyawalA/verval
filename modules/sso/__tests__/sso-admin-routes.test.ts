// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";

const { requireServerSession, adminService } = vi.hoisted(() => ({
  requireServerSession: vi.fn(),
  adminService: {
    listSsoClientsAdmin: vi.fn(),
    createSsoClientAdmin: vi.fn(),
    updateSsoClientAdmin: vi.fn(),
    rotateSsoClientSecretAdmin: vi.fn(),
  },
}));

vi.mock("@/lib/session", () => ({
  requireServerSession: (...args: unknown[]) => requireServerSession(...args),
}));

vi.mock("../server/sso-admin.service", () => adminService);

import {
  GET as listClientsGET,
  POST as createClientPOST,
} from "@/app/api/sso/clients/route";
import { PATCH as updateClientPATCH } from "@/app/api/sso/clients/[id]/route";
import { POST as rotateSecretPOST } from "@/app/api/sso/clients/[id]/rotate-secret/route";

const SAMPLE_ITEM = {
  id: "db-1",
  clientId: "modul-skripsi",
  name: "Modul Tugas Akhir",
  description: null,
  launchUrl: "https://skripsi.kampus.ac.id/sso/login",
  isPublic: false,
  redirectUris: ["https://skripsi.kampus.ac.id/auth/callback"],
  postLogoutRedirectUris: [],
  allowedRoles: ["Dosen"],
  isActive: true,
  createdAt: "2026-11-22T00:00:00.000Z",
};

beforeEach(() => {
  requireServerSession.mockReset();
  for (const fn of Object.values(adminService)) fn.mockReset();
});

describe("API /api/sso/clients (Admin_SSO only)", () => {
  it("GET menolak role selain Admin_SSO dengan 403", async () => {
    requireServerSession.mockRejectedValue(
      new AppError("FORBIDDEN", "Tidak memiliki akses.", 403),
    );

    const res = await listClientsGET();
    expect(res.status).toBe(403);
    expect(requireServerSession).toHaveBeenCalledWith(["Admin_SSO"]);
  });

  it("GET mengembalikan daftar klien untuk Admin_SSO", async () => {
    requireServerSession.mockResolvedValue({ id: "u-sso", role: "Admin_SSO" });
    adminService.listSsoClientsAdmin.mockResolvedValue([SAMPLE_ITEM]);

    const res = await listClientsGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [SAMPLE_ITEM] });
  });

  it("POST membuat klien baru dan menyertakan Cache-Control: no-store", async () => {
    requireServerSession.mockResolvedValue({ id: "u-sso", role: "Admin_SSO" });
    adminService.createSsoClientAdmin.mockResolvedValue({
      client: SAMPLE_ITEM,
      clientSecret: "rahasia-baru",
    });

    const req = new NextRequest("https://sso.test/api/sso/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId: "modul-skripsi",
        name: "Modul Tugas Akhir",
        launchUrl: "https://skripsi.kampus.ac.id/sso/login",
        redirectUris: ["https://skripsi.kampus.ac.id/auth/callback"],
        allowedRoles: ["Dosen"],
      }),
    });

    const res = await createClientPOST(req);
    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      data: { client: SAMPLE_ITEM, clientSecret: "rahasia-baru" },
    });
  });

  it("POST menolak payload tidak valid dengan 400 VALIDATION_ERROR", async () => {
    requireServerSession.mockResolvedValue({ id: "u-sso", role: "Admin_SSO" });

    const req = new NextRequest("https://sso.test/api/sso/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId: "INVALID ID!",
        name: "A",
        launchUrl: "http://bukan-https.example.com",
        redirectUris: [],
        allowedRoles: [],
      }),
    });

    const res = await createClientPOST(req);
    expect(res.status).toBe(400);
    expect(adminService.createSsoClientAdmin).not.toHaveBeenCalled();
  });

  it("PATCH memperbarui konfigurasi modul", async () => {
    requireServerSession.mockResolvedValue({ id: "u-sso", role: "Admin_SSO" });
    adminService.updateSsoClientAdmin.mockResolvedValue({
      ...SAMPLE_ITEM,
      isActive: false,
    });

    const req = new NextRequest("https://sso.test/api/sso/clients/db-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    const res = await updateClientPATCH(req, {
      params: Promise.resolve({ id: "db-1" }),
    });
    expect(res.status).toBe(200);
    expect(adminService.updateSsoClientAdmin).toHaveBeenCalledWith("db-1", {
      isActive: false,
    });
  });

  it("POST /rotate-secret mengembalikan secret baru dengan Cache-Control: no-store", async () => {
    requireServerSession.mockResolvedValue({ id: "u-sso", role: "Admin_SSO" });
    adminService.rotateSsoClientSecretAdmin.mockResolvedValue({
      client: SAMPLE_ITEM,
      clientSecret: "secret-baru-rotated",
    });

    const req = new NextRequest(
      "https://sso.test/api/sso/clients/db-1/rotate-secret",
      { method: "POST" },
    );

    const res = await rotateSecretPOST(req, {
      params: Promise.resolve({ id: "db-1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      data: { client: SAMPLE_ITEM, clientSecret: "secret-baru-rotated" },
    });
  });
});
