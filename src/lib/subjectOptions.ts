// Daftar mata pelajaran & kelas -- satu sumber kebenaran dipakai oleh
// LembarGuruApp.tsx (form generator) dan admin/page.tsx (dropdown filter
// pengaturan Bank Soal), supaya keduanya tidak bisa saling tidak sinkron.

// Mapel umum -- berlaku di kurikulum nasional (Merdeka/K-13) maupun
// Cambridge (versi internasional dari mapel sains/matematika/bahasa).
const MAPEL_UMUM = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS",
  "Biologi", "Fisika", "Kimia", "PJOK", "Informatika", "Seni Budaya",
];
// Muatan wajib nasional Indonesia -- tidak ada di silabus Cambridge.
const MAPEL_NASIONAL = ["PKn", "Sejarah", "Pendidikan Agama"];
// Ciri khas MTs/MA (Kemenag) -- kurikulum nasional saja.
const MAPEL_MADRASAH = ["Al-Qur'an Hadits", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Bahasa Arab"];
// Ciri khas SMK -- kurikulum nasional saja. Mapel umum kejuruan (berlaku
// lintas jurusan) digabung dengan mapel produktif per konsentrasi keahlian
// yang paling umum di SMK Indonesia (TI, Bisnis & Manajemen, Teknik &
// Rekayasa, Pariwisata, Kesehatan, Agribisnis) -- bukan daftar lengkap
// semua jurusan yang ada (ratusan kombinasi), tapi cakupan yang paling
// sering dipakai.
const MAPEL_SMK = [
  // Umum lintas jurusan
  "Kewirausahaan", "Produk Kreatif dan Kewirausahaan", "Dasar-Dasar Kejuruan",
  // Teknologi Informasi (RPL, TKJ, Multimedia, DKV)
  "Pemrograman Dasar", "Rekayasa Perangkat Lunak", "Teknik Komputer dan Jaringan",
  "Multimedia", "Desain Komunikasi Visual", "Basis Data", "Sistem Komputer",
  // Bisnis & Manajemen (Akuntansi, OTKP, Pemasaran)
  "Akuntansi Dasar", "Akuntansi dan Keuangan Lembaga", "Otomatisasi dan Tata Kelola Perkantoran",
  "Bisnis Daring dan Pemasaran", "Ekonomi Bisnis",
  // Teknik & Rekayasa (Otomotif, Elektro, Mesin)
  "Teknik Kendaraan Ringan Otomotif", "Teknik Sepeda Motor", "Teknik Elektronika",
  "Teknik Instalasi Tenaga Listrik", "Teknik Pemesinan", "Teknik Pengelasan", "Gambar Teknik",
  // Pariwisata & Perhotelan
  "Perhotelan", "Tata Boga", "Tata Busana", "Tata Kecantikan", "Usaha Perjalanan Wisata",
  // Kesehatan
  "Keperawatan", "Farmasi", "Analis Kesehatan",
  // Agribisnis
  "Agribisnis Tanaman", "Agribisnis Ternak",
];

export const MAPEL = [...MAPEL_UMUM, ...MAPEL_NASIONAL, ...MAPEL_MADRASAH, ...MAPEL_SMK];

// Mapel per kurikulum -- dipakai form generator (LembarGuruApp.tsx) untuk
// menyembunyikan mapel yang tidak relevan dengan kurikulum yang dipilih.
// Kurikulum Merdeka & K-13 sama-sama kurikulum nasional Indonesia jadi
// dapat daftar penuh; Cambridge cuma dapat mapel yang ada silabus
// internasionalnya (tanpa PKn/Sejarah/Agama/mapel Kemenag/SMK).
export const MAPEL_BY_KURIKULUM: Record<string, string[]> = {
  "Kurikulum Merdeka": MAPEL,
  "Kurikulum Nasional (K-13)": MAPEL,
  "Kurikulum Cambridge": MAPEL_UMUM,
};

// Mapel yang tidak relevan untuk masing-masing jenjang, dikecualikan dari
// dropdown -- mis. Fikih tidak muncul untuk SD/SMP/SMA/SMK (cuma
// MTs/MA), dan Biologi/Fisika/Kimia terpisah tidak muncul untuk
// SD/SMP/MTs (di sana masih IPA terpadu).
const MAPEL_EXCLUDE_BY_JENJANG: Record<string, string[]> = {
  SD:  [...MAPEL_MADRASAH, ...MAPEL_SMK, "Sejarah", "Biologi", "Fisika", "Kimia"],
  SMP: [...MAPEL_MADRASAH, ...MAPEL_SMK, "Sejarah", "Biologi", "Fisika", "Kimia"],
  MTs: [...MAPEL_SMK, "Sejarah", "Biologi", "Fisika", "Kimia"],
  SMA: [...MAPEL_MADRASAH, ...MAPEL_SMK, "IPA"],
  MA:  [...MAPEL_SMK, "IPA"],
  SMK: [...MAPEL_MADRASAH, "IPA", "Biologi", "Fisika", "Kimia"],
  UMUM: [],
};

// Urutan cek sengaja SMA/SMK sebelum MA -- "10 SMA"/"10 SMK" juga
// berakhiran "MA"/"A", jadi jenjang yang lebih spesifik harus dicek dulu.
function jenjangOfKelas(kelas: string): keyof typeof MAPEL_EXCLUDE_BY_JENJANG {
  if (kelas.endsWith("SD")) return "SD";
  if (kelas.endsWith("SMP")) return "SMP";
  if (kelas.endsWith("MTs")) return "MTs";
  if (kelas.endsWith("SMK")) return "SMK";
  if (kelas.endsWith("SMA")) return "SMA";
  if (kelas.endsWith("MA")) return "MA";
  return "UMUM";
}

// Daftar mapel final untuk dropdown form generator: gabungan filter
// kurikulum + jenjang kelas. Selalu jatuh balik ke daftar kurikulum kalau
// hasil filter jenjang kosong, supaya dropdown tidak pernah kosong.
export function getMapelOptions(kurikulum: string, kelas: string): string[] {
  const base = MAPEL_BY_KURIKULUM[kurikulum] ?? MAPEL;
  const exclude = new Set(MAPEL_EXCLUDE_BY_JENJANG[jenjangOfKelas(kelas)] ?? []);
  const filtered = base.filter(m => !exclude.has(m));
  return filtered.length ? filtered : base;
}

export const KELAS_LIST = [
  "1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD",
  "7 SMP", "7 MTs",
  "8 SMP", "8 MTs",
  "9 SMP", "9 MTs",
  "10 SMA", "10 MA", "10 SMK",
  "11 SMA", "11 MA", "11 SMK",
  "12 SMA", "12 MA", "12 SMK",
  "Umum",
];

// Tema pembelajaran tematik terpadu SD (Buku Tematik Kemendikbud, dipakai
// luas di kelas 1-6 termasuk sekolah yang menerapkan Kurikulum Merdeka
// secara tematik) -- opsional di form generator: kalau dipilih, soal
// dibuat mengikuti tema, bukan cuma mata pelajaran lepas.
export const SD_TEMA: Record<string, string[]> = {
  "1 SD": ["Diriku", "Kegemaranku", "Kegiatanku", "Keluargaku", "Pengalamanku", "Lingkungan Bersih, Sehat, dan Asri", "Benda, Hewan, dan Tanaman di Sekitarku", "Peristiwa Alam"],
  "2 SD": ["Hidup Rukun", "Bermain di Lingkunganku", "Tugasku Sehari-hari", "Aku dan Sekolahku", "Hidup Bersih dan Sehat", "Air, Bumi, dan Matahari", "Merawat Hewan dan Tumbuhan", "Keselamatan di Rumah dan Perjalanan"],
  "3 SD": ["Pertumbuhan dan Perkembangan Makhluk Hidup", "Menyayangi Tumbuhan dan Hewan", "Benda di Sekitarku", "Kewajiban dan Hakku", "Cuaca", "Energi dan Perubahannya", "Perkembangan Teknologi", "Praja Muda Karana"],
  "4 SD": ["Indahnya Kebersamaan", "Selalu Berhemat Energi", "Peduli Terhadap Makhluk Hidup", "Berbagai Pekerjaan", "Pahlawanku", "Cita-citaku", "Indahnya Keragaman di Negeriku", "Daerah Tempat Tinggalku"],
  "5 SD": ["Organ Gerak Hewan dan Manusia", "Udara Bersih bagi Kesehatan", "Makanan Sehat", "Sehat itu Penting", "Ekosistem", "Panas dan Perpindahannya", "Peristiwa dalam Kehidupan", "Lingkungan Sahabat Kita"],
  "6 SD": ["Selamatkan Makhluk Hidup", "Persatuan dalam Perbedaan", "Tokoh dan Penemuan", "Globalisasi", "Wirausaha", "Menuju Masyarakat Sehat"],
};
