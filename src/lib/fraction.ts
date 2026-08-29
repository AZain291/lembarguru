// Pecahan bersusun (vertikal, angka di atas garis / angka di bawah garis) di
// TENGAH kalimat soal -- beda dari illustration.ts (satu diagram per soal,
// ditaruh di bawah teks soal). Teks polos tidak bisa menampilkan pecahan
// bersusun (butuh dua baris + garis), jadi AI menandai lokasi pecahan
// dengan marker "{{pembilang/penyebut}}" (lihat FRACTION_RULES di
// generate/route.ts), lalu splitFractionSegments() memecah teks jadi
// segmen teks-biasa & segmen-pecahan yang dirender terpisah (SPAN kecil
// inline flex di web lewat FractionInline di LembarGuruApp.tsx, MathFraction
// asli Word di export-docx/route.ts) -- SATU sumber parsing dipakai di
// kedua tempat supaya tidak ada celah lolos ke output sebagai marker
// mentah.

// Pembilang/penyebut disimpan sebagai STRING apa adanya (bukan di-parse ke
// number) -- soal SD/SMP kadang pakai pecahan desimal gaya Indonesia (koma,
// mis. "4,5") yang rusak kalau di-parseFloat ("4,5" -> NaN), dan lagipula
// nilainya cuma perlu ditampilkan apa adanya, tidak pernah dihitung ulang
// di sini.
const FRACTION_MARKER = /\{\{(-?\d+(?:,\d+)?)\/(\d+(?:,\d+)?)\}\}/g

export interface TextFractionSegment { type: 'text'; value: string }
export interface FractionSegment { type: 'fraction'; numerator: string; denominator: string }
export type FractionTextSegment = TextFractionSegment | FractionSegment

export function splitFractionSegments(text: string): FractionTextSegment[] {
  const segments: FractionTextSegment[] = []
  let lastIndex = 0
  for (const match of text.matchAll(FRACTION_MARKER)) {
    const index = match.index ?? 0
    if (index > lastIndex) segments.push({ type: 'text', value: text.slice(lastIndex, index) })
    segments.push({ type: 'fraction', numerator: match[1], denominator: match[2] })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) })
  return segments
}

// Dipakai untuk konteks teks-polos murni (salin ke clipboard, cetak/print,
// judul dokumen) yang tidak bisa menampilkan pecahan bersusun sama sekali
// -- balik ke notasi "pembilang/penyebut" biasa alih-alih menampilkan
// marker mentah "{{2/3}}" apa adanya.
export function stripFractionMarkers(text: string): string {
  return text.replace(FRACTION_MARKER, (_, num, den) => `${num}/${den}`)
}
