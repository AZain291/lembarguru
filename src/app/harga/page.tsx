import { Metadata } from 'next'
import HargaClient from './HargaClient'

export const metadata: Metadata = {
  title: 'Harga — LembarGuru',
  description: 'Lihat paket dan harga LembarGuru: Tamu, Gratis, Pro, dan Guru Lengkap. Kuota generate soal sesuai kebutuhan Anda.',
  alternates: {
    canonical: '/harga',
  },
  openGraph: {
    title: 'Harga — LembarGuru',
    description: 'Pilih paket LembarGuru yang sesuai kebutuhan Anda.',
    url: 'https://www.lembarguru.com/harga',
  },
}

export default function HargaPage() {
  return <HargaClient />
}
