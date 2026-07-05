// src/app/api/referral/redeem/route.ts — v2
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { validateReferralInternal } from '@/lib/referral'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { code, user_id } = body

  if (!code || !user_id) {
    return NextResponse.json({ error: 'code dan user_id wajib diisi' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await validateReferralInternal(admin, code)

  if (!result.valid) {
    // Gagal validasi tidak boleh menggagalkan proses daftar user — cukup
    // tidak mencatat referral. Register page sudah menangani ini (try/catch).
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Cegah user mereferensikan dirinya sendiri
  if (result.referrerUserId === user_id) {
    return NextResponse.json({ error: 'Tidak bisa memakai kode referral sendiri' }, { status: 400 })
  }

  const { error } = await admin.from('referral_redemptions').insert({
    referral_id: result.referralId,
    referred_user_id: user_id,
    status: 'pending',
  })

  // unique constraint di referred_user_id -> user cuma bisa dipakai 1x
  if (error) {
    return NextResponse.json({ error: 'Referral sudah tercatat untuk user ini' }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
