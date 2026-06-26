import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      order_id, status_code, gross_amount, signature_key,
      transaction_status, fraud_status,
    } = body

    // Verifikasi signature Midtrans
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest('hex')

    if (signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature for order:', order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: order } = await admin.from('orders').select('*').eq('order_id', order_id).single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement'
    const isFailed = ['deny', 'cancel', 'expire'].includes(transaction_status)

    if (isSuccess && order.status !== 'success') {
      const periodDays = order.period === 'yearly' ? 365 : 30
      const expiresAt = new Date(Date.now() + periodDays * 86400000).toISOString()

      await Promise.all([
        admin.from('orders').update({ status: 'success', paid_at: new Date().toISOString() }).eq('order_id', order_id),
        admin.from('profiles').update({ tier: order.tier, tier_expires_at: expiresAt }).eq('id', order.user_id),
      ])

      console.log(`Order ${order_id} SUKSES — user ${order.user_id} → tier ${order.tier} s/d ${expiresAt}`)
    } else if (isFailed) {
      await admin.from('orders').update({ status: 'failed' }).eq('order_id', order_id)
      console.log(`Order ${order_id} GAGAL (${transaction_status})`)
    } else if (transaction_status === 'pending') {
      await admin.from('orders').update({ status: 'pending' }).eq('order_id', order_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
