import { useEffect, useMemo, useRef, useState } from "react";
import type { FileItem, Kategori, Program, Role, TahunAjaran, User } from "./types";
import {
  addFileToProgram,
  addProgram,
  deleteProgram as doDeleteProgram,
  detectTipe,
  fileToDataUrl,
  formatBytes,
  getKategori,
  getPrograms,
  getSession,
  getTahun as doGetTahun,
  initStorage,
  login,
  MAX_DOC_SIZE,
  MAX_IMG_SIZE,
  removeFileFromProgram,
  saveKategori,
  savePrograms,
  saveTahun,
  setSession,
  uid,
  updateProgram,
} from "./storage";
import { PreviewModal, SchoolLogo, SchoolTitle } from "./Preview";

// =======================================================
// LOGIN SCREEN
// =======================================================
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const u = login(username.trim(), password);
      if (!u) { setError("Username atau password salah."); setLoading(false); return; }
      setSession(u);
      onLogin(u);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
              <img src="https://iili.io/Cn2LE7a.png" alt="Logo" className="w-full h-full object-contain p-1.5" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:1.5rem">🏫</span>'; }} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">SMP Negeri 1 Bukit</h1>
              <p className="text-sm text-blue-100 leading-tight">Jln. Masjid Babussalam, Simpang Tiga, Redelong</p>
              <p className="text-xs text-blue-200 leading-tight mt-0.5">Arsip Kurikulum</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan username" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan password" required />
          </div>
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-60">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

// =======================================================
// HELPERS
// =======================================================
const TIPE_COLORS: Record<string, string> = {
  pdf: "bg-rose-100 text-rose-600",
  doc: "bg-sky-100 text-sky-600", docx: "bg-sky-100 text-sky-600",
  xls: "bg-emerald-100 text-emerald-600", xlsx: "bg-emerald-100 text-emerald-600",
  image: "bg-amber-100 text-amber-600",
};
const TIPE_ICONS: Record<string, string> = { pdf: "PDF", doc: "DOC", docx: "DOC", xls: "XLS", xlsx: "XLS", image: "IMG" };

