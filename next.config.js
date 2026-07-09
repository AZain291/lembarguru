/** @type {import('next').NextConfig} */
const nextConfig = {
  // Situs melayani dari www DAN non-www tanpa redirect (dua domain sama-sama
  // "hidup" di Vercel) -- tapi metadataBase & semua alternates.canonical di
  // metadata (layout.tsx, about/contact/terms/blog/harga/referral) sudah
  // pakai non-www. Tanpa redirect ini Google bisa index kedua versi sebagai
  // konten duplikat (canonical tag bilang non-www, tapi URL www tetap bisa
  // diakses/di-crawl langsung) -- source of the "canonical double" issue.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.lembarguru.com' }],
        destination: 'https://lembarguru.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;