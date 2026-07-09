// src/lib/referral.ts — v2
// Pola disamakan dengan src/utils/promo.ts (validatePromoInternal) supaya
// konsisten dengan gaya kode existing.

export type ReferralValidation =
  | { valid: true; referralId: string; referrerUserId: string }
  | { valid: false; error: string }

export async function validateReferralInternal(
  admin: any,
  code: string
): Promise<ReferralValidation> {
  const { data, error } = await admin
    .from('referrals')
    .select('id, referrer_user_id, code')
    .ilike('code', code)
    .maybeSingle()

  if (error) {
    console.error('[referral] gagal query referrals:', error)
    return { valid: false, error: 'Gagal memeriksa kode referral' }
  }
  if (!data) {
    return { valid: false, error: 'Kode referral tidak ditemukan' }
  }

  return { valid: true, referralId: data.id, referrerUserId: data.referrer_user_id }
}

// Dipanggil dari src/utils/subscription.ts:upgradeUserForOrder() setelah
// tier user berhasil dinaikkan (dipanggil dari webhook Midtrans MAUPUN
// tombol "Tandai Sukses" manual di admin) -- no-op kalau user yang bayar
// tidak direferensikan siapa pun (tidak ada baris pending yang cocok).
export async function markReferralSuccess(
  admin: any,
  referredUserId: string,
  rewardAmount: number
) {
  const { error } = await admin
    .from('referral_redemptions')
    .update({
      status: 'success',
      reward_given: true,
      reward_amount: rewardAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('referred_user_id', referredUserId)
    .eq('status', 'pending')

  if (error) console.error('[referral] gagal update referral_redemptions:', error)
}
