import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_ARTICLES } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog LembarGuru — Kiat Mengajar & Mendidik untuk Guru Indonesia',
  description: 'Artikel pendukung guru: kiat sukses mendidik, cara mengajar efektif, dan cara menghadapi berbagai sifat siswa di kelas.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog LembarGuru — Kiat Mengajar & Mendidik untuk Guru Indonesia',
    description: 'Artikel pendukung guru: kiat sukses mendidik, cara mengajar efektif, dan cara menghadapi berbagai sifat siswa di kelas.',
    url: 'https://www.lembarguru.com/blog',
  },
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const articles = [...BLOG_ARTICLES].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <main style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif', padding: '0 0 4rem' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e2db', padding: '0 1.5rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 17, color: '#111827', textDecoration: 'none' }}>
          <img src="/favicon.ico" alt="LembarGuru" style={{ width: 30, height: 30, borderRadius: 7 }} />
          LembarGuru
        </a>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, fontWeight: 600 }}>
          <a href="/about" style={{ color: '#6b7280', textDecoration: 'none' }}>Tentang</a>
          <a href="/blog" style={{ color: '#2563eb', textDecoration: 'none' }}>Blog</a>
          <a href="/materi" style={{ color: '#6b7280', textDecoration: 'none' }}>Materi Guru</a>
          <a href="/harga" style={{ color: '#6b7280', textDecoration: 'none' }}>Harga</a>
          <a href="/referral" style={{ color: '#6b7280', textDecoration: 'none' }}>Referral</a>
          <a href="/contact" style={{ color: '#6b7280', textDecoration: 'none' }}>Kontak</a>
          <a href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
          ✏️ Blog LembarGuru
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 16 }}>
          Kiat mengajar &amp; mendidik<br /><span style={{ color: '#2563eb' }}>untuk guru Indonesia.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.8, maxWidth: 560, margin: '0 auto' }}>
          Artikel praktis seputar cara mengajar, mengelola kelas, dan menghadapi berbagai karakter siswa — ditulis untuk dibaca sela-sela waktu istirahat guru.
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            style={{ display: 'block', background: '#fff', border: '1px solid #e5e2db', borderRadius: 14, padding: '1.5rem 1.75rem', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '2px 9px', borderRadius: 12 }}>
                {a.category}
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatTanggal(a.date)}</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{a.title}</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
