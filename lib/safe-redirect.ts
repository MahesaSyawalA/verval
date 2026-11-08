const PLACEHOLDER_ORIGIN = "http://internal.invalid";

/**
 * Mengembalikan path internal yang aman untuk redirect setelah login.
 * Menolak URL absolut, protocol-relative (`//host`), dan backslash (`/\host`)
 * yang oleh browser dapat diperlakukan sebagai host lain.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate || !candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.includes("\\")) return fallback;

  try {
    const resolved = new URL(candidate, PLACEHOLDER_ORIGIN);
    if (resolved.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
