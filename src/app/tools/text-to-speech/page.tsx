import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/teacherTools';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { TextToSpeech } from '@/components/tools/TextToSpeech';

const tool = getToolBySlug('text-to-speech')!;

export const metadata: Metadata = {
  title: `${tool.label} — Alat Bantu Guru | LembarGuru`,
  description: tool.desc,
};

export default function Page() {
  return (
    <ToolPageShell tool={tool}>
      <TextToSpeech />
    </ToolPageShell>
  );
}
