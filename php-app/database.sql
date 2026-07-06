-- =======================================================
-- ARSIP KURIKULUM SMP NEGERI 1 BUKIT
-- Struktur baru: Program → Multiple Files
-- Admin bisa kelola Kategori & Tahun Ajaran
-- =======================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- -------------------------------------------------------
-- Tabel users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `role` enum('admin','guru') NOT NULL DEFAULT 'guru',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password untuk kedua akun: 10105158 (akan di-hash via setup_passwords.php)
INSERT INTO `users` (`username`, `password`, `nama`, `role`) VALUES
('burnitelong', 'PLACEHOLDER_HASH', 'Feri Kurniawan, M.Pd.', 'admin'),
('gurusabuk',   'PLACEHOLDER_HASH', 'Guru Sabuk', 'guru');

-- -------------------------------------------------------
-- Tabel kategori (admin bisa CRUD)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kategori` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `warna` enum('blue','rose','emerald','amber','violet','slate') NOT NULL DEFAULT 'blue',
  `aktif` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `kategori` (`nama`, `warna`) VALUES
('SK', 'rose'),
('Program', 'emerald'),
('Foto Kegiatan', 'amber'),
('Laporan', 'blue'),
('Daftar Hadir', 'violet'),
('Lainnya', 'slate');

-- -------------------------------------------------------
-- Tabel tahun_ajaran (admin bisa CRUD)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tahun_ajaran` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tahun` varchar(20) NOT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tahun` (`tahun`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tahun_ajaran` (`tahun`, `aktif`) VALUES
('2025/2026', 1),
('2024/2025', 1),
('2023/2024', 1),
('2022/2023', 0);

-- -------------------------------------------------------
-- Tabel program (dulu: arsip)
-- Satu program = satu kartu, bisa punya banyak file
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `program` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `judul` varchar(255) NOT NULL,
  `kategori_id` int(11) NOT NULL,
  `tahun_ajaran_id` int(11) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `keterangan` text DEFAULT NULL,
  `tanggal_dibuat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_kategori` (`kategori_id`),
  KEY `idx_tahun` (`tahun_ajaran_id`),
  KEY `idx_semester` (`semester`),
  CONSTRAINT `fk_program_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_program_tahun` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- Tabel file_arsip (file-file di dalam satu program)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_arsip` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `program_id` int(11) NOT NULL,
  `nama_file_asli` varchar(255) NOT NULL,
  `nama_file_simpan` varchar(255) NOT NULL,
  `tipe_file` enum('pdf','doc','docx','xls','xlsx','image') NOT NULL,
  `ukuran` int(11) NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `tanggal_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploader` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_program` (`program_id`),
  CONSTRAINT `fk_file_program` FOREIGN KEY (`program_id`) REFERENCES `program`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- SETUP PASSWORD — jalankan setup_passwords.php setelah import
-- =======================================================
