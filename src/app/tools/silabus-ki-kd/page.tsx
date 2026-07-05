import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { SilabusForm } from '@/components/tools/SilabusForm';

const tool = getToolBySlug('silabus-ki-kd')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <SilabusForm />
    </ToolPageShell>
  );
}
