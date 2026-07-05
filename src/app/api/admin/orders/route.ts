import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { upgradeUserForOrder, downgradeUserForOrder } from '@/utils/subscription'

export const dynamic = 'force-dynamic'

// GET — daftar transaksi (order) untuk tabel "Transaksi" di admin.
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const { data: orders, error } = await admin
    .from('orders')
    .select('order_id, user_id, tier, period, amount, discount_amount, status, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  const emailMap: Record<string, string> = {}
  for (const u of authUsers.users) emailMap[u.id] = u.email ?? ''

  const result = (orders ?? []).map((o) => ({ ...o, email: emailMap[o.user_id] ?? '-' }))

  return NextResponse.json({ orders: result })
}

// PATCH — tandai order sukses/gagal secara manual, dan terapkan efeknya ke
// tier user (fallback kalau webhook Midtrans gagal terpanggil/terproses).
// Memakai helper yang sama dengan webhook (src/utils/subscription.ts) supaya
// dua jalur ini tidak bisa saling tidak sinkron.
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { order_id, action } = await request.json()
  if (!order_id || !['mark_success', 'mark_failed'].includes(action)) {
    return NextResponse.json({ error: 'order_id dan action wajib diisi' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('order_id, user_id, tier, period, amount, status')
    .eq('order_id', order_id)
    .maybeSingle()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
  }

  if (action === 'mark_success') {
    if (order.status === 'success') {
      return NextResponse.json({ success: true, note: 'Order sudah sukses sebelumnya' })
    }

    const { error: updateError } = await admin
      .from('orders')
      .update({ status: 'success', paid_at: new Date().toISOString() })
      .eq('order_id', order_id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    try {
      await upgradeUserForOrder(admin, order)
    } catch (e: any) {
      console.error('[admin/orders] gagal upgrade tier:', e)
      return NextResponse.json({ error: `Order ditandai sukses tapi gagal upgrade tier: ${e.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  // action === 'mark_failed'
  const wasSuccess = order.status === 'success'

  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'failed' })
    .eq('order_id', order_id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  let downgraded = false
  if (wasSuccess) {
    try {
      const result = await downgradeUserForOrder(admin, order)
      downgraded = !result.skipped
    } catch (e: any) {
      console.error('[admin/orders] gagal downgrade tier:', e)
      return NextResponse.json({ error: `Order ditandai gagal tapi gagal downgrade tier: ${e.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, downgraded })
}
