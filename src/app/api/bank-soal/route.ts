import { NextResponse } from 'next/server'
import { getIdentity } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'
import { guestMapelToday } from '@/utils/soalBank'

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

// Ambil sampai 200 soal terbaru untuk satu mapel, acak urutannya, lalu
// potong sejumlah `limit`. Random di JS (bukan ORDER BY random() di
// Postgres) supaya tidak perlu RPC tambahan.
async function ambilAcakPerMapel(admin: ReturnType<typeof createAdminClient>, mapel: string, limit: number): Promise<SoalRow[]> {
  const { data } = await admin
    .from('generated_soal')
    .select('id, mapel, kelas, kurikulum, tipe, teks, created_at')
    .eq('mapel', mapel)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as SoalRow[]
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  return rows.slice(0, limit)
}

// Komposisi mapel tetap untuk free/pro (bukan mapel acak) -- lihat diskusi
// fitur ini: free = 5 Matematika + 5 IPA + 5 Bahasa Inggris, pro = 2x lipat.
const MAPEL_FREE_PRO = ['Matematika', 'IPA', 'Bahasa Inggris']

export async function GET() {
  try {
    const identity = await getIdentity()
    const admin = createAdminClient()

    if (identity.type === 'guest') {
      const mapel = guestMapelToday()
      const soal = await ambilAcakPerMapel(admin, mapel, 5)
      return NextResponse.json({ tier: 'guest', mapelHariIni: mapel, soal })
    }

    if (identity.type === 'free' || identity.type === 'pro') {
      const perMapel = identity.type === 'free' ? 5 : 10
      const groups = await Promise.all(MAPEL_FREE_PRO.map((m) => ambilAcakPerMapel(admin, m, perMapel)))
      return NextResponse.json({ tier: identity.type, soal: groups.flat() })
    }

    // guru -- tanpa batas mapel/jumlah (dibatasi 300 terbaru demi ukuran payload)
    const { data } = await admin
      .from('generated_soal')
      .select('id, mapel, kelas, kurikulum, tipe, teks, created_at')
      .order('created_at', { ascending: false })
      .limit(300)

    return NextResponse.json({ tier: 'guru', soal: data ?? [] })
  } catch (err) {
    console.error('[bank-soal] error:', err)
    return NextResponse.json({ error: 'Gagal memuat Bank Soal' }, { status: 500 })
  }
}
