import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Versi publik dari api/admin/pricing — TANPA requireAdmin(), karena
// halaman landing perlu diakses pengunjung yang belum login.
// Hanya kolom yang aman untuk publik yang di-select (tidak ada data
// internal), dan hanya tier yang `active` yang dikembalikan.

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const admin = createAdminClient()

    // Kolom bank_soal_* (migration 0006) dan enabled_tools (migration 0010)
    // di-select terpisah dari kolom dasar -- kalau migration itu belum
    // dijalankan di suatu environment, kegagalannya tidak boleh membuat
    // SELURUH daftar harga kosong (cuma fitur Bank Soal/jumlah tool di
    // kartu harga yang tidak muncul).
    const [base, bankSoal, tools] = await Promise.all([
      admin
        .from('pricing_tiers')
        .select('tier, label, price_monthly, price_yearly, max_soal, max_gen_per_day, unlimited_gen')
        .eq('active', true)
        .order('tier'),
      admin
        .from('pricing_tiers')
        .select('tier, bank_soal_jumlah, bank_soal_acak')
        .eq('active', true),
      admin
        .from('pricing_tiers')
        .select('tier, enabled_tools')
        .eq('active', true),
    ])

    if (base.error) throw base.error

    const bankSoalMap = new Map(
      (bankSoal.error ? [] : bankSoal.data ?? []).map((r: any) => [r.tier, r])
    )
    const toolsMap = new Map(
      (tools.error ? [] : tools.data ?? []).map((r: any) => [r.tier, r])
    )

    const tiers = (base.data ?? []).map((t) => ({
      ...t,
      bank_soal_jumlah: bankSoalMap.get(t.tier)?.bank_soal_jumlah ?? null,
      bank_soal_acak: bankSoalMap.get(t.tier)?.bank_soal_acak ?? null,
      enabled_tools: toolsMap.get(t.tier)?.enabled_tools ?? null,
    }))

    return NextResponse.json(
      { tiers },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    )
  } catch (err) {
    console.error('Public pricing error:', err)
    return NextResponse.json({ tiers: [] })
  }
}
