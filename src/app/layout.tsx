import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    verification: {
    google: '0wuqU3shNusJpq6eKK5hriQM3OtT4n6BvdcFiSN_EhQ',
     // isi dengan kode dari Search Console
  },
  metadataBase: new URL('https://lembarguru.com'),
    alternates: {
    canonical: '/',
  },
  title: 'LembarGuru — Buat Soal Ujian Otomatis | Kurikulum Merdeka & K-13',
  description: 'Generator soal untuk guru Indonesia. Buat soal pilihan ganda, HOTS, esai, dan isian singkat untuk semua mata pelajaran SD, SMP, SMA — lengkap kunci jawaban, dalam hitungan detik.',
  openGraph: {
    title: 'LembarGuru — Generator Soal untuk Guru Indonesia',
    description: 'Buat soal pilihan ganda, HOTS, esai untuk SD, SMP, SMA dalam hitungan detik.',
    url: 'https://lembarguru.com',
    siteName: 'LembarGuru',
    locale: 'id_ID',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LembarGuru — Generator Soal untuk Guru Indonesia',
    description: 'Buat soal ujian otomatis. Kurikulum Merdeka & K-13.',
    images: ['/og-image.png'],
  },
  other: {
    'geo.region': 'ID',
    'geo.placename': 'Indonesia',
    'content-language': 'id',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LembarGuru",
    "url": "https://lembarguru.com",
    "description": "Generator soal untuk guru Indonesia",
    "applicationCategory": "EducationApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IDR",
      "description": "Paket gratis tersedia"
    },
    "inLanguage": "id-ID",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "teacher"
    }
  })}}
/>