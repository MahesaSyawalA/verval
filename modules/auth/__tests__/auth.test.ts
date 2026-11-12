import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { AppError } from "@/lib/http";
import { signSessionToken, verifySessionToken } from "@/lib/session";
import { loginSchema } from "@/modules/auth";
import {
  authenticateUser,
  type AuthRepositoryDeps,
} from "@/modules/auth/server/auth.service";
import { isProtectedPath, proxy } from "@/proxy";

describe("Auth Module, Session, and Route Guard (Phase 02)", () => {
  describe("Session JWT (jose)", () => {
    it("signs and verifies a valid session payload", async () => {
      const payload = {
        id: "user-123",
        nip: "198204152008121002",
        namaLengkap: "Dr. Iqbal Al-Farisi, M.Kom.",
        email: "iqbal@upi.edu",
        role: "Kaprodi" as const,
      };

      const token = await signSessionToken(payload);
      const verified = await verifySessionToken(token);

      expect(verified).toEqual(payload);
    });

    it("returns null for invalid or empty tokens", async () => {
      expect(await verifySessionToken(null)).toBeNull();
      expect(await verifySessionToken("invalid.jwt.token")).toBeNull();
    });
  });

  describe("loginSchema (Zod)", () => {
    it("validates valid identifier and password", () => {
      const res = loginSchema.safeParse({
        identifier: "iqbal@upi.edu",
        password: "RplCibiru2026!",
      });
      expect(res.success).toBe(true);
    });

    it("rejects empty identifier and short password", () => {
      const res = loginSchema.safeParse({
        identifier: "ab",
        password: "123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("authenticateUser service", () => {
    const mockPasswordHash = bcrypt.hashSync("RplCibiru2026!", 4);

    const mockDeps: AuthRepositoryDeps = {
      findByEmailOrNip: async (identifier: string) => {
        if (
          identifier === "iqbal@upi.edu" ||
          identifier === "198204152008121002"
        ) {
          return {
            id: "kaprodi-uuid",
            nip: "198204152008121002",
            nama_lengkap: "Dr. Iqbal Al-Farisi, M.Kom.",
            email: "iqbal@upi.edu",
            role: "Kaprodi",
            password: mockPasswordHash,
          };
        }
        return null;
      },
      findById: async () => null,
    };

    it("authenticates valid email or NIP and returns role redirect", async () => {
      const result = await authenticateUser(
        {
          identifier: "198204152008121002",
          password: "RplCibiru2026!",
        },
        mockDeps,
      );

      expect(result.user.role).toBe("Kaprodi");
      expect(result.redirectTo).toBe("/menu");
    });

    it("throws 401 UNAUTHORIZED when user is not found or password mismatches", async () => {
      await expect(
        authenticateUser(
          { identifier: "unknown@upi.edu", password: "RplCibiru2026!" },
          mockDeps,
        ),
      ).rejects.toBeInstanceOf(AppError);

      await expect(
        authenticateUser(
          { identifier: "iqbal@upi.edu", password: "WrongPassword!" },
          mockDeps,
        ),
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        status: 401,
      });
    });
  });

  describe("proxy.ts route guard", () => {
    it("identifies protected routes accurately", () => {
      expect(isProtectedPath("/dashboard")).toBe(true);
      expect(isProtectedPath("/tiket/123")).toBe(true);
      expect(isProtectedPath("/login")).toBe(false);
    });

    it("redirects unauthenticated user visiting /dashboard to /login", async () => {
      const req = new NextRequest("http://localhost:3000/dashboard");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/login?next=%2Fdashboard",
      );
    });

    it("redirects authenticated Dosen trying to access /target to /dashboard", async () => {
      const dosenToken = await signSessionToken({
        id: "dosen-1",
        nip: "199008212018032001",
        namaLengkap: "Indira Nareswari Syawanodya, M.T.",
        email: "indira@upi.edu",
        role: "Dosen",
      });

      const req = new NextRequest("http://localhost:3000/target", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${dosenToken}`,
        },
      });
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard",
      );
    });
  });
});
