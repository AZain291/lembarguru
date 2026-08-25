import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage } from '@/utils/usage'
import { generateJSON } from '@/utils/aiJson'
import type { RppResult } from '@/lib/types'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let identity: Awaited<ReturnType<typeof getIdentity>> | null = null

  try {
    identity = await getIdentity()
    const quota = await checkQuota(identity)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'quota_exceeded', tier: identity.type, used: quota.used, max: quota.max },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { jenjang, kelas, mapel, kurikulum, topik, alokasi_waktu, tujuan } = body

    if (!jenjang || !kelas || !mapel || !topik) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const kurikulumLabel = kurikulum === 'k13' ? 'K-13' : 'Kurikulum Merdeka'

    const prompt = `Kamu adalah guru profesional Indonesia yang berpengalaman menyusun RPP (Rencana Pelaksanaan Pembelajaran) / modul ajar.

Buat RPP untuk:
Jenjang: ${jenjang}
Kelas: ${kelas}
Mata Pelajaran: ${mapel}
Kurikulum: ${kurikulumLabel}
Topik/materi: ${topik}
Alokasi waktu: ${alokasi_waktu || '2 x 35 menit'}
${tujuan ? `Tujuan pembelajaran yang diinginkan: ${tujuan}` : 'Tujuan pembelajaran: tentukan sendiri sesuai topik dan jenjang.'}

Kalau ada notasi matematika/kimia, pakai karakter Unicode superscript/subscript asli (mis. x², H₂O), bukan notasi ASCII kasar (x^2, H2O).

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan tambahan) persis dengan bentuk berikut:
{
  "judul": string,
  "tujuan_pembelajaran": string[],
  "kegiatan_pendahuluan": string[],
  "kegiatan_inti": string[],
  "kegiatan_penutup": string[],
  "penilaian": string[],
  "sumber_belajar": string[]
}
Setiap array berisi poin-poin singkat dan actionable (3-6 poin per bagian), dalam Bahasa Indonesia.`

    const { hasil, totalTokens } = await generateJSON<RppResult>(prompt, 2048)

    await logUsage(identity, { action: 'tool_rpp', tokensUsed: totalTokens, questionsCount: 1, status: 'success' })

    return NextResponse.json({ hasil })
  } catch (error) {
    console.error('Generate RPP error:', error)
    if (identity) {
      try { await logUsage(identity, { action: 'tool_rpp_failed', questionsCount: 0, status: 'error' }) } catch {}
    }
    return NextResponse.json({ error: 'Gagal membuat RPP' }, { status: 500 })
  }
}
