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

// Instruksi opsional untuk ilustrasi soal -- diagram SEDERHANA (segitiga,
// persegi/persegi panjang, lingkaran, garis bilangan, grafik batang) yang
// digambar ulang dari data numerik di baris "Ilustrasi:" ini oleh
// illustrationSvg() (src/lib/illustration.ts), BUKAN gambar AI/foto. Baris
// ini di-parse client (parseQuestions() di LembarGuruApp.tsx) & server
// (splitSoalBlocks() ikut menyimpannya apa adanya ke Bank Soal). Ditaruh di
// bagian PENTING (bukan di format soal per tipe) supaya berlaku sama untuk
// semua tipe soal & tetap satu baris per soal, gampang di-regex.
const ILLUSTRATION_RULES = `
- WAJIB tambahkan SATU baris tambahan setelah "Pembahasan:" berformat persis "Ilustrasi: {JSON satu baris}" pada soal yang cocok salah satu pola di bawah -- ini bukan saran opsional, JANGAN dilewatkan kalau polanya cocok (pilih field yang relevan saja, JSON harus valid & satu baris, TANPA markdown code fence):
  * Soal menyebutkan panjang SEMUA sisi sebuah segitiga (mis. "sisi-sisinya 13 cm, 14 cm, 15 cm" atau soal Pythagoras/luas segitiga/Heron): {"type":"triangle","sideAB":13,"sideBC":14,"sideCA":15,"labelA":"A","labelB":"B","labelC":"C","rightAngleAt":"B","unit":"cm"} -- rightAngleAt & unit opsional.
  * Soal menyebutkan panjang & lebar sebuah persegi/persegi panjang: {"type":"rectangle","width":8,"height":5,"unit":"cm"}
  * Soal menyebutkan jari-jari/diameter sebuah lingkaran: {"type":"circle","radius":7,"unit":"cm"} atau {"type":"circle","diameter":14,"unit":"cm"}
  * Soal minta menempatkan/membandingkan titik pada garis bilangan: {"type":"number_line","min":-10,"max":10,"points":[{"value":3,"label":"A"},{"value":-2,"label":"B"}]}
  * Soal punya data kategori-nilai yang dibaca dari grafik (mis. "grafik berikut menunjukkan..."): {"type":"bar_chart","data":[{"label":"Senin","value":12},{"label":"Selasa","value":18}],"yLabel":"Jumlah siswa"}
  * Soal minta pembagian dikerjakan dengan cara bersusun/porogapit, ATAU inti soal pilihan-ganda/isian adalah satu pembagian bilangan bulat langsung: {"type":"long_division","dividend":168,"divisor":24} -- cukup kirim dividend & divisor mentah, JANGAN hitung/tulis langkah pembagiannya sendiri karena digambar ulang otomatis dari dua angka itu.
- Kalau tidak ada polanya yang cocok (soal bacaan, hafalan, konsep abstrak, cerita tanpa data bentuk/angka), JANGAN tulis baris "Ilustrasi:" sama sekali.`

