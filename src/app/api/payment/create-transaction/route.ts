import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTierPrice } from '@/utils/pricing'
import midtransClient from 'midtrans-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Harus login terlebih dahulu' }, { status: 401 })
    }

    const { tier, period } = await request.json()

    if (!['pro', 'guru'].includes(tier) || !['monthly', 'yearly'].includes(period)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    // Ambil harga dari DB (bisa diubah admin)
    let amount = await getTierPrice(tier as 'pro' | 'guru', period as 'monthly' | 'yearly')

    // Fallback ke harga default jika DB kosong
    if (!amount) {
      const DEFAULTS: Record<string, Record<string, number>> = {
        pro:  { monthly: 59000,  yearly: 499000 },
        guru: { monthly: 109000, yearly: 899000 },
      }
      amount = DEFAULTS[tier]?.[period] ?? 59000
    }

    const orderId = `LG-${tier.toUpperCase()}-${Date.now()}-${user.id.slice(0, 8)}`

    const admin = createAdminClient()
    const { error: insertError } = await admin.from('orders').insert({
      user_id: user.id,
      order_id: orderId,
      tier,
      period,
      amount,
      status: 'pending',
    })
    if (insertError) throw insertError

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
    })

    const transaction = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: { email: user.email },
      item_details: [{
        id: `${tier}-${period}`,
        price: amount,
        quantity: 1,
        name: `LembarGuru ${tier === 'pro' ? 'Pro' : 'Guru Lengkap'} (${period === 'monthly' ? 'Bulanan' : 'Tahunan'})`,
      }],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=finish`,
        error:  `${process.env.NEXT_PUBLIC_APP_URL}/?payment=error`,
        pending:`${process.env.NEXT_PUBLIC_APP_URL}/?payment=pending`,
      },
    })

    return NextResponse.json({ redirect_url: transaction.redirect_url, order_id: orderId })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Gagal membuat transaksi' }, { status: 500 })
  }
}
