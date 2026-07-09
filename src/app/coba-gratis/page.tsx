import { Metadata } from 'next'
import CobaGratisClient from './CobaGratisClient'

// Sebelumnya halaman ini tidak punya metadata sendiri sama sekali, jadi
// diam-diam mewarisi metadata root layout apa adanya -- termasuk
// `alternates.canonical: '/'`, yang secara keliru bilang ke Google bahwa
// /coba-gratis adalah halaman yang SAMA dengan homepage. Itu salah satu
// sumber "canonical double": halaman dengan konten sendiri (form generator
// tamu) tapi rel=canonical-nya menunjuk ke URL lain.
export const metadata: Metadata = {
  title: 'Coba Gratis — Generator Soal Ujian | LembarGuru',
  description: 'Coba generator soal LembarGuru tanpa perlu daftar. Pilih jenjang, mata pelajaran, dan kelas — dapatkan contoh soal beserta kunci jawaban dalam hitungan detik.',
  alternates: {
    canonical: '/coba-gratis',
  },
  openGraph: {
    title: 'Coba Gratis — Generator Soal Ujian | LembarGuru',
    description: 'Coba generator soal LembarGuru tanpa perlu daftar.',
    url: 'https://lembarguru.com/coba-gratis',
  },
}

export default function CobaGratisPage() {
  return <CobaGratisClient />
}
