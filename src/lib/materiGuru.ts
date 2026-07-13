// Daftar template "Materi Guru" (jadwal, nilai, presensi, dst.) yang bisa
// diunduh langsung dari /materi. File fisiknya statis di public/materi/,
// dibuat sekali lewat scripts/generate-materi.mjs (lihat file itu untuk
// struktur & rumus tiap template) -- bukan digenerate on-demand per user.
export interface MateriItem {
  slug: string;
  title: string;
  desc: string;
  format: "xlsx" | "docx";
  fileName: string;
  category: string;
}

export const MATERI_GURU: MateriItem[] = [
  {
    slug: "jadwal-pelajaran",
    title: "Jadwal Pelajaran",
    desc: "Grid jadwal mengajar mingguan siap isi — tinggal cetak dan tempel di kelas",
    format: "xlsx",
    fileName: "jadwal-pelajaran.xlsx",
    category: "Administrasi Kelas",
  },
  {
    slug: "daftar-nilai-otomatis",
    title: "Daftar Nilai Otomatis",
    desc: "Input nilai tugas & ujian, rata-rata dan status tuntas/belum tuntas terhitung otomatis",
    format: "xlsx",
    fileName: "daftar-nilai-otomatis.xlsx",
    category: "Penilaian",
  },
  {
    slug: "format-presensi",
    title: "Format Presensi",
    desc: "Rekap kehadiran siswa harian selama sebulan penuh dalam satu tabel",
    format: "xlsx",
    fileName: "format-presensi.xlsx",
    category: "Administrasi Kelas",
  },
  {
    slug: "kalender-pendidikan",
    title: "Kalender Pendidikan",
    desc: "Catat hari efektif, libur, dan kegiatan penting sepanjang tahun ajaran",
    format: "xlsx",
    fileName: "kalender-pendidikan.xlsx",
    category: "Perencanaan Mengajar",
  },
  {
    slug: "buku-induk-siswa",
    title: "Buku Induk Siswa",
    desc: "Data identitas lengkap tiap siswa, rapi dalam satu buku digital",
    format: "xlsx",
    fileName: "buku-induk-siswa.xlsx",
    category: "Kesiswaan",
  },
  {
    slug: "daftar-hadir",
    title: "Daftar Hadir Rapat/Kegiatan",
    desc: "Lembar tanda tangan siap pakai untuk rapat, workshop, atau kegiatan sekolah",
    format: "docx",
    fileName: "daftar-hadir.docx",
    category: "Administrasi Kelas",
  },
  {
    slug: "program-tahunan",
    title: "Program Tahunan (Prota)",
    desc: "Susun rencana materi setahun penuh per semester dengan alokasi waktu jelas",
    format: "docx",
    fileName: "program-tahunan.docx",
    category: "Perencanaan Mengajar",
  },
  {
    slug: "program-semester",
    title: "Program Semester (Promes)",
    desc: "Pecah materi per bulan supaya progres mengajar sesuai target semester",
    format: "docx",
    fileName: "program-semester.docx",
    category: "Perencanaan Mengajar",
  },
  {
    slug: "agenda-harian-mengajar",
    title: "Agenda Harian Mengajar",
    desc: "Catatan harian materi, kegiatan, dan siswa tidak hadir — rapi per pertemuan",
    format: "docx",
    fileName: "agenda-harian-mengajar.docx",
    category: "Perencanaan Mengajar",
  },
];
