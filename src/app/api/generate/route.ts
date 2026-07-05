import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage, getDynamicTierLimits, type TierType } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'
import { splitSoalBlocks } from '@/utils/soalBank'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export const maxDuration = 60

interface MixedConfig {
  pilihan_ganda: number
  essay: number
  benar_salah: number
  isian: number
  hots: number
}

function buildPrompt(params: {
  mapel: string, kelas: string, topik: string | null, difficulty: string,
  kurikulum: string, fase: string | null, tipe: string, jumlahSoal: number, mixedConfig: MixedConfig | null,
}): string {
  const { mapel, kelas, topik, difficulty, kurikulum, fase, tipe, jumlahSoal, mixedConfig } = params

  const kurikulumNote = kurikulum === 'Kurikulum Merdeka'
    ? `Fase: ${fase}. Sesuaikan dengan CP dan TP Kurikulum Merdeka.`
    : kurikulum === 'Kurikulum Cambridge'
    ? 'Sesuaikan dengan standar Cambridge International Curriculum (gaya soal, istilah, dan tingkat berpikir ala Cambridge English). Tulis soal, opsi jawaban, dan pembahasan dalam Bahasa Inggris, kecuali diminta lain.'
    : 'Sesuaikan dengan KD Kurikulum Nasional (K-13).'

  const baseInfo = `
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Topik: ${topik || '(umum sesuai kelas)'}
Kurikulum: ${kurikulum} – ${kurikulumNote}
Tingkat kesulitan: ${difficulty || 'Campuran'}`

  const pgFormat = `
Untuk PILIHAN GANDA:
1. [teks soal]
a. [opsi a]
b. [opsi b]
c. [opsi c]
d. [opsi d]
Jawaban: [huruf jawaban benar]
Pembahasan: [penjelasan singkat mengapa jawaban tersebut benar]`

  const essayFormat = `
Untuk ESAI / URAIAN:
1. [teks soal]
Pembahasan: [panduan jawaban dan poin-poin yang harus ada dalam jawaban siswa]`

  const bsFormat = `
Untuk BENAR/SALAH:
1. [pernyataan]
Jawaban: [Benar / Salah]
Pembahasan: [penjelasan mengapa pernyataan itu benar atau salah]`

  const isianFormat = `
Untuk ISIAN SINGKAT:
1. [kalimat dengan ___ sebagai tempat kosong]
Pembahasan: [jawaban singkat dan penjelasan]`

  const hotsFormat = `
Untuk HOTS:
1. [soal analisis/evaluasi/kreasi tingkat tinggi]
Pembahasan: [langkah berpikir dan poin kunci dalam menjawab]`

  if (tipe === 'campuran' && mixedConfig) {
    const parts: string[] = []
    const typeMap: Record<string, { label: string, format: string }> = {
      pilihan_ganda: { label: 'PILIHAN GANDA', format: pgFormat },
      essay:         { label: 'ESAI / URAIAN', format: essayFormat },
      benar_salah:   { label: 'BENAR ATAU SALAH', format: bsFormat },
      isian:         { label: 'ISIAN SINGKAT', format: isianFormat },
      hots:          { label: 'HOTS', format: hotsFormat },
    }
    for (const [key, count] of Object.entries(mixedConfig)) {
      if (count > 0 && typeMap[key]) {
        parts.push(`${count} soal ${typeMap[key].label}`)
      }
    }

    let prompt = `Kamu adalah guru profesional Indonesia yang berpengalaman.
Buat soal campuran dengan rincian berikut:
${parts.join(', ')}
${baseInfo}

PENTING – Format output wajib diikuti:
- Jangan gunakan markdown (tidak ada **, #, --)
- Setiap tipe soal diawali dengan heading: # [NAMA TIPE] (contoh: # PILIHAN GANDA)
- Penomoran ulang dari 1 untuk setiap tipe
- Langsung mulai tanpa pengantar apapun\n\n`

    for (const [key, count] of Object.entries(mixedConfig)) {
      if (count > 0 && typeMap[key]) {
        prompt += `# ${typeMap[key].label}\nBuat ${count} soal:\n${typeMap[key].format}\n\n`
      }
    }
    return prompt
  }

  const typeFormatMap: Record<string, string> = {
    'Pilihan Ganda': pgFormat,
    'Esai / Uraian': essayFormat,
    'Benar atau Salah': bsFormat,
    'Isian Singkat': isianFormat,
    'HOTS (Pro)': hotsFormat,
  }

  const format = typeFormatMap[tipe] ?? pgFormat

  return `Kamu adalah guru profesional Indonesia yang berpengalaman.
Buat ${jumlahSoal} soal ${tipe} dengan ketentuan:
${baseInfo}

Format WAJIB untuk setiap soal:
${format}

PENTING:
- Jangan gunakan markdown (tidak ada **, #, --)
- Langsung mulai dari nomor 1 tanpa judul atau pengantar
- Tulis dalam teks polos murni
- Kunci jawaban dan pembahasan WAJIB disertakan sesuai format di atas

Buat soal sekarang:`
}

