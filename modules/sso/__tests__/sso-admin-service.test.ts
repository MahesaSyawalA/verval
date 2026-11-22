// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import { createSsoClientSchema } from "../schemas/sso-client.schema";
import {
  createSsoClientAdmin,
  listSsoClientsAdmin,
  rotateSsoClientSecretAdmin,
  updateSsoClientAdmin,
  type SsoAdminDeps,
} from "../server/sso-admin.service";
import type { SsoClient } from "../types";

const BASE_CLIENT: SsoClient = {
  id: "db-1",
  clientId: "modul-skripsi",
  name: "Modul Tugas Akhir",
  description: "Pengelolaan bimbingan & sidang",
  launchUrl: "https://skripsi.kampus.ac.id/sso/login",
  secretHash: "$2a$10$hashed-secret",
  redirectUris: ["https://skripsi.kampus.ac.id/auth/callback"],
  postLogoutRedirectUris: ["https://skripsi.kampus.ac.id/"],
  allowedRoles: ["Dosen", "Kaprodi", "Mahasiswa"],
  isActive: true,
  createdAt: new Date("2026-11-22T00:00:00.000Z"),
};

function makeDeps(overrides: Partial<SsoAdminDeps> = {}): SsoAdminDeps {
  return {
    listAllClients: vi.fn().mockResolvedValue([BASE_CLIENT]),
    findClientById: vi.fn().mockResolvedValue(BASE_CLIENT),
    findClientByClientId: vi.fn().mockResolvedValue(null),
    createSsoClient: vi.fn().mockImplementation(async (input) => ({
      id: "db-new",
      ...input,
      isActive: true,
      createdAt: new Date("2026-11-22T01:00:00.000Z"),
    })),
    updateSsoClient: vi.fn().mockImplementation(async (_id, input) => ({
      ...BASE_CLIENT,
      ...input,
    })),
    updateSsoClientSecret: vi.fn().mockImplementation(async (_id, hash) => ({
      ...BASE_CLIENT,
      secretHash: hash,
    })),
    revokeAllRefreshTokensForClient: vi.fn().mockResolvedValue(undefined),
    generateSecret: vi
      .fn()
      .mockResolvedValue({ plain: "plain-secret-123", hash: "hash-secret-123" }),
    now: () => new Date("2026-11-22T02:00:00.000Z"),
    ...overrides,
  };
}

describe("createSsoClientSchema", () => {
  it("menerima URL https dan http://localhost, menolak http publik dan fragmen #", () => {
    const valid = createSsoClientSchema.safeParse({
      clientId: "modul-a",
      name: "Modul A",
      launchUrl: "http://localhost:8000/sso/login",
      redirectUris: ["https://modul-a.kampus.ac.id/auth/callback"],
      allowedRoles: ["Dosen"],
    });
    expect(valid.success).toBe(true);

    const invalidHttp = createSsoClientSchema.safeParse({
      clientId: "modul-b",
      name: "Modul B",
      launchUrl: "http://modul-b.kampus.ac.id/sso/login",
      redirectUris: ["https://modul-b.kampus.ac.id/auth/callback"],
      allowedRoles: ["Dosen"],
    });
    expect(invalidHttp.success).toBe(false);

    const invalidHash = createSsoClientSchema.safeParse({
      clientId: "modul-c",
      name: "Modul C",
      launchUrl: "https://modul-c.kampus.ac.id/sso/login#section",
      redirectUris: ["https://modul-c.kampus.ac.id/auth/callback"],
      allowedRoles: ["Dosen"],
    });
    expect(invalidHash.success).toBe(false);
  });
});

describe("sso-admin.service", () => {
  it("listSsoClientsAdmin menyembunyikan secretHash dan mengisi isPublic", async () => {
    const deps = makeDeps();
    const list = await listSsoClientsAdmin(deps);

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: "db-1",
      clientId: "modul-skripsi",
      isPublic: false,
      isActive: true,
    });
    expect(list[0]).not.toHaveProperty("secretHash");
  });

  it("createSsoClientAdmin membuat klien rahasia beserta clientSecret sekali tampil", async () => {
    const deps = makeDeps();
    const res = await createSsoClientAdmin(
      {
        clientId: "modul-baru",
        name: "Modul Baru",
        description: "Deskripsi",
        launchUrl: "https://baru.kampus.ac.id/sso/login",
        redirectUris: ["https://baru.kampus.ac.id/auth/callback"],
        postLogoutRedirectUris: [],
        allowedRoles: ["Dosen"],
        isPublic: false,
      },
      deps,
    );

    expect(res.clientSecret).toBe("plain-secret-123");
    expect(res.client.isPublic).toBe(false);
    expect(deps.createSsoClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "modul-baru",
        secretHash: "hash-secret-123",
      }),
    );
  });

  it("createSsoClientAdmin untuk klien publik tidak membuat clientSecret", async () => {
    const deps = makeDeps();
    const res = await createSsoClientAdmin(
      {
        clientId: "modul-spa",
        name: "Modul SPA",
        description: null,
        launchUrl: "https://spa.kampus.ac.id/sso/login",
        redirectUris: ["https://spa.kampus.ac.id/auth/callback"],
        postLogoutRedirectUris: [],
        allowedRoles: ["Mahasiswa"],
        isPublic: true,
      },
      deps,
    );

    expect(res.clientSecret).toBeNull();
    expect(res.client.isPublic).toBe(true);
    expect(deps.generateSecret).not.toHaveBeenCalled();
  });

  it("createSsoClientAdmin menolak clientId duplikat dengan 409 CONFLICT", async () => {
    const deps = makeDeps({
      findClientByClientId: vi.fn().mockResolvedValue(BASE_CLIENT),
    });

    await expect(
      createSsoClientAdmin(
        {
          clientId: "modul-skripsi",
          name: "Duplikat",
          description: null,
          launchUrl: "https://skripsi.kampus.ac.id/sso/login",
          redirectUris: ["https://skripsi.kampus.ac.id/auth/callback"],
          postLogoutRedirectUris: [],
          allowedRoles: ["Dosen"],
          isPublic: false,
        },
        deps,
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("updateSsoClientAdmin mencabut semua refresh token saat modul dinonaktifkan", async () => {
    const deps = makeDeps();
    const updated = await updateSsoClientAdmin(
      "db-1",
      { isActive: false },
      deps,
    );

    expect(updated.isActive).toBe(false);
    expect(deps.revokeAllRefreshTokensForClient).toHaveBeenCalledWith(
      "db-1",
      deps.now(),
    );
  });

  it("rotateSsoClientSecretAdmin memutar secret untuk klien rahasia dan menolak klien publik", async () => {
    const deps = makeDeps();
    const rotated = await rotateSsoClientSecretAdmin("db-1", deps);
    expect(rotated.clientSecret).toBe("plain-secret-123");
    expect(deps.updateSsoClientSecret).toHaveBeenCalledWith(
      "db-1",
      "hash-secret-123",
    );

    const publicDeps = makeDeps({
      findClientById: vi.fn().mockResolvedValue({
        ...BASE_CLIENT,
        secretHash: null,
      }),
    });
    await expect(
      rotateSsoClientSecretAdmin("db-1", publicDeps),
    ).rejects.toBeInstanceOf(AppError);
  });
});
