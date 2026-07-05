// Bentuk hasil AI untuk masing-masing tool di src/components/tools/** dan
// route generator terkait di src/app/api/generate-*/. Model diminta
// mengembalikan JSON persis sesuai bentuk ini (lihat prompt di tiap route).

export interface RppResult {
  judul: string;
  tujuan_pembelajaran: string[];
  kegiatan_pendahuluan: string[];
  kegiatan_inti: string[];
  kegiatan_penutup: string[];
  penilaian: string[];
  sumber_belajar: string[];
}

export interface AnalisisSoalItem {
  nomor: number;
  kategori: string;
  tingkat_kesulitan: string;
  catatan_validitas: string;
  saran_perbaikan: string;
}

export interface AnalisisSoalResult {
  ringkasan: string;
  analisis: AnalisisSoalItem[];
}

export interface FlashcardResult {
  judul: string;
  kartu: { depan: string; belakang: string }[];
}

export interface RubrikResult {
  judul: string;
  levels: string[];
  kriteria: { nama: string; deskriptor: string[] }[];
}

export interface SilabusResult {
  judul: string;
  kompetensi_inti: string[];
  kompetensi_dasar: { kd: string; materi_pokok: string }[];
}
