import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getIdentity, checkQuota, logUsage, getDynamicTierLimits, type TierType } from '@/utils/usage'
import { createAdminClient } from '@/utils/supabase/admin'
import { splitSoalBlocks } from '@/utils/soalBank'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export const maxDuration = 60

// Routing model: Pilihan Ganda murni faktual/pilihan -- cukup untuk model
// yang lebih ringan & murah. Tipe lain (Esai, Benar-Salah, Isian, HOTS)
// butuh nuansa penyusunan pembahasan yang lebih baik, tetap pakai Sonnet.
const MODEL_HAIKU = 'claude-haiku-4-5'
const MODEL_SONNET = 'claude-sonnet-4-6'

interface MixedConfig {
  pilihan_ganda: number
  essay: number
  benar_salah: number
  isian: number
  hots: number
}

interface BaseParams {
  mapel: string; kelas: string; topik: string | null; difficulty: string
  kurikulum: string; fase: string | null
}

function buildBaseInfo({ mapel, kelas, topik, difficulty, kurikulum, fase }: BaseParams): string {
  const kurikulumNote = kurikulum === 'Kurikulum Merdeka'
    ? `Fase: ${fase}. Sesuaikan dengan CP dan TP Kurikulum Merdeka.`
    : kurikulum === 'Kurikulum Cambridge'
    ? 'Sesuaikan dengan standar Cambridge International Curriculum (gaya soal, istilah, dan tingkat berpikir ala Cambridge English). Tulis soal dan opsi jawaban dalam Bahasa Inggris, kecuali diminta lain -- TAPI bagian Pembahasan tetap wajib Bahasa Indonesia (lihat aturan PENTING di bawah).'
    : 'Sesuaikan dengan KD Kurikulum Nasional (K-13).'

  return `
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Topik: ${topik || '(umum sesuai kelas)'}
Kurikulum: ${kurikulum} – ${kurikulumNote}
Tingkat kesulitan: ${difficulty || 'Campuran'}`
}

const PG_FORMAT = `
Untuk PILIHAN GANDA:
1. [teks soal]
a. [opsi a]
b. [opsi b]
c. [opsi c]
d. [opsi d]
Jawaban: [huruf jawaban benar]
Pembahasan: [penjelasan singkat mengapa jawaban tersebut benar]`

const ESSAY_FORMAT = `
Untuk ESAI / URAIAN:
1. [teks soal]
Pembahasan: [panduan jawaban dan poin-poin yang harus ada dalam jawaban siswa]`

const BS_FORMAT = `
Untuk BENAR/SALAH:
1. [pernyataan]
Jawaban: [Benar / Salah]
Pembahasan: [penjelasan mengapa pernyataan itu benar atau salah]`

const ISIAN_FORMAT = `
Untuk ISIAN SINGKAT:
1. [kalimat dengan ___ sebagai tempat kosong]
Pembahasan: [jawaban singkat dan penjelasan]`

const HOTS_FORMAT = `
Untuk HOTS:
1. [soal analisis/evaluasi/kreasi tingkat tinggi]
Pembahasan: [langkah berpikir dan poin kunci dalam menjawab]`

const TYPE_MAP: Record<keyof MixedConfig, { label: string; format: string }> = {
  pilihan_ganda: { label: 'PILIHAN GANDA', format: PG_FORMAT },
  essay:         { label: 'ESAI / URAIAN', format: ESSAY_FORMAT },
  benar_salah:   { label: 'BENAR ATAU SALAH', format: BS_FORMAT },
  isian:         { label: 'ISIAN SINGKAT', format: ISIAN_FORMAT },
  hots:          { label: 'HOTS', format: HOTS_FORMAT },
}

const SINGLE_TYPE_FORMAT_MAP: Record<string, string> = {
  'Pilihan Ganda': PG_FORMAT,
  'Esai / Uraian': ESSAY_FORMAT,
  'Benar atau Salah': BS_FORMAT,
  'Isian Singkat': ISIAN_FORMAT,
  'HOTS (Pro)': HOTS_FORMAT,
}

// Dipakai untuk mode campuran -- bisa dipanggil dengan subset config (mis.
// cuma { pilihan_ganda } untuk grup yang dirutekan ke Haiku, atau sisanya
// untuk grup yang dirutekan ke Sonnet) supaya tiap grup jadi prompt+panggilan
// API sendiri, tapi format output (heading "# TIPE" per bagian) tetap sama
// seperti satu panggilan gabungan -- splitSoalBlocks() & parser client tidak
// perlu tahu bedanya.
function buildMixedPrompt(configSubset: Partial<MixedConfig>, params: BaseParams): string {
  const entries = (Object.entries(configSubset) as [keyof MixedConfig, number][])
    .filter(([key, count]) => count > 0 && TYPE_MAP[key])

  const parts = entries.map(([key, count]) => `${count} soal ${TYPE_MAP[key].label}`)

  let prompt = `Kamu adalah guru profesional Indonesia yang berpengalaman.
Buat soal campuran dengan rincian berikut:
${parts.join(', ')}
${buildBaseInfo(params)}

PENTING – Format output wajib diikuti:
- Jangan gunakan markdown (tidak ada **, #, --)
- Setiap tipe soal diawali dengan heading: # [NAMA TIPE] (contoh: # PILIHAN GANDA)
- Penomoran ulang dari 1 untuk setiap tipe
- Kalau soal berisi daftar langkah/urutan di dalam teks soal (mis. soal flowchart/algoritma), JANGAN tulis daftar itu dengan angka+titik ("1. ... 2. ...") karena akan tertukar dengan nomor soal -- pakai huruf/angka dalam kurung, contoh (1) ... (2) ..., atau tanda hubung "-"
- Bagian "Pembahasan" WAJIB ditulis dalam Bahasa Indonesia untuk SEMUA tipe soal dan SEMUA kurikulum, termasuk soal mapel Bahasa Inggris atau Kurikulum Cambridge yang teks soal/opsi jawabannya berbahasa Inggris -- cuma bagian Pembahasan yang tetap Bahasa Indonesia, supaya mudah dipahami guru & siswa Indonesia
- Langsung mulai tanpa pengantar apapun\n\n`

  for (const [key, count] of entries) {
    prompt += `# ${TYPE_MAP[key].label}\nBuat ${count} soal:\n${TYPE_MAP[key].format}\n\n`
  }
  return prompt
}