function TypeIcon({ tipe, size = "md" }: { tipe: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "w-9 h-9 text-[10px]" : size === "lg" ? "w-16 h-16 text-sm" : "w-11 h-11 text-xs";
  return (
    <div className={`${dim} rounded-lg flex items-center justify-center font-bold ${TIPE_COLORS[tipe] || "bg-slate-100 text-slate-600"}`}>
      {TIPE_ICONS[tipe] || "?"}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: "blue" | "slate" | "rose" | "emerald" | "amber" | "violet" }) {
  const map = { blue: "bg-blue-50 text-blue-700", slate: "bg-slate-100 text-slate-600", rose: "bg-rose-50 text-rose-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[color]}`}>{children}</span>;
}

// =======================================================
// DASHBOARD
// =======================================================
interface Filters { tahunId: string; semester: string; kategoriId: string; search: string; }

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>(doGetTahun());
  const [filters, setFilters] = useState<Filters>({ tahunId: "all", semester: "all", kategoriId: "all", search: "" });
  const [toast, setToast] = useState<string | null>(null);

  // Modals state
  const [viewProgram, setViewProgram] = useState<Program | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: FileItem; programJudul: string } | null>(null);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [newProgram, setNewProgram] = useState(false);
  const [uploadToProgram, setUploadToProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [deleteFileFrom, setDeleteFileFrom] = useState<{ program: Program; file: FileItem } | null>(null);
  const [manageKategori, setManageKategori] = useState(false);
  const [manageTahun, setManageTahun] = useState(false);
  const [backupRestore, setBackupRestore] = useState(false);

  const reload = () => {
    setPrograms(getPrograms());
    setKategori(getKategori());
    setTahunList(doGetTahun());
  };

  useEffect(() => {
    void initStorage().then(() => reload());
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }, [toast]);

  const findKat = (id: string) => kategori.find(k => k.id === id);
  const findTahun = (id: string) => tahunList.find(t => t.id === id);

  const filtered = useMemo(() => {
    return programs
      .filter(p => filters.tahunId === "all" || p.tahunAjaranId === filters.tahunId)
      .filter(p => filters.semester === "all" || p.semester === filters.semester)
      .filter(p => filters.kategoriId === "all" || p.kategoriId === filters.kategoriId)
      .filter(p => filters.search.trim() === "" || (p.judul + " " + p.keterangan).toLowerCase().includes(filters.search.toLowerCase()))
      .sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat));
  }, [programs, filters]);

  const grouped = useMemo(() => {
    const map = new Map<string, Program[]>();
    filtered.forEach(p => { const th = findTahun(p.tahunAjaranId)?.tahun || p.tahunAjaranId; if (!map.has(th)) map.set(th, []); map.get(th)!.push(p); });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const stats = useMemo(() => ({
    total: programs.length,
    totalFiles: programs.reduce((s, p) => s + p.files.length, 0),
    kategori: new Set(programs.map(p => p.kategoriId)).size,
    tahun: new Set(programs.map(p => p.tahunAjaranId)).size,
  }), [programs]);

  const isAdmin = user.role === "admin";

  const showToast = (msg: string) => { setToast(msg); };
  const doReload = () => { reload(); };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SchoolLogo size="md" />
            <SchoolTitle />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user.nama}</p>
              <p className="text-xs text-slate-500 capitalize">Role: {user.role}</p>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${isAdmin ? "bg-rose-500" : "bg-emerald-500"}`}>{user.nama.charAt(0)}</div>
            <button onClick={onLogout} className="text-sm px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Program" value={stats.total} icon="" color="from-blue-500 to-blue-600" />
          <StatCard label="Total File" value={stats.totalFiles} icon="" color="from-indigo-500 to-indigo-600" />
          <StatCard label="Kategori" value={stats.kategori} icon="" color="from-emerald-500 to-emerald-600" />
          <StatCard label="Tahun Ajaran" value={stats.tahun} icon="" color="from-amber-500 to-amber-600" />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1">
              <input type="text" placeholder=" Cari judul program atau keterangan..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <select value={filters.tahunId} onChange={(e) => setFilters({ ...filters, tahunId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua Tahun Ajaran</option>
              {tahunList.filter(t => t.aktif).map((t) => <option key={t.id} value={t.id}>TA {t.tahun}</option>)}
            </select>
            <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua Semester</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
            <select value={filters.kategoriId} onChange={(e) => setFilters({ ...filters, kategoriId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua Kategori</option>
              {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <button onClick={() => setNewProgram(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg transition">+ Program Baru</button>
              <button onClick={() => setUploadToProgram(null)} className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 font-semibold text-sm hover:bg-indigo-200 transition">+ Upload File</button>
              <button onClick={() => setManageKategori(true)} className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm hover:bg-emerald-200 transition"> Kelola Kategori</button>
              <button onClick={() => setManageTahun(true)} className="px-4 py-2 rounded-lg bg-amber-100 text-amber-700 font-semibold text-sm hover:bg-amber-200 transition"> Kelola Tahun Ajaran</button>
              <button onClick={() => setBackupRestore(true)} className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold text-sm hover:bg-purple-200 transition"> Backup & Restore</button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">Menampilkan <b>{filtered.length}</b> program dari total <b>{programs.length}</b>.</p>
        </div>

        {/* Program List */}
        {grouped.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
            <div className="text-5xl mb-3"></div>
            <h3 className="font-semibold text-slate-700">Belum ada program</h3>
            <p className="text-sm text-slate-500 mt-1">{isAdmin ? "Klik '+ Program Baru' untuk membuat program pertama." : "Coba ubah filter pencarian."}</p>
          </div>
        ) : (
          grouped.map(([tahun, list]) => (
            <section key={tahun} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold"></div>
                <div>
                  <h2 className="font-bold text-slate-800">Tahun Ajaran {tahun}</h2>
                  <p className="text-xs text-slate-500">{list.length} program</p>
                </div>
                <div className="flex-1 h-px bg-slate-200 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {list.map(p => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    kategori={findKat(p.kategoriId)}
                    tahun={findTahun(p.tahunAjaranId)}
                    role={user.role}
                    onView={() => setViewProgram(p)}
                    onEdit={() => isAdmin && setEditProgram(p)}
                    onDelete={() => isAdmin && setProgramToDelete(p)}
                    onAddFile={() => isAdmin && setUploadToProgram(p)}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <footer className="text-center text-xs text-slate-400 mt-10 pb-6">
           {new Date().getFullYear()} SMP Negeri 1 Bukit · Arsip Kurikulum · Demo React · File PHP siap deploy di folder <code>php-app/</code>
          <div className="mt-1">© 2026 @EfKa Studio</div>
        </footer>
      </main>

      {/* MODALS */}
      {viewProgram && <ProgramDetailModal program={viewProgram} kategori={findKat(viewProgram.kategoriId)} tahun={findTahun(viewProgram.tahunAjaranId)} role={user.role} onClose={() => setViewProgram(null)} onEdit={() => { setViewProgram(null); setEditProgram(viewProgram); }} onDelete={() => { setViewProgram(null); setProgramToDelete(viewProgram); }} onPreview={(f) => setPreviewFile({ file: f, programJudul: viewProgram.judul })} onAddFile={() => setUploadToProgram(viewProgram)} onRemoveFile={(f) => isAdmin && setDeleteFileFrom({ program: viewProgram, file: f })} />}
      {newProgram && <ProgramFormModal onClose={() => setNewProgram(false)} onSaved={() => { setNewProgram(false); doReload(); showToast("Program berhasil dibuat."); }} kategori={kategori} tahunList={tahunList} />}
      {editProgram && <ProgramFormModal program={editProgram} onClose={() => setEditProgram(null)} onSaved={() => { setEditProgram(null); doReload(); showToast("Program berhasil diperbarui."); }} kategori={kategori} tahunList={tahunList} />}
      {uploadToProgram && <UploadFileModal program={uploadToProgram} onClose={() => setUploadToProgram(null)} onSaved={() => { setUploadToProgram(null); doReload(); showToast("File berhasil diupload."); }} user={user} />}
      {previewFile && <PreviewModal file={previewFile.file} programJudul={previewFile.programJudul} onClose={() => setPreviewFile(null)} />}
      {programToDelete && <ConfirmModal title="Hapus program?" message={`Hapus "${programToDelete.judul}" beserta semua filenya (${programToDelete.files.length} file)? Tindakan ini tidak dapat dibatalkan.`} danger confirmLabel="Ya, Hapus" onCancel={() => setProgramToDelete(null)} onConfirm={() => { doDeleteProgram(programToDelete.id); doReload(); setProgramToDelete(null); showToast("Program dihapus."); }} />}
      {deleteFileFrom && <ConfirmModal title="Hapus file dari program?" message={`Hapus file "${deleteFileFrom.file.namaFile}" dari program ini? File fisik akan dihapus dari server.`} danger confirmLabel="Ya, Hapus File" onCancel={() => setDeleteFileFrom(null)} onConfirm={() => { removeFileFromProgram(deleteFileFrom.program.id, deleteFileFrom.file.id); doReload(); setDeleteFileFrom(null); showToast("File dihapus dari program."); }} />}
      {manageKategori && <KategoriManager onClose={() => setManageKategori(false)} onSaved={doReload} />}
      {manageTahun && <TahunManager onClose={() => setManageTahun(false)} onSaved={doReload} />}
      {backupRestore && <BackupRestoreModal onClose={() => setBackupRestore(false)} onRestored={doReload} />}

      {toast && <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-[60]">{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center text-xl`}>{icon}</div>
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-800">{value}</p></div>
    </div>
  );
}

