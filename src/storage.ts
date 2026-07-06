import type { FileItem, Kategori, Program, TahunAjaran, User } from "./types";
import { DEFAULT_KATEGORI, DEFAULT_TAHUN } from "./types";
import { isSupabaseEnabled, loadFromSupabase, syncToSupabase } from "./supabaseStorage";

const USERS_KEY = "arsip_users";
const PROGRAMS_KEY = "arsip_programs";
const KATEGORI_KEY = "arsip_kategori";
const TAHUN_KEY = "arsip_tahun";
const SESSION_KEY = "arsip_session";

const STORAGE_KEYS = [USERS_KEY, PROGRAMS_KEY, KATEGORI_KEY, TAHUN_KEY, SESSION_KEY] as const;
const memoryStore: Record<string, unknown> = {};

export const DEFAULT_USERS: User[] = [
  { username: "burnitelong", password: "10105158", nama: "Feri Kurniawan, M.Pd.", role: "admin" },
  { username: "gurusabuk", password: "10105158", nama: "Guru Sabuk (Guru)", role: "guru" },
];

export const MAX_DOC_SIZE = 3 * 1024 * 1024;
export const MAX_IMG_SIZE = 100 * 1024;

function getStoredValue<T>(key: string, fallback: T): T {
  if (memoryStore[key] !== undefined) return memoryStore[key] as T;

  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as T;
      memoryStore[key] = parsed;
      return parsed;
    } catch {
      localStorage.removeItem(key);
    }
  }

  memoryStore[key] = fallback;
  return fallback;
}

function setStoredValue<T>(key: string, value: T) {
  memoryStore[key] = value;
  localStorage.setItem(key, JSON.stringify(value));
  if (isSupabaseEnabled()) {
    void syncToSupabase({ [key]: value });
  }
}

function seed() {
  if (!getStoredValue(USERS_KEY, null)) setStoredValue(USERS_KEY, DEFAULT_USERS);
  if (!getStoredValue(KATEGORI_KEY, null)) setStoredValue(KATEGORI_KEY, DEFAULT_KATEGORI);
  if (!getStoredValue(TAHUN_KEY, null)) setStoredValue(TAHUN_KEY, DEFAULT_TAHUN);
  if (getStoredValue(PROGRAMS_KEY, null)) return;

  const samplePrograms: Program[] = [
    {
      id: "p1",
      judul: "Program MPLS 2024/2025",
      kategoriId: "program",
      tahunAjaranId: "t2",
      semester: "Ganjil",
      keterangan: "Program Masa Pengenalan Lingkungan Sekolah tahun ajaran 2024/2025 semester ganjil.",
      tanggalDibuat: new Date("2024-07-01").toISOString(),
      createdBy: "burnitelong",
      files: [
        {
          id: "f1", namaFile: "SK_MPLS_2024.pdf", tipeFile: "pdf", ukuran: 1240000,
          dataUrl: "", tanggalUpload: new Date("2024-07-02").toISOString(), uploader: "burnitelong",
          keterangan: "SK panitia MPLS",
        },
        {
          id: "f2", namaFile: "Daftar_Hadir_MPLS.xlsx", tipeFile: "xls", ukuran: 320000,
          dataUrl: "", tanggalUpload: new Date("2024-07-15").toISOString(), uploader: "burnitelong",
          keterangan: "Daftar hadir siswa hari ke-3",
        },
        {
          id: "f3", namaFile: "Foto_Kegiatan_MPLS.jpg", tipeFile: "image", ukuran: 85000,
          dataUrl: "", tanggalUpload: new Date("2024-07-16").toISOString(), uploader: "burnitelong",
          keterangan: "Foto kegiatan upacara pembukaan",
        },
        {
          id: "f4", namaFile: "Laporan_MPLS.docx", tipeFile: "doc", ukuran: 450000,
          dataUrl: "", tanggalUpload: new Date("2024-07-20").toISOString(), uploader: "burnitelong",
          keterangan: "Laporan pelaksanaan MPLS",
        },
      ],
    },
    {
      id: "p2",
      judul: "SK Tim Kurikulum 2024/2025",
      kategoriId: "sk",
      tahunAjaranId: "t2",
      semester: "Ganjil",
      keterangan: "Penetapan tim pengembang kurikulum sekolah.",
      tanggalDibuat: new Date("2024-07-10").toISOString(),
      createdBy: "burnitelong",
      files: [
        {
          id: "f5", namaFile: "SK_Tim_Kurikulum.pdf", tipeFile: "pdf", ukuran: 890000,
          dataUrl: "", tanggalUpload: new Date("2024-07-10").toISOString(), uploader: "burnitelong",
        },
      ],
    },
    {
      id: "p3",
      judul: "Program Kerja Kurikulum Semester Ganjil",
      kategoriId: "program",
      tahunAjaranId: "t2",
      semester: "Ganjil",
      keterangan: "Program kerja wakil kurikulum meliputi supervisi, rapat, dan pelatihan.",
      tanggalDibuat: new Date("2024-08-01").toISOString(),
      createdBy: "burnitelong",
      files: [
        {
          id: "f6", namaFile: "Proker_Kurikulum_Ganjil.docx", tipeFile: "doc", ukuran: 439500,
          dataUrl: "", tanggalUpload: new Date("2024-08-02").toISOString(), uploader: "burnitelong",
        },
        {
          id: "f7", namaFile: "Kalender_Pendidikan.xlsx", tipeFile: "xls", ukuran: 210000,
          dataUrl: "", tanggalUpload: new Date("2024-07-25").toISOString(), uploader: "burnitelong",
        },
      ],
    },
    {
      id: "p4",
      judul: "Supervisi Kelas Oktober 2024",
      kategoriId: "foto",
      tahunAjaranId: "t2",
      semester: "Ganjil",
      keterangan: "Dokumentasi supervisi kelas oleh wakil kurikulum.",
      tanggalDibuat: new Date("2024-10-10").toISOString(),
      createdBy: "burnitelong",
      files: [
        {
          id: "f8", namaFile: "Supervisi_Kelas_Okt2024_1.jpg", tipeFile: "image", ukuran: 92000,
          dataUrl: "", tanggalUpload: new Date("2024-10-12").toISOString(), uploader: "burnitelong",
        },
        {
          id: "f9", namaFile: "Supervisi_Kelas_Okt2024_2.jpg", tipeFile: "image", ukuran: 88000,
          dataUrl: "", tanggalUpload: new Date("2024-10-12").toISOString(), uploader: "burnitelong",
        },
        {
          id: "f10", namaFile: "Laporan_Supervisi.pdf", tipeFile: "pdf", ukuran: 650000,
          dataUrl: "", tanggalUpload: new Date("2024-10-15").toISOString(), uploader: "burnitelong",
          keterangan: "Laporan hasil supervisi",
        },
      ],
    },
    {
      id: "p5",
      judul: "Laporan Akhir Semester Genap 2023/2024",
      kategoriId: "laporan",
      tahunAjaranId: "t3",
      semester: "Genap",
      keterangan: "Laporan pelaksanaan program kurikulum semester genap.",
      tanggalDibuat: new Date("2024-06-15").toISOString(),
      createdBy: "burnitelong",
      files: [
        {
          id: "f11", namaFile: "Laporan_Akhir_2324_Genap.pdf", tipeFile: "pdf", ukuran: 2100000,
          dataUrl: "", tanggalUpload: new Date("2024-06-20").toISOString(), uploader: "burnitelong",
        },
        {
          id: "f12", namaFile: "Rekap_Absensi_Genap.xlsx", tipeFile: "xls", ukuran: 380000,
          dataUrl: "", tanggalUpload: new Date("2024-06-25").toISOString(), uploader: "burnitelong",
        },
      ],
    },
  ];

  setStoredValue(PROGRAMS_KEY, samplePrograms);
}

