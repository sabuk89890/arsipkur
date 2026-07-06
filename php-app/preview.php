<?php
/**
 * preview.php - Preview dokumen secara inline (bukan download)
 * Untuk: PDF, Gambar (langsung), Word/Excel (Google Docs Viewer fallback)
 */
require_once __DIR__ . '/config.php';
requireLogin();

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    die("ID tidak valid.");
}

// Coba tabel baru dulu
$stmt = $pdo->prepare("SELECT * FROM file_arsip WHERE id = ?");
$stmt->execute([$id]);
$file = $stmt->fetch();

if (!$file) {
    // Fallback ke struktur lama
    $stmt = $pdo->prepare("SELECT * FROM arsip WHERE id = ?");
    $stmt->execute([$id]);
    $file = $stmt->fetch();
}

if (!$file) {
    http_response_code(404);
    die("File tidak ditemukan.");
}

$filepath = UPLOAD_DIR . $file['nama_file_simpan'];
if (!file_exists($filepath)) {
    http_response_code(404);
    die("File fisik tidak ditemukan.");
}

// Untuk PDF dan gambar: serve langsung dengan inline disposition
if ($file['tipe_file'] === 'pdf' || $file['tipe_file'] === 'image') {
    $mimeMap = [
        'pdf'   => 'application/pdf',
        'image' => 'image/jpeg', // fallback
    ];
    $mime = $mimeMap[$file['tipe_file']];
    if ($file['tipe_file'] === 'image') {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($filepath);
    }

    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($file['nama_file_asli']) . '"');
    header('Content-Length: ' . filesize($filepath));
    header('Cache-Control: public, max-age=3600');

    readfile($filepath);
    exit;
}

// Untuk Word/Excel: redirect ke Google Docs Viewer
// Google Docs Viewer butuh URL publik yang bisa diakses internet
if ($file['tipe_file'] === 'doc' || $file['tipe_file'] === 'docx' || $file['tipe_file'] === 'xls' || $file['tipe_file'] === 'xlsx') {
    // Buat URL publik untuk file ini
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    $publicUrl = $protocol . '://' . $host . $scriptDir . '/uploads/' . $file['nama_file_simpan'];

    // Cek apakah URL ini bisa diakses publik (bukan localhost)
    if (preg_match('/localhost|127\.0\.0\.1|192\.168\.|10\./', $host)) {
        // Localhost - Google Docs Viewer tidak bisa akses, tampilkan pesan
        header('Content-Type: text/html; charset=utf-8');
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head><meta charset="UTF-8"><title>Preview Tidak Tersedia</title>
        <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px; }
            h1 { font-size: 3rem; margin: 0 0 1rem; }
            h2 { font-size: 1.1rem; color: #334155; margin: 0 0 0.5rem; }
            p { color: #64748b; font-size: 0.9rem; margin: 0 0 1.5rem; }
            a { background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block; }
            a:hover { background: #1d4ed8; }
        </style></head>
        <body>
            <div class="card">
                <h1>📄</h1>
                <h2>Preview Word/Excel Tidak Tersedia di Localhost</h2>
                <p>Google Docs Viewer membutuhkan URL publik. Di XAMPP/localhost, silakan download file untuk membukanya di Word/Excel/WPS Office.</p>
                <a href="download.php?id=<?= $file['id'] ?>">⬇ Download File</a>
            </div>
        </body>
        </html>
        <?php
        exit;
    }

    // Publik - redirect ke Google Docs Viewer
    header('Location: https://docs.google.com/gview?url=' . urlencode($publicUrl) . '&embedded=true');
    exit;
}

// Fallback
http_response_code(415);
die("Tipe file tidak dapat di-preview.");
