import { NextResponse } from 'next/server'
import { getIdentity } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'
import { getReferralCommissionPercent } from '@/utils/settings'

export const dynamic = 'force-dynamic'

function randomCode(seed: string): string {
  const base = seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'GURU'
  const suffix = Math.floor(100 + Math.random() * 900)
  return `${base}${suffix}`
}

// GET — kode referral milik user yang login (dibuat lazy kalau belum ada)
// + ringkasan reward-nya. Dipakai ReferralBanner, baik di view "Akun Saya"
// (LembarGuruApp.tsx) maupun halaman standalone src/app/referral/page.tsx.
export async function GET() {
  try {
    const identity = await getIdentity()
    if (identity.type === 'guest') {
      return NextResponse.json({ error: 'Harus login' }, { status: 401 })
    }

    const admin = createAdminClient()
    const userId = identity.identifier

    const { data: existing, error: findError } = await admin
      .from('referrals')
      .select('id, code')
      .eq('referrer_user_id', userId)
      .maybeSingle()

    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 })

    let referral = existing
    if (!referral) {
      const { data: profile } = await admin.from('profiles').select('name').eq('id', userId).maybeSingle()
      const seed = profile?.name || identity.email || userId

      // Retry beberapa kali kalau kode hasil random bentrok (unique constraint).
      for (let i = 0; i < 5 && !referral; i++) {
        const { data: created, error: insertError } = await admin
          .from('referrals')
          .insert({ referrer_user_id: userId, code: randomCode(seed) })
          .select('id, code')
          .single()

        if (!insertError) referral = created
        else if (insertError.code !== '23505') {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
      if (!referral) {
        return NextResponse.json({ error: 'Gagal membuat kode referral, coba lagi' }, { status: 500 })
      }
    }

    const { data: redemptions, error: redError } = await admin
      .from('referral_redemptions')
      .select('status, reward_amount, paid_at')
      .eq('referral_id', referral.id)

    if (redError) return NextResponse.json({ error: redError.message }, { status: 500 })

    const successRows = (redemptions ?? []).filter((r) => r.status === 'success')
    const successCount = successRows.length
    const totalReward = successRows.reduce((sum, r) => sum + (r.reward_amount ?? 0), 0)
    const unpaidReward = successRows.filter((r) => !r.paid_at).reduce((sum, r) => sum + (r.reward_amount ?? 0), 0)
    const commissionPercent = await getReferralCommissionPercent(admin)

    return NextResponse.json({ code: referral.code, successCount, totalReward, unpaidReward, commissionPercent })
  } catch (err) {
    console.error('[referral/me] error:', err)
    return NextResponse.json({ error: 'Gagal memuat data referral' }, { status: 500 })
  }
}
