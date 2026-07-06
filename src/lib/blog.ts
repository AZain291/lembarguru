export interface BlogArticle {
  slug: string;
  title: string;
  pill: string; // judul singkat untuk carousel/teaser (LembarGuruApp.tsx)
  excerpt: string;
  category: string;
  date: string; // ISO
  content: string[]; // paragraf/heading, dirender apa adanya per baris
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'kiat-sukses-mendidik-generasi-sekarang',
    title: '7 Kiat Sukses Mendidik Generasi Sekarang',
    pill: 'Kiat Sukses Mendidik',
    excerpt: 'Siswa hari ini tumbuh dengan gawai di tangan dan informasi yang datang dari segala arah. Berikut pendekatan yang terbukti efektif untuk mendidik mereka tanpa kehilangan wibawa maupun koneksi.',
    category: 'Kiat Mendidik',
    date: '2026-06-02',
    content: [
      'Mendidik siswa generasi sekarang membutuhkan pendekatan yang berbeda dari satu dekade lalu. Mereka terbiasa dengan informasi instan, tapi justru karena itu mereka butuh figur guru yang bisa membimbing cara berpikir, bukan sekadar menyampaikan materi.',
      '## 1. Bangun hubungan sebelum menuntut hasil',
      'Siswa yang merasa dipahami akan jauh lebih terbuka menerima arahan, termasuk kritik. Luangkan waktu di awal semester untuk mengenal minat dan latar belakang siswa, bukan langsung masuk ke materi.',
      '## 2. Jelaskan alasan di balik aturan',
      'Generasi sekarang jarang patuh hanya karena "kata guru". Mereka lebih kooperatif kalau paham kenapa sebuah aturan atau tugas itu penting untuk mereka, bukan cuma untuk memenuhi kurikulum.',
      '## 3. Beri ruang untuk salah',
      'Rasa takut salah sering membuat siswa diam di kelas. Ciptakan suasana di mana kesalahan adalah bagian normal dari belajar, bukan sesuatu yang memalukan.',
      '## 4. Manfaatkan teknologi, jangan melawannya',
      'Daripada melarang gawai sepenuhnya, arahkan penggunaannya untuk hal produktif: riset cepat, kuis interaktif, atau kolaborasi tugas kelompok.',
      '## 5. Konsisten, bukan keras',
      'Ketegasan yang konsisten jauh lebih efektif daripada sesekali marah besar. Siswa belajar dari pola, bukan dari ledakan emosi sesaat.',
      '## 6. Rayakan progres kecil',
      'Tidak semua siswa akan langsung menonjol. Mengapresiasi kemajuan kecil membangun motivasi jangka panjang yang jauh lebih tahan lama dibanding tekanan nilai semata.',
      '## 7. Jaga diri sendiri',
      'Guru yang kelelahan sulit memberi yang terbaik. Kelola waktu dan energi supaya bisa hadir penuh untuk siswa, bukan sekadar menyelesaikan jam mengajar.',
    ],
  },
  {
    slug: 'cara-mengajar-efektif-di-kelas-besar',
    title: 'Cara Mengajar Efektif di Kelas dengan Jumlah Siswa Besar',
    pill: 'Cara Mengajar Efektif',
    excerpt: 'Mengelola 30-40 siswa sekaligus bukan perkara mudah. Berikut strategi praktis supaya pembelajaran tetap efektif meski kelas penuh sesak.',
    category: 'Cara Mengajar',
    date: '2026-06-10',
    content: [
      'Kelas dengan jumlah siswa besar sering membuat interaksi personal terasa mustahil. Padahal dengan strategi yang tepat, keterbatasan ini bisa disiasati tanpa mengorbankan kualitas pembelajaran.',
      '## Bagi kelas jadi kelompok kecil',
      'Diskusi dalam kelompok 4-5 orang jauh lebih efektif daripada diskusi satu kelas penuh. Setiap siswa punya kesempatan lebih besar untuk bicara dan terlibat aktif.',
      '## Gunakan sistem giliran yang jelas',
      'Alih-alih menunjuk siswa secara acak (yang sering hanya mengenai segelintir siswa aktif), buat sistem giliran tersistematis supaya semua siswa mendapat kesempatan yang sama untuk merespons.',
      '## Manfaatkan penilaian sebaya (peer assessment)',
      'Melibatkan siswa untuk saling menilai tugas sederhana (dengan rubrik yang jelas) meringankan beban koreksi guru sekaligus melatih siswa berpikir kritis.',
      '## Siapkan instruksi tertulis, bukan hanya lisan',
      'Di kelas besar, instruksi lisan mudah tidak terdengar oleh siswa di baris belakang. Tuliskan instruksi utama di papan tulis atau bagikan lembar kerja agar semua siswa punya rujukan yang sama.',
      '## Manfaatkan "zona kerja" di kelas',
      'Atur area tertentu untuk kerja mandiri, area lain untuk diskusi kelompok. Pengaturan fisik ini membantu mengelola kebisingan dan fokus tanpa harus terus-menerus menegur.',
    ],
  },
  {
    slug: 'menghadapi-berbagai-sifat-siswa-di-kelas',
    title: 'Cara Menghadapi Berbagai Sifat Siswa di Kelas',
    pill: 'Menghadapi Sifat Siswa',
    excerpt: 'Dari siswa pendiam hingga yang paling ramai, setiap karakter butuh pendekatan berbeda. Kenali pola umum dan cara meresponsnya secara efektif.',
    category: 'Manajemen Kelas',
    date: '2026-06-18',
    content: [
      'Satu kelas biasanya berisi siswa dengan karakter yang sangat beragam. Memaksakan satu pendekatan untuk semua justru sering memperbesar masalah, bukan menyelesaikannya.',
      '## Siswa pendiam',
      'Jangan buru-buru menganggap siswa pendiam sebagai tidak paham atau tidak peduli. Beri ruang untuk merespons lewat tulisan atau diskusi kelompok kecil, sebelum diminta bicara di depan kelas.',
      '## Siswa yang mendominasi diskusi',
      'Apresiasi antusiasmenya, tapi tetapkan aturan giliran bicara yang jelas supaya siswa lain juga dapat kesempatan. Bisa juga diberi peran khusus, misalnya sebagai moderator kelompok.',
      '## Siswa yang mudah bosan dan mengganggu',
      'Sering kali ini sinyal bahwa materi terlalu mudah atau metode penyampaian kurang variatif. Coba selingi dengan aktivitas yang lebih menantang atau berbasis gerak.',
      '## Siswa yang cemas berlebihan pada ujian',
      'Bantu dengan memecah target besar jadi target kecil yang lebih mudah dicapai, dan berikan umpan balik yang menekankan proses, bukan hanya nilai akhir.',
      '## Siswa yang sering menantang otoritas guru',
      'Hindari konfrontasi di depan kelas yang bisa memperbesar ego kedua belah pihak. Ajak bicara empat mata, dengarkan alasan di baliknya, baru tetapkan batasan yang jelas.',
      '## Kuncinya: observasi sebelum bereaksi',
      'Sebelum menegur atau mengambil tindakan, coba pahami dulu pola perilaku dan kemungkinan penyebabnya. Respons yang tepat sasaran jauh lebih efektif daripada respons yang cepat tapi asal.',
    ],
  },
  {
    slug: 'menyusun-rpp-yang-benar-benar-terpakai',
    title: 'Menyusun RPP yang Benar-Benar Terpakai, Bukan Sekadar Administrasi',
    pill: 'Menyusun RPP Efektif',
    excerpt: 'RPP sering jadi beban administratif yang dibuat asal jadi. Padahal RPP yang baik justru mempermudah guru saat mengajar. Ini caranya.',
    category: 'Cara Mengajar',
    date: '2026-06-24',
    content: [
      'Banyak guru menyusun RPP hanya untuk memenuhi kewajiban administratif, lalu tidak pernah membukanya lagi saat mengajar. Padahal RPP yang disusun dengan baik seharusnya jadi alat bantu nyata di kelas.',
      '## Mulai dari tujuan, bukan dari kegiatan',
      'Tentukan dulu apa yang harus bisa dilakukan siswa di akhir pembelajaran, baru rancang kegiatan yang benar-benar mengarah ke sana — bukan sebaliknya.',
      '## Buat singkat dan mudah dibaca sekilas',
      'RPP yang terlalu panjang justru jarang dibuka lagi saat mengajar. Format ringkas dengan poin-poin kunci jauh lebih praktis dipakai di tengah kesibukan kelas.',
      '## Sertakan rencana cadangan',
      'Materi tidak selalu berjalan sesuai rencana. Siapkan alternatif kegiatan singkat untuk kondisi kelas yang lebih cepat atau lebih lambat dari perkiraan.',
      '## Sesuaikan dengan kondisi kelas, bukan kelas ideal',
      'RPP yang disalin mentah dari contoh sering tidak cocok dengan kondisi siswa sesungguhnya. Sesuaikan tingkat kesulitan dan durasi dengan karakteristik kelas yang benar-benar dihadapi.',
    ],
  },
  {
    slug: 'membangun-motivasi-belajar-siswa',
    title: 'Membangun Motivasi Belajar Siswa yang Tahan Lama',
    pill: 'Membangun Motivasi Belajar',
    excerpt: 'Motivasi yang dibangun dari rasa takut nilai jelek cenderung cepat pudar. Berikut cara menumbuhkan motivasi belajar yang lebih tahan lama.',
    category: 'Kiat Mendidik',
    date: '2026-07-01',
    content: [
      'Motivasi belajar yang hanya bersumber dari rasa takut (takut nilai jelek, takut dimarahi) cenderung hilang begitu tekanan itu tidak ada lagi. Motivasi yang lebih tahan lama biasanya tumbuh dari rasa relevan dan rasa mampu.',
      '## Kaitkan materi dengan kehidupan nyata siswa',
      'Siswa lebih termotivasi belajar sesuatu yang terasa relevan dengan hidup mereka. Tunjukkan contoh konkret bagaimana materi dipakai di luar kelas.',
      '## Beri tantangan yang pas, jangan terlalu mudah atau sulit',
      'Tugas yang terlalu mudah terasa membosankan; yang terlalu sulit membuat siswa menyerah lebih dulu. Cari titik tengah yang membuat siswa merasa tertantang tapi tetap yakin bisa berhasil.',
      '## Berikan umpan balik spesifik, bukan sekadar angka',
      'Nilai angka saja tidak memberi tahu siswa apa yang harus diperbaiki. Umpan balik yang spesifik membantu mereka melihat jalan untuk berkembang.',
      '## Libatkan siswa dalam menentukan target belajarnya',
      'Siswa yang ikut menentukan targetnya sendiri (bukan cuma menerima target dari guru) cenderung merasa lebih bertanggung jawab untuk mencapainya.',
    ],
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}
