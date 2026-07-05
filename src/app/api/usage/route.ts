export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getIdentity, checkQuota, getDynamicTierLimits } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  try {
    const identity = await getIdentity()
    const quota = await checkQuota(identity)
    const limits = await getDynamicTierLimits()
    const limit = limits[identity.type]

    const remainingQuota = quota.max === null ? null : Math.max(0, quota.max - quota.used)
    const sliderMax = remainingQuota === null
      ? limit.maxSoal
      : Math.min(limit.maxSoal, remainingQuota)

    let generatesToday = 0
    let generatesTotal = 0
    let tokensUsed = 0
    let name: string | null = null
    let phone: string | null = null

    if (identity.type !== 'guest') {
      const admin = createAdminClient()
      const column = 'user_id'

      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const [todayRes, totalRes, tokenRes, profileRes] = await Promise.all([
        admin.from('usage_logs').select('id', { count: 'exact', head: true })
          .eq(column, identity.identifier).eq('status', 'success').gte('created_at', startOfDay.toISOString()),
        admin.from('usage_logs').select('id', { count: 'exact', head: true })
          .eq(column, identity.identifier).eq('status', 'success'),
        admin.from('usage_logs').select('tokens_used')
          .eq(column, identity.identifier).eq('status', 'success'),
        admin.from('profiles').select('name, phone').eq('id', identity.identifier).single(),
      ])

      generatesToday = todayRes.count ?? 0
      generatesTotal = totalRes.count ?? 0
      tokensUsed = (tokenRes.data ?? []).reduce((sum, row) => sum + (row.tokens_used ?? 0), 0)
      name = profileRes.data?.name ?? null
      phone = profileRes.data?.phone ?? null
    }

    return NextResponse.json({
      tier: identity.type,
      email: identity.email,
      used: quota.used,           // total soal hari ini
      max: quota.max,             // max soal per hari
      maxSoal: limit.maxSoal,     // max soal per sesi
      sliderMax,                  // min(maxSoal, sisa kuota) — batas slider
      maxSoalPro: limits.pro?.maxSoal ?? null,
      maxSoalGuru: limits.guru?.maxSoal ?? null,
      maxGenFree: limits.free?.maxPerPeriod ?? null,
      maxSoalFree: limits.free?.maxSoal ?? null,
      remaining: remainingQuota,
      generatesToday,
      generatesTotal,
      tokensUsed,
      tierExpiresAt: identity.tierExpiresAt,
      name,
      phone,
    })
  } catch (err) {
    console.error('Usage error:', err)
    return NextResponse.json({ error: 'Gagal cek jatah' }, { status: 500 })
  }
}
