import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage } from '@/utils/usage'
import { generateJSON } from '@/utils/aiJson'
import type { FlashcardResult } from '@/lib/types'

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
    const { jenjang, kelas, mapel, topik, jumlah_kartu } = body

    if (!jenjang || !kelas || !mapel || !topik) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const jumlah = Math.min(20, Math.max(1, Number(jumlah_kartu) || 10))

    const prompt = `Kamu adalah guru profesional Indonesia yang membuat flashcard belajar untuk siswa.

Buat ${jumlah} flashcard untuk:
Jenjang: ${jenjang}
Kelas: ${kelas}
Mata Pelajaran: ${mapel}
Topik: ${topik}

Setiap kartu punya sisi depan (pertanyaan/istilah singkat) dan sisi belakang (jawaban/penjelasan singkat, maks 2 kalimat).

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan tambahan) persis dengan bentuk berikut:
{
  "judul": string,
  "kartu": [{ "depan": string, "belakang": string }]
}
Jumlah item di "kartu" harus tepat ${jumlah}, dalam Bahasa Indonesia.`

    const { hasil, totalTokens } = await generateJSON<FlashcardResult>(prompt, Math.min(4096, 300 + jumlah * 120))

    await logUsage(identity, { action: 'tool_flashcard', tokensUsed: totalTokens, questionsCount: 1, status: 'success' })

    return NextResponse.json({ hasil })
  } catch (error) {
    console.error('Generate flashcard error:', error)
    if (identity) {
      try { await logUsage(identity, { action: 'tool_flashcard_failed', questionsCount: 0, status: 'error' }) } catch {}
    }
    return NextResponse.json({ error: 'Gagal membuat flashcard' }, { status: 500 })
  }
}
