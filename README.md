# 📚 Aplikasi Arsip Kurikulum — Wakil Kepala Sekolah

Aplikasi lengkap untuk mengelola arsip **berbasis Program**. Setiap program (mis. "Program MPLS") dapat berisi **beberapa file** sekaligus: SK, Daftar Hadir, Foto Kegiatan, Laporan, dll — tersusun rapi dalam **satu kartu** berdasarkan Tahun Ajaran.

## 🎯 Apa yang Anda dapatkan

Proyek ini berisi **2 versi**:

### 1️⃣ `php-app/` — ⭐ VERSI PRODUKSI (yang Anda deploy)
Aplikasi PHP + MySQL asli yang siap diinstal di **XAMPP (lokal)** maupun **Hostinger (online)**.
- ✅ Koneksi MySQL sungguhan via PDO
- ✅ File tersimpan di folder `uploads/` + database
- ✅ Upload, Edit, Hapus, Lihat, Download berfungsi penuh
- ✅ Validasi ukuran file: **Dokumen max 3 MB**, **Gambar max 100 KB**
- ✅ Sistem login dengan session
- ✅ Keamanan: prepared statements, proteksi folder uploads, session timeout

👉 **Buka [`php-app/README.md`](php-app/README.md)** untuk panduan lengkap instalasi XAMPP & Hostinger.

### 2️⃣ `src/` + `dist/` — VERSI DEMO (preview tampilan)
Aplikasi React yang menampilkan tampilan & alur kerja aplikasi. Data disimpan di browser (localStorage) sebagai simulasi. Hanya untuk preview, **bukan untuk produksi**.

---

## 🔐 Akun Default (berlaku untuk kedua versi)

| Role | Username | Password | Hak Akses |
|------|----------|----------|-----------|
| **Admin** (Feri Kurniawan, M.Pd.) | `burnitelong` | `10105158` | Upload, Edit, Hapus, Lihat, Download (semua file) |
| **Guru** | `gurusabuk` | `10105158` | Hanya Lihat & Download |

---

## 🚀 Cara Memulai (Ringkasan Cepat)

### Untuk XAMPP (lokal):
1. Copy folder `php-app/` ke `C:\xampp\htdocs\arsip-kurikulum\`
2. Buka phpMyAdmin → buat database `arsip_kurikulum`
3. Import file `php-app/database.sql`
4. Buka browser: `http://localhost/arsip-kurikulum/setup_passwords.php` (untuk generate hash password)
5. **HAPUS** `setup_passwords.php` setelah berhasil
6. Login di `http://localhost/arsip-kurikulum/`

### Untuk Hostinger (online):
1. Buat database MySQL di hPanel
2. Import `database.sql` via phpMyAdmin Hostinger
3. Edit `config.php` dengan kredensial database Hostinger
4. Upload semua file via File Manager / FTP ke `public_html/`
5. Set permission folder `uploads/` ke 755
6. Jalankan `setup_passwords.php` sekali, lalu hapus
7. Login di `https://domainanda.com/`

📖 **Panduan detail ada di [`php-app/README.md`](php-app/README.md)**

---

## 📁 Struktur Folder

```
├── php-app/                 ← VERSI PHP/MySQL untuk deploy (PAKAI INI!)
│   ├── README.md            ← Panduan instalasi lengkap
│   ├── database.sql         ← Schema & data awal database
│   ├── setup_passwords.php  ← Jalankan sekali untuk setup password
│   ├── config.php           ← Konfigurasi database
│   ├── index.php            ← Halaman login
│   ├── dashboard.php        ← Halaman utama aplikasi
│   ├── api.php              ← AJAX endpoints (upload/edit/delete)
│   ├── download.php         ← Download file asli
│   ├── logout.php
│   ├── .htaccess            ← Proteksi keamanan root
│   ├── assets/style.css     ← Styling aplikasi
│   └── uploads/             ← Folder penyimpanan file
│       └── .htaccess        ← Cegah eksekusi PHP di folder uploads
│
├── src/                     ← Source React (demo preview)
├── dist/                    ← Build React (demo preview)
└── README.md                ← File ini
```

## ⚙️ Spesifikasi Teknis

- **Backend:** PHP 7.4+ (direkomendasikan PHP 8.x)
- **Database:** MySQL 5.7+ / MariaDB 10.3+
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript
- **Keamanan:** PDO prepared statements, password_hash BCRYPT, proteksi folder uploads
- **Limit Upload:** Dokumen 3 MB, Gambar 100 KB (divalidasi sisi server)

## 🆘 Troubleshooting Umum

**"Koneksi database gagal"** → Periksa `config.php`, pastikan nama database, user, password benar.

**"Gagal upload, permission denied"** → Set folder `uploads/` ke permission 755.

**"Tidak bisa login"** → Pastikan sudah jalankan `setup_passwords.php` setelah import database.

**Upload gagal meski file kecil** → Cek `php.ini`: `upload_max_filesize` dan `post_max_size` minimal 5M.

---

**Dibuat untuk Wakil Kepala Sekolah Bidang Kurikulum** · Versi 1.0 · 2026
