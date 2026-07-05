import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { validatePromoInternal } from '@/utils/promo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { code, tier } = body

  if (!code || !tier) {
    return NextResponse.json({ valid: false, error: 'code dan tier wajib diisi' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await validatePromoInternal(admin, code, tier)

  // Selalu 200 (bahkan kalau valid:false) supaya front-end gampang
  // membedakan "kode salah" vs "network error".
  return NextResponse.json(result)
}
