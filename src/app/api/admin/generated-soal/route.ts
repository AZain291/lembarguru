import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

// GET — daftar soal di kolam Bank Soal bersama, untuk moderasi admin
// (sembunyikan/tampilkan/hapus). Dibatasi 300 terbaru demi ukuran respons.
export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('generated_soal')
      .select('id, mapel, kelas, kurikulum, tipe, teks, hidden, created_at')
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ soal: data ?? [] })
  } catch (err: any) {
    console.error('[admin/generated-soal] GET error:', err)
    return NextResponse.json({ error: err.message || 'Gagal memuat soal' }, { status: 500 })
  }
}

// PATCH — sembunyikan/tampilkan kembali satu soal (moderasi lunak, bisa dibatalkan).
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, hidden } = await request.json()
    if (!id || typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'id dan hidden wajib diisi' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('generated_soal').update({ hidden }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/generated-soal] PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Gagal mengubah soal' }, { status: 500 })
  }
}

// DELETE — hapus permanen satu soal dari kolam Bank Soal.
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('generated_soal').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/generated-soal] DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Gagal menghapus soal' }, { status: 500 })
  }
}
