export const APP_NAME = "Sistem Informasi RPL — NodeCraft.ID";
export const INSTITUTION_NAME = "Program Studi RPL UPI Kampus Cibiru";

export const MEETING_DURATION_MIN_MINUTES = 15;
export const MEETING_DURATION_MAX_MINUTES = 240;

export const PRESENSI_CODE_LENGTH = 6;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const SESSION_COOKIE_NAME = "nodecraft_rpl_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const UANG_ELEMENTS = ["U", "A", "N", "G"] as const;
export type UangElement = (typeof UANG_ELEMENTS)[number];

export const UANG_LABELS: Record<UangElement, string> = {
  U: "Undangan",
  A: "Absensi",
  N: "Notulensi",
  G: "Gambar",
};
