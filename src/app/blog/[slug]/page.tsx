import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_ARTICLES, getArticleBySlug } from '@/lib/blog'

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = getArticleBySlug(params.slug)
  if (!article) return { title: 'Artikel tidak ditemukan — Blog LembarGuru' }
  return {
    title: `${article.title} — Blog LembarGuru`,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://lembarguru.com/blog/${article.slug}`,
    },
  }
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  if (!article) notFound()

  const lainnya = BLOG_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2)

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
          <a href="/harga" style={{ color: '#6b7280', textDecoration: 'none' }}>Harga</a>
          <a href="/referral" style={{ color: '#6b7280', textDecoration: 'none' }}>Referral</a>
          <a href="/contact" style={{ color: '#6b7280', textDecoration: 'none' }}>Kontak</a>
          <a href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
        <Link href="/blog" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Semua artikel</Link>

        <div style={{ marginTop: 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '2px 9px', borderRadius: 12 }}>
            {article.category}
          </span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatTanggal(article.date)}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 36px)', fontWeight: 800, color: '#111827', lineHeight: 1.25, marginBottom: 28 }}>
          {article.title}
        </h1>

        <article style={{ background: '#fff', border: '1px solid #e5e2db', borderRadius: 14, padding: '2rem' }}>
          {article.content.map((block, i) =>
            block.startsWith('## ') ? (
              <h2 key={i} style={{ fontSize: 19, fontWeight: 700, color: '#111827', margin: i === 0 ? '0 0 12px' : '24px 0 12px' }}>
                {block.replace('## ', '')}
              </h2>
            ) : (
              <p key={i} style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: '0 0 14px' }}>
                {block}
              </p>
            )
          )}
        </article>

        {lainnya.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Artikel lainnya</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lainnya.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  style={{ display: 'block', background: '#fff', border: '1px solid #e5e2db', borderRadius: 10, padding: '12px 16px', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#111827' }}
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
