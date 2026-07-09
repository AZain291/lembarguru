/** @type {import('next').NextConfig} */
const nextConfig = {
  // JANGAN tambah redirect www<->non-www di sini. Domain kanonik (www)
  // sudah di-redirect di level Vercel (non-www -> www, dashboard Domains
  // settings, muncul sebagai 308). Redirect app-level ke arah SEBALIKNYA
  // pernah ditambahkan di sini untuk "membetulkan canonical" -- itu
  // menyebabkan infinite redirect loop (Vercel lempar ke www, app ini
  // lempar balik ke non-www). Kanonik SEO (metadataBase, sitemap.ts,
  // robots.ts, alternates.canonical tiap halaman) mengikuti www, sama
  // dengan yang sudah dipaksakan Vercel -- tidak perlu redirect app-level
  // sama sekali.
};

module.exports = nextConfig;