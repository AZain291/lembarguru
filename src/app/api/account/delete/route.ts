import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// POST — hapus akun user yang sedang login secara permanen. Cuma bisa
// menghapus akun sendiri (id diambil dari sesi, bukan dari body) supaya
// tidak bisa dipakai untuk menghapus akun orang lain.
//
// profiles.id punya "on delete cascade" ke auth.users(id) (lihat
// src/docs/supabase_migration.sql), jadi menghapus user lewat
// admin.auth.admin.deleteUser() otomatis ikut menghapus baris profiles.
// Tabel lain (usage_logs, orders, referrals, referral_redemptions) sudah
// punya aturan FK masing-masing (set null / cascade) dari migration yang
// sudah ada -- tidak perlu dibersihkan manual di sini.
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Harus login terlebih dahulu' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('[account/delete] gagal hapus user:', error)
      return NextResponse.json({ error: 'Gagal menghapus akun, coba lagi' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[account/delete] error:', err)
    return NextResponse.json({ error: 'Gagal menghapus akun' }, { status: 500 })
  }
}
