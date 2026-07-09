import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang LembarGuru — Asisten Soal untuk Guru Indonesia',
  description: 'LembarGuru hadir untuk membantu guru Indonesia membuat soal berkualitas sesuai Kurikulum Merdeka dan K-13 dalam hitungan detik. Kenali misi dan nilai kami.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Tentang LembarGuru — Asisten Soal untuk Guru Indonesia',
    description: 'Kenali misi LembarGuru dalam membantu guru Indonesia membuat soal berkualitas lebih cepat.',
    url: 'https://www.lembarguru.com/about',
  },
}

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "system-ui, sans-serif", padding: "0 0 4rem" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e2db", padding: "0 1.5rem", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 17, color: "#111827", textDecoration: "none" }}>
          <img src="/favicon.ico" alt="LembarGuru" style={{ width: 30, height: 30, borderRadius: 7 }} />
          LembarGuru
        </a>
        <div style={{ display: "flex", gap: 20, fontSize: 13, fontWeight: 600 }}>
          <a href="/about" style={{ color: "#2563eb", textDecoration: "none" }}>Tentang</a>
          <a href="/blog" style={{ color: "#6b7280", textDecoration: "none" }}>Blog</a>
          <a href="/harga" style={{ color: "#6b7280", textDecoration: "none" }}>Harga</a>
          <a href="/referral" style={{ color: "#6b7280", textDecoration: "none" }}>Referral</a>
          <a href="/contact" style={{ color: "#6b7280", textDecoration: "none" }}>Kontak</a>
          <a href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 20 }}>
          📘 Tentang Kami
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#111827", lineHeight: 1.2, marginBottom: 16 }}>
          Dibuat untuk guru,<br /><span style={{ color: "#2563eb" }}>bukan untuk teknisi.</span>
        </h1>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.8, maxWidth: 560, margin: "0 auto" }}>
          LembarGuru lahir dari satu pertanyaan sederhana: kenapa membuat soal ujian masih memakan waktu berjam-jam, padahal guru sudah cukup sibuk?
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem" }}>

        {/* Story */}
        <div style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 14, padding: "2rem", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Cerita di Balik LembarGuru</h2>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 12 }}>
            Kami melihat guru-guru Indonesia menghabiskan waktu istirahat dan malam mereka untuk menyusun serta mengetik soal satu per satu — menyesuaikan dengan kurikulum, memastikan tingkat kesulitan pas, lalu memformat ulang agar rapi. Pekerjaan yang berulang, melelahkan, dan seharusnya bisa jauh lebih mudah bila dibantu dengan teknologi.
          </p>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 12 }}>
            LembarGuru hadir sebagai asisten, bukan pengganti. Guru tetap yang memutuskan — topik, tingkat kelas, kurikulum, tingkat kesulitan. Kami hanya membantu proses penulisan soal menjadi hitungan detik, bukan jam.
          </p>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
            Setiap soal yang dihasilkan disesuaikan dengan Kurikulum Merdeka dan K-13, mencakup berbagai tipe soal dari Pilihan Ganda hingga HOTS, lengkap dengan kunci jawaban dan pembahasan.
          </p>
        </div>

        {/* Values */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {[
            { icon: "🎯", title: "Fokus pada Guru", desc: "Setiap fitur dirancang untuk mempermudah kerja guru, bukan menambah kerumitan baru." },
            { icon: "🇮🇩", title: "Konteks Indonesia", desc: "Soal disesuaikan dengan kurikulum nasional, bahasa Indonesia, dan konteks lokal." },
            { icon: "⚡", title: "Cepat & Andal", desc: "Generate soal berkualitas dalam hitungan detik." },
            { icon: "🔒", title: "Privasi Terjaga", desc: "Data guru dan siswa tidak dijual atau digunakan untuk keperluan lain." },
          ].map((v, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{v.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 6 }}>{v.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: "2rem", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1d4ed8", marginBottom: 8 }}>Mulai gratis sekarang</div>
          <p style={{ fontSize: 14, color: "#1e40af", marginBottom: 20 }}>Tidak perlu kartu kredit. Coba langsung tanpa daftar.</p>
          <a href="/" style={{ display: "inline-block", background: "#2563eb", color: "#fff", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ⚡ Buat Soal Sekarang
          </a>
        </div>
      </div>
    </main>
  )
}

