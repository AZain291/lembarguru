import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

// Verifikasi signature dari Midtrans
function verifySignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string, signatureKey: string): boolean {
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex')
  return hash === signatureKey
}

// Hitung tanggal expired berdasarkan period
function calcExpiry(period: 'monthly' | 'yearly'): string {
  const date = new Date()
  if (period === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  } else {
    date.setFullYear(date.getFullYear() + 1)
  }
  return date.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      status_code,
      signature_key,
    } = body

    // Verifikasi signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const isValid = verifySignature(order_id, status_code, gross_amount, serverKey, signature_key)
    if (!isValid) {
      console.error('[webhook] Invalid signature for order:', order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Ambil order dari DB
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('user_id, tier, period, status')
      .eq('order_id', order_id)
      .single()

    if (orderError || !order) {
      console.error('[webhook] Order not found:', order_id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Tentukan status final
    const isSuccess =
      transaction_status === 'capture' && fraud_status === 'accept' ||
      transaction_status === 'settlement'

    const isPending =
      transaction_status === 'pending'

    const isFailed =
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire' ||
      transaction_status === 'failure'

    // Update status order
    const newOrderStatus = isSuccess ? 'success' : isFailed ? 'failed' : 'pending'

    await admin
      .from('orders')
      .update({ status: newOrderStatus, updated_at: new Date().toISOString() })
      .eq('order_id', order_id)

    // Jika sukses, upgrade tier user
    if (isSuccess && order.status !== 'success') {
      const expiresAt = calcExpiry(order.period as 'monthly' | 'yearly')

      const { error: profileError } = await admin
        .from('profiles')
        .update({
          tier: order.tier,
          tier_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.user_id)

      if (profileError) {
        console.error('[webhook] Failed to upgrade tier:', profileError.message)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      console.log(`[webhook] User ${order.user_id} upgraded to ${order.tier} until ${expiresAt}`)
    }

    if (isPending) {
      console.log(`[webhook] Order ${order_id} still pending`)
    }

    if (isFailed) {
      console.log(`[webhook] Order ${order_id} failed/cancelled`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[webhook] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
