import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { CatatanSiswa } from '@/components/tools/CatatanSiswa';

const tool = getToolBySlug('catatan-siswa')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <CatatanSiswa />
    </ToolPageShell>
  );
}
