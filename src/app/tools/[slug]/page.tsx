import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TEACHER_TOOLS, getToolBySlug } from '@/lib/teacherTools';
import { ToolThemeWrapper } from '@/components/tools/ToolThemeWrapper';

import { RppForm } from '@/components/tools/RppForm';
import { BankSoal } from '@/components/tools/BankSoal';
import { AnalisisSoalForm } from '@/components/tools/AnalisisSoalForm';
import { SilabusForm } from '@/components/tools/SilabusForm';
import { FlashcardForm } from '@/components/tools/FlashcardForm';
import { RubrikForm } from '@/components/tools/RubrikForm';
import { AcakNamaSiswa } from '@/components/tools/AcakNamaSiswa';
import { BagiKelompok } from '@/components/tools/BagiKelompok';
import { JadwalMengajar } from '@/components/tools/JadwalMengajar';
import { KonversiNilai } from '@/components/tools/KonversiNilai';
import { TimerKelas } from '@/components/tools/TimerKelas';
import { PapanPoin } from '@/components/tools/PapanPoin';
import { PresensiDigital } from '@/components/tools/PresensiDigital';
import { GeneratorSertifikat } from '@/components/tools/GeneratorSertifikat';
import { TextToSpeech } from '@/components/tools/TextToSpeech';
import { CatatanSiswa } from '@/components/tools/CatatanSiswa';
import { KalkulatorNilai } from '@/components/tools/KalkulatorNilai';
import { IceBreaker } from '@/components/tools/IceBreaker';

const TOOL_COMPONENTS: Record<string, () => React.ReactElement> = {
  'generator-rpp': RppForm,
  'bank-soal': BankSoal,
  'analisis-soal': AnalisisSoalForm,
  'silabus-ki-kd': SilabusForm,
  flashcard: FlashcardForm,
  'rubrik-penilaian': RubrikForm,
  'acak-nama-siswa': AcakNamaSiswa,
  'bagi-kelompok': BagiKelompok,
  'jadwal-mengajar': JadwalMengajar,
  'konversi-nilai': KonversiNilai,
  'timer-kelas': TimerKelas,
  'papan-poin': PapanPoin,
  'presensi-digital': PresensiDigital,
  'generator-sertifikat': GeneratorSertifikat,
  'text-to-speech': TextToSpeech,
  'catatan-siswa': CatatanSiswa,
  'kalkulator-nilai': KalkulatorNilai,
  'ice-breaker': IceBreaker,
}

export function generateStaticParams() {
  return TEACHER_TOOLS.map((tool) => ({ slug: tool.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tool = getToolBySlug(params.slug)
  if (!tool) return { title: 'Tool tidak ditemukan — LembarGuru' }
  return {
    title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
    description: tool.desc,
  }
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug)
  const Component = TOOL_COMPONENTS[params.slug]

  if (!tool || !Component) notFound()

  return (
    <ToolThemeWrapper className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-6">
        <Link href="/" className="mb-4 inline-block text-[13px] font-medium text-ink-soft hover:text-ink">
          ← Kembali ke LembarGuru
        </Link>

        <div className="mb-6 flex items-start gap-3">
          <span className="text-[32px] leading-none">{tool.icon}</span>
          <div>
            <h1 className="font-display text-[24px] font-semibold text-ink">{tool.label}</h1>
            <p className="text-[13.5px] text-ink-soft">{tool.desc}</p>
          </div>
        </div>

        <Component />
      </div>
    </ToolThemeWrapper>
  )
}
