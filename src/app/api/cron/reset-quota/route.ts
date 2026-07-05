import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// Vercel Cron memanggil route ini dengan header Authorization: Bearer <CRON_SECRET>
// (Vercel otomatis menambahkan ini kalau env var CRON_SECRET di-set di project settings)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { error, count } = await admin
    .from('usage_quotas')
    .update({ generations_today: 0, quota_date: today })
    .neq('user_id', '00000000-0000-0000-0000-000000000000') // update semua baris

  if (error) {
    console.error('[cron reset-quota] gagal reset:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, resetAt: today, rowsAffected: count ?? null })
}
