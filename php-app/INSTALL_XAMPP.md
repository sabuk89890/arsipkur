#  PANDUAN INSTALASI - XAMPP (LOCALHOST)

Panduan lengkap instalasi Aplikasi Arsip Kurikulum SMP Negeri 1 Bukit di XAMPP.

---

## 📋 PERSYARATAN

- Windows 10/11 (atau Mac/Linux)
- XAMPP versi 7.4 atau lebih baru (direkomendasikan 8.x)
- Browser modern (Chrome, Firefox, Edge)

---

## 🛠 LANGKAH 1: INSTAL XAMPP

1. Download XAMPP dari: https://www.apachefriends.org/
2. Jalankan installer
3. Pilih komponen: **Apache** dan **MySQL** (sudah default)
4. Install di `C:\xampp` (default)
5. Setelah install, buka **XAMPP Control Panel**
6. Klik **Start** pada **Apache** dan **MySQL**
7. Pastikan kedua service berwarna **hijau** (running)

---

## 📁 LANGKAH 2: COPY FILE APLIKASI

1. Buka folder `C:\xampp\htdocs\`
2. Buat folder baru: `arsip-kurikulum`
3. **Copy SEMUA isi folder `php-app/`** ke dalam `C:\xampp\htdocs\arsip-kurikulum\`

Struktur folder harus seperti ini:
```
C:\xampp\htdocs\arsip-kurikulum\
├── index.php
├── dashboard.php
├── api.php
├── download.php
├── preview.php
├── logout.php
├── config.php
├── database.sql
├── setup_passwords.php
├── .htaccess
├── README.md
├── INSTALL_XAMPP.md
├── assets/
│   └── style.css
├── uploads/
│   └── .htaccess
── backups/
    └── .htaccess
```

---

## 🗄 LANGKAH 3: BUAT DATABASE

1. Buka browser, akses: **http://localhost/phpmyadmin/**
2. Klik tab **"New"** atau **"Baru"** di sidebar kiri
3. Isi:
   - **Database name**: `arsip_kurikulum`
   - **Collation**: `utf8mb4_general_ci`
4. Klik **"Create"** atau **"Buat"**

---

## 📥 LANGKAH 4: IMPORT DATABASE

1. Di phpMyAdmin, klik database `arsip_kurikulum` di sidebar kiri
2. Klik tab **"Import"** di menu atas
3. Klik **"Choose File"** atau **"Pilih File"**
4. Pilih file: `C:\xampp\htdocs\arsip-kurikulum\database.sql`
5. Scroll ke bawah, klik **"Go"** atau **"Kirim"**
6. Tunggu hingga muncul pesan: **"Import has been successfully finished"**

Tabel yang dibuat:
- `users` (2 akun)
- `kategori` (6 kategori default)
- `tahun_ajaran` (4 tahun ajaran)
- `program` (kosong - akan diisi via aplikasi)
- `file_arsip` (kosong - akan diisi via aplikasi)

---

## 🔐 LANGKAH 5: SETUP PASSWORD

1. Buka browser, akses: **http://localhost/arsip-kurikulum/setup_passwords.php**
2. Anda akan melihat halaman setup dengan peringatan
3. Klik tombol **"Generate Password Hash"**
4. Tunggu hingga muncul pesan **"Berhasil!"**
5. **PENTING: HAPUS file `setup_passwords.php`** dari folder `C:\xampp\htdocs\arsip-kurikulum\`

   Cara hapus:
   - Buka File Explorer
   - Navigasi ke `C:\xampp\htdocs\arsip-kurikulum\`
   - Klik kanan `setup_passwords.php` → **Delete**
   - Atau rename jadi `setup_passwords.php.bak`

---

## ✅ LANGKAH 6: LOGIN & TEST

1. Buka browser, akses: **http://localhost/arsip-kurikulum/**
2. Anda akan diarahkan ke halaman login
3. Login dengan akun:

   **Admin:**
   - Username: `burnitelong`
   - Password: `10105158`

   **Guru:**
   - Username: `gurusabuk`
   - Password: `10105158`

4. Setelah login, Anda akan masuk ke Dashboard

---

## 🧪 LANGKAH 7: TEST FITUR

### Test sebagai Admin:
1. Klik **"+ Program Baru"** → Buat program "Test Program"
2. Klik **"+ Upload File"** → Upload file PDF/gambar ke program
3. Klik **"Kelola Kategori"** → Tambah kategori baru
4. Klik **"Kelola Tahun Ajaran"** → Tambah tahun ajaran baru
5. Klik **"Backup & Restore"** → Download backup
6. Coba preview, download, edit, hapus

### Test sebagai Guru:
1. Logout dari admin
2. Login sebagai `gurusabuk`
3. Pastikan hanya bisa **Lihat** dan **Download** (tidak ada tombol Edit/Hapus/Upload)

---

##  TROUBLESHOOTING

###  Error: "Koneksi database gagal"

**Penyebab:** Database belum dibuat atau config.php salah

**Solusi:**
1. Pastikan MySQL running di XAMPP Control Panel
2. Buka `C:\xampp\htdocs\arsip-kurikulum\config.php`
3. Periksa:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'arsip_kurikulum');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```
4. Pastikan database `arsip_kurikulum` sudah dibuat di phpMyAdmin

