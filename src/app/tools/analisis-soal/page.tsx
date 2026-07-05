import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { AnalisisSoalForm } from '@/components/tools/AnalisisSoalForm';

const tool = getToolBySlug('analisis-soal')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <AnalisisSoalForm />
    </ToolPageShell>
  );
}
