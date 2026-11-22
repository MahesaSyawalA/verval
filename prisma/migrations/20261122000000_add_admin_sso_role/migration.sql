-- AlterTable: tambah role khusus Admin_SSO untuk mengelola integrasi modul SSO
ALTER TABLE `users`
  MODIFY `role` ENUM('Kaprodi', 'Dosen', 'Admin', 'Staff_Kaprodi', 'Mahasiswa', 'Admin_SSO') NOT NULL;
