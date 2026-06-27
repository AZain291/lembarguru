import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LembarGuru — Generator Soal Berkualitas untuk Guru Indonesia',
  description: 'Buat soal berkualitas dalam hitungan detik. Sesuai Kurikulum Merdeka & K-13.',
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
