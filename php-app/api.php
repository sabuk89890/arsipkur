<?php
/**
 * api.php - AJAX endpoints
 * Actions: program (create/update/delete), upload, delete_file,
 *          kategori (list/create/delete), tahun (list/create/toggle/delete)
 */
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        // ---- PROGRAM ----
        case 'program_files':  program_files(); break;
        case 'program_create': requireAdmin(); program_create(); break;
        case 'program_update': requireAdmin(); program_update(); break;
        case 'program_delete': requireAdmin(); program_delete(); break;

        // ---- FILE UPLOAD / DELETE ----
        case 'upload':         requireAdmin(); upload_file(); break;
        case 'delete_file':    requireAdmin(); delete_file(); break;

        // ---- KATEGORI CRUD ----
        case 'kategori_list':  kategori_list(); break;
        case 'kategori_create': requireAdmin(); kategori_create(); break;
        case 'kategori_delete': requireAdmin(); kategori_delete(); break;

        // ---- TAHUN AJARAN CRUD ----
        case 'tahun_list':    tahun_list(); break;
        case 'tahun_create':  requireAdmin(); tahun_create(); break;
        case 'tahun_toggle':  requireAdmin(); tahun_toggle(); break;
        case 'tahun_delete':  requireAdmin(); tahun_delete(); break;

        // ---- BACKUP & RESTORE ----
        case 'backup':        requireAdmin(); do_backup(); break;
        case 'restore':       requireAdmin(); do_restore(); break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Action tidak valid.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// =======================================================
// PROGRAM
// =======================================================
function program_files() {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { echo json_encode(['success' => false, 'error' => 'ID tidak valid.']); return; }
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM file_arsip WHERE program_id = ? ORDER BY tanggal_upload ASC");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'files' => $stmt->fetchAll()]);
}

function program_create() {
    $judul      = trim($_POST['judul'] ?? '');
    $kategori   = (int)($_POST['kategori_id'] ?? 0);
    $tahun      = (int)($_POST['tahun_ajaran_id'] ?? 0);
    $semester   = $_POST['semester'] ?? '';
    $keterangan = trim($_POST['keterangan'] ?? '');

    if ($judul === '' || !$kategori || !$tahun) throw new Exception('Data tidak lengkap.');
    if (!in_array($semester, ['Ganjil', 'Genap'])) throw new Exception('Semester tidak valid.');

    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO program (judul, kategori_id, tahun_ajaran_id, semester, keterangan, created_by) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$judul, $kategori, $tahun, $semester, $keterangan, $_SESSION['username']]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}

function program_update() {
    $id         = (int)($_POST['id'] ?? 0);
    $judul      = trim($_POST['judul'] ?? '');
    $kategori   = (int)($_POST['kategori_id'] ?? 0);
    $tahun      = (int)($_POST['tahun_ajaran_id'] ?? 0);
    $semester   = $_POST['semester'] ?? '';
    $keterangan = trim($_POST['keterangan'] ?? '');

    if (!$id || $judul === '') throw new Exception('Data tidak lengkap.');

    global $pdo;
    $stmt = $pdo->prepare("UPDATE program SET judul=?, kategori_id=?, tahun_ajaran_id=?, semester=?, keterangan=? WHERE id=?");
    $stmt->execute([$judul, $kategori, $tahun, $semester, $keterangan, $id]);
    echo json_encode(['success' => true]);
}

