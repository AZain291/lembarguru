import { NextRequest, NextResponse } from 'next/server'
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

// POST — validasi satu kode promo. Dipakai oleh UpgradeModal di
// LembarGuruApp.tsx (body cuma { code }, tanpa tier — pengecekan applies_to
// vs tier yang dipilih user dilakukan di client lewat `promoApplies`, dan
// divalidasi ulang untuk kesekian kali di server saat create-transaction).
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Kode promo wajib diisi' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('promo_codes')
      .select('id, code, discount_type, discount_value, applies_to, valid_until, max_uses, used_count, active')
      .ilike('code', code.trim())
      .maybeSingle()

    if (error) {
      console.error('[public promos validate] gagal query:', error)
      return NextResponse.json({ valid: false, error: 'Gagal memeriksa kode promo' }, { status: 500 })
    }
    if (!data || data.active === false) {
      return NextResponse.json({ valid: false, error: 'Kode promo tidak ditemukan' })
    }
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Kode promo sudah kedaluwarsa' })
    }
    if (data.max_uses && (data.used_count ?? 0) >= data.max_uses) {
      return NextResponse.json({ valid: false, error: 'Kode promo sudah mencapai batas penggunaan' })
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        applies_to: data.applies_to,
      },
    })
  } catch (err) {
    console.error('[public promos validate] exception:', err)
    return NextResponse.json({ valid: false, error: 'Gagal memeriksa kode promo' }, { status: 500 })
  }
}
