import { describe, expect, it } from "vitest";
import { getNavigationForRole } from "@/config/navigation";
import { canAccessRoute } from "@/config/roles";
import {
  calculateKPIScore,
  evaluateUangCompleteness,
  getGreetingName,
  getInitials,
  validateMeetingDuration,
} from "@/lib/utils";

describe("Foundation Utilities & Business Rules", () => {
  describe("calculateKPIScore", () => {
    it("returns 0 safely when target is 0 or negative (no division by zero)", () => {
      expect(calculateKPIScore(10, 0)).toBe(0);
      expect(calculateKPIScore(0, 0)).toBe(0);
      expect(calculateKPIScore(5, -3)).toBe(0);
    });

    it("calculates percentage and clamps between 0 and 100", () => {
      expect(calculateKPIScore(14, 22)).toBe(64);
      expect(calculateKPIScore(4, 5)).toBe(80);
      expect(calculateKPIScore(25, 20)).toBe(100);
      expect(calculateKPIScore(-2, 10)).toBe(0);
    });
  });

  describe("validateMeetingDuration (EP & BVA TC-01, TC-02)", () => {
    it("rejects 0, 14, and 241 minutes", () => {
      expect(validateMeetingDuration(0)).toEqual({
        valid: false,
        message: "Durasi rapat tidak valid",
      });
      expect(validateMeetingDuration(14)).toEqual({
        valid: false,
        message: "Durasi rapat tidak valid",
      });
      expect(validateMeetingDuration(241)).toEqual({
        valid: false,
        message: "Durasi rapat tidak valid",
      });
    });

    it("accepts boundary values 15 and 240 minutes", () => {
      expect(validateMeetingDuration(15)).toEqual({ valid: true });
      expect(validateMeetingDuration(90)).toEqual({ valid: true });
      expect(validateMeetingDuration(240)).toEqual({ valid: true });
    });
  });

  describe("evaluateUangCompleteness", () => {
    it("marks complete when all U, A, N, G elements are present", () => {
      const res = evaluateUangCompleteness({
        hasUndangan: true,
        hasAbsensi: true,
        hasFinalNotulensi: true,
        hasDokumentasi: true,
      });
      expect(res.isComplete).toBe(true);
      expect(res.missing).toEqual([]);
    });

    it("lists missing elements when N or G are incomplete", () => {
      const res = evaluateUangCompleteness({
        hasUndangan: true,
        hasAbsensi: true,
        hasFinalNotulensi: false,
        hasDokumentasi: false,
      });
      expect(res.isComplete).toBe(false);
      expect(res.missing).toEqual(["N", "G"]);
    });
  });

  describe("getGreetingName & getInitials", () => {
    it("strips academic titles and returns first name and 2-letter initials", () => {
      expect(getGreetingName("Dr. Iqbal Al-Farisi, M.T.")).toBe("Iqbal");
      expect(getInitials("Dr. Iqbal Al-Farisi, M.T.")).toBe("IA");
      expect(getGreetingName("Indira Maharani, S.Kom., M.T.")).toBe("Indira");
      expect(getInitials("Indira Nyoman, M.T.")).toBe("IN");
    });
  });

  describe("Role navigation & permissions", () => {
    it("hides Master Target (/target) from Dosen role", () => {
      const dosenNav = getNavigationForRole("Dosen");
      expect(dosenNav.map((n) => n.href)).toEqual([
        "/dashboard",
        "/tiket",
        "/arsip",
        "/rapat",
      ]);
      expect(canAccessRoute("Dosen", "/target")).toBe(false);
      expect(canAccessRoute("Kaprodi", "/target")).toBe(true);
    });
  });
});
