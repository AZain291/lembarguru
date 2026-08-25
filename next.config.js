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
  experimental: {
    // export-docx/route.ts pakai @resvg/resvg-wasm (svgToPng.ts) buat
    // convert ilustrasi soal ke PNG. File .wasm-nya dimuat lewat
    // fs.readFileSync(require.resolve(...)) di runtime, bukan static
    // import -- Vercel file tracer bisa gagal mendeteksi ini otomatis,
    // jadi di-include eksplisit supaya file wasm ikut ke bundle serverless
    // function-nya (kalau tidak, error ENOENT di production walau lolos di
    // dev/build lokal).
    outputFileTracingIncludes: {
      '/api/export-docx': ['./node_modules/@resvg/resvg-wasm/*.wasm'],
    },
    // Tanpa ini, webpack mencoba mem-parse index_bg.wasm sebagai modul JS
    // biasa (bukan aset biner) dan build gagal ("Module parse failed...
    // module is not flagged as WebAssembly module for webpack"). Package
    // ini dikecualikan dari bundling webpack -- di-require() native saat
    // runtime, bukan di-bundle -- yang memang cara resmi Next.js menangani
    // package dengan aset native/binary seperti WASM.
    serverComponentsExternalPackages: ['@resvg/resvg-wasm'],
  },
};

module.exports = nextConfig;