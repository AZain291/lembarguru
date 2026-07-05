import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage } from '@/utils/usage'
import { generateJSON } from '@/utils/aiJson'
import type { AnalisisSoalResult } from '@/lib/types'

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
    const { jenjang, kelas, mapel, teks_soal } = body

    if (!jenjang || !kelas || !mapel || !teks_soal) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const prompt = `Kamu adalah ahli evaluasi pendidikan Indonesia yang menganalisis kualitas soal ujian.

Analisis kumpulan soal berikut untuk jenjang ${jenjang} kelas ${kelas}, mata pelajaran ${mapel}:

"""
${teks_soal}
"""

Untuk setiap soal yang terdeteksi (nomori berurutan mulai 1 sesuai urutan kemunculan), tentukan:
- kategori: jenis soal (mis. "Pilihan Ganda", "Esai", "Benar/Salah", dll — tebak dari bentuknya)
- tingkat_kesulitan: "mudah" | "sedang" | "sulit" berdasarkan Taksonomi Bloom
- catatan_validitas: apakah soal jelas, tidak ambigu, dan sesuai jenjang (1-2 kalimat)
- saran_perbaikan: saran konkret untuk memperbaiki soal (1-2 kalimat, atau "Sudah baik" jika tidak perlu)

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan tambahan) persis dengan bentuk berikut:
{
  "ringkasan": string,
  "analisis": [
    { "nomor": number, "kategori": string, "tingkat_kesulitan": string, "catatan_validitas": string, "saran_perbaikan": string }
  ]
}
"ringkasan" berisi 1-2 kalimat rangkuman kualitas keseluruhan soal, dalam Bahasa Indonesia.`

    const { hasil, totalTokens } = await generateJSON<AnalisisSoalResult>(prompt, 3072)

    await logUsage(identity, { action: 'tool_analisis_soal', tokensUsed: totalTokens, questionsCount: 1, status: 'success' })

    return NextResponse.json({ hasil })
  } catch (error) {
    console.error('Generate analisis soal error:', error)
    if (identity) {
      try { await logUsage(identity, { action: 'tool_analisis_soal_failed', questionsCount: 0, status: 'error' }) } catch {}
    }
    return NextResponse.json({ error: 'Gagal menganalisis soal' }, { status: 500 })
  }
}
