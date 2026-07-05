import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { JadwalMengajar } from '@/components/tools/JadwalMengajar';

const tool = getToolBySlug('jadwal-mengajar')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <JadwalMengajar />
    </ToolPageShell>
  );
}