export async function POST(request: NextRequest) {
  let identity: { type: TierType; identifier: string } | null = null

  try {
    identity = await getIdentity()
    const limits = await getDynamicTierLimits()
    const limit = limits[identity.type]

    const quota = await checkQuota(identity)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'quota_exceeded', tier: identity.type, used: quota.used, max: quota.max },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { mapel, kelas, topik, jumlahSoal, tipe, difficulty, kurikulum, fase, mixedConfig } = body

    if (!mapel || !kelas || !jumlahSoal) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const totalSoal = tipe === 'campuran' && mixedConfig
      ? Object.values(mixedConfig as Record<string, number>).reduce((a, b) => a + b, 0)
      : Number(jumlahSoal)

    if (totalSoal > limit.maxSoal) {
      return NextResponse.json(
        { error: 'max_soal_exceeded', maxSoal: limit.maxSoal, tier: identity.type },
        { status: 400 }
      )
    }

    // Cek apakah sisa kuota soal hari ini cukup
    if (quota.max !== null && (quota.used + totalSoal) > quota.max) {
      return NextResponse.json(
        { error: 'quota_exceeded', tier: identity.type, used: quota.used, max: quota.max },
        { status: 403 }
      )
    }

    const prompt = buildPrompt({ mapel, kelas, topik, difficulty, kurikulum, fase, tipe, jumlahSoal: totalSoal, mixedConfig })

    const isEssayHeavy = ['Esai / Uraian', 'HOTS (Pro)', 'campuran'].includes(tipe)
    const dynamicMaxTokens = Math.min(8192, Math.max(1024, Math.round(totalSoal * (isEssayHeavy ? 400 : 180))))

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: dynamicMaxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const hasil = message.content[0].type === 'text' ? message.content[0].text : ''
    const totalTokens = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)

    // Simpan jumlah soal yang digenerate
    await logUsage(identity, {
      action: 'generate',
      tokensUsed: totalTokens,
      questionsCount: totalSoal,
      status: 'success',
    })

    // Simpan tiap soal individual ke kolam Bank Soal bersama (dibaca lagi
    // lewat /api/bank-soal). Gagal simpan tidak boleh menggagalkan response
    // ke user -- generate soal sudah berhasil terlepas dari ini.
    try {
      const blocks = splitSoalBlocks(hasil)
      const generatedBy = identity.type === 'guest' ? null : identity.identifier
      if (blocks.length > 0) {
        const admin = createAdminClient()
        await admin.from('generated_soal').insert(
          blocks.map((teks) => ({
            user_id: generatedBy,
            mapel,
            kelas,
            kurikulum,
            tipe,
            teks,
          }))
        )
      }
    } catch (e) {
      console.error('[generate] gagal menyimpan ke bank soal:', e)
    }

    const updatedQuota = await checkQuota(identity)
    const updatedLimit = limits[identity.type]
    const remainingQuota = updatedQuota.max === null ? null : Math.max(0, updatedQuota.max - updatedQuota.used)
    const sliderMax = remainingQuota === null
      ? updatedLimit.maxSoal
      : Math.min(updatedLimit.maxSoal, remainingQuota)

    return NextResponse.json({
      hasil, success: true,
      tier: identity.type,
      used: updatedQuota.used,
      max: updatedQuota.max,
      remaining: remainingQuota,
      sliderMax,
    })

  } catch (error) {
    console.error('Generate error:', error)
    if (identity) {
      try { await logUsage(identity, { action: 'generate_failed', questionsCount: 0, status: 'error' }) } catch {}
    }
    return NextResponse.json({ error: 'Gagal generate soal' }, { status: 500 })
  }
}
