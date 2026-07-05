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
    const { data, error } = await admin
      .from('pricing_tiers')
      .select('tier, label, price_monthly, price_yearly, max_soal, max_gen_per_day, unlimited_gen')
      .eq('active', true)
      .order('tier')

    if (error) throw error

    return NextResponse.json(
      { tiers: data ?? [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    )
  } catch (err) {
    console.error('Public pricing error:', err)
    return NextResponse.json({ tiers: [] })
  }
}
