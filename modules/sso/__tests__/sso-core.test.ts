// @vitest-environment node
import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isValidCodeChallenge,
  randomToken,
  sha256Hex,
  verifyPkceS256,
} from "../server/crypto";
import { getSigningKey, resetSigningKeyForTests } from "../server/keys";
import { OAuthError, oauthErrorResponse } from "../server/oauth-error";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  getIssuer,
  signAccessToken,
  verifyAccessToken,
} from "../server/tokens";
import type { SsoUser } from "../types";
import { createHash } from "node:crypto";

const USER: SsoUser = {
  id: "u1",
  nip: "199008212018032001",
  namaLengkap: "Indira Nareswari",
  email: "indira@upi.edu",
  role: "Dosen",
};
const ISSUER = "https://sso.test";

beforeEach(() => {
  resetSigningKeyForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  resetSigningKeyForTests();
});

describe("crypto", () => {
  it("randomToken unik dan cukup panjang, sha256Hex stabil 64 heks", () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(randomToken().length).toBeGreaterThanOrEqual(43);
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("PKCE S256: verifier yang benar lolos, yang salah atau terlalu pendek ditolak", () => {
    const verifier = "A".repeat(43);
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    expect(isValidCodeChallenge(challenge)).toBe(true);
    expect(verifyPkceS256(verifier, challenge)).toBe(true);
    expect(verifyPkceS256("B".repeat(43), challenge)).toBe(false);
    expect(verifyPkceS256("pendek", challenge)).toBe(false);
    expect(isValidCodeChallenge("terlalu-pendek")).toBe(false);
  });
});

describe("access token RS256", () => {
  it("menandatangani dan memverifikasi dengan klaim lengkap", async () => {
    const token = await signAccessToken(USER, "modul-laravel", ISSUER);
    const [header] = token.split(".");
    const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString());
    const { kid } = await getSigningKey();

    expect(decodedHeader).toMatchObject({ alg: "RS256", typ: "JWT", kid });
    expect(await verifyAccessToken(token, ISSUER)).toEqual({
      sub: "u1",
      name: "Indira Nareswari",
      email: "indira@upi.edu",
      nip: "199008212018032001",
      role: "Dosen",
    });
  });

  it("audience berisi client_id dan masa berlaku 15 menit", async () => {
    const token = await signAccessToken(USER, "modul-laravel", ISSUER);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );

    expect(payload.aud).toBe("modul-laravel");
    expect(payload.iss).toBe(ISSUER);
    expect(payload.exp - payload.iat).toBe(ACCESS_TOKEN_TTL_SECONDS);
    expect(ACCESS_TOKEN_TTL_SECONDS).toBe(900);
  });

  it("menolak token yang diubah, penerbit lain, dan yang kedaluwarsa", async () => {
    const token = await signAccessToken(USER, "modul-laravel", ISSUER);

    const [h, p, s] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url").toString()), role: "Admin" }),
    ).toString("base64url");
    expect(await verifyAccessToken(`${h}.${forgedPayload}.${s}`, ISSUER)).toBeNull();

    expect(await verifyAccessToken(token, "https://penerbit-lain.test")).toBeNull();
    expect(await verifyAccessToken("bukan.token.sama.sekali", ISSUER)).toBeNull();

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + (ACCESS_TOKEN_TTL_SECONDS + 5) * 1000);
    expect(await verifyAccessToken(token, ISSUER)).toBeNull();
  });

  it("menolak token yang ditandatangani kunci lain", async () => {
    const token = await signAccessToken(USER, "modul-laravel", ISSUER);

    resetSigningKeyForTests();
    const other = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    }).privateKey;
    vi.stubEnv("SSO_PRIVATE_KEY", other);

    expect(await verifyAccessToken(token, ISSUER)).toBeNull();
  });
});

describe("kunci penandatangan", () => {
  it("JWKS hanya memuat bagian publik beserta kid dan alg", async () => {
    const { publicJwk, kid } = await getSigningKey();

    expect(publicJwk).toMatchObject({ kty: "RSA", alg: "RS256", use: "sig", kid });
    for (const privatePart of ["d", "p", "q", "dp", "dq", "qi"]) {
      expect(publicJwk).not.toHaveProperty(privatePart);
    }
  });

  it("membaca SSO_PRIVATE_KEY (PEM dengan \\n literal) dan memakai SSO_KEY_ID", async () => {
    const pem = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    }).privateKey;
    vi.stubEnv("SSO_PRIVATE_KEY", pem.trim().replace(/\n/g, "\\n"));
    vi.stubEnv("SSO_KEY_ID", "kunci-2026");

    const first = await getSigningKey();
    expect(first.kid).toBe("kunci-2026");

    // Kunci yang sama harus menghasilkan JWK publik yang sama setelah dimuat ulang.
    resetSigningKeyForTests();
    const second = await getSigningKey();
    expect(second.publicJwk.n).toBe(first.publicJwk.n);
  });

  it("menolak berjalan di production tanpa SSO_PRIVATE_KEY", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SSO_PRIVATE_KEY", "");

    await expect(getSigningKey()).rejects.toThrow(/SSO_PRIVATE_KEY/);
  });
});

describe("getIssuer", () => {
  it("memakai SSO_ISSUER bila ada (tanpa garis miring akhir), kalau tidak origin request", () => {
    const request = new Request("https://app.test/api/sso/token");
    expect(getIssuer(request)).toBe("https://app.test");

    vi.stubEnv("SSO_ISSUER", "https://sso.kampus.ac.id/");
    expect(getIssuer(request)).toBe("https://sso.kampus.ac.id");
  });
});

describe("oauthErrorResponse", () => {
  it("OAuthError menjadi respons berformat OAuth tanpa cache", async () => {
    const res = oauthErrorResponse(new OAuthError("invalid_grant", "Kode sudah dipakai."));

    expect(res.status).toBe(400);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      error: "invalid_grant",
      error_description: "Kode sudah dipakai.",
    });
  });

  it("melempar kembali error kontrol Next (punya digest) agar prerender tidak rusak", () => {
    const controlFlow = Object.assign(new Error("bail out"), { digest: "DYNAMIC_SERVER_USAGE" });

    expect(() => oauthErrorResponse(controlFlow)).toThrow(controlFlow);
  });

  it("error biasa menjadi 500 server_error tanpa detail", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = oauthErrorResponse(new Error("password=rahasia"));

    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("rahasia");
    spy.mockRestore();
  });
});
