# 📚 Aplikasi Arsip Kurikulum

Aplikasi arsip file untuk Wakil Kepala Sekolah Bidang Kurikulum. Mendukung upload SK, dokumen program, dan foto dokumentasi, tersusun rapi berdasarkan tahun ajaran.

## ✨ Fitur

- 🔐 Autentikasi dengan 2 role: **Admin** dan **Guru**
- 📤 Upload file: **PDF, Word (.doc/.docx), Excel (.xls/.xlsx), Gambar (JPG/PNG)**
- 📏 Validasi ukuran file: dokumen max **3 MB**, gambar max **100 KB**
- 📅 Pengelompokan otomatis berdasarkan **Tahun Ajaran** dan **Semester**
- 🏷 Kategori: **SK, Program, Foto, Lainnya**
- 👁 Preview / Lihat detail arsip
- ⬇ Download file asli
- ✏ Edit metadata (judul, kategori, tahun, semester, keterangan)
- 🗑 Hapus arsip
- 🔎 Pencarian dan filter (tahun ajaran, semester, kategori)
- 📊 Statistik arsip per kategori

## 👥 Akun Default

| Role | Username | Password |
|------|----------|----------|
| Admin | `burnitelong` (Feri Kurniawan, M.Pd.) | `10105158` |
| Guru | `gurusabuk` | `10105158` |

**Hak Akses:**
- **Admin:** Upload, Edit, Hapus, Lihat, Download (semua file)
- **Guru:** Hanya Lihat dan Download

---

## 🛠 Instalasi di XAMPP (Lokal)

### 1. Persiapan XAMPP
1. Unduh & instal [XAMPP](https://www.apachefriends.org/)
2. Jalankan **Apache** dan **MySQL** dari XAMPP Control Panel

### 2. Copy File Aplikasi
1. Copy seluruh isi folder `php-app/` ke folder:
   ```
   C:\xampp\htdocs\arsip-kurikulum\
   ```
2. Akses di browser: `http://localhost/arsip-kurikulum/`

### 3. Buat Database
1. Buka **phpMyAdmin**: `http://localhost/phpmyadmin/`
2. Klik tab **"New"** / **"Baru"**
3. Nama database: `arsip_kurikulum`
4. Collation: `utf8mb4_general_ci`
5. Klik **Create**

### 4. Import Database
1. Pilih database `arsip_kurikulum` di panel kiri
2. Klik tab **"Import"**
3. Klik **"Choose File"**, pilih file `database.sql` dari folder aplikasi
4. Klik **Go** / **Kirim**
5. Tunggu hingga muncul pesan sukses. Tabel yang dibuat:
   - `users` (2 akun default)
   - `arsip` (tabel data arsip)
   - `tahun_ajaran` (daftar tahun ajaran)

### 5. Konfigurasi Koneksi Database
Edit file `config.php`, sesuaikan jika perlu:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'arsip_kurikulum');
define('DB_USER', 'root');
define('DB_PASS', ''); // default XAMPP kosong
```

### 6. Selesai! 🎉
Akses `http://localhost/arsip-kurikulum/` dan login dengan akun default.

---

## ☁️ Upload ke Hostinger

### 1. Persiapan di Hostinger
1. Login ke **hPanel Hostinger**
2. Buka menu **"Databases"** → **"Management"**
3. Klik **"Create MySQL Database"**:
   - Nama database (contoh): `u123456789_arsip`
   - Username: `u123456789_admin`
   - Password: (buat password kuat)
4. Catat ketiga informasi tersebut

### 2. Import Database
1. Di hPanel, klik **"phpMyAdmin"** pada database yang baru dibuat
2. Pilih database → tab **"Import"**
3. Upload file `database.sql`
4. Klik **Go**

### 3. Upload File Aplikasi
Gunakan **File Manager** atau **FTP**:

**Via File Manager (mudah):**
1. hPanel → **"File Manager"**
2. Masuk ke folder `public_html/`
3. Upload semua file dari folder `php-app/`:
   - `index.php`, `dashboard.php`, `config.php`, `api.php`, `download.php`, `logout.php`
   - Folder `assets/`
   - File `.htaccess`

**Via FTP (FileZilla):**
1. Host: `ftpupload.net` atau sesuai Hostinger
2. Username & password dari hPanel → **"FTP Accounts"**
3. Upload semua file ke `public_html/`

