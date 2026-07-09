import { markReferralSuccess } from '@/lib/referral'
import { getReferralCommissionPercent } from '@/utils/settings'

// Dipakai bersama oleh webhook Midtrans (src/app/api/payment/webhook/route.ts)
// dan pencatatan transaksi manual di admin (src/app/api/admin/orders/route.ts)
// supaya kedua jalur "order jadi sukses -> upgrade tier" tidak bisa saling
// tidak sinkron seperti yang pernah terjadi sebelumnya.

export function calcExpiry(period: 'monthly' | 'yearly'): string {
  const date = new Date()
  if (period === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  } else {
    date.setFullYear(date.getFullYear() + 1)
  }
  return date.toISOString()
}

// Naikkan tier user sesuai order yang baru jadi sukses (dipanggil dari
// webhook maupun tombol "Tandai Sukses" di admin). Melempar error kalau
// update profiles gagal -- pemanggil yang menentukan bagaimana meresponnya.
export async function upgradeUserForOrder(
  admin: any,
  order: { user_id: string; tier: string; period: string; amount: number }
): Promise<string> {
  const expiresAt = calcExpiry(order.period as 'monthly' | 'yearly')

  const { error } = await admin
    .from('profiles')
    .update({
      tier: order.tier,
      tier_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.user_id)

  if (error) throw error

  // Tandai reward referral sukses (no-op kalau user ini tidak direferensikan
  // siapa pun -- markReferralSuccess hanya update baris pending yang cocok).
  try {
    const commissionPercent = await getReferralCommissionPercent(admin)
    const rewardAmount = Math.round(order.amount * (commissionPercent / 100))
    await markReferralSuccess(admin, order.user_id, rewardAmount)
  } catch (e) {
    console.error('[subscription] gagal menandai referral sukses:', e)
  }

  return expiresAt
}

// Turunkan tier user kembali ke free -- dipanggil saat admin membatalkan
// order yang sebelumnya sudah sukses (mis. ternyata transaksi tidak valid).
// Cuma benar-benar downgrade kalau tier user SAAT INI masih sama dengan
// tier order ini -- supaya tidak menimpa subscription lain yang mungkin
// sudah dibeli user setelah order ini (mis. sudah upgrade ke tier lebih
// tinggi lewat order lain).
export async function downgradeUserForOrder(
  admin: any,
  order: { user_id: string; tier: string }
): Promise<{ skipped: boolean }> {
  const { data: profile } = await admin
    .from('profiles')
    .select('tier')
    .eq('id', order.user_id)
    .maybeSingle()

  if (profile?.tier !== order.tier) {
    return { skipped: true }
  }

  const { error } = await admin
    .from('profiles')
    .update({ tier: 'free', tier_expires_at: null, updated_at: new Date().toISOString() })
    .eq('id', order.user_id)

  if (error) throw error

  return { skipped: false }
}
