import { useState } from "react";
import type { FileItem } from "./types";
import { formatBytes } from "./storage";

export const LOGO_URL = "https://iili.io/Cn2LE7a.png";
export const SCHOOL_NAME = "SMP Negeri 1 Bukit";
export const SCHOOL_ADDRESS = "Jln. Masjid Babussalam, Simpang Tiga, Redelong";

export function SchoolLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-10 h-10";
  const fontSize = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  if (failed) {
    return (
      <div className={`${dim} rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center ${fontSize}`}>
        
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      <img
        src={LOGO_URL}
        alt="Logo SMP Negeri 1 Bukit"
        className="w-full h-full object-contain p-1"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function SchoolTitle() {
  return (
    <div>
      <h1 className="font-bold text-slate-800 leading-tight">{SCHOOL_NAME}</h1>
      <p className="text-xs text-slate-500 leading-tight">{SCHOOL_ADDRESS}</p>
      <p className="text-[10px] text-slate-400 leading-tight">Wakil Kepala Sekolah Bidang Kurikulum</p>
    </div>
  );
}

/**
 * Modal untuk preview satu file (PDF, gambar, Word/Excel)
 */
export function PreviewModal({
  file,
  programJudul,
  onClose,
}: {
  file: FileItem;
  programJudul?: string;
  onClose: () => void;
}) {
  const [loadError, setLoadError] = useState(false);

  const isPdf = file.tipeFile === "pdf";
  const isImage = file.tipeFile === "image";
  const isDoc = file.tipeFile === "doc" || file.tipeFile === "docx";
  const isXls = file.tipeFile === "xls" || file.tipeFile === "xlsx";

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-3 flex items-center gap-3 bg-white flex-shrink-0">
          <SchoolLogo size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{SCHOOL_NAME}</p>
            <p className="text-[10px] text-slate-500 leading-tight truncate">
              {SCHOOL_ADDRESS} · Preview Dokumen
              {programJudul ? ` · ${programJudul}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.dataUrl}
              download={file.namaFile}
              className="text-xs px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
            >
              ⬇ Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* File info bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center gap-3 text-xs flex-shrink-0 flex-wrap">
          <span className="font-semibold text-slate-700 truncate">{file.namaFile}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 uppercase font-semibold">{file.tipeFile}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">{formatBytes(file.ukuran)}</span>
        </div>

        {/* Preview area */}
        <div className="flex-1 bg-slate-100 overflow-hidden">
          {isPdf && file.dataUrl && !loadError && (
            <iframe src={file.dataUrl} title={file.namaFile} className="w-full h-full border-0" onError={() => setLoadError(true)} />
          )}
          {isPdf && loadError && <PreviewFallback tipe="PDF" message="Tidak dapat memuat PDF. Silakan download untuk melihat." />}

          {isImage && file.dataUrl && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={file.dataUrl}
                alt={file.namaFile}
                className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                onError={() => setLoadError(true)}
              />
            </div>
          )}
          {isImage && loadError && <PreviewFallback tipe="Gambar" message="Gambar tidak dapat dimuat." />}

          {(isDoc || isXls) && file.dataUrl && (
            <div className="w-full h-full flex flex-col">
              <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2">
                 <b>Tips:</b> Untuk preview Word/Excel yang lebih baik, gunakan versi PHP di server. Atau download untuk buka di aplikasi lokal.
              </div>
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(file.dataUrl)}&embedded=true`}
                title={file.namaFile}
                className="w-full flex-1 border-0"
                onError={() => setLoadError(true)}
              />
              {loadError && <PreviewFallback tipe={isDoc ? "Word" : "Excel"} message="Preview tidak tersedia. Silakan download." />}
            </div>
          )}

          {!file.dataUrl && (
            <PreviewFallback
              tipe={file.tipeFile.toUpperCase()}
              message="Ini adalah data demo. Pada versi produksi (PHP), dokumen asli akan ditampilkan di sini."
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="text-xs text-slate-500">
            {file.keterangan && <span>{file.keterangan} · </span>}
            <span>Diupload {new Date(file.tanggalUpload).toLocaleString("id-ID")} oleh {file.uploader}</span>
          </div>
          <div className="flex gap-2">
            {isPdf && (
              <button onClick={() => setLoadError(false)} className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
                🔄 Muat Ulang
              </button>
            )}
            <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewFallback({ tipe, message }: { tipe: string; message: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4"></div>
      <h3 className="font-semibold text-slate-700 mb-2">Preview {tipe} Tidak Tersedia</h3>
      <p className="text-sm text-slate-500 max-w-md">{message}</p>
    </div>
  );
}
