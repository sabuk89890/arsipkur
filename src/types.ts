export type Role = "admin" | "guru";

export interface User {
  username: string;
  password: string;
  nama: string;
  role: Role;
}

export interface Kategori {
  id: string;
  nama: string;
  warna: "blue" | "rose" | "emerald" | "amber" | "violet" | "slate";
}

export interface TahunAjaran {
  id: string;
  tahun: string; // "2024/2025"
  aktif: boolean;
}

export interface FileItem {
  id: string;
  namaFile: string;
  tipeFile: "pdf" | "doc" | "docx" | "xls" | "xlsx" | "image";
  ukuran: number;
  dataUrl: string; // base64 (demo); PHP: path file
  tanggalUpload: string;
  uploader: string;
  keterangan?: string;
}

export interface Program {
  id: string;
  judul: string;
  kategoriId: string;
  tahunAjaranId: string; // referensi ke TahunAjaran.id
  semester: "Ganjil" | "Genap";
  keterangan: string;
  files: FileItem[];
  tanggalDibuat: string;
  createdBy: string;
}

export const DEFAULT_KATEGORI: Kategori[] = [
  { id: "sk", nama: "SK", warna: "rose" },
  { id: "program", nama: "Program", warna: "emerald" },
  { id: "foto", nama: "Foto Kegiatan", warna: "amber" },
  { id: "laporan", nama: "Laporan", warna: "blue" },
  { id: "daftar_hadir", nama: "Daftar Hadir", warna: "violet" },
  { id: "lainnya", nama: "Lainnya", warna: "slate" },
];

export const DEFAULT_TAHUN: TahunAjaran[] = [
  { id: "t1", tahun: "2025/2026", aktif: true },
  { id: "t2", tahun: "2024/2025", aktif: true },
  { id: "t3", tahun: "2023/2024", aktif: true },
  { id: "t4", tahun: "2022/2023", aktif: false },
];
