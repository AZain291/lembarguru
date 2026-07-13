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
  { slug: "generator-rpp",     label: "Generator RPP",     desc: "RPP & modul ajar jadi dalam hitungan menit, bukan berjam-jam" },
  { slug: "bank-soal",         label: "Bank Soal",         desc: "Satu gudang soal, tinggal ambil kapan saja butuh" },
  { slug: "analisis-soal",     label: "Analisis Soal",     desc: "Tahu soal mana yang kelewat sulit sebelum diujikan ke siswa" },
  { slug: "silabus-ki-kd",     label: "Silabus & KI/KD",   desc: "Susun silabus & pemetaan KI/KD tanpa pusing urusan format" },
  { slug: "flashcard",         label: "Flashcard",         desc: "Bikin sesi hafalan jadi seru lewat kartu belajar interaktif" },
  { slug: "rubrik-penilaian",  label: "Rubrik Penilaian",  desc: "Nilai tugas & proyek jadi lebih adil dan transparan" },
  { slug: "acak-nama-siswa",   label: "Acak Nama Siswa",   desc: "Adil tanpa drama — pilih siswa maju secara acak" },
  { slug: "bagi-kelompok",     label: "Bagi Kelompok",     desc: "Bagi siswa ke kelompok belajar sekali klik, tanpa ribut" },
  { slug: "jadwal-mengajar",   label: "Jadwal Mengajar",   desc: "Jadwal & pengingat mengajar rapi, tidak ada lagi kelas kelewat" },
  { slug: "konversi-nilai",    label: "Konversi Nilai",    desc: "Ubah skor jadi skala nilai/huruf secara instan" },
  // ── tool tambahan ──
  { slug: "timer-kelas",       label: "Timer Kelas",       desc: "Atur waktu ujian & aktivitas kelas biar tidak molor", isNew: false },
  { slug: "papan-poin",        label: "Papan Poin Kelas",  desc: "Bikin siswa makin semangat lewat papan skor gamifikasi", isNew: false },
  { slug: "presensi-digital",  label: "Presensi Digital",  desc: "Absen harian siswa, rapi tanpa kertas dan tanpa ribet", isNew: false },
  { slug: "generator-sertifikat", label: "Sertifikat",     desc: "Cetak sertifikat & piagam penghargaan siswa dalam sekejap", isNew: false },
  { slug: "text-to-speech",    label: "Baca Teks (TTS)",   desc: "Ubah teks/cerita jadi suara, biar siswa bisa sambil dengar", isNew: false },
  { slug: "catatan-siswa",     label: "Catatan Siswa",     desc: "Rekam perkembangan & perilaku tiap siswa, rapi per individu", isNew: false },
  { slug: "kalkulator-nilai",  label: "Kalkulator Nilai",  desc: "Hitung rata-rata berbobot & ketuntasan (KKM) tanpa kalkulator manual", isNew: false },
  { slug: "ice-breaker",       label: "Ice Breaker",       desc: "Pecahkan ketegangan kelas dengan ice breaker singkat dan seru", isNew: false },
];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TEACHER_TOOLS.find((t) => t.slug === slug);
}
