import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { IceBreaker } from '@/components/tools/IceBreaker';

const tool = getToolBySlug('ice-breaker')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <IceBreaker />
    </ToolPageShell>
  );
}