// Instruksi notasi wajib untuk semua tipe soal -- dipakai baik di prompt
// campuran maupun single-type. Soal/pembahasan dirender apa adanya sebagai
// teks polos di web (LembarGuruApp.tsx) maupun di export .docx
// (export-docx/route.ts pakai TextRun{text} biasa, tidak ada parsing markup),
// jadi satu-satunya cara pangkat/simbol tampil benar di kedua tempat itu
// adalah minta model langsung menulis karakter Unicode superscript/subscript
// yang sebenarnya, bukan notasi ASCII kasar seperti "^" atau "x2"/"H2O".
const NOTASI_RULES = `
- Notasi matematika, kimia, dan rumus sains WAJIB pakai karakter Unicode yang benar, bukan notasi ASCII kasar:
  * Pangkat/eksponen: pakai karakter superscript asli, misal x² (bukan x^2 atau x2), 10³ (bukan 10^3), a⁻¹ (bukan a^-1). Karakter yang tersedia: ⁰¹²³⁴⁵⁶⁷⁸⁹ ⁺⁻⁼⁽⁾ ⁿ ⁱ.
  * Rumus kimia (indeks jumlah atom): pakai karakter subscript asli, misal H₂O, CO₂, H₂SO₄ (bukan H2O, CO2, H2SO4). Karakter yang tersedia: ₀₁₂₃₄₅₆₇₈₉ ₊₋₌₍₎.
  * Simbol matematika lain: × untuk perkalian (bukan x atau *), ÷ untuk pembagian, √ untuk akar, π, ° (derajat), ≤ ≥ ≠ ≈ ∞ ∑ ∆, dan pecahan ditulis dengan "/" biasa (mis. 3/4) kecuali ada karakter Unicode pecahan yang pas (½ ¼ ¾).
  * Kalau pangkat/indeks tidak punya karakter Unicode yang persis (misal pangkat berupa variabel atau ekspresi panjang seperti (2n+1)), tulis sedekat mungkin ke notasi baku tanpa tanda "^" atau "_" mentah -- contoh: tulis "pangkat (2n+1)" atau gunakan huruf superscript yang tersedia (ⁿ, ˣ, dst) kalau ada.
- Hitung dan verifikasi jawaban (terutama soal hitungan/angka) di dalam kepala SEBELUM menulis apa pun untuk soal itu. JANGAN tampilkan proses berpikir ulang atau koreksi di dalam output (contoh yang DILARANG: "namun jika...", "mari koreksi", "sebenarnya jawaban yang benar adalah..."). Setiap bagian -- opsi jawaban, "Jawaban:", "Pembahasan:" -- HANYA ditulis SATU KALI per soal, langsung versi final yang sudah benar.
${ILLUSTRATION_RULES}`
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
- Bagian "Pembahasan" WAJIB ditulis dalam Bahasa Indonesia untuk SEMUA tipe soal dan SEMUA kurikulum, termasuk soal mapel Bahasa Inggris atau Kurikulum Cambridge yang teks soal/opsi jawabannya berbahasa Inggris -- cuma bagian Pembahasan yang tetap Bahasa Indonesia, supaya mudah dipahami guru & siswa Indonesia${NOTASI_RULES}
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
- Bagian "Pembahasan" WAJIB ditulis dalam Bahasa Indonesia, termasuk untuk soal mapel Bahasa Inggris atau Kurikulum Cambridge yang teks soal/opsi jawabannya berbahasa Inggris -- cuma bagian Pembahasan yang tetap Bahasa Indonesia, supaya mudah dipahami guru & siswa Indonesia${NOTASI_RULES}

Buat soal sekarang:`
}

// Anggaran token diukur lewat percobaan nyata (bukan tebakan) -- 5 soal PG
// Matematika tingkat olimpiade (banyak langkah hitung + pembahasan panjang)
// ternyata makan ~2400 token sekali generate, jauh di atas budget lama
// (180/soal, floor 1024) yang bikin API kepotong di tengah kalimat
// (stop_reason "max_tokens") pada soal & kunci jawaban terakhir -- itu
// penyebab laporan user "cuma jadi 4 soal, pembahasan cuma sampai soal 3".
// Angka di bawah punya headroom lebih besar; menaikkan cap TIDAK menambah
// biaya kalau modelnya tidak sampai memakainya (Anthropic cuma nge-bill
// token yang benar-benar di-generate, bukan cap-nya).
function tokensFor(count: number, essayHeavy: boolean): number {
  return Math.min(16000, Math.max(2048, Math.round(count * (essayHeavy ? 900 : 600))))
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

    // Hitung soal yang BENAR-BENAR jadi dari hasil generate -- kalau AI
    // kepotong di tengah (mis. kena batas token) atau gagal memenuhi jumlah
    // yang diminta, kuota harian user cuma boleh berkurang sebesar yang
    // benar-benar dia terima, bukan sebesar yang diminta di awal (totalSoal).
    // splitSoalBlocks() sama persis dengan parser client (parseQuestions()
    // di LembarGuruApp.tsx) soal apa yang dianggap "satu soal utuh".
    const blocks = splitSoalBlocks(hasil)
    const actualCount = blocks.length > 0 ? Math.min(blocks.length, totalSoal) : totalSoal

    // Simpan jumlah soal yang digenerate
    await logUsage(identity, {
      action: 'generate',
      tokensUsed: totalTokens,
      questionsCount: actualCount,
      status: 'success',
    })

    // Simpan tiap soal individual ke kolam Bank Soal bersama (dibaca lagi
    // lewat /api/bank-soal). Gagal simpan tidak boleh menggagalkan response
    // ke user -- generate soal sudah berhasil terlepas dari ini.
    try {
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
