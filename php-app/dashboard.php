<?php
/**
 * dashboard.php - Halaman utama aplikasi
 * Menampilkan daftar Program dengan file-file di dalamnya
 */
require_once __DIR__ . '/config.php';
requireLogin();

$username = $_SESSION['username'];
$nama     = $_SESSION['nama'];
$role     = $_SESSION['role'];
$isAdmin  = ($role === 'admin');

// Ambil data
$tahunList = $pdo->query("SELECT * FROM tahun_ajaran ORDER BY tahun DESC")->fetchAll();
$kategoriList = $pdo->query("SELECT * FROM kategori ORDER BY nama ASC")->fetchAll();

// Filter
$f_tahun    = $_GET['tahun']    ?? 'all';
$f_semester = $_GET['semester'] ?? 'all';
$f_kategori = $_GET['kategori'] ?? 'all';
$f_search   = trim($_GET['search'] ?? '');

$sql = "SELECT p.*, k.nama AS kategori_nama, k.warna AS kategori_warna, t.tahun AS tahun_teks,
        (SELECT COUNT(*) FROM file_arsip WHERE program_id = p.id) AS jumlah_file
        FROM program p
        LEFT JOIN kategori k ON k.id = p.kategori_id
        LEFT JOIN tahun_ajaran t ON t.id = p.tahun_ajaran_id
        WHERE 1=1";
$params = [];
if ($f_tahun !== 'all')    { $sql .= " AND p.tahun_ajaran_id = ?"; $params[] = $f_tahun; }
if ($f_semester !== 'all') { $sql .= " AND p.semester = ?";       $params[] = $f_semester; }
if ($f_kategori !== 'all') { $sql .= " AND p.kategori_id = ?";   $params[] = $f_kategori; }
if ($f_search !== '')      { $sql .= " AND (p.judul LIKE ? OR p.keterangan LIKE ?)"; $params[] = "%$f_search%"; $params[] = "%$f_search%"; }
$sql .= " ORDER BY t.tahun DESC, p.tanggal_dibuat DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$programs = $stmt->fetchAll();

// Group by tahun
$grouped = [];
foreach ($programs as $p) {
    $tahun = $p['tahun_teks'] ?: 'Tidak diketahui';
    $grouped[$tahun][] = $p;
}

// Stats
$stats = [
    'total' => count($programs),
    'totalFiles' => (int)$pdo->query("SELECT COUNT(*) FROM file_arsip")->fetchColumn(),
    'kategori' => (int)$pdo->query("SELECT COUNT(DISTINCT kategori_id) FROM program")->fetchColumn(),
    'tahun' => count(array_unique(array_column($programs, 'tahun_ajaran_id'))),
];

