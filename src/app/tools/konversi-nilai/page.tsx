import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { KonversiNilai } from '@/components/tools/KonversiNilai';

const tool = getToolBySlug('konversi-nilai')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <KonversiNilai />
    </ToolPageShell>
  );
}
