import { BLOG_ARTICLES } from '@/lib/blog'

// www -- harus sama persis dengan metadataBase di layout.tsx dan
// alternates.canonical tiap halaman, DAN sama dengan arah redirect yang
// sudah dipaksakan Vercel (non-www -> www, di level platform, bukan di
// next.config.js -- lihat catatan di sana). Kalau beda, Google melihat
// sitemap menyarankan URL yang berbeda dari yang diklaim rel=canonical
// tiap halaman ("canonical double" / duplicate content).
const BASE_URL = 'https://www.lembarguru.com'

export default function sitemap() {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}/harga`, lastModified: new Date() },
    { url: `${BASE_URL}/coba-gratis`, lastModified: new Date() },
    { url: `${BASE_URL}/blog`, lastModified: new Date() },
    { url: `${BASE_URL}/materi`, lastModified: new Date() },
    { url: `${BASE_URL}/about`, lastModified: new Date() },
    { url: `${BASE_URL}/contact`, lastModified: new Date() },
    { url: `${BASE_URL}/terms`, lastModified: new Date() },
    // /referral & /checkout sengaja tidak dimasukkan -- keduanya wajib
    // login (redirect ke /login untuk pengunjung anonim/Googlebot), tidak
    // ada konten publik yang perlu di-index.
  ]

  const blogPages = BLOG_ARTICLES.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.date),
  }))

  return [...staticPages, ...blogPages]
}