// =======================================================
// PROGRAM CARD
// =======================================================
function ProgramCard({ program, kategori, tahun, role, onView, onEdit, onDelete, onAddFile }: { program: Program; kategori?: Kategori; tahun?: TahunAjaran; role: Role; onView: () => void; onEdit: () => void; onDelete: () => void; onAddFile: () => void }) {
  const isAdmin = role === "admin";
  const fileCount = program.files.length;
  const hasImage = program.files.some(f => f.tipeFile === "image");

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition overflow-hidden flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${kategori ? `bg-${kategori.warna}-100 text-${kategori.warna}-700` : "bg-slate-100 text-slate-600"}`}>
            {hasImage && fileCount > 0 ? <span className="text-2xl">📁</span> : <span className="text-2xl">📋</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 leading-tight line-clamp-2">{program.judul}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {kategori && <Badge color={kategori.warna}>{kategori.nama}</Badge>}
              <Badge color="slate">TA {tahun?.tahun || program.tahunAjaranId}</Badge>
              <Badge color="slate">{program.semester}</Badge>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">{fileCount} file</span>
            </div>
          </div>
        </div>
        {program.keterangan && <p className="text-xs text-slate-500 mt-3 line-clamp-2">{program.keterangan}</p>}

        {/* Preview files di card (tampilkan 3 file pertama) */}
        {program.files.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            {program.files.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center gap-2 text-xs">
                <TypeIcon tipe={f.tipeFile} size="sm" />
                <span className="flex-1 truncate text-slate-700">{f.namaFile}</span>
                <span className="text-slate-500">{formatBytes(f.ukuran)}</span>
              </div>
            ))}
            {program.files.length > 3 && (
              <p className="text-xs text-slate-500 italic pt-1">+ {program.files.length - 3} file lainnya...</p>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-100 border-t border-slate-200">
        <button onClick={onView} className="bg-white text-xs px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50">👁 Lihat</button>
        {isAdmin && <button onClick={onAddFile} className="bg-white text-xs px-3 py-2.5 font-medium text-indigo-700 hover:bg-indigo-50">+ File</button>}
        {!isAdmin && <button onClick={onView} className="bg-white text-xs px-3 py-2.5 font-medium text-emerald-700 hover:bg-emerald-50">⬇ Download</button>}
        {isAdmin && (
          <>
            <button onClick={onEdit} className="bg-white text-xs px-3 py-2.5 font-medium text-amber-700 hover:bg-amber-50">✏ Edit</button>
            <button onClick={onDelete} className="bg-white text-xs px-3 py-2.5 font-medium text-rose-700 hover:bg-rose-50">🗑 Hapus</button>
          </>
        )}
      </div>
    </div>
  );
}

// =======================================================
// MODAL SHELL
// =======================================================
function ModalShell({ title, onClose, children, size = "md" }: { title: string; onClose: () => void; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : size === "xl" ? "max-w-5xl" : "max-w-xl";
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[92vh] overflow-hidden flex flex-col`}>
        <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, danger, onCancel, onConfirm }: { title: string; message: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ModalShell title={title} onClose={onCancel} size="sm">
      <p className="text-sm text-slate-700 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm">Batal</button>
        <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white font-semibold text-sm ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}>{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}

