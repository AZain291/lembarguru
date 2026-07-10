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
  // Sama seperti parseQuestions() di LembarGuruApp.tsx -- soal kadang
  // menulis daftar langkah bernomor DI DALAM teks soal sendiri (mis. soal
  // flowchart/algoritma dengan stem "1. Masukkan dua bilangan\n2. ..."),
  // yang juga cocok pola "angka." tapi nomornya mengulang dari 1. Hanya
  // baris dengan nomor PERSIS sama dengan yang diharapkan berikutnya yang
  // dianggap batas blok baru; selain itu disambung ke blok yang berjalan.
  let expectedNum = 1

  for (const line of lines) {
    if (!line) continue
    if (/^#+\s*/.test(line)) { expectedNum = 1; continue } // lewati heading tipe soal (mode campuran), reset penomoran
    const m = line.match(/^(\d+)[.)]\s+(.+)/)
    if (m && Number(m[1]) === expectedNum) {
      if (current.length) blocks.push(current.join('\n'))
      current = [m[2]]
      expectedNum++
    } else if (current.length) {
      current.push(line)
    }
  }
  if (current.length) blocks.push(current.join('\n'))

  return blocks.filter((b) => b.length > 5)
}

export type BankSoalTier = 'guest' | 'free' | 'pro'

export interface BankSoalLimit {
  jumlah: number
  acak: boolean
  mapel: string | null // null = "Semua"
  kelas: string | null // null = "Semua"
}

// Fallback statis kalau baris pricing_tiers-nya belum ada kolom
// bank_soal_* (mis. migration 0006 belum dijalankan) -- sama seperti pola
// getDynamicTierLimits() di src/utils/usage.ts.
export const BANK_SOAL_DEFAULTS: Record<BankSoalTier, BankSoalLimit> = {
  guest: { jumlah: 10, acak: true, mapel: null, kelas: null },
  free: { jumlah: 25, acak: true, mapel: null, kelas: null },
  pro: { jumlah: 50, acak: false, mapel: null, kelas: null },
}

// Muat pengaturan Bank Soal per tier dari pricing_tiers (admin-editable
// lewat /api/admin/pricing), fallback ke BANK_SOAL_DEFAULTS kalau tabel/
// kolomnya belum siap. Guru sengaja tidak di sini -- selalu tanpa batas.
export async function getBankSoalLimits(admin: any): Promise<Record<BankSoalTier, BankSoalLimit>> {
  try {
    const { data, error } = await admin
      .from('pricing_tiers')
      .select('tier, bank_soal_jumlah, bank_soal_acak, bank_soal_mapel, bank_soal_kelas')
      .in('tier', ['guest', 'free', 'pro'])

    if (error || !data || data.length === 0) return BANK_SOAL_DEFAULTS

    const result = { ...BANK_SOAL_DEFAULTS }
    for (const row of data as {
      tier: string
      bank_soal_jumlah: number | null
      bank_soal_acak: boolean | null
      bank_soal_mapel: string | null
      bank_soal_kelas: string | null
    }[]) {
      const key = row.tier as BankSoalTier
      if (!(key in BANK_SOAL_DEFAULTS)) continue
      result[key] = {
        jumlah: row.bank_soal_jumlah ?? BANK_SOAL_DEFAULTS[key].jumlah,
        acak: row.bank_soal_acak ?? BANK_SOAL_DEFAULTS[key].acak,
        mapel: row.bank_soal_mapel || null,
        kelas: row.bank_soal_kelas || null,
      }
    }
    return result
  } catch {
    return BANK_SOAL_DEFAULTS
  }
}
