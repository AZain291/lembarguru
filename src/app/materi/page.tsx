import type { Metadata } from 'next'
import { MATERI_GURU } from '@/lib/materiGuru'
import { MateriThumbnail } from '@/components/materi/MateriThumbnail'

export const metadata: Metadata = {
  title: 'Materi & Template Guru — Unduh Gratis Format Excel & Word | LembarGuru',
  description: 'Kumpulan template siap pakai untuk guru: jadwal pelajaran, daftar nilai otomatis, presensi, kalender pendidikan, dan administrasi mengajar lainnya. Unduh gratis dalam format Excel (.xlsx) dan Word (.docx).',
  alternates: { canonical: '/materi' },
  openGraph: {
    title: 'Materi & Template Guru — Unduh Gratis Format Excel & Word | LembarGuru',
    description: 'Template siap pakai untuk administrasi mengajar: jadwal pelajaran, daftar nilai otomatis, presensi, dan lainnya. Format Excel & Word.',
    url: 'https://www.lembarguru.com/materi',
  },
}

const FORMAT_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  xlsx: { label: 'EXCEL (.xlsx)', bg: '#e6f4ea', fg: '#107C41' },
  docx: { label: 'WORD (.docx)', bg: '#e8f0fe', fg: '#185ABD' },
}

export default function MateriPage() {
  const categories = Array.from(new Set(MATERI_GURU.map((m) => m.category)))

  return (
    <main style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif', padding: '0 0 4rem' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e2db', padding: '0 1.5rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 17, color: '#111827', textDecoration: 'none' }}>
          <img src="/favicon.ico" alt="LembarGuru" style={{ width: 30, height: 30, borderRadius: 7 }} />
          LembarGuru
        </a>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, fontWeight: 600 }}>
          <a href="/about" style={{ color: '#6b7280', textDecoration: 'none' }}>Tentang</a>
          <a href="/blog" style={{ color: '#6b7280', textDecoration: 'none' }}>Blog</a>
          <a href="/materi" style={{ color: '#2563eb', textDecoration: 'none' }}>Materi Guru</a>
          <a href="/harga" style={{ color: '#6b7280', textDecoration: 'none' }}>Harga</a>
          <a href="/referral" style={{ color: '#6b7280', textDecoration: 'none' }}>Referral</a>
          <a href="/contact" style={{ color: '#6b7280', textDecoration: 'none' }}>Kontak</a>
          <a href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
          📁 Materi Guru
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 16 }}>
          Template siap pakai,<br /><span style={{ color: '#2563eb' }}>tinggal unduh dan isi.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.8, maxWidth: 560, margin: '0 auto' }}>
          Jadwal pelajaran, daftar nilai otomatis, presensi, sampai administrasi mengajar — semua gratis, format Excel &amp; Word, tanpa perlu login.
        </p>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 1.5rem' }}>
        {categories.map((category) => (
          <section key={category} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {category}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {MATERI_GURU.filter((m) => m.category === category).map((m) => {
                const badge = FORMAT_BADGE[m.format]
                return (
                  <div
                    key={m.slug}
                    style={{ flex: '1 1 280px', maxWidth: 336, background: '#fff', border: '1px solid #e5e2db', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ background: '#f8fafc', padding: '14px 20px', borderBottom: '1px solid #eef0f3' }}>
                      <MateriThumbnail format={m.format} />
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <span style={{ alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 700, color: badge.fg, background: badge.bg, padding: '2px 9px', borderRadius: 12 }}>
                        {badge.label}
                      </span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>{m.title}</h3>
                      <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, margin: 0, flex: 1 }}>{m.desc}</p>
                      <a
                        href={`/materi/${m.fileName}`}
                        download
                        style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 14px', borderRadius: 9, textDecoration: 'none' }}
                      >
                        ⬇ Unduh Gratis
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
