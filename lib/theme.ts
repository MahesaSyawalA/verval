export const THEME_STORAGE_KEY = "sacibiru-theme";

export type Theme = "light" | "dark";

/** Pilihan tersimpan menang; tanpa pilihan, ikuti pengaturan sistem pengguna. */
export function resolveTheme(
  stored: string | null | undefined,
  prefersDark: boolean,
): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark ? "dark" : "light";
}

/**
 * Dijalankan sebelum halaman pertama dicat agar tidak berkedip terang lalu gelap.
 * Hanya memasang data-theme="dark"; mode terang adalah keadaan tanpa atribut.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`;
