// Daftar tool di toolbar "Alat Bantu Guru" (LembarGuruApp.tsx) dan sumber
// judul/deskripsi untuk halaman /tools/[slug] — satu sumber kebenaran supaya
// keduanya tidak bisa saling tidak sinkron.
export interface ToolItem {
  slug: string;      // dipakai sebagai path /tools/{slug} DAN sebagai key ikon di ToolIcon.tsx
  label: string;
  desc: string;       // muncul sebagai tooltip di toolbar & subjudul di halaman tool
  isNew?: boolean;     // badge "BARU" untuk tool tambahan di luar draft awal
}

// Ikon dirender lewat <ToolIcon slug={...} /> (SVG garis, ikut warna tema),
// bukan emoji lagi -- lihat src/components/tools/ToolIcon.tsx.
export const TEACHER_TOOLS: ToolItem[] = [
  // ── sesuai draft awal ──
  { slug: "generator-rpp",     label: "Generator RPP",     desc: "Buat RPP / modul ajar otomatis" },
  { slug: "bank-soal",         label: "Bank Soal",         desc: "Simpan & kelola koleksi soal" },
  { slug: "analisis-soal",     label: "Analisis Soal",     desc: "Analisis tingkat kesulitan & validitas soal" },
  { slug: "silabus-ki-kd",     label: "Silabus & KI/KD",   desc: "Susun silabus dan pemetaan KI/KD" },
  { slug: "flashcard",         label: "Flashcard",         desc: "Buat kartu belajar interaktif" },
  { slug: "rubrik-penilaian",  label: "Rubrik Penilaian",  desc: "Buat rubrik penilaian tugas/proyek" },
  { slug: "acak-nama-siswa",   label: "Acak Nama Siswa",   desc: "Pilih nama siswa secara acak" },
  { slug: "bagi-kelompok",     label: "Bagi Kelompok",     desc: "Bagi siswa ke dalam kelompok otomatis" },
  { slug: "jadwal-mengajar",   label: "Jadwal Mengajar",   desc: "Kelola jadwal & pengingat mengajar" },
  { slug: "konversi-nilai",    label: "Konversi Nilai",    desc: "Konversi skor ke skala nilai/huruf" },
  // ── tool tambahan ──
  { slug: "timer-kelas",       label: "Timer Kelas",       desc: "Pengatur waktu untuk aktivitas/ujian di kelas", isNew: false },
  { slug: "papan-poin",        label: "Papan Poin Kelas",  desc: "Papan skor gamifikasi untuk memotivasi siswa", isNew: false },
  { slug: "presensi-digital",  label: "Presensi Digital",  desc: "Absensi siswa harian, disimpan di perangkat ini", isNew: false },
  { slug: "generator-sertifikat", label: "Sertifikat",     desc: "Buat sertifikat/piagam penghargaan siswa", isNew: false },
  { slug: "text-to-speech",    label: "Baca Teks (TTS)",   desc: "Ubah teks/cerita jadi audio untuk siswa", isNew: false },
  { slug: "catatan-siswa",     label: "Catatan Siswa",     desc: "Catat perkembangan & perilaku siswa per individu", isNew: false },
  { slug: "kalkulator-nilai",  label: "Kalkulator Nilai",  desc: "Hitung rata-rata nilai berbobot & ketuntasan (KKM)", isNew: false },
  { slug: "ice-breaker",       label: "Ice Breaker",       desc: "Ide game & energizer singkat untuk kelas", isNew: false },
];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TEACHER_TOOLS.find((t) => t.slug === slug);
}
