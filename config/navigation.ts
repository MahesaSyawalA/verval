import type { UserRole } from "./roles";

export type NavIconName = "dashboard" | "target" | "tiket" | "arsip" | "rapat";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  roles: readonly UserRole[];
}

export const NAVIGATION_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard Kinerja",
    href: "/dashboard",
    icon: "dashboard",
    roles: ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi"],
  },
  {
    id: "target",
    label: "Master Target",
    href: "/target",
    icon: "target",
    roles: ["Kaprodi", "Admin", "Staff_Kaprodi"],
  },
  {
    id: "tiket",
    label: "Tiket Penugasan",
    href: "/tiket",
    icon: "tiket",
    roles: ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi"],
  },
  {
    id: "arsip",
    label: "Arsip Rapat",
    href: "/arsip",
    icon: "arsip",
    roles: ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi", "Mahasiswa"],
  },
  {
    id: "rapat",
    label: "Notulensi & Jadwal Rapat",
    href: "/rapat",
    icon: "rapat",
    roles: ["Kaprodi", "Dosen", "Admin", "Staff_Kaprodi"],
  },
];

export function getNavigationForRole(role: UserRole): NavItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.roles.includes(role));
}
