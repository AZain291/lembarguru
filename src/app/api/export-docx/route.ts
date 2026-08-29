import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, BorderStyle, WidthType,
  Math as DocxMath, MathFraction, MathRun, type ParagraphChild,
} from 'docx'
import { illustrationSvg, illustrationDimensions, type IllustrationSpec } from '@/lib/illustration'
import { svgToPng } from '@/utils/svgToPng'
import { splitFractionSegments } from '@/lib/fraction'

const HAS_ANSWER_TYPES = new Set(['pilihan_ganda', 'benar_salah'])

interface Question {
  text: string
  options: { k: string; t: string }[]
  answer: string
  pembahasan: string
  type: string
  illustration?: IllustrationSpec
}

// Teks soal/opsi/pembahasan bisa berisi marker pecahan "{{2/3}}" (lihat
// src/lib/fraction.ts) -- dipecah di sini jadi TextRun biasa diselingi
// objek Math/MathFraction ASLI Word (OMML), bukan gambar. Ini lebih baik
// daripada raster: hasilnya pecahan yang bisa diedit & auto-scale
// mengikuti font, persis seperti dibuat manual lewat equation editor Word.
function buildTextRuns(text: string, opts: { bold?: boolean; color?: string; italics?: boolean } = {}): ParagraphChild[] {
  return splitFractionSegments(text).map((seg) =>
    seg.type === 'fraction'
      ? new DocxMath({
          children: [
            new MathFraction({
              numerator: [new MathRun(seg.numerator)],
              denominator: [new MathRun(seg.denominator)],
            }),
          ],
        })
      : new TextRun({ text: seg.value, ...opts })
  )
}

// Word butuh fallback PNG untuk gambar SVG (lihat svgToPng.ts) -- dibungkus
// jadi satu Paragraph siap-pakai supaya loop generate soal di bawah tetap
// ringkas. Kegagalan convert (mis. spec aneh yang lolos validasi ringan di
// client) tidak boleh menggagalkan seluruh export -- soal itu cuma tampil
// tanpa ilustrasi.
async function illustrationParagraph(spec: IllustrationSpec): Promise<Paragraph | null> {
  try {
    const svg = illustrationSvg(spec)
    const { width, height } = illustrationDimensions(spec)
    const png = await svgToPng(svg, width)
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new ImageRun({
          type: 'svg',
          data: svg,
          fallback: { type: 'png', data: png },
          transformation: { width, height },
        }),
      ],
    })
  } catch (e) {
    console.error('[export-docx] gagal render ilustrasi:', e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', user.id).single()
    if (!['pro', 'guru'].includes(profile?.tier ?? '')) {
      return NextResponse.json({ error: 'Fitur Pro' }, { status: 403 })
    }

    const body = await request.json()
    const { questions, mapel, kelas, topik, kurikulum, fase, mixed, singleType } = body as {
      questions: Question[]
      mapel: string; kelas: string; topik?: string; kurikulum: string
      fase?: string; mixed: boolean; singleType?: string
    }

    // Validasi dasar -- endpoint ini nerima JSON apa adanya dari client,
    // kalau bentuknya rusak (mis. sesi lama di localStorage) baru ketahuan
    // di sini dengan pesan jelas, bukan meledak samar-samar di docx builder.
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Tidak ada soal untuk diekspor' }, { status: 400 })
    }
    if (!mapel || !kelas) {
      return NextResponse.json({ error: 'Data mapel/kelas tidak lengkap' }, { status: 400 })
    }

    const typeLabel = mixed ? 'Campuran' : (singleType ?? 'Pilihan Ganda')

    // ── Build DOCX ─────────────────────────────────────────────────────────
    const children: Paragraph[] = []

    // Header
    children.push(
      new Paragraph({ text: 'LEMBAR SOAL', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Mata Pelajaran: ${mapel}`, bold: true })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Kelas: ${kelas}  |  Jenis: ${typeLabel}  |  Kurikulum: ${kurikulum}${fase ? `  |  ${fase}` : ''}` })], alignment: AlignmentType.CENTER }),
    )
    if (topik) children.push(new Paragraph({ children: [new TextRun({ text: `Topik: ${topik}` })], alignment: AlignmentType.CENTER }))
    children.push(new Paragraph({ text: '' }))

    // Soal
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true }),
            ...buildTextRuns(q.text),
          ],
          spacing: { before: 200 },
        })
      )
      if (q.illustration) {
        const imgParagraph = await illustrationParagraph(q.illustration)
        if (imgParagraph) children.push(imgParagraph)
      }
      if (q.options.length > 0) {
        for (const opt of q.options) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `    ${opt.k}. `, bold: true }),
                ...buildTextRuns(opt.t),
              ],
            })
          )
        }
      }
    }

    // Kunci jawaban (hanya pilgang & benar/salah) — halaman terpisah
    const pgQuestions = questions.filter(q => HAS_ANSWER_TYPES.has(q.type) && q.answer)
    if (pgQuestions.length > 0) {
      children.push(
        new Paragraph({ text: '', pageBreakBefore: true }),
        new Paragraph({ text: 'KUNCI JAWABAN', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: '' }),
      )

      // Tabel kunci jawaban
      const rows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No.', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Jawaban', bold: true })] })] }),
          ],
        }),
        ...questions.map((q, i) =>
          HAS_ANSWER_TYPES.has(q.type) && q.answer
            ? new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: String(i + 1) })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: q.answer, bold: true })] })] }),
                ],
              })
            : null
        ).filter(Boolean) as TableRow[],
      ]

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Catatan: Kunci jawaban hanya untuk soal pilihan ganda dan benar/salah.', italics: true, size: 20 }),
          ],
        })
      )
    }

    // Pembahasan
    const hasPembahasan = questions.some(q => q.pembahasan)
    if (hasPembahasan) {
      children.push(
        new Paragraph({ text: '', pageBreakBefore: true }),
        new Paragraph({ text: 'PEMBAHASAN', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: '' }),
      )
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        if (!q.pembahasan) continue
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true }),
              HAS_ANSWER_TYPES.has(q.type) && q.answer
                ? new TextRun({ text: `(Jawaban: ${q.answer}) `, color: '2563eb', bold: true })
                : new TextRun({ text: '' }),
              ...buildTextRuns(q.pembahasan),
            ],
            spacing: { before: 150 },
          })
        )
      }
    }

    const doc = new Document({ sections: [{ children }] })
    const buffer = await Packer.toBuffer(doc)
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="soal-${mapel.toLowerCase().replace(/\s+/g, '-')}.docx"`,
      },
    })
  } catch (error) {
    console.error('Export DOCX error:', error)
    return NextResponse.json({ error: 'Gagal membuat file Word' }, { status: 500 })
  }
}
