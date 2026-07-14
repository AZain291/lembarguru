import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// POST — hapus akun user yang sedang login secara permanen. Cuma bisa
// menghapus akun sendiri (id diambil dari sesi, bukan dari body) supaya
// tidak bisa dipakai untuk menghapus akun orang lain.
//
// Tabel-tabel terkait SEHARUSNYA sudah punya FK on delete cascade/set null
// ke auth.users(id) (lihat src/docs/supabase_migration.sql +
// 0002_referral.sql/0004_generated_soal.sql), tapi migration itu pakai
// "create table if not exists" -- kalau tabelnya sudah ada dari setup lama
// SEBELUM migration ini ditulis, constraint itu tidak pernah benar-benar
// ter-apply, dan admin.auth.admin.deleteUser() gagal dengan foreign key
// violation begitu ada baris yang masih mereferensikan user itu. Makanya
// dibersihkan manual dulu di sini -- aman dijalankan dobel (idempotent)
// biarpun cascade DB-nya ternyata memang sudah benar.
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Harus login terlebih dahulu' }, { status: 401 })
    }

    const admin = createAdminClient()
    const userId = user.id

    // Urutan: hapus baris anak (referral_redemptions) sebelum baris induk
    // (referrals) supaya tidak kena FK violation di antara tabel itu
    // sendiri kalau cascade-nya juga belum ter-apply.
    const cleanupSteps: Array<{ label: string; run: () => PromiseLike<{ error: { message: string } | null }> }> = [
      { label: 'referral_redemptions (sebagai penerima referral)', run: () => admin.from('referral_redemptions').delete().eq('referred_user_id', userId) },
      {
        label: 'referral_redemptions (di bawah kode referral user ini)',
        run: async () => {
          const { data: ownReferrals, error: selectError } = await admin.from('referrals').select('id').eq('referrer_user_id', userId)
          if (selectError) return { error: selectError }
          const referralIds = (ownReferrals ?? []).map((r) => r.id)
          if (referralIds.length === 0) return { error: null }
          return admin.from('referral_redemptions').delete().in('referral_id', referralIds)
        },
      },
      { label: 'referrals', run: () => admin.from('referrals').delete().eq('referrer_user_id', userId) },
      { label: 'orders', run: () => admin.from('orders').delete().eq('user_id', userId) },
      { label: 'usage_logs', run: () => admin.from('usage_logs').update({ user_id: null }).eq('user_id', userId) },
      { label: 'generated_soal', run: () => admin.from('generated_soal').update({ user_id: null }).eq('user_id', userId) },
      { label: 'profiles', run: () => admin.from('profiles').delete().eq('id', userId) },
    ]

    for (const step of cleanupSteps) {
      const { error } = await step.run()
      // Supabase JS TIDAK melempar exception untuk error query -- selalu
      // cek `error` eksplisit. Best-effort: lanjut ke step berikutnya biar
      // satu tabel yang belum ada/gagal tidak menghalangi pembersihan tabel
      // lain, tapi tetap dicatat supaya kelihatan kalau ada yang perlu
      // ditindaklanjuti manual.
      if (error) {
        console.error(`[account/delete] gagal bersihkan ${step.label}:`, error.message)
      }
    }

    const { error } = await admin.auth.admin.deleteUser(userId)

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
