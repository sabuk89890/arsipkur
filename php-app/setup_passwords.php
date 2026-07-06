<?php
/**
 * setup_passwords.php
 * Script untuk generate hash password dan update ke database.
 *
 * CARA PAKAI:
 * 1. Import database.sql ke phpMyAdmin
 * 2. Buka file ini di browser: http://localhost/arsip-kurikulum/setup_passwords.php
 * 3. Klik tombol "Generate Password"
 * 4. HAPUS file ini setelah berhasil!
 *
 * PENTING: File ini harus dihapus setelah digunakan demi keamanan!
 */

// Cek apakah sudah di-hash
require_once __DIR__ . '/config.php';

try {
    $stmt = $pdo->query("SELECT username, password FROM users");
    $users = $stmt->fetchAll();

    $allHashed = true;
    foreach ($users as $u) {
        if (!password_get_info($u['password'])['algo']) {
            $allHashed = false;
            break;
        }
    }

    if ($allHashed && count($users) > 0) {
        echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Sudah Tersetup</title>";
        echo "<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:3rem auto;padding:2rem;background:#f0fdf4;border-radius:1rem}h1{color:#16a34a}code{background:#f1f5f9;padding:0.25rem 0.5rem;border-radius:0.25rem}</style></head><body>";
        echo "<h1> Password Sudah Ter-setup!</h1>";
        echo "<p>Semua password sudah dalam bentuk hash yang aman.</p>";
        echo "<p>Anda bisa login dengan:</p>";
        echo "<ul><li>Admin: <code>burnitelong</code> / <code>10105158</code></li>";
        echo "<li>Guru: <code>gurusabuk</code> / <code>10105158</code></li></ul>";
        echo "<p style='color:#dc2626;margin-top:2rem'><b>HAPUS file ini (setup_passwords.php) untuk keamanan!</b></p>";
        echo "</body></html>";
        exit;
    }

    // Generate hash
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm'])) {
        $password = '10105158';
        $hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare("UPDATE users SET password = ?");
        $stmt->execute([$hash]);

        echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Berhasil!</title>";
        echo "<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:3rem auto;padding:2rem;background:#f0fdf4;border-radius:1rem}h1{color:#16a34a}code{background:#f1f5f9;padding:0.25rem 0.5rem;border-radius:0.25rem}.box{background:white;padding:1rem;border-radius:0.5rem;margin:1rem 0}</style></head><body>";
        echo "<h1> Berhasil!</h1>";
        echo "<div class='box'>";
        echo "<p>Password untuk semua akun telah diupdate menjadi hash BCRYPT.</p>";
        echo "<p><b>Hash:</b> <code style='word-break:break-all'>" . htmlspecialchars($hash) . "</code></p>";
        echo "</div>";
        echo "<p>Anda sekarang bisa login dengan:</p>";
        echo "<ul><li>Admin (Feri Kurniawan, M.Pd.): <code>burnitelong</code> / <code>10105158</code></li>";
        echo "<li>Guru: <code>gurusabuk</code> / <code>10105158</code></li></ul>";
        echo "<p style='color:#dc2626;margin-top:2rem;padding:1rem;background:#fee2e2;border-radius:0.5rem'><b>PENTING: HAPUS file setup_passwords.php SEKARANG JUGA!</b></p>";
        echo "</body></html>";
        exit;
    }

} catch (Exception $e) {
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Error</title>";
    echo "<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:3rem auto;padding:2rem;background:#fee2e2;border-radius:1rem}h1{color:#dc2626}</style></head><body>";
    echo "<h1> Error!</h1>";
    echo "<p><b>" . htmlspecialchars($e->getMessage()) . "</b></p>";
    echo "<p>Pastikan:</p><ul><li>MySQL sudah berjalan di XAMPP</li><li>Database <code>arsip_kurikulum</code> sudah dibuat</li><li>File <code>database.sql</code> sudah diimport</li><li>Koneksi di <code>config.php</code> sudah benar</li></ul>";
    echo "</body></html>";
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Setup Password - Arsip Kurikulum</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 3rem auto; padding: 2rem; background: #fef3c7; border-radius: 1rem; }
        h1 { color: #d97706; }
        .btn { background: #d97706; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; font-weight: 600; }
        .btn:hover { background: #b45309; }
        .warning { background: #fee2e2; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; color: #991b1b; }
        code { background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
        ul { background: white; padding: 1rem 2rem; border-radius: 0.5rem; }
    </style>
</head>
<body>
    <h1> Setup Password Database</h1>

    <div class="warning">
        <b>Peringatan:</b> File ini hanya untuk setup awal. <b>HAPUS setelah berhasil!</b>
    </div>

    <p>Script ini akan mengupdate password semua akun di database menjadi hash BCRYPT yang aman.</p>

    <p><b>Akun yang akan diupdate:</b></p>
    <ul>
        <li><code>burnitelong</code> (Feri Kurniawan, M.Pd.) - Admin</li>
        <li><code>gurusabuk</code> - Guru</li>
    </ul>

    <p><b>Password untuk kedua akun:</b> <code>10105158</code></p>

    <form method="POST">
        <input type="hidden" name="confirm" value="1">
        <button type="submit" class="btn"> Generate Password Hash</button>
    </form>

    <p style="margin-top:2rem;color:#64748b;font-size:0.875rem">Setelah berhasil, Anda bisa login di <a href="index.php">index.php</a></p>
</body>
</html>
