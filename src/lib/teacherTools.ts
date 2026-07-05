// Daftar tool di toolbar "Alat Bantu Guru" (LembarGuruApp.tsx) dan sumber
// judul/deskripsi untuk halaman /tools/[slug] — satu sumber kebenaran supaya
// keduanya tidak bisa saling tidak sinkron.
export interface ToolItem {
  slug: string;      // dipakai sebagai path /tools/{slug}
  label: string;
  icon: string;
  desc: string;       // muncul sebagai tooltip di toolbar & subjudul di halaman tool
  isNew?: boolean;     // badge "BARU" untuk tool tambahan di luar draft awal
}

export const TEACHER_TOOLS: ToolItem[] = [
  // ── sesuai draft awal ──
  { slug: "generator-rpp",     label: "Generator RPP",     icon: "📝", desc: "Buat RPP / modul ajar otomatis" },
  { slug: "bank-soal",         label: "Bank Soal",         icon: "🗂️", desc: "Simpan & kelola koleksi soal" },
  { slug: "analisis-soal",     label: "Analisis Soal",     icon: "📊", desc: "Analisis tingkat kesulitan & validitas soal" },
  { slug: "silabus-ki-kd",     label: "Silabus & KI/KD",   icon: "📄", desc: "Susun silabus dan pemetaan KI/KD" },
  { slug: "flashcard",         label: "Flashcard",         icon: "🎴", desc: "Buat kartu belajar interaktif" },
  { slug: "rubrik-penilaian",  label: "Rubrik Penilaian",  icon: "✅", desc: "Buat rubrik penilaian tugas/proyek" },
  { slug: "acak-nama-siswa",   label: "Acak Nama Siswa",   icon: "🎲", desc: "Pilih nama siswa secara acak" },
  { slug: "bagi-kelompok",     label: "Bagi Kelompok",     icon: "👥", desc: "Bagi siswa ke dalam kelompok otomatis" },
  { slug: "jadwal-mengajar",   label: "Jadwal Mengajar",   icon: "📅", desc: "Kelola jadwal & pengingat mengajar" },
  { slug: "konversi-nilai",    label: "Konversi Nilai",    icon: "🔢", desc: "Konversi skor ke skala nilai/huruf" },
  // ── tool tambahan ──
  { slug: "timer-kelas",       label: "Timer Kelas",       icon: "⏱️", desc: "Pengatur waktu untuk aktivitas/ujian di kelas", isNew: true },
  { slug: "papan-poin",        label: "Papan Poin Kelas",  icon: "🏆", desc: "Papan skor gamifikasi untuk memotivasi siswa", isNew: true },
  { slug: "presensi-digital",  label: "Presensi Digital",  icon: "📲", desc: "Absensi siswa harian, disimpan di perangkat ini", isNew: true },
  { slug: "generator-sertifikat", label: "Sertifikat",     icon: "🏅", desc: "Buat sertifikat/piagam penghargaan siswa", isNew: true },
  { slug: "text-to-speech",    label: "Baca Teks (TTS)",   icon: "🔊", desc: "Ubah teks/cerita jadi audio untuk siswa", isNew: true },
  { slug: "catatan-siswa",     label: "Catatan Siswa",     icon: "📔", desc: "Catat perkembangan & perilaku siswa per individu", isNew: true },
  { slug: "kalkulator-nilai",  label: "Kalkulator Nilai",  icon: "🧮", desc: "Hitung rata-rata nilai berbobot & ketuntasan (KKM)", isNew: true },
  { slug: "ice-breaker",       label: "Ice Breaker",       icon: "🎉", desc: "Ide game & energizer singkat untuk kelas", isNew: true },
];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TEACHER_TOOLS.find((t) => t.slug === slug);
}
