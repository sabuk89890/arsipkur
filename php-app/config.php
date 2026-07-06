<?php
/**
 * config.php - Konfigurasi Database & Aplikasi
 *
 * Untuk XAMPP (lokal):
 *   DB_HOST = localhost, DB_USER = root, DB_PASS = ''
 *
 * Untuk Hostinger:
 *   Ganti DB_NAME, DB_USER, DB_PASS dengan informasi dari hPanel → Databases
 */

// =======================================================
// KONFIGURASI DATABASE — SESUAIKAN DENGAN LINGKUNGAN ANDA
// =======================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'arsip_kurikulum');
define('DB_USER', 'root');
define('DB_PASS', '');

// =======================================================
// KONFIGURASI APLIKASI
// =======================================================
define('APP_NAME', 'Arsip Kurikulum');
define('MAX_DOC_SIZE', 3 * 1024 * 1024);      // 3 MB untuk PDF, Word, Excel
define('MAX_IMG_SIZE', 100 * 1024);            // 100 KB untuk gambar
define('SESSION_LIFETIME', 7200);              // 2 jam
define('UPLOAD_DIR', __DIR__ . '/uploads/');

// =======================================================
// KONEKSI DATABASE (PDO)
// =======================================================
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    die("❌ Koneksi database gagal: " . htmlspecialchars($e->getMessage()) .
        "<br><br>Pastikan:<br>1. MySQL sudah berjalan<br>2. Database '" . DB_NAME . "' sudah dibuat<br>3. Username & password di config.php sudah benar");
}

// =======================================================
// START SESSION DENGAN LIFETIME
// =======================================================
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
    session_set_cookie_params(SESSION_LIFETIME);
    session_start();
}

// Auto-logout jika sudah terlalu lama tidak aktif
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_LIFETIME)) {
    session_unset();
    session_destroy();
    header("Location: index.php?expired=1");
    exit;
}
$_SESSION['last_activity'] = time();

// =======================================================
// PASTIKAN FOLDER UPLOADS ADA
// =======================================================
if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}

// =======================================================
// HELPER FUNCTIONS
// =======================================================
function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: index.php");
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        die("Akses ditolak. Hanya admin yang dapat melakukan aksi ini.");
    }
}

function e($str) {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

function formatBytes($bytes) {
    if ($bytes < 1024) return $bytes . ' B';
    if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
    return round($bytes / 1048576, 2) . ' MB';
}

function getTipeFile($mime, $ext) {
    $map = [
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'image/jpeg' => 'image',
        'image/jpg' => 'image',
        'image/png' => 'image',
    ];
    if (isset($map[$mime])) return $map[$mime];
    // fallback via extension
    $ext = strtolower($ext);
    if (in_array($ext, ['pdf','doc','docx','xls','xlsx','jpg','jpeg','png'])) {
        return in_array($ext, ['jpg','jpeg','png']) ? 'image' : $ext;
    }
    return null;
}

function isAllowedFile($mime, $ext) {
    $allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
    ];
    if (!in_array($mime, $allowed)) return false;
    $extAllowed = ['pdf','doc','docx','xls','xlsx','jpg','jpeg','png'];
    return in_array(strtolower($ext), $extAllowed);
}
