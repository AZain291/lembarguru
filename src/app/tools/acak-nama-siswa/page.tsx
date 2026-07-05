import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { AcakNamaSiswa } from '@/components/tools/AcakNamaSiswa';

const tool = getToolBySlug('acak-nama-siswa')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <AcakNamaSiswa />
    </ToolPageShell>
  );
}
