import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage } from '@/utils/usage'
import { generateJSON } from '@/utils/aiJson'
import type { RubrikResult } from '@/lib/types'

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
    const { jenjang, kelas, mapel, deskripsi_tugas, jumlah_level } = body

    if (!jenjang || !kelas || !mapel || !deskripsi_tugas) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const level = Math.min(6, Math.max(2, Number(jumlah_level) || 4))

    const prompt = `Kamu adalah guru profesional Indonesia yang menyusun rubrik penilaian.

Buat rubrik penilaian untuk:
Jenjang: ${jenjang}
Kelas: ${kelas}
Mata Pelajaran: ${mapel}
Tugas/aktivitas yang dinilai: ${deskripsi_tugas}
Jumlah level penilaian: ${level}

Tentukan 3-5 kriteria penilaian yang relevan dengan tugas tersebut. Untuk setiap kriteria, buat deskriptor performa untuk setiap level (dari level tertinggi ke terendah), masing-masing 1 kalimat singkat dan spesifik.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan tambahan) persis dengan bentuk berikut:
{
  "judul": string,
  "levels": string[],
  "kriteria": [{ "nama": string, "deskriptor": string[] }]
}
"levels" berisi tepat ${level} label level (mis. "Sangat Baik", "Baik", "Cukup", "Perlu Bimbingan" — sesuaikan jumlahnya), dan setiap "deskriptor" di "kriteria" harus punya jumlah item yang sama dengan panjang "levels", urut dari level pertama ke terakhir. Dalam Bahasa Indonesia.`

    const { hasil, totalTokens } = await generateJSON<RubrikResult>(prompt, 3072)

    await logUsage(identity, { action: 'tool_rubrik', tokensUsed: totalTokens, questionsCount: 1, status: 'success' })

    return NextResponse.json({ hasil })
  } catch (error) {
    console.error('Generate rubrik error:', error)
    if (identity) {
      try { await logUsage(identity, { action: 'tool_rubrik_failed', questionsCount: 0, status: 'error' }) } catch {}
    }
    return NextResponse.json({ error: 'Gagal membuat rubrik' }, { status: 500 })
  }
}
