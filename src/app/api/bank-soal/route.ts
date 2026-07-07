import { NextResponse } from 'next/server'
import { getIdentity } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'
import { getBankSoalLimits, type BankSoalTier, type BankSoalLimit } from '@/utils/soalBank'

export const dynamic = 'force-dynamic'

interface SoalRow {
  id: string
  mapel: string
  kelas: string | null
  kurikulum: string | null
  tipe: string | null
  teks: string
  created_at: string
}

function shuffle<T>(rows: T[]): T[] {
  const arr = [...rows]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Ambil soal sesuai pengaturan tier (jumlah, acak, filter mapel/kelas),
// mengecualikan yang disembunyikan admin. `acak` true -> ambil kandidat
// lebih banyak lalu diacak di JS (supaya tidak selalu soal yang sama tiap
// dibuka); false -> ambil `jumlah` terbaru langsung, tidak diacak.
async function fetchSoal(admin: ReturnType<typeof createAdminClient>, cfg: BankSoalLimit): Promise<SoalRow[]> {
  let query = admin
    .from('generated_soal')
    .select('id, mapel, kelas, kurikulum, tipe, teks, created_at')
    .eq('hidden', false)

  if (cfg.mapel) query = query.eq('mapel', cfg.mapel)
  if (cfg.kelas) query = query.eq('kelas', cfg.kelas)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(cfg.acak ? Math.max(cfg.jumlah * 6, 200) : cfg.jumlah)

  if (error) console.error('[bank-soal] gagal ambil soal:', error.message)
  const rows = (data ?? []) as SoalRow[]
  return cfg.acak ? shuffle(rows).slice(0, cfg.jumlah) : rows
}

export async function GET() {
  try {
    const identity = await getIdentity()
    const admin = createAdminClient()

    if (identity.type === 'guru') {
      // Tanpa batas jumlah/mapel/kelas (dibatasi 500 terbaru demi ukuran
      // payload, bukan pembatasan produk) -- tetap kecualikan yang disembunyikan.
      const { data, error } = await admin
        .from('generated_soal')
        .select('id, mapel, kelas, kurikulum, tipe, teks, created_at')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) console.error('[bank-soal] gagal ambil soal (guru):', error.message)

      return NextResponse.json({ tier: 'guru', soal: data ?? [] })
    }

    const limits = await getBankSoalLimits(admin)
    const tier = identity.type as BankSoalTier
    const cfg = limits[tier]

    const soal = await fetchSoal(admin, cfg)

    return NextResponse.json({ tier, soal, mapel: cfg.mapel, kelas: cfg.kelas })
  } catch (err) {
    console.error('[bank-soal] error:', err)
    return NextResponse.json({ error: 'Gagal memuat Bank Soal' }, { status: 500 })
  }
}
