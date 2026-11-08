-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `nip` VARCHAR(50) NOT NULL,
    `nama_lengkap` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `role` ENUM('Kaprodi', 'Dosen', 'Admin') NOT NULL,
    `password` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `users_nip_key`(`nip`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_target` (
    `id` CHAR(36) NOT NULL,
    `kode_target` VARCHAR(50) NOT NULL,
    `nama_target` VARCHAR(255) NOT NULL,
    `kuantitas_total` INTEGER NOT NULL,
    `satuan` VARCHAR(50) NOT NULL,
    `tahun` YEAR NOT NULL,

    UNIQUE INDEX `master_target_kode_target_key`(`kode_target`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `format_bukti` (
    `id` CHAR(36) NOT NULL,
    `nama_field` VARCHAR(100) NOT NULL,
    `tipe_data` ENUM('Teks', 'Angka', 'Tanggal', 'Tautan', 'File') NOT NULL,
    `status_isian` ENUM('Wajib', 'Opsional') NOT NULL,
    `target_id` CHAR(36) NOT NULL,

    INDEX `format_bukti_target_id_idx`(`target_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tiket_penugasan` (
    `id` CHAR(36) NOT NULL,
    `target_id` CHAR(36) NOT NULL,
    `kode_tiket` VARCHAR(50) NOT NULL,
    `kuantitas_ditugaskan` INTEGER NOT NULL,
    `tenggat_waktu` DATE NOT NULL,
    `prioritas` ENUM('Normal', 'Tinggi') NOT NULL DEFAULT 'Normal',
    `is_reminder_active` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('Ditugaskan', 'Dikerjakan', 'Menunggu Verifikasi', 'Tercapai', 'Ditolak') NOT NULL DEFAULT 'Ditugaskan',
    `catatan_kaprodi` TEXT NULL,
    `tanggal_dibuat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dosen_id` CHAR(36) NOT NULL,

    UNIQUE INDEX `tiket_penugasan_kode_tiket_key`(`kode_tiket`),
    INDEX `tiket_penugasan_target_id_idx`(`target_id`),
    INDEX `tiket_penugasan_dosen_id_idx`(`dosen_id`),
    INDEX `tiket_penugasan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `isian_bukti` (
    `id` CHAR(36) NOT NULL,
    `format_bukti_id` CHAR(36) NOT NULL,
    `urutan_submisi` INTEGER NOT NULL,
    `nilai_isian` TEXT NOT NULL,
    `tiket_id` CHAR(36) NOT NULL,

    INDEX `isian_bukti_tiket_id_idx`(`tiket_id`),
    INDEX `isian_bukti_format_bukti_id_idx`(`format_bukti_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_tiket` (
    `id` CHAR(36) NOT NULL,
    `tiket_id` CHAR(36) NOT NULL,
    `status_riwayat` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `aktor_id` CHAR(36) NOT NULL,

    INDEX `riwayat_tiket_tiket_id_idx`(`tiket_id`),
    INDEX `riwayat_tiket_aktor_id_idx`(`aktor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapat` (
    `id` CHAR(36) NOT NULL,
    `notulis_id` CHAR(36) NOT NULL,
    `judul_rapat` VARCHAR(255) NOT NULL,
    `tanggal` DATE NOT NULL,
    `waktu_mulai` TIME(0) NOT NULL,
    `waktu_selesai` TIME(0) NOT NULL,
    `format` ENUM('Luring', 'Daring', 'Hybrid') NOT NULL,
    `lokasi` VARCHAR(255) NOT NULL,
    `deskripsi_agenda` TEXT NOT NULL,
    `kode_presensi` VARCHAR(6) NOT NULL,
    `is_reminder_active` BOOLEAN NOT NULL DEFAULT true,
    `metode_undangan` ENUM('Generate Otomatis', 'Upload Manual') NOT NULL,
    `file_undangan` VARCHAR(255) NULL,
    `status_rapat` ENUM('Dijadwalkan', 'Berlangsung', 'Selesai') NOT NULL DEFAULT 'Dijadwalkan',

    INDEX `rapat_notulis_id_idx`(`notulis_id`),
    INDEX `rapat_tanggal_idx`(`tanggal`),
    INDEX `rapat_status_rapat_idx`(`status_rapat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peserta_rapat` (
    `id` CHAR(36) NOT NULL,
    `dosen_id` CHAR(36) NOT NULL,
    `rapat_id` CHAR(36) NOT NULL,
    `status_kehadiran` ENUM('Belum Hadir', 'Hadir', 'Izin', 'Sakit') NOT NULL DEFAULT 'Belum Hadir',
    `waktu_presensi` DATETIME(3) NULL,
    `metode_presensi` ENUM('Kode', 'Scan QR', 'Manual') NULL,
    `keterangan_absen` TEXT NULL,

    INDEX `peserta_rapat_rapat_id_idx`(`rapat_id`),
    UNIQUE INDEX `peserta_rapat_dosen_id_rapat_id_key`(`dosen_id`, `rapat_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notulensi` (
    `id` CHAR(36) NOT NULL,
    `agenda_pembahasan` TEXT NOT NULL,
    `hal_dibahas` TEXT NOT NULL,
    `keputusan` TEXT NOT NULL,
    `tindak_lanjut` TEXT NOT NULL,
    `file_lampiran` VARCHAR(255) NULL,
    `status_notulensi` ENUM('Draf', 'Final') NOT NULL DEFAULT 'Draf',
    `dibuat_oleh` CHAR(36) NOT NULL,
    `rapat_id` CHAR(36) NOT NULL,

    UNIQUE INDEX `notulensi_rapat_id_key`(`rapat_id`),
    INDEX `notulensi_dibuat_oleh_idx`(`dibuat_oleh`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dokumentasi` (
    `id` CHAR(36) NOT NULL,
    `rapat_id` CHAR(36) NOT NULL,
    `file_gambar` VARCHAR(255) NOT NULL,
    `caption` VARCHAR(255) NULL,

    INDEX `dokumentasi_rapat_id_idx`(`rapat_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id` CHAR(36) NOT NULL,
    `tipe_notifikasi` VARCHAR(100) NOT NULL,
    `judul_notifikasi` VARCHAR(255) NOT NULL,
    `pesan` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` CHAR(36) NOT NULL,

    INDEX `notifikasi_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `format_bukti` ADD CONSTRAINT `format_bukti_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `master_target`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiket_penugasan` ADD CONSTRAINT `tiket_penugasan_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `master_target`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiket_penugasan` ADD CONSTRAINT `tiket_penugasan_dosen_id_fkey` FOREIGN KEY (`dosen_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_bukti` ADD CONSTRAINT `isian_bukti_format_bukti_id_fkey` FOREIGN KEY (`format_bukti_id`) REFERENCES `format_bukti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_bukti` ADD CONSTRAINT `isian_bukti_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket_penugasan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_tiket` ADD CONSTRAINT `riwayat_tiket_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket_penugasan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_tiket` ADD CONSTRAINT `riwayat_tiket_aktor_id_fkey` FOREIGN KEY (`aktor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapat` ADD CONSTRAINT `rapat_notulis_id_fkey` FOREIGN KEY (`notulis_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peserta_rapat` ADD CONSTRAINT `peserta_rapat_dosen_id_fkey` FOREIGN KEY (`dosen_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peserta_rapat` ADD CONSTRAINT `peserta_rapat_rapat_id_fkey` FOREIGN KEY (`rapat_id`) REFERENCES `rapat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notulensi` ADD CONSTRAINT `notulensi_dibuat_oleh_fkey` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notulensi` ADD CONSTRAINT `notulensi_rapat_id_fkey` FOREIGN KEY (`rapat_id`) REFERENCES `rapat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dokumentasi` ADD CONSTRAINT `dokumentasi_rapat_id_fkey` FOREIGN KEY (`rapat_id`) REFERENCES `rapat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
