import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { getReferralCommissionPercent, setSetting, REFERRAL_COMMISSION_KEY } from '@/utils/settings'

export const dynamic = 'force-dynamic'

// GET — semua redemption referral + persentase komisi saat ini (untuk tab
// "Referral" di admin). reward_given cuma berarti "berhasil & reward
// dihitung", paid_at (migration 0007) yang berarti benar-benar sudah
// ditransfer.
export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const admin = createAdminClient()

    const { data: redemptions, error } = await admin
      .from('referral_redemptions')
      .select('id, status, reward_amount, paid_at, created_at, referred_user_id, referrals(code, referrer_user_id)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

    const emailMap: Record<string, string> = {}
    for (const u of authUsers.users) emailMap[u.id] = u.email ?? ''

    const result = (redemptions ?? []).map((r: any) => ({
      id: r.id,
      status: r.status,
      reward_amount: r.reward_amount,
      paid_at: r.paid_at,
      created_at: r.created_at,
      code: r.referrals?.code ?? '-',
      referrerEmail: emailMap[r.referrals?.referrer_user_id] ?? '-',
      referredEmail: emailMap[r.referred_user_id] ?? '-',
    }))

    const commissionPercent = await getReferralCommissionPercent(admin)

    return NextResponse.json({ redemptions: result, commissionPercent })
  } catch (err: any) {
    console.error('[admin/referrals] GET error:', err)
    return NextResponse.json({ error: err.message || 'Gagal memuat data referral' }, { status: 500 })
  }
}

// PATCH — dua bentuk body:
//   { id, paid }              -- tandai reward sudah/belum ditransfer manual
//   { commissionPercent }     -- ubah persentase komisi untuk reward berikutnya
//                                 (TIDAK mengubah reward_amount yang sudah
//                                 dihitung/dicatat sebelumnya)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const admin = createAdminClient()

    if (typeof body.commissionPercent === 'number') {
      if (!Number.isFinite(body.commissionPercent) || body.commissionPercent < 0) {
        return NextResponse.json({ error: 'Persentase komisi tidak valid' }, { status: 400 })
      }
      await setSetting(admin, REFERRAL_COMMISSION_KEY, body.commissionPercent)
      return NextResponse.json({ success: true })
    }

    const { id, paid } = body
    if (!id || typeof paid !== 'boolean') {
      return NextResponse.json({ error: 'id dan paid, atau commissionPercent, wajib diisi' }, { status: 400 })
    }

    const { error } = await admin
      .from('referral_redemptions')
      .update({ paid_at: paid ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/referrals] PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Gagal menyimpan perubahan' }, { status: 500 })
  }
}
