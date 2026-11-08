import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

const FALLBACK = "/dashboard";

describe("getSafeRedirectPath", () => {
  it("menerima path internal beserta query dan hash", () => {
    expect(getSafeRedirectPath("/tiket", FALLBACK)).toBe("/tiket");
    expect(getSafeRedirectPath("/tiket/123?tab=bukti#atas", FALLBACK)).toBe(
      "/tiket/123?tab=bukti#atas",
    );
  });

  it("memakai fallback bila kosong atau tidak ada", () => {
    expect(getSafeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(getSafeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(getSafeRedirectPath("", FALLBACK)).toBe(FALLBACK);
  });

  it.each([
    "//situs-jahat.com",
    "//situs-jahat.com/dashboard",
    "/\\situs-jahat.com",
    "\\\\situs-jahat.com",
    "https://situs-jahat.com",
    "http://localhost:3000/dashboard",
    "javascript:alert(1)",
    "dashboard",
  ])("menolak target berbahaya: %s", (candidate) => {
    expect(getSafeRedirectPath(candidate, FALLBACK)).toBe(FALLBACK);
  });
});
