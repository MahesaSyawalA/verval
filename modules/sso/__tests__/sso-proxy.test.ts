// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifySessionToken } = vi.hoisted(() => ({
  verifySessionToken: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  verifySessionToken: (...args: unknown[]) => verifySessionToken(...args),
}));

import { proxy } from "@/proxy";

beforeEach(() => {
  verifySessionToken.mockReset();
});

describe("proxy.ts (SP-Initiated SSO & akses /sso-clients)", () => {
  it("pengguna sudah login di /login?next=/api/sso/authorize?... tetap diteruskan ke authorize (bukan /menu)", async () => {
    verifySessionToken.mockResolvedValue({ id: "u1", role: "Dosen" });

    const nextTarget =
      "/api/sso/authorize?client_id=modul-a&redirect_uri=https%3A%2F%2Fa.test%2Fcb&response_type=code";
    const req = new NextRequest(
      `https://sso.test/login?next=${encodeURIComponent(nextTarget)}`,
    );

    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`https://sso.test${nextTarget}`);
  });

  it("pengguna sudah login di /login?next=https://jahat.test jatuh ke /menu", async () => {
    verifySessionToken.mockResolvedValue({ id: "u1", role: "Dosen" });

    const req = new NextRequest(
      "https://sso.test/login?next=https%3A%2F%2Fjahat.test%2Fphish",
    );

    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://sso.test/menu");
  });

  it("role selain Admin_SSO ditolak dari /sso-clients dan dialihkan ke /menu", async () => {
    verifySessionToken.mockResolvedValue({ id: "u2", role: "Admin" });

    const req = new NextRequest("https://sso.test/sso-clients");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://sso.test/menu");
  });

  it("role Admin_SSO diizinkan membuka /sso-clients", async () => {
    verifySessionToken.mockResolvedValue({ id: "u3", role: "Admin_SSO" });

    const req = new NextRequest("https://sso.test/sso-clients");
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("pengguna belum login di /sso-clients?q=modul diarahkan ke /login sambil mempertahankan query", async () => {
    verifySessionToken.mockResolvedValue(null);

    const req = new NextRequest("https://sso.test/sso-clients?q=modul");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location") as string);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/sso-clients?q=modul");
  });
});