function program_delete() {
    $id = (int)($_POST['id'] ?? 0);
    if (!$id) throw new Exception('ID tidak valid.');

    global $pdo;
    // Ambil semua file fisik dulu untuk dihapus
    $stmt = $pdo->prepare("SELECT nama_file_simpan FROM file_arsip WHERE program_id = ?");
    $stmt->execute([$id]);
    foreach ($stmt->fetchAll() as $row) {
        $path = UPLOAD_DIR . $row['nama_file_simpan'];
        if (file_exists($path)) @unlink($path);
    }
    $pdo->prepare("DELETE FROM program WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}

// =======================================================
// UPLOAD FILE KE PROGRAM
// =======================================================
function upload_file() {
    $program_id = (int)($_POST['program_id'] ?? 0);
    $keterangan = trim($_POST['keterangan'] ?? '');

    if (!$program_id) throw new Exception('Program tujuan tidak valid.');

    global $pdo;
    $cek = $pdo->prepare("SELECT id FROM program WHERE id = ?");
    $cek->execute([$program_id]);
    if (!$cek->fetch()) throw new Exception('Program tidak ditemukan.');

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File gagal diupload.');
    }

    $file = $_FILES['file'];
    $originalName = $file['name'];
    $tmpPath = $file['tmp_name'];
    $size = $file['size'];
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmpPath);

    if (!isAllowedFile($mime, $ext)) throw new Exception('Tipe file tidak didukung.');

    $tipe = getTipeFile($mime, $ext);
    if (!$tipe) throw new Exception('Tipe file tidak dikenali.');

    $isImage = ($tipe === 'image');
    $maxSize = $isImage ? MAX_IMG_SIZE : MAX_DOC_SIZE;
    if ($size > $maxSize) throw new Exception("Ukuran file melebihi batas " . ($isImage ? '100 KB' : '3 MB') . ".");

    $safeName = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = UPLOAD_DIR . $safeName;
    if (!move_uploaded_file($tmpPath, $dest)) throw new Exception('Gagal menyimpan file.');

    $stmt = $pdo->prepare("INSERT INTO file_arsip (program_id, nama_file_asli, nama_file_simpan, tipe_file, ukuran, keterangan, uploader) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$program_id, $originalName, $safeName, $tipe, $size, $keterangan, $_SESSION['username']]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}

function delete_file() {
    $id = (int)($_POST['id'] ?? 0);
    if (!$id) throw new Exception('ID file tidak valid.');

    global $pdo;
    $stmt = $pdo->prepare("SELECT nama_file_simpan FROM file_arsip WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) throw new Exception('File tidak ditemukan.');

    $path = UPLOAD_DIR . $row['nama_file_simpan'];
    if (file_exists($path)) @unlink($path);

    $pdo->prepare("DELETE FROM file_arsip WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}

// =======================================================
// KATEGORI
// =======================================================
function kategori_list() {
    global $pdo;
    $rows = $pdo->query("SELECT id, nama, warna, aktif FROM kategori ORDER BY nama ASC")->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
}

function kategori_create() {
    $nama  = trim($_POST['nama'] ?? '');
    $warna = $_POST['warna'] ?? 'blue';
    if ($nama === '') throw new Exception('Nama kategori wajib diisi.');
    if (!in_array($warna, ['blue','rose','emerald','amber','violet','slate'])) $warna = 'blue';

    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO kategori (nama, warna) VALUES (?, ?)");
    $stmt->execute([$nama, $warna]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}

function kategori_delete() {
    $id = (int)($_POST['id'] ?? 0);
    if (!$id) throw new Exception('ID tidak valid.');

    global $pdo;
    // Cek apakah ada program yang pakai kategori ini
    $cek = $pdo->prepare("SELECT COUNT(*) FROM program WHERE kategori_id = ?");
    $cek->execute([$id]);
    if ($cek->fetchColumn() > 0) throw new Exception('Tidak bisa hapus: masih ada program yang menggunakan kategori ini.');

    $pdo->prepare("DELETE FROM kategori WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}

// =======================================================
// TAHUN AJARAN
// =======================================================
function tahun_list() {
    global $pdo;
    $rows = $pdo->query("SELECT id, tahun, aktif FROM tahun_ajaran ORDER BY tahun DESC")->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
}

function tahun_create() {
    $tahun = trim($_POST['tahun'] ?? '');
    if (!preg_match('/^\d{4}\/\d{4}$/', $tahun)) throw new Exception('Format harus: 2024/2025');

    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO tahun_ajaran (tahun, aktif) VALUES (?, 1)");
    $stmt->execute([$tahun]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}

function tahun_toggle() {
    $id = (int)($_POST['id'] ?? 0);
    if (!$id) throw new Exception('ID tidak valid.');

    global $pdo;
    $pdo->prepare("UPDATE tahun_ajaran SET aktif = NOT aktif WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}

function tahun_delete() {
    $id = (int)($_POST['id'] ?? 0);
    if (!$id) throw new Exception('ID tidak valid.');

    global $pdo;
    $cek = $pdo->prepare("SELECT COUNT(*) FROM program WHERE tahun_ajaran_id = ?");
    $cek->execute([$id]);
    if ($cek->fetchColumn() > 0) throw new Exception('Tidak bisa hapus: masih ada program di tahun ajaran ini.');

    $pdo->prepare("DELETE FROM tahun_ajaran WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}

// =======================================================
// BACKUP & RESTORE
// =======================================================
function do_backup() {
    global $pdo;

    // Ambil semua data
    $kategori = $pdo->query("SELECT * FROM kategori ORDER BY nama")->fetchAll();
    $tahun = $pdo->query("SELECT * FROM tahun_ajaran ORDER BY tahun DESC")->fetchAll();
    $programs = $pdo->query("SELECT * FROM program ORDER BY tanggal_dibuat DESC")->fetchAll();

    // Ambil files per program
    $filesByProgram = [];
    $allFiles = $pdo->query("SELECT * FROM file_arsip ORDER BY program_id, tanggal_upload")->fetchAll();
    foreach ($allFiles as $f) {
        $filesByProgram[$f['program_id']][] = $f;
    }

    // Tambahkan files ke program
    foreach ($programs as &$p) {
        $p['files'] = $filesByProgram[$p['id']] ?? [];
    }

    $data = [
        'version' => '1.0',
        'school' => 'SMP Negeri 1 Bukit',
        'exportDate' => date('c'),
        'kategori' => $kategori,
        'tahunAjaran' => $tahun,
        'programs' => $programs,
    ];

    // Simpan ke folder backups/
    $backupDir = __DIR__ . '/backups/';
    if (!is_dir($backupDir)) @mkdir($backupDir, 0755, true);

    $filename = 'backup_' . date('Y-m-d_His') . '.json';
    $filepath = $backupDir . $filename;

    file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // Force download
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);

    // Hapus file setelah download (optional — biarkan di folder backups untuk cadangan)
    // @unlink($filepath);
    exit;
}

function do_restore() {
    if (!isset($_FILES['backup_file']) || $_FILES['backup_file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File backup tidak valid.');
    }

    $file = $_FILES['backup_file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext !== 'json') throw new Exception('Hanya file JSON yang didukung.');

    $content = file_get_contents($file['tmp_name']);
    $data = json_decode($content, true);

    if (!$data || !isset($data['version']) || !isset($data['programs'])) {
        throw new Exception('Format file backup tidak valid.');
    }

    global $pdo;
    $pdo->beginTransaction();

    try {
        // Hapus data lama (urutkan untuk hindari foreign key error)
        $pdo->exec("DELETE FROM file_arsip");
        $pdo->exec("DELETE FROM program");
        $pdo->exec("DELETE FROM kategori");
        $pdo->exec("DELETE FROM tahun_ajaran");

        // Import kategori
        if (!empty($data['kategori'])) {
            $stmt = $pdo->prepare("INSERT INTO kategori (nama, warna, aktif) VALUES (?, ?, 1)");
            foreach ($data['kategori'] as $k) {
                $stmt->execute([$k['nama'], $k['warna']]);
            }
        }

        // Import tahun ajaran
        if (!empty($data['tahunAjaran'])) {
            $stmt = $pdo->prepare("INSERT INTO tahun_ajaran (tahun, aktif) VALUES (?, ?)");
            foreach ($data['tahunAjaran'] as $t) {
                $stmt->execute([$t['tahun'], $t['aktif'] ?? 1]);
            }
        }

        // Import programs + files
        if (!empty($data['programs'])) {
            $progStmt = $pdo->prepare("INSERT INTO program (judul, kategori_id, tahun_ajaran_id, semester, keterangan, created_by, tanggal_dibuat) VALUES (?, (SELECT id FROM kategori WHERE nama=?), (SELECT id FROM tahun_ajaran WHERE tahun=?), ?, ?, ?, ?)");
            $fileStmt = $pdo->prepare("INSERT INTO file_arsip (program_id, nama_file_asli, nama_file_simpan, tipe_file, ukuran, keterangan, uploader) VALUES (?, ?, ?, ?, ?, ?, ?)");

            foreach ($data['programs'] as $p) {
                $katNama = '';
                foreach ($data['kategori'] as $k) {
                    if ($k['id'] == $p['kategori_id']) { $katNama = $k['nama']; break; }
                }
                $tahunTeks = '';
                foreach ($data['tahunAjaran'] as $t) {
                    if ($t['id'] == $p['tahun_ajaran_id']) { $tahunTeks = $t['tahun']; break; }
                }

                $progStmt->execute([
                    $p['judul'],
                    $katNama,
                    $tahunTeks,
                    $p['semester'],
                    $p['keterangan'] ?? null,
                    $p['created_by'] ?? 'admin',
                    $p['tanggal_dibuat'] ?? date('Y-m-d H:i:s'),
                ]);
                $progId = $pdo->lastInsertId();

                // Import files (hanya metadata, file fisik tidak termasuk)
                if (!empty($p['files'])) {
                    foreach ($p['files'] as $f) {
                        $fileStmt->execute([
                            $progId,
                            $f['nama_file_asli'],
                            '', // nama_file_simpan kosong — file fisik tidak ada
                            $f['tipe_file'],
                            $f['ukuran'],
                            $f['keterangan'] ?? null,
                            $f['uploader'] ?? 'admin',
                        ]);
                    }
                }
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Restore berhasil! Metadata program dan file telah diimport. File fisik perlu diupload ulang.']);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
