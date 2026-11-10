import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardShell } from "../dashboard-shell";
import { MobileSidebar } from "../mobile-sidebar";
import { Sidebar } from "../sidebar";
import { Topbar } from "../topbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock notification dropdown
vi.mock("@/modules/notifikasi", () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown" />,
}));

describe("Responsive Mobile & Tablet Navigation", () => {
  describe("Sidebar (Desktop Component)", () => {
    it("memiliki class 'hidden lg:flex' agar tidak muncul dan mempersempit layar mobile/tablet", () => {
      render(<Sidebar role="Dosen" fullName="Indira Nareswari" />);

      const aside = screen.getByRole("complementary", {
        name: "Navigasi Utama",
      });
      expect(aside.className).toContain("hidden");
      expect(aside.className).toContain("lg:flex");
    });
  });

  describe("Topbar (Sticky Navbar Component)", () => {
    it("memiliki class 'sticky top-0 z-30' untuk navbar sticky di mobile dan tablet", () => {
      render(
        <Topbar
          fullName="Dr. Iqbal Al-Farisi"
          role="Kaprodi"
          onOpenMobileMenu={vi.fn()}
        />,
      );

      const header = screen.getByRole("banner");
      expect(header.className).toContain("sticky");
      expect(header.className).toContain("top-0");
      expect(header.className).toContain("z-30");
    });

    it("memiliki tombol trigger hamburger menu yang tersembunyi di desktop (lg:hidden)", () => {
      const handleOpen = vi.fn();
      render(
        <Topbar
          fullName="Dr. Iqbal Al-Farisi"
          role="Kaprodi"
          onOpenMobileMenu={handleOpen}
        />,
      );

      const triggerBtn = screen.getByRole("button", {
        name: "Buka menu navigasi",
      });
      expect(triggerBtn.className).toContain("lg:hidden");

      fireEvent.click(triggerBtn);
      expect(handleOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("MobileSidebar (Drawer Component)", () => {
    it("merender item navigasi sesuai role dan merespons tombol tutup", () => {
      const handleClose = vi.fn();
      render(
        <MobileSidebar
          isOpen={true}
          onClose={handleClose}
          role="Kaprodi"
          fullName="Dr. Iqbal Al-Farisi, M.Kom."
        />,
      );

      // Pastikan nama dan badge role tampil di header drawer
      expect(screen.getByText("Dr. Iqbal Al-Farisi, M.Kom.")).toBeDefined();
      expect(screen.getByText("SACIBIRU RPL")).toBeDefined();

      // Pastikan menu navigasi tampil
      expect(screen.getByText("Dashboard Kinerja")).toBeDefined();
      expect(screen.getByText("Master Target")).toBeDefined();
      expect(screen.getByText("Tiket Penugasan")).toBeDefined();

      // Klik tombol close
      const closeBtn = screen.getByRole("button", {
        name: "Tutup menu navigasi",
      });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("menutup drawer saat salah satu tautan navigasi diklik", () => {
      const handleClose = vi.fn();
      render(
        <MobileSidebar
          isOpen={true}
          onClose={handleClose}
          role="Dosen"
          fullName="Indira Nareswari, M.T."
        />,
      );

      const link = screen.getByRole("link", { name: /Dashboard Kinerja/i });
      fireEvent.click(link);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("DashboardShell Integration", () => {
    it("menghubungkan tombol trigger topbar dengan pembukaan mobile sidebar drawer", () => {
      render(
        <DashboardShell
          user={{
            id: "user-1",
            namaLengkap: "Admin Prodi RPL",
            email: "admin.rpl@upi.edu",
            role: "Admin",
          }}
        >
          <div data-testid="page-content">Halaman Utama</div>
        </DashboardShell>,
      );

      expect(screen.getByTestId("page-content")).toBeDefined();

      const triggerBtn = screen.getByRole("button", {
        name: "Buka menu navigasi",
      });
      fireEvent.click(triggerBtn);

      const mobileDrawer = screen.getByRole("complementary", {
        name: "Navigasi Menu Mobile",
      });
      expect(mobileDrawer.getAttribute("aria-hidden")).toBe("false");
    });
  });
});
