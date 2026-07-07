import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('pricing_tiers').select('*').order('tier')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tiers: data })
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const {
    tier, label, price_monthly, price_yearly, active, max_soal, max_gen_per_day, unlimited_gen,
    bank_soal_jumlah, bank_soal_acak, bank_soal_mapel, bank_soal_kelas,
  } = body

  if (!tier) return NextResponse.json({ error: 'tier wajib diisi' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('pricing_tiers')
    .update({
      label, price_monthly, price_yearly, active,
      max_soal, max_gen_per_day, unlimited_gen,
      bank_soal_jumlah, bank_soal_acak, bank_soal_mapel, bank_soal_kelas,
      updated_at: new Date().toISOString(),
    })
    .eq('tier', tier)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
