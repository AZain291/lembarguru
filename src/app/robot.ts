export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Panel admin & endpoint API tidak punya konten untuk diindeks --
      // admin butuh login juga, tapi disallow di sini menghemat crawl
      // budget dan mencegah URL-nya muncul di hasil pencarian.
      disallow: ['/admin', '/api'],
    },
    sitemap: 'https://www.lembarguru.com/sitemap.xml',
  }
}
