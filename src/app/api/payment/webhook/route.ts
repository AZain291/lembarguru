import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { upgradeUserForOrder } from '@/utils/subscription'
import crypto from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Verifikasi signature dari Midtrans
function verifySignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string, signatureKey: string): boolean {
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex')
  return hash === signatureKey
}

function successEmailTemplate(tier: string, period: string, amount: number, expiresAt: string): string {
  const tierName = tier === 'pro' ? 'Pro' : 'Guru Lengkap'
  const periodName = period === 'monthly' ? 'Bulanan' : 'Tahunan'
  const expiresDate = new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #059669;">✅ Pembayaran Berhasil!</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        Terima kasih! Akun Anda telah berhasil diupgrade ke paket <strong>${tierName} (${periodName})</strong>.
      </p>
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Total Dibayar</div>
        <div style="font-size: 20px; font-weight: 700; color: #111827;">Rp${amount.toLocaleString('id-ID')}</div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 8px;">Aktif sampai ${expiresDate}</div>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Mulai Gunakan LembarGuru
      </a>
    </div>
  `
}

function failedEmailTemplate(tier: string, period: string, status: string): string {
  const tierName = tier === 'pro' ? 'Pro' : 'Guru Lengkap'
  const periodName = period === 'monthly' ? 'Bulanan' : 'Tahunan'
  const reason = status === 'expire' ? 'Waktu pembayaran telah habis' : status === 'cancel' ? 'Transaksi dibatalkan' : 'Pembayaran ditolak'
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #dc2626;">❌ Pembayaran Tidak Berhasil</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        Transaksi untuk paket <strong>${tierName} (${periodName})</strong> tidak dapat diproses.
      </p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 13px; color: #991b1b;">${reason}</div>
      </div>
      <p style="color: #4b5563; line-height: 1.6;">
        Tidak masalah, Anda bisa coba lagi kapan saja.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/?upgrade=1"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Coba Lagi
      </a>
    </div>
  `
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

    // Ambil order dari DB + email user (join manual via auth admin)
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('user_id, tier, period, status, amount')
      .eq('order_id', order_id)
      .single()

    if (orderError || !order) {
      console.error('[webhook] Order not found:', order_id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Tentukan status final
    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement'

    const isPending = transaction_status === 'pending'

    const isFailed =
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire' ||
      transaction_status === 'failure'

    // Update status order
    const newOrderStatus = isSuccess ? 'success' : isFailed ? 'failed' : 'pending'
    const wasAlreadyFinal = order.status === 'success' || order.status === 'failed'

    await admin
      .from('orders')
      .update({ status: newOrderStatus, updated_at: new Date().toISOString() })
      .eq('order_id', order_id)

    // Ambil email user untuk notifikasi (hanya kalau perlu kirim email)
    let userEmail: string | null = null
    if ((isSuccess || isFailed) && !wasAlreadyFinal) {
      const { data: userData } = await admin.auth.admin.getUserById(order.user_id)
      userEmail = userData?.user?.email ?? null
    }

    // ── SUKSES: upgrade tier + kirim email konfirmasi ──
    if (isSuccess && order.status !== 'success') {
      let expiresAt: string
      try {
        expiresAt = await upgradeUserForOrder(admin, order)
      } catch (e: any) {
        console.error('[webhook] Failed to upgrade tier:', e.message)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      console.log(`[webhook] User ${order.user_id} upgraded to ${order.tier} until ${expiresAt}`)

      if (userEmail) {
        try {
          await resend.emails.send({
            from: 'LembarGuru <noreply@lembarguru.com>',
            to: userEmail,
            subject: 'Pembayaran Berhasil — Akun Anda Sudah Diupgrade!',
            html: successEmailTemplate(order.tier, order.period, order.amount, expiresAt),
          })
        } catch (e: any) {
          console.error('[webhook] Failed to send success email:', e.message)
        }
      }
    }

    // ── GAGAL: kirim email pemberitahuan ──
    if (isFailed && !wasAlreadyFinal) {
      console.log(`[webhook] Order ${order_id} failed/cancelled (${transaction_status})`)

      if (userEmail) {
        try {
          await resend.emails.send({
            from: 'LembarGuru <noreply@lembarguru.com>',
            to: userEmail,
            subject: 'Pembayaran Tidak Berhasil',
            html: failedEmailTemplate(order.tier, order.period, transaction_status),
          })
        } catch (e: any) {
          console.error('[webhook] Failed to send failed-payment email:', e.message)
        }
      }
    }

    if (isPending) {
      console.log(`[webhook] Order ${order_id} still pending`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[webhook] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
