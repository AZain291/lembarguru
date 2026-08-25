import { Resvg, initWasm } from '@resvg/resvg-wasm'
import { readFileSync } from 'fs'
import path from 'path'

// initWasm() cuma boleh dipanggil sekali per proses -- simpan promise-nya di
// module scope supaya invocation berikutnya pada instance serverless yang
// sama (warm start) tinggal pakai ulang, bukan init lagi (yang akan error).
let wasmReady: Promise<void> | null = null

function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      try {
        // SENGAJA bukan require.resolve('@resvg/resvg-wasm/index_bg.wasm')
        // -- webpack mem-parse literal path itu sebagai modul (mencoba
        // bundling .wasm sebagai JS) dan build gagal ("module is not
        // flagged as WebAssembly module for webpack"), terlepas dari
        // pengaturan serverExternalPackages. path.join dengan process.cwd()
        // adalah nilai runtime, jadi tidak dianalisis statis oleh webpack;
        // file .wasm-nya sendiri tetap ikut ke bundle serverless lewat
        // outputFileTracingIncludes di next.config.js.
        const wasmPath = path.join(process.cwd(), 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm')
        await initWasm(readFileSync(wasmPath))
      } catch (e: any) {
        // Next.js dev mode bisa re-eval modul ini (hot reload) sementara
        // proses Node yang sama masih hidup -- initWasm kedua akan throw,
        // itu aman diabaikan karena wasm-nya memang sudah siap.
        if (!String(e?.message ?? e).toLowerCase().includes('already initialized')) throw e
      }
    })()
  }
  return wasmReady
}

// Dipakai export-docx/route.ts -- Word butuh fallback raster (PNG) untuk
// gambar SVG yang di-embed (lihat SvgMediaOptions di docx.js), jadi
// illustrationSvg() (src/lib/illustration.ts) di-render ulang jadi PNG di
// sini sebelum dimasukkan ke ImageRun.
export async function svgToPng(svg: string, width: number): Promise<Buffer> {
  await ensureWasm()
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  const png = resvg.render()
  return Buffer.from(png.asPng())
}
