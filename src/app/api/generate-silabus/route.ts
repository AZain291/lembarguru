import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage } from '@/utils/usage'
import { generateJSON } from '@/utils/aiJson'
import type { SilabusResult } from '@/lib/types'

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
    const { jenjang, kelas, mapel, kurikulum, semester } = body

    if (!jenjang || !kelas || !mapel) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const kurikulumLabel = kurikulum === 'k13' ? 'K-13' : 'Kurikulum Merdeka'
    const semesterLabel = semester === 'genap' ? 'Genap' : 'Ganjil'

    const prompt = `Kamu adalah guru profesional Indonesia yang menyusun silabus.

Buat silabus untuk:
Jenjang: ${jenjang}
Kelas: ${kelas}
Mata Pelajaran: ${mapel}
Kurikulum: ${kurikulumLabel}
Semester: ${semesterLabel}

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan tambahan) persis dengan bentuk berikut:
{
  "judul": string,
  "kompetensi_inti": string[],
  "kompetensi_dasar": [{ "kd": string, "materi_pokok": string }]
}
"kompetensi_inti" berisi 3-4 poin KI sesuai jenjang/kurikulum. "kompetensi_dasar" berisi 5-8 baris KD yang relevan untuk satu semester, masing-masing dengan kode/rumusan KD singkat dan materi pokok terkait. Dalam Bahasa Indonesia.`

    const { hasil, totalTokens } = await generateJSON<SilabusResult>(prompt, 3072)

    await logUsage(identity, { action: 'tool_silabus', tokensUsed: totalTokens, questionsCount: 1, status: 'success' })

    return NextResponse.json({ hasil })
  } catch (error) {
    console.error('Generate silabus error:', error)
    if (identity) {
      try { await logUsage(identity, { action: 'tool_silabus_failed', questionsCount: 0, status: 'error' }) } catch {}
    }
    return NextResponse.json({ error: 'Gagal membuat silabus' }, { status: 500 })
  }
}
