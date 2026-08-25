import { NextRequest, NextResponse } from 'next/server'
import { notifyNewUser } from '@/utils/notifyNewUser'

export const maxDuration = 30

// Dipanggil dari client (register/page.tsx & login/page.tsx) segera setelah
// signUp email/password sukses, supaya admin dapat notifikasi ada pendaftaran
// baru. Selalu balas 200 -- kegagalan kirim notifikasi tidak boleh membuat
// client menganggap pendaftaran user itu sendiri gagal.
export async function POST(request: NextRequest) {
  try {
    const { email, name, phone } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    await notifyNewUser({ email, name, phone, method: 'email' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notify/new-user] error:', error)
    return NextResponse.json({ success: false })
  }
}
