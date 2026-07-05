import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  const { data: profiles } = await admin.from('profiles').select('id, tier, tier_expires_at, created_at, name, phone')

  const { data: logs } = await admin
    .from('usage_logs')
    .select('user_id')
    .eq('status', 'success')
    .not('user_id', 'is', null)

  const countMap: Record<string, number> = {}
  for (const log of logs ?? []) {
    if (log.user_id) countMap[log.user_id] = (countMap[log.user_id] ?? 0) + 1
  }

  const profileMap: Record<string, { tier: string; tier_expires_at: string | null; created_at: string; name: string | null; phone: string | null }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = p
  }

  const users = authUsers.users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    name: profileMap[u.id]?.name ?? null,
    phone: profileMap[u.id]?.phone ?? null,
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

  const { userId, tier, tier_expires_at, name, phone } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId wajib' }, { status: 400 })

  const admin = createAdminClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (tier !== undefined) {
    // Kalau tier free → hapus expiry
    // Kalau tier pro/guru dan tidak ada custom expiry → default 30 hari
    // Kalau ada custom expiry dari admin → pakai itu
    update.tier = tier
    update.tier_expires_at = tier === 'free' ? null : (tier_expires_at ?? new Date(Date.now() + 30 * 86400000).toISOString())
  }
  if (name !== undefined) update.name = name
  if (phone !== undefined) update.phone = phone

  const { error } = await admin
    .from('profiles')
    .update(update)
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}