### 4. Edit config.php untuk Hostinger
Edit `config.php` dengan kredensial database Hostinger:
```php
define('DB_HOST', 'localhost'); // tetap localhost di Hostinger
define('DB_NAME', 'u123456789_arsip');     // ganti dengan nama DB Anda
define('DB_USER', 'u123456789_admin');     // ganti dengan user Anda
define('DB_PASS', 'passwordAndaDiSini');   // ganti dengan password DB
```

### 5. Atur Permission Folder Uploads
Via File Manager atau FTP:
1. Pastikan folder `uploads/` sudah ada (jika belum, buat manual)
2. Set permission folder `uploads/` ke **755**
3. File `.htaccess` di dalam `uploads/` akan mencegah eksekusi PHP (keamanan)

### 6. Selesai! 🎉
Akses: `https://domainanda.com/`

---

## 🔒 Keamanan

- 🔒 Password **disimpan dalam bentuk hash** (password_hash BCRYPT)
- Session timeout: 2 jam tidak aktif otomatis logout
- Folder `uploads/` dilindungi `.htaccess` — file PHP tidak bisa dieksekusi
- Validasi ukuran file di sisi server (double-check)
- Validasi tipe file via MIME dan ekstensi
- SQL Injection dicegah dengan **prepared statements** (PDO)
- 💾 **Backup & Restore**: Admin bisa backup semua metadata ke JSON dan restore kapan saja

## ⚙️ Troubleshooting

**Error: "Koneksi database gagal"**
- Pastikan nama database, user, password di `config.php` sudah benar
- Untuk XAMPP: user default `root`, password kosong
- Untuk Hostinger: gunakan nama database lengkap dengan prefix (`u123456789_`)

**Error: "Gagal upload, periksa permission folder"**
- Permission folder `uploads/` harus 755
- Pastikan folder `uploads/` ada di root aplikasi

**Upload gambar gagal meski ukuran < 100 KB**
- Periksa `php.ini` → `upload_max_filesize` dan `post_max_size` minimal 5M
- Di Hostinger: ubah via **"PHP Configuration"** di hPanel

**Tidak bisa login**
- Pastikan sudah import `database.sql`
- Cek tabel `users` di phpMyAdmin, pastikan ada 2 baris

## 💾 Backup & Restore

Fitur backup & restore tersedia untuk admin guna menjaga keamanan data.

### Cara Backup:
1. Login sebagai admin
2. Klik tombol **" Backup & Restore"** di toolbar
3. Klik **" Download Backup (.json)"** — file akan otomatis terdownload
4. Simpan file backup di tempat aman (komputer + cloud)
5. **Penting**: Backup folder `uploads/` secara terpisah untuk file fisik (PDF, gambar)

### Cara Restore:
1. Login sebagai admin
2. Klik tombol **" Backup & Restore"**
3. Di bagian "Restore Data", pilih file backup (.json)
4. Klik **" Restore Sekarang"**
5. Konfirmasi — data akan diganti dengan isi file backup

### Catatan Penting:
- Backup JSON berisi **metadata** (nama file, ukuran, keterangan) — **bukan file fisik**
- Untuk backup lengkap: salin juga folder `uploads/` ke tempat aman
- Disarankan backup rutin setiap bulan atau sebelum perubahan besar
- File backup disimpan juga di folder `backups/` (tidak bisa diakses dari web)
- Restore menghapus semua data lama lalu import data dari backup

---

## 📁 Struktur File

```
php-app/
├── index.php          # Halaman login
├── login_process.php  # Proses login (otomatis di-include)
├── dashboard.php      # Halaman utama aplikasi
├── api.php            # Endpoint AJAX (upload/edit/delete)
├── download.php       # Download file asli
├── logout.php         # Logout
├── config.php         # Konfigurasi database
├── database.sql       # Skema & data awal database
├── .htaccess          # Proteksi keamanan
├── assets/
│   └── style.css      # Styling aplikasi
└── uploads/           # Folder penyimpanan file (auto-created)
    └── .htaccess      # Cegah eksekusi PHP
```

## 📝 Catatan Penting

- File yang diupload akan disimpan di folder `uploads/` dengan nama unik untuk mencegah konflik
- Data metadata disimpan di MySQL, file fisik di `uploads/`
- Backup rutin disarankan: export database + folder `uploads/`
- Untuk menambah tahun ajaran baru, edit tabel `tahun_ajaran` di phpMyAdmin atau modifikasi dashboard

---

**Dibuat untuk Wakil Kepala Sekolah Bidang Kurikulum**
**Versi 1.0 — 2026**
