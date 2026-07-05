import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { BagiKelompok } from '@/components/tools/BagiKelompok';

const tool = getToolBySlug('bagi-kelompok')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <BagiKelompok />
    </ToolPageShell>
  );
}
