// Daftar mata pelajaran & kelas -- satu sumber kebenaran dipakai oleh
// LembarGuruApp.tsx (form generator) dan admin/page.tsx (dropdown filter
// pengaturan Bank Soal), supaya keduanya tidak bisa saling tidak sinkron.
export const MAPEL = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "PKn",
  "Sejarah", "Biologi", "Fisika", "Kimia", "Pendidikan Agama", "Seni Budaya",
  "PJOK", "Informatika",
  // Ciri khas MTs/MA (Kemenag)
  "Al-Qur'an Hadits", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Bahasa Arab",
  // Ciri khas SMK
  "Kewirausahaan", "Produk Kreatif dan Kewirausahaan", "Dasar-Dasar Kejuruan",
];

export const KELAS_LIST = [
  "1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD",
  "7 SMP", "8 SMP", "9 SMP",
  "7 MTs", "8 MTs", "9 MTs",
  "10 SMA", "11 SMA", "12 SMA",
  "10 MA", "11 MA", "12 MA",
  "10 SMK", "11 SMK", "12 SMK",
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
