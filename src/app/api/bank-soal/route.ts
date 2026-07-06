import { NextResponse } from 'next/server'
import { getIdentity } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'
import { TIPE_PILIHAN_GANDA, TIPE_ESAI, MAPEL_TERBATAS } from '@/utils/soalBank'

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

// Ambil soal berdasarkan tipe (Pilihan Ganda / Esai), opsional dibatasi ke
// satu mapel. `randomize` true -> ambil kandidat lebih banyak lalu diacak di
// JS (dipakai tamu/free); false -> ambil `limit` terbaru langsung, tidak
// diacak (dipakai pro/guru supaya tampilannya konsisten/tidak acak).
async function fetchByTipe(
  admin: ReturnType<typeof createAdminClient>,
  tipe: string,
  limit: number,
  opts: { mapel?: string; randomize: boolean }
): Promise<SoalRow[]> {
  let query = admin
    .from('generated_soal')
    .select('id, mapel, kelas, kurikulum, tipe, teks, created_at')
    .eq('tipe', tipe)
    .order('created_at', { ascending: false })
    .limit(opts.randomize ? 200 : limit)

  if (opts.mapel) query = query.eq('mapel', opts.mapel)

  const { data, error } = await query
  if (error) console.error('[bank-soal] gagal ambil soal:', error.message)
  const rows = (data ?? []) as SoalRow[]
  return opts.randomize ? shuffle(rows).slice(0, limit) : rows
}

export async function GET() {
  try {
    const identity = await getIdentity()
    const admin = createAdminClient()

    // Tamu & Free -- dibatasi ke mapel Matematika saja, hasil diacak setiap
    // kali dibuka. Tamu: 5 PG + 5 esai. Free: 15 PG + 10 esai.
    if (identity.type === 'guest' || identity.type === 'free') {
      const pgLimit = identity.type === 'guest' ? 5 : 15
      const esaiLimit = identity.type === 'guest' ? 5 : 10
      const [pg, esai] = await Promise.all([
        fetchByTipe(admin, TIPE_PILIHAN_GANDA, pgLimit, { mapel: MAPEL_TERBATAS, randomize: true }),
        fetchByTipe(admin, TIPE_ESAI, esaiLimit, { mapel: MAPEL_TERBATAS, randomize: true }),
      ])
      return NextResponse.json({ tier: identity.type, mapelTerbatas: MAPEL_TERBATAS, soal: [...pg, ...esai] })
    }

    // Pro -- semua mapel, tidak diacak (terbaru dulu), 30 PG + 20 esai.
    if (identity.type === 'pro') {
      const [pg, esai] = await Promise.all([
        fetchByTipe(admin, TIPE_PILIHAN_GANDA, 30, { randomize: false }),
        fetchByTipe(admin, TIPE_ESAI, 20, { randomize: false }),
      ])
      return NextResponse.json({ tier: 'pro', soal: [...pg, ...esai] })
    }

    // Guru -- tanpa batas tipe/mapel/jumlah, tidak diacak (dibatasi 500
    // terbaru demi ukuran payload, bukan pembatasan produk).
    const { data, error } = await admin
      .from('generated_soal')
      .select('id, mapel, kelas, kurikulum, tipe, teks, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) console.error('[bank-soal] gagal ambil soal (guru):', error.message)

    return NextResponse.json({ tier: 'guru', soal: data ?? [] })
  } catch (err) {
    console.error('[bank-soal] error:', err)
    return NextResponse.json({ error: 'Gagal memuat Bank Soal' }, { status: 500 })
  }
}
