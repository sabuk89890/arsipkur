<?php
/**
 * download.php - Download file
 * ?id=X         = download satu file
 * ?program_id=X&all=1 = download semua file dalam program (sebagai zip atau redirect)
 */
require_once __DIR__ . '/config.php';
requireLogin();

// Download semua file dalam program (sederhana: redirect ke file pertama, atau buat zip)
if (isset($_GET['program_id']) && isset($_GET['all'])) {
    $pid = (int)$_GET['program_id'];
    $stmt = $pdo->prepare("SELECT * FROM file_arsip WHERE program_id = ? ORDER BY tanggal_upload ASC");
    $stmt->execute([$pid]);
    $files = $stmt->fetchAll();
    if (empty($files)) die("Tidak ada file.");

    // Jika cuma 1 file, langsung download
    if (count($files) === 1) {
        header("Location: download.php?id=" . $files[0]['id']);
        exit;
    }

    // Untuk multiple files: buat zip on-the-fly (butuh ekstensi zip)
    if (!extension_loaded('zip')) {
        // Fallback: tampilkan daftar file untuk didownload satu per satu
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Download Semua</title>';
        echo '<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:1rem}a{display:block;padding:0.75rem 1rem;margin:0.5rem 0;background:#f1f5f9;border-radius:0.5rem;text-decoration:none;color:#0f172a}a:hover{background:#e2e8f0}</style></head><body>';
        echo '<h2>Download Semua File</h2><p>Klik file untuk mendownload:</p>';
        foreach ($files as $f) {
            echo '<a href="download.php?id=' . $f['id'] . '">📎 ' . htmlspecialchars($f['nama_file_asli']) . ' (' . formatBytes($f['ukuran']) . ')</a>';
        }
        echo '<p style="margin-top:2rem"><a href="dashboard.php">← Kembali ke Dashboard</a></p></body></html>';
        exit;
    }

    // Buat ZIP
    $zip = new ZipArchive();
    $tmpFile = tempnam(sys_get_temp_dir(), 'zip');
    if ($zip->open($tmpFile, ZipArchive::CREATE) !== TRUE) die("Gagal membuat zip.");

    $usedNames = [];
    foreach ($files as $f) {
        $filepath = UPLOAD_DIR . $f['nama_file_simpan'];
        if (!file_exists($filepath)) continue;
        $name = $f['nama_file_asli'];
        if (in_array($name, $usedNames)) {
            $ext = pathinfo($name, PATHINFO_EXTENSION);
            $base = pathinfo($name, PATHINFO_FILENAME);
            $name = $base . '_' . substr(md5($f['nama_file_simpan']), 0, 4) . ($ext ? '.' . $ext : '');
        }
        $usedNames[] = $name;
        $zip->addFile($filepath, $name);
    }
    $zip->close();

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="arsip_program_' . $pid . '.zip"');
    header('Content-Length: ' . filesize($tmpFile));
    readfile($tmpFile);
    @unlink($tmpFile);
    exit;
}

// Download satu file
$id = (int)($_GET['id'] ?? 0);
if (!$id) die("ID tidak valid.");

// Coba cari di file_arsip (struktur baru)
$stmt = $pdo->prepare("SELECT * FROM file_arsip WHERE id = ?");
$stmt->execute([$id]);
$file = $stmt->fetch();

if (!$file) {
    // Fallback ke struktur lama (jika ada)
    $stmt = $pdo->prepare("SELECT * FROM arsip WHERE id = ?");
    $stmt->execute([$id]);
    $file = $stmt->fetch();
}

if (!$file) die("File tidak ditemukan.");

$filepath = UPLOAD_DIR . ($file['nama_file_simpan'] ?? $file['nama_file_simpan']);
if (!file_exists($filepath)) die("File fisik tidak ditemukan.");

$mimeMap = ['pdf'=>'application/pdf','doc'=>'application/msword','docx'=>'application/vnd.openxmlformats-officedocument.wordprocessingml.document','xls'=>'application/vnd.ms-excel','xlsx'=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image'=>'application/octet-stream'];
$mime = $mimeMap[$file['tipe_file']] ?? 'application/octet-stream';
if ($file['tipe_file'] === 'image') {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($filepath);
}

header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . basename($file['nama_file_asli']) . '"');
header('Content-Length: ' . filesize($filepath));
ob_clean(); flush(); readfile($filepath);
exit;
