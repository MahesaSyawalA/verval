export const ROLES = ["Kaprodi", "Dosen", "Admin"] as const;

export type UserRole = (typeof ROLES)[number];

export interface RoleMetadata {
  role: UserRole;
  label: string;
  defaultRedirect: string;
  subtitle: string;
}

export const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  Kaprodi: {
    role: "Kaprodi",
    label: "Ketua Program Studi",
    defaultRedirect: "/menu",
    subtitle: "Ringkasan kinerja dan penugasan Anda",
  },
  Dosen: {
    role: "Dosen",
    label: "Dosen RPL",
    defaultRedirect: "/menu",
    subtitle: "Ringkasan tugas dan capaian Anda",
  },
  Admin: {
    role: "Admin",
    label: "Administrator Prodi",
    defaultRedirect: "/menu",
    subtitle: "Pengelolaan agenda rapat, dokumen, dan penugasan",
  },
};

export const ROUTE_ROLE_PERMISSIONS: Record<string, readonly UserRole[]> = {
  "/menu": ["Kaprodi", "Dosen", "Admin"],
  "/dashboard": ["Kaprodi", "Dosen", "Admin"],
  "/target": ["Kaprodi", "Admin"],
  "/tiket": ["Kaprodi", "Dosen", "Admin"],
  "/arsip": ["Kaprodi", "Dosen", "Admin"],
  "/rapat": ["Kaprodi", "Dosen", "Admin"],
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return allowedRoles.includes(role);
    }
  }
  return true;
}
