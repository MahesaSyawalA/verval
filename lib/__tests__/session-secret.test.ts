// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSecretKey, signSessionToken, verifySessionToken } from "@/lib/session";

const PAYLOAD = {
  id: "u-1",
  nip: "1",
  namaLengkap: "Uji Coba",
  email: "uji@upi.edu",
  role: "Dosen" as const,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("SESSION_SECRET", () => {
  it("menolak berjalan di production bila secret kosong", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => getSecretKey()).toThrow(/SESSION_SECRET/);
  });

  it("menolak secret pendek di production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "terlalu-pendek");
    expect(() => getSecretKey()).toThrow(/SESSION_SECRET/);
  });

  it("menerima secret panjang di production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    expect(getSecretKey()).toHaveLength(40);
  });

  it("tidak mengabaikan salah konfigurasi saat memverifikasi token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    await expect(verifySessionToken("token-apa-saja")).rejects.toThrow(
      /SESSION_SECRET/,
    );
  });

  it("token yang ditandatangani dengan secret lain ditolak", async () => {
    vi.stubEnv("SESSION_SECRET", "a".repeat(40));
    const token = await signSessionToken(PAYLOAD);

    vi.stubEnv("SESSION_SECRET", "b".repeat(40));
    expect(await verifySessionToken(token)).toBeNull();
  });
});
