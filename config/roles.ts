export const ROLES = ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi", "Mahasiswa"] as const;

export type UserRole = (typeof ROLES)[number];

/** Role dengan hak kelola (buat/ubah/verifikasi) dan melihat data lengkap. */
export const PRIVILEGED_ROLES = ["Kaprodi", "Admin", "Staff_Kaprodi"] as const;

/** Semua role internal prodi; Mahasiswa hanya boleh baca arsip rapat. */
export const STAFF_ROLES = [...PRIVILEGED_ROLES, "Dosen"] as const;

export function isPrivilegedRole(role: UserRole): boolean {
  return (PRIVILEGED_ROLES as readonly string[]).includes(role);
}

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
  Staff_Kaprodi: {
    role: "Staff_Kaprodi",
    label: "Staff Kaprodi",
    defaultRedirect: "/menu",
    subtitle: "Dukungan administrasi program studi",
  },
  Mahasiswa: {
    role: "Mahasiswa",
    label: "Mahasiswa RPL",
    defaultRedirect: "/menu",
    subtitle: "Ringkasan aktivitas akademik Anda",
  },
};

export const ROUTE_ROLE_PERMISSIONS: Record<string, readonly UserRole[]> = {
  "/menu": ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi", "Mahasiswa"],
  "/dashboard": ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi"],
  "/target": ["Kaprodi", "Admin", "Staff_Kaprodi"],
  "/tiket": ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi"],
  "/arsip": ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi", "Mahasiswa"],
  "/rapat": ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi"],
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return allowedRoles.includes(role);
    }
  }
  return true;
}