function buildSinglePrompt(tipe: string, jumlahSoal: number, params: BaseParams): string {
  const format = SINGLE_TYPE_FORMAT_MAP[tipe] ?? PG_FORMAT

  return `Kamu adalah guru profesional Indonesia yang berpengalaman.
Buat ${jumlahSoal} soal ${tipe} dengan ketentuan:
${buildBaseInfo(params)}

Format WAJIB untuk setiap soal:
${format}

PENTING:
- Jangan gunakan markdown (tidak ada **, #, --)
- Langsung mulai dari nomor 1 tanpa judul atau pengantar
- Tulis dalam teks polos murni
- Kunci jawaban dan pembahasan WAJIB disertakan sesuai format di atas
- Kalau soal berisi daftar langkah/urutan di dalam teks soal (mis. soal flowchart/algoritma), JANGAN tulis daftar itu dengan angka+titik ("1. ... 2. ...") karena akan tertukar dengan nomor soal -- pakai huruf/angka dalam kurung, contoh (1) ... (2) ..., atau tanda hubung "-"
- Bagian "Pembahasan" WAJIB ditulis dalam Bahasa Indonesia, termasuk untuk soal mapel Bahasa Inggris atau Kurikulum Cambridge yang teks soal/opsi jawabannya berbahasa Inggris -- cuma bagian Pembahasan yang tetap Bahasa Indonesia, supaya mudah dipahami guru & siswa Indonesia

Buat soal sekarang:`
}

function tokensFor(count: number, essayHeavy: boolean): number {
  return Math.min(8192, Math.max(1024, Math.round(count * (essayHeavy ? 400 : 180))))
}

async function callModel(model: string, prompt: string, maxTokens: number): Promise<{ text: string; tokens: number }> {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
  const tokens = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)
  return { text, tokens }
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

    const baseParams: BaseParams = { mapel, kelas, topik, difficulty, kurikulum, fase }

    let hasil: string
    let totalTokens: number

    if (tipe === 'campuran' && mixedConfig) {
      const config = mixedConfig as MixedConfig
      const pgCount = config.pilihan_ganda ?? 0
      const restCount = totalSoal - pgCount
      const restHasEssayOrHots = (config.essay ?? 0) > 0 || (config.hots ?? 0) > 0

      // Dua panggilan API paralel: grup Pilihan Ganda ke Haiku (murah, cukup
      // untuk soal faktual/pilihan), grup lainnya (Esai/BS/Isian/HOTS) tetap
      // ke Sonnet. Salah satu grup di-skip kalau count-nya 0.
      const jobs: Promise<{ text: string; tokens: number }>[] = []
      if (pgCount > 0) {
        jobs.push(callModel(MODEL_HAIKU, buildMixedPrompt({ pilihan_ganda: pgCount }, baseParams), tokensFor(pgCount, false)))
      }
      if (restCount > 0) {
        const { pilihan_ganda: _pg, ...restConfig } = config
        jobs.push(callModel(MODEL_SONNET, buildMixedPrompt(restConfig, baseParams), tokensFor(restCount, restHasEssayOrHots)))
      }

      const results = await Promise.all(jobs)
      hasil = results.map((r) => r.text).join('\n\n')
      totalTokens = results.reduce((a, r) => a + r.tokens, 0)
    } else {
      const model = tipe === 'Pilihan Ganda' ? MODEL_HAIKU : MODEL_SONNET
      const isEssayHeavy = ['Esai / Uraian', 'HOTS (Pro)'].includes(tipe)
      const prompt = buildSinglePrompt(tipe, totalSoal, baseParams)
      const result = await callModel(model, prompt, tokensFor(totalSoal, isEssayHeavy))
      hasil = result.text
      totalTokens = result.tokens
    }

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
        const { error: insertError } = await admin.from('generated_soal').insert(
          blocks.map((teks) => ({
            user_id: generatedBy,
            mapel,
            kelas,
            kurikulum,
            tipe,
            teks,
          }))
        )
        // Supabase TIDAK melempar exception untuk error query -- selalu cek
        // `error` secara eksplisit, jangan andalkan try/catch saja (itu cuma
        // menangkap exception JS, bukan error yang dikembalikan Supabase).
        if (insertError) {
          console.error('[generate] gagal menyimpan ke bank soal:', insertError.message)
        }
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
