import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — LembarGuru',
  description: 'Baca syarat dan ketentuan penggunaan layanan LembarGuru, termasuk kebijakan privasi, refund, dan hak kekayaan intelektual.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Syarat & Ketentuan — LembarGuru',
    description: 'Syarat dan ketentuan penggunaan layanan LembarGuru.',
    url: 'https://www.lembarguru.com/terms',
  },
}

export default function TermsPage() {
  const lastUpdated = "27 Juni 2026"

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
          <a href="/contact" style={{ color: "#6b7280", textDecoration: "none" }}>Kontak</a>
          <a href="/terms" style={{ color: "#2563eb", textDecoration: "none" }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 14 }}>
            📄 Dokumen Legal
          </div>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#111827", marginBottom: 8 }}>Syarat & Ketentuan</h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Terakhir diperbarui: {lastUpdated}</p>
        </div>

        {/* Intro */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 16px", marginBottom: 24, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          Dengan menggunakan LembarGuru (www.lembarguru.com), Anda menyetujui syarat dan ketentuan berikut. Harap baca dengan seksama sebelum menggunakan layanan kami.
        </div>

        {/* Sections */}
        {[
          {
            title: "1. Penerimaan Syarat",
            content: `Dengan mengakses atau menggunakan layanan LembarGuru ("Layanan") di lembarguru.com, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak menyetujui syarat ini, harap tidak menggunakan Layanan kami.

Layanan ini ditujukan untuk pengguna berusia 17 tahun ke atas. Dengan menggunakan Layanan, Anda menyatakan bahwa Anda memenuhi persyaratan usia tersebut.`,
          },
          {
            title: "2. Deskripsi Layanan",
            content: `LembarGuru adalah platform berbasis kecerdasan buatan (AI) yang membantu guru Indonesia dalam membuat soal ujian secara otomatis. Layanan mencakup:

• Generator soal berbagai tipe (Pilihan Ganda, Esai, Benar/Salah, Isian Singkat, HOTS)
• Dukungan Kurikulum Merdeka dan Kurikulum Nasional (K-13)
• Ekspor soal dalam format Word (.docx)
• Akun pengguna dengan berbagai tingkatan (Gratis, Pro, Guru Lengkap)

Kami berhak mengubah, menambah, atau menghentikan fitur layanan kapan saja tanpa pemberitahuan sebelumnya.`,
          },
          {
            title: "3. Akun Pengguna",
            content: `Untuk mengakses fitur lengkap, Anda perlu mendaftar akun. Anda bertanggung jawab untuk:

• Menjaga kerahasiaan kata sandi akun Anda
• Semua aktivitas yang terjadi di bawah akun Anda
• Memberikan informasi yang akurat dan terkini saat pendaftaran

Kami berhak menangguhkan atau menghapus akun yang melanggar syarat ini tanpa pemberitahuan sebelumnya.`,
          },
          {
            title: "4. Pembayaran & Langganan",
            content: `Paket berbayar (Pro dan Guru Lengkap) dikenakan biaya sesuai harga yang tertera di halaman upgrade. Pembayaran diproses melalui Midtrans dengan metode yang tersedia (transfer bank, GoPay, QRIS, dan lainnya).

Kebijakan refund: Kami menyediakan garansi uang kembali dalam 5 (lima) hari kerja sejak tanggal pembayaran, dengan syarat:
• Anda belum menggunakan lebih dari 20% kuota layanan
• Permintaan diajukan melalui email ke hello@lembarguru.com

Setelah periode tersebut, pembayaran bersifat final dan tidak dapat dikembalikan.`,
          },
          {
            title: "5. Hak Kekayaan Intelektual",
            content: `Soal yang dihasilkan oleh LembarGuru melalui akun Anda adalah milik Anda sepenuhnya dan dapat digunakan untuk keperluan pendidikan tanpa batasan.

Namun, platform LembarGuru sendiri — termasuk antarmuka, kode, merek, logo, dan sistem — adalah milik LembarGuru dan dilindungi oleh hukum hak cipta Indonesia. Anda tidak diperbolehkan untuk menyalin, mendistribusikan, atau membuat produk turunan dari platform kami tanpa izin tertulis.`,
          },
          {
            title: "6. Penggunaan yang Dilarang",
            content: `Anda setuju untuk tidak menggunakan Layanan untuk:

• Membuat konten yang melanggar hukum, berbahaya, atau menyinggung
• Mengakses sistem kami secara tidak sah atau mencoba merusak infrastruktur
• Menjual kembali akses ke Layanan kepada pihak lain
• Menggunakan bot atau alat otomatis untuk mengakses Layanan secara massal
• Melanggar hak kekayaan intelektual pihak ketiga`,
          },
          {
            title: "7. Privasi Data",
            content: `Kami mengumpulkan dan memproses data pribadi Anda (email, riwayat penggunaan) untuk menyediakan Layanan. Data Anda tidak dijual kepada pihak ketiga.

Kami menggunakan layanan pihak ketiga yang terpercaya termasuk Supabase (database), Anthropic (AI), dan Midtrans (pembayaran) — masing-masing tunduk pada kebijakan privasi mereka sendiri.

Anda dapat meminta penghapusan akun dan data Anda kapan saja melalui email hello@lembarguru.com.`,
          },
          {
            title: "8. Batasan Tanggung Jawab",
            content: `LembarGuru disediakan "sebagaimana adanya" (as-is). Kami tidak menjamin bahwa soal yang dihasilkan bebas dari kesalahan faktual. Guru tetap bertanggung jawab untuk memeriksa dan memvalidasi konten sebelum digunakan.

Dalam keadaan apapun, tanggung jawab kami tidak melebihi jumlah yang Anda bayarkan kepada kami dalam 3 (tiga) bulan terakhir.`,
          },
          {
            title: "9. Perubahan Syarat",
            content: `Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Perubahan material akan diberitahukan melalui email atau notifikasi di platform minimal 7 hari sebelum berlaku. Penggunaan Layanan setelah perubahan berlaku berarti Anda menyetujui syarat yang diperbarui.`,
          },
          {
            title: "10. Hukum yang Berlaku",
            content: `Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah mufakat. Jika tidak tercapai kesepakatan, sengketa akan diselesaikan melalui Pengadilan Negeri yang berwenang di Indonesia.`,
          },
          {
            title: "11. Hubungi Kami",
            content: `Jika Anda memiliki pertanyaan tentang Syarat & Ketentuan ini, hubungi kami di:

Email: hello@lembarguru.com
Website: lembarguru.com/contact`,
          },
        ].map((section, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 12, padding: "1.5rem", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 10 }}>{section.title}</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-line" }}>{section.content}</div>
          </div>
        ))}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Kembali ke halaman utama</a>
        </div>
      </div>
    </main>
  )
}