---

### ❌ Error: "Table doesn't exist"

**Penyebab:** database.sql belum diimport

**Solusi:**
1. Buka phpMyAdmin: http://localhost/phpmyadmin/
2. Pilih database `arsip_kurikulum`
3. Import file `database.sql`

---

### ❌ Error: "Gagal upload, periksa permission folder"

**Penyebab:** Folder `uploads/` tidak ada atau permission salah

**Solusi:**
1. Buka File Explorer
2. Navigasi ke `C:\xampp\htdocs\arsip-kurikulum\`
3. Pastikan folder `uploads/` ada
4. Jika belum ada, buat folder baru bernama `uploads`
5. Klik kanan folder `uploads` → Properties → Security → Edit
6. Pastikan user memiliki **Full Control** atau **Write** permission

---

### ❌ Error: "Password salah" saat login

**Penyebab:** setup_passwords.php belum dijalankan atau sudah dihapus sebelum generate hash

**Solusi:**
1. Copy ulang file `setup_passwords.php` dari folder `php-app/`
2. Paste ke `C:\xampp\htdocs\arsip-kurikulum\`
3. Akses: http://localhost/arsip-kurikulum/setup_passwords.php
4. Klik "Generate Password Hash"
5. Hapus file setelah berhasil

---

### ❌ Upload gambar gagal meski ukuran < 100KB

**Penyebab:** php.ini limit terlalu kecil

**Solusi:**
1. Buka `C:\xampp\php\php.ini`
2. Cari dan ubah:
   ```ini
   upload_max_filesize = 10M
   post_max_size = 12M
   ```
3. Restart Apache di XAMPP Control Panel

---

### ❌ Halaman putih / blank page

**Penyebab:** Error PHP tidak tampil

**Solusi:**
1. Buka `C:\xampp\htdocs\arsip-kurikulum\config.php`
2. Tambahkan di baris paling atas (setelah `<?php`):
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```
3. Refresh halaman - error akan muncul
4. Perbaiki error sesuai pesan
5. Hapus 2 baris tersebut setelah selesai debugging

---

## 📝 CATATAN PENTING

1. **Jangan hapus folder `uploads/`** - ini tempat menyimpan file yang diupload
2. **Jangan hapus folder `backups/`** - ini tempat menyimpan backup otomatis
3. **Backup rutin** - gunakan fitur Backup & Restore di aplikasi
4. **File fisik** - backup juga folder `uploads/` ke tempat lain (flashdisk/cloud)
5. **Password** - jika lupa password admin, bisa reset via phpMyAdmin

---

## 🔒 KEAMANAN

Setelah instalasi berhasil:

1. ✅ Hapus `setup_passwords.php`
2. ✅ Folder `uploads/` dilindungi `.htaccess` (tidak bisa execute PHP)
3. ✅ Folder `backups/` dilindungi `.htaccess` (tidak bisa diakses dari web)
4. ✅ Password di-hash dengan BCRYPT
5. ✅ Session timeout 2 jam
6. ✅ SQL Injection dicegah dengan prepared statements

---

## 📞 BANTUAN

Jika masih ada masalah:

1. Periksa **Apache error log**: `C:\xampp\apache\logs\error.log`
2. Periksa **PHP error log**: `C:\xampp\php\logs\php_error_log`
3. Buka browser **Developer Tools** (F12) → tab **Console** untuk error JavaScript

---

**Selamat! Aplikasi Arsip Kurikulum SMP Negeri 1 Bukit siap digunakan!** 🎉

Versi 1.0 - 2026
