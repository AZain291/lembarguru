import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { KalkulatorNilai } from '@/components/tools/KalkulatorNilai';

const tool = getToolBySlug('kalkulator-nilai')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <KalkulatorNilai />
    </ToolPageShell>
  );
}