function e($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
function fb($b) {
    if ($b < 1024) return $b . ' B';
    if ($b < 1048576) return round($b/1024, 1) . ' KB';
    return round($b/1048576, 2) . ' MB';
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Arsip Kurikulum SMPN 1 Bukit</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <header class="topbar">
        <div class="container topbar-inner">
            <div class="brand">
                <div class="brand-logo">
                    <img src="https://iili.io/Cn2LE7a.png" alt="Logo" style="width:100%;height:100%;object-fit:contain;padding:0.25rem" onerror="this.outerHTML='🏫'">
                </div>
                <div>
                    <h1>SMP Negeri 1 Bukit</h1>
                    <p>Jln. Masjid Babussalam, Simpang Tiga, Redelong · Arsip Kurikulum</p>
                </div>
            </div>
            <div class="user-info">
                <div class="user-meta">
                    <span class="user-name"><?= e($nama) ?></span>
                    <span class="user-role">Role: <?= e($role) ?></span>
                </div>
                <div class="avatar <?= $isAdmin ? 'avatar-admin' : 'avatar-guru' ?>"><?= strtoupper(substr($nama, 0, 1)) ?></div>
                <a href="logout.php" class="btn btn-outline">Keluar</a>
            </div>
        </div>
    </header>

    <main class="container">
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon gradient-blue"></div><div><p>Total Program</p><strong><?= $stats['total'] ?></strong></div></div>
            <div class="stat-card"><div class="stat-icon gradient-rose"></div><div><p>Total File</p><strong><?= $stats['totalFiles'] ?></strong></div></div>
            <div class="stat-card"><div class="stat-icon gradient-emerald"></div><div><p>Kategori</p><strong><?= $stats['kategori'] ?></strong></div></div>
            <div class="stat-card"><div class="stat-icon gradient-amber"></div><div><p>Tahun Ajaran</p><strong><?= $stats['tahun'] ?></strong></div></div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <form method="GET" class="filter-form">
                <input type="text" name="search" placeholder=" Cari judul program atau keterangan..." value="<?= e($f_search) ?>">
                <select name="tahun">
                    <option value="all">Semua Tahun Ajaran</option>
                    <?php foreach ($tahunList as $t): if ($t['aktif']): ?>
                        <option value="<?= $t['id'] ?>" <?= $f_tahun == $t['id'] ? 'selected' : '' ?>>TA <?= e($t['tahun']) ?></option>
                    <?php endif; endforeach; ?>
                </select>
                <select name="semester">
                    <option value="all">Semua Semester</option>
                    <option value="Ganjil" <?= $f_semester === 'Ganjil' ? 'selected' : '' ?>>Ganjil</option>
                    <option value="Genap" <?= $f_semester === 'Genap' ? 'selected' : '' ?>>Genap</option>
                </select>
                <select name="kategori">
                    <option value="all">Semua Kategori</option>
                    <?php foreach ($kategoriList as $k): ?>
                        <option value="<?= $k['id'] ?>" <?= $f_kategori == $k['id'] ? 'selected' : '' ?>><?= e($k['nama']) ?></option>
                    <?php endforeach; ?>
                </select>
                <button type="submit" class="btn btn-primary">Terapkan</button>
                <?php if ($f_tahun !== 'all' || $f_semester !== 'all' || $f_kategori !== 'all' || $f_search !== ''): ?>
                    <a href="dashboard.php" class="btn btn-outline">Reset</a>
                <?php endif; ?>
            </form>
            <?php if ($isAdmin): ?>
            <div class="admin-actions">
                <button class="btn btn-primary" onclick="openProgramForm()">+ Program Baru</button>
                <button class="btn btn-outline" onclick="openUploadModal()">+ Upload File</button>
                <button class="btn btn-outline" onclick="openKategoriManager()"> Kelola Kategori</button>
                <button class="btn btn-outline" onclick="openTahunManager()"> Kelola Tahun Ajaran</button>
                <button class="btn btn-outline" onclick="openBackupRestore()" style="background:#f3e8ff;color:#7e22ce;border-color:#e9d5ff"> Backup & Restore</button>
            </div>
            <?php endif; ?>
            <p class="filter-info">Menampilkan <b><?= count($programs) ?></b> program.</p>
        </div>

        <!-- Program List -->
        <?php if (empty($grouped)): ?>
            <div class="empty">
                <div class="empty-icon"></div>
                <h3>Belum ada program</h3>
                <p><?= $isAdmin ? "Klik '+ Program Baru' untuk memulai." : "Coba ubah filter pencarian." ?></p>
            </div>
        <?php else: ?>
            <?php foreach ($grouped as $tahun => $list): ?>
                <section class="tahun-section">
                    <div class="tahun-header">
                        <div class="tahun-icon"></div>
                        <div>
                            <h2>Tahun Ajaran <?= e($tahun) ?></h2>
                            <p><?= count($list) ?> program</p>
                        </div>
                        <div class="tahun-line"></div>
                    </div>
                    <div class="program-grid">
                        <?php foreach ($list as $p): ?>
                            <div class="program-card">
                                <div class="program-head">
                                    <div class="program-icon color-<?= e($p['kategori_warna'] ?: 'slate') ?>"></div>
                                    <div class="program-info">
                                        <h3 class="program-title"><?= e($p['judul']) ?></h3>
                                        <div class="badges">
                                            <span class="badge badge-<?= e($p['kategori_warna'] ?: 'slate') ?>"><?= e($p['kategori_nama'] ?: '-') ?></span>
                                            <span class="badge badge-slate">TA <?= e($tahun) ?></span>
                                            <span class="badge badge-slate"><?= e($p['semester']) ?></span>
                                            <span class="badge badge-indigo"><?= (int)$p['jumlah_file'] ?> file</span>
                                        </div>
                                    </div>
                                </div>
                                <?php if (!empty($p['keterangan'])): ?>
                                    <p class="program-desc"><?= e($p['keterangan']) ?></p>
                                <?php endif; ?>

                                <!-- Preview file (max 3) -->
                                <?php
                                $filesStmt = $pdo->prepare("SELECT * FROM file_arsip WHERE program_id = ? ORDER BY tanggal_upload DESC LIMIT 3");
                                $filesStmt->execute([$p['id']]);
                                $previewFiles = $filesStmt->fetchAll();
                                if ($previewFiles): ?>
                                    <div class="program-files">
                                        <?php foreach ($previewFiles as $f): ?>
                                            <div class="file-row">
                                                <div class="file-icon color-<?= e($f['tipe_file']) ?>"><?= strtoupper($f['tipe_file']) ?></div>
                                                <span class="file-name"><?= e($f['nama_file_asli']) ?></span>
                                                <span class="file-size"><?= fb($f['ukuran']) ?></span>
                                            </div>
                                        <?php endforeach; ?>
                                        <?php if ($p['jumlah_file'] > 3): ?>
                                            <p class="more-files">+ <?= ((int)$p['jumlah_file'] - 3) ?> file lainnya...</p>
                                        <?php endif; ?>
                                    </div>
                                <?php endif; ?>

                                <div class="program-actions">
                                    <button class="btn btn-sm btn-slate" onclick="viewProgram(<?= $p['id'] ?>)"> Lihat</button>
                                    <a class="btn btn-sm btn-emerald" href="download.php?id=<?= $p['id'] ?>&all=1"> Download</a>
                                    <?php if ($isAdmin): ?>
                                        <button class="btn btn-sm btn-indigo" onclick="openUploadModal(<?= $p['id'] ?>)">+ File</button>
                                        <button class="btn btn-sm btn-amber" onclick="editProgram(<?= $p['id'] ?>)">✏ Edit</button>
                                        <button class="btn btn-sm btn-rose" onclick="confirmDeleteProgram(<?= $p['id'] ?>, '<?= e(addslashes($p['judul'])) ?>')">🗑 Hapus</button>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </section>
            <?php endforeach; ?>
        <?php endif; ?>

        <footer class="footer">
            © <?= date('Y') ?> SMP Negeri 1 Bukit · Arsip Kurikulum · PHP + MySQL
            <div style="margin-top:0.25rem">© 2026 @EfKa Studio</div>
        </footer>
    </main>

    <!-- Modals -->
    <div id="viewModal" class="modal"><div class="modal-content modal-lg"><div class="modal-header"><h2>Detail Program</h2><button onclick="closeModal('viewModal')" class="close-btn">✕</button></div><div id="viewBody" class="modal-body"></div></div></div>
    <div id="previewModal" class="modal" style="padding:0"><div class="preview-container"><div class="preview-header"><div class="brand" style="display:flex;align-items:center;gap:0.5rem"><div class="brand-logo" style="width:2rem;height:2rem"><img src="https://iili.io/Cn2LE7a.png" style="width:100%;height:100%;object-fit:contain;padding:0.125rem" onerror="this.outerHTML='🏫'"></div><div><p style="font-size:0.75rem;font-weight:700;color:#0f172a;line-height:1.2">SMP Negeri 1 Bukit</p><p style="font-size:0.625rem;color:#64748b;line-height:1.2">Preview Dokumen</p></div></div><div style="display:flex;gap:0.5rem"><a id="previewDownloadLink" class="btn btn-emerald btn-sm" href="#"> Download</a><button onclick="closeModal('previewModal')" class="close-btn">✕</button></div></div><div id="previewInfo" class="preview-info"></div><div class="preview-body"><iframe id="previewFrame" title="Preview"></iframe></div><div class="preview-footer"><div id="previewMeta" class="text-small"></div><button class="btn btn-outline btn-sm" onclick="closeModal('previewModal')">Tutup</button></div></div></div>

    <?php if ($isAdmin): ?>
    <div id="programModal" class="modal"><div class="modal-content modal-md"><div class="modal-header"><h2 id="programModalTitle">Program</h2><button onclick="closeModal('programModal')" class="close-btn">✕</button></div><form id="programForm" class="modal-body"></form></div></div>
    <div id="uploadModal" class="modal"><div class="modal-content modal-md"><div class="modal-header"><h2>Upload File ke Program</h2><button onclick="closeModal('uploadModal')" class="close-btn">✕</button></div><form id="uploadForm" class="modal-body"></form></div></div>
    <div id="kategoriModal" class="modal"><div class="modal-content modal-md"><div class="modal-header"><h2>Kelola Kategori</h2><button onclick="closeModal('kategoriModal')" class="close-btn">✕</button></div><div id="kategoriBody" class="modal-body"></div></div></div>
    <div id="tahunModal" class="modal"><div class="modal-content modal-md"><div class="modal-header"><h2>Kelola Tahun Ajaran</h2><button onclick="closeModal('tahunModal')" class="close-btn">✕</button></div><div id="tahunBody" class="modal-body"></div></div></div>
    <div id="deleteModal" class="modal"><div class="modal-content modal-sm"><div class="modal-header"><h2>Konfirmasi Hapus</h2><button onclick="closeModal('deleteModal')" class="close-btn"></button></div><div class="modal-body"><p id="deleteMsg"></p><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('deleteModal')">Batal</button><button class="btn btn-rose" id="deleteConfirmBtn">Ya, Hapus</button></div></div></div></div>
    <div id="deleteFileModal" class="modal"><div class="modal-content modal-sm"><div class="modal-header"><h2>Hapus File?</h2><button onclick="closeModal('deleteFileModal')" class="close-btn">✕</button></div><div class="modal-body"><p id="deleteFileMsg"></p><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('deleteFileModal')">Batal</button><button class="btn btn-rose" id="deleteFileConfirmBtn">Ya, Hapus File</button></div></div></div></div>

    <div id="backupModal" class="modal"><div class="modal-content modal-md"><div class="modal-header"><h2>Backup & Restore Data</h2><button onclick="closeModal('backupModal')" class="close-btn">✕</button></div><div class="modal-body">
        <div class="alert alert-info small">Backup & Restore untuk menjaga keamanan data aplikasi.</div>

        <h3 style="font-size:1rem;font-weight:700;margin:1rem 0 0.5rem"> Backup Data</h3>
        <p class="small" style="color:var(--text-muted)">Download semua data metadata (program, kategori, tahun ajaran) ke file JSON. File fisik (PDF/gambar) <b>tidak termasuk</b> — backup folder <code>uploads/</code> secara terpisah.</p>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <a href="api.php?action=backup" class="btn btn-primary"> Download Backup (.json)</a>
        </div>

        <h3 style="font-size:1rem;font-weight:700;margin:1.5rem 0 0.5rem;border-top:1px solid var(--border);padding-top:1rem"> Restore Data</h3>
        <p class="small" style="color:#dc2626"> Restore akan <b>mengganti semua data saat ini</b> dengan data dari file backup. Pastikan file backup benar!</p>
        <form id="restoreForm" enctype="multipart/form-data" style="margin-top:0.75rem">
            <div class="form-group">
                <label>Pilih File Backup (.json) *</label>
                <input type="file" name="backup_file" accept=".json" required>
            </div>
            <div id="restoreError" class="alert alert-danger" style="display:none"></div>
            <div id="restoreSuccess" class="alert alert-info" style="display:none"></div>
            <div class="modal-footer" style="margin-top:0.5rem">
                <button type="button" class="btn btn-outline" onclick="closeModal('backupModal')">Batal</button>
                <button type="submit" class="btn btn-rose" id="restoreBtn"> Restore Sekarang</button>
            </div>
        </form>

        <div class="alert alert-info small" style="margin-top:1rem">
            <b> Catatan Penting:</b>
            <ul style="margin:0.5rem 0 0;padding-left:1.25rem">
                <li>Backup JSON berisi metadata — bukan file fisik</li>
                <li>Untuk backup lengkap, salin juga folder <code>uploads/</code></li>
                <li>Simpan backup di minimal 2 tempat (komputer + cloud)</li>
                <li>Disarankan backup rutin setiap bulan</li>
            </ul>
        </div>
    </div></div></div>
    <?php endif; ?>

    <div id="toast" class="toast"></div>

    <script>
    const programsData = <?= json_encode($programs) ?>;
    const isAdmin = <?= $isAdmin ? 'true' : 'false' ?>;

    function showToast(msg, type) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast show toast-' + (type || 'default');
        setTimeout(() => t.className = 'toast', 2800);
    }
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }
    function escapeHtml(s) { if (s == null) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function formatBytes(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(2) + ' MB'; }

    // ===== VIEW PROGRAM =====
    async function viewProgram(id) {
        const p = programsData.find(x => x.id == id);
        if (!p) return;
        // Fetch files
        const rf = await fetch('api.php?action=program_files&id=' + id);
        const jf = await rf.json();
        const files = jf.files || [];

        let html = `<div class="view-head">
            <div class="program-icon color-${p.kategori_warna || 'slate'}" style="width:64px;height:64px"></div>
            <div style="flex:1">
                <h3>${escapeHtml(p.judul)}</h3>
                <div class="badges" style="margin-top:8px">
                    <span class="badge badge-${p.kategori_warna || 'slate'}">${escapeHtml(p.kategori_nama || '-')}</span>
                    <span class="badge badge-slate">TA ${escapeHtml(p.tahun_teks || '-')}</span>
                    <span class="badge badge-slate">${escapeHtml(p.semester)}</span>
                    <span class="badge badge-indigo">${files.length} file</span>
                </div>
            </div>
        </div>`;
        if (p.keterangan) html += `<p class="view-desc">${escapeHtml(p.keterangan)}</p>`;

        html += `<div class="view-files-header">File dalam Program Ini (${files.length})</div><div class="view-files-list">`;
        if (files.length === 0) html += `<div class="empty-file">Belum ada file.</div>`;
        else files.forEach(f => {
            html += `<div class="view-file-row">
                <div class="file-icon color-${f.tipe_file}" style="width:36px;height:36px;font-size:10px">${f.tipe_file.toUpperCase()}</div>
                <div style="flex:1;min-width:0">
                    <p style="font-weight:600;font-size:0.875rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(f.nama_file_asli)}</p>
                    <p style="font-size:0.75rem;color:#64748b">${f.tipe_file.toUpperCase()} · ${formatBytes(f.ukuran)}${f.keterangan ? ' · ' + escapeHtml(f.keterangan) : ''}</p>
                </div>
                <div style="display:flex;gap:0.375rem;flex-shrink:0">
                    <button class="btn btn-sm btn-blue" onclick="previewFile(${f.id}, '${escapeHtml(f.nama_file_asli).replace(/'/g,"\\'")}', '${f.tipe_file}')"> Lihat</button>
                    <a class="btn btn-sm btn-emerald" href="download.php?id=${f.id}"> Download</a>
                    ${isAdmin ? `<button class="btn btn-sm btn-rose" onclick="confirmDeleteFile(${f.id}, '${escapeHtml(f.nama_file_asli).replace(/'/g,"\\'")}')"></button>` : ''}
                </div>
            </div>`;
        });
        html += `</div>`;
        html += `<div class="view-meta">Dibuat: ${new Date(p.tanggal_dibuat).toLocaleString('id-ID')} oleh ${escapeHtml(p.created_by)}</div>`;
        html += `<div class="modal-footer">
            <button class="btn btn-indigo" onclick="closeModal('viewModal');openUploadModal(${p.id})">+ Tambah File</button>
            <a class="btn btn-emerald" href="download.php?program_id=${p.id}&all=1"> Download Semua</a>
            ${isAdmin ? `<button class="btn btn-amber" onclick="closeModal('viewModal');editProgram(${p.id})">✏ Edit</button>
            <button class="btn btn-rose" onclick="closeModal('viewModal');confirmDeleteProgram(${p.id}, '${escapeHtml(p.judul).replace(/'/g,"\\'")}')">🗑 Hapus</button>` : ''}
            <button class="btn btn-outline" onclick="closeModal('viewModal')">Tutup</button>
        </div>`;

        document.getElementById('viewBody').innerHTML = html;
        openModal('viewModal');
    }

    // ===== PREVIEW FILE =====
    function previewFile(id, nama, tipe) {
        document.getElementById('previewFrame').src = 'preview.php?id=' + id;
        document.getElementById('previewDownloadLink').href = 'download.php?id=' + id;
        document.getElementById('previewInfo').innerHTML = '<span class="pi-title">' + escapeHtml(nama) + '</span>';
        document.getElementById('previewMeta').textContent = tipe.toUpperCase() + ' · Preview Dokumen';
        openModal('previewModal');
    }

    // ===== PROGRAM FORM =====
    <?php if ($isAdmin): ?>
    const kategoriList = <?= json_encode($kategoriList) ?>;
    const tahunList = <?= json_encode($tahunList) ?>;

    function openProgramForm(editId) {
        const isEdit = !!editId;
        const p = isEdit ? programsData.find(x => x.id == editId) : null;
        document.getElementById('programModalTitle').textContent = isEdit ? 'Edit Program' : 'Program Baru';

        const form = document.getElementById('programForm');
        form.innerHTML = `
            <input type="hidden" name="id" value="${p ? p.id : ''}">
            <div class="form-group"><label>Judul Program *</label><input type="text" name="judul" required value="${p ? escapeHtml(p.judul) : ''}"></div>
            <div class="form-row">
                <div class="form-group"><label>Kategori *</label><select name="kategori_id" required>${kategoriList.map(k => `<option value="${k.id}" ${p && p.kategori_id == k.id ? 'selected' : ''}>${escapeHtml(k.nama)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Tahun Ajaran *</label><select name="tahun_ajaran_id" required>${tahunList.map(t => `<option value="${t.id}" ${p && p.tahun_ajaran_id == t.id ? 'selected' : ''}>${escapeHtml(t.tahun)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Semester *</label><select name="semester" required><option ${p && p.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option><option ${p && p.semester === 'Genap' ? 'selected' : ''}>Genap</option></select></div>
            </div>
            <div class="form-group"><label>Keterangan</label><textarea name="keterangan" rows="3">${p ? escapeHtml(p.keterangan || '') : ''}</textarea></div>
            <div id="programError" class="alert alert-danger" style="display:none"></div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('programModal')">Batal</button><button type="submit" class="btn btn-primary" id="programSubmitBtn">${isEdit ? 'Simpan' : 'Buat Program'}</button></div>
        `;

        form.onsubmit = async function(e) {
            e.preventDefault();
            const fd = new FormData(this);
            const btn = document.getElementById('programSubmitBtn');
            const err = document.getElementById('programError');
            btn.disabled = true;
            try {
                const action = isEdit ? 'program_update' : 'program_create';
                const r = await fetch('api.php?action=' + action, { method: 'POST', body: fd });
                const j = await r.json();
                if (j.success) { showToast(isEdit ? 'Program diperbarui.' : 'Program dibuat.', 'success'); setTimeout(() => location.reload(), 600); }
                else { err.textContent = j.error; err.style.display = 'block'; }
            } catch (ex) { err.textContent = 'Terjadi kesalahan.'; err.style.display = 'block'; }
            btn.disabled = false;
        };
        openModal('programModal');
    }

    function editProgram(id) { openProgramForm(id); }

    // ===== UPLOAD FILE =====
    function openUploadModal(programId) {
        const form = document.getElementById('uploadForm');
        const programs = programsData;
        form.innerHTML = `
            ${!programId ? `<div class="form-group"><label>Pilih Program Tujuan *</label><select name="program_id" required><option value="">-- Pilih --</option>${programs.map(p => `<option value="${p.id}">${escapeHtml(p.judul)}</option>`).join('')}</select></div>` : `<input type="hidden" name="program_id" value="${programId}"><div class="alert alert-info">Upload ke: <b>${escapeHtml(programs.find(p => p.id == programId)?.judul || '')}</b></div>`}
            <div class="form-group"><label>File *</label><div class="drop-zone" onclick="document.getElementById('uploadFileInput').click()"><input type="file" name="file" id="uploadFileInput" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/jpg"><div id="dropLabel"><div class="drop-icon">⬆</div><p><b>Klik untuk memilih file</b></p><p class="small">PDF/Word/Excel max 3MB · JPG/PNG max 100KB</p></div></div></div>
            <div class="form-group"><label>Keterangan File (opsional)</label><input type="text" name="keterangan"></div>
            <div id="uploadError" class="alert alert-danger" style="display:none"></div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('uploadModal')">Batal</button><button type="submit" class="btn btn-primary" id="uploadBtn">Upload File</button></div>
        `;

        document.getElementById('uploadFileInput').onchange = function(e) {
            const f = e.target.files[0];
            if (!f) return;
            document.getElementById('dropLabel').innerHTML = `<div style="font-size:32px"></div><p><b>${escapeHtml(f.name)}</b></p><p class="small">${formatBytes(f.size)}</p>`;
        };

        form.onsubmit = async function(e) {
            e.preventDefault();
            const fd = new FormData(this);
            const btn = document.getElementById('uploadBtn');
            const err = document.getElementById('uploadError');
            btn.disabled = true; btn.textContent = 'Mengupload...'; err.style.display = 'none';
            try {
                const r = await fetch('api.php?action=upload', { method: 'POST', body: fd });
                const j = await r.json();
                if (j.success) { showToast('File diupload.', 'success'); setTimeout(() => location.reload(), 600); }
                else { err.textContent = j.error; err.style.display = 'block'; }
            } catch (ex) { err.textContent = 'Kesalahan jaringan.'; err.style.display = 'block'; }
            btn.disabled = false; btn.textContent = 'Upload File';
        };
        openModal('uploadModal');
    }

    // ===== DELETE PROGRAM =====
    let deleteProgramId = null;
    function confirmDeleteProgram(id, judul) {
        deleteProgramId = id;
        document.getElementById('deleteMsg').innerHTML = `Hapus "<b>${judul}</b>" beserta semua filenya? Tindakan ini tidak dapat dibatalkan.`;
        openModal('deleteModal');
    }
    document.getElementById('deleteConfirmBtn').onclick = async function() {
        if (!deleteProgramId) return;
        this.disabled = true;
        try {
            const fd = new FormData(); fd.append('id', deleteProgramId);
            const r = await fetch('api.php?action=program_delete', { method: 'POST', body: fd });
            const j = await r.json();
            if (j.success) { showToast('Program dihapus.', 'success'); setTimeout(() => location.reload(), 600); }
            else { showToast(j.error, 'error'); this.disabled = false; }
        } catch (ex) { showToast('Kesalahan.', 'error'); this.disabled = false; }
    };

    // ===== DELETE FILE =====
    let deleteFileId = null;
    function confirmDeleteFile(id, nama) {
        deleteFileId = id;
        document.getElementById('deleteFileMsg').innerHTML = `Hapus file "<b>${nama}</b>" dari program ini?`;
        openModal('deleteFileModal');
    }
    document.getElementById('deleteFileConfirmBtn').onclick = async function() {
        if (!deleteFileId) return;
        this.disabled = true;
        try {
            const fd = new FormData(); fd.append('id', deleteFileId);
            const r = await fetch('api.php?action=delete_file', { method: 'POST', body: fd });
            const j = await r.json();
            if (j.success) { showToast('File dihapus.', 'success'); closeModal('deleteFileModal'); viewProgram(programsData.find(p => { const rf = fetch('api.php?action=program_files&id=' + p.id); }).id); }
            else { showToast(j.error, 'error'); this.disabled = false; }
        } catch (ex) { showToast('Kesalahan.', 'error'); this.disabled = false; }
    };

    // ===== KATEGORI MANAGER =====
    async function openKategoriManager() {
        const r = await fetch('api.php?action=kategori_list');
        const j = await r.json();
        const items = j.data || [];
        const body = document.getElementById('kategoriBody');
        body.innerHTML = `
            <div class="alert alert-info small"> Tambah atau hapus kategori. Kategori yang masih dipakai program tidak bisa dihapus.</div>
            <div class="border rounded" style="border-color:var(--border);overflow:hidden;margin-bottom:1rem">
                ${items.length === 0 ? '<div class="p-4 text-center text-sm text-slate-500">Belum ada kategori.</div>' :
                items.map(k => `<div class="px-4 py-3 flex items-center gap-3" style="border-bottom:1px solid var(--border)">
                    <span class="badge badge-${k.warna}">${escapeHtml(k.nama)}</span>
                    <span class="text-small" style="flex:1">ID: ${k.id}</span>
                    <button class="btn btn-sm btn-rose" onclick="deleteKategori(${k.id})"> Hapus</button>
                </div>`).join('')}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:1rem">
                <p style="font-weight:600;font-size:0.875rem;margin-bottom:0.5rem">Tambah Kategori Baru</p>
                <div style="display:flex;gap:0.5rem">
                    <input type="text" id="newKatNama" class="form-control" placeholder="Nama kategori" style="flex:1">
                    <select id="newKatWarna"><option value="blue">Biru</option><option value="rose">Merah</option><option value="emerald">Hijau</option><option value="amber">Kuning</option><option value="violet">Ungu</option><option value="slate">Abu-abu</option></select>
                    <button class="btn btn-emerald" onclick="createKategori()">Tambah</button>
                </div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal('kategoriModal')">Selesai</button></div>
        `;
        openModal('kategoriModal');
    }
    async function createKategori() {
        const nama = document.getElementById('newKatNama').value.trim();
        const warna = document.getElementById('newKatWarna').value;
        if (!nama) return alert('Nama wajib diisi');
        const fd = new FormData(); fd.append('nama', nama); fd.append('warna', warna);
        const r = await fetch('api.php?action=kategori_create', { method: 'POST', body: fd });
        const j = await r.json();
        if (j.success) { showToast('Kategori ditambahkan.', 'success'); openKategoriManager(); }
        else showToast(j.error, 'error');
    }
    async function deleteKategori(id) {
        if (!confirm('Yakin hapus kategori ini?')) return;
        const fd = new FormData(); fd.append('id', id);
        const r = await fetch('api.php?action=kategori_delete', { method: 'POST', body: fd });
        const j = await r.json();
        if (j.success) { showToast('Kategori dihapus.', 'success'); openKategoriManager(); }
        else showToast(j.error, 'error');
    }

    // ===== TAHUN MANAGER =====
    async function openTahunManager() {
        const r = await fetch('api.php?action=tahun_list');
        const j = await r.json();
        const items = j.data || [];
        const body = document.getElementById('tahunBody');
        body.innerHTML = `
            <div class="alert alert-info small"> Tambah, nonaktifkan, atau hapus tahun ajaran. Yang aktif muncul di filter.</div>
            <div class="border rounded" style="border-color:var(--border);overflow:hidden;margin-bottom:1rem">
                ${items.length === 0 ? '<div class="p-4 text-center text-sm text-slate-500">Belum ada tahun ajaran.</div>' :
                items.map(t => `<div class="px-4 py-3 flex items-center gap-3" style="border-bottom:1px solid var(--border)">
                    <div style="flex:1"><p style="font-weight:600;font-size:0.875rem">TA ${escapeHtml(t.tahun)}</p><p class="text-small">ID: ${t.id} · ${t.aktif ? 'Aktif' : 'Tidak aktif'}</p></div>
                    <button class="btn btn-sm ${t.aktif ? 'btn-emerald' : 'btn-slate'}" onclick="toggleTahun(${t.id})">${t.aktif ? '✓ Aktif' : 'Nonaktif'}</button>
                    <button class="btn btn-sm btn-rose" onclick="deleteTahun(${t.id})"> Hapus</button>
                </div>`).join('')}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:1rem">
                <p style="font-weight:600;font-size:0.875rem;margin-bottom:0.5rem">Tambah Tahun Ajaran Baru</p>
                <div style="display:flex;gap:0.5rem">
                    <input type="text" id="newTahun" class="form-control" placeholder="Format: 2025/2026" style="flex:1">
                    <button class="btn btn-emerald" onclick="createTahun()">Tambah</button>
                </div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal('tahunModal')">Selesai</button></div>
        `;
        openModal('tahunModal');
    }
    async function createTahun() {
        const tahun = document.getElementById('newTahun').value.trim();
        if (!/^\d{4}\/\d{4}$/.test(tahun)) return alert('Format harus: 2025/2026');
        const fd = new FormData(); fd.append('tahun', tahun);
        const r = await fetch('api.php?action=tahun_create', { method: 'POST', body: fd });
        const j = await r.json();
        if (j.success) { showToast('Tahun ajaran ditambahkan.', 'success'); openTahunManager(); }
        else showToast(j.error, 'error');
    }
    async function toggleTahun(id) {
        const fd = new FormData(); fd.append('id', id);
        const r = await fetch('api.php?action=tahun_toggle', { method: 'POST', body: fd });
        const j = await r.json();
        if (j.success) openTahunManager(); else showToast(j.error, 'error');
    }
    async function deleteTahun(id) {
        if (!confirm('Yakin hapus tahun ajaran ini?')) return;
        const fd = new FormData(); fd.append('id', id);
        const r = await fetch('api.php?action=tahun_delete', { method: 'POST', body: fd });
        const j = await r.json();
        if (j.success) { showToast('Tahun ajaran dihapus.', 'success'); openTahunManager(); }
        else showToast(j.error, 'error');
    }

    // ===== BACKUP & RESTORE =====
    function openBackupRestore() { openModal('backupModal'); }

    document.getElementById('restoreForm').onsubmit = async function(e) {
        e.preventDefault();
        const fd = new FormData(this);
        const btn = document.getElementById('restoreBtn');
        const err = document.getElementById('restoreError');
        const suc = document.getElementById('restoreSuccess');
        err.style.display = 'none'; suc.style.display = 'none';
        btn.disabled = true; btn.textContent = 'Merestore...';

        if (!confirm('Yakin restore? Semua data saat ini akan diganti dengan data dari file backup!')) {
            btn.disabled = false; btn.textContent = ' Restore Sekarang'; return;
        }

        try {
            const r = await fetch('api.php?action=restore', { method: 'POST', body: fd });
            const j = await r.json();
            if (j.success) { suc.textContent = j.message || 'Restore berhasil!'; suc.style.display = 'block'; showToast('Restore berhasil!', 'success'); setTimeout(() => location.reload(), 2000); }
            else { err.textContent = j.error || 'Gagal restore.'; err.style.display = 'block'; }
        } catch (ex) { err.textContent = 'Kesalahan jaringan.'; err.style.display = 'block'; }
        btn.disabled = false; btn.textContent = ' Restore Sekarang';
    };
    <?php endif; ?>
    </script>
</body>
</html>
