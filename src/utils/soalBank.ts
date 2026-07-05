// Dipakai oleh /api/generate (menyimpan) dan /api/bank-soal (membaca) --
// lihat migration src/utils/supabase/migrations/0004_generated_soal.sql.

// Pecah teks hasil generate (bisa berisi banyak soal sekaligus, termasuk
// mode campuran dengan heading "# PILIHAN GANDA" dst) jadi satu blok teks
// per nomor soal. Tidak perlu ekstrak field terstruktur (opsi/jawaban) --
// Bank Soal cuma menampilkan bloknya apa adanya untuk dibaca/disalin ulang.
export function splitSoalBlocks(text: string): string[] {
  const lines = text.split('\n').map((l) => l.replace(/\*\*/g, '').trim())
  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (!line) continue
    if (/^#+\s*/.test(line)) continue // lewati heading tipe soal (mode campuran)
    if (/^\d+[.)]\s+/.test(line)) {
      if (current.length) blocks.push(current.join('\n'))
      current = [line.replace(/^\d+[.)]\s+/, '')]
    } else if (current.length) {
      current.push(line)
    }
  }
  if (current.length) blocks.push(current.join('\n'))

  return blocks.filter((b) => b.length > 5)
}

// Mapel tamu bergilir per hari -- string HARUS persis sama dengan salah
// satu opsi di MAPEL (src/components/LembarGuruApp.tsx) supaya cocok
// dengan kolom `mapel` yang tersimpan di generated_soal.
// Index = Date.getDay() (0 = Minggu ... 6 = Sabtu).
export const GUEST_MAPEL_BY_DAY = [
  'Seni Budaya',      // Minggu
  'Matematika',       // Senin
  'Bahasa Inggris',   // Selasa
  'IPA',              // Rabu
  'IPS',              // Kamis
  'Bahasa Indonesia', // Jumat
  'PKn',              // Sabtu
]

export function guestMapelToday(): string {
  return GUEST_MAPEL_BY_DAY[new Date().getDay()]
}
