import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// GET — semua promo (untuk tabel di halaman admin)
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ promos: data ?? [] })
  } catch (err) {
    console.error('Admin promos GET error:', err)
    return NextResponse.json({ promos: [] })
  }
}

// POST — buat promo baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, discount_type, discount_value, applies_to, valid_until, max_uses } = body

    if (!code || !discount_type || discount_value == null) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('promo_codes')
      .insert({
        code: code.trim().toUpperCase(),
        discount_type,
        discount_value: Number(discount_value),
        applies_to: applies_to ?? 'all',
        valid_until: valid_until || null,
        max_uses: max_uses ? Number(max_uses) : null,
        used_count: 0,
        active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ promo: data })
  } catch (err: any) {
    console.error('Admin promos POST error:', err)
    const isDuplicate = err?.code === '23505'
    return NextResponse.json(
      { error: isDuplicate ? 'Kode promo sudah ada.' : 'Gagal membuat promo.' },
      { status: 400 }
    )
  }
}

// PATCH — toggle active (matikan/aktifkan)
export async function PATCH(req: NextRequest) {
  try {
    const { id, active } = await req.json()

    if (!id || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('promo_codes')
      .update({ active })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ promo: data })
  } catch (err) {
    console.error('Admin promos PATCH error:', err)
    return NextResponse.json({ error: 'Gagal mengubah status promo.' }, { status: 500 })
  }
}

// DELETE — hapus promo
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('promo_codes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin promos DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus promo.' }, { status: 500 })
  }
}