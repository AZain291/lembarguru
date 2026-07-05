import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { GeneratorSertifikat } from '@/components/tools/GeneratorSertifikat';

const tool = getToolBySlug('generator-sertifikat')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <GeneratorSertifikat />
    </ToolPageShell>
  );
}
