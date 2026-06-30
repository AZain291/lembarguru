import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('promo_codes')
      .select('id, code, discount_type, discount_value, applies_to, valid_until, max_uses, used_count, active')
      .order('created_at', { ascending: false })

    if (error) throw error

    const now = new Date()
    const valid = (data ?? []).filter((p: any) => {
      if (p.active === false) return false
      if (p.valid_until && new Date(p.valid_until) < now) return false
      if (p.max_uses && (p.used_count ?? 0) >= p.max_uses) return false
      return true
    })

    return NextResponse.json({ promos: valid })
  } catch (err) {
    console.error('Public promos error:', err)
    return NextResponse.json({ promos: [] })
  }
}