export async function initStorage() {
  seed();

  if (!isSupabaseEnabled()) return;

  const remoteData = await loadFromSupabase([...STORAGE_KEYS]);

  for (const key of STORAGE_KEYS) {
    const remoteValue = remoteData[key];
    if (remoteValue !== undefined) {
      setStoredValue(key, remoteValue as never);
    }
  }
}

export function getUsers(): User[] { return getStoredValue(USERS_KEY, [] as User[]); }
export function getKategori(): Kategori[] { return getStoredValue(KATEGORI_KEY, [] as Kategori[]); }
export function getTahun(): TahunAjaran[] { return getStoredValue(TAHUN_KEY, [] as TahunAjaran[]); }
export function getPrograms(): Program[] { return getStoredValue(PROGRAMS_KEY, [] as Program[]); }

export function saveKategori(k: Kategori[]) { setStoredValue(KATEGORI_KEY, k); }
export function saveTahun(t: TahunAjaran[]) { setStoredValue(TAHUN_KEY, t); }
export function savePrograms(p: Program[]) { setStoredValue(PROGRAMS_KEY, p); }

export function login(u: string, p: string): User | null {
  return getUsers().find((x) => x.username === u && x.password === p) || null;
}
export function getSession(): User | null {
  return getStoredValue(SESSION_KEY, null as User | null);
}
export function setSession(u: User | null) {
  if (u) setStoredValue(SESSION_KEY, u);
  else {
    memoryStore[SESSION_KEY] = null;
    localStorage.removeItem(SESSION_KEY);
    if (isSupabaseEnabled()) void syncToSupabase({ [SESSION_KEY]: null });
  }
}

// --- Program CRUD ---
export function addProgram(p: Program) {
  const all = getPrograms();
  all.push(p);
  savePrograms(all);
}
export function updateProgram(id: string, patch: Partial<Program>) {
  savePrograms(getPrograms().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}
export function deleteProgram(id: string) {
  savePrograms(getPrograms().filter((p) => p.id !== id));
}
export function addFileToProgram(programId: string, file: FileItem) {
  const all = getPrograms().map((p) => (p.id === programId ? { ...p, files: [...p.files, file] } : p));
  savePrograms(all);
}
export function removeFileFromProgram(programId: string, fileId: string) {
  const all = getPrograms().map((p) => (p.id === programId ? { ...p, files: p.files.filter((f) => f.id !== fileId) } : p));
  savePrograms(all);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

export function uid(): string {
  return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function detectTipe(file: File): FileItem["tipeFile"] | null {
  const m = file.type;
  if (m === "application/pdf") return "pdf";
  if (m === "application/msword") return "doc";
  if (m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (m === "application/vnd.ms-excel") return "xls";
  if (m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
  if (["image/jpeg", "image/png", "image/jpg"].includes(m)) return "image";
  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/jpg",
];
