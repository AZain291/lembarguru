import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Get all users from auth
  const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  // Get profiles
  const { data: profiles } = await admin.from('profiles').select('id, tier, tier_expires_at, created_at')

  // Get generate counts per user
  const { data: logs } = await admin
    .from('usage_logs')
    .select('user_id')
    .eq('status', 'success')
    .not('user_id', 'is', null)

  const countMap: Record<string, number> = {}
  for (const log of logs ?? []) {
    if (log.user_id) countMap[log.user_id] = (countMap[log.user_id] ?? 0) + 1
  }

  const profileMap: Record<string, { tier: string; tier_expires_at: string | null; created_at: string }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = p
  }

  const users = authUsers.users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    tier: profileMap[u.id]?.tier ?? 'free',
    tier_expires_at: profileMap[u.id]?.tier_expires_at ?? null,
    created_at: u.created_at,
    total_generates: countMap[u.id] ?? 0,
  }))

  return NextResponse.json({ users })
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, tier } = await request.json()
  if (!userId || !tier) return NextResponse.json({ error: 'userId dan tier wajib' }, { status: 400 })

  const admin = createAdminClient()

  // Jika downgrade ke free, clear expiry
  const tierExpiresAt = tier === 'free' ? null : new Date(Date.now() + 30 * 86400000).toISOString()

  const { error } = await admin
    .from('profiles')
    .update({ tier, tier_expires_at: tierExpiresAt, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
