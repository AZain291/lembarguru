import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kontak LembarGuru — Hubungi Tim Kami',
  description: 'Ada pertanyaan seputar LembarGuru? Hubungi kami via email atau WhatsApp. Tim kami siap membantu dalam 1×24 jam di hari kerja.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Kontak LembarGuru — Hubungi Tim Kami',
    description: 'Hubungi tim LembarGuru untuk pertanyaan, laporan bug, atau feedback.',
    url: 'https://www.lembarguru.com/contact',
  },
}

export default function ContactPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "system-ui, sans-serif", padding: "0 0 4rem" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e2db", padding: "0 1.5rem", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 17, color: "#111827", textDecoration: "none" }}>
          <img src="/favicon.ico" alt="LembarGuru" style={{ width: 30, height: 30, borderRadius: 7 }} />
          LembarGuru
        </a>
        <div style={{ display: "flex", gap: 20, fontSize: 13, fontWeight: 600 }}>
          <a href="/about" style={{ color: "#6b7280", textDecoration: "none" }}>Tentang</a>
          <a href="/blog" style={{ color: "#6b7280", textDecoration: "none" }}>Blog</a>
          <a href="/harga" style={{ color: "#6b7280", textDecoration: "none" }}>Harga</a>
          <a href="/referral" style={{ color: "#6b7280", textDecoration: "none" }}>Referral</a>
          <a href="/contact" style={{ color: "#2563eb", textDecoration: "none" }}>Kontak</a>
          <a href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 1.5rem 2rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 16 }}>
            💬 Hubungi Kami
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#111827", lineHeight: 1.2, marginBottom: 12 }}>
            Ada pertanyaan?<br /><span style={{ color: "#2563eb" }}>Kami siap membantu.</span>
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7 }}>
            Tim kami biasanya membalas dalam 1×24 jam di hari kerja.
          </p>
        </div>

        {/* Contact cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[
            {
              icon: "✉️",
              title: "Email",
              value: "hello@lembarguru.com",
              desc: "Untuk pertanyaan umum, laporan bug, atau feedback.",
              href: "mailto:hello@lembarguru.com",
              label: "Kirim Email",
            },
            {
              icon: "💬",
              title: "WhatsApp",
              value: "+62 896-7882-2450",
              desc: "Untuk bantuan cepat seputar akun dan pembayaran.",
              href: "https://wa.me/6289678822450",
              label: "Chat WhatsApp",
            },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 12, padding: "1.5rem" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", marginBottom: 6 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 14 }}>{c.desc}</div>
              <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#eff6ff", color: "#1d4ed8", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                {c.label} →
              </a>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 14, padding: "1.75rem", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Pertanyaan Umum</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { q: "Apakah LembarGuru gratis?", a: "Ya, tersedia paket gratis dengan batasan tertentu. Untuk akses penuh, tersedia paket Pro dan Guru Lengkap." },
              { q: "Bagaimana cara upgrade ke Pro?", a: "Klik tombol Upgrade di halaman utama, pilih paket, dan selesaikan pembayaran via Midtrans (transfer bank, GoPay, QRIS, dll)." },
              { q: "Soal yang dihasilkan boleh digunakan untuk ujian?", a: "Ya. Soal yang digenerate sepenuhnya menjadi milik Anda dan boleh digunakan untuk keperluan pendidikan." },
              { q: "Apakah ada refund jika tidak puas?", a: "Kami menyediakan garansi uang kembali dalam 7 hari pertama jika layanan tidak sesuai ekspektasi. Hubungi kami via email." },
              { q: "Data saya aman?", a: "Kami tidak menjual atau membagikan data pengguna kepada pihak ketiga. Lihat Syarat & Ketentuan untuk detail lengkap." },
            ].map((faq, i) => (
              <div key={i} style={{ borderBottom: i < 4 ? "1px solid #f3f4f6" : "none", paddingBottom: i < 4 ? 14 : 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 4 }}>❓ {faq.q}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Back */}
        <div style={{ textAlign: "center" }}>
          <a href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Kembali ke halaman utama</a>
        </div>
      </div>
    </main>
  )
}