// =======================================================
// PROGRAM DETAIL MODAL
// =======================================================
function ProgramDetailModal({ program, kategori, tahun, role, onClose, onEdit, onDelete, onPreview, onAddFile, onRemoveFile }: { program: Program; kategori?: Kategori; tahun?: TahunAjaran; role: Role; onClose: () => void; onEdit: () => void; onDelete: () => void; onPreview: (f: FileItem) => void; onAddFile: () => void; onRemoveFile: (f: FileItem) => void }) {
  const isAdmin = role === "admin";
  return (
    <ModalShell title="Detail Program" onClose={onClose} size="lg">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-sm ${kategori ? `bg-${kategori.warna}-100 text-${kategori.warna}-700` : "bg-slate-100 text-slate-600"}`}></div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{program.judul}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {kategori && <Badge color={kategori.warna}>{kategori.nama}</Badge>}
            <Badge color="slate">TA {tahun?.tahun || program.tahunAjaranId}</Badge>
            <Badge color="slate">{program.semester}</Badge>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">{program.files.length} file</span>
          </div>
        </div>
      </div>
      {program.keterangan && <p className="text-sm text-slate-600 mb-4 bg-slate-50 rounded-lg p-3">{program.keterangan}</p>}

      <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <p className="font-semibold text-sm text-slate-700">File dalam Program Ini ({program.files.length})</p>
        </div>
        {program.files.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">Belum ada file.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {program.files.map(f => (
              <div key={f.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                <TypeIcon tipe={f.tipeFile} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{f.namaFile}</p>
                  <p className="text-xs text-slate-500">{f.tipeFile.toUpperCase()} · {formatBytes(f.ukuran)}{f.keterangan ? ` · ${f.keterangan}` : ""}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => onPreview(f)} className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">👁 Lihat</button>
                  <a href={f.dataUrl} download={f.namaFile} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"></a>
                  {isAdmin && <button onClick={() => onRemoveFile(f)} className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium" title="Hapus file ini">🗑</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 mb-4 bg-slate-50 rounded-lg p-3">
        <p><b>Dibuat:</b> {new Date(program.tanggalDibuat).toLocaleString("id-ID")} oleh {program.createdBy}</p>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
        <button onClick={onAddFile} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700">+ Tambah File</button>
        <a href="#" onClick={(e) => { e.preventDefault(); program.files.forEach(f => { const a = document.createElement("a"); a.href = f.dataUrl; a.download = f.namaFile; a.click(); }); }} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700">⬇ Download Semua</a>
        {isAdmin && <>
          <button onClick={onEdit} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600">✏ Edit Program</button>
          <button onClick={onDelete} className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700">🗑 Hapus Program</button>
        </>}
        <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-100">Tutup</button>
      </div>
    </ModalShell>
  );
}

// =======================================================
// PROGRAM FORM MODAL (Create/Edit)
// =======================================================
function ProgramFormModal({ program, onClose, onSaved, kategori, tahunList }: { program?: Program; onClose: () => void; onSaved: () => void; kategori: Kategori[]; tahunList: TahunAjaran[] }) {
  const [judul, setJudul] = useState(program?.judul || "");
  const [kategoriId, setKategoriId] = useState(program?.kategoriId || (kategori[0]?.id || ""));
  const [tahunAjaranId, setTahunAjaranId] = useState(program?.tahunAjaranId || (tahunList.find(t => t.aktif)?.id || ""));
  const [semester, setSemester] = useState(program?.semester || "Ganjil");
  const [keterangan, setKeterangan] = useState(program?.keterangan || "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (program) {
      updateProgram(program.id, { judul: judul.trim(), kategoriId, tahunAjaranId, semester, keterangan: keterangan.trim() });
    } else {
      addProgram({
        id: uid(), judul: judul.trim(), kategoriId, tahunAjaranId, semester, keterangan: keterangan.trim(),
        files: [], tanggalDibuat: new Date().toISOString(), createdBy: "burnitelong",
      });
    }
    onSaved();
  };

  return (
    <ModalShell title={program ? "Edit Program" : "Program Baru"} onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Judul Program *</label>
          <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. Program MPLS 2024" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori *</label>
            <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran *</label>
            <select value={tahunAjaranId} onChange={(e) => setTahunAjaranId(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {tahunList.map(t => <option key={t.id} value={t.id}>{t.tahun}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester *</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value as "Ganjil" | "Genap")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Ganjil</option><option>Genap</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
          <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Deskripsi program..." />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm">Batal</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg">{program ? "Simpan Perubahan" : "Buat Program"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

// =======================================================
// UPLOAD FILE MODAL (tambah file ke program yang sudah ada)
// =======================================================
function UploadFileModal({ program, onClose, onSaved, user }: { program: Program | null; onClose: () => void; onSaved: () => void; user: User }) {
  const [programId, setProgramId] = useState(program?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const programs = program ? [program] : getPrograms();

  const pickFile = (f: File | null) => {
    setError("");
    if (!f) return setFile(null);
    const tipe = detectTipe(f);
    if (!tipe) { setError("Format file tidak didukung. Gunakan PDF, Word, Excel, atau JPG/PNG."); return; }
    if (tipe === "image") { if (f.size > MAX_IMG_SIZE) { setError(`Ukuran gambar maksimal 100 KB. File ini ${formatBytes(f.size)}.`); return; } }
    else { if (f.size > MAX_DOC_SIZE) { setError(`Ukuran dokumen maksimal 3 MB. File ini ${formatBytes(f.size)}.`); return; } }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Pilih file terlebih dahulu."); return; }
    if (!programId) { setError("Pilih program terlebih dahulu."); return; }
    setError(""); setLoading(true);
    try {
      const tipe = detectTipe(file)!;
      const dataUrl = await fileToDataUrl(file);
      addFileToProgram(programId, {
        id: uid(), namaFile: file.name, tipeFile: tipe, ukuran: file.size, dataUrl,
        tanggalUpload: new Date().toISOString(), uploader: user.username, keterangan: keterangan.trim(),
      });
      onSaved();
    } catch (err) { setError("Gagal menyimpan file."); }
    setLoading(false);
  };

  return (
    <ModalShell title={program ? `Upload File ke "${program.judul}"` : "Upload File ke Program"} onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        {!program && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Program Tujuan *</label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih program --</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.judul}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">File *</label>
          <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
            {file ? (
              <div className="flex items-center justify-center gap-3"><span className="text-2xl"></span><div className="text-left"><p className="font-medium text-slate-800 text-sm">{file.name}</p><p className="text-xs text-slate-500">{formatBytes(file.size)}</p></div></div>
            ) : (
              <><div className="text-3xl mb-2">⬆</div><p className="font-medium text-slate-700 text-sm">Klik untuk memilih file</p><p className="text-xs text-slate-500 mt-1">PDF, Word, Excel (max 3 MB) · JPG/PNG (max 100 KB)</p></>
            )}
            <input ref={inputRef} type="file" hidden onChange={(e) => pickFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/jpg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan File (opsional)</label>
          <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. Daftar hadir hari ke-3" />
        </div>
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm">Batal</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg disabled:opacity-60">{loading ? "Mengupload..." : "Upload File"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

// =======================================================
// KELOLA KATEGORI (CRUD)
// =======================================================
function KategoriManager({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [items, setItems] = useState<Kategori[]>(getKategori());
  const [newNama, setNewNama] = useState("");
  const [newWarna, setNewWarna] = useState<Kategori["warna"]>("blue");

  const tambah = () => {
    if (!newNama.trim()) return;
    const newItem: Kategori = { id: "k_" + Date.now().toString(36), nama: newNama.trim(), warna: newWarna };
    const updated = [...items, newItem];
    setItems(updated); saveKategori(updated);
    setNewNama("");
  };
  const hapus = (id: string) => {
    if (!confirm("Yakin hapus kategori ini? Program yang menggunakan kategori ini tidak akan terhapus, tapi kategorinya akan hilang.")) return;
    const updated = items.filter(k => k.id !== id);
    setItems(updated); saveKategori(updated);
  };

  return (
    <ModalShell title="Kelola Kategori" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
           Tambah, edit (hapus + tambah baru), atau hapus kategori untuk program arsip.
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {items.length === 0 ? <div className="p-4 text-center text-sm text-slate-500">Belum ada kategori.</div> :
            <div className="divide-y divide-slate-100">
              {items.map(k => (
                <div key={k.id} className="px-4 py-3 flex items-center gap-3">
                  <Badge color={k.warna}>{k.nama}</Badge>
                  <span className="text-xs text-slate-500 flex-1">ID: {k.id}</span>
                  <button onClick={() => hapus(k.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium">🗑 Hapus</button>
                </div>
              ))}
            </div>
          }
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="font-semibold text-sm text-slate-700 mb-2">Tambah Kategori Baru</p>
          <div className="flex gap-2">
            <input type="text" value={newNama} onChange={(e) => setNewNama(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nama kategori (mis. Daftar Hadir)" />
            <select value={newWarna} onChange={(e) => setNewWarna(e.target.value as Kategori["warna"])} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="blue">Biru</option><option value="rose">Merah</option><option value="emerald">Hijau</option><option value="amber">Kuning</option><option value="violet">Ungu</option><option value="slate">Abu-abu</option>
            </select>
            <button onClick={tambah} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700">Tambah</button>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button onClick={() => { onSaved(); onClose(); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">Selesai</button>
        </div>
      </div>
    </ModalShell>
  );
}

// =======================================================
// KELOLA TAHUN AJARAN (CRUD)
// =======================================================
function TahunManager({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [items, setItems] = useState<TahunAjaran[]>(doGetTahun());
  const [newTahun, setNewTahun] = useState("");

  const tambah = () => {
    if (!newTahun.trim() || !/^\d{4}\/\d{4}$/.test(newTahun.trim())) { alert("Format harus: 2024/2025"); return; }
    const newItem: TahunAjaran = { id: "t_" + Date.now().toString(36), tahun: newTahun.trim(), aktif: true };
    const updated = [...items, newItem];
    setItems(updated); saveTahun(updated);
    setNewTahun("");
  };
  const toggleAktif = (id: string) => {
    const updated = items.map(t => t.id === id ? { ...t, aktif: !t.aktif } : t);
    setItems(updated); saveTahun(updated);
  };
  const hapus = (id: string) => {
    if (!confirm("Yakin hapus tahun ajaran ini? Program di tahun ajaran ini tidak akan terhapus, tapi tahunnya tidak akan muncul di filter.")) return;
    const updated = items.filter(t => t.id !== id);
    setItems(updated); saveTahun(updated);
  };

  return (
    <ModalShell title="Kelola Tahun Ajaran" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
           Tambah atau hapus tahun ajaran. Tahun yang "Aktif" akan muncul di filter dashboard.
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {items.length === 0 ? <div className="p-4 text-center text-sm text-slate-500">Belum ada tahun ajaran.</div> :
            <div className="divide-y divide-slate-100">
              {items.map(t => (
                <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">TA {t.tahun}</p>
                    <p className="text-xs text-slate-500">ID: {t.id} · {t.aktif ? "Aktif" : "Tidak aktif"}</p>
                  </div>
                  <button onClick={() => toggleAktif(t.id)} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${t.aktif ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {t.aktif ? "✓ Aktif" : "Nonaktif"}
                  </button>
                  <button onClick={() => hapus(t.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium">🗑 Hapus</button>
                </div>
              ))}
            </div>
          }
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="font-semibold text-sm text-slate-700 mb-2">Tambah Tahun Ajaran Baru</p>
          <div className="flex gap-2">
            <input type="text" value={newTahun} onChange={(e) => setNewTahun(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Format: 2025/2026" />
            <button onClick={tambah} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700">Tambah</button>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button onClick={() => { onSaved(); onClose(); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">Selesai</button>
        </div>
      </div>
    </ModalShell>
  );
}

// =======================================================
// BACKUP & RESTORE MODAL
// =======================================================
function BackupRestoreModal({ onClose, onRestored }: { onClose: () => void; onRestored: () => void }) {
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => ({
    programs: getPrograms().length,
    files: getPrograms().reduce((s, p) => s + p.files.length, 0),
    kategori: getKategori().length,
    tahun: doGetTahun().length,
  }), []);

  // Backup: download JSON
  const doBackup = () => {
    const data = {
      version: "1.0",
      school: "SMP Negeri 1 Bukit",
      exportDate: new Date().toISOString(),
      kategori: getKategori(),
      tahunAjaran: doGetTahun(),
      programs: getPrograms(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `backup_arsip_kurikulum_${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setInfo("Backup berhasil didownload. Simpan file di tempat aman!");
  };

  // Backup: download SQL (teks schema + data)
  const doBackupSQL = () => {
    const kategori = getKategori();
    const tahun = doGetTahun();
    const programs = getPrograms();
    const lines: string[] = [];
    lines.push("-- Backup Arsip Kurikulum SMP Negeri 1 Bukit");
    lines.push(`-- Tanggal: ${new Date().toISOString()}`);
    lines.push("");
    lines.push("-- Kategori");
    kategori.forEach(k => {
      lines.push(`INSERT INTO kategori (nama, warna) VALUES ('${k.nama.replace(/'/g, "''")}', '${k.warna}');`);
    });
    lines.push("");
    lines.push("-- Tahun Ajaran");
    tahun.forEach(t => {
      lines.push(`INSERT INTO tahun_ajaran (tahun, aktif) VALUES ('${t.tahun}', ${t.aktif ? 1 : 0});`);
    });
    lines.push("");
    lines.push("-- Programs");
    programs.forEach(p => {
      const judul = p.judul.replace(/'/g, "''");
      const ket = (p.keterangan || "").replace(/'/g, "''");
      lines.push(`-- Program: ${p.judul} (${p.files.length} files)`);
      lines.push(`INSERT INTO program (judul, kategori_id, tahun_ajaran_id, semester, keterangan, created_by) VALUES ('${judul}', (SELECT id FROM kategori WHERE nama='${(getKategori().find(k=>k.id===p.kategoriId)?.nama||'Lainnya').replace(/'/g,"''")}'), (SELECT id FROM tahun_ajaran WHERE tahun='${(doGetTahun().find((t: any)=>t.id===p.tahunAjaranId)?.tahun||'')}'), '${p.semester}', '${ket}', '${p.createdBy}');`);
      p.files.forEach(f => {
        const fn = f.namaFile.replace(/'/g, "''");
        const ket2 = (f.keterangan || "").replace(/'/g, "''");
        lines.push(`INSERT INTO file_arsip (nama_file_asli, tipe_file, ukuran, keterangan, uploader) VALUES ('${fn}', '${f.tipeFile}', ${f.ukuran}, '${ket2}', '${f.uploader}');`);
      });
    });

    const blob = new Blob([lines.join("\n")], { type: "application/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `backup_arsip_kurikulum_${date}.sql`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setInfo("Backup SQL berhasil didownload. File ini untuk referensi, gunakan JSON untuk restore.");
  };

  // Restore from JSON
  const pickFile = (f: File | null) => {
    setError(""); setInfo("");
    if (!f) return setRestoreFile(null);
    setRestoreFile(f);
  };

  const doRestore = async () => {
    if (!restoreFile) { setError("Pilih file backup terlebih dahulu."); return; }
    if (!confirm("Yakin restore? Data saat ini akan diganti dengan data dari file backup. Pastikan file backup benar!")) return;

    setLoading(true); setError(""); setInfo("");
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      if (!data.version || !Array.isArray(data.kategori) || !Array.isArray(data.programs)) {
        throw new Error("Format file backup tidak valid.");
      }
      saveKategori(data.kategori);
      saveTahun(data.tahunAjaran || []);
      savePrograms(data.programs);
      setInfo(`Restore berhasil! ${data.programs.length} program, ${(data.programs as any[]).reduce((s,p) => s + (p.files?.length||0), 0)} file.`);
      setRestoreFile(null);
      setTimeout(() => onRestored(), 1500);
    } catch (err: any) {
      setError(err.message || "Gagal memproses file backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Backup & Restore Data" onClose={onClose} size="md">
      <div className="space-y-5">
        {/* Info data saat ini */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="font-semibold text-sm text-slate-700 mb-2">Data Saat Ini:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-500">Program:</span> <b>{stats.programs}</b></div>
            <div><span className="text-slate-500">Total File:</span> <b>{stats.files}</b></div>
            <div><span className="text-slate-500">Kategori:</span> <b>{stats.kategori}</b></div>
            <div><span className="text-slate-500">Tahun Ajaran:</span> <b>{stats.tahun}</b></div>
          </div>
        </div>

        {/* Backup */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-2"> Backup Data</h3>
          <p className="text-xs text-slate-500 mb-3">Download semua data (program, file metadata, kategori, tahun ajaran) untuk disimpan di tempat aman. File fisik (PDF/gambar) tidak termasuk — backup folder <code>uploads/</code> secara terpisah.</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={doBackup} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg"> Download Backup (.json)</button>
            <button onClick={doBackupSQL} className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm hover:bg-emerald-200"> Download SQL (.sql)</button>
          </div>
        </div>

        {/* Restore */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-slate-800 mb-2"> Restore Data</h3>
          <p className="text-xs text-rose-600 mb-3"> Restoring akan <b>mengganti semua data saat ini</b> dengan data dari file backup. Pastikan file backup benar sebelum restore!</p>
          <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
            {restoreFile ? (
              <div className="flex items-center justify-center gap-3"><span className="text-2xl"></span><div className="text-left"><p className="font-medium text-slate-800 text-sm">{restoreFile.name}</p><p className="text-xs text-slate-500">{formatBytes(restoreFile.size)}</p></div></div>
            ) : (
              <><div className="text-3xl mb-2">⬆</div><p className="font-medium text-slate-700 text-sm">Klik untuk memilih file backup (.json)</p><p className="text-xs text-slate-500 mt-1">Hanya file JSON dari fitur backup yang didukung</p></>
            )}
            <input ref={inputRef} type="file" hidden accept=".json" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
          </div>
          {error && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          {info && <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-lg">{info}</div>}
          <div className="flex justify-end mt-3">
            <button onClick={doRestore} disabled={!restoreFile || loading} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50">
              {loading ? "Merestore..." : " Restore Sekarang"}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <b> Catatan Penting:</b>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Backup JSON berisi metadata (nama file, ukuran, keterangan) — <b>bukan file fisik</b></li>
            <li>Untuk backup lengkap, salin juga folder <code>uploads/</code> ke tempat aman</li>
            <li>Simpan backup di minimal 2 tempat (komputer + cloud)</li>
            <li>Disarankan backup rutin setiap bulan atau sebelum perubahan besar</li>
          </ul>
        </div>
      </div>
    </ModalShell>
  );
}

// =======================================================
// ROOT APP
// =======================================================
export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void initStorage().then(() => setUser(getSession()));
  }, []);

  if (!user) return <LoginScreen onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => { setSession(null); setUser(null); }} />;
}
